(() => {
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const statusEl = document.getElementById("status");
const cpuToggle = document.getElementById("cpuToggle");
const resetButton = document.getElementById("resetButton");

const W = canvas.width;
const H = canvas.height;
const FLOOR_Y = 294;
const LEFT_LIMIT = 66;
const RIGHT_LIMIT = 574;

const keys = Object.create(null);
const justPressed = new Set();
let showHitboxes = false;
let cpuEnabled = true;
let previousTime = performance.now();
let lastTap = { a: -9999, d: -9999 };
let roundOver = false;

const assetList = {
  human: {
    idle: ["idle_0","idle_1","idle_2","idle_3","idle_4"],
    walk: ["walk_0","walk_1","walk_2"],
    run: ["run_0","run_1"],
    jump: ["jump_0","jump_1"],
    crouch: ["crouch_0","crouch_1"],
    weak: ["weak_0","weak_1"],
    strong: ["strong_0","strong_1"],
    crouchAttack: ["crouch_attack_0","crouch_attack_1"],
    airAttack: ["air_attack_0","air_attack_1"],
    hit: ["hit_0","hit_1"],
    death: ["death_0","death_1","death_2"]
  },
  cuy: {
    idle: ["idle_0","idle_1","idle_2"],
    walk: ["walk_0","walk_1","walk_2"],
    run: ["run_0","run_1"],
    jump: ["jump_0","jump_1"],
    crouch: ["crouch_0","crouch_1"],
    weak: ["weak_0","weak_1"],
    strong: ["strong_0","strong_1"],
    crouchAttack: ["crouch_attack_0","crouch_attack_1"],
    airAttack: ["air_attack_0","air_attack_1"],
    hit: ["hit_0","hit_1"],
    death: ["death_0","death_1","death_2"]
  }
};

const images = { human: {}, cuy: {} };

function loadImages() {
  const jobs = [];
  for (const [character, groups] of Object.entries(assetList)) {
    for (const [group, names] of Object.entries(groups)) {
      images[character][group] = names.map(name => {
        const img = new Image();
        const p = new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        img.src = `assets/sprites/${character}/${name}.png`;
        jobs.push(p);
        return img;
      });
    }
  }
  return Promise.all(jobs);
}

const ANIM = {
  idle:         { fps: 5, loop: true },
  walk:         { fps: 8, loop: true },
  run:          { fps: 12, loop: true },
  jump:         { fps: 6, loop: true },
  crouch:       { fps: 4, loop: true },
  block:        { fps: 3, loop: true },
  weak:         { fps: 9, loop: false },
  strong:       { fps: 6, loop: false },
  crouchAttack: { fps: 8, loop: false },
  airAttack:    { fps: 9, loop: false },
  hit:          { fps: 9, loop: false },
  death:        { fps: 4, loop: false }
};

const ATTACKS = {
  weak: {
    duration: 0.30, activeStart: 0.10, activeEnd: 0.19,
    damage: 8, reach: 43, height: 33, yOffset: 48, push: 13
  },
  strong: {
    duration: 0.52, activeStart: 0.19, activeEnd: 0.34,
    damage: 15, reach: 63, height: 38, yOffset: 46, push: 24
  },
  crouchAttack: {
    duration: 0.38, activeStart: 0.13, activeEnd: 0.25,
    damage: 7, reach: 45, height: 25, yOffset: 22, push: 12
  },
  airAttack: {
    duration: 0.40, activeStart: 0.08, activeEnd: 0.28,
    damage: 10, reach: 45, height: 34, yOffset: 41, push: 17
  }
};

class Fighter {
  constructor(kind, name, x) {
    this.kind = kind;
    this.name = name;
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = kind === "human" ? 1 : -1;
    this.hp = 100;
    this.displayHp = 100;
    this.state = "idle";
    this.stateTime = 0;
    this.animTime = 0;
    this.frame = 0;
    this.grounded = true;
    this.attackConnected = false;
    this.hitStun = 0;
    this.runLatch = 0;
    this.dead = false;
    this.blocking = false;
    this.aiClock = 0;
    this.ai = { left:false,right:false,jump:false,crouch:false,weak:false,strong:false,block:false,run:false };
  }

  setState(next, force = false) {
    if (!force && this.state === next) return;
    this.state = next;
    this.stateTime = 0;
    this.animTime = 0;
    this.frame = 0;
    if (ATTACKS[next]) this.attackConnected = false;
  }

  isAttack() {
    return !!ATTACKS[this.state];
  }

  bodyRect() {
    const crouched = this.state === "crouch" || this.state === "crouchAttack";
    const h = crouched ? 42 : 72;
    const w = this.kind === "cuy" ? 42 : 34;
    const bottom = FLOOR_Y - this.y;
    return { x: this.x - w/2, y: bottom - h, w, h };
  }

  attackRect() {
    const a = ATTACKS[this.state];
    if (!a) return null;
    const bottom = FLOOR_Y - this.y;
    const x = this.facing > 0 ? this.x + 10 : this.x - 10 - a.reach;
    return { x, y: bottom - a.yOffset - a.height/2, w: a.reach, h: a.height };
  }

  canAct() {
    return !this.dead && this.hitStun <= 0 && !this.isAttack();
  }

  beginAttack(type) {
    if (!this.canAct()) return;
    this.blocking = false;
    this.setState(type, true);
  }

  takeHit(damage, push, attacker) {
    if (this.dead) return;

    const correctFacingForBlock =
      (attacker.x < this.x && this.facing < 0) ||
      (attacker.x > this.x && this.facing > 0);

    if (this.blocking && this.grounded && correctFacingForBlock) {
      const chip = Math.max(1, Math.round(damage * 0.18));
      this.hp = Math.max(0, this.hp - chip);
      this.x += Math.sign(this.x - attacker.x) * Math.max(4, push * 0.35);
      flashMessage(`${this.name} bloquea · -${chip}`);
    } else {
      this.hp = Math.max(0, this.hp - damage);
      this.x += Math.sign(this.x - attacker.x) * push;
      this.hitStun = damage >= 14 ? 0.34 : 0.22;
      this.setState("hit", true);
    }

    if (this.hp <= 0) {
      this.dead = true;
      this.blocking = false;
      this.vx = 0;
      this.setState("death", true);
      endRound(attacker);
    }
  }

  updateAnimation(dt) {
    const visualState = this.state === "block" ? "hit" : this.state;
    const frames = images[this.kind][visualState] || images[this.kind].idle;
    const cfg = ANIM[this.state] || ANIM.idle;

    this.animTime += dt;
    const step = 1 / cfg.fps;
    if (this.animTime >= step) {
      this.animTime -= step;
      if (cfg.loop) {
        this.frame = (this.frame + 1) % Math.max(1, frames.length);
      } else {
        this.frame = Math.min(frames.length - 1, this.frame + 1);
      }
    }
  }

  render() {
    const visualState = this.state === "block" ? "hit" : this.state;
    const frames = images[this.kind][visualState] || images[this.kind].idle;
    const img = frames[Math.min(this.frame, frames.length - 1)];
    if (!img || !img.complete || !img.naturalWidth) return;

    const scale = this.kind === "cuy" ? 1.58 : 1.56;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const footY = FLOOR_Y - this.y;

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(footY));
    ctx.scale(this.facing, 1);

    if (this.state === "block") {
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = "rgba(120,190,255,.20)";
      ctx.beginPath();
      ctx.arc(this.facing * 18, -45, 30, -1.2, 1.2);
      ctx.lineTo(0, -45);
      ctx.closePath();
      ctx.fill();
    }

    ctx.drawImage(img, Math.round(-dw/2), Math.round(-dh), Math.round(dw), Math.round(dh));
    ctx.restore();

    if (showHitboxes) {
      drawRect(this.bodyRect(), "rgba(90,220,125,.55)");
      const hb = this.attackRect();
      const a = ATTACKS[this.state];
      if (hb && a && this.stateTime >= a.activeStart && this.stateTime <= a.activeEnd) {
        drawRect(hb, "rgba(255,80,80,.6)");
      }
    }
  }
}

let p1, p2;
let messageTimer = 0;

function flashMessage(text, seconds = 0.8) {
  statusEl.textContent = text;
  messageTimer = seconds;
}

function resetGame() {
  p1 = new Fighter("human", "PELADO", 180);
  p2 = new Fighter("cuy", "CUY", 460);
  roundOver = false;
  statusEl.textContent = cpuEnabled
    ? "Combate listo · Cuy controlado por CPU"
    : "CPU desactivada · el Cuy queda quieto para pruebas";
  canvas.focus();
}

function endRound(winner) {
  if (roundOver) return;
  roundOver = true;
  statusEl.textContent = `K.O. · ${winner.name} gana`;
}

function keyDown(e) {
  const k = e.key.toLowerCase();
  if (["a","d","w","s","j","k","l","r","h","shift"].includes(k)) e.preventDefault();

  if (!keys[k]) {
    justPressed.add(k);

    if (k === "a" || k === "d") {
      const now = performance.now();
      if (now - lastTap[k] < 230) p1.runLatch = 0.52;
      lastTap[k] = now;
    }
  }
  keys[k] = true;

  if (k === "r") resetGame();
  if (k === "h") {
    showHitboxes = !showHitboxes;
    flashMessage(`Hitboxes: ${showHitboxes ? "ON" : "OFF"}`);
  }
}

function keyUp(e) {
  keys[e.key.toLowerCase()] = false;
}

window.addEventListener("keydown", keyDown, { passive:false });
window.addEventListener("keyup", keyUp);
canvas.addEventListener("pointerdown", () => canvas.focus());

function overlaps(a,b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function updatePlayer(f, opponent, dt) {
  if (f.dead) {
    f.updateAnimation(dt);
    return;
  }

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
      if (!f.isAttack()) f.setState("idle", true);
    }
  }

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

  if (f.isAttack()) {
    const data = ATTACKS[f.state];
    if (!f.attackConnected &&
        f.stateTime >= data.activeStart &&
        f.stateTime <= data.activeEnd) {
      const hitbox = f.attackRect();
      if (hitbox && overlaps(hitbox, opponent.bodyRect())) {
        opponent.takeHit(data.damage, data.push, f);
        f.attackConnected = true;
      }
    }

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

function clearAI(ai) {
  for (const k of Object.keys(ai)) ai[k] = false;
}

function updateAI(f, opponent, dt) {
  if (f.dead) {
    f.updateAnimation(dt);
    return;
  }

  f.facing = opponent.x >= f.x ? 1 : -1;
  f.stateTime += dt;
  f.hitStun = Math.max(0, f.hitStun - dt);
  f.aiClock -= dt;

  if (!f.grounded) {
    f.vy -= 720 * dt;
    f.y += f.vy * dt;
    if (f.y <= 0) {
      f.y = 0;
      f.vy = 0;
      f.grounded = true;
      if (!f.isAttack()) f.setState("idle", true);
    }
  }

  if (f.hitStun > 0) {
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
    const data = ATTACKS[f.state];
    if (!f.attackConnected &&
        f.stateTime >= data.activeStart &&
        f.stateTime <= data.activeEnd) {
      const hitbox = f.attackRect();
      if (hitbox && overlaps(hitbox, opponent.bodyRect())) {
        opponent.takeHit(data.damage, data.push, f);
        f.attackConnected = true;
      }
    }
    if (f.stateTime >= data.duration) {
      f.setState(f.grounded ? "idle" : "jump", true);
    }
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
  f.x = Math.max(LEFT_LIMIT, Math.min(RIGHT_LIMIT, f.x));
}

function update(dt) {
  if (messageTimer > 0) {
    messageTimer -= dt;
    if (messageTimer <= 0 && !roundOver) {
      statusEl.textContent = cpuEnabled
        ? "A/D mover · W salto · S agachar · J débil · K fuerte · L bloquear"
        : "CPU OFF · Cuy quieto para probar ataques";
    }
  }

  updatePlayer(p1, p2, dt);
  updateAI(p2, p1, dt);

  separateFighters(p1,p2);
  clampFighter(p1);
  clampFighter(p2);

  p1.displayHp += (p1.hp - p1.displayHp) * Math.min(1, dt * 7);
  p2.displayHp += (p2.hp - p2.displayHp) * Math.min(1, dt * 7);

  justPressed.clear();
}

function drawRect(r, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(r.x),Math.round(r.y),Math.round(r.w),Math.round(r.h));
  ctx.restore();
}

function drawChain(x1, y, x2, front=false) {
  ctx.save();
  ctx.strokeStyle = front ? "#8a8882" : "#5e605d";
  ctx.lineWidth = front ? 4 : 3;
  ctx.beginPath();
  ctx.moveTo(x1,y);
  const segment = 13;
  let x=x1;
  let up=true;
  while (x < x2) {
    ctx.quadraticCurveTo(
      Math.min(x+segment/2,x2), y+(up?3:-3),
      Math.min(x+segment,x2), y
    );
    x += segment;
    up=!up;
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(20,20,20,.75)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawCrowdPerson(x,y,scale=1) {
  ctx.fillStyle="#151719";
  ctx.fillRect(x-5*scale,y-23*scale,10*scale,18*scale);
  ctx.beginPath();
  ctx.arc(x,y-28*scale,5*scale,0,Math.PI*2);
  ctx.fill();
}

function drawStageBack() {
  // Industrial wall
  ctx.fillStyle="#12171a";
  ctx.fillRect(0,0,W,H);

  for(let x=0;x<W;x+=48){
    ctx.fillStyle=(x/48)%2===0?"#1b2429":"#20282c";
    ctx.fillRect(x,0,48,190);
    ctx.fillStyle="#101416";
    ctx.fillRect(x+44,0,4,190);
  }

  // Hanging chains
  ctx.strokeStyle="#444a4c";
  ctx.lineWidth=3;
  for (const [sx,sy,ex,ey] of [[20,5,150,75],[615,0,510,80],[210,12,320,64],[430,12,350,72]]) {
    ctx.beginPath();ctx.moveTo(sx,sy);
    ctx.quadraticCurveTo((sx+ex)/2,sy+55,ex,ey);ctx.stroke();
  }

  // Main sign
  ctx.fillStyle="#080b0d";
  ctx.fillRect(170,10,300,82);
  ctx.strokeStyle="#394247";
  ctx.lineWidth=4;
  ctx.strokeRect(170,10,300,82);
  ctx.textAlign="center";
  ctx.font="bold 18px monospace";
  ctx.fillStyle="#e87862";
  ctx.fillText("LIVE!",320,34);
  ctx.font="bold 22px monospace";
  ctx.fillStyle="#e9eee9";
  ctx.fillText("LA COFRADÍA",320,59);
  ctx.font="bold 17px monospace";
  ctx.fillText("FIGHT NIGHT",320,80);

  // Side crowd
  ctx.fillStyle="#0e1011";
  ctx.fillRect(0,175,70,185);
  ctx.fillRect(570,175,70,185);

  for (let i=0;i<7;i++) {
    drawCrowdPerson(12+(i%3)*22,215+(i%4)*32,0.9);
    drawCrowdPerson(584+(i%3)*22,205+(i%4)*34,0.9);
  }

  // Crowd signs
  ctx.save();
  ctx.translate(19,203);ctx.rotate(-0.08);
  ctx.fillStyle="#e8dfcf";ctx.fillRect(0,0,50,35);
  ctx.fillStyle="#1c1c1c";ctx.font="bold 8px monospace";ctx.textAlign="center";
  ctx.fillText("VAMOS",25,14);ctx.fillText("PELADO!",25,25);
  ctx.restore();

  ctx.save();
  ctx.translate(574,205);ctx.rotate(0.07);
  ctx.fillStyle="#e8dfcf";ctx.fillRect(0,0,52,36);
  ctx.fillStyle="#1c1c1c";ctx.font="bold 8px monospace";ctx.textAlign="center";
  ctx.fillText("VAMOS",26,14);ctx.fillText("PELADO!",26,25);
  ctx.restore();

  // Back posts
  ctx.fillStyle="#6a5d54";
  ctx.fillRect(54,150,12,151);
  ctx.fillStyle="#59646c";
  ctx.fillRect(574,150,12,151);

  drawChain(60,180,580,false);
  drawChain(60,204,580,false);
  drawChain(60,228,580,false);

  // Ring platform / canvas
  ctx.fillStyle="#c9bfaa";
  ctx.beginPath();
  ctx.moveTo(64,184);ctx.lineTo(576,184);ctx.lineTo(604,309);ctx.lineTo(36,309);ctx.closePath();
  ctx.fill();

  // Floor pixels
  ctx.fillStyle="rgba(60,50,40,.08)";
  for(let i=0;i<38;i++){
    const x=60+((i*71)%520), y=194+((i*37)%105);
    ctx.fillRect(x,y,4+(i%7),2);
  }

  // Center ring logo, intentionally simple.
  ctx.strokeStyle="#5a544a";
  ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(320,247,48,0,Math.PI*2);ctx.stroke();
  ctx.font="bold 11px monospace";
  ctx.fillStyle="#4b473f";ctx.textAlign="center";
  ctx.fillText("LA COFRADÍA",320,243);
  ctx.font="9px monospace";
  ctx.fillText("FIGHT NIGHT",320,258);

  // Front apron
  ctx.fillStyle="#242426";
  ctx.fillRect(35,309,570,39);
  ctx.strokeStyle="#5b4b42";ctx.strokeRect(35,309,570,39);
  ctx.font="bold 13px monospace";
  ctx.fillStyle="#d8d1c3";ctx.textAlign="center";
  ctx.fillText("EL PROGRAMA DE STREAM",320,334);
}

function drawStageFront() {
  // Front posts and chain ropes overlap the fighters, like the reference.
  ctx.fillStyle="#765d50";
  ctx.fillRect(46,214,13,103);
  ctx.fillStyle="#5e6a6f";
  ctx.fillRect(581,214,13,103);

  drawChain(52,252,588,true);
  drawChain(52,274,588,true);
  drawChain(52,296,588,true);

  // Foreground crowd silhouettes.
  ctx.fillStyle="#0a0b0c";
  for(let x=5;x<W;x+=34){
    ctx.beginPath();
    ctx.arc(x,354,13+(x%5),Math.PI,Math.PI*2);
    ctx.fill();
  }
}

function healthBar(x,y,w,h,value,reverse,label) {
  ctx.fillStyle="#090b0c";
  ctx.fillRect(x-3,y-3,w+6,h+6);
  ctx.fillStyle="#403f3a";
  ctx.fillRect(x,y,w,h);

  const pct=Math.max(0,Math.min(1,value/100));
  const fw=Math.round(w*pct);
  const grd=ctx.createLinearGradient(x,y,x+w,y);
  grd.addColorStop(0,"#e5be58");
  grd.addColorStop(0.65,"#d68945");
  grd.addColorStop(1,"#c95845");
  ctx.fillStyle=grd;

  if(reverse) ctx.fillRect(x+w-fw,y,fw,h);
  else ctx.fillRect(x,y,fw,h);

  ctx.font="bold 10px monospace";
  ctx.fillStyle="#f2efe7";
  ctx.textAlign=reverse?"right":"left";
  ctx.fillText(label,reverse?x+w:x,y-6);
}

function drawHud() {
  healthBar(24,20,232,15,p1.displayHp,false,"PELADO");
  healthBar(384,20,232,15,p2.displayHp,true,"CUY");

  ctx.fillStyle="#111416";
  ctx.fillRect(294,12,52,30);
  ctx.strokeStyle="#5a6165";
  ctx.strokeRect(294,12,52,30);
  ctx.textAlign="center";
  ctx.font="bold 13px monospace";
  ctx.fillStyle=roundOver?"#e87862":"#ece7d9";
  ctx.fillText(roundOver?"K.O.":"VS",320,32);
}

function render() {
  drawStageBack();

  // Fighter shadows
  for(const f of [p1,p2]){
    ctx.save();
    ctx.globalAlpha=.22;
    ctx.fillStyle="#000";
    ctx.beginPath();
    ctx.ellipse(f.x,FLOOR_Y+3,f.kind==="cuy"?31:24,6,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  p1.render();
  p2.render();

  drawStageFront();
  drawHud();
}

function frame(t) {
  const dt = Math.min(0.033, (t - previousTime)/1000 || 0);
  previousTime = t;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

cpuToggle.addEventListener("click", () => {
  cpuEnabled = !cpuEnabled;
  cpuToggle.textContent = `CPU: ${cpuEnabled ? "ON" : "OFF"}`;
  flashMessage(cpuEnabled ? "CPU activada" : "CPU desactivada");
  canvas.focus();
});

resetButton.addEventListener("click", resetGame);

loadImages().then(() => {
  resetGame();
  requestAnimationFrame(frame);
});

})();
