import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const source = fs.readFileSync(fileURLToPath(new URL('../game.js', import.meta.url)), 'utf8');
const transforms = [];
const imageDraws = [];
const rectDraws = [];
const paintOrder = [];
const draw = new Proxy({}, { get: (_, key) => (...args) => { if (key === 'scale') transforms.push(args); if (key === 'drawImage') {imageDraws.push(args);paintOrder.push({kind:'image',args});} if(key==='lineTo'&&args[0]===2200)paintOrder.push({kind:'ray-end',args}); if(key==='fillRect') rectDraws.push(args); } });
const nodes = new Map();
const document = {
  hidden: false, addEventListener() {}, createElement: () => ({ getContext: () => draw }),
  getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { style: {}, classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {}, clientWidth: 1300, clientHeight: 800, getContext: () => draw, textContent: '', innerHTML: '' });
    return nodes.get(id);
  }
};
class Image {
  set src(value) { this._src = value; queueMicrotask(() => this.onload?.()); }
  get src() { return this._src; }
}
const windowListeners = new Map();
const window = { location: { search: '' }, addEventListener(name,handler) {windowListeners.set(name,handler);} };
const context = vm.createContext({ window, document, Image, console, URLSearchParams,
  requestAnimationFrame() {}, setTimeout, clearTimeout });
vm.runInContext(source, context);
await new Promise(resolve => setTimeout(resolve, 0));
const g = window.__GAME_DEBUG__, s = g.state;
const configuredSupplyDropChance=g.CONFIG.SUPPLY_DROP_CHANCE;
function fresh() {
  g.resetGame(); g.CONFIG.SUPPLY_DROP_CHANCE=0; s.phase = 'TEST'; s.player.fireCooldown = 1e6;
  s.player.invulnTimer = 1e6; s.meteorSpawnTimer = 1e6;
}
function tick(seconds, fps = 60) { for (let i = 0; i < seconds * fps; i++) g.updateGame(1 / fps); }
const results = [];
function test(name, callback) { callback(); results.push(name); console.log(`PASS ${name}`); }
test('Lethal projectile triggers Tier 6 suicide, while other tiers die normally', () => {
 for (const tier of [5, 6, 7]) {
  fresh(); const e = g.spawnWaveEnemy(tier, { enemyIdx: 2 });
  e.x = e.homeX; e.entering = false;
  s.playerBullets.push({ x: e.x, y: e.y, vx: 0, vy: 0, radius: 6, damage: e.hp + 1 });
  g.updatePlayerBullets(0);
  if (tier === 6) {
   assert.equal(e.specialState, 'SUICIDE_APPROACH'); assert.ok(s.enemies.includes(e));
  } else assert.ok(!s.enemies.includes(e));
 }
});
for (const fps of [30, 60]) {
 test(`Tier 6 random salvo threatens stationary player; four unique targets (${fps}fps)`, () => {
  fresh(); g.startTierBoss(6); const b = s.boss;
  b.entering = false; b.x = b.homeX; b.missileStateTimer = 100;
  s.player.invulnTimer = 0; s.player.hp = s.player.maxHp = 50;
  for (let j = 0; j < 20; j++) {
    g.prepareTier6SalvoTargets(b);
    assert.equal(b.salvoTargets.length, 4);
    assert.ok(Math.hypot(b.salvoTargets[0].x - s.player.x, b.salvoTargets[0].y - s.player.y) < 30);
    assert.equal(new Set(b.salvoTargets.map(p => `${p.x},${p.y}`)).size, 4);
  }
  for (let i = 0; i < 4; i++) g.fireSingleTier6WingMissile(b, i);
  assert.equal(s.missiles.length, 4); assert.equal(s.missiles[0].speed, 875);
  const muzzles = g.getWorldMuzzles(b.x, b.y, b.spec, false, b.scale);
  s.missiles.forEach((m, i) => {
    assert.equal(m.x, muzzles[i].x); assert.equal(m.y, muzzles[i].y);
    assert.equal(m.blastRadius, 112); assert.ok(m.flightRemaining > 0.5);
  });
  tick(2, fps); assert.ok(s.player.hp < 50); assert.ok(s.player.hp >= 48);
 });
 test(`Tier 6 death approach, immediate explosion and single score (${fps}fps)`, () => {
  for (let stage = 1; stage <= 4; stage++) {
    fresh(); const e = g.spawnWaveEnemy(6, { enemyIdx: stage });
    e.entering = false; e.x = 950; e.hp = 0;
    const score = s.score; g.beginEnemySuicide(e); g.beginEnemySuicide(e);
    assert.equal(s.score - score, 600 + stage * 25);
    assert.equal(e.blastRadius, [72, 88, 104, 120][stage - 1]);
    let armed = false;
    for (let i = 0; i < 5 * fps && s.enemies.includes(e); i++) {
      g.updateGame(1 / fps); if (e.specialState === 'SUICIDE_APPROACH') armed = true;
    }
    assert.ok(armed); assert.ok(!s.enemies.includes(e));
    assert.equal(s.score - score, 600 + stage * 25);
  }
 });
 test(`Tier 7 summons cap at six; vacancies replenish (${fps}fps)`, () => {
  fresh(); g.startTierBoss(7); s.boss.entering = false; s.boss.x = s.boss.homeX;
  tick(18, fps); assert.equal(s.enemies.length, 6);
  assert.ok(s.enemies.every(e => e.tier === 7 && e.enemyIdx === 3 && e.summonedBy === s.boss.id));
  assert.ok(s.lasers.filter(b => b.followEnemyId).length <= 2);
  s.enemies.pop(); tick(3, fps); assert.equal(s.enemies.length, 6);
  g.handleBossDefeated(); assert.equal(s.enemies.length, 0);
  assert.equal(s.lasers.filter(b => b.followEnemyId).length, 0);
 });
 test(`Tier 8 stages 1-4 fly through then settle without cloning (${fps}fps)`, () => {
  for (let stage = 1; stage <= 4; stage++) {
    fresh(); const e = g.spawnWaveEnemy(8, { enemyIdx: stage });
    assert.equal(e.specialState, 'FLYBY_WARN');
    tick(7, fps);
    assert.equal(s.enemies.length, 1); assert.equal(s.enemies[0], e);
    assert.equal(e.specialState, 'NORMAL'); assert.equal(e.exemptFromRightThird, false);
    assert.ok(g.getRotatedBounds(e.x, e.y, e.spec, false, e.scale).left >= 856);
  }
 });
}
test('Tier 5 traverses left wall then reappears beyond right wall', () => {
 fresh(); const e = g.spawnWaveEnemy(5, { enemyIdx: 3 }); e.x = e.homeX; e.entering = false;
 g.startEnemyDash(e); assert.equal(e.specialState, 'DASH_WARN');
 assert.equal(Math.round(Math.hypot(e.specialVx, e.specialVy)), 540);
 const y = e.y; let leftExit = false, rightEntry = false;
 for (let i = 0; i < 360; i++) {
  const oldX = e.x; g.updateGame(1 / 60);
  if (e.specialState === 'DASH') { assert.equal(e.y, y); assert.ok(e.x <= oldX); }
  if (e.specialState === 'RETURN' && e.x <= -65) leftExit = true;
  if (leftExit && e.x > g.CONFIG.CANVAS_WIDTH) rightEntry = true;
 }
 assert.ok(leftExit && rightEntry); assert.equal(e.specialState, 'NORMAL');
 assert.equal(e.exemptFromRightThird, false); assert.equal(e.returnPrepared, false);
});
test('Suicide detonates on the exact arrival update without an arming wait', () => {
 fresh(); const e = g.spawnWaveEnemy(6, { enemyIdx: 4 }); g.beginEnemySuicide(e);
 e.x = e.targetX - 4; e.y = e.targetY;
 g.updateEnemySpecial(e, 1 / 60);
 assert.ok(!s.enemies.includes(e)); assert.equal(s.explosions.length, 1);
 assert.equal(s.explosions[0].radius, 120);
});
test('Small lasers stay attached, capped at two, disappear with owner', () => {
 fresh();
 const enemies = [3,4,3].map(enemyIdx => g.spawnWaveEnemy(7, { enemyIdx }));
 for (const e of enemies) { e.x = e.homeX; e.entering = false; }
 for (const e of enemies) g.fireSmallEnemyLaser(e);
 assert.equal(s.lasers.length, 2); assert.ok(s.lasers.every(b => b.damage === 1));
 assert.ok(g.getLaserStageThicknessPx(s.lasers[0], 3) < 12);
 s.enemies = []; tick(0.1); assert.equal(s.lasers.length, 0);
});
test('Wave transition cancels suicide rather than detonating', () => {
 fresh(); const e = g.spawnWaveEnemy(6, { enemyIdx: 4 }); g.beginEnemySuicide(e);
 g.startTierBoss(6); assert.ok(!s.enemies.includes(e)); assert.equal(s.explosions.length, 0);
});
test('Laser texture mirrored horizontally without changing world ray', () => {
 fresh(); const e = g.spawnWaveEnemy(7, { enemyIdx: 3 }); g.fireSmallEnemyLaser(e);
 const beam = s.lasers[0], angle = beam.angle; transforms.length = 0;
 g.renderLaserBeam(beam);
 assert.ok(transforms.some(([x,y]) => x === -1 && y === 1)); assert.equal(beam.angle, angle);
});
test('Pause and rewards freeze special states; restart clears everything', () => {
 fresh(); const e = g.spawnWaveEnemy(8); const timer = e.specialTimer;
 s.mode = 'REWARD'; tick(2); assert.equal(e.specialTimer, timer);
 g.resetGame(); assert.equal(s.enemies.length, 0); assert.equal(s.lasers.length, 0);
});
test('Each boss heals current HP by one without increasing its maximum', () => {
 for (let tier = 1; tier <= 8; tier++) {
  fresh(); s.player.hp = 2;
  g.startTierBoss(tier); const defeated=s.boss; g.handleBossDefeated();
  assert.equal(s.player.hp, 3); assert.equal(s.player.maxHp, 5);
  if(s.boss===defeated) g.handleBossDefeated(); assert.equal(s.player.hp, 3);
 }
 for (const start of [g.startShadowBoss, g.startRevealedFinalBoss]) {
  fresh(); s.player.hp = 2; start(); g.handleBossDefeated();
  assert.equal(s.player.hp, 3); assert.equal(s.player.maxHp, 5);
 }
 fresh(); g.startTierBoss(1); g.handleBossDefeated();
 assert.equal(s.player.hp, 5); assert.equal(s.player.maxHp, 5);
});
test('Vitality reward adds one max HP and one current HP; boss heal remains separate', () => {
 fresh(); s.player.hp = 2; g.startTierBoss(2); g.handleBossDefeated();
 assert.equal(s.player.hp, 3); assert.equal(s.mode, 'REWARD');
 assert.match(nodes.get('reward-stat-vitality').textContent, /3\/5.*4\/6/);
 g.applyRewardChoice('vitality');
 assert.equal(s.player.hp, 4); assert.equal(s.player.maxHp, 6);
 g.applyRewardChoice('vitality'); assert.equal(s.player.maxHp, 6);
});
for (const fps of [30,60]) {
 test(`Final boss descends firing four synchronized rainbow beams from the selected ports (${fps}fps)`, () => {
  fresh(); g.startRevealedFinalBoss(); const boss = s.boss;
  boss.entering = false; boss.revealTimer = 0;
  const ports = boss.spec.muzzles;
  assert.equal(ports.length, 4);
  assert.equal(JSON.stringify(ports.map(p => [p.x,p.y])), JSON.stringify([[59.5,29],[43.5,12],[26.5,12],[10.5,29]]));
  const sweep = g.startFinalSweep(boss);
  let fired = false, minTip = Infinity, maxBottom = 0, firstFiringY;
  for (let i = 0; i < 15 * fps; i++) {
   const oldY = boss.y; g.updateGame(1 / fps);
   assert.ok(Math.abs(boss.y - oldY) <= 180 / fps + 0.01, 'No boss teleport');
   const beams = s.lasers.filter(b => sweep.beamIds.includes(b.id));
   if (beams.length) {
    assert.equal(beams.length, 4);
    assert.equal(new Set(beams.map(b => b.color)).size, 4);
    assert.equal(new Set(beams.map(b => b.stage)).size, 1, 'Charge and fire together');
    const muzzles = g.getWorldMuzzles(boss.x, boss.y, boss.spec, false, boss.scale);
    beams.forEach((beam,index) => {
     assert.equal(beam.kind, 'FINAL_VOLLEY');
     assert.equal(beam.followBossMuzzleIndex, index);
     assert.ok(Math.abs(beam.ox - muzzles[index].x) < 0.001);
     assert.ok(Math.abs(beam.oy - muzzles[index].y) < 0.001);
     minTip = Math.min(minTip, beam.ox - beam.length);
     maxBottom = Math.max(maxBottom, beam.oy + g.getLaserStageThicknessPx(beam, 3) / 2);
     assert.ok(Math.abs(beam.ox - beam.length + 16) < 0.001, 'Every ray covers the left screen edge with 16px overscan');
     assert.equal(g.getLaserStageThicknessPx(beam, 3), 24, 'Basic width, no big laser');
     if (beam.stage === 3) {
      fired = true; firstFiringY ??= boss.y;
      assert.ok(boss.y >= firstFiringY);
      assert.equal(g.checkLaserHitsPlayer(beam, { x: 65, y: beam.oy, hitboxRadius: 8 }), true);
      assert.equal(g.checkLaserHitsPlayer(beam, { x: 500, y: beam.oy, hitboxRadius: 8 }), true);
      assert.equal(g.checkLaserHitsPlayer(beam, { x: 500, y: 680, hitboxRadius: 8 }), false);
     }
    });
   }
   if (fired && !boss.finalSweep) break;
  }
  assert.ok(fired); assert.ok(Math.abs(minTip + 16) < 0.001); assert.ok(maxBottom < 550);
  assert.equal(boss.finalSweep, null); assert.equal(boss.y, boss.homeY);
 });
 test(`Final escorts only shoot lasers and wander independently (${fps}fps)`, () => {
  fresh(); g.startRevealedFinalBoss(); s.boss.entering = false; s.boss.revealTimer = 0;
  s.boss.bulletTimer = s.boss.normalLaserTimer = s.boss.overdriveTimer = 1e6;
  const ranges = s.escorts.map(() => ({ min: Infinity, max: -Infinity }));
  for (const e of s.escorts) { e.laserCooldown = 0.1; g.fireEscortMinionPattern(e); }
  for (let i = 0; i < 20 * fps; i++) {
   g.updateGame(1 / fps);
   s.escorts.forEach((e,j) => {
    ranges[j].min = Math.min(ranges[j].min, e.y); ranges[j].max = Math.max(ranges[j].max, e.y);
    assert.ok(e.invulnerable);
   });
   assert.equal(s.enemyBullets.length, 0);
  }
  assert.ok(ranges.every(r => r.max - r.min > 150));
  assert.ok(Object.values(s.telemetry.escortLasersByIdx).every(n => n > 0));
  g.handleBossDefeated(); assert.equal(s.lasers.length, 0); assert.equal(s.escorts.length, 0);
 });
}
test('Tier 5 boss dash fires rapid 1-per-side perpendicular bullets in both Phase 1 and Phase 2', () => {
 fresh(); g.startTierBoss(5); const b = s.boss;
 b.entering = false; b.dashState = 'DASH'; b.x = 700; b.y = b.dashY = 350;
 b.dashSideShotTimer = 0; g.updateGame(1 / 60);
 assert.equal(s.enemyBullets.length, 2);
 assert.equal(s.enemyBullets.filter(eb => eb.vy > 0 && Math.abs(eb.vx) < 1e-4).length, 1);
 assert.equal(s.enemyBullets.filter(eb => eb.vy < 0 && Math.abs(eb.vx) < 1e-4).length, 1);
 assert.ok(Math.abs(b.dashSideShotTimer - (g.CONFIG.TIER5_DASH_SIDE_INTERVAL - 1 / 60)) < 1e-6);
 // Stepping through 0.45s of dash produces multiple rapid single-per-side volleys
 for (let i = 0; i < 27; i++) g.updateGame(1 / 60);
 assert.ok(s.enemyBullets.length >= 10 && s.enemyBullets.length % 2 === 0);
});


for (const fps of [30, 60]) {
 test(`Final body mixes bullets and one sustained sweeping primary laser before overdrive (${fps}fps)`, () => {
  fresh(); g.startRevealedFinalBoss(); const b = s.boss; b.entering = false;
  let bullets = false, primary = false, overdrive = false;
  const angles = new Map();
  for (let i = 0; i < 12 * fps; i++) {
   g.updateGame(1 / fps);
   bullets ||= s.enemyBullets.length > 0;
   const beams = s.lasers.filter(x => x.kind === 'FINAL_PRIMARY');
   if (beams.length) {
    primary = true; assert.equal(beams.length, 1);
    assert.equal(beams[0].stage3Time, 2.4);
    assert.ok(Math.abs(beams[0].angle - Math.PI) <= 0.27);
    assert.ok(beams.every(x => x.stage1Time + x.stage2Time >= 1.2));
    assert.ok(beams.every(x => Math.cos(x.angle) < 0));
    const beam = beams[0];
    if (angles.has(beam.id)) assert.ok(Math.abs(Math.abs(beam.angle - angles.get(beam.id)) - 0.14 / fps) < 1e-6, 'Steady sweep without angular jumps');
    angles.set(beam.id, beam.angle);
   }
   if (b.finalSweep) {
    overdrive = true;
    assert.equal(beams.length, 0, 'Do not overlap primary lasers with overdrive');
   }
  }
  assert.ok(bullets && primary && overdrive);
 });
 test(`Final overdrive alternates directions with a harmless warning and direction-specific escape lane (${fps}fps)`, () => {
  fresh(); g.startRevealedFinalBoss(); const b = s.boss; b.entering = false;
  for (let pass = 0; pass < 2; pass++) {
   const sweep = g.startFinalSweep(b);
   assert.ok(pass === 0 ? sweep.endY > sweep.startY : sweep.endY < sweep.startY);
   if (pass === 1) {
    const bounds = g.getRotatedBounds(b.homeX, sweep.startY, b.spec, false, b.scale);
    assert.ok(Math.abs(bounds.bottom - g.CONFIG.CANVAS_HEIGHT) < 0.001, 'Start flush with bottom edge');
   }
   let warned = 0, fired = false, lastY;
   for (let i = 0; i < 18 * fps; i++) {
    g.updateGame(1 / fps);
    if (sweep.phase === 'WARNING') { warned += 1 / fps; assert.equal(sweep.beamIds.length, 0); }
    if (sweep.activeElapsed > 0 && sweep.phase === 'FIRING') {
     fired = true;
     if (lastY !== undefined) assert.ok(pass === 0 ? b.y >= lastY : b.y <= lastY);
     lastY = b.y;
     const beams = s.lasers.filter(x => sweep.beamIds.includes(x.id));
     assert.ok(beams.every(x => !g.checkLaserHitsPlayer(x, {x:200,y:pass === 0 ? 680 : g.CONFIG.CANVAS_HEIGHT / 4,hitboxRadius:8.5})));
     if (pass === 1) assert.ok(beams.every(x => x.oy - g.getLaserStageThicknessPx(x, 3) / 2 > g.CONFIG.CANVAS_HEIGHT / 4));
    }
    if (!b.finalSweep) break;
   }
   assert.ok(warned >= 1 && fired); assert.equal(b.finalSweep, null);
  }
 });
}

for (const fps of [30, 60]) {
 test(`Final escort stays still throughout laser charge and fire, deals one damage, then resumes (${fps}fps)`, () => {
  fresh(); g.startRevealedFinalBoss(); const boss = s.boss; boss.entering = false;
  boss.bulletTimer = boss.normalLaserTimer = boss.overdriveTimer = 1e6;
  const escort = s.escorts[0]; s.escorts = [escort];
  escort.x = 1050; escort.y = 350; escort.laserCooldown = 1e6;
  escort.freeTargetX = 1180; escort.freeTargetY = 550; escort.freeTargetTimer = 10;
  const beam = g.spawnEscortLaser(escort); const stages = new Set();
  assert.equal(beam.damage, 1);
  while (s.lasers.includes(beam)) {
   stages.add(beam.stage); g.updateGame(1 / fps);
   assert.equal(escort.x, 1050); assert.equal(escort.y, 350);
   if (beam.stage === 3 && !beam.checkedDamage) {
    s.player.x = 250; s.player.y = beam.oy; s.player.invulnTimer = 0;
    const hp = s.player.hp; g.updateGame(1 / fps);
    assert.equal(s.player.hp, hp - 1); beam.checkedDamage = true;
   }
  }
  assert.equal(stages.size, 3); assert.ok(beam.checkedDamage);
  g.updateGame(1 / fps);
  assert.ok(escort.x !== 1050 || escort.y !== 350, 'Movement resumes after laser expires');
 });
}

