# Hybrid.App V12 — Adaptive OS

## Vision
V12 réorganise l'app autour de 5 espaces : **Today / Train / Coach / Arena / You**. L'objectif n'est plus d'empiler des fonctionnalités mais de faire travailler tracking, récupération, coaching, objectifs et planning avec le même moteur de décision.

## Changements principaux
- Navigation principale à 5 univers.
- Nouveau `lib/v12/adaptive.ts` : moteur commun de planning adaptatif.
- Phases : Base / Build / Peak / Competition / Recovery.
- Trois modes : Manuel / Suggestions / Autopilot.
- Multi-objectifs avec priorités.
- Disponibilités hebdomadaires et budget de séances dures.
- Adaptation selon Hybrid Intelligence + Hybrid Life.
- Chaque décision expose un **Pourquoi ?** et un niveau de confiance.
- Nouvel onglet **Train** avec plan de semaine, tracker et outils par sport.
- Nouvel onglet **Coach** dédié.
- `Digital Twin` : baseline personnelle, tolérance de charge, RPE moyen, habitudes horaires.
- `Scenario Lab / What If?` : simuler volume en hausse, séance ratée, compétition surprise ou mauvaise nuit.
- `Smart Journal` : notes sportives auto-taggées pour devenir du contexte utile.
- Nouvelle carte Adaptive OS sur Today.
- Coach V12 conscient du plan adaptatif et capable d'expliquer les adaptations.

## Garde-fous
Le moteur V12 est un moteur de planification sportive générale. Il ne diagnostique aucune pathologie et ses projections ne sont pas des promesses de performance. Les signaux de récupération ou de douleur doivent rester conservateurs.

## Backend V12
`V12_ADAPTIVE_OS.sql` ajoute :
- `adaptive_preferences`
- `adaptive_goals`
- `adaptive_plan_versions`
- `digital_twin_snapshots`
- `smart_journal_entries`
avec RLS utilisateur.

La première implémentation des préférences et du journal fonctionne localement pour permettre de tester l'UX sans dépendre du backend. Avant production multi-device, synchroniser ces données avec les tables V12.

## À brancher plus tard
- véritable modèle IA distant pour le Coach ;
- génération automatique de plans longue durée côté serveur ;
- synchronisation multi-device du Smart Journal et de l'Autopilot ;
- jobs backend pour recalculer les Digital Twin snapshots ;
- notifications natives Morning Brief / changements de planning ;
- tests E2E et tests appareils réels.
