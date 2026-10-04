# Hybrid.App V11 — Hybrid Life

## Vision
V11 étend Hybrid au cycle complet **avant / pendant / après** l'effort. Elle ne remplace pas un professionnel de santé : elle utilise les données sportives et les ressentis déclarés pour mieux organiser récupération, sommeil, hydratation, carburant, mental et disponibilité.

## Nouveautés principales
- **Hybrid Life Score** quotidien : récupération, sommeil, hydratation, mental et charge récente.
- **Recovery Lab** : sommeil (durée + qualité), fatigue, courbatures, stress, motivation, hydratation, temps disponible et signalement d'une douleur inhabituelle.
- **Life Hub** : un centre unique pour recovery, fuel, mental et mode compétition.
- **Fuel & Hydration** : recommandations simples avant / pendant / après selon durée et intensité prévue, sans objectif calorique ni logique restrictive.
- **Mental & Focus** : routines courtes calme / focus / confiance avec respiration guidée.
- **Coach V11** : le Coach peut intégrer les signaux Hybrid Life dans ses réponses en plus de Hybrid Intelligence.
- **Accueil** : nouvelle carte Hybrid Life sous Hybrid Intelligence.
- **Supabase** : tables `life_logs`, `fuel_plans`, `mental_sessions` avec RLS propriétaire.

## Principes produit
- Pas de diagnostic médical.
- Pas de recommandation de restriction alimentaire ou de perte de poids.
- Un signal de douleur inhabituelle réduit volontairement la recommandation du jour.
- Les jours de récupération sont considérés comme faisant partie de la progression.
- L'hydratation et le ravitaillement restent adaptatifs : l'utilisateur doit tester ce qui lui convient à l'entraînement.

## Fichiers clés
- `lib/v11/life.ts`
- `constants/v11.ts`
- `hooks/useLifeCheckin.ts`
- `components/v11/LifeCard.tsx`
- `app/modals/life-hub.tsx`
- `app/modals/recovery.tsx`
- `app/modals/fuel.tsx`
- `app/modals/mind.tsx`
- `V11_ULTIMATE.sql`

## Limites honnêtes
- Le sommeil / HRV / FC repos depuis Apple Health, Health Connect, Garmin, Huawei, etc. nécessitent encore les intégrations natives/API réelles.
- Les conseils nutritionnels restent volontairement généraux ; une stratégie clinique ou pathologique relève d'un professionnel qualifié.
- Le Coach reste un moteur local/règles tant qu'un backend IA sécurisé n'est pas connecté.
