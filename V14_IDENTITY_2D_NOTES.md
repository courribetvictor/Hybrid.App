# Hybrid.App V14 — Identity 2D

## Direction artistique
La V14 abandonne la 3D comme direction principale. Le nouvel avatar est un rendu 2D modulaire inspiré d'une planche de concept art / carnet de design street-sport : contours plus présents, grain léger, aplats et ombres simples, moins de rendu lisse "IA".

## Personnalisation
- Environ 230 cosmétiques modulaires grâce aux catégories existantes + nouveaux slots oreilles et taille.
- Slots : peau, cheveux, visage, oreilles, tête, cou, haut, poignets, taille, bas, chaussures, dos, aura.
- Silhouette : fine / athlétique / puissante.
- Forme du visage : douce / ovale / anguleuse.
- 6 expressions.
- 6 poses.
- 8 fonds (carnet, urbain, salle, montagne, piste, terrain, night, minimal).
- 6 thèmes de carte de profil.
- 3 niveaux de trait/grain (propre, carnet, brut).

## Photo → Avatar
L'écran Photo → Avatar est intégré. Il conserve la photo localement par défaut et sait appeler un endpoint sécurisé optionnel via `EXPO_PUBLIC_AVATAR_AI_URL`.

L'app ne simule pas de reconnaissance faciale quand aucun backend n'est configuré. Le contrat d'API est dans `V14_AVATAR_AI_CONTRACT.md`.

## Cohérence globale
- Onboarding V14 remplacé.
- Avatar Studio remplacé.
- Carte joueur et carte de profil utilisent le même moteur V14.
- Les dépendances Three.js / React Three Fiber / Expo GL de la V13 ont été retirées.

## Sécurité / vie privée
Le système Photo → Avatar doit uniquement extraire des attributs visuels nécessaires à la stylisation et ne pas inférer l'identité ou des attributs sensibles. Aucun selfie n'est stocké dans la migration Supabase V14.

## Validation statique
Les fichiers TS/TSX ont été parsés avec TypeScript et les imports internes ont été contrôlés. Une vraie build Expo reste nécessaire avec `npm install`, `npm run typecheck`, `npm run doctor`, puis test sur mobile/web.
