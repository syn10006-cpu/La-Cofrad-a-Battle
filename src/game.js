import { GAME, CHARACTERS, ATTACKS, CONTROLS_TEXT } from "./config.js";
import { loadAssets, images } from "./assets.js";
import { Fighter } from "./fighter.js";
import { drawStageBack, drawStageFront, drawHud, centerText } from "./stage.js";

const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=false;

const statusEl=document.getElementById("status");
const cpuBtn=document.getElementById("cpuBtn");
const restartBtn=document.getElementById("restartBtn");
const selectBtn=document.getElementById("selectBtn");

const keys=Object.create(null);
const pressed=new Set();
let lastTap={a:-9999,d:-9999};
let previousTime=performance.now();
let showHitboxes=false;
let cpuEnabled=true;
let hitStop=0;

const app={
  scene:"loading",
  loading:{loaded:0,total:1},
  select:{cursor:0,choices:["biker","cuy"]},
  p1:null,p2:null,
  round:1,wins1:0,wins2:0,time:GAME.roundSeconds,
  phase:"intro",
  phaseTimer:0,
  winner:null,loser:null,
  messageTimer:0,
};

function setStatus(text,seconds=0){
  statusEl.textContent=text;
  app.messageTimer=seconds;
}

function newMatch(kind){
  const enemy=kind==="biker"?"cuy":"biker";
  app.p1=new Fighter(kind,180,"left");
  app.p2=new Fighter(enemy,460,"right");
  app.round=1;app.wins1=0;app.wins2=0;
  startRound();
  app.scene="fight";
  canvas.focus();
}

function startRound(){
  app.p1.reset(180,"left");app.p2.reset(460,"right");
  app.time=GAME.roundSeconds;
  app.phase="round";
  app.phaseTimer=.9;
  app.winner=null;app.loser=null;
  setStatus(`Ronda ${app.round}`);
}

function toSelect(){
  app.scene="select";
  app.p1=app.p2=null;
  app.select.cursor=0;
  setStatus("Elige personaje · A/D o flechas · Enter para comenzar");
  canvas.focus();
}

function keydown(e){
  const k=e.key.toLowerCase();
  if(["a","d","w","s","j","k","l","h","r","shift","enter","arrowleft","arrowright"].includes(k))e.preventDefault();
  if(!keys[k]){
    pressed.add(k);
    if((k==="a"||k==="d")&&app.scene==="fight"&&app.p1){
      const now=performance.now();
      if(now-lastTap[k]<230)app.p1.runLatch=.48;
      lastTap[k]=now;
    }
  }
  keys[k]=true;

  if(k==="h"&&app.scene==="fight"){showHitboxes=!showHitboxes;setStatus(`Hitboxes: ${showHitboxes?"ON":"OFF"}`,.8)}
  if(k==="r"&&app.scene==="fight"&&app.p1)newMatch(app.p1.kind);
}
function keyup(e){keys[e.key.toLowerCase()]=false}
addEventListener("keydown",keydown,{passive:false});
addEventListener("keyup",keyup);
canvas.addEventListener("pointerdown",()=>canvas.focus());

cpuBtn.onclick=()=>{
  cpuEnabled=!cpuEnabled;cpuBtn.textContent=`CPU: ${cpuEnabled?"ON":"OFF"}`;
  setStatus(cpuEnabled?"CPU activada":"CPU desactivada",.8);canvas.focus();
};
restartBtn.onclick=()=>app.p1?newMatch(app.p1.kind):toSelect();
selectBtn.onclick=toSelect;

function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}

function clearAI(ai){for(const k of Object.keys(ai))ai[k]=false}

function commonUpdate(f,opponent,dt){
  f.facing=opponent.x>=f.x?1:-1;
  f.stateTime+=dt;
  f.hitStun=Math.max(0,f.hitStun-dt);
  f.runLatch=Math.max(0,f.runLatch-dt);

  if(!f.grounded){
    f.vy-=GAME.gravity*dt;
    f.y+=f.vy*dt;
    if(f.y<=0){
      f.y=0;f.vy=0;f.grounded=true;
      if(!f.isAttack()&&!f.dead)f.setState("idle",true);
    }
  }
}

function connectAttack(attacker,defender){
  const a=ATTACKS[attacker.state];if(!a)return;
  if(attacker.attackConnected)return;
  if(attacker.stateTime<a.activeStart||attacker.stateTime>a.activeEnd)return;
  const hb=attacker.attackRect();
  if(hb&&overlap(hb,defender.bodyRect())){
    defender.takeHit(a.damage,a.push,a.hitStun,attacker,onKO,onBlock);
    attacker.attackConnected=true;
    hitStop=.055;
  }
}

