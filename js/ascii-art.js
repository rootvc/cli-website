function preloadASCIIArt() {
  loadArt("rootvc-horizontal", 1559.0/5223.0, 1.0);

  const companies = Object.keys(portfolio);
  for (c of companies) {
    loadArt(c, 0.5, 1.0);
  }

  const people = Object.keys(team);
  for (p of people) {
    loadArt(p, 1.0, 0.5);
  }
}

function loadArt(id, ratio, scale, callback) {
  const NICE_CHARSET = aalib.charset.SIMPLE_CHARSET + " ";
  const parentDiv = document.getElementById("aa-all");
  const width = Math.floor(term.cols * scale);
  const height = Math.floor(width / 2 * ratio);
  var filename = `/images/${id}.png`;

  var div = document.createElement("div");
  div.id = id;
  parentDiv.appendChild(div);

  aalib.read.image.fromURL(filename)
    .map(aalib.aa({ width: width, height: height }))
    .map(aalib.render.html({
      el: div,
      charset: NICE_CHARSET,
    }))
    .subscribe(callback);
}

function getArt(id) {
  const div = document.getElementById(id);
  return div.innerText.replaceAll("\n", "\n\r");
}