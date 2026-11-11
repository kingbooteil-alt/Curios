# Curios — première version jouable (PWA)

Curios est une application web progressive en français, conçue pour Android. Cette version contient le parcours principal : packs de trois disciplines, lecture par sections, quiz à variantes, récompense de carte, collections, encyclopédie, profil local et export de sauvegarde.

## Important : périmètre réel de cette version

- Le projet est une **première version fonctionnelle**, pas encore la version finale complète demandée.
- Le catalogue embarqué contient actuellement 15 cours de démonstration rédigés. Il ne contient pas encore les 500+ cours visés.
- Les cartes utilisent pour le moment des symboles et des visuels de substitution, pas encore les photographies réalistes définitives.
- La sauvegarde fonctionne localement sur l'appareil. La connexion e-mail/Google et la synchronisation en ligne ne sont pas encore configurées.
- Le projet est structuré pour recevoir un catalogue beaucoup plus vaste sans changer le moteur de l'application.

## Tester sur ordinateur

Ouvrir `index.html` dans un navigateur. Certaines fonctions PWA, notamment l'installation et le service worker, nécessitent un hébergement HTTPS.

## Publier gratuitement avec GitHub Pages

1. Créer un compte sur https://github.com
2. Créer un dépôt public nommé `curios`.
3. Envoyer tous les fichiers de ce dossier à la racine du dépôt (`index.html`, `app.js`, `courses.js`, `manifest.webmanifest`, `sw.js`, `icon.svg`).
4. Dans le dépôt, ouvrir **Settings → Pages**.
5. Dans **Build and deployment**, choisir **Deploy from a branch**, puis `main` et `/ (root)`, et enregistrer.
6. Attendre la publication. GitHub affichera une adresse du type `https://PSEUDO.github.io/curios/`.
7. Ouvrir cette adresse dans Chrome sur Android, puis menu ⋮ → **Installer l'application** ou **Ajouter à l'écran d'accueil**.

## Structure du contenu

Chaque cours dans `courses.js` comporte :
- `id`, `title`, `discipline`, `icon`, `color`, `summary`, `minutes`
- `lead`, `sections`, `fact`, `card`
- `questions` : banque de questions (le moteur en tire cinq au hasard à chaque tentative)

Pour ajouter un cours, copier le modèle d'un cours existant dans `courses.js`, en lui donnant un identifiant unique. Prévoir une banque de questions supérieure à cinq pour varier les tentatives.

## Limites à traiter avant une version publique

- Mettre en place un service d'authentification et de synchronisation cloud (par exemple Supabase sur son offre gratuite), avec les règles de sécurité adaptées.
- Ajouter de vraies photographies et illustrations avec licences vérifiées et crédits.
- Étendre et relire le catalogue jusqu'à 500 cours ou davantage, avec sources fiables pour chaque sujet.
- Renforcer les quiz : formats d'association, chronologie, localisation et identification sur image.
- Ajouter des tests sur petits écrans et gestion de mises à jour du cache.

Aucun secret API ne doit être placé dans les fichiers JavaScript publics.
