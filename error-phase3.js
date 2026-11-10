(() => {
  'use strict';
  const BALANCE={laserLength:500,laserCharge:1.35,laserDuration:3.8,laserSweep:0.5,laserTurnRate:0.14,swingCharge:1.0,swingDuration:0.78,recoverDuration:1.35};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
  const noise=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
  const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  function poseAt(root,target,scale=3.6,facing=Math.PI,curl=0.25,bendSign=null,reach=1,handOpen=0) {
    const l1=Math.hypot(4,37*1.2*reach)*scale,l2=Math.hypot(2,38*reach)*scale;
    const dx=target.x-root.x,dy=target.y-root.y,n=Math.hypot(dx,dy)||1,d=clamp(n,Math.abs(l1-l2)+1,l1+l2-1);
    const ux=dx/n,uy=dy/n,a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
    const sign=bendSign??(target.y<root.y?1:-1);
    const joint={x:root.x+ux*a-uy*h*sign,y:root.y+uy*a+ux*h*sign},wrist={x:root.x+ux*d,y:root.y+uy*d};
    const a2=Math.atan2(wrist.y-joint.y,wrist.x-joint.x);
    return window.ErrorHands.buildHand({root,scale,reach:[reach,reach],arm1Angle:Math.atan2(joint.y-root.y,joint.x-root.x),arm2Angle:a2,wrist:clamp(Math.atan2(Math.sin(facing-a2-0.22),Math.cos(facing-a2-0.22)),-1.05,1.05),curl,fingerSpacing:2.3+handOpen,fingerSpread:0.035+handOpen*0.18});
  }
  function world(pose,q) {return {x:q.x,y:pose.root.y+(q.y-pose.root.y)*(pose.mirror||1)};}
  const palm=pose=>world(pose,pose.palm.end);
  const wrist=pose=>world(pose,pose.arm2.end);
  const claw=pose=>world(pose,pose.fingers[1].tip.end);
  function create(width,height) {
    return {age:0,width,height,left:width*0.1,right:width*0.9,playerMaxRight:width*0.65-45,bossBounds:{left:width*0.69,right:width*0.86,top:height*0.26,bottom:height*0.74},intro:5.9,ending:0,
      pools:[],minis:[],miniTimer:7.5,serial:0,pairTimer:18,pairCount:0,pair:null,
      hands:[0,1].map(i=>({id:'error-hand-'+i,index:i,hp:10000,maxHp:10000,flash:0,stage:'IDLE',timer:1.0+i*2.1,cycles:0,meleeCount:i*2,attackKind:'SWING',sweepDirection:i?-1:1,laserGroundTimer:0,pose:null,laser:null,downAge:0}))};
  }
  function addPool(p,a,b,width=18) {
    const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    const existing=p.pools.slice(-12).find(pool=>Math.hypot((pool.a.x+pool.targetB.x)/2-center.x,(pool.a.y+pool.targetB.y)/2-center.y)<8&&Math.abs(pool.targetWidth-width)<2);
    if(existing) {existing.life=existing.maxLife;return existing;}
    const pool={a:{...a},b:{...a},targetB:{...b},width:Math.max(4,width*0.3),targetWidth:width,age:0,life:7.5,maxLife:7.5,seed:p.serial++};
    p.pools.push(pool);if(p.pools.length>100)p.pools.splice(0,p.pools.length-100);return pool;
  }
  const mirrored=(pose,index)=>{pose.mirror=index? -1:1;return pose;};
  const angleMix=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
  const linkAngle=part=>Math.atan2(part.end.y-part.start.y,part.end.x-part.start.x);
  function handCavity(pose) {
    const p0=palm(pose),p1=world(pose,pose.fingers[1].base.end),p2=world(pose,pose.fingers[1].tip.end),p3=world(pose,pose.thumb.tip.end);
    return {x:p0.x*0.30+p1.x*0.30+p2.x*0.18+p3.x*0.22,y:p0.y*0.30+p1.y*0.30+p2.y*0.18+p3.y*0.22};
  }
  function fingerPose(pose,kind,phase=0) {
    const u=clamp(phase,0,1),a1=linkAngle(pose.arm1),a2=linkAngle(pose.arm2);
    let fingers,thumb,spacing=pose.fingerSpacing??2.3;
    if(kind==='spear') {
      // Converge all three fingers into a tight spear point aligned with the palm and forearm.
      fingers=[0,1,2].map(i=>({base:-(i-1)*0.022,tip:-(i-1)*0.018}));
      thumb={base:-0.12,tip:0.04};spacing=0.9;
    } else if(kind==='hook') {
      // Start spread wide, then curl inward (negative palmar direction) like talons as the arms cross.
      const close=ease((u-0.14)/0.62);
      fingers=[0,1,2].map(i=>{
        const digitClose=ease((u-0.14-i*0.045)/0.58);
        const openBase=0.36+(i-1)*0.08,openTip=-0.18+(i-1)*0.04;
        return {base:openBase-digitClose*(0.84+i*0.05),tip:openTip-digitClose*(1.54+i*0.06)};
      });
      thumb={base:-0.95+ease((u-0.26)/0.54)*0.58,tip:-0.12+ease((u-0.36)/0.5)*0.82};
      spacing=3.5-close*1.15;
    } else if(kind==='reach') {
      fingers=[0,1,2].map(i=>({base:0.38+(i-1)*0.12,tip:-0.14+(i-1)*0.06}));
      thumb={base:-0.95,tip:-0.20};spacing=3.5;
    } else if(kind==='slash') {
      // Spread a nearly straight hand through the strike. The distal joints
      // trail the palm, then follow through and relax as the sweep finishes.
      const release=ease((u-0.06)/0.34),settle=ease((u-0.74)/0.26);
      fingers=[0,1,2].map(i=>{
        const digitClose=ease((u-0.1-i*0.04)/0.42);
        return {base:0.22-release*0.18+(i-1)*(0.04+release*0.045)-settle*(0.22+i*0.03),
          tip:-0.42+digitClose*0.36-settle*(0.38+i*0.04)};
      });
      thumb={base:-0.88-release*0.12+settle*0.18,tip:0.12-release*0.1+settle*0.28};spacing=3.4-settle*0.35;
    } else if(kind==='rake') {
      fingers=[0,1,2].map(i=>{const flex=ease((u-i*0.08)/0.4)*(1-0.35*ease((u-0.86)/0.14));return {base:0.45-flex*(0.75+i*0.07),tip:0.1-flex*(1.9+i*0.16)};});
      thumb={base:-0.95+u*0.15,tip:0.45+u*0.7};spacing=3;
    } else if(kind==='laser') {
      fingers=[0,1,2].map(i=>({base:0.48+i*0.26+Math.sin(phase*7+i*1.7)*0.03,tip:-0.08+i*0.16+Math.sin(phase*9+i)*0.035}));
      thumb={base:-0.95,tip:0.08+Math.sin(phase*8)*0.04};spacing=3.8;
    } else if(kind==='crush') {
      // Two-stage execution grasp:
      // 1) Cage (u: 0 -> 0.64): Fingers curl inward around the front of the ship and tuck their tips back
      //    toward the palm while the thumb swings up from below (u: 0.36 -> 0.76) to close the fist loop.
      // 2) Vice Clench (u: 0.64 -> 1.0): The closed fist polygon tightens inward around the trapped ship.
      const squeeze=ease((u-0.64)/0.36);
      fingers=[0,1,2].map(i=>{
        const cageGrip=ease((u-i*0.03)/0.48);
        const openBase=0.44+(i-1)*0.14,openTip=-0.10+(i-1)*0.08;
        const cageBase=0.22+(i-1)*0.12,cageTip=-1.66+(i-1)*0.12;
        const crushBase=0.12+(i-1)*0.12,crushTip=-1.92+(i-1)*0.12;
        const baseAtCage=openBase+(cageBase-openBase)*cageGrip;
        const tipAtCage=openTip+(cageTip-openTip)*cageGrip;
        return {
          base:baseAtCage+(crushBase-baseAtCage)*squeeze,
          tip:tipAtCage+(crushTip-tipAtCage)*squeeze
        };
      });
      const thumbBaseCage=ease((u-0.36)/0.40),thumbTipCage=ease((u-0.42)/0.38);
      thumb={
        base:-0.95+thumbBaseCage*0.34+squeeze*0.08,
        tip:-0.20+thumbTipCage*0.56+squeeze*0.26
      };
      spacing=3.6-ease(u/0.64)*1.05-squeeze*0.35;
    } else {
      fingers=[0,1,2].map(i=>({base:0.3+Math.sin(phase*1.7+i*2)*0.08,tip:-0.5+Math.sin(phase*2.1+i*1.6)*0.16}));
      thumb={base:-0.8,tip:0.18+Math.sin(phase*1.3)*0.06};
    }
    return window.ErrorHands.buildHand({root:pose.root,scale:pose.arm1.scale,mirror:pose.mirror,
      reach:[pose.arm1.stretchY/1.2,pose.arm2.stretchY],arm1Angle:a1,arm2Angle:a2,wrist:pose.facing-a2-0.22,
      curl:pose.curl,fingerForeshorten:kind==='crush'?1-ease(u)*0.38:1,thumbForeshorten:kind==='crush'?1-ease(u)*0.18:1,fingerAngles:fingers,thumbAngles:thumb,fingerSpacing:spacing});
  }
  function blendPose(root,index,from,to,t) {
    const angle=linkAngle;
    const a1=angleMix(angle(from.arm1),angle(to.arm1),t);
    const fromFlex=Math.atan2(Math.sin(angle(from.arm2)-angle(from.arm1)),Math.cos(angle(from.arm2)-angle(from.arm1)));
    const toFlex=Math.atan2(Math.sin(angle(to.arm2)-angle(to.arm1)),Math.cos(angle(to.arm2)-angle(to.arm1)));
    const a2=a1+fromFlex+(toFlex-fromFlex)*t;
    // Interpolate the wrist relative to its forearm, rather than holding a
    // world-space palm heading while the elbow turns underneath it.
    const wristOf=pose=>clamp(Math.atan2(Math.sin(pose.facing-angle(pose.arm2)-0.22),Math.cos(pose.facing-angle(pose.arm2)-0.22)),-1.05,1.05);
    const facing=a2+0.22+wristOf(from)+(wristOf(to)-wristOf(from))*t;
    return mirrored(window.ErrorHands.buildHand({root,scale:3.6,reach:[from.arm1.stretchY/1.2+(to.arm1.stretchY-from.arm1.stretchY)/1.2*t,from.arm2.stretchY+(to.arm2.stretchY-from.arm2.stretchY)*t],arm1Angle:a1,arm2Angle:a2,wrist:clamp(Math.atan2(Math.sin(facing-a2-0.22),Math.cos(facing-a2-0.22)),-1.05,1.05),
      fingerForeshorten:(from.fingerForeshorten??1)+((to.fingerForeshorten??1)-(from.fingerForeshorten??1))*t,thumbForeshorten:(from.thumbForeshorten??1)+((to.thumbForeshorten??1)-(from.thumbForeshorten??1))*t,
      fingerAngles:[0,1,2].map(i=>({base:angleMix(from.fingerAngles[i].base,to.fingerAngles[i].base,t),tip:angleMix(from.fingerAngles[i].tip,to.fingerAngles[i].tip,t)})),
      thumbAngles:{base:angleMix(from.thumbAngles.base,to.thumbAngles.base,t),tip:angleMix(from.thumbAngles.tip,to.thumbAngles.tip,t)},
      curl:from.curl+(to.curl-from.curl)*t,
      fingerSpacing:(from.fingerSpacing??2.3)+((to.fingerSpacing??2.3)-(from.fingerSpacing??2.3))*t,
      fingerSpread:(from.fingerSpread??0.035)+((to.fingerSpread??0.035)-(from.fingerSpread??0.035))*t}),index);
  }
  function idlePose(root,index,time) {
    return fingerPose(mirrored(poseAt(root,{x:root.x-175+Math.sin(time*0.75)*18,y:root.y-150+Math.sin(time*1.1)*12},3.6,
      Math.PI+Math.sin(time*0.95)*0.18,0.24+Math.sin(time*1.3)*0.07,1),index),'idle',time);
  }
  function sweepPose(root,index,progress,claw=false) {
    const p=clamp(progress,0,1),travel=(1-Math.cos(Math.PI*p))/2;
    // Charge establishes a long open arm BEFORE the strike. The shoulder
    // sweeps a broad arc; a small, delayed elbow/wrist release provides drag
    // without folding the arm into the old rigid V.
    const a1=Math.PI+1.12-travel*2.14;
    const flex=-0.24+0.15*Math.sin(Math.PI*p)-0.04*ease((p-0.84)/0.16);
    const wristBend=-0.32+0.55*ease((p-0.18)/0.64)-0.08*ease((p-0.9)/0.1);
    const pose=mirrored(window.ErrorHands.buildHand({root,scale:3.6,
      arm1Angle:a1,arm2Angle:a1+flex,wrist:wristBend}),index);
    return fingerPose(pose,claw?'rake':'slash',p);
  }
  function swingPose(root,index,progress) {return sweepPose(root,index,progress);}
  function crossHookPose(root,index,progress,pairMode=false,aim=Math.PI) {
    const p=clamp(progress,0,1),u=ease(p),mirror=index?-1:1;
    const aimOffset=pairMode?0:clamp(Math.atan2(Math.sin(aim-Math.PI),Math.cos(aim-Math.PI))*mirror,-0.28,0.28);
    // Open wide during windup, then drive the shoulder across the boss midline while
    // the elbow hooks deeply inward and the wrist rotates to snatch the crossed space.
    const startA1=(pairMode?Math.PI+1.08:Math.PI+1.02)+aimOffset*0.45;
    const endA1=(pairMode?Math.PI-0.40:Math.PI-0.34)+aimOffset*0.65;
    const a1=startA1+(endA1-startA1)*u;
    const hookTurn=ease((p-0.18)/0.68);
    const flex=-0.22+0.06*Math.sin(Math.PI*clamp(p/0.35,0,1))-0.64*hookTurn;
    const wristBend=0.26-0.74*ease((p-0.14)/0.72);
    const pose=mirrored(window.ErrorHands.buildHand({root,scale:3.6,
      arm1Angle:a1,arm2Angle:a1+flex,wrist:wristBend,curl:0.15+0.7*hookTurn}),index);
    return fingerPose(pose,'hook',p);
  }
  const MELEE_KINDS=['SWING','THRUST','HOOK','RAKE'];
  function attackDuration(kind) {return kind==='THRUST'?0.9:kind==='HOOK'?1.1:kind==='RAKE'?1.2:BALANCE.swingDuration;}
  function attackPose(root,index,progress,kind='SWING',aim=Math.PI,reachDistance=285) {
    if(kind==='SWING')return swingPose(root,index,progress);
    if(kind==='RAKE')return sweepPose(root,index,progress,true);
    if(kind==='HOOK')return crossHookPose(root,index,progress,false,aim);
    const p=clamp(progress,0,1),mirror=index?-1:1;
    const heading=aim*mirror;
    if(kind==='THRUST') {
      // Coiled spear stance at p=0 that lunges straight along heading with forearm, wrist,
      // and converged fingers aligned along the stab vector, then settles slightly after peak extension.
      const lunge=p<0.58?ease(p/0.58):1-0.12*ease((p-0.58)/0.42);
      const reachBoost=clamp((reachDistance-225)/60,0,1)*0.05*lunge;
      const a1=heading+1.34-lunge*(1.22+reachBoost);
      const a2=heading-0.50+lunge*(0.44+reachBoost*0.5);
      const wristBend=0.10-lunge*0.26;
      const pose=mirrored(window.ErrorHands.buildHand({root,scale:3.6,
        arm1Angle:a1,arm2Angle:a2,wrist:wristBend,curl:0.04}),index);
      return fingerPose(pose,'spear',p);
    }
    const u=ease(p),radius=230+45*Math.sin(Math.PI*u),angle=heading-0.4+u*0.8,facing=angle-0.45+0.8*ease((p-0.2)/0.7);
    const pose=mirrored(poseAt(root,{x:root.x+Math.cos(angle)*radius,y:root.y+Math.sin(angle)*radius},3.6,facing,0.2,1),index);
    return fingerPose(pose,'hook',p);
  }
  function armsHit(player,previous,pose) {
    for(let step=0;step<=4;step++) {
      const u=step/4;
      for(const key of ['arm1','arm2']) {
        const a=lerp(world(previous,previous[key].start),world(pose,pose[key].start),u);
        const b=lerp(world(previous,previous[key].end),world(pose,pose[key].end),u);
        if(distance(player,a,b)<player.hitboxRadius+7)return true;
      }
    }
    return false;
  }
  function handHits(player,previous,pose) {
    const digits=p=>[p.palm,...p.fingers.flatMap(f=>[f.base,f.tip]),p.thumb.base,p.thumb.tip];
    const before=digits(previous),after=digits(pose);
    for(let i=0;i<after.length;i++)for(let step=0;step<=4;step++) {
      const u=step/4,a=lerp(world(previous,before[i].start),world(pose,after[i].start),u),b=lerp(world(previous,before[i].end),world(pose,after[i].end),u);
      if(distance(player,a,b)<player.hitboxRadius+(i===0?20:10))return true;
    }
    return false;
  }
  function setLaser(h,angle) {
    const a=palm(h.pose);
    h.laser={a,b:{x:a.x+Math.cos(angle)*BALANCE.laserLength,y:a.y+Math.sin(angle)*BALANCE.laserLength},angle,halfWidth:18,model:true};
  }
  function laserHits(player,laser) {
    const dx=laser.b.x-laser.a.x,dy=laser.b.y-laser.a.y,n=Math.hypot(dx,dy);
    const px=player.x-laser.a.x,py=player.y-laser.a.y,along=(px*dx+py*dy)/n;
    return along>=-player.hitboxRadius&&along<=n+player.hitboxRadius&&Math.abs(px*dy-py*dx)/n<=laser.halfWidth+player.hitboxRadius;
  }
  function layLaserGround(p,h) {
    const {a,b,halfWidth}=h.laser,nx=-Math.sin(h.laser.angle),ny=Math.cos(h.laser.angle);
    for(let i=1;i<=3;i++) {const u=i/3,c=lerp(a,b,u),w=halfWidth;
      addPool(p,{x:c.x-nx*w,y:c.y-ny*w},{x:c.x+nx*w,y:c.y+ny*w},15);}
  }
  function beginAction(p,h,body,player) {
    const wantsLaser=(h.cycles+1)%3===0;
    if(!wantsLaser) {h.attackKind=MELEE_KINDS[(h.meleeCount||0)%MELEE_KINDS.length];h.meleeCount=(h.meleeCount||0)+1;}
    h.stabHit=false;h.uncrossReturn=false;h.returnWasPair=false;
    h.cycles++;h.stage=h.cycles%3===0?'LASER_WARN':'SCRATCH_WARN';h.timer=h.stage==='LASER_WARN'?BALANCE.laserCharge:BALANCE.swingCharge;
    h.windupPose=h.pose;h.origin=wrist(h.pose);
    const muzzle=palm(h.pose);const aim=Math.atan2(player.y-muzzle.y,player.x-muzzle.x);
    h.aim=Math.PI+clamp(Math.atan2(Math.sin(aim-Math.PI),Math.cos(aim-Math.PI)),-0.55,0.55);
    const root={x:body.x-5,y:body.y+(h.index?12:-12)};h.attackDistance=clamp(Math.hypot(player.x-root.x,player.y-root.y)-70,225,285);
    h.sweepDirection=h.index?-1:1;h.laserGroundTimer=0;
  }
  function rotatePose(pose,angle) {
    const root=pose.root,c=Math.cos(angle),s=Math.sin(angle);
    const rotate=q=>({x:root.x+(q.x-root.x)*c-(q.y-root.y)*s,y:root.y+(q.x-root.x)*s+(q.y-root.y)*c});
    for(const piece of pose.pieces){piece.start=rotate(piece.start);piece.end=rotate(piece.end);piece.rotation+=angle;}
    pose.facing+=angle;return pose;
  }
  function createEdgeArm(p,side=null) {
    const edge=side==='rear'?'rear':side===true?'top':side===false?'bottom':['top','bottom','rear'][Math.floor(Math.random()*3)];
    return {x:p.left+110+Math.random()*(p.right-p.left-220),y:115+Math.random()*(p.height-210),edge,top:edge==='top',
      direction:1,span:240+Math.random()*110,depth:170+Math.random()*35,
      lean:(Math.random()-0.5)*0.36,elbowSide:-1,age:0,previous:null,pose:null};
  }
  function previewAttack(p,body,player,kind) {
    p.age=Math.max(p.age,p.intro+0.1);p.minis=[];p.pools=[];p.miniTimer=100;p.pair=null;p.pairTimer=100;
    for(const h of p.hands) {
      const root={x:body.x-5,y:body.y+(h.index?12:-12)};
      h.pose=idlePose(root,h.index,p.age);h.stage='IDLE';h.timer=100;h.laser=null;h.motionTrail=[];h.uncrossReturn=false;h.returnWasPair=false;
    }
    if(['swing','thrust','hook','rake','laser'].includes(kind))for(const h of p.hands)if(h.hp>0){h.cycles=kind==='laser'?2:0;h.meleeCount=Math.max(0,MELEE_KINDS.indexOf(kind.toUpperCase()));beginAction(p,h,body,player);}
    if(kind==='gap'||kind==='wrap')startPair(p,body,player,kind);
    if(kind==='edge')for(const top of [true,false])p.minis.push(createEdgeArm(p,top));
    if(kind==='rear')p.minis.push(createEdgeArm(p,'rear'));
  }
  function startPair(p,body,player,kind) {
    if(p.hands.some(h=>h.hp<=0))return false;
    p.pair={kind,age:0,center:body.y,body:{x:body.x,y:body.y}};
    for(const h of p.hands){h.stage='PAIR_WARN';h.windupPose=h.pose;h.laser=null;h.motionTrail=[];h.uncrossReturn=false;h.returnWasPair=false;}
    return true;
  }
  function pairPose(p,h,body,progress) {
    const pair=p.pair,root={x:body.x-5,y:body.y+(h.index?12:-12)};
    const u=ease(progress);
    if(pair.kind==='gap') {
      // Boss-relative bidirectional lasers: start aimed toward the outer vertical ends using
      // shoulder + elbow rotation (keeping the wrist natural), then sweep forward so the beams
      // cross and narrow the space in front of the boss while leaving a central safe pocket around body.y.
      const a1=Math.PI+1.32-u*0.48;
      const flex=-0.44-u*0.755;
      const wristBend=-0.04+u*0.04;
      const recoil=Math.sin(p.age*22)*0.008;
      const pose=mirrored(window.ErrorHands.buildHand({root,scale:3.6,
        arm1Angle:a1+recoil,arm2Angle:a1+flex,wrist:wristBend,curl:0.05}),h.index);
      return fingerPose(pose,'laser',p.age);
    }
    return crossHookPose(root,h.index,progress,true);
  }
  function pairBeam(p,h) {
    const a=palm(h.pose),angle=h.pose.facing*(h.pose.mirror||1);
    const reach=Math.max(BALANCE.laserLength,(a.x-16)/Math.max(0.18,-Math.cos(angle)));
    return {a,b:{x:a.x+Math.cos(angle)*reach,y:a.y+Math.sin(angle)*reach},angle,halfWidth:18,model:true};
  }
  function beginCapture(p,attacker,player) {
    if(p.capture||p.ending)return false;
    const owner=p.hands.find(h=>h.pose===attacker)||p.minis.find(m=>m.pose===attacker);
    p.capture={age:0,duration:1.85,sourcePose:attacker,owner,pose:attacker,root:{...attacker.root},mirror:attacker.mirror||1,
      start:{x:player.x,y:player.y},playerPos:{x:player.x,y:player.y},playerScaleX:1,playerScaleY:1,playerOpacity:1,burst:false};
    for(const h of p.hands)h.laser=null;
    return true;
  }
  function updateCapture(p,dt,player,{shake,burst}) {
    const c=p.capture;if(!c)return false;c.age+=dt;
    // 4-stage execution: 1) Open-jaw catch (0..0.28s), 2) 3-finger cage + thumb lock (0.12..0.64s),
    // 3) Cock-back hold + violent vice clench (0.50..1.32s), 4) Post-crush slack release (1.46..1.85s).
    const reach=ease(c.age/0.28),cage=ease((c.age-0.12)/0.50),cock=ease((c.age-0.48)/0.30),crush=ease((c.age-0.76)/0.36),release=ease((c.age-1.46)/0.36);
    const root=c.root;
    if(c.bendSign===undefined) {
      const flex=Math.atan2(Math.sin(linkAngle(c.sourcePose.arm2)-linkAngle(c.sourcePose.arm1)),Math.cos(linkAngle(c.sourcePose.arm2)-linkAngle(c.sourcePose.arm1)));
      c.bendSign=flex<0?1:-1;
    }
    // Keep the wrist at a natural anatomical extension (205..265px from shoulder root) so the forearm
    // always points forward toward the arena instead of folding backward onto the upper arm.
    const rawDx=c.start.x-root.x,rawDy=c.start.y-root.y,rawDist=Math.hypot(rawDx,rawDy)||1;
    const isBossHand=p.hands.includes(c.owner);
    const dirAngle=isBossHand
      ? Math.PI+clamp(Math.atan2(Math.sin(Math.atan2(rawDy,rawDx)-Math.PI),Math.cos(Math.atan2(rawDy,rawDx)-Math.PI)),-0.46,0.46)
      : Math.atan2(rawDy,rawDx);
    const graspDist=clamp(rawDist,228,268)-cock*22+crush*10;
    const naturalPocket={
      x:clamp(root.x+Math.cos(dirAngle)*graspDist,p.left+56,p.right-56),
      y:clamp(root.y+Math.sin(dirAngle)*graspDist,145,p.height-85)
    };
    const tremor=crush>0&&crush<1?Math.sin(c.age*68)*3.4*Math.sin(Math.PI*crush):0;
    const desiredPocket={
      x:lerp(c.start,naturalPocket,ease(c.age/0.36)).x+tremor,
      y:lerp(c.start,naturalPocket,ease(c.age/0.36)).y+Math.cos(c.age*60)*tremor*0.65
    };
    const curlStage=clamp(cage*0.64+crush*0.36-release*0.26,0,1);
    const wristClench=-0.03-0.09*cage-0.11*crush+0.09*release;
    const buildGoalAt=wristLocal=>{
      let g=poseAt(root,wristLocal,3.6,Math.PI,curlStage,c.bendSign);
      g.mirror=c.mirror;
      g.facing=linkAngle(g.arm2)+0.22+wristClench;
      return fingerPose(g,'crush',curlStage);
    };
    const localTarget={x:desiredPocket.x,y:root.y+(desiredPocket.y-root.y)*c.mirror};
    const dirLocal=Math.atan2(localTarget.y-root.y,localTarget.x-root.x);
    const wristDist=clamp(Math.hypot(localTarget.x-root.x,localTarget.y-root.y)-52,188,252);
    const guessLocal={x:root.x+Math.cos(dirLocal)*wristDist,y:root.y+Math.sin(dirLocal)*wristDist};
    const probe=buildGoalAt(guessLocal);
    const probeCav=handCavity(probe);
    const adjustedWorld={
      x:guessLocal.x+(desiredPocket.x-probeCav.x),
      y:root.y+(guessLocal.y-root.y)*c.mirror+(desiredPocket.y-probeCav.y)
    };
    const adjDx=adjustedWorld.x-root.x,adjDy=adjustedWorld.y-root.y,adjDist=Math.hypot(adjDx,adjDy)||1;
    const safeDist=clamp(adjDist,185,256);
    const safeWorld={x:root.x+adjDx/adjDist*safeDist,y:root.y+adjDy/adjDist*safeDist};
    const adjustedLocal={x:safeWorld.x,y:root.y+(safeWorld.y-root.y)*c.mirror};
    const goal=buildGoalAt(adjustedLocal);
    c.pose=blendPose(root,c.mirror<0?1:0,c.sourcePose,goal,reach);
    const pocket=handCavity(c.pose);
    c.playerPos=lerp(c.start,pocket,reach);player.x=c.playerPos.x;player.y=c.playerPos.y;
    c.playerScaleX=1-cage*0.10-crush*0.72;c.playerScaleY=1-cage*0.08-crush*0.56;c.playerOpacity=1-ease((c.age-1.16)/0.18);
    if(crush>=0.42&&!c.burst) {c.burst=true;shake(0.30,7.0);burst(c.playerPos);}
    return c.age>=c.duration;
  }
  function update(p,dt,{body,player,corrupt,damage,kill,shake}) {
    if(p.capture)return null;
    p.age+=dt;
    if(p.ending>0) {p.ending+=dt;return p.ending>=1.8?'DONE':null;}
    if(p.hands.every(h=>h.hp<=0)) {p.ending=0.001;p.pools=[];p.minis=[];shake(0.45,5);return 'DELETING';}
    for(const pool of p.pools) {pool.life-=dt;pool.age=(pool.age||0)+dt;pool.b=lerp(pool.a,pool.targetB,ease(pool.age/0.25));pool.width=pool.targetWidth*(0.3+0.7*ease(pool.age/0.45));}p.pools=p.pools.filter(x=>x.life>0);
    if(p.age>=p.intro&&!p.pair) {
      p.pairTimer-=dt;
      if(p.pairTimer<=0&&p.hands.every(h=>h.hp>0&&['IDLE','RETURN'].includes(h.stage))) {
        startPair(p,body,player,p.pairCount++%2?'wrap':'gap');
      }
    }
    if(p.pair) {
      p.pair.age+=dt;p.pair.center=body.y;p.pair.body={x:body.x,y:body.y};
      if(p.hands.some(h=>h.hp<=0)){
        const wasWrap=p.pair.kind==='wrap';
        p.pair=null;p.pairTimer=22;
        for(const h of p.hands)if(h.hp>0){h.stage='RETURN';h.timer=BALANCE.recoverDuration;h.returnPose=h.pose;h.uncrossReturn=wasWrap;h.returnWasPair=wasWrap;h.laser=null;}
      }
    }
    for(const h of p.hands) {
      h.flash=Math.max(0,h.flash-dt);
      if(h.hp<=0) {h.downAge+=dt;continue;}
      if(p.age<p.intro) {
        h.pose=window.ErrorHands.buildEmergenceHand(p.age,h.index,{width:body.x+90,height:body.y*2});continue;
      }
      const root={x:body.x-5,y:body.y+(h.index?12:-12)};
      h.motionTrail=(h.motionTrail||[]).filter(ghost=>p.age-ghost.age<0.16);
      const previousPose=h.pose;
      const home=idlePose(root,h.index,p.age);
      h.timer-=dt;
      if(h.stage==='IDLE') {
        h.pose=blendPose(root,h.index,h.pose||home,home,1-Math.exp(-dt*5));
        if(h.timer<=0&&!(p.pairTimer<=0&&p.hands.every(other=>other.hp>0)))beginAction(p,h,body,player);
      } else if(h.stage==='PAIR_WARN'||h.stage==='PAIR_ACTIVE') {
        const warning=p.pair.kind==='gap'?1.6:1.25,duration=p.pair.kind==='gap'?2.6:1.35;
        const active=p.pair.age>=warning,progress=clamp((p.pair.age-warning)/duration,0,1);
        const goal=pairPose(p,h,body,active?progress:0);
        h.pose=active?goal:blendPose(root,h.index,h.windupPose,goal,ease(p.pair.age/warning));
        if(active&&h.stage==='PAIR_WARN'&&h.index===0)shake(0.24,4);
        h.stage=active?'PAIR_ACTIVE':'PAIR_WARN';
        if(p.pair.kind==='gap'&&active) {h.laser=pairBeam(p,h);h.laserGroundTimer-=dt;if(h.laserGroundTimer<=0){layLaserGround(p,h);h.laserGroundTimer=0.12;}if(laserHits(player,h.laser))damage(1,'ERROR GAP LASER');}
        if(p.pair.kind==='wrap'&&active){
          h.motionTrail.push({pose:h.pose,age:p.age});if(h.motionTrail.length>6)h.motionTrail.shift();
          const tip=claw(h.pose);if(h.pairPrevious)addPool(p,h.pairPrevious,tip,18);h.pairPrevious=tip;
          if(previousPose&&handHits(player,previousPose,h.pose)){kill(h.pose);if(player.hp<=0)return null;}
        }
        if(p.pair.age>=warning+duration){
          const wasWrap=p.pair.kind==='wrap';
          h.stage='RETURN';h.timer=wasWrap?BALANCE.recoverDuration*1.15:BALANCE.recoverDuration;h.returnDuration=h.timer;
          h.returnPose=h.pose;h.uncrossReturn=wasWrap;h.returnWasPair=wasWrap;h.laser=null;h.pairPrevious=null;
        }
      } else if(h.stage==='SCRATCH_WARN') {
        h.pose=blendPose(root,h.index,h.windupPose||h.pose,attackPose(root,h.index,0,h.attackKind,h.aim,h.attackDistance),ease(1-h.timer/BALANCE.swingCharge));
        if(h.timer<=0) {h.stage='SCRATCH';h.timer=attackDuration(h.attackKind);h.previous=claw(h.pose);h.poolPrevious=h.previous;h.previousTips=h.pose.fingers.map(f=>world(h.pose,f.tip.end));h.poolTips=h.previousTips;shake(0.16,3);}
      } else if(h.stage==='SCRATCH') {
        const progress=clamp(1-h.timer/attackDuration(h.attackKind),0,1);
        h.pose=attackPose(root,h.index,progress,h.attackKind,h.aim,h.attackDistance);
        h.motionTrail.push({pose:h.pose,age:p.age});if(h.motionTrail.length>6)h.motionTrail.shift();
        const at=claw(h.pose),tips=h.pose.fingers.map(f=>world(h.pose,f.tip.end));
        if(h.attackKind==='RAKE')for(let digit=0;digit<3;digit++) {
          if(Math.hypot(tips[digit].x-h.poolTips[digit].x,tips[digit].y-h.poolTips[digit].y)>=9||h.timer<=0){addPool(p,h.poolTips[digit],tips[digit],14);h.poolTips[digit]=tips[digit];}
        } else if(Math.hypot(at.x-h.poolPrevious.x,at.y-h.poolPrevious.y)>=9 || h.timer<=0) {addPool(p,h.poolPrevious,at,22);h.poolPrevious=at;}
        const touches=tips.some((tip,i)=>distance(player,h.previousTips[i],tip)<player.hitboxRadius+16);
        if(touches&&h.attackKind!=='THRUST'){kill(h.pose);if(player.hp<=0)return null;}
        h.previous=at;h.previousTips=tips;
        if(h.timer<=0) {
          const wasHook=h.attackKind==='HOOK';
          h.stage='RETURN';h.timer=wasHook?BALANCE.recoverDuration*1.1:BALANCE.recoverDuration;h.returnDuration=h.timer;
          h.returnPose=h.pose;h.uncrossReturn=wasHook;h.returnWasPair=false;
        }
      } else if(h.stage==='LASER_WARN') {
        const u=ease(clamp((BALANCE.laserCharge-h.timer)/(BALANCE.laserCharge-0.45),0,1)),localAim=(h.aim-h.sweepDirection*BALANCE.laserSweep/2)*(h.index?-1:1);
        const ready=fingerPose(mirrored(poseAt(root,{x:root.x-160,y:root.y-150},3.6,localAim,0.04,1,1,1),h.index),'laser',p.age);
        h.pose=blendPose(root,h.index,h.windupPose||h.pose,ready,u);
        if(h.timer<=0) {h.stage='LASER';h.timer=BALANCE.laserDuration;setLaser(h,h.aim-h.sweepDirection*BALANCE.laserSweep/2);layLaserGround(p,h);shake(0.22,3.5);}
      } else if(h.stage==='LASER') {
        const u=clamp(1-h.timer/BALANCE.laserDuration,0,1),desired=h.aim+h.sweepDirection*(-BALANCE.laserSweep/2+BALANCE.laserSweep*ease(u));
        const previous=h.laser?.angle??h.aim-h.sweepDirection*BALANCE.laserSweep/2;
        const angle=previous+clamp(Math.atan2(Math.sin(desired-previous),Math.cos(desired-previous)),-BALANCE.laserTurnRate*dt,BALANCE.laserTurnRate*dt);
        const localAim=angle*(h.index?-1:1),recoil=Math.sin(u*Math.PI)*9+Math.sin(p.age*25)*0.5;
        h.pose=fingerPose(mirrored(poseAt(root,{x:root.x-160+recoil,y:root.y-150+Math.sin(u*Math.PI*2)*4},3.6,localAim,0.02+Math.sin(p.age*5)*0.02,1,1,1),h.index),'laser',p.age);
        setLaser(h,angle);h.laserGroundTimer-=dt;
        if(h.laserGroundTimer<=0) {layLaserGround(p,h);h.laserGroundTimer+=0.12;}
        if(laserHits(player,h.laser))damage(1,'ERROR HAND LASER');
        if(h.timer<=0) {h.laser=null;h.stage='RETURN';h.timer=BALANCE.recoverDuration;h.returnDuration=h.timer;h.returnPose=h.pose;h.uncrossReturn=false;}
      } else if(h.stage==='RETURN') {
        const totalReturn=h.returnDuration||BALANCE.recoverDuration;
        const returnProgress=clamp(1-h.timer/totalReturn,0,1);
        if(h.uncrossReturn) {
          // Uncross the arms first through an open release posture before settling back to idle.
          const uncrossPose=crossHookPose(root,h.index,0.12,h.returnWasPair,h.aim||Math.PI);
          h.pose=returnProgress<0.48
            ? blendPose(root,h.index,h.returnPose||h.pose,uncrossPose,ease(returnProgress/0.48))
            : blendPose(root,h.index,uncrossPose,home,ease((returnProgress-0.48)/0.52));
        } else {
          h.pose=blendPose(root,h.index,h.returnPose||h.pose,home,ease(returnProgress));
        }
        if(h.timer<=0) {h.stage='IDLE';h.timer=1.2+Math.random()*0.7;h.uncrossReturn=false;h.returnWasPair=false;}
      }
      if(previousPose) {
        const contact=armsHit(player,previousPose,h.pose)||handHits(player,previousPose,h.pose);
        if(h.attackKind==='THRUST'&&['SCRATCH_WARN','SCRATCH','RETURN'].includes(h.stage)) {
          if(h.stage==='SCRATCH'&&contact&&!h.stabHit){h.stabHit=true;damage(3,'ERROR HAND STAB');}
        } else if(contact&&h.stage!=='PAIR_WARN'&&h.stage!=='SCRATCH_WARN') {kill(h.pose);if(player.hp<=0)return null;}
      }

    }
    if(p.pair&&p.hands.every(h=>h.stage!=='PAIR_WARN'&&h.stage!=='PAIR_ACTIVE')){p.pair=null;p.pairTimer=22;}
    if(p.age>=p.intro) {
      const r=player.hitboxRadius;
      if(player.x-r<p.left || player.x+r>p.right) {kill();if(player.hp<=0)return null;}
      for(const pool of p.pools)if(distance(player,pool.a,pool.b)<pool.width+r) {corrupt();break;}
      if(!p.pair)p.miniTimer-=dt;
      if(p.miniTimer<=0 && p.minis.length<2) {
        p.minis.push(createEdgeArm(p));
        p.miniTimer=4.8+Math.random()*2;
      }
    }
    for(const m of p.minis) {
      m.age+=dt;
      const previousPose=m.pose,rear=m.edge==='rear';
      const emerge=ease((m.age-1.0)/0.65),withdraw=ease((m.age-3.15)/0.9);
      const extension=emerge*(1-withdraw);
      // Full-length arm emerges from outside the arena / behind the left fog,
      // coils during windup (1.0..1.65s), sweeps broadly with elbow extension (1.65..3.15s),
      // and continues into a follow-through arc while withdrawing (3.15..4.05s).
      const root=rear?{x:p.left-58-(1-extension)*320,y:m.y}:
        {x:m.x,y:m.top?-38-(1-extension)*320:p.height+38+(1-extension)*320};
      const pass=ease((m.age-1.65)/1.5),follow=withdraw;
      const shoulder=Math.PI/2+0.96+emerge*0.22-pass*2.36-follow*0.34;
      const flex=-0.52+emerge*0.12+0.30*Math.sin(Math.PI*pass)+0.14*pass-follow*0.22;
      const wristBend=-0.28+0.54*ease((m.age-1.72)/1.35)-follow*0.18;
      const slashPhase=clamp(pass*0.82+follow*0.18,0,1);
      m.pose=window.ErrorHands.buildHand({root,scale:3.6,arm1Angle:shoulder,arm2Angle:shoulder+flex,wrist:wristBend});
      m.pose.mirror=rear||m.top?1:-1;m.pose=fingerPose(m.pose,'slash',slashPhase);
      if(rear)rotatePose(m.pose,-Math.PI/2);
      m.motionTrail=(m.motionTrail||[]).filter(ghost=>p.age-ghost.age<0.18);
      if(m.age>=1.65&&m.age<=3.35){m.motionTrail.push({pose:m.pose,age:p.age});if(m.motionTrail.length>5)m.motionTrail.shift();}
      const at=claw(m.pose);
      if(m.age>=1.65 && m.age<=3.15) {
        const before=m.previous||at;
        if(!m.poolPrevious)m.poolPrevious=before;
        if(Math.hypot(at.x-m.poolPrevious.x,at.y-m.poolPrevious.y)>=7 || m.age>=3.12) {addPool(p,m.poolPrevious,at,17);m.poolPrevious=at;}
        if(distance(player,before,at)<player.hitboxRadius+17) {kill(m.pose);if(player.hp<=0)return null;}
      }
      if(m.age>=1&&previousPose&&(armsHit(player,previousPose,m.pose)||handHits(player,previousPose,m.pose))) {kill(m.pose);if(player.hp<=0)return null;}
      m.previous=at;
    }
    p.minis=p.minis.filter(m=>m.age<4.05);
    if(p.hands.every(h=>h.hp<=0)) {p.ending=0.001;p.pools=[];p.minis=[];shake(0.45,5);return 'DELETING';}
    return null;
  }
  function hit(p,h,damage) {
    if(p.age<p.intro || p.ending || p.capture || h.hp<=0)return false;
    h.hp=Math.max(0,h.hp-damage);h.flash=0.1;
    if(h.hp===0) {h.laser=null;h.stage='DOWN';}
    return true;
  }
  function drawPath(ctx,a,b,width,color,alpha=1) {
    ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  function renderEdges(p,ctx,images,minis,vanish) {
    const t=p.age;
    for(const m of minis) {
      const rear=m.edge==='rear',opening=ease((m.age-0.55)/0.6)*(1-ease((m.age-3.5)/0.55));
      const lip=rear?p.left-18:m.top?58:p.height-18;
      if(opening>0)for(let n=0;n<14;n++) {
        const seed=n*13+Math.floor(t*12),across=(noise(n+4)-0.5)*78*opening,depth=(noise(n+7)-0.5)*24;
        const x=rear?lip+depth:m.x+across,y=rear?m.y+across:lip+depth;
        ctx.globalAlpha=opening*0.85;ctx.fillStyle='#010104';ctx.fillRect(x,y,8+n%4*7,5+n%3*4);
        if(noise(seed)>0.45){ctx.globalAlpha=opening*0.65;ctx.fillStyle=n%2?'#00eeff':'#ff55b5';ctx.fillRect(x-3,y+2,6+n%3*5,2);}
      }
      ctx.globalAlpha=vanish;
      if(m.age<1) {
        const half=(m.span??310)/2;
        if(rear)drawPath(ctx,{x:p.left+6,y:m.y-half},{x:p.left+6,y:m.y+half},8,'#ff55b5',0.4);
        else drawPath(ctx,{x:m.x-half,y:m.top?62:p.height-35},{x:m.x+half,y:m.top?62:p.height-35},8,'#ff55b5',0.4);
      }
      else if(m.pose&&p.capture?.owner!==m) {
        for(const ghost of m.motionTrail||[]){ctx.globalAlpha=Math.max(0,0.14*(1-(t-ghost.age)/0.18));window.ErrorHands.drawHand(ctx,images,ghost.pose,{time:t});}
        ctx.globalAlpha=p.capture?0.25:1;window.ErrorHands.drawHand(ctx,images,m.pose,{time:t});
      }
    }
  }
  function render(p,ctx,images,body,{debugRanges=false,debugBossRange=false,laserModel=null,capturedPlayer=null}={}) {
    const t=p.age,vanish=p.ending?1-ease(p.ending/1.4):1;
    ctx.save();ctx.imageSmoothingEnabled=false;
    for(const floor of p.pools) {
      const fade=Math.min(1,floor.life/0.8)*ease(floor.age/0.18),length=Math.hypot(floor.targetB.x-floor.a.x,floor.targetB.y-floor.a.y);
      const count=Math.min(24,Math.max(3,Math.ceil(length/13))),tick=Math.floor(t*12);
      // Jagged black tile islands, with stable geometry and flickering channel tears.
      for(let i=0;i<=count;i++) {
        const q=lerp(floor.a,floor.targetB,i/count),seed=floor.seed*29+i*7;
        if(i/count>ease(floor.age/0.25))continue;
        const growth=ease((floor.age-noise(seed+10)*0.1-i/count*0.2)/0.25);
        if(growth<=0)continue;
        const w=Math.max(1,Math.round((10+Math.floor(noise(seed)*16))*growth)),h=Math.max(1,Math.round((10+Math.floor(noise(seed+1)*18))*growth));
        const x=Math.round(q.x-w/2+(noise(seed+2)-0.5)*floor.width);
        const y=Math.round(q.y-h/2+(noise(seed+3)-0.5)*floor.width);
        ctx.globalAlpha=fade*0.9;ctx.fillStyle='#010105';ctx.fillRect(x,y,w,h);
        ctx.globalAlpha=fade*0.5;ctx.fillStyle='#160d24';ctx.fillRect(x+3,y+4,Math.max(3,w-7),Math.max(3,h-8));
        const flicker=noise(seed+tick*0.37);
        if(flicker>0.15) {
          ctx.globalAlpha=fade*growth*(0.45+flicker*0.5);ctx.fillStyle=(i+tick)%2?'#ff55b5':'#00eeff';
          ctx.fillRect(x+(flicker>0.75?-5:w-2),y+Math.floor(noise(seed+4)*h),7+Math.floor(noise(seed+5)*16),2);
          if(flicker>0.55){ctx.fillStyle=(i+tick)%2?'#00eeff':'#ff55b5';ctx.globalAlpha=fade*0.65;ctx.fillRect(x-4,y+h-3,5+Math.floor(noise(seed+8)*11),1);}
        }
        if(flicker>0.8) {ctx.fillStyle='#08040c';ctx.globalAlpha=fade;ctx.fillRect(x-4,y+3,w+9,4);}
      }
    }
    ctx.globalAlpha=vanish;
    renderEdges(p,ctx,images,p.minis.filter(m=>m.edge==='rear'),vanish);
    if(vanish>0) {
      const grow=ease((t-0.9)/3.8),W=p.width,H=p.height;
      // Black glitch fog replaces the arm crowd; the mathematical boundary
      // stays fixed even while the texture inside it drifts and breaks up.
      for(const side of [-1,1]) {
        const boundary=side<0?p.left:p.right;
        const region=side<0?p.left:W-p.right;
        // Use the gradient toward the interior of each dangerous edge zone.
        const shade=ctx.createLinearGradient(boundary,0,side<0?0:W,0);
        if(shade?.addColorStop) {shade.addColorStop(0,'rgba(1,1,4,0.15)');shade.addColorStop(0.16,'rgba(1,1,4,0.94)');shade.addColorStop(1,'#010104');}
        ctx.fillStyle=shade||'#010104';ctx.globalAlpha=grow*vanish;
        ctx.fillRect(side<0?0:boundary,54,region,H-54);
        // Drifting pixel-smoke cells break up the veil into cloudy black masses.
        for(let n=0;n<72;n++) {
          const tick=Math.floor(t*10),depth=noise(n*3+side*17),flow=(n*37+t*(4+n%4))%(H-60);
          const w=12+Math.floor(noise(n+9)*28),h=10+Math.floor(noise(n+11)*25);
          const x=side<0?boundary-depth*region-w:boundary+depth*region;
          const y=54+flow;
          ctx.globalAlpha=grow*vanish*(0.12+noise(n+4)*0.35);ctx.fillStyle=n%3?'#020107':'#100a19';
          ctx.fillRect(Math.max(0,x),y,Math.min(w,W-Math.max(0,x)),h);
          if(noise(n*7+tick)>0.7) {
            const gx=clamp(x+Math.sin(t*3+n)*10,side<0?0:boundary,side<0?boundary-10:W-10);
            ctx.globalAlpha=grow*vanish*(0.25+noise(n+tick)*0.4);ctx.fillStyle=(n+tick)%2?'#ff55b5':'#00eeff';
            ctx.fillRect(gx,y+4,5+Math.floor(noise(n+18)*14),2);
            ctx.globalAlpha=grow*vanish*0.7;ctx.fillStyle='#010104';ctx.fillRect(gx-3,y+9,17,4);
          }
        }
        if(debugRanges)drawPath(ctx,{x:boundary,y:54},{x:boundary,y:H},2,'#ff489b',0.8);
      }
      ctx.globalAlpha=1;
      if(t<p.intro) {ctx.fillStyle='#ffb0dd';ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText('검은 안개 접촉 시 즉사 · 중앙으로 이동', (p.left+p.right)/2,160);}
    }
    if(debugRanges)drawPath(ctx,{x:p.playerMaxRight,y:54},{x:p.playerMaxRight,y:p.height},2,'#ffca72',0.8);
    if(debugBossRange) {const r=p.bossBounds;ctx.globalAlpha=0.7;ctx.strokeStyle='#ffd572';ctx.lineWidth=1;ctx.setLineDash([6,5]);ctx.strokeRect(r.left,r.top,r.right-r.left,r.bottom-r.top);ctx.setLineDash([]);}
    const crossingActive=p.pair?.kind==='wrap'||p.hands.some(h=>h.attackKind==='HOOK'&&['SCRATCH_WARN','SCRATCH'].includes(h.stage)||h.uncrossReturn);
    const orderedHands=[...p.hands].sort((a,b)=>{
      const rank=h=>{
        if(p.pair?.kind==='wrap')return h.index===1?1:0;
        if(h.attackKind==='HOOK'&&['SCRATCH_WARN','SCRATCH'].includes(h.stage))return 2+h.index;
        if(h.uncrossReturn)return h.index===1?1:0;
        return h.index;
      };
      return rank(a)-rank(b);
    });
    orderedHands.forEach((h,layerOrder)=>{
      if(!h.pose || h.hp<=0&&h.downAge>0.6 || p.capture?.owner===h)return;
      const baseAlpha=vanish*(p.capture?0.25:1)*(h.hp<=0?Math.max(0,1-h.downAge/0.6):1);
      const depthShade=crossingActive&&layerOrder===0?0.9:1;
      for(const ghost of h.motionTrail||[]) {ctx.globalAlpha=Math.max(0,0.2*(1-(t-ghost.age)/0.16))*baseAlpha*depthShade;window.ErrorHands.drawHand(ctx,images,ghost.pose,{time:t});}
      ctx.globalAlpha=baseAlpha*depthShade;
      window.ErrorHands.drawHand(ctx,images,h.pose,{time:t,joints:false});
      const a=palm(h.pose);
      if(h.stage==='SCRATCH_WARN') {
        const charge=clamp(1-h.timer/BALANCE.swingCharge,0,1);
        for(const progress of [0.25,0.6,1]) {
          const future=attackPose(h.pose.root,h.index,progress,h.attackKind,h.aim,h.attackDistance);
          ctx.globalAlpha=(0.035+ease(charge)*0.075)*vanish;
          window.ErrorHands.drawHand(ctx,images,future,{time:t});
        }
      }
      if(h.stage==='PAIR_WARN'&&p.pair?.kind==='gap'&&laserModel)laserModel({...pairBeam(p,h),stage:1,time:t});
      if(h.stage==='LASER_WARN') {
        const angle=h.pose.facing*(h.pose.mirror||1);
        if(laserModel)laserModel({a,b:{x:a.x+Math.cos(angle)*BALANCE.laserLength,y:a.y+Math.sin(angle)*BALANCE.laserLength},angle,stage:h.timer>BALANCE.laserCharge/2?1:2,time:t});
      }
      if(h.laser) {
        const {a,b,halfWidth}=h.laser,dx=Math.cos(h.laser.angle),dy=Math.sin(h.laser.angle),nx=-dy,ny=dx;
        if(laserModel)laserModel({...h.laser,stage:3,time:t});
        const haze=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,55);
        if(haze?.addColorStop) {haze.addColorStop(0,'rgba(115,225,255,0.32)');haze.addColorStop(0.55,'rgba(65,190,255,0.14)');haze.addColorStop(1,'rgba(65,190,255,0)');ctx.globalAlpha=1;ctx.fillStyle=haze;ctx.fillRect(b.x-55,b.y-55,110,110);}
        for(let n=0;n<48;n++) {
          const tick=Math.floor(t*24),along=(noise(n*3+tick)-0.35)*85,across=(noise(n*7+tick)-0.5)*(halfWidth*2+25);
          ctx.fillStyle=['#88e7ff','#52caff','#c8f6ff','#329fff'][n%4];ctx.globalAlpha=0.5+noise(n+tick)*0.48;
          ctx.fillRect(b.x+dx*along+nx*across,b.y+dy*along+ny*across,5+n%4*3,2+n%3);
        }
      }
    });
    ctx.globalAlpha=vanish;
    renderEdges(p,ctx,images,p.minis.filter(m=>m.edge!=='rear'),vanish);
    if(p.capture) {
      const c=p.capture;ctx.save();if(c.owner?.edge==='rear'){ctx.beginPath();ctx.rect(p.left,54,p.right-p.left,p.height-54);ctx.clip();}ctx.globalAlpha=1;window.ErrorHands.drawHand(ctx,images,c.pose,{time:t+c.age,layer:'rear'});
      if(capturedPlayer)capturedPlayer(c);
      window.ErrorHands.drawHand(ctx,images,c.pose,{time:t+c.age,layer:'front'});
      if(c.age>=0.68&&c.age<1.38) {
        const strain=Math.sin(Math.PI*clamp((c.age-0.68)/0.7,0,1));
        for(let n=0;n<10;n++) {
          const ang=n*0.63+Math.floor(c.age*30)*0.9,dist=10+(n%3)*7;
          ctx.fillStyle=n%2?'#00eeff':'#ff55b5';ctx.globalAlpha=strain*0.72;
          ctx.fillRect(c.playerPos.x+Math.cos(ang)*dist-2,c.playerPos.y+Math.sin(ang)*dist-1,4+(n%2)*3,2);
        }
      }
      if(c.burst)for(let n=0;n<24;n++){const age=Math.max(0,c.age-0.96);ctx.fillStyle=n%2?'#00eeff':'#ff55b5';ctx.globalAlpha=Math.max(0,1-age*1.45);ctx.fillRect(c.playerPos.x+Math.cos(n*2.4)*age*78,c.playerPos.y+Math.sin(n*2.4)*age*66,4+n%3*2,2);}
    }
    if(p.capture)ctx.restore();
    if(p.ending) {
      for(let i=0;i<24;i++) {
        ctx.globalAlpha=vanish;ctx.fillStyle=i%2?'#ff55b5':'#00eeff';
        ctx.fillRect(body.x+Math.sin(i*17+t*30)*65,body.y+Math.cos(i*9+t*16)*50,8+i%5*5,3);
      }
    }
    ctx.restore();
  }
  window.ErrorPhase3={BALANCE,create,update,hit,render,poseAt,palm,distance,addPool,swingPose,crossHookPose,handCavity,armsHit,laserHits,previewAttack,fingerPose,beginCapture,updateCapture,createEdgeArm,rotatePose,attackPose,attackDuration,MELEE_KINDS,handHits,startPair,pairPose,pairBeam};
})();