function onBlock(f,chip){setStatus(`${f.meta.shortName} bloquea · -${chip}`,.5)}

function onKO(winner,loser){
  if(app.phase==="roundOver")return;
  app.winner=winner;app.loser=loser;
  app.phase="roundOver";app.phaseTimer=1.35;
  winner.setState("victory",true);
  loser.setState("death",true);
  setStatus(`K.O. · ${winner.meta.shortName}`,1.2);
}

function updatePlayer(f,o,dt){
  if(f.dead){f.updateAnimation(dt);return}
  commonUpdate(f,o,dt);
  if(f.hitStun>0){f.updateAnimation(dt);return}
  if(f.state==="victory"){f.updateAnimation(dt);return}

  const crouch=!!keys.s, block=!!keys.l;
  const dir=(keys.d?1:0)-(keys.a?1:0);
  const run=!!keys.shift||f.runLatch>0;

  if(f.isAttack()){
    connectAttack(f,o);
    const a=ATTACKS[f.state];
    if(f.stateTime>=a.duration){
      if(!f.grounded)f.setState("jump",true);
      else if(crouch)f.setState("crouch",true);
      else f.setState("idle",true);
    }
    f.updateAnimation(dt);return;
  }

  if(block&&f.grounded){
    f.blocking=true;f.setState("block");f.updateAnimation(dt);return;
  }
  f.blocking=false;

  if(pressed.has("w")&&f.grounded&&!crouch){
    f.grounded=false;f.vy=f.meta.jumpVelocity;f.setState("jump",true);
  }
  if(pressed.has("j")){
    if(!f.grounded)f.beginAttack("air_attack");
    else if(crouch)f.beginAttack("crouch_attack");
    else f.beginAttack("weak");
  }
  if(pressed.has("k")){
    if(!f.grounded)f.beginAttack("air_attack");
    else if(crouch)f.beginAttack("crouch_attack");
    else f.beginAttack("strong");
  }
  if(f.isAttack()){f.updateAnimation(dt);return}

  if(crouch&&f.grounded)f.setState("crouch");
  else if(dir&&f.grounded){
    f.x+=dir*(run?f.meta.runSpeed:f.meta.walkSpeed)*dt;
    f.setState(run?"run":"walk");
  } else f.setState(f.grounded?"idle":"jump");

  f.updateAnimation(dt);
}

function updateCPU(f,o,dt){
  if(f.dead){f.updateAnimation(dt);return}
  commonUpdate(f,o,dt);
  f.aiClock-=dt;
  if(f.hitStun>0){f.updateAnimation(dt);return}
  if(f.state==="victory"){f.updateAnimation(dt);return}

  if(!cpuEnabled){f.blocking=false;if(!f.isAttack())f.setState("idle");f.updateAnimation(dt);return}

  if(f.isAttack()){
    connectAttack(f,o);
    if(f.stateTime>=ATTACKS[f.state].duration)f.setState(f.grounded?"idle":"jump",true);
    f.updateAnimation(dt);return;
  }

  const dist=Math.abs(o.x-f.x),toward=Math.sign(o.x-f.x);
  if(f.aiClock<=0){
    f.aiClock=.11+Math.random()*.14;clearAI(f.ai);
    if(o.isAttack()&&dist<86&&Math.random()<.70)f.ai.block=true;
    else if(dist>115){
      toward>0?f.ai.right=true:f.ai.left=true;
      f.ai.run=dist>195;
    }else if(dist>64){
      toward>0?f.ai.right=true:f.ai.left=true;
      if(Math.random()<.08)f.ai.jump=true;
    }else{
      const r=Math.random();
      if(r<.18)f.ai.block=true;
      else if(r<.58)f.ai.weak=true;
      else if(r<.82)f.ai.strong=true;
      else f.ai.crouch=true;
    }
  }

  f.blocking=f.ai.block&&f.grounded;
  if(f.blocking){f.setState("block");f.updateAnimation(dt);return}

  if(f.ai.jump&&f.grounded){f.grounded=false;f.vy=f.meta.jumpVelocity;f.ai.jump=false;f.setState("jump",true)}
  if(f.ai.weak){f.ai.weak=false;f.beginAttack(f.grounded?(f.ai.crouch?"crouch_attack":"weak"):"air_attack")}
  if(f.ai.strong){f.ai.strong=false;f.beginAttack(f.grounded?"strong":"air_attack")}
  if(f.isAttack()){f.updateAnimation(dt);return}

  const dir=(f.ai.right?1:0)-(f.ai.left?1:0);
  if(f.ai.crouch&&f.grounded)f.setState("crouch");
  else if(dir&&f.grounded){f.x+=dir*(f.ai.run?f.meta.runSpeed:f.meta.walkSpeed)*dt;f.setState(f.ai.run?"run":"walk")}
  else f.setState(f.grounded?"idle":"jump");
  f.updateAnimation(dt);
}

