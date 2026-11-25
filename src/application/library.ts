import type { ISecretPolicy, ITabRepository } from "../domain/ports";
import type {
  GroupMode,
  Library,
  ListedTab,
  OpenTab,
  SavedTab,
  Tag,
} from "../domain/types";

const EMPTY: Library = { tabs: [], folders: [], tags: defaultTags(), storeSecrets: false };

export function defaultTags(): Tag[] {
  return ["work", "read", "shop", "social", "dev", "media", "finance", "travel", "other"].map(
    (name, i) => ({ name, slot: i + 1 }),
  );
}

export async function loadLibrary(repo: ITabRepository): Promise<Library> {
  const loaded = await repo.load();
  return {
    ...EMPTY,
    ...loaded,
    tabs: loaded.tabs ?? [],
    folders: loaded.folders ?? [],
    tags: loaded.tags?.length ? loaded.tags : defaultTags(),
  };
}

export function toListed(open: OpenTab[], library: Library, secrets: ISecretPolicy): ListedTab[] {
  const saved: ListedTab[] = library.tabs.map((tab) => ({
    key: `saved:${tab.id}`,
    source: "saved",
    title: tab.title,
    urlDisplay: tab.urlDisplay,
    urlFull: tab.urlFull,
    host: tab.host,
    path: tab.path,
    favicon: tab.favicon,
    tags: tab.tags,
    folderId: tab.folderId,
    category: tab.category,
    pageType: tab.pageType,
    sensitive: tab.sensitive,
    savedAt: tab.savedAt,
    savedId: tab.id,
  }));
  const live: ListedTab[] = open.map((tab) => {
    const described = secrets.describe(tab.url);
    return {
      key: `open:${tab.chromeTabId}`,
      source: "open",
      title: tab.title,
      urlDisplay: described.urlDisplay,
      urlFull: library.storeSecrets ? tab.url : undefined,
      host: described.host,
      path: described.path,
      favicon: tab.favicon,
      tags: [],
      folderId: null,
      sensitive: described.sensitive,
      chromeTabId: tab.chromeTabId,
    };
  });
  return [...live, ...saved];
}

export function saveOpenTabs(
  library: Library,
  open: OpenTab[],
  secrets: ISecretPolicy,
  ids?: number[],
): Library {
  const wanted = ids ? open.filter((tab) => ids.includes(tab.chromeTabId)) : open;
  const tabs = [...library.tabs];
  for (const tab of wanted) {
    if (!tab.url) continue;
    const described = secrets.describe(tab.url);
    const saved: SavedTab = {
      id: crypto.randomUUID(),
      title: tab.title || described.host,
      urlDisplay: described.urlDisplay,
      urlFull: library.storeSecrets ? tab.url : undefined,
      host: described.host,
      path: described.path,
      favicon: tab.favicon,
      tags: [],
      folderId: null,
      sensitive: described.sensitive,
      savedAt: Date.now(),
    };
    tabs.push(saved);
  }
  return { ...library, tabs };
}

export function searchTabs(tabs: ListedTab[], query: string, folderNames: Map<string, string>): ListedTab[] {
  const q = query.trim().toLowerCase();
  if (!q) return tabs;
  return tabs.filter((tab) => {
    const folder = tab.folderId ? folderNames.get(tab.folderId) ?? "" : "";
    const hay = [tab.title, tab.host, tab.path, tab.category, tab.pageType, folder, ...tab.tags]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function groupTabs(
  tabs: ListedTab[],
  mode: GroupMode,
  folderNames: Map<string, string>,
): { label: string; tabs: ListedTab[] }[] {
  const groups = new Map<string, ListedTab[]>();
  for (const tab of tabs) {
    const label =
      mode === "domain"
        ? tab.host || "No domain"
        : mode === "category"
          ? tab.category || "Ungrouped"
          : mode === "type"
            ? tab.pageType || "Ungrouped"
            : tab.folderId
              ? folderPath(tab.folderId, folderNames)
              : "No folder";
    const list = groups.get(label) ?? [];
    list.push(tab);
    groups.set(label, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, grouped]) => ({ label, tabs: grouped }));
}

function folderPath(id: string, names: Map<string, string>): string {
  return names.get(id) || "Folder";
}

export function folderLabels(folders: Library["folders"]): Map<string, string> {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const labels = new Map<string, string>();
  for (const folder of folders) {
    const parts: string[] = [];
    let current: typeof folder | undefined = folder;
    const seen = new Set<string>();
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      parts.unshift(current.name);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    labels.set(folder.id, parts.join(" / "));
  }
  return labels;
}

export function applyTag(library: Library, savedId: string, tag: string): Library {
  return {
    ...library,
    tabs: library.tabs.map((tab) =>
      tab.id === savedId && !tab.tags.includes(tag) ? { ...tab, tags: [...tab.tags, tag] } : tab,
    ),
  };
}

export function removeTag(library: Library, savedId: string, tag: string): Library {
  return {
    ...library,
    tabs: library.tabs.map((tab) =>
      tab.id === savedId ? { ...tab, tags: tab.tags.filter((name) => name !== tag) } : tab,
    ),
  };
}

export function setFolder(library: Library, savedId: string, folderId: string | null): Library {
  return {
    ...library,
    tabs: library.tabs.map((tab) => (tab.id === savedId ? { ...tab, folderId } : tab)),
  };
}

export function addFolder(library: Library, name: string, parentId: string | null): Library {
  const trimmed = name.trim();
  if (!trimmed) return library;
  return {
    ...library,
    folders: [...library.folders, { id: crypto.randomUUID(), name: trimmed, parentId }],
  };
}

export function ensureTag(library: Library, name: string): Library {
  const trimmed = name.trim();
  if (!trimmed || library.tags.some((tag) => tag.name === trimmed)) return library;
  return { ...library, tags: [...library.tags, { name: trimmed }] };
}
