const badgeMessages = {
  streak5: "Insignia desbloqueada: Racha de 5.",
  streak10: "Insignia desbloqueada: Racha de 10.",
  accuracy90: "Insignia desbloqueada: Precision 90%.",
  score200: "Insignia desbloqueada: 200 Puntos."
};

export class UIController {
  constructor(elements) {
    this.elements = elements;
    this.lastBadges = new Set();
    this.confettiLayer = this.createConfettiLayer();
    this.lastSuperConfettiAt = 0;
  }

  createConfettiLayer() {
    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    document.body.appendChild(layer);
    return layer;
  }

  setPlaying(isPlaying) {
    this.elements.answerInput.disabled = !isPlaying;
    this.elements.submitBtn.disabled = !isPlaying;
    this.elements.skipBtn.disabled = !isPlaying;
    this.elements.startBtn.disabled = isPlaying;
  }

  render(state, config, feedback) {
    this.elements.score.textContent = String(state.score);
    this.elements.streak.textContent = String(state.streak);
    this.elements.accuracy.textContent = `${state.accuracy}%`;
    this.elements.timeLeft.textContent = config.timedMode
      ? `${state.timeLeft}s`
      : "--";

    this.elements.progressText.textContent = config.timedMode
      ? `Respondidas: ${state.asked}`
      : `Progreso: ${Math.min(state.asked, state.totalRounds)} / ${state.totalRounds}`;

    const housePercent = Math.min(100, Math.round((state.totalScore / 450) * 100));
    this.elements.houseMeter.style.width = `${housePercent}%`;

    this.renderFlaskTimer(state);

    this.elements.turnLabel.textContent = state.activePlayer
      ? `Turno: ${state.activePlayer.name} (${state.activePlayer.age} anos)`
      : "Turno: --";

    this.elements.playerStatusTitle.textContent = state.activePlayer
      ? `Panel de ${state.activePlayer.name}`
      : "Panel del Jugador";

    if (state.current?.expression && state.active) {
      this.elements.question.textContent = `${state.current.expression} = ?`;
    }

    if (!state.active && state.asked === 0) {
      this.elements.question.textContent = 'Presiona "Iniciar Mision" para comenzar.';
    }

    this.renderPlayerBoard(state.players, state.activePlayer?.id);

    this.updateFeedback(feedback);
    this.updateBadges(state.badges);
    this.setPlaying(state.active);

    if (state.active && document.activeElement !== this.elements.answerInput) {
      this.elements.answerInput.focus({ preventScroll: true });
    }

    this.elements.player2Block.style.display = config.mode === "multi" ? "block" : "none";
  }

  showFinal(state) {
    if (state.players.length > 1) {
      const ranking = [...state.players].sort((a, b) => b.score - a.score);
      const winner = ranking[0];
      this.elements.question.textContent = `Duelos completados. Ganadora: ${winner.name} con ${winner.score} puntos.`;
      this.elements.feedback.className = "feedback ok";
      this.elements.feedback.textContent = ranking
        .map((player) => `${player.name}: ${player.score} pts (${player.accuracy}% precision)`)
        .join(" · ");
      this.elements.tipText.textContent = "Repite la mision subiendo edades o dificultad para mantener el reto.";

      const topAccuracy = ranking[0]?.accuracy || 0;
      if (topAccuracy >= 90 || ranking[0]?.score >= 220) {
        this.launchSuperConfetti();
      } else {
        this.launchConfettiBurst();
      }
      return;
    }

    this.elements.question.textContent = `Mision completada. Puntaje final: ${state.score}`;
    this.elements.feedback.className = "feedback ok";
    this.elements.feedback.textContent = `Correctas: ${state.correct} · Incorrectas: ${state.wrong} · Precision: ${state.accuracy}%`;
    this.elements.tipText.textContent = this.getMotivationalTip(state);

    if (state.accuracy >= 90 || state.score >= 220) {
      this.launchSuperConfetti();
    } else {
      this.launchConfettiBurst();
    }
  }

  renderPlayerBoard(players, activeId) {
    this.elements.playerBoard.innerHTML = players
      .map((player) => {
        const activeClass = player.id === activeId ? "active" : "";
        return `
          <article class="player-card ${activeClass}">
            <div class="player-card__name">${player.name}</div>
            <div class="player-card__meta">Edad: ${player.age} · Puntaje: ${player.score}</div>
            <div class="player-card__meta">Racha: ${player.streak} · Precision: ${player.accuracy}%</div>
            <div class="player-card__meta">Preguntas: ${player.asked}</div>
          </article>
        `;
      })
      .join("");
  }

