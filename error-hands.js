(() => {
  'use strict';
  const ROOT='bosses/Tier_12/Hands/';
  // Atlas rectangles and pivots are measured from the untouched uploaded PNGs.
  const PARTS={
    arm1:{file:ROOT+'Part1_Arm.png',rect:[12,9,8,38],root:[5,37],end:[1,0]},
    arm2:{file:ROOT+'Part2_Arm.png',rect:[11,12,9,39],root:[6,38],end:[4,0]},
    palm:{file:ROOT+'Hands.png',rect:[12,46,7,8],root:[4,7],end:[3.5,0]},
    thumbBase:{file:ROOT+'Hands.png',rect:[16,5,10,5],root:[9,2],end:[0,1]},
    thumbTip:{file:ROOT+'Hands.png',rect:[4,5,8,8],root:[7,1],end:[0,7]},
    fingerBase:{file:ROOT+'Hands.png',rect:[19,23,4,16],root:[2,15],end:[1.5,0]},
    fingerTip:{file:ROOT+'Hands.png',rect:[7,17,4,22],root:[1.5,21],end:[2,0]}
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const point=(p,angle,length)=>({x:p.x+Math.cos(angle)*length,y:p.y+Math.sin(angle)*length});
  const textureCaches=new WeakMap();

  function link(partName,start,angle,scale,stretchX=1,stretchY=1) {
    const part=PARTS[partName];
    const vx=(part.end[0]-part.root[0])*stretchX,vy=(part.end[1]-part.root[1])*stretchY;
    return {part:partName,start:{...start},end:point(start,angle,Math.hypot(vx,vy)*scale),
      rotation:angle-Math.atan2(vy,vx),scale,stretchX,stretchY};
  }
  function localPoint(origin,angle,x,y,scale) {
    return {x:origin.x+(Math.cos(angle)*x-Math.sin(angle)*y)*scale,
      y:origin.y+(Math.sin(angle)*x+Math.cos(angle)*y)*scale};
  }
  function buildHand(options={}) {
    const scale=options.scale||5,root=options.root||{x:1140,y:180},curl=clamp(options.curl||0,0,1);
    const elbow=clamp(options.elbow??0.5,0,1),wristAngle=options.wrist||0;
    const reach=options.reach||[1,1],hs=scale*(options.handSize??1);
    const arm1=link('arm1',root,options.arm1Angle??Math.PI+1.22+elbow*0.12,scale,1,reach[0]*1.2);
    const forearmAngle=options.arm2Angle??Math.PI-0.6-elbow*0.1;
    const arm2=link('arm2',arm1.end,forearmAngle,scale,1,reach[1]);
    const facing=forearmAngle+0.22+wristAngle,handRotation=facing+Math.PI/2;
    // A three-quarter side view: foreshorten the palm across its width, then
    // overlap the far fingers rather than fanning all three toward the viewer.
    const palm=link('palm',arm2.end,facing,hs,1.3,1.3);
    const fingers=[];
    for(let i=0;i<3;i++) {
      const start=localPoint(arm2.end,handRotation,(i-1)*(options.fingerSpacing??2.3),-7.8+i*0.7,hs);
      const fingerCurl=clamp(options.fingerCurls?.[i]??curl,0,1);
      const bend=clamp(fingerCurl*(1+0.025*(i-1)),0,1),spread=(i-1)*(options.fingerSpread??0.035)*(1-fingerCurl);
      const depthScale=hs*(0.92+i*0.04);
      const baseForeshorten=1-(1-(options.fingerForeshorten??1))*0.58;
      const tipForeshorten=options.fingerForeshorten??1;
      const base=link('fingerBase',start,facing+(options.fingerAngles?.[i]?.base??(spread+0.45-bend*0.8)),depthScale,1,baseForeshorten);
      const tip=link('fingerTip',base.end,facing+(options.fingerAngles?.[i]?.tip??(spread-0.45-bend*2.3)),depthScale,1,tipForeshorten);
      fingers.push({base,tip});
    }
    // The thumb emerges from the heel on the opposing side of the fingers,
    // opening below them and curling back toward their pads.
    const thumbRoot=localPoint(arm2.end,handRotation,-3.2,-2.8,hs);
    const thumbCurl=clamp(options.thumbCurl??curl,0,1);
    const thumbBase=link('thumbBase',thumbRoot,facing+(options.thumbAngles?.base??(-0.65+thumbCurl*0.5)),hs);
    const thumbTip=link('thumbTip',thumbBase.end,facing+(options.thumbAngles?.tip??(-0.12+thumbCurl*0.9)),hs,1,options.thumbForeshorten??1);
    return {root:{...root},mirror:options.mirror||1,arm1,arm2,palm,fingers,thumb:{base:thumbBase,tip:thumbTip},
      fingerForeshorten:options.fingerForeshorten??1,thumbForeshorten:options.thumbForeshorten??1,pieces:[arm1,arm2,...fingers.flatMap(f=>[f.base,f.tip]),palm,thumbBase,thumbTip],curl,facing,fingerAngles:fingers.map(f=>({base:Math.atan2(f.base.end.y-f.base.start.y,f.base.end.x-f.base.start.x)-facing,tip:Math.atan2(f.tip.end.y-f.tip.start.y,f.tip.end.x-f.tip.start.x)-facing})),thumbAngles:{base:Math.atan2(thumbBase.end.y-thumbBase.start.y,thumbBase.end.x-thumbBase.start.x)-facing,tip:Math.atan2(thumbTip.end.y-thumbTip.start.y,thumbTip.end.x-thumbTip.start.x)-facing},fingerSpacing:options.fingerSpacing??2.3,fingerSpread:options.fingerSpread??0.035};
  }

  function getTexture(images,name,color) {
    const part=PARTS[name],source=images.get(part.file);if(!source)return null;
    let cache=textureCaches.get(source);if(!cache) {cache=new Map();textureCaches.set(source,cache);}
    const key=name+'|'+color;if(cache.has(key))return cache.get(key);
    const [sx,sy,w,h]=part.rect,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const p=canvas.getContext('2d');p.imageSmoothingEnabled=false;
    p.drawImage(source,sx,sy,w,h,0,0,w,h);
    if(color!=='original') {p.globalCompositeOperation='source-in';p.fillStyle=color;p.fillRect(0,0,w,h);}
    cache.set(key,canvas);return canvas;
  }
  function drawPiece(ctx,images,piece,time,style,index) {
    const part=PARTS[piece.part],[,,w,h]=part.rect,sx=piece.scale*piece.stretchX,sy=piece.scale*piece.stretchY;
    const opacity=typeof ctx.globalAlpha==='number'?ctx.globalAlpha:1;
    ctx.save();ctx.translate(piece.start.x,piece.start.y);ctx.rotate(piece.rotation);ctx.imageSmoothingEnabled=false;
    const rect=[-part.root[0]*sx,-part.root[1]*sy,w*sx,h*sy];
    if(style!=='original') {
      const shift=(Math.sin(Math.floor(time*11)+index*13)>0.5?0.8:0.35)*piece.scale;
      ctx.globalAlpha=opacity*0.46;
      const cyan=getTexture(images,piece.part,'#00eeff'),pink=getTexture(images,piece.part,'#ff55b5');
      if(cyan)ctx.drawImage(cyan,rect[0]-shift,rect[1]-shift*0.45,rect[2],rect[3]);
      if(pink)ctx.drawImage(pink,rect[0]+shift,rect[1]+shift*0.45,rect[2],rect[3]);
    }
    ctx.globalAlpha=opacity;const texture=getTexture(images,piece.part,'original');
    if(texture)ctx.drawImage(texture,...rect);ctx.restore();
  }
  function drawHand(ctx,images,pose,{time=0,style='error',joints=false,layer='all'}={}) {
    ctx.save();
    if(pose.mirror<0) {ctx.translate(0,pose.root.y*2);ctx.scale(1,-1);}
    const pieces=layer==='rear'
      ? [pose.arm1,pose.arm2,pose.palm,pose.fingers[0].base,pose.fingers[0].tip,pose.thumb.base]
      : layer==='front'
        ? [pose.fingers[1].base,pose.fingers[1].tip,pose.fingers[2].base,pose.fingers[2].tip,pose.thumb.tip]
        : pose.pieces;
    if(layer!=='front') {
      // Fill the shared joint from behind with the same flat black silhouette.
      // The uploaded strips taper at their ends; without this overlap the
      // elbow appears disconnected whenever the two strips rotate apart.
      const opacity=typeof ctx.globalAlpha==='number'?ctx.globalAlpha:1;
      for(const [joint,size] of [[pose.arm1.end,3.2],[pose.arm2.end,2.6]]) {
        const r=Math.round(size*pose.arm1.scale),x=Math.round(joint.x),y=Math.round(joint.y);
        ctx.fillStyle='#000000';ctx.globalAlpha=opacity;
        ctx.fillRect(x-r,y-r+3,r*2,r*2-6);ctx.fillRect(x-r+3,y-r,r*2-6,r*2);
        if(style!=='original') {
          ctx.globalAlpha=opacity*0.35;ctx.fillStyle='#00eeff';ctx.fillRect(x-r,y-2,3,4);
          ctx.fillStyle='#ff55b5';ctx.fillRect(x+r-2,y+1,3,3);
        }
      }
      ctx.globalAlpha=opacity;
    }
    pieces.forEach((piece,i)=>drawPiece(ctx,images,piece,time,style,i));
    if(joints) {
      ctx.strokeStyle='#ffc76c';ctx.lineWidth=1;
      const points=[pose.root,pose.arm1.end,pose.arm2.end,...pose.fingers.map(f=>f.base.end),pose.thumb.base.end];
      for(const p of points) {ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.stroke();}
    }
    ctx.restore();
  }
  function renderPair(ctx,images,{time=0,width=1284,height=724,curl=null,elbow=null,wrist=null,style='error',joints=false,scale=3.6}={}) {
    // Idle fidgeting stays partly open; each digit has its own small rhythm.
    const bend=curl??(0.24+Math.sin(time*0.83)*0.035);
    const poses=[1,-1].map((mirror,i)=>buildHand({root:{x:width-90,y:height/2+mirror*-50},scale,mirror,
      curl:bend,
      fingerCurls:curl===null?[0,1,2].map(f=>0.24+Math.sin(time*(1.35+f*0.23)+f*1.9+i*1.3)*0.085+Math.sin(time*2.7+f*2.4+i)*0.025):null,
      thumbCurl:curl===null?0.18+Math.sin(time*1.1+i*1.8)*0.055:curl,
      elbow:elbow??0.5+Math.sin(time*0.6+i*0.4)*0.18,
      wrist:(wrist??0)+(curl===null?Math.sin(time*0.95+i*1.2)*0.19+Math.sin(time*1.8+i)*0.045:0)}));
    poses.forEach(p=>drawHand(ctx,images,p,{time,style,joints}));return poses;
  }
  const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  function buildEmergenceHand(time,index,{width=1284,height=724}={}) {
    const body={x:width-90,y:height/2},t=time-index*0.3,mirror=index===0?1:-1,scale=3.6;
    const hand=smooth((t-0.4)/0.55),grip=smooth((t-0.95)/0.4);
    // Fingers brace against the hull while the elbow pushes outward. Only
    // after both arm links clear the body does the wrist leave that foothold.
    const extraction=smooth((t-1.4)/1.1)*0.65+smooth((t-2.85)/0.8)*0.35;
    const release=smooth((t-3.8)/1.0),idle=smooth((t-4.8)/0.8);
    const root={x:body.x-5,y:body.y-mirror*10};
    const wrist={x:body.x-10-hand*24-release*110,
      y:root.y-hand*6-release*74+Math.sin(time*0.95+index)*6*idle};
    const exposed=0.12+0.88*extraction;
    const l1=Math.hypot(4,37*1.2*exposed)*scale,l2=Math.hypot(2,38*exposed)*scale;
    const dx=wrist.x-root.x,dy=wrist.y-root.y;
    // During the first hidden frames, keep the IK target reachable inside
    // the hull; it becomes the exact planted wrist before the grip closes.
    const rawDistance=Math.hypot(dx,dy),d=clamp(rawDistance,Math.abs(l1-l2)+0.001,l1+l2-0.001);
    const ux=dx/rawDistance,uy=dy/rawDistance;
    const target={x:root.x+ux*d,y:root.y+uy*d};
    const along=(l1*l1-l2*l2+d*d)/(2*d),elbowHeight=Math.sqrt(Math.max(0,l1*l1-along*along));
    const elbow={x:root.x+ux*along-uy*elbowHeight,y:root.y+uy*along+ux*elbowHeight};
    const a1=Math.atan2(elbow.y-root.y,elbow.x-root.x),a2=Math.atan2(target.y-elbow.y,target.x-elbow.x);
    const curl=0.12+grip*0.7-release*0.58;
    const pose=buildHand({root,mirror,scale,reach:[exposed,exposed],arm1Angle:a1,arm2Angle:a2,
      wrist:Math.PI-a2-0.22+0.5*(1-release)+Math.sin(time*0.95+index*1.2)*0.19*idle,
      curl,fingerCurls:[0,1,2].map(f=>curl+Math.sin(time*(1.35+f*0.23)+f*1.9+index)*0.085*idle),
      thumbCurl:0.15+grip*0.45-release*0.42});
    return {...pose,visible:hand>0,grip,extraction,release};
  }
  function renderEmergence(ctx,images,{time=0,width=1284,height=724,style='error',joints=false}={}) {
    const body={x:width-90,y:height/2},strain=1-smooth((time-4.4)/0.8);
    const shake=time<5.2?Math.sin(time*71)*strain*3:0;
    ctx.save();ctx.translate(shake,Math.cos(time*59)*strain*1.5);
    for(let i=0;i<2;i++) {
      const pose=buildEmergenceHand(time,i,{width,height});
      if(pose.visible)drawHand(ctx,images,pose,{time,style,joints});
    }
    // Draw the small source body last: the roots stay buried inside it.
    const image=images.get('bosses/Tier_12/Boss.png');
    ctx.save();ctx.translate(body.x,body.y);ctx.rotate(-Math.PI/2);ctx.imageSmoothingEnabled=false;
    if(image)ctx.drawImage(image,-32,-32,64,64);
    ctx.restore();
    if(time>0.35&&time<3.4&&style!=='original') {
      const intensity=Math.sin(Math.PI*clamp((time-0.35)/3.05,0,1));
      for(let n=0;n<9;n++) {
        const seed=Math.floor(time*14)+n*17;
        ctx.fillStyle=n%2?'#ff55b5':'#00eeff';ctx.globalAlpha=intensity*0.65;
        ctx.fillRect(body.x-42+Math.sin(seed*3.1)*35,body.y+Math.sin(seed*1.7)*45,8+(n%4)*7,2+(n%2));
      }
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }
  window.ErrorHands={PARTS,buildHand,drawHand,renderPair,buildEmergenceHand,renderEmergence};
})();
