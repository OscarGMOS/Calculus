const DEFAULT_LANG = "es-ES";
const DEFAULT_TONE = "mysterious";

const TONE_PROFILES = {
  mysterious: {
    rateMin: 0.92,
    rateMax: 0.98,
    pitchMin: 0.9,
    pitchMax: 0.98,
    volume: 1,
    label: "misterioso"
  },
  clear: {
    rateMin: 1,
    rateMax: 1.08,
    pitchMin: 0.98,
    pitchMax: 1.06,
    volume: 1,
    label: "claro"
  },
  cheerful: {
    rateMin: 1.02,
    rateMax: 1.12,
    pitchMin: 1.08,
    pitchMax: 1.2,
    volume: 1,
    label: "alegre"
  },
  narrator: {
    rateMin: 0.9,
    rateMax: 0.96,
    pitchMin: 0.84,
    pitchMax: 0.92,
    volume: 1,
    label: "narrador"
  }
};

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export class MagicVoices {
  constructor() {
    this.enabled = true;
    this.lang = DEFAULT_LANG;
    this.tone = DEFAULT_TONE;
    this.voice = null;
    this.lastTurnSpoken = null;
    this.lastWarningSignature = null;
    this.lastSpeechAt = 0;
  }

  setEnabled(value) {
    this.enabled = Boolean(value);

    if (!this.enabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  setTone(tone) {
    if (TONE_PROFILES[tone]) {
      this.tone = tone;
      return;
    }

    this.tone = DEFAULT_TONE;
  }

  getToneProfile() {
    return TONE_PROFILES[this.tone] || TONE_PROFILES[DEFAULT_TONE];
  }

  previewTone() {
    const profile = this.getToneProfile();
    this.speak(`Tono ${profile.label} activado.`, { cancelBefore: true, minIntervalMs: 0 });
  }

  speak(text, options = {}) {
    if (!this.enabled || !text || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
      return;
    }

    const now = Date.now();
    const minIntervalMs = options.minIntervalMs ?? 320;
    const shouldInterrupt = Boolean(options.cancelBefore);

    if (!shouldInterrupt && now - this.lastSpeechAt < minIntervalMs) {
      return;
    }

    if (!shouldInterrupt && window.speechSynthesis.speaking) {
      return;
    }

    const profile = this.getToneProfile();
    const utterance = new SpeechSynthesisUtterance(String(text).normalize("NFC"));
    const selectedVoice = this.getVoice();
    utterance.lang = options.lang || this.lang;
    utterance.rate = options.rate ?? randomBetween(profile.rateMin, profile.rateMax);
    utterance.pitch = options.pitch ?? randomBetween(profile.pitchMin, profile.pitchMax);
    utterance.volume = options.volume ?? profile.volume;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || utterance.lang;
    }

    if (options.cancelBefore) {
      window.speechSynthesis.cancel();
    }

    window.speechSynthesis.speak(utterance);
    this.lastSpeechAt = now;
  }

  getVoice() {
    if (!window.speechSynthesis) {
      return null;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      return this.voice;
    }

    if (this.voice && voices.some((item) => item.name === this.voice.name)) {
      return this.voice;
    }

    const spanish = voices.filter((voice) => (voice.lang || "").toLowerCase().startsWith("es"));
    const pool = spanish.length > 0 ? spanish : voices;
    const byNamePriority = [
      "sabina",
      "elvira",
      "dalia",
      "maria",
      "monica",
      "helena",
      "paulina",
      "español",
      "espanol",
      "spanish"
    ];

    for (const keyword of byNamePriority) {
      const match = pool.find((voice) => (voice.name || "").toLowerCase().includes(keyword));
      if (match) {
        this.voice = match;
        return this.voice;
      }
    }

    this.voice = pool[0] || null;
    return this.voice;
  }

  onMissionStart(mode) {
    const line = mode === "multi"
      ? "Comienza el duelo mágico. Las sombras vigilan cada turno."
      : "Misión iniciada. La niebla cubre la pizarra encantada.";

    this.speak(line, { cancelBefore: true, rate: 0.95, pitch: 0.96 });
    this.lastTurnSpoken = null;
    this.lastWarningSignature = null;
  }

  onTurnChange(playerName) {
    if (!playerName || this.lastTurnSpoken === playerName) {
      return;
    }

    this.speak(`Turno de ${playerName}. La sala guarda silencio.`, { rate: 0.97, pitch: 0.98 });
    this.lastTurnSpoken = playerName;
  }

  onCorrect() {
    const lines = [
      "Brillante. Hechizo perfecto.",
      "Excelente. Tu magia numérica es fuerte.",
      "Fantástico. Acertaste al instante."
    ];

    this.speak(lines[Math.floor(Math.random() * lines.length)], { rate: 0.99, pitch: 1.02 });
  }

  onWrong(correctAnswer) {
    this.speak(`Casi. La respuesta correcta era ${correctAnswer}.`, { rate: 0.95, pitch: 0.96 });
  }

  onSkip(correctAnswer) {
    this.speak(`Pregunta saltada. La respuesta era ${correctAnswer}.`, { rate: 0.94, pitch: 0.95 });
  }

  onTimeout(correctAnswer) {
    this.speak(`Tiempo agotado. Era ${correctAnswer}.`, { cancelBefore: true, rate: 0.93, pitch: 0.93 });
  }

  onLowTime(signature) {
    if (!signature || this.lastWarningSignature === signature) {
      return;
    }

    this.speak("Rápido. El matraz se vacía.", { rate: 1.01, pitch: 1 });
    this.lastWarningSignature = signature;
  }

  onLevelUp(level) {
    this.speak(`Nivel aumentado. Ahora estás en nivel ${level}.`, { rate: 0.98, pitch: 1.01 });
  }

  onMissionEnd(winnerName) {
    if (winnerName) {
      this.speak(`Misión completada. Ganadora ${winnerName}.`, { cancelBefore: true, rate: 0.95, pitch: 0.96 });
      return;
    }

    this.speak("Misión completada. Gran trabajo en la academia.", { cancelBefore: true, rate: 0.95, pitch: 0.96 });
  }
}
