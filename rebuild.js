const assembleResponse = (title, definition) => {
  title.className = "title";
  let final = document.createElement('div');
  final.appendChild(title);
  final.appendChild(definition);
  return final
}

const successResponse = (text) => {
  let parser = new DOMParser();
  let htmlDoc = parser.parseFromString(text, "text/html");
  let divs = htmlDoc.querySelectorAll(".word--C9UPa");
  if (divs.length === 1) {
    let div = divs[0].firstChild;
    let title = div.firstChild;
    let definition = div.lastChild.lastChild;
    return assembleResponse(title, definition);
  } else {
    let list = document.createElement('div');
    for (let i = 0; i < divs.length; i++) {
      let div = divs[i].firstChild;
      let title = div.firstChild;
      let definition = div.lastChild.lastChild;
      list.appendChild(assembleResponse(title, definition));
    }
    return list;
  }
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
 }


 // let links = html.querySelectorAll("a");
 // links.forEach(el => {
 //   let oldHref = el.href;
 //   let index = /index/.exec(oldHref).index;
 //   el.href = `http://www.etymonline.com/${oldHref.slice(index)}`;
 // })



const myParse = data => {
  data.text().then(words => {
    let parser = new DOMParser();
    let htmlDoc = parser.parseFromString(words, "text/html");
    let html = htmlDoc.querySelector(".word--C9UPa");
    return html;
  });
}

const myFetch = async word => {
  const proxyurl = "https://yes-proxy.herokuapp.com/";
  let url = `http://www.etymonline.com/word/${word}`;

  fetch(proxyurl + url)
  .then(response => {
    if (response.ok) {
      return response.text();
    } else {
      return Promise.reject("there was an error");
    }
  })
}

getEtym("capybara").then(r => console.log(r))
