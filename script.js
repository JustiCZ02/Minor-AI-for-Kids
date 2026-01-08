// Storage keys
const STORAGE_KEYS = {
  basics: "adc-quiz-basics",
  privacy: "adc-quiz-privacy",
  modules: "adc-modules",
  theme: "adc-theme"
};

const totalModules = 5;

// Helpers to read/write JSON safely
const readStore = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const moduleFlowSection = document.getElementById("moduleFlow");
if (moduleFlowSection) {
  const steps = Array.from(document.querySelectorAll(".module-step")).filter((s) => s.dataset.step !== "complete");
  const completionStep = document.querySelector('.module-step[data-step="complete"]');
  const progressText = document.getElementById("moduleProgressText");
  let currentStep = 1;

  const showStep = (stepNumber) => {
    currentStep = stepNumber;
    steps.forEach((stepEl) => {
      stepEl.classList.toggle("app-hidden", Number(stepEl.dataset.step) !== stepNumber);
    });
    if (completionStep) completionStep.classList.add("app-hidden");
    if (progressText) progressText.textContent = `Step ${stepNumber} of ${steps.length}`;
  };

  showStep(1);

  document.querySelectorAll(".module-next").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = Math.min(currentStep + 1, steps.length);
      showStep(next);
    });
  });

  document.querySelectorAll(".module-back").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prev = Math.max(currentStep - 1, 1);
      showStep(prev);
    });
  });

  const finishBtn = document.querySelector(".module-finish");
  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      steps.forEach((s) => s.classList.add("app-hidden"));
      if (completionStep) completionStep.classList.remove("app-hidden");
      if (progressText) progressText.textContent = "Step 6 of 6";
    });
  }
}

// Module expand/collapse and completion
const moduleCards = document.querySelectorAll('.module[data-module]');
let moduleProgress = readStore(STORAGE_KEYS.modules, {});

moduleCards.forEach((card) => {
  const toggleBtn = card.querySelector(".module__toggle");
  const extra = card.querySelector(".module__extra");
  const doneBtn = card.querySelector(".module__complete");
  const id = card.dataset.module;
  if (!toggleBtn || !extra || !doneBtn || !id) return;

  toggleBtn.addEventListener("click", () => {
    extra.classList.toggle("show");
    toggleBtn.textContent = extra.classList.contains("show") ? "Read less" : "Read more";
  });

  doneBtn.addEventListener("click", () => {
    moduleProgress[id] = true;
    updateModuleUI(card, true);
    writeStore(STORAGE_KEYS.modules, moduleProgress);
    updateProgressCard();
  });

  if (moduleProgress[id]) updateModuleUI(card, true);
});

function updateModuleUI(card, completed) {
  const check = card.querySelector(".module__check");
  const button = card.querySelector(".module__complete");
  if (completed) {
    check.style.display = "inline";
    button.textContent = "Completed";
    button.setAttribute("aria-pressed", "true");
    button.disabled = true;
  }
}

// Module visibility modes (step-by-step vs all)
const moduleModeButtons = document.querySelectorAll("[data-module-mode]");
const moduleSections = document.querySelectorAll(".page--modules .module");
const moduleSectionsArr = Array.from(moduleSections);
const moduleNextButtons = Array.from(document.querySelectorAll(".module__next"));
let moduleDisplayMode = "sequence";

const revealNextModule = (event) => {
  if (moduleDisplayMode !== "sequence") return;
  const currentModule = event.currentTarget.closest(".module");
  const index = moduleSectionsArr.indexOf(currentModule);
  const nextModule = moduleSectionsArr[index + 1];
  if (!nextModule) return;
  event.preventDefault();
  if (nextModule) {
    nextModule.classList.remove("app-hidden");
    nextModule.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

if (moduleModeButtons.length && moduleSectionsArr.length) {
  moduleNextButtons.forEach((btn) => btn.addEventListener("click", revealNextModule));

  const applyMode = (mode) => {
    moduleDisplayMode = mode;
    moduleModeButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.moduleMode === mode));

    if (mode === "sequence") {
      moduleSectionsArr.forEach((section, idx) => section.classList.toggle("app-hidden", idx !== 0));
      moduleNextButtons.forEach((btn) => btn.classList.remove("app-hidden"));
    } else {
      moduleSectionsArr.forEach((section) => section.classList.remove("app-hidden"));
      moduleNextButtons.forEach((btn) => btn.classList.add("app-hidden"));
    }
  };

  moduleModeButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyMode(btn.dataset.moduleMode));
  });

  applyMode("sequence");
}

// Quiz logic: selection + grading
const quizzes = document.querySelectorAll(".quiz");
quizzes.forEach((quiz) => {
  quiz.querySelectorAll(".option").forEach((opt) => {
    opt.addEventListener("click", () => {
      const question = opt.closest(".quiz__question");
      question.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");
    });
  });

  quiz.querySelector(".quiz__check").addEventListener("click", () => {
    const score = gradeQuiz(quiz);
    const total = quiz.querySelectorAll(".quiz__question").length;
    const message = score >= 4 ? "Great job, AI explorer!" : score >= 2 ? "Nice try, keep learning!" : "No worries, try again!";
    quiz.querySelector(".quiz__score").textContent = `Score: ${score} / ${total} — ${message}`;

    const key = quiz.id === "quiz-basics" ? STORAGE_KEYS.basics : STORAGE_KEYS.privacy;
    writeStore(key, score);
    updateProgressCard();
  });
});

