# Hybrid.App V13 — 3D Avatar Studio

## Objectif
La V13 transforme le système d'avatar en expérience 3D stylisée et interactive, sans dépendre d'un service payant ni d'assets réalistes générés.

## Ajouts
- Studio avatar 3D temps réel avec React Three Fiber / Three.js.
- Rendu natif Expo via `expo-gl` et rendu web via WebGL.
- Rotation 360° au doigt / souris.
- Zoom + reset de caméra.
- Poses : neutre, running, power et victoire.
- Corps stylisé procédural : aucune dépendance à un modèle 3D commercial.
- Les 11 slots cosmétiques V7/V8 sont reflétés en 3D : peau, cheveux, visage, tête, cou, haut, poignets, bas, chaussures, dos, aura.
- Support 3D des casquettes, bandeaux, bonnets, couronnes, lunettes sport, visière, masque, face paint, cape, sac, ailes, bannière et auras.
- Photo de référence locale : selfie caméra ou galerie, conservé uniquement sur l'appareil via AsyncStorage.
- Vue côte-à-côte selfie / avatar pour régler le personnage sans envoyer la photo au serveur.
- Les mini avatars dans le feed/profil restent en 2D pour la performance ; la 3D est utilisée dans les moments à forte valeur visuelle.

## Ce qui est gratuit
- `three` : MIT.
- `@react-three/fiber` : MIT.
- `expo-gl` : Expo / open source.
- Le personnage de base est généré avec des primitives 3D dans le code, donc aucune licence d'asset externe n'est nécessaire.

## Selfie → avatar
La V13 ne simule pas une reconstruction faciale automatique. La photo sert de référence locale. Pour une vraie génération automatique fidèle, il faudra ajouter un module de landmarks/vision ou un backend spécialisé, avec consentement explicite et politique de confidentialité adaptée.

## Dépendances ajoutées
- `expo-gl ~57.0.2`
- `three ^0.186.1`
- `@react-three/fiber ^9.8.1`
- `@types/three ^0.186.0` (dev)

## Test recommandé
```bash
npm install
npm run typecheck
npm run doctor
npx expo start
```
Tester la 3D sur un appareil iOS/Android physique. Les documentations R3F signalent que les simulateurs iOS peuvent avoir un support OpenGL ES incomplet.
