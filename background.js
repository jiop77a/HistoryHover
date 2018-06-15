/* globals chrome, ChromePromise */

const chromep = new ChromePromise();

let tabMap = {};

const setIconInactive = (tabId) => {
  chrome.browserAction.setIcon({path: "newicon16.png", tabId});
};

const setIconActive = (tabId) => {
  chrome.browserAction.setIcon({path: "icon16.png", tabId});
};

const getTabInfo = async () => {
  let tabs = await chromep.tabs.query({active: true, currentWindow: true});
  return tabs[0];
};

const startTimer = (tabId, url) => {
  setTimeout(() => {
    tabMap[tabId].url = url;
    chrome.tabs.sendMessage(tabId, {msg: "2.8 secs later, running again"});
  }, 2800);
};

chrome.browserAction.onClicked.addListener(() => {
  getTabInfo().then(tab => {
    let {url, id} = tab;
    if (tabMap[id].active) {
      tabMap[id].active = !tabMap[id].active;
      chrome.tabs.reload(id);
    } else {
      chrome.tabs.sendMessage(id, {msg: "runDude"});
      tabMap[id].active = !tabMap[id].active;
      setIconActive(id);
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "getStatus") {
    let {id, url} = sender.tab;
    if (tabMap[id] !== undefined) {
      tabMap[id].active ? setIconActive(id) : setIconInactive(id);
      tabMap[id].url = url;
    } else {
      tabMap[id] = {active: false, url};
    }
    sendResponse({status: tabMap[id].active});
    return true;
  } else if (request.msg === "newTab") {
    chrome.tabs.create({
      active: false,
      url: request.url
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  delete tabMap[tabId];
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log(changeInfo);
  if (changeInfo.status !== undefined
    && changeInfo.status === "complete") {
      if (tabMap[tabId] === undefined) {
        tabMap[tabId] = {active: false, url: tab.url};
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

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      tabMap[tab.id] = {active: false, url: tab.url};
      // if (!tab.active) {
      //   chrome.tabs.reload(tab.id);
      // }
    });
  });
});
