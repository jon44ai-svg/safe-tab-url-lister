import type { IClassifier } from "../../domain/ports";
import type { Classification, ModelView, Tag } from "../../domain/types";

const HOSTS = ["http://127.0.0.1:8000", "http://localhost:8000"];

export const QUESTIONS = [
  {
    id: "category",
    kind: "choice",
    prompt: "Category for this page",
    options: ["work", "read", "shop", "social", "dev", "media", "finance", "travel", "other"],
  },
  {
    id: "page_type",
    kind: "choice",
    prompt: "Page type",
    options: ["article", "app", "search", "docs", "video", "repo", "mail", "other"],
  },
  {
    id: "is_sensitive",
    kind: "noul",
    prompt: "Title or path suggests private or secret material",
  },
];

async function post(path: string, body: unknown, signal?: AbortSignal): Promise<unknown | null> {
  for (const host of HOSTS) {
    try {
      const response = await fetch(`${host}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      if (response.ok) return response.json();
    } catch {
      /* try the next loopback host */
    }
  }
  return null;
}

export function layaClient(tags: Tag[]): IClassifier {
  return {
    async healthy() {
      for (const host of HOSTS) {
        try {
          const response = await fetch(`${host}/health`);
          if (response.ok) return true;
        } catch {
          /* offline */
        }
      }
      return false;
    },
    async classify(item, signal) {
      const body = await post("/v1/systemone", { questions: QUESTIONS, state: item.view }, signal);
      return parseClassification(body, tags);
    },
    async classifyBatch(items, signal) {
      const map = new Map<string, Classification>();
      const body = await post(
        "/v1/systemone/batch",
        {
          items: items.map((item) => ({ id: item.id, questions: QUESTIONS, state: item.view })),
        },
        signal,
      );
      if (body) {
        for (const row of extractBatch(body)) {
          map.set(row.id, parseClassification(row.payload, tags));
        }
        if (map.size) return map;
      }
      // shortcut: batch shape unknown or server down; fall back to sequential /v1/systemone, upgrade when Laya documents a stable batch envelope.
      const queue = [...items];
      const workers = Array.from({ length: 4 }, async () => {
        for (;;) {
          if (signal?.aborted) return;
          const next = queue.shift();
          if (!next) return;
          map.set(next.id, await this.classify(next, signal));
        }
      });
      await Promise.all(workers);
      return map;
    },
  };
}

function extractBatch(body: unknown): { id: string; payload: unknown }[] {
  if (!body || typeof body !== "object") return [];
  const record = body as Record<string, unknown>;
  const rows = record.results ?? record.items ?? record.answers;
  if (!Array.isArray(rows)) return [];
  const out: { id: string; payload: unknown }[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const id = String(item.id ?? "");
    if (id) out.push({ id, payload: item });
  }
  return out;
}

export function parseClassification(body: unknown, tags: Tag[]): Classification {
  const found = new Map<string, string>();
  walk(body, found);
  const category = found.get("category");
  const pageType = found.get("page_type") || found.get("pagetype") || found.get("type");
  const sensitiveRaw = found.get("is_sensitive") || found.get("sensitive");
  const slot = category
    ? tags.find((tag) => tag.slot && tag.name.toLowerCase() === category.toLowerCase())?.slot
    : undefined;
  return {
    category,
    pageType,
    sensitiveHint: sensitiveRaw ? /^(1|true|yes)$/i.test(sensitiveRaw) : undefined,
    suggestedSlot: slot,
  };
}

function walk(value: unknown, found: Map<string, string>): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, found));
    return;
  }
  const record = value as Record<string, unknown>;
  const id = String(record.id ?? record.question ?? record.key ?? "").toLowerCase();
  const choice = record.choice ?? record.answer ?? record.value ?? record.label;
  if (id && (typeof choice === "string" || typeof choice === "number" || typeof choice === "boolean")) {
    found.set(id, String(choice));
  }
  for (const nested of Object.values(record)) walk(nested, found);
}

export type { ModelView };
