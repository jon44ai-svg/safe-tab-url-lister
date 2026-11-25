# Safe Tab URL Lister

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-v1.2.1-blue?logo=google-chrome)](https://chrome.google.com/webstore/detail/lfoiekncpjoomigglgjildmjodpfmoif)
[![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20TR-orange.svg)](src/_locales/)

Local-first Manifest V3 side panel for saving open tabs and finding them again. Optional classification uses a Laya server on your machine. No accounts and no remote analytics.

## What it does

- Lists open tabs and tabs saved in `chrome.storage.local` (title, domain, tags, sensitive badge).
- Saves the current window set for later and reopens one tab at a time.
- Groups by domain, Laya category, Laya page type, or nested folder.
- Debounced search over title, domain, path, tags, category, and folder name. Secret query values are not part of the search text.
- Manual tags, nested folders, and Laya fast tagging: focus a saved row and press 1–9.
- Export plain, Markdown, Markdown list, JSON, CSV, or TSV, with paste and scheme safeguards.

## Privacy delta

The original extension only used `tabs` and kept nothing. This build also uses:

| Permission | Why |
| --- | --- |
| `storage` | Saved tabs, folders, and tags stay on this device |
| `sidePanel` | Chrome side panel |
| `http://127.0.0.1:8000/*`, `http://localhost:8000/*` | Local `laya-serve` only |

Full URLs are masked by default. Storing the original URL (query and fragment included) is opt-in. Laya receives title, host, and path only.

Run Laya 0.4.x with `LAYA_HOST=127.0.0.1` and `LAYA_PORT=8000`. The extension calls `GET /health`, `POST /v1/systemone`, and `POST /v1/systemone/batch`. If Laya is down, save, search, domain grouping, and manual tags still work.

**Treat exports as sensitive.** URLs can still contain secrets, and Copy puts that text on the clipboard. Paste only into trusted apps. CSV/TSV formula neutralization and Markdown escaping are best-effort.

## Develop

```sh
pnpm install
pnpm test
pnpm build
```

Load `dist/chrome` as an unpacked extension. Firefox and Safari manifests are thin wrappers in `dist/firefox` and `dist/safari` (sidebar or popup pointing at the same panel). They are not store-ready packages.

## Not in this MVP

- Cross-device sync and accounts
- Reading page DOM for classification (that would need broad host permissions)
- Encrypted backups or a passphrase vault
- Dead-link crawler or archive.org
- Auto-close after save, or Session Buddy-style session restore
- Shared team libraries
- Polished Firefox or Safari store packages
- On-device Laya weights inside the extension (classification stays an external `laya-serve`)
- Mobile browsers
