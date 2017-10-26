/* globals chrome */

const chromep = new ChromePromise();

let tabMap = {};

const setIconInactive = (tabId) => {
  chrome.browserAction.setIcon({path: "newicon16.png", tabId});
};

const setIconActive = (tabId) => {
  chrome.browserAction.setIcon({path: "icon16.png", tabId});
};

const getTabId = async () => {
  let tabs = await chromep.tabs.query({active: true, currentWindow: true});
  return tabs[0].id;
}

chrome.browserAction.onClicked.addListener(() => {
  getTabId().then(tabId => {
    if (tabMap[tabId]) {
      tabMap[tabId] = !tabMap[tabId];
      chrome.tabs.reload(tabId);
    } else {
      tabMap[tabId] = !tabMap[tabId];
      setIconActive(tabId);
      chrome.tabs.sendMessage(tabId, {msg: "runDude"});
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg == "getStatus") {
      getTabId().then(tabId => {
        if (tabMap.hasOwnProperty(tabId)) {
          tabMap[tabId] ? setIconActive(tabId) : setIconInactive(tabId);
        } else {
          tabMap[tabId] = true;
        }
        sendResponse({status: tabMap[tabId], tabId});
      });
      return true;
    }
});
