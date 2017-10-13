
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

const getEtym = async word => {
  try {
    const data = await myFetch(word);
    if(data) return myParse(data);
  }
  catch(e) {
    console.log(e);
  }
};

getEtym("capybara").then(r => console.log(r))
