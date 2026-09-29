/* Run the TUI as a full-screen command without replacing the CLI session. */
(() => {
  let frame;
  let background = [];
  const session = { active: false };
  window.rootTui = session;
  window.openRootTui = () => {
    if (session.active) {
      frame.focus();
      return;
    }
    const terminal = document.getElementById("terminal");
    frame = document.createElement("iframe");
    frame.className = "tui-session";
    frame.title = "Root Ventures TUI";
    frame.src = "/tui.html";
    frame.addEventListener("load", () => {
      if (session.active && frame?.contentWindow) {
        frame.contentWindow.focus();
        frame.contentDocument.querySelector(".menu-item.selected")?.focus();
      }
    });
    session.active = true;
    background = [...document.body.children].map((element) => [
      element,
      Boolean(element.inert),
    ]);
    background.forEach(([element]) => {
      element.inert = true;
    });
    terminal.style.visibility = "hidden";
    document.body.append(frame);
    frame.focus();
  };
  window.addEventListener("message", (event) => {
    if (
      !frame ||
      event.source !== frame.contentWindow ||
      event.origin !== location.origin ||
      event.data?.type !== "root-tui-exit"
    )
      return;
    frame.remove();
    frame = null;
    session.active = false;
    const terminal = document.getElementById("terminal");
    background.forEach(([element, wasInert]) => {
      element.inert = wasInert;
    });
    background = [];
    terminal.style.visibility = "";
    window.fitAddon.fit();
    window.term.focus();
  });
})();