test('Weapon form 4 fires only one forward piercing crescent; form 5 fires three directions', () => {
 for (const level of [3, 4]) {
  fresh(); s.player.weaponLevel = level; g.firePlayerWeapon(s.player);
  const shots = s.playerBullets;
  assert.equal(shots.length, level === 3 ? 1 : 3);
  assert.ok(shots.every(b => b.path === 'bullets/Player_Piercing_Crescent.png' && b.piercing));
  assert.equal(s.player.fireCooldown, 0.12);
  assert.ok(shots.every(b => b.damage === (level === 3 ? 25 : 27)));
  assert.ok(shots.some(b => b.vy === 0));
  if (level === 4) { assert.ok(shots[0].vy < 0 && shots[2].vy > 0); assert.equal(shots[0].vx, shots[2].vx); }
 }
});
test('One crescent passes through successive enemies and damages each only once', () => {
 fresh(); s.player.weaponLevel = 3; g.firePlayerWeapon(s.player);
 const shot = s.playerBullets[0]; shot.vx = shot.vy = 0;
 const a = g.spawnWaveEnemy(3, { enemyIdx: 2 }), b = g.spawnWaveEnemy(3, { enemyIdx: 2 });
 a.x = 950; b.x = 1100; a.y = b.y = 350; a.hp = b.hp = 1000;
 for (const target of [a, b]) {
  const box = g.getRotatedBounds(target.x, target.y, target.spec, false, target.scale);
  shot.x = (box.left + box.right) / 2; shot.y = (box.top + box.bottom) / 2;
  g.updatePlayerBullets(0); g.updatePlayerBullets(0);
  assert.equal(target.hp, 1000 - shot.damage); assert.ok(s.playerBullets.includes(shot));
 }
 assert.equal(shot.hitTargets.size, 2);
 shot.x = 1400; g.updatePlayerBullets(0); assert.equal(s.playerBullets.length, 0);
});
test('Piercing shot hits a boss once and passes through invulnerable escorts without damaging them', () => {
 fresh(); g.startRevealedFinalBoss(); const boss = s.boss; boss.entering = false;
 s.player.weaponLevel = 3; g.firePlayerWeapon(s.player); const shot = s.playerBullets[0]; shot.vx = shot.vy = 0;
 const escort = s.escorts[0];
 for (const target of [escort, boss]) {
  const box = g.getRotatedBounds(target.x, target.y, target.spec, false, target.scale);
  shot.x = (box.left + box.right) / 2; shot.y = (box.top + box.bottom) / 2;
  const hp = target.hp;
  g.updatePlayerBullets(0); g.updatePlayerBullets(0);
  assert.equal(target.hp, target === boss ? hp - shot.damage : hp);
  assert.ok(s.playerBullets.includes(shot));
 }
});
test('Weapon forms 1 to 3 retain their previous non-piercing volleys', () => {
 for (const level of [0, 1, 2]) {
  fresh(); s.player.weaponLevel = level; g.firePlayerWeapon(s.player);
  assert.equal(s.playerBullets.length, [1, 2, 4][level]);
  assert.ok(s.playerBullets.every(b => !b.piercing && b.path === 'bullets/Colors/Cyan/Needle.png'));
 }
});

test('Waves allow twice the former population and stop at the new cap', () => {
 for (const tier of [1, 3, 6, 8]) {
  fresh(); s.phase = 'WAVE'; s.currentTier = tier;
  const cap = 2 * (3 + Math.floor(tier / 3));
  for (let i = 0; i < cap - 1; i++) g.spawnWaveEnemy(tier);
  s.enemySpawnTimer = 0; g.updateGame(0);
  assert.equal(s.enemies.length, cap);
  s.enemySpawnTimer = 0; g.updateGame(0);
  assert.equal(s.enemies.length, cap);
 }
});
test('Wave spawn interval is halved while retaining the tier speed and random spread', () => {
 for (const tier of [1, 3, 6, 8]) {
  fresh(); s.phase = 'WAVE'; s.currentTier = tier; s.enemySpawnTimer = 0;
  g.updateGame(0);
  const base = (1.65 - tier * 0.06) * 0.5;
  assert.ok(s.enemySpawnTimer >= base * 0.85 && s.enemySpawnTimer <= base * 1.2);
  assert.equal(s.enemies.length, 1);
 }
});

test('Tier 5 Phase 2 triggers at <=30% HP (810/2700), executes 5 omnidirectional dashes without post-dash waits, and returns to home', () => {
 fresh(); g.startTierBoss(5); const b = s.boss;
 b.entering = false; b.x = b.homeX; b.y = b.homeY;
 b.hp = 810; // exact 30% of 2700
 assert.ok(g.checkAndTriggerBossPhase2(b));
 assert.equal(b.phase2Triggered, true);
 assert.equal(b.phase2Active, true);
 assert.equal(b.dashState, 'P2_WARN');
 assert.equal(b.p2TotalDashes, 5);
 // Cannot re-trigger a second time
 assert.equal(g.checkAndTriggerBossPhase2(b), false);

 const seenAngles = [];
 let waitSeenCount = 0;
 for (let step = 0; step < 30 * 60; step++) {
  const prevState = b.dashState;
  g.updateGame(1 / 60);
  if (prevState !== 'P2_DASH' && b.dashState === 'P2_DASH') {
   seenAngles.push(Number(b.p2DashAngle.toFixed(3)));
  }
  if (prevState !== 'P2_WAIT' && b.dashState === 'P2_WAIT') {
   waitSeenCount += 1;
   assert.ok(b.dashTimer === 0, 'Next warning starts without a 2s rest');
  }
  if (b.dashState === 'NORMAL' && !b.phase2Active) break;
 }
 assert.equal(seenAngles.length, 5, 'Executed all 5 omnidirectional dashes');
 assert.equal(waitSeenCount, 5, 'All five dashes finish without a rest delay');
 assert.ok(new Set(seenAngles).size >= 4, 'Omnidirectional dashes use distinct angles');
 assert.equal(b.phase2Active, false);
 assert.equal(b.dashState, 'NORMAL');
 assert.ok(Math.abs(b.x - b.homeX) < 1 && Math.abs(b.y - b.homeY) < 1, 'Returned to home position');
 assert.ok(s.telemetry.tier5Phase2Dashes >= 5);
});

for (const fps of [30, 60]) {
 test(`Tier 6 full-map burst detonates three times one second apart with shake and 2 damage (${fps}fps)`, () => {
  fresh(); g.startTierBoss(6); const boss = s.boss; boss.entering = false;
  boss.x = boss.homeX; boss.hp = 1520; g.checkAndTriggerBossPhase2(boss);
  const first = s.globalBlastWaves[0];
  assert.ok(first.safeZones.length >= 1 && first.blasts.length >= 16);
  for (const zone of first.safeZones) assert.ok(first.blasts.every(b => Math.hypot(b.x-zone.x,b.y-zone.y) >= b.radius + zone.radius));
  const times = []; let shakes = s.telemetry.cameraShakesTriggered;
  for (let i = 1; i <= 4 * fps; i++) {
   g.updateGame(1 / fps);
   if (s.telemetry.cameraShakesTriggered > shakes) {
    times.push(i / fps); shakes = s.telemetry.cameraShakesTriggered;
   }
  }
  assert.equal(times.length, 3);
  assert.ok(Math.abs(times[1]-times[0]-1) < 2/fps);
  assert.ok(Math.abs(times[2]-times[1]-1) < 2/fps);
  assert.equal(s.telemetry.tier6GlobalBlastWaves, 3);
  while (boss.age < 18.1) g.updateGame(1 / fps);
  assert.equal(s.telemetry.tier6GlobalBlastWaves, 4, 'Next triple burst starts at 18 seconds');
  const wave = s.globalBlastWaves[0], blast = wave.blasts[0];
  s.player.x = blast.x; s.player.y = blast.y; s.player.invulnTimer = 0;
  const hp = s.player.hp; wave.blasts.push({...blast});
  g.detonateGlobalBlastWave(wave); g.detonateGlobalBlastWave(wave);
  assert.equal(s.player.hp, hp-2, 'Overlapping circles and repeated calls still only deal 2');
 });
 test(`Tier 7 blink is rapid, faces its laser, protects the boss before firing, and damages only in Stage 3 (${fps}fps)`, () => {
  fresh(); g.startTierBoss(7); const b = s.boss; b.entering = false; b.x = b.homeX; b.hp = 520;
  g.spawnWaveEnemy(7, { enemyIdx:3 });
  g.checkAndTriggerBossPhase2(b);
  assert.equal(s.enemies.length, 0); assert.ok(s.afterimages.length > 0);
  const beam = s.lasers.find(l => l.kind === 'TIER7_PHASE2_LASER');
  assert.equal(beam.stage1Time, 0.175); assert.equal(beam.stage2Time, 0.10);
  assert.equal(beam.stage3Time, 0.25); assert.equal(beam.damage, 1);
  assert.ok(Math.abs(Math.sin(b.rotation - Math.PI/2 - beam.angle)) < 1e-9);
  const muzzle = g.getFacingBossMuzzles(b)[0];
  assert.ok(Math.hypot(muzzle.x-beam.ox,muzzle.y-beam.oy) < 1e-6);
  const box = b.spec.visibleBounds;
  const lx=(box[0]+box[2]/2-b.spec.size[0]/2)*b.scale;
  const ly=(box[1]+box[3]/2-b.spec.size[1]/2)*b.scale;
  const shot={x:b.x+lx*Math.cos(b.rotation)-ly*Math.sin(b.rotation),
   y:b.y+lx*Math.sin(b.rotation)+ly*Math.cos(b.rotation), vx:0,vy:0,radius:5,damage:5};
  s.playerBullets.push(shot); const bossHp=b.hp;
  g.updatePlayerBullets(0); assert.equal(b.hp,bossHp);
  let stage3=false; const x=b.x,y=b.y;
  while(s.lasers.includes(beam)) {
   g.updateGame(1/fps);
   assert.equal(b.x,x); assert.equal(b.y,y);
   assert.equal(s.enemies.length,0); assert.equal(s.enemyBullets.length,0);
   if (beam.stage < 3) {
    assert.equal(b.hp,bossHp);
    assert.equal(g.checkLaserHitsPlayer(beam,{x:beam.ox-100,y:beam.oy,hitboxRadius:8}),false);
   }
   if (beam.stage===3 && !stage3) {
    stage3=true; assert.ok(s.cameraShake.timer>0);
    g.updatePlayerBullets(0); assert.equal(b.hp,bossHp-5, 'Boss is vulnerable only during firing');
    s.player.x=beam.ox+Math.cos(beam.angle)*300;
    s.player.y=beam.oy+Math.sin(beam.angle)*300;
    s.player.invulnTimer=0; const hp=s.player.hp;
    g.updateGame(1/fps); assert.equal(s.player.hp,hp-1);
   }
  }
  assert.ok(stage3); const count=b.p2BlinkCount;
  for(let i=0;i<Math.floor(0.3*fps);i++) g.updateGame(1/fps);
  assert.equal(b.p2BlinkCount,count,'A 0.4s pause separates shots');
  for(let i=0;i<Math.ceil(0.15*fps);i++) g.updateGame(1/fps);
  assert.ok(b.p2BlinkCount>count, 'Next blink follows the 0.4s recovery');
 });
 test(`Tier 8 launches seven original-size enemies with one killable Lv1 ship and six Lv4 ships, six times (${fps}fps)`, () => {
  fresh(); g.startTierBoss(8); const b=s.boss; b.entering=false; b.x=b.homeX; b.hp=1400;
  g.checkAndTriggerBossPhase2(b);
  let rounds=0,lastWave=0,moved=false; const initialShakes=s.telemetry.cameraShakesTriggered;
  for(let i=0;i<20*fps && b.phase2Active;i++) {
   g.updateGame(1/fps);
   assert.equal(s.lasers.length,0,'No phase-2 lasers remain');
   const units=s.enemies.filter(e=>e.isTier8Phase2Raider);
   if(units.some(e=>e.specialState==='RAID_DASH') && lastWave!==b.p2WaveCount) {
    rounds++; lastWave=b.p2WaveCount;
    assert.equal(units.length,7);
    assert.equal(units.filter(e=>e.enemyIdx===1).length,1);
    assert.equal(units.filter(e=>e.enemyIdx===4).length,6);
    assert.ok(units.every(e=>e.scale===g.CONFIG.SHIP_SCALE));
    assert.ok(units.every(e=>!e.invulnerable));
    assert.ok(units.filter(e=>e.enemyIdx===1).every(e=>e.hp===68 && e.path.endsWith('Enemy_01.png')));
    assert.ok(units.filter(e=>e.enemyIdx===4).every(e=>e.hp===g.getEnemyMaxHp(8,4)));
   }
   moved ||= units.some(e=>e.specialState==='RAID_DASH' && e.x<856);
  }
  assert.equal(rounds,6); assert.ok(moved); assert.equal(b.phase2Active,false);
  assert.equal(s.enemies.filter(e=>e.isTier8Phase2Raider).length,0);
  assert.equal(s.telemetry.cameraShakesTriggered-initialShakes,6);
 });
 test(`Shooting the Lv1 raider opens a safe path; leaving it alive still causes contact damage (${fps}fps)`, () => {
  for(const destroy of [false,true]) {
   fresh(); g.startTierBoss(8); const b=s.boss; b.entering=false;b.x=b.homeX;b.hp=1400;
   g.checkAndTriggerBossPhase2(b);
   while(b.p2FormationPending) g.updateGame(1/fps);
   const weak=s.enemies.find(e=>e.isWeakRaider); s.player.x=220;s.player.y=weak.homeY;
   weak.x=300;weak.prevX=300;weak.y=weak.homeY;
   s.player.invulnTimer=0; const hp=s.player.hp;
   if(destroy) {
    const box=g.getRotatedBounds(weak.x,weak.y,weak.spec,false,weak.scale);
    s.playerBullets.push({x:(box.left+box.right)/2,y:(box.top+box.bottom)/2,vx:0,vy:0,radius:5,damage:68});
    g.updatePlayerBullets(0);
    assert.ok(!s.enemies.includes(weak),'Weak ship can be shot down before contact');
   }
   g.updateGame(0.1);
   assert.equal(s.player.hp,destroy?hp:hp-2);
  }
 });
}

test('Fast raiders can be hit by moving bullets even when their endpoints cross between frames', () => {
 fresh();g.startTierBoss(8);s.boss.entering=false;s.boss.hp=1400;g.checkAndTriggerBossPhase2(s.boss);
 const weak=s.enemies.find(e=>e.isWeakRaider);s.enemies=[weak];
 weak.x=650;weak.prevX=900;weak.y=weak.prevY=350;
 s.playerBullets.push({x:620,y:350,vx:790,vy:0,radius:5,damage:68});
 g.updatePlayerBullets(0.1);
 assert.equal(s.enemies.length,0,'Relative swept hit detection prevents high-speed misses');
});

test('Phase 2 lifecycle: lethal hit skips Phase 2, pause freezes Phase 2 timers, and boss defeat cleans up all Phase 2 hazards', () => {
 // 1. Lethal hit from above threshold straight to 0 HP does NOT trigger Phase 2
 fresh(); g.startTierBoss(6); const b6 = s.boss; b6.entering = false;
 b6.hp = 0;
 assert.equal(g.checkAndTriggerBossPhase2(b6), false);
 assert.equal(s.globalBlastWaves.length, 0);

 // 2. Pause freezes Phase 2 timers
 fresh(); g.startTierBoss(6); const bPause = s.boss; bPause.entering = false;
 bPause.hp = 1000; g.checkAndTriggerBossPhase2(bPause);
 const timerBeforePause = s.globalBlastWaves[0].timer;
 s.mode = 'PAUSED';
 g.updateGame(0.5);
 assert.equal(s.globalBlastWaves[0].timer, timerBeforePause, 'Paused mode freezes Phase 2 hazard timers');
 s.mode = 'PLAYING';

 // 3. Boss defeat cleans up all Phase 2 hazards, afterimages, and emitters
 g.handleBossDefeated();
 assert.equal(s.globalBlastWaves.length, 0);
 assert.equal(s.afterimages.length, 0);
 assert.equal(s.enemies.length, 0);
});

test('Laser art is precomposed into one seamless native-height strip with a bounded reusable cache', () => {
 fresh();
 const strip=g.getLaserStrip('Blue',3,1200.4,2);
 assert.equal(strip.width,1201); assert.equal(strip.height,32);
 assert.equal(g.getLaserStrip('Blue',3,1200.4,2),strip);
 imageDraws.length=0;
 g.renderLaserBeam({stage:3,color:'Blue',scale:2,widthMultiplier:64/24,ox:1200.4,oy:350,
  angle:Math.PI,length:1200.4,kind:'STANDARD',followEnemyId:'test'});
 const world=imageDraws.filter(args=>args[0]===strip);
 assert.equal(world.length,1,'Draw one composed strip in the world, rather than three adjacent sections');
 for(let i=0;i<60;i++) g.getLaserStrip('Blue',3,500+i,2);
 assert.notEqual(g.getLaserStrip('Blue',3,1200.4,2),strip,'Old strips are evicted');
});

test('Restart clears debug invincibility and resets the visible toggle', () => {
 s.debugInvincible=true;g.resetGame();
 assert.equal(s.debugInvincible,false);
 assert.equal(nodes.get('btn-invincible').textContent,'무적: OFF');
});
test('Original-size level 4 raid ships deal two damage on high-speed contact', () => {
 fresh();g.startTierBoss(8);s.boss.entering=false;s.boss.hp=1400;g.checkAndTriggerBossPhase2(s.boss);
 while(s.boss.p2FormationPending) g.updateGame(1/60);
 const unit=s.enemies.find(e=>e.enemyIdx===4);
 unit.x=300;unit.prevX=300;unit.y=unit.homeY;
 s.player.x=220;s.player.y=unit.homeY;s.player.invulnTimer=0;
 const hp=s.player.hp;g.updateGame(0.1);
 assert.equal(s.player.hp,hp-2);
});

test('Tier 8 boss is protected during the raid and vulnerable again after the six waves', () => {
 fresh();g.startTierBoss(8);const b=s.boss;b.entering=false;b.hp=1400;g.checkAndTriggerBossPhase2(b);
 const addShot=()=>{
  const bounds=g.getRotatedBounds(b.x,b.y,b.spec,false,b.scale);
  s.playerBullets.push({x:(bounds.left+bounds.right)/2,y:(bounds.top+bounds.bottom)/2,vx:0,vy:0,radius:5,damage:100});
 };
 addShot();const hp=b.hp;g.updatePlayerBullets(0);assert.equal(b.hp,hp);
 s.playerBullets=[];
 while(b.phase2Active) g.updateGame(1/60);
 addShot();g.updatePlayerBullets(0);assert.equal(b.hp,hp-100);
});
for(const fps of [30,60]) {
 test(`Tier 5 and Tier 8 awakenings repeat after a long cooldown without re-triggering the HP transition (${fps}fps)`,()=>{
  for(const tier of [5,8]) {
   fresh();g.startTierBoss(tier);const b=s.boss;b.entering=false;b.x=b.homeX;
   b.hp=b.maxHp*g.CONFIG.BOSS_PHASE2_THRESHOLDS[tier];g.checkAndTriggerBossPhase2(b);
   let elapsed=0;
   while(b.phase2Active && elapsed<30) {g.updateGame(1/fps);elapsed+=1/fps;}
   assert.equal(b.phase2Active,false);assert.equal(b.p2RepeatCooldown,20);
   const before=b.p2RepeatCooldown;s.mode='PAUSED';g.updateGame(5);assert.equal(b.p2RepeatCooldown,before);s.mode='PLAYING';
   for(let i=0;i<19*fps;i++) {g.updateGame(1/fps);assert.equal(b.phase2Active,false);}
   let repeated=false;
   for(let i=0;i<7*fps;i++) {g.updateGame(1/fps);if(b.phase2Active) {repeated=true;break;}}
   assert.ok(repeated);assert.equal(s.telemetry.bossPhase2Triggered[tier],1);
   g.handleBossDefeated();assert.ok(!s.boss || s.boss.hp<=0 || s.mode==='REWARD' || s.phase==='FINAL_SHADOW');
  }
 });
}

