const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const statusEl = document.querySelector("#status");
const sampleList = document.querySelector("#sample-list");
const restartButton = document.querySelector("#restart");

const TAGS = [
  "acid",
  "swing",
  "disco",
  "garage",
  "808",
  "hi hat",
  "breakbeat",
  "jungle",
  "bassline",
  "house",
  "shuffle",
  "glassy",
];

const PALETTES = [
  { top: "#ff6b7d", bottom: "#1a1a22", accent: "#ffd5dc" },
  { top: "#ffd166", bottom: "#433315", accent: "#fff1bf" },
  { top: "#7bdff2", bottom: "#18303f", accent: "#c2f5ff" },
  { top: "#98f58d", bottom: "#223924", accent: "#d9ffd0" },
  { top: "#bd93ff", bottom: "#281a46", accent: "#e5d9ff" },
  { top: "#ff9f68", bottom: "#492515", accent: "#ffd6be" },
  { top: "#f6f2ef", bottom: "#4a4345", accent: "#ffffff" },
  { top: "#fb85b5", bottom: "#4f1f36", accent: "#ffd6e8" },
];

const SKIN_TONES = ["#f6dbc8", "#efc8ab", "#d8a17e", "#8e5d43"];
const HAIR = ["#111111", "#35231a", "#6b4625", "#7b1f2e", "#d5b36a"];
const MEDKIT_HEAL = 4;

const state = {
  width: canvas.width,
  height: canvas.height,
  hudHeight: 42,
  boothHeight: 170,
  people: [],
  medkits: [],
  fx: [],
  player: null,
  input: { left: false, right: false, up: false, down: false, attack: false },
  tick: 0,
  acquired: [],
  statusFlash: 0,
  gameOver: false,
  medkitTimer: 320,
};

function reset() {
  state.people = [];
  state.medkits = [];
  state.fx = [];
  state.acquired = [];
  state.tick = 0;
  state.statusFlash = 0;
  state.gameOver = false;
  state.medkitTimer = 260 + Math.random() * 180;
  state.player = createPlayer();
  spawnCrowd(20);
  refreshStatus();
  renderAcquired();
}

function createPlayer() {
  return {
    x: state.width / 2,
    y: 536,
    vx: 0,
    vy: 0,
    facing: 1,
    radius: 19,
    gender: "male",
    body: buildOutfit("male", true),
    hp: 12,
    maxHp: 12,
    attackTimer: 0,
    attackCooldown: 0,
    hurtTimer: 0,
    attackPose: 0,
    invuln: 0,
    step: 0,
  };
}

function spawnCrowd(count) {
  const taggedSlots = new Set();
  while (taggedSlots.size < 8) {
    taggedSlots.add(Math.floor(Math.random() * count));
  }

  for (let i = 0; i < count; i += 1) {
    const gender = Math.random() > 0.48 ? "female" : "male";
    const tagged = taggedSlots.has(i);
    const outfit = buildOutfit(gender, false);
    state.people.push({
      x: 90 + Math.random() * (state.width - 180),
      y: state.boothHeight + 92 + Math.random() * (state.height - state.boothHeight - 158),
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      driftTimer: 18 + Math.random() * 90,
      radius: 17 + Math.random() * 1.5,
      gender,
      body: outfit,
      tagged,
      tag: tagged ? TAGS[Math.floor(Math.random() * TAGS.length)] : "",
      hp: tagged ? 5 : 0,
      maxHp: tagged ? 5 : 0,
      downed: false,
      downTimer: 0,
      dancePhase: Math.random() * Math.PI * 2,
      hurtTimer: 0,
      attackCooldown: 36 + Math.random() * 30,
      attackPose: 0,
      step: Math.random() * Math.PI * 2,
      aggro: 0,
      facing: Math.random() > 0.5 ? 1 : -1,
      hitBy: 0,
      groove: 0.85 + Math.random() * 0.9,
    });
  }
}

