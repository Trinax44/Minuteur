# Minuteur

Minuteur d'intervalles (travail / repos) pour iPhone, sous forme d'application web installable (PWA).
Gratuit, sans pub, fonctionne hors ligne. Les données restent sur le téléphone.

## Fonctions

- **Minuteur** : entraînement rapide (séries, travail, repos, « ignorer le dernier repos »), bouton marque-page pour l'enregistrer.
- **Entraînements** : entraînements prêts à l'emploi (Abdos, Bas du corps, Haut du corps, Tabata, HIIT) et création de tes propres entraînements à plusieurs exercices.
- **Écran de séance** : couleur selon la phase (orange préparation, vert travail, bleu repos), temps restant total, pause/reprise, précédent/suivant, bips 3-2-1, annonces vocales en français, écran maintenu allumé.
- **Historique** : calendrier mensuel avec 💪 les jours d'entraînement, statistiques du mois, remarques sur chaque séance.
- **Paramètres** : sons, voix, vibrations, durée de préparation, export/import des données.

## Installer sur l'iPhone

1. Ouvrir l'adresse du site dans **Safari**.
2. Bouton **Partager** → **Sur l'écran d'accueil**.
3. Lancer « Minuteur » depuis l'écran d'accueil : il s'ouvre en plein écran comme une vraie app.

## Mise en ligne (gratuite) avec GitHub Pages

Le site est servi depuis la branche `gh-pages` ; le workflow `.github/workflows/pages.yml` y recopie `main` à chaque push.
Adresse : https://trinax44.github.io/Minuteur/

## Tester en local

```sh
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000.
