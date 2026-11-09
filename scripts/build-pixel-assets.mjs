// Compile code-native pixel sprites from the user's exact pixel grid, without resampling.
// Also extract model palettes and build a dedicated, identically sized bar per boss.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = p => path.join(root, 'assets', p);
function decode(file) {
  const b=fs.readFileSync(file);let w,h,type,depth;const chunks=[];
  for(let i=8;i<b.length;) {const n=b.readUInt32BE(i),tag=b.toString('ascii',i+4,i+8),d=b.subarray(i+8,i+8+n);
    if(tag==='IHDR') {w=d.readUInt32BE(0);h=d.readUInt32BE(4);depth=d[8];type=d[9];}
    if(tag==='IDAT') chunks.push(d);i+=n+12;
  }
  if(depth!==8 || ![6,2].includes(type)) throw Error(`Expected RGB(A)8 PNG: ${file}`);
  const channels=type===6?4:3,stride=w*channels,raw=zlib.inflateSync(Buffer.concat(chunks)),out=Buffer.alloc(w*h*4);let prev=Buffer.alloc(stride),pos=0;
  const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
  for(let y=0;y<h;y++){const filter=raw[pos++],row=Buffer.alloc(stride);
    for(let x=0;x<stride;x++){const a=x>=channels?row[x-channels]:0,b=prev[x],c=x>=channels?prev[x-channels]:0;
      row[x]=(raw[pos++]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}
    for(let x=0;x<w;x++){const j=(y*w+x)*4;row.copy(out,j,x*channels,x*channels+3);out[j+3]=channels===4?row[x*channels+3]:255;}prev=row;
  }return {w,h,data:out};
}
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function png(img){const chunk=(tag,d)=>{const t=Buffer.from(tag),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(d.length);c.writeUInt32BE(crc(Buffer.concat([t,d])));return Buffer.concat([n,t,d,c]);};
  const hdr=Buffer.alloc(13);hdr.writeUInt32BE(img.w);hdr.writeUInt32BE(img.h,4);hdr[8]=8;hdr[9]=6;
  const rows=[];for(let y=0;y<img.h;y++)rows.push(Buffer.from([0]),img.data.subarray(y*img.w*4,(y+1)*img.w*4));
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('IDAT',zlib.deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]);
}
const rgb=hex=>hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));
const hex=p=>'#'+p.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
const image=(w,h)=>({w,h,data:Buffer.alloc(w*h*4)});
function pixel(im,x,y,c){if(x<0||y<0||x>=im.w||y>=im.h)return;im.data.set([...c,255],(y*im.w+x)*4);}
function rect(im,x,y,w,h,c){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixel(im,xx,yy,c);}
function save(rel,im){fs.mkdirSync(path.dirname(at(rel)),{recursive:true});fs.writeFileSync(at(rel),png(im));}
const COLORS={Red:'#ed1c24',Orange:'#ff7e00',Yellow:'#fff200',Lime:'#a8e61d',Cyan:'#00eeff',Blue:'#0033ff',Violet:'#9900ff',Pink:'#ff55b5'};
// Compact neon pixel grid: 5×5 round, 3×9 upright needle stored facing right.
for(const [name,color] of Object.entries(COLORS)) {
  const base=rgb(color),light=mix(base,[255,255,255],0.65),white=[245,255,255];
  const orb=image(5,5);
  for(let y=0;y<5;y++)for(let x=0;x<5;x++) {
    if((x===0||x===4)&&(y===0||y===4))continue;
    pixel(orb,x,y,x===2&&y===2?white:x>0&&x<4&&y>0&&y<4?light:base);
  }
  save(`bullets/Colors/${name}/Orb.png`,orb);
  const needle=image(9,3);
  for(let x=0;x<9;x++)for(let y=0;y<3;y++)pixel(needle,x,y,y===1?(x>=2&&x<=6?white:light):base);
  save(`bullets/Colors/${name}/Needle.png`,needle);
}
// One thin red pixel rim follows the meteor's opaque silhouette.
const meteor=decode(at('extras/Single_Sprite.png')),outlined=image(meteor.w+4,meteor.h+4);
for(let y=0;y<meteor.h;y++)for(let x=0;x<meteor.w;x++)if(meteor.data[(y*meteor.w+x)*4+3]) {
  for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)pixel(outlined,x+2+xx,y+2+yy,[255,65,82]);
}
for(let y=0;y<meteor.h;y++)for(let x=0;x<meteor.w;x++){const i=(y*meteor.w+x)*4;if(meteor.data[i+3])meteor.data.copy(outlined.data,((y+2)*outlined.w+x+2)*4,i,i+4);}
save('extras/Meteor_Outlined.png',outlined);
// Seven-pixel space cargo crate: armored corners, gold lid, cyan sealed core.
const crate=image(7,7),palette={N:[25,42,66],B:[69,102,143],G:[255,197,56],L:[255,244,171],C:[86,241,255]};
[' NGGGN ','NGLGLGN','GBNNNBG','GBC CBG','GBNCNBG','NBGGGBN',' NBBBN '].forEach((row,y)=>[...row].forEach((c,x)=>{if(palette[c])pixel(crate,x,y,palette[c]);}));
pixel(crate,3,3,[225,255,255]);save('pickups/Space_Supply.png',crate);
// Extract every opaque model color, including neutral armor, for an inspectable palette catalog.
const files=[];
function scan(dir){for(const e of fs.readdirSync(at(dir),{withFileTypes:true})){const rel=`${dir}/${e.name}`;if(e.isDirectory())scan(rel);else if(e.name.endsWith('.png'))files.push(rel);}}
for(const dir of ['enemies','player','bosses'])if(fs.existsSync(at(dir)))scan(dir);
const catalog={};
for(const file of files){const im=decode(at(file)),counts={};for(let i=0;i<im.data.length;i+=4)if(im.data[i+3]){const key=hex([...im.data.subarray(i,i+3)]);counts[key]=(counts[key]||0)+1;}
  catalog[file]=Object.fromEntries(Object.entries(counts).sort((a,b)=>b[1]-a[1]));}
