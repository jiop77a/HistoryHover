let timeouts = [];

const clearTimeouts = () => {
  for (let i = 0 ; i < timeouts.length ; i++) {
      clearTimeout(timeouts[i]);
  }
  timeouts = [];
};

let duderino = () => {

  const assembleResponse = (title, definition) => {
    let final = document.createElement('div');
    if (title.className === "tryAgain") {
      final.className = "tryAgain";
    }
    title.className = "title";
    final.appendChild(title);
    final.appendChild(definition);
    return final;
  };

  const giveCredit = (list) => {
    let credit = document.createElement('div');
    credit.className = "credit";
    credit.innerHTML =
    `Powered by: <span class="crossreference">etymonline</span>`
    list.appendChild(credit);
    return list;
  };

  const failResponse = (code) => {
    let title = document.createElement('h1');
    let definition = document.createElement('object');
    if (code === "502") {
      title.className = "tryAgain";
      title.innerHTML = "Woah! (interj.)";
      definition.innerHTML = "Network busy. Try again soon!";
    } else {
      title.innerHTML = "Sorry! (interj.)";
      definition.innerHTML = "The word you're looking for cannot be found :(";
    }

    return assembleResponse(title, definition);
  };

  const makeList = (divs) => {
    let list = document.createElement('div');
    for (let i = 0; i < divs.length; i++) {
      let div = divs[i].firstChild;
      let title = div.firstChild;
      let definition = div.lastChild.lastChild;
      list.appendChild(assembleResponse(title, definition));
    }
    return list;
  };

  const successResponse = (text) => {
    let parser = new DOMParser();
    let htmlDoc = parser.parseFromString(text, "text/html");
    let divs = htmlDoc.querySelectorAll(".word--C9UPa");
    if (divs.length > 0) {
      let list = makeList(divs);
      return giveCredit(list);
    } else {
      return failResponse();
    }
  };

  const getEtym = async word => {
    const proxyurl = "https://yes-proxy.herokuapp.com/";
    let url = `http://www.etymonline.com/word/${word}`;
    let response = await fetch(proxyurl + url);
    if (response.ok) {
      let text = await response.text();
      return successResponse(text);
    } else if (response.status === 502) {
      return failResponse("502");
    } else {
      return failResponse();
    }
  };

  let closeTimer = () => {
    // console.log("close timer set");
    let bottomDiv = document.getElementById("etym-bottomDiv");
    timeouts.push(setTimeout(() => {
      bottomDiv.className = "etym-invisible";
    }, 500));
  };

  const sendTabMessage = (word) => {
    let url = (word === "etymonline" ?
    'http://www.etymonline.com/' : `http://www.etymonline.com/word/${word}`)
    chrome.runtime.sendMessage({
      msg: "newTab",
      url,
    });
  };

  const fixLinks = (bottomDiv) => {
    let links = bottomDiv.shadowRoot.querySelectorAll(".crossreference");
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener('click', (e) => {
        sendTabMessage(e.target.innerText);
      });
    }
  };

  const populateBottom = (result, bottomDiv) => {
    let popDup = bottomDiv.shadowRoot.querySelector("div");
    popDup.innerHTML = result.innerHTML;
    fixLinks(bottomDiv);
  };

  const addSpinner = (bottomDiv) => {
    let popDup = bottomDiv.shadowRoot.querySelector("div");
    popDup.innerHTML = "<div class='loader'></div>";
  };

  const removePunc = (text) => {
    return text.replace(/^\W+/, "").replace(/\W+$/, "");
  };

  const handleResult = (el, result, bottomDiv) => {
    if (result.className !== "tryAgain") {
      el.appendChild(result);
    }
    result.className = "etym-popup";
    populateBottom(result, bottomDiv);
  };

  const fetchNewWord = (bottomDiv, el) => {
    addSpinner(bottomDiv);
    let text = removePunc(el.innerHTML);
    getEtym(text).then(result => {
      handleResult(el, result, bottomDiv);
    });
  };

  const mouseEnterWord = (e) => {
    let bottomDiv = document.getElementById("etym-bottomDiv");
    timeouts.push(setTimeout(() => {
      bottomDiv.className = "etym-visible";
      let el = e.target;
      if (el.lastChild.classList === undefined) {
        fetchNewWord(bottomDiv, el)
      } else {
        result = el.lastChild;
        populateBottom(result, bottomDiv);
      }
    }, 750));
  };

  const mouseLeaveWord = () => {
    clearTimeouts();
    closeTimer();
  };


  const makeSpans = () => {
    let treeWalker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: node => {
          if (
              (!/^\s*$/.test(node.data))
              && (node.parentNode.nodeName !== 'SCRIPT')
              && (node.parentNode.nodeName !== 'STYLE')
              && (node.parentNode.nodeName !== 'ETYM-SPAN')
              && (node.parentNode.nodeName !== 'NOSCRIPT')
              && (getComputedStyle(node.parentNode).display !== 'flex')
            ) {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      }
    );

    let textNodes = [];

    while (treeWalker.nextNode()) {
      textNodes.push(treeWalker.currentNode);
    };

    const makeText = txt => document.createTextNode(txt);

    const insertBefore = (newEl, el) => {
      el.parentNode.insertBefore(newEl, el);
    };

    const removeElement = el => {
      el.parentNode.removeChild(el);
    };

    const makeSpan = (txt, idNum) => {
      let s = document.createElement("etym-span");
      s.id = idNum;
      s.appendChild(makeText(txt));
      s.addEventListener("mouseenter", mouseEnterWord);
      s.addEventListener("mouseleave", mouseLeaveWord);
      return s;
    };

    let idNum = 1;
    for (let i = 0; i < textNodes.length; i++) {
      let n = textNodes[i];
      let txt = n.nodeValue;
      let words = txt.split(" ");

      insertBefore(makeSpan(words[0], idNum++), n);

      for (let j = 1; j < words.length; j++) {
        insertBefore(makeText(" "), n);
        insertBefore(makeSpan(words[j], idNum++), n);
      }
      removeElement(n);
    }
  };

  let makeBottomDiv = () => {
    let bottomDiv = document.createElement("div");
    bottomDiv.id = "etym-bottomDiv";
    bottomDiv.className = "etym-invisible";

    bottomDiv.addEventListener("mouseenter", (e) => {
      clearTimeouts();
    });

    bottomDiv.addEventListener("mouseleave", (e) => {
      bottomDiv.className = "etym-invisible";
    });

    let shadowRoot = bottomDiv.attachShadow({mode: 'open'});
    shadowRoot.innerHTML = `
    <link rel="stylesheet" href=${chrome.extension.getURL('tryles.css')}>
    <div class='popDup'></div>
      `;

    document.body.appendChild(bottomDiv);
  };

  if (document.querySelector("#etym-bottomDiv") === null) {
    makeBottomDiv();
  }
  console.log("making spans");
  makeSpans();
};

const sendMessage = () => {
  chrome.runtime.sendMessage({msg: "getStatus"}, (response) => {
     if (response.status) {
       console.log("chrome's load: running");
       duderino();
     }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request.msg);
  if (request.msg == "runDude" || request.msg == "2.8 secs later, running again") {
    duderino();
  }
})

sendMessage();
// window.addEventListener('load', sendMessage);
