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

        const logoImgTag = document.createElement("img");
        logoImgTag.setAttribute("src", `images/${p}.jpg`);
        logoImgTag.setAttribute("alt", `${portfolio[p].name}`);
        logoCell.appendChild(logoImgTag);

        if (portfolio[p].url != "(inactive)") {
            const urlATag = document.createElement("a");
            urlATag.setAttribute("href", portfolio[p].url);
            urlATag.setAttribute("alt", `${portfolio[p].name}`);
            urlATag.innerHTML = portfolio[p].url;
            urlCell.appendChild(urlATag);
        } else {
            urlCell.innerHTML = portfolio[p].url;
        }
        
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
        descriptionCell.innerHTML = team[t].description;
    }
}