for(const fps of [30,60]) {
 test(`Player laser deals 120 ticks of base-level 5 damage over six seconds and pierces aligned targets (${fps}fps)`,()=>{
  fresh(); const targets=[];
  for(const [x,y] of [[960,s.player.y],[1150,s.player.y],[1050,580]]) {
   const enemy=g.spawnWaveEnemy(1,{enemyIdx:1});
   enemy.entering=false;enemy.x=enemy.homeX=x;enemy.y=enemy.homeY=y;
   enemy.moveAmpX=enemy.moveAmpY=0;enemy.fireCooldown=1e6;enemy.hp=10000;
   targets.push(enemy);
  }
  assert.ok(g.usePlayerSkill('laser'));assert.equal(s.player.skills.laser.cooldown,120);
  assert.equal(g.usePlayerSkill('laser'),false);
  tick(6,fps);
  assert.equal(targets[0].hp,9400);assert.equal(targets[1].hp,9400);assert.equal(targets[2].hp,10000);
  assert.equal(s.player.skills.laser.remaining,0);assert.equal(s.player.skills.laser.pendingTicks,0);
  assert.ok(Math.abs(s.player.skills.laser.cooldown-114)<1e-7);
  tick(0.5,fps);assert.equal(targets[0].hp,9400,'Beam stops damaging after six seconds');
 });
}
test('Base heal restores one HP capped at maximum; full-HP use does not waste its cooldown',()=>{
 fresh();assert.equal(g.usePlayerSkill('heal'),false);assert.equal(s.player.skills.heal.cooldown,0);
 s.player.hp=2;assert.ok(g.usePlayerSkill('heal'));assert.equal(s.player.hp,3);assert.equal(s.player.maxHp,5);
 assert.equal(g.usePlayerSkill('heal'),false);
 fresh();s.player.hp=4;g.usePlayerSkill('heal');assert.equal(s.player.hp,5);
});
test('Base shield prevents all routed damage for four seconds, then normal damage resumes',()=>{
 fresh();s.player.invulnTimer=0;assert.ok(g.usePlayerSkill('shield'));
 for(const source of ['BULLET','LASER','MISSILE','BOSS DASH','RAID SHIP','FULL-MAP BLAST','METEOR']) g.damagePlayer(2,source);
 assert.equal(s.player.hp,5);
 g.advancePlayerSkills(3.9);g.damagePlayer(2,'LASER');assert.equal(s.player.hp,5);
 g.advancePlayerSkills(0.1);assert.equal(s.player.skills.shield.remaining,0);
 g.damagePlayer(2,'LASER');assert.equal(s.player.hp,3);
});
test('Skills have independent cooldowns, freeze in pause/rewards, survive wave transitions, and reset on restart',()=>{
 fresh();s.player.hp=2;g.usePlayerSkill('laser');g.usePlayerSkill('heal');g.usePlayerSkill('shield');
 for(const mode of ['PAUSED','REWARD','GAMEOVER','CLEAR']) {
  s.mode=mode;g.updateGame(5);assert.equal(s.player.skills.laser.remaining,6);
  assert.equal(s.player.skills.shield.remaining,4);assert.equal(s.player.skills.heal.cooldown,180);
 }
 s.mode='PLAYING';g.clearAllCombatHazards();assert.equal(s.player.skills.laser.remaining,6);
 g.advancePlayerSkills(180);for(const skill of Object.values(s.player.skills)) assert.equal(skill.cooldown,0);
 g.resetGame();assert.equal(s.player.skills.laser.remaining,0);assert.equal(s.player.skills.shield.remaining,0);
 g.updatePlayerSkillUI();assert.equal(nodes.get('skill-laser').disabled,false);
 assert.equal(nodes.get('skill-heal').disabled,true);
});
test('Skill laser respects T8 formation protection and invulnerable final escorts',()=>{
 fresh();g.startTierBoss(8);s.boss.entering=false;s.boss.hp=1400;g.checkAndTriggerBossPhase2(s.boss);
 s.player.y=s.boss.y;const hp=s.boss.hp;g.applyPlayerSkillLaserTick();assert.equal(s.boss.hp,hp);
 fresh();g.startRevealedFinalBoss();s.boss.entering=false;
 const escort=s.escorts[0],escortHp=escort.hp;s.player.y=escort.y;
 g.applyPlayerSkillLaserTick();assert.equal(escort.hp,escortHp);
});
test('E/R/T activate skills without restarting; number keys remain reward controls',()=>{
 fresh();const key=code=>({code,repeat:false,preventDefault(){}});
 windowListeners.get('keydown')(key('KeyE'));assert.equal(s.player.skills.laser.cooldown,120);
 s.player.hp=2;windowListeners.get('keydown')(key('KeyR'));assert.equal(s.player.hp,3);
 assert.equal(s.player.skills.laser.cooldown,120,'R does not restart the game');
 windowListeners.get('keydown')(key('KeyT'));assert.equal(s.player.skills.shield.remaining,4);
 windowListeners.get('keydown')(key('KeyN'));assert.equal(s.player.skills.laser.cooldown,0);
 windowListeners.get('keydown')(key('Digit1'));assert.equal(s.player.skills.laser.cooldown,0);
 fresh();s.player.hp=2;g.openRewardSelection(2);
 windowListeners.get('keydown')(key('Digit1'));
 assert.equal(s.player.skills.laser.cooldown,0);assert.equal(s.player.maxHp,6);
});

test('Player laser starts at the forward muzzle with a small activation shake and a brief flash',()=>{
 fresh();const m=g.getPlayerSkillLaserOrigin();assert.ok(m.x>s.player.x);
 const shakes=s.telemetry.cameraShakesTriggered;g.usePlayerSkill('laser');
 assert.equal(s.telemetry.cameraShakesTriggered,shakes+1);assert.equal(s.cameraShake.magnitude,2.5);
 assert.equal(s.player.skills.laser.flashTimer,0.14);
 g.advancePlayerSkills(0.2);assert.equal(s.player.skills.laser.flashTimer,0);
 assert.ok(s.player.skills.laser.remaining>0);
});

for(const fps of [30,60]) {
 test(`Laser clears existing shots, suppresses all five weapon forms for six seconds, and resumes after ending (${fps}fps)`,()=>{
  for(const level of [0,1,2,3,4]) {
   fresh();s.player.weaponLevel=level;g.firePlayerWeapon(s.player);
   assert.ok(s.playerBullets.length>0);const count=s.player.shotCounter;
   g.usePlayerSkill('laser');assert.equal(s.playerBullets.length,0);
   for(let i=0;i<6*fps;i++) {
    g.updateGame(1/fps);assert.equal(s.playerBullets.length,0);assert.equal(s.player.shotCounter,count);
   }
   assert.equal(s.player.skills.laser.remaining,0);
   g.updateGame(1/fps);assert.equal(s.player.shotCounter,count+1);assert.ok(s.playerBullets.length>0);
  }
 });
}

test('All five skill ranks match the requested damage, cooldowns, heal and shield durations',()=>{
 const expected=[
  [600,120,1,180,4,120], [1300,120,2,180,6,120], [1300,100,2,120,7,120],
  [2700,100,3,120,10,120], [20000/3,80,3,90,10,100]
 ];
 for(let level=0;level<=4;level++) {
  fresh();s.player.skillLevel=level;s.player.maxHp=10;s.player.hp=1;
  const [total,laserCd,heal,healCd,shield,shieldCd]=expected[level];
  g.usePlayerSkill('laser');g.usePlayerSkill('heal');g.usePlayerSkill('shield');
  assert.equal(s.player.skills.laser.damagePerTick,total/120);
  assert.equal(s.player.skills.laser.cooldown,laserCd);
  assert.equal(s.player.hp,1+heal);assert.equal(s.player.skills.heal.cooldown,healCd);
  assert.equal(s.player.skills.shield.remaining,shield);assert.equal(s.player.skills.shield.cooldown,shieldCd);
 }
});
for(const fps of [30,60]) {
 test(`Every laser rank deals its exact six-second total to each pierced target (${fps}fps)`,()=>{
  const totals=[600,1300,1300,2700,20000/3];
  for(let level=0;level<=4;level++) {
   fresh();s.player.skillLevel=level;
   const enemy=g.spawnWaveEnemy(1,{enemyIdx:1});enemy.entering=false;
   enemy.x=enemy.homeX=1050;enemy.y=enemy.homeY=s.player.y;
   enemy.moveAmpX=enemy.moveAmpY=0;enemy.fireCooldown=1e6;enemy.hp=100000;
   g.usePlayerSkill('laser');tick(6,fps);
   assert.ok(Math.abs((100000-enemy.hp)-totals[level])<1e-6);
  }
 });
}
test('Base and +1 lasers can finish Tier 1 and Tier 3 HP exactly despite fractional tick damage',()=>{
 for(const [level,tier] of [[0,1],[1,3]]) {
  fresh();s.player.skillLevel=level;g.startTierBoss(tier);const b=s.boss;
  b.entering=false;b.x=b.homeX;s.player.y=b.y;g.usePlayerSkill('laser');
  for(let i=0;i<120;i++) g.applyPlayerSkillLaserTick();
  assert.equal(b.hp,0);assert.ok(b.defeatedHandled);
 }
});
test('Four even-boss skill rewards advance all three skills together to +4',()=>{
 fresh();
 for(const [index,tier] of [2,4,6,8].entries()) {
  g.openRewardSelection(tier);assert.equal(nodes.get('reward-card-4').hidden,false);
  g.applyRewardChoice('skills');assert.equal(s.player.skillLevel,index+1);
  assert.equal(s.player.weaponLevel,0);assert.equal(s.player.vitalityLevel,0);assert.equal(s.player.mobilityLevel,0);
 }
 assert.equal(s.rewardsChosenHistory.length,4);assert.equal(s.player.skillLevel,4);
});
test('Capped rewards are hidden and cannot consume a choice through click or keyboard',()=>{
 for(const [choice,field,id] of [['equipment','weaponLevel',2],['mobility','mobilityLevel',3],['skills','skillLevel',4],['vitality','vitalityLevel',1]]) {
  fresh();s.player[field]=4;g.openRewardSelection(2);
  assert.equal(nodes.get(`reward-card-${id}`).hidden,true);
  assert.equal(nodes.get(`reward-card-${id}`).disabled,true);
  g.applyRewardChoice(choice);assert.equal(s.mode,'REWARD');assert.equal(s.rewardKeyLock,false);
  assert.equal(s.rewardsChosenHistory.length,0);assert.equal(s.player[field],4);
 }
 fresh();s.player.skillLevel=4;g.openRewardSelection(2);
 windowListeners.get('keydown')({code:'Digit4',repeat:false,preventDefault(){}});
 assert.equal(s.mode,'REWARD');g.applyRewardChoice('vitality');assert.equal(s.player.maxHp,6);
});
test('Skill upgrade shortens existing cooldowns proportionally without refilling or changing an active cast',()=>{
 fresh();s.player.hp=1;g.usePlayerSkill('laser');g.usePlayerSkill('heal');g.usePlayerSkill('shield');
 const damage=s.player.skills.laser.damagePerTick;
 g.openRewardSelection(2);g.applyRewardChoice('skills');
 assert.equal(s.player.skillLevel,1);assert.equal(s.player.skills.laser.damagePerTick,damage);
 assert.equal(s.player.skills.shield.remaining,4);
 g.openRewardSelection(4);g.applyRewardChoice('skills');
 assert.equal(s.player.skills.laser.cooldown,100);assert.equal(s.player.skills.heal.cooldown,120);
 assert.equal(s.player.skills.shield.cooldown,120);
 g.updatePlayerSkillUI();assert.equal(nodes.get('skill-heal-shade').style.height,'100.00%');
});
test('All-max rewards allow continuing without choosing a capped upgrade',()=>{
 fresh();s.player.weaponLevel=s.player.vitalityLevel=s.player.mobilityLevel=s.player.skillLevel=4;
 g.openRewardSelection(2);assert.equal(nodes.get('reward-continue').hidden,false);
 g.applyRewardChoice('continue');assert.equal(s.mode,'PLAYING');assert.equal(s.currentTier,3);
});
test('Reward key 4 upgrades skills while E/R/T remain inactive during the reward screen',()=>{
 fresh();g.openRewardSelection(2);
 const event=code=>({code,repeat:false,preventDefault(){}});
 windowListeners.get('keydown')(event('KeyE'));assert.equal(s.player.skills.laser.cooldown,0);
 windowListeners.get('keydown')(event('Digit4'));assert.equal(s.player.skillLevel,1);
 assert.equal(s.mode,'PLAYING');assert.equal(s.rewardsChosenHistory[0].choice,'skills');
});

test('Electric tier preserves all four original craft, increasing HP, and three boss ports',()=>{
 fresh();let hp=0;
 for(let i=1;i<=4;i++) {
  const e=g.spawnWaveEnemy(9,{enemyIdx:i});assert.ok(e.path.endsWith(`Enemy_0${i}.png`));
  assert.ok(e.hp>hp);hp=e.hp;assert.equal(e.scale,3);
 }
 g.startTierBoss(9);assert.equal(s.boss.maxHp,9500);
 assert.equal(s.boss.spec.muzzles.length,3);assert.equal(s.boss.barId,'Tier_09');
});
for(const fps of [30,60]) test(`Electric volley launches at the three ports, diverges, and detaches from the boss (${fps}fps)`,()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;
 const ports=g.getWorldMuzzles(b.x,b.y,b.spec,false,b.scale).sort((a,b)=>a.y-b.y);
 const v=g.spawnElectricVolley(b);assert.equal(v.orbs.length,3);
 v.orbs.forEach((o,i)=>{assert.equal(o.x,ports[i].x);assert.equal(o.y,ports[i].y);});
 g.updateElectricVolleys(0.66);assert.equal(v.active,true);
 g.updateElectricVolleys(1.5);
 const first=v.orbs[0],x=first.x,gap=v.orbs[2].y-v.orbs[0].y;b.x+=30;
 for(let i=0;i<fps;i++) g.updateElectricVolleys(1/fps);
 assert.ok(Math.abs(first.x-(x+first.vx))<1e-7);
 assert.ok(v.orbs.every(o=>o.launched));
 assert.ok(v.orbs[2].y-v.orbs[0].y>gap+60);
 assert.equal(g.getElectricLinks(v.orbs).length,3);
});
test('Electric warning is harmless; live orb and finite links hurt, shield blocks, outside links stay safe',()=>{
 fresh();g.startTierBoss(9);s.boss.entering=false;s.boss.x=s.boss.homeX;
 const v=g.spawnElectricVolley(s.boss),p=s.player;p.invulnTimer=0;
 p.x=v.orbs[1].x;p.y=v.orbs[1].y;
 g.updateElectricVolleys(0.1);assert.equal(p.hp,5);
 v.active=true;v.orbs=[{x:300,y:180},{x:260,y:300},{x:300,y:420}].map(o=>({...o,prevX:o.x,prevY:o.y,vx:0,vy:0,launched:true}));
 p.x=280;p.y=240;g.updateElectricVolleys(0);assert.equal(p.hp,4);
 p.invulnTimer=0;p.skills.shield.remaining=1;g.updateElectricVolleys(0);assert.equal(p.hp,4);
 p.skills.shield.remaining=0;p.x=350;p.y=30;g.updateElectricVolleys(0);assert.equal(p.hp,4);
 p.x=260;p.y=300;p.invulnTimer=0;g.updateElectricVolleys(0);assert.equal(p.hp,3);
});
test('Electric volleys freeze while paused, expire offscreen, and clear on restart or boss death',()=>{
 fresh();g.startTierBoss(9);s.boss.entering=false;s.boss.x=s.boss.homeX;
 const v=g.spawnElectricVolley(s.boss);s.mode='PAUSED';g.updateGame(1);assert.equal(v.warning,0.65);
 s.mode='PLAYING';v.active=true;v.orbs.forEach(o=>{o.x=-200;o.launched=true;});g.updateElectricVolleys(0.01);assert.equal(s.electricVolleys.length,0);
 g.spawnElectricVolley(s.boss);g.resetGame();assert.equal(s.electricVolleys.length,0);
 g.startTierBoss(9);g.spawnElectricVolley(s.boss);g.handleBossDefeated();
 assert.equal(s.mode,'REWARD');assert.equal(s.rewardPendingTier,10);assert.equal(s.electricVolleys.length,0);
});
test('Electricity and rush-fleet stages lead to error stage 12 before the final boss',()=>{
 fresh();g.startTierBoss(9);g.handleBossDefeated();assert.equal(s.mode,'REWARD');assert.equal(s.rewardPendingTier,10);
 g.applyRewardChoice('skills');assert.equal(s.currentTier,8);assert.equal(g.getStageNumber(s.currentTier),11);assert.equal(s.phase,'WAVE');
 g.startTierBoss(8);g.handleBossDefeated();assert.equal(s.phase,'WAVE');assert.equal(s.currentTier,12);
 g.startTierBoss(12);g.handleBossDefeated();assert.equal(s.mode,'REWARD');assert.equal(s.rewardPendingTier,12);
 g.applyRewardChoice('skills');assert.equal(s.phase,'FINAL_SHADOW');
 g.jumpToTierWave(g.getPatternTier(9));assert.equal(s.currentTier,11);assert.equal(s.boss.kind,'CHAIN_BOSS');
});

test('Electric shots reroll independent bounded speeds and progressively form one point, line, triangle',()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;
 const v=g.spawnElectricVolley(b),other=g.spawnElectricVolley(b);
 for(const o of [...v.orbs,...other.orbs]) {
  assert.ok(o.speed>=215&&o.speed<=285);assert.ok(Math.abs(Math.hypot(o.vx,o.vy)-o.speed)<1e-7);
 }
 assert.notEqual(v.orbs[0].speed,v.orbs[1].speed);
 assert.notEqual(v.orbs[0].speed,other.orbs[0].speed);
 g.updateElectricVolleys(0.66);g.updateElectricVolleys(0.05);
 assert.equal(v.orbs.filter(o=>o.launched).length,1);assert.equal(g.getElectricLinks(v.orbs).length,0);
 g.updateElectricVolleys(0.70);assert.equal(g.getElectricLinks(v.orbs).length,1);
 g.updateElectricVolleys(0.70);assert.equal(g.getElectricLinks(v.orbs).length,3);
 assert.ok(g.getElectricLinks(v.orbs).some(([a,b])=>a===v.orbs[2]&&b===v.orbs[0]));
});
test('Closed third edge causes boss stun while warning, shield and invulnerability cannot restun',()=>{
 fresh();g.startTierBoss(9);const v=g.spawnElectricVolley(s.boss),p=s.player;
 p.invulnTimer=0;v.active=true;
 v.orbs=[{x:300,y:180},{x:150,y:300},{x:300,y:420}].map(o=>({...o,vx:0,vy:0,launched:true}));
 p.x=300;p.y=300;g.updateElectricVolleys(0);assert.equal(p.hp,4);assert.equal(p.stunRemaining,0.3);assert.equal(p.electrocutionRemaining,0.3);
 p.stunRemaining=0.1;g.updateElectricVolleys(0);assert.equal(p.stunRemaining,0.1);
 p.invulnTimer=0;p.skills.shield.remaining=1;p.stunRemaining=0;
 g.updateElectricVolleys(0);assert.equal(p.stunRemaining,0);
});
test('Stun blocks movement for its actual remaining time, freezes in pause, and resets',()=>{
 fresh();const p=s.player;p.invulnTimer=0;g.damagePlayer(1,'ELECTRIC',0.5);
 const x=p.x;windowListeners.get('keydown')({code:'KeyD',repeat:false,preventDefault(){}});
 g.updateGame(0.2);assert.equal(p.x,x);assert.ok(Math.abs(p.stunRemaining-0.3)<1e-7);
 s.mode='PAUSED';g.updateGame(1);assert.ok(Math.abs(p.stunRemaining-0.3)<1e-7);
 s.mode='PLAYING';g.updateGame(0.4);assert.ok(Math.abs(p.x-x-35)<1e-7);
 windowListeners.get('keyup')({code:'KeyD'});g.resetGame();assert.equal(s.player.stunRemaining,0);
});
test('Electric stages 1/2 only shoot stun bullets; stage 3 charges slowly and turns at most 0.2 rad/sec',()=>{
 for(const stage of [1,2]) {
  fresh();const e=g.spawnWaveEnemy(9,{enemyIdx:stage});g.fireEnemyPattern(e);
  assert.ok(s.enemyBullets.length>0);assert.equal(s.lasers.length,0);assert.equal(s.electricVolleys.length,0);
  assert.ok(s.enemyBullets.every(b=>b.stunDuration===0.3));
  s.player.invulnTimer=0;const bullet=s.enemyBullets[0];bullet.x=s.player.x;bullet.y=s.player.y;bullet.vx=bullet.vy=0;
  g.updateGame(0);assert.equal(s.player.stunRemaining,0.3);assert.equal(s.player.electrocutionRemaining,0.3);
 }
 fresh();const e=g.spawnWaveEnemy(9,{enemyIdx:3});e.entering=false;e.x=e.homeX;
 g.fireEnemyPattern(e);assert.equal(s.enemyBullets.length,0);assert.equal(s.lasers.length,2);
 const b=s.lasers[0];assert.equal(b.stage1Time,2.4);assert.equal(b.stunDuration,0.3);
 const angle=b.angle;s.player.y=690;b.updateFn(b,0.1);assert.ok(Math.abs(b.angle-angle)<=0.02000001);
 assert.equal(g.checkLaserHitsPlayer(b,{x:b.ox,y:b.oy,hitboxRadius:8}),false);
 b.stage=3;b.angle=Math.PI;b.stageTimer=1;s.player.x=b.ox-100;s.player.y=b.oy;s.player.invulnTimer=0;
 g.updateGame(0);assert.equal(s.player.stunRemaining,0.3);assert.equal(s.player.electrocutionRemaining,0.3);
});
test('Electric stage 4 launches just two independently moving linked orbs with 0.3-second stun',()=>{
 fresh();const e=g.spawnWaveEnemy(9,{enemyIdx:4});e.entering=false;e.x=e.homeX;
 g.fireEnemyPattern(e);assert.equal(s.lasers.length,0);assert.equal(s.enemyBullets.length,0);
 const v=s.electricVolleys[0];assert.equal(v.orbs.length,2);assert.equal(v.stunDuration,0.3);
 g.updateElectricVolleys(0.66);g.updateElectricVolleys(0.7);
 assert.equal(g.getElectricLinks(v.orbs).length,1);assert.notEqual(v.orbs[0].vx,v.orbs[1].vx);
 const [a,b]=v.orbs;s.player.x=(a.x+b.x)/2;s.player.y=(a.y+b.y)/2;s.player.invulnTimer=0;
 g.updateElectricVolleys(0);assert.equal(s.player.stunRemaining,0.3);assert.equal(s.player.electrocutionRemaining,0.3);
});

