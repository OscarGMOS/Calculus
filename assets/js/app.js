import { GameEngine } from "./gameEngine.js";
import { UIController } from "./ui.js";
import { SoundFX } from "./soundFx.js";
import { MagicVoices } from "./magicVoices.js";

const elements = {
  operation: document.getElementById("operation"),
  difficulty: document.getElementById("difficulty"),
  rounds: document.getElementById("rounds"),
  mode: document.getElementById("mode"),
  ageAdaptive: document.getElementById("ageAdaptive"),
  timedMode: document.getElementById("timedMode"),
  soundEnabled: document.getElementById("soundEnabled"),
  voiceTone: document.getElementById("voiceTone"),
  p1Name: document.getElementById("p1Name"),
  p1Age: document.getElementById("p1Age"),
  p2Name: document.getElementById("p2Name"),
  p2Age: document.getElementById("p2Age"),
  player2Block: document.getElementById("player2Block"),
  configPanel: document.getElementById("configPanel"),
  toggleConfigBtn: document.getElementById("toggleConfigBtn"),
  startBtn: document.getElementById("startBtn"),
  resetBtn: document.getElementById("resetBtn"),
  score: document.getElementById("score"),
  streak: document.getElementById("streak"),
  accuracy: document.getElementById("accuracy"),
  timeLeft: document.getElementById("timeLeft"),
  flaskTimer: document.getElementById("flaskTimer"),
  flaskLiquid: document.getElementById("flaskLiquid"),
  flaskText: document.getElementById("flaskText"),
  turnLabel: document.getElementById("turnLabel"),
  playerStatusTitle: document.getElementById("playerStatusTitle"),
  question: document.getElementById("question"),
  questionWrap: document.getElementById("questionWrap"),
  answerForm: document.getElementById("answerForm"),
  answerInput: document.getElementById("answerInput"),
  submitBtn: document.getElementById("submitBtn"),
  skipBtn: document.getElementById("skipBtn"),
  feedback: document.getElementById("feedback"),
  progressText: document.getElementById("progressText"),
  houseMeter: document.getElementById("houseMeter"),
  playerBoard: document.getElementById("playerBoard"),
  badges: document.getElementById("badges"),
  tipText: document.getElementById("tipText")
};

const ui = new UIController(elements);
const sounds = new SoundFX();
const voices = new MagicVoices();
let lastQuestionTimeLeft = null;
let lastActivePlayerId = null;
let didAutoCollapseOnMobile = false;

const landscapeQuery = window.matchMedia("(orientation: landscape) and (max-height: 540px) and (max-width: 1024px)");
const mobileMenuQuery = window.matchMedia("(max-width: 760px)");

function syncConfigToggleButton() {
  const collapsed = document.body.classList.contains("config-collapsed");
  elements.toggleConfigBtn.textContent = collapsed ? "Mostrar Menu" : "Ocultar Menu";
  elements.toggleConfigBtn.setAttribute("aria-expanded", String(!collapsed));
}

function isCollapsibleViewport() {
  return landscapeQuery.matches || mobileMenuQuery.matches;
}

function applyResponsiveConfigRules() {
  if (!isCollapsibleViewport()) {
    document.body.classList.remove("config-collapsed");
    didAutoCollapseOnMobile = false;
  } else if (mobileMenuQuery.matches && !didAutoCollapseOnMobile) {
    document.body.classList.add("config-collapsed");
    didAutoCollapseOnMobile = true;
  }

  syncConfigToggleButton();
}

function focusAnswerInput() {
  setTimeout(() => {
    if (elements.answerInput.disabled) {
      return;
    }

    elements.answerInput.focus({ preventScroll: true });
    elements.answerInput.select();
  }, 40);
}

function increaseDifficultyForNextMission() {
  const current = Number(elements.difficulty.value);
  const next = Math.min(4, current + 1);
  elements.difficulty.value = String(next);

  if (next > current) {
    elements.tipText.textContent = `Nivel aumentado para la proxima mision: ${next}.`;
    sounds.playLevelUp();
    voices.onLevelUp(next);
    return;
  }

  elements.tipText.textContent = "Ya estas en el nivel maximo. Sigue acumulando rachas.";
}

