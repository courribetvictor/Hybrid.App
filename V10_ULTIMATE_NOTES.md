# Hybrid.App V10 — Intelligence & Athlete OS

Version: **0.10.0**
Base: V9 Track Everything

## Direction de la V10
La V9 sait capturer les séances. La V10 commence à les **comprendre**. Cette version ajoute une couche d'intelligence commune utilisée par l'accueil, le Coach, le mode compétition, les récapitulatifs et la carrière sportive.

## Nouveautés réellement intégrées

### Hybrid Intelligence
Nouveau moteur `lib/v10/intelligence.ts` qui calcule localement à partir des activités :
- état PEAK / BUILDING / MAINTAIN / RECOVER / RESET ;
- forme ;
- fatigue ;
- readiness ;
- progression ;
- régularité ;
- équilibre multisport ;
- charge 7 jours ;
- base hebdomadaire sur 28 jours ;
- ratio de charge ;
- recommandations et avertissements ;
- tendances par sport.

Un nouvel écran `modals/intelligence` permet d'expliquer les signaux au lieu d'afficher un score opaque.

### Prédictions sportives
Quand l'historique est suffisant, le moteur produit des estimations pour :
- 5 km ;
- 10 km ;
- semi-marathon ;
- marathon ;
- force estimée si des métriques de musculation compatibles existent.

Chaque prédiction a un pourcentage de confiance et une explication. Ce sont des estimations sportives, pas des garanties.

### Coach V10
Le Coach existant consomme désormais les mêmes données Intelligence. Il peut répondre aux questions sur :
- forme ;
- fatigue ;
- charge ;
- récupération ;
- séance du jour.

Cela évite d'avoir des recommandations qui contredisent l'écran de charge.

### Mode compétition
Nouvel écran `modals/competition-mode` :
- nom de compétition ;
- objectif ;
- état de forme actuel ;
- conseil pré-compétition ;
- checklist ;
- accès rapide à la musique ;
- lancement du tracker Hybrid.

### Recap 30 jours
Nouvel écran `modals/recap` :
- nombre de séances ;
- temps sportif ;
- sport dominant ;
- régularité ;
- proportion d'activités vérifiées ;
- état Intelligence ;
- principaux signaux du mois.

La structure est prête pour devenir plus tard un vrai visuel partageable / Hybrid Wrapped.

### Career Timeline
Nouvel écran `modals/timeline` qui construit automatiquement une chronologie avec :
- nouveaux records de distance ;
- nouvelles plus longues séances ;
- distinction des moments vérifiés.

### Integrity Engine
Nouveau moteur `lib/v10/integrity.ts` :
- score de confiance 0–100 ;
- statut manual / review / trusted / verified ;
- prise en compte de la source ;
- vérification de quelques incohérences évidentes (vitesse absurde, FC impossible, etc.).

Important : ce moteur **ne bannit jamais automatiquement**. Il sert uniquement à distinguer les performances fiables et les activités à revoir.

### Accueil & Arène
- carte Hybrid Intelligence ajoutée à l'accueil ;
- accès Intelligence dans le Coach ;
- raccourcis Arène vers Mode compétition, Intelligence, Recap et Career Timeline.

## Migration Supabase V10
`V10_ULTIMATE.sql` ajoute les fondations pour :
- snapshots Intelligence ;
- événements/compétitions ;
- intégrité d'activité ;
- recaps mensuels.

À appliquer après les migrations précédentes, idéalement d'abord sur un projet Supabase de staging.

## Ce qui reste volontairement hors de cette V10
Certaines ambitions de la V10 nécessitent une infrastructure externe et ne sont pas prétendues comme actives :
- vrai LLM conversationnel côté serveur ;
- notifications push coach en temps réel ;
- prédictions ML entraînées sur une population globale ;
- analyse médicale ou prévention de blessure ;
- vérification fédérale officielle automatisée ;
- matching géographique de partenaires ;
- génération automatique de vidéos/Stories finales.

L'architecture V10 est conçue pour accueillir ces systèmes sans remplacer le moteur local.

## Validation effectuée
- 132 fichiers TypeScript/TSX inspectés ;
- 0 import interne manquant ;
- package.json, app.json et tsconfig.json valides ;
- passe TypeScript ciblée sur les nouveaux fichiers : 0 erreur de syntaxe de classe parser.

Une vraie build Expo nécessite encore les dépendances (`npm install`) et un test sur téléphone/web.

## Commandes recommandées
```bash
npm install
npm run typecheck
npm run doctor
npx expo start
```
