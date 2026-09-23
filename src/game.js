import { CANVAS, CHARACTERS, ATTACKS, CONTROLS_TEXT } from "./config.js";
import { loadAssets } from "./assets.js";
import { Fighter } from "./fighter.js";
import { drawStageBack, drawStageFront, drawHud, drawRect, drawCharacterCard } from "./stage.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const statusEl = document.getElementById("status");
const cpuToggle = document.getElementById("cpuToggle");
const resetButton = document.getElementById("resetButton");
const menuButton = document.getElementById("menuButton");

const W = CANVAS.width;
const H = CANVAS.height;
const keys = Object.create(null);
const justPressed = new Set();

let previousTime = performance.now();
let showHitboxes = false;
let cpuEnabled = true;
let lastTap = { a: -9999, d: -9999 };

const app = {
  scene: "loading", // loading, select, fight, victory
  loading: { loaded: 0, total: 1 },
  select: { cursor: 0, choices: ["human", "cuy"] },
  match: null,
  winner: null,
  loser: null,
  messageTimer: 0,
};

function flashMessage(text, seconds = 1) {
  statusEl.textContent = text;
  app.messageTimer = seconds;
}

function createMatch(playerKind = "human") {
  const enemyKind = playerKind === "human" ? "cuy" : "human";
  const p1 = new Fighter(playerKind, 180);
  const p2 = new Fighter(enemyKind, 460);
  p1.facing = 1;
  p2.facing = -1;
  app.match = {
    p1, p2,
    roundOver: false,
    koTimer: 0,
    victoryTimer: 0,
    matchStateText: "VS",
  };
  app.winner = null;
  app.loser = null;
  app.scene = "fight";
  statusEl.textContent = cpuEnabled
    ? `Combate listo · ${CHARACTERS[playerKind].displayName} vs ${CHARACTERS[enemyKind].displayName}`
    : "CPU desactivada · oponente en reposo para pruebas";
  canvas.focus();
}

function backToSelect() {
  app.scene = "select";
  app.winner = null;
  app.loser = null;
  app.match = null;
  statusEl.textContent = "Elige tu personaje y presiona Enter";
  canvas.focus();
}

function keyDown(e) {
  const k = e.key.toLowerCase();
  if (["a","d","w","s","j","k","l","r","h","shift","enter","arrowleft","arrowright"].includes(k)) {
    e.preventDefault();
  }

  if (!keys[k]) {
    justPressed.add(k);
    if (k === "a" || k === "d") {
      const now = performance.now();
      if (app.scene === "fight" && app.match && now - lastTap[k] < 230) {
        app.match.p1.runLatch = 0.52;
      }
      lastTap[k] = now;
    }
  }
  keys[k] = true;

  if (k === "r" && app.scene === "fight") restartMatch();
  if (k === "h" && app.scene === "fight") {
    showHitboxes = !showHitboxes;
    flashMessage(`Hitboxes: ${showHitboxes ? "ON" : "OFF"}`);
  }
}

function keyUp(e) {
  keys[e.key.toLowerCase()] = false;
}

window.addEventListener("keydown", keyDown, { passive:false });
window.addEventListener("keyup", keyUp);
canvas.addEventListener("pointerdown", (e) => {
  canvas.focus();
  if (app.scene === "select") {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (cx > 120 && cx < 300 && cy > 110 && cy < 290) {
      app.select.cursor = 0;
      createMatch(app.select.choices[0]);
    } else if (cx > 340 && cx < 520 && cy > 110 && cy < 290) {
      app.select.cursor = 1;
      createMatch(app.select.choices[1]);
    }
  }
});

cpuToggle.addEventListener("click", () => {
  cpuEnabled = !cpuEnabled;
  cpuToggle.textContent = `CPU: ${cpuEnabled ? "ON" : "OFF"}`;
  flashMessage(cpuEnabled ? "CPU activada" : "CPU desactivada");
  canvas.focus();
});
resetButton.addEventListener("click", () => {
  if (app.scene === "fight" || app.scene === "victory") restartMatch();
  else backToSelect();
});
menuButton.addEventListener("click", backToSelect);

function restartMatch() {
  if (!app.match) {
    createMatch(app.select.choices[app.select.cursor]);
    return;
  }
  createMatch(app.match.p1.kind);
}

