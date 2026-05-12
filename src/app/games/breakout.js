const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const sampleList = document.querySelector("#sample-list");
const restartButton = document.querySelector("#restart");

const LABELS = [
  "house",
  "techno",
  "acid",
  "breakbeat",
  "garage",
  "jungle",
  "synth",
  "kick",
  "bass",
  "snare",
  "808",
  "arp",
  "disco",
  "dub",
  "funk",
  "hi hat",
];

const state = {
  width: canvas.width,
  height: canvas.height,
  hudHeight: 44,
  paddle: { x: canvas.width / 2 - 68, y: canvas.height - 54, w: 136, h: 14, speed: 7, vx: 0 },
  ball: { x: canvas.width / 2, y: canvas.height - 78, vx: 3.6, vy: -3.6, size: 10 },
  bricks: [],
  acquired: [],
  score: 0,
  broken: 0,
  tick: 0,
  gameOver: false,
  nextGrowthAt: 6,
};

function reset() {
  state.paddle.x = canvas.width / 2 - 68;
  state.paddle.y = canvas.height - 54;
  state.paddle.vx = 0;
  state.ball.x = canvas.width / 2;
  state.ball.y = canvas.height - 78;
  state.ball.vx = 3.6;
  state.ball.vy = -3.6;
  state.bricks = [];
  state.acquired = [];
  state.score = 0;
  state.broken = 0;
  state.tick = 0;
  state.gameOver = false;
  state.nextGrowthAt = 6;
  scoreEl.textContent = "00";
  renderAcquired();
  seedBricks(6);
}

function renderAcquired() {
  sampleList.replaceChildren();
  state.acquired.forEach((label) => {
    const item = document.createElement("li");
    item.textContent = label;
    sampleList.append(item);
  });
}

function randomLabel() {
  return LABELS[Math.floor(Math.random() * LABELS.length)];
}

function seedBricks(rows) {
  for (let row = 0; row < rows; row += 1) {
    addBrickRow(false, row);
  }
}

