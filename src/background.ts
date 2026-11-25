import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener(() => {
  const sidePanel = (browser as unknown as { sidePanel?: { setPanelBehavior: (o: object) => Promise<void> } })
    .sidePanel;
  if (sidePanel?.setPanelBehavior) {
    void sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});
