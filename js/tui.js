/* Menu-driven Root directory. Content is shared with the crawlable build. */
(() => {
  const mount = document.getElementById("tui");
  if (!mount) return;
  const sections = [
    ["overview", "Overview"],
    ["portfolio", "Portfolio"],
    ["team", "Team"],
    ["jobs", "Careers"],
    ["contact", "Contact"],
    ["settings", "Appearance"],
  ];
  const themes = {
    everforest: {
      name: "Everforest",
      colors: [
        "#1d2326",
        "#232b2e",
        "#48534c",
        "#d3c6aa",
        "#98a391",
        "#a7c080",
        "#36463b",
        "#1d2326",
        "#dbbc7f",
      ],
    },
    gruvbox: {
      name: "Gruvbox",
      colors: [
        "#282828",
        "#32302f",
        "#665c54",
        "#ebdbb2",
        "#bdae93",
        "#fabd2f",
        "#504536",
        "#282828",
        "#fe8019",
      ],
    },
    tokyo: {
      name: "Tokyo Night",
      colors: [
        "#1a1b26",
        "#24283b",
        "#414868",
        "#c0caf5",
        "#9aa5ce",
        "#7aa2f7",
        "#293753",
        "#1a1b26",
        "#e0af68",
      ],
    },
    paper: {
      name: "Paper",
      colors: [
        "#f2efdf",
        "#e8e5d5",
        "#b4b6a3",
        "#343d36",
        "#626b5b",
        "#3e653b",
        "#dce4d0",
        "#f2efdf",
        "#865d26",
      ],
    },
  };
  let section = "overview",
    selected = "",
    query = "",
    theme = "everforest";
  const own = (object, key) =>
    Object.prototype.hasOwnProperty.call(object, key);
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );
  const link = (url, text, primary = false) =>
    `<a class="action${primary ? " primary" : ""}" href="${escape(url)}"${
      /^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ""
    }>${escape(text)} ↗</a>`;
  const button = (page, text) =>
    `<button data-go="${page}">${text}<span aria-hidden="true">↗</span></button>`;
  function setTheme(id) {
    if (!own(themes, id)) return;
    theme = id;
    [
      "bg",
      "panel",
      "line",
      "text",
      "muted",
      "accent",
      "select",
      "dark",
      "orange",
    ].forEach((name, i) =>
      document.documentElement.style.setProperty(
        `--${name}`,
        themes[id].colors[i]
      )
    );
    document.documentElement.style.colorScheme =
      id === "paper" ? "light" : "dark";
    try {
      localStorage.setItem("root-tui-theme", id);
    } catch (_) {
      /* Storage can be disabled. */
    }
  }
  try {
    const saved = localStorage.getItem("root-tui-theme");
    if (own(themes, saved)) setTheme(saved);
  } catch (_) {
    /* Use default. */
  }
  function items() {
    const source =
      section === "portfolio" ? portfolio : section === "team" ? team : jobs;
    return Object.entries(source)
      .filter(([, item]) =>
        `${item.name || item[0]} ${item.description || ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .sort((a, b) =>
        section === "portfolio" ? a[1].name.localeCompare(b[1].name) : 0
      );
  }
  function route() {
    const previousPane =
      document.activeElement?.closest("[data-pane]")?.dataset.pane;
    const menuFocused = previousPane === "menu";
    const hash = location.hash.slice(1);
    const dash = hash.indexOf("-");
    const command = dash < 0 ? hash : hash.slice(0, dash);
    const argument = dash < 0 ? "" : hash.slice(dash + 1);
    query = "";
    selected = "";
    if (command === "tldr" || command === "portfolio") {
      section = "portfolio";
      selected = argument;
    } else if (command === "whois") {
      section = argument === "root" ? "overview" : "team";
      selected = argument;
    } else if (["fg", "apply"].includes(command)) {
      section = "jobs";
      selected = argument;
    } else if (
      ["locate", "email", "pine", "twitter", "instagram", "github"].includes(
        command
      )
    )
      section = "contact";
    else
      section = sections.some(([id]) => id === command) ? command : "overview";
    render();
    revealSelection();
    if (menuFocused) mount.querySelector(".menu-item.selected").focus();
    else if (previousPane)
      focusControl(
        mount.querySelector(".entry.selected") ||
          controls(mount.querySelector(".content-scroll"))[0] ||
          mount.querySelector(".content-scroll")
      );
    if (command === "apply" && own(jobs, selected)) openApplication();
  }
  function go(page, id = "") {
    const hash =
      page === "portfolio"
        ? `tldr${id ? "-" + id : ""}`
        : page === "team"
        ? `whois${id ? "-" + id : ""}`
        : page === "jobs" && id
        ? `fg-${id}`
        : page;
    if (location.hash === "#" + hash) route();
    else location.hash = hash;
  }
  function overview() {
    return `<div class="home-intro"><div><pre class="wordmark" aria-label="Root">██████╗  ██████╗  ██████╗ ████████╗
██╔══██╗██╔═══██╗██╔═══██╗╚══██╔══╝
██████╔╝██║   ██║██║   ██║   ██║
██╔══██╗██║   ██║██║   ██║   ██║
██║  ██║╚██████╔╝╚██████╔╝   ██║
╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝</pre><p class="eyebrow">Ventures / San Francisco</p></div></div>
    <div class="intro-copy"><h1>${escape(firm.tagline)}.</h1><p>${escape(
      firm.blurb
    )}</p></div>
    <div class="facts"><div class="fact"><strong>${escape(
      firm.fundSize
    )}</strong><span>Fund size</span></div><div class="fact"><strong>${escape(
      firm.checkSize
    )}</strong><span>Initial investment</span></div><div class="fact"><strong>Seed</strong><span>Stage</span></div></div>
    <div class="home-bottom"><section><h3>01 / Areas of focus</h3><div class="focus-tags">${firm.focusAreas
      .map((area) => `<span>${escape(area)}</span>`)
      .join(
        ""
      )}</div></section><section><h3>02 / Explore Root</h3><div class="action-list">${button(
      "portfolio",
      "Portfolio"
    )}${button("team", "Team")}${button(
      "contact",
      "Contact"
    )}</div></section></div>`;
  }
  function collection() {
    const rows = items();
    if (!rows.some(([id]) => id === selected)) selected = rows[0]?.[0] || "";
    return `<div class="collection"><section class="list-column" data-pane="list" tabindex="-1" aria-label="${section} directory"><div class="pane-heading">Browse <span data-focus-label="list">↑↓ select</span></div><label class="visually-hidden" for="filter">Search ${section}</label><input class="search" id="filter" type="search" autocomplete="off" placeholder="/ Search ${section}…" value="${escape(
      query
    )}"><p class="result-count" aria-live="polite">${rows.length} ${
      section === "portfolio"
        ? "companies"
        : section === "team"
        ? "people"
        : "open roles"
    } <span aria-hidden="true">· ↑↓ to browse</span></p><div class="entries">${
      rows.length
        ? rows
            .map(
              ([id, item]) =>
                `<button class="entry${
                  id === selected ? " selected" : ""
                }" data-select="${escape(id)}" aria-pressed="${
                  id === selected
                }"><span aria-hidden="true">${
                  id === selected ? "›" : " "
                }</span><span>${escape(item.name || item[0])}</span>${
                  item.url === "(inactive)" ? "<small>inactive</small>" : ""
                }</button>`
            )
            .join("")
        : '<p class="empty">No matches. Try another search.</p>'
    }</div></section><section class="detail-frame"><div class="pane-heading">Details <span data-focus-label="detail">← → switch pane</span></div><article class="detail" id="detail" data-pane="detail" tabindex="0" aria-label="Selected entry">${detail()}</article></section></div>`;
  }
  function art(id, name, extension) {
    return `<pre class="ascii-art" data-art="images/${escape(
      id
    )}.${extension}" role="img" aria-label="ASCII art: ${escape(
      name
    )}" aria-busy="true"><span aria-hidden="true">Loading image…</span></pre>`;
  }
  function hydrateArt() {
    if (!window.rootAscii) return;
    mount.querySelectorAll("[data-art]").forEach((element) => {
      window.rootAscii
        .load(element.dataset.art)
        .then((text) => {
          if (!element.isConnected) return;
          element.firstElementChild.textContent = text;
          element.setAttribute("aria-busy", "false");
        })
        .catch(() => {
          if (!element.isConnected) return;
          element.firstElementChild.textContent = "Image unavailable";
          element.setAttribute("aria-busy", "false");
        });
    });
  }
  function detail() {
    if (!selected) return '<p class="empty">Nothing selected.</p>';
    if (section === "portfolio") {
      const item = portfolio[selected];
      return `${art(
        selected,
        item.name,
        "jpg"
      )}<span class="eyebrow">Portfolio / ${escape(
        selected
      )}</span><h1>${escape(item.name)}</h1><p class="status-label">${
        item.url === "(inactive)" ? "○ Inactive" : "● Root portfolio"
      }</p><hr class="detail-rule"><p class="description">${escape(
        item.description
      )}</p><div class="detail-actions">${
        item.url !== "(inactive)" ? link(item.url, "Visit website", true) : ""
      }${
        item.demo && item.url !== "(inactive)"
          ? link(item.demo, "Explore product")
          : ""
      }${
        item.memo ? link(item.memo, "Investment memo") : ""
      }</div><hr class="detail-rule"><p class="muted" style="font-size:11px">Select a company to explore its work.<br>External links open in a new tab.</p>`;
    }
    if (section === "team") {
      const person = team[selected];
      return `${art(
        selected,
        person.name,
        "png"
      )}<span class="eyebrow">${escape(person.title)}</span><h1>${escape(
        person.name
      )}</h1><p class="description">${escape(
        person.description
      )}</p><div class="detail-actions">${link(
        person.linkedin,
        "LinkedIn",
        true
      )}</div>`;
    }
    const job = jobs[selected];
    return `<span class="eyebrow">Careers / Root Ventures</span><h1>${escape(
      job[0]
    )}</h1><div class="job-copy">${escape(
      job.slice(2).join("\n")
    )}</div><div class="detail-actions"><button class="action primary" data-apply>Apply for this role ↗</button></div>`;
  }
  function contact() {
    const a = firm.address;
    return `<span class="eyebrow">Contact</span><h1 style="margin-top:18px">Contact Root Ventures</h1><p class="muted">${escape(
      firm.thesis
    )}</p><div class="detail-actions">${link(
      "mailto:" + firm.email,
      firm.email,
      true
    )}</div><hr class="detail-rule"><div class="contact-grid"><section><h3>Address</h3><address>${escape(
      a.streetAddress
    )}<br>${escape(a.addressLocality)}, ${escape(a.addressRegion)} ${escape(
      a.postalCode
    )}</address><div class="detail-actions">${link(
      "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(a.streetAddress + ", " + a.addressLocality),
      "Open map"
    )}</div></section><section><h3>Elsewhere</h3><div class="detail-actions">${firm.social
      .map((url, i) =>
        link(url, ["Twitter / X", "GitHub", "MachinePix"][i] || "Social")
      )
      .join("")}</div></section></div>`;
  }
  function settings() {
    return `<span class="eyebrow">Preferences / Color scheme</span><h1 style="margin-top:18px">Appearance</h1><p class="muted">Choose a palette. Your preference stays on this device.</p><div class="settings">${Object.entries(
      themes
    )
      .map(
        ([id, t]) =>
          `<button class="theme-option" data-theme="${id}" aria-pressed="${
            theme === id
          }"><span>${theme === id ? "◉" : "○"} ${
            t.name
          }</span><span class="swatches" aria-hidden="true">${[
            t.colors[0],
            t.colors[3],
            t.colors[5],
            t.colors[8],
          ]
            .map((color) => `<i style="background:${color}"></i>`)
            .join("")}</span></button>`
      )
      .join("")}</div>`;
  }
  function render() {
    const title = sections.find(([id]) => id === section)[1];
    mount.innerHTML = `<div class="shell"><header class="topbar"><a class="brand" href="#overview" style="text-decoration:none;color:inherit"><b>▣</b> ROOT VENTURES</a><span class="context">${escape(
      firm.tagline
    )}</span><span class="right"><span class="status-dot">●</span> San Francisco, CA</span></header><div class="workspace"><aside class="panel sidebar" data-pane="menu"><span class="panel-title">root.vc <span data-focus-label="menu"></span></span><div class="menu-label">Directory</div><nav aria-label="Main menu">${sections
      .map(
        ([id, label], i) =>
          `<button class="menu-item${
            section === id ? " selected" : ""
          }" data-go="${id}"${
            section === id ? ' aria-current="page"' : ""
          }><span class="number">${
            i + 1
          }</span>${label}<span class="arrow" aria-hidden="true">${
            section === id ? "‹" : ""
          }</span></button>`
      )
      .join(
        ""
      )}</nav><div class="sidebar-bottom"><div class="side-mark" aria-hidden="true">╱╱╱╱╱╱</div><p>${escape(
      firm.address.streetAddress
    )}<br>${escape(firm.address.addressLocality)}, ${escape(
      firm.address.addressRegion
    )}</p><button class="exit-tui" data-exit><kbd>q</kbd> Exit to CLI</button><button data-help style="padding:10px 0 0">? Keyboard guide</button></div></aside><main class="panel main-panel" id="main"><span class="panel-title active">${escape(
      title
    )} <span data-focus-label="content"></span></span><div class="breadcrumb"><span>root <span aria-hidden="true">/</span> <b>${section}</b></span><span>${
      section === "overview"
        ? Object.keys(portfolio).length + " COMPANIES"
        : "ROOT VENTURES"
    }</span></div><div class="content-scroll${
      ["portfolio", "team", "jobs"].includes(section) ? " directory-view" : ""
    }" data-pane="content" tabindex="0" aria-label="${escape(title)} content">${
      section === "overview"
        ? overview()
        : ["portfolio", "team", "jobs"].includes(section)
        ? collection()
        : section === "contact"
        ? contact()
        : settings()
    }</div></main></div><footer class="footer"><span><kbd>1–6</kbd> menu</span><span><kbd>← →</kbd> panes</span><span><kbd>↑ ↓</kbd> browse</span><span><kbd>↵</kbd> open</span><span><kbd>/</kbd> search</span><span><kbd>esc</kbd> back</span><button data-help><kbd>?</kbd> help</button><button data-exit><kbd>q</kbd> exit to CLI</button><span class="right">${themes[
      theme
    ].name.toLowerCase()} <span aria-hidden="true">▪</span> root.vc</span></footer></div>`;
    hydrateArt();
    updateFocus();
  }
  function revealSelection() {
    const entry = mount.querySelector(".entry.selected");
    const list = mount.querySelector(".entries");
    if (entry && list)
      list.scrollTop = Math.max(
        0,
        entry.offsetTop - list.offsetTop - list.clientHeight / 2
      );
  }
  function select(id) {
    selected = id;
    const scroll = mount.querySelector(".entries").scrollTop;
    mount.querySelectorAll("[data-select]").forEach((el) => {
      const active = el.dataset.select === id;
      el.classList.toggle("selected", active);
      el.setAttribute("aria-pressed", String(active));
      el.firstElementChild.textContent = active ? "›" : " ";
    });
    mount.querySelector("#detail").innerHTML = detail();
    mount.querySelector("#detail").scrollTop = 0;
    hydrateArt();
    mount.querySelector(".entries").scrollTop = scroll;
    const hash =
      section === "portfolio" ? "tldr-" : section === "team" ? "whois-" : "fg-";
    history.replaceState(null, "", "#" + hash + id);
  }
  let returnFocus;
  const dialog = document.createElement("dialog");
  dialog.setAttribute("aria-labelledby", "dialog-title");
  document.body.append(dialog);
  function showDialog(title, html) {
    returnFocus = document.activeElement;
    dialog.innerHTML = `<div class="dialog-header"><h2 id="dialog-title">${title}</h2><button data-close aria-label="Close dialog">esc ×</button></div>${html}`;
    dialog.showModal();
  }
  dialog.addEventListener("close", () => {
    if (returnFocus?.isConnected) returnFocus.focus();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) dialog.close();
  });
  function help() {
    showDialog(
      "Keyboard guide",
      `<p class="muted">Everything is also clickable. No commands to remember.</p>${[
        ["1–6", "Switch menu section"],
        ["← / →", "Move between menu, list, and details"],
        ["↑ / ↓ or j / k", "Browse entries and controls; scroll details"],
        ["Tab / Enter in details", "Focus the detail actions"],
        ["Home / End", "First / last control in this pane"],
        ["Page Up / Page Down", "Scroll the current pane"],
        ["q", "Exit to the CLI"],
        ["Enter", "Activate the focused link or button"],
        ["/", "Search the current directory"],
        ["Escape", "Clear search, close dialog, or go home"],
        ["?", "Show this guide"],
        ["Tab / Shift+Tab", "Move between controls"],
      ]
        .map(
          ([key, meaning]) =>
            `<div class="key-row"><kbd>${key}</kbd><span>${meaning}</span></div>`
        )
        .join("")}`
    );
  }
  function openApplication() {
    const position = jobs[selected][0];
    showDialog(
      "Apply to Root",
      `<p class="muted">${escape(
        position
      )}</p><form class="application"><label>Name<input name="name" required autocomplete="name" maxlength="200"></label><label>Email<input name="email" type="email" required autocomplete="email" maxlength="254"></label><label>LinkedIn profile URL <span class="muted">(optional)</span><input name="linkedin" type="url" placeholder="https://linkedin.com/in/…"></label><label>GitHub username <span class="muted">(optional)</span><input name="github" maxlength="100"></label><label>Why Root? <span class="muted">(optional)</span><textarea name="notes" maxlength="10000"></textarea></label><button class="action primary" type="submit">Submit application ↗</button><p class="form-status" role="status"></p></form>`
    );
    const form = dialog.querySelector("form");
    let submitting = false;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting) return;
      submitting = true;
      const submit = form.querySelector("[type=submit]");
      const status = form.querySelector("[role=status]");
      submit.disabled = true;
      status.textContent = "Submitting application…";
      try {
        const response = await fetch("/.netlify/functions/submit-application", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...Object.fromEntries(new FormData(form)),
            position,
          }),
        });
        if (!response.ok)
          throw new Error("Please try again, or email " + firm.email + ".");
        form.innerHTML =
          '<p role="status">Application received. Thank you! We’ll review it and get back to you soon.</p>';
      } catch (_) {
        status.textContent =
          "Could not submit. Please try again, or email " + firm.email + ".";
        submit.disabled = false;
        submitting = false;
      }
    });
  }
  mount.addEventListener("click", (event) => {
    const el = event.target.closest("button");
    if (!el) return;
    if (el.dataset.go) go(el.dataset.go);
    else if (el.dataset.select) select(el.dataset.select);
    else if (el.dataset.theme) {
      setTheme(el.dataset.theme);
      render();
      mount.querySelector(`[data-theme="${theme}"]`).focus();
    } else if (el.hasAttribute("data-help")) help();
    else if (el.hasAttribute("data-apply")) openApplication();
    else if (el.hasAttribute("data-exit")) exitTui();
  });
  mount.addEventListener("input", (event) => {
    if (event.target.id !== "filter") return;
    query = event.target.value;
    const position = event.target.selectionStart;
    const main = mount.querySelector("#main");
    const collectionNode = main.querySelector(".collection");
    collectionNode.outerHTML = collection();
    hydrateArt();
    const input = mount.querySelector("#filter");
    input.focus();
    try {
      input.setSelectionRange(position, position);
    } catch (_) {
      /* Search inputs need no cursor restoration in some engines. */
    }
  });
  function exitTui() {
    if (window.parent !== window)
      window.parent.postMessage({ type: "root-tui-exit" }, location.origin);
    else location.href = "/";
  }
  function controls(pane) {
    return [
      ...pane.querySelectorAll(
        "a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)"
      ),
    ]
      .sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      )
      .filter((element) => {
        for (
          let ancestor = element;
          ancestor && ancestor !== pane;
          ancestor = ancestor.parentElement
        ) {
          if (ancestor.hidden || getComputedStyle(ancestor).display === "none")
            return false;
        }
        return true;
      });
  }
  function updateFocus() {
    const pane = document.activeElement?.closest("[data-pane]");
    mount
      .querySelectorAll("[data-pane]")
      .forEach((element) =>
        element.classList.toggle("is-active", element === pane)
      );
    mount.querySelectorAll("[data-focus-label]").forEach((label) => {
      const id = label.dataset.focusLabel;
      const active = id === pane?.dataset.pane;
      label.textContent = active
        ? id === "detail"
          ? document.activeElement === pane
            ? "FOCUS · ↑↓ scroll · Tab actions"
            : "FOCUS · ↑↓ actions · Enter open"
          : "FOCUS"
        : id === "list"
        ? "↑↓ select"
        : id === "detail"
        ? "← → switch pane"
        : "";
    });
  }
  mount.addEventListener("focusin", updateFocus);
  mount.addEventListener("focusout", () => queueMicrotask(updateFocus));
  function focusControl(element) {
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  document.addEventListener("keydown", (event) => {
    if (dialog.open) {
      if (event.key === "Escape") {
        event.preventDefault();
        dialog.close();
      } else if (event.key === "Tab") {
        const fields = controls(dialog);
        if (fields.length) {
          event.preventDefault();
          const index = fields.indexOf(document.activeElement);
          focusControl(
            fields[
              (index + (event.shiftKey ? -1 : 1) + fields.length) %
                fields.length
            ]
          );
        }
      }
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey || mount.inert) return;
    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName);
    if (event.key === "Escape") {
      if (query) {
        query = "";
        render();
        mount.querySelector("#filter")?.focus();
      } else {
        go("overview");
      }
      event.preventDefault();
      return;
    }
    if (typing) {
      if (event.target.id === "filter" && event.key === "ArrowDown") {
        event.preventDefault();
        focusControl(mount.querySelector(".entry.selected"));
      }
      return;
    }
    if (event.key === "q") {
      event.preventDefault();
      exitTui();
      return;
    }
    const currentPane = event.target.closest("[data-pane]");
    if (currentPane?.dataset.pane === "detail") {
      const actions = controls(currentPane);
      const onPane = event.target === currentPane;
      const isArrow = ["ArrowDown", "ArrowUp", "j", "k"].includes(event.key);
      if (
        isArrow ||
        ["Home", "End", "PageUp", "PageDown"].includes(event.key)
      ) {
        event.preventDefault();
        const down = ["ArrowDown", "j", "PageDown", "End"].includes(event.key);
        if (isArrow && !onPane) {
          const next = actions.indexOf(event.target) + (down ? 1 : -1);
          if (next >= 0 && next < actions.length) {
            focusControl(actions[next]);
            return;
          }
        }
        currentPane.focus({ preventScroll: true });
        const limit = Math.max(
          0,
          currentPane.scrollHeight - currentPane.clientHeight
        );
        const atBottom = currentPane.scrollTop >= limit - 1;
        if (onPane && isArrow && down && atBottom && actions.length) {
          focusControl(actions[0]);
        } else {
          const amount = event.key.startsWith("Page")
            ? currentPane.clientHeight * 0.8
            : 56;
          currentPane.scrollTop =
            event.key === "Home"
              ? 0
              : event.key === "End"
              ? limit
              : Math.max(
                  0,
                  Math.min(
                    limit,
                    currentPane.scrollTop + (down ? amount : -amount)
                  )
                );
        }
        return;
      }
      if (onPane && event.key === "Enter") {
        event.preventDefault();
        focusControl(actions[0]);
        return;
      }
    }

    if (
      currentPane &&
      ["content", "detail", "menu"].includes(currentPane.dataset.pane)
    ) {
      const paneControls = controls(currentPane);
      if (
        ["ArrowDown", "ArrowUp", "j", "k", "Home", "End"].includes(event.key) &&
        paneControls.length
      ) {
        event.preventDefault();
        const index = paneControls.indexOf(event.target);
        const offset = ["ArrowDown", "j"].includes(event.key) ? 1 : -1;
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
            ? paneControls.length - 1
            : index < 0
            ? offset > 0
              ? 0
              : paneControls.length - 1
            : (index + offset + paneControls.length) % paneControls.length;
        focusControl(paneControls[next]);
        return;
      }
      if (["PageUp", "PageDown"].includes(event.key)) {
        event.preventDefault();
        currentPane.scrollBy({
          top:
            currentPane.clientHeight *
            0.8 *
            (event.key === "PageDown" ? 1 : -1),
        });
        return;
      }
    }
    if (
      currentPane?.dataset.pane === "list" &&
      ["Home", "End"].includes(event.key)
    ) {
      const rows = items();
      if (rows.length) {
        event.preventDefault();
        select(rows[event.key === "Home" ? 0 : rows.length - 1][0]);
        focusControl(mount.querySelector(".entry.selected"));
      }
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const pane = event.target.closest("[data-pane]")?.dataset.pane;
      const inDirectory = !!mount.querySelector(".collection");
      const order = inDirectory
        ? ["menu", "list", "detail"]
        : ["menu", "content"];
      const current = Math.max(0, order.indexOf(pane));
      const next =
        order[
          Math.max(
            0,
            Math.min(
              order.length - 1,
              current + (event.key === "ArrowRight" ? 1 : -1)
            )
          )
        ];
      const target =
        next === "menu"
          ? mount.querySelector(".menu-item.selected")
          : next === "list"
          ? mount.querySelector(".entry.selected") ||
            mount.querySelector("#filter")
          : next === "detail"
          ? mount.querySelector("#detail")
          : controls(mount.querySelector(`[data-pane="${next}"]`))[0] ||
            mount.querySelector(`[data-pane="${next}"]`);
      if (next === "detail") target.focus({ preventScroll: true });
      else focusControl(target);
      return;
    }
    if (/^[1-6]$/.test(event.key)) {
      event.preventDefault();
      go(sections[Number(event.key) - 1][0]);
    } else if (event.key === "?") {
      event.preventDefault();
      help();
    } else if (event.key === "/") {
      event.preventDefault();
      mount.querySelector("#filter")?.focus();
    } else if (
      ["ArrowDown", "ArrowUp", "j", "k"].includes(event.key) &&
      ["portfolio", "team", "jobs"].includes(section) &&
      !event.target.closest('[data-pane="detail"]')
    ) {
      const rows = items();
      if (!rows.length) return;
      event.preventDefault();
      const offset = ["ArrowDown", "j"].includes(event.key) ? 1 : -1;
      const index = rows.findIndex(([id]) => id === selected);
      select(rows[(index + offset + rows.length) % rows.length][0]);
      const entry = mount.querySelector(".entry.selected");
      entry.focus({ preventScroll: true });
      entry.scrollIntoView({ block: "nearest" });
    } else if (
      event.key === "Enter" &&
      (event.target === document.body ||
        event.target.matches("[data-select], #detail"))
    ) {
      event.preventDefault();
      mount.querySelector(".detail-actions a, .detail-actions button")?.click();
    }
  });
  window.addEventListener("hashchange", route);
  route();
})();