test('Central boss gun is always first or last, rear order varies and every gun charges separately',()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;
 const variants=new Set();
 for(let i=0;i<64;i++) {
  const v=g.spawnElectricVolley(b);variants.add(v.order.join(','));
  assert.ok(v.order[0]===1||v.order[2]===1);
  const guns=[...v.orbs].sort((a,b)=>a.launchDelay-b.launchDelay);
  assert.equal(guns[1].launchDelay-guns[0].launchDelay,0.7);
  assert.equal(guns[2].launchDelay-guns[1].launchDelay,0.7);
  v.active=true;v.age=0.1;guns[0].launched=true;
  assert.equal(g.getElectricOrbCharge(v,guns[1]),null);
  assert.equal(g.getElectricOrbCharge(v,guns[2]),null);
  v.age=0.3;assert.ok(g.getElectricOrbCharge(v,guns[1])>0);
  assert.equal(g.getElectricOrbCharge(v,guns[2]),null);
  v.age=1;guns[1].launched=true;assert.ok(g.getElectricOrbCharge(v,guns[2])>0);
 }
 assert.equal(variants.size,4);
});
test('Electric minion charging and beams attach to actual gun tips, not the old middle or wing positions',()=>{
 fresh();const third=g.spawnWaveEnemy(9,{enemyIdx:3});third.entering=false;third.x=third.homeX;
 assert.equal(third.spec.muzzles.length,2);
 assert.equal(third.spec.muzzles[0].x,10);assert.equal(third.spec.muzzles[1].x,22);
 g.fireElectricEnemyLaser(third);assert.equal(s.lasers.length,2);
 third.homeX+=15;g.updateGame(0);
 const ports=g.getWorldMuzzles(third.x,third.y,third.spec,false,third.scale);
 s.lasers.forEach((b,i)=>{assert.equal(b.ox,ports[i].x);assert.equal(b.oy,ports[i].y);});
 const fourth=g.spawnWaveEnemy(9,{enemyIdx:4});fourth.entering=false;fourth.x=fourth.homeX;
 assert.equal(fourth.spec.muzzles.length,2);assert.ok(fourth.spec.muzzles.every(m=>m.y===2));
 const v=g.spawnElectricVolley(fourth,false);fourth.x+=15;g.updateElectricVolleys(0.01);
 const tips=g.getWorldMuzzles(fourth.x,fourth.y,fourth.spec,false,fourth.scale).sort((a,b)=>a.y-b.y);
 v.orbs.forEach((o,i)=>{assert.equal(o.x,tips[i].x);assert.equal(o.y,tips[i].y);});
});
for(const fps of [30,60]) test(`Two electric lasers finish the long muzzle charge together and immediately use live electric art (${fps}fps)`,()=>{
 fresh();const e=g.spawnWaveEnemy(9,{enemyIdx:3});e.entering=false;e.x=e.homeX;e.fireCooldown=100;
 g.fireElectricEnemyLaser(e);const [a,b]=s.lasers;
 const sheet=g.assets.images.get('effects/Electric_Laser/Electric_Laser_Spritesheet.png');
 let index=imageDraws.length;g.step(0);
 assert.equal(imageDraws.slice(index).filter(d=>d[0]===sheet).length,0);
 let elapsed=0;
 while(a.stage!==3&&elapsed<4){g.updateGame(1/fps);elapsed+=1/fps;assert.equal(a.stage,b.stage);}
 assert.ok(elapsed>=3.15-1e-7&&elapsed<3.15+2/fps);
 index=imageDraws.length;g.step(0);
 assert.equal(imageDraws.slice(index).filter(d=>d[0]===sheet).length,2);
 s.player.invulnTimer=0;s.player.x=a.ox+Math.cos(a.angle)*120;s.player.y=a.oy+Math.sin(a.angle)*120;
 g.updateGame(0);assert.equal(s.player.hp,4);assert.equal(s.player.stunRemaining,0.3);
});
test('Stage 8 reward leads to chain survival, chain boss, then electricity at stage 10',()=>{
 fresh();g.startTierBoss(7);g.handleBossDefeated();assert.equal(s.rewardPendingTier,8);
 g.applyRewardChoice('skills');assert.equal(s.currentTier,11);assert.equal(s.boss.kind,'CHAIN_BOSS');assert.equal(s.boss.combat,false);
 const chain=s.boss;s.tierWaveElapsed=59.99;g.updateGame(0.02);
 assert.equal(s.boss,chain);assert.equal(chain.combat,true);assert.equal(s.phase,'BOSS');
 g.handleBossDefeated();assert.equal(s.currentTier,9);assert.equal(g.getStageNumber(s.currentTier),10);
 s.enemySpawnTimer=100;s.tierWaveElapsed=59.99;g.updateGame(0.02);assert.equal(s.boss.path,'bosses/Tier_09/Boss.png');
 assert.equal(nodes.get('stage-label').textContent,'TIER 10 BOSS');
});

for(const fps of [30,60]) test(`Electric boss fires five slow-turning beams for five seconds, with impact effects and no triangle overlap (${fps}fps)`,()=>{
 fresh();g.startTierBoss(9);const boss=s.boss;boss.entering=false;boss.x=boss.homeX;
 g.spawnElectricVolley(boss);assert.ok(s.electricVolleys.length);
 assert.equal(g.startElectricBossLasers(boss),true);assert.equal(s.electricVolleys.length,0);
 assert.equal(s.lasers.length,5);assert.equal(g.spawnElectricVolley(boss),null);
 assert.equal(g.startElectricBossLasers(boss),false);
 const beams=[...s.lasers],x=boss.x,y=boss.y;
 assert.equal(new Set(beams.map(b=>b.angle)).size,5);
 beams.forEach(b=>{assert.equal(b.stage3Time,5);assert.equal(b.stunDuration,0.3);});
 const angle=beams[0].angle;s.player.y=680;beams[0].updateFn(beams[0],0.1);
 assert.ok(Math.abs(beams[0].angle-angle)<=0.00350001);
 let elapsed=0;
 while(beams[0].stage!==3&&elapsed<4) {g.updateGame(1/fps);elapsed+=1/fps;assert.equal(s.electricVolleys.length,0);}
 assert.ok(elapsed>=3.15-1e-7);assert.notEqual(boss.x,x);assert.notEqual(boss.y,y);
 const fireX=boss.x,fireY=boss.y;
 assert.ok(beams.every(b=>b.stage===3));assert.ok(boss.electricFlashTimer>0);assert.ok(s.cameraShake.timer>0);
 const e=beams[0].elapsed;s.mode='PAUSED';g.updateGame(1);assert.equal(beams[0].elapsed,e);s.mode='PLAYING';
 let duration=0;
 while(s.lasers.length&&duration<6){g.updateGame(1/fps);duration+=1/fps;assert.equal(s.electricVolleys.length,0);assert.equal(boss.x,fireX);assert.equal(boss.y,fireY);}
 assert.ok(duration>=5-2/fps&&duration<=5+2/fps);
 g.updateGame(1/fps);assert.equal(boss.electricMode,'TRIANGLE');
 tick(1.6,fps);assert.ok(s.electricVolleys.length>0);
 g.startElectricBossLasers(boss);g.handleBossDefeated();assert.equal(s.lasers.length,0);
});
test('Electric boss naturally alternates two triangle volleys and five-beam attacks',()=>{
 fresh();g.startTierBoss(9);const boss=s.boss;boss.entering=false;boss.x=boss.homeX;
 tick(7.8);assert.equal(boss.electricMode,'LASER');assert.equal(s.lasers.length,5);assert.equal(s.electricVolleys.length,0);
 tick(8.2);assert.equal(boss.electricMode,'TRIANGLE');
 tick(8.1);assert.equal(boss.electricMode,'LASER');assert.equal(s.lasers.length,5);
});

for(const fps of [30,60]) test(`Electric boss shows five harmless full-range warning lanes and moves at 30% speed while charging (${fps}fps)`,()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;
 g.startElectricBossLasers(b);const phaseX=b.phaseX,phaseY=b.phaseY;
 tick(1,fps);
 assert.ok(Math.abs(b.phaseX-phaseX-0.24)<1e-7);
 assert.ok(Math.abs(b.phaseY-phaseY-0.195)<1e-7);
 const ports=g.getElectricBossLaserMuzzles(b);
 for(const beam of s.lasers) {
  const m=ports[beam.followBossMuzzleIndex];assert.equal(beam.ox,m.x);assert.equal(beam.oy,m.y);
  assert.equal(g.checkLaserHitsPlayer(beam,{x:beam.ox-50,y:beam.oy,hitboxRadius:8}),false);
 }
 const before=rectDraws.length;g.step(0);
 assert.equal(rectDraws.slice(before).filter(([x,y,w,h])=>x===0&&y===-5&&w>100&&h===10).length,5);
 s.mode='PAUSED';const x=b.x,y=b.y;g.updateGame(1);assert.equal(b.x,x);assert.equal(b.y,y);
});

test('Five boss lasers fire once from each of three front guns and two yellow end orbs',()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;
 assert.equal(b.spec.muzzles.length,3);assert.equal(b.spec.laserMuzzles.length,2);
 assert.equal(b.spec.laserMuzzles[0].x,28);assert.equal(b.spec.laserMuzzles[1].x,4);
 assert.ok(b.spec.laserMuzzles.every(m=>m.y===24));
 g.startElectricBossLasers(b);
 for(let i=0;i<5;i++) assert.equal(s.lasers.filter(l=>l.followBossMuzzleIndex===i).length,1);
 assert.equal(new Set(s.lasers.map(l=>`${l.ox},${l.oy}`)).size,5);
 const fanY=s.lasers.map(l=>l.oy+Math.sin(l.angle)*300);
 for(let i=1;i<fanY.length;i++) assert.ok(fanY[i]-fanY[i-1]>60);
 tick(1);
 const tips=g.getElectricBossLaserMuzzles(b);
 s.lasers.forEach(l=>{const p=tips[l.followBossMuzzleIndex];assert.equal(l.ox,p.x);assert.equal(l.oy,p.y);});
 assert.equal(tips[3].x,Math.round(b.x+8*b.scale));
 assert.equal(tips[3].y,Math.round(b.y-12*b.scale));
 assert.equal(tips[4].y,Math.round(b.y+12*b.scale));
 const front=g.getWorldMuzzles(b.x,b.y,b.spec,false,b.scale);
 for(let i=0;i<3;i++) {assert.equal(tips[i].x,front[i].x);assert.equal(tips[i].y,front[i].y);}
 tick(2.3);
 assert.ok(s.lasers.every(l=>l.stage===3));
 const live=g.getElectricBossLaserMuzzles(b);
 s.lasers.forEach(l=>{assert.equal(l.ox,live[l.followBossMuzzleIndex].x);assert.equal(l.oy,live[l.followBossMuzzleIndex].y);});
});

test('Electric phase 2 places eight even perimeter nodes and seven random interior nodes with at most five links each',()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;
 b.hp=b.maxHp*0.5+1;assert.equal(g.checkAndTriggerBossPhase2(b),false);
 b.hp=b.maxHp*0.5;assert.equal(g.checkAndTriggerBossPhase2(b),true);
 const f=b.electricField;assert.equal(f.nodes.length,15);assert.ok(f.edges.length>=15&&f.edges.length<=37);
 const degrees=Array(15).fill(0),unique=new Set();
 for(const [a,c] of f.edges) {assert.notEqual(a,c);degrees[a]++;degrees[c]++;unique.add(`${Math.min(a,c)},${Math.max(a,c)}`);}
 assert.equal(unique.size,f.edges.length);assert.ok(degrees.every(n=>n>=2&&n<=5));
 assert.equal(f.nodes.filter(n=>n.perimeter).length,8);
 assert.equal(f.nodes.filter(n=>!n.perimeter).length,7);
 const W=g.CONFIG.CANVAS_WIDTH,H=g.CONFIG.CANVAS_HEIGHT;
 for(const [x,y] of [[12,12],[W/2,12],[W-12,12],[W-12,H/2],[W-12,H-12],[W/2,H-12],[12,H-12],[12,H/2]]) assert.ok(f.nodes.some(n=>n.perimeter&&n.tx===x&&n.ty===y));
 assert.ok(f.nodes.filter(n=>!n.perimeter).every(n=>n.tx>=W*0.18&&n.tx<=W*0.82&&n.ty>=H*0.18&&n.ty<=H*0.82));
 const reached=new Set([0]),pending=[0];
 while(pending.length) {
  const n=pending.pop();
  for(const [a,c] of f.edges) {
   const next=a===n?c:c===n?a:null;
   if(next!==null&&!reached.has(next)) {reached.add(next);pending.push(next);}
  }
 }
 assert.equal(reached.size,15);
 assert.equal(Math.min(...f.nodes.map(n=>n.tx)),12);
 assert.equal(Math.max(...f.nodes.map(n=>n.tx)),g.CONFIG.CANVAS_WIDTH-12);
 assert.equal(Math.min(...f.nodes.map(n=>n.ty)),12);
 assert.equal(Math.max(...f.nodes.map(n=>n.ty)),g.CONFIG.CANVAS_HEIGHT-12);
 assert.ok(Math.min(...f.nodes.map(n=>n.tx))<300);assert.ok(Math.max(...f.nodes.map(n=>n.tx))>900);
 assert.ok(Math.min(...f.nodes.map(n=>n.ty))<250);assert.ok(Math.max(...f.nodes.map(n=>n.ty))>500);
 assert.equal(s.enemyBullets.length,0);assert.equal(g.spawnElectricVolley(b),null);assert.equal(g.startElectricBossLasers(b),false);
 assert.equal(g.checkAndTriggerBossPhase2(b),false);
});
for(const fps of [30,60]) test(`Electric network flies out, warns without damage, then damages only links and repeats after cooldown (${fps}fps)`,()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;
 g.spawnElectricVolley(b);g.startElectricBossLasers(b);b.hp=b.maxHp*0.5;g.checkAndTriggerBossPhase2(b);
 assert.equal(s.lasers.length,0);assert.equal(s.electricVolleys.length,0);
 b.electricSweepsUnlocked=true;b.electricSweepCooldowns={Blue:1e6,Red:1e6};
 const f=b.electricField,p=s.player;p.invulnTimer=0;
 let elapsed=0;
 while(f.stage==='DEPLOY'&&elapsed<4) {g.updateGame(1/fps);elapsed+=1/fps;}
 assert.equal(f.stage,'WARNING');assert.ok(f.nodes.every(n=>n.arrived));assert.equal(p.hp,5);
 const safeEdge=f.edges.find(([i,j])=>{const x=(f.nodes[i].x+f.nodes[j].x)/2,y=(f.nodes[i].y+f.nodes[j].y)/2;return x>100&&x<1100&&y>130&&y<600;});
 const [a,c]=safeEdge.map(i=>f.nodes[i]);p.x=(a.x+c.x)/2;p.y=(a.y+c.y)/2;
 tick(1,fps);assert.equal(p.hp,5);
 while(f.stage!=='ACTIVE') g.updateGame(1/fps);
 g.updateGame(1/fps);assert.equal(p.hp,4);assert.ok(p.stunRemaining>0);assert.ok(p.electrocutionRemaining>0);
 // Occupying an isolated orb never causes contact damage.
 f.edges=[];p.invulnTimer=0;p.x=f.nodes[0].x;p.y=f.nodes[0].y;g.updateGame(1/fps);assert.equal(p.hp,4);
 const age=f.age;s.mode='PAUSED';g.updateGame(1);assert.equal(f.age,age);s.mode='PLAYING';p.invulnTimer=1e6;
 while(b.electricField) g.updateGame(1/fps);
 assert.equal(b.electricFieldCooldown,20);assert.equal(b.phase2Active,false);
 tick(20.1,fps);assert.ok(b.electricField);assert.equal(s.telemetry.bossPhase2Triggered[9],1);
 g.handleBossDefeated();assert.equal(s.boss,null);assert.equal(s.mode,'REWARD');assert.equal(s.rewardPendingTier,10);
 g.resetGame();assert.equal(s.boss,null);
});

test('Blue and red sweep cooldowns unlock at 60% and independently repeat every six to eight seconds',()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;b.attackTimer=100;
 b.hp=b.maxHp*0.6+1;g.updateGame(0.01);assert.equal(s.electricSweeps.length,0);
 b.hp=b.maxHp*0.6;g.updateGame(0.01);assert.equal(s.electricSweeps.length,0);
 for(const c of ['Blue','Red']) assert.ok(b.electricSweepCooldowns[c]>=6&&b.electricSweepCooldowns[c]<=8);
 b.electricSweepCooldowns={Blue:0.01,Red:3};g.updateElectricSweepScheduler(b,0.02);
 assert.equal(s.electricSweeps.length,1);assert.equal(s.electricSweeps[0].color,'Blue');
 assert.ok(Math.abs(b.electricSweepCooldowns.Red-2.98)<1e-7);
 assert.ok(b.electricSweepCooldowns.Blue>=5.99&&b.electricSweepCooldowns.Blue<=8);
 const blue=b.electricSweepCooldowns.Blue;b.electricSweepCooldowns.Red=0.01;
 g.updateElectricSweepScheduler(b,0.02);assert.equal(s.electricSweeps.length,1);
 const spacing=b.electricSweepSpacing;assert.ok(spacing>=2.98&&spacing<=4);
 g.updateElectricSweepScheduler(b,spacing+0.01);assert.equal(s.electricSweeps[1].color,'Red');
 assert.ok(Math.abs(b.electricSweepCooldowns.Blue-(blue-0.02-spacing-0.01))<1e-7);
 b.hp=b.maxHp*0.5;g.updateGame(0.01);assert.ok(b.electricField);assert.ok(s.electricSweeps.length);
});
for(const fps of [30,60]) test(`Blue hurts only movement, red hurts only stillness, including high-speed crossing (${fps}fps)`,()=>{
 for(const direction of [1,-1]) for(const color of ['Blue','Red']) for(const moving of [false,true]) {
  fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;
  const p=s.player;p.invulnTimer=0;p.x=300;p.y=350;p.prevX=moving?295:300;p.prevY=350;
  s.electricSweeps=[{ownerId:b.id,color,delay:0,active:true,age:0,x:300-direction*50,prevX:300-direction*50,tilt:0,speed:direction*6000,hitPlayer:false}];
  g.updateElectricSweeps(1/fps);
  const unsafe=color==='Blue'?moving:!moving;
  assert.equal(p.hp,unsafe?4:5);assert.equal(p.electrocutionRemaining,unsafe?0.3:0);
  assert.equal(p.stunRemaining,unsafe?0.3:0);
 }
});
test('Colored sweep warnings are harmless; actual wall-blocked movement counts as still, pause and cleanup work',()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;
 const p=s.player;p.invulnTimer=0;g.spawnElectricSweep(b);
 const l=s.electricSweeps[0];l.color='Red';l.delay=0;l.warning=0.5;l.x=p.x;
 g.updateElectricSweeps(0.1);assert.equal(p.hp,5);assert.equal(l.active,false);
 s.mode='PAUSED';const warning=l.warning;g.updateGame(1);assert.equal(l.warning,warning);s.mode='PLAYING';
 // A held key at the wall produces no displacement and cannot evade red electricity.
 p.x=0;g.updateGame(0);l.active=true;l.x=p.x;l.speed=0;l.tilt=0;
 windowListeners.get('keydown')({code:'KeyA',repeat:false,preventDefault(){}});
 g.updateGame(1/60);assert.equal(p.hp,4);
 windowListeners.get('keyup')({code:'KeyA'});
 g.handleBossDefeated();assert.equal(s.electricSweeps.length,0);
 g.resetGame();assert.equal(s.electricSweeps.length,0);
});

test('Sweeps choose both sides and colors, stay vertical, flash and shake on release, and leave either edge',()=>{
 fresh();g.startTierBoss(9);const b=s.boss;
 const colors=new Set(),directions=new Set();
 for(let i=0;i<64;i++) {
  const l=g.spawnElectricSweep(b);colors.add(l.color);directions.add(l.direction);
  assert.equal(l.tilt,0);assert.equal(l.delay,0);assert.ok(Math.abs(l.speed)>=700&&Math.abs(l.speed)<=800);
  assert.equal(Math.sign(l.speed),l.direction);
  assert.equal(l.x,l.direction===1?-140:g.CONFIG.CANVAS_WIDTH+140);
 }
 assert.equal(colors.size,2);assert.equal(directions.size,2);
 for(const direction of [1,-1]) {
  s.electricSweeps=[];const l=g.spawnElectricSweep(b);l.direction=direction;
  l.x=direction===1?-140:g.CONFIG.CANVAS_WIDTH+140;l.speed=direction*750;l.warning=0;
  g.updateElectricSweeps(0.01);assert.equal(l.active,true);assert.ok(l.flashTimer>0);
  assert.ok(s.cameraShake.timer>0);assert.ok(s.cameraShake.magnitude>=5);
  g.updateElectricSweeps(4);assert.equal(s.electricSweeps.length,0);
 }
});

test('Boss electric laser applies the same 0.3-second shock and sparks as all other electric attacks',()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.entering=false;b.x=b.homeX;
 g.startElectricBossLasers(b);s.lasers.forEach(l=>{l.stage=3;l.stageTimer=5;});
 const l=s.lasers.find(l=>l.followBossMuzzleIndex===1),p=s.player;
 p.x=l.ox+Math.cos(l.angle)*150;p.y=l.oy+Math.sin(l.angle)*150;p.invulnTimer=0;
 g.updateGame(0);assert.equal(p.hp,4);assert.equal(p.stunRemaining,0.3);assert.equal(p.electrocutionRemaining,0.3);
 assert.ok(s.particles.some(p=>p.color==='#78d8ff'));
});
test('Electric shock lasts 0.3 seconds, freezes in pause, blocks movement and cannot refresh through shields or hit immunity',()=>{
 fresh();const p=s.player;p.invulnTimer=0;
 g.damagePlayer(1,'ELECTRIC',0.5,'Cyan');assert.equal(p.stunRemaining,0.3);assert.equal(p.electrocutionRemaining,0.3);
 const x=p.x;windowListeners.get('keydown')({code:'KeyD',repeat:false,preventDefault(){}});
 g.updateGame(0.1);assert.equal(p.x,x);assert.ok(Math.abs(p.electrocutionRemaining-0.2)<1e-7);
 g.damagePlayer(1,'ELECTRIC',0.3,'Red');assert.equal(p.electrocutionColor,'Cyan');
 s.mode='PAUSED';g.updateGame(1);assert.ok(Math.abs(p.electrocutionRemaining-0.2)<1e-7);
 s.mode='PLAYING';g.updateGame(0.25);assert.equal(p.electrocutionRemaining,0);assert.ok(p.x>x);
 windowListeners.get('keyup')({code:'KeyD'});
 p.invulnTimer=0;p.skills.shield.remaining=1;g.damagePlayer(1,'ELECTRIC',0.3,'Red');assert.equal(p.electrocutionRemaining,0);
 g.resetGame();assert.equal(s.player.electrocutionRemaining,0);
});
test('Non-electric damage does not add an electric stun or sparks',()=>{
 fresh();s.player.invulnTimer=0;g.damagePlayer(1,'METEOR');
 assert.equal(s.player.stunRemaining,0);assert.equal(s.player.electrocutionRemaining,0);
});

