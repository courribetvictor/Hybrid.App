# Hybrid.App — révision du 29/09/2026

Cette copie a été reconstruite et renforcée à partir du ZIP fourni. Le ZIP d'origine n'a pas été modifié.

## Changements réalisés

- **Hybrid Score repensé** autour de 6 dimensions : endurance, force, vitesse, régularité, polyvalence et progression. Les activités vérifiées comptent davantage que les saisies manuelles.
- **Date réelle des activités** (`performed_at`) distincte de la date de création.
- **Activités enrichies** : titre, notes, RPE 1–10, ressenti, visibilité, source et statut vérifié.
- **Liste d'activités améliorée** : recherche, filtre sport, filtre période et ouverture d'une fiche détaillée.
- **Fiche activité** avec modification, suppression et duplication.
- **Confidentialité côté base de données** via RLS Supabase pour profils, activités et mesures corporelles.
- **Authentification renforcée** : validation email/pseudo, mot de passe minimum 8 caractères, indicateur de robustesse, contrôle de pseudo côté serveur, parcours complet de réinitialisation du mot de passe.
- **Compte & données** : modification email/mot de passe, export JSON et suppression du compte.
- **Sources externes préparées** : Garmin, Apple Health, Health Connect et Strava, avec modèle de synchronisation idempotente.
- **Coach basé sur les données** : charge récente, objectif hebdomadaire, équilibre des compétences et RPE élevé.
- **Achievements enrichis**, saisons et structure de clubs/classements.
- **Nettoyage structurel** : suppression des anciens écrans sociaux/profil/confidentialité en doublon et ajout des routes manquantes.
- **Dossiers manquants reconstruits** (`components`, `hooks`, `lib`, `constants`, `types`, assets et TypeScript config) afin que la copie soit cohérente avec les imports présents.
- **EAS Updates désactivé par défaut** tant qu'un vrai `projectId` Expo n'a pas été configuré.

## À faire avant de lancer

1. Copier `.env.example` vers `.env` et renseigner :
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Faire une sauvegarde de la base Supabase existante.
3. Relire puis appliquer `supabase/migrations/20260929_hybrid_v1.sql` dans le SQL Editor Supabase.
4. Installer les dépendances (`npm install`) puis lancer Expo (`npm start`).
5. Tester sur un projet Supabase de développement avant la production, car le schéma Supabase d'origine n'était pas inclus dans le ZIP.

## Ce qui est préparé mais ne peut pas être activé sans accès externe

### Garmin / Strava
Le modèle de données, l'écran de connexions et l'import commun sont prêts. L'activation réelle demande des identifiants OAuth et un backend/callback sécurisé propres à vos comptes développeur.

### Apple Health / Health Connect
L'écran et la source de données sont prévus. L'accès réel exige des modules natifs, permissions/entitlements et une build native EAS ; cela ne peut pas être finalisé à partir du seul ZIP JavaScript fourni.

### Notifications push
Les préférences sont désormais synchronisées dans Supabase. L'envoi de notifications push nécessite encore l'enregistrement des Expo Push Tokens et un service serveur/Edge Function de diffusion.

### GPS, cartes, courbes FC/allure et splits
La fiche activité est prête pour recevoir ces données via `metrics` et les sources vérifiées, mais aucun module GPS/cartographique ni format de traces n'était présent dans le projet fourni. Il faut choisir le fournisseur/formats avant de brancher cette partie.

## Points à vérifier contre votre base actuelle

La migration suppose que les tables historiques suivantes existent déjà avec les colonnes utilisées par le code : `profiles`, `activities`, `follows`, `body_logs` (ainsi que les tables sociales déjà utilisées par le projet). Vérifier en particulier le type de `profiles.favorite_sports`, les colonnes `activities.metrics`, `duration_seconds`, `sport_type`, et la structure de `follows` avant application en production.

La fonction `delete_my_account()` supprime l'utilisateur courant de `auth.users`; les données liées doivent avoir les bons `ON DELETE CASCADE`. Vérifier cela sur une base de test.

## Validation effectuée ici

Une passe TypeScript statique a été faite sur tous les fichiers. Les erreurs internes repérées pendant la reconstruction ont été corrigées. Une compilation Expo complète n'a pas pu être exécutée dans cet environnement car les dépendances du projet n'étaient pas installées ; les diagnostics restants du contrôle isolé correspondent principalement à l'absence des modules/types React/Expo dans `node_modules`.

Les images présentes dans `assets/` sont des placeholders techniques générés parce que les assets originaux n'étaient pas dans l'archive fournie. Remplacez-les par les vrais éléments de marque avant publication.