function separate(a,b){
  if(!a.grounded||!b.grounded)return;
  const min=45,d=b.x-a.x;
  if(Math.abs(d)<min){
    const o=min-Math.abs(d),s=d>=0?1:-1;
    a.x-=s*o*.5;b.x+=s*o*.5;
  }
}
function clamp(f){f.x=Math.max(GAME.leftLimit,Math.min(GAME.rightLimit,f.x))}

function resolveTimedRound(){
  if(app.time>0||app.phase!=="active")return;
  app.phase="roundOver";app.phaseTimer=1.35;
  if(app.p1.hp===app.p2.hp){
    app.winner=null;app.loser=null;setStatus("EMPATE",1.2);
  }else{
    app.winner=app.p1.hp>app.p2.hp?app.p1:app.p2;
    app.loser=app.winner===app.p1?app.p2:app.p1;
    app.winner.setState("victory",true);
    app.loser.setState("death",true);
    setStatus(`${app.winner.meta.shortName} gana por tiempo`,1.2);
  }
}

function finishRound(){
  if(app.winner===app.p1)app.wins1++;
  else if(app.winner===app.p2)app.wins2++;

  if(app.wins1>=GAME.roundsToWin||app.wins2>=GAME.roundsToWin){
    app.scene="victory";
    app.phase="matchOver";
    const champ=app.wins1>app.wins2?app.p1:app.p2;
    app.winner=champ;champ.dead=false;champ.setState("victory",true);
    setStatus(`${champ.name} gana el combate · Enter para selección`);
  }else{
    app.round++;
    startRound();
  }
}

function updateFight(dt){
  if(app.messageTimer>0){app.messageTimer-=dt;if(app.messageTimer<=0&&app.phase==="active")setStatus(CONTROLS_TEXT)}

  if(app.phase==="round"){
    app.phaseTimer-=dt;
    if(app.phaseTimer<=0){app.phase="fight";app.phaseTimer=.7;setStatus(`ROUND ${app.round}`)}
    pressed.clear();return;
  }
  if(app.phase==="fight"){
    app.phaseTimer-=dt;
    if(app.phaseTimer<=0){app.phase="active";setStatus(CONTROLS_TEXT)}
    pressed.clear();return;
  }
  if(app.phase==="roundOver"){
    app.p1.updateAnimation(dt);app.p2.updateAnimation(dt);
    app.phaseTimer-=dt;
    if(app.phaseTimer<=0)finishRound();
    pressed.clear();return;
  }
  if(app.phase!=="active"){pressed.clear();return}

  if(hitStop>0){hitStop-=dt;pressed.clear();return}

  app.time=Math.max(0,app.time-dt);
  updatePlayer(app.p1,app.p2,dt);
  updateCPU(app.p2,app.p1,dt);
  separate(app.p1,app.p2);clamp(app.p1);clamp(app.p2);
  app.p1.displayHp+=(app.p1.hp-app.p1.displayHp)*Math.min(1,dt*8);
  app.p2.displayHp+=(app.p2.hp-app.p2.displayHp)*Math.min(1,dt*8);
  resolveTimedRound();
  pressed.clear();
}

function updateSelect(){
  if(pressed.has("a")||pressed.has("arrowleft"))app.select.cursor=0;
  if(pressed.has("d")||pressed.has("arrowright"))app.select.cursor=1;
  if(pressed.has("enter")||pressed.has("j")||pressed.has("k"))newMatch(app.select.choices[app.select.cursor]);
  pressed.clear();
}

function updateVictory(dt){
  app.winner?.updateAnimation(dt);
  if(pressed.has("enter")||pressed.has("r"))toSelect();
  pressed.clear();
}