for(const fps of [30,60]) test(`Simultaneously ready colored sweeps wait three to four seconds between releases (${fps}fps)`,()=>{
 fresh();g.startTierBoss(9);const b=s.boss;b.electricSweepsUnlocked=true;b.electricSweepCooldowns={Blue:0,Red:0};
 g.updateElectricSweepScheduler(b,1/fps);assert.equal(s.electricSweeps.length,1);
 const gap=b.electricSweepSpacing;assert.ok(gap>=3&&gap<=4);
 let elapsed=0;
 while(s.electricSweeps.length===1&&elapsed<5) {
  g.updateElectricSweepScheduler(b,1/fps);elapsed+=1/fps;
  if(elapsed<gap-1e-7) assert.equal(s.electricSweeps.length,1);
 }
 assert.equal(s.electricSweeps.length,2);assert.ok(elapsed>=gap-1e-7&&elapsed<gap+2/fps);
 assert.notEqual(s.electricSweeps[0].color,s.electricSweeps[1].color);
});

test('Purple EMP is stage 6 after the original stage 5 dash boss, preserving pattern IDs',()=>{
 fresh();assert.equal(g.getPatternTier(6),10);assert.equal(g.getStageNumber(5),5);
 assert.equal(g.getStageNumber(9),10);assert.equal(g.getStageNumber(8),11);
 for(let i=1;i<=4;i++) {const e=g.spawnWaveEnemy(10,{enemyIdx:i});assert.ok(e.path.endsWith(`Tier_10/Enemy_0${i}.png`));assert.equal(e.spec.muzzles[0].x,16);}
 g.startTierBoss(4);g.handleBossDefeated();g.applyRewardChoice('skills');assert.equal(s.currentTier,5);
 g.startTierBoss(5);g.handleBossDefeated();assert.equal(s.currentTier,10);
 s.enemySpawnTimer=100;s.tierWaveElapsed=59.99;g.updateGame(0.02);
 assert.equal(s.boss.path,'bosses/Tier_10/Boss.png');assert.equal(s.boss.maxHp,2300);
 g.handleBossDefeated();assert.equal(s.rewardPendingTier,6);g.applyRewardChoice('skills');assert.equal(g.getStageNumber(s.currentTier),7);
});
test('Purple core currents originate at the core, are larger for the boss, and never cause electric stun',()=>{
 for(const isBoss of [false,true]) {
  fresh();let owner;
  if(isBoss) {g.startTierBoss(10);owner=s.boss;owner.empCooldown=100;owner.attackTimer=100;}
  else {owner=g.spawnWaveEnemy(10,{enemyIdx:4});owner.moveAmpX=owner.moveAmpY=0;owner.homeY=362;owner.fireCooldown=100;}
  owner.entering=false;owner.x=owner.homeX;owner.y=362;
  assert.equal(g.firePurpleCoreCurrent(owner,isBoss),true);const l=s.lasers[0];
  const core=g.getWorldMuzzles(owner.x,owner.y,owner.spec,false,owner.scale)[0];
  assert.equal(l.ox,core.x);assert.equal(l.oy,core.y);assert.equal(l.empLarge,isBoss);assert.equal(l.stunDuration,0);
  l.stage=3;l.stageTimer=1;l.angle=Math.PI;
  s.player.x=l.ox-100;s.player.y=l.oy;s.player.invulnTimer=0;g.updateGame(0);
  assert.equal(s.player.hp,4);assert.equal(s.player.stunRemaining,0);assert.equal(s.player.electrocutionRemaining,0);
 }
});
for(const fps of [30,60]) test(`EMP ring spreads quickly from the core, hits once without HP damage, and scrambles for eight seconds (${fps}fps)`,()=>{
 fresh();g.startTierBoss(10);const b=s.boss;b.entering=false;b.x=b.homeX;
 g.emitEmpWave(b);const w=s.empWaves[0];assert.equal(w.x,b.x);assert.equal(w.y,b.y);
 assert.ok(b.empFlashTimer>0);assert.ok(s.cameraShake.timer>0);
 let elapsed=0;
 while(!w.hitPlayer&&elapsed<2) {g.updateEmpWaves(1/fps);elapsed+=1/fps;}
 assert.ok(w.hitPlayer);assert.ok(elapsed<1.1);assert.equal(s.player.hp,5);
 assert.equal(s.player.empRemaining,8);assert.equal(new Set(s.player.empMap).size,4);
 assert.ok(s.player.empMap.every((v,i)=>v!==i));assert.equal(s.player.stunRemaining,0);
 const map=JSON.stringify(s.player.empMap);g.updateEmpWaves(0.1);assert.equal(JSON.stringify(s.player.empMap),map);
});
test('EMP remaps both WASD and arrow keys, freezes in pause and restores normal directions after eight seconds',()=>{
 fresh();const p=s.player;p.empRemaining=8;p.empMap=[1,2,3,0];const x=p.x,y=p.y;
 const key=code=>({code,repeat:false,preventDefault(){}});
 windowListeners.get('keydown')(key('KeyW'));g.updateGame(0.1);windowListeners.get('keyup')(key('KeyW'));
 assert.equal(p.x,x);assert.equal(p.y,y+35);
 windowListeners.get('keydown')(key('ArrowUp'));g.updateGame(0.1);windowListeners.get('keyup')(key('ArrowUp'));
 assert.equal(p.y,y+70);
 s.mode='PAUSED';const remaining=p.empRemaining;g.updateGame(4);assert.equal(p.empRemaining,remaining);
 s.mode='PLAYING';g.updateGame(8);assert.equal(p.empRemaining,0);assert.equal(p.empMap,null);
 windowListeners.get('keydown')(key('KeyW'));g.updateGame(0.1);windowListeners.get('keyup')(key('KeyW'));
 assert.equal(p.y,y+35);g.resetGame();assert.equal(s.player.empRemaining,0);
});
test('EMP uses a twelve-second cooldown and shields block the scramble',()=>{
 fresh();g.startTierBoss(10);const b=s.boss;b.entering=false;b.x=b.homeX;
 tick(11.8);assert.equal(s.empWaves.length,0);tick(0.4);assert.ok(s.empWaves.length);
 const first=s.empWaves[0];tick(11.4);assert.equal(s.empWaves.length,0);tick(0.6);assert.ok(s.empWaves.length);assert.notEqual(s.empWaves[0],first);
 s.player.empRemaining=0;s.player.empMap=null;s.player.skills.shield.remaining=1;
 assert.equal(g.applyEmpScramble(),false);assert.equal(s.player.empRemaining,0);
 s.player.skills.shield.remaining=0;assert.equal(g.applyEmpScramble(),true);assert.equal(s.player.empRemaining,8);
 g.handleBossDefeated();assert.equal(s.empWaves.length,0);g.resetGame();assert.equal(s.player.empMap,null);
});
test('Electric laser minions show two harmless full-range warning paths before firing',()=>{
 fresh();const e=g.spawnWaveEnemy(9,{enemyIdx:3});e.entering=false;e.x=e.homeX;
 g.fireElectricEnemyLaser(e);const before=rectDraws.length;g.step(0);
 assert.equal(rectDraws.slice(before).filter(([x,y,w,h])=>x===0&&y===-5&&w>100&&h===10).length,2);
 s.lasers.forEach(l=>assert.equal(g.checkLaserHitsPlayer(l,{x:l.ox-100,y:l.oy,hitboxRadius:8}),false));
});

for(const type of ['purple-minion','purple-boss','electric-minion','electric-boss']) test(`${type} adds a half-second dodge window and stops aiming during the final warning`,()=>{
 fresh();let owner;
 if(type.endsWith('boss')) {g.startTierBoss(type.startsWith('purple')?10:9);owner=s.boss;owner.entering=false;owner.x=owner.homeX;owner.attackTimer=100;}
 else {owner=g.spawnWaveEnemy(type.startsWith('purple')?10:9,{enemyIdx:3});owner.entering=false;owner.x=owner.homeX;owner.fireCooldown=100;owner.moveAmpX=owner.moveAmpY=0;}
 if(type==='purple-minion') g.firePurpleCoreCurrent(owner,false);
 if(type==='purple-boss') g.firePurpleCoreCurrent(owner,true);
 if(type==='electric-minion') g.fireElectricEnemyLaser(owner);
 if(type==='electric-boss') g.startElectricBossLasers(owner);
 const l=s.lasers[0],expected=type==='purple-minion'?1.55:type==='purple-boss'?1.85:3.15;
 assert.ok(Math.abs(l.stage1Time+l.stage2Time-expected)<1e-7);assert.equal(l.aimLockTime,0.5);
 l.stage=2;l.stageTimer=0.49;const angle=l.angle;s.player.y=610;
 g.updateGame(0.1);assert.equal(l.stage,2);assert.equal(l.angle,angle);
 g.updateGame(0.38);assert.equal(l.stage,2);assert.equal(l.angle,angle);
 g.updateGame(0.02);assert.equal(l.stage,3);
});

test('Every regular boss has a dedicated health bar, including EMP and electric', () => {
 const ids=new Set();
 for(let tier=1;tier<=10;tier++) {fresh();g.startTierBoss(tier);const id=s.boss.barId;
  assert.equal(id,`Tier_${String(tier).padStart(2,'0')}`);assert.ok(!ids.has(id));ids.add(id);
  for(const part of ['Full','Fill','Empty','Frame']) {
   const file=new URL(`../assets/ui/boss_bars/${id}_${part}.png`,import.meta.url);
   const b=fs.readFileSync(file);assert.equal(b.readUInt32BE(16),64);assert.equal(b.readUInt32BE(20),32);
  }
 }
});
test('All ordinary projectile paths use the new color-classified shapes', () => {
 for(const tier of [1,2,3,4,5,7,9]) {fresh();
  for(let stage=1;stage<=4;stage++) {const e=g.spawnWaveEnemy(tier,{enemyIdx:stage});e.entering=false;e.fireCooldown=0;}
  tick(0.1);
  for(const b of s.enemyBullets) {
   assert.match(b.path,/^bullets\/Colors\/(Red|Orange|Yellow|Lime|Cyan|Blue|Violet|Pink)\/(Orb|Needle)\.png$/);
   assert.ok(fs.existsSync(new URL(`../assets/${b.path}`,import.meta.url)));
  }
 }
});

for(const fps of [30,60]) test(`Chain boss follows a continuous 82-part trail across the map (${fps}fps)`,()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});assert.equal(b.segments.length,82);assert.equal(b.segments[0].kind,'HEAD');
 assert.equal(b.segments.filter(p=>p.kind==='GUN').length,41);assert.equal(b.segments.filter(p=>p.kind==='BLADE').length,40);
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(let n=0;n<30*fps;n++) {
  g.updateGame(1/fps);minX=Math.min(minX,b.x);maxX=Math.max(maxX,b.x);minY=Math.min(minY,b.y);maxY=Math.max(maxY,b.y);
  for(let i=1;i<b.segments.length;i++) {const p=b.segments[i],q=b.segments[i-1],d=Math.hypot(p.x-q.x,p.y-q.y);assert.ok(Number.isFinite(d) && d>=0 && d<=42.01,`connected gap ${d}`);}
 }
 assert.ok(maxX-minX>750);assert.ok(maxY-minY>350);assert.equal(b.barId,'Chain_Boss');
 assert.ok(s.enemyBullets.every(b=>b.path==='bullets/Colors/Red/Orb.png'));
 assert.equal(g.getChainBladeCapsules(b).length,82);
});
test('Chain body takes shared HP damage once per piercing projectile',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true}),part=b.segments[10],hp=b.hp;b.segments.forEach(p=>{p.x=1000;p.y=600;});part.x=700;part.y=300;
 const shot={x:part.x,y:part.y,vx:0,vy:0,radius:6,damage:25,piercing:true,hitTargets:new Set()};
 s.playerBullets.push(shot);g.updatePlayerBullets(0);g.updatePlayerBullets(0);assert.equal(b.hp,hp-12.5);
});
test('Chain blades have contact damage and the encounter resets cleanly',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true}),blade=g.getChainBladeCapsules(b).find(c=>c.b.x>100&&c.b.x<1180&&c.b.y>100&&c.b.y<620);s.player.x=blade.b.x;s.player.y=blade.b.y;s.player.invulnTimer=0;
 g.updateGame(0);assert.equal(s.player.hp,3);g.resetGame();assert.equal(s.boss,null);assert.equal(s.enemyBullets.length,0);
});
test('Skill laser can damage a chain body independently of the head',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true}),part=b.segments[12];part.x=700;part.y=300;s.player.x=40;s.player.y=part.y;
 const hp=b.hp;g.applyPlayerSkillLaserTick();assert.ok(b.hp<hp);
});

test('Chain exits all four edges during survival, attacks at lower density, and remains invulnerable',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true,combat:false,campaign:true});let left=false,right=false,top=false,bottom=false,returned=false,wasOutside=false,sawOrb=false,sawHead=false,sawCurrent=false;
 for(let i=0;i<50*60;i++){g.updateGame(1/60);left ||= b.x<0;right ||= b.x>g.CONFIG.CANVAS_WIDTH;top ||= b.y<0;bottom ||= b.y>g.CONFIG.CANVAS_HEIGHT;
  sawOrb ||= s.enemyBullets.length>0;sawHead ||= s.lasers.some(l=>l.kind==='CHAIN_HEAD');sawCurrent ||= s.lasers.some(l=>l.kind==='CHAIN_CURRENT');assert.equal(new Set(s.lasers.filter(l=>l.kind==='CHAIN_CURRENT').map(l=>l.chainSegmentIndex)).size,s.lasers.filter(l=>l.kind==='CHAIN_CURRENT').length);
  const outside=b.x<0||b.x>g.CONFIG.CANVAS_WIDTH||b.y<0||b.y>g.CONFIG.CANVAS_HEIGHT;if(wasOutside&&!outside)returned=true;wasOutside=outside;
 }
 assert.ok(left&&right&&top&&bottom&&returned);assert.equal(s.enemies.length,0);assert.ok(sawOrb&&sawHead&&sawCurrent);
 const part=b.segments[4],hp=b.hp;s.playerBullets=[{x:part.x,y:part.y,vx:0,vy:0,radius:6,damage:100}];g.updatePlayerBullets(0);g.applyPlayerSkillLaserTick();assert.equal(b.hp,hp);
 s.tierWaveElapsed=59.99;g.updateGame(0.02);assert.equal(s.boss,b);assert.equal(s.phase,'BOSS');assert.equal(b.combat,true);
});
test('Chain head takes three times body damage for ordinary and skill attacks',()=>{
 for(const head of [false,true]) {
  fresh();const b=g.startChainBoss({skipEntrance:true});b.segments.forEach(p=>{p.x=1000;p.y=650;});const part=b.segments[head?0:5];part.x=700;part.y=300;
  s.playerBullets=[{x:700,y:300,vx:0,vy:0,radius:6,damage:20}];g.updatePlayerBullets(0);assert.equal(b.hp,12000-(head?30:10));
  b.hp=12000;s.player.x=100;s.player.y=300;s.player.skills.laser.damagePerTick=20;g.applyPlayerSkillLaserTick();assert.equal(b.hp,12000-(head?30:10));
 }
});
test('Chain forward head laser and thin red core currents follow their moving emitters',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true}),head=g.fireChainLaser(b,0),core=g.fireChainLaser(b,4),angle=head.angle,coreAngle=core.angle;
 assert.equal(head.kind,'CHAIN_HEAD');assert.equal(core.kind,'CHAIN_CURRENT');assert.equal(core.color,'Red');assert.equal(g.getLaserStageThicknessPx(core,3),2);
 assert.equal(core.stage,1);assert.equal(core.damage,1);assert.equal(core.stunDuration,0.3);assert.equal(core.length,2200);
 g.updateGame(0.1);assert.equal(core.ox,b.segments[4].x);assert.equal(core.oy,b.segments[4].y);assert.equal(head.angle,b.segments[0].angle);assert.equal(core.angle,coreAngle);
});
test('Chain saws sway side to side locally, and body bullets travel at 220 pixels per second',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true}),part=b.segments[0];part.x=800;part.y=300;part.angle=-Math.PI/2;
 b.age=0;const a=g.getChainSawPoses(b);b.age=0.2;const c=g.getChainSawPoses(b);
 assert.equal(a[0].y,c[0].y);assert.notEqual(a[0].x,c[0].x);assert.notEqual(a[0].rotation,c[0].rotation);
 b.segments[1].fireCooldown=0;g.updateGame(0);assert.ok(s.enemyBullets.length);assert.ok(s.enemyBullets.every(p=>Math.abs(Math.hypot(p.vx,p.vy)-220)<1e-6));
});

test('Aimed chain rays lock their launch direction while the player moves',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});s.player.x=350;s.player.y=300;
 for(const index of [5]) {
  const l=g.fireChainLaser(b,index),angle=l.angle;
  assert.ok(Math.abs(angle-Math.atan2(s.player.y-l.oy,s.player.x-l.ox))<1e-9);
  s.player.x=650;s.player.y=600;g.updateGame(0.2);assert.equal(l.angle,angle);
  l.stage=3;g.updateGame(0.1);assert.equal(l.angle,angle);
 }
});
test('Chain rays render above the complete body and use the separate knife halves',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true}),l=g.fireChainLaser(b,5);l.stage=3;
 const offset=imageDraws.length,paintOffset=paintOrder.length;g.step(0);const draws=imageDraws.slice(offset);
 const body=g.assets.images.get('bosses/Chain_Boss/Parts/Body_Blade.png'),knife=g.assets.images.get('bosses/Chain_Boss/Parts/Blade.png');
 const ordered=paintOrder.slice(paintOffset);
 assert.ok(ordered.findIndex(d=>d.kind==='ray-end')>ordered.findLastIndex(d=>d.kind==='image'&&d.args[0]===body));
 const cuts=draws.filter(d=>d[0]===knife);assert.ok(cuts.length>0&&cuts.length%2===0);assert.ok(cuts.every(d=>d[1]===8||d[1]===17));assert.ok(cuts.every(d=>d[3]===8));
});

test('Head ray fires forward without aiming at the player; core rays alone aim at the player',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});s.player.x=300;s.player.y=600;
 const head=g.fireChainLaser(b,0);assert.equal(head.angle,b.segments[0].angle);
 s.player.y=100;g.updateGame(0.1);assert.equal(head.angle,b.segments[0].angle);
});

test('Each chain body has independent cooldowns and a full-path harmless electric warning',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});
 const parts=b.segments.slice(1);assert.equal(new Set(parts.map(p=>p.currentBossInterval)).size,81);
 assert.ok(parts.every(p=>p.currentBossInterval===p.currentWaveInterval&&p.currentWaveInterval>=24&&p.currentWaveInterval<=36));
 parts.forEach(p=>p.currentCooldown=100);parts[3].currentCooldown=0;g.updateGame(0);
 const beam=s.lasers.find(l=>l.chainSegmentIndex===4);assert.ok(beam);assert.equal(b.segments[4].currentCooldown,b.segments[4].currentBossInterval);assert.equal(b.segments[5].currentCooldown,100);
 assert.ok(beam.stage1Time+beam.stage2Time>=1.4-1e-8);assert.equal(beam.stage,1);
 const offset=rectDraws.length;g.renderLaserBeam(beam);assert.ok(rectDraws.slice(offset).some(r=>r[3]===14));assert.equal(g.getLaserStageThicknessPx(beam,3),2);
});

for(const combat of [false,true])for(const fps of [30,60]) test(`Chain charges start individually with a real gap and independent cooldowns (${combat?'boss':'wave'}, ${fps}fps)`,()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true,combat});b.headLaserCooldown=100;
 b.segments.slice(1).forEach(p=>p.currentCooldown=100);b.segments[1].currentCooldown=-2;b.segments[2].currentCooldown=-3;
 g.updateGame(0);assert.equal(s.lasers.length,1);assert.equal(s.lasers[0].chainSegmentIndex,2);
 assert.equal(b.segments[2].currentCooldown,combat?b.segments[2].currentBossInterval:b.segments[2].currentWaveInterval);
 assert.equal(b.segments[1].currentCooldown,-2);const gap=b.laserStartGap;
 assert.ok(gap>=1.3&&gap<=1.7);
 let elapsed=0;while(elapsed+1/fps<gap-1e-9){g.updateGame(1/fps);elapsed+=1/fps;assert.ok(!s.lasers.some(l=>l.chainSegmentIndex===1));}
 g.updateGame(1/fps);assert.ok(s.lasers.some(l=>l.chainSegmentIndex===1));
 const cooldown=b.segments[1].currentCooldown,delay=b.laserStartGap;s.mode='PAUSED';g.updateGame(5);
 assert.equal(b.segments[1].currentCooldown,cooldown);assert.equal(b.laserStartGap,delay);
});

