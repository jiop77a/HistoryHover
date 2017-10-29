let duderino = () => {

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
    let final = document.createElement('div');
    if (title.className === "tryAgain") {
      final.className = "tryAgain";
    }
    let body = fixLinks(definition);
    title.className = "title";
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
  }

  const successResponse = (text) => {
    let parser = new DOMParser();
    let htmlDoc = parser.parseFromString(text, "text/html");
    let divs = htmlDoc.querySelectorAll(".word--C9UPa");
    if (divs.length > 0) {
      let list = document.createElement('div');
      for (let i = 0; i < divs.length; i++) {
        let div = divs[i].firstChild;
        let title = div.firstChild;
        let definition = div.lastChild.lastChild;
        list.appendChild(assembleResponse(title, definition));
      }
      return giveCredit(list);
    } else {
      return failResponse();
    }
  }


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
    setTimeout(() => {
      bottomDiv.className = "etym-invisible";
    }, 500);
  };

  const fixLinksOutside = () => {
    let bottomDiv = document.getElementById("etym-bottomDiv");
    let links = bottomDiv.shadowRoot.querySelectorAll("a");
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({
          msg: "newTab",
          url: e.target.href
        });
      });
    }
  }

  const populateBottom = result => {
    let bottomDiv = document.getElementById("etym-bottomDiv");
    let popDup = bottomDiv.shadowRoot.querySelector("div");
    popDup.innerHTML = result.innerHTML;
    fixLinksOutside();
  };

  const addSpinner = () => {
    let bottomDiv = document.getElementById("etym-bottomDiv");
    let popDup = bottomDiv.shadowRoot.querySelector("div");
    popDup.innerHTML = "<div class='loader'></div>";
  };

  const mouseEnterWord = (e) => {
    // console.log("open timer set");
    let bottomDiv = document.getElementById("etym-bottomDiv");
    setTimeout(() => {
      bottomDiv.className = "etym-visible";
      let el = e.target;
      if (el.lastChild.classList === undefined) {
        addSpinner();
        let preText = e.target.innerHTML;
        let text = preText.replace(/^\W+/, "").replace(/\W+$/, "");
        getEtym(text).then(result => {
          if (result.className !== "tryAgain") {
            el.appendChild(result);
          }
          result.className = "etym-popup";

          populateBottom(result);
        });
      } else {
        result = el.lastChild;
        populateBottom(result);
      }
    }, 750);
  };

  const clearTimeouts = () => {
    let func = () => {};
    let highestId = setTimeout(func);
    for (let i = 0 ; i < highestId ; i++) {
        clearTimeout(i);
    }
  }

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
      clearTimeouts();
    });

    bottomDiv.addEventListener("mouseleave", (e) => {
      bottomDiv.className = "etym-invisible";
      // closeTimer();
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

  makeSpans();
};

const sendMessage = () => {
  console.log("5 secs past load: sending dude from build");
  chrome.runtime.sendMessage({msg: "getStatus"}, (response) => {
     if (response.status) {
       console.log("status active, running duderino");
       duderino();
     }
  });
}

// sendMessage();

// setTimeout(sendMessage, 1000);

window.addEventListener('load', () => {
    setTimeout(sendMessage, 5000);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request.msg);
  if (request.msg == "runDude" || request.msg == "runDude2") {
    duderino();
  }
})
