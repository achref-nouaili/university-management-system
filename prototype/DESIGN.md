# Direction de design (v3) : « Signalétique de campus »

## Sujet, public et mission
- **Produit** : la plateforme de services universitaires de l'institut.
- **Public** : étudiants (surtout sur téléphone), enseignants (ordinateur portable en salle, téléphone), scolarité (ordinateur).
- **Mission principale** : dire à chacun **quoi, quand, où**, et **ce qui a changé**. Ensuite, permettre aux enseignants de saisir les notes et l'appel sans friction, et à la scolarité de tenir un emploi du temps sans conflit.

## Concept
L'interface fonctionne comme la signalétique d'un campus :
- un lettrage condensé de panneau pour les heures, les salles et les titres ;
- des repères de type de séance (Cours, TD, TP) pensés comme des lignes de transport, avec une couleur fixe par type, toujours accompagnée de son texte ;
- un seul panneau fort, « Prochaine séance », lisible d'un coup d'œil ;
- un logotype bilingue français/arabe, comme la signalétique des institutions tunisiennes. Le pictogramme est une arche : le portail.

## Palette
| Nom | Hex | Rôle |
|---|---|---|
| Encre | `#172A4A` | Texte, boutons principaux, panneaux |
| Bleu Sidi | `#1F62B3` | Accent unique : liens, focus, sélection, « maintenant », type Cours |
| Chaux | `#FFFFFF` | Surfaces de travail |
| Pierre | `#F4F6F8` | Navigation, zones en retrait |
| Trait | `#E3E7ED` | Filets et séparations |

- **Types de séance**, réservés aux séances : Cours `#1F62B3`, TD `#7A3E96`, TP `#0F7663`.
- **États** : succès `#1D7544`, attention `#975400`, erreur `#B3261E`.
- **Contrastes** : texte secondaire au minimum 4,7:1 ; bordures de champs 3:1.

## Typographie
- **Fira Sans** (400, 500, 600) : texte et interface. Elle est issue de FF Meta (Erik Spiekermann), une famille née de la signalétique ; excellente lisibilité sur écran.
- **Fira Sans Condensed** (500, 600) : titres de page, heures et salles, blocs de la grille horaire, onglets mobiles. La chasse étroite fait tenir « Virtualisation et Cloud » dans une colonne de jour.
- **IBM Plex Sans Arabic** (500) : la ligne arabe du logotype uniquement.
- **Chiffres** : chiffres tabulaires partout où l'on compare des heures, des notes ou des effectifs.
- **Hébergement** : polices auto-hébergées (licence OFL), donc aucune dépendance externe pour le lien de démonstration.

## Mise en page
```
Bureau ≥ 1100 px                     Tablette 700–1099 px        Mobile < 700 px
┌────────┬──────────────────────┐   ┌───┬──────────────────┐   ┌──────────────────┐
│ ⌂ Logo │ Titre       actions  │   │ ⌂ │ Titre            │   │ ⌂ Services   🔔 ○ │
│ ─────  │ ┌── Panneau ───────┐ │   │ ☼ │ ┌── Panneau ───┐ │   │ Titre            │
│ ☼ Auj. │ │ 10:15   B12      │ │   │ ▦ │ └──────────────┘ │   │ ┌── Panneau ───┐ │
│ ▦ EDT  │ └──────────────────┘ │   │ ✎ │ contenu          │   │ └──────────────┘ │
│ ✎ Notes│ contenu | à côté     │   │ ○ │                  │   │ contenu          │
│ ...    │                      │   │   │                  │   ├──────────────────┤
│ ○ Nom  │                      │   │ ○ │                  │   │ ☼  ▦  ✎  ○ onglets│
└────────┴──────────────────────┘   └───┴──────────────────┘   └──────────────────┘
```
- **Alignement** : tout est aligné à gauche, sur une grille de 4 px (espacements 4, 8, 12, 16, 24, 32, 40, 48).
- **Grille horaire** :
  - à 900 px et plus, une vraie échelle de temps : hauteur proportionnelle à la durée, pause déjeuner, ligne « maintenant » ;
  - sous 900 px, un agenda jour par jour avec un sélecteur de jours.
- **Dialogues** : fenêtre centrée sur ordinateur, tiroir à droite pour l'édition de séance (panneau ancré à côté de la grille à partir de 1600 px), feuille montante sur téléphone.
- **Tableaux** : sur téléphone, ils deviennent des listes à deux lignes ; la grille d'occupation des salles défile horizontalement, la colonne des salles restant fixe.

## Principes
1. **Quoi, quand, où d'abord** : l'heure et la salle dominent la typographie.
2. **Une seule audace** : le panneau. Tout le reste est calme : blanc, filets, petits rayons.
3. **Les couleurs de type ne servent qu'aux types.** Les états ont leurs propres couleurs.
4. **La structure est de l'information** : un filet sépare des données ; aucune carte décorative.
5. **Le mouvement répond à une action** : ouvrir, enregistrer, confirmer. Aucune animation d'entrée gratuite.

## Revue du plan (ce qui a été rejeté)
- **Papier crème + titres à empattements + étiquettes en chasse fixe** : c'est l'esthétique « éditoriale » par défaut des pages générées. Je l'ai remplacée par la signalétique, qui vient du sujet.
- **Tuiles de statistiques identiques et cartes partout (v1/v2)** : remplacées par des lignes de chiffres séparées par des filets, des listes et un seul panneau.
- **Étiquettes en capitales au-dessus des titres, et métadonnées « A · B · C »** : remplacées par des titres en casse normale, avec des pictogrammes (salle, enseignant) ou de vraies colonnes.
- **Panneau principal flottant et arrondi** (effet à la mode) : remplacé par une navigation en retrait sur fond Pierre et un plan de travail blanc.
