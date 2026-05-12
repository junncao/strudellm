const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const statusEl = document.querySelector("#status");
const restartButton = document.querySelector("#restart");

const REELS = [
  {
    title: "RHYTHM",
    items: ["7", "4/4", "SWING", "BREAK", "SHUFFLE", "HALF-TIME", "SYNCOP"],
  },
  {
    title: "COLOR",
    items: ["7", "WARM", "DUSTY", "BRIGHT", "DARK", "GLASSY", "SATURATED"],
  },
  {
    title: "INSTRUMENT",
    items: ["7", "808", "ARP", "CHORDS", "BASS", "CLAP", "PAD"],
  },
];

const state = {
  width: canvas.width,
  height: canvas.height,
  hudHeight: 44,
  leverPulled: false,
  spinning: false,
  stopFrame: 0,
  reels: REELS.map(() => ({
    current: "7",
    display: "7",
    spinSpeed: 0,
    target: "7",
    stopAt: 0,
    bounce: 0,
  })),
};

function reset() {
  state.leverPulled = false;
  state.spinning = false;
  state.stopFrame = 0;
  state.reels = REELS.map(() => ({
    current: "7",
    display: "7",
    spinSpeed: 0,
    target: "7",
    stopAt: 0,
    bounce: 0,
  }));
  statusEl.textContent = "READY";
}

function randomItem(reelIndex) {
  const pool = REELS[reelIndex].items.slice(1);
  return pool[Math.floor(Math.random() * pool.length)];
}

function pullLever() {
  if (state.spinning) return;

  state.leverPulled = true;
  state.spinning = true;
  statusEl.textContent = "SPINNING";
  state.stopFrame = 0;

  state.reels.forEach((reel, index) => {
    reel.spinSpeed = 7 - index * 0.8;
    reel.target = randomItem(index);
    reel.stopAt = 68 + index * 34;
    reel.bounce = 0;
  });
}

function update() {
  if (state.spinning) {
    state.stopFrame += 1;
  }

  state.reels.forEach((reel, index) => {
    if (!state.spinning) {
      reel.bounce *= 0.82;
      return;
    }

    if (state.stopFrame >= reel.stopAt) {
      reel.current = reel.target;
      reel.display = reel.target;
      reel.spinSpeed = 0;
      reel.bounce = Math.max(reel.bounce, 8);
    } else {
      const sequence = REELS[index].items;
      const nextIndex = (Math.floor(state.stopFrame / Math.max(1, 10 - reel.spinSpeed)) + index) % sequence.length;
      reel.display = sequence[nextIndex];
    }

    reel.bounce *= 0.78;
  });

  if (state.spinning && state.reels.every((reel) => reel.spinSpeed === 0)) {
    state.spinning = false;
    state.leverPulled = false;
    statusEl.textContent = `${state.reels[0].current} / ${state.reels[1].current} / ${state.reels[2].current}`;
  }
}

function draw() {
  drawBackdrop();
  drawCabinet();
  drawReels();
  drawLever();
  drawInstructions();
  drawFrame();
}