function buildOutfit(gender, isPlayer) {
  const palette = isPlayer ? { top: "#f8fff3", bottom: "#12141d", accent: "#63f5c8" } : PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const femaleBottom = Math.random() > 0.45 ? "skirt" : "pants";
  const topType = Math.random() > 0.45 ? "jacket" : "tee";
  return {
    skin: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
    hair: HAIR[Math.floor(Math.random() * HAIR.length)],
    topColor: palette.top,
    bottomColor: palette.bottom,
    accentColor: palette.accent,
    topType: isPlayer ? "jacket" : topType,
    bottomType: isPlayer ? "pants" : gender === "female" ? femaleBottom : "pants",
    hairStyle: gender === "female" ? (Math.random() > 0.5 ? "long" : "bob") : (Math.random() > 0.5 ? "fade" : "part"),
    bodyType: gender === "female" ? "curved" : "straight",
    shoeColor: "#ffffff",
  };
}

function refreshStatus() {
  statusEl.textContent = state.gameOver ? "PLAYER DOWN" : `ACQUIRED ${String(state.acquired.length).padStart(2, "0")}`;
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
  state.tick += 1;
  state.statusFlash = Math.max(0, state.statusFlash - 0.035);
  updatePlayer();
  updateCrowd();
  updateMedkits();
  updateFx();
  maybeSpawnMedkit();
}

function updatePlayer() {
  const player = state.player;

  if (state.gameOver) {
    player.vx *= 0.7;
    player.vy *= 0.7;
    player.attackPose = Math.max(0, player.attackPose - 0.08);
    player.hurtTimer = Math.max(0, player.hurtTimer - 1);
    return;
  }

  let dx = 0;
  let dy = 0;
  if (state.input.left) dx -= 1;
  if (state.input.right) dx += 1;
  if (state.input.up) dy -= 1;
  if (state.input.down) dy += 1;

  const len = Math.hypot(dx, dy) || 1;
  const speed = 3.65;
  player.vx = (dx / len) * speed;
  player.vy = (dy / len) * speed;
  if (dx !== 0) player.facing = dx > 0 ? 1 : -1;

  player.x = clamp(player.x + player.vx, 48, state.width - 48);
  player.y = clamp(player.y + player.vy, state.boothHeight + 60, state.height - 54);

  if (state.input.attack && player.attackCooldown <= 0) {
    player.attackCooldown = 15;
    player.attackTimer = 7;
    player.attackPose = 1;
    punchNearby();
  }

  player.attackTimer = Math.max(0, player.attackTimer - 1);
  player.attackCooldown = Math.max(0, player.attackCooldown - 1);
  player.attackPose = Math.max(0, player.attackPose - 0.18);
  player.hurtTimer = Math.max(0, player.hurtTimer - 1);
  player.invuln = Math.max(0, player.invuln - 1);
  player.step += 0.14 + Math.abs(player.vx + player.vy) * 0.03;
}

function punchNearby() {
  const player = state.player;
  let struck = false;

  for (const person of state.people) {
    if (!person.tagged || person.downed) continue;
    const dx = person.x - player.x;
    const dy = person.y - player.y;
    const distance = Math.hypot(dx, dy);
    const inFront = player.facing > 0 ? dx > -14 : dx < 14;

    if (distance < 84 && inFront) {
      person.hp -= 2;
      person.hurtTimer = 10;
      person.attackPose = 0.2;
      person.facing = dx > 0 ? -1 : 1;
      person.x += player.facing * 15;
      person.y += dy > 0 ? 5 : -5;
      person.aggro = 200;
      person.hitBy = 16;
      spawnImpact(person.x, person.y - 18, "#fff4bf");

      if (person.hp <= 0) {
        person.downed = true;
        person.downTimer = 180;
        if (!state.acquired.includes(person.tag)) {
          state.acquired.push(person.tag);
        }
        state.statusFlash = 1;
        refreshStatus();
        renderAcquired();
      }

      struck = true;
      break;
    }
  }

  if (!struck) {
    spawnImpact(player.x + player.facing * 28, player.y - 16, "#ffc5d1", 0.65);
  }
}

