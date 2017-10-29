/* globals chrome */

const chromep = new ChromePromise();

let tabMap = {};
let timeout;

const setIconInactive = (tabId) => {
  chrome.browserAction.setIcon({path: "newicon16.png", tabId});
};

const setIconActive = (tabId) => {
  chrome.browserAction.setIcon({path: "icon16.png", tabId});
};

const getTabInfo = async () => {
  let tabs = await chromep.tabs.query({active: true, currentWindow: true});
  return tabs[0];
}

const startTimer = (tabId, url) => {
  timeout = setTimeout((() => {
    tabMap[tabId].url = url;
    chrome.tabs.sendMessage(tabId, {msg: "runDude2"});
  }), 1000);
  chrome.tabs.sendMessage(tabId, {msg: "timer started in background"});
}

chrome.browserAction.onClicked.addListener(() => {
  getTabInfo().then(tab => {
    let {url, id} = tab;
    if (tabMap[id].active) {
      chrome.tabs.sendMessage(tabId, {msg: "runDude"});
      tabMap[id].active = !tabMap[id].active;
      chrome.tabs.reload(id);
    } else {
      tabMap[id].active = !tabMap[id].active;
      setIconActive(id);
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg == "getStatus") {
    clearTimeout(timeout);
    let {id, url} = sender.tab;
    if (tabMap[id] !== undefined) {
      tabMap[id].active ? setIconActive(id) : setIconInactive(id);
      tabMap[id].url = url;
    } else {
      tabMap[id] = {active: true, url};
    }
    sendResponse({status: tabMap[id].active});
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  delete tabMap[tabId];
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== undefined
    && changeInfo.status === "complete") {
      if (tabMap[tabId] === undefined) {
        tabMap[tabId] = {active: true, url: tab.url};
      }
      if (tabMap[tabId].active) {
        setIconActive(tabId);
        startTimer(tabId, tab.url);
      } else {
        setIconInactive(tabId);
      }
    return true;
  }
});