const game = new GameEngine(
  (state, config, feedback) => {
    ui.render(state, config, feedback);

    if (state.active && state.activePlayer?.id !== lastActivePlayerId) {
      voices.onTurnChange(state.activePlayer.name);
      lastActivePlayerId = state.activePlayer.id;
    }

    if (feedback?.timedOut) {
      sounds.playTimeout();
      voices.onTimeout(feedback.correctAnswer);
    } else if (feedback?.wasSkipped) {
      sounds.playSkip();
      voices.onSkip(feedback.correctAnswer);
    } else if (feedback?.isCorrect) {
      sounds.playCorrect();
      voices.onCorrect();
    } else if (feedback) {
      sounds.playWrong();
      voices.onWrong(feedback.correctAnswer);
    }

    if (state.active && state.questionTimeLeft !== lastQuestionTimeLeft) {
      if (state.questionTimeLeft > 0 && state.questionTimeLeft <= 3) {
        sounds.playTick();
        voices.onLowTime(`${state.asked}-${state.activePlayer?.id}-${state.current?.expression}`);
      }
      lastQuestionTimeLeft = state.questionTimeLeft;
    }

    if (!state.active) {
      lastQuestionTimeLeft = null;
      lastActivePlayerId = null;
    }
  },
  (state) => {
    ui.showFinal(state);

    if (mobileMenuQuery.matches) {
      document.body.classList.remove("config-collapsed");
      syncConfigToggleButton();
    }

    if (state.players.length > 1) {
      const ranking = [...state.players].sort((a, b) => b.score - a.score);
      voices.onMissionEnd(ranking[0]?.name);
    } else {
      voices.onMissionEnd();
    }
    increaseDifficultyForNextMission();
  }
);

function getConfig() {
  const player1 = {
    name: elements.p1Name.value || "Luna",
    age: Number(elements.p1Age.value)
  };

  const player2 = {
    name: elements.p2Name.value || "Mia",
    age: Number(elements.p2Age.value)
  };

  const mode = elements.mode.value;

  return {
    operation: elements.operation.value,
    difficulty: Number(elements.difficulty.value),
    rounds: Number(elements.rounds.value),
    mode,
    ageAdaptive: elements.ageAdaptive.checked,
    timedMode: elements.timedMode.checked,
    totalTime: 60,
    players: mode === "multi" ? [player1, player2] : [player1]
  };
}

function resetAll() {
  game.reset();
  ui.resetBadges();
  lastQuestionTimeLeft = null;
  lastActivePlayerId = null;
  elements.answerInput.value = "";
  elements.feedback.className = "feedback";
  elements.feedback.textContent = "";
  elements.tipText.textContent = "Tip: las respuestas correctas seguidas multiplican los puntos.";
}

elements.soundEnabled.addEventListener("change", () => {
  sounds.setEnabled(elements.soundEnabled.checked);
  voices.setEnabled(elements.soundEnabled.checked);
});

elements.voiceTone.addEventListener("change", () => {
  voices.setTone(elements.voiceTone.value);
  voices.previewTone();
});

elements.mode.addEventListener("change", () => {
  elements.player2Block.style.display = elements.mode.value === "multi" ? "block" : "none";
});

elements.toggleConfigBtn.addEventListener("click", () => {
  document.body.classList.toggle("config-collapsed");
  syncConfigToggleButton();
});

landscapeQuery.addEventListener("change", applyResponsiveConfigRules);
mobileMenuQuery.addEventListener("change", applyResponsiveConfigRules);

elements.startBtn.addEventListener("click", () => {
  sounds.setEnabled(elements.soundEnabled.checked);
  voices.setEnabled(elements.soundEnabled.checked);
  voices.setTone(elements.voiceTone.value);
  sounds.playStart();
  voices.onMissionStart(elements.mode.value);
  resetAll();
  game.start(getConfig());

  if (mobileMenuQuery.matches) {
    document.body.classList.add("config-collapsed");
    syncConfigToggleButton();
  }

  focusAnswerInput();
});

elements.resetBtn.addEventListener("click", () => {
  resetAll();
});

elements.answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  game.submit(elements.answerInput.value);
  elements.answerInput.value = "";
});

elements.skipBtn.addEventListener("click", () => {
  game.skip();
  elements.answerInput.value = "";
});

resetAll();
elements.player2Block.style.display = elements.mode.value === "multi" ? "block" : "none";
sounds.setEnabled(elements.soundEnabled.checked);
voices.setEnabled(elements.soundEnabled.checked);
voices.setTone(elements.voiceTone.value);
applyResponsiveConfigRules();