function addBrickRow(fromGrowth, rowIndex = 0) {
  const columns = 10;
  const marginX = 18;
  const gap = 8;
  const brickWidth = (state.width - marginX * 2 - gap * (columns - 1)) / columns;
  const brickHeight = 24;
  const startY = state.hudHeight + 22 + rowIndex * (brickHeight + gap);

  if (fromGrowth) {
    state.bricks.forEach((brick) => {
      brick.y += brickHeight + gap;
    });
  }

  const specialSlots = new Set();
  const specialCount = fromGrowth ? 3 : 2;
  while (specialSlots.size < specialCount) {
    specialSlots.add(Math.floor(Math.random() * columns));
  }

  for (let col = 0; col < columns; col += 1) {
    const x = marginX + col * (brickWidth + gap);
    const isSpecial = specialSlots.has(col);
    state.bricks.push({
      x,
      y: startY,
      w: brickWidth,
      h: brickHeight,
      label: isSpecial ? randomLabel() : "",
      special: isSpecial,
      alive: true,
      flash: 0,
    });
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function update() {
  if (state.gameOver) return;

  state.tick += 1;
  state.paddle.x = clamp(state.paddle.x + state.paddle.vx, 10, state.width - state.paddle.w - 10);

  const previousBall = { x: state.ball.x, y: state.ball.y };
  state.ball.x += state.ball.vx;
  state.ball.y += state.ball.vy;

  if (state.ball.x <= 10 || state.ball.x + state.ball.size >= state.width - 10) {
    state.ball.vx *= -1;
  }
  if (state.ball.y <= state.hudHeight + 10) {
    state.ball.vy *= -1;
  }
  if (state.ball.y > state.height) {
    state.gameOver = true;
  }

  collidePaddle();
  collideBricks(previousBall);

  state.bricks = state.bricks.filter((brick) => brick.alive || brick.flash > 0);
  state.bricks.forEach((brick) => {
    brick.flash = Math.max(0, brick.flash - 1);
  });

  if (state.broken >= state.nextGrowthAt) {
    addBrickRow(true);
    state.nextGrowthAt += 6;
  }

  for (const brick of state.bricks) {
    if (brick.alive && brick.y + brick.h >= state.paddle.y - 8) {
      state.gameOver = true;
      break;
    }
  }
}

function collidePaddle() {
  if (
    state.ball.x + state.ball.size >= state.paddle.x &&
    state.ball.x <= state.paddle.x + state.paddle.w &&
    state.ball.y + state.ball.size >= state.paddle.y &&
    state.ball.y <= state.paddle.y + state.paddle.h &&
    state.ball.vy > 0
  ) {
    const hit = (state.ball.x + state.ball.size / 2 - state.paddle.x) / state.paddle.w;
    state.ball.vx = (hit - 0.5) * 7.2;
    state.ball.vy = -Math.max(3.2, 5.8 - Math.abs(state.ball.vx) * 0.18);
    state.ball.y = state.paddle.y - state.ball.size - 1;
  }
}

function collideBricks(previousBall) {
  for (const brick of state.bricks) {
    if (!brick.alive) continue;
    const hit = getBrickHit(previousBall, state.ball, brick);
    if (!hit) {
      continue;
    }

    brick.alive = false;
    brick.flash = 8;
    state.broken += 1;
    state.score += brick.special ? 2 : 1;
    scoreEl.textContent = String(state.score).padStart(2, "0");

    if (brick.special) {
      state.acquired.push(brick.label);
      renderAcquired();
    }

    if (hit.axis === "x") {
      state.ball.vx *= -1;
      state.ball.x = previousBall.x;
    } else {
      state.ball.vy *= -1;
      state.ball.y = previousBall.y;
    }
    break;
  }
}

function getBrickHit(previousBall, ball, brick) {
  const size = ball.size;
  const prevCenterX = previousBall.x + size / 2;
  const prevCenterY = previousBall.y + size / 2;
  const nextCenterX = ball.x + size / 2;
  const nextCenterY = ball.y + size / 2;
  const dx = nextCenterX - prevCenterX;
  const dy = nextCenterY - prevCenterY;

  const expanded = {
    left: brick.x - size / 2,
    right: brick.x + brick.w + size / 2,
    top: brick.y - size / 2,
    bottom: brick.y + brick.h + size / 2,
  };

  let txMin = -Infinity;
  let txMax = Infinity;
  let tyMin = -Infinity;
  let tyMax = Infinity;

  if (dx === 0) {
    if (prevCenterX < expanded.left || prevCenterX > expanded.right) return null;
  } else {
    txMin = (expanded.left - prevCenterX) / dx;
    txMax = (expanded.right - prevCenterX) / dx;
    if (txMin > txMax) [txMin, txMax] = [txMax, txMin];
  }

  if (dy === 0) {
    if (prevCenterY < expanded.top || prevCenterY > expanded.bottom) return null;
  } else {
    tyMin = (expanded.top - prevCenterY) / dy;
    tyMax = (expanded.bottom - prevCenterY) / dy;
    if (tyMin > tyMax) [tyMin, tyMax] = [tyMax, tyMin];
  }

  const entry = Math.max(txMin, tyMin);
  const exit = Math.min(txMax, tyMax);
  if (entry > exit || exit < 0 || entry > 1) return null;

  return { axis: txMin > tyMin ? "x" : "y" };
}

function draw() {
  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, state.width, state.height);
  drawDither();
  drawBricks();
  drawPaddle();
  drawBall();
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

function drawBricks() {
  state.bricks.forEach((brick) => {
    if (!brick.alive && brick.flash === 0) return;

    const fill = brick.special ? "#d72d25" : "#f5f0e8";
    const inset = brick.special ? "#f5f0e8" : "#070707";
    const ghost = !brick.alive;

    ctx.globalAlpha = ghost ? 0.35 : 1;
    ctx.fillStyle = fill;
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    ctx.fillStyle = inset;
    ctx.fillRect(brick.x + 3, brick.y + 3, brick.w - 6, brick.h - 6);

    if (brick.special) {
      drawBrickLabel(brick);
    }
    ctx.globalAlpha = 1;
  });
}

function drawBrickLabel(brick) {
  ctx.save();
  ctx.translate(brick.x + brick.w / 2, brick.y + brick.h / 2 + 1);
  ctx.scale(1.38, 0.92);
  ctx.fillStyle = "#070707";
  ctx.font = "700 11px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(brick.label.toUpperCase(), 0, 0);
  ctx.restore();
}

function drawPaddle() {
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);
  ctx.fillStyle = "#070707";
  ctx.fillRect(state.paddle.x + 5, state.paddle.y + 4, state.paddle.w - 10, state.paddle.h - 8);
  ctx.fillStyle = "#d72d25";
  ctx.fillRect(state.paddle.x + state.paddle.w / 2 - 22, state.paddle.y + 4, 44, state.paddle.h - 8);
}

function drawBall() {
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(state.ball.x, state.ball.y, state.ball.size, state.ball.size);
  ctx.fillStyle = "#d72d25";
  ctx.fillRect(state.ball.x + 2, state.ball.y + 2, state.ball.size - 4, state.ball.size - 4);
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
  ctx.fillText("GAME OVER", state.width / 2, state.height / 2 - 18);
  ctx.fillStyle = "#d72d25";
  ctx.font = "700 13px Courier New";
  ctx.fillText("BREAK MORE BEATS", state.width / 2, state.height / 2 + 20);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    state.paddle.vx = -state.paddle.speed;
    event.preventDefault();
  } else if (event.key === "ArrowRight") {
    state.paddle.vx = state.paddle.speed;
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" && state.paddle.vx < 0) {
    state.paddle.vx = 0;
  } else if (event.key === "ArrowRight" && state.paddle.vx > 0) {
    state.paddle.vx = 0;
  }
});

restartButton.addEventListener("click", reset);

reset();
loop();
