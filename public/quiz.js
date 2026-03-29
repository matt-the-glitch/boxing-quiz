// === BOXING QUIZ — Main Logic ===

const state = {
  data: null,          // fighters.json
  playerName: "",
  nickname: null,      // { prefix, fullName }
  fights: [],          // shuffled fight queue
  currentIndex: 0,
  streak: 0,
  gameOver: false,
  swapped: false,      // true = left/right positions swapped for current fight
  quotes: [],          // shuffled quotes queue
  quoteIndex: 0,
};

// === BOXING QUOTES ===

const QUOTES = [
  { text: "Float like a butterfly, sting like a bee.", author: "Muhammad Ali" },
  { text: "I am the greatest.", author: "Muhammad Ali" },
  { text: "The fight is won or lost far away from witnesses.", author: "Muhammad Ali" },
  { text: "It's hard to be humble when you're as great as I am.", author: "Muhammad Ali" },
  { text: "He can run, but he can't hide.", author: "Joe Louis" },
  { text: "Once that bell rings, you're on your own.", author: "Joe Louis" },
  { text: "Everybody wants to go to heaven, but nobody wants to die.", author: "Joe Louis" },
  { text: "A champion is someone who gets up when he can't.", author: "Jack Dempsey" },
  { text: "Why waltz with a guy for ten rounds if you can knock him out in one?", author: "Rocky Marciano" },
  { text: "Everybody has a plan until they get punched in the mouth.", author: "Mike Tyson" },
  { text: "Discipline is doing what you hate to do, but doing it like you love it.", author: "Mike Tyson" },
  { text: "A champion shows who he is by what he does when he's tested.", author: "Evander Holyfield" },
  { text: "It's not the size of the man, it's the size of his heart.", author: "Evander Holyfield" },
  { text: "In boxing you create a strategy to beat each new opponent. Just like chess.", author: "Lennox Lewis" },
  { text: "You don't play boxing.", author: "Sugar Ray Leonard" },
  { text: "I'm on top of the world, baby!", author: "Tyson Fury" },
  { text: "Physical pain is temporary.", author: "Oleksandr Usyk" },
  { text: "Stay hungry, stay humble.", author: "Anthony Joshua" },
  { text: "The hero and the coward both feel the same fear. Heroes just react differently.", author: "Cus D'Amato" },
  { text: "Fear is like fire. You can make it work for you.", author: "Cus D'Amato" },
  { text: "The punch that knocks you out is the punch you don't see.", author: "Cus D'Amato" },
  { text: "To see a man beaten not by a better opponent but by himself is a tragedy.", author: "Cus D'Amato" },
  { text: "Let's get ready to rumble!", author: "Michael Buffer" },
  { text: "Boxing is like jazz. The better it is, the less people appreciate it.", author: "George Foreman" },
  { text: "My punches are just as hard in Chicago as in New York.", author: "Sonny Liston" },
  { text: "If I didn't think I was gonna win, why the hell would I be fighting?", author: "Rocky Marciano" },
  { text: "Don't quit. Suffer now and live the rest of your life as a champion.", author: "Muhammad Ali" },
  { text: "You can't win if you're afraid to lose.", author: "Rocky Marciano" },
  { text: "It's not rage that drives me. It's competition.", author: "Lennox Lewis" },
  { text: "The biggest motivation is my desire to be the best.", author: "Oleksandr Usyk" },
];

// === INIT ===

async function init() {
  try {
    const res = await fetch("data/fighters.json");
    state.data = await res.json();
  } catch (err) {
    console.error("Failed to load fighters.json:", err);
    return;
  }

  // Screen: Intro
  document.getElementById("btn-to-name").addEventListener("click", () => {
    showScreen("screen-name");
    document.getElementById("player-name").focus();
  });

  // Screen: Name entry
  const nameInput = document.getElementById("player-name");
  const btnStart = document.getElementById("btn-start");

  nameInput.addEventListener("input", () => {
    const name = nameInput.value.trim();
    state.playerName = name;
    updateNicknamePreview(name);
    btnStart.disabled = name.length === 0;
  });

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && state.playerName.length > 0) {
      startGame();
    }
  });

  btnStart.addEventListener("click", startGame);

  // Screen: Quiz
  document.getElementById("fighter1").addEventListener("click", () => handleAnswer(1));
  document.getElementById("fighter2").addEventListener("click", () => handleAnswer(2));

  document.getElementById("fighter1").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleAnswer(1); }
  });
  document.getElementById("fighter2").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleAnswer(2); }
  });

  document.getElementById("btn-next").addEventListener("click", nextFight);

  // Screen: Result
  document.getElementById("btn-restart").addEventListener("click", restartGame);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (document.getElementById("screen-quiz").classList.contains("active")) {
      if (e.key === "1" || e.key === "ArrowLeft") handleAnswer(1);
      if (e.key === "2" || e.key === "ArrowRight") handleAnswer(2);
      if (e.key === "Enter") {
        if (!document.getElementById("feedback").classList.contains("hidden")) {
          nextFight();
        }
      }
    }
    // Enter on intro screen
    if (document.getElementById("screen-intro").classList.contains("active")) {
      if (e.key === "Enter") {
        showScreen("screen-name");
        document.getElementById("player-name").focus();
      }
    }
  });

  // Load leaderboard for result screen
  await loadLeaderboard();
}