function overlaps(a,b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function endRound(winner, loser) {
  if (!app.match || app.match.roundOver) return;
  app.match.roundOver = true;
  app.match.koTimer = 0.45;
  app.match.victoryTimer = 1.1;
  app.match.matchStateText = "K.O.";
  app.winner = winner;
  app.loser = loser;
  winner.setState("victory", true);
  flashMessage(`K.O. · ${winner.name} gana`, 1.6);
}

function clearAI(ai) {
  for (const k of Object.keys(ai)) ai[k] = false;
}

function updateFighterCommon(f, opponent, dt) {
  f.facing = opponent.x >= f.x ? 1 : -1;
  f.stateTime += dt;
  f.hitStun = Math.max(0, f.hitStun - dt);
  f.runLatch = Math.max(0, f.runLatch - dt);

  if (!f.grounded) {
    f.vy -= 720 * dt;
    f.y += f.vy * dt;
    if (f.y <= 0) {
      f.y = 0;
      f.vy = 0;
      f.grounded = true;
      if (!f.isAttack() && f.state !== "victory") f.setState("idle", true);
    }
  }
}

function resolveAttack(attacker, defender) {
  const data = ATTACKS[attacker.state];
  if (!data) return;
  if (!attacker.attackConnected &&
      attacker.stateTime >= data.activeStart &&
      attacker.stateTime <= data.activeEnd) {
    const hitbox = attacker.attackRect();
    if (hitbox && overlaps(hitbox, defender.bodyRect())) {
      defender.takeHit(data.damage, data.push, attacker, flashMessage, endRound);
      attacker.attackConnected = true;
    }
  }
}

function updatePlayer(f, opponent, dt) {
  if (f.dead) {
    f.updateAnimation(dt);
    return;
  }
  updateFighterCommon(f, opponent, dt);

  if (f.hitStun > 0) {
    f.updateAnimation(dt);
    return;
  }

  const left = !!keys.a;
  const right = !!keys.d;
  const crouch = !!keys.s;
  const block = !!keys.l;
  const run = !!keys.shift || f.runLatch > 0;
  const direction = (right ? 1 : 0) - (left ? 1 : 0);

  if (f.state === "victory") {
    f.updateAnimation(dt);
    return;
  }

  if (f.isAttack()) {
    resolveAttack(f, opponent);

    const data = ATTACKS[f.state];
    if (f.stateTime >= data.duration) {
      if (!f.grounded) f.setState("jump", true);
      else if (crouch) f.setState("crouch", true);
      else f.setState("idle", true);
    }
    f.updateAnimation(dt);
    return;
  }

  if (block && f.grounded) {
    f.blocking = true;
    f.vx = 0;
    f.setState("block");
    f.updateAnimation(dt);
    return;
  }
  f.blocking = false;

  if (justPressed.has("w") && f.grounded && !crouch) {
    f.grounded = false;
    f.vy = 300;
    f.setState("jump", true);
  }

  if (justPressed.has("j")) {
    if (!f.grounded) f.beginAttack("airAttack");
    else if (crouch) f.beginAttack("crouchAttack");
    else f.beginAttack("weak");
  }

  if (justPressed.has("k")) {
    if (!f.grounded) f.beginAttack("airAttack");
    else if (crouch) f.beginAttack("crouchAttack");
    else f.beginAttack("strong");
  }

  if (f.isAttack()) {
    f.updateAnimation(dt);
    return;
  }

  if (crouch && f.grounded) {
    f.vx = 0;
    f.setState("crouch");
  } else if (direction !== 0 && f.grounded) {
    const speed = run ? 180 : 92;
    f.vx = direction * speed;
    f.x += f.vx * dt;
    f.setState(run ? "run" : "walk");
  } else {
    f.vx = 0;
    if (f.grounded) f.setState("idle");
    else f.setState("jump");
  }

  f.updateAnimation(dt);
}

function updateAI(f, opponent, dt) {
  if (f.dead) {
    f.updateAnimation(dt);
    return;
  }

  updateFighterCommon(f, opponent, dt);
  f.aiClock -= dt;

  if (f.hitStun > 0) {
    f.updateAnimation(dt);
    return;
  }

  if (f.state === "victory") {
    f.updateAnimation(dt);
    return;
  }

  if (!cpuEnabled) {
    f.blocking = false;
    if (!f.isAttack()) f.setState("idle");
    f.updateAnimation(dt);
    return;
  }

  if (f.isAttack()) {
    resolveAttack(f, opponent);
    const data = ATTACKS[f.state];
    if (f.stateTime >= data.duration) f.setState(f.grounded ? "idle" : "jump", true);
    f.updateAnimation(dt);
    return;
  }

  const dist = Math.abs(opponent.x - f.x);
  const toward = Math.sign(opponent.x - f.x);

  if (f.aiClock <= 0) {
    f.aiClock = 0.11 + Math.random() * 0.15;
    clearAI(f.ai);

    const opponentThreat = opponent.isAttack() && dist < 86;
    if (opponentThreat && Math.random() < 0.72 && f.grounded) {
      f.ai.block = true;
    } else if (dist > 118) {
      if (toward > 0) f.ai.right = true; else f.ai.left = true;
      f.ai.run = dist > 200;
    } else if (dist > 66) {
      if (toward > 0) f.ai.right = true; else f.ai.left = true;
      if (Math.random() < 0.06 && f.grounded) f.ai.jump = true;
    } else {
      const r = Math.random();
      if (r < 0.18) f.ai.block = true;
      else if (r < 0.57) f.ai.weak = true;
      else if (r < 0.82) f.ai.strong = true;
      else f.ai.crouch = true;
    }
  }

  f.blocking = !!f.ai.block && f.grounded;
  if (f.blocking) {
    f.setState("block");
    f.updateAnimation(dt);
    return;
  }

  if (f.ai.jump && f.grounded) {
    f.grounded = false;
    f.vy = 290;
    f.ai.jump = false;
    f.setState("jump", true);
  }

  if (f.ai.weak) {
    f.ai.weak = false;
    f.beginAttack(f.grounded ? (f.ai.crouch ? "crouchAttack" : "weak") : "airAttack");
  }
  if (f.ai.strong) {
    f.ai.strong = false;
    f.beginAttack(f.grounded ? "strong" : "airAttack");
  }

  if (f.isAttack()) {
    f.updateAnimation(dt);
    return;
  }

  const dir = (f.ai.right ? 1 : 0) - (f.ai.left ? 1 : 0);
  if (f.ai.crouch && f.grounded) {
    f.setState("crouch");
  } else if (dir && f.grounded) {
    const speed = f.ai.run ? 162 : 82;
    f.x += dir * speed * dt;
    f.setState(f.ai.run ? "run" : "walk");
  } else if (f.grounded) {
    f.setState("idle");
  } else {
    f.setState("jump");
  }

  f.updateAnimation(dt);
}

function separateFighters(a,b) {
  if (!a.grounded || !b.grounded) return;
  const min = 42;
  const d = b.x - a.x;
  if (Math.abs(d) < min) {
    const overlap = min - Math.abs(d);
    const sign = d >= 0 ? 1 : -1;
    a.x -= sign * overlap * 0.5;
    b.x += sign * overlap * 0.5;
  }
}

function clampFighter(f) {
  f.x = Math.max(CANVAS.leftLimit, Math.min(CANVAS.rightLimit, f.x));
}

function updateFight(dt) {
  const m = app.match;
  if (!m) return;

  if (app.messageTimer > 0) {
    app.messageTimer -= dt;
    if (app.messageTimer <= 0 && app.scene === "fight" && !m.roundOver) {
      statusEl.textContent = CONTROLS_TEXT;
    }
  }

  updatePlayer(m.p1, m.p2, dt);
  updateAI(m.p2, m.p1, dt);

  separateFighters(m.p1,m.p2);
  clampFighter(m.p1);
  clampFighter(m.p2);

  m.p1.displayHp += (m.p1.hp - m.p1.displayHp) * Math.min(1, dt * 7);
  m.p2.displayHp += (m.p2.hp - m.p2.displayHp) * Math.min(1, dt * 7);

  if (m.roundOver) {
    m.koTimer -= dt;
    m.victoryTimer -= dt;
    if (m.victoryTimer <= 0) {
      app.scene = "victory";
      statusEl.textContent = `${app.winner.name} gana · Enter para volver a selección`;
    }
  }

  justPressed.clear();
}

function updateSelect() {
  if (justPressed.has("a") || justPressed.has("arrowleft")) app.select.cursor = 0;
  if (justPressed.has("d") || justPressed.has("arrowright")) app.select.cursor = 1;
  if (justPressed.has("enter") || justPressed.has("j") || justPressed.has("k")) {
    createMatch(app.select.choices[app.select.cursor]);
  }
  justPressed.clear();
}

function updateVictory() {
  if (!app.match || !app.winner) return;
  app.match.p1.updateAnimation(1/60);
  app.match.p2.updateAnimation(1/60);
  if (justPressed.has("enter") || justPressed.has("r")) {
    backToSelect();
  }
  justPressed.clear();
}

function drawFightScene(matchStateOverride = null) {
  const m = app.match;
  drawStageBack(ctx, W, H);

  for(const f of [m.p1,m.p2]){
    ctx.save();
    ctx.globalAlpha=.22;
    ctx.fillStyle="#000";
    ctx.beginPath();
    ctx.ellipse(f.x,CANVAS.floorY+3,f.kind==="cuy"?31:24,6,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  m.p1.render(ctx, showHitboxes, (r,fill) => drawRect(ctx, r, fill));
  m.p2.render(ctx, showHitboxes, (r,fill) => drawRect(ctx, r, fill));

  drawStageFront(ctx, W, H);
  drawHud(ctx, m.p1, m.p2, matchStateOverride || m.matchStateText);
}

function drawLoading() {
  ctx.fillStyle = "#111315";
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle = "#f2efe7";
  ctx.textAlign = "center";
  ctx.font = "bold 22px monospace";
  ctx.fillText("LA COFRADÍA FIGHT NIGHT", W/2, 120);
  ctx.font = "16px monospace";
  ctx.fillText("Cargando recursos...", W/2, 160);

  const pct = app.loading.total ? app.loading.loaded / app.loading.total : 0;
  ctx.strokeStyle = "#5a6165";
  ctx.strokeRect(160, 190, 320, 18);
  ctx.fillStyle = "#e5be58";
  ctx.fillRect(162, 192, Math.round(316 * pct), 14);
  ctx.fillStyle = "#c9d0d2";
  ctx.font = "12px monospace";
  ctx.fillText(`${Math.round(pct*100)}%`, W/2, 225);
}

function drawSelect() {
  ctx.fillStyle = "#111315";
  ctx.fillRect(0,0,W,H);
  drawStageBack(ctx, W, H);
  ctx.fillStyle = "rgba(0,0,0,.62)";
  ctx.fillRect(0,0,W,H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#f2efe7";
  ctx.font = "bold 22px monospace";
  ctx.fillText("SELECCIÓN DE PERSONAJE", W/2, 56);
  ctx.font = "12px monospace";
  ctx.fillStyle = "#d7d0c1";
  ctx.fillText("Izquierda / derecha para elegir · Enter para comenzar", W/2, 76);

  drawCharacterCard(ctx, "human", 200, 195, app.select.cursor === 0);
  drawCharacterCard(ctx, "cuy", 440, 195, app.select.cursor === 1);

  ctx.font = "12px monospace";
  ctx.fillStyle = "#c9d0d2";
  const chosen = app.select.choices[app.select.cursor];
  const enemy = chosen === "human" ? "cuy" : "human";
  ctx.fillText(`Jugador 1: ${CHARACTERS[chosen].displayName}  ·  CPU: ${CHARACTERS[enemy].displayName}`, W/2, 328);
}

function drawVictory() {
  drawFightScene("K.O.");
  ctx.fillStyle = "rgba(0,0,0,.54)";
  ctx.fillRect(0,0,W,H);

  ctx.fillStyle = "#f2efe7";
  ctx.textAlign = "center";
  ctx.font = "bold 24px monospace";
  ctx.fillText("VICTORIA", W/2, 60);
  ctx.font = "bold 16px monospace";
  ctx.fillStyle = "#e5be58";
  ctx.fillText(app.winner ? app.winner.name : "", W/2, 84);
  ctx.font = "12px monospace";
  ctx.fillStyle = "#d8d0c2";
  ctx.fillText("Presiona Enter para volver a la selección", W/2, 334);
}

function render() {
  if (app.scene === "loading") drawLoading();
  else if (app.scene === "select") drawSelect();
  else if (app.scene === "fight") drawFightScene();
  else if (app.scene === "victory") drawVictory();
}

function update(dt) {
  if (app.scene === "select") updateSelect();
  else if (app.scene === "fight") updateFight(dt);
  else if (app.scene === "victory") updateVictory(dt);
}

function frame(t) {
  const dt = Math.min(0.033, (t - previousTime)/1000 || 0);
  previousTime = t;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

async function boot() {
  app.scene = "loading";
  render();
  await loadAssets((loaded, total) => {
    app.loading.loaded = loaded;
    app.loading.total = total;
    render();
  });
  backToSelect();
  requestAnimationFrame(frame);
}

boot();
