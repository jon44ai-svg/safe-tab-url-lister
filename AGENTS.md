# Agent notes

## Architecture

Dependency direction: UI (`src/ui`) → application (`src/application`) → domain (`src/domain`) ← infrastructure (`src/infrastructure`).

| Layer | Path | Role |
| --- | --- | --- |
| Domain | `src/domain` | `SavedTab`, folders, tags, ports |
| Application | `src/application/library.ts` | Save, search, group, tag, folder |
| Infrastructure | `src/infrastructure` | Chrome tabs/storage, Laya HTTP, secret redaction, export |
| UI | `src/ui/SidePanel.tsx` | Mantine side panel |

Chrome MV3 side panel. Permissions: `tabs`, `storage`, `sidePanel`. Host access only `http://127.0.0.1:8000/*` and `http://localhost:8000/*`.

## Laya 0.4.34

Run `laya-serve` with `LAYA_PORT=8000` and `LAYA_HOST=127.0.0.1`. The client calls `GET /health`, `POST /v1/systemone`, and `POST /v1/systemone/batch`. State is `{ title, host, path }` after `redactForModel`. Never send the full URL, query, or fragment. If health fails, grouping stays on domain and fast-tag still works from the local 1–9 slots.

## Secrets

`SecretPolicy` redacts query/hash keys that look like tokens, sessions, passwords, or API keys for default display, export, and Laya. `urlFull` is stored only when the user opts in. Reveal is an explicit click. Markdown export writes `javascript:`, `data:`, `vbscript:`, and `blob:` as inline code. Reopen asks before those schemes. CSV/TSV neutralize formula prefixes.

## Navigation

Prefer CodeGraph (`codegraph explore` or the CodeGraph MCP server). Do not use Graphify. Ponytail: `.cursor/skills/ponytail/SKILL.md`.

## User rule paste

See `.cursor/USER_RULE_PASTE.md`.
