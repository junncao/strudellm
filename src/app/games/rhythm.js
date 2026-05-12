const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const statusEl = document.querySelector("#status");
const sampleList = document.querySelector("#sample-list");
const restartButton = document.querySelector("#restart");

const TAGS = [
  "acid",
  "breakbeat",
  "garage",
  "jungle",
  "house",
  "disco",
  "dub",
  "synth",
  "bassline",
  "hi hat",
  "trap",
  "detroit",
];

const BEATS_PER_PHRASE = 16;
const PLAYER_SIZE = 16;
const PLAYER_SPEED = 4.2;

const state = {
  width: canvas.width,
  height: canvas.height,
  hudHeight: 44,
  tick: 0,
  beat: 0,
  obstacles: [],
  particles: [],
  acquired: [],
  player: {
    x: canvas.width / 2 - PLAYER_SIZE / 2,
    y: canvas.height - 120,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
  },
  input: { left: false, right: false, up: false, down: false },
  beatTimer: 0,
  beatInterval: 46,
  gameOver: false,
  pulse: 0,
};

function reset() {
  state.tick = 0;
  state.beat = 0;
  state.obstacles = [];
  state.particles = [];
  state.acquired = [];
  state.player.x = canvas.width / 2 - PLAYER_SIZE / 2;
  state.player.y = canvas.height - 120;
  state.beatTimer = 0;
  state.beatInterval = 46;
  state.gameOver = false;
  state.pulse = 0;
  statusEl.textContent = "BEAT 01";
  renderAcquired();
}

function randomTag() {
  return TAGS[Math.floor(Math.random() * TAGS.length)];
}

function renderAcquired() {
  sampleList.replaceChildren();
  state.acquired.forEach((tag) => {
    const item = document.createElement("li");
    item.textContent = tag;
    sampleList.append(item);
  });
}

function update() {
  if (state.gameOver) return;

  state.tick += 1;
  state.pulse = Math.max(0, state.pulse - 0.04);
  movePlayer();

  state.beatTimer += 1;
  if (state.beatTimer >= state.beatInterval) {
    state.beatTimer = 0;
    advanceBeat();
  }

  state.obstacles.forEach((obstacle) => {
    if (obstacle.kind === "sweep") {
      obstacle.x += obstacle.vx;
      obstacle.y += obstacle.vy;
    }
    obstacle.y += obstacle.speed;
  });
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.y < state.height + obstacle.h + 20);

  state.particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 1;
  });
  state.particles = state.particles.filter((particle) => particle.life > 0);

  for (const obstacle of state.obstacles) {
    if (!rectsOverlap(state.player, obstacle)) continue;

    if (obstacle.tagged) {
      obstacle.collected = true;
      state.acquired.push(obstacle.tag);
      renderAcquired();
      continue;
    }

    if (!obstacle.tagged) {
      state.gameOver = true;
      spawnCrashParticles();
      break;
    }
  }

  state.obstacles = state.obstacles.filter((obstacle) => !obstacle.collected);
}

function movePlayer() {
  let dx = 0;
  let dy = 0;
  if (state.input.left) dx -= 1;
  if (state.input.right) dx += 1;
  if (state.input.up) dy -= 1;
  if (state.input.down) dy += 1;

  const length = Math.hypot(dx, dy) || 1;
  dx = (dx / length) * PLAYER_SPEED;
  dy = (dy / length) * PLAYER_SPEED;

  state.player.x = clamp(state.player.x + dx, 18, state.width - state.player.w - 18);
  state.player.y = clamp(state.player.y + dy, state.hudHeight + 32, state.height - state.player.h - 28);
}

function advanceBeat() {
  state.beat += 1;
  state.pulse = 1;
  statusEl.textContent = `BEAT ${String(((state.beat - 1) % BEATS_PER_PHRASE) + 1).padStart(2, "0")}`;
  spawnBeatPattern(state.beat);

  if (state.beat % BEATS_PER_PHRASE === 0) {
    state.beatInterval = Math.max(34, state.beatInterval - 1);
  }
}

function spawnBeatPattern(beat) {
  const phase = ((beat - 1) % BEATS_PER_PHRASE) + 1;
  const speed = 2.1 + Math.floor(beat / BEATS_PER_PHRASE) * 0.22;
  const longPatternAllowed = beat % 3 === 0;

  if (phase % 4 === 1) {
    spawnLaneBurst(2, speed, 1);
  } else if (phase % 4 === 2) {
    if (longPatternAllowed) {
      spawnGatePair(speed + 0.25);
    } else {
      spawnLaneBurst(2, speed + 0.1, 1);
    }
  } else if (phase % 4 === 3) {
    if (longPatternAllowed) {
      spawnSweep(speed + 0.1);
    } else {
      spawnLaneBurst(1, speed + 0.1, 1);
    }
  } else {
    spawnLaneBurst(1 + (beat % 2), speed + 0.2, 1);
  }
}

function spawnLaneBurst(count, speed, taggedCount = 1) {
  const lanes = 7;
  const laneWidth = (state.width - 80) / lanes;
  const taken = new Set();
  const tagged = new Set();

  while (taken.size < count) {
    taken.add(Math.floor(Math.random() * lanes));
  }
  const takenArray = [...taken];
  while (tagged.size < Math.min(taggedCount, takenArray.length)) {
    tagged.add(takenArray[Math.floor(Math.random() * takenArray.length)]);
  }

  taken.forEach((lane) => {
    const hasTag = tagged.has(lane);
    state.obstacles.push({
      x: 40 + lane * laneWidth + 6,
      y: state.hudHeight + 6 - 48,
      w: laneWidth - 12,
      h: 42,
      speed,
      kind: "block",
      tag: hasTag ? randomTag() : "",
      tagged: hasTag,
      collected: false,
    });
  });
}

