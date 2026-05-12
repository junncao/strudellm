const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const sampleList = document.querySelector("#sample-list");
const restartButton = document.querySelector("#restart");

const TERMS = [
  "kick",
  "bass",
  "4/4 kick",
  "funky bass",
  "acid",
  "hi hat",
  "16th hi hat",
  "disco",
  "trap",
  "snare",
  "808",
  "breakbeat",
  "swing",
  "clap",
  "sub",
  "arp",
];

const SEGMENT_SPACING = 4;
const BODY_SIZE = 14;

const state = {
  width: canvas.width,
  height: canvas.height,
  hudHeight: 44,
  head: { x: 450, y: 260 },
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  trail: [],
  eaten: [],
  foods: [],
  score: 0,
  tick: 0,
  crashed: false,
};

function reset() {
  state.head = { x: state.width / 2, y: state.height / 2 };
  state.dir = { x: 1, y: 0 };
  state.nextDir = { x: 1, y: 0 };
  state.trail = [];
  state.eaten = [];
  state.foods = [];
  state.score = 0;
  state.tick = 0;
  state.crashed = false;
  scoreEl.textContent = "00";
  renderSamples();

  for (let i = 0; i < 9; i += 1) {
    spawnFood();
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomTerm() {
  return TERMS[Math.floor(Math.random() * TERMS.length)];
}

function spawnFood() {
  const padding = 52;
  const minFoodDistance = 96;
  const bottomReserve = 82;
  let candidate;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    candidate = {
      x: padding + Math.random() * (state.width - padding * 2),
      y:
        state.hudHeight +
        padding +
        Math.random() * (state.height - state.hudHeight - padding - bottomReserve),
      term: randomTerm(),
      pulse: Math.random() * Math.PI * 2,
    };

    const clearOfFoods = state.foods.every((food) => distance(food, candidate) > minFoodDistance);
    const clearOfSnake = distance(state.head, candidate) > 110;
    if (clearOfFoods && clearOfSnake) break;
  }

  state.foods.push(candidate);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function update() {
  if (state.crashed) return;

  state.tick += 1;
  state.dir.x = state.nextDir.x;
  state.dir.y = state.nextDir.y;

  const speed = 3.2;
  state.head.x += state.dir.x * speed;
  state.head.y += state.dir.y * speed;

  if (
    state.head.x < 8 ||
    state.head.x > state.width - 8 ||
    state.head.y < state.hudHeight + 8 ||
    state.head.y > state.height - 8
  ) {
    state.crashed = true;
  }

  state.trail.unshift({ x: state.head.x, y: state.head.y, angle: Math.atan2(state.dir.y, state.dir.x) });
  const maxTrail = segmentCount() * SEGMENT_SPACING + 48;
  if (state.trail.length > maxTrail) {
    state.trail.length = maxTrail;
  }

  for (let i = state.foods.length - 1; i >= 0; i -= 1) {
    const food = state.foods[i];
    if (distance(state.head, food) < 23) {
      state.eaten.push(food.term);
      state.foods.splice(i, 1);
      state.score += 1;
      scoreEl.textContent = String(state.score).padStart(2, "0");
      renderSamples();
      while (state.foods.length < 9) spawnFood();
    }
  }

}

function segmentCount() {
  return 7 + state.eaten.length;
}

function renderSamples() {
  sampleList.replaceChildren();
  state.eaten.forEach((term) => {
    const item = document.createElement("li");
    item.textContent = term;
    sampleList.append(item);
  });
}

function draw() {
  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, state.width, state.height);
  drawDither();
  drawFoods();
  drawSnake();
  drawFrame();

  if (state.crashed) {
    drawCrash();
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

function drawFoods() {
  state.foods.forEach((food) => {
    const wobble = Math.sin(state.tick / 14 + food.pulse) * 2;
    const labelWidth = Math.max(34, food.term.length * 7 + 12);
    const x = clamp(food.x - labelWidth / 2, 18, state.width - labelWidth - 18);
    const y = clamp(food.y + wobble - 11, state.hudHeight + 18, state.height - 92);

    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(x, y, labelWidth, 22);
    ctx.fillStyle = "#070707";
    ctx.fillRect(x + 3, y + 3, labelWidth - 6, 16);
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "700 11px Courier New";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(food.term.toUpperCase(), x + labelWidth / 2, y + 12);
  });
}

function drawSnake() {
  const count = segmentCount();

  for (let i = count - 1; i >= 0; i -= 1) {
    const point = state.trail[i * SEGMENT_SPACING];
    if (!point) continue;

    const isHead = i === 0;
    drawSegment(point.x, point.y, point.angle, isHead, i);
  }
}

function drawSegment(x, y, angle, isHead) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (isHead) {
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(-15, -13, 30, 26);
    ctx.fillStyle = "#070707";
    ctx.fillRect(2, -7, 5, 5);
    ctx.fillRect(2, 3, 5, 5);
    ctx.fillStyle = "#d72d25";
    ctx.fillRect(12, -3, 8, 6);
  } else {
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(-BODY_SIZE / 2, -BODY_SIZE / 2, BODY_SIZE, BODY_SIZE);
    ctx.fillStyle = "#070707";
    ctx.fillRect(-BODY_SIZE / 2 + 4, -BODY_SIZE / 2 + 4, BODY_SIZE - 8, BODY_SIZE - 8);
  }

  ctx.restore();
}

function drawFrame() {
  ctx.strokeStyle = "#f5f0e8";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, state.hudHeight + 2, state.width - 4, state.height - state.hudHeight - 4);
  ctx.strokeStyle = "#d72d25";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, state.hudHeight + 10, state.width - 20, state.height - state.hudHeight - 20);
}

function drawCrash() {
  ctx.fillStyle = "rgba(7, 7, 7, 0.82)";
  ctx.fillRect(0, state.hudHeight, state.width, state.height - state.hudHeight);
  ctx.fillStyle = "#f5f0e8";
  ctx.font = "700 30px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GAME OVER", state.width / 2, state.height / 2 - 18);
  ctx.fillStyle = "#d72d25";
  ctx.font = "700 13px Courier New";
  ctx.fillText("RESET TO DROP AGAIN", state.width / 2, state.height / 2 + 20);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };
  const next = directions[event.key];
  if (!next) return;

  event.preventDefault();
  const isReverse = next.x + state.dir.x === 0 && next.y + state.dir.y === 0;
  if (!isReverse) {
    state.nextDir = next;
  }
});
restartButton.addEventListener("click", reset);

reset();
loop();