function drawFight(){
  drawStageBack(ctx,GAME.width,GAME.height);
  for(const f of [app.p1,app.p2]){
    ctx.save();ctx.globalAlpha=.22;ctx.fillStyle="#000";
    ctx.beginPath();ctx.ellipse(f.x,GAME.floorY+3,f.kind==="cuy"?31:25,6,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  app.p1.render(ctx,showHitboxes);app.p2.render(ctx,showHitboxes);
  drawStageFront(ctx,GAME.width);
  let label="";
  if(app.phase==="round")label=`ROUND ${app.round}`;
  if(app.phase==="fight")label="FIGHT!";
  if(app.phase==="roundOver")label="K.O.";
  drawHud(ctx,app.p1,app.p2,app.time,app.wins1,app.wins2,label);

  if(app.phase==="round"){overlayText(`ROUND ${app.round}`)}
  else if(app.phase==="fight"){overlayText("FIGHT!","#e7bd55")}
  else if(app.phase==="roundOver"){overlayText(app.winner?"K.O.":"DRAW","#e36b56")}
}

function overlayText(text,color="#f3efe6"){
  ctx.save();ctx.fillStyle="rgba(0,0,0,.18)";ctx.fillRect(0,120,640,88);
  centerText(ctx,text,180,38,color);ctx.restore();
}

function drawSelect(){
  drawStageBack(ctx,640,360);
  ctx.fillStyle="rgba(7,9,10,.80)";ctx.fillRect(0,0,640,360);
  centerText(ctx,"SELECT FIGHTER",48,24);
  centerText(ctx,"A / D  ·  ENTER",69,11,"#c9d0d2");
  card("biker",195,188,app.select.cursor===0);
  card("cuy",445,188,app.select.cursor===1);
  const sel=app.select.choices[app.select.cursor],enemy=sel==="biker"?"cuy":"biker";
  centerText(ctx,`${CHARACTERS[sel].shortName}  VS  ${CHARACTERS[enemy].shortName}`,330,13,"#e6be58");
}

function card(kind,cx,cy,selected){
  const meta=CHARACTERS[kind],frames=images[kind].idle,img=frames[0];
  ctx.fillStyle=selected?"rgba(230,190,88,.18)":"rgba(20,24,27,.90)";
  ctx.strokeStyle=selected?"#e6be58":"#485055";ctx.lineWidth=selected?3:2;
  ctx.fillRect(cx-90,cy-105,180,210);ctx.strokeRect(cx-90,cy-105,180,210);
  centerLocal(meta.shortName,cx,cy-77,16,"#f1eee7");
  centerLocal(meta.subtitle,cx,cy-59,9,"#abb3b5");
  if(img?.naturalWidth){
    const scale=.57,fw=360*scale,fh=300*scale;
    ctx.drawImage(img,cx-fw/2,cy+80-286*scale,fw,fh);
  }
  if(selected)centerLocal("P1",cx,cy+90,12,"#e6be58");
}
function centerLocal(t,x,y,s,c){ctx.textAlign="center";ctx.font=`bold ${s}px monospace`;ctx.fillStyle=c;ctx.fillText(t,x,y)}

function drawLoading(){
  ctx.fillStyle="#111315";ctx.fillRect(0,0,640,360);
  centerText(ctx,"LA COFRADÍA BATTLE",135,25);
  centerText(ctx,"CARGANDO...",169,12,"#c6cdcf");
  const pct=app.loading.total?app.loading.loaded/app.loading.total:0;
  ctx.strokeStyle="#586065";ctx.strokeRect(160,195,320,18);
  ctx.fillStyle="#e6be58";ctx.fillRect(162,197,316*pct,14);
  centerText(ctx,`${Math.round(pct*100)}%`,231,11,"#c6cdcf");
}

function drawVictory(){
  drawFight();
  ctx.fillStyle="rgba(5,7,8,.64)";ctx.fillRect(0,0,640,360);
  centerText(ctx,"MATCH WINNER",68,24,"#f2efe7");
  centerText(ctx,app.winner?.name||"",96,18,"#e6be58");
  if(app.winner){
    const img=images[app.winner.kind].victory[app.winner.frame%images[app.winner.kind].victory.length];
    if(img?.naturalWidth){
      const scale=.85,fw=360*scale,fh=300*scale;
      ctx.drawImage(img,320-fw/2,306-286*scale,fw,fh);
    }
  }
  centerText(ctx,"ENTER · volver a selección",336,11,"#d0d5d5");
}

function render(){
  if(app.scene==="loading")drawLoading();
  else if(app.scene==="select")drawSelect();
  else if(app.scene==="fight")drawFight();
  else if(app.scene==="victory")drawVictory();
}

function update(dt){
  if(app.scene==="select")updateSelect();
  else if(app.scene==="fight")updateFight(dt);
  else if(app.scene==="victory")updateVictory(dt);
}

function frame(t){
  const dt=Math.min(.033,(t-previousTime)/1000||0);
  previousTime=t;update(dt);render();requestAnimationFrame(frame);
}

async function boot(){
  app.scene="loading";render();
  await loadAssets((loaded,total)=>{app.loading.loaded=loaded;app.loading.total=total;render()});
  toSelect();
  requestAnimationFrame(frame);
}
boot();