function spawnGatePair(speed) {
  const safeWidth = 280;
  const safeX = 70 + Math.random() * (state.width - safeWidth - 140);
    state.obstacles.push({
      x: 18,
      y: state.hudHeight + 6 - 30,
      w: safeX - 18,
      h: 24,
      speed,
      kind: "bar",
      tag: "",
      tagged: false,
      collected: false,
    });
  state.obstacles.push({
    x: safeX + safeWidth,
    y: state.hudHeight + 6 - 30,
      w: state.width - (safeX + safeWidth) - 18,
      h: 24,
      speed,
      kind: "bar",
      tag: "",
      tagged: false,
      collected: false,
    });
}

function spawnSweep(speed) {
  const leftToRight = Math.random() > 0.5;
  const hasTag = Math.random() > 0.7;
  const sweepWidth = 112;
  state.obstacles.push({
    x: leftToRight ? -sweepWidth : state.width + 20,
    y: state.hudHeight + 70 + Math.random() * 180,
    w: sweepWidth,
    h: hasTag ? 30 : 18,
    speed: 0,
    vx: leftToRight ? speed * 2.4 : -speed * 2.4,
    vy: speed * 0.45,
    kind: "sweep",
    tag: hasTag ? randomTag() : "",
    tagged: hasTag,
    collected: false,
  });
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnCrashParticles() {
  for (let i = 0; i < 16; i += 1) {
    state.particles.push({
      x: state.player.x + state.player.w / 2,
      y: state.player.y + state.player.h / 2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 20 + Math.random() * 12,
    });
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function draw() {
  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, state.width, state.height);
  drawDither();
  drawBeatGrid();
  drawObstacles();
  drawPlayer();
  drawParticles();
  drawFrame();

  if (state.gameOver) {
    drawGameOver();
  }
}

function drawDither() {
  ctx.fillStyle = "rgba(245, 240, 232, 0.11)";
  for (let y = state.hudHeight + 10; y < state.height; y += 18) {
    for (let x = (Math.floor(y / 18) % 2) * 9; x < state.width; x += 18) {
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

function drawBeatGrid() {
  const lanes = 7;
  const laneWidth = (state.width - 80) / lanes;
  ctx.strokeStyle = `rgba(245, 240, 232, ${0.08 + state.pulse * 0.18})`;
  ctx.lineWidth = 1;

  for (let lane = 0; lane <= lanes; lane += 1) {
    const x = 40 + lane * laneWidth;
    ctx.beginPath();
    ctx.moveTo(x, state.hudHeight + 14);
    ctx.lineTo(x, state.height - 18);
    ctx.stroke();
  }

  ctx.fillStyle = `rgba(215, 45, 37, ${0.15 + state.pulse * 0.2})`;
  ctx.fillRect(18, state.hudHeight + 18, state.width - 36, 8);
}

function drawObstacles() {
  state.obstacles.forEach((obstacle) => {
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    ctx.fillStyle = obstacle.tagged ? "#d72d25" : "#070707";
    ctx.fillRect(obstacle.x + 4, obstacle.y + 4, obstacle.w - 8, obstacle.h - 8);
    if (obstacle.tagged) {
      drawTagLabel(obstacle);
    }
  });
}

function drawTagLabel(obstacle) {
  ctx.save();
  ctx.translate(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h / 2 + 1);
  ctx.scale(1.48, 0.94);
  ctx.fillStyle = "#f5f0e8";
  ctx.font = "700 13px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(obstacle.tag.toUpperCase(), 0, 0);
  ctx.restore();
}

function drawPlayer() {
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
  ctx.fillStyle = "#070707";
  ctx.fillRect(state.player.x + 4, state.player.y + 4, state.player.w - 8, state.player.h - 8);
  ctx.fillStyle = "#d72d25";
  ctx.fillRect(state.player.x + 5, state.player.y - 6, 6, 6);
}

function drawParticles() {
  ctx.fillStyle = "#d72d25";
  state.particles.forEach((particle) => {
    ctx.fillRect(particle.x, particle.y, 3, 3);
  });
}

function drawFrame() {
  ctx.strokeStyle = "#f5f0e8";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, state.hudHeight + 2, state.width - 4, state.height - state.hudHeight - 4);
  ctx.strokeStyle = "#d72d25";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, state.hudHeight + 10, state.width - 20, state.height - state.hudHeight - 20);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(7, 7, 7, 0.82)";
  ctx.fillRect(0, state.hudHeight, state.width, state.height - state.hudHeight);
  ctx.fillStyle = "#f5f0e8";
  ctx.font = "700 30px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MISSED THE DROP", state.width / 2, state.height / 2 - 18);
  ctx.fillStyle = "#d72d25";
  ctx.font = "700 13px Courier New";
  ctx.fillText("HOLD THE GROOVE LONGER", state.width / 2, state.height / 2 + 20);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") state.input.left = true;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") state.input.right = true;
  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") state.input.up = true;
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") state.input.down = true;
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") state.input.left = false;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") state.input.right = false;
  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") state.input.up = false;
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") state.input.down = false;
});

restartButton.addEventListener("click", reset);

reset();
loop();
