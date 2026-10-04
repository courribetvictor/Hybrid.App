# Hybrid.App — Multisport V2

Cette version pousse Hybrid vers la vision « application sportive universelle ».

## Ce qui a été ajouté

- Catalogue central de 96 disciplines réparties dans 14 familles : course/endurance, cyclisme, aquatique, raquette, collectifs/ballon, force/fitness, combat, escalade/montagne, hiver, glisse/action, mobilité/corps-esprit, athlétisme/gymnastique, précision, rame/navigation.
- Onboarding multi-sports avec recherche et sélection par familles.
- Écran `Mes sports` accessible après inscription pour ajouter/retirer des disciplines à tout moment.
- Nouveau sélecteur d’activité donnant la priorité aux sports favoris tout en permettant de rechercher tout le catalogue.
- Schémas de saisie spécifiques par discipline : distance, FC, dénivelé, score, sets, adversaire, watts, longueurs, style de nage, rounds, cotation escalade, vent, score golf, etc.
- Type de séance par sport : match, technique, footwork, séries, tempo, force, hypertrophie, WOD, sparring, etc.
- Musculation améliorée : exercices, séries, reps, kg, RIR, repos, suppression de série, duplication réelle et volume automatique.
- Coach Hybrid contextualisé par sport avec propositions détaillées pour les sports principaux et modèles par famille pour les autres.
- Coach tenant compte des dernières séances et du RPE récent pour contextualiser la recommandation.
- Hybrid Score côté client étendu à toutes les familles sportives.
- Migration Supabase V2 fournissant une formule serveur multisport.

## Fichiers clés

- `constants/sportCatalog.ts` : source de vérité de tout le catalogue.
- `components/sports/SportPicker.tsx` : sélection multi-sports.
- `components/sports/SportActivityPicker.tsx` : sélection d'une discipline pour une séance.
- `components/sports/DynamicSportFields.tsx` : formulaire dynamique par sport.
- `lib/coachEngine.ts` : moteur de recommandations sportives.
- `app/modals/sports.tsx` : gestion des sports du profil.
- `supabase/migrations/20260929_multisport_v2.sql` : score multisport serveur.

## À appliquer sur Supabase

Appliquer d'abord la migration V1 si elle ne l'a pas déjà été, puis :

`supabase/migrations/20260929_multisport_v2.sql`

Les colonnes `favorite_sports` et `sport_type` existantes utilisent déjà du texte et acceptent donc le catalogue étendu sans créer 96 colonnes ou tables.

## Coach IA conversationnel

Le moteur actuel est un coach personnalisé déterministe : il produit des séances concrètes à partir des sports et de l'historique, sans coût d'API et sans envoyer les données de l'utilisateur à un modèle externe.

Pour passer à un véritable coach conversationnel génératif (questions libres, adaptation profonde de plan, réponses en chat), il faudra connecter une fonction backend à un fournisseur de modèle IA et configurer une clé serveur. Il ne faut jamais mettre une clé d'API directement dans l'application mobile.

## Validation

Le code a été vérifié structurellement et la passe TypeScript a été lancée. Dans cet environnement les dépendances Expo/React ne sont pas installées, donc `expo/tsconfig.base`, React Native et les types associés ne sont pas résolus. La validation finale doit être faite après `npm install`, puis `npx expo start`/une build de développement.