// === NICKNAME SYSTEM ===

function pickNickname(name) {
  if (!state.data || !name) return null;
  const nicknames = state.data.nicknames;
  // Deterministic pick based on name (same name = same nickname)
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % nicknames.length;
  const nick = nicknames[index];
  return {
    prefix: nick.prefix,
    fullName: `${nick.prefix} ${name}`.toUpperCase(),
  };
}

function updateNicknamePreview(name) {
  const preview = document.getElementById("nickname-preview");
  if (!name) {
    preview.textContent = "";
    state.nickname = null;
    return;
  }
  state.nickname = pickNickname(name);
  preview.textContent = state.nickname.fullName;
}

// === QUOTES ===

function getNextQuote() {
  if (state.quotes.length === 0 || state.quoteIndex >= state.quotes.length) {
    state.quotes = shuffleArray([...QUOTES]);
    state.quoteIndex = 0;
  }
  return state.quotes[state.quoteIndex++];
}

function showQuote() {
  const quote = getNextQuote();
  const bar = document.getElementById("quote-bar");
  document.getElementById("quote-text").textContent = `"${quote.text}"`;
  document.getElementById("quote-author").textContent = `— ${quote.author}`;
  bar.classList.remove("hidden");
  // Re-trigger animation
  bar.style.animation = "none";
  bar.offsetHeight; // force reflow
  bar.style.animation = "";
}

// === GAME FLOW ===

function startGame() {
  if (!state.playerName) return;

  // Show splash screen
  document.getElementById("splash-name").textContent = state.nickname.fullName;
  showScreen("screen-splash");

  // After splash, start quiz
  setTimeout(() => {
    // Shuffle fights and quotes
    state.fights = shuffleArray([...state.data.fights]);
    state.quotes = shuffleArray([...QUOTES]);
    state.quoteIndex = 0;
    state.currentIndex = 0;
    state.streak = 0;
    state.gameOver = false;

    showScreen("screen-quiz");
    showQuote();
    showFight();
  }, 1500);
}

function restartGame() {
  showScreen("screen-name");
  document.getElementById("player-name").focus();
}

function showFight() {
  const fight = state.fights[state.currentIndex];
  if (!fight) {
    // All fights answered correctly — champion!
    endGame(true);
    return;
  }

  const f1 = state.data.fighters[fight.fighter1];
  const f2 = state.data.fighters[fight.fighter2];

  // Randomly swap left/right positions
  state.swapped = Math.random() < 0.5;

  const leftFighter = state.swapped ? f2 : f1;
  const rightFighter = state.swapped ? f1 : f2;

  // Update streak display
  document.getElementById("streak").textContent = `STREAK: ${state.streak}`;

  // Display fighters in randomized positions
  setFighterDisplay("fighter1", leftFighter);
  setFighterDisplay("fighter2", rightFighter);

  // VS center
  document.getElementById("fight-year").textContent = fight.year;
  const fightNumEl = document.getElementById("fight-number");
  if (fight.fightNum && fight.totalFights) {
    fightNumEl.textContent = `Fight ${fight.fightNum}/${fight.totalFights}`;
  } else {
    fightNumEl.textContent = "";
  }

  // Reset state
  const f1El = document.getElementById("fighter1");
  const f2El = document.getElementById("fighter2");
  f1El.className = "fighter-side fighter-left";
  f2El.className = "fighter-side fighter-right";

  document.getElementById("feedback").classList.add("hidden");
  document.getElementById("feedback").className = "feedback hidden";
}

function setFighterDisplay(sideId, fighter) {
  const img = document.getElementById(`${sideId}-img`);
  const placeholder = document.getElementById(`${sideId}-placeholder`);
  const nameEl = document.getElementById(`${sideId}-name`);

  nameEl.textContent = fighter.name;

  if (fighter.image) {
    img.src = fighter.image;
    img.alt = fighter.name;
    img.style.display = "block";
    placeholder.classList.add("hidden");

    img.onload = () => img.classList.add("loaded");
    img.onerror = () => {
      img.style.display = "none";
      placeholder.classList.remove("hidden");
    };
  } else {
    img.style.display = "none";
    placeholder.classList.remove("hidden");
  }
}

// === ANSWER HANDLING ===

