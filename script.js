// Storage keys
const STORAGE_KEYS = {
  modules: "adc-modules",
  theme: "adc-theme"
};

const UI_CONSTANTS = {
  backToTopScrollY: 300,
  mascotDisplayMs: 3500,
  revealThreshold: 0.2
};

const STORE_VALIDATORS = {
  [STORAGE_KEYS.modules]: (value) => value && typeof value === "object" && !Array.isArray(value),
  [STORAGE_KEYS.theme]: (value) => typeof value === "string"
};

// Helpers to read/write JSON safely
const readStore = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (value === null || value === undefined) return fallback;
    const validator = STORE_VALIDATORS[key];
    if (validator && !validator(value)) return fallback;
    return value;
  } catch {
    return fallback;
  }
};
const writeStore = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save localStorage key:", key, error);
  }
};

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
const aiMentorCard = document.getElementById("aiMentorCard");
const aiMentorLink = aiMentorCard ? aiMentorCard.querySelector(".module__mentor") : null;
const resetProgressBtn = document.getElementById("resetProgress");
const finalProgressBar = document.getElementById("finalProgressBar");
const finalProgressValue = document.getElementById("finalProgressValue");

const updateMentorLock = () => {
  if (!aiMentorCard || !aiMentorLink || !moduleCards.length) return;
  const completedCount = Array.from(moduleCards).filter((card) => moduleProgress[card.dataset.module]).length;
  const unlocked = completedCount === moduleCards.length;
  const progressPct = Math.round((completedCount / moduleCards.length) * 100);
  if (finalProgressBar) finalProgressBar.style.width = `${progressPct}%`;
  if (finalProgressValue) finalProgressValue.textContent = `${completedCount}/${moduleCards.length}`;
  aiMentorLink.textContent = "Start final test";
  if (unlocked) {
    if (finalProgressBar) finalProgressBar.closest(".final-progress").style.display = "none";
    aiMentorLink.setAttribute("href", aiMentorLink.dataset.mentorHref || "../ai-mentor.html");
    aiMentorLink.removeAttribute("aria-disabled");
    aiMentorCard.classList.remove("module--locked");
    aiMentorLink.style.display = "inline-flex";
  } else {
    if (finalProgressBar) finalProgressBar.closest(".final-progress").style.display = "block";
    aiMentorLink.setAttribute("href", "javascript:void(0)");
    aiMentorLink.setAttribute("aria-disabled", "true");
    aiMentorCard.classList.add("module--locked");
    aiMentorLink.style.display = "none";
  }
};

moduleCards.forEach((card) => {
  const toggleBtn = card.querySelector(".module__toggle");
  const extra = card.querySelector(".module__extra");
  const doneBtn = card.querySelector(".module__complete");
  const badge = card.querySelector(".module__badge");
  const id = card.dataset.module;
  if (!id) return;

  const markComplete = () => {
    moduleProgress[id] = true;
    updateModuleUI(card, true);
    if (badge) badge.classList.add("is-complete");
    writeStore(STORAGE_KEYS.modules, moduleProgress);
    updateMentorLock();
  };

  if (toggleBtn && extra) {
    toggleBtn.addEventListener("click", () => {
      extra.classList.toggle("show");
      toggleBtn.textContent = extra.classList.contains("show") ? "Read less" : "Read more";
    });
  }

  if (doneBtn) {
    doneBtn.addEventListener("click", () => {
      markComplete();
    });
  }

  if (badge) {
    badge.addEventListener("click", () => {
      if (moduleProgress[id]) return;
      markComplete();
    });
  }

  if (moduleProgress[id]) {
    updateModuleUI(card, true);
    if (badge) badge.classList.add("is-complete");
  }
});
updateMentorLock();

if (resetProgressBtn) {
  resetProgressBtn.addEventListener("click", () => {
    moduleProgress = {};
    writeStore(STORAGE_KEYS.modules, moduleProgress);
    moduleCards.forEach((card) => {
      const badge = card.querySelector(".module__badge");
      updateModuleUI(card, false);
      if (badge) badge.classList.remove("is-complete");
    });
    updateMentorLock();
  });
}

function updateModuleUI(card, completed) {
  const check = card.querySelector(".module__check");
  const button = card.querySelector(".module__complete");
  if (completed) {
    if (check) check.style.display = "inline";
    if (button) {
      button.textContent = "Completed";
      button.setAttribute("aria-pressed", "true");
      button.disabled = true;
    }
  } else {
    if (check) check.style.display = "none";
    if (button) {
      button.textContent = "Mark as completed";
      button.removeAttribute("aria-pressed");
      button.disabled = false;
    }
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
      moduleNextButtons.forEach((btn) => btn.classList.remove("app-hidden"));
    }
  };

  moduleModeButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyMode(btn.dataset.moduleMode));
  });

  applyMode("sequence");
}

// Quick scroll buttons
document.querySelectorAll("[data-scroll-target]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const allModeBtn = document.querySelector('[data-module-mode="all"]');
    if (allModeBtn) allModeBtn.click();
    const target = document.querySelector(btn.dataset.scrollTarget);
    if (!target) return;
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  });
});

// Module read-aloud controls
const getEnglishVoice = () => {
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  const englishVoices = voices.filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith("en"));
  const preferred = englishVoices.find((voice) =>
    /natural|neural|premium|google/i.test(voice.name || "")
  );
  return preferred || englishVoices.find((voice) => voice.default) || englishVoices[0] || null;
};

