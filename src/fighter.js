import { ATTACKS, ANIM, CANVAS, CHARACTERS } from "./config.js";
import { images } from "./assets.js";

export class Fighter {
  constructor(kind, x) {
    this.kind = kind;
    this.name = CHARACTERS[kind].displayName;
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
    const crouched = this.state === "crouch" || this.state === "crouchAttack" || this.state === "block";
    const h = crouched ? 42 : 72;
    const w = this.kind === "cuy" ? 42 : 34;
    const bottom = CANVAS.floorY - this.y;
    return { x: this.x - w/2, y: bottom - h, w, h };
  }

  attackRect() {
    const a = ATTACKS[this.state];
    if (!a) return null;
    const bottom = CANVAS.floorY - this.y;
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

  takeHit(damage, push, attacker, flashMessage, endRound) {
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
      endRound(attacker, this);
    }
  }

  currentVisualState() {
    if (this.state === "block") return "crouch";
    return this.state;
  }

  updateAnimation(dt) {
    const visualState = this.currentVisualState();
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

  render(ctx, showHitboxes, drawRect) {
    const visualState = this.currentVisualState();
    const frames = images[this.kind][visualState] || images[this.kind].idle;
    const img = frames[Math.min(this.frame, frames.length - 1)];
    if (!img || !img.complete || !img.naturalWidth) return;

    const scale = CHARACTERS[this.kind].scale;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const footY = CANVAS.floorY - this.y;

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