function handleAnswer(choice) {
  if (state.gameOver) return;

  const fight = state.fights[state.currentIndex];
  if (!fight) return;

  const f1El = document.getElementById("fighter1");
  const f2El = document.getElementById("fighter2");

  // Prevent double-click
  if (f1El.classList.contains("disabled")) return;

  // Map click position back to actual fighter
  let actualChoice;
  if (state.swapped) {
    actualChoice = choice === 1 ? 2 : 1;
  } else {
    actualChoice = choice;
  }
  const correct = actualChoice === fight.winner;
  const winnerFighter = fight.winner === 1 ? state.data.fighters[fight.fighter1] : state.data.fighters[fight.fighter2];
  const winnerSide = (fight.winner === 1) !== state.swapped ? 1 : 2;

  // Visual feedback
  f1El.classList.add("disabled");
  f2El.classList.add("disabled");

  // Hide quote during feedback
  document.getElementById("quote-bar").classList.add("hidden");

  if (correct) {
    state.streak++;
    document.getElementById("streak").textContent = `STREAK: ${state.streak}`;

    const chosenEl = choice === 1 ? f1El : f2El;
    chosenEl.classList.add("selected-correct");

    showFeedback(true, fight, winnerFighter);
  } else {
    state.gameOver = true;

    const chosenEl = choice === 1 ? f1El : f2El;
    const correctEl = winnerSide === 1 ? f1El : f2El;
    chosenEl.classList.add("selected-wrong");
    correctEl.classList.add("was-correct");

    showFeedback(false, fight, winnerFighter);
  }
}

function showFeedback(correct, fight, winner) {
  const feedback = document.getElementById("feedback");
  const feedbackText = document.getElementById("feedback-text");
  const feedbackDetail = document.getElementById("feedback-detail");
  const btnNext = document.getElementById("btn-next");

  feedback.classList.remove("hidden", "correct", "wrong");
  feedback.classList.add(correct ? "correct" : "wrong");

  if (correct) {
    feedbackText.textContent = "CORRECT!";
    feedbackText.style.color = "var(--correct)";
  } else {
    feedbackText.textContent = "WRONG!";
    feedbackText.style.color = "var(--wrong)";
  }

  // Build detail text
  let detail = `${winner.name} won`;
  if (fight.method === "KO" || fight.method === "TKO" || fight.method === "RTD") {
    detail += ` by ${fight.method} in round ${fight.round}`;
  } else if (fight.method === "DQ") {
    detail += ` by disqualification in round ${fight.round}`;
  } else {
    detail += ` by ${fight.method}`;
  }
  feedbackDetail.textContent = detail;

  if (correct) {
    btnNext.textContent = "NEXT FIGHT";
  } else {
    btnNext.textContent = "SEE RESULTS";
  }
}

function nextFight() {
  if (state.gameOver) {
    endGame(false);
    return;
  }

  state.currentIndex++;
  showQuote();
  showFight();
}

// === END GAME ===

async function endGame(allCorrect) {
  const score = state.streak;

  // Set result text
  if (allCorrect) {
    document.getElementById("result-title").textContent = "UNDISPUTED CHAMPION!";
  } else if (score >= 50) {
    document.getElementById("result-title").textContent = "WORLD CLASS!";
  } else if (score >= 30) {
    document.getElementById("result-title").textContent = "CONTENDER!";
  } else if (score >= 15) {
    document.getElementById("result-title").textContent = "PROMISING FIGHTER!";
  } else if (score >= 5) {
    document.getElementById("result-title").textContent = "AMATEUR!";
  } else {
    document.getElementById("result-title").textContent = "KNOCKOUT!";
  }

  document.getElementById("result-score").textContent =
    `${state.nickname.fullName}: ${score} CORRECT`;

  if (allCorrect) {
    document.getElementById("result-detail").textContent =
      `Perfect run! All ${state.data.fights.length} fights answered correctly.`;
  } else {
    document.getElementById("result-detail").textContent =
      `Your streak ended at ${score}.`;
  }

  showScreen("screen-result");

  // Submit score to leaderboard
  await submitScore(state.nickname.fullName, score);
  await loadLeaderboard(score);
}

// === LEADERBOARD ===

async function loadLeaderboard(highlightScore) {
  const list = document.getElementById("leaderboard-list");

  try {
    const res = await fetch("/.netlify/functions/leaderboard");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const entries = await res.json();

    if (!entries || entries.length === 0) {
      list.innerHTML = '<li class="leaderboard-empty">No entries yet. Be the first!</li>';
      return;
    }

    list.innerHTML = entries.map((entry, i) => {
      const isHighlight = highlightScore !== undefined &&
        entry.name === state.nickname?.fullName &&
        entry.score === highlightScore;
      return `<li class="${isHighlight ? "highlight" : ""}">
        <span class="lb-name">${escapeHtml(entry.name)}</span>
        <span class="lb-score">${entry.score}</span>
      </li>`;
    }).join("");
  } catch (err) {
    console.warn("Leaderboard unavailable:", err.message);
    list.innerHTML = '<li class="leaderboard-empty">Leaderboard offline</li>';
  }
}

async function submitScore(name, score) {
  try {
    await fetch("/.netlify/functions/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score }),
    });
  } catch (err) {
    console.warn("Could not submit score:", err.message);
  }
}

// === UTILITIES ===

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// === START ===
init();
