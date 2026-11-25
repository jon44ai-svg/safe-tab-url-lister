import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Group,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import "@mantine/core/styles.css";
import {
  addFolder,
  applyTag,
  ensureTag,
  folderLabels,
  groupTabs,
  loadLibrary,
  removeTag,
  saveOpenTabs,
  searchTabs,
  setFolder,
  toListed,
} from "../application/library";
import type { GroupMode, Library, ListedTab, OpenTab } from "../domain/types";
import { chromeStorageRepository } from "../infrastructure/chrome/storageRepository";
import { chromeTabsGateway, reopen } from "../infrastructure/chrome/tabsGateway";
import { formatExport } from "../infrastructure/export/format";
import { layaClient } from "../infrastructure/laya/client";
import { dangerousScheme, redactForModel } from "../infrastructure/secrets/secretPolicy";
import { secretPolicy } from "./policy";

const EXPORTS = ["plain", "markdown", "markdown-list", "json", "csv", "tsv"] as const;

export function SidePanel() {
  const [library, setLibrary] = useState<Library | null>(null);
  const [open, setOpen] = useState<OpenTab[]>([]);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mode, setMode] = useState<GroupMode>("domain");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sensitiveOnly, setSensitiveOnly] = useState(false);
  const [layaUp, setLayaUp] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [suggest, setSuggest] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [folderName, setFolderName] = useState("");
  const [folderParent, setFolderParent] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  async function refresh(next = library) {
    const loaded = next ?? (await loadLibrary(chromeStorageRepository));
    const tabs = await chromeTabsGateway.list().catch(() => [] as OpenTab[]);
    setLibrary(loaded);
    setOpen(tabs);
    const up = await layaClient(loaded.tags).healthy().catch(() => false);
    setLayaUp(up);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function persist(next: Library) {
    setLibrary(next);
    await chromeStorageRepository.save(next);
  }

  const labels = useMemo(() => folderLabels(library?.folders ?? []), [library]);
  const listed = useMemo(() => {
    if (!library) return [];
    let rows = searchTabs(toListed(open, library, secretPolicy), debounced, labels);
    if (tagFilter) rows = rows.filter((tab) => tab.tags.includes(tagFilter) || tab.category === tagFilter);
    if (sensitiveOnly) rows = rows.filter((tab) => tab.sensitive);
    return rows;
  }, [library, open, debounced, labels, tagFilter, sensitiveOnly]);
  const groups = groupTabs(listed, mode, labels);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!focused || !library) return;
      const slot = Number(event.key);
      if (slot < 1 || slot > 9) return;
      const tag = library.tags.find((item) => item.slot === slot);
      const tab = listed.find((item) => item.key === focused && item.savedId);
      if (!tag || !tab?.savedId) return;
      event.preventDefault();
      void persist(applyTag(library, tab.savedId, tag.name));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!library) return <Text p="md">Loading…</Text>;

  const slots = library.tags.filter((tag) => tag.slot);

  return (
    <Stack p="sm" gap="sm">
      <Group justify="space-between">
        <Title order={4}>Tabs</Title>
        <Badge color={layaUp ? "green" : "gray"}>{layaUp ? "Laya up" : "Laya offline"}</Badge>
      </Group>
      <Text size="xs" c="dimmed">
        Exports can include secrets in URLs. Treat the list and clipboard as sensitive; paste only into trusted destinations.
      </Text>
      <Group>
        <Button
          size="xs"
          onClick={() => persist(saveOpenTabs(library, open, secretPolicy))}
        >
          Save open tabs
        </Button>
        <Button size="xs" variant="light" onClick={() => void classify()}>
          Classify with Laya
        </Button>
      </Group>
      <TextInput
        placeholder="Search title, domain, tags"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        aria-label="Search tabs"
      />
      <Group>
        <Select
          aria-label="Group by"
          data={[
            { value: "domain", label: "Domain" },
            { value: "category", label: "Laya category" },
            { value: "type", label: "Laya type" },
            { value: "folder", label: "Folder" },
          ]}
          value={mode}
          onChange={(value) => setMode((value as GroupMode) || "domain")}
        />
        <Select
          aria-label="Filter tag"
          clearable
          placeholder="Tag"
          data={library.tags.map((tag) => tag.name)}
          value={tagFilter}
          onChange={setTagFilter}
        />
        <Checkbox label="Sensitive" checked={sensitiveOnly} onChange={(event) => setSensitiveOnly(event.currentTarget.checked)} />
      </Group>
      <Checkbox
        label="Store full URLs (including secrets) on this device"
        checked={library.storeSecrets}
        onChange={(event) => persist({ ...library, storeSecrets: event.currentTarget.checked })}
      />
      <Group align="end">
        <TextInput
          label="New folder"
          value={folderName}
          onChange={(event) => setFolderName(event.currentTarget.value)}
        />
        <Select
          label="Inside"
          clearable
          placeholder="Top"
          data={[...labels.entries()].map(([value, label]) => ({ value, label }))}
          value={folderParent}
          onChange={setFolderParent}
        />
        <Button size="xs" onClick={() => { void persist(addFolder(library, folderName, folderParent)); setFolderName(""); }}>
          Add folder
        </Button>
      </Group>
      {focused && (
        <Paper withBorder p="xs">
          <Text size="xs">Fast tag (keys 1–9)</Text>
          <Group gap={4}>
            {slots.map((tag) => (
              <Badge key={tag.name} color={suggest === tag.slot ? "blue" : "gray"} variant={suggest === tag.slot ? "filled" : "light"}>
                {tag.slot} {tag.name}
              </Badge>
            ))}
          </Group>
        </Paper>
      )}
      {groups.map((group) => (
        <Stack key={group.label} gap={4}>
          <Text fw={600} size="sm">{group.label}</Text>
          {group.tabs.map((tab) => (
            <Row
              key={tab.key}
              tab={tab}
              library={library}
              revealed={revealed === tab.key}
              labels={labels}
              onFocus={() => { setFocused(tab.key); void hint(tab); }}
              onReveal={() => setRevealed(revealed === tab.key ? null : tab.key)}
              onOpen={() => openTab(tab)}
              onTags={(tags) => {
                if (!tab.savedId) return;
                let next = library;
                for (const name of tags) next = ensureTag(next, name);
                const current = next.tabs.find((item) => item.id === tab.savedId);
                if (!current) return;
                let updated = next;
                for (const name of current.tags) {
                  if (!tags.includes(name)) updated = removeTag(updated, tab.savedId, name);
                }
                for (const name of tags) updated = applyTag(updated, tab.savedId, name);
                void persist(updated);
              }}
              onFolder={(folderId) => tab.savedId && persist(setFolder(library, tab.savedId, folderId))}
            />
          ))}
        </Stack>
      ))}
      <Group>
        {EXPORTS.map((format) => (
          <Button key={format} size="compact-xs" variant="default" onClick={() => copy(format)}>
            {format}
          </Button>
        ))}
      </Group>
      {notice && <Text size="xs">{notice}</Text>}
    </Stack>
  );

  async function copy(format: (typeof EXPORTS)[number]) {
    if (!library) return;
    const text = formatExport(listed, format, library.storeSecrets);
    await navigator.clipboard.writeText(text);
    setNotice("Copied. Paste only into a trusted app.");
  }

  function openTab(tab: ListedTab) {
    const url = tab.urlFull || tab.urlDisplay;
    if (dangerousScheme(url) && !window.confirm("This URL uses a dangerous scheme (javascript, data, vbscript, or blob). Open it anyway?")) {
      return;
    }
    void reopen(url);
  }

  async function hint(tab: ListedTab) {
    if (!library || !layaUp) {
      setSuggest(null);
      return;
    }
    const view = redactForModel(tab.title, tab.urlFull || tab.urlDisplay);
    const result = await layaClient(library.tags).classify({ id: tab.key, view });
    setSuggest(result.suggestedSlot ?? null);
  }

  async function classify() {
    if (!library) return;
    if (!layaUp) {
      setNotice("Laya is offline. Grouping stays on domain.");
      setMode("domain");
      return;
    }
    const items = listed.map((tab) => ({
      id: tab.savedId || tab.key,
      view: redactForModel(tab.title, tab.urlFull || tab.urlDisplay),
    }));
    const controller = new AbortController();
    const results = await layaClient(library.tags).classifyBatch(items, controller.signal);
    const tabs = library.tabs.map((tab) => {
      const hit = results.get(tab.id);
      if (!hit) return tab;
      return {
        ...tab,
        category: hit.category || tab.category,
        pageType: hit.pageType || tab.pageType,
        sensitive: tab.sensitive || Boolean(hit.sensitiveHint),
      };
    });
    await persist({ ...library, tabs });
    setMode("category");
  }
}

