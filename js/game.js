(function () {
  const LANES = {
    cli: {
      label: "CLI",
      icon: "$_",
      miss: "That packet belongs in the terminal.",
    },
    portfolio: {
      label: "Portfolio",
      icon: "VC",
      miss: "That one is a portfolio company.",
    },
    team: {
      label: "Team",
      icon: "ID",
      miss: "That is a team profile.",
    },
    geo: {
      label: "Geo",
      icon: "HTM",
      miss: "That is pure welcome.htm energy.",
    },
  };

  const GEO_PACKETS = [
    {
      lane: "geo",
      type: "Geo relic",
      title: "construction.gif",
      clue: "The universal signal that a site is alive, unfinished, and somehow already perfect.",
      chips: ["welcome.htm", "under construction"],
      image: "images/geo/construction.gif",
      terminal: "open welcome.htm",
    },
    {
      lane: "geo",
      type: "Geo relic",
      title: "mchammer.gif",
      clue: "A dancing footer artifact from the retro page.",
      chips: ["hammertime", "gif"],
      image: "images/geo/mchammer.gif",
      terminal: "cat welcome.htm",
    },
    {
      lane: "geo",
      type: "Geo relic",
      title: "rainbow.gif",
      clue: "The divider that turns plain firm data into a 1999 pageant.",
      chips: ["divider", "rainbow"],
      image: "images/geo/rainbow.gif",
      terminal: "grep rainbow welcome.htm",
    },
    {
      lane: "geo",
      type: "Geo relic",
      title: "counter2.gif",
      clue: "Visitor math, but make it pixelated.",
      chips: ["footer", "counter"],
      image: "images/geo/counter2.gif",
      terminal: "tail welcome.htm",
    },
  ];

  function commandPackets(commands, help) {
    const names = Object.keys(help || {})
      .map((name) => name.replaceAll("%", "").split(" ")[0])
      .filter((name, index, all) => name && all.indexOf(name) === index)
      .filter((name) => commands && commands[name]);

    return names.map((name) => ({
      lane: "cli",
      type: "Shell command",
      title: name,
      clue: (help[`%${name}%`] || help[`%${name}% [partner]`] || "A terminal command.").replaceAll("%", ""),
      chips: ["command", `/${name}`],
      image: "images/geo/notepad.gif",
      terminal: `${name} --help`,
    }));
  }

  function portfolioPackets(portfolio) {
    return Object.entries(portfolio || {}).map(([key, company]) => ({
      lane: "portfolio",
      type: "Portfolio",
      title: company.name,
      clue: company.description,
      chips: ["tldr", key],
      image: `images/${key}.jpg`,
      terminal: `tldr ${key}`,
    }));
  }

  function teamPackets(team) {
    return Object.entries(team || {}).map(([key, person]) => ({
      lane: "team",
      type: "Team",
      title: person.name,
      clue: `${person.title}. ${firstSentence(person.description)}`,
      chips: ["whois", key],
      image: `images/geo/${key}2.jpg`,
      terminal: `whois ${key}`,
    }));
  }

  function firmPacket(whoisRoot) {
    return {
      lane: "cli",
      type: "Root file",
      title: "whois root",
      clue: firstSentence(whoisRoot || "Root Ventures is a San Francisco-based deep tech seed fund."),
      chips: ["whois", "root"],
      image: "images/rootvc-square.png",
      terminal: "whois root",
    };
  }

  function firstSentence(text) {
    const match = `${text || ""}`.match(/[^.?!]+[.?!]/);
    return match ? match[0].trim() : `${text || ""}`.trim();
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function buildDeck(data, size = 18) {
    const packets = [
      firmPacket(data.whoisRoot),
      ...commandPackets(data.commands, data.help),
      ...portfolioPackets(data.portfolio),
      ...teamPackets(data.team),
      ...GEO_PACKETS,
    ];

    const balanced = [
      ...shuffle(packets.filter((packet) => packet.lane === "cli")).slice(0, 5),
      ...shuffle(packets.filter((packet) => packet.lane === "portfolio")).slice(0, 5),
      ...shuffle(packets.filter((packet) => packet.lane === "team")).slice(0, 4),
      ...shuffle(packets.filter((packet) => packet.lane === "geo")).slice(0, 4),
    ];

    return shuffle(balanced).slice(0, size);
  }

  function getDefaultData() {
    return {
      commands: typeof commands === "undefined" ? window.commands : commands,
      help: typeof help === "undefined" ? window.help : help,
      portfolio: typeof portfolio === "undefined" ? window.portfolio : portfolio,
      team: typeof team === "undefined" ? window.team : team,
      whoisRoot: typeof whoisRoot === "undefined" ? window.whoisRoot : whoisRoot,
    };
  }

  function createGame(root, data = getDefaultData()) {
    const state = {
      deck: buildDeck(data),
      index: 0,
      score: 0,
      streak: 0,
      best: Number(window.localStorage.getItem("root-router-best") || 0),
      started: false,
      locked: false,
      dragStartX: 0,
      dragStartY: 0,
    };

    const nodes = {
      card: root.querySelector("[data-card]"),
      type: root.querySelector("[data-packet-type]"),
      title: root.querySelector("[data-packet-title]"),
      clue: root.querySelector("[data-packet-clue]"),
      chips: root.querySelector("[data-packet-chips]"),
      image: root.querySelector("[data-packet-image]"),
      terminal: root.querySelector("[data-packet-terminal]"),
      score: root.querySelector("[data-score]"),
      left: root.querySelector("[data-left]"),
      streak: root.querySelector("[data-streak]"),
      feedback: root.querySelector("[data-feedback]"),
      start: root.querySelector("[data-start-screen]"),
      end: root.querySelector("[data-end-screen]"),
      endScore: root.querySelector("[data-end-score]"),
      endBest: root.querySelector("[data-end-best]"),
    };

    function start() {
      state.deck = buildDeck(data);
      state.index = 0;
      state.score = 0;
      state.streak = 0;
      state.started = true;
      state.locked = false;
      nodes.start.classList.add("is-hidden");
      nodes.end.classList.add("is-hidden");
      setFeedback("Route the packet.", "");
      render();
    }

    function render() {
      const packet = state.deck[state.index];
      nodes.score.textContent = state.score;
      nodes.left.textContent = Math.max(state.deck.length - state.index, 0);
      nodes.streak.textContent = state.streak;
      nodes.card.classList.remove("is-correct", "is-wrong");
      nodes.card.style.transform = "";
      nodes.card.style.opacity = "1";

      if (!packet) {
        finish();
        return;
      }

      setFeedback("Route the packet.", "");
      nodes.type.textContent = packet.type;
      nodes.title.textContent = packet.title;
      nodes.clue.textContent = packet.clue;
      nodes.image.src = packet.image;
      nodes.image.alt = "";
      nodes.terminal.textContent = packet.terminal;
      nodes.chips.innerHTML = "";

      for (const chip of packet.chips) {
        const span = document.createElement("span");
        span.className = "packet-chip";
        span.textContent = chip;
        nodes.chips.appendChild(span);
      }
    }

    function choose(lane) {
      if (!state.started || state.locked) {
        return;
      }

      const packet = state.deck[state.index];
      const correct = packet.lane === lane;
      state.locked = true;

      if (correct) {
        state.streak += 1;
        state.score += 10 + Math.min(state.streak, 5) * 2;
        nodes.card.classList.add("is-correct");
        setFeedback(`Routed to ${LANES[lane].label}. +${10 + Math.min(state.streak, 5) * 2}`, "correct");
      } else {
        state.streak = 0;
        nodes.card.classList.add("is-wrong");
        setFeedback(LANES[packet.lane].miss, "wrong");
      }

      window.setTimeout(() => {
        state.index += 1;
        state.locked = false;
        render();
      }, 560);
    }

    function finish() {
      state.started = false;
      state.best = Math.max(state.best, state.score);
      window.localStorage.setItem("root-router-best", `${state.best}`);
      nodes.endScore.textContent = state.score;
      nodes.endBest.textContent = state.best;
      nodes.end.classList.remove("is-hidden");
    }

    function setFeedback(message, value) {
      nodes.feedback.textContent = message;
      nodes.feedback.dataset.state = value;
    }

    root.querySelectorAll("[data-lane]").forEach((button) => {
      button.addEventListener("click", () => choose(button.dataset.lane));
    });

    root.querySelectorAll("[data-start]").forEach((button) => {
      button.addEventListener("click", start);
    });

    nodes.card.addEventListener("pointerdown", (event) => {
      state.dragStartX = event.clientX;
      state.dragStartY = event.clientY;
    });

    nodes.card.addEventListener("pointerup", (event) => {
      const diffX = event.clientX - state.dragStartX;
      const diffY = event.clientY - state.dragStartY;
      if (Math.max(Math.abs(diffX), Math.abs(diffY)) < 54) {
        return;
      }
      if (Math.abs(diffX) > Math.abs(diffY)) {
        choose(diffX > 0 ? "portfolio" : "cli");
      } else {
        choose(diffY > 0 ? "geo" : "team");
      }
    });

    root.querySelector("[data-back]").addEventListener("click", () => {
      window.location.href = "index.html";
    });

    render();
    nodes.start.classList.remove("is-hidden");

    return { buildDeck: () => buildDeck(data), choose, start, state };
  }

  window.RootRouter = {
    buildDeck,
    createGame,
  };

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-root-router]");
    if (root) {
      createGame(root);
    }
  });
})();
