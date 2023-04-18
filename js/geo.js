function buildGeoPage() {
  console.log("Building geocities page");

  const whois = document.getElementById("whois");
  whois.innerHTML = whoisRoot.split(" Try")[0];

  const portfolioTable = document.getElementById("portfolio");
  for (p in portfolio) {
    const row = portfolioTable.insertRow(-1);
    const logoCell = row.insertCell();
    const descriptionCell = row.insertCell();
    const urlCell = row.insertCell();

    logoCell.setAttribute("class", "portfolio-photo");
    descriptionCell.setAttribute("class", "portfolio-description");

    // <img> of company logo
    const logoImgTag = document.createElement("img");
    logoImgTag.setAttribute("src", `images/${p}.jpg`);
    logoImgTag.setAttribute("alt", `${portfolio[p].name}`);

    if (portfolio[p].url != "(inactive)") {
      // add logo w company link to table
      const logoLinkImgTag = document.createElement("a");
      logoLinkImgTag.setAttribute("href", portfolio[p].url);
      logoLinkImgTag.setAttribute("target", `_blank`);
      logoLinkImgTag.setAttribute("alt", `${portfolio[p].name}`);
      logoLinkImgTag.appendChild(logoImgTag);
      logoCell.appendChild(logoLinkImgTag);

      // add company URL to table
      const urlATag = document.createElement("a");
      urlATag.setAttribute("href", portfolio[p].url);
      urlATag.setAttribute("alt", `${portfolio[p].name}`);
      urlATag.setAttribute("target", "_blank");
      urlATag.innerHTML = portfolio[p].url;
      urlCell.appendChild(urlATag);
    } else {
      // inactive company doesn't have links
      logoCell.appendChild(logoImgTag);

      urlCell.innerHTML = portfolio[p].url;
    }

    // add company description to table
    descriptionCell.innerHTML = portfolio[p].description;
  }

  const teamTable = document.getElementById("team");
  for (t in team) {
    const row = teamTable.insertRow(-1);
    const photoCell = row.insertCell();
    const nameCell = row.insertCell();
    const titleCell = row.insertCell();
    const descriptionCell = row.insertCell();

    photoCell.setAttribute("class", "team-photo");
    descriptionCell.setAttribute("class", "team-description");

    const photoImgTag = document.createElement("img");
    photoImgTag.setAttribute("src", `images/geo/${t}2.jpg`);
    photoImgTag.setAttribute("alt", `${team[t].name}`);
    photoCell.appendChild(photoImgTag);

    const linkedinATag = document.createElement("a");
    linkedinATag.setAttribute("href", team[t].linkedin);
    linkedinATag.setAttribute("alt", `${team[t].name}`);
    linkedinATag.innerHTML = team[t].name;
    nameCell.appendChild(linkedinATag);

    titleCell.innerHTML = team[t].title;
    descriptionCell.innerHTML = team[t].description
      .replaceAll("\n\r", "<br>")
      .replaceAll("\t", "&nbsp;&nbsp;&nbsp;&nbsp;");
  }

  comcastifyjs.letsPrepareTheseImages();
  comcastifyjs.fixMyImagesLoadingSoFast({
    boxColor: "#000000",
    loadMaxPercent: 1.0,
    loadSpeed: 800,
    loadIncrement: 5,
  })();
}
