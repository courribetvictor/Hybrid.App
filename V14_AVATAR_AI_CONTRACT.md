# V14 — Contrat du service Photo → Avatar

L'app contient déjà le bouton et le client réseau. Pour activer l'analyse automatique, définir `EXPO_PUBLIC_AVATAR_AI_URL` vers un endpoint HTTPS sécurisé.

## Requête
`POST multipart/form-data`
- champ `image`: selfie recadré carré

## Réponse JSON attendue
```json
{
  "confidence": 0.82,
  "summary": "Cheveux courts ondulés, teint moyen, aucun accessoire détecté.",
  "suggested": {
    "skin": "skin_2",
    "hair": "hair_flow_2",
    "face": null,
    "head": null
  }
}
```

Les IDs proposés sont validés côté app avant d'être appliqués. L'endpoint ne doit jamais renvoyer d'identité, de nom, d'origine ethnique ou d'autre inférence sensible : seulement des attributs visuels nécessaires à l'avatar. La photo ne doit pas être conservée par défaut.
