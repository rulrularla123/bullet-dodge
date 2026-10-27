import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const game = await fs.readFile(path.join(root, 'game.js'), 'utf8');

// Run only the existing preload list, not the game's boot or update loop.
// This keeps deployment assets synchronized with future game changes.
const names = ['SPACE_UNIQUE_LAYOUT', 'BULLET_COLORS', 'BULLET_SHAPES', 'LASER_COLORS', 'BOSS_BAR_IDS'];
const declarations = names.map(name => {
  const match = game.match(new RegExp(`const ${name} = ([\\s\\S]*?);\\r?\\n`));
  if (!match) throw new Error(`Cannot locate ${name}. Update the deployment collector for the new game structure.`);
  return `const ${name} = ${match[1]};`;
});
const preload = game.match(/async function preloadAllAssets\(\) \{[\s\S]*?\r?\n  \}/);
if (!preload) throw new Error('Cannot locate preloadAllAssets(). No deployment was prepared.');

const requested = new Set();
const images = new Map();
const context = vm.createContext({
  assets: { images, ready: false },
  loadImage: async rel => {
    requested.add(rel);
    images.set(rel, true);
  },
  document: { getElementById: () => ({ classList: { add() {} } }) }
});
vm.runInContext(`${declarations.join('\n')}\n${preload[0]}`, context, { timeout: 1000 });
await vm.runInContext('preloadAllAssets()', context, { timeout: 1000 });
const parts = vm.runInContext('SPACE_UNIQUE_LAYOUT.length', context);
for (let i = 1; i <= parts; i++) {
  requested.add(`backgrounds/Space_Unique/rendered/Part_${String(i).padStart(2, '0')}.svg`);
}

const files = ['index.html', 'style.css', 'game.js', ...[...requested].sort().map(rel => `assets/${rel}`)];
// Validate all input paths before replacing the previous generated package.
for (const rel of files) {
  const source = path.resolve(root, rel);
  if (!source.startsWith(`${root}${path.sep}`)) throw new Error(`Invalid asset path: ${rel}`);
  const stat = await fs.stat(source);
  if (!stat.isFile()) throw new Error(`Missing deployment file: ${rel}`);
}
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
let bytes = 0;
for (const rel of files) {
  const source = path.join(root, rel);
  const target = path.join(output, rel);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
  bytes += (await fs.stat(target)).size;
}
console.log(`Deployment ready: ${files.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MiB in dist/.`);
