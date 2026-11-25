const SECRET_KEY =
  /token|session|password|passwd|pwd|secret|api[_-]?key|apikey|auth|credential|jwt|bearer|sig|signature/i;

const DANGEROUS = /^(javascript|data|vbscript|blob):/i;

export type UrlParts = {
  host: string;
  path: string;
  urlDisplay: string;
  sensitive: boolean;
};

export function describeUrl(raw: string): UrlParts {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { host: "", path: "", urlDisplay: raw, sensitive: DANGEROUS.test(raw.trim()) };
  }
  let sensitive = SECRET_KEY.test(url.hash);
  const display = new URL(`${url.origin}${url.pathname}`);
  url.searchParams.forEach((value, key) => {
    if (SECRET_KEY.test(key)) {
      sensitive = true;
      display.searchParams.set(key, "REDACTED");
    } else {
      display.searchParams.set(key, value);
    }
  });
  if (url.hash) display.hash = sensitive && SECRET_KEY.test(url.hash) ? "#REDACTED" : url.hash;
  if (DANGEROUS.test(url.protocol)) sensitive = true;
  return {
    host: url.hostname,
    path: url.pathname,
    urlDisplay: display.toString(),
    sensitive,
  };
}

/** Title + host + path only. Query and fragment never leave the browser for Laya. */
export function redactForModel(title: string, raw: string): { title: string; host: string; path: string } {
  const parts = describeUrl(raw);
  return { title, host: parts.host, path: parts.path };
}

export function dangerousScheme(raw: string): boolean {
  if (!raw) return false;
  try {
    const scheme = new URL(raw).protocol.toLowerCase();
    return scheme === "javascript:" || scheme === "data:" || scheme === "vbscript:" || scheme === "blob:";
  } catch {
    return /^\s*(javascript|data|vbscript|blob)\s*:/i.test(raw);
  }
}
