import browser from "webextension-polyfill";
import type { IOpenTabs } from "../../domain/ports";
import type { OpenTab } from "../../domain/types";

export const chromeTabsGateway: IOpenTabs = {
  async list() {
    const tabs = await browser.tabs.query({});
    return tabs
      .filter((tab) => typeof tab.id === "number")
      .map(
        (tab): OpenTab => ({
          chromeTabId: tab.id as number,
          title: tab.title ?? "",
          url: tab.url || "",
          favicon: tab.favIconUrl,
          windowId: tab.windowId ?? 0,
          incognito: Boolean(tab.incognito),
        }),
      );
  },
};

export async function reopen(url: string): Promise<void> {
  await browser.tabs.create({ url });
}
