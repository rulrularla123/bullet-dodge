import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const source = fs.readFileSync(fileURLToPath(new URL('../game.js', import.meta.url)), 'utf8');
const transforms = [];
const draw = new Proxy({}, { get: (_, key) => (...args) => { if (key === 'scale') transforms.push(args); } });
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
const window = { location: { search: '' }, addEventListener() {} };
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
  if (e.specialState === 'RETURN' && e.x < -65) leftExit = true;
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
test('Tier 5 boss side volley is exactly three times the former two bullets', () => {
 fresh(); g.startTierBoss(5); const b = s.boss;
 b.entering = false; b.dashState = 'DASH'; b.x = 700; b.y = b.dashY = 350;
 b.dashSideShotTimer = 0; g.updateGame(1 / 60);
 assert.equal(s.enemyBullets.length, 6);
 assert.equal(s.enemyBullets.filter(b => b.vy > 0).length, 3);
 assert.equal(s.enemyBullets.filter(b => b.vy < 0).length, 3);
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
 test(`Final overdrive alternates directions with a harmless warning and lower escape lane (${fps}fps)`, () => {
  fresh(); g.startRevealedFinalBoss(); const b = s.boss; b.entering = false;
  for (let pass = 0; pass < 2; pass++) {
   const sweep = g.startFinalSweep(b);
   assert.ok(pass === 0 ? sweep.endY > sweep.startY : sweep.endY < sweep.startY);
   let warned = 0, fired = false, lastY;
   for (let i = 0; i < 18 * fps; i++) {
    g.updateGame(1 / fps);
    if (sweep.phase === 'WARNING') { warned += 1 / fps; assert.equal(sweep.beamIds.length, 0); }
    if (sweep.activeElapsed > 0 && sweep.phase === 'FIRING') {
     fired = true;
     if (lastY !== undefined) assert.ok(pass === 0 ? b.y >= lastY : b.y <= lastY);
     lastY = b.y;
     const beams = s.lasers.filter(x => sweep.beamIds.includes(x.id));
     assert.ok(beams.every(x => !g.checkLaserHitsPlayer(x, {x:200,y:680,hitboxRadius:8})));
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

console.log(`\n${results.length} scenario checks passed.`);
