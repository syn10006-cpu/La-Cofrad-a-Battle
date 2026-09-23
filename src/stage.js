import { CANVAS, CHARACTERS } from "./config.js";
import { images } from "./assets.js";

export function drawRect(ctx, r, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(r.x),Math.round(r.y),Math.round(r.w),Math.round(r.h));
  ctx.restore();
}

export function drawChain(ctx, x1, y, x2, front=false) {
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

function drawCrowdPerson(ctx, x,y,scale=1) {
  ctx.fillStyle="#151719";
  ctx.fillRect(x-5*scale,y-23*scale,10*scale,18*scale);
  ctx.beginPath();
  ctx.arc(x,y-28*scale,5*scale,0,Math.PI*2);
  ctx.fill();
}

export function drawStageBack(ctx, W, H) {
  ctx.fillStyle="#12171a";
  ctx.fillRect(0,0,W,H);

  for(let x=0;x<W;x+=48){
    ctx.fillStyle=(x/48)%2===0?"#1b2429":"#20282c";
    ctx.fillRect(x,0,48,190);
    ctx.fillStyle="#101416";
    ctx.fillRect(x+44,0,4,190);
  }

  ctx.strokeStyle="#444a4c";
  ctx.lineWidth=3;
  for (const [sx,sy,ex,ey] of [[20,5,150,75],[615,0,510,80],[210,12,320,64],[430,12,350,72]]) {
    ctx.beginPath();ctx.moveTo(sx,sy);
    ctx.quadraticCurveTo((sx+ex)/2,sy+55,ex,ey);ctx.stroke();
  }

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

  ctx.fillStyle="#0e1011";
  ctx.fillRect(0,175,70,185);
  ctx.fillRect(570,175,70,185);

  for (let i=0;i<7;i++) {
    drawCrowdPerson(ctx, 12+(i%3)*22,215+(i%4)*32,0.9);
    drawCrowdPerson(ctx, 584+(i%3)*22,205+(i%4)*34,0.9);
  }

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

  ctx.fillStyle="#6a5d54";
  ctx.fillRect(54,150,12,151);
  ctx.fillStyle="#59646c";
  ctx.fillRect(574,150,12,151);

  drawChain(ctx, 60,180,580,false);
  drawChain(ctx, 60,204,580,false);
  drawChain(ctx, 60,228,580,false);

  ctx.fillStyle="#c9bfaa";
  ctx.beginPath();
  ctx.moveTo(64,184);ctx.lineTo(576,184);ctx.lineTo(604,309);ctx.lineTo(36,309);ctx.closePath();
  ctx.fill();

  ctx.fillStyle="rgba(60,50,40,.08)";
  for(let i=0;i<38;i++){
    const x=60+((i*71)%520), y=194+((i*37)%105);
    ctx.fillRect(x,y,4+(i%7),2);
  }

  ctx.strokeStyle="#5a544a";
  ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(320,247,48,0,Math.PI*2);ctx.stroke();
  ctx.font="bold 11px monospace";
  ctx.fillStyle="#4b473f";ctx.textAlign="center";
  ctx.fillText("LA COFRADÍA",320,243);
  ctx.font="9px monospace";
  ctx.fillText("FIGHT NIGHT",320,258);

  ctx.fillStyle="#242426";
  ctx.fillRect(35,309,570,39);
  ctx.strokeStyle="#5b4b42";ctx.strokeRect(35,309,570,39);
  ctx.font="bold 13px monospace";
  ctx.fillStyle="#d8d1c3";ctx.textAlign="center";
  ctx.fillText("EL PROGRAMA DE STREAM",320,334);
}

export function drawStageFront(ctx, W, H) {
  ctx.fillStyle="#765d50";
  ctx.fillRect(46,214,13,103);
  ctx.fillStyle="#5e6a6f";
  ctx.fillRect(581,214,13,103);
  drawChain(ctx, 52,252,588,true);
  drawChain(ctx, 52,274,588,true);
  drawChain(ctx, 52,296,588,true);
  ctx.fillStyle="#0a0b0c";
  for(let x=5;x<W;x+=34){
    ctx.beginPath();
    ctx.arc(x,354,13+(x%5),Math.PI,Math.PI*2);
    ctx.fill();
  }
}

export function healthBar(ctx, x,y,w,h,value,reverse,label) {
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

export function drawHud(ctx, p1, p2, matchStateText="VS") {
  healthBar(ctx,24,20,232,15,p1.displayHp,false,p1.name);
  healthBar(ctx,384,20,232,15,p2.displayHp,true,p2.name);

  ctx.fillStyle="#111416";
  ctx.fillRect(294,12,52,30);
  ctx.strokeStyle="#5a6165";
  ctx.strokeRect(294,12,52,30);
  ctx.textAlign="center";
  ctx.font="bold 13px monospace";
  ctx.fillStyle=matchStateText==="K.O."?"#e87862":"#ece7d9";
  ctx.fillText(matchStateText,320,32);
}

export function drawCharacterCard(ctx, key, x, y, selected=false) {
  const meta = CHARACTERS[key];
  const cardW = 180, cardH = 180;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = selected ? "rgba(229,193,106,.18)" : "rgba(19,23,25,.92)";
  ctx.strokeStyle = selected ? meta.selectAccent : "#3d4548";
  ctx.lineWidth = selected ? 3 : 2;
  roundRect(ctx, -cardW/2, -cardH/2, cardW, cardH, 10, true, true);

  ctx.fillStyle = "#edf1ec";
  ctx.textAlign = "center";
  ctx.font = "bold 16px monospace";
  ctx.fillText(meta.displayName, 0, -56);
  ctx.font = "12px monospace";
  ctx.fillStyle = "#c9d0d2";
  ctx.fillText(meta.subtitle, 0, -37);

  const preview = (images[key]?.select?.[0]) || (images[key]?.idle?.[0]);
  if (preview?.naturalWidth) {
    const scale = meta.previewScale;
    const dw = preview.naturalWidth * scale;
    const dh = preview.naturalHeight * scale;
    ctx.drawImage(preview, Math.round(-dw/2), Math.round(-dh/2) + 18, Math.round(dw), Math.round(dh));
  }

  if (selected) {
    ctx.fillStyle = meta.selectAccent;
    ctx.font = "bold 12px monospace";
    ctx.fillText("SELECCIONADO", 0, 67);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
