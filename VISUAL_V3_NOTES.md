# Hybrid.App — Visual V3

Cette version applique une nouvelle direction artistique sans changer le concept multisport V2.

## Identité visuelle
- Palette globale modernisée : fond froid, cartes plus nettes, bleu Hybrid plus profond, violet/cyan comme accents.
- Palette par compétence : Endurance bleu, Force rouge, Vitesse orange, Régularité vert, Polyvalence violet, Progression rose.
- Palette par famille sportive et couleurs spécifiques par discipline.
- Rayons, ombres, espacements et hiérarchie typographique harmonisés.

## Grades Hybrid
8 rangs liés au Hybrid Score : Rookie, Bronze, Argent, Or, Platine, Diamant, Élite, Légende.
Le profil affiche le grade, sa progression vers le rang suivant et un badge graphique généré dans l'UI.

## Compétences
Le composant SkillsRadar a été remplacé par un vrai radar hexagonal à 6 axes avec points colorés, valeurs et légende.

## Accomplissements
Les emojis principaux ont été remplacés par des médailles visuelles propres à Hybrid.App avec icônes, gradients et états verrouillés.

## Arène
- Hero de saison en dégradé sombre/violet.
- Score/rang personnel directement visibles.
- Top 3 Or / Argent / Bronze.
- Badge de grade sur chaque ligne du classement.
- Défis redesignés avec couleur, progression et récompense XP.

## Feed
Les cartes d'activité ont une signature couleur selon le sport, un badge d'activité vérifiée et une hiérarchie plus premium.

## Sélection des sports
Les familles utilisent maintenant des icônes cohérentes et des couleurs dédiées. Les sports sélectionnés sont plus lisibles, avec pastille et check visuel.

## Navigation
Barre basse allégée ; l'Arène reste le bouton central principal avec le gradient Hybrid.

## Correctif inclus
Correction d'un bloc musculation qui avait été accidentellement inséré dans la fonction de sauvegarde d'activité dans la V2.

## Validation
Une passe de parsing TypeScript n'a détecté aucune nouvelle erreur de syntaxe dans les fichiers modifiés. La compilation complète nécessite `npm install`, car les `node_modules` ne sont pas inclus dans l'archive.
