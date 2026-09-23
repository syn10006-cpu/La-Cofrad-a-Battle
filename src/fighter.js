import { GAME, CHARACTERS, ANIMATIONS, ATTACKS } from "./config.js";
import { images } from "./assets.js";

export class Fighter {
  constructor(kind,x,side) {
    this.kind=kind;
    this.meta=CHARACTERS[kind];
    this.name=this.meta.name;
    this.x=x;
    this.y=0;
    this.vy=0;
    this.facing=side==="left" ? 1 : -1;
    this.hp=100;
    this.displayHp=100;
    this.state="idle";
    this.stateTime=0;
    this.animTime=0;
    this.frame=0;
    this.grounded=true;
    this.blocking=false;
    this.dead=false;
    this.hitStun=0;
    this.attackConnected=false;
    this.runLatch=0;
    this.aiClock=0;
    this.ai={left:false,right:false,jump:false,crouch:false,weak:false,strong:false,block:false,run:false};
  }

  reset(x,side) {
    this.x=x; this.y=0; this.vy=0;
    this.facing=side==="left"?1:-1;
    this.hp=100; this.displayHp=100;
    this.state="idle"; this.stateTime=0; this.animTime=0; this.frame=0;
    this.grounded=true; this.blocking=false; this.dead=false;
    this.hitStun=0; this.attackConnected=false; this.runLatch=0;
  }

  setState(next,force=false) {
    if (!force && this.state===next) return;
    this.state=next;
    this.stateTime=0;
    this.animTime=0;
    this.frame=0;
    if (ATTACKS[next]) this.attackConnected=false;
  }

  isAttack(){ return Boolean(ATTACKS[this.state]); }
  canAct(){ return !this.dead && this.hitStun<=0 && !this.isAttack(); }

  bodyRect() {
    const crouched = ["crouch","crouch_attack","block"].includes(this.state);
    const h=crouched?this.meta.body.crouchHeight:this.meta.body.standHeight;
    const w=this.meta.body.width;
    const bottom=GAME.floorY-this.y;
    return {x:this.x-w/2,y:bottom-h,w,h};
  }

  attackRect() {
    const a=ATTACKS[this.state];
    if(!a) return null;
    const bottom=GAME.floorY-this.y;
    const x=this.facing>0?this.x+9:this.x-9-a.reach;
    return {x,y:bottom-a.yOffset-a.height/2,w:a.reach,h:a.height};
  }

  beginAttack(type) {
    if(!this.canAct()) return;
    this.blocking=false;
    this.setState(type,true);
  }

  updateAnimation(dt) {
    const frames=images[this.kind][this.state] || images[this.kind].idle;
    const cfg=ANIMATIONS[this.state] || ANIMATIONS.idle;
    this.animTime+=dt;
    const step=1/cfg.fps;
    while(this.animTime>=step){
      this.animTime-=step;
      if(cfg.loop) this.frame=(this.frame+1)%Math.max(1,frames.length);
      else this.frame=Math.min(frames.length-1,this.frame+1);
    }
  }

  takeHit(damage,push,hitStun,attacker,onKO,onBlock) {
    if(this.dead) return;

    const blockFacing =
      (attacker.x<this.x && this.facing<0) ||
      (attacker.x>this.x && this.facing>0);

    if(this.blocking && this.grounded && blockFacing) {
      const chip=Math.max(1,Math.round(damage*.15));
      this.hp=Math.max(0,this.hp-chip);
      this.x+=Math.sign(this.x-attacker.x)*Math.max(4,push*.3);
      onBlock?.(this,chip);
    } else {
      this.hp=Math.max(0,this.hp-damage);
      this.x+=Math.sign(this.x-attacker.x)*push;
      this.hitStun=hitStun;
      this.setState("hit",true);
    }

    if(this.hp<=0) {
      this.dead=true;
      this.blocking=false;
      this.setState("death",true);
      onKO?.(attacker,this);
    }
  }

  render(ctx,showHitboxes=false) {
    const frames=images[this.kind][this.state] || images[this.kind].idle;
    const img=frames[Math.min(this.frame,frames.length-1)];
    if(!img?.naturalWidth) return;

    const scale=this.meta.drawScale;
    const fw=GAME.frameCanvas.width*scale;
    const fh=GAME.frameCanvas.height*scale;
    const top=(GAME.floorY-this.y)-(GAME.frameCanvas.baselineY*scale);
    const left=this.x-fw/2;

    ctx.save();
    if(this.facing<0) {
      ctx.translate(this.x,0);
      ctx.scale(-1,1);
      ctx.drawImage(img,-fw/2,top,fw,fh);
    } else {
      ctx.drawImage(img,left,top,fw,fh);
    }
    ctx.restore();

    if(showHitboxes) {
      const body=this.bodyRect();
      ctx.fillStyle="rgba(60,220,120,.28)";
      ctx.fillRect(body.x,body.y,body.w,body.h);
      const hit=this.attackRect();
      const a=ATTACKS[this.state];
      if(hit && a && this.stateTime>=a.activeStart && this.stateTime<=a.activeEnd) {
        ctx.fillStyle="rgba(255,70,70,.38)";
        ctx.fillRect(hit.x,hit.y,hit.w,hit.h);
      }
    }
  }
}
