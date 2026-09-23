export const CANVAS = {
  width: 640,
  height: 360,
  floorY: 294,
  leftLimit: 66,
  rightLimit: 574,
};

export const CONTROLS_TEXT =
  "A/D mover · Shift o doble toque correr · W salto · S agachar · J débil · K fuerte · L bloquear";

export const CHARACTERS = {
  human: {
    id: "human",
    displayName: "PELADO",
    subtitle: "Balanceado · alcance medio",
    scale: 1.56,
    previewScale: 2.4,
    selectAccent: "#c99a45",
  },
  cuy: {
    id: "cuy",
    displayName: "CUY",
    subtitle: "Cuerpo ancho · golpes compactos",
    scale: 1.58,
    previewScale: 2.0,
    selectAccent: "#ca8347",
  }
};

export const ASSET_LIST = {
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
    death: ["death_0","death_1","death_2"],
    victory: ["victory_0","victory_1"],
    select: ["select_0"],
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
    death: ["death_0","death_1","death_2"],
    victory: ["victory_0","victory_1"],
    select: ["select_0"],
  }
};

export const ANIM = {
  idle:         { fps: 5, loop: true },
  walk:         { fps: 8, loop: true },
  run:          { fps: 12, loop: true },
  jump:         { fps: 6, loop: true },
  crouch:       { fps: 4, loop: true },
  block:        { fps: 4, loop: true },
  weak:         { fps: 9, loop: false },
  strong:       { fps: 6, loop: false },
  crouchAttack: { fps: 8, loop: false },
  airAttack:    { fps: 9, loop: false },
  hit:          { fps: 9, loop: false },
  death:        { fps: 4, loop: false },
  victory:      { fps: 4, loop: true },
  select:       { fps: 1, loop: true },
};

export const ATTACKS = {
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
