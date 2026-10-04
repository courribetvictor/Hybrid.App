# Hybrid.App V15 — Identity Plus / Art Polish

## Objectif
La V15 pousse la direction 2D validée en V14 : moins de rendu lisse/"IA", plus d'identité street-sport, davantage de détails dessinés et beaucoup plus de personnalisation.

## Catalogue
Le catalogue passe à environ **390 cosmétiques modulaires**.

Nouveaux slots :
- sourcils
- barbe / moustache
- tatouages
- patchs / écussons
- chaussettes

Ils s'ajoutent aux slots V14 : peau, cheveux, visage, oreilles, tête, cou, haut, poignets, taille, bas, chaussures, dos et aura.

## Cheveux et vêtements
Nouvelles familles de cheveux : fade, waves, afro, tresses, bun, en plus de crop, flow, spike et boucles.

Nouvelles familles de hauts : coupe-vent, oversized tee, varsity, track jacket. Nouvelles familles de bas : cargo sport et split short.

## Art polish
Le moteur SVG a été retravaillé :
- contours plus équilibrés ;
- grain papier plus fin ;
- ombres simples et plis de vêtements ;
- sourcils séparés ;
- barbe/moustache dessinées ;
- détails de tatouage ;
- patchs de tenue ;
- chaussettes visibles ;
- cheveux plus variés ;
- nouveaux détails selon les vêtements.

## Poses / expressions / décors
- 10 expressions ;
- 10 poses ;
- 17 fonds ;
- 10 thèmes de carte.

Les nouveaux décors incluent notamment stade, piscine, dojo, ring, plage, forêt, rooftop, neige et studio.

## Tenues sauvegardées
Le Studio permet d'enregistrer jusqu'à 8 looks complets puis de les rééquiper en un geste. C'est prévu pour des usages comme : Running, Muscu, Compétition, Casual, Hiver, etc.

## Photo → Avatar
Le contrat V14 reste compatible. La photo reste locale par défaut. Un backend optionnel peut proposer une base stylisée, sans identification de la personne ni inférence d'attributs sensibles.

## Données
`V15_IDENTITY_PLUS.sql` ajoute une table RLS `avatar_outfits_v15` pour synchroniser les presets de tenue quand le backend sera branché. Le fonctionnement local reste disponible sans cette migration.

## Validation
Une vraie build Expo reste nécessaire avec `npm install`, `npm run typecheck`, `npm run doctor`, puis un test réel sur web et téléphone.
