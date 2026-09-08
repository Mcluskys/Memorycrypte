# Memory de la Crypte — version Web optimisée

Version HTML/CSS/JavaScript prête pour **GitHub Pages**, conçue pour smartphone, tablette et PC.

## Optimisations appliquées

- Images originales PNG (environ 30+ Mo au total) converties en **WebP** et redimensionnées à la taille réellement utile à l'écran.
- Chargement en deux étapes : seulement le décor et le cercueil fermé sont prioritaires ; le reste est préchargé après le clic de départ.
- Ambiance audio convertie en **Opus/Ogg 48 kbit/s mono** avec **MP3 64 kbit/s** de secours.
- Effet de grincement converti en Opus/MP3 léger.
- Interface responsive : 5 colonnes sur grand écran, 3 colonnes sur téléphone/tablette portrait, 5 colonnes en paysage bas.
- Contrôles tactiles natifs, sans dépendre du survol de souris.
- Animation CSS accélérée par le navigateur au lieu de recalculer/redimensionner les images à 60 FPS.
- Service worker : après la première visite, les ressources principales sont mises en cache pour des lancements plus rapides et un fonctionnement hors ligne partiel.
- Aucun framework ni bibliothèque externe : moins de requêtes, moins de JavaScript, démarrage plus rapide.

## Tester en local

Le service worker et l'audio doivent être servis en HTTP, pas en ouvrant directement `index.html` avec `file://`.

```bash
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## Publier sur GitHub Pages

1. Créer un dépôt GitHub (par exemple `memory-crypte`).
2. Envoyer **le contenu de ce dossier** à la racine du dépôt.
3. Dans GitHub : **Settings → Pages**.
4. Choisir **Deploy from a branch**.
5. Sélectionner la branche `main` et le dossier `/ (root)`.
6. Enregistrer. GitHub fournira l'URL publique du jeu.

## Remarques

- Le son démarre uniquement après l'appui sur le bouton d'entrée, conformément aux restrictions iOS/Android/Chrome/Safari sur l'autoplay.
- La police `crow.ttf` n'est volontairement pas incluse dans cette version web ; le jeu utilise une pile de polices système afin d'éviter une requête et d'améliorer le chargement. Tu peux réintroduire ta police originale plus tard si tu le souhaites.
- Les chemins d'assets sont relatifs (`./assets/...`), donc le projet fonctionne aussi dans un sous-dossier GitHub Pages.

## Mise à jour corrective
Cette version améliore la fiabilité des clics/touches sur les cercueils, renouvelle le cache du service worker et utilise le nouveau texte de victoire demandé.
