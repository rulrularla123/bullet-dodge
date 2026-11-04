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
    TOTAL_TIERS: 11,

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

    // Boss Phase 2 thresholds & tuning parameters (Tiers 5~8)
    BOSS_PHASE2_THRESHOLDS: { 5: 0.30, 6: 0.40, 7: 0.10, 8: 0.20, 9: 0.50 },
    TIER5_DASH_SIDE_INTERVAL: 0.085,
    TIER5_DASH_SIDE_SPEED: 220,
    TIER5_P2_DASH_COUNT: 5,
    TIER5_P2_WARN_TIME: 0.80,
    TIER5_P2_DASH_SPEED: 1420,
    TIER5_P2_WAIT_TIME: 0.0,
    AWAKEN_REPEAT_COOLDOWN: 20.0,
    TIER6_P2_EXPLOSION_INTERVAL: 18.0,
    TIER6_P2_WARN_TIME: 1.15,
    TIER6_P2_BLAST_RADIUS: 96,
    TIER6_P2_SAFE_RADIUS: 68,
    TIER7_P2_STAGE1_TIME: 0.175,
    TIER7_P2_STAGE2_TIME: 0.10,
    TIER7_P2_STAGE3_TIME: 0.25,
    TIER7_P2_LASER_DAMAGE: 1,
    TIER8_P2_WAVE_COUNT: 6,
    TIER8_P2_WAVE_INTERVAL: 3.0,
    TIER8_P2_LANE_COUNT: 7,
    TIER8_P2_TOP_Y: 60,
    TIER8_P2_LANE_HEIGHT: 640 / 7,

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
  // Keep established pattern/asset IDs stable while inserting electricity at stage 8.
  const STAGE_ORDER=[1,2,3,4,5,10,6,7,11,9,8];
  function getStageNumber(patternTier) { return STAGE_ORDER.indexOf(patternTier)+1 || patternTier; }
  function getPatternTier(stageNumber) { return STAGE_ORDER[stageNumber-1] || 1; }

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
    // Electric tier: native-up ships, rotated left in the game.
    'enemies/Tier_09/Enemy_01.png': {size:[32,32],visibleBounds:[10,7,12,21],muzzles:[{x:16,y:7}]},
    'enemies/Tier_09/Enemy_02.png': {size:[32,32],visibleBounds:[6,7,20,21],muzzles:[{x:16,y:7}]},
    'enemies/Tier_09/Enemy_03.png': {size:[32,32],visibleBounds:[0,7,32,21],muzzles:[{x:10,y:7},{x:22,y:7}]},
    'enemies/Tier_09/Enemy_04.png': {size:[32,32],visibleBounds:[0,2,32,26],muzzles:[{x:10,y:2},{x:22,y:2}]},
    'enemies/Tier_09/Boss.png': {size:[32,32],visibleBounds:[1,1,30,31],muzzles:[{x:25,y:7},{x:16,y:1},{x:7,y:7}],laserMuzzles:[{x:28,y:24},{x:4,y:24}]},
    'enemies/Tier_10/Enemy_01.png': {size:[32,32],visibleBounds:[6,9,20,14],muzzles:[{x:16,y:16}]},
    'enemies/Tier_10/Enemy_02.png': {size:[32,32],visibleBounds:[2,9,28,14],muzzles:[{x:16,y:16}]},
    'enemies/Tier_10/Enemy_03.png': {size:[32,32],visibleBounds:[2,9,28,19],muzzles:[{x:16,y:16}]},
    'enemies/Tier_10/Enemy_04.png': {size:[32,32],visibleBounds:[2,2,28,26],muzzles:[{x:16,y:16}]},
    'enemies/Tier_10/Boss.png': {size:[32,32],visibleBounds:[1,1,30,30],muzzles:[{x:16,y:16}]},
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
    Diamond: { size: [8, 8],  collision: { type: 'circle', radius: 2.0 }, forward: 'radial' },
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
    8: { primary: 'Blue',   secondary: 'Cyan',   accent: 'Blue'   },
    9: { primary: 'Cyan', secondary: 'Blue', accent: 'Cyan' }
  };

  const BOSS_BAR_IDS = [
    'Tier_01', 'Tier_02', 'Tier_03', 'Tier_04',
    'Tier_05', 'Tier_06', 'Tier_07', 'Tier_08', 'Tier_09', 'Tier_10',
    'Final_Shadow', 'Final_Revealed', 'Chain_Boss'
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

    // User-authored round and straight sprites, grouped by attack color.
    for (const color of BULLET_COLORS) {
      for (const shape of ['Orb', 'Needle']) {
        paths.add(`bullets/Colors/${color}/${shape}.png`);
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
    for (let t = 1; t <= 10; t++) {
      const tid = `Tier_${String(t).padStart(2,'0')}`;
      for (let e = 1; e <= 4; e++) {
        paths.add(`enemies/${tid}/Enemy_0${e}.png`);
      }
      paths.add(`enemies/${tid}/Boss.png`);
    }

    paths.add('effects/Electric_Laser/Electric_Laser_Blue_Spritesheet.png');
    paths.add('effects/Electric_Laser/Electric_Laser_Red_Spritesheet.png');
    paths.add('effects/Electric_Laser/Electric_Laser_Spritesheet.png');

    // 7. Tier 04 Separated Boss Body & 2 Escorts
    for (const part of ['Body_Gun','Body_Blade','Head_And_Saws','Blade']) paths.add(`bosses/Chain_Boss/${part}.png`);
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
  const SKILL_UPGRADE_STATS = [
    { laserTotal: BOSS_HP_TABLE[1], laserCooldown:120, healAmount:1, healCooldown:180, shieldDuration:4, shieldCooldown:120 },
    { laserTotal: BOSS_HP_TABLE[3], laserCooldown:120, healAmount:2, healCooldown:180, shieldDuration:6, shieldCooldown:120 },
    { laserTotal: BOSS_HP_TABLE[3], laserCooldown:100, healAmount:2, healCooldown:120, shieldDuration:7, shieldCooldown:120 },
    { laserTotal: BOSS_HP_TABLE[5], laserCooldown:100, healAmount:3, healCooldown:120, shieldDuration:10, shieldCooldown:120 },
    { laserTotal: BOSS_HP_TABLE[10]/3, laserCooldown:80, healAmount:3, healCooldown:90, shieldDuration:10, shieldCooldown:100 }
  ];

  function getSkillStats(level=state.player?.skillLevel ?? 0) {
    return SKILL_UPGRADE_STATS[Math.max(0,Math.min(4,Math.floor(level)))];
  }

  function getRewardLevels(p=state.player) {
    return p ? {vitality:p.vitalityLevel,equipment:p.weaponLevel,mobility:p.mobilityLevel,skills:p.skillLevel} : {};
  }

  function canChooseReward(choice,p=state.player) {
    const levels=getRewardLevels(p);
    if(choice==='continue') return Object.values(levels).length===4 && Object.values(levels).every(level=>level>=4);
    return Object.hasOwn(levels,choice) && levels[choice]<4;
  }

  function upgradePlayerSkills(p) {
    if(p.skillLevel>=4) return false;
    p.skillLevel++;
    const stats=getSkillStats(p.skillLevel);
    for(const [id,maximum] of [['laser',stats.laserCooldown],['heal',stats.healCooldown],['shield',stats.shieldCooldown]]) {
      const skill=p.skills[id];
      skill.cooldown=skill.cooldown/(skill.cooldownDuration || maximum)*maximum;
      skill.cooldownDuration=maximum;
    }
    return true;
  }

  function getEnemyMaxHp(tier, enemyIdx) {
    const t = Math.max(1, Math.min(CONFIG.TOTAL_TIERS, tier===10?getStageNumber(tier):tier));
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
        ['DASH', 'OFFSCREEN', 'RETURN', 'P2_WARN', 'P2_DASH', 'P2_WAIT', 'P2_RETURN'].includes(entity.dashState)) {
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
    electricVolleys: [],
    empWaves: [],
    electricSweeps: [],
    lasers: [],         // Active 3-stage lasers (Tier 07, Tier 08, Final_Revealed escorts)
    missiles: [],       // Active timed wing missiles (Tier 06 4-missile salvos)
    globalBlastWaves: [], // Tier_06 Phase 2 full-map random explosion waves (with guaranteed safe zones)
    afterimages: [],    // Tier_07 Phase 2 green silhouette blink afterimages
    cameraShake: { timer: 0, duration: 0, magnitude: 0 },
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
      rewardsOpenedForTiers: [],
      bossPhase2Triggered: { 5: 0, 6: 0, 7: 0, 8: 0 },
      tier6GlobalBlastWaves: 0,
      tier7AfterimagesSpawned: 0,
      tier7Phase2LasersFired: 0,
      tier8Phase2WavesFired: 0,
      cameraShakesTriggered: 0
    }
  };

  function triggerCameraShake(duration = 0.28, magnitude = 6.5) {
    state.cameraShake.duration = Math.max(0.01, duration);
    state.cameraShake.timer = Math.max(state.cameraShake.timer, duration);
    state.cameraShake.magnitude = Math.max(state.cameraShake.magnitude || 0, magnitude);
    state.telemetry.cameraShakesTriggered += 1;
  }

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
      skillLevel: 0,
      skills: {
        laser: { cooldown: 0, remaining: 0, accumulator: 0, pendingTicks: 0, elapsed: 0, flashTimer: 0, cooldownDuration:120, damagePerTick:null },
        heal: { cooldown: 0, cooldownDuration:180 },
        shield: { cooldown: 0, remaining: 0, cooldownDuration:120 }
      },
      weaponLevel: 0,    // Only increases when 'equipment' is chosen at even-boss reward
      mobilityLevel: 0,  // Only increases when 'mobility' is chosen at even-boss reward
      shotCounter: 0,
      fireCooldown: 0.0,
      invulnTimer: 0.0,
      hitFlashTimer: 0.0,
      stunRemaining: 0.0,
      electrocutionRemaining: 0.0,
      electrocutionColor: 'Blue',
      empRemaining: 0,
      empMap: null
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
    state.electricVolleys = [];
    state.electricSweeps = [];
    state.empWaves = [];
    state.lasers = [];
    state.missiles = [];
    state.globalBlastWaves = [];
    state.afterimages = [];
    state.cameraShake = { timer: 0, duration: 0, magnitude: 0 };
    state.explosions = [];
    state.dashWarnings = [];
    state.dashers = [];
    state.meteors = [];
    state.meteorWarnings = [];
    state.escorts = [];
    state.enemies = [];
  }

  function resetGame() {
    state.debugInvincible = false;
    const invincibleButton = document.getElementById('btn-invincible');
    if (invincibleButton) {
      invincibleButton.textContent = '무적: OFF';
      invincibleButton.classList.remove('active-toggle');
    }
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
    state.telemetry.bossPhase2Triggered = { 5: 0, 6: 0, 7: 0, 8: 0 };
    state.telemetry.tier6GlobalBlastWaves = 0;
    state.telemetry.tier7AfterimagesSpawned = 0;
    state.telemetry.tier7Phase2LasersFired = 0;
    state.telemetry.tier8Phase2WavesFired = 0;
    state.telemetry.cameraShakesTriggered = 0;

    hideOverlay();
    hideRewardModal();
    updateHudBadges();
  }

  // ============================================================================
  // 7. EVEN-BOSS REWARD SELECTION SYSTEM (Tier 02, 04, 06, 08 ONLY)
  // ============================================================================
  function isEvenRewardTier(tier) {
    return tier>=2 && tier<=CONFIG.TOTAL_TIERS && tier%2===0;
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
      badgeEl.textContent = `TIER ${String(defeatedTier).padStart(2,'0')} BOSS DEFEATED — REWARD (${state.rewardsChosenHistory.length + 1}/${Math.floor(CONFIG.TOTAL_TIERS/2)})`;
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

    if(p) {
      const current=getSkillStats(p.skillLevel),next=getSkillStats(Math.min(4,p.skillLevel+1));
      const description=document.getElementById('reward-desc-skills');
      if(description) description.innerHTML=`세 스킬 함께 강화<br/>레이저 <strong>${Math.round(current.laserTotal)} → ${Math.round(next.laserTotal)}</strong> / 쿨 ${next.laserCooldown}초<br/>회복 <strong>${next.healAmount} HP</strong> / 쿨 ${next.healCooldown}초<br/>방어막 <strong>${next.shieldDuration}초</strong> / 쿨 ${next.shieldCooldown}초`;
      const stat=document.getElementById('reward-stat-skills');
      if(stat) stat.textContent=`스킬 +${p.skillLevel} → +${Math.min(4,p.skillLevel+1)}`;
      for(const [choice,id] of [['vitality',1],['equipment',2],['mobility',3],['skills',4]]) {
        const card=document.getElementById(`reward-card-${id}`);
        if(card) {card.hidden=!canChooseReward(choice,p);card.disabled=card.hidden;}
      }
      const nextButton=document.getElementById('reward-continue');
      if(nextButton) {nextButton.hidden=!canChooseReward('continue',p);nextButton.disabled=nextButton.hidden;}
    }
    document.getElementById('reward-screen')?.classList.remove('hidden');
    updateHudBadges();
  }

  function hideRewardModal() {
    document.getElementById('reward-screen')?.classList.add('hidden');
  }

  function applyRewardChoice(choiceType) {
    if (state.mode !== 'REWARD' || state.rewardKeyLock) return;
    if (!canChooseReward(choiceType)) return;

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
      } else if (choiceType === 'skills') {
        upgradePlayerSkills(p);
        state.floatingTexts.push({text:`스킬 강화 +${p.skillLevel}!`,x:p.x,y:p.y-36,color:'#b4a5ff',timer:2});
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
      advanceToNextTierWave(getPatternTier(defeatedTier + 1));
    } else {
      // Last regular tier reward, if present, leads to the final boss.
      startShadowBoss();
    }
    updateHudBadges();
  }

  function advanceToNextTierWave(nextTier) {
    state.currentTier = nextTier;
    state.phase = 'WAVE';
    state.tierWaveElapsed = 0.0;
    state.cumulativeWaveTime = (getStageNumber(nextTier) - 1) * CONFIG.WAVE_DURATION;
    state.enemySpawnTimer = 0.85;
    if(nextTier===11)startChainBoss({combat:false,campaign:true});
    state.floatingTexts.push({
      text: `TIER ${String(getStageNumber(state.currentTier)).padStart(2,'0')} WAVE START!`,
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
    const relPath = `enemies/Tier_${String(tier).padStart(2,'0')}/Enemy_0${enemyIdx}.png`;
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

  // Segmented stage-nine encounter (internal pattern 11), also available as an isolated preview.
  function chainHeadPosition(time) {
    return {x:CONFIG.CANVAS_WIDTH/2+(CONFIG.CANVAS_WIDTH/2+130)*Math.cos(time*0.34+0.5),
      y:CONFIG.CANVAS_HEIGHT/2+(CONFIG.CANVAS_HEIGHT/2+110)*Math.sin(time*0.53+0.2)};
  }

  function sampleChainBody(boss) {
    const trail=boss.trail,head=boss.segments[0];Object.assign(head,trail[0]);
    head.angle=Math.atan2(trail[0].y-trail[1].y,trail[0].x-trail[1].x);
    let cursor=0,fraction=0;
    // Intersect the travelled path with a 42px circle around the preceding joint.
    // Arc-length sampling shortened the chord on turns; this keeps actual spacing rigid.
    for(let i=1;i<boss.segments.length;i++) {
      const previous=boss.segments[i-1];let point=null;
      while(cursor<trail.length-1) {
        const a=trail[cursor],b=trail[cursor+1],vx=b.x-a.x,vy=b.y-a.y,A=vx*vx+vy*vy;
        if(A<1e-10){cursor++;fraction=0;continue;}
        const dx=a.x-previous.x,dy=a.y-previous.y,B=2*(dx*vx+dy*vy),C=dx*dx+dy*dy-42*42,disc=B*B-4*A*C;
        if(disc>=0) {
          const t=(-B+Math.sqrt(disc))/(2*A);
          if(t>=fraction-1e-8&&t<=1+1e-8) {
            const u=Math.max(fraction,Math.min(1,t));point={x:a.x+vx*u,y:a.y+vy*u};fraction=u;
            if(fraction>=1-1e-9){cursor++;fraction=0;}break;
          }
        }
        cursor++;fraction=0;
      }
      if(!point) {
        const last=trail[trail.length-1],angle=Math.atan2(last.y-previous.y,last.x-previous.x);
        point={x:previous.x+Math.cos(angle)*42,y:previous.y+Math.sin(angle)*42};trail.push(point);
      }
      Object.assign(boss.segments[i],point,{angle:Math.atan2(previous.y-point.y,previous.x-point.x)});
    }
    boss.x=head.x;boss.y=head.y;boss.rotation=head.angle+Math.PI/2;
  }

  function seedChainEntry(boss) {
    boss.trail=[];
    for(let i=0;i<boss.segments.length+30;i++)boss.trail.push({x:CONFIG.CANVAS_WIDTH+(boss.phase2Triggered?2200:160)+i*42,y:CONFIG.CANVAS_HEIGHT/2});
    sampleChainBody(boss);boss.entering=true;
  }

  function pushChainHead(boss,point) {
    if(Math.hypot(point.x-boss.trail[0].x,point.y-boss.trail[0].y)>0.01)boss.trail.unshift({...point});
    let length=0;
    for(let i=1;i<boss.trail.length;i++) {
      length+=Math.hypot(boss.trail[i].x-boss.trail[i-1].x,boss.trail[i].y-boss.trail[i-1].y);
      if(length>(boss.segments.length-1)*42*1.7+300){boss.trail.length=i+1;break;}
    }
    sampleChainBody(boss);
  }

  function startChainBoss({combat=true,campaign=false,skipEntrance=false}={}) {
    if(state.boss?.kind==='CHAIN_BOSS' && !state.boss.combat && combat) {
      const b=state.boss;b.combat=true;b.pathState='RETREAT';b.entering=true;b.headLaserCooldown=7;
      planChainRetreat(b);
      state.lasers=state.lasers.filter(l=>l.chainOwnerId!==b.id);state.enemyBullets=[];
      state.phase='BOSS';updateHudBadges();return b;
    }
    clearAllCombatHazards();state.enemies=[];state.phase=combat?'BOSS':'WAVE';state.meteorSpawnTimer=1e6;
    if(campaign) {state.currentTier=11;state.cumulativeWaveTime=(getStageNumber(11)-1+(combat?1:0))*CONFIG.WAVE_DURATION;}
    const boss={id:'chain-boss',kind:'CHAIN_BOSS',tier:11,barId:'Chain_Boss',
      path:'bosses/Chain_Boss/Head_And_Saws.png',spec:{size:[16,16],visibleBounds:[0,0,16,16]},
      scale:3,x:0,y:0,prevX:0,prevY:0,hp:12000,maxHp:12000,age:0,hitFlash:0,
      entering:!skipEntrance,defeatedHandled:false,trail:[],segments:[],headLaserCooldown:7,laserStartGap:0,
      combat,campaign,travelTime:0,pathState:skipEntrance?'ROAM':combat?'BOSS_ENTER':'WAVE_ENTER',phase2Triggered:false};
    // Seed a long, already connected tail instead of stacking every segment at the entrance.
    const previewPhase=Math.random()*30;
    for(let t=previewPhase;t>=previewPhase-45;t-=0.025)boss.trail.push(chainHeadPosition(t));
    for(let i=0;i<82;i++)boss.segments.push(makeChainSegment(i));
    state.boss=boss;
    if(skipEntrance)sampleChainBody(boss);else seedChainEntry(boss);
    updateHudBadges();return boss;
  }

  function makeChainSegment(index) {
    const interval=24+Math.random()*12;
    return {kind:index===0?'HEAD':index%2?'GUN':'BLADE',fireCooldown:1.3+index*0.17,
      currentCooldown:4+Math.random()*30,currentWaveInterval:interval,currentBossInterval:interval};
  }


  function planChainRetreat(boss) {
    const h=boss.segments[0],outsideY=h.y<CONFIG.CANVAS_HEIGHT/2?-240:CONFIG.CANVAS_HEIGHT+240;
    setChainCurve(boss,[{x:h.x,y:h.y},{x:h.x+Math.cos(h.angle)*240,y:h.y+Math.sin(h.angle)*240},
      {x:CONFIG.CANVAS_WIDTH+340,y:outsideY},
      {x:CONFIG.CANVAS_WIDTH+boss.segments.length*42+450,y:outsideY},
      {x:CONFIG.CANVAS_WIDTH+boss.segments.length*42+650,y:CONFIG.CANVAS_HEIGHT/2}]);
  }

  function beginChainPhase2(boss) {
    if(boss.phase2Triggered || !boss.combat || boss.pathState!=='ROAM')return false;
    boss.phase2Triggered=true;boss.pathState='P2_RETREAT';boss.entering=true;boss.rushCount=0;
    const other=[0,2,3];for(let i=2;i>0;i--){const j=Math.floor(Math.random()*(i+1));[other[i],other[j]]=[other[j],other[i]];}
    boss.rushZones=[1,...other.slice(0,2)];boss.usedRushZones=[];boss.corridors=[];boss.growthDone=false;
    planChainRetreat(boss);
    state.lasers=state.lasers.filter(l=>l.chainOwnerId!==boss.id);state.enemyBullets=[];
    triggerCameraShake(0.25,4);return true;
  }

  function planChainRoam(boss) {
    const h=boss.segments[0],p=state.player||{x:200,y:360};
    if(!boss.roamEdges?.length){boss.roamEdges=[0,1,2,3];for(let i=3;i>0;i--){const j=Math.floor(Math.random()*(i+1));[boss.roamEdges[i],boss.roamEdges[j]]=[boss.roamEdges[j],boss.roamEdges[i]];}}
    const edge=boss.roamEdges.pop(),margin=150+Math.random()*170;
    const x=100+Math.random()*(CONFIG.CANVAS_WIDTH-200),y=100+Math.random()*(CONFIG.CANVAS_HEIGHT-200);
    const outside=[{x:-margin,y},{x:CONFIG.CANVAS_WIDTH+margin,y},{x,y:-margin},{x,y:CONFIG.CANVAS_HEIGHT+margin}][edge];
    const side=Math.random()<0.5?-1:1;
    setChainCurve(boss,[{x:h.x,y:h.y},{x:h.x+Math.cos(h.angle)*240,y:h.y+Math.sin(h.angle)*240},
      {x:Math.max(120,Math.min(CONFIG.CANVAS_WIDTH-120,p.x+side*(220+Math.random()*250))),y:120+Math.random()*(CONFIG.CANVAS_HEIGHT-240)},outside]);
    boss.roamCurveReady=true;boss.roamRoutes=(boss.roamRoutes||0)+1;
  }

  function setChainCurve(boss,points) {
    const rounded=[points[0]],outsideDistance=p=>Math.hypot(Math.max(0,-p.x,p.x-CONFIG.CANVAS_WIDTH),Math.max(0,-p.y,p.y-CONFIG.CANVAS_HEIGHT));
    // Split near reversals into broad turns instead of a cusp at a single joint.
    for(let i=1;i<points.length-1;i++) {
      const a=points[i-1],v=points[i],b=points[i+1],incoming=Math.hypot(v.x-a.x,v.y-a.y),outgoing=Math.hypot(b.x-v.x,b.y-v.y);
      rounded.push(v);
      if(incoming>1&&outgoing>1) {
        const ux=(v.x-a.x)/incoming,uy=(v.y-a.y)/incoming,vx=(b.x-v.x)/outgoing,vy=(b.y-v.y)/outgoing;
        if(ux*vx+uy*vy<-0.85 && (!boss.phase2Triggered || outsideDistance(v)===0)) {
          const r=200,one={x:v.x-uy*r,y:v.y+ux*r},two={x:v.x+uy*r,y:v.y-ux*r};
          const side=outsideDistance(one)>outsideDistance(two)?one:two;
          rounded.push(side,{x:side.x+vx*r,y:side.y+vy*r});
        }
      }
    }
    rounded.push(points[points.length-1]);
    const samples=[{...rounded[0],distance:0}];
    const append=point=>{const previous=samples[samples.length-1],d=Math.hypot(point.x-previous.x,point.y-previous.y);if(d>1e-6)samples.push({...point,distance:previous.distance+d});};
    // Rounded polyline corners keep long straight runs exactly straight and cannot overshoot.
    for(let i=1;i<rounded.length-1;i++) {
      const a=rounded[i-1],v=rounded[i],b=rounded[i+1],before=Math.hypot(v.x-a.x,v.y-a.y),after=Math.hypot(b.x-v.x,b.y-v.y);
      if(before<1e-6||after<1e-6)continue;
      const r=Math.min(260,before*0.48,after*0.48),entry={x:v.x-(v.x-a.x)/before*r,y:v.y-(v.y-a.y)/before*r},exit={x:v.x+(b.x-v.x)/after*r,y:v.y+(b.y-v.y)/after*r};
      append(entry);
      for(let j=1;j<=20;j++){const t=j/20,u=1-t;append({x:u*u*entry.x+2*u*t*v.x+t*t*exit.x,y:u*u*entry.y+2*u*t*v.y+t*t*exit.y});}
    }
    append(rounded[rounded.length-1]);boss.travelCurve=samples;boss.curveDistance=0;boss.curveCursor=0;
  }

  function chainRayAcrossScreen(origin,angle) {
    let near=0,far=Infinity;
    for(const [position,direction,limit] of [[origin.x,Math.cos(angle),CONFIG.CANVAS_WIDTH],[origin.y,Math.sin(angle),CONFIG.CANVAS_HEIGHT]]) {
      if(Math.abs(direction)<1e-9){if(position<0||position>limit)return null;continue;}
      const a=(0-position)/direction,b=(limit-position)/direction;
      near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
    }
    return far>=near&&far>=0?{near,far}:null;
  }

  function placeChainFrontHead(boss,point) {
    // A long straight neck reaches an offscreen joint; all spare bends stay outside.
    boss.trail=[{x:point.x,y:point.y},...boss.slackTrail];sampleChainBody(boss);
    boss.frontNeckCount=Math.ceil(Math.hypot(point.x-boss.slackTrail[0].x,point.y-boss.slackTrail[0].y)/42);
  }

  function reserveChainAimNeck(boss) {
    const head=boss.segments[0],W=CONFIG.CANVAS_WIDTH,H=CONFIG.CANVAS_HEIGHT;
    const sameOutsideSide=p=>head.x<0?p.x<-120:head.x>W?p.x>W+120:head.y<0?p.y<-120:p.y>H+120;
    let length=0,index=1;
    for(;index<boss.trail.length-1;index++) {
      const p=boss.trail[index],previous=boss.trail[index-1];
      if(!sameOutsideSide(p))break;
      length+=Math.hypot(p.x-previous.x,p.y-previous.y);if(length>=720)break;
    }
    index=Math.max(1,Math.min(index,boss.trail.length-2));
    if(!sameOutsideSide(boss.trail[index]))index=Math.max(1,index-1);
    boss.aimSlackTrail=boss.trail.slice(index).map(p=>({x:p.x,y:p.y}));
    boss.aimNeckCount=Math.ceil(Math.hypot(head.x-boss.aimSlackTrail[0].x,head.y-boss.aimSlackTrail[0].y)/42);
  }

  function isChainCorridorPart(boss,part,index) {
    if(['P2_FRONT_ENTER','P2_LASER'].includes(boss.pathState)&&index<=(boss.frontNeckCount||0))return false;
    return (boss.corridors||[]).some(lane=>{
      const dx=lane.end.x-lane.start.x,dy=lane.end.y-lane.start.y,length=dx*dx+dy*dy;
      const t=((part.x-lane.start.x)*dx+(part.y-lane.start.y)*dy)/(length||1);
      return t>=0&&t<=1&&Math.hypot(part.x-lane.start.x-t*dx,part.y-lane.start.y-t*dy)<3;
    });
  }

  function beginChainFrontBob(boss) {
    const head=boss.segments[0];boss.frontBobCenterY=Math.max(250,Math.min(CONFIG.CANVAS_HEIGHT-250,head.y));
    const phase=Math.asin(Math.max(-1,Math.min(1,(head.y-boss.frontBobCenterY)/150)));
    boss.frontBobPhase=Math.random()<0.5?phase:Math.PI-phase;
  }

  function followChainCurve(boss,dt,speed,brake=false) {
    const points=boss.travelCurve,last=points[points.length-1],remaining=last.distance-boss.curveDistance;
    if(brake)speed=Math.min(speed,Math.sqrt(Math.max(0,2*700*remaining)));
    boss.curveDistance=Math.min(last.distance,boss.curveDistance+speed*dt);
    while(boss.curveCursor<points.length-2&&points[boss.curveCursor+1].distance<boss.curveDistance)boss.curveCursor++;
    const a=points[boss.curveCursor],b=points[boss.curveCursor+1],t=(boss.curveDistance-a.distance)/(b.distance-a.distance||1);
    pushChainHead(boss,{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});return boss.curveDistance>=last.distance;
  }

  function setChainTransit(boss,target,{arrival=null}={}) {
    const h=boss.segments[0],W=CONFIG.CANVAS_WIDTH,H=CONFIG.CANVAS_HEIGHT,margin=300+Math.random()*180;
    const corners=[{x:-margin,y:-margin},{x:W+margin,y:-margin},{x:W+margin,y:H+margin},{x:-margin,y:H+margin}];
    const adjacent=point=>point.x<0?[0,3]:point.x>W?[1,2]:point.y<0?[0,1]:[3,2];
    const nearest=(point,list)=>list.reduce((best,i)=>Math.hypot(point.x-corners[i].x,point.y-corners[i].y)<Math.hypot(point.x-corners[best].x,point.y-corners[best].y)?i:best,list[0]);
    const goal=arrival||{x:W+200,y:target.y},start=nearest(h,adjacent(h)),end=nearest(goal,adjacent(goal));
    const clockwise=(end-start+4)%4,counterclockwise=(start-end+4)%4;
    const direction=clockwise===counterclockwise?(Math.random()<0.5?-1:1):clockwise<counterclockwise?1:-1;
    const count=Math.min(clockwise,counterclockwise);
    const points=[{x:h.x,y:h.y},{x:h.x+Math.cos(h.angle)*180,y:h.y+Math.sin(h.angle)*180}];
    for(let i=0;i<=count;i++)points.push(corners[(start+direction*i+8)%4]);
    points.push(goal,target);setChainCurve(boss,points);
  }


  function prepareChainRush(boss) {
    const zone=boss.rushZones[boss.rushCount];boss.usedRushZones.push(zone);
    const x=180+Math.random()*(CONFIG.CANVAS_WIDTH-360),y=140+Math.random()*(CONFIG.CANVAS_HEIGHT-280);
    const origins=[{source:{x:-180,y},arrival:{x:-1500,y}},{source:{x:CONFIG.CANVAS_WIDTH+180,y},arrival:{x:CONFIG.CANVAS_WIDTH+1500,y}},
      {source:{x,y:-180},arrival:{x,y:-1500}},{source:{x,y:CONFIG.CANVAS_HEIGHT+180},arrival:{x,y:CONFIG.CANVAS_HEIGHT+1500}}];
    boss.rushSource=origins[zone].source;boss.rushArrival=origins[zone].arrival;
    boss.pathState='P2_TRANSIT';boss.rushTimer=0;boss.rushAimLocked=false;
    if(boss.rushCount===0){const h=boss.segments[0];setChainCurve(boss,[{x:h.x,y:h.y},boss.rushArrival,boss.rushSource]);}
    else setChainTransit(boss,boss.rushSource,{arrival:boss.rushArrival});
  }

  function updateChainMotion(boss,dt) {
    const head=boss.segments[0],phase=boss.pathState;
    if(phase==='WAVE_ENTER' || phase==='BOSS_ENTER') {
      pushChainHead(boss,{x:head.x-420*dt,y:CONFIG.CANVAS_HEIGHT/2});
      if(boss.x<=CONFIG.CANVAS_WIDTH-210) {boss.pathState='ROAM';boss.entering=false;boss.roamCurveReady=false;}
    } else if(phase==='RETREAT') {
      followChainCurve(boss,dt,420);
      if(boss.segments.every(p=>p.x>CONFIG.CANVAS_WIDTH+110)) {seedChainEntry(boss);boss.pathState='BOSS_ENTER';}
    } else if(phase==='ROAM') {
      if(!boss.roamCurveReady)planChainRoam(boss);
      if(followChainCurve(boss,dt,420))planChainRoam(boss);
    } else if(phase==='P2_RETREAT') {
      followChainCurve(boss,dt,420);
      if(boss.segments.every(p=>p.x>CONFIG.CANVAS_WIDTH+110)) {
        while(boss.segments.length<900){const part=makeChainSegment(boss.segments.length);part.fireCooldown=3+Math.random()*8;part.currentCooldown=6+Math.random()*24;boss.segments.push(part);}
        boss.growthDone=true;boss.p2BulletGap=2.2;boss.p2BodyLaserGap=3.2;seedChainEntry(boss);prepareChainRush(boss);
      }
    } else if(phase==='P2_TRANSIT') {
      if(followChainCurve(boss,dt,560,true)){boss.pathState='P2_AIM';boss.rushTimer=0;boss.entering=false;reserveChainAimNeck(boss);}
    } else if(phase==='P2_AIM') {
      boss.rushTimer+=dt;const t=boss.rushTimer;
      const next={x:boss.rushSource.x+Math.sin(t*2)*12,y:boss.rushSource.y+Math.sin(t*2.4)*10};
      boss.trail=[next,...boss.aimSlackTrail];sampleChainBody(boss);
      if(!boss.rushAimLocked)head.angle=Math.atan2((state.player?.y??360)-head.y,(state.player?.x??200)-head.x);
      if(t>=1.05 && !boss.rushAimLocked){boss.rushAimLocked=true;boss.lockedRushAngle=head.angle;}
      if(boss.rushAimLocked)head.angle=boss.lockedRushAngle;
      if(t>=1.6) {
        boss.pathState='P2_DASH';boss.rushStart={x:head.x,y:head.y};boss.rushAngle=head.angle;boss.rushDistance=0;
        const crossing=chainRayAcrossScreen(head,head.angle),len=crossing?.far ?? 200;
        boss.rushEnd={x:head.x+Math.cos(head.angle)*len,y:head.y+Math.sin(head.angle)*len};boss.rushLength=len;
        boss.corridors.push({start:{x:head.x+Math.cos(head.angle)*(crossing?.near||0),y:head.y+Math.sin(head.angle)*(crossing?.near||0)},end:{...boss.rushEnd},edge:boss.usedRushZones.at(-1)});
        triggerCameraShake(0.15,3);
      }
    } else if(phase==='P2_DASH') {
      pushChainHead(boss,{x:head.x+Math.cos(boss.rushAngle)*1500*dt,y:head.y+Math.sin(boss.rushAngle)*1500*dt});head.angle=boss.rushAngle;boss.rushDistance+=1500*dt;
      if(boss.rushDistance>boss.rushLength+320) {
        boss.rushCount++;boss.pathState=boss.rushCount<3?'P2_EXIT':'P2_RETURN';boss.rushTimer=0;
        if(boss.rushCount===3){
          boss.frontAnchor={x:CONFIG.CANVAS_WIDTH-140,y:Math.max(140,Math.min(CONFIG.CANVAS_HEIGHT-140,(state.player?.y||360)+(Math.random()-0.5)*180))};
          boss.frontJoint={x:CONFIG.CANVAS_WIDTH+1800,y:CONFIG.CANVAS_HEIGHT/2};
          setChainTransit(boss,boss.frontJoint,{arrival:{x:boss.frontJoint.x+400,y:boss.frontJoint.y}});
        }
      }
    } else if(phase==='P2_EXIT') {
      const a=Math.max(0,1-boss.rushTimer/0.65),b=Math.max(0,1-(boss.rushTimer+dt)/0.65),speed=560+940*(a*a+a*b+b*b)/3;
      pushChainHead(boss,{x:head.x+Math.cos(head.angle)*speed*dt,y:head.y+Math.sin(head.angle)*speed*dt});
      boss.rushTimer+=dt;if(boss.rushTimer>=0.65)prepareChainRush(boss);
    } else if(phase==='P2_RETURN') {
      if(followChainCurve(boss,dt,560)){boss.pathState='P2_FRONT_ENTER';boss.slackTrail=boss.trail.map(p=>({x:p.x,y:p.y}));}
    } else if(phase==='P2_FRONT_ENTER') {
      const dx=boss.frontAnchor.x-head.x,dy=boss.frontAnchor.y-head.y,d=Math.hypot(dx,dy),speed=Math.min(560,Math.sqrt(2*700*d)),t=d?Math.min(1,speed*dt/d):1;
      placeChainFrontHead(boss,{x:head.x+dx*t,y:head.y+dy*t});
      if(t===1){boss.pathState='P2_LASER';boss.headLaserCooldown=1.5;beginChainFrontBob(boss);}
    } else if(phase==='P2_LASER') {
      if(!Number.isFinite(boss.frontBobPhase))beginChainFrontBob(boss);
      boss.frontBobPhase+=dt*85/150;
      placeChainFrontHead(boss,{x:boss.frontAnchor.x,y:boss.frontBobCenterY+150*Math.sin(boss.frontBobPhase)});head.angle=Math.PI;
    }
    boss.x=head.x;boss.y=head.y;boss.rotation=head.angle+Math.PI/2;
    return !boss.entering;
  }

  function chainLocal(part,x,y) {
    const r=part.angle+Math.PI/2;
    return {x:part.x+(x*Math.cos(r)-y*Math.sin(r))*3,
      y:part.y+(x*Math.sin(r)+y*Math.cos(r))*3};
  }

  function getChainBladeCapsules(boss,visibleOnly=false) {
    const blades=[];
    for(let i=2;i<boss.segments.length;i+=2) {
      const part=boss.segments[i],extension=18+2*Math.sin(boss.age*5+i*0.7);
      if(visibleOnly&&(part.x<-100||part.x>CONFIG.CANVAS_WIDTH+100||part.y<-100||part.y>CONFIG.CANVAS_HEIGHT+100))continue;
      for(const side of [-1,1])blades.push({a:chainLocal(part,side*(extension-10),0),
        b:chainLocal(part,side*(extension+10),0),radius:4});
    }
    for(const pose of getChainSawPoses(boss)) {
      const dx=Math.sin(pose.rotation)*16,dy=-Math.cos(pose.rotation)*16;
      blades.push({a:{x:pose.x-dx,y:pose.y-dy},b:{x:pose.x+dx,y:pose.y+dy},radius:5});
    }
    return blades;
  }

  function getChainSawPoses(boss) {
    const head=boss.segments[0];
    return [-1,1].map(side=>{
      const sway=Math.sin(boss.age*8+side*0.6),p=chainLocal(head,side*4+2.5*sway,-17);
      return {...p,rotation:head.angle+Math.PI/2+0.28*sway,side};
    });
  }

  function fireChainLaser(boss,index=0) {
    const part=boss.segments[index],isHead=index===0;
    const origin=isHead?chainLocal(part,0,-22):part;
    const angle=!isHead && state.player?Math.atan2(state.player.y-origin.y,state.player.x-origin.x):part.angle;
    const beam=spawnLaserBeam({kind:isHead?'CHAIN_HEAD':'CHAIN_CURRENT',color:'Red',
      ox:origin.x,oy:origin.y,angle,length:2200,scale:1,widthMultiplier:2/3,
      damage:1,stunDuration:isHead?0:0.3,stage1Time:isHead?0.7:1.0,stage2Time:0.4,stage3Time:isHead?0.6:0.65,
      updateFn:beam=>{
        const p=isHead?chainLocal(part,0,-22):part;
        beam.ox=p.x;beam.oy=p.y;
        if(isHead)beam.angle=part.angle;
      }});
    beam.chainOwnerId=boss.id;beam.chainSegmentIndex=index;return beam;
  }

  function updateChainBoss(boss,dt) {
    if(boss.combat && boss.hp>0 && boss.hp<=boss.maxHp*0.3)beginChainPhase2(boss);
    const canAttack=updateChainMotion(boss,dt),phase2=boss.phase2Triggered;
    const visible=part=>part.x>=0&&part.x<=CONFIG.CANVAS_WIDTH&&part.y>=0&&part.y<=CONFIG.CANVAS_HEIGHT;
    for(let i=1;i<boss.segments.length;i+=2) {
      const part=boss.segments[i];if(!canAttack)continue;part.fireCooldown-=dt;
      if(phase2)continue;
      if(part.fireCooldown<=0) {
        part.fireCooldown+=(boss.combat?4.8:7.2)+i*0.025;
        if(state.enemyBullets.length>=(boss.combat?32:16))continue;
        for(const side of [-1,1]) {
          const m=chainLocal(part,side*10,0),angle=part.angle+Math.PI/2+(side<0?Math.PI:0);
          spawnEnemyBullet(m.x,m.y,Math.cos(angle)*220,Math.sin(angle)*220,'Orb','Red');
        }
      }
    }
    if(phase2&&canAttack) {
      boss.p2BulletGap=Math.max(0,(boss.p2BulletGap||0)-dt);
      boss.p2BodyLaserGap=Math.max(0,(boss.p2BodyLaserGap||0)-dt);
      if(boss.p2BulletGap<=0 && state.enemyBullets.length<=6) {
        const gun=boss.segments.slice(1).filter((p,n)=>p.kind==='GUN'&&visible(p)&&isChainCorridorPart(boss,p,n+1)&&p.fireCooldown<=0).sort((a,b)=>a.fireCooldown-b.fireCooldown)[0];
        if(gun) {
          for(const side of [-1,1]) {const m=chainLocal(gun,side*10,0),angle=gun.angle+Math.PI/2+(side<0?Math.PI:0);spawnEnemyBullet(m.x,m.y,Math.cos(angle)*220,Math.sin(angle)*220,'Orb','Red');}
          gun.fireCooldown=16+Math.random()*8;boss.p2BulletGap=1.8+Math.random()*0.8;
        }
      }
    }
    const headCanAttack=canAttack && (!phase2 || boss.pathState==='P2_LASER');
    if(headCanAttack)boss.headLaserCooldown-=dt;
    boss.laserStartGap=Math.max(0,boss.laserStartGap-dt);
    const nextGap=()=>1.3+Math.random()*0.4;
    if(headCanAttack && boss.headLaserCooldown<=0 && boss.laserStartGap<=1e-9) {
      fireChainLaser(boss,0);boss.headLaserCooldown=10;boss.laserStartGap=nextGap();
    }
    // Personal cooldowns keep running; space new charges individually, never in groups.
    for(let i=1;i<boss.segments.length;i++) {
      if(canAttack)boss.segments[i].currentCooldown-=dt;
    }
    if(canAttack && (!phase2||boss.p2BodyLaserGap<=0) && boss.laserStartGap<=1e-9) {
      let ready=-1;
      for(let i=1;i<boss.segments.length;i++)if((!phase2||(visible(boss.segments[i])&&isChainCorridorPart(boss,boss.segments[i],i))) && boss.segments[i].currentCooldown<=0 &&
          (ready<0 || boss.segments[i].currentCooldown<boss.segments[ready].currentCooldown))ready=i;
      if(ready>=0) {
        const part=boss.segments[ready];fireChainLaser(boss,ready);
        part.currentCooldown=boss.combat?part.currentBossInterval:part.currentWaveInterval;
        if(phase2)boss.p2BodyLaserGap=3.2+Math.random()*1.6;
        boss.laserStartGap=nextGap();
      }
    }
    const p=state.player;
    if(p) {
      const bladeHit=getChainBladeCapsules(boss,true).some(blade=>distSqPointToSegment(p.x,p.y,blade.a.x,blade.a.y,blade.b.x,blade.b.y)<(blade.radius+p.hitboxRadius)**2);
      if(bladeHit)damagePlayer(2,'CHAIN BLADE');
      else if(boss.segments.some(part=>Math.hypot(p.x-part.x,p.y-part.y)<21+p.hitboxRadius) ||
          (boss.pathState==='P2_DASH' && distSqPointToSegment(p.x,p.y,boss.prevX,boss.prevY,boss.x,boss.y)<(21+p.hitboxRadius)**2))damagePlayer(1,'CHAIN BODY');
    }
  }

  function renderChainBoss(boss) {
    const crop=(path,source,x,y,angle)=>{
      const im=assets.images.get(`bosses/Chain_Boss/${path}.png`);if(!im)return;
      ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(im,...source,-source[2]*1.5,-source[3]*1.5,source[2]*3,source[3]*3);ctx.restore();
    };
    // Mechanical spine is drawn behind the original sprites, with no gaps at bends.
    ctx.save();ctx.lineWidth=9;ctx.strokeStyle='#263238';ctx.beginPath();
    boss.segments.forEach((p,i)=>{
      const previous=i?boss.segments[i-1]:null;
      if(previous&&Math.hypot(p.x-previous.x,p.y-previous.y)<70){ctx.moveTo(previous.x,previous.y);ctx.lineTo(p.x,p.y);}
    });ctx.stroke();ctx.restore();
    for(let i=boss.segments.length-1;i>=0;i--) {
      const part=boss.segments[i],rotation=part.angle+Math.PI/2;
      if(part.x<-100||part.x>CONFIG.CANVAS_WIDTH+100||part.y<-100||part.y>CONFIG.CANVAS_HEIGHT+100)continue;
      if(part.kind==='HEAD') {
        for(const pose of getChainSawPoses(boss)) {
          crop('Head_And_Saws',pose.side<0?[8,0,8,14]:[16,0,8,14],pose.x,pose.y,pose.rotation);
        }
        crop('Head_And_Saws',[8,16,16,16],part.x,part.y,rotation);
      } else {
        if(part.kind==='BLADE')for(const side of [-1,1]) {
          const p=chainLocal(part,side*(18+2*Math.sin(boss.age*5+i*0.7)),0);
          // The source contains TWO separate knives: use one half on each side.
          crop('Blade',side<0?[8,3,8,24]:[17,3,8,24],p.x,p.y,rotation+side*Math.PI/2);
        }
        crop(part.kind==='GUN'?'Body_Gun':'Body_Blade',[4,8,24,16],part.x,part.y,rotation);
      }
    }
    if(boss.pathState==='P2_AIM') {
      const h=boss.segments[0],length=2200;
      ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.angle);
      ctx.fillStyle=boss.rushAimLocked?'rgba(255,45,70,0.32)':'rgba(255,65,85,0.17)';ctx.fillRect(0,-35,length,70);
      ctx.strokeStyle='#ff6279';ctx.lineWidth=2;ctx.strokeRect(0,-35,length,70);ctx.fillStyle='#ffc3ca';ctx.fillRect(0,-1,length,2);ctx.restore();
      ctx.save();ctx.strokeStyle='#ff667c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,h.y,40-12*Math.min(1,boss.rushTimer/1.6),0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if(boss.phase2Triggered) {
      ctx.save();ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillStyle=boss.entering?'#ffbd76':'#e8c6d0';
      ctx.fillText(boss.entering?'2페이즈 전환 중 · 무적':'탄환은 몸통 관통 · 약점은 머리',CONFIG.CANVAS_WIDTH/2,138);ctx.restore();
    }
  }

  function previewChainCorridors(boss) {
    const p=state.player;p.invulnTimer=1e6;p.fireCooldown=1e6;
    try {for(let t=0;t<150&&boss.pathState!=='P2_LASER';t+=0.04)updateGame(0.04);}
    finally {p.hp=p.maxHp;p.invulnTimer=0;p.hitFlashTimer=0;p.fireCooldown=0.15;state.debugInvincible=false;}
    const blades=getChainBladeCapsules(boss,true);
    outer:for(let x=100;x<CONFIG.CANVAS_WIDTH-100;x+=60)for(let y=100;y<CONFIG.CANVAS_HEIGHT-70;y+=45) {
      if(boss.segments.some(part=>Math.hypot(x-part.x,y-part.y)<42))continue;
      if(blades.some(blade=>distSqPointToSegment(x,y,blade.a.x,blade.a.y,blade.b.x,blade.b.y)<(blade.radius+p.hitboxRadius+10)**2))continue;
      if(state.lasers.some(beam=>checkLaserHitsPlayer({...beam,stage:3},{x,y,hitboxRadius:p.hitboxRadius+10})))continue;
      if(state.enemyBullets.some(b=>Math.hypot(b.x-x,b.y-y)<30))continue;
      p.x=p.prevX=x;p.y=p.prevY=y;break outer;
    }
  }

  function startTierBoss(tier) {
    if(tier===11)return startChainBoss({combat:true,campaign:true});
    state.phase = 'BOSS';
    state.electricVolleys = [];
    state.electricSweeps = [];
    state.empWaves = [];
    // Clear previous special hazards and tell remaining wave enemies to retreat
    state.lasers = [];
    state.missiles = [];
    state.globalBlastWaves = [];
    state.afterimages = [];
    state.explosions = [];
    state.dashWarnings = [];
    state.dashers = [];
    state.escorts = [];
    state.enemies = state.enemies.filter(e => !e.deathHandled && !e.isTier8Phase2Raider);
    for (const e of state.enemies) {
      e.retreating = true;
      e.entering = false;
    }

    // Tier 04 uses separated Boss_Body.png so rear fighters are not duplicated on the hull
    const relPath = tier === 4
      ? 'bosses/Tier_04/Boss_Body.png'
      : `enemies/Tier_${String(tier).padStart(2,'0')}/Boss.png`;
    const spec = SPRITE_SPECS[relPath];
    const maxHp = tier === 10 ? 2300 : tier === 9 ? 9500 : BOSS_HP_TABLE[tier] || (600 + tier * 500);

    const boss = {
      id: `tier-boss-${tier}-${Math.random().toString(36).slice(2)}`,
      kind: 'TIER_BOSS',
      tier,
      barId: `Tier_${String(tier).padStart(2,'0')}`,
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
      rotation: -Math.PI / 2,
      // Continuous movement phase variables so speed adjustments never cause position jumps
      phaseX: 0.0,
      phaseY: 0.0,
      moveSpeedFactor: 1.0,
      attackTimer: 1.15,
      patternStep: 0,
      hitFlash: 0.0,

      // Phase 2 common flags (Tiers 5~8)
      phase2Triggered: false,
      phase2Active: false,

      // Tier 04 Escort respawn tracker
      t4EscortRespawnTimers: [],

      // Tier 05 High-Speed Horizontal Forward Dash & Phase 2 Omnidirectional 5-Dash state machine
      dashState: 'NORMAL', // 'NORMAL' | 'WARN' | 'DASH' | 'OFFSCREEN' | 'RETURN' | 'P2_WARN' | 'P2_DASH' | 'P2_WAIT' | 'P2_RETURN'
      dashCooldown: 4.0,
      dashTimer: 0.0,
      dashStartX: 0,
      dashY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      dashVx: -1320,
      dashVy: 0,
      dashSideShotTimer: 0.0,
      p2TotalDashes: CONFIG.TIER5_P2_DASH_COUNT,
      p2DashesCompleted: 0,
      p2DirQueue: [],
      p2DirKey: 'R_TO_L',
      p2DashAngle: Math.PI,
      p2WarnStartX: 0,
      p2WarnStartY: 0,
      p2WarnEndX: 0,
      p2WarnEndY: 0,
      p2EnteredScreen: false,
      p2DashElapsed: 0,

      // Tier 06 4-Wing Missile Salvo & Phase 2 Full-Map Explosion state machine
      missileState: 'LOAD',
      missileStateTimer: 0.75,
      missileVolleyIndex: 0,
      salvoTargets: [],
      salvoFiredCount: 0,
      salvoShotTimer: 0.0,
      p2ExplosionCooldown: CONFIG.TIER6_P2_EXPLOSION_INTERVAL,

      // Tier 07 & Tier 08 Laser, Dasher & Phase 2 state machine
      laserCycleCount: 0,
      laserVariant: 0,
      laserMode: 'IDLE', // 'IDLE' | 'PRIMARY' | 'ULTIMATE'
      laserModeTimer: 0.95,
      ultCorridorY: Math.round(CONFIG.CANVAS_HEIGHT / 2),
      ultSweepDir: 1,
      dasherSpawnTimer: 0.85,
      dasherWaveCount: 0,
      dasherDirQueue: [],
      p2BlinkCount: 0,
      p2ActiveBeamId: null,
      p2Cooldown: 0.0,
      p2TotalWaves: CONFIG.TIER8_P2_WAVE_COUNT,
      p2WavesFired: 0,
      p2WaveTimer: 0.0,
      p2LastSafeLane: -1,
      p2CurrentSafeLane: -1
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
        path: 'bullets/Colors/Cyan/Needle.png',
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
          path: 'bullets/Colors/Cyan/Needle.png',
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
          path: 'bullets/Colors/Cyan/Needle.png',
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
          path: 'bullets/Colors/Cyan/Needle.png',
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
      path: `bullets/Colors/${color}/${shape === 'Needle' ? 'Needle' : 'Orb'}.png`,
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

  // Links exist only between launched orbs: one point, one line, then a closed triangle.
  function getElectricLinks(orbs) {
    const live=orbs.filter(o=>o.launched);
    if(live.length<2) return [];
    if(live.length===2) return [[live[0],live[1]]];
    return [[live[0],live[1]],[live[1],live[2]],[live[2],live[0]]];
  }

  function spawnElectricVolley(owner, isBoss = true) {
    if(isBoss && ['LASER','FIELD'].includes(owner.electricMode)) return null;
    const allPorts=getWorldMuzzles(owner.x,owner.y,owner.spec,false,owner.scale).sort((a,b)=>a.y-b.y);
    const ports=isBoss?allPorts:[allPorts[0],allPorts[allPorts.length-1]];
    if(ports.length!==(isBoss?3:2)) return null;
    const sides=Math.random()<0.5?[0,2]:[2,0];
    const order=isBoss?(Math.random()<0.5?[1,...sides]:[...sides,1]):(Math.random()<0.5?[0,1]:[1,0]);
    const volley={owner,age:0,warning:0.65,active:false,isBoss,order,
      radius:isBoss?12:9,linkRadius:isBoss?5:3,damage:1,stunDuration:0.3,
      orbs:ports.map((m,i)=>{
        // Independent random draw on every shot. Bounded speeds keep the triangle readable.
        const speed=isBoss?215+Math.random()*70:190+Math.random()*65;
        const lane=isBoss?i-1:(i===0?-1:1);
        const vy=lane===0?(Math.random()-0.5)*16:lane*(isBoss?45+Math.random()*12:30+Math.random()*10);
        return {x:m.x,y:m.y,prevX:m.x,prevY:m.y,speed,
          vx:-Math.sqrt(speed*speed-vy*vy),vy,
          launched:false,chargeDuration:0.5,launchDelay:order.indexOf(i)*(isBoss?0.70:0.60)};
      })};
    state.electricVolleys.push(volley);
    return volley;
  }

  function updateElectricVolleys(dt) {
    const p=state.player;
    for(let i=state.electricVolleys.length-1;i>=0;i--) {
      const v=state.electricVolleys[i];
      if(!v.active) {
        if(v.owner.hp<=0 || v.owner.retreating ||
          (v.isBoss?state.boss!==v.owner:!state.enemies.includes(v.owner))) {
          state.electricVolleys.splice(i,1);continue;
        }
        const allPorts=getWorldMuzzles(v.owner.x,v.owner.y,v.owner.spec,false,v.owner.scale).sort((a,b)=>a.y-b.y);
        const ports=v.isBoss?allPorts:[allPorts[0],allPorts[allPorts.length-1]];
        v.orbs.forEach((o,j)=>{o.x=o.prevX=ports[j].x;o.y=o.prevY=ports[j].y;});
        v.warning-=dt;
        if(v.warning<=0) {v.active=true;triggerCameraShake(0.10,1.5);}
        continue;
      }
      v.age+=dt;
      const allPorts=getWorldMuzzles(v.owner.x,v.owner.y,v.owner.spec,false,v.owner.scale).sort((a,b)=>a.y-b.y);
      const ports=v.isBoss?allPorts:[allPorts[0],allPorts[allPorts.length-1]];
      v.orbs.forEach((o,j)=>{
        let moveTime=dt;
        if(!o.launched) {
          if(o.cancelled || v.owner.hp<=0 || v.owner.retreating ||
            (v.isBoss?state.boss!==v.owner:!state.enemies.includes(v.owner))) {o.cancelled=true;return;}
          o.x=o.prevX=ports[j].x;o.y=o.prevY=ports[j].y;
          if(v.age<o.launchDelay) return;
          o.launched=true;moveTime=Math.min(dt,Math.max(0,v.age-o.launchDelay));
        }
        o.prevX=o.x;o.prevY=o.y;o.x+=o.vx*moveTime;o.y+=o.vy*moveTime;
      });
      if(p) {
        const orbR=p.hitboxRadius+v.radius,linkR=p.hitboxRadius+v.linkRadius;
        const orbHit=v.orbs.some(o=>o.launched&&distSqPointToSegment(p.x,p.y,o.prevX,o.prevY,o.x,o.y)<=orbR*orbR);
        const linkHit=getElectricLinks(v.orbs).some(([a,b])=>distSqPointToSegment(p.x,p.y,a.x,a.y,b.x,b.y)<=linkR*linkR);
        if(orbHit||linkHit) damagePlayer(v.damage,'ELECTRIC',0.3,'Cyan');
      }
      if(v.age>9 || v.orbs.every(o=>o.launched&&o.x < -100)) state.electricVolleys.splice(i,1);
    }
  }

  function getElectricOrbCharge(v,o) {
    if(o.launched || o.cancelled) return null;
    const clock=v.active?v.age:-v.warning;
    const progress=(clock-(o.launchDelay-o.chargeDuration))/o.chargeDuration;
    return progress<0?null:Math.min(1,progress);
  }

  function renderElectricVolleys() {
    const sheet=assets.images.get('effects/Electric_Laser/Electric_Laser_Spritesheet.png');
    const orb=assets.images.get('bullets/Colors/Cyan/Orb.png');
    for(const v of state.electricVolleys) {
      const frame=Math.floor(v.age*12.5)%7;
      ctx.save();ctx.imageSmoothingEnabled=false;
      for(const [a,b] of getElectricLinks(v.orbs)) {
        const len=Math.hypot(b.x-a.x,b.y-a.y);
        ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));
        const height=v.isBoss?46:30;
        if(sheet) ctx.drawImage(sheet,0,frame*152,1254,152,0,-height/2,len,height);
        ctx.restore();
      }
      for(const o of v.orbs) {
        const progress=getElectricOrbCharge(v,o);
        if(o.cancelled || (!o.launched && progress===null)) continue;
        if(!o.launched) {
          ctx.strokeStyle='#79edff';ctx.lineWidth=2;ctx.beginPath();
          ctx.arc(o.x,o.y,22-14*Math.min(1,progress),0,Math.PI*2);ctx.stroke();
        }
        if(orb) {
          const scale=o.launched?v.radius/4:0.8+0.7*Math.min(1,progress);
          ctx.drawImage(orb,Math.round(o.x-8*scale),Math.round(o.y-8*scale),16*scale,16*scale);
        }
      }
      ctx.restore();
    }
  }

  function fireElectricEnemyLaser(e) {
    const owned=state.lasers.filter(b=>b.followEnemyId);
    const ports=getWorldMuzzles(e.x,e.y,e.spec,false,e.scale);
    if(owned.some(b=>b.followEnemyId===e.id) || owned.length+ports.length>CONFIG.ENEMY_SMALL_LASER_LIMIT) return false;
    ports.forEach((m,index)=>spawnLaserBeam({kind:'ELECTRIC_ENEMY',color:'Cyan',scale:1.2,widthMultiplier:0.85,
      stage1Time:2.4,stage2Time:0.75,aimLockTime:0.5,stage3Time:0.85,
      ox:m.x,oy:m.y,angle:Math.atan2(state.player.y-m.y,state.player.x-m.x),
      followEnemyId:e.id,followEnemyMuzzleIndex:index,damage:1,stunDuration:0.3,
      updateFn:(beam,dt)=>{
        const target=Math.atan2(state.player.y-beam.oy,state.player.x-beam.ox);
        const delta=Math.atan2(Math.sin(target-beam.angle),Math.cos(target-beam.angle));
        const maxTurn=0.20*dt;
        beam.angle+=Math.max(-maxTurn,Math.min(maxTurn,delta));
      }}));
    return true;
  }

  function getElectricBossLaserMuzzles(boss) {
    const spec={...boss.spec,muzzles:[...boss.spec.muzzles,...boss.spec.laserMuzzles]};
    return getWorldMuzzles(boss.x,boss.y,spec,false,boss.scale);
  }

  function startElectricBossLasers(boss) {
    if(!boss || boss.tier!==9 || ['LASER','FIELD'].includes(boss.electricMode)) return false;
    state.electricVolleys=state.electricVolleys.filter(v=>v.owner!==boss);
    boss.electricMode='LASER';
    boss.electricFlashTimer=0;
    const ports=getElectricBossLaserMuzzles(boss);
    const aim=Math.atan2(state.player.y-boss.y,state.player.x-boss.x);
    const indices=[3,0,1,2,4];
    for(let i=0;i<5;i++) {
      const offset=(2-i)*0.26,index=indices[i],m=ports[index];
      const beam=spawnLaserBeam({kind:'ELECTRIC_BOSS',color:'Cyan',scale:1.2,
        ox:m.x,oy:m.y,angle:aim+offset,followBossMuzzleIndex:index,
        stage1Time:2.4,stage2Time:0.75,aimLockTime:0.5,stage3Time:5,
        damage:1,stunDuration:0.3,shakeOnStage3:i===0,
        updateFn:(b,dt)=>{
          const target=Math.atan2(state.player.y-boss.y,state.player.x-boss.x)+offset;
          const delta=Math.atan2(Math.sin(target-b.angle),Math.cos(target-b.angle));
          const turn=0.035*dt;
          b.angle+=Math.max(-turn,Math.min(turn,delta));
        }});
      beam.electricBossId=boss.id;
      beam.electricLeader=i===0;
    }
    return true;
  }

  function startElectricBossField(boss) {
    state.electricVolleys=state.electricVolleys.filter(v=>v.owner!==boss);
    state.lasers=state.lasers.filter(b=>b.electricBossId!==boss.id);
    boss.electricMode='FIELD';boss.phase2Active=true;
    const W=CONFIG.CANVAS_WIDTH,H=CONFIG.CANVAS_HEIGHT;
    const perimeter=[[12,12],[W/2,12],[W-12,12],[W-12,H/2],
      [W-12,H-12],[W/2,H-12],[12,H-12],[12,H/2]];
    const nodes=perimeter.map(([tx,ty])=>({tx,ty,perimeter:true}));
    for(let i=0;i<7;i++) {
      let tx,ty;
      for(let attempt=0;attempt<40;attempt++) {
        tx=W*(0.18+Math.random()*0.64);ty=H*(0.18+Math.random()*0.64);
        if(nodes.every(n=>Math.hypot(n.tx-tx,n.ty-ty)>=90)) break;
      }
      nodes.push({tx,ty,perimeter:false});
    }
    for(let i=nodes.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[nodes[i],nodes[j]]=[nodes[j],nodes[i]];}
    nodes.forEach((n,i)=>Object.assign(n,{x:boss.x,y:boss.y,launchTime:i*0.08,
      flightTime:0.95+Math.random()*0.2,launched:false,arrived:false,port:i%3}));
    const distance=(a,b)=>Math.hypot(nodes[a].tx-nodes[b].tx,nodes[a].ty-nodes[b].ty);
    const route=[0],remaining=new Set(nodes.map((_,i)=>i).slice(1));
    while(remaining.size) {
      const last=route[route.length-1];let next=-1,best=Infinity;
      for(const i of remaining) if(distance(last,i)<best) {next=i;best=distance(last,i);}
      route.push(next);remaining.delete(next);
    }
    const edges=[],degree=nodes.map(()=>0),linked=new Set();
    const addEdge=(a,b)=>{edges.push([a,b]);degree[a]++;degree[b]++;linked.add(`${Math.min(a,b)},${Math.max(a,b)}`);};
    // A closed backbone guarantees that the entire field stays connected.
    route.forEach((n,i)=>addEdge(n,route[(i+1)%route.length]));
    const candidates=[];
    for(let a=0;a<nodes.length;a++) for(let b=a+1;b<nodes.length;b++) {
      if(!linked.has(`${a},${b}`)) candidates.push({a,b,score:distance(a,b)*(0.7+Math.random()*0.6)});
    }
    candidates.sort((a,b)=>a.score-b.score);
    for(const {a,b} of candidates) if(degree[a]<5&&degree[b]<5) addEdge(a,b);
    boss.electricField={nodes,edges,age:0,stage:'DEPLOY',timer:0};
  }

  function updateElectricBossField(boss,dt) {
    const f=boss.electricField;if(!f) return;
    f.age+=dt;
    if(f.stage==='DEPLOY') {
      const ports=getWorldMuzzles(boss.x,boss.y,boss.spec,false,boss.scale);
      for(const n of f.nodes) {
        if(f.age<n.launchTime) continue;
        if(!n.launched) {const m=ports[n.port];n.sx=m.x;n.sy=m.y;n.launched=true;}
        const t=Math.min(1,(f.age-n.launchTime)/n.flightTime),ease=1-Math.pow(1-t,3);
        n.x=n.sx+(n.tx-n.sx)*ease;n.y=n.sy+(n.ty-n.sy)*ease;n.arrived=t===1;
      }
      if(f.nodes.every(n=>n.arrived)) {f.stage='WARNING';f.timer=1.4;}
    } else if(f.stage==='WARNING') {
      f.timer-=dt;
      if(f.timer<=0) {
        f.stage='ACTIVE';f.timer=6;boss.electricFlashTimer=0.20;triggerCameraShake(0.28,5);
      }
    } else {
      f.timer-=dt;
      if(f.timer<=0) {
        boss.electricField=null;boss.electricMode='TRIANGLE';boss.phase2Active=false;
        boss.electricFieldCooldown=20;boss.electricVolleyCount=0;boss.attackTimer=1.5;return;
      }
      const p=state.player,r=p.hitboxRadius+5;
      if(f.edges.some(([i,j])=>{const a=f.nodes[i],b=f.nodes[j];return distSqPointToSegment(p.x,p.y,a.x,a.y,b.x,b.y)<=r*r;})) {
        damagePlayer(1,'ELECTRIC NET',0.3,'Cyan');
      }
    }
  }

  function renderElectricBossField() {
    const f=state.boss?.electricField;if(!f) return;
    const sheet=assets.images.get('effects/Electric_Laser/Electric_Laser_Spritesheet.png');
    const orb=assets.images.get('bullets/Colors/Cyan/Orb.png');
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(f.stage!=='DEPLOY') for(const [i,j] of f.edges) {
      const a=f.nodes[i],b=f.nodes[j],length=Math.hypot(b.x-a.x,b.y-a.y);
      ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));
      if(f.stage==='WARNING') {
        ctx.fillStyle='rgba(255,90,120,0.18)';ctx.fillRect(0,-5,length,10);
        ctx.strokeStyle='#ff92b4';ctx.lineWidth=1;ctx.strokeRect(0,-5,length,10);
      } else if(sheet) ctx.drawImage(sheet,0,Math.floor(f.age*12.5)%7*152,1254,152,0,-23,length,46);
      ctx.restore();
    }
    for(const n of f.nodes) {
      if(f.stage==='DEPLOY'&&!n.arrived) {
        ctx.strokeStyle='rgba(105,232,255,0.35)';ctx.strokeRect(n.tx-8,n.ty-8,16,16);
      }
      if(n.launched&&orb) ctx.drawImage(orb,Math.round(n.x-24),Math.round(n.y-24),48,48);
    }
    ctx.restore();
  }

  function spawnElectricSweep(boss, color = Math.random()<0.5?'Blue':'Red') {
    const direction=Math.random()<0.5?1:-1;
    const x=direction===1?-140:CONFIG.CANVAS_WIDTH+140;
    const sweep={ownerId:boss.id,color,direction,delay:0,warning:0.75,active:false,age:0,
      x,prevX:x,tilt:0,speed:direction*(700+Math.random()*100),hitPlayer:false,flashTimer:0};
    state.electricSweeps.push(sweep);return sweep;
  }

  function updateElectricSweepScheduler(boss,dt) {
    if(!boss.electricSweepsUnlocked) {
      if(boss.hp>boss.maxHp*0.60) return;
      boss.electricSweepsUnlocked=true;
    }
    if(!boss.electricSweepCooldowns) {
      boss.electricSweepCooldowns={Blue:6+Math.random()*2,Red:6+Math.random()*2};return;
    }
    boss.electricSweepSpacing=Math.max(0,(boss.electricSweepSpacing || 0)-dt);
    for(const color of ['Blue','Red']) boss.electricSweepCooldowns[color]-=dt;
    if(boss.electricSweepSpacing>0) return;
    const ready=['Blue','Red'].filter(color=>boss.electricSweepCooldowns[color]<=0)
      .sort((a,b)=>boss.electricSweepCooldowns[a]-boss.electricSweepCooldowns[b]);
    if(ready.length) {
      const color=ready[0];
      spawnElectricSweep(boss,color);
      boss.electricSweepCooldowns[color]=6+Math.random()*2;
      boss.electricSweepSpacing=3+Math.random();
    }
  }

  function updateElectricSweeps(dt) {
    const p=state.player;
    for(let i=state.electricSweeps.length-1;i>=0;i--) {
      const s=state.electricSweeps[i];
      if(!state.boss || state.boss.id!==s.ownerId || state.boss.hp<=0) {state.electricSweeps.splice(i,1);continue;}
      if(s.delay>0) {s.delay=Math.max(0,s.delay-dt);continue;}
      s.age+=dt;s.flashTimer=Math.max(0,(s.flashTimer || 0)-dt);
      if(!s.active) {
        s.warning-=dt;
        if(s.warning<=0) {s.active=true;s.flashTimer=0.20;triggerCameraShake(0.35,5.5);}
        continue;
      }
      s.prevX=s.x;s.x+=s.speed*dt;
      if(p&&!s.hitPlayer) {
        const oldX=p.prevX ?? p.x,oldY=p.prevY ?? p.y;
        const before=oldX-s.prevX,now=p.x-s.x;
        const radius=p.hitboxRadius+5;
        const contact=before*now<=0 || Math.min(Math.abs(before),Math.abs(now))<=radius;
        // Use actual displacement: opposite keys, pushing into a wall, or stun do not count as moving.
        const moving=Math.hypot(p.x-oldX,p.y-oldY)>0.01;
        const unsafe=s.color==='Blue'?moving:!moving;
        if(contact&&unsafe) {
          s.hitPlayer=damagePlayer(1,s.color==='Blue'?'BLUE: STOP':'RED: MOVE',0.3,s.color);
        }
      }
      if((s.speed>0&&s.x>CONFIG.CANVAS_WIDTH+80)||(s.speed<0&&s.x< -80)) state.electricSweeps.splice(i,1);
    }
  }

  function renderElectricSweeps() {
    const H=CONFIG.CANVAS_HEIGHT;
    for(const s of state.electricSweeps) {
      if(s.delay>0) continue;
      const color=s.color==='Blue'?'#6398ff':'#ff4b65';
      ctx.save();ctx.imageSmoothingEnabled=false;
      if(!s.active) {
        ctx.save();
        if(s.direction<0) {ctx.translate(CONFIG.CANVAS_WIDTH,0);ctx.scale(-1,1);}
        ctx.fillStyle=color;ctx.globalAlpha=0.35+0.35*(1-s.warning/0.75);
        ctx.fillRect(0,0,7,H);
        for(let y=110;y<H;y+=110) {
          ctx.beginPath();ctx.moveTo(12,y-8);ctx.lineTo(25,y);ctx.lineTo(12,y+8);ctx.fill();
        }
        ctx.restore();
      } else {
        const img=assets.images.get(`effects/Electric_Laser/Electric_Laser_${s.color}_Spritesheet.png`);
        const length=H,frame=Math.floor(s.age*12.5)%7;
        ctx.save();ctx.translate(s.x,0);ctx.rotate(Math.PI/2);
        if(img) {
          const width=img.naturalWidth || 1362,height=(img.naturalHeight || 1155)/7;
          ctx.drawImage(img,0,frame*height,width,height,0,-27,length,54);
        }
        ctx.restore();
      }
      if(s.flashTimer>0) {
        ctx.save();ctx.globalAlpha=0.14*s.flashTimer/0.20;ctx.fillStyle=color;
        ctx.fillRect(0,0,CONFIG.CANVAS_WIDTH,H);ctx.restore();
      }
      ctx.fillStyle='rgba(4,10,25,0.85)';ctx.fillRect(18,72+(s.color==='Blue'?0:30),178,26);
      ctx.globalAlpha=1;ctx.fillStyle=color;ctx.font='bold 16px sans-serif';
      ctx.fillText(s.color==='Blue'?'파란 전기: 멈추기':'빨간 전기: 움직이기',26,91+(s.color==='Blue'?0:30));
      ctx.restore();
    }
  }

  function firePurpleCoreCurrent(owner,isBoss=false) {
    if(state.lasers.some(l=>isBoss?l.kind==='EMP_CURRENT'&&l.followBossMuzzleIndex!==null:l.followEnemyId===owner.id)) return false;
    if(!isBoss&&state.lasers.filter(l=>l.kind==='EMP_CURRENT'&&l.followEnemyId).length>=4) return false;
    const m=getWorldMuzzles(owner.x,owner.y,owner.spec,false,owner.scale)[0];
    spawnLaserBeam({kind:'EMP_CURRENT',color:'Violet',empLarge:isBoss,
      ox:m.x,oy:m.y,angle:Math.atan2(state.player.y-m.y,state.player.x-m.x),
      followBossMuzzleIndex:isBoss?0:null,followEnemyId:isBoss?null:owner.id,
      stage1Time:isBoss?1.15:0.85,stage2Time:0.7,aimLockTime:0.5,stage3Time:isBoss?1.5:0.65,
      damage:1,stunDuration:0,
      updateFn:(l)=>{if(l.stage<3) l.angle=Math.atan2(state.player.y-l.oy,state.player.x-l.ox);}});
    return true;
  }

  function applyEmpScramble() {
    const p=state.player;
    if(!p||p.hp<=0||state.mode!=='PLAYING'||p.skills.shield.remaining>0||state.debugInvincible) return false;
    let map;
    for(let attempt=0;attempt<32;attempt++) {
      map=[0,1,2,3];
      for(let i=3;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[map[i],map[j]]=[map[j],map[i]];}
      if(map.every((v,i)=>v!==i)) break;
    }
    if(map.some((v,i)=>v===i)) map=[1,2,3,0];
    p.empMap=map;p.empRemaining=8;
    state.floatingTexts.push({text:'EMP · 이동키 교란!',x:p.x,y:p.y-45,color:'#d39bff',timer:1.5});
    return true;
  }

  function emitEmpWave(boss) {
    const m=getWorldMuzzles(boss.x,boss.y,boss.spec,false,boss.scale)[0];
    state.empWaves.push({ownerId:boss.id,x:m.x,y:m.y,radius:0,previousRadius:0,speed:1100,hitPlayer:false});
    boss.empFlashTimer=0.25;triggerCameraShake(0.4,7);
  }

  function updateEmpWaves(dt) {
    const p=state.player;
    for(let i=state.empWaves.length-1;i>=0;i--) {
      const w=state.empWaves[i];
      if(state.boss?.id!==w.ownerId) {state.empWaves.splice(i,1);continue;}
      w.previousRadius=w.radius;w.radius+=w.speed*dt;
      if(p&&!w.hitPlayer) {
        const before=Math.hypot((p.prevX??p.x)-w.x,(p.prevY??p.y)-w.y)-w.previousRadius;
        const now=Math.hypot(p.x-w.x,p.y-w.y)-w.radius;
        if(before*now<=0 || Math.min(Math.abs(before),Math.abs(now))<=p.hitboxRadius+8) {
          w.hitPlayer=true;applyEmpScramble();
        }
      }
      if(w.radius>Math.hypot(CONFIG.CANVAS_WIDTH,CONFIG.CANVAS_HEIGHT)+100) state.empWaves.splice(i,1);
    }
  }

  function renderEmpWaves() {
    for(const w of state.empWaves) {
      ctx.save();
      for(let i=0;i<3;i++) {
        const radius=w.radius-i*24;if(radius<=0) continue;
        ctx.strokeStyle=i===0?'#efc8ff':'#a95aff';ctx.globalAlpha=(1-i*0.25)*Math.max(0.15,1-w.radius/1700);
        ctx.lineWidth=i===0?6:3;ctx.beginPath();ctx.arc(w.x,w.y,radius,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
    }
  }

  function renderEmpScreenEffect() {
    const p=state.player,W=CONFIG.CANVAS_WIDTH,H=CONFIG.CANVAS_HEIGHT;
    const flash=state.boss?.empFlashTimer || 0;
    if(flash>0) {ctx.save();ctx.fillStyle=`rgba(191,100,255,${0.23*flash/0.25})`;ctx.fillRect(0,0,W,H);ctx.restore();}
    if(!p||p.empRemaining<=0) return;
    ctx.save();ctx.fillStyle='rgba(112,32,175,0.12)';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(187,95,255,0.8)';ctx.lineWidth=8;ctx.strokeRect(4,4,W-8,H-8);
    ctx.fillStyle='rgba(141,70,207,0.07)';
    for(let y=0;y<H;y+=24) ctx.fillRect(0,y,W,2);
    ctx.fillStyle='#edcdff';ctx.font='bold 18px sans-serif';ctx.textAlign='center';
    ctx.fillText(`EMP 이동키 교란 · ${p.empRemaining.toFixed(1)}초`,W/2,H-58);
    const names=['왼쪽','오른쪽','위','아래'],m=p.empMap;
    ctx.font='bold 16px sans-serif';
    ctx.fillText(`W → ${names[m[2]]}   A → ${names[m[0]]}   S → ${names[m[3]]}   D → ${names[m[1]]}`,W/2,H-30);
    ctx.restore();
  }

  function fireEnemyPattern(enemy) {
    if(enemy.tier===10) {firePurpleCoreCurrent(enemy,false);return;}
    if (enemy.tier === 9) {
      // Stages 1/2 fire orbs, stage 3 a slow-tracking laser, stage 4 a linked pair.
      if (enemy.enemyIdx === 4) {
        if(state.electricVolleys.length<3) spawnElectricVolley(enemy,false);
      } else if (enemy.enemyIdx === 3) {
        fireElectricEnemyLaser(enemy);
      } else {
        for (const m of getWorldMuzzles(enemy.x,enemy.y,enemy.spec,false,enemy.scale)) {
          const a=Math.atan2(state.player.y-m.y,state.player.x-m.x);
          spawnEnemyBullet(m.x,m.y,Math.cos(a)*245,Math.sin(a)*245,'Orb','Cyan');
          const b=state.enemyBullets[state.enemyBullets.length-1];
          if (b) Object.assign(b,{scale:4,stunDuration:0.3,electrocutionColor:'Cyan'});
        }
      }
      return;
    }
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
      aimLockTime: opts.aimLockTime || 0,
      stage3Time: opts.stage3Time ?? CONFIG.LASER_STAGE3_TIME,
      ox: opts.ox,
      oy: opts.oy,
      angle: opts.angle ?? Math.PI,
      followBossMuzzleIndex: opts.followBossMuzzleIndex ?? null,
      followEscortId: opts.followEscortId ?? null,
      followEnemyId: opts.followEnemyId ?? null,
      followEnemyMuzzleIndex: opts.followEnemyMuzzleIndex ?? 0,
      empLarge: opts.empLarge===true,
      stunDuration: opts.stunDuration || 0,
      damage: opts.damage ?? CONFIG.LASER_DAMAGE,
      shakeOnStage3: opts.shakeOnStage3 === true,
      shakeTriggered: false,
      laneIndex: opts.laneIndex ?? null,
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

  function getFacingBossMuzzles(boss) {
    if (boss.tier !== 7 || !boss.phase2Triggered) {
      return getWorldMuzzles(boss.x, boss.y, boss.spec, false, boss.scale);
    }
    const rotation = boss.rotation ?? -Math.PI / 2;
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    return boss.spec.muzzles.map(m => {
      const x = (m.x - boss.spec.size[0] / 2) * boss.scale;
      const y = (m.y - boss.spec.size[1] / 2) * boss.scale;
      return { x: boss.x + x * cos - y * sin, y: boss.y + x * sin + y * cos };
    });
  }

  function syncLaserBeamOrigin(beam) {
    if (beam.followEnemyId) {
      const enemy = state.enemies.find(e => e.id === beam.followEnemyId && e.hp > 0 && !e.retreating);
      if (enemy) {
        const muzzles = getWorldMuzzles(enemy.x, enemy.y, enemy.spec, false, enemy.scale);
        const m = muzzles[beam.followEnemyMuzzleIndex || 0] || muzzles[0];
        beam.ox = m.x;
        beam.oy = m.y;
      }
      return;
    }
    if (beam.followBossMuzzleIndex !== null && state.boss) {
      const muzzles = beam.kind==='ELECTRIC_BOSS'
        ? getElectricBossLaserMuzzles(state.boss) : getFacingBossMuzzles(state.boss);
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
  // 10B. TIER 5~8 BOSS PHASE 2 & TIER 5 DASH SIDE-BULLET MECHANICS
  // ============================================================================

  /**
   * Fires 1 bullet to each perpendicular side (dashAngle - PI/2 and dashAngle + PI/2)
   * at a rapid interval during both Phase 1 horizontal dash and Phase 2 omnidirectional dashes.
   */
  function fireTier5DashSideBullets(boss, dashAngle = Math.PI) {
    const sideSpeed = CONFIG.TIER5_DASH_SIDE_SPEED;
    for (const side of [-1, 1]) {
      const perpAngle = dashAngle + side * (Math.PI / 2);
      const cosA = Math.cos(perpAngle);
      const sinA = Math.sin(perpAngle);
      const vx = Math.abs(cosA) < 1e-9 ? 0 : cosA * sideSpeed;
      const vy = Math.abs(sinA) < 1e-9 ? 0 : sinA * sideSpeed;
      spawnEnemyBullet(boss.x, boss.y, vx, vy, 'Diamond', 'Orange');
    }
  }

  /**
   * Checks whether an active Tier 5~8 boss has reached its Phase 2 HP threshold
   * and triggers Phase 2 at most once per boss instance (never if boss.hp <= 0).
   */
  function checkAndTriggerBossPhase2(boss) {
    if (!boss || boss.kind !== 'TIER_BOSS') return false;
    if (boss.hp <= 0 || boss.defeatedHandled || boss.phase2Triggered) return false;
    const threshold = CONFIG.BOSS_PHASE2_THRESHOLDS[boss.tier];
    if (!threshold) return false;
    if (boss.hp / boss.maxHp > threshold + 1e-9) return false;

    boss.phase2Triggered = true;
    boss.phase2Active = true;
    if (boss.entering) {
      boss.entering = false;
      boss.x = boss.homeX;
      enforceRightThirdBound(boss);
    }
    state.telemetry.bossPhase2Triggered[boss.tier] =
      (state.telemetry.bossPhase2Triggered[boss.tier] || 0) + 1;

    if (boss.tier === 5) enterTier5Phase2(boss);
    else if (boss.tier === 6) enterTier6Phase2(boss);
    else if (boss.tier === 7) enterTier7Phase2(boss);
    else if (boss.tier === 8) enterTier8Phase2(boss);
    else if (boss.tier === 9) startElectricBossField(boss);
    return true;
  }

  /**
   * Tier 05 Phase 2 (<= 30% HP):
   * High-speed omnidirectional 5-dash sequence with 2.0s post-dash wait and 1-per-side rapid bullets.
   */
  function enterTier5Phase2(boss) {
    boss.phase2Active = true;
    boss.p2TotalDashes = CONFIG.TIER5_P2_DASH_COUNT;
    boss.p2DashesCompleted = 0;
    // Include horizontal, vertical, and diagonal directions across the 5 dashes
    boss.p2DirQueue = ['R_TO_L', 'T_TO_B', 'BL_TO_TR', 'B_TO_T', 'TR_TO_BL'];
    boss.exemptFromRightThird = true;

    state.floatingTexts.push({
      text: 'TIER 05 PHASE 2: OMNIDIRECTIONAL 5-DASH!',
      x: CONFIG.CANVAS_WIDTH / 2,
      y: 185,
      color: '#ff7e00',
      timer: 2.0
    });

    prepareTier5Phase2Dash(boss);
  }

  function prepareTier5Phase2Dash(boss, forcedDirKey = null) {
    if (!boss.p2DirQueue || boss.p2DirQueue.length === 0) {
      boss.p2DirQueue = [...TIER8_DASH_DIRECTIONS];
    }
    const dirKey = forcedDirKey || boss.p2DirQueue.shift() || 'R_TO_L';
    boss.p2DirKey = dirKey;
    state.telemetry.dashDirectionsUsed.add(dirKey);

    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;
    const margin = 84;
    const px = state.player ? Math.max(160, Math.min(W - 180, state.player.x)) : 320;
    const py = state.player ? Math.max(120, Math.min(H - 120, state.player.y)) : H / 2;

    let startX = W + margin;
    let startY = py;
    let targetX = px;
    let targetY = py;
    let angle = Math.PI;

    switch (dirKey) {
      case 'R_TO_L':
        startX = W + margin;
        startY = py;
        angle = Math.PI;
        break;
      case 'L_TO_R':
        startX = -margin;
        startY = py;
        angle = 0;
        break;
      case 'T_TO_B':
        startX = px;
        startY = -margin;
        angle = Math.PI / 2;
        break;
      case 'B_TO_T':
        startX = px;
        startY = H + margin;
        angle = -Math.PI / 2;
        break;
      case 'TR_TO_BL':
        startX = W + margin;
        startY = -margin + 36;
        targetX = Math.max(180, Math.min(W * 0.45, px));
        targetY = Math.max(H * 0.55, Math.min(H - 110, py));
        angle = Math.atan2(targetY - startY, targetX - startX);
        break;
      case 'BR_TO_TL':
        startX = W + margin;
        startY = H + margin - 36;
        targetX = Math.max(180, Math.min(W * 0.45, px));
        targetY = Math.max(110, Math.min(H * 0.45, py));
        angle = Math.atan2(targetY - startY, targetX - startX);
        break;
      case 'TL_TO_BR':
        startX = -margin;
        startY = -margin + 36;
        targetX = Math.max(W * 0.55, Math.min(W - 180, px + 260));
        targetY = Math.max(H * 0.55, Math.min(H - 110, py));
        angle = Math.atan2(targetY - startY, targetX - startX);
        break;
      case 'BL_TO_TR':
      default:
        startX = -margin;
        startY = H + margin - 36;
        targetX = Math.max(W * 0.55, Math.min(W - 180, px + 260));
        targetY = Math.max(110, Math.min(H * 0.45, py));
        angle = Math.atan2(targetY - startY, targetX - startX);
        break;
    }

    const speed = CONFIG.TIER5_P2_DASH_SPEED;
    const endDist = 1850;
    boss.exemptFromRightThird = true;
    boss.x = startX;
    boss.y = startY;
    boss.prevX = startX;
    boss.prevY = startY;
    boss.p2DashAngle = angle;
    boss.rotation = angle + Math.PI / 2;
    boss.p2WarnStartX = startX;
    boss.p2WarnStartY = startY;
    boss.p2WarnEndX = startX + Math.cos(angle) * endDist;
    boss.p2WarnEndY = startY + Math.sin(angle) * endDist;
    boss.dashVx = Math.cos(angle) * speed;
    boss.dashVy = Math.sin(angle) * speed;
    boss.p2EnteredScreen = false;
    boss.p2DashElapsed = 0.0;
    boss.dashState = 'P2_WARN';
    boss.dashTimer = CONFIG.TIER5_P2_WARN_TIME;
  }

  /**
   * Tier 06 Phase 2 (<= 40% HP):
   * Triggers a full-map random explosion wave immediately and every 10.0s thereafter,
   * always pre-reserving reachable safe zones before populating random blast circles.
   */
  function enterTier6Phase2(boss) {
    boss.p2ExplosionCooldown = CONFIG.TIER6_P2_EXPLOSION_INTERVAL;
    state.floatingTexts.push({
      text: 'TIER 06 PHASE 2: FULL-MAP CARPET BOMBARDMENT!',
      x: CONFIG.CANVAS_WIDTH / 2,
      y: 185,
      color: '#ff9b3d',
      timer: 2.0
    });
    startTier6BlastBurst(boss);
  }

  function startTier6BlastBurst(boss) {
    boss.p2BlastRemaining = 2;
    boss.p2BlastTimer = 1;
    triggerTier6GlobalExplosionWave(boss);
  }

  function triggerTier6GlobalExplosionWave(boss) {
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;
    const px = state.player ? state.player.x : 220;
    const py = state.player ? state.player.y : H / 2;
    const blastRadius = CONFIG.TIER6_P2_BLAST_RADIUS;
    const safeRadius = CONFIG.TIER6_P2_SAFE_RADIUS;
    const minSafeDistFromBlast = blastRadius + safeRadius + 6; // Guarantees 0 overlap inside safe zone disk

    // 1. Pre-select 3 guaranteed safe zones (Safe Zone 0 is always reachable within ~115..150px of player)
    const safeZones = [];
    const baseAngle = Math.random() * Math.PI * 2;
    for (let k = 0; k < 16; k++) {
      const ang = baseAngle + (k * Math.PI) / 8;
      const dist = 120;
      const sx = Math.round(Math.max(115, Math.min(CONFIG.ENEMY_MIN_X - 95, px + Math.cos(ang) * dist)));
      const sy = Math.round(Math.max(120, Math.min(H - 105, py + Math.sin(ang) * dist)));
      if (Math.hypot(sx - px, sy - py) >= 75 && Math.hypot(sx - px, sy - py) <= 165) {
        safeZones.push({ x: sx, y: sy, radius: safeRadius });
        break;
      }
    }
    if (safeZones.length === 0) {
      safeZones.push({
        x: Math.round(Math.max(115, Math.min(CONFIG.ENEMY_MIN_X - 95, px + (px < 420 ? 125 : -125)))),
        y: Math.round(Math.max(120, Math.min(H - 105, py))),
        radius: safeRadius
      });
    }

    // Add 2 additional well-separated safe zones across the arena
    const candidateRegions = [
      { xMin: 140, xMax: 420, yMin: 130, yMax: 320 },
      { xMin: 430, xMax: 760, yMin: 380, yMax: 610 },
      { xMin: 180, xMax: 680, yMin: 220, yMax: 540 }
    ];
    for (const reg of candidateRegions) {
      if (safeZones.length >= 3) break;
      for (let attempt = 0; attempt < 20; attempt++) {
        const sx = Math.round(reg.xMin + Math.random() * (reg.xMax - reg.xMin));
        const sy = Math.round(reg.yMin + Math.random() * (reg.yMax - reg.yMin));
        if (safeZones.every(sz => Math.hypot(sz.x - sx, sz.y - sy) >= 210)) {
          safeZones.push({ x: sx, y: sy, radius: safeRadius });
          break;
        }
      }
    }

    // 2. Populate random explosion circles across the full map while strictly respecting all safeZones
    const blasts = [];
    const sz0 = safeZones[0];
    const awayAng = Math.atan2(py - sz0.y, px - sz0.x);
    const threatX = Math.round(Math.max(85, Math.min(W - 85, sz0.x + Math.cos(awayAng) * (minSafeDistFromBlast + 8))));
    const threatY = Math.round(Math.max(95, Math.min(H - 65, sz0.y + Math.sin(awayAng) * (minSafeDistFromBlast + 8))));
    if (safeZones.every(sz => Math.hypot(threatX - sz.x, threatY - sz.y) >= minSafeDistFromBlast)) {
      blasts.push({ x: threatX, y: threatY, radius: blastRadius });
    }

    const cols = 6;
    const rows = 4;
    const cellW = (W - 160) / cols;
    const cellH = (H - 160) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        for (let attempt = 0; attempt < 10; attempt++) {
          const bx = Math.round(80 + (c + 0.15 + Math.random() * 0.7) * cellW);
          const by = Math.round(90 + (r + 0.15 + Math.random() * 0.7) * cellH);
          const clearOfSafe = safeZones.every(sz => Math.hypot(bx - sz.x, by - sz.y) >= minSafeDistFromBlast);
          const clearOfBlasts = blasts.every(b => Math.hypot(bx - b.x, by - b.y) >= 82);
          if (clearOfSafe && clearOfBlasts) {
            blasts.push({ x: bx, y: by, radius: blastRadius });
            break;
          }
        }
      }
    }

    // Pause regular 4-wing missile launch briefly so wing missiles do not invalidate safe zones
    if (boss && boss.missileState === 'LOAD') {
      boss.missileStateTimer = Math.max(boss.missileStateTimer, CONFIG.TIER6_P2_WARN_TIME + 0.35);
    }

    const wave = {
      id: Math.random().toString(36).slice(2),
      bossId: boss ? boss.id : null,
      timer: CONFIG.TIER6_P2_WARN_TIME,
      maxTimer: CONFIG.TIER6_P2_WARN_TIME,
      blastRadius,
      damage: CONFIG.MISSILE_DAMAGE,
      safeZones,
      blasts,
      circles: blasts,
      detonated: false,
      damageDealt: false
    };
    state.globalBlastWaves.push(wave);
    state.telemetry.tier6GlobalBlastWaves += 1;
    return wave;
  }

  function detonateGlobalBlastWave(wave) {
    if (!wave || wave.detonated) return;
    wave.detonated = true;
    triggerCameraShake(0.30, 7);

    for (const b of wave.blasts) {
      state.explosions.push({
        x: b.x,
        y: b.y,
        radius: b.radius,
        timer: 0.36,
        maxTimer: 0.36
      });
      spawnExplosion(b.x, b.y, '#ff9b3d', 8);
    }

    // Apply instantaneous 2 damage at most once even if multiple blast circles overlap the player
    if (!wave.damageDealt && state.player) {
      const p = state.player;
      const hitAny = wave.blasts.some(b => {
        const hitR = b.radius + p.hitboxRadius;
        const dx = p.x - b.x;
        const dy = p.y - b.y;
        return dx * dx + dy * dy <= hitR * hitR;
      });
      if (hitAny) {
        wave.damageDealt = true;
        damagePlayer(wave.damage ?? CONFIG.MISSILE_DAMAGE, 'FULL-MAP BLAST');
      }
    }
  }

  /**
   * Tier 07 Phase 2 (<= 10% HP):
   * Immediately clears all Tier 7 regular/summoned enemies and their lasers, stops all summons & normal bullets,
   * and loops: green silhouette afterimage -> blink inside right 1/3 -> rapid short-pulse aimed laser (damage: 1) + camera shake.
   */
  function enterTier7Phase2(boss) {
    state.enemies = [];
    state.enemyBullets = [];
    state.lasers = [];
    boss.laserMode = 'PHASE2_BLINK';
    boss.p2BlinkCount = 0;
    boss.p2ActiveBeamId = null;
    boss.p2Cooldown = 0.0;

    state.floatingTexts.push({
      text: 'TIER 07 PHASE 2: OVERCLOCK BLINK LASER!',
      x: CONFIG.CANVAS_WIDTH / 2,
      y: 185,
      color: '#a8ec46',
      timer: 2.0
    });

    performTier7Phase2BlinkAndLaser(boss);
  }

  function performTier7Phase2BlinkAndLaser(boss) {
    if (!boss || boss.hp <= 0) return null;

    // 1. Leave green Boss.png silhouette afterimage at departure position
    state.afterimages.push({
      path: boss.path,
      size: boss.spec.size,
      scale: boss.scale,
      x: boss.x,
      y: boss.y,
      rotation: boss.rotation ?? -Math.PI / 2,
      color: '#39ff6a',
      tintColor: '#39ff6a',
      timer: 0.55,
      maxTimer: 0.55
    });
    state.telemetry.tier7AfterimagesSpawned += 1;

    // 2. Teleport to a random valid coordinate inside the right 1/3 combat zone (X >= 856)
    const [W, H] = boss.spec.size;
    const [bx, by, bw, bh] = boss.spec.visibleBounds;
    const leftRadius = Math.max(H / 2 - by, H / 2) * boss.scale;
    const rightRadius = (by + bh - H / 2) * boss.scale;
    const topRadius = (bx + bw - W / 2) * boss.scale;
    const bottomRadius = (W / 2 - bx) * boss.scale;

    const minX = CONFIG.ENEMY_MIN_X + leftRadius + 12;
    const maxX = CONFIG.CANVAS_WIDTH - rightRadius - 18;
    const minY = 66 + topRadius;
    const maxY = CONFIG.CANVAS_HEIGHT - 22 - bottomRadius;

    let nx = boss.x;
    let ny = boss.y;
    for (let attempt = 0; attempt < 24; attempt++) {
      const candX = Math.round(minX + Math.random() * Math.max(20, maxX - minX));
      const candY = Math.round(minY + Math.random() * Math.max(40, maxY - minY));
      if (Math.hypot(candX - boss.x, candY - boss.y) >= 85) {
        nx = candX;
        ny = candY;
        break;
      }
    }
    boss.x = nx;
    boss.y = ny;
    boss.prevX = nx;
    boss.prevY = ny;
    enforceRightThirdBound(boss);

    // 3. Rotate the hull and muzzle to the locked aim direction before the fast charge.
    const px = state.player ? state.player.x : 200;
    const py = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;
    const rawAim = Math.atan2(py - boss.y, px - boss.x);
    const diff = Math.atan2(Math.sin(rawAim - Math.PI), Math.cos(rawAim - Math.PI));
    const lockedAngle = Math.PI + Math.max(-0.62, Math.min(0.62, diff));
    boss.rotation = lockedAngle + Math.PI / 2;
    const m = getFacingBossMuzzles(boss)[0];

    const beam = spawnLaserBeam({
      kind: 'TIER7_PHASE2_LASER',
      color: 'Lime',
      widthMultiplier: 2,
      stage1Time: CONFIG.TIER7_P2_STAGE1_TIME,
      stage2Time: CONFIG.TIER7_P2_STAGE2_TIME,
      stage3Time: CONFIG.TIER7_P2_STAGE3_TIME,
      damage: CONFIG.TIER7_P2_LASER_DAMAGE,
      shakeOnStage3: true,
      ox: m.x,
      oy: m.y,
      angle: lockedAngle,
      followBossMuzzleIndex: 0
    });

    boss.p2ActiveBeamId = beam.id;
    boss.p2Cooldown = 0.4;
    boss.p2BlinkCount += 1;
    state.telemetry.tier7Phase2LasersFired += 1;
    return beam;
  }

  /**
   * Tier 08 Phase 2 (<= 20% HP):
   * 10 Enemy_04 units shuffle on the right; 8 fire and 2 red units leave safe lanes,
   * leaving 2 safe corridors per wave for 6 waves on a 3.0s cycle, then returning to Phase 1.
   */
  function getTier8Phase2LaneCenterY(laneIndex) {
    return CONFIG.TIER8_P2_TOP_Y + (laneIndex + 0.5) * CONFIG.TIER8_P2_LANE_HEIGHT;
  }

  function enterTier8Phase2(boss) {
    boss.phase2Active = true;
    clearAllCombatHazards();
    boss.laserMode = 'PHASE2_RAID';
    boss.p2TotalWaves = CONFIG.TIER8_P2_WAVE_COUNT;
    boss.p2WavesFired = 0; boss.p2WaveCount = 0;
    state.floatingTexts.push({ text: 'DESTROY THE WEAK SHIP!',
      x: CONFIG.CANVAS_WIDTH / 2, y: 185, color: '#ffe366', timer: 2 });
    prepareTier8RaidWave(boss);
    boss.p2WaveTimer = CONFIG.TIER8_P2_WAVE_INTERVAL;
  }

  function prepareTier8RaidWave(boss) {
    const count = CONFIG.TIER8_P2_LANE_COUNT;
    const playerY = state.player ? state.player.y : CONFIG.CANVAS_HEIGHT / 2;
    const reachable = Array.from({ length: count }, (_, lane) => lane)
      .filter(lane => Math.abs(getTier8Phase2LaneCenterY(lane) - playerY) < 200);
    const first = reachable[Math.floor(Math.random() * reachable.length)];
    boss.p2WeakLanes = [first];
    boss.p2WavesFired += 1; boss.p2WaveCount = boss.p2WavesFired;
    state.telemetry.tier8Phase2WavesFired += 1;
    state.enemies = state.enemies.filter(e => !e.isTier8Phase2Raider);
    const duration = 0.75;
    for (let lane=0; lane<count; lane++) {
      const weak = boss.p2WeakLanes.includes(lane), idx = weak ? 1 : 4;
      const path = `enemies/Tier_08/Enemy_0${idx}.png`;
      const homeY = getTier8Phase2LaneCenterY(lane);
      const hp = weak ? getEnemyMaxHp(1,1) : getEnemyMaxHp(8,4);
      const x = CONFIG.CANVAS_WIDTH + 100 + Math.random()*100;
      state.enemies.push({
        id: `t8-raid-${boss.p2WaveCount}-${lane}`, tier:8, enemyIdx:idx,
        isTier8Phase2Raider:true, isWeakRaider:weak, invulnerable:false,
        laneIndex:lane, path, spec:SPRITE_SPECS[path], scale:CONFIG.SHIP_SCALE,
        x, y:homeY+(Math.random()-0.5)*30, prevX:x, prevY:homeY,
        homeX:CONFIG.CANVAS_WIDTH-110, homeY, hp, maxHp:hp,
        entering:false, retreating:false, age:0, hitFlash:0, shieldFlash:0,
        specialState:'RAID_FORM', fireCooldown:1e9, summonedBy:boss.id,
        shuffleStartX:x, shuffleStartY:homeY+(Math.random()-0.5)*40,
        shuffleArc:-35-Math.random()*30, shuffleLift:(Math.random()-0.5)*24
      });
    }
    boss.p2FormationDuration = duration;
    boss.p2FormationTimer = duration;
    boss.p2RaidWait = 0.6;
    boss.p2FormationPending = true;
    return boss.p2WeakLanes;
  }

  function launchTier8Raid(boss) {
    boss.p2FormationPending = false;
    for (const unit of state.enemies.filter(e=>e.isTier8Phase2Raider)) {
      unit.specialState = 'RAID_DASH';
      unit.prevX=unit.x; unit.prevY=unit.y;
      unit.vx=-1600;
    }
    triggerCameraShake(0.25,5);
    boss.p2FlashTimer=0.12;
  }

  function finishTier8Phase2(boss) {
    state.enemies = state.enemies.filter(e => !e.isTier8Phase2Raider);
    boss.phase2Active = false; boss.p2FormationPending=false;
    boss.p2RepeatCooldown = CONFIG.AWAKEN_REPEAT_COOLDOWN;
    boss.laserMode = 'IDLE'; boss.laserModeTimer=1.05; boss.dasherSpawnTimer=0.9;
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
    if(beam.kind==='CHAIN_CURRENT') return 2;
    if(beam.kind==='EMP_CURRENT') return beam.empLarge?12:4;
    if(beam.kind==='ELECTRIC_ENEMY' || beam.kind==='ELECTRIC_BOSS') return 10;
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

  function damagePlayer(amount, sourceLabel, stunDuration = 0, electricColor = null) {
    const p = state.player;
    if (!p || p.invulnTimer > 0 || p.skills?.shield.remaining > 0 || state.debugInvincible || state.mode !== 'PLAYING') return false;

    if(electricColor) {
      stunDuration=0.3;p.electrocutionRemaining=0.3;p.electrocutionColor=electricColor;
      spawnExplosion(p.x,p.y,electricColor==='Red'?'#ff7186':'#78d8ff',10);
      triggerCameraShake(0.14,2.5);
    }
    p.stunRemaining = Math.max(p.stunRemaining || 0, stunDuration);
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
    return true;
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

    advancePlayerSkills(dt);

    // 1. Scroll background continuously right-to-left, wrapping at 43,440px
    state.bgScrollX = (state.bgScrollX + CONFIG.BG_SCROLL_SPEED * dt) % CONFIG.BG_TOTAL_WIDTH;

    // 2. Update Player
    const p = state.player;
    if (p) {
      p.prevX = p.x;
      p.prevY = p.y;
      if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
      if (p.hitFlashTimer > 0) p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);

      const moveTime = Math.max(0,dt-(p.stunRemaining || 0));
      p.stunRemaining=Math.max(0,(p.stunRemaining || 0)-dt);
      p.electrocutionRemaining=Math.max(0,(p.electrocutionRemaining || 0)-dt);
      p.empRemaining=Math.max(0,(p.empRemaining || 0)-dt);
      if(p.empRemaining===0) p.empMap=null;
      let mx=0,my=0;
      const directions=[[-1,0],[1,0],[0,-1],[0,1]],map=p.empMap || [0,1,2,3];
      const held=[keys.has('ArrowLeft')||keys.has('KeyA'),keys.has('ArrowRight')||keys.has('KeyD'),
        keys.has('ArrowUp')||keys.has('KeyW'),keys.has('ArrowDown')||keys.has('KeyS')];
      held.forEach((down,i)=>{if(down) {mx+=directions[map[i]][0];my+=directions[map[i]][1];}});

      if (mx !== 0 && my !== 0) {
        const inv = 1 / Math.SQRT2;
        mx *= inv;
        my *= inv;
      }

      const baseSpeed = (keys.has('ShiftLeft') || keys.has('ShiftRight'))
        ? CONFIG.PLAYER_FOCUS_SPEED
        : CONFIG.PLAYER_SPEED;
      const speed = baseSpeed * p.speedMultiplier;

      p.x += mx * speed * moveTime;
      p.y += my * speed * moveTime;

      const pBounds = getRotatedBounds(p.x, p.y, p.spec, true, p.scale);
      const halfW = pBounds.width / 2;
      const halfH = pBounds.height / 2;
      p.x = Math.max(24 + halfW, Math.min(CONFIG.CANVAS_WIDTH - 24 - halfW, p.x));
      p.y = Math.max(54 + halfH, Math.min(CONFIG.CANVAS_HEIGHT - 16 - halfH, p.y));

      if(p.skills.laser.remaining>0 || p.skills.laser.pendingTicks>0) {
        p.fireCooldown=0;
      } else {
        p.fireCooldown-=dt;
        if(p.fireCooldown<=0) firePlayerWeapon(p);
      }
    }

    // 3. Wave Timer & Phase Progression
    if (state.phase === 'WAVE') {
      state.tierWaveElapsed += dt;
      if (state.tierWaveElapsed >= state.waveDuration) {
        state.tierWaveElapsed = state.waveDuration;
        state.cumulativeWaveTime = (getStageNumber(state.currentTier) - 1) * CONFIG.WAVE_DURATION + CONFIG.WAVE_DURATION;
        startTierBoss(state.currentTier);
      } else {
        const progressRatio = state.tierWaveElapsed / state.waveDuration;
        state.cumulativeWaveTime = (getStageNumber(state.currentTier) - 1) * CONFIG.WAVE_DURATION + progressRatio * CONFIG.WAVE_DURATION;

        state.enemySpawnTimer -= dt;
        const maxConcurrent = 2 * (3 + Math.floor(state.currentTier / 3)); // Double wave population: 6..10 regular enemies
        if (state.currentTier!==11 && state.enemySpawnTimer <= 0 && state.enemies.filter((e) => !e.retreating).length < maxConcurrent) {
          spawnWaveEnemy(state.currentTier);
          state.enemySpawnTimer = 0.5 * (1.65 - state.currentTier * 0.06) * (0.85 + Math.random() * 0.35);
        }
      }
    }

    // 4. Time-based Meteor Spawning (paused during Tier 08 Ultimate & Phase 2 Corridor Barrage to prevent unfair overlap)
    const isTier8Ult = state.boss && state.boss.tier === 8 &&
      (state.boss.laserMode === 'ULTIMATE' || state.boss.phase2Active);
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
      if (e.shieldFlash > 0) e.shieldFlash = Math.max(0, e.shieldFlash - dt);

      if (e.isTier8Phase2Raider) {
        const boss=state.boss;
        e.prevX=e.x; e.prevY=e.y;
        if (e.specialState==='RAID_DASH') {
          e.x += e.vx*dt;
          if (e.x < -130) state.enemies.splice(i,1);
        } else if (boss?.p2FormationTimer>0) {
          const t=Math.min(1,1-Math.max(0,boss.p2FormationTimer-dt)/boss.p2FormationDuration);
          const ease=t**3*(t*(t*6-15)+10), arc=Math.sin(t*Math.PI);
          e.x=e.shuffleStartX+(e.homeX-e.shuffleStartX)*ease+arc*e.shuffleArc;
          e.y=e.shuffleStartY+(e.homeY-e.shuffleStartY)*ease+arc*e.shuffleLift;
        } else { e.x=e.homeX; e.y=e.homeY; }
        continue;
      }

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
      const aimLocked=beam.aimLockTime>0 && beam.stage===2 && beam.stageTimer<=beam.aimLockTime+1e-9;
      if (beam.updateFn && !aimLocked) {
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
          if(beam.electricLeader && state.boss?.id===beam.electricBossId) state.boss.electricFlashTimer=0.20;
          if (beam.shakeOnStage3 && !beam.shakeTriggered) {
            beam.shakeTriggered = true;
            triggerCameraShake(0.28, 6.5);
          }
        } else {
          state.lasers.splice(i, 1);
          continue;
        }
      }

      if (p && beam.stage === 3 && checkLaserHitsPlayer(beam, p)) {
        damagePlayer(beam.damage ?? CONFIG.LASER_DAMAGE, 'LASER', beam.stunDuration || 0,
          beam.kind==='CHAIN_CURRENT'?'Red':['ELECTRIC_ENEMY','ELECTRIC_BOSS'].includes(beam.kind)?'Cyan':null);
      }
    }

    // 10. Update Tier 06 4-Wing Missiles, Phase 2 Global Blast Waves, Afterimages & Timed Explosions
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

    for (let i = state.globalBlastWaves.length - 1; i >= 0; i--) {
      const gw = state.globalBlastWaves[i];
      gw.timer -= dt;
      if (gw.timer <= 0) {
        detonateGlobalBlastWave(gw);
        state.globalBlastWaves.splice(i, 1);
      }
    }

    for (let i = state.afterimages.length - 1; i >= 0; i--) {
      const ai = state.afterimages[i];
      ai.timer -= dt;
      if (ai.timer <= 0) state.afterimages.splice(i, 1);
    }

    if (state.cameraShake.timer > 0) {
      state.cameraShake.timer = Math.max(0, state.cameraShake.timer - dt);
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
    const skillLaser=state.player?.skills.laser;
    while(skillLaser?.pendingTicks>0) {
      skillLaser.pendingTicks-=1;
      if(state.mode==='PLAYING' && state.player.hp>0) applyPlayerSkillLaserTick();
    }
    if (p) {
      for (const unit of state.enemies.filter(e=>e.isTier8Phase2Raider && e.specialState==='RAID_DASH')) {
        const now=getRotatedBounds(unit.x,unit.y,unit.spec,false,unit.scale);
        const before=getRotatedBounds(unit.prevX,unit.prevY,unit.spec,false,unit.scale);
        if (checkCircleHitsBounds(p.x,p.y,p.hitboxRadius,{
          left:Math.min(now.left,before.left), right:Math.max(now.right,before.right),
          top:Math.min(now.top,before.top), bottom:Math.max(now.bottom,before.bottom)
        })) damagePlayer(CONFIG.DASH_DAMAGE,'RAID SHIP');
      }
    }

    updateElectricVolleys(dt);
    updateElectricSweeps(dt);
    updateEmpWaves(dt);

    // 13. Update Enemy Bullets & Player Collision
    for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
      const eb = state.enemyBullets[i];
      eb.x += eb.vx * dt;
      eb.y += eb.vy * dt;

      if (p && checkBulletHitsPlayer(eb, p)) {
        damagePlayer(CONFIG.ENEMY_BULLET_DAMAGE, 'BULLET', eb.stunDuration || 0, eb.electrocutionColor || null);
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
    boss.p2FlashTimer = Math.max(0, (boss.p2FlashTimer || 0) - dt);
    if (boss.hitFlash > 0) boss.hitFlash = Math.max(0, boss.hitFlash - dt);

    if(boss.kind==='CHAIN_BOSS') {updateChainBoss(boss,dt);return;}

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

    if(boss.kind==='TIER_BOSS' && boss.tier===10) {
      boss.empFlashTimer=Math.max(0,(boss.empFlashTimer || 0)-dt);
      boss.phaseX+=dt*0.7;boss.phaseY+=dt*0.6;
      boss.x=boss.homeX+Math.sin(boss.phaseX)*35;boss.y=boss.homeY+Math.sin(boss.phaseY)*130;
      enforceRightThirdBound(boss);
      boss.attackTimer-=dt;
      if(boss.attackTimer<=0) {firePurpleCoreCurrent(boss,true);boss.attackTimer=3.8;}
      boss.empCooldown=(boss.empCooldown ?? 12)-dt;
      if(boss.empCooldown<=0) {emitEmpWave(boss);boss.empCooldown+=12;}
      return;
    }

    if (boss.kind === 'TIER_BOSS' && boss.tier === 9) {
      boss.electricFlashTimer=Math.max(0,(boss.electricFlashTimer || 0)-dt);
      updateElectricSweepScheduler(boss,dt);
      if(!boss.phase2Triggered) checkAndTriggerBossPhase2(boss);
      if(boss.electricField) {
        boss.phaseX+=dt*0.8*0.30;boss.phaseY+=dt*0.65*0.30;
        boss.x=boss.homeX+Math.sin(boss.phaseX)*45;
        boss.y=boss.homeY+Math.sin(boss.phaseY)*155;
        enforceRightThirdBound(boss);updateElectricBossField(boss,dt);return;
      }
      if(boss.phase2Triggered) {
        boss.electricFieldCooldown=Math.max(0,(boss.electricFieldCooldown ?? 20)-dt);
        if(boss.electricFieldCooldown===0) {startElectricBossField(boss);return;}
      }
      if(boss.electricMode==='LASER') {
        const beams=state.lasers.filter(b=>b.electricBossId===boss.id);
        if(beams.length && beams.every(b=>b.stage<3)) {
          // Continue the same movement phase at 30% speed, so charging never teleports the hull.
          boss.phaseX+=dt*0.8*0.30;boss.phaseY+=dt*0.65*0.30;
          boss.x=boss.homeX+Math.sin(boss.phaseX)*45;
          boss.y=boss.homeY+Math.sin(boss.phaseY)*155;
          enforceRightThirdBound(boss);
        }
        if(!beams.length) {
          boss.electricMode='TRIANGLE';boss.electricVolleyCount=0;boss.attackTimer=1.5;
        }
        return;
      }
      boss.phaseX+=dt*0.8;boss.phaseY+=dt*0.65;
      boss.x=boss.homeX+Math.sin(boss.phaseX)*45;
      boss.y=boss.homeY+Math.sin(boss.phaseY)*155;
      enforceRightThirdBound(boss);
      boss.attackTimer-=dt;
      if(boss.attackTimer<=0) {
        if((boss.electricVolleyCount || 0)>=2) startElectricBossLasers(boss);
        else {
          spawnElectricVolley(boss,true);
          boss.electricVolleyCount=(boss.electricVolleyCount || 0)+1;
          boss.attackTimer=3.2;
        }
      }
      return;
    }

    if (boss.hp > 0 && !boss.phase2Triggered) {
      checkAndTriggerBossPhase2(boss);
    }

    if (boss.kind === 'TIER_BOSS' && boss.phase2Triggered && !boss.phase2Active &&
        (boss.tier === 5 || boss.tier === 8) && boss.hp > 0) {
      boss.p2RepeatCooldown = Math.max(0,(boss.p2RepeatCooldown ?? CONFIG.AWAKEN_REPEAT_COOLDOWN)-dt);
      if (boss.p2RepeatCooldown===0 && (boss.tier!==5 || boss.dashState==='NORMAL')) {
        if (boss.tier===5) enterTier5Phase2(boss);
        else enterTier8Phase2(boss);
      }
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

    // Tier 05 Horizontal Forward Dash (Phase 1) & Omnidirectional 5-Dash (Phase 2) state machine
    if (boss.kind === 'TIER_BOSS' && boss.tier === 5) {
      if (boss.dashState === 'NORMAL') {
        boss.rotation = -Math.PI / 2;
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
        boss.rotation = -Math.PI / 2;
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
          boss.dashSideShotTimer = 0.04;
        }
      } else if (boss.dashState === 'DASH') {
        boss.rotation = -Math.PI / 2;
        // Strictly horizontal forward sweep across screen (vy = 0, y = dashY!)
        boss.x += boss.dashVx * dt;
        boss.y = boss.dashY;
        state.telemetry.tier5MaxAbsVyDuringDash = Math.max(
          state.telemetry.tier5MaxAbsVyDuringDash,
          Math.abs(boss.y - boss.prevY)
        );

        // Emit rapid 1-per-side perpendicular bullets (up and down along horizontal dash)
        boss.dashSideShotTimer -= dt;
        while (boss.dashSideShotTimer <= 0 && boss.x > 60 && boss.x < CONFIG.CANVAS_WIDTH - 60) {
          fireTier5DashSideBullets(boss, Math.PI);
          boss.dashSideShotTimer += CONFIG.TIER5_DASH_SIDE_INTERVAL;
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
          boss.rotation = -Math.PI / 2;
          boss.dashState = 'RETURN';
        }
      } else if (boss.dashState === 'RETURN') {
        boss.rotation = -Math.PI / 2;
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
      } else if (boss.dashState === 'P2_WARN') {
        boss.dashTimer -= dt;
        if (boss.dashTimer <= 0) {
          boss.dashState = 'P2_DASH';
          boss.dashSideShotTimer = 0.03;
          boss.p2EnteredScreen = false;
          boss.p2DashElapsed = 0.0;
        }
      } else if (boss.dashState === 'P2_DASH') {
        boss.x += boss.dashVx * dt;
        boss.y += boss.dashVy * dt;
        boss.p2DashElapsed += dt;
        boss.rotation = boss.p2DashAngle + Math.PI / 2;

        if (boss.x >= 0 && boss.x <= CONFIG.CANVAS_WIDTH && boss.y >= 0 && boss.y <= CONFIG.CANVAS_HEIGHT) {
          boss.p2EnteredScreen = true;
        }

        // Rapid 1-per-side perpendicular bullets along p2DashAngle
        boss.dashSideShotTimer -= dt;
        const inArena = boss.x >= 48 && boss.x <= CONFIG.CANVAS_WIDTH - 48 &&
                        boss.y >= 56 && boss.y <= CONFIG.CANVAS_HEIGHT - 36;
        while (boss.dashSideShotTimer <= 0 && inArena) {
          fireTier5DashSideBullets(boss, boss.p2DashAngle);
          boss.dashSideShotTimer += CONFIG.TIER5_DASH_SIDE_INTERVAL;
        }

        // Continuous swept-segment collision check against player core
        if (state.player) {
          const hitR = 28 + state.player.hitboxRadius;
          if (distSqPointToSegment(state.player.x, state.player.y, boss.prevX, boss.prevY, boss.x, boss.y) <= hitR * hitR) {
            damagePlayer(CONFIG.DASH_DAMAGE, 'BOSS P2 DASH');
          }
        }

        if ((boss.p2EnteredScreen || boss.p2DashElapsed > 0.35) && (
          boss.x < -105 || boss.x > CONFIG.CANVAS_WIDTH + 105 ||
          boss.y < -105 || boss.y > CONFIG.CANVAS_HEIGHT + 105
        )) {
          boss.p2DashesCompleted += 1;
          state.telemetry.tier5Phase2Dashes = (state.telemetry.tier5Phase2Dashes || 0) + 1;
          boss.dashState = 'P2_WAIT';
          boss.dashTimer = CONFIG.TIER5_P2_WAIT_TIME;
          boss.x = CONFIG.CANVAS_WIDTH + 180;
          boss.y = boss.homeY;
          boss.prevX = boss.x;
          boss.prevY = boss.y;
        }
      } else if (boss.dashState === 'P2_WAIT') {
        boss.dashTimer -= dt;
        if (boss.dashTimer <= 0) {
          if (boss.p2DashesCompleted < boss.p2TotalDashes) {
            prepareTier5Phase2Dash(boss);
          } else {
            boss.x = CONFIG.CANVAS_WIDTH + 90;
            boss.y = boss.homeY;
            boss.prevX = boss.x;
            boss.prevY = boss.y;
            boss.rotation = -Math.PI / 2;
            boss.dashState = 'P2_RETURN';
          }
        }
      } else if (boss.dashState === 'P2_RETURN') {
        boss.rotation = -Math.PI / 2;
        boss.x -= 520 * dt;
        boss.y = boss.homeY;
        if (boss.x <= boss.homeX) {
          boss.x = boss.homeX;
          boss.y = boss.homeY;
          boss.phaseX = 0.0;
          boss.phaseY = 0.0;
          boss.exemptFromRightThird = false;
          boss.phase2Active = false;
          boss.p2RepeatCooldown = CONFIG.AWAKEN_REPEAT_COOLDOWN;
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

    // Continuous phase-integrated movement inside right 1/3 for all other bosses
    // (Except Tier 07 Phase 2, which holds its teleported coordinate while charging and firing aimed lasers)
    const isTier7Phase2 = boss.kind === 'TIER_BOSS' && boss.tier === 7 && boss.phase2Triggered;
    if (!isTier7Phase2) {
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
    } else {
      enforceRightThirdBound(boss);
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
        // Tier 06 Phase 2: Full-map random explosions every 10.0s with guaranteed reachable safe zones
        if (boss.phase2Triggered) {
          boss.p2ExplosionCooldown -= dt;
          while (boss.p2ExplosionCooldown <= 0) {
            startTier6BlastBurst(boss);
            boss.p2ExplosionCooldown += CONFIG.TIER6_P2_EXPLOSION_INTERVAL;
          }
        }
        if (boss.p2BlastRemaining > 0) {
          boss.p2BlastTimer -= dt;
          while (boss.p2BlastTimer <= 0 && boss.p2BlastRemaining > 0) {
            triggerTier6GlobalExplosionWave(boss);
            boss.p2BlastRemaining -= 1; boss.p2BlastTimer += 1;
          }
        }
        if (state.globalBlastWaves.length > 0 && boss.missileState === 'LOAD') {
          boss.missileStateTimer = Math.max(boss.missileStateTimer, 0.35);
        }

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
        if (boss.phase2Triggered) {
          // Tier 07 Phase 2: No enemy summons and no normal bullets; repeat blink + 2x fast-charge aimed laser loop
          const activeBeam = state.lasers.some(b => b.id === boss.p2ActiveBeamId);
          if (!activeBeam) {
            boss.p2Cooldown -= dt;
            if (boss.p2Cooldown <= 0) {
              performTier7Phase2BlinkAndLaser(boss);
            }
          }
        } else {
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
        }
      } else if (boss.tier === 8) {
        if (boss.phase2Active) {
          // Tier 08 Phase 2: 6 waves of ten fast raiders; shoot down two weak Lv1 ships to make a passage
          if (boss.p2FormationPending) {
            boss.p2FormationTimer = Math.max(0, boss.p2FormationTimer - dt);
            if (boss.p2FormationTimer === 0) {
              boss.p2RaidWait = Math.max(0,boss.p2RaidWait-dt);
              if (boss.p2RaidWait===0) launchTier8Raid(boss);
            }
          }
          boss.p2WaveTimer -= dt;
          while (boss.p2WaveTimer <= 0) {
            if (boss.p2WavesFired < boss.p2TotalWaves) {
              prepareTier8RaidWave(boss);
              boss.p2WaveTimer += CONFIG.TIER8_P2_WAVE_INTERVAL;
            } else {
              finishTier8Phase2(boss);
              break;
            }
          }
        } else {
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

  function checkBulletHitsRaider(pb, enemy, bounds) {
    const startX=(pb.prevX ?? pb.x)+enemy.x-(enemy.prevX ?? enemy.x);
    const startY=(pb.prevY ?? pb.y)+enemy.y-(enemy.prevY ?? enemy.y);
    let near=0,far=1;
    for(const [start,end,min,max] of [
      [startX,pb.x,bounds.left-pb.radius,bounds.right+pb.radius],
      [startY,pb.y,bounds.top-pb.radius,bounds.bottom+pb.radius]
    ]) {
      const delta=end-start;
      if(Math.abs(delta)<1e-9) { if(start<min || start>max) return false; }
      else {
        const a=(min-start)/delta,b=(max-start)/delta;
        near=Math.max(near,Math.min(a,b)); far=Math.min(far,Math.max(a,b));
        if(near>far) return false;
      }
    }
    return true;
  }

  function canDamageBossWithPlayerAttack(boss) {
    if (!boss || boss.hp<=0 || boss.entering || boss.defeatedHandled || boss.dyingTimer>0) return false;
    if(boss.kind==='CHAIN_BOSS' && !boss.combat)return false;
    if (['OFFSCREEN','P2_WARN','P2_WAIT'].includes(boss.dashState)) return false;
    if (boss.tier===8 && boss.phase2Active) return false;
    if (boss.tier===7 && boss.phase2Triggered && !state.lasers.some(l=>l.id===boss.p2ActiveBeamId && l.stage===3)) return false;
    return true;
  }

  function usePlayerSkill(id) {
    const p=state.player, skill=p?.skills[id];
    if (!assets.ready || state.mode!=='PLAYING' || !p || p.hp<=0 || !skill || skill.cooldown>0) return false;
    if (id==='heal' && p.hp>=p.maxHp) return false;
    const stats=getSkillStats(p.skillLevel);
    skill.cooldownDuration=id==='laser' ? stats.laserCooldown : id==='heal' ? stats.healCooldown : stats.shieldCooldown;
    skill.cooldown=skill.cooldownDuration;
    if (id==='laser') {
      skill.remaining=6;skill.damagePerTick=stats.laserTotal/120;skill.accumulator=0;skill.pendingTicks=0;skill.elapsed=0;skill.flashTimer=0.14;
      state.playerBullets=[];p.fireCooldown=0;
      triggerCameraShake(0.18,2.5);
    } else if (id==='heal') {
      p.hp=Math.min(p.maxHp,p.hp+stats.healAmount);
      spawnExplosion(p.x,p.y,'#ff7899',18);
    } else if (id==='shield') {
      skill.remaining=stats.shieldDuration;spawnExplosion(p.x,p.y,'#7ebaff',18);
    }
    updatePlayerSkillUI();updateHudBadges();
    return true;
  }

  function advancePlayerSkills(dt) {
    const skills=state.player?.skills;
    if (!skills) return;
    for(const skill of Object.values(skills)) {
      skill.cooldown=Math.max(0,skill.cooldown-dt);
      if(skill.cooldown<1e-8) skill.cooldown=0;
    }
    skills.shield.remaining=Math.max(0,skills.shield.remaining-dt);
    if(skills.shield.remaining<1e-8) skills.shield.remaining=0;
    const laser=skills.laser;
    const activeDt=Math.min(dt,laser.remaining);
    laser.elapsed+=activeDt;
    laser.flashTimer=Math.max(0,laser.flashTimer-dt);
    laser.remaining=Math.max(0,laser.remaining-dt);
    if(laser.remaining<1e-8) laser.remaining=0;
    laser.accumulator+=activeDt;
    const ticks=Math.floor((laser.accumulator+1e-9)/0.05);
    laser.accumulator=Math.max(0,laser.accumulator-ticks*0.05);
    laser.pendingTicks+=ticks;
  }

  function getPlayerSkillLaserOrigin() {
    const p=state.player;
    return p ? getWorldMuzzles(p.x,p.y,p.spec,true,p.scale)[0] : null;
  }

  function applyPlayerSkillLaserTick() {
    const m=getPlayerSkillLaserOrigin();if(!m) return;
    const damage=state.player.skills.laser.damagePerTick ?? getSkillStats().laserTotal/120;
    const hits=entity=>{
      const box=getRotatedBounds(entity.x,entity.y,entity.spec,false,entity.scale);
      return box.right>=m.x && box.left<=CONFIG.CANVAS_WIDTH && box.bottom>=m.y-16 && box.top<=m.y+16;
    };
    const boss=state.boss;
    const chainHits=boss?.kind==='CHAIN_BOSS'?(boss.phase2Triggered?[boss.segments[0]]:boss.segments).map(part=>part.x+22>=m.x && part.x-22<=CONFIG.CANVAS_WIDTH && Math.abs(part.y-m.y)<=38):null;
    if(canDamageBossWithPlayerAttack(boss) && (chainHits ? chainHits.some(Boolean) : hits(boss))) {
      const multiplier=chainHits?(chainHits[0]?1.5:0.5):1;
      boss.hp=Math.max(0,boss.hp-damage*multiplier);if(boss.hp<1e-7) boss.hp=0;boss.hitFlash=0.06;
      if(boss.hp<=0) {handleBossDefeated();return;}
      if(checkAndTriggerBossPhase2(boss)) return;
    }
    for(const escort of [...state.escorts]) {
      if(escort.invulnerable || escort.hp<=0 || !hits(escort)) continue;
      escort.hp-=damage;escort.hitFlash=0.06;
      if(escort.hp<=1e-7) {
        state.score+=250;spawnExplosion(escort.x,escort.y,'#4adeff',14);
        if(escort.respawnRemaining>0 && state.boss?.tier===4) state.boss.t4EscortRespawnTimers.push({idx:escort.idx,timer:9});
        state.escorts=state.escorts.filter(e=>e!==escort);
      }
    }
    for(const enemy of [...state.enemies]) {
      if(enemy.invulnerable || enemy.hp<=0 || enemy.retreating || enemy.deathHandled || enemy.specialState==='FLYBY_WARN' || !hits(enemy)) continue;
      enemy.hp-=damage;enemy.hitFlash=0.06;
      if(enemy.hp<=1e-7) {
        if(enemy.tier===6) beginEnemySuicide(enemy);
        else {
          state.score+=100*enemy.tier+25*enemy.enemyIdx;
          spawnExplosion(enemy.x,enemy.y,'#50e5ff',12);removeEnemy(enemy);
        }
      }
    }
  }

  function updatePlayerSkillUI() {
    const p=state.player;
    const labels={laser:'관통 레이저',heal:'응급 회복',shield:'방어막'};
    for(const [id,label] of Object.entries(labels)) {
      const skill=p?.skills[id], button=document.getElementById(`skill-${id}`);
      if(!button || !skill) continue;
      const full=id==='heal' && p.hp>=p.maxHp;
      const cd=skill.cooldown>0 ? `${Math.ceil(skill.cooldown)}초` : full ? 'HP 최대' : '준비';
      const active=skill.remaining>0 ? ` · ${Math.ceil(skill.remaining)}초 유지` : '';
      const value=cd+active;
      const text=document.getElementById(`skill-${id}-time`);
      if(text && text.textContent!==value) text.textContent=value;
      const shade=document.getElementById(`skill-${id}-shade`);
      if(shade) shade.style.height=`${(skill.cooldown/(skill.cooldownDuration || 120)*100).toFixed(2)}%`;
      const profile=getSkillStats(p.skillLevel);
      const name=document.getElementById(`skill-${id}-name`);
      const levelText=p.skillLevel ? ` +${p.skillLevel}` : '';
      if(name) name.textContent=label+levelText;
      const info=id==='laser' ? `6초간 총 ${Math.round(profile.laserTotal)} 피해 · 쿨 ${profile.laserCooldown}초` :
        id==='heal' ? `HP ${profile.healAmount} 회복 · 쿨 ${profile.healCooldown}초` : `${profile.shieldDuration}초 보호 · 쿨 ${profile.shieldCooldown}초`;
      button.title=`[${{laser:'E',heal:'R',shield:'T'}[id]}] ${label}${levelText} · ${info}`;
      button.disabled=!assets.ready || state.mode!=='PLAYING' || p.hp<=0 || skill.cooldown>0 || full;
      button.ariaLabel=`${label}${p.skillLevel ? ` +${p.skillLevel}` : ''}: ${value}`;
      button.classList.toggle('skill-active',skill.remaining>0);
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
      if (canDamageBossWithPlayerAttack(state.boss)) {
        let hitBoss,damageMultiplier=1;
        if(state.boss.kind==='CHAIN_BOSS') {
          const targets=state.boss.phase2Triggered?[state.boss.segments[0]]:state.boss.segments;
          const hits=targets.map(part=>distSqPointToSegment(part.x,part.y,pb.prevX ?? pb.x,pb.prevY ?? pb.y,pb.x,pb.y)<(22+pb.radius)**2);
          hitBoss=hits.some(Boolean);damageMultiplier=hits[0]?1.5:0.5;
        } else if (state.boss.tier === 7 && state.boss.phase2Triggered) {
          const b = state.boss, r = b.rotation ?? -Math.PI / 2;
          const dx = pb.x - b.x, dy = pb.y - b.y;
          const [bx, by, bw, bh] = b.spec.visibleBounds;
          hitBoss = checkCircleHitsBounds(dx * Math.cos(r) + dy * Math.sin(r),
            -dx * Math.sin(r) + dy * Math.cos(r), pb.radius, {
              left: (bx - b.spec.size[0] / 2) * b.scale,
              right: (bx + bw - b.spec.size[0] / 2) * b.scale,
              top: (by - b.spec.size[1] / 2) * b.scale,
              bottom: (by + bh - b.spec.size[1] / 2) * b.scale
            });
        } else {
          const bounds = getRotatedBounds(state.boss.x, state.boss.y, state.boss.spec, false, state.boss.scale);
          hitBoss = checkCircleHitsBounds(pb.x, pb.y, pb.radius, bounds);
        }
        if (!pb.hitTargets?.has(state.boss) && hitBoss) {
          pb.hitTargets?.add(state.boss);
          state.boss.hp = Math.max(0, state.boss.hp - pb.damage*damageMultiplier);
          state.boss.hitFlash = 0.08;
          state.score += 25;
          spawnExplosion(pb.x, pb.y, '#50e5ff', 3);
          if (!pb.piercing) { state.playerBullets.splice(i, 1); consumed = true; }

          if (state.boss.hp <= 0) {
            handleBossDefeated();
          } else {
            checkAndTriggerBossPhase2(state.boss);
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
        if (!pb.hitTargets?.has(e) && (e.isTier8Phase2Raider ? checkBulletHitsRaider(pb,e,eBounds) : checkCircleHitsBounds(pb.x, pb.y, pb.radius, eBounds))) {
          pb.hitTargets?.add(e);
          if (e.invulnerable) {
            e.shieldFlash = 0.18;
            spawnExplosion(pb.x, pb.y, '#43d8fa', 4);
            if (!pb.piercing) { state.playerBullets.splice(i, 1); consumed = true; break; }
            continue;
          }
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

    if(boss.kind==='CHAIN_BOSS') {
      for(const part of boss.segments)spawnExplosion(part.x,part.y,'#ed1c24',8);
      state.score+=6000;clearAllCombatHazards();state.boss=null;
      if(boss.campaign)advanceToNextTierWave(getPatternTier(getStageNumber(11)+1));
      else triggerGameClear();
    } else if (boss.kind === 'TIER_BOSS') {
      const defeatedTier = getStageNumber(boss.tier);
      state.score += 1500 * defeatedTier;

      // Clean up all active boss hazards & Tier 04 escorts immediately
      clearAllCombatHazards();
      state.boss = null;

      // Even-Tier Bosses (Tier 02, 04, 06, 08) open the upgrade reward selection!
      if (isEvenRewardTier(defeatedTier)) {
        openRewardSelection(defeatedTier);
      } else {
        // Odd-Tier Bosses (Tier 01, 03, 05, 07) proceed directly to next tier wave
        if (defeatedTier >= CONFIG.TOTAL_TIERS) startShadowBoss();
        else advanceToNextTierWave(getPatternTier(defeatedTier + 1));
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
    const finalShake = firing ? (sweep.activeElapsed < 0.24 ? 7 : 2.2) :
      sweep?.phase === 'WARNING' ? (1 - sweep.warningTimer / 1.1) * 2 : 0;
    const camShake = state.cameraShake.timer > 0 && state.cameraShake.duration > 0
      ? (state.cameraShake.magnitude || state.cameraShake.intensity || 0) * (state.cameraShake.timer / state.cameraShake.duration)
      : 0;
    const skillLaser=state.player?.skills.laser;
    const skillShake=skillLaser?.remaining>0 ? 1 : 0;
    const electricShake=Math.max(state.lasers.some(b=>b.kind==='ELECTRIC_BOSS'&&b.stage===3)?1.4:0,
      state.electricSweeps.some(s=>s.active)?1.8:0);
    const shake = Math.max(finalShake, camShake, skillShake, electricShake);
    const shakePhase = skillLaser?.remaining>0 ? skillLaser.elapsed : (finalBoss?.age || state.boss?.age || state.cameraShake.timer || 0);
    ctx.save();
    if (shake > 0) {
      ctx.translate(
        Math.round(Math.sin(shakePhase * 83) * shake),
        Math.round(Math.cos(shakePhase * 97) * shake)
      );
    }

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

    // 3. Render Tier 05 Boss Dash Warning Lane (Phase 1 & Phase 2) & Final Boss Rush Warning Lane
    if (state.boss && state.boss.tier === 5 && (state.boss.dashState === 'WARN' || state.boss.dashState === 'P2_WARN')) {
      renderTier5DashWarning(state.boss);
    }
    if (state.boss && state.boss.kind === 'FINAL_REVEALED' && state.boss.rushState === 'WARN') {
      renderFinalBossRushWarning(state.boss);
    }
    if (state.boss && state.boss.tier === 8 && state.boss.phase2Active) {
      renderTier8RaidOverlay(state.boss);
    }

    // 3b. Render Tier 06 Phase 2 Full-Map Random Explosion Warnings
    for (const wave of state.globalBlastWaves) {
      renderGlobalBlastWave(wave);
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
      if(!['CHAIN_HEAD','CHAIN_CURRENT'].includes(beam.kind))renderLaserBeam(beam);
    }

    if(state.player?.skills.laser.remaining>0) {
      const m=getPlayerSkillLaserOrigin();
      ctx.save();ctx.fillStyle='rgba(80,229,255,0.16)';
      ctx.fillRect(m.x,m.y-22,CONFIG.CANVAS_WIDTH-m.x,44);ctx.restore();
      renderLaserBeam({kind:'PLAYER_SKILL',stage:3,color:'Cyan',scale:2,widthMultiplier:32/24,
        ox:m.x,oy:m.y,angle:0,length:CONFIG.CANVAS_WIDTH-m.x,followBossMuzzleIndex:null,followEscortId:null,followEnemyId:'player'});
      ctx.save();
      ctx.fillStyle='rgba(184,250,255,0.65)';
      ctx.beginPath();ctx.moveTo(m.x,m.y-19);ctx.lineTo(m.x+26,m.y);ctx.lineTo(m.x,m.y+19);ctx.closePath();ctx.fill();
      ctx.fillStyle='#a8f7ff';
      const length=CONFIG.CANVAS_WIDTH-m.x;
      for(let i=0;i<6;i++) {
        const x=m.x+(state.player.skills.laser.elapsed*1200+i*190)%Math.max(1,length);
        ctx.fillRect(Math.round(x),m.y-20,12,2);ctx.fillRect(Math.round(x),m.y+18,12,2);
      }
      ctx.restore();
    }

    renderElectricVolleys();
    renderElectricBossField();
    renderElectricSweeps();
    renderEmpWaves();

    if(state.player?.stunRemaining>0) {
      const p=state.player;
      ctx.save();ctx.fillStyle='#8df4ff';ctx.font='bold 12px monospace';ctx.textAlign='center';
      ctx.fillText(p.electrocutionRemaining>0?'감전':'STUN',Math.round(p.x),Math.round(p.y-38));
      ctx.fillRect(Math.round(p.x-18),Math.round(p.y-32),36*Math.min(1,p.stunRemaining/0.5),3);
      ctx.restore();
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
      if (e.isTier8Phase2Raider && e.isWeakRaider) {
        ctx.save(); ctx.fillStyle='#ffe366'; ctx.font='bold 12px monospace'; ctx.textAlign='center';
        ctx.fillText('Lv1',Math.round(e.x),Math.round(e.y-32)); ctx.restore();
      }
      if (!e.entering && !e.retreating && !e.isTier8Phase2Raider && e.fireCooldown < 0.32) {
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

    // 9b. Render Tier 07 Phase 2 Green Silhouette Afterimages
    for (const af of state.afterimages) {
      const alpha = Math.max(0, Math.min(1, (af.timer / af.maxTimer) * 0.72));
      drawTintedSprite(af.path, af.x, af.y, af.size, af.scale, af.rotation ?? -Math.PI / 2, af.tintColor || '#39ff6a', alpha);
    }

    // 10. Render Active Boss (and Tier 06 4-wing missile pod status indicators)
    if (state.boss) {
      const b = state.boss;
      const hiddenOffscreen = b.tier === 5 && ['OFFSCREEN', 'P2_WARN', 'P2_WAIT'].includes(b.dashState);
      if(b.kind==='CHAIN_BOSS') {
        renderChainBoss(b);
        for(const beam of state.lasers)if(['CHAIN_HEAD','CHAIN_CURRENT'].includes(beam.kind))renderLaserBeam(beam);
      }
      if (!hiddenOffscreen && b.kind!=='CHAIN_BOSS') {
        ctx.save();
        if (b.kind === 'FINAL_REVEALED' && b.entering) {
          ctx.globalAlpha = Math.max(0.25, 1.0 - b.revealTimer);
        }
        drawRotatedSprite(
          b.path,
          b.x,
          b.y,
          b.spec.size,
          b.scale,
          b.rotation ?? -Math.PI / 2,
          b.hitFlash > 0
        );
        ctx.restore();
      }

      if (b.tier===8 && b.phase2Active) {
        const bounds=getRotatedBounds(b.x,b.y,b.spec,false,b.scale);
        ctx.save();ctx.strokeStyle='#75cfff';ctx.lineWidth=2;
        ctx.strokeRect(bounds.left-6,bounds.top-6,bounds.width+12,bounds.height+12);
        ctx.fillStyle='#a6e5ff';ctx.font='bold 12px monospace';ctx.textAlign='center';
        ctx.fillText('SHIELD',Math.round(b.x),Math.round(bounds.top-14));ctx.restore();
      }

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

      if (state.debugShowHitboxes && !hiddenOffscreen) {
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
      if(p.skills.shield.remaining>0) {
        const bounds=getRotatedBounds(p.x,p.y,p.spec,true,p.scale);
        ctx.save();ctx.strokeStyle='#8dcaff';ctx.fillStyle='rgba(75,150,255,0.12)';ctx.lineWidth=3;
        ctx.beginPath();ctx.ellipse(p.x,p.y,bounds.width/2+12,bounds.height/2+12,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle='#c7e8ff';ctx.font='bold 12px monospace';ctx.textAlign='center';
        ctx.fillText(`${Math.ceil(p.skills.shield.remaining)}s`,p.x,p.y-bounds.height/2-20);ctx.restore();
      }
      if(p.electrocutionRemaining>0) {
        ctx.save();ctx.fillStyle=p.electrocutionColor==='Red'?'#ff9bad':'#9ed7ff';
        const phase=Math.floor(p.electrocutionRemaining*24);
        for(let i=0;i<8;i++) {
          const angle=i*Math.PI/4+phase*0.15;
          const x=Math.round(p.x+Math.cos(angle)*34),y=Math.round(p.y+Math.sin(angle)*30);
          ctx.fillRect(x,y,6,3);ctx.fillRect(x+3,y-4,3,6);ctx.fillRect(x+3,y-5,7,3);
        }
        ctx.restore();
      }
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

    if (state.boss?.tier === 8 && state.boss.p2FlashTimer > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(195, 234, 255, ${0.16 * state.boss.p2FlashTimer / 0.18})`;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      ctx.restore();
    }
    if(state.boss?.electricFlashTimer>0) {
      ctx.save();ctx.fillStyle=`rgba(180,248,255,${0.22*state.boss.electricFlashTimer/0.20})`;
      ctx.fillRect(0,0,CONFIG.CANVAS_WIDTH,CONFIG.CANVAS_HEIGHT);ctx.restore();
    }
    if(state.player?.skills.laser.flashTimer>0) {
      ctx.save();ctx.fillStyle=`rgba(195,250,255,${0.12*state.player.skills.laser.flashTimer/0.14})`;
      ctx.fillRect(0,0,CONFIG.CANVAS_WIDTH,CONFIG.CANVAS_HEIGHT);ctx.restore();
    }
    renderEmpScreenEffect();
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

  const laserStripCache = new Map();
  function getLaserStrip(color, stage, length, scale) {
    const width = Math.max(1, Math.ceil(length));
    const capWidth = Math.min(width, Math.max(1, Math.round(9 * scale)));
    const key = `${color}:${stage}:${width}:${capWidth}`;
    if (laserStripCache.has(key)) {
      const value = laserStripCache.get(key);
      laserStripCache.delete(key); laserStripCache.set(key, value);
      return value;
    }
    const body = assets.images.get(`lasers/${color}/Laser_${color}_Stage_0${stage}_Body.png`);
    const tip = assets.images.get(`lasers/${color}/Laser_${color}_Stage_0${stage}_Tip.png`);
    if (!body || !tip) return null;
    const strip = document.createElement('canvas'); strip.width = width; strip.height = 32;
    const stripCtx = strip.getContext('2d'); stripCtx.imageSmoothingEnabled = false;
    const join = width - capWidth;
    // Body and cap share the same native pixel rows. 1px overlap removes rotated/fractional seams.
    stripCtx.drawImage(body, 0, 0, Math.min(width, join + 1), 32);
    stripCtx.drawImage(tip, 0, 0, 9, 32, join, 0, capWidth, 32);
    laserStripCache.set(key, strip);
    if (laserStripCache.size > 48) laserStripCache.delete(laserStripCache.keys().next().value);
    return strip;
  }

  function renderLaserBeam(beam) {
    if(['ELECTRIC_ENEMY','ELECTRIC_BOSS','EMP_CURRENT','CHAIN_CURRENT'].includes(beam.kind)) {
      ctx.save();ctx.imageSmoothingEnabled=false;
      if(beam.stage<3) {
        const progress=Math.min(1,beam.elapsed/(beam.stage1Time+beam.stage2Time));
        if(['ELECTRIC_BOSS','ELECTRIC_ENEMY','EMP_CURRENT','CHAIN_CURRENT'].includes(beam.kind)) {
          // Telegraph the exact live ray from the moving muzzle; no damage during charge.
          const length=beam.length ?? computeRayDistanceToScreenEdge(beam.ox,beam.oy,beam.angle);
          const half=getLaserStageThicknessPx(beam,3)/2;
          const warningHalf=beam.kind==='CHAIN_CURRENT'?7:half;
          ctx.save();ctx.translate(beam.ox,beam.oy);ctx.rotate(beam.angle);
          ctx.fillStyle=`rgba(255,75,110,${0.10+progress*0.10})`;
          ctx.fillRect(0,-warningHalf,length,warningHalf*2);
          ctx.strokeStyle=`rgba(255,115,140,${0.45+progress*0.35})`;ctx.lineWidth=1;
          ctx.strokeRect(0,-warningHalf,length,warningHalf*2);
          ctx.fillStyle=beam.kind==='CHAIN_CURRENT'?'#ffdae0':'#ffb4c4';ctx.fillRect(0,-0.5,length,1);
          ctx.restore();
        }
        ctx.strokeStyle=beam.kind==='CHAIN_CURRENT'?'#ff525b':beam.kind==='EMP_CURRENT'?'#cc8bff':'#74f4ff';ctx.lineWidth=2;ctx.beginPath();
        ctx.arc(beam.ox,beam.oy,(beam.kind==='CHAIN_CURRENT'?22:16)-(beam.kind==='CHAIN_CURRENT'?14:10)*progress,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='#d1ffff';ctx.fillRect(beam.ox-2,beam.oy-2,4,4);
      } else {
        const red=beam.kind==='CHAIN_CURRENT';
        const sheet=assets.images.get(red?'effects/Electric_Laser/Electric_Laser_Red_Spritesheet.png':'effects/Electric_Laser/Electric_Laser_Spritesheet.png');
        const length=beam.length ?? computeRayDistanceToScreenEdge(beam.ox,beam.oy,beam.angle);
        ctx.translate(beam.ox,beam.oy);ctx.rotate(beam.angle);
        const height=red?10:beam.kind==='EMP_CURRENT'?(beam.empLarge?56:20):46;
        if(beam.kind==='EMP_CURRENT') ctx.filter='hue-rotate(95deg)';
        if(sheet) ctx.drawImage(sheet,0,Math.floor(beam.elapsed*12.5)%7*(red?165:152),red?1362:1254,red?165:152,0,-height/2,length,height);
      }
      ctx.restore();return;
    }
    const st = beam.stage;
    const color = beam.color;
    const scale = beam.scale || CONFIG.LASER_SCALE;
    const widthMult = beam.widthMultiplier || 1;
    const totalLen = beam.length ?? computeRayDistanceToScreenEdge(beam.ox, beam.oy, beam.angle);

    const strip = getLaserStrip(color, st, totalLen, scale);
    const canvasH = 32 * scale * widthMult;
    const halfH = 16 * scale * widthMult;

    ctx.save();
    ctx.translate(Math.round(beam.ox), Math.round(beam.oy));
    ctx.rotate(beam.angle);
    // Keep vertical pixel row shading right-side-up when shooting left
    if (Math.cos(beam.angle) < 0) {
      ctx.scale(1, -1);
    }

    // Show the eventual Stage 3 damaging width before ordinary final-body or Phase 2 lasers activate.
    if (['FINAL_PRIMARY', 'TIER7_PHASE2_LASER','CHAIN_HEAD'].includes(beam.kind) && st < 3) {
      const half = getLaserStageThicknessPx(beam, 3) / 2;
      if (beam.kind === 'TIER7_PHASE2_LASER') {
        ctx.fillStyle = st === 2 ? 'rgba(57, 255, 106, 0.22)' : 'rgba(57, 255, 106, 0.13)';
        ctx.strokeStyle = '#39ff6a';
      } else {
        ctx.fillStyle = 'rgba(255, 110, 170, 0.12)';
        ctx.strokeStyle = '#ffb9e1';
      }
      ctx.fillRect(0, -half, totalLen, half * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, -half, totalLen, half * 2);
    }

    // Subtle aim pulse during Stage 1/2 charge warnings
    if (st < 3) {
      ctx.globalAlpha = st === 1 ? 0.85 : 0.95;
    }

    if (strip) {
      ctx.save();
      ctx.translate(totalLen,0);ctx.scale(-1,1);
      ctx.drawImage(strip, 0, -halfH, totalLen, canvasH);
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
    if (
      beam.kind !== 'FINAL_VOLLEY' &&
      beam.followBossMuzzleIndex === null &&
      beam.followEscortId === null &&
      beam.followEnemyId === null
    ) {
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
    if (boss.dashState === 'P2_WARN') {
      const startX = boss.p2WarnStartX ?? boss.x;
      const startY = boss.p2WarnStartY ?? boss.y;
      const angle = boss.p2DashAngle ?? Math.PI;
      const len = 1850;
      const halfW = 38;
      const blink = Math.floor((boss.dashTimer || 0) * 18) % 2 === 0;

      ctx.save();
      ctx.translate(Math.round(startX), Math.round(startY));
      ctx.rotate(angle);
      ctx.fillStyle = blink ? 'rgba(255, 82, 107, 0.22)' : 'rgba(255, 82, 107, 0.14)';
      ctx.fillRect(0, -halfW, len, halfW * 2);
      ctx.strokeStyle = blink ? '#ffe366' : '#ff526b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -halfW);
      ctx.lineTo(len, -halfW);
      ctx.moveTo(0, halfW);
      ctx.lineTo(len, halfW);
      ctx.stroke();

      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#ffe366';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `<<< OVERDRIVE OMNIDIRECTIONAL DASH (${(boss.p2DashesCompleted || 0) + 1}/${boss.p2TotalDashes}) <<<`,
        CONFIG.CANVAS_WIDTH / 2,
        96
      );
      ctx.restore();
      return;
    }

    const laneY = Math.round(boss.dashY);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 82, 107, 0.16)';
    ctx.fillRect(0, laneY - 38, CONFIG.CANVAS_WIDTH, 76);
    ctx.strokeStyle = '#ff526b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, laneY - 38);
    ctx.lineTo(CONFIG.CANVAS_WIDTH, laneY - 38);
    ctx.moveTo(0, laneY + 38);
    ctx.lineTo(CONFIG.CANVAS_WIDTH, laneY + 38);
    ctx.stroke();
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

  function renderGlobalBlastWave(wave) {
    const progress = 1 - Math.max(0, wave.timer / wave.maxTimer);
    const nearBlast = wave.timer <= 0.35;
    const blink = nearBlast && Math.floor(wave.timer * 24) % 2 === 0;

    const circles = wave.blasts || wave.circles || [];
    ctx.save();
    for (const c of circles) {
      const cx = Math.round(c.x);
      const cy = Math.round(c.y);
      ctx.fillStyle = nearBlast
        ? (blink ? 'rgba(255, 82, 107, 0.28)' : 'rgba(255, 140, 50, 0.20)')
        : 'rgba(255, 82, 107, 0.14)';
      ctx.strokeStyle = nearBlast
        ? (blink ? '#ffe366' : '#ff526b')
        : 'rgba(255, 92, 115, 0.88)';
      ctx.lineWidth = nearBlast ? 2.5 : 2;
      ctx.beginPath();
      ctx.arc(cx, cy, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner expanding countdown ring showing exact detonation timing
      ctx.strokeStyle = 'rgba(255, 227, 102, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(4, c.radius * progress), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Subtle safe pocket beacon rings so player can read guaranteed escape zones
    if (wave.safeZones) {
      for (const sz of wave.safeZones) {
        ctx.strokeStyle = 'rgba(168, 236, 70, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.arc(Math.round(sz.x), Math.round(sz.y), 26, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function renderTier8RaidOverlay(boss) {
    ctx.save();
    ctx.fillStyle='#ffe366'; ctx.font='bold 14px monospace';
    ctx.fillText(`DESTROY Lv1 TO OPEN A PATH  [${boss.p2WaveCount}/${boss.p2TotalWaves}]`,24,52);
    if (boss.p2FormationPending && boss.p2FormationTimer===0) {
      for(const unit of state.enemies.filter(e=>e.isTier8Phase2Raider)) {
        const bounds=getRotatedBounds(unit.x,unit.y,unit.spec,false,unit.scale);
        ctx.fillStyle=unit.isWeakRaider?'rgba(255,220,80,0.09)':'rgba(255,70,90,0.09)';
        ctx.fillRect(0,bounds.top,unit.x,bounds.height);
      }
    }
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

  function drawTintedSprite(relPath, cx, cy, size, scale, angleRad, tintColor, alpha = 0.65) {
    const img = assets.images.get(relPath);
    const [w, h] = size;
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(cx), Math.round(cy));
    if (angleRad !== 0) {
      ctx.rotate(angleRad);
    }

    if (img && flashCtx && typeof flashCtx.clearRect === 'function') {
      if (flashCanvas.width < dw) flashCanvas.width = dw;
      if (flashCanvas.height < dh) flashCanvas.height = dh;
      flashCtx.imageSmoothingEnabled = false;
      flashCtx.globalCompositeOperation = 'source-over';
      flashCtx.clearRect(0, 0, dw, dh);
      flashCtx.drawImage(img, 0, 0, dw, dh);
      flashCtx.globalCompositeOperation = 'source-in';
      flashCtx.fillStyle = tintColor;
      flashCtx.fillRect(0, 0, dw, dh);
      ctx.drawImage(flashCanvas, 0, 0, dw, dh, Math.round(-dw / 2), Math.round(-dh / 2), dw, dh);
    } else {
      ctx.fillStyle = tintColor;
      ctx.fillRect(Math.round(-dw / 2), Math.round(-dh / 2), dw, dh);
    }
    ctx.restore();
  }

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
    updatePlayerSkillUI();
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
        stageEl.textContent = `TIER ${String(getStageNumber(state.currentTier)).padStart(2,'0')} WAVE`;
      } else if (state.phase === 'TEST') {
        stageEl.textContent = `TIER ${String(getStageNumber(state.currentTier)).padStart(2,'0')} PATTERN TEST`;
      } else if (state.phase === 'BOSS') {
        stageEl.textContent = state.boss?.kind==='CHAIN_BOSS' ? (state.boss.campaign?'TIER 09 · CHAIN BOSS':'CHAIN BOSS · PROTOTYPE') : `TIER ${String(getStageNumber(state.currentTier)).padStart(2,'0')} BOSS`;
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
    const skillBtn=document.getElementById('btn-cycle-skills');
    if(skillBtn && state.player) skillBtn.textContent=`스킬 강화: +${state.player.skillLevel}`;
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
      `선택 강화: 체력 +${p ? p.vitalityLevel : 0} / 장비 Lv${p ? p.weaponLevel : 0} / 기동성 +${p ? p.mobilityLevel : 0} / 스킬 +${p ? p.skillLevel : 0}`,
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
    showOverlay('GAME OVER', '기체가 파괴되었습니다. N 키 또는 재시작 버튼으로 다시 도전하세요.', false);
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
    const skills=document.getElementById('player-skills');
    if(skills) {skills.style.left=`${120*scale}px`;skills.style.top=`${12*scale}px`;skills.style.transform=`scale(${scale})`;}
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

    // Reward Selection Keys (1, 2, 3, 4) only when reward modal is active
    if (state.mode === 'REWARD') {
      if (!e.repeat) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
          applyRewardChoice('vitality');
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
          applyRewardChoice('equipment');
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
          applyRewardChoice('mobility');
        } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
          applyRewardChoice('skills');
        } else if(e.code==='Enter') {
          applyRewardChoice('continue');
        }
      }
      if (e.code === 'KeyN') {
        resetGame();
      }
      return;
    }

    if(!e.repeat && state.mode==='PLAYING') {
      const skillId={KeyE:'laser',KeyR:'heal',KeyT:'shield'}[e.code];
      if(skillId) {e.preventDefault();usePlayerSkill(skillId);return;}
    }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      togglePause();
    } else if (e.code === 'KeyN') {
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

  document.getElementById('reward-continue')?.addEventListener('click',()=>applyRewardChoice('continue'));

  document.getElementById('btn-pause')?.addEventListener('click', togglePause);
  document.getElementById('btn-restart')?.addEventListener('click', resetGame);
  document.getElementById('btn-overlay-resume')?.addEventListener('click', togglePause);
  document.getElementById('btn-overlay-restart')?.addEventListener('click', resetGame);
  document.getElementById('btn-debug-toggle')?.addEventListener('click', () => {
    document.getElementById('debug-panel')?.classList.toggle('hidden');
    fitCanvasToViewport();
  });

  for(const id of ['laser','heal','shield']) {
    document.getElementById(`skill-${id}`)?.addEventListener('click',()=>usePlayerSkill(id));
  }

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
      state.cumulativeWaveTime = getStageNumber(tier) * CONFIG.WAVE_DURATION;
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
    } else if(action==='trigger-chain-p2') {
      hideRewardModal();hideOverlay();state.mode='PLAYING';
      const b=state.boss?.kind==='CHAIN_BOSS'&&!state.boss.phase2Triggered?state.boss:startChainBoss({combat:true,campaign:true,skipEntrance:true});
      b.combat=true;b.entering=false;b.pathState='ROAM';state.phase='BOSS';b.hp=b.maxHp*0.3;
      beginChainPhase2(b);updateHudBadges();
    } else if (['trigger-b5-p2', 'trigger-b6-p2', 'trigger-b7-p2', 'trigger-b8-p2', 'trigger-electric-p2'].includes(action)) {
      const tierMap = {
        'trigger-b5-p2': 5,
        'trigger-b6-p2': 6,
        'trigger-b7-p2': 7,
        'trigger-b8-p2': 8,
        'trigger-electric-p2': 9
      };
      const tier = tierMap[action];
      hideRewardModal();
      hideOverlay();
      state.mode = 'PLAYING';
      state.currentTier = tier;
      state.cumulativeWaveTime = getStageNumber(tier) * CONFIG.WAVE_DURATION;
      startTierBoss(tier);
      state.boss.entering = false;
      state.boss.x = state.boss.homeX;
      const threshold = CONFIG.BOSS_PHASE2_THRESHOLDS[tier] || 0.25;
      state.boss.hp = Math.max(1, Math.floor(state.boss.maxHp * threshold));
      checkAndTriggerBossPhase2(state.boss);
      updateHudBadges();
    } else if (action === 'open-reward') {
      const stage=getStageNumber(state.currentTier);
      const evenTier = isEvenRewardTier(stage) ? stage : 2;
      openRewardSelection(evenTier);
    } else if (action === 'cycle-weapon') {
      if (state.player) {
        state.player.weaponLevel = (state.player.weaponLevel + 1) % 5;
        updateHudBadges();
      }
    } else if (action === 'cycle-skills') {
      if(state.player) {state.player.skillLevel=(state.player.skillLevel+1)%5;updatePlayerSkillUI();updateHudBadges();}
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
        checkAndTriggerBossPhase2(state.boss);
        updateHudBadges();
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
    const t = Math.max(1, Math.min(CONFIG.TOTAL_TIERS, tier));
    state.mode = 'PLAYING';
    hideOverlay();
    hideRewardModal();
    clearAllCombatHazards();
    state.boss = null;
    state.currentTier = t;
    state.phase = 'WAVE';
    state.tierWaveElapsed = 0.0;
    state.cumulativeWaveTime = (getStageNumber(t) - 1) * CONFIG.WAVE_DURATION;
    state.enemySpawnTimer = 0.25;
    if(t===11)startChainBoss({combat:false,campaign:true});
    updateHudBadges();
  }

  // Expose deterministic inspection & step API for automated verification
  window.__GAME_DEBUG__ = {
    CONFIG,
    getStageNumber,
    getPatternTier,
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
    getLaserStrip,
    getEnemyMaxHp,
    getLaserStageThicknessPx,
    computeEnemyFireInterval,
    getRotatedBounds,
    getWorldMuzzles,
    getFormattedTimerText,
    resetGame,
    jumpToTierWave,
    startTierBoss,
    startChainBoss,
    beginChainPhase2,
    prepareChainRush,
    isChainCorridorPart,
    previewChainCorridors,
    sampleChainBody,
    getChainBladeCapsules,
    getChainSawPoses,
    fireChainLaser,
    startShadowBoss,
    startRevealedFinalBoss,
    startTier8UltimateLasers,
    scheduleTier8Dasher,
    prepareTier6SalvoTargets,
    fireSingleTier6WingMissile,
    fireBossPrimaryLaser,
    fireTier5DashSideBullets,
    checkAndTriggerBossPhase2,
    enterTier5Phase2,
    prepareTier5Phase2Dash,
    enterTier6Phase2,
    triggerTier6GlobalExplosionWave,
    detonateGlobalBlastWave,
    enterTier7Phase2,
    performTier7Phase2BlinkAndLaser,
    getFacingBossMuzzles,
    getTier8Phase2LaneCenterY,
    enterTier8Phase2,
    prepareTier8RaidWave,
    finishTier8Phase2,
    spawnElectricVolley,
    updateElectricVolleys,
    renderElectricVolleys,
    firePurpleCoreCurrent,
    emitEmpWave,
    applyEmpScramble,
    updateEmpWaves,
    renderEmpWaves,
    renderEmpScreenEffect,
    spawnElectricSweep,
    updateElectricSweepScheduler,
    updateElectricSweeps,
    renderElectricSweeps,
    startElectricBossField,
    updateElectricBossField,
    renderElectricBossField,
    startElectricBossLasers,
    getElectricBossLaserMuzzles,
    fireElectricEnemyLaser,
    getElectricLinks,
    getElectricOrbCharge,
    fireEnemyPattern,
    firePlayerWeapon,
    usePlayerSkill,
    getSkillStats,
    canChooseReward,
    upgradePlayerSkills,
    applyPlayerSkillLaserTick,
    getPlayerSkillLaserOrigin,
    advancePlayerSkills,
    damagePlayer,
    updatePlayerSkillUI,
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
    if(params.get('skills')) state.player.skillLevel=Math.max(0,Math.min(4,Number(params.get('skills')) || 0));
    if (params.get('wp')) {
      state.player.weaponLevel = Math.max(0, Math.min(4, Number(params.get('wp')) || 0));
    }
    if (params.get('mob')) {
      state.player.mobilityLevel = Math.max(0, Math.min(4, Number(params.get('mob')) || 0));
      syncPlayerUpgradeStats(state.player);
    }
    if(params.get('chainBoss')==='1') {
      const chain=startChainBoss({combat:params.get('wave')!=='1',campaign:true,skipEntrance:params.get('p2')==='1'});
      if(params.get('p2')==='1' && chain.combat){chain.hp=chain.maxHp*0.3;beginChainPhase2(chain);}
      if(params.get('preview')==='lanes' && chain.phase2Triggered)previewChainCorridors(chain);
      const secs=params.get('preview')==='lanes'?0:Math.max(0,Math.min(30,Number(params.get('simSeconds')) || 0));
      for(let i=0;i<secs*25;i++)updateGame(0.04);
    } else if(params.get('empDemo')==='1') {
      state.phase='TEST';state.currentTier=10;
      for(let i=1;i<=4;i++) {const e=spawnWaveEnemy(10,{enemyIdx:i});e.entering=false;e.x=e.homeX=1060;e.y=e.homeY=100+i*115;e.fireCooldown=0.4+i*0.1;}
    } else if (params.get('electricDemo') === '1') {
      state.phase='TEST';state.currentTier=9;
      for(let i=1;i<=4;i++) {
        const e=spawnWaveEnemy(9,{enemyIdx:i});
        e.entering=false;e.x=e.homeX=1060;e.y=e.homeY=100+i*115;e.fireCooldown=0.2+i*0.1;
      }
      const secs=Math.max(0,Math.min(10,Number(params.get('simSeconds')) || 0));
      for(let i=0;i<secs*25;i++) updateGame(0.04);
    } else if (params.get('reward')) {
      const rt = Number(params.get('reward')) || 2;
      openRewardSelection(rt);
    } else if (params.get('phase') === 'boss') {
      const t = getPatternTier(Number(params.get('tier')) || 1);
      state.currentTier = t;
      state.cumulativeWaveTime = getStageNumber(t) * CONFIG.WAVE_DURATION;
      startTierBoss(t);
      state.boss.entering = false;
      if(state.boss.kind!=='CHAIN_BOSS')state.boss.x = state.boss.homeX;
      if(params.get('emp')==='1' && t===10) state.boss.empCooldown=0.25;
      if(params.get('sweeps')==='1' && t===9) {state.boss.hp=state.boss.maxHp*0.60;state.boss.attackTimer=100;}
      if(params.get('electricLaser')==='1' && t===9) startElectricBossLasers(state.boss);
      if (params.get('p2') === '1' && CONFIG.BOSS_PHASE2_THRESHOLDS[t]) {
        state.boss.hp = Math.max(1, Math.floor(state.boss.maxHp * CONFIG.BOSS_PHASE2_THRESHOLDS[t]));
        checkAndTriggerBossPhase2(state.boss);
      }
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

    updateHudBadges();
    if(params.get('shock')==='1') {state.player.invulnTimer=0;damagePlayer(1,'ELECTRIC TEST',0.3,'Cyan');updateHudBadges();}
    if (params.get('paused') === '1') togglePause();
    fitCanvasToViewport();
    renderGame();
    requestAnimationFrame(rafLoop);
  });
})();
