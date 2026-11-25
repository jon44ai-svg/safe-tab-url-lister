import browser from "webextension-polyfill";
import type { ITabRepository } from "../../domain/ports";
import type { Library } from "../../domain/types";

const KEY = "library";

export const chromeStorageRepository: ITabRepository = {
  async load() {
    const stored = await browser.storage.local.get(KEY);
    const library = stored[KEY] as Library | undefined;
    if (!library) return { tabs: [], folders: [], tags: [], storeSecrets: false };
    return library;
  },
  async save(library) {
    await browser.storage.local.set({ [KEY]: library });
  },
};
