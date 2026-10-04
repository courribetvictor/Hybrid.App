# Hybrid.App V7 — Identity & Reward System

## Ce qui a été ajouté
- Avatar vectoriel modulaire, personnalisable dès la première ouverture authentifiée.
- 130+ cosmétiques générés dans le catalogue : peau, cheveux, tête, hauts, poignets, bas, chaussures et auras.
- 4 raretés : Commun, Rare, Épique, Légendaire.
- Avatar Studio / boutique avec niveau requis, achat en crédits, équipement/déséquipement.
- Nouvelle économie locale V7 : crédits, Identity XP, niveaux, inventaire, loadout, boosters, capsules et historique anti-double-récompense.
- Effort Units : conversion transversale entre sports tenant compte de durée, RPE, famille sportive et métriques spécifiques. Les séances courtes/intenses ne sont pas pénalisées comme avec une simple règle de distance.
- Récompense automatique après l’enregistrement d’une activité : Effort Units -> XP + crédits.
- Récompense quotidienne en cycle de 7 jours + capsule bonus.
- Quêtes V7 hebdomadaires fondées sur régularité, polyvalence et gestion de charge.
- Capsules Bronze/Argent/Or gagnables dans l’app. Elles ne sont pas conçues pour être vendues contre de l’argent réel.
- Boosts temporaires XP/crédits. Aucun boost ne modifie performance, Hybrid Score officiel ou classement.
- 4 nouveaux effets audio synthétiques originaux : coin, unlock, chest, boost ; haptics dédiés associés.
- Player Card V7 sur l’accueil avec avatar, crédits, niveau et progression.
- Migration SQL V7 fournie pour préparer la synchronisation serveur de l’économie.

## Choix de design importants
- Pas de pay-to-win : les cosmétiques et boosts n’améliorent jamais les performances officielles.
- Les récompenses sont liées à de vraies séances et utilisent une fonction saturée/plafonnée pour limiter le farming.
- Le stockage V7 fonctionne localement immédiatement. Pour une économie compétitive réelle, migrer les écritures crédits/XP vers Supabase via RPC/Edge Function autoritaire.
- Les accessoires V7 de base sont dessinés en vectoriel dans l’app, donc le système n’a pas besoin de packs externes pour fonctionner.

## Assets externes recommandés plus tard
Si vous voulez remplacer/compléter certains visuels par des packs externes, privilégiez du CC0. Kenney indique que les assets de ses pages d’assets sont CC0 et utilisables commercialement. OpenGameArt peut aussi convenir, mais la licence doit être vérifiée asset par asset.

## Validation
La structure/imports internes a été contrôlée statiquement. Le build Expo complet doit toujours être lancé dans un environnement avec `node_modules` installé (`npm install`, `npm run typecheck`, `npm run doctor`).
