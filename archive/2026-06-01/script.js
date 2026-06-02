// ROOT-2015 instruction manual — progressive enhancement only.
// All anchor facts are in the static HTML. This file adds:
//   1) A live sheet counter in the top-right corner mark.
//   2) A subtle "crinkle" hover state on parts (CSS-driven via class).
// JSDOM safe: every API used has a JSDOM impl; no observers, no network.

(function () {
  if (typeof document === "undefined") return;

  // Sheet counter: update the top-right corner mark while the visitor scrolls.
  var sheets = document.querySelectorAll(".sheet");
  if (!sheets || sheets.length === 0) return;

  function nearestSheet() {
    var best = null;
    var bestDist = Infinity;
    var anchor = window.scrollY + 80;
    for (var i = 0; i < sheets.length; i++) {
      var top = sheets[i].offsetTop;
      var d = Math.abs(top - anchor);
      if (d < bestDist) { bestDist = d; best = sheets[i]; }
    }
    return best;
  }

  function updateMark() {
    var current = nearestSheet();
    if (!current) return;
    document.body.setAttribute("data-current-sheet", current.id || "");
  }

  // throttle via rAF
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateMark();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  updateMark();

  // Tiny easter egg: clicking the cover wordmark toggles a stamp class.
  var mark = document.querySelector(".wordmark");
  if (mark) {
    mark.addEventListener("click", function () {
      document.body.classList.toggle("stamped");
    });
  }
})();