function Row({
  tab,
  library,
  revealed,
  labels,
  onFocus,
  onReveal,
  onOpen,
  onTags,
  onFolder,
}: {
  tab: ListedTab;
  library: Library;
  revealed: boolean;
  labels: Map<string, string>;
  onFocus: () => void;
  onReveal: () => void;
  onOpen: () => void;
  onTags: (tags: string[]) => void;
  onFolder: (folderId: string | null) => void;
}) {
  const shown = revealed && tab.urlFull ? tab.urlFull : tab.urlDisplay;
  return (
    <Paper withBorder p="xs" onClick={onFocus}>
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={0}>
          <Text size="sm">{tab.title || tab.host || "Untitled"}</Text>
          <Text size="xs" c="dimmed">{shown}</Text>
        </Stack>
        <Group gap={4}>
          {tab.sensitive && <Badge color="red" size="xs">sensitive</Badge>}
          <Badge size="xs" variant="outline">{tab.source}</Badge>
        </Group>
      </Group>
      <Group mt={6}>
        <Button size="compact-xs" variant="subtle" onClick={onReveal}>
          {revealed ? "Mask" : "Reveal"}
        </Button>
        <Button size="compact-xs" variant="subtle" onClick={onOpen}>Open</Button>
        {tab.savedId && (
          <>
            <MultiSelect
              aria-label="Tags"
              size="xs"
              data={library.tags.map((tag) => tag.name)}
              value={tab.tags}
              searchable
              onChange={onTags}
            />
            <Select
              aria-label="Folder"
              size="xs"
              clearable
              placeholder="Folder"
              data={[...labels.entries()].map(([value, label]) => ({ value, label }))}
              value={tab.folderId}
              onChange={onFolder}
            />
          </>
        )}
      </Group>
    </Paper>
  );
}
