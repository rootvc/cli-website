const LOGO_TYPE =
` _____                                 
|  __ \\            _                   
| |__) |___   ___ | |_                  
|  _  // _ \\ / _ \\| __|                 
| | \\ | (_) | (_) | |_                  
|_|  \\_\\___/ \\___/_\\__|                 
__    __         _
\\ \\  / /__ _ __ | |_ _   _ _ __ ___ ___ 
 \\ \\/ / _ | '_ \\| __| | | | '__/ _ / __|
  \\  |  __| | | | |_| |_| | | |  __\\__ \\
   \\/ \\___|_| |_|\\__|\\__,_|_|  \\___|___/

`.replaceAll("\n", "\r\n");

function preloadASCIIArt() {
  // Load rootvc logo first as it's most commonly used
  _loadArt("rootvc-square", 1.0, term.cols >= 60 ? 0.5 : 1.0, 'png', false);
  
  // Load other assets in small batches with delays to avoid blocking
  const companies = Object.keys(portfolio);
  const people = Object.keys(team);
  const allItems = [
    ...companies.map(c => ({id: c, ratio: 0.5, scale: 1.0, ext: 'jpg', inverse: false})),
    ...people.map(p => ({id: p, ratio: 1.0, scale: term.cols >= 60 ? 0.5 : 1.0, ext: 'png', inverse: true}))
  ];
  
  let index = 0;
  function loadNextBatch() {
    const batchSize = 3;
    for (let i = 0; i < batchSize && index < allItems.length; i++) {
      const item = allItems[index];
      _loadArt(item.id, item.ratio, item.scale, item.ext, item.inverse);
      index++;
    }
    
    if (index < allItems.length) {
      setTimeout(loadNextBatch, 100);
    }
  }
  
  // Start loading after a delay
  setTimeout(loadNextBatch, 200);
}

// TODO: Here is where we should insert alternatives to ASCII as text
function _loadArt(id, ratio, scale, ext, inverse, callback) {
  const NICE_CHARSET = aalib.charset.SIMPLE_CHARSET + " ";
  const parentDiv = document.getElementById("aa-all");
  const width = Math.floor(term.cols * scale);
  const height = Math.floor(width / 2 * ratio);
  var filename = `/images/${id}.${ext}`;

  var div = document.getElementById(id);
  
  if (!div) {
    div = document.createElement("div");
    div.id = id;
    parentDiv.appendChild(div);
  }

  if (term.cols >= 40) {
    var aa = aalib.read.image.fromURL(filename)
      .map(aalib.aa({ width: width, height: height }));
    if (inverse) { aa = aa.map(aalib.filter.inverse()); }
    aa.map(aalib.render.html({
        el: div,
        charset: NICE_CHARSET,
      }))
      .subscribe(callback);
  } else {
    div.innerText = `[ Photo: ${document.location.href}images/${id}.${ext} ]`;
  }
}

function getArt(id) {
  const div = document.getElementById(id);
  if (!div || !div.innerText) {
    // If art isn't loaded yet, load it immediately
    if (id === "rootvc-square") {
      _loadArt(id, 1.0, term.cols >= 60 ? 0.5 : 1.0, 'png', false);
    } else if (Object.keys(portfolio).includes(id)) {
      _loadArt(id, 0.5, 1.0, 'jpg', false);
    } else if (Object.keys(team).includes(id)) {
      _loadArt(id, 1.0, term.cols >= 60 ? 0.5 : 1.0, 'png', true);
    }
    // Return a placeholder while loading
    return `Loading ${id}...`;
  }
  return div.innerText.replaceAll("\n", "\n\r");
}