function updateCrowd() {
  for (const person of state.people) {
    if (person.downed) {
      person.downTimer -= 1;
      person.hurtTimer = Math.max(0, person.hurtTimer - 1);
      person.attackPose = Math.max(0, person.attackPose - 0.08);
      continue;
    }

    const toPlayerX = state.player.x - person.x;
    const toPlayerY = state.player.y - person.y;
    const distanceToPlayer = Math.hypot(toPlayerX, toPlayerY);

    if (person.tagged && !state.gameOver && distanceToPlayer < 150) {
      person.aggro = 160;
    } else {
      person.aggro = Math.max(0, person.aggro - 1);
    }

    if (person.aggro > 0 && person.tagged) {
      const step = Math.max(distanceToPlayer, 1);
      const chaseSpeed = distanceToPlayer > 72 ? 1.45 : 0.65;
      person.vx += (toPlayerX / step) * 0.09 * chaseSpeed;
      person.vy += (toPlayerY / step) * 0.09 * chaseSpeed;
      person.vx *= 0.88;
      person.vy *= 0.88;
      person.facing = toPlayerX > 0 ? 1 : -1;
      person.attackCooldown -= 1;

      if (distanceToPlayer < 66 && person.attackCooldown <= 0 && state.player.invuln <= 0) {
        enemyStrike(person);
      }
    } else {
      person.driftTimer -= 1;
      if (person.driftTimer <= 0) {
        person.vx = (Math.random() - 0.5) * 1.15;
        person.vy = (Math.random() - 0.5) * 1.15;
        person.driftTimer = 24 + Math.random() * 90;
      }
    }

    person.x = clamp(person.x + person.vx, 48, state.width - 48);
    person.y = clamp(person.y + person.vy, state.boothHeight + 56, state.height - 60);
    person.vx *= 0.94;
    person.vy *= 0.94;
    person.step += 0.12 + Math.abs(person.vx + person.vy) * 0.02;
    person.dancePhase += 0.16;
    person.hurtTimer = Math.max(0, person.hurtTimer - 1);
    person.attackPose = Math.max(0, person.attackPose - 0.14);
    person.hitBy = Math.max(0, person.hitBy - 1);
  }
}

function enemyStrike(person) {
  person.attackCooldown = 34 + Math.random() * 24;
  person.attackPose = 1;
  state.player.hp = Math.max(0, state.player.hp - 1);
  state.player.hurtTimer = 14;
  state.player.invuln = 22;
  state.player.x += person.facing * 10;
  spawnImpact(state.player.x, state.player.y - 18, "#ff768f");

  if (state.player.hp <= 0) {
    state.gameOver = true;
    refreshStatus();
  }
}

function maybeSpawnMedkit() {
  state.medkitTimer -= 1;
  if (state.medkitTimer > 0 || state.gameOver) return;

  const fromX = 280 + Math.random() * 420;
  const targetX = 90 + Math.random() * (state.width - 180);
  const targetY = state.boothHeight + 110 + Math.random() * (state.height - state.boothHeight - 150);

  state.medkits.push({
    x: fromX,
    y: 120,
    vx: (targetX - fromX) / 36,
    vy: 2.1,
    targetY,
    landed: false,
    pulse: Math.random() * Math.PI * 2,
    ttl: 520,
  });

  state.medkitTimer = 320 + Math.random() * 220;
}

function updateMedkits() {
  state.medkits = state.medkits.filter((medkit) => {
    if (!medkit.landed) {
      medkit.x += medkit.vx;
      medkit.y += medkit.vy;
      medkit.vy += 0.05;
      if (medkit.y >= medkit.targetY) {
        medkit.y = medkit.targetY;
        medkit.vx = 0;
        medkit.vy = 0;
        medkit.landed = true;
      }
    } else {
      medkit.pulse += 0.14;
      medkit.ttl -= 1;
    }

    if (!state.gameOver) {
      const distance = Math.hypot(state.player.x - medkit.x, state.player.y - medkit.y);
      if (distance < 30) {
        state.player.hp = clamp(state.player.hp + MEDKIT_HEAL, 0, state.player.maxHp);
        state.statusFlash = 0.6;
        spawnImpact(medkit.x, medkit.y - 10, "#a7ff9f", 0.9);
        return false;
      }
    }

    return medkit.ttl > 0;
  });
}

function spawnImpact(x, y, color, size = 1) {
  state.fx.push({ x, y, color, size, life: 14 });
}

function updateFx() {
  state.fx = state.fx.filter((fx) => {
    fx.life -= 1;
    return fx.life > 0;
  });
}

