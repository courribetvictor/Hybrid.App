# Intégration V6

Base GitHub : 6d93e344e582c7ce2929912db5d4217e339816f3.
Référence : Hybrid.App.V6-Polish(1).zip fournie par Arthur.

La V6 remplace l'interface et les systèmes multisports de l'ancienne version. Les fichiers propres au dépôt (social, confidentialité, fonction backend Coach, déploiement) restent présents. Les dictionnaires FR/EN, les relations sociales, les likes, la migration des objectifs hebdomadaires et le stockage natif des sessions sont conservés.

## Corrections

- Import SensoryPressable manquant ; types BodyLog/Post/Coach ; taille de police 4xl ; annotations TypeScript ; styles React Native devenus invalides.
- Mise à jour Metro Runtime, suppression de la dépendance directe expo-modules-core et de la configuration splash obsolète.
- Version app/package harmonisée, autorisation de localisation ajoutée, URL fictive de mise à jour Expo désactivée.
- Réglages sensoriels partagés entre composants.
- Inscription : prévalidation du pseudo facultative si le RPC échoue ; un pseudo explicitement indisponible bloque toujours ; validation finale par Supabase. Indicateur de chargement et gestion des erreurs réseau.
- Repli du chargement du profil vers profiles si le RPC n'est pas installé.
- .env et caches Expo/Supabase retirés du suivi Git ; aucune nouvelle clé privée ajoutée. Les anciennes versions Git conservent leur historique.

## Validation

- npm install : réussi.
- npm run typecheck : réussi.
- npm run build:web : réussi.
- npm run doctor : 21/21 contrôles réussis.
- git diff --check : réussi.
- Test navigateur : non réalisé (Chromium absent ; téléchargement indisponible).
- Authentification réelle, Live GPS sur téléphone, paiements et services tiers : non validés.

## Avant fusion / déploiement

Vérifier la base de données en développement. Les migrations 20260929_hybrid_v1.sql, 20260929_multisport_v2.sql, 20260930_v4_ultimate.sql et V5_ULTIMATE.sql sont fournies mais n'ont PAS été appliquées au serveur. Cette V6 lit de nouveaux champs et tables ; copier uniquement le frontend ne suffit pas.

Configurer EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans l'environnement de déploiement. Ne pas utiliser de clé service_role dans le client.

Tester inscription/confirmation email, profil, ajout d'activité, Coach, calendrier, Arène, Live, records, équipement et réglages sensoriels avec un compte de test. Le Coach V6 comporte des recommandations locales ; la fonction Coach du dépôt reste disponible mais sa connexion au parcours V6 n'a pas été validée.

Les abonnements, intégrations sportives et vérifications de performances restent à connecter. L'XP local est un prototype ; il ne constitue pas une preuve serveur. La fusion seule ne confirme pas la mise à jour du site ou des applications natives. De nouveaux modules natifs nécessitent un nouveau build mobile.
