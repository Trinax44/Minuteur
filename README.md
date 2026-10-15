# Minuteur

Minuteur d'intervalles (travail / repos) pour iPhone, sous forme d'application web installable (PWA).
Gratuit, sans pub, fonctionne hors ligne. Les données restent sur le téléphone.

## Fonctions

- **Minuteur** : séance express (séries, effort, récup), durée totale et frise des phases, enregistrement en séance.
- **Bibliothèque de 876 exercices** (salle et maison) avec photos du mouvement, muscles travaillés, niveau, consignes en français, filtres par muscle et matériel, recherche.
- **Séances** : programmes prêts à l'emploi (dont Push / Pull / Jambes en salle) et création de séances en choisissant ses exercices.
- **Écran de séance** : anneau de progression coloré (orange préparation, vert effort, bleu récup), photos de l'exercice en cours, bips 3-2-1, annonces vocales, écran maintenu allumé.
- **Suivi** : calendrier, jours d'affilée, statistiques du mois, notes sur chaque séance.
- **Réglages** : sons, voix, vibrations, préparation, export/import des données.

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

## Crédits

Exercices et photos : [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domaine public, Unlicense). Noms et consignes traduits en français.