  updateFeedback(feedback) {
    if (!feedback) {
      return;
    }

    if (feedback.timedOut) {
      this.elements.feedback.className = "feedback bad";
      this.elements.feedback.textContent = `Se acabo el tiempo. Respuesta correcta: ${feedback.correctAnswer}`;
      this.retriggerAnimation(this.elements.questionWrap, "silly-shake");
      return;
    }

    if (feedback.wasSkipped) {
      this.elements.feedback.className = "feedback warn";
      this.elements.feedback.textContent = `Saltaste la pregunta. Respuesta correcta: ${feedback.correctAnswer}`;
      this.retriggerAnimation(this.elements.questionWrap, "silly-wobble");
      return;
    }

    if (feedback.isCorrect) {
      this.elements.feedback.className = "feedback ok";
      this.elements.feedback.textContent = "Correcto. Excelente lanzamiento.";
      this.retriggerAnimation(this.elements.questionWrap, "correct-burst");
      this.retriggerAnimation(this.elements.score, "party-bounce");
      return;
    }

    this.elements.feedback.className = "feedback bad";
    this.elements.feedback.textContent = `No esta bien. Resultado correcto: ${feedback.correctAnswer}`;
    this.retriggerAnimation(this.elements.questionWrap, "silly-shake");
  }

  renderFlaskTimer(state) {
    if (!state.active || !state.questionTimeLimit) {
      this.elements.flaskText.textContent = "Tiempo de respuesta: --";
      this.elements.flaskLiquid.style.transform = "scaleY(1)";
      this.elements.flaskTimer.classList.remove("low");
      return;
    }

    const ratio = Math.max(0, Math.min(1, state.questionTimeLeft / state.questionTimeLimit));
    this.elements.flaskLiquid.style.transform = `scaleY(${ratio})`;
    this.elements.flaskText.textContent = `Tiempo de respuesta: ${state.questionTimeLeft}s`;

    if (ratio <= 0.35) {
      this.elements.flaskTimer.classList.add("low");
      this.retriggerAnimation(this.elements.flaskTimer, "panic-jump");
      return;
    }

    this.elements.flaskTimer.classList.remove("low");
  }

  updateBadges(badgeList) {
    const badges = new Set(badgeList);
    this.elements.badges.querySelectorAll("li").forEach((item) => {
      const code = item.dataset.badge;
      if (badges.has(code)) {
        item.classList.add("unlocked");
      } else {
        item.classList.remove("unlocked");
      }
    });

    badges.forEach((code) => {
      if (!this.lastBadges.has(code) && badgeMessages[code]) {
        this.elements.tipText.textContent = badgeMessages[code];

        if (code === "streak10" || code === "accuracy90") {
          this.launchSuperConfetti();
        } else {
          this.launchConfettiBurst(16);
        }
      }
    });

    this.lastBadges = badges;
  }

  resetBadges() {
    this.lastBadges = new Set();
    this.elements.badges.querySelectorAll("li").forEach((item) => {
      item.classList.remove("unlocked");
    });
  }

  getMotivationalTip(state) {
    if (state.accuracy >= 90) {
      return "Magia precisa: ahora sube la dificultad para el siguiente reto.";
    }

    if (state.streak >= 5) {
      return "Gran ritmo. Mantengan la racha en la proxima mision.";
    }

    return "Practicar 5 minutos diarios mejora velocidad y confianza.";
  }

  retriggerAnimation(target, className) {
    if (!target) {
      return;
    }

    target.classList.remove(className);
    void target.offsetWidth;
    target.classList.add(className);
  }

  launchConfettiBurst(pieceCount = 24) {
    if (!this.confettiLayer) {
      return;
    }

    const colors = ["#f3be5f", "#73d39c", "#ff7b7b", "#7cc6ff", "#f5d99f"];

    for (let i = 0; i < pieceCount; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${1.6 + Math.random() * 1.1}s`;
      piece.style.animationDelay = `${Math.random() * 0.18}s`;
      piece.style.transform = `translateY(-10px) rotate(${Math.random() * 360}deg)`;
      this.confettiLayer.appendChild(piece);

      setTimeout(() => {
        piece.remove();
      }, 3200);
    }
  }

  launchSuperConfetti() {
    const now = Date.now();
    if (now - this.lastSuperConfettiAt < 1800) {
      return;
    }

    this.lastSuperConfettiAt = now;
    this.launchConfettiBurst(44);

    setTimeout(() => this.launchConfettiBurst(36), 260);
    setTimeout(() => this.launchConfettiBurst(30), 520);
  }
}
