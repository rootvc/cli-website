function RickRoll() {
    const Prefiltered = document.querySelectorAll(`span.xterm-bold.xterm-fg-13`);
    const RickRollPaste_EL = [];
    for (let i = 0; i < Prefiltered.length; i++) {
      if (Prefiltered[i].innerText == 'nf134bf139b') {
        RickRollPaste_EL.push(Prefiltered[i]);
      } else if (Prefiltered[i].innerText == 'dn19BRXub191') {
        Prefiltered[i].style.color = 'transparent'
      }
    }
    console.log(RickRollPaste_EL);
    RickRollPaste_EL.forEach((rickroll) => {
      if (!rickroll.querySelector('video')) {
        var video = document.createElement('video');
        video.src = './videos/rickroll.mp4';
        video.autoplay = true;
        video.loop = true;
        rickroll.appendChild(video);
        rickroll.style.height = '720px';
        // rickroll.parentElement.style.position = 'absolute';
        // rickroll.parentElement.style.height = '720px';
        rickroll.style.color = 'transparent'
        rickroll.style.display = 'flex';
        rickroll.style.position = 'absolute'
        video.style.position = 'absolute';
      }
    });
  }