for(const fps of [30,60])test(`Chain first enters from the front, fully retreats, then re-enters for combat (${fps}fps)`,()=>{
 fresh();const b=g.startChainBoss({combat:false,campaign:true});
 assert.equal(b.pathState,'WAVE_ENTER');assert.ok(b.segments.every(p=>p.x>g.CONFIG.CANVAS_WIDTH));assert.equal(b.entering,true);
 tick(1.3,fps);assert.equal(b.pathState,'ROAM');assert.ok(b.segments.some(p=>p.x<g.CONFIG.CANVAS_WIDTH));
 s.tierWaveElapsed=59.99;g.updateGame(0.02);assert.equal(b.pathState,'RETREAT');assert.equal(b.entering,true);
 assert.equal(s.phase,'BOSS');assert.equal(s.lasers.length,0);const hp=b.hp;g.applyPlayerSkillLaserTick();assert.equal(b.hp,hp);
 let elapsed=0;while(b.pathState==='RETREAT'&&elapsed<12){g.updateGame(1/fps);elapsed+=1/fps;}
 assert.equal(b.pathState,'BOSS_ENTER');assert.ok(b.segments.every(p=>p.x>g.CONFIG.CANVAS_WIDTH));
 tick(1.3,fps);assert.equal(b.pathState,'ROAM');assert.equal(b.entering,false);assert.equal(b.combat,true);assert.equal(b.hp,hp);
});
for(const fps of [30,60])test(`Chain phase two retreats invulnerably at 40%, grows offscreen, and starts from the front (${fps}fps)`,()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.401;g.updateGame(0);assert.equal(b.phase2Triggered,false);
 b.hp=b.maxHp*0.4;g.updateGame(0);assert.equal(b.pathState,'P2_RETREAT');assert.equal(b.entering,true);assert.equal(b.segments.length,82);
 const hp=b.hp;s.player.x=b.x-100;s.player.y=b.y;g.applyPlayerSkillLaserTick();assert.equal(b.hp,hp);
 let time=0;while(!b.growthDone&&time<35){const x=b.x,y=b.y;g.updateGame(1/fps);time+=1/fps;
  if(!b.growthDone){assert.equal(b.segments.length,82);assert.ok(Math.hypot(b.x-x,b.y-y)<=420/fps+0.1);}
 }
 assert.equal(b.growthDone,true);assert.equal(b.segments.length,1400);assert.ok(b.segments.every(p=>p.x>g.CONFIG.CANVAS_WIDTH));
 assert.equal(b.pathState,'P2_TRANSIT');assert.equal(b.usedRushZones[0],1);assert.equal(b.entering,true);
 while(b.pathState!=='P2_AIM'&&time<45){g.updateGame(1/fps);time+=1/fps;}
 assert.equal(b.pathState,'P2_AIM');assert.equal(b.entering,false);assert.equal(b.rushSource.x,g.CONFIG.CANVAS_WIDTH+180);
});
for(const fps of [30,60])test(`Five continuous corridors survive the return, then the head starts lasers (${fps}fps)`,()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.updateGame(0);
 let elapsed=0;
 while(b.pathState!=='P2_LASER'&&elapsed<150){
  const x=b.x,y=b.y,phase=b.pathState,grown=b.growthDone;g.updateGame(1/fps);elapsed+=1/fps;
  if(phase!==b.pathState&&['P2_TRANSIT','P2_RETURN'].includes(b.pathState)&&b.rushCount>0){const end=b.travelCurve.at(-1);for(const point of b.travelCurve)if(point.x>0&&point.x<g.CONFIG.CANVAS_WIDTH&&point.y>0&&point.y<g.CONFIG.CANVAS_HEIGHT)assert.ok(Math.hypot(point.x-end.x,point.y-end.y)<280,'return crossed the arena');}
  if(grown===b.growthDone)assert.ok(Math.hypot(b.x-x,b.y-y)<=(['P2_DASH','P2_EXIT'].includes(phase)?1500:phase==='P2_RETREAT'?420:560)/fps+0.1,`head jumped during ${phase}`);
  for(let i=1;i<b.segments.length;i++) {
    const p=b.segments[i],a=b.segments[i-1],distance=Math.hypot(p.x-a.x,p.y-a.y);
    assert.ok(distance<=42.02&&distance>1,`offscreen bend collapsed at ${i}: ${distance}`);
    if(p.x>60&&p.x<g.CONFIG.CANVAS_WIDTH-60&&p.y>60&&p.y<g.CONFIG.CANVAS_HEIGHT-60)assert.ok(Math.abs(distance-42)<0.02,`straight corridor spacing changed at ${i}: ${distance}`);
  }
 }
 assert.equal(b.pathState,'P2_LASER');assert.equal(b.rushCount,5);assert.equal(b.corridors.length,5);assert.equal(new Set(b.usedRushZones).size,4);assert.equal(b.usedRushZones[0],1);
 for(const corridor of b.corridors){const dx=corridor.end.x-corridor.start.x,dy=corridor.end.y-corridor.start.y,len=dx*dx+dy*dy;
  const count=b.segments.slice(1).filter(p=>{const t=((p.x-corridor.start.x)*dx+(p.y-corridor.start.y)*dy)/len;return t>=0&&t<=1&&Math.hypot(p.x-corridor.start.x-t*dx,p.y-corridor.start.y-t*dy)<2;}).length;
  assert.ok(count>=4,`corridor disappeared: ${count} joints`);
 }
 assert.ok(s.enemyBullets.length<=16);assert.ok(s.lasers.filter(l=>l.kind==='CHAIN_CURRENT').length<=2);
 tick(4,fps);assert.equal(b.rushCount,5);assert.ok(s.lasers.some(l=>l.kind==='CHAIN_HEAD')||b.headLaserCooldown<10);
 g.handleBossDefeated();assert.equal(s.boss,null);assert.equal(s.lasers.length,0);
});
test('Phase two body corridors pass ordinary and piercing shots without damaging boss health',()=>{
 for(const piercing of [false,true]){
  fresh();const b=g.startChainBoss({skipEntrance:true});b.phase2Triggered=true;b.pathState='P2_LASER';
  b.segments.forEach(p=>{p.x=1100;p.y=650;});b.segments[0].x=900;b.segments[0].y=150;b.segments[1].x=700;b.segments[1].y=300;
  const hp=b.hp,shot={x:650,y:300,vx:100,vy:0,radius:6,damage:20,piercing,hitTargets:new Set()};s.playerBullets=[shot];
  g.updatePlayerBullets(0.5);assert.equal(b.hp,hp);assert.ok(s.playerBullets.includes(shot));assert.equal(shot.hitTargets.size,0);
  s.player.x=100;s.player.y=300;s.player.skills.laser.damagePerTick=20;g.applyPlayerSkillLaserTick();assert.equal(b.hp,hp);
  shot.x=900;shot.y=150;g.updatePlayerBullets(0);assert.equal(b.hp,hp-30);
 }
});
test('Chain normal movement replans different player-relative routes instead of repeating a fixed orbit',()=>{
 fresh();let b=g.startChainBoss({skipEntrance:true});g.updateGame(0);const first=JSON.stringify(b.travelCurve);
 fresh();b=g.startChainBoss({skipEntrance:true});g.updateGame(0);assert.notEqual(JSON.stringify(b.travelCurve),first);
 const routes=b.roamRoutes;tick(25);assert.ok(b.roamRoutes>routes);
});
test('Phase two aim locks before the rush and pauses without advancing',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.updateGame(0);
 for(let t=0;t<45&&b.pathState!=='P2_AIM';t+=1/60)g.updateGame(1/60);
 while(b.pathState==='P2_AIM'&&!b.rushAimLocked)g.updateGame(1/60);
 assert.equal(b.pathState,'P2_AIM');const angle=b.segments[0].angle;s.player.y=650;g.updateGame(0.1);assert.equal(b.segments[0].angle,angle);
 const timer=b.rushTimer,x=b.x;s.mode='PAUSED';g.updateGame(5);assert.equal(b.rushTimer,timer);assert.equal(b.x,x);
});

test('Completed-corridor preview restores normal player damage and a safe playable starting point',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.beginChainPhase2(b);g.previewChainCorridors(b);
 assert.equal(b.pathState,'P2_LASER');assert.equal(s.player.hp,s.player.maxHp);assert.equal(s.player.invulnTimer,0);assert.equal(s.debugInvincible,false);
 assert.ok(b.segments.every(part=>Math.hypot(s.player.x-part.x,s.player.y-part.y)>=42));assert.equal(s.player.fireCooldown,0.15);
});

test('Completed phase two has straight visible corridors and a long offscreen neck for vertical head movement',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.beginChainPhase2(b);g.previewChainCorridors(b);s.player.invulnTimer=1e6;s.player.fireCooldown=1e6;
 assert.equal(b.pathState,'P2_LASER');b.frontStrikeCooldown=100;assert.ok(b.frontJoint.x>=g.CONFIG.CANVAS_WIDTH+1500);
 let minY=b.y,maxY=b.y;
 for(let frame=0;frame<12*60;frame++) {
  g.updateGame(1/60);minY=Math.min(minY,b.y);maxY=Math.max(maxY,b.y);
  for(let i=1;i<b.segments.length-1;i++) {
   const p=b.segments[i];if(p.x<0||p.x>g.CONFIG.CANVAS_WIDTH||p.y<0||p.y>g.CONFIG.CANVAS_HEIGHT)continue;
   const a=b.segments[i-1],c=b.segments[i+1],dot=((a.x-p.x)*(p.x-c.x)+(a.y-p.y)*(p.y-c.y))/(42*42);
   assert.ok(dot>0.9999,`visible bend at ${i}: ${dot}`);
  }
 }
 assert.ok(maxY-minY>150);assert.equal(b.corridors.length,5);
});
test('Phase two restores sparse visible-body bullets and independently charged thin currents',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.beginChainPhase2(b);g.previewChainCorridors(b);s.player.invulnTimer=1e6;
 s.enemyBullets=[];s.lasers=[];b.headLaserCooldown=100;b.laserStartGap=0;b.p2BulletGap=0;b.p2BodyLaserGap=0;
 const gun=b.segments.find((p,i)=>p.kind==='GUN'&&p.x>50&&p.x<g.CONFIG.CANVAS_WIDTH-50&&p.y>50&&p.y<g.CONFIG.CANVAS_HEIGHT-50&&g.isChainCorridorPart(b,p,i));assert.ok(gun);
 b.segments.forEach(p=>{p.fireCooldown=100;p.currentCooldown=100;});gun.fireCooldown=0;gun.currentCooldown=0;
 g.updateGame(0);assert.equal(s.enemyBullets.length,2);assert.equal(s.lasers.filter(l=>l.kind==='CHAIN_CURRENT').length,1);
 assert.ok(b.p2BulletGap>=0.8&&b.p2BulletGap<=1.2);assert.ok(b.p2BodyLaserGap>=1.6&&b.p2BodyLaserGap<=2.2);
 const beam=s.lasers[0];assert.equal(beam.stage,1);assert.equal(beam.stunDuration,0.3);assert.equal(g.getLaserStageThicknessPx(beam,3),2);
 tick(0.6);assert.ok(s.enemyBullets.length<=2);assert.equal(s.lasers.filter(l=>l.kind==='CHAIN_CURRENT').length,1);
});

test('The front head continuously bobs between lunges while attacking, without target-wait pauses',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.beginChainPhase2(b);g.previewChainCorridors(b);s.player.invulnTimer=1e6;s.player.fireCooldown=1e6;
 b.frontStrikeCooldown=100;
 let stalled=0,maxStalled=0,sign=0,reversals=0,movedDuringBeam=false;
 for(let i=0;i<13*60;i++){const y=b.y;g.updateGame(1/60);const dy=b.y-y;
  if(Math.abs(dy)<0.01){stalled++;maxStalled=Math.max(maxStalled,stalled);}else{stalled=0;const next=Math.sign(dy);if(sign&&next!==sign)reversals++;sign=next;}
  if(s.lasers.some(l=>l.kind==='CHAIN_HEAD'&&l.stage===3)&&Math.abs(dy)>0.05)movedDuringBeam=true;
 }
 assert.ok(maxStalled<=4);assert.ok(reversals>=2);assert.ok(movedDuringBeam);
});
test('Phase-two bullets and current originate from actual corridor hull ports, not spare neck segments',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.beginChainPhase2(b);g.previewChainCorridors(b);s.player.invulnTimer=1e6;
 s.enemyBullets=[];s.lasers=[];b.headLaserCooldown=100;b.laserStartGap=0;b.p2BulletGap=0;b.p2BodyLaserGap=0;
 const visible=p=>p.x>30&&p.x<g.CONFIG.CANVAS_WIDTH-30&&p.y>30&&p.y<g.CONFIG.CANVAS_HEIGHT-30;
 const corridor=b.segments.find((p,i)=>p.kind==='GUN'&&visible(p)&&g.isChainCorridorPart(b,p,i));
 const neck=b.segments.find((p,i)=>i>0&&i<=b.frontNeckCount&&p.kind==='GUN'&&visible(p));assert.ok(corridor&&neck);
 b.segments.forEach(p=>{p.fireCooldown=100;p.currentCooldown=100;});neck.fireCooldown=-1000;neck.currentCooldown=-1000;corridor.fireCooldown=0;corridor.currentCooldown=0;
 g.updateGame(0);assert.equal(s.enemyBullets.length,2);
 const [a,c]=s.enemyBullets;assert.ok(Math.abs((a.x+c.x)/2-corridor.x)<1);assert.ok(Math.abs((a.y+c.y)/2-corridor.y)<1);
 for(const bullet of s.enemyBullets){assert.ok(Math.abs(Math.hypot(bullet.x-corridor.x,bullet.y-corridor.y)-30)<1);assert.ok((bullet.x-corridor.x)*bullet.vx+(bullet.y-corridor.y)*bullet.vy>0);}
 const beam=s.lasers.find(l=>l.kind==='CHAIN_CURRENT');assert.ok(beam);assert.equal(beam.chainSegmentIndex,b.segments.indexOf(corridor));assert.equal(beam.ox,corridor.x);assert.equal(beam.oy,corridor.y);
 assert.equal(neck.currentCooldown,-1000);
});
test('Post-rush spare neck prevents an aim-transition snap and dash speed eases down continuously',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.beginChainPhase2(b);
 let aims=0,checkedSecondAim=false,exitFrames=0,previousSpeed=1501,firstSpeed=0,lastSpeed=0;
 for(let t=0;t<100&&!checkedSecondAim;t+=1/60){
  const phase=b.pathState,x=b.x,y=b.y,newAim=phase==='P2_AIM'&&b.rushTimer===0;
  const visible=(phase==='P2_TRANSIT'||newAim)?b.segments.map((p,i)=>({i,x:p.x,y:p.y})).filter(p=>p.x>0&&p.x<g.CONFIG.CANVAS_WIDTH&&p.y>0&&p.y<g.CONFIG.CANVAS_HEIGHT):[];
  g.updateGame(1/60);
  if(phase==='P2_EXIT'){const speed=Math.hypot(b.x-x,b.y-y)*60;if(!exitFrames)firstSpeed=speed;assert.ok(speed<=previousSpeed+0.01);previousSpeed=speed;lastSpeed=speed;exitFrames++;}
  if(phase==='P2_TRANSIT'&&b.pathState==='P2_AIM'){aims++;assert.ok(b.aimNeckCount>=12);assert.ok(Math.hypot(b.x-x,b.y-y)*60<120);if(aims===2)for(const p of visible)assert.ok(Math.hypot(b.segments[p.i].x-p.x,b.segments[p.i].y-p.y)<20,'corridor body snapped during aim entry');}
  if(newAim&&aims===2){for(const p of visible)assert.ok(Math.hypot(b.segments[p.i].x-p.x,b.segments[p.i].y-p.y)<20,'corridor body snapped when the spare neck engaged');checkedSecondAim=true;}
 }
 assert.equal(aims,2);assert.ok(checkedSecondAim);assert.ok(exitFrames>30);assert.ok(firstSpeed>1400&&lastSpeed<570);
});

for(const fps of [30,60])test(`Five-rush body motion stays continuous through returns and aiming (${fps}fps)`,()=>{
 vm.runInContext(`globalThis.motionSeed=${fps===30?1:8};globalThis.savedMotionRandom=Math.random;Math.random=()=>{motionSeed=(motionSeed*1664525+1013904223)>>>0;return motionSeed/4294967296}`,context);
 try {
  fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.beginChainPhase2(b);
  let frontFrames=0;
  for(let t=0;t<130&&frontFrames<fps*3;t+=1/fps) {
   const phase=b.pathState,old=b.growthDone?b.segments.map(p=>({x:p.x,y:p.y})):[];
   g.updateGame(1/fps);
   const maximum=['P2_DASH','P2_EXIT'].includes(phase)?1500:phase==='P2_AIM'?80:phase==='P2_LASER'?450:560;
   if(old.length&&b.growthDone)for(let i=1;i<old.length;i++) {
    const p=old[i];if(p.x<0||p.x>1284||p.y<0||p.y>724)continue;
    assert.ok(Math.hypot(b.segments[i].x-p.x,b.segments[i].y-p.y)<=maximum/fps+0.6,`visible hull jumped in ${phase} at ${i}`);
   }
   if(b.pathState==='P2_LASER')frontFrames++;
  }
  assert.equal(b.rushCount,5);assert.equal(b.corridors.length,5);assert.ok(frontFrames>=fps*3);
  assert.equal(new Set(b.usedRushZones.slice(0,4)).size,4);
  assert.notEqual(b.usedRushZones[3],b.usedRushZones[4]);
 } finally {vm.runInContext('Math.random=globalThis.savedMotionRandom',context);}
});
test('Completed corridors attack at a measured moderate rate with bullet limits and visible laser warnings',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.beginChainPhase2(b);g.previewChainCorridors(b);
 s.player.invulnTimer=1e6;s.player.fireCooldown=1e6;s.enemyBullets=[];s.lasers=[];b.headLaserCooldown=100;
 b.segments.forEach(p=>{p.fireCooldown=0;p.currentCooldown=0;});b.p2BulletGap=b.p2BodyLaserGap=b.laserStartGap=0;
 b.frontStrikeCooldown=100;
 const shots=new Set(),beams=new Set();
 for(let i=0;i<20*30;i++) {
  g.updateGame(1/30);assert.ok(s.enemyBullets.length<=16);
  for(const shot of s.enemyBullets)shots.add(shot);
  for(const beam of s.lasers.filter(l=>l.kind==='CHAIN_CURRENT')){if(!beams.has(beam))assert.equal(beam.stage,1);beams.add(beam);}
 }
 assert.ok(shots.size>=28&&shots.size<=52,`20-second bullet count: ${shots.size}`);
 assert.ok(beams.size>=8&&beams.size<=14,`20-second current count: ${beams.size}`);
});

test('Chain current draws one uninterrupted full-length electric path without sprite seams',()=>{
 fresh();const points=g.getChainCurrentPoints(2200,1.4);
 assert.equal(points[0].x,0);assert.equal(points.at(-1).x,2200);
 for(let i=1;i<points.length;i++){assert.ok(points[i].x>points[i-1].x);assert.ok(points[i].x-points[i-1].x<=12);assert.ok(Math.abs(points[i].y)<=2);}
 assert.notEqual(JSON.stringify(points),JSON.stringify(g.getChainCurrentPoints(2200,1.6)));
 const before=imageDraws.length;g.renderLaserBeam({kind:'CHAIN_CURRENT',stage:3,length:2200,elapsed:1.4,ox:900,oy:300,angle:Math.PI});
 assert.equal(imageDraws.length,before,'thin current must not tile or squash sprite strips');
});
for(const fps of [30,60])test(`Front head telegraphs a locked short lunge, returns smoothly and repeats (${fps}fps)`,()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.beginChainPhase2(b);g.previewChainCorridors(b);
 s.player.invulnTimer=1e6;s.player.fireCooldown=1e6;s.enemyBullets=[];s.lasers=[];
 s.player.x=180;s.player.y=100;const x=b.x,y=b.y;
 g.fireChainLaser(b);assert.ok(s.lasers.some(l=>l.kind==='CHAIN_HEAD'));
 assert.equal(g.beginChainFrontStrike(b),true);assert.equal(g.beginChainFrontStrike(b),false);
 assert.equal(b.frontStrike.phase,'WARN');assert.ok(b.frontStrike.distance<=650);assert.equal(s.lasers.filter(l=>l.kind==='CHAIN_HEAD').length,0);
 const end={...b.frontStrike.end};s.player.y=650;
 tick(0.5,fps);assert.equal(b.x,x);assert.equal(b.y,y);assert.equal(b.frontStrike.end.y,end.y);
 const timer=b.frontStrike.timer;s.mode='PAUSED';g.updateGame(3);assert.equal(b.frontStrike.timer,timer);s.mode='PLAYING';
 let furthest=0,seenOut=false,seenRecoil=false,recoilSeconds=0,peakRecoil=0,peakOut=0,lastOut=0;
 for(let t=0;t<10&&b.frontStrike;t+=1/fps){
  const phase=b.frontStrike.phase,oldX=b.x,oldY=b.y;g.updateGame(1/fps);const speed=Math.hypot(b.x-oldX,b.y-oldY)*fps;
  if(phase==='RECOIL'){recoilSeconds+=1/fps;peakRecoil=Math.max(peakRecoil,speed);}
  if(phase==='OUT'){peakOut=Math.max(peakOut,speed);lastOut=speed;}
  furthest=Math.max(furthest,Math.hypot(b.x-x,b.y-y));
  assert.ok(Math.hypot(b.x-oldX,b.y-oldY)<=1100/fps+0.1);
  seenOut ||= b.frontStrike?.phase==='OUT';seenRecoil ||= b.frontStrike?.phase==='RECOIL';
  assert.equal(s.lasers.filter(l=>l.kind==='CHAIN_HEAD').length,0);
 }
 assert.ok(seenOut&&seenRecoil&&furthest>400);assert.equal(b.frontStrike,null);
 assert.ok(recoilSeconds>3&&peakRecoil<=340.1&&peakOut>700&&lastOut<peakOut*.5);
 assert.ok(Math.hypot(b.x-x,b.y-y)<0.01);assert.ok(b.frontStrikeCooldown>=11&&b.frontStrikeCooldown<=14);
 assert.equal(b.rushCount,5);assert.equal(b.corridors.length,5);
 b.frontStrikeCooldown=0;g.updateGame(1/fps);assert.equal(b.frontStrike.phase,'WARN');
});

