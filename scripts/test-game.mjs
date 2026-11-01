import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const source = fs.readFileSync(fileURLToPath(new URL('../game.js', import.meta.url)), 'utf8');
const transforms = [];
const imageDraws = [];
const draw = new Proxy({}, { get: (_, key) => (...args) => { if (key === 'scale') transforms.push(args); if (key === 'drawImage') imageDraws.push(args); } });
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
function fresh() {
  g.resetGame(); s.phase = 'TEST'; s.player.fireCooldown = 1e6;
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
  g.startTierBoss(tier); g.handleBossDefeated();
  assert.equal(s.player.hp, 3); assert.equal(s.player.maxHp, 5);
  g.handleBossDefeated(); assert.equal(s.player.hp, 3);
 }
 for (const start of [g.startShadowBoss, g.startRevealedFinalBoss]) {
  fresh(); s.player.hp = 2; start(); g.handleBossDefeated();
  assert.equal(s.player.hp, 3); assert.equal(s.player.maxHp, 5);
 }
 fresh(); g.startTierBoss(1); g.handleBossDefeated();
 assert.equal(s.player.hp, 5); assert.equal(s.player.maxHp, 5);
});
test('Vitality reward raises only max HP; boss heal remains separate', () => {
 fresh(); s.player.hp = 2; g.startTierBoss(2); g.handleBossDefeated();
 assert.equal(s.player.hp, 3); assert.equal(s.mode, 'REWARD');
 assert.match(nodes.get('reward-stat-vitality').textContent, /3\/5.*3\/6/);
 g.applyRewardChoice('vitality');
 assert.equal(s.player.hp, 3); assert.equal(s.player.maxHp, 6);
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
  assert.ok(s.playerBullets.every(b => !b.piercing && b.path === 'bullets/Needle_Cyan.png'));
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
   g.handleBossDefeated();assert.ok(!s.boss || s.boss.hp<=0 || s.mode==='REWARD');
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
  [2700,100,3,120,10,120], [13000/3,80,3,90,10,100]
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
  const totals=[600,1300,1300,2700,13000/3];
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

console.log(`\n${results.length} scenario checks passed.`);