const stageOrder=[1,2,3,4,5,10,6,7,11,9,8,12],bars=[];
const bossDefinitions=Array.from({length:10},(_,i)=>{const t=i+1,id=`Tier_${String(t).padStart(2,'0')}`;return {t,id,model:`bosses/${id}/Boss.png`};});
bossDefinitions.push({t:12,id:'Tier_12',model:'bosses/Tier_12/Boss.png'});
bossDefinitions.push({t:11,id:'Chain_Boss',model:'bosses/Chain_Boss/Parts/Head_And_Saws.png'});
for(const {t,id,model} of bossDefinitions){
  const vivid=Object.keys(catalog[model]).filter(c=>{const a=rgb(c);return Math.max(...a)-Math.min(...a)>50;});
  if(!vivid.length)throw Error(`Choose a boss accent for ${model}`);
  const base=rgb(vivid[0]),secondary=rgb(vivid[1]||vivid[0]),bright=mix(base,[255,255,255],0.6),dark=mix(base,[4,8,20],0.78);
  // Preserve the existing bar's outline, BOSS lettering, segmented fill and alpha mask.
  // Only add decoration in transparent space; new bosses tint the original frame accents.
  const templateId=t<=8?id:'Tier_01',layers={};
  for(const part of ['Frame','Fill','Empty','Full']) {
    const im=decode(at(`ui/boss_bars/templates/${templateId}_${part}.png`));
    if(t>8 && part!=='Fill') for(let i=0;i<im.data.length;i+=4) {
      if(!im.data[i+3])continue;
      const p=[...im.data.subarray(i,i+3)];
      if(Math.max(...p)-Math.min(...p)>25) {
        const tint=mix(base,[255,255,255],Math.max(...p)/255*0.45);
        im.data.set(tint,i);
      }
    }
    layers[part]=im;
  }
  for(const im of [layers.Frame,layers.Full]) {
    const add=(x,y,c)=>{if(!im.data[(y*64+x)*4+3])pixel(im,x,y,c);};
    if(t===12) {
      // Split data brackets and displaced pixels only in the original frame's transparent margin.
      for(const [cx,c] of [[11,[255,85,181]],[52,[0,238,255]]]) {
        for(const [dx,dy] of [[-3,-2],[-3,-1],[-3,0],[-2,2],[0,2],[2,1],[3,1]])add(cx+dx,6+dy,c);
      }
    } else if(t===11) {
      for(const cx of [12,51])for(const [dx,dy] of [[-3,0],[-2,-1],[-1,-2],[0,-3],[1,-2],[2,-1],[3,0]])add(cx+dx,7+dy,dy<-1?bright:base);
    } else if(t===10) {
      // Two small EMP rings, away from the unchanged BOSS lettering and health strip.
      for(const cx of [12,51])for(const [dx,dy] of [[-1,-2],[0,-2],[1,-2],[-2,-1],[2,-1],[-2,0],[2,0],[-1,1],[0,1],[1,1]])add(cx+dx,6+dy,dy<0?bright:base);
    } else if(t===9) {
      for(const cx of [12,51])for(const [dx,dy] of [[0,-2],[-1,-1],[-2,0],[-1,0],[0,0],[-1,1],[-2,2]])add(cx+dx,6+dy,dy<0?bright:base);
    } else {
      for(const cx of [12,51]){add(cx,6,bright);add(cx-1,7,base);add(cx+1,7,base);add(cx,8,secondary);}
    }
  }
  for(const [part,im] of Object.entries(layers))save(`ui/boss_bars/${id}_${part}.png`,im);
  bars.push({id,displayStage:stageOrder.indexOf(t)+1,model,primary:hex(base),secondary:hex(secondary),size:[64,32],fillRect:[5,16,54,2]});
}
const manifest={colors:COLORS,bulletShapes:{Orb:{size:[5,5],replaces:['Orb','Diamond']},Needle:{size:[9,3],uprightSize:[3,9],rotation:'clockwise-to-right'}},bars,models:catalog};
fs.writeFileSync(at('bullets/Colors/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
// One preview for inspecting the exact game assets at integer pixel scale.
const img=(src,style='')=>`<img src="${src}" style="${style}" loading="lazy">`;
const cards=Object.entries(COLORS).map(([name,c])=>`<article><h2 style="color:${c}">${name} ${c}</h2>${img(`Colors/${name}/Orb.png`,'width:60px;height:60px')}${img(`Colors/${name}/Needle.png`,'width:108px;height:36px')}</article>`).join('');
const barCards=bars.sort((a,b)=>(a.displayStage??99)-(b.displayStage??99)).map(b=>`<article><h2>${b.displayStage?'T'+b.displayStage:'CHAIN · 구현 테스트'} · ${b.primary}</h2>${img('../'+b.model,'width:96px;height:96px')}${img(`../ui/boss_bars/${b.id}_Full.png`,'width:256px;height:128px')}</article>`).join('');
const modelCards=Object.entries(catalog).map(([file,colors])=>`<article><h3>${file}</h3>${img('../'+file,'width:96px;height:96px')}<div>${Object.entries(colors).map(([c,n])=>`<span title="${c} (${n}px)" style="display:inline-block;background:${c};width:18px;height:18px"></span>`).join('')}</div></article>`).join('');
fs.writeFileSync(at('bullets/Preview.html'),`<!doctype html><meta charset="utf-8"><title>탄환 · 보스바 · 모델 색상</title><style>body{background:#080e20;color:#edf4ff;font:14px system-ui;margin:32px}section{display:flex;flex-wrap:wrap;gap:16px}article{background:#131e35;padding:16px;border:1px solid #2d3d59;border-radius:8px}img{image-rendering:pixelated;object-fit:contain;vertical-align:middle;margin:8px}h2{font-size:16px}h3{font-size:12px;max-width:320px}</style><h1>보급품 · 7×7</h1><section><article>${img('../pickups/Space_Supply.png','width:112px;height:112px')}</article></section><h1>네온 탄환 · 5×5 / 3×9 · 8색</h1><section>${cards}</section><h1>전용 보스바 · 실제 진행 순서</h1><section>${barCards}</section><h1>모델별 전체 색상 · 투명 제외</h1><section>${modelCards}</section>`);
console.log(`Compiled 16 bullet sprites, ${bars.length} dedicated boss bars, ${files.length} model palettes.`);