function draw() {
  drawBackdrop();
  drawBooth();
  drawDanceFloor();
  drawCrowd();
  drawMedkits();
  drawPlayer();
  drawFx();
  drawOverlay();
  drawFrame();
}

function drawBackdrop() {
  const bg = ctx.createLinearGradient(0, 0, 0, state.height);
  bg.addColorStop(0, "#1f1020");
  bg.addColorStop(0.3, "#140b18");
  bg.addColorStop(1, "#07070a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawBooth() {
  const ceiling = ctx.createLinearGradient(0, state.hudHeight, 0, state.boothHeight);
  ceiling.addColorStop(0, "#3a1630");
  ceiling.addColorStop(0.5, "#24101f");
  ceiling.addColorStop(1, "#120b14");
  ctx.fillStyle = ceiling;
  ctx.fillRect(0, state.hudHeight, state.width, state.boothHeight - state.hudHeight);

  const backWall = ctx.createLinearGradient(0, 70, 0, 160);
  backWall.addColorStop(0, "#32192c");
  backWall.addColorStop(1, "#1b111d");
  ctx.fillStyle = backWall;
  ctx.beginPath();
  ctx.moveTo(205, 70);
  ctx.lineTo(755, 70);
  ctx.lineTo(846, 160);
  ctx.lineTo(114, 160);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath();
  ctx.moveTo(248, 84);
  ctx.lineTo(712, 84);
  ctx.lineTo(745, 121);
  ctx.lineTo(215, 121);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 11; i += 1) {
    ctx.fillStyle = i % 2 ? "#ffcf65" : "#91f5ff";
    ctx.fillRect(194 + i * 57, 77 + (i % 3), 10, 7);
  }

  drawSpeaker(150, 90);
  drawSpeaker(810, 90);

  const desk = ctx.createLinearGradient(0, 104, 0, 170);
  desk.addColorStop(0, "#80506b");
  desk.addColorStop(0.45, "#4d2840");
  desk.addColorStop(1, "#1a0d1d");
  ctx.fillStyle = desk;
  ctx.beginPath();
  ctx.moveTo(255, 102);
  ctx.lineTo(705, 102);
  ctx.lineTo(790, 162);
  ctx.lineTo(170, 162);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,238,225,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(255, 102);
  ctx.lineTo(705, 102);
  ctx.lineTo(790, 162);
  ctx.stroke();

  drawTurntable(306, 123, 1);
  drawMixer(481, 119);
  drawTurntable(652, 123, -1);
  drawDeskFrontGlow();
  drawDJ(358, 118, "#14151b", "#9bf3ff", "#f0d8bf", "#161117", "#b8f8ff", -1);
  drawDJ(607, 118, "#f3eeed", "#ff7fa1", "#f0d8bf", "#2a2127", "#ffd4dd", 1);
}

