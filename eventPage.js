var contextMenuItem = {
  "id": "getEtymology",
  "title": "Get Etymology",
  "contexts": ["selection"]
};


chrome.contextMenus.create(contextMenuItem);

chrome.contextMenus.onClicked.addListener((clickData) => {
  const proxyurl = "https://cors-anywhere.herokuapp.com/";
  const url = "http://www.etymonline.com/index.php?term=" + clickData.selectionText;
  fetch(proxyurl + url)
    .then(response => response.text())
    .then(contents => {
      let parser = new DOMParser();
      let htmlDoc = parser.parseFromString(contents, "text/html");
      let dictionary = htmlDoc.getElementById('dictionary');
      let html = htmlDoc.getElementById('dictionary');
      alert(dictionary.innerText);
  });
});
