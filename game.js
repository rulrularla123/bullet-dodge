(() => {
  'use strict';

  // ============================================================================
  // 1. CONFIGURATION & CONSTANTS (V2 Updated)
  // ============================================================================
  const CONFIG = {
    CANVAS_WIDTH: 1284,   // 1284 / 3 = 428, 1284 * 2 / 3 = 856 (exact integer)
    CANVAS_HEIGHT: 724,   // Native height of Space_Unique background (724px)
    ENEMY_MIN_X: 856,     // Math.ceil(1284 * 2 / 3) - rightmost 1/3 boundary

    // V2 Visibility & Scale Increase (3x ships & bullets, 2x lasers)
    SHIP_SCALE: 3,            // 3x base scale for player, regular enemies, tier bosses, escorts, meteors
    FINAL_BOSS_SCALE: 2.6,    // 70x50 Final Boss scaled to 182x130 so it fits comfortably inside 428px right-third
    BULLET_SCALE: 3,          // 3x scale for regular bullets (8x8 -> 24x24, 12x6 -> 36x18)
    LASER_SCALE: 2,           // 2x scale for 32px-tall laser (Stage 1/2/3 visible thickness = 8/16/24px)
    HEART_SCALE: 4,           // 4x integer scale for 8x8 heart (32x32)
    FONT_SCALE: 4,            // 4x integer scale for 3x5 glyphs (12x20, advance 16)
    BOSS_BAR_SCALE: 4,        // 4x integer scale for 64x32 boss bars (256x128)

    BOSS_BAR_NATIVE_W: 64,
    BOSS_BAR_NATIVE_H: 32,
    BOSS_FILL_RECT: { x: 5, y: 16, width: 54, height: 2 },

    WAVE_DURATION: 60.0,      // Default 60s wave per tier
    TOTAL_TIERS: 8,

    PLAYER_MAX_HP: 5,
    PLAYER_SPEED: 350,
    PLAYER_FOCUS_SPEED: 170,
    PLAYER_INVULN_TIME: 1.25,
    PLAYER_BASE_HITBOX_RADIUS: 8.5, // Forgiving core hitbox inside 3x ship sprite

    ENEMY_BULLET_DAMAGE: 1,
    LASER_DAMAGE: 2,
    MISSILE_DAMAGE: 2,
    DASH_DAMAGE: 2,
    METEOR_DAMAGE: 2,

    METEOR_MIN_INTERVAL: 7.5,
    METEOR_MAX_INTERVAL: 14.0,
    METEOR_WARN_TIME: 0.90,

    TIER6_RECHARGE: 1.85,
    TIER6_MISSILE_SPEED: 875,
    TIER6_SUICIDE_RADII: [72, 88, 104, 120],
    TIER6_BOSS_BLAST_RADIUS: 112,
    TIER7_SUMMON_INTERVAL: 2.1,
    TIER7_SUMMON_LIMIT: 6,
    ENEMY_SMALL_LASER_LIMIT: 2,
    FINAL_VOLLEY_ACTIVE_TIME: 6,

    // Laser stage timings (in seconds)
    LASER_STAGE1_TIME: 0.65,
    LASER_STAGE2_TIME: 0.35,
    LASER_STAGE3_TIME: 0.80,

    BG_SCROLL_SPEED: 150,
    BG_TOTAL_WIDTH: 43440,
    BG_HEIGHT: 724,
    BG_FADE_STEPS: 16,
    BG_FADE_STEP_PX: 6,
    BG_NAVY_COLOR: '#030c21'
  };

  // ============================================================================
  // 2. BACKGROUND LAYOUT (from assets/backgrounds/Space_Unique/manifest.json)
  // ============================================================================
  const SPACE_UNIQUE_LAYOUT = [
    { kind: 'sector', file: 'Sector_01.png', width: 2172, sourceX: 0, index: 1, x: 0 },
    { kind: 'transition', file: 'Transition_3.png', width: 1448, sourceX: 510, units: 2, x: 2172 },
    { kind: 'sector', file: 'Sector_02_Fixed.png', width: 2172, sourceX: 0, index: 2, x: 3620 },
    { kind: 'transition', file: 'Transition_1.png', width: 724, sourceX: 300, units: 1, x: 5792 },
    { kind: 'sector', file: 'Sector_03.png', width: 2172, sourceX: 0, index: 3, x: 6516 },
    { kind: 'transition', file: 'Transition_3.png', width: 2172, sourceX: 0, units: 3, x: 8688 },
    { kind: 'sector', file: 'Sector_04.png', width: 2172, sourceX: 0, index: 4, x: 10860 },
    { kind: 'transition', file: 'Transition_2.png', width: 1448, sourceX: 630, units: 2, x: 13032 },
    { kind: 'sector', file: 'Sector_05_Fixed.png', width: 2172, sourceX: 0, index: 5, x: 14480 },
    { kind: 'transition', file: 'Transition_3.png', width: 2172, sourceX: 0, units: 3, x: 16652 },
    { kind: 'sector', file: 'Sector_06.png', width: 2172, sourceX: 0, index: 6, x: 18824 },
    { kind: 'transition', file: 'Transition_3.png', width: 724, sourceX: 486, units: 1, x: 20996 },
    { kind: 'sector', file: 'Sector_07_Fixed.png', width: 2172, sourceX: 0, index: 7, x: 21720 },
    { kind: 'transition', file: 'Transition_3.png', width: 1448, sourceX: 528, units: 2, x: 23892 },
    { kind: 'sector', file: 'Sector_08.png', width: 2172, sourceX: 0, index: 8, x: 25340 },
    { kind: 'transition', file: 'Transition_2.png', width: 724, sourceX: 138, units: 1, x: 27512 },
    { kind: 'sector', file: 'Sector_09.png', width: 2172, sourceX: 0, index: 9, x: 28236 },
    { kind: 'transition', file: 'Transition_3.png', width: 2172, sourceX: 0, units: 3, x: 30408 },
    { kind: 'sector', file: 'Sector_10_Fixed.png', width: 2172, sourceX: 0, index: 10, x: 32580 },
    { kind: 'transition', file: 'Transition_1.png', width: 724, sourceX: 330, units: 1, x: 34752 },
    { kind: 'sector', file: 'Sector_11_Fixed.png', width: 2172, sourceX: 0, index: 11, x: 35476 },
    { kind: 'transition', file: 'Transition_3.png', width: 1448, sourceX: 582, units: 2, x: 37648 },
    { kind: 'sector', file: 'Sector_12.png', width: 2172, sourceX: 0, index: 12, x: 39096 },
    { kind: 'transition', file: 'Transition_2.png', width: 2172, sourceX: 0, units: 3, x: 41268 }
  ];

  // ============================================================================
  // 3. VERIFIED SPRITE METADATA (Including Tier_04 Separated Body/Escorts & Tier_06 Wing Pods)
  // ============================================================================
  const SPRITE_SPECS = {
    'player/주인공.png': {
      size: [32, 32],
      visibleBounds: [6, 6, 20, 18],
      muzzles: [{ x: 16.0, y: 6, kind: 'nose-muzzle' }]
    },
    'extras/Single_Sprite.png': {
      size: [32, 32],
      visibleBounds: [11, 11, 11, 11],
      muzzles: []
    },
    // Tier 01
    'enemies/Tier_01/Enemy_01.png': { size: [32, 32], visibleBounds: [12, 10, 8, 11], muzzles: [{ x: 16.0, y: 10 }] },
    'enemies/Tier_01/Enemy_02.png': { size: [32, 32], visibleBounds: [12, 8, 8, 15], muzzles: [{ x: 16.0, y: 8 }] },
    'enemies/Tier_01/Enemy_03.png': { size: [32, 32], visibleBounds: [12, 6, 8, 19], muzzles: [{ x: 16.0, y: 6 }] },
    'enemies/Tier_01/Enemy_04.png': { size: [32, 32], visibleBounds: [9, 6, 14, 20], muzzles: [{ x: 16.0, y: 6 }] },
    'enemies/Tier_01/Boss.png':     { size: [32, 32], visibleBounds: [6, 6, 20, 20], muzzles: [{ x: 16.0, y: 6 }] },
    // Tier 02
    'enemies/Tier_02/Enemy_01.png': { size: [32, 32], visibleBounds: [7, 7, 18, 17], muzzles: [{ x: 16.0, y: 7 }] },
    'enemies/Tier_02/Enemy_02.png': { size: [32, 32], visibleBounds: [7, 7, 18, 18], muzzles: [{ x: 16.0, y: 7 }] },
    'enemies/Tier_02/Enemy_03.png': { size: [32, 32], visibleBounds: [6, 6, 20, 19], muzzles: [{ x: 16.0, y: 6 }] },
    'enemies/Tier_02/Enemy_04.png': { size: [32, 32], visibleBounds: [4, 6, 24, 19], muzzles: [{ x: 16.0, y: 6 }, { x: 6.0, y: 11 }, { x: 26.0, y: 11 }] },
    'enemies/Tier_02/Boss.png':     { size: [32, 32], visibleBounds: [4, 6, 24, 21], muzzles: [{ x: 16.0, y: 6 }, { x: 6.0, y: 11 }, { x: 26.0, y: 11 }] },
    // Tier 03
    'enemies/Tier_03/Enemy_01.png': { size: [32, 32], visibleBounds: [6, 7, 20, 19], muzzles: [{ x: 16.0, y: 7 }] },
    'enemies/Tier_03/Enemy_02.png': { size: [32, 32], visibleBounds: [5, 7, 22, 22], muzzles: [{ x: 16.0, y: 7 }] },
    'enemies/Tier_03/Enemy_03.png': { size: [32, 32], visibleBounds: [5, 6, 22, 24], muzzles: [{ x: 16.0, y: 6 }] },
    'enemies/Tier_03/Enemy_04.png': { size: [32, 32], visibleBounds: [3, 5, 26, 24], muzzles: [{ x: 16.0, y: 5 }] },
    'enemies/Tier_03/Boss.png':     { size: [32, 32], visibleBounds: [2, 5, 28, 25], muzzles: [{ x: 16.0, y: 5 }, { x: 12.0, y: 9 }, { x: 20.0, y: 9 }] },
    // Tier 04 (Includes separated Boss_Body.png and Escort_01/02.png)
    'enemies/Tier_04/Enemy_01.png': { size: [32, 32], visibleBounds: [6, 5, 20, 22], muzzles: [{ x: 16.0, y: 5 }] },
    'enemies/Tier_04/Enemy_02.png': { size: [32, 32], visibleBounds: [2, 4, 28, 23], muzzles: [{ x: 16.0, y: 4 }] },
    'enemies/Tier_04/Enemy_03.png': { size: [32, 32], visibleBounds: [2, 4, 28, 24], muzzles: [{ x: 16.0, y: 4 }] },
    'enemies/Tier_04/Enemy_04.png': { size: [32, 32], visibleBounds: [2, 4, 28, 24], muzzles: [{ x: 16.0, y: 4 }, { x: 6.5, y: 11 }, { x: 25.5, y: 11 }] },
    'enemies/Tier_04/Boss.png':     { size: [32, 32], visibleBounds: [1, 4, 30, 27], muzzles: [{ x: 16.0, y: 4 }, { x: 6.5, y: 10 }, { x: 25.5, y: 10 }] },
    'bosses/Tier_04/Boss_Body.png': { size: [32, 32], visibleBounds: [1, 4, 30, 24], muzzles: [{ x: 16.0, y: 4 }, { x: 6.5, y: 10 }, { x: 25.5, y: 10 }] },
    'bosses/Tier_04/Escort_01.png': { size: [16, 16], visibleBounds: [3, 4, 9, 8],   muzzles: [{ x: 7.0, y: 4, kind: 'escort-nose' }] },
    'bosses/Tier_04/Escort_02.png': { size: [16, 16], visibleBounds: [3, 4, 9, 8],   muzzles: [{ x: 7.0, y: 4, kind: 'escort-nose' }] },
    // Tier 05
    'enemies/Tier_05/Enemy_01.png': { size: [32, 32], visibleBounds: [5, 5, 22, 22], muzzles: [{ x: 16.0, y: 5 }] },
    'enemies/Tier_05/Enemy_02.png': { size: [32, 32], visibleBounds: [5, 8, 22, 19], muzzles: [{ x: 16.0, y: 8 }] },
    'enemies/Tier_05/Enemy_03.png': { size: [32, 32], visibleBounds: [1, 8, 30, 19], muzzles: [{ x: 11.5, y: 8 }, { x: 16.0, y: 8 }, { x: 20.5, y: 8 }] },
    'enemies/Tier_05/Enemy_04.png': { size: [32, 32], visibleBounds: [1, 7, 30, 24], muzzles: [{ x: 16.0, y: 7 }] },
    'enemies/Tier_05/Boss.png':     { size: [32, 32], visibleBounds: [1, 6, 30, 26], muzzles: [{ x: 11.0, y: 6 }, { x: 16.0, y: 7 }, { x: 21.0, y: 6 }] },
    // Tier 06 (Boss muzzles specifically on wing missile attachments, NOT center nose!)
    'enemies/Tier_06/Enemy_01.png': { size: [32, 32], visibleBounds: [0, 7, 32, 22], muzzles: [{ x: 16.0, y: 7 }] },
    'enemies/Tier_06/Enemy_02.png': { size: [32, 32], visibleBounds: [0, 7, 32, 24], muzzles: [{ x: 16.0, y: 7 }] },
    'enemies/Tier_06/Enemy_03.png': { size: [32, 32], visibleBounds: [1, 7, 30, 24], muzzles: [{ x: 16.0, y: 7 }] },
    'enemies/Tier_06/Enemy_04.png': { size: [32, 32], visibleBounds: [0, 5, 32, 26], muzzles: [{ x: 16.0, y: 5 }, { x: 9.0, y: 7 }, { x: 23.0, y: 7 }] },
    'enemies/Tier_06/Boss.png': {
      size: [32, 32],
      visibleBounds: [0, 3, 32, 29],
      muzzles: [
        { x: 8.5,  y: 5, kind: 'wing-missile-left-inner' },
        { x: 22.5, y: 5, kind: 'wing-missile-right-inner' },
        { x: 2.0,  y: 8, kind: 'wing-missile-left-outer' },
        { x: 29.5, y: 8, kind: 'wing-missile-right-outer' }
      ]
    },
    // Tier 07
    'enemies/Tier_07/Enemy_01.png': { size: [34, 40], visibleBounds: [12, 6, 10, 27], muzzles: [{ x: 17.0, y: 6 }] },
    'enemies/Tier_07/Enemy_02.png': { size: [34, 40], visibleBounds: [6, 6, 22, 27], muzzles: [{ x: 17.0, y: 6 }, { x: 9.0, y: 10 }, { x: 25.0, y: 10 }] },
    'enemies/Tier_07/Enemy_03.png': { size: [34, 40], visibleBounds: [6, 5, 22, 28], muzzles: [{ x: 16.5, y: 5 }, { x: 9.0, y: 10 }, { x: 25.0, y: 10 }] },
    'enemies/Tier_07/Enemy_04.png': { size: [34, 40], visibleBounds: [5, 2, 24, 31], muzzles: [{ x: 16.5, y: 2 }, { x: 9.0, y: 10 }, { x: 25.0, y: 10 }] },
    'enemies/Tier_07/Boss.png':     { size: [34, 40], visibleBounds: [0, 3, 34, 33], muzzles: [{ x: 16.5, y: 3, kind: 'laser-nose' }, { x: 11.5, y: 8 }, { x: 22.5, y: 8 }] },
    // Tier 08 (Boss central laser emitter at center channel x=16, y=10)
    'enemies/Tier_08/Enemy_01.png': { size: [32, 40], visibleBounds: [3, 11, 26, 25], muzzles: [{ x: 16.0, y: 11 }] },
    'enemies/Tier_08/Enemy_02.png': { size: [32, 40], visibleBounds: [3, 11, 26, 25], muzzles: [{ x: 16.0, y: 11 }] },
    'enemies/Tier_08/Enemy_03.png': { size: [32, 40], visibleBounds: [2, 6, 28, 34], muzzles: [{ x: 11.5, y: 6 }, { x: 20.5, y: 6 }] },
    'enemies/Tier_08/Enemy_04.png': { size: [32, 40], visibleBounds: [2, 1, 28, 39], muzzles: [{ x: 13.0, y: 1 }, { x: 19.0, y: 1 }] },
    'enemies/Tier_08/Boss.png': {
      size: [32, 40],
      visibleBounds: [0, 1, 32, 39],
      muzzles: [
        { x: 16.0, y: 10, kind: 'center-laser-core' },
        { x: 11.5, y: 1,  kind: 'left-prong' },
        { x: 20.5, y: 1,  kind: 'right-prong' }
      ]
    },
    // Final Boss - Shadow (single sprite with static baked-in silhouettes)
    'bosses/Final_Boss/Final_Boss_Shadow.png': {
      size: [70, 50],
      visibleBounds: [2, 0, 66, 50],
      muzzles: [
        { x: 26.0, y: 12, kind: 'body-left-main' },
        { x: 35.0, y: 14, kind: 'body-center' },
        { x: 44.0, y: 12, kind: 'body-right-main' }
      ]
    },
    // Final Boss - Revealed Body (without baked-in escorts)
    'bosses/Final_Boss/Final_Boss_Revealed_Body.png': {
      size: [70, 50],
      visibleBounds: [4, 12, 62, 38],
      // Native up-facing coordinates, matched to the four user-supplied port close-ups.
      // Use the left-facing barrel lips, not the green rear exhausts of the outer pods.
      // Half-pixel X values center each ray on its native pixel column.
      muzzles: [
        { x: 59.5, y: 29.0, kind: 'upper-outer-port' },
        { x: 43.5, y: 12.0, kind: 'upper-front-port' },
        { x: 26.5, y: 12.0, kind: 'lower-front-port' },
        { x: 10.5, y: 29.0, kind: 'lower-outer-port' }
      ]
    },
    // Final Boss - 4 Independent Invulnerable Escort Minions
    'bosses/Final_Boss/Final_Minion_01.png': { size: [16, 16], visibleBounds: [3, 2, 10, 12], muzzles: [{ x: 8.0, y: 2 }] },
    'bosses/Final_Boss/Final_Minion_02.png': { size: [16, 16], visibleBounds: [3, 2, 10, 12], muzzles: [{ x: 8.0, y: 2 }] },
    'bosses/Final_Boss/Final_Minion_03.png': { size: [16, 16], visibleBounds: [3, 2, 10, 12], muzzles: [{ x: 8.0, y: 2 }] },
    'bosses/Final_Boss/Final_Minion_04.png': { size: [16, 16], visibleBounds: [3, 2, 10, 12], muzzles: [{ x: 8.0, y: 2 }] }
  };

  const BULLET_COLORS = ['Red', 'Orange', 'Yellow', 'Lime', 'Cyan', 'Blue', 'Violet', 'Pink'];
  const BULLET_SHAPES = {
    Orb:     { size: [8, 8],  collision: { type: 'circle', radius: 2.0 }, forward: 'radial' },
    Diamond: { size: [8, 8],  collision: { type: 'circle', radius: 2.5 }, forward: 'radial' },
    Needle:  { size: [12, 6], collision: { type: 'capsule', radius: 1.0, length: 7.0 }, forward: 'right' }
  };

  // Laser metadata matching assets/lasers/manifest.json
  const LASER_COLORS = ['Cyan', 'Blue', 'Red', 'Orange', 'Yellow', 'Lime', 'Violet', 'Pink'];
  const LASER_STAGES = {
    1: { stage: 1, thickness: 4,  active: false, visibleY: [14, 18] },
    2: { stage: 2, thickness: 8,  active: false, visibleY: [12, 20] },
    3: { stage: 3, thickness: 12, active: true,  visibleY: [10, 22] }
  };

  const TIER_PALETTES = {
    1: { primary: 'Red',    secondary: 'Orange', accent: 'Yellow' },
    2: { primary: 'Orange', secondary: 'Red',    accent: 'Pink'   },
    3: { primary: 'Cyan',   secondary: 'Blue',   accent: 'Lime'   },
    4: { primary: 'Blue',   secondary: 'Violet', accent: 'Cyan'   },
    5: { primary: 'Red',    secondary: 'Pink',   accent: 'Orange' },
    6: { primary: 'Orange', secondary: 'Yellow', accent: 'Red'    },
    7: { primary: 'Lime',   secondary: 'Yellow', accent: 'Cyan'   },
    8: { primary: 'Blue',   secondary: 'Cyan',   accent: 'Blue'   }
  };

  const BOSS_BAR_IDS = [
    'Tier_01', 'Tier_02', 'Tier_03', 'Tier_04',
    'Tier_05', 'Tier_06', 'Tier_07', 'Tier_08',
    'Final_Shadow', 'Final_Revealed'
  ];

  // Weapon descriptions for Reward UI
  const WEAPON_LEVEL_DESCS = [
    '기본 정면 단발 사격',
    '정면 평행 2연발 사격',
    '정면 2연발 + 사선 2발 확산 사격',
    '관통 초승달 정면 연사',
    '관통 초승달 정면·상하 사선 3방향 연사'
  ];

  // ============================================================================
  // 4. ASSET LOADER & CACHE
  // ============================================================================
  const assets = {
    images: new Map(),
    failedPaths: [],
    loadedCount: 0,
    totalCount: 0,
    ready: false
  };

  function loadImage(relPath) {
    if (assets.images.has(relPath)) {
      return Promise.resolve(assets.images.get(relPath));
    }
    assets.totalCount++;
    const fullUrl = encodeURI(`assets/${relPath}`);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        assets.loadedCount++;
        assets.images.set(relPath, img);
        updateLoadingUI();
        resolve(img);
      };
      img.onerror = () => {
        assets.loadedCount++;
        assets.failedPaths.push(relPath);
        updateLoadingUI();
        resolve(null);
      };
      img.src = fullUrl;
    });
  }

  function updateLoadingUI() {
    const el = document.getElementById('loading-progress');
    if (el) {
      el.textContent = `${assets.loadedCount} / ${assets.totalCount}`;
    }
    const warnEl = document.getElementById('asset-warning');
    if (warnEl && assets.failedPaths.length > 0) {
      warnEl.textContent = `에셋 폴백 처리됨: ${assets.failedPaths.length}건`;
    }
  }

  async function preloadAllAssets() {
    const paths = new Set();

    // 1. Player & Meteor
    paths.add('player/주인공.png');
    paths.add('extras/Single_Sprite.png');
    paths.add('bullets/Player_Piercing_Crescent.png');

    // 2. UI Hearts & Font Glyphs
    paths.add('ui/player/Heart_Full.png');
    paths.add('ui/player/Heart_Empty.png');
    paths.add('ui/player/Heart_Hit.png');
    for (let d = 0; d <= 9; d++) paths.add(`ui/font/Glyph_${d}.png`);
    paths.add('ui/font/Glyph_Colon.png');
    paths.add('ui/font/Glyph_Times.png');

    // 3. 24 Bullets
    for (const color of BULLET_COLORS) {
      for (const shape of Object.keys(BULLET_SHAPES)) {
        paths.add(`bullets/${shape}_${color}.png`);
      }
    }

    // 4. Lasers (8 colors x 3 stages x 4 components)
    for (const color of LASER_COLORS) {
      for (let st = 1; st <= 3; st++) {
        for (const part of ['Origin', 'Body', 'Tip', 'Full']) {
          paths.add(`lasers/${color}/Laser_${color}_Stage_0${st}_${part}.png`);
        }
      }
    }

    // 5. Boss Bars (10 types x 4 layers)
    for (const id of BOSS_BAR_IDS) {
      paths.add(`ui/boss_bars/${id}_Full.png`);
      paths.add(`ui/boss_bars/${id}_Empty.png`);
      paths.add(`ui/boss_bars/${id}_Frame.png`);
      paths.add(`ui/boss_bars/${id}_Fill.png`);
    }

    // 6. Tier 1-8 Enemies & Bosses
    for (let t = 1; t <= 8; t++) {
      const tid = `Tier_0${t}`;
      for (let e = 1; e <= 4; e++) {
        paths.add(`enemies/${tid}/Enemy_0${e}.png`);
      }
      paths.add(`enemies/${tid}/Boss.png`);
    }

    // 7. Tier 04 Separated Boss Body & 2 Escorts
    paths.add('bosses/Tier_04/Boss_Body.png');
    paths.add('bosses/Tier_04/Escort_01.png');
    paths.add('bosses/Tier_04/Escort_02.png');

    // 8. Final Boss (Shadow, Revealed_Body, and 4 independent escorts)
    paths.add('bosses/Final_Boss/Final_Boss_Shadow.png');
    paths.add('bosses/Final_Boss/Final_Boss_Revealed_Body.png');
    for (let m = 1; m <= 4; m++) {
      paths.add(`bosses/Final_Boss/Final_Minion_0${m}.png`);
    }

    // 9. Space_Unique Background PNGs
    for (const item of SPACE_UNIQUE_LAYOUT) {
      paths.add(`backgrounds/Space_Unique/${item.file}`);
    }

    await Promise.all(Array.from(paths).map(loadImage));

    // Fallback to rendered/Part_XX.svg if any background PNG failed
    const fallbackPromises = [];
    SPACE_UNIQUE_LAYOUT.forEach((item, idx) => {
      const pngPath = `backgrounds/Space_Unique/${item.file}`;
      if (!assets.images.get(pngPath)) {
        const partNum = String(idx + 1).padStart(2, '0');
        fallbackPromises.push(loadImage(`backgrounds/Space_Unique/rendered/Part_${partNum}.svg`));
      }
    });
    if (fallbackPromises.length > 0) {
      await Promise.all(fallbackPromises);
    }

    assets.ready = true;
    document.getElementById('loading-banner')?.classList.add('hidden');
  }

  // ============================================================================
  // ============================================================================
  // 5. GEOMETRY, ROTATION, BOUNDS, MUZZLES & ENEMY HP FORMULA (V3 Steep Curve)
  // ============================================================================
  const ENEMY_STAGE_HP_MULT = [1.0, 1.35, 1.8, 2.4];

  const BOSS_HP_TABLE = {
    1: 600,
    2: 900,
    3: 1300,
    4: 1900,
    5: 2700,
    6: 3800,
    7: 5200,
    8: 7000,
    9: 6500,   // Final_Shadow
    10: 13000  // Final_Revealed
  };

  /**
   * Computes regular enemy max HP from separate tier (1..8) and enemyIdx (1..4) axes.
   * Doubles regular enemy durability while keeping tier/stage progression.
   * Uses exponential tier scaling (1.25^(tier-1)) and steeper stage multipliers [1.0, 1.35, 1.8, 2.4].
   * Guarantees Enemy_01 < 02 < 03 < 04 within every tier, and Tier 1 < 2 < ... < 8 for every stage.
   */
  function getEnemyMaxHp(tier, enemyIdx) {
    const t = Math.max(1, Math.min(8, tier));
    const idx = Math.max(1, Math.min(4, enemyIdx));
    const base = 34 * Math.pow(1.25, t - 1);
    return 2 * Math.ceil(base * ENEMY_STAGE_HP_MULT[idx - 1]);
  }

  /**
   * Computes regular enemy fire interval (2.2s ~ 3.6s base + 15~25% jitter).
   */
  function computeEnemyFireInterval(tier, enemyIdx) {
    const base = (3.30 - (tier - 1) * 0.11) + (enemyIdx - 1) * 0.14;
    const jitter = 0.82 + Math.random() * 0.36; // +/- 18% jitter
    return Math.max(2.05, Math.min(3.85, base * jitter));
  }

  function getRotatedBounds(cx, cy, spec, isPlayer, scale = CONFIG.SHIP_SCALE) {
    const [W, H] = spec.size;
    const [bx, by, bw, bh] = spec.visibleBounds;

    if (isPlayer) {
      // +90 deg CW: (dx, dy) -> (-dy, dx)
      const left   = cx + (H / 2 - (by + bh)) * scale;
      const right  = cx + (H / 2 - by) * scale;
      const top    = cy + (bx - W / 2) * scale;
      const bottom = cy + (bx + bw - W / 2) * scale;
      return {
        left, right, top, bottom,
        width: right - left,
        height: bottom - top,
        canvasLeft: cx - (H / 2) * scale,
        canvasRight: cx + (H / 2) * scale
      };
    } else {
      // -90 deg CCW: (dx, dy) -> (dy, -dx)
      const left   = cx + (by - H / 2) * scale;
      const right  = cx + (by + bh - H / 2) * scale;
      const top    = cy + (W / 2 - (bx + bw)) * scale;
      const bottom = cy + (W / 2 - bx) * scale;
      return {
        left, right, top, bottom,
        width: right - left,
        height: bottom - top,
        canvasLeft: cx - (H / 2) * scale,
        canvasRight: cx + (H / 2) * scale
      };
    }
  }

  function getWorldMuzzles(cx, cy, spec, isPlayer, scale = CONFIG.SHIP_SCALE) {
    const [W, H] = spec.size;
    if (!spec.muzzles || spec.muzzles.length === 0) {
      const b = getRotatedBounds(cx, cy, spec, isPlayer, scale);
      return [{ x: Math.round(isPlayer ? b.right : b.left), y: Math.round(cy), kind: 'fallback-edge' }];
    }
    return spec.muzzles.map((m) => {
      if (isPlayer) {
        return {
          x: Math.round(cx + (H / 2 - m.y) * scale),
          y: Math.round(cy + (m.x - W / 2) * scale),
          kind: m.kind || 'muzzle'
        };
      } else {
        return {
          x: Math.round(cx + (m.y - H / 2) * scale),
          y: Math.round(cy + (W / 2 - m.x) * scale),
          kind: m.kind || 'muzzle'
        };
      }
    });
  }

  /**
   * Enforces the right-1/3 screen movement restriction (leftEdge >= 856).
   * Exempt ONLY when:
   * - Entity is a Tier_08 Dasher (exemptFromRightThird = true)
   * - Entity is Tier_05 Boss in DASH / OFFSCREEN / RETURN
   * - Entity is Revealed Final Boss (or its 4 accompanying escorts) during RUSH / RETURN
   */
  function enforceRightThirdBound(entity) {
    if (entity.exemptFromRightThird) return;
    if (entity.kind === 'TIER_BOSS' && entity.tier === 5 &&
        (entity.dashState === 'DASH' || entity.dashState === 'OFFSCREEN' || entity.dashState === 'RETURN')) {
      return;
    }
    if (entity.kind === 'FINAL_REVEALED' &&
        (entity.rushState === 'RUSH' || entity.rushState === 'RETURN')) {
      return;
    }
    if (entity.kind === 'FINAL_ESCORT' && state.boss && state.boss.kind === 'FINAL_REVEALED' &&
        (state.boss.rushState === 'RUSH' || state.boss.rushState === 'RETURN')) {
      return;
    }

    const spec = entity.spec;
    const scale = entity.scale || CONFIG.SHIP_SCALE;
    const [W, H] = spec.size;
    const [bx, by, bw, bh] = spec.visibleBounds;

    const leftRadius = Math.max(H / 2 - by, H / 2) * scale;
    const rightRadius = (by + bh - H / 2) * scale;
    const topRadius = (bx + bw - W / 2) * scale;
    const bottomRadius = (W / 2 - bx) * scale;

    const minCenterX = CONFIG.ENEMY_MIN_X + leftRadius;
    if (entity.x < minCenterX) {
      entity.x = minCenterX;
    }

    if (!entity.entering && !entity.retreating) {
      const maxCenterX = CONFIG.CANVAS_WIDTH - 10 - rightRadius;
      if (entity.x > maxCenterX) {
        entity.x = maxCenterX;
      }
    }

    const minCenterY = 56 + topRadius;
    const bottomMargin = entity.kind === 'FINAL_REVEALED' && entity.finalSweep?.upward ? 0 : 14;
    const maxCenterY = CONFIG.CANVAS_HEIGHT - bottomMargin - bottomRadius;
    if (entity.y < minCenterY) entity.y = minCenterY;
    if (entity.y > maxCenterY) entity.y = maxCenterY;
  }

  /**
   * Computes exact distance from ray origin (ox, oy) along direction (cosA, sinA)
   * to the canvas viewport border [0, W] x [0, H].
   */
  function computeRayDistanceToScreenEdge(ox, oy, angleRad) {
    const dx = Math.cos(angleRad);
    const dy = Math.sin(angleRad);
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;
    let minT = 2200;

    if (Math.abs(dx) > 1e-6) {
      const tx0 = (0 - ox) / dx;
      const txW = (W - ox) / dx;
      if (tx0 > 0) minT = Math.min(minT, tx0);
      if (txW > 0) minT = Math.min(minT, txW);
    }
    if (Math.abs(dy) > 1e-6) {
      const ty0 = (0 - oy) / dy;
      const tyH = (H - oy) / dy;
      if (ty0 > 0) minT = Math.min(minT, ty0);
      if (tyH > 0) minT = Math.min(minT, tyH);
    }
    return Math.max(48, Math.min(2200, minT + 16));
  }

  // ============================================================================
  // 6. GAME STATE & PLAYER UPGRADES
  // ============================================================================
  const keys = new Set();
  const state = {
    mode: 'PLAYING', // 'PLAYING' | 'PAUSED' | 'REWARD' | 'GAMEOVER' | 'CLEAR'
    score: 0,
    currentTier: 1,
    phase: 'WAVE',   // 'WAVE' | 'BOSS' | 'FINAL_SHADOW' | 'FINAL_REVEALED'
    tierWaveElapsed: 0.0,
    cumulativeWaveTime: 0.0, // Excludes boss fight and reward selection durations
    waveDuration: CONFIG.WAVE_DURATION,

    bgScrollX: 0.0,
    enemySpawnTimer: 0.6,
    meteorSpawnTimer: 7.0,

    // Reward Selection State (Even Bosses: Tier 02, 04, 06, 08)
    rewardPendingTier: null,
    rewardKeyLock: false,
    rewardsChosenHistory: [],

    debugInvincible: false,
    debugShowHitboxes: false,

    player: null,
    enemies: [],
    boss: null,
    escorts: [],        // Used in Tier_04 (2 destructible escorts) and Final_Revealed (4 invulnerable escorts)
    playerBullets: [],
    enemyBullets: [],
    lasers: [],         // Active 3-stage lasers (Tier 07, Tier 08, Final_Revealed escorts)
    missiles: [],       // Active timed wing missiles (Tier 06 4-missile salvos)
    explosions: [],     // Timed blast visual effects
    dashWarnings: [],   // Pre-warning trajectories for Tier_08 Enemy_04 dashers
    dashers: [],        // Active Tier_08 Enemy_04 high-speed dashers (all 8 directions)
    meteors: [],
    meteorWarnings: [],
    particles: [],
    floatingTexts: [],

    telemetry: {
      minEnemyLeftEdgeObserved: Infinity,
      minBossLeftEdgeObserved: Infinity,
      minEscortLeftEdgeObserved: Infinity,
      shadowEscortCountObserved: 0,
      revealedEscortCountObserved: 0,
      tier4EscortCountObserved: 0,
      escortHitDeflections: 0,
      tier8BulletsFired: 0,
      tier6NormalBulletsFired: 0,
      tier6SalvosFired: 0,
      tier6MissilesSpawned: 0,
      tier5MaxAbsVyDuringDash: 0,
      tier8DashersSpawned: 0,
      tier8DasherSpeeds: [],
      laserStartHeights: [],
      sweepingLasersFired: 0,
      maxBossFrameStepDuringLaser: 0,
      escortLasersByIdx: { 1: 0, 2: 0, 3: 0, 4: 0 },
      finalBossRushCount: 0,
      minFinalBossRushX: Infinity,
      minFinalEscortRushX: Infinity,
      dashDirectionsUsed: new Set(),
      rewardsOpenedForTiers: []
    }
  };

  function createPlayer() {
    const spec = SPRITE_SPECS['player/주인공.png'];
    return {
      path: 'player/주인공.png',
      spec,
      baseScale: CONFIG.SHIP_SCALE,
      scaleMultiplier: 1.0,
      scale: CONFIG.SHIP_SCALE,
      speedMultiplier: 1.0,
      hitboxRadius: CONFIG.PLAYER_BASE_HITBOX_RADIUS,
      x: 160,
      y: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      prevX: 160,
      prevY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      hp: CONFIG.PLAYER_MAX_HP,
      maxHp: CONFIG.PLAYER_MAX_HP,
      vitalityLevel: 0,
      weaponLevel: 0,    // Only increases when 'equipment' is chosen at even-boss reward
      mobilityLevel: 0,  // Only increases when 'mobility' is chosen at even-boss reward
      shotCounter: 0,
      fireCooldown: 0.0,
      invulnTimer: 0.0,
      hitFlashTimer: 0.0
    };
  }

  function syncPlayerUpgradeStats(p) {
    if (!p) return;
    p.scaleMultiplier = Math.max(0.74, Math.pow(0.93, p.mobilityLevel));
    p.scale = Number((p.baseScale * p.scaleMultiplier).toFixed(3));
    p.speedMultiplier = Number(Math.pow(1.06, p.mobilityLevel).toFixed(4));
    p.hitboxRadius = Number((CONFIG.PLAYER_BASE_HITBOX_RADIUS * p.scaleMultiplier).toFixed(2));
  }

  function clearAllCombatHazards() {
    state.enemyBullets = [];
    state.lasers = [];
    state.missiles = [];
    state.explosions = [];
    state.dashWarnings = [];
    state.dashers = [];
    state.meteors = [];
    state.meteorWarnings = [];
    state.escorts = [];
    state.enemies = [];
  }

  function resetGame() {
    state.mode = 'PLAYING';
    state.score = 0;
    state.currentTier = 1;
    state.phase = 'WAVE';
    state.tierWaveElapsed = 0.0;
    state.cumulativeWaveTime = 0.0;
    state.waveDuration = CONFIG.WAVE_DURATION;
    state.enemySpawnTimer = 0.7;
    state.meteorSpawnTimer = 7.5;
    state.rewardPendingTier = null;
    state.rewardKeyLock = false;
    state.rewardsChosenHistory = [];

    state.player = createPlayer();
    clearAllCombatHazards();
    state.boss = null;
    state.playerBullets = [];
    state.particles = [];
    state.floatingTexts = [];

    state.telemetry.minEnemyLeftEdgeObserved = Infinity;
    state.telemetry.minBossLeftEdgeObserved = Infinity;
    state.telemetry.minEscortLeftEdgeObserved = Infinity;
    state.telemetry.shadowEscortCountObserved = 0;
    state.telemetry.revealedEscortCountObserved = 0;
    state.telemetry.tier4EscortCountObserved = 0;
    state.telemetry.escortHitDeflections = 0;
    state.telemetry.tier8BulletsFired = 0;
    state.telemetry.tier6NormalBulletsFired = 0;
    state.telemetry.tier6SalvosFired = 0;
    state.telemetry.tier6MissilesSpawned = 0;
    state.telemetry.tier5MaxAbsVyDuringDash = 0;
    state.telemetry.tier8DashersSpawned = 0;
    state.telemetry.tier8DasherSpeeds = [];
    state.telemetry.laserStartHeights = [];
    state.telemetry.sweepingLasersFired = 0;
    state.telemetry.maxBossFrameStepDuringLaser = 0;
    state.telemetry.escortLasersByIdx = { 1: 0, 2: 0, 3: 0, 4: 0 };
    state.telemetry.finalBossRushCount = 0;
    state.telemetry.minFinalBossRushX = Infinity;
    state.telemetry.minFinalEscortRushX = Infinity;
    state.telemetry.dashDirectionsUsed = new Set();
    state.telemetry.rewardsOpenedForTiers = [];

    hideOverlay();
    hideRewardModal();
    updateHudBadges();
  }

  // ============================================================================
  // 7. EVEN-BOSS REWARD SELECTION SYSTEM (Tier 02, 04, 06, 08 ONLY)
  // ============================================================================
  function isEvenRewardTier(tier) {
    return tier === 2 || tier === 4 || tier === 6 || tier === 8;
  }

  function openRewardSelection(defeatedTier) {
    if (state.mode === 'REWARD') return;
    clearAllCombatHazards();
    state.boss = null;
    state.mode = 'REWARD';
    state.rewardPendingTier = defeatedTier;
    state.rewardKeyLock = false;
    state.telemetry.rewardsOpenedForTiers.push(defeatedTier);

    const p = state.player;
    const badgeEl = document.getElementById('reward-tier-badge');
    const statVitEl = document.getElementById('reward-stat-vitality');
    const descEqEl = document.getElementById('reward-desc-equipment');
    const statEqEl = document.getElementById('reward-stat-equipment');
    const statMobEl = document.getElementById('reward-stat-mobility');

    if (badgeEl) {
      badgeEl.textContent = `TIER 0${defeatedTier} BOSS DEFEATED — REWARD (${state.rewardsChosenHistory.length + 1}/4)`;
    }
    if (p && statVitEl) {
      const nextMax = p.maxHp + 1;
      const nextHp = p.hp;
      statVitEl.textContent = `현재: ${p.hp}/${p.maxHp} → 선택 후: ${nextHp}/${nextMax}`;
    }
    if (p && statEqEl && descEqEl) {
      const nextLv = Math.min(4, p.weaponLevel + 1);
      descEqEl.innerHTML = `무기 1단계 진화<br/><strong>${WEAPON_LEVEL_DESCS[nextLv]}</strong>`;
      statEqEl.textContent = `무기 레벨: Lv${p.weaponLevel} → Lv${nextLv}`;
    }
    if (p && statMobEl) {
      const curScale = (CONFIG.SHIP_SCALE * Math.max(0.74, Math.pow(0.93, p.mobilityLevel))).toFixed(2);
      const nxtScale = (CONFIG.SHIP_SCALE * Math.max(0.74, Math.pow(0.93, p.mobilityLevel + 1))).toFixed(2);
      const curSpd = Math.round(Math.pow(1.06, p.mobilityLevel) * 100);
      const nxtSpd = Math.round(Math.pow(1.06, p.mobilityLevel + 1) * 100);
      statMobEl.textContent = `배율: ${curScale}x → ${nxtScale}x / 속도: ${curSpd}% → ${nxtSpd}%`;
    }

    document.getElementById('reward-screen')?.classList.remove('hidden');
    updateHudBadges();
  }

  function hideRewardModal() {
    document.getElementById('reward-screen')?.classList.add('hidden');
  }

  function applyRewardChoice(choiceType) {
    if (state.mode !== 'REWARD' || state.rewardKeyLock) return;
    if (!['vitality', 'equipment', 'mobility'].includes(choiceType)) return;

    state.rewardKeyLock = true;
    const p = state.player;
    const defeatedTier = state.rewardPendingTier;

    if (p) {
      if (choiceType === 'vitality') {
        p.vitalityLevel += 1;
        p.maxHp += 1;
        state.floatingTexts.push({
          text: `체력 강화! HP ${p.hp}/${p.maxHp}`,
          x: p.x,
          y: p.y - 36,
          color: '#ff6b86',
          timer: 2.0
        });
      } else if (choiceType === 'equipment') {
        p.weaponLevel = Math.min(4, p.weaponLevel + 1);
        state.floatingTexts.push({
          text: `장비 진화! WEAPON Lv${p.weaponLevel}`,
          x: p.x,
          y: p.y - 36,
          color: '#50e5ff',
          timer: 2.0
        });
      } else if (choiceType === 'mobility') {
        p.mobilityLevel = Math.min(4, p.mobilityLevel + 1);
        syncPlayerUpgradeStats(p);
        state.floatingTexts.push({
          text: `기동성 강화! MOBILITY +${p.mobilityLevel}`,
          x: p.x,
          y: p.y - 36,
          color: '#a8ec46',
          timer: 2.0
        });
      }
    }

    state.rewardsChosenHistory.push({ tier: defeatedTier, choice: choiceType });
    state.rewardPendingTier = null;
    hideRewardModal();
    state.mode = 'PLAYING';

    // Proceed to the next stage after reward selection
    if (defeatedTier && defeatedTier < CONFIG.TOTAL_TIERS) {
      advanceToNextTierWave(defeatedTier + 1);
    } else {
      // Tier 08 reward selected -> start Shadow Final Boss!
      startShadowBoss();
    }
    updateHudBadges();
  }

  function advanceToNextTierWave(nextTier) {
    state.currentTier = nextTier;
    state.phase = 'WAVE';
    state.tierWaveElapsed = 0.0;
    state.cumulativeWaveTime = (nextTier - 1) * CONFIG.WAVE_DURATION;
    state.enemySpawnTimer = 0.85;
    state.floatingTexts.push({
      text: `TIER 0${state.currentTier} WAVE START!`,
      x: CONFIG.CANVAS_WIDTH / 2,
      y: 190,
      color: '#50e5ff',
      timer: 1.8
    });
    updateHudBadges();
  }

  // ============================================================================
  // 8. SPAWNING ENEMIES, TIER BOSSES, ESCORTS, LASERS, MISSILES & DASHERS
  // ============================================================================
  function spawnWaveEnemy(tier, options = {}) {
    const enemyIdx = options.enemyIdx || (1 + Math.floor(Math.random() * 4));
    const relPath = `enemies/Tier_0${tier}/Enemy_0${enemyIdx}.png`;
    const spec = SPRITE_SPECS[relPath];
    const scale = CONFIG.SHIP_SCALE;
    const [, H] = spec.size;
    const [, by] = spec.visibleBounds;

    const leftRadius = Math.max(H / 2 - by, H / 2) * scale;
    const minHomeX = CONFIG.ENEMY_MIN_X + leftRadius + 16;
    const maxHomeX = CONFIG.CANVAS_WIDTH - 58;
    const homeX = Math.round(minHomeX + Math.random() * Math.max(20, maxHomeX - minHomeX));
    const homeY = Math.round(96 + Math.random() * (CONFIG.CANVAS_HEIGHT - 180));

    const maxHp = getEnemyMaxHp(tier, enemyIdx);
    const fireInterval = computeEnemyFireInterval(tier, enemyIdx);
    // Stagger initial shot cooldown so enemies of the same wave never fire in unison
    const initialCooldown = 1.15 + Math.random() * 1.55 + ( state.enemies.length * 0.32 );

    const enemy = {
      id: Math.random().toString(36).slice(2),
      tier,
      enemyIdx,
      path: relPath,
      spec,
      scale,
      x: CONFIG.CANVAS_WIDTH + 60,
      y: homeY,
      homeX,
      homeY,
      hp: maxHp,
      maxHp,
      entering: true,
      retreating: false,
      age: 0.0,
      phaseOffset: Math.random() * Math.PI * 2,
      moveAmpX: 14 + Math.random() * 22,
      moveAmpY: 26 + Math.random() * 50,
      moveFreqX: 1.0 + Math.random() * 1.1,
      moveFreqY: 1.2 + Math.random() * 1.3,
      fireCooldown: initialCooldown,
      fireInterval,
      hitFlash: 0.0
    };
    enemy.specialState = 'NORMAL';
    enemy.specialTimer = 0;
    enemy.specialCooldown = 3 + Math.random() * 2;
    enemy.summonedBy = options.summonedBy || null;
    if (tier === 8) prepareEnemyFlyby(enemy);
    enforceRightThirdBound(enemy);
    state.enemies.push(enemy);
    return enemy;
  }

  // V4: special movement belongs to the same enemy throughout its lifecycle.
  // No extra copies or independent timers can survive a wave/boss cleanup.
  function moveEnemyToward(e, x, y, speed, dt) {
    const dx = x - e.x, dy = y - e.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(distance, speed * dt);
    if (distance > 0) { e.x += dx / distance * step; e.y += dy / distance * step; }
    return distance <= speed * dt + 0.01;
  }

  function prepareEnemyFlyby(e) {
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT;
    const direction = Math.floor(Math.random() * 8);
    const target = { x: 200 + Math.random() * (W - 400), y: 150 + Math.random() * (H - 300) };
    const starts = [
      [-85, 100 + Math.random() * (H - 200)], [W + 85, 100 + Math.random() * (H - 200)],
      [100 + Math.random() * (W - 200), -85], [100 + Math.random() * (W - 200), H + 85],
      [-85, -85], [W + 85, -85], [-85, H + 85], [W + 85, H + 85]
    ];
    [e.x, e.y] = starts[direction];
    const angle = Math.atan2(target.y - e.y, target.x - e.x);
    e.specialAngle = angle;
    e.specialVx = Math.cos(angle) * 1400;
    e.specialVy = Math.sin(angle) * 1400;
    e.warningX = e.x; e.warningY = e.y;
    e.specialState = 'FLYBY_WARN'; e.specialTimer = 0.85;
    e.exemptFromRightThird = true;
  }

  function startEnemyDash(e) {
    const p = state.player;
    if (!p) return;
    // Sweep fully past the left wall, then re-enter from outside the right wall.
    e.specialAngle = Math.PI;
    e.specialVx = -540;
    e.specialVy = 0;
    e.specialDuration = (e.x + 100) / 540;
    e.warningX = e.x; e.warningY = e.y;
    e.specialState = 'DASH_WARN'; e.specialTimer = 0.8;
    e.exemptFromRightThird = true;
  }

  function beginEnemySuicide(e) {
    if (e.deathHandled) return;
    e.deathHandled = true;
    state.score += 100 * e.tier + 25 * e.enemyIdx;
    e.specialState = 'SUICIDE_APPROACH';
    e.specialTimer = 0;
    e.entering = false;
    e.exemptFromRightThird = true;
    e.blastRadius = CONFIG.TIER6_SUICIDE_RADII[e.enemyIdx - 1];
    const p = state.player;
    const angle = Math.random() * Math.PI * 2;
    const offset = 12 + Math.random() * 24;
    e.targetX = Math.max(35, Math.min(CONFIG.CANVAS_WIDTH - 35, (p?.x || 200) + Math.cos(angle) * offset));
    e.targetY = Math.max(70, Math.min(CONFIG.CANVAS_HEIGHT - 35, (p?.y || 362) + Math.sin(angle) * offset));
  }

  function removeEnemy(e) {
    state.lasers = state.lasers.filter(b => b.followEnemyId !== e.id);
    const index = state.enemies.indexOf(e);
    if (index !== -1) state.enemies.splice(index, 1);
  }

  function updateEnemySpecial(e, dt) {
    const s = e.specialState;
    if (s === 'NORMAL') return false;
    const previousX = e.x, previousY = e.y;
    e.specialTimer -= dt;
    if (s === 'SUICIDE_APPROACH') {
      e.specialAngle = Math.atan2(e.targetY - e.y, e.targetX - e.x);
      if (moveEnemyToward(e, e.targetX, e.targetY, 480, dt)) {
        // The approach is the warning period; arrival detonates immediately.
        detonateMissile({ x: e.x, y: e.y, blastRadius: e.blastRadius, damageDealt: false });
        removeEnemy(e);
      }
    } else if (s === 'FLYBY_WARN' || s === 'DASH_WARN') {
      if (e.specialTimer <= 0) {
        e.specialState = s === 'FLYBY_WARN' ? 'FLYBY' : 'DASH';
        e.specialTimer = s === 'FLYBY_WARN' ? 3 : e.specialDuration;
      }
    } else if (s === 'FLYBY' || s === 'DASH') {
      e.x += e.specialVx * dt; e.y += e.specialVy * dt;
      const p = state.player;
      const radius = Math.min(e.spec.visibleBounds[2], e.spec.visibleBounds[3]) * e.scale * 0.3;
      if (p && distSqPointToSegment(p.x, p.y, previousX, previousY, e.x, e.y) <= (p.hitboxRadius + radius) ** 2) {
        damagePlayer(CONFIG.DASH_DAMAGE, 'ENEMY DASH');
      }
      const inScreen = e.x > -65 && e.x < CONFIG.CANVAS_WIDTH + 65 && e.y > -65 && e.y < CONFIG.CANVAS_HEIGHT + 65;
      if (inScreen) e.flybyEntered = true;
      if ((s === 'FLYBY' && e.flybyEntered && !inScreen) || e.specialTimer <= 0 ||
          (s === 'DASH' && !inScreen)) {
        e.specialState = 'RETURN'; e.specialTimer = 0.35;
      }
    } else if (s === 'RETURN') {
      // Wrap only outside the viewport, then visibly re-enter from the right.
      if ((e.tier === 8 || e.tier === 5) && !e.returnPrepared) {
        if (e.specialTimer > 0) return true;
        e.x = CONFIG.CANVAS_WIDTH + 100; e.y = e.homeY;
        e.returnPrepared = true;
      }
      if (moveEnemyToward(e, e.homeX, e.homeY, 650, dt)) {
        e.specialState = 'NORMAL'; e.exemptFromRightThird = false; e.entering = false;
        e.specialCooldown = 4.5 + Math.random() * 2;
        e.returnPrepared = false;
        e.fireCooldown = 0.9 + Math.random();
        e.age = 0; e.phaseOffset = Math.PI / 2;
      }
    }
    return true;
  }

  function fireSmallEnemyLaser(e) {
    const owned = state.lasers.filter(b => b.followEnemyId);
    if (owned.length >= CONFIG.ENEMY_SMALL_LASER_LIMIT || owned.some(b => b.followEnemyId === e.id)) return false;
    const m = getWorldMuzzles(e.x, e.y, e.spec, false, e.scale)[0];
    const p = state.player;
    const angle = Math.PI + Math.max(-0.3, Math.min(0.3,
      Math.atan2((p?.y || 362) - m.y, Math.max(1, m.x - (p?.x || 160))) * -1));
    spawnLaserBeam({ color: 'Cyan', scale: 1, widthMultiplier: 0.85,
      stage1Time: 0.6, stage2Time: 0.25, stage3Time: 0.5,
      ox: m.x, oy: m.y, angle, followEnemyId: e.id, damage: 1 });
    return true;
  }

  function createTier4Escort(idx, boss) {
    const relPath = `bosses/Tier_04/Escort_0${idx}.png`;
    const spec = SPRITE_SPECS[relPath];
    const isTop = idx === 1;
    const escort = {
      id: `t4_escort_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      kind: 'TIER4_ESCORT',
      idx,
      path: relPath,
      spec,
      scale: CONFIG.SHIP_SCALE,
      x: boss.x + (isTop ? -70 : -50),
      y: boss.y + (isTop ? -115 : 115),
      hp: 240,
      maxHp: 240,
      invulnerable: false, // Destructible in Tier 04!
      respawnRemaining: 1,
      age: idx * 1.9,
      profile: {
        offsetX: isTop ? -85 : -65,
        offsetY: isTop ? -120 : 120,
        freqX1: isTop ? 2.1 : 1.7,
        freqX2: isTop ? 3.3 : 2.9,
        freqY1: isTop ? 1.8 : 2.4,
        freqY2: isTop ? 2.7 : 1.5,
        ampX: isTop ? 42 : 48,
        ampY: isTop ? 58 : 64,
        speed: isTop ? 235 : 250,
        fireInterval: isTop ? 1.85 : 2.15,
        bulletShape: isTop ? 'Diamond' : 'Needle',
        bulletColor: isTop ? 'Cyan' : 'Blue',
        patternType: isTop ? 'aimed_single' : 'spread2'
      },
      wanderOffsetX: 0,
      wanderOffsetY: 0,
      wanderTimer: 0.5,
      fireCooldown: 1.2 + idx * 0.45,
      hitFlash: 0.0,
      shieldFlash: 0.0,
      recoilX: 0.0,
      entering: false,
      retreating: false
    };
    enforceRightThirdBound(escort);
    return escort;
  }

  function startTierBoss(tier) {
    state.phase = 'BOSS';
    // Clear previous special hazards and tell remaining wave enemies to retreat
    state.lasers = [];
    state.missiles = [];
    state.explosions = [];
    state.dashWarnings = [];
    state.dashers = [];
    state.escorts = [];
    state.enemies = state.enemies.filter(e => !e.deathHandled);
    for (const e of state.enemies) {
      e.retreating = true;
      e.entering = false;
    }

    // Tier 04 uses separated Boss_Body.png so rear fighters are not duplicated on the hull
    const relPath = tier === 4
      ? 'bosses/Tier_04/Boss_Body.png'
      : `enemies/Tier_0${tier}/Boss.png`;
    const spec = SPRITE_SPECS[relPath];
    const maxHp = BOSS_HP_TABLE[tier] || (600 + tier * 500);

    const boss = {
      id: `tier-boss-${tier}-${Math.random().toString(36).slice(2)}`,
      kind: 'TIER_BOSS',
      tier,
      barId: `Tier_0${tier}`,
      path: relPath,
      spec,
      scale: CONFIG.SHIP_SCALE,
      x: CONFIG.CANVAS_WIDTH + 75,
      y: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      prevX: CONFIG.CANVAS_WIDTH + 75,
      prevY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      homeX: CONFIG.ENEMY_MIN_X + 245,
      homeY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      hp: maxHp,
      maxHp,
      defeatedHandled: false,
      entering: true,
      retreating: false,
      age: 0.0,
      // Continuous movement phase variables so speed adjustments never cause position jumps
      phaseX: 0.0,
      phaseY: 0.0,
      moveSpeedFactor: 1.0,
      attackTimer: 1.15,
      patternStep: 0,
      hitFlash: 0.0,

      // Tier 04 Escort respawn tracker
      t4EscortRespawnTimers: [],

      // Tier 05 High-Speed Horizontal Forward Dash state machine
      dashState: 'NORMAL', // 'NORMAL' | 'WARN' | 'DASH' | 'OFFSCREEN' | 'RETURN'
      dashCooldown: 4.0,
      dashTimer: 0.0,
      dashStartX: 0,
      dashY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      dashVx: -1320,
      dashVy: 0,
      dashSideShotTimer: 0.0,

      // Tier 06 4-Wing Missile Salvo state machine ('LOAD' -> 'FIRE' -> 'RECHARGE')
      missileState: 'LOAD',
      missileStateTimer: 0.75,
      missileVolleyIndex: 0,
      salvoTargets: [],
      salvoFiredCount: 0,
      salvoShotTimer: 0.0,

      // Tier 07 & Tier 08 Laser & Dasher state machine
      laserCycleCount: 0,
      laserVariant: 0,
      laserMode: 'IDLE', // 'IDLE' | 'PRIMARY' | 'ULTIMATE'
      laserModeTimer: 0.95,
      ultCorridorY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      ultSweepDir: 1,
      dasherSpawnTimer: 0.85,
      dasherWaveCount: 0,
      dasherDirQueue: []
    };

    enforceRightThirdBound(boss);
    state.boss = boss;

    if (tier === 4) {
      state.escorts = [
        createTier4Escort(1, boss),
        createTier4Escort(2, boss)
      ];
      state.telemetry.tier4EscortCountObserved = 2;
    }

    updateHudBadges();
  }

  function startShadowBoss() {
    state.phase = 'FINAL_SHADOW';
    clearAllCombatHazards();

    const relPath = 'bosses/Final_Boss/Final_Boss_Shadow.png';
    const spec = SPRITE_SPECS[relPath];
    const maxHp = BOSS_HP_TABLE[9]; // 6500
    const boss = {
      kind: 'FINAL_SHADOW',
      tier: 9,
      barId: 'Final_Shadow',
      path: relPath,
      spec,
      scale: CONFIG.FINAL_BOSS_SCALE,
      x: CONFIG.CANVAS_WIDTH + 90,
      y: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      prevX: CONFIG.CANVAS_WIDTH + 90,
      prevY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      homeX: CONFIG.ENEMY_MIN_X + 255,
      homeY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      hp: maxHp,
      maxHp,
      defeatedHandled: false,
      entering: true,
      retreating: false,
      age: 0.0,
      phaseX: 0.0,
      phaseY: 0.0,
      moveSpeedFactor: 1.0,
      attackTimer: 1.0,
      patternStep: 0,
      hitFlash: 0.0
    };
    enforceRightThirdBound(boss);
    state.boss = boss;
    state.floatingTexts.push({
      text: 'SHADOW BOSS APPROACHING',
      x: CONFIG.CANVAS_WIDTH / 2,
      y: 190,
      color: '#a782ff',
      timer: 2.0
    });
    updateHudBadges();
  }

  function startRevealedFinalBoss() {
    state.phase = 'FINAL_REVEALED';
    clearAllCombatHazards();

    const relPath = 'bosses/Final_Boss/Final_Boss_Revealed_Body.png';
    const spec = SPRITE_SPECS[relPath];
    const maxHp = BOSS_HP_TABLE[10]; // 13000
    const boss = {
      kind: 'FINAL_REVEALED',
      tier: 10,
      barId: 'Final_Revealed',
      path: relPath,
      spec,
      scale: CONFIG.FINAL_BOSS_SCALE,
      x: CONFIG.ENEMY_MIN_X + 265,
      y: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      prevX: CONFIG.ENEMY_MIN_X + 265,
      prevY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      homeX: CONFIG.ENEMY_MIN_X + 265,
      homeY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      hp: maxHp,
      maxHp,
      defeatedHandled: false,
      entering: true,
      revealTimer: 0.9,
      retreating: false,
      dyingTimer: 0.0,
      age: 0.0,
      phaseX: 0.0,
      phaseY: 0.0,
      moveSpeedFactor: 1.0,
      attackTimer: 1.1,
      patternStep: 0,
      hitFlash: 0.0,

      bulletTimer: 0.65,
      normalLaserTimer: 2.0,
      overdriveTimer: 10.0,
      sweepCount: 0,

      // V3 Slow Forward Rush state machine ('NORMAL' -> 'WARN' -> 'RUSH' -> 'RETURN' -> 'NORMAL')
      rushState: 'NORMAL',
      rushCooldown: 5.8,
      rushTimer: 0.0,
      rushY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      rushSpeed: 260,
      rushTargetX: 340
    };
    enforceRightThirdBound(boss);
    state.boss = boss;

    const escortProfiles = [
      {
        idx: 1,
        path: 'bosses/Final_Boss/Final_Minion_01.png',
        offsetX: -115, offsetY: -135,
        freqX1: 2.3, freqX2: 3.7, freqY1: 1.9, freqY2: 3.1,
        ampX: 48, ampY: 66,
        speed: 350,
        fireInterval: 1.35,
        initialDelay: 1.0,
        laserColor: 'Lime',
        laserInitialDelay: 1.6,
        laserInterval: 5.4,
        bulletShape: 'Needle', bulletColor: 'Lime', patternType: 'aimed_double'
      },
      {
        idx: 2,
        path: 'bosses/Final_Boss/Final_Minion_02.png',
        offsetX: -95, offsetY: 135,
        freqX1: 1.8, freqX2: 4.1, freqY1: 2.6, freqY2: 1.7,
        ampX: 52, ampY: 70,
        speed: 360,
        fireInterval: 1.50,
        initialDelay: 1.3,
        laserColor: 'Cyan',
        laserInitialDelay: 3.0,
        laserInterval: 5.9,
        bulletShape: 'Diamond', bulletColor: 'Cyan', patternType: 'fan3'
      },
      {
        idx: 3,
        path: 'bosses/Final_Boss/Final_Minion_03.png',
        offsetX: 55, offsetY: -175,
        freqX1: 2.9, freqX2: 1.6, freqY1: 2.2, freqY2: 3.8,
        ampX: 45, ampY: 62,
        speed: 370,
        fireInterval: 1.60,
        initialDelay: 1.6,
        laserColor: 'Yellow',
        laserInitialDelay: 4.4,
        laserInterval: 6.3,
        bulletShape: 'Orb', bulletColor: 'Yellow', patternType: 'burst2'
      },
      {
        idx: 4,
        path: 'bosses/Final_Boss/Final_Minion_04.png',
        offsetX: 65, offsetY: 175,
        freqX1: 2.1, freqX2: 3.3, freqY1: 2.8, freqY2: 2.0,
        ampX: 48, ampY: 64,
        speed: 355,
        fireInterval: 1.40,
        initialDelay: 1.85,
        laserColor: 'Pink',
        laserInitialDelay: 5.8,
        laserInterval: 6.8,
        bulletShape: 'Needle', bulletColor: 'Pink', patternType: 'spread2'
      }
    ];

    state.escorts = escortProfiles.map((p) => {
      const mSpec = SPRITE_SPECS[p.path];
      const escort = {
        id: `escort_${p.idx}`,
        kind: 'FINAL_ESCORT',
        idx: p.idx,
        path: p.path,
        spec: mSpec,
        scale: CONFIG.SHIP_SCALE,
        x: boss.x + p.offsetX,
        y: boss.y + p.offsetY,
        profile: p,
        age: p.idx * 1.37,
        wanderOffsetX: 0,
        wanderOffsetY: 0,
        wanderTimer: 0.4 + p.idx * 0.2,
        fireCooldown: p.initialDelay,
        laserCooldown: p.laserInitialDelay,
        laserColor: p.laserColor,
        activeLaserBeamId: null,
        invulnerable: true,
        hitFlash: 0.0,
        shieldFlash: 0.0,
        recoilX: 0.0,
        entering: false,
        retreating: false
      };
      enforceRightThirdBound(escort);
      return escort;
    });

    state.floatingTexts.push({
      text: 'TRUE FORM REVEALED! DEFEAT THE MAIN BODY!',
      x: CONFIG.CANVAS_WIDTH / 2,
      y: 190,
      color: '#ffcc45',
      timer: 2.4
    });
    updateHudBadges();
  }

  // ============================================================================
  // 9. PLAYER WEAPON EVOLUTION (Lv0 ~ Lv4) & ENEMY BULLET PATTERNS
  // ============================================================================
  function spawnPlayerBullet(opts) {
    state.playerBullets.push({
      path: opts.path,
      shape: opts.shape || 'Needle',
      size: opts.size || [12, 6],
      scale: opts.scale || CONFIG.BULLET_SCALE,
      radius: opts.radius || 5,
      x: opts.x,
      y: opts.y,
      prevX: opts.x,
      prevY: opts.y,
      vx: opts.vx,
      vy: opts.vy,
      angle: Math.atan2(opts.vy, opts.vx),
      damage: opts.damage,
      piercing: opts.piercing === true,
      hitTargets: opts.piercing ? new Set() : null
    });
  }

  function firePlayerWeapon(p) {
    const muzzles = getWorldMuzzles(p.x, p.y, p.spec, true, p.scale);
    const m = muzzles[0];
    const lv = p.weaponLevel;
    p.shotCounter += 1;

    if (lv <= 0) {
      // Lv0: Single front Needle_Cyan (~139.1 DPS)
      p.fireCooldown = 0.115;
      spawnPlayerBullet({
        path: 'bullets/Needle_Cyan.png',
        shape: 'Needle',
        size: [12, 6],
        scale: CONFIG.BULLET_SCALE,
        radius: 5,
        x: m.x,
        y: m.y,
        vx: 790,
        vy: 0,
        damage: 16
      });
    } else if (lv === 1) {
      // Lv1: Twin parallel front Needle_Cyan (~200.0 DPS)
      p.fireCooldown = 0.125;
      for (const dy of [-8, 8]) {
        spawnPlayerBullet({
          path: 'bullets/Needle_Cyan.png',
          shape: 'Needle',
          size: [12, 6],
          scale: CONFIG.BULLET_SCALE,
          radius: 5,
          x: m.x,
          y: m.y + dy,
          vx: 800,
          vy: 0,
          damage: 12.5
        });
      }
    } else if (lv === 2) {
      // Lv2: Twin front Needle_Cyan + 2 shallow diagonal Needle_Cyan (+/- 11 deg) (~292.9 DPS)
      p.fireCooldown = 0.14;
      for (const dy of [-7, 7]) {
        spawnPlayerBullet({
          path: 'bullets/Needle_Cyan.png',
          shape: 'Needle',
          size: [12, 6],
          scale: CONFIG.BULLET_SCALE,
          radius: 5,
          x: m.x,
          y: m.y + dy,
          vx: 810,
          vy: 0,
          damage: 11.5
        });
      }
      const diagSpeed = 790;
      for (const angDeg of [-11, 11]) {
        const rad = (angDeg * Math.PI) / 180;
        spawnPlayerBullet({
          path: 'bullets/Needle_Cyan.png',
          shape: 'Needle',
          size: [12, 6],
          scale: CONFIG.BULLET_SCALE,
          radius: 5,
          x: m.x,
          y: m.y,
          vx: Math.cos(rad) * diagSpeed,
          vy: Math.sin(rad) * diagSpeed,
          damage: 9.0
        });
      }
    } else {
      // Forms 4 and 5 (Lv3 / Lv4): user-authored piercing crescent, always facing travel direction.
      p.fireCooldown = 0.12;
      const angles = lv === 3 ? [0] : [-18, 0, 18];
      for (const degrees of angles) {
        const angle = degrees * Math.PI / 180;
        spawnPlayerBullet({
          path: 'bullets/Player_Piercing_Crescent.png', shape: 'Crescent',
          size: [32, 64], scale: 1.5, radius: 22,
          x: m.x, y: m.y, vx: Math.cos(angle) * 840, vy: Math.sin(angle) * 840,
          damage: lv === 3 ? 25 : 27, piercing: true
        });
      }
    }
  }

  function spawnEnemyBullet(x, y, vx, vy, shape = 'Orb', color = 'Red') {
    if (state.phase === 'BOSS' && state.boss && state.boss.tier === 8) {
      // Safety guard: Tier 08 Boss & dashers must NEVER fire normal bullets
      state.telemetry.tier8BulletsFired += 1;
      return;
    }
    if (state.phase === 'BOSS' && state.boss && state.boss.tier === 6) {
      // Safety guard: Tier 06 Boss must ONLY use wing missiles
      state.telemetry.tier6NormalBulletsFired += 1;
      return;
    }
    const bSpec = BULLET_SHAPES[shape] || BULLET_SHAPES.Orb;
    state.enemyBullets.push({
      path: `bullets/${shape}_${color}.png`,
      shape,
      color,
      size: bSpec.size,
      collision: bSpec.collision,
      scale: CONFIG.BULLET_SCALE,
      x: Math.round(x),
      y: Math.round(y),
      vx,
      vy,
      angle: Math.atan2(vy, vx)
    });
  }

  function fireEnemyPattern(enemy) {
    if (enemy.tier === 7 && enemy.enemyIdx >= 3) {
      fireSmallEnemyLaser(enemy);
      return;
    }
    // Cap total regular wave bullets so screen never gets flooded
    if (state.enemyBullets.length >= 40) return;

    const muzzles = getWorldMuzzles(enemy.x, enemy.y, enemy.spec, false, enemy.scale);
    const pal = TIER_PALETTES[enemy.tier] || TIER_PALETTES[1];
    const px = state.player ? state.player.x : 160;
    const py = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;

    const baseSpeed = 215 + enemy.tier * 18;
    const aimAngle = Math.atan2(py - enemy.y, px - enemy.x);

    if (enemy.enemyIdx === 1) {
      const m = muzzles[0];
      const ang = enemy.tier <= 2 ? Math.PI : aimAngle;
      spawnEnemyBullet(m.x, m.y, Math.cos(ang) * baseSpeed, Math.sin(ang) * baseSpeed, 'Orb', pal.primary);
    } else if (enemy.enemyIdx === 2) {
      const m = muzzles[0];
      const count = 2;
      const spread = 0.22;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * spread;
        const ang = aimAngle + offset;
        spawnEnemyBullet(m.x, m.y, Math.cos(ang) * baseSpeed, Math.sin(ang) * baseSpeed, 'Diamond', pal.secondary);
      }
    } else if (enemy.enemyIdx === 3) {
      const m = muzzles[0];
      const ang = Math.atan2(py - m.y, px - m.x);
      spawnEnemyBullet(m.x, m.y, Math.cos(ang) * (baseSpeed + 40), Math.sin(ang) * (baseSpeed + 40), 'Needle', pal.accent);
    } else {
      for (let i = 0; i < muzzles.length; i++) {
        const m = muzzles[i];
        const offset = (i - (muzzles.length - 1) / 2) * 0.16;
        const ang = Math.PI + offset;
        spawnEnemyBullet(m.x, m.y, Math.cos(ang) * baseSpeed, Math.sin(ang) * baseSpeed, 'Orb', pal.primary);
      }
    }
  }

  /**
   * Standard Boss Bullet Pattern (Preserved for Tier 01~03, Tier 04 main body, Tier 05 NORMAL state, Tier 07 non-laser interval)
   */
  function fireTierBossPattern(boss) {
    if (boss.tier === 6 || boss.tier === 8) return; // Strictly excluded for Tier 06 and Tier 08!

    const muzzles = getWorldMuzzles(boss.x, boss.y, boss.spec, false, boss.scale);
    const pal = TIER_PALETTES[boss.tier] || TIER_PALETTES[1];
    const px = state.player ? state.player.x : 160;
    const py = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;

    const step = boss.patternStep++;
    const tier = boss.tier;
    const baseSpeed = 235 + tier * 16;
    const primaryMuzzle = muzzles[0];

    if (step % 3 === 0) {
      const fanCount = Math.min(7, 4 + Math.floor(tier / 2));
      const arc = 0.90;
      for (let i = 0; i < fanCount; i++) {
        const t = fanCount === 1 ? 0 : (i / (fanCount - 1)) - 0.5;
        const ang = Math.PI + t * arc;
        spawnEnemyBullet(
          primaryMuzzle.x,
          primaryMuzzle.y,
          Math.cos(ang) * baseSpeed,
          Math.sin(ang) * baseSpeed,
          'Orb',
          pal.primary
        );
      }
    } else if (step % 3 === 1) {
      for (const m of muzzles) {
        const aim = Math.atan2(py - m.y, px - m.x);
        for (let k = -1; k <= 1; k++) {
          if (tier < 4 && k !== 0) continue;
          const ang = aim + k * 0.20;
          spawnEnemyBullet(
            m.x,
            m.y,
            Math.cos(ang) * (baseSpeed + 35),
            Math.sin(ang) * (baseSpeed + 35),
            'Needle',
            pal.accent
          );
        }
      }
    } else {
      const count = 4 + Math.floor(tier / 2);
      const baseAng = Math.PI + Math.sin(step * 0.7) * 0.24;
      for (let i = 0; i < count; i++) {
        const ang = baseAng + ((i - (count - 1) / 2) * 0.22);
        const m = muzzles[i % muzzles.length];
        spawnEnemyBullet(
          m.x,
          m.y,
          Math.cos(ang) * (baseSpeed - 15),
          Math.sin(ang) * (baseSpeed - 15),
          'Diamond',
          pal.secondary
        );
      }
    }
  }

  // ============================================================================
  // 10. SPECIAL V2/V3 BOSS MECHANICS (Lasers, Tier 5 Dash, Tier 6 4-Missiles, Tier 8 Ultimate & Fast Dashers, Final Escort Lasers)
  // ============================================================================

  /**
   * Creates a 3-stage laser beam (Stage_01 -> Stage_02 -> Stage_03 -> Expire).
   * Supports per-beam widthMultiplier (e.g., 2x thickness for Tier_07 = 16/32/48px)
   * and continuous attachment to either the active boss muzzle or an escort minion muzzle.
   */
  function spawnLaserBeam(opts) {
    const beam = {
      id: Math.random().toString(36).slice(2),
      color: opts.color || 'Blue',
      stage: 1,
      elapsed: 0.0,
      stageTimer: opts.stage1Time ?? CONFIG.LASER_STAGE1_TIME,
      stage1Time: opts.stage1Time ?? CONFIG.LASER_STAGE1_TIME,
      stage2Time: opts.stage2Time ?? CONFIG.LASER_STAGE2_TIME,
      stage3Time: opts.stage3Time ?? CONFIG.LASER_STAGE3_TIME,
      ox: opts.ox,
      oy: opts.oy,
      angle: opts.angle ?? Math.PI,
      followBossMuzzleIndex: opts.followBossMuzzleIndex ?? null,
      followEscortId: opts.followEscortId ?? null,
      followEnemyId: opts.followEnemyId ?? null,
      damage: opts.damage ?? CONFIG.LASER_DAMAGE,
      followEscortMuzzleIndex: opts.followEscortMuzzleIndex ?? 0,
      updateFn: opts.updateFn || null,
      length: opts.length ?? null,
      kind: opts.kind || 'STANDARD',
      scale: opts.scale ?? CONFIG.LASER_SCALE,
      widthMultiplier: opts.widthMultiplier ?? 1
    };

    // Sync initial origin immediately to the attached entity muzzle
    syncLaserBeamOrigin(beam);
    state.telemetry.laserStartHeights.push(Math.round(beam.oy));
    state.lasers.push(beam);
    return beam;
  }

  function syncLaserBeamOrigin(beam) {
    if (beam.followEnemyId) {
      const enemy = state.enemies.find(e => e.id === beam.followEnemyId && e.hp > 0 && !e.retreating);
      if (enemy) {
        const m = getWorldMuzzles(enemy.x, enemy.y, enemy.spec, false, enemy.scale)[0];
        beam.ox = m.x; beam.oy = m.y;
      }
      return;
    }
    if (beam.followBossMuzzleIndex !== null && state.boss) {
      const muzzles = getWorldMuzzles(state.boss.x, state.boss.y, state.boss.spec, false, state.boss.scale);
      const m = muzzles[beam.followBossMuzzleIndex] || muzzles[0];
      if (m) {
        beam.ox = m.x;
        beam.oy = m.y;
      }
    } else if (beam.followEscortId !== null) {
      const esc = state.escorts.find((e) => e.id === beam.followEscortId);
      if (esc) {
        const muzzles = getWorldMuzzles(esc.x, esc.y, esc.spec, false, esc.scale);
        const m = muzzles[beam.followEscortMuzzleIndex] || muzzles[0];
        if (m) {
          beam.ox = m.x;
          beam.oy = m.y;
        }
      }
    }
  }

  /**
   * Fires a dynamic primary laser from Tier_07 (2x thickness = 16/32/48px) or Tier_08 (1x thickness = 8/16/24px).
   * Cycles between:
   * - Variant 0: Varied-height horizontal beam translating smoothly with the boss's vertical glide
   * - Variant 1: Pre-telegraphed smooth angular sweep beam (constant angular velocity from Stage 1 through Stage 3)
   * - Variant 2: Off-center locked-angle slanted beam aimed during Stage 1 telegraph
   */
  function fireBossPrimaryLaser(boss, color, widthMultiplier, s1, s2, s3) {
    const muzzles = getWorldMuzzles(boss.x, boss.y, boss.spec, false, boss.scale);
    const m = muzzles[0];
    const variant = boss.laserVariant % 3;
    boss.laserVariant += 1;

    const px = state.player ? state.player.x : 200;
    const py = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;

    if (variant === 1) {
      // Smooth Angular Sweep: begins sweeping during Stage 1 warning and continues at constant rate through Stage 3
      const startUpper = m.y < CONFIG.CANVAS_HEIGHT / 2;
      const startOffset = startUpper ? -0.22 : 0.22;
      const sweepRate = startUpper ? 0.21 : -0.21; // rad/s
      const startAngle = Math.PI + startOffset;
      state.telemetry.sweepingLasersFired += 1;

      spawnLaserBeam({
        color,
        widthMultiplier,
        stage1Time: s1,
        stage2Time: s2,
        stage3Time: s3,
        ox: m.x,
        oy: m.y,
        angle: startAngle,
        followBossMuzzleIndex: 0,
        updateFn: (beam) => {
          const rawOffset = startOffset + sweepRate * beam.elapsed;
          const clampedOffset = Math.max(-0.30, Math.min(0.30, rawOffset));
          beam.angle = Math.PI + clampedOffset;
        }
      });
    } else if (variant === 2) {
      // Pre-telegraphed slanted lane locked at Stage 1 creation (never re-aimed at Stage 3!)
      const rawAim = Math.atan2(py - m.y, px - m.x);
      const diff = Math.atan2(Math.sin(rawAim - Math.PI), Math.cos(rawAim - Math.PI));
      const lockedAngle = Math.PI + Math.max(-0.24, Math.min(0.24, diff));

      spawnLaserBeam({
        color,
        widthMultiplier,
        stage1Time: s1,
        stage2Time: s2,
        stage3Time: s3,
        ox: m.x,
        oy: m.y,
        angle: lockedAngle,
        followBossMuzzleIndex: 0
      });
    } else {
      // Variant 0: Horizontal beam from current off-center boss height while boss continues gliding vertically
      spawnLaserBeam({
        color,
        widthMultiplier,
        stage1Time: s1,
        stage2Time: s2,
        stage3Time: s3,
        ox: m.x,
        oy: m.y,
        angle: Math.PI,
        followBossMuzzleIndex: 0
      });
    }
  }

  /**
   * Fires a 3-stage laser from one of the 4 Revealed Final Boss escorts.
   * Origin remains continuously attached to the escort's nose muzzle.
   */
  function spawnEscortLaser(escort) {
    const muzzles = getWorldMuzzles(escort.x, escort.y, escort.spec, false, escort.scale);
    const m = muzzles[0];
    const px = state.player ? state.player.x : 200;
    const py = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;

    // Alternate between straight horizontal and slight pre-telegraphed slant (locked at Stage 1)
    let angle = Math.PI;
    if ((state.telemetry.escortLasersByIdx[escort.idx] || 0) % 2 === 1) {
      const rawAim = Math.atan2(py - m.y, px - m.x);
      const diff = Math.atan2(Math.sin(rawAim - Math.PI), Math.cos(rawAim - Math.PI));
      angle = Math.PI + Math.max(-0.18, Math.min(0.18, diff));
    }

    const beam = spawnLaserBeam({
      color: escort.laserColor || 'Lime',
      damage: 1,
      widthMultiplier: 1,
      stage1Time: 0.65,
      stage2Time: 0.35,
      stage3Time: 0.75,
      ox: m.x,
      oy: m.y,
      angle,
      followEscortId: escort.id,
      followEscortMuzzleIndex: 0
    });

    escort.activeLaserBeamId = beam.id;
    state.telemetry.escortLasersByIdx[escort.idx] =
      (state.telemetry.escortLasersByIdx[escort.idx] || 0) + 1;
    return beam;
  }

  function startFinalSweep(boss) {
    if (boss.finalSweep || state.lasers.some(b => b.kind === 'FINAL_VOLLEY')) return null;
    // Four normal-width rainbow beams fire together from the photographed ports.
    // Their shared timing preserves the existing descent and escape corridors.
    const upward = (boss.sweepCount || 0) % 2 === 1;
    boss.sweepCount = (boss.sweepCount || 0) + 1;
    const nativeCenterX = boss.spec.size[0] / 2;
    const bottomRadius = (nativeCenterX - boss.spec.visibleBounds[0]) * boss.scale;
    const upperPortOffset = Math.max(...boss.spec.muzzles.map(m => (m.x - nativeCenterX) * boss.scale));
    // Upward sweeps start flush with the lower edge and preserve the top quarter, including core-hitbox clearance.
    const upwardEndY = Math.ceil(CONFIG.CANVAS_HEIGHT / 4 + upperPortOffset +
      12 + CONFIG.PLAYER_BASE_HITBOX_RADIUS + 2);
    boss.finalSweep = { phase: 'POSITION', upward,
      startY: upward ? CONFIG.CANVAS_HEIGHT - bottomRadius : 150,
      endY: upward ? upwardEndY : CONFIG.CANVAS_HEIGHT * 0.65,
      warningTimer: 1.1, activeElapsed: 0, beamIds: [] };
    state.floatingTexts.push({ text: upward ? 'OVERDRIVE ↑' : 'OVERDRIVE ↓',
      x: CONFIG.CANVAS_WIDTH / 2, y: 200, color: '#ffe366', timer: 2.2 });
    boss.attackTimer = 2.2;
    return boss.finalSweep;
  }

  function updateFinalSweep(boss, dt) {
    const sweep = boss.finalSweep;
    if (!sweep) return false;
    if (sweep.phase === 'POSITION') {
      if (moveEnemyToward(boss, boss.homeX, sweep.startY, 180, dt)) sweep.phase = 'WARNING';
    } else if (sweep.phase === 'WARNING') {
      sweep.warningTimer -= dt;
      if (sweep.warningTimer <= 0) {
        const muzzles = getWorldMuzzles(boss.x, boss.y, boss.spec, false, boss.scale);
        const rainbow = ['Red', 'Orange', 'Yellow', 'Lime', 'Cyan', 'Blue', 'Violet', 'Pink'];
        const offset = boss.rainbowVolleyCount || 0;
        sweep.beamIds = muzzles.map((m, index) => {
          const beam = spawnLaserBeam({
            kind: 'FINAL_VOLLEY', color: rainbow[(offset + index * 2) % rainbow.length],
            length: computeRayDistanceToScreenEdge(m.x, m.y, Math.PI),
            scale: CONFIG.LASER_SCALE, widthMultiplier: 1,
            stage1Time: 0.85, stage2Time: 0.4, stage3Time: CONFIG.FINAL_VOLLEY_ACTIVE_TIME,
            ox: m.x, oy: m.y, angle: Math.PI, followBossMuzzleIndex: index,
            updateFn: current => {
              current.length = computeRayDistanceToScreenEdge(current.ox, current.oy, current.angle);
            }
          });
          return beam.id;
        });
        boss.rainbowVolleyCount = (offset + 1) % rainbow.length;
        sweep.phase = 'FIRING';
      }
    } else if (sweep.phase === 'FIRING') {
      const beams = state.lasers.filter(b => sweep.beamIds.includes(b.id));
      if (!beams.length) sweep.phase = 'RETURN';
      else if (beams.every(b => b.stage === 3)) {
        sweep.activeElapsed = Math.min(CONFIG.FINAL_VOLLEY_ACTIVE_TIME, sweep.activeElapsed + dt);
        boss.y = sweep.startY + (sweep.endY - sweep.startY) *
          sweep.activeElapsed / CONFIG.FINAL_VOLLEY_ACTIVE_TIME;
      }
    } else if (moveEnemyToward(boss, boss.homeX, boss.homeY, 160, dt)) {
      boss.finalSweep = null;
      boss.phaseX = 0; boss.phaseY = 0;
      boss.bulletTimer = 0.65;
      boss.normalLaserTimer = 1.8;
      boss.overdriveTimer = 10;
      boss.attackTimer = 2.2;
    }
    enforceRightThirdBound(boss);
    return true;
  }

  /**
   * Computes 4 distinct target coordinates surrounding the player's position at salvo start.
   * Clamps the formation center first so all 4 points remain inside the arena without collapsing onto one point.
   */
  function prepareTier6SalvoTargets(boss) {
    const px = state.player ? state.player.x : 220;
    const py = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;

    // The first blast threatens a stationary player; the other three are randomized.
    // All points stay within 180px, leaving a reachable escape beyond the warned cluster.
    boss.salvoTargets = [];
    for (let i = 0; i < 4; i++) {
      let point;
      for (let attempt = 0; attempt < 32; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = i === 0 ? Math.random() * 24 : 85 + Math.random() * 95;
        point = {
          x: Math.round(Math.max(30, Math.min(CONFIG.CANVAS_WIDTH - 30, px + Math.cos(angle) * radius))),
          y: Math.round(Math.max(60, Math.min(CONFIG.CANVAS_HEIGHT - 30, py + Math.sin(angle) * radius)))
        };
        if (boss.salvoTargets.every(t => Math.hypot(t.x - point.x, t.y - point.y) > 60)) break;
      }
      boss.salvoTargets.push(point);
    }
    boss.salvoFiredCount = 0;
    boss.salvoShotTimer = 0.0;
    boss.missileVolleyIndex += 1;
    state.telemetry.tier6SalvosFired += 1;
  }

  /**
   * Launches a single fast wing missile (from muzzles[slotIdx]) toward boss.salvoTargets[slotIdx].
   * Flies visibly from a wing pod at 875px/s, with 0.35s after arrival before the blast.
   */
  function fireSingleTier6WingMissile(boss, slotIdx, customTarget) {
    const muzzles = getWorldMuzzles(boss.x, boss.y, boss.spec, false, boss.scale);
    const m = muzzles[slotIdx % muzzles.length] || muzzles[0];
    const target = customTarget || (boss.salvoTargets && boss.salvoTargets[slotIdx]) || {
      x: 220 + (slotIdx % 2) * 140,
      y: 260 + Math.floor(slotIdx / 2) * 160
    };

    // Targets are random around the player, but every missile visibly flies from a wing pod.
    const dx = target.x - m.x;
    const dy = target.y - m.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = CONFIG.TIER6_MISSILE_SPEED;
    const flightTime = dist / speed;
    const detonateDelay = 0.35; // Visible flight plus a short arrival warning.
    const totalFuse = flightTime + detonateDelay;
    const angle = Math.atan2(dy, dx);

    state.missiles.push({
      id: Math.random().toString(36).slice(2),
      slotIdx,
      proximityOnly: false,
      x: m.x,
      y: m.y,
      prevX: m.x,
      prevY: m.y,
      targetX: target.x,
      targetY: target.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      speed,
      angle,
      flightRemaining: flightTime,
      detonateDelay,
      arrived: false,
      fuse: totalFuse,
      maxFuse: totalFuse,
      radius: 10,
      blastRadius: CONFIG.TIER6_BOSS_BLAST_RADIUS,
      damageDealt: false
    });

    state.telemetry.tier6MissilesSpawned += 1;
  }

  function detonateMissile(m) {
    if (m.detonated) return;
    m.detonated = true;

    // Visual explosion effect (does NOT deal per-frame damage!)
    state.explosions.push({
      x: m.x,
      y: m.y,
      radius: m.blastRadius,
      timer: 0.35,
      maxTimer: 0.35
    });
    spawnExplosion(m.x, m.y, '#ff9b3d', 20);

    // Single instantaneous damage check (2 damage) if direct impact didn't already apply it
    if (!m.damageDealt && state.player) {
      const dx = state.player.x - m.x;
      const dy = state.player.y - m.y;
      const hitR = m.blastRadius + state.player.hitboxRadius;
      if (dx * dx + dy * dy <= hitR * hitR) {
        m.damageDealt = true;
        damagePlayer(CONFIG.MISSILE_DAMAGE, 'MISSILE BLAST');
      }
    }
  }

  /**
   * Tier 08 4-Laser Ultimate:
   * Spawns 4 Blue lasers from 4 separate emitter nodes behind (to the right of) the boss.
   * Sweeps continuously to narrow the player's space while strictly preserving a reachable safe corridor.
   */
  function startTier8UltimateLasers(boss) {
    boss.laserMode = 'ULTIMATE';
    const s1 = 0.75;
    const s2 = 0.40;
    const s3 = 1.55;
    boss.laserModeTimer = s1 + s2 + s3 + 1.25;

    // Choose a corridor center Y that the player can genuinely reach from their current position
    const playerY = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;
    const offset = (boss.ultSweepDir *= -1) * 75;
    const corridorCenterY = Math.max(195, Math.min(CONFIG.CANVAS_HEIGHT - 195, playerY + offset));
    boss.ultCorridorY = corridorCenterY;

    // Compute guaranteed safe corridor gap based on enlarged 3x player dimensions + Stage 3 beam thickness
    const p = state.player;
    const pBounds = p ? getRotatedBounds(p.x, p.y, p.spec, true, p.scale) : { width: 60, height: 60 };
    const playerMaxVisible = Math.max(pBounds.width, pBounds.height);
    const beamHalfThick = 6 * CONFIG.LASER_SCALE; // 12px
    const pHitR = p ? p.hitboxRadius : CONFIG.PLAYER_BASE_HITBOX_RADIUS;

    // Visual safe gap >= max(120, playerMaxVisible * 1.5), plus collision margins on both sides
    const minSafeVisualGap = Math.max(125, playerMaxVisible * 1.55);
    const minCenterToCenterGap = minSafeVisualGap + 2 * beamHalfThick + 2 * pHitR;
    const halfGap = minCenterToCenterGap / 2;

    const emitterX = CONFIG.CANVAS_WIDTH - 22;
    const emitters = [
      { idx: 0, startY: 78,  finalY: Math.max(66, corridorCenterY - halfGap - 88) },
      { idx: 1, startY: 165, finalY: corridorCenterY - halfGap },
      { idx: 2, startY: CONFIG.CANVAS_HEIGHT - 165, finalY: corridorCenterY + halfGap },
      { idx: 3, startY: CONFIG.CANVAS_HEIGHT - 78,  finalY: Math.min(CONFIG.CANVAS_HEIGHT - 66, corridorCenterY + halfGap + 88) }
    ];

    emitters.forEach((em) => {
      const totalDur = s1 + s2 + s3;
      let elapsed = 0;
      spawnLaserBeam({
        color: 'Blue',
        widthMultiplier: 1,
        stage1Time: s1,
        stage2Time: s2,
        stage3Time: s3,
        ox: emitterX,
        oy: em.startY,
        angle: Math.PI,
        updateFn: (beam, dt) => {
          elapsed += dt;
          // Smoothly converge from startY toward finalY, never crossing halfGap!
          const progress = Math.min(1, elapsed / (totalDur * 0.82));
          const smooth = progress * progress * (3 - 2 * progress);
          beam.ox = emitterX;
          beam.oy = em.startY + (em.finalY - em.startY) * smooth;
          beam.angle = Math.PI;
        }
      });
    });

    state.floatingTexts.push({
      text: 'ULTIMATE: CONVERGING 4-LASER ARRAY!',
      x: CONFIG.CANVAS_WIDTH / 2,
      y: 185,
      color: '#43d8fa',
      timer: 1.8
    });
  }

  /**
   * Tier 08 Omnidirectional Dasher Warning & Spawner (8 directions including Left & Diagonals)
   * V3: 2~3x faster dash speed (1340~1540 px/s, avg ~1440 px/s) and supports multi-dasher burst offsets.
   */
  const TIER8_DASH_DIRECTIONS = [
    'R_TO_L', 'L_TO_R', 'T_TO_B', 'B_TO_T',
    'TR_TO_BL', 'BR_TO_TL', 'TL_TO_BR', 'BL_TO_TR'
  ];

  function scheduleTier8Dasher(boss, forcedDirection = null, burstSlot = 0, burstTotal = 1) {
    if (!boss.dasherDirQueue || boss.dasherDirQueue.length === 0) {
      boss.dasherDirQueue = [...TIER8_DASH_DIRECTIONS];
      // Fisher-Yates shuffle so all 8 directions appear evenly
      for (let i = boss.dasherDirQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [boss.dasherDirQueue[i], boss.dasherDirQueue[j]] = [boss.dasherDirQueue[j], boss.dasherDirQueue[i]];
      }
    }

    const dirKey = typeof forcedDirection === 'number'
      ? TIER8_DASH_DIRECTIONS[forcedDirection % TIER8_DASH_DIRECTIONS.length]
      : (forcedDirection || boss.dasherDirQueue.pop());
    state.telemetry.dashDirectionsUsed.add(dirKey);

    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;
    const margin = 76;
    const px = state.player ? state.player.x : 220;
    const py = state.player ? state.player.y : H / 2;

    // Spread multiple burst dashers across distinct lanes so they never form an unavoidable wall
    const laneOffset = burstTotal > 1 ? (burstSlot - (burstTotal - 1) / 2) * 145 : 0;
    let tx = Math.round(Math.max(180, Math.min(W - 220, 260 + Math.random() * (W - 500) + laneOffset)));
    let ty = Math.round(Math.max(110, Math.min(H - 110, 140 + Math.random() * (H - 280) + laneOffset)));
    if (Math.hypot(tx - px, ty - py) < 85) {
      ty = ty < H / 2 ? Math.min(H - 100, ty + 120) : Math.max(100, ty - 120);
    }

    let startX = 0;
    let startY = 0;
    let angle = Math.PI;
    const jitterAngle = (Math.random() - 0.5) * 0.12;

    switch (dirKey) {
      case 'R_TO_L':
        startX = W + margin;
        startY = ty;
        angle = Math.PI + jitterAngle;
        break;
      case 'L_TO_R':
        startX = -margin;
        startY = Math.abs(ty - py) < 75 ? (py < H / 2 ? py + 115 : py - 115) : ty;
        angle = 0 + jitterAngle;
        break;
      case 'T_TO_B':
        startX = Math.abs(tx - px) < 75 ? tx + 115 : tx;
        startY = -margin;
        angle = Math.PI / 2 + jitterAngle;
        break;
      case 'B_TO_T':
        startX = Math.abs(tx - px) < 75 ? tx + 115 : tx;
        startY = H + margin;
        angle = -Math.PI / 2 + jitterAngle;
        break;
      case 'TR_TO_BL':
        startX = W + margin;
        startY = -margin + 40 + burstSlot * 55;
        angle = Math.atan2((H * 0.72) - startY, (W * 0.25) - startX) + jitterAngle;
        break;
      case 'BR_TO_TL':
        startX = W + margin;
        startY = H + margin - 40 - burstSlot * 55;
        angle = Math.atan2((H * 0.28) - startY, (W * 0.25) - startX) + jitterAngle;
        break;
      case 'TL_TO_BR':
        startX = -margin;
        startY = -margin + 40 + burstSlot * 55;
        angle = Math.atan2((H * 0.75) - startY, (W * 0.72) - startX) + jitterAngle;
        break;
      case 'BL_TO_TR':
      default:
        startX = -margin;
        startY = H + margin - 40 - burstSlot * 55;
        angle = Math.atan2((H * 0.25) - startY, (W * 0.72) - startX) + jitterAngle;
        break;
    }

    // V3 Speed: 1340 ~ 1540 px/s (~2.5x of V2's 560 px/s, strictly inside 1120~1680 px/s)
    const speed = Math.round(1340 + Math.random() * 200);
    const endDist = 1800;
    state.dashWarnings.push({
      dirKey,
      startX,
      startY,
      endX: startX + Math.cos(angle) * endDist,
      endY: startY + Math.sin(angle) * endDist,
      angle,
      speed,
      timer: 0.85,
      maxTimer: 0.85
    });
  }

  function spawnDasherFromWarning(w) {
    const relPath = 'enemies/Tier_08/Enemy_04.png';
    const spec = SPRITE_SPECS[relPath];
    state.dashers.push({
      dirKey: w.dirKey,
      path: relPath,
      spec,
      scale: CONFIG.SHIP_SCALE,
      x: w.startX,
      y: w.startY,
      prevX: w.startX,
      prevY: w.startY,
      vx: Math.cos(w.angle) * w.speed,
      vy: Math.sin(w.angle) * w.speed,
      speed: w.speed,
      angle: w.angle,
      age: 0.0,
      radius: 20,
      exemptFromRightThird: true,
      enteredScreen: false
    });
    state.telemetry.tier8DashersSpawned += 1;
    state.telemetry.tier8DasherSpeeds.push(w.speed);
  }

  // ============================================================================
  // 11. FINAL BOSS & ESCORT PATTERNS
  // ============================================================================
  function fireShadowBossPattern(boss) {
    const muzzles = getWorldMuzzles(boss.x, boss.y, boss.spec, false, boss.scale);
    const step = boss.patternStep++;
    const px = state.player ? state.player.x : 160;
    const py = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;

    if (step % 2 === 0) {
      const centerMuzzle = muzzles[1] || muzzles[0];
      for (let i = -2; i <= 2; i++) {
        const ang = Math.PI + i * 0.21;
        spawnEnemyBullet(centerMuzzle.x, centerMuzzle.y, Math.cos(ang) * 280, Math.sin(ang) * 280, 'Orb', 'Violet');
      }
    } else {
      const leftMuzzle = muzzles[0];
      const rightMuzzle = muzzles[2] || muzzles[0];
      for (const m of [leftMuzzle, rightMuzzle]) {
        const aim = Math.atan2(py - m.y, px - m.x);
        spawnEnemyBullet(m.x, m.y, Math.cos(aim) * 310, Math.sin(aim) * 310, 'Diamond', 'Lime');
      }
    }
  }

  function fireRevealedBossPattern(boss) {
    const muzzles = getWorldMuzzles(boss.x, boss.y, boss.spec, false, boss.scale);
    const step = boss.patternStep++;
    const px = state.player ? state.player.x : 160;
    const py = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;

    const leftCannon = muzzles[0];
    const centerCore = muzzles[1] || muzzles[0];
    const rightCannon = muzzles[2] || muzzles[0];

    if (step % 3 === 0) {
      const count = 7;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 0.17;
        const ang = Math.PI + offset + Math.sin(step) * 0.06;
        spawnEnemyBullet(centerCore.x, centerCore.y, Math.cos(ang) * 300, Math.sin(ang) * 300, 'Orb', i % 2 === 0 ? 'Yellow' : 'Orange');
      }
    } else if (step % 3 === 1) {
      for (const m of [leftCannon, rightCannon]) {
        const aim = Math.atan2(py - m.y, px - m.x);
        for (const delta of [-0.15, 0.15]) {
          const ang = aim + delta;
          spawnEnemyBullet(m.x, m.y, Math.cos(ang) * 340, Math.sin(ang) * 340, 'Needle', 'Red');
        }
      }
    } else {
      for (let i = 0; i < muzzles.length; i++) {
        const m = muzzles[i];
        const ang = Math.PI + (i - 2) * 0.16;
        spawnEnemyBullet(m.x, m.y, Math.cos(ang) * 285, Math.sin(ang) * 285, 'Diamond', i % 2 === 0 ? 'Violet' : 'Pink');
      }
    }
  }

  function fireFinalPrimaryLasers(boss) {
    if (state.lasers.some(b => b.kind === 'FINAL_PRIMARY')) return;
    const ports = getWorldMuzzles(boss.x, boss.y, boss.spec, false, boss.scale);
    const cycle = boss.primaryLaserCount || 0;
    boss.primaryLaserCount = cycle + 1;
    const index = cycle % ports.length;
    const m = ports[index];
    const direction = cycle % 2 === 0 ? 1 : -1;
    const startOffset = -direction * 0.25;
    const colors = ['Cyan', 'Violet', 'Red', 'Yellow'];
    // A single sustained beam sweeps at a constant rate through charging and firing.
    spawnLaserBeam({ kind: 'FINAL_PRIMARY', color: colors[index],
      ox: m.x, oy: m.y, angle: Math.PI + startOffset, followBossMuzzleIndex: index,
      stage1Time: 0.9, stage2Time: 0.3, stage3Time: 2.4,
      updateFn: beam => {
        beam.angle = Math.PI + startOffset + direction * 0.14 * beam.elapsed;
      } });
  }

  function fireEscortMinionPattern(escort) {
    if (escort.kind === 'FINAL_ESCORT') return; // True-form escorts use lasers exclusively.
    const muzzles = getWorldMuzzles(escort.x, escort.y, escort.spec, false, escort.scale);
    const m = muzzles[0];
    const p = escort.profile;
    const px = state.player ? state.player.x : 160;
    const py = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;
    const aim = Math.atan2(py - m.y, px - m.x);

    if (p.patternType === 'aimed_single') {
      spawnEnemyBullet(m.x, m.y, Math.cos(aim) * 280, Math.sin(aim) * 280, p.bulletShape, p.bulletColor);
    } else if (p.patternType === 'aimed_double') {
      spawnEnemyBullet(m.x, m.y, Math.cos(aim - 0.09) * 315, Math.sin(aim - 0.09) * 315, p.bulletShape, p.bulletColor);
      spawnEnemyBullet(m.x, m.y, Math.cos(aim + 0.09) * 315, Math.sin(aim + 0.09) * 315, p.bulletShape, p.bulletColor);
    } else if (p.patternType === 'fan3') {
      for (let i = -1; i <= 1; i++) {
        const ang = Math.PI + i * 0.22;
        spawnEnemyBullet(m.x, m.y, Math.cos(ang) * 275, Math.sin(ang) * 275, p.bulletShape, p.bulletColor);
      }
    } else if (p.patternType === 'burst2') {
      spawnEnemyBullet(m.x, m.y, Math.cos(aim) * 300, Math.sin(aim) * 300, p.bulletShape, p.bulletColor);
      spawnEnemyBullet(m.x, m.y, Math.cos(Math.PI) * 255, 0, 'Orb', 'Orange');
    } else {
      for (const d of [-0.16, 0.16]) {
        const ang = aim + d;
        spawnEnemyBullet(m.x, m.y, Math.cos(ang) * 305, Math.sin(ang) * 305, p.bulletShape, p.bulletColor);
      }
    }
  }

  // ============================================================================
  // 12. CONTINUOUS COLLISION DETECTION HELPERS
  // ============================================================================
  function distSqPointToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const abLenSq = abx * abx + aby * aby;
    if (abLenSq === 0) return apx * apx + apy * apy;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
    const cx = ax + t * abx;
    const cy = ay + t * aby;
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy;
  }

  function checkBulletHitsPlayer(b, player) {
    const pr = player.hitboxRadius;
    if (b.collision.type === 'capsule') {
      const halfLen = (b.collision.length * b.scale) / 2;
      const rad = b.collision.radius * b.scale;
      const cos = Math.cos(b.angle);
      const sin = Math.sin(b.angle);
      const ax = b.x - cos * halfLen;
      const ay = b.y - sin * halfLen;
      const bx = b.x + cos * halfLen;
      const by = b.y + sin * halfLen;
      const totalR = pr + rad;
      return distSqPointToSegment(player.x, player.y, ax, ay, bx, by) <= totalR * totalR;
    } else {
      const rad = b.collision.radius * b.scale;
      const totalR = pr + rad;
      const dx = player.x - b.x;
      const dy = player.y - b.y;
      return dx * dx + dy * dy <= totalR * totalR;
    }
  }

  function getLaserStageThicknessPx(beam, stage = beam.stage) {
    const nativeThick = LASER_STAGES[stage]?.thickness || 8;
    return nativeThick * (beam.scale || CONFIG.LASER_SCALE) * (beam.widthMultiplier || 1);
  }

  function checkLaserHitsPlayer(beam, player) {
    if (beam.stage !== 3) return false; // Only Stage_03 deals damage!
    const len = beam.length ?? computeRayDistanceToScreenEdge(beam.ox, beam.oy, beam.angle);
    const ex = beam.ox + Math.cos(beam.angle) * len;
    const ey = beam.oy + Math.sin(beam.angle) * len;

    // Stage 3 visible thickness is 12 native px -> half thickness = 6 * scale * widthMultiplier (24px radius for Tier_07 48px beam, 12px radius for 24px beam)
    const beamHalfThick = getLaserStageThicknessPx(beam, 3) / 2;
    if (beam.kind === 'FINAL_VOLLEY') {
      return checkCircleHitsBounds(player.x, player.y, player.hitboxRadius, {
        left: Math.min(beam.ox, ex), right: Math.max(beam.ox, ex),
        top: beam.oy - beamHalfThick, bottom: beam.oy + beamHalfThick
      });
    }
    const totalR = beamHalfThick + player.hitboxRadius;
    return distSqPointToSegment(player.x, player.y, beam.ox, beam.oy, ex, ey) <= totalR * totalR;
  }

  function checkCircleHitsBounds(cx, cy, radius, bounds) {
    const closestX = Math.max(bounds.left, Math.min(cx, bounds.right));
    const closestY = Math.max(bounds.top, Math.min(cy, bounds.bottom));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= radius * radius;
  }

  function damagePlayer(amount, sourceLabel) {
    const p = state.player;
    if (!p || p.invulnTimer > 0 || state.debugInvincible || state.mode !== 'PLAYING') return;

    p.hp = Math.max(0, p.hp - amount);
    p.invulnTimer = CONFIG.PLAYER_INVULN_TIME;
    p.hitFlashTimer = 0.45;

    spawnExplosion(p.x, p.y, '#ff526b', 14);
    state.floatingTexts.push({
      text: `-${amount} HP (${sourceLabel})`,
      x: p.x,
      y: p.y - 28,
      color: '#ff526b',
      timer: 1.0
    });

    if (p.hp <= 0) {
      triggerGameOver();
    }
  }

  function spawnExplosion(x, y, color = '#ff9b3d', count = 16) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 190;
      state.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 2 + Math.floor(Math.random() * 3) * 2,
        color,
        life: 0.25 + Math.random() * 0.35
      });
    }
  }

  // ============================================================================
  // 13. MAIN UPDATE LOOP
  // ============================================================================
  function updateGame(dt) {
    // Freeze all gameplay, timers, background scroll, and spawns during PAUSED, REWARD, GAMEOVER, CLEAR
    if (!assets.ready || state.mode !== 'PLAYING') return;

    // 1. Scroll background continuously right-to-left, wrapping at 43,440px
    state.bgScrollX = (state.bgScrollX + CONFIG.BG_SCROLL_SPEED * dt) % CONFIG.BG_TOTAL_WIDTH;

    // 2. Update Player
    const p = state.player;
    if (p) {
      p.prevX = p.x;
      p.prevY = p.y;
      if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
      if (p.hitFlashTimer > 0) p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);

      let mx = 0;
      let my = 0;
      if (keys.has('ArrowLeft') || keys.has('KeyA')) mx -= 1;
      if (keys.has('ArrowRight') || keys.has('KeyD')) mx += 1;
      if (keys.has('ArrowUp') || keys.has('KeyW')) my -= 1;
      if (keys.has('ArrowDown') || keys.has('KeyS')) my += 1;

      if (mx !== 0 && my !== 0) {
        const inv = 1 / Math.SQRT2;
        mx *= inv;
        my *= inv;
      }

      const baseSpeed = (keys.has('ShiftLeft') || keys.has('ShiftRight'))
        ? CONFIG.PLAYER_FOCUS_SPEED
        : CONFIG.PLAYER_SPEED;
      const speed = baseSpeed * p.speedMultiplier;

      p.x += mx * speed * dt;
      p.y += my * speed * dt;

      const pBounds = getRotatedBounds(p.x, p.y, p.spec, true, p.scale);
      const halfW = pBounds.width / 2;
      const halfH = pBounds.height / 2;
      p.x = Math.max(24 + halfW, Math.min(CONFIG.CANVAS_WIDTH - 24 - halfW, p.x));
      p.y = Math.max(54 + halfH, Math.min(CONFIG.CANVAS_HEIGHT - 16 - halfH, p.y));

      p.fireCooldown -= dt;
      if (p.fireCooldown <= 0) {
        firePlayerWeapon(p);
      }
    }

    // 3. Wave Timer & Phase Progression
    if (state.phase === 'WAVE') {
      state.tierWaveElapsed += dt;
      if (state.tierWaveElapsed >= state.waveDuration) {
        state.tierWaveElapsed = state.waveDuration;
        state.cumulativeWaveTime = (state.currentTier - 1) * CONFIG.WAVE_DURATION + CONFIG.WAVE_DURATION;
        startTierBoss(state.currentTier);
      } else {
        const progressRatio = state.tierWaveElapsed / state.waveDuration;
        state.cumulativeWaveTime = (state.currentTier - 1) * CONFIG.WAVE_DURATION + progressRatio * CONFIG.WAVE_DURATION;

        state.enemySpawnTimer -= dt;
        const maxConcurrent = 2 * (3 + Math.floor(state.currentTier / 3)); // Double wave population: 6..10 regular enemies
        if (state.enemySpawnTimer <= 0 && state.enemies.filter((e) => !e.retreating).length < maxConcurrent) {
          spawnWaveEnemy(state.currentTier);
          state.enemySpawnTimer = 0.5 * (1.65 - state.currentTier * 0.06) * (0.85 + Math.random() * 0.35);
        }
      }
    }

    // 4. Time-based Meteor Spawning (paused during Tier 08 Ultimate to prevent unfair overlap)
    const isTier8Ult = state.boss && state.boss.tier === 8 && state.boss.laserMode === 'ULTIMATE';
    if (!isTier8Ult) {
      state.meteorSpawnTimer -= dt;
      if (state.meteorSpawnTimer <= 0) {
        scheduleMeteorWarning();
        state.meteorSpawnTimer = CONFIG.METEOR_MIN_INTERVAL +
          Math.random() * (CONFIG.METEOR_MAX_INTERVAL - CONFIG.METEOR_MIN_INTERVAL);
      }
    }

    for (let i = state.meteorWarnings.length - 1; i >= 0; i--) {
      const w = state.meteorWarnings[i];
      w.timer -= dt;
      if (w.timer <= 0) {
        spawnMeteorFromWarning(w);
        state.meteorWarnings.splice(i, 1);
      }
    }

    // 5. Update Meteors (continuous collision check)
    for (let i = state.meteors.length - 1; i >= 0; i--) {
      const m = state.meteors[i];
      m.prevX = m.x;
      m.prevY = m.y;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.rotation += m.rotSpeed * dt;

      if (p) {
        const hitR = m.radius + p.hitboxRadius;
        if (distSqPointToSegment(p.x, p.y, m.prevX, m.prevY, m.x, m.y) <= hitR * hitR) {
          damagePlayer(CONFIG.METEOR_DAMAGE, 'METEOR');
          spawnExplosion(m.x, m.y, '#ff9b3d', 18);
          state.meteors.splice(i, 1);
          continue;
        }
      }

      if (m.x < -100 || m.y < -100 || m.y > CONFIG.CANVAS_HEIGHT + 100) {
        state.meteors.splice(i, 1);
      }
    }

    // 6. Update Regular Enemies
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      e.age += dt;
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

      if (e.retreating) {
        e.x += 540 * dt;
        enforceRightThirdBound(e);
        if (e.x > CONFIG.CANVAS_WIDTH + 90) {
          state.enemies.splice(i, 1);
        }
        continue;
      }

      if (updateEnemySpecial(e, dt)) continue;
      if (e.tier === 5 && e.enemyIdx >= 3 && !e.entering) {
        e.specialCooldown -= dt;
        if (e.specialCooldown <= 0) { startEnemyDash(e); continue; }
      }
      if (e.entering) {
        e.x -= 300 * dt;
        if (e.x <= e.homeX) {
          e.x = e.homeX;
          e.entering = false;
        }
      } else {
        const targetX = e.homeX + Math.sin(e.age * e.moveFreqX + e.phaseOffset) * e.moveAmpX;
        const targetY = e.homeY + Math.cos(e.age * e.moveFreqY + e.phaseOffset) * e.moveAmpY;
        moveEnemyToward(e, targetX, targetY, 160, dt);
      }

      enforceRightThirdBound(e);

      const b = getRotatedBounds(e.x, e.y, e.spec, false, e.scale);
      if (b.left < state.telemetry.minEnemyLeftEdgeObserved) {
        state.telemetry.minEnemyLeftEdgeObserved = b.left;
      }

      e.fireCooldown -= dt;
      if (!e.entering && e.fireCooldown <= 0) {
        fireEnemyPattern(e);
        e.fireInterval = e.tier === 7 && e.enemyIdx >= 3
          ? 4 + Math.random() * 2 : computeEnemyFireInterval(e.tier, e.enemyIdx);
        e.fireCooldown = e.fireInterval;
      }
    }

    // 7. Update Active Boss
    updateActiveBoss(dt);

    // 8. Update Escorts (Tier 04 destructible escorts & Final_Revealed invulnerable escorts)
    updateEscorts(dt);

    // 9. Update Active 3-Stage Lasers & Player Collision
    for (let i = state.lasers.length - 1; i >= 0; i--) {
      const beam = state.lasers[i];
      if (beam.followEnemyId && !state.enemies.some(e => e.id === beam.followEnemyId && e.hp > 0 && !e.retreating)) {
        state.lasers.splice(i, 1); continue;
      }
      beam.elapsed += dt;
      syncLaserBeamOrigin(beam);
      if (beam.updateFn) {
        beam.updateFn(beam, dt);
      }

      // Advance stage timer one stage at a time, preserving fractional remainder so stages never skip or flicker
      beam.stageTimer -= dt;
      if (beam.stageTimer <= 0) {
        if (beam.stage === 1) {
          beam.stage = 2;
          beam.stageTimer += beam.stage2Time;
        } else if (beam.stage === 2) {
          beam.stage = 3;
          beam.stageTimer += beam.stage3Time;
        } else {
          state.lasers.splice(i, 1);
          continue;
        }
      }

      if (p && beam.stage === 3 && checkLaserHitsPlayer(beam, p)) {
        damagePlayer(beam.damage ?? CONFIG.LASER_DAMAGE, 'LASER');
      }
    }

    // 10. Update Tier 06 4-Wing Missiles & Timed Explosions
    for (let i = state.missiles.length - 1; i >= 0; i--) {
      const ms = state.missiles[i];
      ms.prevX = ms.x;
      ms.prevY = ms.y;

      if (!ms.arrived) {
        const moveDt = Math.min(dt, ms.flightRemaining);
        ms.x += ms.vx * moveDt;
        ms.y += ms.vy * moveDt;
        ms.flightRemaining -= dt;
        if (ms.flightRemaining <= 0) {
          ms.x = ms.targetX;
          ms.y = ms.targetY;
          ms.vx = 0;
          ms.vy = 0;
          ms.arrived = true;
        }
      }

      ms.fuse -= dt;

      // Continuous direct-hit check against player core
      if (p && !ms.damageDealt && !ms.proximityOnly) {
        const hitR = ms.radius + p.hitboxRadius;
        if (distSqPointToSegment(p.x, p.y, ms.prevX, ms.prevY, ms.x, ms.y) <= hitR * hitR) {
          ms.damageDealt = true;
          damagePlayer(CONFIG.MISSILE_DAMAGE, 'MISSILE');
          detonateMissile(ms);
          state.missiles.splice(i, 1);
          continue;
        }
      }

      if (ms.fuse <= 0) {
        detonateMissile(ms);
        state.missiles.splice(i, 1);
      }
    }

    for (let i = state.explosions.length - 1; i >= 0; i--) {
      const ex = state.explosions[i];
      ex.timer -= dt;
      if (ex.timer <= 0) state.explosions.splice(i, 1);
    }

    // 11. Update Tier 08 Omnidirectional Dash Warnings & Active Dashers
    for (let i = state.dashWarnings.length - 1; i >= 0; i--) {
      const dw = state.dashWarnings[i];
      dw.timer -= dt;
      if (dw.timer <= 0) {
        spawnDasherFromWarning(dw);
        state.dashWarnings.splice(i, 1);
      }
    }

    for (let i = state.dashers.length - 1; i >= 0; i--) {
      const d = state.dashers[i];
      d.prevX = d.x;
      d.prevY = d.y;
      d.age = (d.age || 0) + dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;

      if (d.x >= 0 && d.x <= CONFIG.CANVAS_WIDTH && d.y >= 0 && d.y <= CONFIG.CANVAS_HEIGHT) {
        d.enteredScreen = true;
      }

      // Continuous swept-segment collision ensures 1400+ px/s dashers never tunnel through player
      if (p) {
        const hitR = d.radius + p.hitboxRadius;
        if (distSqPointToSegment(p.x, p.y, d.prevX, d.prevY, d.x, d.y) <= hitR * hitR) {
          damagePlayer(CONFIG.DASH_DAMAGE, 'DASH SHIP');
        }
      }

      if ((d.enteredScreen || d.age > 2.0) && (
        d.x < -160 || d.x > CONFIG.CANVAS_WIDTH + 160 ||
        d.y < -160 || d.y > CONFIG.CANVAS_HEIGHT + 160
      )) {
        state.dashers.splice(i, 1);
      }
    }

    // 12. Update Player Bullets & Hit Detection
    updatePlayerBullets(dt);

    // 13. Update Enemy Bullets & Player Collision
    for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
      const eb = state.enemyBullets[i];
      eb.x += eb.vx * dt;
      eb.y += eb.vy * dt;

      if (p && checkBulletHitsPlayer(eb, p)) {
        damagePlayer(CONFIG.ENEMY_BULLET_DAMAGE, 'BULLET');
        state.enemyBullets.splice(i, 1);
        continue;
      }

      if (
        eb.x < -50 ||
        eb.x > CONFIG.CANVAS_WIDTH + 70 ||
        eb.y < -50 ||
        eb.y > CONFIG.CANVAS_HEIGHT + 50
      ) {
        state.enemyBullets.splice(i, 1);
      }
    }

    // 14. Update Particles & Floating Texts
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) state.particles.splice(i, 1);
    }

    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = state.floatingTexts[i];
      ft.y -= 22 * dt;
      ft.timer -= dt;
      if (ft.timer <= 0) state.floatingTexts.splice(i, 1);
    }

    updateHudBadges();
  }

  function updateActiveBoss(dt) {
    const boss = state.boss;
    if (!boss) return;

    boss.prevX = boss.x;
    boss.prevY = boss.y;
    boss.age += dt;
    if (boss.hitFlash > 0) boss.hitFlash = Math.max(0, boss.hitFlash - dt);

    // Final Boss dying sequence
    if (boss.dyingTimer > 0) {
      boss.dyingTimer -= dt;
      if (Math.random() < 0.45) {
        spawnExplosion(
          boss.x + (Math.random() - 0.5) * 90,
          boss.y + (Math.random() - 0.5) * 90,
          '#ffcc45',
          10
        );
      }
      for (const esc of state.escorts) {
        esc.x += 260 * dt;
        if (Math.random() < 0.35) {
          spawnExplosion(esc.x, esc.y, '#a8ec46', 6);
        }
      }
      if (boss.dyingTimer <= 0) {
        clearAllCombatHazards();
        state.boss = null;
        triggerGameClear();
      }
      return;
    }

    // Entrance movement
    if (boss.entering) {
      if (boss.kind === 'FINAL_REVEALED') {
        boss.revealTimer -= dt;
        if (boss.revealTimer <= 0) boss.entering = false;
      } else {
        boss.x -= 280 * dt;
        if (boss.x <= boss.homeX) {
          boss.x = boss.homeX;
          boss.entering = false;
        }
      }
      enforceRightThirdBound(boss);
      return;
    }

    if (boss.kind === 'FINAL_REVEALED' && updateFinalSweep(boss, dt)) return;

    // Tier 04 Escort single-respawn timer management
    if (boss.kind === 'TIER_BOSS' && boss.tier === 4 && boss.t4EscortRespawnTimers.length > 0) {
      for (let i = boss.t4EscortRespawnTimers.length - 1; i >= 0; i--) {
        const rt = boss.t4EscortRespawnTimers[i];
        rt.timer -= dt;
        if (rt.timer <= 0) {
          const newEsc = createTier4Escort(rt.idx, boss);
          newEsc.respawnRemaining = 0; // Respawn at most once
          state.escorts.push(newEsc);
          boss.t4EscortRespawnTimers.splice(i, 1);
        }
      }
    }

    // Tier 05 Strictly Horizontal Forward Dash state machine (WARN -> DASH -> OFFSCREEN -> RETURN -> NORMAL)
    if (boss.kind === 'TIER_BOSS' && boss.tier === 5) {
      if (boss.dashState === 'NORMAL') {
        boss.phaseX += dt * 1.15;
        boss.phaseY += dt * 0.85;
        boss.x = boss.homeX + Math.sin(boss.phaseX) * 40;
        boss.y = boss.homeY + Math.sin(boss.phaseY) * 135;
        enforceRightThirdBound(boss);

        const bBounds = getRotatedBounds(boss.x, boss.y, boss.spec, false, boss.scale);
        if (bBounds.left < state.telemetry.minBossLeftEdgeObserved) {
          state.telemetry.minBossLeftEdgeObserved = bBounds.left;
        }

        boss.attackTimer -= dt;
        if (boss.attackTimer <= 0) {
          fireTierBossPattern(boss);
          boss.attackTimer = 0.92;
        }

        boss.dashCooldown -= dt;
        if (boss.dashCooldown <= 0) {
          boss.dashState = 'WARN';
          boss.dashTimer = 0.85;
          boss.dashStartX = boss.x;
          boss.dashY = state.player
            ? Math.round(Math.max(108, Math.min(CONFIG.CANVAS_HEIGHT - 108, state.player.y)))
            : Math.round(boss.y);
          // Strictly horizontal velocity vector (vy = 0!)
          boss.dashVx = -1320;
          boss.dashVy = 0;
        }
      } else if (boss.dashState === 'WARN') {
        // Align smoothly to dashY during warning so boss.y === dashY before DASH begins
        const dy = boss.dashY - boss.y;
        const maxStepY = 480 * dt;
        boss.y += Math.abs(dy) <= maxStepY ? dy : Math.sign(dy) * maxStepY;
        const dx = boss.homeX - boss.x;
        const maxStepX = 240 * dt;
        boss.x += Math.abs(dx) <= maxStepX ? dx : Math.sign(dx) * maxStepX;
        enforceRightThirdBound(boss);

        boss.dashTimer -= dt;
        if (boss.dashTimer <= 0) {
          boss.y = boss.dashY;
          boss.prevY = boss.dashY;
          boss.dashState = 'DASH';
          boss.dashSideShotTimer = 0.12;
        }
      } else if (boss.dashState === 'DASH') {
        // Strictly horizontal forward sweep across screen (vy = 0, y = dashY!)
        boss.x += boss.dashVx * dt;
        boss.y = boss.dashY;
        state.telemetry.tier5MaxAbsVyDuringDash = Math.max(
          state.telemetry.tier5MaxAbsVyDuringDash,
          Math.abs(boss.y - boss.prevY)
        );

        // Emit sparse perpendicular side bullets (strictly vertical: vx = 0, vy = +/- sideSpeed)
        boss.dashSideShotTimer -= dt;
        if (boss.dashSideShotTimer <= 0 && boss.x > 60 && boss.x < CONFIG.CANVAS_WIDTH - 60) {
          boss.dashSideShotTimer = 0.28;
          const sideSpeed = 200;
          for (const side of [-1, 1]) {
            for (const spread of [-0.16, 0, 0.16]) {
              spawnEnemyBullet(boss.x, boss.y, Math.sin(spread) * sideSpeed,
                side * Math.cos(spread) * sideSpeed, 'Diamond', 'Orange');
            }
          }
        }

        // Continuous swept-segment collision check against player core
        if (state.player) {
          const hitR = 28 + state.player.hitboxRadius;
          if (distSqPointToSegment(state.player.x, state.player.y, boss.prevX, boss.prevY, boss.x, boss.y) <= hitR * hitR) {
            damagePlayer(CONFIG.DASH_DAMAGE, 'BOSS DASH');
          }
        }

        if (boss.x < -110) {
          boss.dashState = 'OFFSCREEN';
          boss.dashTimer = 0.25;
        }
      } else if (boss.dashState === 'OFFSCREEN') {
        boss.dashTimer -= dt;
        if (boss.dashTimer <= 0) {
          // Re-enter safely from the right edge at homeY
          boss.x = CONFIG.CANVAS_WIDTH + 90;
          boss.y = boss.homeY;
          boss.prevX = boss.x;
          boss.prevY = boss.y;
          boss.dashState = 'RETURN';
        }
      } else if (boss.dashState === 'RETURN') {
        boss.x -= 520 * dt;
        boss.y = boss.homeY;
        if (boss.x <= boss.homeX) {
          boss.x = boss.homeX;
          boss.phaseX = 0.0;
          boss.phaseY = 0.0;
          boss.dashState = 'NORMAL';
          boss.dashCooldown = 4.8;
          boss.attackTimer = 0.85;
          enforceRightThirdBound(boss);
        }
      }
      return;
    }

    // Revealed Final Boss Slow Forward Rush state machine (NORMAL -> WARN -> RUSH -> RETURN -> NORMAL)
    if (boss.kind === 'FINAL_REVEALED' && boss.rushState !== 'NORMAL') {
      if (boss.rushState === 'WARN') {
        // Align smoothly to rushY inside right 1/3 while telegraphing forward rush lane
        const dy = boss.rushY - boss.y;
        const stepY = 340 * dt;
        boss.y += Math.abs(dy) <= stepY ? dy : Math.sign(dy) * stepY;
        const dx = boss.homeX - boss.x;
        const stepX = 240 * dt;
        boss.x += Math.abs(dx) <= stepX ? dx : Math.sign(dx) * stepX;
        enforceRightThirdBound(boss);

        boss.rushTimer -= dt;
        if (boss.rushTimer <= 0) {
          boss.y = boss.rushY;
          boss.prevY = boss.rushY;
          boss.rushState = 'RUSH';
          boss.attackTimer = 0.85;
          state.telemetry.finalBossRushCount += 1;
        }
      } else if (boss.rushState === 'RUSH') {
        // Slow horizontal forward advance across the arena (260 px/s, vy = 0), accompanied by all 4 escorts!
        boss.x -= boss.rushSpeed * dt;
        boss.y = boss.rushY;
        state.telemetry.minFinalBossRushX = Math.min(state.telemetry.minFinalBossRushX, boss.x);

        // Sparse pulse during rush instead of full high-density barrage
        boss.attackTimer -= dt;
        if (boss.attackTimer <= 0) {
          boss.attackTimer = 1.15;
          spawnEnemyBullet(boss.x, boss.y - 30, 0, -210, 'Orb', 'Orange');
          spawnEnemyBullet(boss.x, boss.y + 30, 0,  210, 'Orb', 'Orange');
        }

        if (state.player) {
          const rBounds = getRotatedBounds(boss.x, boss.y, boss.spec, false, boss.scale);
          if (checkCircleHitsBounds(state.player.x, state.player.y, state.player.hitboxRadius, rBounds)) {
            damagePlayer(CONFIG.DASH_DAMAGE, 'FINAL BOSS RUSH');
          }
        }

        if (boss.x <= boss.rushTargetX) {
          boss.rushState = 'RETURN';
        }
      } else if (boss.rushState === 'RETURN') {
        // Smooth horizontal retreat back to homeX; wait until boss and all 4 escorts are inside X >= 856 before re-applying clamp
        boss.x = Math.min(boss.homeX, boss.x + 290 * dt);
        const dy = boss.homeY - boss.y;
        const stepY = 220 * dt;
        boss.y += Math.abs(dy) <= stepY ? dy : Math.sign(dy) * stepY;

        if (boss.x >= boss.homeX - 0.5 && Math.abs(boss.y - boss.homeY) <= 2.0) {
          const allEscortsInside = state.escorts.every((esc) => {
            const eb = getRotatedBounds(esc.x, esc.y, esc.spec, false, esc.scale);
            return eb.left >= CONFIG.ENEMY_MIN_X - 1;
          });
          if (allEscortsInside) {
            boss.x = boss.homeX;
            boss.y = boss.homeY;
            boss.phaseX = 0.0;
            boss.phaseY = 0.0;
            boss.rushState = 'NORMAL';
            boss.rushCooldown = 7.2 + Math.random() * 1.5;
            boss.attackTimer = 0.9;
            enforceRightThirdBound(boss);
          }
        }
      }
      return;
    }

    // Continuous phase-integrated movement inside right 1/3 for all other bosses (zero teleportation!)
    const targetSpeedFactor = (boss.laserMode === 'PRIMARY' && state.lasers.length > 0) ? 0.60 : 1.0;
    boss.moveSpeedFactor = (boss.moveSpeedFactor ?? 1.0) +
      (targetSpeedFactor - (boss.moveSpeedFactor ?? 1.0)) * Math.min(1, dt * 8.0);
    boss.phaseX = (boss.phaseX ?? 0) + dt * 1.1 * boss.moveSpeedFactor;
    boss.phaseY = (boss.phaseY ?? 0) + dt * 0.92 * boss.moveSpeedFactor;

    const swingX = boss.kind === 'TIER_BOSS' ? 40 : 30;
    const swingY = boss.kind === 'TIER_BOSS' ? 130 : 95;
    boss.x = boss.homeX + Math.sin(boss.phaseX) * swingX;
    boss.y = boss.homeY + Math.sin(boss.phaseY) * swingY + Math.sin(boss.phaseY * 1.73) * (swingY * 0.45);
    enforceRightThirdBound(boss);

    if (boss.tier === 7 || boss.tier === 8) {
      const frameStep = Math.hypot(boss.x - boss.prevX, boss.y - boss.prevY);
      if (dt > 0) {
        state.telemetry.maxBossFrameStepDuringLaser = Math.max(
          state.telemetry.maxBossFrameStepDuringLaser,
          frameStep / (dt * 60)
        );
      }
    }

    const bBounds = getRotatedBounds(boss.x, boss.y, boss.spec, false, boss.scale);
    if (bBounds.left < state.telemetry.minBossLeftEdgeObserved) {
      state.telemetry.minBossLeftEdgeObserved = bBounds.left;
    }

    // Tier-specific attack state machines
    if (boss.kind === 'TIER_BOSS') {
      if (boss.tier <= 4) {
        // Tier 01 ~ 04: Standard boss bullet patterns (Tier 04 also has 2 independent escorts)
        boss.attackTimer -= dt;
        if (boss.attackTimer <= 0) {
          fireTierBossPattern(boss);
          boss.attackTimer = Math.max(0.75, 1.25 - boss.tier * 0.06);
        }
      } else if (boss.tier === 6) {
        // Tier 06: 4-Wing Missiles & Timed Explosions Around Player ONLY (LOAD -> FIRE 4 salvos -> RECHARGE)
        boss.missileStateTimer -= dt;
        if (boss.missileState === 'LOAD') {
          if (boss.missileStateTimer <= 0) {
            prepareTier6SalvoTargets(boss);
            boss.missileState = 'FIRE';
            boss.missileStateTimer = 0.30;
          }
        } else if (boss.missileState === 'FIRE') {
          boss.salvoShotTimer -= dt;
          while (boss.salvoFiredCount < 4 && boss.salvoShotTimer <= 0) {
            fireSingleTier6WingMissile(boss, boss.salvoFiredCount);
            boss.salvoFiredCount += 1;
            boss.salvoShotTimer += 0.065;
          }
          if (boss.missileStateTimer <= 0 && boss.salvoFiredCount >= 4) {
            boss.missileState = 'RECHARGE';
            boss.missileStateTimer = CONFIG.TIER6_RECHARGE;
          }
        } else {
          if (boss.missileStateTimer <= 0) {
            boss.missileState = 'LOAD';
            boss.missileStateTimer = 0.55;
          }
        }
      } else if (boss.tier === 7) {
        boss.summonTimer = (boss.summonTimer ?? 1.6) - dt;
        if (boss.summonTimer <= 0) {
          if (state.enemies.filter(e => e.summonedBy === boss.id && !e.retreating).length < CONFIG.TIER7_SUMMON_LIMIT) {
            spawnWaveEnemy(7, { enemyIdx: 3, summonedBy: boss.id });
          }
          boss.summonTimer = CONFIG.TIER7_SUMMON_INTERVAL + Math.random() * 0.35;
        }
        // Tier 07: 2x Thick (16/32/48px) 3-stage Lime Laser at varied heights / sweeps + moderate bullet volleys
        boss.laserModeTimer -= dt;
        if (boss.laserModeTimer <= 0) {
          if (boss.laserCycleCount % 2 === 0) {
            boss.laserMode = 'PRIMARY';
            fireBossPrimaryLaser(boss, 'Lime', 2, 0.70, 0.40, 0.85);
            boss.laserModeTimer = 0.70 + 0.40 + 0.85 + 0.95;
          } else {
            boss.laserMode = 'IDLE';
            fireTierBossPattern(boss);
            boss.laserModeTimer = 1.25;
          }
          boss.laserCycleCount += 1;
        }
      } else if (boss.tier === 8) {
        // Tier 08: Varied/Sweeping Blue Laser + 4-Laser Ultimate + Fast Multi-Dasher Bursts (ZERO normal bullets!)
        boss.laserModeTimer -= dt;
        if (boss.laserModeTimer <= 0) {
          if (boss.laserCycleCount % 3 === 2) {
            // Every 3rd cycle: 4-Laser Converging Ultimate (central laser is strictly excluded)
            startTier8UltimateLasers(boss);
          } else {
            // Primary attack: Varied-height / sweeping Blue 3-stage laser attached to boss muzzle
            boss.laserMode = 'PRIMARY';
            fireBossPrimaryLaser(
              boss,
              'Blue',
              1,
              CONFIG.LASER_STAGE1_TIME,
              CONFIG.LASER_STAGE2_TIME,
              CONFIG.LASER_STAGE3_TIME
            );
            boss.laserModeTimer = CONFIG.LASER_STAGE1_TIME + CONFIG.LASER_STAGE2_TIME + CONFIG.LASER_STAGE3_TIME + 1.15;
          }
          boss.laserCycleCount += 1;
        }

        // Schedule fast omnidirectional Enemy_04 dashers (paused while 4-Laser Ultimate is active!)
        const ultActive = boss.laserMode === 'ULTIMATE' && state.lasers.length > 0;
        if (ultActive) {
          // Prevent queued dashers from dumping all at once on the frame Ultimate ends
          boss.dasherSpawnTimer = Math.max(boss.dasherSpawnTimer, 0.65);
        } else {
          boss.dasherSpawnTimer -= dt;
          const activeTotal = state.dashers.length + state.dashWarnings.length;
          const maxCap = 6;
          if (boss.dasherSpawnTimer <= 0 && activeTotal < maxCap) {
            boss.dasherWaveCount = (boss.dasherWaveCount || 0) + 1;
            const desiredBurst = (boss.dasherWaveCount % 3 === 0) ? 3 : (boss.dasherWaveCount % 2 === 0 ? 2 : 1);
            const burstCount = Math.min(maxCap - activeTotal, desiredBurst);
            for (let b = 0; b < burstCount; b++) {
              scheduleTier8Dasher(boss, null, b, burstCount);
            }
            boss.dasherSpawnTimer = 0.75 + Math.random() * 0.22;
          }
        }
      }
    } else if (boss.kind === 'FINAL_SHADOW') {
      boss.attackTimer -= dt;
      if (boss.attackTimer <= 0) {
        fireShadowBossPattern(boss);
        boss.attackTimer = 0.85;
      }
    } else if (boss.kind === 'FINAL_REVEALED') {
      boss.bulletTimer -= dt;
      boss.normalLaserTimer -= dt;
      boss.overdriveTimer -= dt;
      if (boss.overdriveTimer <= 0 && !state.lasers.some(b => b.kind === 'FINAL_PRIMARY')) {
        startFinalSweep(boss);
      } else {
        if (boss.bulletTimer <= 0) {
          fireRevealedBossPattern(boss);
          boss.bulletTimer = 0.78;
        }
        if (boss.normalLaserTimer <= 0 && boss.overdriveTimer > 4.0) {
          fireFinalPrimaryLasers(boss);
          boss.normalLaserTimer = 4.5;
        }
      }
    }
  }

  function updateEscorts(dt) {
    if (state.phase === 'FINAL_SHADOW') {
      state.telemetry.shadowEscortCountObserved = Math.max(
        state.telemetry.shadowEscortCountObserved,
        state.escorts.length
      );
    } else if (state.phase === 'FINAL_REVEALED') {
      state.telemetry.revealedEscortCountObserved = Math.max(
        state.telemetry.revealedEscortCountObserved,
        state.escorts.length
      );
    }

    if (!state.boss || state.escorts.length === 0) return;
    if (state.boss.dyingTimer && state.boss.dyingTimer > 0) return;

    const bossAlive = state.boss.hp > 0;
    const activeEscortLasers = state.lasers.filter((l) => l.followEscortId !== null).length;

    for (const esc of state.escorts) {
      if (esc.kind === 'FINAL_ESCORT') {
        esc.invulnerable = bossAlive;
      }
      esc.age += dt;
      if (esc.hitFlash > 0) esc.hitFlash = Math.max(0, esc.hitFlash - dt);
      if (esc.shieldFlash > 0) esc.shieldFlash = Math.max(0, esc.shieldFlash - dt);
      if (esc.recoilX > 0) esc.recoilX = Math.max(0, esc.recoilX - 90 * dt);

      const hasOwnLaser = state.lasers.some((l) => l.followEscortId === esc.id);
      if (!hasOwnLaser) esc.activeLaserBeamId = null;

      esc.wanderTimer -= dt;
      if (esc.wanderTimer <= 0) {
        esc.wanderTimer = 0.35 + Math.random() * 0.55;
        esc.wanderOffsetX = (Math.random() - 0.5) * 70;
        esc.wanderOffsetY = (Math.random() - 0.5) * 85;
      }

      const pr = esc.profile;
      const orbitScale = hasOwnLaser ? 0.45 : 1.0;
      let targetX = state.boss.x + pr.offsetX +
        Math.sin(esc.age * pr.freqX1) * pr.ampX * orbitScale +
        Math.cos(esc.age * pr.freqX2) * (pr.ampX * 0.45 * orbitScale) +
        esc.wanderOffsetX * orbitScale + esc.recoilX;
      let targetY = state.boss.y + pr.offsetY +
        Math.cos(esc.age * pr.freqY1) * pr.ampY * orbitScale +
        Math.sin(esc.age * pr.freqY2) * (pr.ampY * 0.45 * orbitScale) +
        esc.wanderOffsetY * orbitScale;

      if (esc.kind === 'FINAL_ESCORT') {
        if (esc.freeTargetTimer === undefined || esc.freeTargetTimer <= 0) {
          esc.freeTargetX = CONFIG.ENEMY_MIN_X + 40 + Math.random() * (CONFIG.CANVAS_WIDTH - CONFIG.ENEMY_MIN_X - 80);
          esc.freeTargetY = 90 + Math.random() * (CONFIG.CANVAS_HEIGHT - 150);
          esc.freeTargetTimer = 0.8 + Math.random() * 0.9;
        }
        esc.freeTargetTimer -= dt;
        targetX = esc.freeTargetX; targetY = esc.freeTargetY;
      }

      const dx = targetX - esc.x;
      const dy = targetY - esc.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5 && !(esc.kind === 'FINAL_ESCORT' && hasOwnLaser)) {
        const moveSpd = esc.kind === 'FINAL_ESCORT'
          ? pr.speed * (hasOwnLaser ? 1.0 : 1.25) : pr.speed * (hasOwnLaser ? 0.65 : 1.0);
        const step = Math.min(dist, moveSpd * dt);
        esc.x += (dx / dist) * step;
        esc.y += (dy / dist) * step;
      }

      enforceRightThirdBound(esc);

      const eBounds = getRotatedBounds(esc.x, esc.y, esc.spec, false, esc.scale);
      if (state.boss.kind === 'FINAL_REVEALED' &&
          (state.boss.rushState === 'RUSH' || state.boss.rushState === 'RETURN')) {
        state.telemetry.minFinalEscortRushX = Math.min(state.telemetry.minFinalEscortRushX, eBounds.left);
      } else if (eBounds.left < state.telemetry.minEscortLeftEdgeObserved) {
        state.telemetry.minEscortLeftEdgeObserved = eBounds.left;
      }

      if (!state.boss.entering) {
        // V3: Each of the 4 Final Boss escorts periodically fires a 3-stage laser from its nose muzzle
        if (esc.kind === 'FINAL_ESCORT') {
          esc.laserCooldown -= dt;
          if (esc.laserCooldown <= 0) {
            const currentEscortBeams = state.lasers.filter((l) => l.followEscortId !== null).length;
            if (currentEscortBeams < 2 && !hasOwnLaser) {
              spawnEscortLaser(esc);
              esc.laserCooldown = pr.laserInterval * (0.65 + Math.random() * 0.2);
              esc.fireCooldown = Math.max(esc.fireCooldown, 1.1);
            } else {
              esc.laserCooldown = 0.55 + Math.random() * 0.35;
            }
          }
        }

        esc.fireCooldown -= dt;
        if (esc.kind !== 'FINAL_ESCORT' && esc.fireCooldown <= 0 && !hasOwnLaser) {
          fireEscortMinionPattern(esc);
          esc.fireCooldown = pr.fireInterval * (0.85 + Math.random() * 0.3);
        }
      }
    }
  }

  function updatePlayerBullets(dt) {
    for (let i = state.playerBullets.length - 1; i >= 0; i--) {
      const pb = state.playerBullets[i];
      pb.prevX = pb.x;
      pb.prevY = pb.y;
      pb.x += pb.vx * dt;
      pb.y += pb.vy * dt;

      if (pb.x > CONFIG.CANVAS_WIDTH + 50 || pb.y < -50 || pb.y > CONFIG.CANVAS_HEIGHT + 50) {
        state.playerBullets.splice(i, 1);
        continue;
      }

      let consumed = false;

      // 1. Check hit against active Boss
      if (state.boss && !state.boss.entering && (!state.boss.dyingTimer || state.boss.dyingTimer <= 0)) {
        const bBounds = getRotatedBounds(state.boss.x, state.boss.y, state.boss.spec, false, state.boss.scale);
        if (!pb.hitTargets?.has(state.boss) && checkCircleHitsBounds(pb.x, pb.y, pb.radius, bBounds)) {
          pb.hitTargets?.add(state.boss);
          state.boss.hp = Math.max(0, state.boss.hp - pb.damage);
          state.boss.hitFlash = 0.08;
          state.score += 25;
          spawnExplosion(pb.x, pb.y, '#50e5ff', 3);
          if (!pb.piercing) { state.playerBullets.splice(i, 1); consumed = true; }

          if (state.boss.hp <= 0) {
            handleBossDefeated();
          }
        }
      }
      if (consumed) continue;

      // 2. Check hit against Escorts (Tier 04 destructible vs Final Boss invulnerable)
      if (state.escorts.length > 0) {
        for (let k = state.escorts.length - 1; k >= 0; k--) {
          const esc = state.escorts[k];
          const eBounds = getRotatedBounds(esc.x, esc.y, esc.spec, false, esc.scale);
          if (!pb.hitTargets?.has(esc) && checkCircleHitsBounds(pb.x, pb.y, pb.radius, eBounds)) {
            pb.hitTargets?.add(esc);
            if (esc.invulnerable) {
              // Final Boss escort: invulnerable deflection
              esc.shieldFlash = 0.18;
              esc.recoilX = Math.min(14, esc.recoilX + 5);
              enforceRightThirdBound(esc);
              state.telemetry.escortHitDeflections++;
              spawnExplosion(pb.x, pb.y, '#a8ec46', 4);
            } else {
              // Tier 04 escort: destructible!
              esc.hp -= pb.damage;
              esc.hitFlash = 0.08;
              spawnExplosion(pb.x, pb.y, '#50e5ff', 4);
              if (esc.hp <= 0) {
                state.score += 250;
                spawnExplosion(esc.x, esc.y, '#4adeff', 14);
                if (esc.respawnRemaining > 0 && state.boss && state.boss.tier === 4) {
                  state.boss.t4EscortRespawnTimers.push({ idx: esc.idx, timer: 9.0 });
                }
                state.escorts.splice(k, 1);
              }
            }
            if (!pb.piercing) {
              state.playerBullets.splice(i, 1); consumed = true; break;
            }
          }
        }
      }
      if (consumed) continue;

      // 3. Check hit against Regular Enemies
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const e = state.enemies[j];
        if (e.retreating || e.deathHandled || e.specialState === 'FLYBY_WARN') continue;
        const eBounds = getRotatedBounds(e.x, e.y, e.spec, false, e.scale);
        if (!pb.hitTargets?.has(e) && checkCircleHitsBounds(pb.x, pb.y, pb.radius, eBounds)) {
          pb.hitTargets?.add(e);
          e.hp -= pb.damage;
          e.hitFlash = 0.08;
          spawnExplosion(pb.x, pb.y, '#50e5ff', 3);
          if (!pb.piercing) { state.playerBullets.splice(i, 1); consumed = true; }

          if (e.hp <= 0) {
            if (e.tier === 6) beginEnemySuicide(e);
            else {
              state.score += 100 * e.tier + 25 * e.enemyIdx;
              spawnExplosion(e.x, e.y, '#ff9b3d', 14);
              removeEnemy(e);
            }
          }
          if (consumed) break;
        }
      }
    }
  }

  function handleBossDefeated() {
    const boss = state.boss;
    if (!boss || boss.defeatedHandled) return;
    boss.defeatedHandled = true;

    // Every boss heals current HP by one; this never changes maximum HP.
    if (state.player && state.player.hp > 0) {
      const p = state.player;
      const healed = Math.min(1, p.maxHp - p.hp);
      p.hp += healed;
      if (healed) state.floatingTexts.push({ text: '+1 HP', x: p.x, y: p.y - 36,
        color: '#ff7899', timer: 1.5 });
    }

    spawnExplosion(boss.x, boss.y, '#ffce36', 34);

    if (boss.kind === 'TIER_BOSS') {
      const defeatedTier = boss.tier;
      state.score += 1500 * defeatedTier;

      // Clean up all active boss hazards & Tier 04 escorts immediately
      clearAllCombatHazards();
      state.boss = null;

      // Even-Tier Bosses (Tier 02, 04, 06, 08) open the 3-card Reward Selection!
      if (isEvenRewardTier(defeatedTier)) {
        openRewardSelection(defeatedTier);
      } else {
        // Odd-Tier Bosses (Tier 01, 03, 05, 07) proceed directly to next tier wave
        advanceToNextTierWave(defeatedTier + 1);
      }
    } else if (boss.kind === 'FINAL_SHADOW') {
      // Shadow Boss defeated -> NO reward screen, NO clear! Transition immediately to Revealed Final Boss
      state.score += 5000;
      startRevealedFinalBoss();
    } else if (boss.kind === 'FINAL_REVEALED') {
      // True Final Boss main body defeated -> disable escort invulnerability, explode escorts & clear!
      state.score += 10000;
      state.enemyBullets = [];
      for (const esc of state.escorts) {
        esc.invulnerable = false;
        spawnExplosion(esc.x, esc.y, '#a8ec46', 22);
      }
      clearAllCombatHazards();
      boss.dyingTimer = 0.9;
    }
    updateHudBadges();
  }

  function scheduleMeteorWarning() {
    let y = Math.round(96 + Math.random() * (CONFIG.CANVAS_HEIGHT - 170));
    if (state.player && Math.abs(y - state.player.y) < 70) {
      y = y < CONFIG.CANVAS_HEIGHT / 2 ? y + 110 : y - 110;
    }
    state.meteorWarnings.push({
      y,
      timer: CONFIG.METEOR_WARN_TIME,
      speed: 420 + Math.random() * 120
    });
  }

  function spawnMeteorFromWarning(warn) {
    const spec = SPRITE_SPECS['extras/Single_Sprite.png'];
    state.meteors.push({
      path: 'extras/Single_Sprite.png',
      spec,
      scale: CONFIG.SHIP_SCALE,
      x: CONFIG.CANVAS_WIDTH + 48,
      y: warn.y,
      prevX: CONFIG.CANVAS_WIDTH + 48,
      prevY: warn.y,
      vx: -warn.speed,
      vy: (Math.random() - 0.5) * 32,
      rotation: 0,
      rotSpeed: (Math.random() < 0.5 ? -1 : 1) * (2.0 + Math.random() * 2.2),
      radius: 9 * CONFIG.SHIP_SCALE
    });
  }

  // ============================================================================
  // 14. RENDERING (Nearest-Neighbor Pixel Art + V2 Lasers, Missiles & Dash Warnings)
  // ============================================================================
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  function renderGame() {
    ctx.imageSmoothingEnabled = false;

    const finalBoss = state.boss?.kind === 'FINAL_REVEALED' ? state.boss : null;
    const sweep = finalBoss?.finalSweep;
    const firing = sweep?.phase === 'FIRING' && sweep.activeElapsed > 0;
    const shake = firing ? (sweep.activeElapsed < 0.24 ? 7 : 2.2) :
      sweep?.phase === 'WARNING' ? (1 - sweep.warningTimer / 1.1) * 2 : 0;
    ctx.save();
    if (shake) ctx.translate(Math.round(Math.sin(finalBoss.age * 83) * shake),
      Math.round(Math.cos(finalBoss.age * 97) * shake));

    // 1. Streaming Space_Unique Background
    renderBackground();
    if (finalBoss && !finalBoss.dyingTimer) renderFinalBossPresence(finalBoss);

    // 2. Optional Debug Overlay: Right 1/3 Boundary Line (x = 856)
    if (state.debugShowHitboxes) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 82, 107, 0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(CONFIG.ENEMY_MIN_X, 0);
      ctx.lineTo(CONFIG.ENEMY_MIN_X, CONFIG.CANVAS_HEIGHT);
      ctx.stroke();
      ctx.fillStyle = '#ff526b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`ENEMY LIMIT X >= ${CONFIG.ENEMY_MIN_X} (2/3 W)`, CONFIG.ENEMY_MIN_X + 8, 22);
      ctx.restore();
    }

    // 3. Render Tier 05 Boss Dash Warning Lane & Final Boss Rush Warning Lane
    if (state.boss && state.boss.tier === 5 && state.boss.dashState === 'WARN') {
      renderTier5DashWarning(state.boss);
    }
    if (state.boss && state.boss.kind === 'FINAL_REVEALED' && state.boss.rushState === 'WARN') {
      renderFinalBossRushWarning(state.boss);
    }

    // 4. Render Tier 08 Omnidirectional Dasher Warnings
    for (const dw of state.dashWarnings) {
      renderDashWarning(dw);
    }

    // 5. Render Incoming Meteor Warnings & Meteors
    for (const w of state.meteorWarnings) {
      const blink = Math.floor(w.timer * 14) % 2 === 0;
      ctx.save();
      ctx.fillStyle = blink ? '#ff526b' : '#ffce36';
      ctx.fillRect(CONFIG.CANVAS_WIDTH - 30, Math.round(w.y - 14), 22, 28);
      ctx.fillStyle = '#030c21';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('!', CONFIG.CANVAS_WIDTH - 23, Math.round(w.y + 6));
      ctx.restore();
    }

    for (const m of state.meteors) {
      drawRotatedSprite(m.path, m.x, m.y, m.spec.size, m.scale, m.rotation, false);
      if (state.debugShowHitboxes) {
        ctx.strokeStyle = '#ff9b3d';
        ctx.beginPath();
        ctx.arc(Math.round(m.x), Math.round(m.y), m.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 6. Render Active 3-Stage Lasers (Origin + Tiled Body + Unstretched Rounded Tip)
    for (const beam of state.lasers) {
      renderLaserBeam(beam);
    }

    // 7. Render Player Bullets (dynamic size, scale, and angle per weapon evolution level)
    for (const pb of state.playerBullets) {
      const rot = ['Needle', 'Crescent'].includes(pb.shape) ? pb.angle : 0;
      drawRotatedSprite(pb.path, pb.x, pb.y, pb.size, pb.scale, rot, false);
    }

    // 8. Render Regular Enemies (with pre-fire muzzle telegraph)
    for (const e of state.enemies) {
      renderEnemySpecialWarning(e);
      if (e.specialState === 'FLYBY_WARN') continue;
      const movingSpecial = ['FLYBY', 'DASH', 'SUICIDE_APPROACH'].includes(e.specialState);
      const rotation = movingSpecial ? e.specialAngle + Math.PI / 2 : -Math.PI / 2;
      drawRotatedSprite(e.path, e.x, e.y, e.spec.size, e.scale, rotation,
        e.hitFlash > 0 || (e.specialState === 'SUICIDE_ARM' && Math.floor(e.specialTimer * 16) % 2 === 0));
      if (!e.entering && !e.retreating && e.fireCooldown < 0.32) {
        const muzzles = getWorldMuzzles(e.x, e.y, e.spec, false, e.scale);
        ctx.save();
        ctx.fillStyle = '#ffe366';
        for (const m of muzzles) {
          ctx.fillRect(m.x - 3, m.y - 3, 6, 6);
        }
        ctx.restore();
      }
      if (state.debugShowHitboxes) {
        drawDebugEntityBoundsAndMuzzles(e, false);
      }
    }

    // 9. Render Tier 08 Omnidirectional Enemy_04 Dashers (rotated along velocity vector)
    for (const d of state.dashers) {
      // Native sprite faces UP (-PI/2), so rotating by d.angle + PI/2 points nose along velocity vector
      drawRotatedSprite(d.path, d.x, d.y, d.spec.size, d.scale, d.angle + Math.PI / 2, false);
      if (state.debugShowHitboxes) {
        ctx.strokeStyle = '#ff526b';
        ctx.beginPath();
        ctx.arc(Math.round(d.x), Math.round(d.y), d.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 10. Render Active Boss (and Tier 06 4-wing missile pod status indicators)
    if (state.boss) {
      const b = state.boss;
      ctx.save();
      if (b.kind === 'FINAL_REVEALED' && b.entering) {
        ctx.globalAlpha = Math.max(0.25, 1.0 - b.revealTimer);
      }
      drawRotatedSprite(b.path, b.x, b.y, b.spec.size, b.scale, -Math.PI / 2, b.hitFlash > 0);
      ctx.restore();

      // Tier 06 Wing Missile Load / Fire / Recharge visual cue on all 4 wing attachments
      if (b.kind === 'TIER_BOSS' && b.tier === 6 && !b.entering) {
        const wingMuzzles = getWorldMuzzles(b.x, b.y, b.spec, false, b.scale);
        ctx.save();
        for (let i = 0; i < 4; i++) {
          const wm = wingMuzzles[i];
          if (!wm) continue;
          if (b.missileState === 'LOAD' || b.missileState === 'FIRE') {
            ctx.fillStyle = Math.floor(b.age * 16) % 2 === 0 ? '#ffe366' : '#ff7e00';
            ctx.fillRect(wm.x - 5, wm.y - 5, 10, 10);
          } else if (b.missileState === 'RECHARGE') {
            ctx.fillStyle = 'rgba(120, 140, 170, 0.55)';
            ctx.fillRect(wm.x - 3, wm.y - 3, 6, 6);
          }
        }
        ctx.restore();
      }

      if (state.debugShowHitboxes) {
        drawDebugEntityBoundsAndMuzzles(b, false);
      }
    }

    // 11. Render Escort Fighters (Tier 04 destructible escorts & Final_Revealed invulnerable escorts)
    for (const esc of state.escorts) {
      const flash = esc.hitFlash > 0 || esc.shieldFlash > 0;
      drawRotatedSprite(esc.path, esc.x, esc.y, esc.spec.size, esc.scale, -Math.PI / 2, flash);
      if (esc.invulnerable && esc.shieldFlash > 0) {
        ctx.save();
        ctx.strokeStyle = '#a8ec46';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(Math.round(esc.x), Math.round(esc.y), 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (state.debugShowHitboxes) {
        drawDebugEntityBoundsAndMuzzles(esc, false);
      }
    }

    // 12. Render Tier 06 Wing Missiles & Timed Explosions
    for (const ms of state.missiles) {
      renderMissile(ms);
    }
    for (const ex of state.explosions) {
      const alpha = Math.max(0, ex.timer / ex.maxTimer);
      ctx.save();
      ctx.globalAlpha = alpha * 0.65;
      ctx.fillStyle = '#ff9b3d';
      ctx.beginPath();
      ctx.arc(Math.round(msRound(ex.x)), Math.round(msRound(ex.y)), ex.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffe366';
      ctx.stroke();
      ctx.restore();
    }

    // 13. Render Player (rotated +90 deg CW to face right, scaled by mobility upgrade)
    if (state.player) {
      const p = state.player;
      const blinkSkip = p.invulnTimer > 0 && Math.floor(p.invulnTimer * 16) % 2 === 1;
      if (!blinkSkip) {
        drawRotatedSprite(p.path, p.x, p.y, p.spec.size, p.scale, Math.PI / 2, p.hitFlashTimer > 0);
      }
      if (state.debugShowHitboxes) {
        drawDebugEntityBoundsAndMuzzles(p, true);
        ctx.strokeStyle = '#50e5ff';
        ctx.beginPath();
        ctx.arc(Math.round(p.x), Math.round(p.y), p.hitboxRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 14. Render Enemy Bullets
    for (const eb of state.enemyBullets) {
      const rot = eb.shape === 'Needle' ? eb.angle : 0;
      drawRotatedSprite(eb.path, eb.x, eb.y, eb.size, eb.scale, rot, false);
    }

    // 15. Render Particles & Floating Announcements
    for (const pt of state.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x - pt.size / 2), Math.round(pt.y - pt.size / 2), pt.size, pt.size);
    }

    for (const ft of state.floatingTexts) {
      ctx.save();
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#030c21';
      ctx.fillText(ft.text, Math.round(ft.x) + 2, Math.round(ft.y) + 2);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
      ctx.restore();
    }

    ctx.restore(); // Camera vibration never moves health, timer, or boss bar.

    // 16. Render Pixel UI (Top-left Player HP, Top-center Timer, Top-center 64x32 Boss Health Bar)
    renderPixelUI();
  }

  function renderFinalBossPresence(boss) {
    const sweep = boss.finalSweep;
    const charge = sweep && ['POSITION', 'WARNING'].includes(sweep.phase);
    const pulse = (Math.sin(boss.age * 5) + 1) / 2;
    ctx.save();
    // Pixel aura and orbiting energy motes establish the main body's presence without enlarging its hitbox.
    const bounds = getRotatedBounds(boss.x, boss.y, boss.spec, false, boss.scale);
    ctx.fillStyle = `rgba(150, 80, 255, ${0.045 + pulse * 0.035})`;
    ctx.fillRect(bounds.left - 18, bounds.top - 18, bounds.width + 36, bounds.height + 36);
    for (let i = 0; i < 12; i++) {
      const a = boss.age * 0.8 + i * Math.PI / 6;
      ctx.fillStyle = i % 2 ? '#b088ff' : '#d5ff57';
      const r = charge ? 110 - (1 - (sweep.warningTimer || 0) / 1.1) * 20 : 100;
      ctx.globalAlpha = 0.4 + pulse * 0.35;
      ctx.fillRect(Math.round(boss.x + Math.cos(a) * r), Math.round(boss.y + Math.sin(a) * 115), 4, 4);
    }
    ctx.globalAlpha = 1;
    if (charge) {
      const ports = getWorldMuzzles(boss.homeX, sweep.startY, boss.spec, false, boss.scale);
      const travel = sweep.endY - sweep.startY;
      const top = Math.min(...ports.map(m => Math.min(m.y, m.y + travel))) - 12;
      const bottom = Math.max(...ports.map(m => Math.max(m.y, m.y + travel))) + 12;
      const right = Math.max(...ports.map(m => m.x));
      // One solid translucent danger zone, matching the Tier 5 lane treatment.
      ctx.fillStyle = `rgba(255, 65, 90, ${0.12 + pulse * 0.055})`;
      ctx.fillRect(0, top, right, bottom - top);
      ctx.strokeStyle = '#ff526b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(right, top);
      ctx.moveTo(0, bottom); ctx.lineTo(right, bottom); ctx.stroke();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#ffe366'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
      ctx.fillText(sweep.endY > sweep.startY ? 'OVERDRIVE  ↓ ↓ ↓ ↓' : 'OVERDRIVE  ↑ ↑ ↑ ↑',
        CONFIG.CANVAS_WIDTH / 2, 112);
    }
    if (sweep?.phase === 'FIRING' && sweep.activeElapsed > 0 && sweep.activeElapsed < 0.24) {
      ctx.fillStyle = `rgba(205, 180, 255, ${0.16 * (1 - sweep.activeElapsed / 0.24)})`;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
    ctx.restore();
  }

  function msRound(v) {
    return Math.round(v);
  }

  /**
   * Renders a 3-stage laser using Origin (8x32), tiled/extended Body (8x32), and unstretched Tip (12x32)
   * aligned at centerY = 16 native pixels, stretching from muzzle (ox, oy) to the viewport edge.
   * Supports per-beam widthMultiplier (2x on Tier 07 -> 16px / 32px / 48px stage thickness).
   */
  function renderEnemySpecialWarning(e) {
    if (e.retreating) return;
    const s = e.specialState;
    if (s === 'FLYBY_WARN' || s === 'DASH_WARN') {
      const distance = s === 'DASH_WARN' ? e.specialDuration * 540 : 2300;
      const x = e.warningX, y = e.warningY;
      ctx.save();
      ctx.strokeStyle = s === 'FLYBY_WARN' ? '#43d8fa' : '#ff7899';
      ctx.globalAlpha = 0.45 + Math.sin(e.specialTimer * 18) * 0.2;
      ctx.lineWidth = 2; ctx.setLineDash([9, 7]);
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(e.specialAngle) * distance, y + Math.sin(e.specialAngle) * distance);
      ctx.stroke(); ctx.restore();
    } else if (s === 'SUICIDE_ARM' || s === 'SUICIDE_APPROACH') {
      const arming = s === 'SUICIDE_ARM';
      const x = arming ? e.x : e.targetX, y = arming ? e.y : e.targetY;
      ctx.save();
      ctx.strokeStyle = '#ff7899';
      ctx.fillStyle = arming ? 'rgba(255,65,95,0.18)' : 'rgba(255,65,95,0.05)';
      ctx.lineWidth = arming ? 3 : 1;
      ctx.beginPath(); ctx.arc(x, y, e.blastRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (arming) {
        ctx.fillStyle = '#fff0dc'; ctx.font = 'bold 16px monospace';
        ctx.fillText(Math.max(0, e.specialTimer).toFixed(1), x - 14, y - e.blastRadius - 8);
      }
      ctx.restore();
    }
  }

  function renderLaserBeam(beam) {
    const st = beam.stage;
    const color = beam.color;
    const scale = beam.scale || CONFIG.LASER_SCALE;
    const widthMult = beam.widthMultiplier || 1;
    const totalLen = beam.length ?? computeRayDistanceToScreenEdge(beam.ox, beam.oy, beam.angle);

    const originImg = assets.images.get(`lasers/${color}/Laser_${color}_Stage_0${st}_Origin.png`);
    const bodyImg   = assets.images.get(`lasers/${color}/Laser_${color}_Stage_0${st}_Body.png`);
    const tipImg    = assets.images.get(`lasers/${color}/Laser_${color}_Stage_0${st}_Tip.png`);

    const canvasH = 32 * scale * widthMult;
    const halfH = 16 * scale * widthMult; // centerY = 16 native
    const originW = 8 * scale * widthMult;
    const tipNativeWidth = beam.kind === 'FINAL_VOLLEY' ? 9 : 12;
    const tipW = tipNativeWidth * scale * widthMult;
    const bodyLen = Math.max(0, Math.round(totalLen - originW - tipW));

    ctx.save();
    ctx.translate(Math.round(beam.ox), Math.round(beam.oy));
    ctx.rotate(beam.angle);
    // Keep vertical pixel row shading right-side-up when shooting left
    if (Math.cos(beam.angle) < 0) {
      ctx.scale(1, -1);
    }

    // Show the eventual damaging width before ordinary final-body lasers activate.
    if (beam.kind === 'FINAL_PRIMARY' && st < 3) {
      const half = getLaserStageThicknessPx(beam, 3) / 2;
      ctx.fillStyle = 'rgba(255, 110, 170, 0.12)';
      ctx.fillRect(0, -half, totalLen, half * 2);
      ctx.strokeStyle = '#ffb9e1'; ctx.lineWidth = 1;
      ctx.strokeRect(0, -half, totalLen, half * 2);
    }

    // Subtle aim pulse during Stage 1/2 charge warnings
    if (st < 3) {
      ctx.globalAlpha = st === 1 ? 0.85 : 0.95;
    }

    if (originImg && bodyImg && tipImg) {
      // 1. Origin at x = 0 (muzzle anchor)
      ctx.save();
      ctx.translate(totalLen, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(originImg, 0, -halfH, originW, canvasH);
      // 2. Body extended across straight middle section without vertical distortion
      if (bodyLen > 0) {
        ctx.drawImage(bodyImg, originW, -halfH, bodyLen, canvasH);
      }
      // 3. Rounded Tip attached once at the end without horizontal or vertical stretching
      ctx.drawImage(tipImg, 0, 0, tipNativeWidth, 32,
        originW + bodyLen, -halfH, tipW, canvasH);
      ctx.restore();
    } else {
      const thick = getLaserStageThicknessPx(beam, st);
      ctx.fillStyle = color === 'Blue' ? '#367dff' : '#73deff';
      ctx.fillRect(0, -thick / 2, totalLen, thick);
    }

    if (state.debugShowHitboxes && st === 3) {
      const activeThick = getLaserStageThicknessPx(beam, 3);
      ctx.strokeStyle = '#ff526b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(0, -activeThick / 2, totalLen, activeThick);
    }
    ctx.restore();

    // Render mechanical emitter node only if beam originates from Tier 08 rear ultimate array
    if (beam.kind !== 'FINAL_VOLLEY' && beam.followBossMuzzleIndex === null && beam.followEscortId === null) {
      ctx.save();
      ctx.fillStyle = st === 3 ? '#ffffff' : '#43d8fa';
      ctx.strokeStyle = '#367dff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(Math.round(beam.ox), Math.round(beam.oy), 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function renderMissile(ms) {
    const nearBlast = ms.arrived || ms.fuse <= 0.45;
    const blink = nearBlast && Math.floor(ms.fuse * 22) % 2 === 0;

    // Show target detonation zone around the player's surrounded coordinate
    ctx.save();
    ctx.strokeStyle = nearBlast
      ? (blink ? 'rgba(255, 82, 107, 0.92)' : 'rgba(255, 227, 102, 0.85)')
      : 'rgba(255, 140, 50, 0.42)';
    ctx.fillStyle = nearBlast ? 'rgba(255, 82, 107, 0.16)' : 'rgba(255, 140, 50, 0.06)';
    ctx.lineWidth = nearBlast ? 2.5 : 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(Math.round(ms.targetX), Math.round(ms.targetY), ms.blastRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw fast pixel missile body
    ctx.save();
    ctx.translate(Math.round(ms.x), Math.round(ms.y));
    ctx.rotate(ms.angle);
    ctx.fillStyle = blink ? '#ffffff' : '#ff7e00';
    ctx.fillRect(-14, -6, 28, 12);
    ctx.fillStyle = '#ed1c24';
    ctx.fillRect(8, -5, 8, 10);
    ctx.fillStyle = '#ffe366';
    ctx.fillRect(-18, -3, 5, 6);
    ctx.restore();
  }

  function renderTier5DashWarning(boss) {
    const laneY = Math.round(boss.dashY);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 82, 107, 0.16)';
    ctx.fillRect(0, laneY - 38, CONFIG.CANVAS_WIDTH, 76);
    ctx.strokeStyle = '#ff526b';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(boss.x, laneY);
    ctx.lineTo(0, laneY);
    ctx.stroke();
    ctx.fillStyle = '#ffe366';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('<<< HIGH-SPEED HORIZONTAL BOSS DASH <<<', CONFIG.CANVAS_WIDTH / 2 - 155, laneY - 14);
    ctx.restore();
  }

  function renderFinalBossRushWarning(boss) {
    const laneY = Math.round(boss.rushY);
    ctx.save();
    ctx.fillStyle = 'rgba(168, 236, 70, 0.14)';
    ctx.fillRect(0, laneY - 64, CONFIG.CANVAS_WIDTH, 128);
    ctx.strokeStyle = '#a8ec46';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 6]);
    ctx.beginPath();
    ctx.moveTo(boss.x, laneY);
    ctx.lineTo(260, laneY);
    ctx.stroke();
    ctx.fillStyle = '#a8ec46';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('<<< TRUE FINAL BOSS + ESCORT FORMATION ADVANCE <<<', CONFIG.CANVAS_WIDTH / 2 - 195, laneY - 42);
    ctx.restore();
  }

  function renderDashWarning(dw) {
    const blink = Math.floor(dw.timer * 16) % 2 === 0;
    ctx.save();
    ctx.strokeStyle = blink ? 'rgba(255, 82, 107, 0.9)' : 'rgba(255, 227, 102, 0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(Math.round(dw.startX), Math.round(dw.startY));
    ctx.lineTo(Math.round(dw.endX), Math.round(dw.endY));
    ctx.stroke();

    // Draw warning badge clamped near the entry edge of the screen
    const badgeX = Math.max(22, Math.min(CONFIG.CANVAS_WIDTH - 22, Math.round(dw.startX)));
    const badgeY = Math.max(52, Math.min(CONFIG.CANVAS_HEIGHT - 22, Math.round(dw.startY)));
    ctx.fillStyle = blink ? '#ff526b' : '#ffe366';
    ctx.fillRect(badgeX - 11, badgeY - 11, 22, 22);
    ctx.fillStyle = '#030c21';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', badgeX, badgeY + 5);
    ctx.restore();
  }

  function renderBackground() {
    ctx.fillStyle = CONFIG.BG_NAVY_COLOR;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    const viewStart = Math.floor(state.bgScrollX);
    const viewEnd = viewStart + CONFIG.CANVAS_WIDTH;

    for (let pass = 0; pass < 2; pass++) {
      const loopOffset = pass * CONFIG.BG_TOTAL_WIDTH;
      for (let idx = 0; idx < SPACE_UNIQUE_LAYOUT.length; idx++) {
        const seg = SPACE_UNIQUE_LAYOUT[idx];
        const segStart = seg.x + loopOffset;
        const segEnd = segStart + seg.width;

        if (segEnd <= viewStart || segStart >= viewEnd) continue;

        const screenX = Math.round(segStart - viewStart);
        const pngImg = assets.images.get(`backgrounds/Space_Unique/${seg.file}`);
        if (pngImg) {
          ctx.drawImage(
            pngImg,
            seg.sourceX, 0, seg.width, CONFIG.BG_HEIGHT,
            screenX, 0, seg.width, CONFIG.BG_HEIGHT
          );
          ctx.fillStyle = CONFIG.BG_NAVY_COLOR;
          for (let s = 0; s < CONFIG.BG_FADE_STEPS; s++) {
            const fadeAlpha = 1.0 - (s + 1) / CONFIG.BG_FADE_STEPS;
            if (fadeAlpha <= 0) continue;
            ctx.globalAlpha = fadeAlpha;
            const stepOffset = s * CONFIG.BG_FADE_STEP_PX;
            ctx.fillRect(screenX + stepOffset, 0, CONFIG.BG_FADE_STEP_PX, CONFIG.BG_HEIGHT);
            ctx.fillRect(
              screenX + seg.width - CONFIG.BG_FADE_STEP_PX - stepOffset,
              0,
              CONFIG.BG_FADE_STEP_PX,
              CONFIG.BG_HEIGHT
            );
          }
          ctx.globalAlpha = 1.0;
        } else {
          const partNum = String(idx + 1).padStart(2, '0');
          const svgImg = assets.images.get(`backgrounds/Space_Unique/rendered/Part_${partNum}.svg`);
          if (svgImg) {
            ctx.drawImage(svgImg, screenX, 0, seg.width, CONFIG.BG_HEIGHT);
          }
        }
      }
    }
  }

  const flashCanvas = document.createElement('canvas');
  flashCanvas.width = 256;
  flashCanvas.height = 256;
  const flashCtx = flashCanvas.getContext('2d');

  function drawRotatedSprite(relPath, cx, cy, size, scale, angleRad, flashWhite) {
    const img = assets.images.get(relPath);
    const [w, h] = size;
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);

    ctx.save();
    ctx.translate(Math.round(cx), Math.round(cy));
    if (angleRad !== 0) {
      ctx.rotate(angleRad);
    }

    if (img) {
      if (flashWhite && flashCtx && typeof flashCtx.clearRect === 'function') {
        if (flashCanvas.width < dw) flashCanvas.width = dw;
        if (flashCanvas.height < dh) flashCanvas.height = dh;
        flashCtx.imageSmoothingEnabled = false;
        flashCtx.globalCompositeOperation = 'source-over';
        flashCtx.clearRect(0, 0, dw, dh);
        flashCtx.drawImage(img, 0, 0, dw, dh);
        flashCtx.globalCompositeOperation = 'source-atop';
        flashCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        flashCtx.fillRect(0, 0, dw, dh);
        ctx.drawImage(flashCanvas, 0, 0, dw, dh, Math.round(-dw / 2), Math.round(-dh / 2), dw, dh);
      } else {
        ctx.drawImage(img, Math.round(-dw / 2), Math.round(-dh / 2), dw, dh);
      }
    } else {
      ctx.fillStyle = flashWhite ? '#ffffff' : '#50e5ff';
      ctx.fillRect(Math.round(-dw / 2), Math.round(-dh / 2), dw, dh);
    }
    ctx.restore();
  }

  function drawDebugEntityBoundsAndMuzzles(entity, isPlayer) {
    const b = getRotatedBounds(entity.x, entity.y, entity.spec, isPlayer, entity.scale);
    ctx.save();
    ctx.strokeStyle = isPlayer ? '#50e5ff' : '#a8ec46';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.round(b.left),
      Math.round(b.top),
      Math.round(b.width),
      Math.round(b.height)
    );

    const muzzles = getWorldMuzzles(entity.x, entity.y, entity.spec, isPlayer, entity.scale);
    ctx.fillStyle = '#ffe366';
    for (const m of muzzles) {
      ctx.fillRect(m.x - 2, m.y - 2, 5, 5);
    }
    ctx.restore();
  }

  // ============================================================================
  // 15. PIXEL UI RENDERING (8x8 Heart, 3x5 Glyphs, 64x32 Boss Bar)
  // ============================================================================
  const BOSS_TEXT_BITMAPS = {
    B: ['110', '101', '110', '101', '110'],
    O: ['111', '101', '101', '101', '111'],
    S: ['111', '100', '111', '001', '111']
  };

  function drawPixelGlyph(glyphName, x, y, scale = CONFIG.FONT_SCALE) {
    const img = assets.images.get(`ui/font/Glyph_${glyphName}.png`);
    if (img) {
      ctx.drawImage(img, Math.round(x), Math.round(y), 3 * scale, 5 * scale);
    }
  }

  function drawPixelBossText(x, y, scale = CONFIG.FONT_SCALE, color = '#ffcc45') {
    const word = ['B', 'O', 'S', 'S'];
    ctx.save();
    ctx.fillStyle = color;
    word.forEach((ch, idx) => {
      const map = BOSS_TEXT_BITMAPS[ch];
      const gx = Math.round(x + idx * 4 * scale);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
          if (map[r][c] === '1') {
            ctx.fillRect(gx + c * scale, Math.round(y + r * scale), scale, scale);
          }
        }
      }
    });
    ctx.restore();
  }

  function getFormattedTimerText() {
    if (state.phase !== 'WAVE') {
      return 'Boss';
    }
    const totalSec = Math.floor(state.cumulativeWaveTime + 1e-6);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function renderPixelUI() {
    // 1. Top-Left Player HP: [Current HP Number] × [Single 8x8 Heart]
    const hp = state.player ? state.player.hp : 0;
    const hpStr = String(hp);
    const fontScale = CONFIG.FONT_SCALE;
    const heartScale = CONFIG.HEART_SCALE;

    let cursorX = 20;
    const topY = 18;
    const glyphY = topY + 4;

    for (const ch of hpStr) {
      drawPixelGlyph(ch, cursorX, glyphY, fontScale);
      cursorX += 4 * fontScale;
    }

    cursorX += 2;
    drawPixelGlyph('Times', cursorX, glyphY, fontScale);
    cursorX += 4 * fontScale + 6;

    let heartKey = 'Heart_Full';
    if (hp <= 0) {
      heartKey = 'Heart_Empty';
    } else if (state.player && state.player.hitFlashTimer > 0) {
      heartKey = 'Heart_Hit';
    }
    const heartImg = assets.images.get(`ui/player/${heartKey}.png`);
    if (heartImg) {
      ctx.drawImage(heartImg, Math.round(cursorX), Math.round(topY), 8 * heartScale, 8 * heartScale);
    }

    // 2. Top-Center Timer: MM:SS during normal waves, 'Boss' during all boss encounters
    const timerText = getFormattedTimerText();
    const timerScale = CONFIG.FONT_SCALE;
    const timerY = 16;

    if (timerText === 'Boss') {
      const totalW = 15 * timerScale;
      const startX = Math.round((CONFIG.CANVAS_WIDTH - totalW) / 2);
      drawPixelBossText(startX, timerY, timerScale, '#ffcc45');
    } else {
      const totalW = (timerText.length * 4 - 1) * timerScale;
      let tx = Math.round((CONFIG.CANVAS_WIDTH - totalW) / 2);
      for (const ch of timerText) {
        const glyphKey = ch === ':' ? 'Colon' : ch;
        drawPixelGlyph(glyphKey, tx, timerY, timerScale);
        tx += 4 * timerScale;
      }
    }

    // 3. Top-Center Boss Health Bar (64x32 native at 4x = 256x128)
    if (state.boss && state.phase !== 'WAVE') {
      const barId = state.boss.barId;
      const barScale = CONFIG.BOSS_BAR_SCALE;
      const barW = CONFIG.BOSS_BAR_NATIVE_W * barScale;
      const barH = CONFIG.BOSS_BAR_NATIVE_H * barScale;
      const barX = Math.round((CONFIG.CANVAS_WIDTH - barW) / 2);
      const barY = 38;

      const emptyImg = assets.images.get(`ui/boss_bars/${barId}_Empty.png`);
      const fillImg  = assets.images.get(`ui/boss_bars/${barId}_Fill.png`);
      const frameImg = assets.images.get(`ui/boss_bars/${barId}_Frame.png`);

      if (emptyImg) {
        ctx.drawImage(emptyImg, barX, barY, barW, barH);
      }

      const ratio = Math.max(0, Math.min(1, state.boss.hp / state.boss.maxHp));
      const fillRect = CONFIG.BOSS_FILL_RECT;
      const fillNativeW = state.boss.hp > 0 ? Math.max(1, Math.round(fillRect.width * ratio)) : 0;

      if (fillImg && fillNativeW > 0) {
        ctx.drawImage(
          fillImg,
          fillRect.x, fillRect.y, fillNativeW, fillRect.height,
          barX + fillRect.x * barScale,
          barY + fillRect.y * barScale,
          fillNativeW * barScale,
          fillRect.height * barScale
        );
      }

      if (frameImg) {
        ctx.drawImage(frameImg, barX, barY, barW, barH);
      }
    }
  }

  // ============================================================================
  // 16. UI OVERLAYS, PAUSE, RESIZE & CONTROLS
  // ============================================================================
  function updateHudBadges() {
    const stageEl = document.getElementById('stage-label');
    const scoreEl = document.getElementById('score-label');
    const buildEl = document.getElementById('build-label');

    if (stageEl) {
      if (state.mode === 'REWARD') {
        stageEl.textContent = `TIER 0${state.rewardPendingTier} REWARD`;
      } else if (state.phase === 'WAVE') {
        stageEl.textContent = `TIER 0${state.currentTier} WAVE`;
      } else if (state.phase === 'TEST') {
        stageEl.textContent = `TIER 0${state.currentTier} PATTERN TEST`;
      } else if (state.phase === 'BOSS') {
        stageEl.textContent = `TIER 0${state.currentTier} BOSS`;
      } else if (state.phase === 'FINAL_SHADOW') {
        stageEl.textContent = 'FINAL BOSS (SHADOW)';
      } else if (state.phase === 'FINAL_REVEALED') {
        stageEl.textContent = 'FINAL BOSS (TRUE FORM)';
      }
    }
    if (scoreEl) {
      scoreEl.textContent = String(state.score).padStart(6, '0');
    }
    if (buildEl && state.player) {
      const p = state.player;
      buildEl.textContent = `HP+${p.vitalityLevel} (${p.hp}/${p.maxHp}) / WP Lv${p.weaponLevel} / MOB+${p.mobilityLevel}`;
    }
    const wpBtn = document.getElementById('btn-cycle-weapon');
    if (wpBtn && state.player) {
      wpBtn.textContent = `장비 레벨: Lv${state.player.weaponLevel}`;
    }
    const mobBtn = document.getElementById('btn-cycle-mobility');
    if (mobBtn && state.player) {
      mobBtn.textContent = `기동성: +${state.player.mobilityLevel}`;
    }
  }

  function showOverlay(title, subtitle, showResume) {
    const ov = document.getElementById('overlay-screen');
    const titleEl = document.getElementById('overlay-title');
    const subEl = document.getElementById('overlay-subtitle');
    const statsEl = document.getElementById('overlay-stats');
    const resumeBtn = document.getElementById('btn-overlay-resume');

    if (!ov) return;
    titleEl.textContent = title;
    subEl.textContent = subtitle;
    const p = state.player;
    statsEl.innerHTML = [
      `도달 단계: ${document.getElementById('stage-label')?.textContent || ''}`,
      `누적 웨이브 타이머: ${getFormattedTimerText()} (누적 ${Math.floor(state.cumulativeWaveTime)}초)`,
      `선택 강화: 체력 +${p ? p.vitalityLevel : 0} / 장비 Lv${p ? p.weaponLevel : 0} / 기동성 +${p ? p.mobilityLevel : 0}`,
      `최종 점수: ${state.score.toLocaleString()}`
    ].join('<br/>');

    if (resumeBtn) {
      resumeBtn.style.display = showResume ? 'inline-block' : 'none';
    }
    ov.classList.remove('hidden');
  }

  function hideOverlay() {
    document.getElementById('overlay-screen')?.classList.add('hidden');
  }

  function togglePause() {
    // Do not allow pause overlay to skip or override active REWARD selection
    if (state.mode === 'REWARD') return;
    if (state.mode === 'PLAYING') {
      state.mode = 'PAUSED';
      showOverlay('PAUSED', '일시정지 상태입니다. ESC 또는 계속하기 버튼을 눌러 재개하세요.', true);
    } else if (state.mode === 'PAUSED') {
      state.mode = 'PLAYING';
      hideOverlay();
    }
  }

  function triggerGameOver() {
    state.mode = 'GAMEOVER';
    showOverlay('GAME OVER', '기체가 파괴되었습니다. R 키 또는 재시작 버튼으로 다시 도전하세요.', false);
  }

  function triggerGameClear() {
    state.mode = 'CLEAR';
    showOverlay(
      'GAME CLEAR!',
      '본모습 최종보스 본체를 격파하고 모든 호위기와 탄막을 정리했습니다!',
      false
    );
  }

  function fitCanvasToViewport() {
    const wrap = document.getElementById('viewport-wrap');
    const stage = document.getElementById('canvas-stage');
    if (!wrap || !stage) return;

    const availW = Math.max(320, wrap.clientWidth - 12);
    const availH = Math.max(200, wrap.clientHeight - 12);
    const scale = Math.min(availW / CONFIG.CANVAS_WIDTH, availH / CONFIG.CANVAS_HEIGHT);

    const dispW = Math.floor(CONFIG.CANVAS_WIDTH * scale);
    const dispH = Math.floor(CONFIG.CANVAS_HEIGHT * scale);

    canvas.style.width = `${dispW}px`;
    canvas.style.height = `${dispH}px`;
    stage.style.width = `${dispW}px`;
    stage.style.height = `${dispH}px`;
    ctx.imageSmoothingEnabled = false;
  }

  window.addEventListener('resize', fitCanvasToViewport);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.mode === 'PLAYING') {
      togglePause();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    keys.add(e.code);

    // Reward Selection Keys (1, 2, 3) only when reward modal is active
    if (state.mode === 'REWARD') {
      if (!e.repeat) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
          applyRewardChoice('vitality');
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
          applyRewardChoice('equipment');
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
          applyRewardChoice('mobility');
        }
      }
      if (e.code === 'KeyR') {
        resetGame();
      }
      return;
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      togglePause();
    } else if (e.code === 'KeyR') {
      resetGame();
    } else if (e.code === 'F2') {
      e.preventDefault();
      document.getElementById('debug-panel')?.classList.toggle('hidden');
      fitCanvasToViewport();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  // Reward Card Click Listeners
  document.getElementById('reward-screen')?.addEventListener('click', (e) => {
    const card = e.target.closest('button[data-reward]');
    if (!card) return;
    applyRewardChoice(card.dataset.reward);
  });

  document.getElementById('btn-pause')?.addEventListener('click', togglePause);
  document.getElementById('btn-restart')?.addEventListener('click', resetGame);
  document.getElementById('btn-overlay-resume')?.addEventListener('click', togglePause);
  document.getElementById('btn-overlay-restart')?.addEventListener('click', resetGame);
  document.getElementById('btn-debug-toggle')?.addEventListener('click', () => {
    document.getElementById('debug-panel')?.classList.toggle('hidden');
    fitCanvasToViewport();
  });

  // Debug Panel Actions
  document.getElementById('debug-panel')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'v4-enemy-demo') {
      const tier = Number(btn.dataset.tier);
      hideRewardModal(); hideOverlay();
      state.mode = 'PLAYING'; state.phase = 'TEST'; state.currentTier = tier;
      clearAllCombatHazards(); state.boss = null;
      for (let stage = 1; stage <= 4; stage++) {
        const enemy = spawnWaveEnemy(tier, { enemyIdx: stage });
        if (tier !== 8) {
          enemy.entering = false; enemy.x = enemy.homeX;
          if (tier === 6) { enemy.hp = 0; beginEnemySuicide(enemy); }
          if (tier === 5 && stage >= 3) enemy.specialCooldown = 0.5;
          if (tier === 7 && stage >= 3) enemy.fireCooldown = 0.5 + stage * 0.2;
        }
      }
    } else if (action === 'jump-tier') {
      const tier = Number(btn.dataset.tier) || 1;
      jumpToTierWave(tier);
    } else if (action === 'jump-boss') {
      const tier = Number(btn.dataset.tier) || state.currentTier;
      hideRewardModal();
      hideOverlay();
      state.mode = 'PLAYING';
      state.currentTier = tier;
      state.tierWaveElapsed = state.waveDuration;
      state.cumulativeWaveTime = tier * CONFIG.WAVE_DURATION;
      startTierBoss(tier);
    } else if (action === 'jump-shadow') {
      hideRewardModal();
      hideOverlay();
      state.mode = 'PLAYING';
      state.currentTier = 8;
      state.cumulativeWaveTime = 8 * CONFIG.WAVE_DURATION;
      startShadowBoss();
    } else if (action === 'jump-revealed') {
      hideRewardModal();
      hideOverlay();
      state.mode = 'PLAYING';
      state.currentTier = 8;
      state.cumulativeWaveTime = 8 * CONFIG.WAVE_DURATION;
      startRevealedFinalBoss();
    } else if (action === 'trigger-b5-dash') {
      if (!state.boss || state.boss.tier !== 5) {
        state.currentTier = 5;
        state.cumulativeWaveTime = 5 * CONFIG.WAVE_DURATION;
        startTierBoss(5);
        state.boss.entering = false;
        state.boss.x = state.boss.homeX;
      }
      state.boss.dashState = 'WARN';
      state.boss.dashTimer = 0.85;
      state.boss.dashY = state.player
        ? Math.round(Math.max(120, Math.min(CONFIG.CANVAS_HEIGHT - 120, state.player.y)))
        : Math.round(state.boss.y);
      state.boss.dashStartX = state.boss.x;
      state.boss.dashStartY = state.boss.dashY;
    } else if (action === 'trigger-b6-missiles') {
      if (!state.boss || state.boss.tier !== 6) {
        state.currentTier = 6;
        state.cumulativeWaveTime = 6 * CONFIG.WAVE_DURATION;
        startTierBoss(6);
        state.boss.entering = false;
        state.boss.x = state.boss.homeX;
      }
      prepareTier6SalvoTargets(state.boss);
      state.boss.missileState = 'FIRE';
      state.boss.missileStateTimer = 0.30;
    } else if (action === 'trigger-b7-laser') {
      if (!state.boss || state.boss.tier !== 7) {
        state.currentTier = 7;
        state.cumulativeWaveTime = 7 * CONFIG.WAVE_DURATION;
        startTierBoss(7);
        state.boss.entering = false;
        state.boss.x = state.boss.homeX;
      }
      state.lasers = [];
      state.boss.laserMode = 'PRIMARY';
      state.boss.laserShotCount = 1; // Trigger smooth angular sweep variant immediately
      fireBossPrimaryLaser(state.boss, 'Lime', 2, 0.70, 0.40, 0.85);
      state.boss.laserModeTimer = 2.9;
    } else if (action === 'trigger-b8-ult') {
      if (!state.boss || state.boss.tier !== 8) {
        state.currentTier = 8;
        state.cumulativeWaveTime = 8 * CONFIG.WAVE_DURATION;
        startTierBoss(8);
        state.boss.entering = false;
        state.boss.x = state.boss.homeX;
      }
      state.lasers = [];
      startTier8UltimateLasers(state.boss);
    } else if (action === 'trigger-b8-dash') {
      if (!state.boss || state.boss.tier !== 8) {
        state.currentTier = 8;
        state.cumulativeWaveTime = 8 * CONFIG.WAVE_DURATION;
        startTierBoss(8);
        state.boss.entering = false;
        state.boss.x = state.boss.homeX;
      }
      for (let b = 0; b < 3; b++) {
        scheduleTier8Dasher(state.boss, null, b, 3);
      }
    } else if (action === 'trigger-final-rush') {
      if (!state.boss || state.boss.kind !== 'FINAL_REVEALED') {
        state.currentTier = 8;
        state.cumulativeWaveTime = 8 * CONFIG.WAVE_DURATION;
        startRevealedFinalBoss();
        state.boss.entering = false;
        state.boss.revealTimer = 0;
      }
      state.lasers = state.lasers.filter(b => !['FINAL_VOLLEY', 'FINAL_PRIMARY'].includes(b.kind));
      state.boss.finalSweep = null;
      startFinalSweep(state.boss);
      state.boss.attackTimer = 2.2;
    } else if (action === 'trigger-escort-laser') {
      if (!state.boss || state.boss.kind !== 'FINAL_REVEALED') {
        state.currentTier = 8;
        state.cumulativeWaveTime = 8 * CONFIG.WAVE_DURATION;
        startRevealedFinalBoss();
        state.boss.entering = false;
        state.boss.revealTimer = 0;
      }
      if (state.escorts.length > 0) {
        for (let i = 0; i < Math.min(2, state.escorts.length); i++) {
          spawnEscortLaser(state.escorts[i]);
        }
      }
    } else if (action === 'open-reward') {
      const evenTier = isEvenRewardTier(state.currentTier) ? state.currentTier : 2;
      openRewardSelection(evenTier);
    } else if (action === 'cycle-weapon') {
      if (state.player) {
        state.player.weaponLevel = (state.player.weaponLevel + 1) % 5;
        updateHudBadges();
      }
    } else if (action === 'cycle-mobility') {
      if (state.player) {
        state.player.mobilityLevel = (state.player.mobilityLevel + 1) % 5;
        syncPlayerUpgradeStats(state.player);
        updateHudBadges();
      }
    } else if (action === 'damage-boss') {
      if (state.boss) {
        state.boss.entering = false;
        state.boss.hp = Math.max(1, Math.floor(state.boss.hp - state.boss.maxHp * 0.25));
      }
    } else if (action === 'kill-boss') {
      if (state.boss) {
        state.boss.hp = 0;
        handleBossDefeated();
      }
    } else if (action === 'toggle-invincible') {
      state.debugInvincible = !state.debugInvincible;
      btn.textContent = `무적: ${state.debugInvincible ? 'ON' : 'OFF'}`;
      btn.classList.toggle('active-toggle', state.debugInvincible);
    } else if (action === 'toggle-hitboxes') {
      state.debugShowHitboxes = !state.debugShowHitboxes;
      btn.textContent = `판정/총구/1/3선: ${state.debugShowHitboxes ? 'ON' : 'OFF'}`;
      btn.classList.toggle('active-toggle', state.debugShowHitboxes);
    } else if (action === 'heal-player') {
      if (state.player) state.player.hp = state.player.maxHp;
      updateHudBadges();
    }
  });

  function jumpToTierWave(tier) {
    const t = Math.max(1, Math.min(8, tier));
    state.mode = 'PLAYING';
    hideOverlay();
    hideRewardModal();
    clearAllCombatHazards();
    state.boss = null;
    state.currentTier = t;
    state.phase = 'WAVE';
    state.tierWaveElapsed = 0.0;
    state.cumulativeWaveTime = (t - 1) * CONFIG.WAVE_DURATION;
    state.enemySpawnTimer = 0.25;
    updateHudBadges();
  }

  // Expose deterministic inspection & step API for automated verification
  window.__GAME_DEBUG__ = {
    CONFIG,
    BOSS_HP_TABLE,
    SPACE_UNIQUE_LAYOUT,
    SPRITE_SPECS,
    TIER8_DASH_DIRECTIONS,
    state,
    assets,
    spawnWaveEnemy,
    beginEnemySuicide,
    startEnemyDash,
    updateEnemySpecial,
    fireSmallEnemyLaser,
    updatePlayerBullets,
    clearAllCombatHazards,
    updateGame,
    renderLaserBeam,
    getEnemyMaxHp,
    getLaserStageThicknessPx,
    computeEnemyFireInterval,
    getRotatedBounds,
    getWorldMuzzles,
    getFormattedTimerText,
    resetGame,
    jumpToTierWave,
    startTierBoss,
    startShadowBoss,
    startRevealedFinalBoss,
    startTier8UltimateLasers,
    scheduleTier8Dasher,
    prepareTier6SalvoTargets,
    fireSingleTier6WingMissile,
    fireBossPrimaryLaser,
    firePlayerWeapon,
    spawnEscortLaser,
    startFinalSweep,
    fireFinalPrimaryLasers,
    checkLaserHitsPlayer,
    fireEscortMinionPattern,
    openRewardSelection,
    applyRewardChoice,
    handleBossDefeated,
    step: (dt) => {
      updateGame(dt);
      renderGame();
    }
  };

  // ============================================================================
  // 17. MAIN ANIMATION LOOP (Clamped Game Delta Time)
  // ============================================================================
  let lastTimestamp = 0;
  function rafLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const rawDt = (timestamp - lastTimestamp) / 1000;
    const dt = Math.min(0.05, Math.max(0, rawDt));
    lastTimestamp = timestamp;

    updateGame(dt);
    renderGame();
    requestAnimationFrame(rafLoop);
  }

  fitCanvasToViewport();
  resetGame();
  preloadAllAssets().then(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('hitboxes') === '1') {
      state.debugShowHitboxes = true;
    }
    if (params.get('wp')) {
      state.player.weaponLevel = Math.max(0, Math.min(4, Number(params.get('wp')) || 0));
    }
    if (params.get('mob')) {
      state.player.mobilityLevel = Math.max(0, Math.min(4, Number(params.get('mob')) || 0));
      syncPlayerUpgradeStats(state.player);
    }
    if (params.get('reward')) {
      const rt = Number(params.get('reward')) || 2;
      openRewardSelection(rt);
    } else if (params.get('phase') === 'boss') {
      const t = Number(params.get('tier')) || 1;
      state.currentTier = t;
      state.cumulativeWaveTime = t * CONFIG.WAVE_DURATION;
      startTierBoss(t);
      state.boss.entering = false;
      state.boss.x = state.boss.homeX;
      if (params.get('ult') === '1' && t === 8) {
        startTier8UltimateLasers(state.boss);
      }
      if (params.get('rush') === '1' && t === 5) {
        state.boss.dashState = 'WARN';
        state.boss.dashTimer = 0.85;
        state.boss.dashY = 362;
      }
      if (params.get('simSeconds')) {
        const secs = Number(params.get('simSeconds')) || 2;
        for (let i = 0; i < secs * 25; i++) updateGame(0.04);
      }
    } else if (params.get('phase') === 'shadow') {
      state.currentTier = 8;
      state.cumulativeWaveTime = 8 * CONFIG.WAVE_DURATION;
      startShadowBoss();
      state.boss.entering = false;
      state.boss.x = state.boss.homeX;
      for (let i = 0; i < 20; i++) updateGame(0.08);
    } else if (params.get('phase') === 'revealed') {
      state.currentTier = 8;
      state.cumulativeWaveTime = 8 * CONFIG.WAVE_DURATION;
      startRevealedFinalBoss();
      state.boss.entering = false;
      state.boss.revealTimer = 0;
      if (params.get('rush') === '1') {
        startFinalSweep(state.boss, 1);
        state.boss.attackTimer = 2.2;
      }
      if (params.get('escortLasers') === '1' && state.escorts.length >= 2) {
        spawnEscortLaser(state.escorts[0]);
        spawnEscortLaser(state.escorts[2]);
      }
      const simSteps = Number(params.get('simSteps')) || 25;
      for (let i = 0; i < simSteps; i++) updateGame(0.08);
    } else if (params.get('simSeconds')) {
      const secs = Number(params.get('simSeconds')) || 5;
      for (let i = 0; i < secs * 20; i++) updateGame(0.05);
    }

    fitCanvasToViewport();
    renderGame();
    requestAnimationFrame(rafLoop);
  });
})();
