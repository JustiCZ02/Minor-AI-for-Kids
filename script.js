// Storage keys
const STORAGE_KEYS = {
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

const facts = [
  "AI doesn't know anything until you ask it a question.",
  "AI predicts words one by one; it doesn't plan a full sentence in advance.",
  "AI can write a poem without knowing what a poem feels like.",
  "AI can sound confident even when it is guessing.",
  "AI has no memory of yesterday unless it is designed to remember.",
  "AI does not understand jokes - it recognizes joke patterns.",
  "AI has never seen the world, only data about it.",
  "AI does not get bored, tired, or distracted.",
  "AI does not know what is important unless humans tell it.",
  "AI can explain things without understanding them.",
  "AI does not know if something is funny unless people laughed at similar things before.",
  "AI has no favorite color, song, or movie.",
  "AI cannot learn from mistakes unless humans retrain it.",
  "AI can generate ideas faster than humans, but not judge them better.",
  "AI does not know what common sense is.",
  "AI can describe emotions without ever feeling them.",
  "AI does not know who is using it unless information is shared.",
  "AI cannot tell if something is a good or bad idea by itself.",
  "AI has no goals of its own.",
  "AI does not understand time like humans do.",
  "AI can make mistakes that sound very convincing.",
  "AI cannot tell if something is real or fake unless trained to.",
  "AI does not understand consequences.",
  "AI cannot take responsibility for decisions.",
  "AI does not know when it is wrong.",
  "AI has no awareness of the real world.",
  "AI does not understand rules unless they are written down.",
  "AI can mix ideas together but cannot invent from nothing.",
  "AI cannot recognize sarcasm reliably.",
  "AI does not understand context the way humans do.",
  "AI can help with homework, but it cannot learn for you.",
  "AI does not know what privacy is unless programmed to respect it.",
  "AI cannot verify facts unless it checks sources.",
  "AI does not understand why something matters to you.",
  "AI can copy writing styles without knowing the author.",
  "AI does not know what \"too much\" means.",
  "AI has no intuition.",
  "AI does not know what it does not know.",
  "AI cannot decide what is right or wrong.",
  "AI does not replace human judgment."
];

const showRandomFact = () => {
  if (!bubble) return;
  bubble.textContent = facts[Math.floor(Math.random() * facts.length)];
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



