# L'Immobilier Angevin — site internet

Site d'une seule page (`index.html`), même squelette que cotepresquile.com et lacabane-immo.com,
aux couleurs du logo : marine `#021430`, rouge `#DC071D`, blanc. Police : Montserrat.

## Pages
Accueil · Acheter · Vendre · Estimer (5 étapes) · Parrainer · Outils (4 simulateurs) ·
L'agence · Contact · Favoris · fiche de chaque bien (galerie, favoris, fiche PDF, partage, DPE, carte).

**Location désactivée** (Charles n'en fait pas pour l'instant) : `AGENCE.location = false`. Le code location reste en place
(fiches, filtres) mais le menu, les textes et les annonces à louer sont retirés ; pour la réactiver, passer à `true`
et remettre les blocs « Louer » dans `_parts/body.html`.

## À compléter avant la mise en ligne
1. **Coordonnées** : en haut du script principal de `index.html`, bloc `var AGENCE = { … }`
   (téléphone, e-mail, WhatsApp, adresse, réseaux sociaux, montant du parrainage).
   Tous les boutons « Nous appeler », le pied de page, la bulle WhatsApp et la section réseaux se mettent à jour seuls.
2. **Formulaires** : créer une clé gratuite sur web3forms.com avec l'e-mail de l'agence et la mettre dans `AGENCE.web3formsKey`.
   Sans clé, les formulaires affichent « aperçu » au lieu de faire semblant d'envoyer.
3. **Mentions légales et honoraires** : tous les champs encadrés en pointillés rouges (`[à compléter]`)
   — carte professionnelle (CCI de Maine-et-Loire), RCS/SIRET, garantie financière, RCP, médiateur, barème vente et location.
4. **Annonces** : branchées sur le flux 3G IMMO de Charles (`AGENCE.flux3G`, le même que le site Sabolien, mis à jour toutes les 4 h).
   Seuls les biens situés dans les 29 communes d'Angers Loire Métropole (liste `SECTEUR_ANGERS`) s'affichent ; un bien sans commune est ignoré.
   `data/biens.json` (vide) sert de secours ; les anciennes annonces fictives sont dans `_parts/biens-demo.json`.
6. **Domaine** : ajouter `<link rel="canonical">`, les URL absolues `og:url`/`og:image` et un `sitemap.xml`.

## Modifier le site
Le fichier `index.html` est généré par `python3 _parts/build.py` à partir du code de cotepresquile
(`_parts/source-cotepresquile.html`) et des pages réécrites (`_parts/body.html`, `head.html`, `angevin.css`,
`build_js.py`, `legal.js`, `carte-angers.svg`). Modifier ces fichiers puis relancer le script,
ou modifier `index.html` directement si on abandonne le script.

Aperçu local : copier le dossier dans `/tmp/angevin_preview` puis `python3 -m http.server 4631 --directory /tmp/angevin_preview`.

Crédits photos : voir `_parts/credits.md`.
