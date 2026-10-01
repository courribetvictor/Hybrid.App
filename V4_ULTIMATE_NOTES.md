# Hybrid.App — V4 Ultimate

This project is the V4 evolution of the Visual V3 build. It is deliberately split between features that work from the app code immediately and features whose final production behavior requires Supabase migrations, native permissions or provider credentials.

## What changed in V4

### 1. Hybrid Today dashboard
The home feed now opens with a real daily sports cockpit:
- Hybrid Score + rank
- rank progression
- readiness estimate
- weekly objective
- Coach shortcut
- Live shortcut
- Calendar, Record Book, Equipment and Readiness shortcuts
- weekly Hybrid Missions and XP

The feed still exists below the dashboard, so the social layer is not lost.

### 2. Hybrid Live
New screen: `app/modals/live.tsx`

The V4 Live experience now includes:
- Live privacy: public / followers / private
- start/end location protection option
- optional five-minute public delay
- real foreground GPS architecture on native mobile
- route tracking through `expo-location`
- native map through `react-native-maps`
- web fallback map so Expo Web still works
- duration, distance and live pace
- notes written during the effort
- music/current-track presentation
- reactions / encouragements
- automatic conversion of a finished Live into a verified GPS activity
- spectator discovery for visible Lives

### 3. Live spectator mode
New screen: `app/modals/watch-live/[id].tsx`

Spectators can receive Realtime updates for:
- athlete Live state
- route points
- distance / pace / HR when provided
- Live notes
- current music metadata when connected
- reactions

The actual access is protected at the database layer by RLS, not only by the UI.

### 4. Real map architecture
New files:
- `components/live/LiveMap.native.tsx`
- `components/live/LiveMap.web.tsx`
- `components/live/LiveMap.tsx`
- `hooks/useForegroundLiveLocation.ts`

Native uses a real map and GPS points. Web intentionally uses the stylized Hybrid route fallback because native map providers do not behave the same way in browsers.

New dependencies:
- `expo-location` 57.0.19
- `react-native-maps` 1.27.2

### 5. Coach Hybrid V4
The Coach panel is now closer to a personal sports assistant:
- readiness-aware snapshot
- weekly workload snapshot
- weakest skill surfaced
- sport-specific session cards
- explanation of why the session is proposed
- quick Coach prompts
- local conversational prototype
- calendar shortcut

A true LLM-backed Coach still requires a secure server endpoint / AI provider. The UI and product flow are ready for it.

### 6. Smart training calendar
New screen: `app/modals/calendar.tsx`

Includes:
- week navigation
- sport-specific Coach recommendations
- planned / completed state
- recovery day cards
- architecture for Coach-generated training plan items

### 7. Readiness check-in
New screen: `app/modals/readiness.tsx`

Daily self-report fields:
- sleep quality
- fatigue
- soreness
- motivation

It computes a score and is backed by the `readiness_logs` table when the V4 migration is applied. Later, HRV, sleep and resting HR from Garmin / Apple Health / Health Connect can enrich it.

### 8. Record Book
New screen: `app/modals/records.tsx`

Automatically derives several personal best categories from existing activity data:
- longest distance
- longest session
- max strength load
- max gym volume
- active streak
- sports practiced
- recent record highlights

### 9. Equipment tracking
New screen: `app/modals/equipment.tsx`

V4 models:
- shoes
- bike
- racket
- watch/sensor
- other equipment

The Supabase schema supports linking equipment to activities and tracking distance / usage.

### 10. Activity Story
The existing activity detail page has been upgraded rather than duplicated.

A finished activity can now present itself as a memory/story with:
- route hero
- main metrics
- soundtrack section
- effort journal / notes
- sports data
- share action

### 11. Arena V4 direction
Arena gained:
- Hybrid Live entry point
- league card
- promotion concept
- existing rankings / challenges / social / friends preserved

### 12. Rank divisions
Ranks now support divisions such as:
- Bronze III / II / I
- Silver III / II / I
- Gold III / II / I
- etc.

Hybrid Score and XP remain conceptually separate: Score represents sports ability/profile; XP represents engagement and progression milestones.

### 13. Hybrid Missions
New weekly mission cards reward meaningful behavior:
- multiple active days
- multiple sport families
- at least one easy/recovery session

This is intentionally designed to reduce "spam activity" gamification.

### 14. Music connections
Connections now includes Spotify and Apple Music in addition to Garmin / Apple Health / Health Connect / Strava.

The UI and data model are prepared. Real provider authentication requires developer credentials and a secure OAuth backend.

### 15. Auth navigation bug fixed
The previous root auth guard could replace valid modal routes with `/(tabs)` whenever the pathname changed. V4 now only redirects when the user crosses the authenticated / unauthenticated boundary, so Live, Calendar, Activity Story and other modals can remain open normally.

## Supabase migration
Apply after the previous migrations:

`supabase/migrations/20260930_v4_ultimate.sql`

It creates:
- `live_activities`
- `live_points`
- `live_notes`
- `live_reactions`
- `training_plan_items`
- `readiness_logs`
- `equipment`
- `activity_equipment`
- new Activity Story columns
- RLS policies
- Realtime publication entries

**Test this migration on a development Supabase project first.** Existing projects can have custom table names/policies that require reconciliation.

## What is real vs what still needs credentials/infrastructure

### Implemented in the project
- V4 UI / navigation
- live session local state
- native foreground location hook
- native route map architecture
- realtime Supabase Live architecture
- spectator screen
- Live notes / reactions architecture
- privacy/RLS migration
- calendar
- readiness
- records
- equipment
- Hybrid Missions
- rank divisions
- Activity Story
- Coach conversational prototype

### Requires project/account configuration
- applying the Supabase V4 migration
- real Spotify / Apple Music OAuth
- real Garmin / Strava OAuth and webhooks
- Apple Health / Health Connect native integration
- true LLM Coach backend
- production push notifications
- background GPS tracking when the app is fully backgrounded
- map provider keys/configuration required by production store builds

## Install / run

```bash
npm install
npx expo start
```

For the browser:

```bash
npx expo start --web
```

For the full native map / GPS experience, test on iOS/Android. Expo will ask for location permission when the user starts a GPS Live.

## Important privacy design
Hybrid Live is intentionally not "public GPS by default". The model supports:
- followers-only sharing
- private Live
- location completely disabled
- start/end hiding
- delayed location
- RLS enforcement

Before production, implement true geographic masking of the first/last part of a route on the server, not just a UI switch.
