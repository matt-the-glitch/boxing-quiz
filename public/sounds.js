// Boxing Quiz — Sound Effects
(function () {
  const bell  = new Audio("sounds/bell.mp3");
  const cheer = new Audio("sounds/cheer.mp3");
  const boo   = new Audio("sounds/boo.mp3");

  [bell, cheer, boo].forEach(a => { a.preload = "auto"; });

  // iOS requires audio to be "unlocked" via a direct user gesture.
  // Play all sounds silently on first touch/click so they work in setTimeout later.
  function unlock() {
    [bell, cheer, boo].forEach(a => {
      a.volume = 0;
      a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = 1; }).catch(() => {});
    });
  }
  document.addEventListener("touchstart", unlock, { once: true });
  document.addEventListener("click",      unlock, { once: true });

  function play(audio, maxSeconds) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    if (maxSeconds) {
      setTimeout(() => { audio.pause(); audio.currentTime = 0; }, maxSeconds * 1000);
    }
  }

  window.SFX = {
    bell:  () => play(bell,  2.0),
    crowd: (pos) => play(pos ? cheer : boo, 2.0),
  };
})();
