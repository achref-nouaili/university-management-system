# Prototype v3 — Services universitaires

Le prototype est un site **statique** : HTML, CSS et JavaScript, sans serveur, sans base de données et sans installation. Les polices sont incluses dans `fonts/` : le site ne dépend d'aucun service externe.

Les données de démonstration sont créées à la première ouverture. Elles sont ensuite enregistrées dans le navigateur de chaque visiteur (localStorage) et calculées autour de la semaine en cours.

## Ouvrir en local
Double-cliquez sur `index.html`.

## Mettre en ligne sur GitHub Pages
1. Dans le dépôt du projet, créez un dossier `prototype/` et copiez-y **le contenu** de ce dossier : `index.html`, `css/`, `js/`, `fonts/`, `.nojekyll`, etc.
2. Faites un commit, puis un push sur `main` (GitHub Desktop : *Commit to main*, puis *Push origin*).
3. Sur github.com, ouvrez le dépôt, puis **Settings → Pages → Source : Deploy from a branch → `main`, dossier `/ (root)` → Save**.
4. Après 1 à 2 minutes, le lien est : `https://<compte>.github.io/<depot>/prototype/`

Avec un compte GitHub gratuit, Pages ne publie que les dépôts **publics**. Si votre dépôt est privé, utilisez https://app.netlify.com/drop : glissez le dossier, puis créez un compte gratuit pour garder le lien.

## Comptes de démonstration (mot de passe `demo123`)
| Rôle | E-mail |
|---|---|
| Étudiante (3 LSI 2) | amira.benali@ums.test |
| Enseignante (Applications réparties) | leila.mansouri@ums.test |
| Scolarité | sonia.khelifi@ums.test |

Les trois comptes s'ouvrent aussi d'un clic depuis la page de connexion.

## Parcours à montrer
1. **Scolarité, emploi du temps** : cliquez sur le TP de Big Data du jeudi. Mettez la salle B12 : le conflit est signalé, l'enregistrement est bloqué et les salles libres sont proposées. Choisissez-en une : le message exact envoyé aux étudiants s'affiche. Enregistrez.
2. **Scolarité, création de séance** : cliquez sur un créneau vide de la grille pour créer une séance à cet endroit.
3. **Enseignante, notes** : saisissez des notes. Entrée passe à l'étudiant suivant, 21 est refusé, et la moyenne se calcule en direct. Ensuite, publiez.
4. **Enseignante, appel** : marquez des absents, puis validez.
5. **Étudiante** : la notification de changement, la nouvelle note, l'absence, et la semaine avec la séance « Modifiée ».
6. **Scolarité, utilisateurs** : créez un compte (bouton « Générer » pour le mot de passe), puis connectez-vous avec ce compte.

Pour figer la date et l'heure pendant une présentation, ajoutez à l'adresse : `?today=2026-11-03&time=10:40`. Avec ces valeurs, une séance est « en cours » pour l'étudiante.

Le bouton « Réinitialiser les données » remet les données de départ. Il se trouve dans la barre latérale, dans le menu du compte sur tablette et téléphone, et sur la page de connexion.

## Écrans couverts
| Taille | Navigation | Emploi du temps | Dialogues |
|---|---|---|---|
| Bureau ≥ 1100 px | barre latérale | grille à l'échelle du temps | fenêtre ; éditeur de séance en tiroir (ancré à côté de la grille au-delà de 1600 px) |
| Tablette 700–1099 px | rail d'icônes | grille, ou agenda sous 900 px | tiroir |
| Téléphone < 700 px | barre du haut + onglets | agenda jour par jour | feuille montante |

Le site a été testé à 1440, 1280, 1024, 834, 390 et 360 px de large, sans défilement horizontal de la page.

## Limites (à dire à la prof)
- **Pas de serveur** : les modifications restent dans le navigateur de chaque visiteur.
- **Connexion simulée** : pas de JWT, et les mots de passe sont stockés en clair. L'application finale utilisera Spring Security, JWT et BCrypt.
- **Correspondance avec l'application finale** : les fonctions de `js/store.js` reprennent les services et les routes du dossier de conception. Elles seront remplacées par des appels à l'API Spring Boot.

## Structure
```
index.html          page unique (routage #/...)
DESIGN.md           direction de design : concept, palette, typographie, principes
css/style.css       système de design et adaptation aux écrans
fonts/              Fira Sans, Fira Sans Condensed, IBM Plex Sans Arabic (licence OFL)
js/util.js          dates en français, pictogrammes, messages
js/store.js         données du prototype (tables du dossier de conception)
js/ui.js            coquille, panneau, frise, grille horaire, agenda, dialogues
js/student.js       espace étudiant
js/teacher.js       espace enseignant
js/admin.js         espace scolarité
js/app.js           routeur et connexion
```