function drawSpeaker(x, y) {
  ctx.save();
  const body = ctx.createLinearGradient(x - 26, y - 8, x + 26, y + 78);
  body.addColorStop(0, "#312d34");
  body.addColorStop(1, "#0c0b0f");
  ctx.fillStyle = body;
  roundedRectPath(ctx, x - 28, y - 8, 56, 86, 8);
  ctx.fill();
  ctx.strokeStyle = "#5c5860";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#151419";
  ctx.beginPath();
  ctx.arc(x, y + 18, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y + 51, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.arc(x, y + 51, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawTurntable(x, y, side) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(side, 1);
  ctx.fillStyle = "#19161d";
  ctx.beginPath();
  ctx.moveTo(-74, -8);
  ctx.lineTo(24, -8);
  ctx.lineTo(52, 17);
  ctx.lineTo(-54, 17);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2b2530";
  ctx.beginPath();
  ctx.ellipse(-26, 5, 34, 22, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#100f13";
  ctx.beginPath();
  ctx.ellipse(-26, 5, 26, 16, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#605867";
  ctx.beginPath();
  ctx.arc(-25, 5, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#c4bdb5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(12, -6);
  ctx.lineTo(44, -18);
  ctx.lineTo(50, -10);
  ctx.lineTo(19, 2);
  ctx.stroke();
  ctx.fillStyle = "#f4d7d7";
  ctx.fillRect(18, 0, 11, 4);
  ctx.restore();
}

function drawMixer(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#18141a";
  ctx.beginPath();
  ctx.moveTo(-54, -12);
  ctx.lineTo(54, -12);
  ctx.lineTo(68, 24);
  ctx.lineTo(-68, 24);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 5; i += 1) {
    const knobX = -34 + i * 17;
    ctx.fillStyle = i % 2 ? "#9bf3ff" : "#ffcf65";
    ctx.beginPath();
    ctx.arc(knobX, -2 + (i % 2), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 4; i += 1) {
    const laneX = -26 + i * 18;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(laneX, 2);
    ctx.lineTo(laneX, 18);
    ctx.stroke();
    ctx.fillStyle = i % 2 ? "#ff7fa1" : "#f7f3f0";
    ctx.fillRect(laneX - 4, 8 + ((i + Math.floor(state.tick / 7)) % 6), 8, 6);
  }

  ctx.fillStyle = "#ff5a73";
  ctx.fillRect(-4, 6, 8, 15);
  ctx.restore();
}

function drawDeskFrontGlow() {
  ctx.save();
  const glow = ctx.createLinearGradient(0, 124, 0, 158);
  glow.addColorStop(0, "rgba(255,117,160,0.42)");
  glow.addColorStop(1, "rgba(111,234,255,0.06)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.moveTo(236, 126);
  ctx.lineTo(724, 126);
  ctx.lineTo(760, 151);
  ctx.lineTo(198, 151);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDJ(x, y, shirt, glow, skin, hair, accent, stance) {
  const groove = Math.sin(state.tick * 0.08 + x * 0.01);
  ctx.save();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y - 29, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(x, y - 33, 14, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 12, y - 33, 24, 5);

  ctx.strokeStyle = "#171217";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 30, 15, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 17, y - 31);
  ctx.lineTo(x - 9, y - 31);
  ctx.moveTo(x + 9, y - 31);
  ctx.lineTo(x + 17, y - 31);
  ctx.stroke();

  ctx.fillStyle = shirt;
  roundedRectPath(ctx, x - 22, y - 11, 44, 35, 13);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillRect(x - 12, y - 3, 24, 4);
  ctx.fillRect(x - 4, y + 5, 8, 14);

  ctx.strokeStyle = skin;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 11, y + 1);
  ctx.lineTo(x - 35, y + 12 + groove * 3);
  ctx.moveTo(x + 11, y + 1);
  ctx.lineTo(x + 36, y + 10 - groove * 4);
  ctx.stroke();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x - 35, y + 12 + groove * 3, 4.5, 0, Math.PI * 2);
  ctx.arc(x + 36, y + 10 - groove * 4, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + stance * 12, y + 17);
  ctx.lineTo(x + stance * 31, y + 30);
  ctx.stroke();
  ctx.restore();
}

function drawDanceFloor() {
  const top = state.boothHeight;
  const floor = ctx.createLinearGradient(0, top, 0, state.height);
  floor.addColorStop(0, "#241224");
  floor.addColorStop(1, "#09090c");
  ctx.fillStyle = floor;
  ctx.fillRect(0, top, state.width, state.height - top);

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 11; col += 1) {
      const hue = (row + col + Math.floor(state.tick / 12)) % 4;
      ctx.fillStyle =
        hue === 0 ? "rgba(255, 92, 118, 0.16)" :
        hue === 1 ? "rgba(93, 200, 255, 0.14)" :
        hue === 2 ? "rgba(255, 208, 87, 0.12)" :
        "rgba(166, 255, 116, 0.1)";
      ctx.fillRect(62 + col * 76, top + 46 + row * 44, 50, 28);
    }
  }
}

function drawCrowd() {
  const sorted = [...state.people].sort((a, b) => a.y - b.y);
  sorted.forEach((person) => drawPerson(person, false));
}

function drawPlayer() {
  drawPerson(state.player, true);
}

function drawPerson(person, isPlayer) {
  const groove = person.groove || 1;
  const bob = person.downed ? 0 : Math.sin(person.step) * (isPlayer ? 2.2 : 3.8 * groove);
  const x = person.x;
  const y = person.y + bob;
  const hurt = person.hurtTimer > 0;

  if (isPlayer && !person.downed) {
    drawPlayerMarker(x, y);
  }

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + 27, person.radius + 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (person.downed) {
    ctx.save();
    ctx.translate(x, y + 10);
    ctx.rotate(1.14);
    renderFighter(person, 0, hurt);
    ctx.restore();
  } else {
    renderFighter(person, x, y, hurt, isPlayer);
  }

  if (!isPlayer && person.tagged && !person.downed) {
    drawTagBadge(person.tag, x, y - 52);
    drawMiniBar(x - 26, y - 42, 52, 7, person.hp / person.maxHp, "#ff6f88");
  }
}

function drawPlayerMarker(x, y) {
  ctx.save();

  ctx.fillStyle = "rgba(99, 245, 200, 0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y + 28, 28, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(99, 245, 200, 0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y + 28, 23, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#63f5c8";
  ctx.beginPath();
  ctx.moveTo(x, y - 72);
  ctx.lineTo(x - 12, y - 53);
  ctx.lineTo(x + 12, y - 53);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f7fff9";
  ctx.font = "700 11px Avenir Next";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("YOU", x, y - 88);

  ctx.restore();
}

function renderFighter(person, x, y, hurt = false, isPlayer = false) {
  const { body, radius, facing } = person;
  const attack = person.attackPose || 0;
  const lean = facing * attack * 6;
  const armReach = facing * (10 + attack * 11);
  const faceX = x + lean * 0.18;

  ctx.save();
  ctx.translate(x, y);

  if (!x && !y) {
    ctx.translate(0, 0);
  }

  if (isPlayer) {
    ctx.strokeStyle = "rgba(99, 245, 200, 0.9)";
    ctx.lineWidth = 3;
    roundedRectPath(ctx, -radius - 8, -13, radius * 2 + 16, 38, 16);
    ctx.stroke();
  }

  ctx.fillStyle = body.skin;
  ctx.beginPath();
  ctx.arc(faceX - x, -22, radius * 0.68, 0, Math.PI * 2);
  ctx.fill();

  drawHair(person, faceX - x, -27);
  drawFace(person, faceX - x, -22);

  ctx.fillStyle = body.topColor;
  roundedRectPath(ctx, -radius - 4 + lean * 0.06, -9, radius * 2 + 8, 26, 12);
  ctx.fill();

  if (body.topType === "jacket") {
    ctx.fillStyle = body.accentColor;
    roundedRectPath(ctx, -radius + lean * 0.04, -8, radius * 2, 12, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(30,20,30,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 16);
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(-radius * 0.68, -3, radius * 1.36, 3);
  }

  drawArms(person, armReach, hurt);
  drawBottom(person);
  drawLegs(person);

  if (hurt) {
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    roundedRectPath(ctx, -radius - 4, -9, radius * 2 + 8, 30, 12);
    ctx.fill();
  }

  if (isPlayer) {
    drawMiniBar(-36, -53, 72, 9, person.hp / person.maxHp, "#97f78f");
  }

  ctx.restore();
}

function drawHair(person, x, y) {
  const hair = person.body.hair;
  ctx.fillStyle = hair;
  if (person.body.hairStyle === "long") {
    ctx.beginPath();
    ctx.arc(x, y + 2, 13, Math.PI, Math.PI * 2);
    ctx.fill();
    roundedRectPath(ctx, x - 11, y + 1, 22, 18, 8);
    ctx.fill();
  } else if (person.body.hairStyle === "bob") {
    ctx.beginPath();
    ctx.arc(x, y + 1, 13, Math.PI, Math.PI * 2);
    ctx.fill();
    roundedRectPath(ctx, x - 12, y + 1, 24, 10, 6);
    ctx.fill();
  } else if (person.body.hairStyle === "part") {
    ctx.beginPath();
    ctx.arc(x, y + 1, 12, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.clearRect(x - 1, y - 3, 2, 5);
  } else {
    ctx.beginPath();
    ctx.arc(x, y + 2, 12, Math.PI, Math.PI * 2);
    ctx.fill();
  }
}

function drawFace(person, x, y) {
  const facing = person.facing || 1;
  ctx.fillStyle = "#201717";
  ctx.beginPath();
  ctx.arc(x - 4 + facing * 1.2, y - 1, 1.5, 0, Math.PI * 2);
  ctx.arc(x + 4 + facing * 1.2, y - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(86,44,42,0.9)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + facing * 1, y + 1);
  ctx.lineTo(x + facing * 3, y + 5);
  ctx.stroke();

  ctx.strokeStyle = "#7a3a49";
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 8);
  ctx.quadraticCurveTo(x, y + 10, x + 4, y + 8);
  ctx.stroke();
}

function drawArms(person, armReach, hurt) {
  const skin = person.body.skin;
  const groove = person.groove || 1;
  const pulse = Math.sin(person.step * 1.6) * 3.4 * groove;
  const swing = Math.cos(person.step * 1.15) * 6.5 * groove;
  const leftBaseY = -1 + pulse;
  const rightBaseY = 3 - pulse;
  const leftHandX = -22 - swing - person.facing * person.attackPose * 4;
  const leftHandY = 16 + pulse * 1.8;
  const rightHandX = armReach + swing * 0.72;
  const rightHandY = -2 - pulse * 1.2 - person.attackPose * 2;

  ctx.strokeStyle = person.body.topType === "jacket" ? person.body.accentColor : person.body.topColor;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, leftBaseY);
  ctx.lineTo(leftHandX, leftHandY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(10, rightBaseY);
  ctx.lineTo(rightHandX, rightHandY);
  ctx.stroke();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(leftHandX, leftHandY, 4.8, 0, Math.PI * 2);
  ctx.arc(rightHandX, rightHandY, 4.9, 0, Math.PI * 2);
  ctx.fill();

  if (hurt) {
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rightHandX + 5, rightHandY - 6);
    ctx.lineTo(rightHandX + 14, rightHandY + 5);
    ctx.moveTo(rightHandX + 10, rightHandY - 8);
    ctx.lineTo(rightHandX + 18, rightHandY + 2);
    ctx.stroke();
  }
}

function drawBottom(person) {
  const body = person.body;
  ctx.fillStyle = body.bottomColor;

  if (body.bottomType === "skirt") {
    ctx.beginPath();
    ctx.moveTo(-12, 14);
    ctx.lineTo(12, 14);
    ctx.lineTo(18, 29);
    ctx.lineTo(-18, 29);
    ctx.closePath();
    ctx.fill();
  } else {
    roundedRectPath(ctx, -13, 13, 26, 14, 7);
    ctx.fill();
  }
}

function drawLegs(person) {
  const groove = person.groove || 1;
  const stride = Math.sin(person.step) * 4.6 * groove;
  const kneeLift = Math.cos(person.step * 1.1) * 2.4 * groove;
  ctx.strokeStyle = person.body.skin;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-7, 24);
  ctx.lineTo(-11 - stride, 38 + kneeLift);
  ctx.moveTo(7, 24);
  ctx.lineTo(11 + stride, 38 - kneeLift);
  ctx.stroke();

  ctx.strokeStyle = person.body.shoeColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-17 - stride, 39 + kneeLift);
  ctx.lineTo(-5 - stride, 40 + kneeLift * 0.2);
  ctx.moveTo(5 + stride, 40 - kneeLift * 0.2);
  ctx.lineTo(17 + stride, 39 - kneeLift);
  ctx.stroke();
}

