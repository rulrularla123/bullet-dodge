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
console.log(`\n${results.length} scenario checks passed.`);
