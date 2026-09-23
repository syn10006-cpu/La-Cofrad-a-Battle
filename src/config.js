export const GAME = {
  width: 640,
  height: 360,
  floorY: 298,
  leftLimit: 67,
  rightLimit: 573,
  roundSeconds: 60,
  roundsToWin: 2,
  gravity: 760,
  frameCanvas: { width: 360, height: 300, baselineY: 286 },
};

export const CHARACTERS = {
  biker: {
    id: "biker",
    name: "THE BIKER",
    shortName: "BIKER",
    subtitle: "Vodka · alcance",
    drawScale: 0.56,
    body: { width: 36, standHeight: 78, crouchHeight: 47 },
    walkSpeed: 95,
    runSpeed: 188,
    jumpVelocity: 315,
  },
  cuy: {
    id: "cuy",
    name: "THE CUY MAN",
    shortName: "CUY",
    subtitle: "Fuerza · cuerpo a cuerpo",
    drawScale: 0.56,
    body: { width: 43, standHeight: 76, crouchHeight: 48 },
    walkSpeed: 89,
    runSpeed: 176,
    jumpVelocity: 300,
  }
};

export const ANIMATIONS = {
  idle:         { count:3, fps:5, loop:true },
  walk:         { count:4, fps:8, loop:true },
  run:          { count:2, fps:11, loop:true },
  jump:         { count:2, fps:6, loop:true },
  crouch:       { count:2, fps:4, loop:true },
  weak:         { count:2, fps:10, loop:false },
  strong:       { count:2, fps:7, loop:false },
  crouch_attack:{ count:2, fps:9, loop:false },
  air_attack:   { count:2, fps:9, loop:false },
  block:        { count:1, fps:1, loop:true },
  hit:          { count:1, fps:1, loop:false },
  death:        { count:2, fps:4, loop:false },
  victory:      { count:2, fps:3, loop:true },
};

export const ATTACKS = {
  weak: {
    duration:.28, activeStart:.09, activeEnd:.18,
    damage:8, reach:45, height:32, yOffset:49, push:12, hitStun:.18
  },
  strong: {
    duration:.50, activeStart:.18, activeEnd:.33,
    damage:15, reach:62, height:39, yOffset:47, push:23, hitStun:.31
  },
  crouch_attack: {
    duration:.36, activeStart:.12, activeEnd:.24,
    damage:7, reach:49, height:24, yOffset:21, push:12, hitStun:.20
  },
  air_attack: {
    duration:.40, activeStart:.08, activeEnd:.28,
    damage:10, reach:49, height:36, yOffset:43, push:16, hitStun:.24
  }
};

export const CONTROLS_TEXT =
  "A/D mover · Shift correr · W saltar · S agachar · J débil · K fuerte · L bloquear";
