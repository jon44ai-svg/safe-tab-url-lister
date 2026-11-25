export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
};

export type Tag = {
  name: string;
  /** Keyboard slot 1–9. Unset tags are manual-only. */
  slot?: number;
};

export type SavedTab = {
  id: string;
  title: string;
  urlDisplay: string;
  /** Present only when the user opts in to storing secret-bearing URLs. */
  urlFull?: string;
  host: string;
  path: string;
  favicon?: string;
  tags: string[];
  folderId: string | null;
  category?: string;
  pageType?: string;
  sensitive: boolean;
  savedAt: number;
};

export type OpenTab = {
  chromeTabId: number;
  title: string;
  url: string;
  favicon?: string;
  windowId: number;
  incognito: boolean;
};

export type ListedTab = {
  key: string;
  source: "open" | "saved";
  title: string;
  urlDisplay: string;
  urlFull?: string;
  host: string;
  path: string;
  favicon?: string;
  tags: string[];
  folderId: string | null;
  category?: string;
  pageType?: string;
  sensitive: boolean;
  savedAt?: number;
  chromeTabId?: number;
  savedId?: string;
};

export type Library = {
  tabs: SavedTab[];
  folders: Folder[];
  tags: Tag[];
  storeSecrets: boolean;
};

export type ModelView = {
  title: string;
  host: string;
  path: string;
};

export type Classification = {
  category?: string;
  pageType?: string;
  sensitiveHint?: boolean;
  /** 1–9 when Laya's category matches a slotted tag name. */
  suggestedSlot?: number;
};

export type ExportFormat =
  | "plain"
  | "markdown"
  | "markdown-list"
  | "json"
  | "csv"
  | "tsv";

export type GroupMode = "domain" | "category" | "type" | "folder";
