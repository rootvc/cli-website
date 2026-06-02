// K6RVC operating-sheet enhancement layer. Static log lives in the HTML —
// this just keeps the session clock ticking and lets you press Enter on a row
// to highlight it (a la a paper logbook getting a fresh check mark).
//
// No network calls. No dynamic facts. Pure visual polish.

(function () {
  "use strict";

  // 1) Live UTC clock in the session block (purely cosmetic; the date in the
  //    header is the canonical record-of-the-day).
  var sessionValues = document.querySelectorAll(".session-block .value");
  if (sessionValues.length > 0) {
    var clockEl = document.createElement("div");
    clockEl.className = "value live-clock";
    clockEl.setAttribute("aria-hidden", "true");
    sessionValues[0].parentNode.insertBefore(clockEl, sessionValues[0].nextSibling);

    var tick = function () {
      var now = new Date();
      var hh = String(now.getUTCHours()).padStart(2, "0");
      var mm = String(now.getUTCMinutes()).padStart(2, "0");
      var ss = String(now.getUTCSeconds()).padStart(2, "0");
      clockEl.textContent = "LOCAL UTC NOW: " + hh + ":" + mm + ":" + ss + "Z";
    };
    tick();
    setInterval(tick, 1000);
  }

  // 2) Click a QSO row to toggle a 'check mark' style — like initialing the
  //    paper log when you confirm copy. Survives the page session only.
  var rows = document.querySelectorAll(".qso-table tbody tr");
  for (var i = 0; i < rows.length; i++) {
    (function (row) {
      row.style.cursor = "pointer";
      row.title = "Click to mark confirmed";
      row.addEventListener("click", function () {
        var on = row.getAttribute("data-confirmed") === "1";
        if (on) {
          row.style.background = "";
          row.removeAttribute("data-confirmed");
          var t = row.querySelector(".c-time");
          if (t && t.textContent.indexOf("\u2713 ") === 0) {
            t.textContent = t.textContent.slice(2);
          }
        } else {
          row.style.background = "rgba(255, 220, 120, 0.5)";
          row.setAttribute("data-confirmed", "1");
          var t2 = row.querySelector(".c-time");
          if (t2 && t2.textContent.indexOf("\u2713 ") !== 0) {
            t2.textContent = "\u2713 " + t2.textContent;
          }
        }
      });
    })(rows[i]);
  }
})();
