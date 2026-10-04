# Hybrid.App V8 — World & Identity

Version: **0.8.0**

V8 transforme la couche de progression V7 en un univers personnel autour de l'athlète. L'objectif n'est pas d'ajouter des récompenses qui faussent le sport : la performance officielle reste séparée de la progression cosmétique.

## Nouveautés principales

### 1. Avatar étendu
- 11 slots cosmétiques : peau, cheveux, visage, tête, cou, haut, poignets, bas, chaussures, dos, aura.
- Environ **198 cosmétiques modulaires** générés par le catalogue actuel.
- Nouveaux accessoires : lunettes sport, visières, masques, face paint, chaînes, tours de cou, capes, sacs, ailes et bannières.
- Les objets restent purement cosmétiques.

### 2. Hybrid Identity Card
- Carte de profil premium avec avatar + compagnon.
- 8 univers visuels : Midnight, Aurora, Ember, Ocean, Forest, Solar, Monochrome, Cyber.
- 5 cadres progressifs.
- Titres et devise personnalisables.
- Option d'afficher l'identité musicale.
- Les cadres achetés sont conservés dans l'inventaire.

### 3. Compagnons
- Wolf, fox, falcon, robot, panther, dragon.
- Humeurs : calme, focus, hype, fier.
- Accessoires pour compagnons.
- Les compagnons n'accordent aucun bonus de performance.

### 4. Trophy Room
- Salle personnelle avec trophées exposés.
- Déblocages basés sur des faits sportifs : première séance, 10/50 séances, 100 km, 5 sports, activités vérifiées.
- 5 thèmes de salle : Studio, Loft, Altitude Base, Cyber Lab, Hall of Champions.

### 5. Hybrid World
- Progression sur une route mondiale : Paris, Oslo, Barcelona, Tokyo, Chamonix, Rio, New York, World Finals.
- Déblocage par seuils de séances + kilomètres cumulés.
- Récompenses cosmétiques/économie V7 sans modifier les classements réels.

### 6. Activity Story
- Générateur de souvenir visuel pour une activité.
- 6 templates : Clean, Race Day, Neon, Summit, Soundtrack, Minimal.
- Distance, temps, RPE/allure, notes et musique associée.
- Préparation pour export futur en image/vidéo avec carte GPS, splits, photos et musique autorisée.

### 7. Hybrid Music Space
- Espace musique dédié.
- Zones BPM : Warm-up, Tempo, Sprint, Recovery.
- Historique des morceaux si les activités contiennent des métadonnées musicales.
- Préparation d'insights corrélant musique et moments de séance sans présenter une corrélation comme une causalité.

### 8. Season 08 — WORLD / 01
- Progression saisonnière sur l'XP d'identité.
- Récompenses cosmétiques et sociales.
- Prototype d'événement communautaire multi-sport basé sur les Effort Units.
- Aucun bonus saisonnier ne modifie chrono, record ou classement officiel.

### 9. Sound design V8
Nouveaux sons locaux :
- `world.wav`
- `companion.wav`
- `story.wav`

Ils respectent les préférences V6 de sons/vibrations/réduction des animations.

## Architecture
- `constants/v8.ts`
- `hooks/v8/useV8World.tsx`
- `components/v8/HybridCompanion.tsx`
- `components/v8/IdentityCard.tsx`
- `components/v8/V8WorldCard.tsx`
- nouveaux écrans : `profile-card`, `companion-studio`, `trophy-room`, `world`, `story-builder`, `season`, `music-space`.
- `V8_ULTIMATE.sql` et migration Supabase correspondante.

## Validation effectuée
- Parsing TypeScript/TSX sur **118 fichiers** avec TypeScript `transpileModule`: 0 erreur de syntaxe après corrections.
- Vérification des imports internes à effectuer dans la passe finale du package.
- Une vraie build Expo/native reste nécessaire sur un environnement avec `node_modules` installés.

## À connecter plus tard
- Spotify/Apple Music OAuth et permissions réelles.
- Export natif image/vidéo des Stories.
- Synchronisation serveur V8 (le provider V8 est local-first dans cette version).
- Vue publique sécurisée des Identity Cards.
- Événements communautaires calculés côté backend.
