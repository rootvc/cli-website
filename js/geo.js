function buildGeoPage() {
    console.log("Building geocities page");

    const whois = document.getElementById("whois");
    whois.innerHTML = whoisRoot.split(" Try")[0];

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
        photoImgTag.setAttribute("src", `images/${t}.png`);
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

    const portfolioTable = document.getElementById("portfolio");
    for (p in portfolio) {
        if (portfolio[p].url != "(inactive)") {
            const row = portfolioTable.insertRow(-1);
            const logoCell = row.insertCell();
            const urlCell = row.insertCell();
            const descriptionCell = row.insertCell();

            logoCell.setAttribute("class", "portfolio-photo");
            descriptionCell.setAttribute("class", "portfolio-description");

            const logoImgTag = document.createElement("img");
            logoImgTag.setAttribute("src", `images/${p}.jpg`);
            logoImgTag.setAttribute("alt", `${portfolio[p].name}`);
            logoCell.appendChild(logoImgTag);

            const urlATag = document.createElement("a");
            urlATag.setAttribute("href", portfolio[p].url);
            urlATag.setAttribute("alt", `${portfolio[p].name}`);
            urlATag.innerHTML = portfolio[p].url;
            urlCell.appendChild(urlATag);

            descriptionCell.innerHTML = portfolio[p].description;
        }
    }
}