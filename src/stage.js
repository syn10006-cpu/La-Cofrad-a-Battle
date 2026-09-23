export function drawStageBack(ctx,W,H) {
  ctx.fillStyle="#12171a"; ctx.fillRect(0,0,W,H);

  for(let x=0;x<W;x+=48){
    ctx.fillStyle=(x/48)%2===0?"#20292d":"#192126";
    ctx.fillRect(x,0,48,190);
    ctx.fillStyle="#0f1315"; ctx.fillRect(x+44,0,4,190);
  }

  // Hanging chains
  ctx.strokeStyle="#444b4e";ctx.lineWidth=3;
  [[18,5,145,75],[622,0,510,78],[210,10,316,62],[430,12,354,72]].forEach(p=>{
    ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.quadraticCurveTo((p[0]+p[2])/2,p[1]+55,p[2],p[3]);ctx.stroke();
  });

  // Screen
  ctx.fillStyle="#070a0b";ctx.fillRect(170,8,300,83);
  ctx.strokeStyle="#3e474b";ctx.lineWidth=4;ctx.strokeRect(170,8,300,83);
  ctx.textAlign="center";ctx.font="bold 17px monospace";ctx.fillStyle="#e66f5d";ctx.fillText("LIVE!",320,31);
  ctx.font="bold 21px monospace";ctx.fillStyle="#edf0eb";ctx.fillText("LA COFRADÍA",320,57);
  ctx.font="bold 16px monospace";ctx.fillText("FIGHT NIGHT",320,78);

  // Crowd zones
  ctx.fillStyle="#0c0e0f";ctx.fillRect(0,178,69,182);ctx.fillRect(571,178,69,182);
  for(let i=0;i<9;i++){
    drawPerson(ctx,10+(i%3)*21,220+(i%4)*30);
    drawPerson(ctx,582+(i%3)*22,213+(i%4)*31);
  }

  // Ring canvas
  ctx.fillStyle="#c9bea8";
  ctx.beginPath();ctx.moveTo(63,183);ctx.lineTo(577,183);ctx.lineTo(606,311);ctx.lineTo(34,311);ctx.closePath();ctx.fill();

  ctx.strokeStyle="#595248";ctx.lineWidth=3;ctx.beginPath();ctx.arc(320,249,48,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#4e493f";ctx.font="bold 10px monospace";ctx.fillText("LA COFRADÍA",320,246);
  ctx.font="8px monospace";ctx.fillText("BATTLE",320,260);

  // Rear posts + chains
  ctx.fillStyle="#735e51";ctx.fillRect(53,150,13,160);
  ctx.fillStyle="#59666c";ctx.fillRect(574,150,13,160);
  chain(ctx,60,181,580,false);chain(ctx,60,205,580,false);chain(ctx,60,229,580,false);

  // Apron
  ctx.fillStyle="#242426";ctx.fillRect(34,311,572,38);
  ctx.strokeStyle="#5b4b42";ctx.strokeRect(34,311,572,38);
  ctx.fillStyle="#ded6c8";ctx.font="bold 12px monospace";ctx.fillText("EL PROGRAMA DE STREAM",320,335);
}

export function drawStageFront(ctx,W) {
  ctx.fillStyle="#785f51";ctx.fillRect(46,213,13,106);
  ctx.fillStyle="#5f6b70";ctx.fillRect(581,213,13,106);
  chain(ctx,52,253,588,true);chain(ctx,52,276,588,true);chain(ctx,52,298,588,true);

  ctx.fillStyle="#08090a";
  for(let x=4;x<W;x+=34){ctx.beginPath();ctx.arc(x,357,13+(x%5),Math.PI,Math.PI*2);ctx.fill();}
}

export function drawHud(ctx,p1,p2,time,wins1,wins2,label="") {
  health(ctx,24,20,232,15,p1.displayHp,false,p1.meta.shortName);
  health(ctx,384,20,232,15,p2.displayHp,true,p2.meta.shortName);

  ctx.fillStyle="#0d1012";ctx.fillRect(294,10,52,34);
  ctx.strokeStyle="#555e62";ctx.strokeRect(294,10,52,34);
  ctx.fillStyle="#f2efe7";ctx.font="bold 18px monospace";ctx.textAlign="center";
  ctx.fillText(String(Math.max(0,Math.ceil(time))).padStart(2,"0"),320,34);

  dots(ctx,48,48,wins1,false);
  dots(ctx,592,48,wins2,true);

  if(label){
    ctx.font="bold 12px monospace";ctx.fillStyle="#e6be58";ctx.fillText(label,320,57);
  }
}

function health(ctx,x,y,w,h,value,reverse,label){
  ctx.fillStyle="#080a0b";ctx.fillRect(x-3,y-3,w+6,h+6);
  ctx.fillStyle="#3b3e3b";ctx.fillRect(x,y,w,h);
  const pct=Math.max(0,Math.min(1,value/100)),fw=Math.round(w*pct);
  const grd=ctx.createLinearGradient(x,y,x+w,y);
  grd.addColorStop(0,"#e8c157");grd.addColorStop(.65,"#d98744");grd.addColorStop(1,"#bf5143");
  ctx.fillStyle=grd;
  reverse?ctx.fillRect(x+w-fw,y,fw,h):ctx.fillRect(x,y,fw,h);
  ctx.font="bold 10px monospace";ctx.fillStyle="#f1eee7";ctx.textAlign=reverse?"right":"left";
  ctx.fillText(label,reverse?x+w:x,y-6);
}

function dots(ctx,x,y,wins,reverse){
  for(let i=0;i<2;i++){
    const xx=x+(reverse?-i*13:i*13);
    ctx.beginPath();ctx.arc(xx,y,4,0,Math.PI*2);
    ctx.fillStyle=i<wins?"#e6be58":"#3f4548";ctx.fill();
  }
}

function chain(ctx,x1,y,x2,front){
  ctx.save();ctx.strokeStyle=front?"#8d8b84":"#5e615f";ctx.lineWidth=front?4:3;
  ctx.beginPath();ctx.moveTo(x1,y);
  let x=x1,up=true;while(x<x2){ctx.quadraticCurveTo(Math.min(x+6,x2),y+(up?3:-3),Math.min(x+13,x2),y);x+=13;up=!up}
  ctx.stroke();ctx.restore();
}

function drawPerson(ctx,x,y){
  ctx.fillStyle="#151719";ctx.fillRect(x-5,y-22,10,18);ctx.beginPath();ctx.arc(x,y-27,5,0,Math.PI*2);ctx.fill();
}

export function centerText(ctx,text,y,size=26,color="#f4f0e7"){
  ctx.textAlign="center";ctx.font=`bold ${size}px monospace`;ctx.fillStyle=color;ctx.fillText(text,320,y);
}
