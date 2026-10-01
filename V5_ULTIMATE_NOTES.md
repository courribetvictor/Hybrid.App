# Hybrid.App V5 Ultimate — build notes

V5 focuses on four pillars: sensory polish, athlete identity/classes, credible competition, and ethical monetization.

## New V5 systems

- Athlete classes: Powerhouse, Runner, Velocity, Racket Ace, Team Engine, Fighter, Explorer, Hybrid.
- Class bonuses affect XP/recommendations/cosmetics only. They never inflate official performance or Hybrid Score.
- XP levels with mission claiming and local offline persistence.
- Reward celebration overlay with animation, haptic success feedback and short locally bundled sound.
- Automatic grade-up celebration gate.
- Sensory settings: haptics, sounds, reduced-motion preference.
- `expo-audio` added (SDK 57 recommended version `~57.0.5`) for short reward sounds.
- Redesigned Hybrid Pro paywall: 14-day trial positioning, monthly/annual option, Free feature reassurance, no ads.
- Indicative pricing in UI: €5.99 monthly / €39.99 yearly. Store products are NOT connected yet.
- Performance leaderboards split from federation/official-level rankings.
- Verified performance record architecture for run/swim/cycling/strength metrics.
- Official sport credential submission flow, with pending/verified model (e.g. National 2 badminton).
- Arena shortcut to official performance rankings.
- Profile shortcuts for Athlete Class, verified sport level and sensory preferences.

## Monetization principles used

Hybrid Free remains useful: multisport tracking, Hybrid Score/grades, core live/social/classification and base coach remain accessible. Pro is intended to monetize depth: advanced coach usage, long-horizon analytics, adaptive plans, Live+/Activity Story depth, premium leagues/challenges and cosmetics.

V5 intentionally avoids pay-to-win ranking multipliers, random paid rewards, hidden trial behavior, or ads.

## What still needs external setup

- App Store / Google Play subscription product IDs or RevenueCat project.
- Server webhook to make subscription state authoritative.
- Admin/federation verification workflow for sport credentials.
- Trusted integrations (Garmin/Apple Health/etc.) to insert `verified=true` performance records.
- Production server-side XP/reward verification; client AsyncStorage is currently an offline/prototype cache.

## Database

Apply `Hybrid.App.V5-Ultimate.sql` after all earlier migrations in a DEVELOPMENT Supabase project first.

## Testing

A true Expo build still requires installing dependencies locally (`npm install` / `npx expo install`) and testing on a device. V5 adds `expo-audio` and four bundled WAV sound assets.
