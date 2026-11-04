# Game asset conventions

- New bosses must receive a dedicated health bar based on their sprite/core colors. Never reuse another boss's bar (including Final_Shadow) as a placeholder in the completed change.
- Preserve the original boss bar outline, BOSS text, segmented health fill and pixel layout. Add boss-colored decoration only in transparent space around it; do not redesign or thicken the bar. Original templates live in `assets/ui/boss_bars/templates/`.
- All boss health bars use 64×32 native dimensions and the same fill rectangle: x=5, y=16, width=54, height=2. Preserve the game's 4× display scale.
- Ordinary round/diamond bullets use `assets/bullets/Colors/<Color>/Orb.png`; straight bullets use `Needle.png` in that color directory. Preserve the user's source pixel shapes. Piercing crescent weapons and continuous laser effects are separate assets.
- `scripts/build-pixel-assets.mjs` compiles the user sprite, color catalog, and per-boss bars. Extend its boss coverage/decoration when adding a boss. Maintain internal pattern IDs separately from displayed stage order.
- After each game change, run appropriate checks and visibly open a paused localhost test for the user. Do not deploy unless requested.

- The chain boss remains one continuous body. At 30% HP, it retreats invulnerably at normal speed, grows only after every segment is offscreen, and first re-enters from the front. Phase-two body corridors pass player attacks without HP damage; only the head is a damage target. Keep actual joint spacing fixed at 42px during curves and dashes.
- Phase-two in-arena body runs must be straight; keep turns and the spare neck joint offscreen. The head has vertical freedom with a straight reserve neck. Phase-two body sections still fire sparse bullets and electric rays while remaining immune to player attacks.
- Phase-two body shots must originate from actual laid corridor hull ports, excluding the spare neck. Keep an offscreen aiming buffer and smooth dash braking; the front head continuously bobs while attacking.