let cachedVoice = null;
const loadVoices = () => {
  if (!window.speechSynthesis) return;
  cachedVoice = getEnglishVoice();
};
loadVoices();
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

const normalizeText = (text) => text.replace(/\s+/g, " ").trim();
const splitIntoSentences = (text) => {
  if (!text) return [];
  const normalized = normalizeText(text);
  const parts = normalized.split(/(?<=[.!?])\s+/);
  return parts.map((part) => part.trim()).filter(Boolean);
};

const createReadAloudControls = (moduleEl) => {
  const title = moduleEl.querySelector(".module__title");
  const body = moduleEl.querySelector(".module__body");
  if (!title || !body || !window.speechSynthesis) return;

  const controls = document.createElement("div");
  controls.className = "module-audio-controls";

  const readBtn = document.createElement("button");
  readBtn.className = "btn btn--tiny btn--outline audio-control audio-control--read";
  readBtn.type = "button";
  readBtn.textContent = "Read aloud";

  const pauseBtn = document.createElement("button");
  pauseBtn.className = "btn btn--tiny btn--outline audio-control audio-control--pause";
  pauseBtn.type = "button";
  pauseBtn.textContent = "Pause";

  const stopBtn = document.createElement("button");
  stopBtn.className = "btn btn--tiny btn--outline audio-control audio-control--stop";
  stopBtn.type = "button";
  stopBtn.textContent = "Stop";

  controls.append(readBtn, pauseBtn, stopBtn);
  moduleEl.prepend(controls);
  moduleEl.classList.add("has-audio-controls");

  let isPaused = false;
  let sentences = [];
  let sentenceIndex = 0;
  let isPlaying = false;

  const speakModule = () => {
    window.speechSynthesis.cancel();
    sentences = splitIntoSentences(body.textContent);
    sentenceIndex = 0;
    isPaused = false;
    isPlaying = false;
    if (!sentences.length) return;
    playFromIndex(sentenceIndex);
  };

  const playFromIndex = (startIndex) => {
    if (!sentences.length || startIndex >= sentences.length) {
      isPaused = false;
      isPlaying = false;
      pauseBtn.textContent = "Pause";
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(sentences[startIndex]);
    utterance.lang = "en-US";
    utterance.voice = cachedVoice || getEnglishVoice();
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    
    utterance.onend = () => {
      if (!isPaused) {
        sentenceIndex += 1;
        playFromIndex(sentenceIndex);
      }
    };
    
    utterance.onerror = () => {
      isPlaying = false;
    };
    
    isPlaying = true;
    isPaused = false;
    pauseBtn.textContent = "Pause";
    window.speechSynthesis.speak(utterance);
  };

  readBtn.addEventListener("click", () => {
    controls.classList.add("is-active");
    speakModule();
  });

  pauseBtn.addEventListener("click", () => {
    // If not playing, nothing to pause/resume
    if (!isPlaying && !isPaused && !sentences.length) {
      return;
    }
    
    // If currently paused, resume
    if (isPaused) {
      isPaused = false;
      pauseBtn.textContent = "Pause";
      window.speechSynthesis.cancel();
      playFromIndex(sentenceIndex);
      return;
    }
    
    // If currently playing, pause
    if (isPlaying) {
      window.speechSynthesis.pause();
      isPaused = true;
      pauseBtn.textContent = "Resume";
      isPlaying = false;
      return;
    }
  });

  stopBtn.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    pauseBtn.textContent = "Pause";
    sentences = [];
    sentenceIndex = 0;
    isPaused = false;
    isPlaying = false;
    controls.classList.remove("is-active");
  });
};

document.querySelectorAll(".page--modules .module").forEach(createReadAloudControls);

// Willem pair sizing (match AI card height to the real photo)
const syncWillemPairHeights = () => {
  const pair = document.querySelector(".image-pair--willem");
  if (!pair) return;
  const realImage = pair.querySelector(".image-real");
  if (!realImage) return;
  const cards = pair.querySelectorAll(".image-card--willem");
  cards.forEach((card) => (card.style.height = "auto"));
  const height = realImage.getBoundingClientRect().height;
  if (!height) return;
  cards.forEach((card) => (card.style.height = `${height}px`));
};

window.addEventListener("load", syncWillemPairHeights);
window.addEventListener("resize", syncWillemPairHeights);

// Deepfake image quiz interactions
const imageQuizSections = document.querySelectorAll(".module--image-quiz");
imageQuizSections.forEach((section) => {
  const correctAnswer = section.dataset.answer;
  const choices = Array.from(section.querySelectorAll(".quiz-choice"));
  if (!correctAnswer || !choices.length) return;

  choices.forEach((button) => {
    button.addEventListener("click", () => {
      const isCorrect = button.dataset.choice === correctAnswer;
      if (isCorrect) {
        button.classList.add("is-correct");
      } else {
        button.classList.add("is-wrong");
      }
      button.setAttribute("aria-pressed", "true");
    });
  });
});

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
  backToTop.style.display = window.scrollY > UI_CONSTANTS.backToTopScrollY ? "inline-flex" : "none";
});
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Reveal cards on scroll
const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
  { threshold: UI_CONSTANTS.revealThreshold }
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
  themeToggle.textContent = mode === "dark" ? "Dark 🌙" : "Light ☀️";
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
  setTimeout(() => bubble.classList.remove("show"), UI_CONSTANTS.mascotDisplayMs);
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
