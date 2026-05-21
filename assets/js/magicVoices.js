const DEFAULT_LANG = "es-ES";

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export class MagicVoices {
  constructor() {
    this.enabled = true;
    this.lang = DEFAULT_LANG;
    this.voice = null;
    this.lastTurnSpoken = null;
    this.lastWarningSignature = null;
  }

  setEnabled(value) {
    this.enabled = Boolean(value);

    if (!this.enabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  speak(text, options = {}) {
    if (!this.enabled || !text || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = this.getVoice();
    utterance.lang = options.lang || this.lang;
    utterance.rate = options.rate ?? randomBetween(0.82, 0.92);
    utterance.pitch = options.pitch ?? randomBetween(0.72, 0.9);
    utterance.volume = options.volume ?? 0.92;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || utterance.lang;
    }

    if (options.cancelBefore) {
      window.speechSynthesis.cancel();
    }

    window.speechSynthesis.speak(utterance);
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
    const byNamePriority = ["monica", "helena", "paulina", "espanol", "spanish"];

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
      ? "Comienza el duelo magico. Las sombras vigilan cada turno."
      : "Mision iniciada. La niebla cubre la pizarra encantada.";

    this.speak(line, { cancelBefore: true, rate: 0.85, pitch: 0.78 });
    this.lastTurnSpoken = null;
    this.lastWarningSignature = null;
  }

  onTurnChange(playerName) {
    if (!playerName || this.lastTurnSpoken === playerName) {
      return;
    }

    this.speak(`Turno de ${playerName}. La sala guarda silencio.`, { rate: 0.88, pitch: 0.76 });
    this.lastTurnSpoken = playerName;
  }

  onCorrect() {
    const lines = [
      "Brillante. Hechizo perfecto.",
      "Excelente. Tu magia numerica es fuerte.",
      "Fantastico. Acertaste al instante."
    ];

    this.speak(lines[Math.floor(Math.random() * lines.length)], { rate: 0.9, pitch: 0.82 });
  }

  onWrong(correctAnswer) {
    this.speak(`Casi. La respuesta correcta era ${correctAnswer}.`, { rate: 0.86, pitch: 0.74 });
  }

  onSkip(correctAnswer) {
    this.speak(`Pregunta saltada. La respuesta era ${correctAnswer}.`, { rate: 0.84, pitch: 0.72 });
  }

  onTimeout(correctAnswer) {
    this.speak(`Tiempo agotado. Era ${correctAnswer}.`, { cancelBefore: true, rate: 0.82, pitch: 0.7 });
  }

  onLowTime(signature) {
    if (!signature || this.lastWarningSignature === signature) {
      return;
    }

    this.speak("Rapido. El matraz se vacia.", { rate: 0.92, pitch: 0.86 });
    this.lastWarningSignature = signature;
  }

  onLevelUp(level) {
    this.speak(`Nivel aumentado. Ahora estas en nivel ${level}.`, { rate: 0.9, pitch: 0.8 });
  }

  onMissionEnd(winnerName) {
    if (winnerName) {
      this.speak(`Mision completada. Ganadora ${winnerName}.`, { cancelBefore: true, rate: 0.85, pitch: 0.75 });
      return;
    }

    this.speak("Mision completada. Gran trabajo en la academia.", { cancelBefore: true, rate: 0.85, pitch: 0.75 });
  }
}
