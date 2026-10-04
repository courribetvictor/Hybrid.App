# Hybrid.App V9 — TRACK EVERYTHING

Version: **0.9.0**

V9 changes the role of Hybrid: the user can now **track with Hybrid**, **auto-sync a watch/app**, or **add an activity manually**.

## What is implemented in the project

### Hybrid Track
New `/modals/track` session UI:
- start / pause / resume / manual lap / finish;
- foreground GPS for relevant sports;
- live map, distance, time, pace and elevation gain;
- automatic distance splits;
- RPE and calorie estimate;
- local persistence of active sessions;
- interrupted-session recovery prompt;
- activity creation at finish.

### Sport-specific live trackers
The tracker changes by sport:
- **running/trail/walking/hiking**: GPS, pace, D+, splits, Ghost/Pacer groundwork;
- **cycling/outdoor endurance**: GPS, speed-oriented profile and route data;
- **swimming**: pool length + live lap counter;
- **strength**: quick sets with reps/load + session timer;
- **tennis/padel/badminton/table tennis/squash/pickleball**: live score + sets + timer;
- **boxing/combat**: rounds + timer;
- **climbing/bouldering**: attempts, successes and grade;
- **team sports**: timer/GPS profile plus match event markers;
- other catalog sports fall back to a safe smart chrono.

### Ghost & Pacer
For GPS sports V9 can:
- compare current elapsed time with a target pace;
- compare against the best historical pace found for the same sport;
- show seconds ahead/behind.

This is a first Ghost/Pacer implementation; route-matched ghosts can later use `personal_route_efforts_v9`.

### Hybrid Connect
Connections now presents watch/health sources as the V9 Auto Sync layer:
- Garmin Connect
- Apple Health / Apple Watch
- Health Connect
- Huawei Health
- Strava
- Polar Flow
- Suunto
- COROS
- Spotify / Apple Music remain available for music context.

Real provider activation still requires the provider developer account/OAuth/native entitlement. **No provider secret is stored in the mobile app.**

### Anti-duplicate model
The existing idempotent import path remains, and V9 adds database groundwork to link multiple external provider IDs to one canonical activity. This matters for flows like Garmin → Strava → Hybrid.

### “Native feel” on web
V9 injects web-only interaction rules to reduce the browser-like behavior the user noticed:
- disables accidental text selection and image dragging;
- removes overscroll/bounce where supported;
- keeps inputs selectable;
- improves touch behavior on controls.

A real iOS/Android native build will still feel better than the web build.

## Supabase migration
Apply `V9_TRACK_EVERYTHING.sql` **after reviewing it on a development project**. It adds:
- connected provider state;
- tracking sessions;
- GPS points;
- tracking events;
- activity splits;
- external provider links/dedupe groundwork;
- personal route efforts for Ghost/Pacer.

## What still requires native/provider work
These are deliberately not faked:
- Garmin/Huawei/Polar/Suunto/COROS real OAuth/API access;
- Apple HealthKit entitlements;
- Android Health Connect permissions;
- background GPS / lock-screen tracking in a production build;
- Bluetooth HR/cadence/power sensors;
- automatic swim-stroke/lap detection from watch sensors;
- camera AI for racket/combat/strength technique;
- provider webhook infrastructure.

## Production rules
1. Never put OAuth client secrets in the Expo client.
2. Imported activity rewards must be idempotent.
3. Manual entries are not automatically verified.
4. GPS sharing remains opt-in.
5. Background tracking must be explicit and power-aware.
6. Provider imports should be processed server-side before affecting official leaderboards.
