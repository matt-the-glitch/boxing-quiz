// Boxing Quiz — Sound Effects
(function () {
  const bell  = new Audio("sounds/bell.mp3");
  const cheer = new Audio("sounds/cheer.mp3");
  const boo   = new Audio("sounds/boo.mp3");

  // Preload
  bell.preload  = "auto";
  cheer.preload = "auto";
  boo.preload   = "auto";

  function play(audio, maxSeconds) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    if (maxSeconds) {
      setTimeout(() => { audio.pause(); audio.currentTime = 0; }, maxSeconds * 1000);
    }
  }

  window.SFX = {
    bell:  () => play(bell, 2.0),
    crowd: (positive) => play(positive ? cheer : boo, 2.0),
  };
})();