for(const fps of [30,60])test(`Chain whip bends with inertia and sweeps both vertical edges around its hidden pivot (${fps}fps)`,()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*0.4;g.beginChainPhase2(b);g.previewChainCorridors(b);
 s.player.invulnTimer=1e6;s.player.fireCooldown=1e6;
 g.beginChainFrontStrike(b,'WHIP');assert.equal(b.frontStrike.type,'WHIP');assert.equal(b.frontStrike.phase,'WARN');
 tick(1.15,fps);assert.equal(b.frontStrike.phase,'SWING');
 const strike=b.frontStrike,index=strike.pivotIndex,pivot={...strike.pivot},tail=b.segments.slice(index).map(p=>({x:p.x,y:p.y}));
 assert.ok(pivot.x>g.CONFIG.CANVAS_WIDTH);assert.ok(index>3);
 let minY=b.y,maxY=b.y,maxLag=0,swingSeconds=0;
 while(b.frontStrike?.phase==='SWING') {
  swingSeconds+=1/fps;g.updateGame(1/fps);minY=Math.min(minY,b.y);maxY=Math.max(maxY,b.y);
  maxLag=Math.max(maxLag,Math.abs(strike.whipAngles[0]-strike.whipAngles.at(-1)));
  assert.ok(Math.hypot(b.segments[index].x-pivot.x,b.segments[index].y-pivot.y)<0.001);
  for(let i=0;i<tail.length;i++)assert.ok(Math.hypot(b.segments[index+i].x-tail[i].x,b.segments[index+i].y-tail[i].y)<0.001);
  for(let i=1;i<=index;i++)assert.ok(Math.abs(Math.hypot(b.segments[i].x-b.segments[i-1].x,b.segments[i].y-b.segments[i-1].y)-42)<0.05);
 }
 assert.ok(swingSeconds>2.7&&swingSeconds<3.3);
 assert.ok(minY<70&&maxY>g.CONFIG.CANVAS_HEIGHT-70,`vertical sweep ${minY}..${maxY}`);assert.ok(maxLag>0.15);assert.equal(b.rushCount,5);assert.equal(b.corridors.length,5);
 tick(9,fps);assert.equal(b.frontStrike,null);assert.equal(b.nextFrontAttack,'LUNGE');
});

for(const fps of [30,60])test(`Lunge and whip restore a straight canonical front neck without accumulating folds (${fps}fps)`,()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*.5;g.beginChainPhase2(b);g.previewChainCorridors(b);
 s.player.invulnTimer=1e6;s.player.fireCooldown=1e6;
 for(const type of ['LUNGE','WHIP','LUNGE']) {
  g.beginChainFrontStrike(b,type);const rest=b.frontNeck.rest.map(p=>({x:p.x,y:p.y})),n=b.frontNeck.count;
  let elapsed=0,lastReturnSpeed=0;
  while(b.frontStrike&&elapsed<14) {
   const phase=b.frontStrike.phase,x=b.x,y=b.y;g.updateGame(1/fps);elapsed+=1/fps;
   if(phase==='RECOIL') {const speed=Math.hypot(b.x-x,b.y-y)*fps;assert.ok(speed<=340.1);lastReturnSpeed=speed;}
   assert.notEqual(b.frontStrike?.phase,'RETURN');
  }
  assert.equal(b.frontStrike,null);assert.equal(b.frontNeck,null);assert.ok(lastReturnSpeed<100);
  for(let i=0;i<=n;i++)assert.ok(Math.hypot(b.segments[i].x-rest[i].x,b.segments[i].y-rest[i].y)<0.001,`neck did not restore at ${i}`);
  const head=b.segments[0],first=b.segments[1],dx=first.x-head.x,dy=first.y-head.y;
  for(let i=2;i<=b.frontNeckCount;i++)if(b.segments[i].x<g.CONFIG.CANVAS_WIDTH)assert.ok(Math.abs((b.segments[i].x-head.x)*dy-(b.segments[i].y-head.y)*dx)<0.01);
 }
});

test('Whip spring simulation is stable across frame rates, keeps link length, and dissipates recoil energy',()=>{
 const snapshots=[];
 for(const fps of [30,60]) {
  const segments=Array.from({length:17},(_,i)=>({x:900+i*42,y:362,angle:Math.PI}));
  const boss={segments},strike={pivotIndex:16,pivot:{x:segments[16].x,y:362},poses:segments.map(p=>({...p}))};
  g.initializeChainWhipPhysics(strike);
  let minY=362,maxY=362;
  for(let frame=0;frame<4.2*fps;frame++) {
   g.advanceChainWhipPhysics(boss,strike,1/fps);minY=Math.min(minY,segments[0].y);maxY=Math.max(maxY,segments[0].y);
   for(let i=1;i<segments.length;i++)assert.ok(Math.abs(Math.hypot(segments[i].x-segments[i-1].x,segments[i].y-segments[i-1].y)-42)<1e-7);
  }
  assert.ok(minY<70&&maxY>654);assert.ok(Math.abs(strike.whipAngles.at(-1))>0.01,'tip should retain inertia when the root stops');
  snapshots.push(segments.map(p=>({x:p.x,y:p.y})));
  const energy=()=>{
   let sum=0;for(let j=1;j<strike.whipAngles.length;j++){const mass=1+j/(strike.whipAngles.length-1);sum+=.5*mass*strike.whipVelocity[j]**2+600*(strike.whipAngles[j]-strike.whipAngles[j-1])**2;}return sum;
  };
  const before=energy();for(let i=0;i<2*fps;i++)g.advanceChainWhipPhysics(boss,strike,1/fps);
  assert.ok(energy()<before*.8,'damping should remove residual swing energy');
 }
 for(let i=0;i<snapshots[0].length;i++)assert.ok(Math.hypot(snapshots[0][i].x-snapshots[1][i].x,snapshots[0][i].y-snapshots[1][i].y)<0.1);
});

for(const fps of [30,60])test(`Whip settles in place without a turn-around and dash spare links stay hidden (${fps}fps)`,()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*.4;g.beginChainPhase2(b);g.previewChainCorridors(b);
 s.player.invulnTimer=1e6;s.player.fireCooldown=1e6;
 for(const type of ['WHIP','LUNGE']) {
  g.beginChainFrontStrike(b,type);let settled=false;
  for(let time=0;b.frontStrike&&time<14;time+=1/fps) {
   const phase=b.frontStrike.phase,old=b.segments.map(p=>({x:p.x,y:p.y}));
   g.updateGame(1/fps);assert.notEqual(b.frontStrike?.phase,'RETURN');
   if(type==='WHIP')settled ||= b.frontStrike?.phase==='SETTLE';
   if(type==='LUNGE'&&b.frontNeck&&['OUT','RECOIL'].includes(b.frontStrike?.phase)) {
    for(let i=b.frontNeck.visibleRootIndex+1;i<=b.frontNeck.count;i++)assert.ok(b.segments[i].x>=g.CONFIG.CANVAS_WIDTH+100,'offscreen reserve protruded into the arena');
   }
   if(phase==='RECOVER')for(let i=0;i<old.length;i++)if(old[i].x>0&&old[i].x<1284&&old[i].y>0&&old[i].y<724)assert.ok(Math.hypot(b.segments[i].x-old[i].x,b.segments[i].y-old[i].y)<1500/fps+1,'recovery visibly popped');
  }
  assert.equal(b.frontStrike,null);if(type==='WHIP')assert.ok(settled);
 }
});
test('Front patrol reaches both vertical ends quickly with changing speed, and pauses cleanly',()=>{
 fresh();const b=g.startChainBoss({skipEntrance:true});b.hp=b.maxHp*.4;g.beginChainPhase2(b);g.previewChainCorridors(b);
 s.player.invulnTimer=1e6;s.player.fireCooldown=1e6;b.frontStrikeCooldown=100;
 let min=b.y,max=b.y,peakSpeed=0;const speeds=new Set();
 for(let i=0;i<12*60;i++){const y=b.y,oldSpeed=b.frontPatrol.speed;g.updateGame(1/60);assert.ok(Math.abs(b.frontPatrol.speed-oldSpeed)<6,'patrol speed changed abruptly');min=Math.min(min,b.y);max=Math.max(max,b.y);peakSpeed=Math.max(peakSpeed,Math.abs(b.y-y)*60);speeds.add(Math.round(b.frontPatrol.speed));}
 assert.equal(min,76);assert.equal(max,648);assert.ok(peakSpeed>260&&peakSpeed<=380.1);assert.ok(speeds.size>4);
 const y=b.y,velocity=b.frontPatrol.velocity;s.mode='PAUSED';g.updateGame(3);assert.equal(b.y,y);assert.equal(b.frontPatrol.velocity,velocity);
});

test('Requested boss health applies to fleet, error and final form, including the skill one-third rule',()=>{
 for(const [tier,hp] of [[8,10000],[12,10000]]) {
  fresh();s.currentTier=tier;g.startTierBoss(tier);assert.equal(s.boss.hp,hp);assert.equal(s.boss.maxHp,hp);
 }
 fresh();g.startRevealedFinalBoss();assert.equal(s.boss.hp,20000);assert.equal(s.boss.maxHp,20000);
 assert.equal(g.getSkillStats(4).laserTotal,20000/3);
});
test('Every ordinary minion grows by displayed stage and tech, including reordered and reused tiers',()=>{
 const previous=[0,0,0,0];
 for(let stage=1;stage<=12;stage++) {
  const tier=g.getPatternTier(stage);fresh();g.jumpToTierWave(tier);
  for(let tech=1;tech<=4;tech++) {
   const expected=2*Math.ceil(34*Math.pow(1.25,stage-1)*[1,1.35,1.8,2.4][tech-1]);
   const hp=g.getEnemyMaxHp(tier,tech);assert.equal(hp,expected);assert.ok(hp>previous[tech-1]);previous[tech-1]=hp;
   if(tech>1)assert.ok(hp>g.getEnemyMaxHp(tier,tech-1));
   if(tier!==11 && tier!==12) {const e=g.spawnWaveEnemy(tier,{enemyIdx:tech});assert.equal(e.hp,expected);assert.equal(e.maxHp,expected);}
  }
 }
 fresh();g.jumpToTierWave(12);
 for(let variant=1;variant<=6;variant++)assert.equal(g.spawnWaveEnemy(12,{errorVariant:variant}).maxHp,[900,1200,1200,1200,1200,800][variant-1]);
});

test('Error wave has six final-tech variants with original pattern identities and dedicated sprites',()=>{
 fresh();g.jumpToTierWave(12);
 assert.equal(g.getPatternTier(12),12);assert.equal(g.getStageNumber(8),11);
 const expected=[7,5,8,6,9,10];
 for(let variant=1;variant<=6;variant++) {
  const enemy=g.spawnWaveEnemy(12,{errorVariant:variant});
  assert.equal(enemy.tier,expected[variant-1]);assert.equal(enemy.enemyIdx,4);
  assert.equal(enemy.stageTier,12);assert.equal(enemy.glitch,true);
  assert.equal(enemy.path,`enemies/Tier_12/Enemy_0${variant}.png`);
  const hp=[900,1200,1200,1200,1200,800][variant-1];
  assert.equal(enemy.maxHp,hp);assert.equal(enemy.hp,hp);
  assert.ok(g.assets.images.has(enemy.path));
 }
 assert.equal(s.enemies[2].specialState,'FLYBY_WARN');
});
test('Error attacks retain original projectile, laser, electric-pair, EMP and suicide behavior',()=>{
 for(const variant of [1,2,3,4,5,6]) {
  fresh();g.jumpToTierWave(12);s.phase='TEST';
  const enemy=g.spawnWaveEnemy(12,{errorVariant:variant});enemy.entering=false;
  enemy.x=enemy.homeX;enemy.specialState='NORMAL';
  g.fireEnemyPattern(enemy);
  if(variant===1 || variant===6) {assert.ok(s.lasers.length>0);assert.ok(s.lasers.every(b=>b.glitch));}
  else if(variant===5) {assert.equal(s.electricVolleys.length,1);assert.equal(s.electricVolleys[0].glitch,true);assert.equal(s.electricVolleys[0].orbs.length,2);}
  else {assert.ok(s.enemyBullets.length>0);assert.ok(s.enemyBullets.every(b=>b.glitch));}
  if(variant===4) {g.beginEnemySuicide(enemy);assert.equal(enemy.specialState,'SUICIDE_APPROACH');}
  if(variant===2) {enemy.specialCooldown=0;g.updateGame(0.01);assert.equal(enemy.specialState,'DASH_WARN');}
 }
 fresh();g.spawnEnemyBullet(900,100,-200,0);assert.equal(s.enemyBullets[0].glitch,false);
});
test('Error signal interference lasts five seconds, pauses, clears outside its wave, and renders without mutation',()=>{
 fresh();g.jumpToTierWave(12);s.phase='TEST';
 s.errorFx.cooldown=0.01;g.updateGame(0.02);assert.equal(s.errorFx.remaining,5);
 s.mode='PAUSED';g.updateGame(2);assert.equal(s.errorFx.remaining,5);
 s.mode='PLAYING';g.updateGame(0.25);assert.equal(s.errorFx.remaining,4.75);
 const before=JSON.stringify(s.errorFx);g.renderGame();g.renderGame();assert.equal(JSON.stringify(s.errorFx),before);
 g.updateErrorEffects(4.75);assert.equal(s.errorFx.remaining,0);assert.ok(s.errorFx.cooldown>=12);
 g.startTierBoss(12);g.updateErrorEffects(0.01);assert.equal(s.errorFx.remaining,0);
 g.jumpToTierWave(1);g.updateErrorEffects(0.01);assert.equal(s.errorFx.remaining,0);
});
test('A complete error wave advances naturally to its boss and clears signal interference',()=>{
 fresh();g.jumpToTierWave(12);s.debugInvincible=true;s.player.fireCooldown=1e6;
 tick(60.2);assert.equal(s.phase,'BOSS');assert.equal(s.boss.tier,12);
 assert.equal(s.errorFx.remaining,0);assert.equal(s.tierWaveElapsed,60);
});
test('Error boss moves and takes damage with its own original-shaped pixel health bar',()=>{
 fresh();s.currentTier=12;g.startTierBoss(12);const boss=s.boss;
 boss.entering=false;boss.x=boss.homeX;const y=boss.y;
 g.updateGame(0.5);assert.notEqual(boss.y,y);assert.equal(boss.prototype,false);
 assert.equal(boss.barId,'Tier_12');assert.equal(boss.path,'bosses/Tier_12/Boss.png');
 assert.equal(s.lasers.length,0);assert.equal(s.enemyBullets.length,0);
 const m=g.getPlayerSkillLaserOrigin();boss.x=950;boss.y=m.y;boss.hp=1000;
 g.applyPlayerSkillLaserTick();assert.ok(boss.hp<1000);
 const full=fs.readFileSync(fileURLToPath(new URL('../assets/ui/boss_bars/Tier_12_Full.png',import.meta.url)));
 assert.equal(full.readUInt32BE(16),64);assert.equal(full.readUInt32BE(20),32);
});

