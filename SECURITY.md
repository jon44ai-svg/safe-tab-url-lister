# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.2.x   | Yes       |
| < 1.2   | No        |

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report them privately via [GitHub's private vulnerability reporting](https://github.com/muminkoykiran/safe-tab-url-lister/security/advisories/new).

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

You'll receive a response within 48 hours. If confirmed, a fix will be released as soon as possible and you'll be credited in the CHANGELOG.

## Security Design

This extension is designed to minimize attack surface:

- **No remote analytics** — the only network calls are optional `GET /health` and `POST /v1/systemone` to `127.0.0.1:8000` or `localhost:8000`
- **Host access is loopback only** — the extension cannot read page DOM on the public web
- **`storage` is on-device** — saved tabs stay in `chrome.storage.local`. Full URLs are stored only if the user opts in; the default field is redacted
- **A small service worker** opens the Chrome side panel. It does not upload tab data
- **No external scripts** — the UI is bundled; nothing is loaded from a CDN at runtime
- **`tabs`** — reads open tab URL, title, and favicon so they can be listed, saved, and exported

## Export and paste risks

The product is a local data-export tool. Treat exported output as **sensitive**:

- Tab URLs often contain OAuth tokens, session ids, or other secrets in query strings.
- With browser “Allow in Incognito / Private” enabled and “Include all windows” checked, private-session URLs and an `incognito` flag can appear in the output.
- Data is shown in the popup textarea as soon as the list is built, and also written to the clipboard when you click **Copy**. Anything with clipboard access on the device can read it afterward.
- Paste only into destinations you trust. Markdown and spreadsheet consumers may interpret titles or cell values in ways that create unexpected links or formulas; this extension escapes common cases best-effort but cannot control the destination app.
