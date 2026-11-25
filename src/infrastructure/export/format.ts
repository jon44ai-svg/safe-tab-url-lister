import type { ExportFormat, ListedTab } from "../../domain/types";
import { dangerousScheme } from "../secrets/secretPolicy";

export function formatExport(tabs: ListedTab[], format: ExportFormat, includeSecrets: boolean): string {
  const rows = tabs.map((tab) => ({
    title: tab.title,
    url: exportUrl(tab, includeSecrets),
    host: tab.host,
    tags: tab.tags.join(" "),
    category: tab.category ?? "",
    sensitive: tab.sensitive ? "yes" : "no",
  }));
  if (format === "plain") return rows.map((row) => row.url).join("\n");
  if (format === "markdown") return rows.map((row) => markdownLink(row.title, row.url)).join("\n");
  if (format === "markdown-list") return rows.map((row) => `- ${markdownLink(row.title, row.url)}`).join("\n");
  if (format === "json") return JSON.stringify(rows, null, 2);
  const delimiter = format === "csv" ? "," : "\t";
  const header = ["title", "url", "host", "tags", "category", "sensitive"].map((value) =>
    escapeDelimited(value, delimiter),
  );
  const body = rows.map((row) =>
    [row.title, row.url, row.host, row.tags, row.category, row.sensitive]
      .map((value) => escapeDelimited(value, delimiter))
      .join(delimiter),
  );
  return [header.join(delimiter), ...body].join("\n");
}

function exportUrl(tab: ListedTab, includeSecrets: boolean): string {
  if (includeSecrets && tab.urlFull) return tab.urlFull;
  return tab.urlDisplay;
}

function markdownLink(label: string, url: string): string {
  if (dangerousScheme(url)) {
    const safeLabel = escapeMarkdownText(label || url);
    const safeUrl = escapeMarkdownText(url).replace(/`/g, "'");
    return `${safeLabel} (\`${safeUrl}\`)`;
  }
  return `[${escapeMarkdownText(label)}](${escapeMarkdownUrl(url)})`;
}

function escapeMarkdownText(value: string): string {
  return String(value ?? "")
    .replace(/([\\()[\]`<>"])/g, "\\$1")
    .replace(/\r?\n/g, " ");
}

function escapeMarkdownUrl(value: string): string {
  return String(value ?? "")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\s/g, "%20");
}

/** Formula prefixes and line breaks stay inside one cell. */
function escapeDelimited(value: string, delimiter: string): string {
  const text = String(value ?? "")
    .replace(/^([=+\-@|\t\r])/, "'$1")
    .replace(/([\\\t\r\n])/g, "\\$1");
  if (delimiter === ",") return `"${text.replace(/"/g, '""')}"`;
  return text;
}
