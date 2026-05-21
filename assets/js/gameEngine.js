import { createProblem } from "./operations.js";

function sanitizeAge(age) {
  const value = Number(age);
  if (Number.isNaN(value)) {
    return 8;
  }

  return Math.min(17, Math.max(4, value));
}

function difficultyFromAge(age) {
  if (age <= 6) {
    return 1;
  }

  if (age <= 8) {
    return 2;
  }

  if (age <= 11) {
    return 3;
  }

  return 4;
}

function defaultPlayers() {
  return [
    { name: "Luna", age: 8 },
    { name: "Mia", age: 10 }
  ];
}

function responseSecondsFromDifficulty(level) {
  const map = {
    1: 20,
    2: 14,
    3: 8,
    4: 2
  };

  return map[level] || 20;
}

function makePlayerState(player, index) {
  return {
    id: index + 1,
    name: (player.name || `Jugadora ${index + 1}`).trim() || `Jugadora ${index + 1}`,
    age: sanitizeAge(player.age),
    score: 0,
    streak: 0,
    correct: 0,
    wrong: 0,
    asked: 0,
    badges: new Set()
  };
}

export class GameEngine {
  constructor(onUpdate, onFinish) {
    this.onUpdate = onUpdate;
    this.onFinish = onFinish;
    this.timerId = null;
    this.questionTimerId = null;
    this.reset();
  }

  reset() {
    this.config = {
      operation: "mix",
      difficulty: 2,
      rounds: 10,
      timedMode: false,
      totalTime: 60,
      mode: "single",
      ageAdaptive: true,
      players: defaultPlayers()
    };

    this.state = {
      active: false,
      current: null,
      asked: 0,
      timeLeft: null,
      questionTimeLeft: null,
      questionTimeLimit: null,
      players: [makePlayerState(defaultPlayers()[0], 0)],
      activePlayerIndex: 0
    };

    this.stopTimer();
    this.emit();
  }

  start(config) {
    this.reset();

    const playersFromConfig = Array.isArray(config.players) && config.players.length > 0
      ? config.players
      : defaultPlayers();

    this.config = {
      ...this.config,
      ...config,
      players: playersFromConfig
    };

    const selectedPlayers = this.config.mode === "multi"
      ? playersFromConfig.slice(0, 2)
      : [playersFromConfig[0]];

    this.state.players = selectedPlayers.map((player, index) => makePlayerState(player, index));
    this.state.activePlayerIndex = 0;

    this.state.active = true;
    this.state.timeLeft = this.config.timedMode ? this.config.totalTime : null;
    this.state.current = this.createQuestionForActivePlayer();
    this.startQuestionTimer();

    if (this.config.timedMode) {
      this.startTimer();
    }

    this.emit();
  }

  submit(rawAnswer) {
    if (!this.state.active || !this.state.current) {
      return;
    }

    const value = Number(rawAnswer);
    if (Number.isNaN(value)) {
      return;
    }

    const player = this.state.players[this.state.activePlayerIndex];

    const isCorrect = value === this.state.current.answer;
    this.state.asked += 1;
    player.asked += 1;

    if (isCorrect) {
      player.correct += 1;
      player.streak += 1;
      const comboBonus = Math.min(5, player.streak - 1);
      player.score += 10 + comboBonus * 2;
    } else {
      player.wrong += 1;
      player.streak = 0;
      player.score = Math.max(0, player.score - 3);
    }

    this.updateBadges(player);

    const response = {
      isCorrect,
      correctAnswer: this.state.current.answer,
      operation: this.state.current.operation
    };

    if (this.shouldFinish()) {
      this.finish(response);
      return;
    }

    this.advanceTurn();
    this.state.current = this.createQuestionForActivePlayer();
    this.startQuestionTimer();
    this.emit(response);
  }

  skip() {
    if (!this.state.active || !this.state.current) {
      return;
    }

    this.state.asked += 1;
    const player = this.state.players[this.state.activePlayerIndex];
    player.asked += 1;
    player.wrong += 1;
    player.streak = 0;

    const response = {
      isCorrect: false,
      wasSkipped: true,
      correctAnswer: this.state.current.answer,
      operation: this.state.current.operation
    };

    if (this.shouldFinish()) {
      this.finish(response);
      return;
    }

    this.advanceTurn();
    this.state.current = this.createQuestionForActivePlayer();
    this.startQuestionTimer();
    this.emit(response);
  }