function drawBackdrop() {
  const bg = ctx.createLinearGradient(0, state.hudHeight, 0, state.height);
  bg.addColorStop(0, "#201418");
  bg.addColorStop(0.55, "#110d10");
  bg.addColorStop(1, "#080708");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.fillStyle = "rgba(255, 203, 128, 0.06)";
  for (let i = 0; i < 18; i += 1) {
    ctx.beginPath();
    ctx.arc(60 + i * 46, 118 + (i % 2) * 8, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCabinet() {
  const marqueeGlow = ctx.createLinearGradient(0, 48, 0, 102);
  marqueeGlow.addColorStop(0, "#fff7c9");
  marqueeGlow.addColorStop(0.55, "#f1cf55");
  marqueeGlow.addColorStop(1, "#c18a1a");
  ctx.fillStyle = marqueeGlow;
  roundRect(164, 48, 390, 58, 10, true, false);
  drawMarqueeTiles(174, 56, 370, 42);

  const shell = ctx.createLinearGradient(96, 82, 692, 388);
  shell.addColorStop(0, "#d9dbe0");
  shell.addColorStop(0.25, "#8a9099");
  shell.addColorStop(0.55, "#f0f2f4");
  shell.addColorStop(0.78, "#7e848f");
  shell.addColorStop(1, "#454a53");
  ctx.fillStyle = shell;
  roundRect(98, 86, 612, 314, 18, true, false);

  const bezel = ctx.createLinearGradient(120, 110, 668, 360);
  bezel.addColorStop(0, "#666b73");
  bezel.addColorStop(0.35, "#1f2229");
  bezel.addColorStop(0.65, "#8d939d");
  bezel.addColorStop(1, "#3d424a");
  ctx.fillStyle = bezel;
  roundRect(118, 108, 556, 250, 16, true, false);

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.5;
  roundRect(126, 116, 540, 234, 14, false, true);

  const marqueePlate = ctx.createLinearGradient(180, 68, 180, 116);
  marqueePlate.addColorStop(0, "#f6f6f7");
  marqueePlate.addColorStop(1, "#d6d7db");
  ctx.fillStyle = marqueePlate;
  roundRect(180, 72, 428, 42, 8, true, false);
  ctx.fillStyle = "#2e3137";
  ctx.font = "700 22px Avenir Next";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TRIPLE SEVEN", 394, 94);

  const glass = ctx.createLinearGradient(144, 136, 144, 336);
  glass.addColorStop(0, "#565c65");
  glass.addColorStop(0.18, "#171a20");
  glass.addColorStop(0.82, "#0d0f12");
  glass.addColorStop(1, "#3d4249");
  ctx.fillStyle = glass;
  roundRect(144, 136, 500, 206, 10, true, false);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  roundRect(156, 146, 474, 22, 8, true, false);

  const controlPanel = ctx.createLinearGradient(120, 372, 120, 476);
  controlPanel.addColorStop(0, "#5b6068");
  controlPanel.addColorStop(0.28, "#1d2025");
  controlPanel.addColorStop(0.8, "#09090a");
  controlPanel.addColorStop(1, "#444952");
  ctx.fillStyle = controlPanel;
  roundRect(112, 364, 590, 116, 12, true, false);

  drawButton(160, 390, 112, 44, ["#ff5a5a", "#b31111"], "BET\nONE");
  drawButton(296, 390, 112, 44, ["#86e84f", "#2e8d15"], "BET\nMAX");
  drawButton(432, 390, 112, 44, ["#ffd45f", "#b98511"], "SPIN");

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  roundRect(580, 398, 78, 60, 10, true, false);
}

function drawReels() {
  const reelWidth = 148;
  const reelHeight = 126;
  const startX = 160;
  const gap = 22;
  const y = 172;

  state.reels.forEach((reel, index) => {
    const x = startX + index * (reelWidth + gap);
    const bounceOffset = reel.bounce * 0.45;

    const frame = ctx.createLinearGradient(x, y, x + reelWidth, y + reelHeight);
    frame.addColorStop(0, "#d8dbe0");
    frame.addColorStop(0.22, "#7f858e");
    frame.addColorStop(0.55, "#f5f6f7");
    frame.addColorStop(0.82, "#7d838d");
    frame.addColorStop(1, "#cfd2d7");
    ctx.fillStyle = frame;
    roundRect(x, y + bounceOffset, reelWidth, reelHeight, 10, true, false);

    ctx.fillStyle = "#2a2c31";
    roundRect(x + 6, y + 6 + bounceOffset, reelWidth - 12, reelHeight - 12, 8, true, false);

    const paper = ctx.createLinearGradient(0, y + 20, 0, y + reelHeight - 20);
    paper.addColorStop(0, "#fbfbfb");
    paper.addColorStop(0.48, "#f2f2f2");
    paper.addColorStop(1, "#dadbdd");
    ctx.fillStyle = paper;
    roundRect(x + 18, y + 16 + bounceOffset, reelWidth - 36, reelHeight - 32, 6, true, false);

    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(x + 18, y + 55 + bounceOffset, reelWidth - 36, 2);

    ctx.fillStyle = "#ececec";
    ctx.font = "700 10px Avenir Next";
    ctx.textAlign = "center";
    ctx.fillText(REELS[index].title, x + reelWidth / 2, y - 12);

    drawReelLabel(reel.display, x + reelWidth / 2, y + reelHeight / 2 + 4 + bounceOffset);
  });
}

function drawReelLabel(text, x, y) {
  ctx.save();
  ctx.translate(x, y);
  const isSeven = text === "7";
  if (isSeven) {
    ctx.scale(1.06, 1.32);
    const sevenFill = ctx.createLinearGradient(0, -26, 0, 26);
    sevenFill.addColorStop(0, "#ff9da1");
    sevenFill.addColorStop(0.24, "#ff3c56");
    sevenFill.addColorStop(0.6, "#c20c24");
    sevenFill.addColorStop(1, "#75040e");
    ctx.fillStyle = sevenFill;
    ctx.shadowColor = "rgba(255, 70, 97, 0.35)";
    ctx.shadowBlur = 10;
    ctx.font = "700 40px Avenir Next";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(90, 0, 8, 0.45)";
    ctx.lineWidth = 1.4;
    ctx.strokeText(text, 0, 0);
  } else {
    drawTagToken(text, 0, 0);
  }
  ctx.restore();
}

function drawTagToken(text, x, y) {
  ctx.save();
  ctx.translate(x, y);
  drawTagIcon(text, 0, -18, 1.7);
  ctx.fillStyle = "#17191d";
  ctx.font = "700 18px Avenir Next";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.scale(1.18, 1);
  ctx.fillText(text, 0, 24);
  ctx.restore();
}

function drawTagIcon(text, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (["4/4", "SWING", "BREAK", "SHUFFLE", "HALF-TIME", "SYNCOP"].includes(text)) {
    drawRhythmIcon(text);
  } else if (["WARM", "DUSTY", "BRIGHT", "DARK", "GLASSY", "SATURATED"].includes(text)) {
    drawColorIcon(text);
  } else {
    drawInstrumentIcon(text);
  }

  ctx.restore();
}

function drawRhythmIcon(text) {
  ctx.fillStyle = "#ebedf0";
  roundRect(-11, -11, 22, 22, 5, true, false);
  ctx.fillStyle = "#23262d";

  if (text === "4/4") {
    ctx.fillRect(-6, -6, 2, 12);
    ctx.fillRect(0, -6, 2, 12);
    ctx.fillRect(-8, -1, 12, 2);
    return;
  }
  if (text === "SWING") {
    ctx.beginPath();
    ctx.arc(-3, 1, 3, 0, Math.PI * 2);
    ctx.arc(4, -1, 3, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (text === "BREAK") {
    ctx.fillRect(-6, -4, 4, 8);
    ctx.fillRect(2, -4, 4, 8);
    return;
  }
  if (text === "SHUFFLE") {
    ctx.fillRect(-7, -3, 5, 3);
    ctx.fillRect(0, 1, 5, 3);
    return;
  }
  if (text === "HALF-TIME") {
    ctx.fillRect(-7, -1, 4, 4);
    ctx.fillRect(3, -1, 4, 4);
    return;
  }

  ctx.beginPath();
  ctx.moveTo(-7, 3);
  ctx.lineTo(-2, -3);
  ctx.lineTo(1, 0);
  ctx.lineTo(7, -6);
  ctx.lineTo(7, -1);
  ctx.lineTo(1, 5);
  ctx.lineTo(-2, 2);
  ctx.closePath();
  ctx.fill();
}

function drawColorIcon(text) {
  let fill = "#ffd66e";
  if (text === "DUSTY") fill = "#b8927c";
  if (text === "BRIGHT") fill = "#fff15a";
  if (text === "DARK") fill = "#5c606a";
  if (text === "GLASSY") fill = "#7ad6ff";
  if (text === "SATURATED") fill = "#ff517a";

  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.bezierCurveTo(8, -10, 10, -2, 10, 3);
  ctx.bezierCurveTo(10, 8, 5, 11, 0, 11);
  ctx.bezierCurveTo(-5, 11, -10, 8, -10, 3);
  ctx.bezierCurveTo(-10, -2, -8, -10, 0, -11);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(-3, -1, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawInstrumentIcon(text) {
  ctx.fillStyle = "#eceef1";
  roundRect(-11, -11, 22, 22, 5, true, false);
  ctx.fillStyle = "#202329";

  if (text === "808") {
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#eceef1";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (text === "ARP") {
    ctx.fillRect(-7, 4, 14, 2);
    ctx.fillRect(-5, 0, 2, 4);
    ctx.fillRect(-1, -4, 2, 8);
    ctx.fillRect(3, -8, 2, 12);
    return;
  }
  if (text === "CHORDS") {
    ctx.fillRect(-7, -6, 14, 12);
    ctx.fillStyle = "#eceef1";
    ctx.fillRect(-5, -4, 3, 8);
    ctx.fillRect(1, -4, 3, 8);
    return;
  }
  if (text === "BASS") {
    ctx.beginPath();
    ctx.arc(-2, -1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(2, -3, 5, 4);
    return;
  }
  if (text === "CLAP") {
    ctx.fillRect(-6, -5, 4, 10);
    ctx.fillRect(2, -5, 4, 10);
    ctx.fillRect(-1, -7, 2, 14);
    return;
  }

  ctx.fillRect(-8, -8, 16, 16);
  ctx.fillStyle = "#eceef1";
  ctx.fillRect(-4, -4, 8, 8);
}

function drawLever() {
  const baseX = 742;
  const baseY = 180;
  const leverDown = state.leverPulled || state.spinning;
  const handleY = leverDown ? baseY + 116 : baseY + 30;
  const handleX = leverDown ? baseX + 26 : baseX + 6;

  const rail = ctx.createLinearGradient(0, baseY, 0, baseY + 136);
  rail.addColorStop(0, "#c8ccd2");
  rail.addColorStop(1, "#767d86");
  ctx.fillStyle = rail;
  roundRect(baseX - 4, baseY - 6, 28, 152, 12, true, false);
  ctx.fillStyle = "#2a2d32";
  roundRect(baseX + 4, baseY + 6, 10, 126, 6, true, false);

  ctx.strokeStyle = "#dadce1";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(baseX + 10, baseY + 10);
  ctx.lineTo(handleX, handleY);
  ctx.stroke();

  const cap = ctx.createRadialGradient(handleX - 4, handleY - 6, 3, handleX, handleY, 18);
  cap.addColorStop(0, "#f0ffb0");
  cap.addColorStop(0.35, "#7dd648");
  cap.addColorStop(1, "#2c9426");
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.arc(handleX, handleY, 18, 0, Math.PI * 2);
  ctx.fill();
}

function drawInstructions() {
  ctx.fillStyle = "rgba(70, 70, 74, 0.9)";
  ctx.font = "700 13px Avenir Next";
  ctx.textAlign = "center";
  ctx.fillText("PRESS SPACE OR CLICK LEVER TO SPIN", state.width / 2, 456);
}

function drawFrame() {
  ctx.strokeStyle = "#fafafa";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, state.hudHeight + 2, state.width - 4, state.height - state.hudHeight - 4);
  ctx.strokeStyle = "#8c8f95";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, state.hudHeight + 10, state.width - 20, state.height - state.hudHeight - 20);
}

function drawButton(x, y, width, height, colors, label) {
  const bg = ctx.createLinearGradient(0, y, 0, y + height);
  bg.addColorStop(0, colors[0]);
  bg.addColorStop(1, colors[1]);
  ctx.fillStyle = bg;
  roundRect(x, y, width, height, 12, true, false);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  roundRect(x + 6, y + 6, width - 12, height / 2 - 6, 8, true, false);

  ctx.fillStyle = "#fff9ef";
  ctx.font = "700 12px Avenir Next";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = label.split("\n");
  if (lines.length === 2) {
    ctx.fillText(lines[0], x + width / 2, y + 16);
    ctx.fillText(lines[1], x + width / 2, y + 31);
  } else {
    ctx.fillText(label, x + width / 2, y + height / 2 + 1);
  }
}

function drawMarqueeTiles(x, y, width, height) {
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 15; col += 1) {
      const shade = (row + col) % 3;
      ctx.fillStyle = shade === 0 ? "rgba(255,255,255,0.34)" : shade === 1 ? "rgba(255,220,110,0.5)" : "rgba(237,176,36,0.46)";
      ctx.fillRect(x + col * 24, y + row * 14, 18, 10);
    }
  }
}

function roundRect(x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    pullLever();
  }
});

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  if (x >= 700 && x <= 820 && y >= 160 && y <= 330) {
    pullLever();
  }
});

restartButton.addEventListener("click", reset);

reset();
loop();