function errorBossTest() {
 fresh();s.currentTier=12;g.startTierBoss(12);const boss=s.boss;
 boss.entering=false;boss.x=boss.homeX;boss.errorWaveCooldown=100;boss.errorTeleportCooldown=100;
 return boss;
}
for(const fps of [30,60]) {
 test(`Error boss sustains capped bullet patterns, teleports and pulses without normal lasers (${fps}fps)`,()=>{
  const b=errorBossTest();b.errorWaveCooldown=0.1;b.errorTeleportCooldown=4;
  let moved=false,corrupted=false,maxBullets=0;const initialY=b.y;
  for(let i=0;i<12*fps;i++) {g.updateGame(1/fps);maxBullets=Math.max(maxBullets,s.enemyBullets.length);moved ||= Math.abs(b.y-initialY)>150;corrupted ||= s.player.corruptionRemaining>0;g.renderGame();}
  assert.ok(moved);assert.ok(corrupted);assert.ok(maxBullets>10&&maxBullets<=96);
  assert.equal(s.lasers.length,0);assert.equal(b.errorPattern>=3,true);
  assert.ok(s.enemyBullets.every(b=>b.errorPower===2));
 });
 test(`Pulse always corrupts through shield and invulnerability without direct HP damage (${fps}fps)`,()=>{
  const b=errorBossTest(),p=s.player;p.skills.shield.remaining=10;p.invulnTimer=100;
  const hp=p.hp;g.beginErrorWave(b);
  for(let i=0;i<3*fps;i++)g.updateGame(1/fps);
  assert.ok(p.corruptionRemaining>5);assert.equal(p.hp,hp);assert.equal(s.errorWaves.length,0);
 });
}
test('Every received attack during the error boss applies corruption, but blocked hits and other bosses do not',()=>{
 const b=errorBossTest(),p=s.player;p.invulnTimer=0;s.debugInvincible=false;
 assert.equal(g.damagePlayer(1,'BULLET'),true);assert.equal(p.corruptionRemaining,8);
 p.corruptionRemaining=2;p.invulnTimer=0;g.damagePlayer(1,'METEOR');assert.equal(p.corruptionRemaining,8);
 p.corruptionRemaining=2;p.invulnTimer=1;g.damagePlayer(1,'BLOCKED');assert.equal(p.corruptionRemaining,2);
 fresh();s.player.invulnTimer=0;g.damagePlayer(1,'BULLET');assert.equal(s.player.corruptionRemaining,0);
});
test('Corruption rolls each projectile once at the exact 50 percent boundary and never rerolls on refresh',()=>{
 const b=errorBossTest(),p=s.player;
 const make=()=>g.spawnPlayerBullet({x:500,y:300,vx:100,vy:0,damage:25,radius:5,piercing:true});
 make();fixedDropRoll(0.499999,()=>g.applyErrorCorruption());assert.equal(s.playerBullets[0].errorMiss,false);
 fixedDropRoll(0.5,()=>make());assert.equal(s.playerBullets[1].errorMiss,true);
 fixedDropRoll(0.99,()=>g.applyErrorCorruption());assert.equal(s.playerBullets[0].errorMiss,false);
 const miss=s.playerBullets[1];miss.x=b.x;miss.y=b.y;miss.vx=0;
 const hp=b.hp;g.updatePlayerBullets(0);g.updatePlayerBullets(0);assert.equal(b.hp,hp);
 p.corruptionRemaining=0;make();assert.equal(s.playerBullets[2].corrupted,undefined);
});
test('Phase two starts exactly at half HP and creates at most four uniquely linked nodes',()=>{
 const b=errorBossTest();b.hp=5001;g.updateGame(0.01);assert.equal(b.phase2Triggered,false);
 b.hp=5000;fixedDropRoll(0.99,()=>g.updateGame(0.01));
 assert.equal(b.phase2Triggered,true);assert.equal(s.errorNodes.length,4);assert.equal(s.errorClones.length,0);
 assert.ok(s.errorNodes.every(n=>n.hp===1000&&n.windowRemaining===0));
 assert.equal(new Set(s.errorNodes.map(n=>n.id)).size,4);
 tick(3);assert.equal(s.errorClones.length,4);
 assert.ok(s.errorNodes.every(n=>n.windowRemaining>8&&n.windowRemaining<=10));
 assert.equal(new Set(s.errorClones.map(c=>c.nodeId)).size,4);
});
test('Nodes are invulnerable until the pulse passes, close after ten seconds, and retain damage across windows',()=>{
 const b=errorBossTest();b.hp=5000;g.checkAndTriggerBossPhase2(b);g.createErrorNodes(b);
 const node=s.errorNodes[0];assert.equal(g.hitErrorNode(node,400),false);assert.equal(node.hp,1000);
 g.openErrorNodeWindow(b);g.hitErrorNode(node,400);assert.equal(node.hp,600);
 b.errorWaveCooldown=100;g.updateErrorBoss(b,10.01);
 assert.equal(node.windowRemaining,0);assert.equal(g.hitErrorNode(node,100),false);assert.equal(node.hp,600);
 g.openErrorNodeWindow(b);assert.equal(node.windowRemaining,10);assert.equal(node.hp,600);
});
test('Destroying a node removes only its paired echo and bullets; other echoes and the main boss remain',()=>{
 const b=errorBossTest();b.hp=5000;g.checkAndTriggerBossPhase2(b);fixedDropRoll(0.99,()=>g.createErrorNodes(b));g.openErrorNodeWindow(b);
 const node=s.errorNodes[0],other=s.errorNodes[1],count=s.errorClones.length;
 g.spawnEnemyBullet(900,100,-200,0);s.enemyBullets[0].errorNodeId=node.id;
 g.spawnEnemyBullet(900,200,-200,0);s.enemyBullets[1].errorNodeId=other.id;
 g.hitErrorNode(node,1000);assert.equal(s.errorNodes.length,count-1);assert.equal(s.errorClones.length,count-1);
 assert.ok(s.errorClones.some(c=>c.nodeId===other.id));assert.ok(!s.enemyBullets.some(p=>p.errorNodeId===node.id));
 assert.ok(s.enemyBullets.some(p=>p.errorNodeId===other.id));assert.equal(s.boss,b);assert.equal(b.hp,5000);
});
test('Ordinary, piercing and skill laser attacks can destroy open nodes with correct once-per-target hits',()=>{
 const b=errorBossTest();b.hp=5000;g.checkAndTriggerBossPhase2(b);g.createErrorNodes(b);g.openErrorNodeWindow(b);
 const node=s.errorNodes[0];node.x=600;node.y=300;b.y=100;
 const shot=()=>g.spawnPlayerBullet({x:node.x,y:node.y,vx:0,vy:0,damage:300,radius:5,piercing:true});
 shot();g.updatePlayerBullets(0);g.updatePlayerBullets(0);assert.equal(node.hp,700);
 s.playerBullets=[];g.spawnPlayerBullet({x:node.x,y:node.y,vx:0,vy:0,damage:300,radius:5});g.updatePlayerBullets(0);assert.equal(node.hp,400);assert.equal(s.playerBullets.length,0);
 node.y=g.getPlayerSkillLaserOrigin().y;s.player.skills.laser.damagePerTick=400;g.applyPlayerSkillLaserTick();
 assert.ok(!s.errorNodes.includes(node));
});
test('Error combat timers freeze during pause/rewards and reset fully after defeat and restart',()=>{
 const b=errorBossTest();b.hp=5000;g.checkAndTriggerBossPhase2(b);g.createErrorNodes(b);g.openErrorNodeWindow(b);g.applyErrorCorruption();
 const window=s.errorNodes[0].windowRemaining,cd=b.errorWaveCooldown;
 for(const mode of ['PAUSED','REWARD','SUPPLY']) {s.mode=mode;g.updateGame(10);assert.equal(s.player.corruptionRemaining,8);assert.equal(s.errorNodes[0].windowRemaining,window);assert.equal(b.errorWaveCooldown,cd);}
 s.mode='PLAYING';g.handleBossDefeated();assert.equal(s.errorNodes.length,0);assert.equal(s.errorClones.length,0);assert.equal(s.errorWaves.length,0);assert.equal(s.player.corruptionRemaining,0);
 g.resetGame();assert.equal(s.errorEchoes.length,0);assert.equal(s.player.corruptionRemaining,0);
});
test('Error phase two repeats pulse windows without exceeding four echoes or mutating mechanics during rendering',()=>{
 const b=errorBossTest();b.hp=5000;g.checkAndTriggerBossPhase2(b);
 let openCount=0,wasOpen=false,sawLocked=false;
 for(let i=0;i<55*30;i++) {
  g.updateGame(1/30);
  const open=s.errorNodes.some(n=>n.windowRemaining>0);
  if(open&&!wasOpen)openCount++;
  if(!open&&s.errorClones.length)sawLocked=true;
  wasOpen=open;
  assert.ok(s.errorClones.length<=4&&s.errorNodes.length<=4&&s.enemyBullets.length<=96);
 }
 assert.ok(openCount>=3);assert.ok(sawLocked);
 assert.equal(new Set(s.errorClones.map(c=>c.nodeId)).size,s.errorClones.length);
 const before=JSON.stringify({nodes:s.errorNodes,clones:s.errorClones,waves:s.errorWaves,p:s.player,boss:b});
 g.renderGame();g.renderGame();
 assert.equal(JSON.stringify({nodes:s.errorNodes,clones:s.errorClones,waves:s.errorWaves,p:s.player,boss:b}),before);
});
test('Every new error split summons exactly four nodes regardless of random positions',()=>{
 for(const roll of [0,0.25,0.5,0.99]) {
  const b=errorBossTest();assert.equal(b.errorTeleportCooldown,100);
  fixedDropRoll(roll,()=>g.createErrorNodes(b));assert.equal(s.errorNodes.length,4);
  g.createErrorNodes(b);assert.equal(s.errorNodes.length,4);
  g.openErrorNodeWindow(b);assert.equal(s.errorClones.length,4);
 }
 fresh();s.currentTier=12;g.startTierBoss(12);assert.equal(s.boss.errorTeleportCooldown,2.4);
});
test('Error nodes refill missing slots only after the slow delay, preserving surviving HP and pair identities',()=>{
 const b=errorBossTest();b.hp=5000;g.checkAndTriggerBossPhase2(b);g.createErrorNodes(b);g.openErrorNodeWindow(b);
 const removed=s.errorNodes[0],survivor=s.errorNodes[1];g.hitErrorNode(survivor,300);g.hitErrorNode(removed,1000);
 assert.equal(s.errorNodes.length,3);assert.equal(b.errorNodeCooldown,40);
 const oldId=removed.id;assert.equal(g.createErrorNodes(b),false);assert.equal(s.errorNodes.length,3);
 b.errorWaveCooldown=100;b.errorTeleportCooldown=100;
 g.updateErrorBoss(b,39.9);assert.equal(g.createErrorNodes(b),false);
 g.updateErrorBoss(b,0.2);assert.equal(b.errorNodeCooldown,0);assert.equal(g.createErrorNodes(b),true);
 assert.equal(s.errorNodes.length,4);assert.equal(survivor.hp,700);assert.ok(s.errorNodes.includes(survivor));
 const added=s.errorNodes.find(n=>n.index===removed.index);assert.notEqual(added.id,oldId);assert.equal(added.windowRemaining,0);
 assert.equal(s.errorClones.length,3);g.openErrorNodeWindow(b);assert.equal(s.errorClones.length,4);
 assert.equal(new Set(s.errorClones.map(c=>c.nodeId)).size,4);assert.equal(g.createErrorNodes(b),false);
});
test('Error node replenishment waits for a pulse even with survivors, then opens new nodes only after passage',()=>{
 const b=errorBossTest();b.hp=5000;g.checkAndTriggerBossPhase2(b);g.createErrorNodes(b);g.openErrorNodeWindow(b);
 g.hitErrorNode(s.errorNodes[0],1000);b.errorNodeCooldown=0;
 assert.equal(s.errorNodes.length,3);g.beginErrorWave(b);assert.equal(s.errorNodes.length,4);assert.equal(s.errorClones.length,3);
 const locked=s.errorNodes.find(n=>n.windowRemaining===0);assert.ok(locked);g.updateErrorBoss(b,0.5);assert.equal(locked.windowRemaining,0);
 tick(2.5);assert.ok(locked.windowRemaining>0);assert.equal(s.errorClones.length,4);
 assert.ok(s.errorNodes.every(n=>n.x<g.CONFIG.ENEMY_MIN_X-40));
});
test('Enemy spawn sector blocks the player hull and permits shots, with chain encounters exempt',()=>{
 errorBossTest();const p=s.player;p.x=1100;g.updateGame(0);
 const box=g.getRotatedBounds(p.x,p.y,p.spec,true,p.scale);assert.ok(box.right<=g.CONFIG.ENEMY_MIN_X-16+1e-6);
 const event=code=>({code,repeat:false,preventDefault(){}});
 windowListeners.get('keydown')(event('KeyD'));try {tick(2);}finally{windowListeners.get('keyup')(event('KeyD'));}
 assert.ok(g.getRotatedBounds(p.x,p.y,p.spec,true,p.scale).right<=g.CONFIG.ENEMY_MIN_X-16+1e-6);
 s.playerBullets=[];p.fireCooldown=0;g.updateGame(0.01);g.updatePlayerBullets(0.2);assert.ok(s.playerBullets.some(b=>b.x>g.CONFIG.ENEMY_MIN_X));
 for(const tier of [1,5,8,9,10,12]) {
  fresh();g.jumpToTierWave(tier);s.player.x=1100;g.updateGame(0);
  assert.ok(g.getRotatedBounds(s.player.x,s.player.y,s.player.spec,true,s.player.scale).right<=g.CONFIG.ENEMY_MIN_X-16+1e-6);
  g.startTierBoss(tier);s.player.x=1100;g.updateGame(0);assert.ok(s.player.x<g.CONFIG.ENEMY_MIN_X);
 }
 fresh();g.jumpToTierWave(11);s.player.x=1100;g.updateGame(0);assert.equal(s.player.x,1100);
 g.startTierBoss(11);s.player.x=1100;g.updateGame(0);assert.equal(s.player.x,1100);
 for(const start of [g.startShadowBoss,g.startRevealedFinalBoss]) {
  fresh();start();s.player.x=1100;g.updateGame(0);assert.ok(s.player.x<g.CONFIG.ENEMY_MIN_X);
 }
});
test('Error render caches reuse native tint and cardinal hull textures without growing per frame',()=>{
 const b=errorBossTest();b.hp=5000;g.checkAndTriggerBossPhase2(b);g.createErrorNodes(b);g.openErrorNodeWindow(b);g.applyErrorCorruption();
 g.spriteTintCache.clear();g.errorHullStampCache.clear();g.renderGame();
 const tintEntries=[...g.spriteTintCache.entries()],hullEntries=[...g.errorHullStampCache.entries()];
 assert.ok(tintEntries.length>0&&tintEntries.length<=128);assert.ok(hullEntries.length>0&&hullEntries.length<=64);
 for(let frame=0;frame<10;frame++)g.renderGame();
 assert.equal(g.spriteTintCache.size,tintEntries.length);assert.equal(g.errorHullStampCache.size,hullEntries.length);
 for(const [key,value] of tintEntries) {assert.equal(g.spriteTintCache.get(key),value);assert.ok(value.width<=64&&value.height<=64);}
 for(const [key,value] of hullEntries)assert.equal(g.errorHullStampCache.get(key),value);
});

test('Error teleport warns before moving, stays inside the right third, and hides for only the shift',()=>{
 const b=errorBossTest(),x=b.x,y=b.y;g.beginErrorTeleport(b);
 const target={x:b.errorBlink.targetX,y:b.errorBlink.targetY};assert.ok(target.x>=g.CONFIG.ENEMY_MIN_X);
 assert.equal(b.errorBlink.timer,0.325);
 g.updateErrorBoss(b,0.15);assert.equal(b.x,x);assert.equal(b.y,y);
 g.updateErrorBoss(b,0.18);assert.equal(b.x,target.x);assert.equal(b.y,target.y);assert.equal(b.errorBlink.phase,'SHIFT');assert.equal(g.canDamageBossWithPlayerAttack(b),false);
 g.updateErrorBoss(b,0.09);assert.equal(b.errorBlink.phase,'ARRIVE');assert.equal(g.canDamageBossWithPlayerAttack(b),true);
});

function fixedDropRoll(value,fn) {
 vm.runInContext(`globalThis.savedSupplyRandom=Math.random;Math.random=()=>${value}`,context);
 try{return fn();}finally{vm.runInContext('Math.random=globalThis.savedSupplyRandom',context);}
}
test('Supply drops at the configured 5% boundary once per kill, never on retreat',()=>{
 assert.equal(configuredSupplyDropChance,0.05);
 for(const tier of [1,6]) {
  fresh();g.CONFIG.SUPPLY_DROP_CHANCE=configuredSupplyDropChance;
  const e=g.spawnWaveEnemy(tier,{enemyIdx:1});e.x=900;e.y=320;e.entering=false;
  s.playerBullets.push({x:e.x,y:e.y,vx:0,vy:0,radius:6,damage:e.hp+1});
  fixedDropRoll(0.0499,()=>g.updatePlayerBullets(0));
  assert.equal(s.supplies.length,1);assert.equal(s.supplies[0].x,900);assert.equal(s.supplies[0].y,320);
  fixedDropRoll(0,()=>{g.maybeDropSupply(e);if(tier===6)g.beginEnemySuicide(e);});
  assert.equal(s.supplies.length,1);
 }
 fresh();g.CONFIG.SUPPLY_DROP_CHANCE=configuredSupplyDropChance;
 const e=g.spawnWaveEnemy(1,{enemyIdx:1});e.x=900;e.entering=false;
 s.playerBullets.push({x:e.x,y:e.y,vx:0,vy:0,radius:6,damage:e.hp+1});
 fixedDropRoll(0.05,()=>g.updatePlayerBullets(0));assert.equal(s.supplies.length,0);
 const retreat=g.spawnWaveEnemy(1,{enemyIdx:1});retreat.retreating=true;retreat.hp=0;retreat.x=1400;
 fixedDropRoll(0,()=>g.updateGame(0.1));assert.equal(s.supplies.length,0);
});
test('Supply chance halves on pickup, not on drop or missed crates, and resets for a new game',()=>{
 fresh();g.CONFIG.SUPPLY_DROP_CHANCE=configuredSupplyDropChance;
 const p=s.player,enemy=()=>({x:900,y:100});
 fixedDropRoll(0.04999,()=>{g.maybeDropSupply(enemy());g.maybeDropSupply(enemy());});
 assert.equal(s.supplies.length,2);assert.equal(s.supplyPickupCount,0);
 s.supplies.forEach(item=>{item.x=-100;item.prevX=-100;});g.updateSupplies(0);
 assert.equal(s.supplies.length,0);assert.equal(s.supplyPickupCount,0);
 for(const [count,chance] of [[1,0.025],[2,0.0125],[3,0.00625]]) {
  g.spawnSupply(p.x,p.y);g.updateSupplies(0);
  assert.equal(s.mode,'SUPPLY');assert.equal(s.supplyPickupCount,count);
  g.applySupplyChoice('heal');g.applySupplyChoice('heal');assert.equal(s.supplyPickupCount,count);
  const before=s.supplies.length;
  fixedDropRoll(chance,()=>g.maybeDropSupply(enemy()));assert.equal(s.supplies.length,before);
  fixedDropRoll(chance-0.000001,()=>g.maybeDropSupply(enemy()));assert.equal(s.supplies.length,before+1);
 }
 g.resetGame();assert.equal(s.supplyPickupCount,0);
 fixedDropRoll(0.04999,()=>g.maybeDropSupply(enemy()));assert.equal(s.supplies.length,1);
});
test('Skill laser kills also roll supply drops at the killed enemy position',()=>{
 fresh();g.CONFIG.SUPPLY_DROP_CHANCE=configuredSupplyDropChance;
 const e=g.spawnWaveEnemy(1,{enemyIdx:1}),m=g.getPlayerSkillLaserOrigin();
 e.entering=false;e.x=900;e.y=m.y;e.hp=0.1;
 fixedDropRoll(0,()=>g.applyPlayerSkillLaserTick());
 assert.equal(s.supplies.length,1);assert.equal(s.supplies[0].x,e.x);assert.equal(s.supplies[0].y,e.y);
});
test('Supply choices grant only the chosen reward, cap HP, and reduce all cooldowns by 30',()=>{
 fresh();const p=s.player;p.hp=p.maxHp-0.5;
 s.pendingSupplyChoices=1;g.openPendingSupplyChoice();
 assert.equal(s.mode,'SUPPLY');assert.equal(p.hp,4.5);
 g.applySupplyChoice('all');assert.equal(s.mode,'SUPPLY');
 g.applySupplyChoice('heal');assert.equal(p.hp,p.maxHp);assert.equal(s.mode,'PLAYING');
 g.applySupplyChoice('heal');assert.equal(p.hp,p.maxHp);
 p.skills.laser.cooldown=70;p.skills.heal.cooldown=15;p.skills.shield.cooldown=0;p.skills.shield.remaining=3;
 s.pendingSupplyChoices=1;g.openPendingSupplyChoice();g.applySupplyChoice('cooldown');
 assert.equal(p.skills.laser.cooldown,40);assert.equal(p.skills.heal.cooldown,0);assert.equal(p.skills.shield.cooldown,0);assert.equal(p.skills.shield.remaining,3);
 assert.equal(s.pendingSupplyUpgrades,0);assert.equal(p.maxHp,5);
});
test('Supply upgrade pauses and resumes the same combat without advancing or deleting hazards',()=>{
 fresh();g.startTierBoss(3);const boss=s.boss;boss.entering=false;
 const enemy=g.spawnWaveEnemy(3,{enemyIdx:2});const stage=s.currentTier,elapsed=s.tierWaveElapsed;
 g.spawnEnemyBullet(1000,100,-200,0);const bullet=s.enemyBullets[0];
 const p=s.player;p.weaponLevel=4;s.pendingSupplyChoices=1;g.openPendingSupplyChoice();
 assert.equal(s.mode,'SUPPLY');g.applySupplyChoice('upgrade');
 assert.equal(s.mode,'REWARD');assert.equal(s.rewardSource,'supply');assert.ok(nodes.get('reward-card-2').hidden);
 const x=boss.x;g.updateGame(1);assert.equal(boss.x,x);
 g.applyRewardChoice('equipment');assert.equal(s.mode,'REWARD');
 g.applyRewardChoice('skills');assert.equal(s.mode,'PLAYING');assert.equal(p.skillLevel,1);
 assert.equal(s.boss,boss);assert.ok(s.enemies.includes(enemy));assert.ok(s.enemyBullets.includes(bullet));
 assert.equal(s.currentTier,stage);assert.equal(s.tierWaveElapsed,elapsed);assert.equal(s.rewardsChosenHistory.length,0);assert.equal(s.telemetry.rewardsOpenedForTiers.length,0);
});
test('Supply pickup uses swept contact, cannot be claimed twice, and respects pause/reset',()=>{
 fresh();const p=s.player;p.hp=1;p.prevX=p.x;p.prevY=p.y;
 const item=g.spawnSupply(p.x+150,p.y);item.vx=-1000;
 g.updateSupplies(0.3);assert.equal(p.hp,1);assert.equal(s.mode,'SUPPLY');assert.equal(s.supplies.length,0);
 const elapsed=s.tierWaveElapsed;g.updateGame(1);assert.equal(s.tierWaveElapsed,elapsed);
 g.applySupplyChoice('heal');assert.equal(p.hp,2);
 fixedDropRoll(0,()=>g.updateSupplies(0.3));assert.equal(p.hp,2);
 const other=g.spawnSupply(100,p.y);s.mode='PAUSED';g.updateSupplies(5);assert.equal(other.x,100);
 g.resetGame();assert.equal(s.supplies.length,0);assert.equal(s.pendingSupplyUpgrades,0);assert.equal(s.pendingSupplyChoices,0);
});
test('Multiple upgrade crates queue and maxed players can continue without stage changes',()=>{
 fresh();const p=s.player;p.vitalityLevel=p.weaponLevel=p.mobilityLevel=p.skillLevel=4;
 g.spawnSupply(p.x,p.y);g.spawnSupply(p.x,p.y);g.updateSupplies(0);
 assert.equal(s.mode,'SUPPLY');assert.equal(s.pendingSupplyChoices,1);
 g.applySupplyChoice('upgrade');assert.equal(s.mode,'REWARD');
 for(let i=1;i<=4;i++)assert.ok(nodes.get(`reward-card-${i}`).hidden);
 assert.equal(nodes.get('reward-continue').hidden,false);
 g.applyRewardChoice('continue');assert.equal(s.mode,'SUPPLY');assert.equal(s.pendingSupplyChoices,0);
 g.applySupplyChoice('upgrade');assert.equal(s.mode,'REWARD');assert.equal(s.pendingSupplyUpgrades,0);
 g.applyRewardChoice('continue');assert.equal(s.mode,'PLAYING');assert.equal(s.currentTier,1);
});
test('New neon bullets, supply crate and single-rim half-size meteors ship with matching geometry',()=>{
 fresh();for(const color of ['Red','Orange','Yellow','Lime','Cyan','Blue','Violet','Pink'])for(const [shape,w,h] of [['Orb',5,5],['Needle',9,3]]){
  const png=fs.readFileSync(fileURLToPath(new URL(`../assets/bullets/Colors/${color}/${shape}.png`,import.meta.url)));
  assert.equal(png.readUInt32BE(16),w);assert.equal(png.readUInt32BE(20),h);
 }
 const crate=fs.readFileSync(fileURLToPath(new URL('../assets/pickups/Space_Supply.png',import.meta.url)));
 assert.equal(crate.readUInt32BE(16),7);assert.equal(crate.readUInt32BE(20),7);
 g.spawnMeteorFromWarning({y:300,speed:500});const m=s.meteors[0];
 assert.equal(m.scale,4.5);assert.equal(m.radius,40.5);assert.equal(m.spec.size[0],36);assert.equal(m.path,'extras/Meteor_Outlined.png');
 g.spawnEnemyBullet(900,300,-200,0,'Orb');assert.equal(s.enemyBullets[0].collision.radius,2.5);
});

test('Boss assets are separate from minions and every runtime sprite path resolves after the move',()=>{
 for(let tier=1;tier<=10;tier++) {
  const id=`Tier_${String(tier).padStart(2,'0')}`;
  assert.ok(fs.existsSync(fileURLToPath(new URL(`../assets/bosses/${id}/Boss.png`,import.meta.url))));
  assert.ok(!fs.existsSync(fileURLToPath(new URL(`../assets/enemies/${id}/Boss.png`,import.meta.url))));
  for(let enemy=1;enemy<=4;enemy++)assert.ok(fs.existsSync(fileURLToPath(new URL(`../assets/enemies/${id}/Enemy_0${enemy}.png`,import.meta.url))));
 }
 for(const path of Object.keys(g.SPRITE_SPECS))assert.ok(fs.existsSync(fileURLToPath(new URL(`../assets/${path}`,import.meta.url))),`Missing sprite ${path}`);
 for(const path of g.assets.images.keys())assert.ok(fs.existsSync(fileURLToPath(new URL(`../assets/${path}`,import.meta.url))),`Missing preloaded image ${path}`);
});

console.log(`\n${results.length} scenario checks passed.`);
