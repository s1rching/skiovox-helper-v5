const VIEW_SOURCE_PREFIX = "view-source:";
const HISTORY_URL = "chrome://history";
const DOWNLOADS_URL = "chrome://downloads";

function getRecentWindow() {
  return new Promise(resolve => {
    chrome.windows.getLastFocused({ populate: true }, resolve);
  });
}

function cycleTabs(tabs, direction) {
  const currentTab = tabs.find(e => e.active);
  if (!currentTab) return;

  let index = (currentTab.index + direction + tabs.length) % tabs.length;
  chrome.tabs.update(tabs[index].id, { active: true });
}

async function onCommand(name) {
  const recentWindow = await getRecentWindow();
  const recentTabs = recentWindow?.tabs || [];

  // get current active tab explicitly (MV3 no longer passes it in)
  const [currentTab] = await chrome.tabs.query({ active: true, windowId: recentWindow.id });

  // exit fullscreen if needed
  if (recentWindow && recentWindow.state === "fullscreen") {
    chrome.windows.update(recentWindow.id, { state: "maximized" });
  }

  function openTab(url) {
    chrome.tabs.create({ windowId: recentWindow?.id, url });
  }

  switch (name) {
    case "NEW_TAB":
      openTab(chrome://new-tab-page/);
      break;

    case "ACCESS_HISTORY":
      openTab(HISTORY_URL);
      break;

    case "ACCESS_DOWNLOADS":
      openTab(DOWNLOADS_URL);
      break;

    case "VIEW_SOURCE":
      if (currentTab && !currentTab.url.startsWith(VIEW_SOURCE_PREFIX)) {
        openTab(VIEW_SOURCE_PREFIX + currentTab.url);
      }
      break;

    case "CLOSE_TAB":
      if (currentTab) chrome.tabs.remove(currentTab.id);
      break;

    case "RESTORE_TAB":
      chrome.sessions.restore();
      break;

    case "NEW_WINDOW":
      chrome.windows.create({ state: "maximized" });
      break;

    case "NEW_INCOG_WINDOW":
      chrome.windows.create({ state: "maximized", incognito: true });
      break;

    case "CLOSE_WINDOW":
      if (recentWindow.focused) chrome.windows.remove(recentWindow.id);
      break;

    case "TAB_NEXT":
      cycleTabs(recentTabs, 1);
      break;

    case "TAB_BACK":
      cycleTabs(recentTabs, -1);
      break;

    case "SWITCH_WINDOWS":
      chrome.windows.getAll(windows => {
        if (windows.length > 1) chrome.windows.update(recentWindow.id, { focused: false });
      });
      break;

    default:
      // CTRL_1 ... CTRL_9 logic
      if (name.startsWith("CTRL_")) {
        let num = Number(name.split("_")[1]);
        let tab = num === 9 ? recentTabs[recentTabs.length - 1] : recentTabs[num - 1];
        if (tab) chrome.tabs.update(tab.id, { active: true });
      }
      break;
  }
}

chrome.commands.onCommand.addListener(onCommand);
