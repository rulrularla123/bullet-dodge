# Game asset conventions

- New bosses must receive a dedicated health bar based on their sprite/core colors. Never reuse another boss's bar (including Final_Shadow) as a placeholder in the completed change.
- Preserve the original boss bar outline, BOSS text, segmented health fill and pixel layout. Add boss-colored decoration only in transparent space around it; do not redesign or thicken the bar. Original templates live in `assets/ui/boss_bars/templates/`.
- All boss health bars use 64×32 native dimensions and the same fill rectangle: x=5, y=16, width=54, height=2. Preserve the game's 4× display scale.
- Ordinary round/diamond bullets use `assets/bullets/Colors/<Color>/Orb.png`; straight bullets use `Needle.png` in that color directory. Use the current compact neon grids: 5×5 round and 3×9 upright needle (stored as 9×3 facing right). Piercing crescent weapons and continuous laser effects are separate assets.
- `scripts/build-pixel-assets.mjs` compiles the user sprite, color catalog, and per-boss bars. Extend its boss coverage/decoration when adding a boss. Maintain internal pattern IDs separately from displayed stage order.
- After each game change, run appropriate checks and visibly open a paused localhost test for the user. Do not deploy unless requested.

- The chain boss remains one continuous body. At 40% HP, it retreats invulnerably at normal speed, grows only after every segment is offscreen, and first re-enters from the front. Phase-two body corridors pass player attacks without HP damage; only the head is a damage target. Keep 42px spacing on straight rush corridors. After offscreen growth, sample by uniform travelled distance through offscreen turns so the tail never jumps between circle intersections.
- Phase-two in-arena body runs must be straight; keep turns and the spare neck joint offscreen. The head has vertical freedom with a reserve neck; only this articulated neck may bend during the new lunge/whip mechanics. Phase-two body sections still fire sparse bullets and electric rays while remaining immune to player attacks.
- Phase-two body shots must originate from actual laid corridor hull ports, excluding the spare neck. Keep an offscreen aiming buffer and smooth dash braking; the front head continuously bobs while attacking.

- Supply crates use the code-native 7×7 space cargo sprite, a once-per-kill 5% drop roll, and 33/33/33/1 reward bands. Supply upgrades pause and resume the same combat; never advance stages or clear hazards. Meteor scale is 4.5 (half the previous 9), with one thin, 1px silhouette-following red rim.

- Chain phase two performs five rushes (front first, all four edges covered, no immediate repeat), then returns with the final rush also braking smoothly. Alternating lunge/whip attacks articulate only the spare neck and preserve the laid corridors. Keep all five corridors connected with sufficient offscreen body length. Body bullet pairs: 0.8–1.2s, maximum 16 active; current starts: 1.6–2.2s with the existing warning.

- After corridor setup, the chain head periodically telegraphs a locked, short out-and-back lunge while remaining connected to its reserve neck. Keep charge harmless and retain warning/return time. Render thin chain current as a single full-length animated path, not scaled or tiled lightning strips.

- Front lunges retract using a damped recoil; whips settle on the same pinned spring chain without any turn-around route. Keep all spare neck links outside the screen during recoil and recovery. Finish by restoring the canonical front-neck pose, never preserve an accumulated IK fold. Whips use windup, fast lash, recoil, and a small travelling bend while the hidden pivot and rear corridors stay fixed.

- Whip motion uses neighboring torsional springs, strong angular inertia and lighter damping with fixed 42px links and 1/240s maximum physics steps. Drive only the hidden root; the free head must lag and recoil with visible curvature. Cover both top and bottom playfield edges, then restore the canonical pose.

- The front head patrol reaches y=76 and y=648, accelerating smoothly with smoothly filtered irregular 240–380px/s pace changes. Keep the phase-two threshold at 40%.

- Preserve the accepted whip shape while playing the active sweep in about 3 seconds; ease its clock back to normal speed before settling. Withdraw both attacks slowly from zero recoil velocity with a 340px/s cap, then decelerate at home. Smooth patrol speed toward random targets instead of stepping its speed.
