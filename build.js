let duderino = () => {
  let timeouts = [];

  const fixLinks = (object) => {
    let links = object.querySelectorAll(".crossreference");
    for (let i = 0; i < links.length; i++) {
      let word = links[i].innerHTML;
      links[i].innerHTML = `
        <a href="http://www.etymonline.com/word/${word}">${word}</a>
        `;
    }
    return object
  }

  const assembleResponse = (title, definition) => {
    title.className = "title";
    let final = document.createElement('div');
    let body = fixLinks(definition);
    final.appendChild(title);
    final.appendChild(body);
    return final
  }

  const giveCredit = (list) => {
    let credit = document.createElement('div');
    credit.className = "credit";
    credit.innerHTML =
    `Powered by: <a href="http://www.etymonline.com">etymonline</a>`
    list.appendChild(credit);
    return list
  }

  const successResponse = (text) => {
    let parser = new DOMParser();
    let htmlDoc = parser.parseFromString(text, "text/html");
    let divs = htmlDoc.querySelectorAll(".word--C9UPa");
    let list = document.createElement('div');
    for (let i = 0; i < divs.length; i++) {
      let div = divs[i].firstChild;
      let title = div.firstChild;
      let definition = div.lastChild.lastChild;
      list.appendChild(assembleResponse(title, definition));
    }
    return giveCredit(list);
  }

  const failResponse = () => {
    let title = document.createElement('h1');
    title.innerHTML = "Sorry! (interj.)";
    let definition = document.createElement('object');
    definition.innerHTML = "The word you're looking for cannot be found :(";

    return assembleResponse(title, definition);
  }

  const getEtym = async word => {
    const proxyurl = "https://yes-proxy.herokuapp.com/";
    let url = `http://www.etymonline.com/word/${word}`;

    let response = await fetch(proxyurl + url);
    if (response.ok) {
      let text = await response.text();
      return successResponse(text);
    } else {
      return failResponse();
    }
  };

  let closeTimer = () => {
    console.log("close timer set");
    let bottomDiv = document.getElementById("etym-bottomDiv");
    timeouts.push(setTimeout(() => {
      bottomDiv.className = "etym-invisible";
    }, 1000));
  };

  const populateBottom = result => {
    let bottomDiv = document.getElementById("etym-bottomDiv");
    bottomDiv.innerHTML = "";
    if (bottomDiv.shadowRoot) {
      let popDup = bottomDiv.shadowRoot.querySelector("div");
      popDup.className = 'popDup';
      popDup.innerHTML = result.innerHTML;
    } else {
      let shadowRoot = bottomDiv.attachShadow({mode: 'open'});
      shadowRoot.innerHTML = `
      <link rel="stylesheet" href=${chrome.extension.getURL('styles.css')}>
        `;
      let popDup = result.cloneNode(true);
      popDup.className = "popDup";
      shadowRoot.appendChild(popDup);
    }
  };

  const addSpinner = () => {
    let bottomDiv = document.getElementById("etym-bottomDiv");
    bottomDiv.innerHTML = "";
    if (bottomDiv.shadowRoot) {
      let popDupMaybe = bottomDiv.shadowRoot.querySelector("div")
      if (popDupMaybe.className !== "loader") {
        popDupMaybe.innerHTML = "<div class='loader'></div>";
      }
    } else {
      let shadowRoot = bottomDiv.attachShadow({mode: 'open'});
      shadowRoot.innerHTML = `
      <link rel="stylesheet" href=${chrome.extension.getURL('tryles.css')}>
      <div class='popDup'><div class='loader'></div></div>
        `;
      }
  };

  const mouseEnterWord = (e) => {
    console.log("open timer set");
    let bottomDiv = document.getElementById("etym-bottomDiv");
    timeouts.push(setTimeout(() => {
      bottomDiv.className = "etym-visible";
      let el = e.target;
      if (el.lastChild.classList === undefined) {
        addSpinner();
        let preText = e.target.innerHTML;
        let text = preText.replace(/^\W+/, "").replace(/\W+$/, "");
        getEtym(text).then(result => {
          result.className = "etym-popup";
          el.appendChild(result);

          populateBottom(result);
        });
      } else {
        result = el.lastChild;
        populateBottom(result);
      }
    }, 1000));
  };

  const mouseLeaveWord = () => {
    for (var i = 0 ; i < timeouts.length; i++) {
      clearTimeout(timeouts[i]);
    }
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
            ) {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      }
    );
    let textNodes = [];

    while (treeWalker.nextNode()) {
      textNodes.push(treeWalker.currentNode);
    }

    const makeText = txt => document.createTextNode(txt);

    const insertBefore = (newEl, el) => {
      el.parentNode.insertBefore(newEl, el);
    };

    const removeElement = el => {
      el.parentNode.removeChild(el);
    };

    const makeSpan = (txt, attrs) => {
      let s = document.createElement("etym-span");
      for (let prop in attrs) {
        if (attrs.hasOwnProperty(prop)) {
          s[prop] = attrs[prop];
        }
      }
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

      insertBefore(
        makeSpan(words[0], {
          id: idNum++}),
        n
      );
      for (let j = 1; j < words.length; j++) {
        insertBefore(makeText(" "), n);
        insertBefore(
          makeSpan(words[j], {
            id: idNum++}),
          n
        );
      }
      removeElement(n);
    }
  };

  let makeBottomDiv = () => {
    let bottomDiv = document.createElement("div");
    bottomDiv.id = "etym-bottomDiv";
    bottomDiv.className = "etym-invisible";

    bottomDiv.addEventListener("mouseenter", (e) => {
      for (var i = 0 ; i < timeouts.length ; i++) {
          clearTimeout(timeouts[i]);
      }
      timeouts = [];
    });

    bottomDiv.addEventListener("mouseleave", (e) => {
      bottomDiv.className = "etym-invisible";
      // closeTimer();
    });

    document.body.appendChild(bottomDiv);
  };

  makeBottomDiv();
  makeSpans();

};

const sendMessage = () => {
  chrome.runtime.sendMessage({msg: "getStatus"}, (response) => {
    console.log(response);
     if (response.status) {
       duderino();
     }
  });
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(sendMessage, 1000);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg == "runDude") {
    duderino();
  }
})
