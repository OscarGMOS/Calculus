export class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
  }

  ensureContext() {
    if (!this.enabled) {
      return null;
    }

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return null;
      }
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  playTone({ frequency, duration = 0.12, type = "sine", startGain = 0.16, endGain = 0.001, when = 0 }) {
    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime + when;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(startGain, now);
    gain.gain.exponentialRampToValueAtTime(endGain, now + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  playStart() {
    this.playTone({ frequency: 370, type: "triangle", duration: 0.11, startGain: 0.15 });
    this.playTone({ frequency: 495, type: "triangle", duration: 0.14, startGain: 0.12, when: 0.1 });
  }

  playCorrect() {
    this.playTone({ frequency: 660, type: "sine", duration: 0.09, startGain: 0.16 });
    this.playTone({ frequency: 830, type: "triangle", duration: 0.12, startGain: 0.13, when: 0.08 });
  }

  playWrong() {
    this.playTone({ frequency: 210, type: "square", duration: 0.15, startGain: 0.13 });
  }

  playSkip() {
    this.playTone({ frequency: 280, type: "sawtooth", duration: 0.12, startGain: 0.12 });
  }

  playTimeout() {
    this.playTone({ frequency: 240, type: "square", duration: 0.18, startGain: 0.15 });
    this.playTone({ frequency: 160, type: "square", duration: 0.2, startGain: 0.12, when: 0.12 });
  }

  playTick() {
    this.playTone({ frequency: 1020, type: "triangle", duration: 0.05, startGain: 0.08 });
  }

  playLevelUp() {
    this.playTone({ frequency: 392, type: "triangle", duration: 0.1, startGain: 0.14 });
    this.playTone({ frequency: 523, type: "triangle", duration: 0.12, startGain: 0.13, when: 0.09 });
    this.playTone({ frequency: 659, type: "triangle", duration: 0.16, startGain: 0.12, when: 0.18 });
  }
}
