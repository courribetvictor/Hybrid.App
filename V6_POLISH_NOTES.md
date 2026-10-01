# Hybrid.App V6 — Polish & Immersion

V6 is intentionally focused on product quality rather than feature count.

## Interaction system
- New `SensoryPressable`: spring press feedback + configurable haptics.
- Unified `useSensoryFeedback()` for tap / selection / success / reward / level-up / error.
- Sounds remain reserved for meaningful moments; ordinary navigation is mainly haptic.
- Reduced-motion preference is respected by the new animation system.

## Visual polish
- Short cold-launch Hybrid curtain (about 1 second, much shorter in reduced-motion mode).
- Stack transitions and bottom-sheet-style modal transitions.
- Floating rounded tab bar with tactile feedback and animated focus treatment.
- Progressive reveal on Today and Arena content.
- Animated Hybrid Score count-up.
- Readiness rendered as a ring rather than a static number.
- Grade badge receives a subtle breathing glow.
- Skills radar and legends reveal smoothly.
- Leaderboard rows enter progressively.
- Feed loading now uses skeleton cards instead of a blank area.
- Activity cards are directly tappable and open the Activity Story/details.

## Reward experience
- Reward modal rebuilt with halo, stars, coordinated haptics and sound.
- Reward effects automatically simplify when reduced motion is enabled.
- Sensory settings now contain a safe reward preview that changes no XP.
- Activity save success/error is routed through the same sensory engine.

## Reliability / collaboration
- App/package version bumped to 0.6.0.
- `.gitignore` added to keep secrets, `.env`, Expo cache and dependencies out of Git.
- `npm run typecheck` and `npm run doctor` scripts added.
- GitHub pull-request checklist added under `.github/`.

## Important
V6 does not add a database migration. It builds on the V5 schema.
A full Expo compile still requires dependencies to be installed locally (`npm install`).