function drawMedkits() {
  state.medkits.forEach((medkit) => {
    const bob = medkit.landed ? Math.sin(medkit.pulse) * 3 : 0;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(medkit.x, medkit.y + 12, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f4f0ee";
    roundedRectPath(ctx, medkit.x - 15, medkit.y - 12 + bob, 30, 22, 6);
    ctx.fill();
    ctx.fillStyle = "#ff5f74";
    ctx.fillRect(medkit.x - 4, medkit.y - 8 + bob, 8, 14);
    ctx.fillRect(medkit.x - 10, medkit.y - 2 + bob, 20, 6);
    ctx.strokeStyle = "#fff4f1";
    ctx.lineWidth = 2;
    ctx.strokeRect(medkit.x - 7, medkit.y - 17 + bob, 14, 7);
  });
}

function drawFx() {
  state.fx.forEach((fx) => {
    const alpha = fx.life / 14;
    ctx.strokeStyle = withAlpha(fx.color, alpha);
    ctx.lineWidth = 2 + fx.size;
    ctx.beginPath();
    ctx.moveTo(fx.x - 8 * fx.size, fx.y);
    ctx.lineTo(fx.x + 8 * fx.size, fx.y);
    ctx.moveTo(fx.x, fx.y - 8 * fx.size);
    ctx.lineTo(fx.x, fx.y + 8 * fx.size);
    ctx.moveTo(fx.x - 6 * fx.size, fx.y - 6 * fx.size);
    ctx.lineTo(fx.x + 6 * fx.size, fx.y + 6 * fx.size);
    ctx.moveTo(fx.x + 6 * fx.size, fx.y - 6 * fx.size);
    ctx.lineTo(fx.x - 6 * fx.size, fx.y + 6 * fx.size);
    ctx.stroke();
  });
}

function drawTagBadge(tag, x, y) {
  const width = Math.max(78, tag.length * 10 + 18);
  ctx.fillStyle = "#ff5d73";
  roundedRectPath(ctx, x - width / 2, y - 14, width, 28, 12);
  ctx.fill();
  ctx.fillStyle = "#fff2ee";
  ctx.font = "700 14px Avenir Next";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tag.toUpperCase(), x, y + 1);
}