function gradeQuiz(quiz) {
  let score = 0;
  quiz.querySelectorAll(".quiz__question").forEach((q) => {
    const correct = q.dataset.answer;
    q.querySelectorAll(".option").forEach((o) => o.classList.remove("correct", "incorrect"));
    const chosen = q.querySelector(".option.selected");
    q.querySelector(`.option[data-option="${correct}"]`).classList.add("correct");
    if (chosen) {
      if (chosen.dataset.option === correct) score += 1;
      else chosen.classList.add("incorrect");
    }
  });
  return score;
}

// Progress card display
function updateProgressCard() {
  const basicsEl = document.getElementById("progressBasics");
  const privacyEl = document.getElementById("progressPrivacy");
  const modulesEl = document.getElementById("progressModules");
  if (!basicsEl || !privacyEl || !modulesEl) return;
  const basicsScore = readStore(STORAGE_KEYS.basics, 0);
  const privacyScore = readStore(STORAGE_KEYS.privacy, 0);
  const moduleCount = Object.keys(readStore(STORAGE_KEYS.modules, {})).length;
  basicsEl.textContent = `${basicsScore}/5`;
  privacyEl.textContent = `${privacyScore}/5`;
  modulesEl.textContent = `${moduleCount}/${totalModules}`;
}
updateProgressCard();

// Data Detective mini-game
const decisions = { camera: null, contacts: null, location: null, notifications: null };
const resultBox = document.getElementById("challengeResult");
const summaryBtn = document.getElementById("showSummary");

if (summaryBtn && resultBox) {
  document.querySelectorAll(".challenge__permission button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wrap = btn.closest(".challenge__permission");
      const key = wrap.dataset.key;
      const choice = btn.dataset.choice;
      decisions[key] = choice;
      const status = wrap.querySelector(".status");
      status.textContent = choice === "allow" ? "Allowed" : "Denied";
      status.style.color = choice === "allow" ? "#22c55e" : "#ef4444";
    });
  });

  summaryBtn.addEventListener("click", () => {
    const safeChoices = [];
    const riskyChoices = [];
    Object.entries(decisions).forEach(([key, value]) => {
      if (value === null) return riskyChoices.push(`${key} not decided yet`);
      if (key === "contacts" || key === "location") {
        value === "deny" ? safeChoices.push(key) : riskyChoices.push(key);
      } else if (key === "camera" || key === "notifications") {
        value === "allow" ? safeChoices.push(key) : riskyChoices.push(key);
      }
    });

    const tips = [
      "Only allow what the app truly needs.",
      "Contacts and precise location are sensitive.",
      "You can change permissions later in settings.",
      "Pause before tapping allow on every pop-up."
    ];
    const safeText = safeChoices.length ? `Safer choices: ${safeChoices.join(", ")}.` : "No safe choices yet.";
    const riskText = riskyChoices.length ? `Needs care: ${riskyChoices.join(", ")}.` : "Nice! No risky picks.";
    resultBox.textContent = `${safeText} ${riskText} ${tips[Math.floor(Math.random() * tips.length)]}`;
  });
}

// Back to top visibility + action
const backToTop = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
  backToTop.style.display = window.scrollY > 300 ? "inline-flex" : "none";
});
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Reveal cards on scroll
const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
  { threshold: 0.2 }
);
document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));

// Theme toggle with persistence
const themeToggle = document.getElementById("themeToggle");
const savedTheme = readStore(STORAGE_KEYS.theme, "light");
setTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("theme-dark") ? "light" : "dark";
  setTheme(nextTheme);
  writeStore(STORAGE_KEYS.theme, nextTheme);
});

function setTheme(mode) {
  document.body.classList.toggle("theme-dark", mode === "dark");
  document.body.classList.toggle("theme-light", mode === "light");
  themeToggle.textContent = mode === "dark" ? "🌙 Dark" : "🌞 Light";
}

// Mascot facts
const mascot = document.getElementById("mascot");
const bubble = document.getElementById("mascotBubble");

const fallbackFacts = [
  "Remember to check your app permissions!",
  "AI learns from data, including yours.",
  "Stay curious and question results.",
  "Take breaks when scrolling for a long time."
];

let facts = null;

const loadFactsOnce = async () => {
  if (facts) return;
  try {
    const res = await fetch("FactsRobot.json");
    if (!res.ok) throw new Error("FactsRobot load failed");
    const data = await res.json();
    if (Array.isArray(data.ai_fun_facts) && data.ai_fun_facts.length) {
      facts = data.ai_fun_facts;
      return;
    }
  } catch (err) {
    // Fall back to defaults.
  }
  facts = fallbackFacts;
};

const showRandomFact = async () => {
  if (!bubble) return;
  await loadFactsOnce();
  const pool = facts && facts.length ? facts : fallbackFacts;
  bubble.textContent = pool[Math.floor(Math.random() * pool.length)];
  bubble.classList.add("show");
  setTimeout(() => bubble.classList.remove("show"), 3500);
};

if (mascot && bubble) {
  mascot.addEventListener("click", showRandomFact);
  mascot.addEventListener("keypress", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      showRandomFact();
    }
  });
}
// Satisfying click sound using Web Audio
const hoverSoundEnabled = true;
let audioCtx;

const playHoverSound = () => {
  if (!hoverSoundEnabled) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // Klik-achtig geluid (kort, diep, strak)
  osc.type = "soft click";
  osc.frequency.setValueAtTime(180, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    60,
    audioCtx.currentTime + 0.05
  );

  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 0.06
  );

  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.06);
};


document.querySelectorAll(".btn, .card").forEach((el) => {
  el.addEventListener("mouseenter", playHoverSound, { once: false });
});

// Bring focus outlines when using keyboard
document.body.addEventListener("keydown", (e) => {
  if (e.key === "Tab") document.body.classList.add("user-is-tabbing");
});


