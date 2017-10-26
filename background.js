/* globals chrome */

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
  let current = tabs[0];
  return {url: current.url, id: current.id};
}

chrome.browserAction.onClicked.addListener(() => {
  getTabInfo().then(info => {
    let {url, id} = info;
    if (tabMap[id].active) {
      tabMap[id].active = !tabMap[id].active;
      chrome.tabs.reload(id);
    } else {
      tabMap[id].active = !tabMap[id].active;
      setIconActive(id);
      chrome.tabs.sendMessage(id, {msg: "runDude"});
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg == "getStatus") {
      getTabInfo().then(info => {
        let {url, id} = info;
        if (tabMap.hasOwnProperty(id)) {
          tabMap[id].active ? setIconActive(id) : setIconInactive(id);
        } else {
          tabMap[id] = {active: true, url};
          
        }
        sendResponse({status: tabMap[id].active, id});
      });
      return true;
    }
});