function drawMiniBar(x, y, width, height, ratio, color) {
  ctx.fillStyle = "rgba(14,12,16,0.8)";
  roundedRectPath(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundedRectPath(ctx, x + 1.5, y + 1.5, Math.max(0, (width - 3) * ratio), height - 3, (height - 3) / 2);
  ctx.fill();
}

function drawOverlay() {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  if (!state.acquired.length && !state.gameOver) {
    ctx.fillStyle = "rgba(255,255,255,0.74)";
    ctx.font = "700 14px Avenir Next";
    ctx.textAlign = "center";
    ctx.fillText("MOVE WITH WASD / ARROWS, PRESS SPACE TO THROW HANDS", state.width / 2, state.height - 28);
  }

  if (state.statusFlash > 0) {
    ctx.fillStyle = `rgba(255, 198, 88, ${state.statusFlash * 0.25})`;
    ctx.fillRect(0, state.hudHeight, state.width, 18);
  }

  ctx.fillStyle = "#fff7f0";
  ctx.font = "700 15px Avenir Next";
  ctx.fillText(`HP ${state.player.hp}/${state.player.maxHp}`, 22, 68);

  if (state.gameOver) {
    ctx.fillStyle = "rgba(8, 6, 11, 0.68)";
    ctx.fillRect(0, state.hudHeight, state.width, state.height - state.hudHeight);
    ctx.fillStyle = "#fff0f0";
    ctx.textAlign = "center";
    ctx.font = "700 36px Avenir Next";
    ctx.fillText("YOU GOT FLOORED", state.width / 2, state.height / 2 - 12);
    ctx.font = "700 16px Avenir Next";
    ctx.fillText("HIT RESET AND JUMP BACK IN", state.width / 2, state.height / 2 + 22);
  }
}

function drawFrame() {
  ctx.strokeStyle = "#f2ece6";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, state.hudHeight + 2, state.width - 4, state.height - state.hudHeight - 4);
  ctx.strokeStyle = "#db7d52";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, state.hudHeight + 10, state.width - 20, state.height - state.hudHeight - 20);
}

function roundedRectPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function withAlpha(color, alpha) {
  if (color.startsWith("#")) {
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "a" || event.key === "ArrowLeft") state.input.left = true;
  if (key === "d" || event.key === "ArrowRight") state.input.right = true;
  if (key === "w" || event.key === "ArrowUp") state.input.up = true;
  if (key === "s" || event.key === "ArrowDown") state.input.down = true;
  if (event.code === "Space") {
    event.preventDefault();
    state.input.attack = true;
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (key === "a" || event.key === "ArrowLeft") state.input.left = false;
  if (key === "d" || event.key === "ArrowRight") state.input.right = false;
  if (key === "w" || event.key === "ArrowUp") state.input.up = false;
  if (key === "s" || event.key === "ArrowDown") state.input.down = false;
  if (event.code === "Space") state.input.attack = false;
});

restartButton.addEventListener("click", reset);

reset();
loop();
