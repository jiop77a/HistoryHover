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
    return list;
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
    let bottomDiv = document.getElementById("bottomDiv");
    timeouts.push(setTimeout(() => {
      bottomDiv.className = "invisible";
    }, 1000));
  };

  const populateBottom = result => {
    let bottomDiv = document.getElementById("bottomDiv");
    bottomDiv.innerHTML = "";
    let popDup = result.cloneNode(true);
    popDup.className = "popDup";
    bottomDiv.appendChild(popDup);
  };

  const addSpinner = () => {
    let bottomDiv = document.getElementById("bottomDiv");
    bottomDiv.innerHTML = "";
    let spinner = document.createElement("div");
    spinner.className = "loader";
    bottomDiv.appendChild(spinner);
  };

  const mouseEnterWord = (e) => {
    console.log("open timer set");
    let bottomDiv = document.getElementById("bottomDiv");
    timeouts.push(setTimeout(() => {
      bottomDiv.className = "visible";
      let el = e.target;
      if (el.lastChild.classList === undefined) {
        addSpinner();
        let preText = e.target.innerHTML;
        let text = preText.replace(/^\W+/, "").replace(/\W+$/, "");
        getEtym(text).then(result => {
          result.className = "popup";
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
          if (!/^\s*$/.test(node.data)) {
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
      let s = document.createElement("span");
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
        makeSpan(words[0], { id: idNum++, className: "alexClass" }),
        n
      );
      for (let j = 1; j < words.length; j++) {
        insertBefore(makeText(" "), n);
        insertBefore(
          makeSpan(words[j], { id: idNum++, className: "alexClass" }),
          n
        );
      }
      removeElement(n);
    }
  };

  let makeBottomDiv = () => {
    let bottomDiv = document.createElement("div");
    bottomDiv.id = "bottomDiv";
    bottomDiv.className = "invisible";

    bottomDiv.addEventListener("mouseenter", (e) => {
      for (var i = 0 ; i < timeouts.length ; i++) {
          clearTimeout(timeouts[i]);
      }
      timeouts = [];
    });

    bottomDiv.addEventListener("mouseleave", (e) => {
      closeTimer();
    });

    document.body.appendChild(bottomDiv);
  };

  makeBottomDiv();
  makeSpans();

};

duderino();