  onQuestionTimeout() {
    if (!this.state.active || !this.state.current) {
      return;
    }

    this.state.asked += 1;
    const player = this.state.players[this.state.activePlayerIndex];
    player.asked += 1;
    player.wrong += 1;
    player.streak = 0;

    const response = {
      isCorrect: false,
      timedOut: true,
      correctAnswer: this.state.current.answer,
      operation: this.state.current.operation
    };

    if (this.shouldFinish()) {
      this.finish(response);
      return;
    }

    this.advanceTurn();
    this.state.current = this.createQuestionForActivePlayer();
    this.startQuestionTimer();
    this.emit(response);
  }

  shouldFinish() {
    if (!this.state.active) {
      return true;
    }

    if (!this.config.timedMode && this.state.asked >= this.config.rounds) {
      if (this.config.mode === "single") {
        return true;
      }

      const allCompleted = this.state.players.every((player) => player.asked >= this.config.rounds);
      if (allCompleted) {
        return true;
      }
    }

    if (this.config.timedMode && this.state.timeLeft <= 0) {
      return true;
    }

    return false;
  }

  finish(lastResponse = null) {
    this.state.active = false;
    this.stopTimer();
    this.stopQuestionTimer();
    this.emit(lastResponse);
    this.onFinish(this.snapshot(), lastResponse);
  }

  startTimer() {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (!this.state.active) {
        this.stopTimer();
        return;
      }

      this.state.timeLeft -= 1;
      if (this.state.timeLeft <= 0) {
        this.state.timeLeft = 0;
        this.finish();
        return;
      }

      this.emit();
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  startQuestionTimer() {
    this.stopQuestionTimer();

    const limit = responseSecondsFromDifficulty(this.state.current.difficultyUsed);
    this.state.questionTimeLimit = limit;
    this.state.questionTimeLeft = limit;

    this.questionTimerId = setInterval(() => {
      if (!this.state.active) {
        this.stopQuestionTimer();
        return;
      }

      this.state.questionTimeLeft -= 1;

      if (this.state.questionTimeLeft <= 0) {
        this.state.questionTimeLeft = 0;
        this.emit();
        this.onQuestionTimeout();
        return;
      }

      this.emit();
    }, 1000);
  }

  stopQuestionTimer() {
    if (this.questionTimerId) {
      clearInterval(this.questionTimerId);
      this.questionTimerId = null;
    }
  }

  updateBadges(player) {
    const accuracy = this.getPlayerAccuracy(player);

    if (player.streak >= 5) {
      player.badges.add("streak5");
    }

    if (player.streak >= 10) {
      player.badges.add("streak10");
    }

    if (player.score >= 200) {
      player.badges.add("score200");
    }

    if (player.asked >= 8 && accuracy >= 90) {
      player.badges.add("accuracy90");
    }
  }

  getPlayerAccuracy(player) {
    if (!player || player.asked === 0) {
      return 0;
    }

    return Math.round((player.correct / player.asked) * 100);
  }

  getActivePlayer() {
    return this.state.players[this.state.activePlayerIndex];
  }

  createQuestionForActivePlayer() {
    const activePlayer = this.getActivePlayer();
    const resolvedDifficulty = this.config.ageAdaptive
      ? difficultyFromAge(activePlayer.age)
      : Number(this.config.difficulty);

    return {
      ...createProblem(this.config.operation, resolvedDifficulty),
      difficultyUsed: resolvedDifficulty,
      playerId: activePlayer.id
    };
  }

  advanceTurn() {
    if (this.state.players.length <= 1) {
      return;
    }

    this.state.activePlayerIndex = (this.state.activePlayerIndex + 1) % this.state.players.length;
  }

  getTotalScore() {
    return this.state.players.reduce((acc, player) => acc + player.score, 0);
  }

  snapshot() {
    const activePlayer = this.getActivePlayer();
    const totalRounds = this.config.mode === "multi"
      ? this.config.rounds * this.state.players.length
      : this.config.rounds;

    return {
      ...this.state,
      score: activePlayer.score,
      streak: activePlayer.streak,
      correct: activePlayer.correct,
      wrong: activePlayer.wrong,
      badges: [...activePlayer.badges],
      accuracy: this.getPlayerAccuracy(activePlayer),
      activePlayer,
      totalScore: this.getTotalScore(),
      totalRounds,
      questionTimeLeft: this.state.questionTimeLeft,
      questionTimeLimit: this.state.questionTimeLimit,
      players: this.state.players.map((player) => ({
        ...player,
        badges: [...player.badges],
        accuracy: this.getPlayerAccuracy(player)
      }))
    };
  }

  emit(feedback = null) {
    this.onUpdate(this.snapshot(), this.config, feedback);
  }
}
