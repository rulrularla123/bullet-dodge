// Synthetic Canvas workload: counts redundant compositing/copy work, not browser FPS.
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';import vm from 'node:vm';import {performance} from 'node:perf_hooks';
const stats={offscreenDraws:0,offscreenClears:0,screenCopyPixels:0,compositeChanges:0};let mainCanvas;
function context2d(main=false){const target={globalAlpha:1};return new Proxy(target,{set(o,k,v){if(!main&&k==='globalCompositeOperation')stats.compositeChanges++;o[k]=v;return true;},get(o,k){if(k in o)return o[k];return o[k]=(...args)=>{if(!main&&k==='drawImage'){stats.offscreenDraws++;if(args[0]===mainCanvas)stats.screenCopyPixels+=args.length>=9?args[3]*args[4]:mainCanvas.width*mainCanvas.height;}if(!main&&k==='clearRect')stats.offscreenClears++;};}});}
const mainCtx=context2d(true),nodes=new Map();
const document={hidden:false,addEventListener(){},createElement(){const c={width:0,height:0};const ctx=context2d();c.getContext=()=>ctx;return c;},getElementById(id){if(!nodes.has(id))nodes.set(id,{width:1288,height:724,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},clientWidth:1300,clientHeight:800,getContext:()=>mainCtx,textContent:'',innerHTML:''});return nodes.get(id);}};
mainCanvas=document.getElementById('game-canvas');
class Image {set src(s){this._src=s;queueMicrotask(()=>this.onload?.());}get src(){return this._src;}}
const window={location:{search:''},addEventListener(){}};
const context=vm.createContext({window,document,Image,performance,console,URLSearchParams,requestAnimationFrame(){},setTimeout,clearTimeout});
vm.runInContext(fs.readFileSync(process.argv[2] || fileURLToPath(new URL('../game.js',import.meta.url)),'utf8'),context);await new Promise(r=>setTimeout(r,0));
const g=window.__GAME_DEBUG__,s=g.state;g.resetGame();s.currentTier=12;g.startTierBoss(12);const b=s.boss;b.entering=false;b.x=b.homeX;b.hp=5000;g.checkAndTriggerBossPhase2(b);g.createErrorNodes(b);g.openErrorNodeWindow(b);
s.errorFx.age=5.4;s.errorFx.remaining=3;g.applyErrorCorruption();
for(let i=0;i<90;i++){g.spawnEnemyBullet(220+(i%15)*60,160+Math.floor(i/15)*60,-200,0,i%5?'Orb':'Needle','Pink');s.enemyBullets.at(-1).errorPower=2;}
for(let i=0;i<36;i++)g.spawnPlayerBullet({path:'bullets/Player_Piercing_Crescent.png',shape:'Crescent',size:[32,64],scale:1.5,x:200+(i%12)*65,y:220+Math.floor(i/12)*120,vx:0,vy:0,damage:27,piercing:true});
for(let i=0;i<5;i++)g.renderGame();for(const k of Object.keys(stats))stats[k]=0;
const start=performance.now();for(let i=0;i<120;i++)g.renderGame();
console.log(JSON.stringify({source:process.argv[2] || 'game.js',frames:120,cpuMs:Math.round(performance.now()-start),...stats}));
