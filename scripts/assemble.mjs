import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const chrome = join(root, "dist/chrome");
mkdirSync(chrome, { recursive: true });
cpSync(join(root, "src/icons"), join(chrome, "icons"), { recursive: true });
cpSync(join(root, "src/_locales"), join(chrome, "_locales"), { recursive: true });
cpSync(join(root, "src/manifest/manifest.chrome.json"), join(chrome, "manifest.json"));

for (const browser of ["firefox", "safari"]) {
  const dest = join(root, "dist", browser);
  rmSync(dest, { recursive: true, force: true });
  cpSync(chrome, dest, { recursive: true });
  cpSync(join(root, "src/manifest", `manifest.${browser}.json`), join(dest, "manifest.json"));
}
