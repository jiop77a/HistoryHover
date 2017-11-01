# History Hover

I've always loved words.  And, since first learning that words even had roots and origins, I've reserved a particular affection for etymology.  I think more than anything else this has to do with the sense one gets of a living connection to history.  Back in High School in the early 2000s my drug of choice was the online American Heritage Dictionary (mostly for its fantastic compendia of [Indo-European](https://ahdictionary.com/word/indoeurop.html) and [Semitic](https://ahdictionary.com/word/semitic.html) roots), and I still remember learning that the word "Veda" (i.e. the sacred Hindu texts) shared a common root with the English "wit" (i.e. perception, knowledge).  

Blew my mind right out my nose.  

I felt connected to something ancient, further compounded by the realization that I was all the time living my life in this primal, yet also dynamic and ultimately substanceless, thing which is language.  

To wit, at its best a study of etymology can render an experience of the eternal within the ephemeral.  This Chrome extension makes getting into that study a bit easier.

## Operation and Challenges

### Dropping The Net

The first time the user clicks the extension icon in a given tab, History Hover traverses that page's DOM-tree and wraps each word in a custom HTML element.  Now, hovering over any word retrieves its record from my favorite etymology site: [etymonline](http://www.etymonline.com).

No further clicks are required (though they may be an option in future versions).  Hover to retrieve an etymology.  Hover away to dismiss it.

![](https://res.cloudinary.com/dol1mm8bd/image/upload/v1509494345/etym_demo_gif_cwnx6t.gif)

### Automation

This worked fine.  However, in order to let the user leave certain tabs activated for all future pages, I had to automate this net-dropping operation.  The question the becomes when, in relation to page load, do I drop the net?  I ultimately decided to listen for two events.  The first comes soon after 'DOMContentLoaded', when Chrome injects the extension's content script into the DOM.  This makes available to History Hover's net all those words which are available at 'DOMContentLoaded', and allows the user to begin hovering as soon as possible.

But what about the rest of the words, i.e. all the content that you don't end up seeing until 'load', plus the stuff delivered by async scripts?  Also, what about React?  If all the HTML in website exists in a single ```<div id='root'></div>```, into which React magically injects and removes content, there is only ever one 'DOMContentLoaded' to listen for.

Luckily, the Chrome runtime allows another way to listen for 'load':  the chrome.tabs API fires an event when the URL changes, or when the status of the tab changes to "complete" (that tab's 'load' event).  This allows for a second dropping of the net 2.8 seconds after either of those events, scooping up with it a lot of async loaded content (2.8 seconds was, at testing, the delay required to capture YouTube comments), as well as all of the words in the next profile you load on Facebook.  Unfortunately, I haven't yet figured out how to listen for scroll-triggered pagination, though am open to suggestions...

In any case, it was a lot of fun to make.  Please enjoy!
