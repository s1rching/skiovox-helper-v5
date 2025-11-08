const SHORTCUTS_URL = "chrome://extensions/shortcuts";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("setUpYetWithNewStuff", (data) => {
    if (data.setUpYetWithNewStuff) return;

    chrome.windows.getLastFocused((window) => {
      chrome.tabs.create({ windowId: window.id, url: SHORTCUTS_URL });
    });

    chrome.storage.local.set({ setUpYetWithNewStuff: true });
  });
});
