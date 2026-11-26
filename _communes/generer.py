#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pages statiques « Immobilier à <commune> » (SEO local) — L'Ardoise Immobilière.

Usage :  python3 _communes/generer.py      (depuis n'importe quel dossier)

Écrit, à la racine du site :
  immobilier/index.html              page « Nos secteurs »
  immobilier/<slug>/index.html       une page par commune (contenu : _communes/communes.json)
  assets/pages.css                   feuille de style de ces pages
  assets/biens-commune.js            affichage des biens du flux 3G sur chaque page
  sitemap.xml, robots.txt            (écrasés)

Python 3 standard, aucune dépendance. Ne touche ni à index.html ni à _parts/ (lus seulement).
Pour passer au nom de domaine : changer BASE_URL ci-dessous et relancer.
"""
BASE_URL = "https://galfomorel-droid.github.io/immobilier-angevin/"

import datetime
import html
import json
import os
import re

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)

FLUX_3G = "https://raw.githubusercontent.com/galfomorel-droid/charles-morel-immobilier/main/data/biens.json"
NOM = "L'Ardoise Immobilière"
CONSEILLER = "Charles MOREL"
DUO = [  # même ordre et mêmes coordonnées que la section équipe du site
    {"nom": "Charles MOREL", "role": "Cofondateur", "tel": "06 38 55 53 55", "intl": "+33638555355", "photo": "img/charles-morel-avatar.webp"},
    {"nom": "Antoine HÉRY", "role": "Cofondateur", "tel": "06 82 87 33 31", "intl": "+33682873331", "photo": "img/equipe-antoine-hery-avatar.webp"},
]
TEL = "06 38 55 53 55"
TEL_INTL = "+33638555355"
# Adresses e-mail : _communes/coordonnees.json (emails_actifs = false tant que les boîtes de lardoiseimmobiliere.com ne fonctionnent pas)
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "coordonnees.json"), encoding="utf-8") as _f:
    _COORD = json.load(_f)
EMAIL = _COORD["emails"]["contact"] if _COORD["emails_actifs"] else _COORD["email_actuel"]
EMAILS_DUO = ({"Charles MOREL": _COORD["emails"]["charles"], "Antoine HÉRY": _COORD["emails"]["antoine"]} if _COORD["emails_actifs"] else {})
MENTION = "Charles MOREL, agent commercial 3G IMMO · RSAC Le Mans 900 233 800"
BAREME = [
    ("Jusqu'à 100 000 € net vendeur", "forfait de 5 000 € TTC"),
    ("De 100 001 à 300 000 €", "5 % TTC"),
    ("Au-delà de 300 000 €", "4 % TTC"),
]
AUJOURDHUI = datetime.date.today().isoformat()


# ------------------------------------------------------------------ outils
def esc(s):
    return html.escape(str(s), quote=True)


def typo(s):
    """Échappe pour HTML puis applique les espaces insécables françaises."""
    s = esc(s)
    s = re.sub(r" ([?!;:»])", "\u202f\\1", s)      # espace fine avant ? ! ; : »
    s = s.replace("« ", "«\u202f")
    s = re.sub(r"(\d) (\d{3})", "\\1\u202f\\2", s)  # 100 000
    s = re.sub(r"(\d) (€|%)", "\\1\u00a0\\2", s)     # 5 000 €, 5 %
    s = s.replace(" TTC", "\u00a0TTC")
    return s


def plain(s):
    """Texte brut (JSON-LD, meta) avec les mêmes insécables, sans échappement HTML."""
    return html.unescape(typo(s))


def jsonld(obj):
    txt = json.dumps(obj, ensure_ascii=False, indent=1)
    return '<script type="application/ld+json">\n' + txt.replace("</", "<\\/") + "\n</script>"


def ecrire(chemin_rel, contenu):
    chemin = os.path.join(RACINE, chemin_rel)
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(contenu)
    return chemin_rel


def lire_constantes_site():
    """Reprend (lecture seule) les listes PHOTOS_BANDEAU et COMMUNES_FORCEES du site principal."""
    src = ""
    # depuis la phase 4 (26/11/2026), le JavaScript du site est dans assets/app.<empreinte>.js
    for f in ["_parts/build_js.py", "index.html"] + sorted("assets/" + n for n in os.listdir(os.path.join(RACINE, "assets")) if n.startswith("app.") and n.endswith(".js")):
        try:
            with open(os.path.join(RACINE, f), encoding="utf-8") as h:
                src = h.read()
            if "PHOTOS_BANDEAU" in src:
                break
        except OSError:
            pass
    bandeau, forcees = {}, {}
    m = re.search(r"var PHOTOS_BANDEAU = (\{[^}]*\})", src)
    if m:
        try:
            bandeau = json.loads(m.group(1))
        except ValueError:
            pass
    m = re.search(r"var COMMUNES_FORCEES = \{([^}]*)\}", src)
    if m:
        for i, v, cp in re.findall(r"(\d+)\s*:\s*\[\s*'([^']+)'\s*,\s*'(\d{5})'\s*\]", m.group(1)):
            forcees[i] = [v, cp]
    return bandeau, forcees


# ------------------------------------------------------------------ morceaux communs
def head(titre, description, chemin, root, ldjson):
    url = BASE_URL + chemin
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(titre)}</title>
<meta name="description" content="{esc(plain(description))}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{esc(url)}">
<meta property="og:site_name" content="{esc(NOM)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="{esc(titre)}">
<meta property="og:description" content="{esc(plain(description))}">
<meta property="og:url" content="{esc(url)}">
<meta property="og:image" content="{esc(BASE_URL)}og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#021430">
<link rel="icon" type="image/png" sizes="32x32" href="{root}favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="{root}icon-192.png">
<link rel="apple-touch-icon" href="{root}apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}assets/pages.css">
{ldjson}
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
"""


def entete(root):
    return f"""<header class="hd">
  <div class="hd-in">
    <a class="hd-logo" href="{root}" aria-label="{esc(NOM)}, accueil"><img src="{root}logo-ardoise-h-marine-450.webp" srcset="{root}logo-ardoise-h-marine-450.webp 450w, {root}logo-ardoise-h-marine-900.webp 900w" sizes="250px" alt="{esc(NOM)}" width="450" height="85"></a>
    <nav class="hd-nav" aria-label="Menu principal">
      <a href="{root}">Accueil</a>
      <a href="{root}annonce/">Acheter</a>
      <a href="{root}vendre/">Vendre</a>
      <a href="{root}estimation-immobiliere/">Estimer</a>
      <a href="{root}lagence/">L'agence</a>
      <a href="{root}contact/">Contact</a>
    </nav>
    <a class="hd-tel" href="tel:{TEL_INTL}" aria-label="Appeler l'agence au {TEL}">{ICONE_TEL}<span>{TEL.replace(' ', '&nbsp;')}</span></a>
  </div>
</header>
"""


ICONE_TEL = ('<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" '
             'd="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>')


def pied(root, communes, secteurs):
    # Logo complet blanc (monogramme, L'ARDOISE, IMMOBILIER)
    cols = []
    for cle, sect in secteurs.items():
        liens = "".join(f'<li><a href="{root}immobilier/{c["slug"]}/">{esc(c["nom"])}</a></li>'
                        for c in communes if c["secteur"] == cle)
        cols.append(f'<div><p class="ft-h">{esc(sect["nom"])}</p><ul>{liens}</ul></div>')
    return f"""<footer class="ft">
  <div class="ft-in">
    <div class="ft-brand">
      <a href="{root}"><img src="{root}logo-ardoise-blanc-400.webp" srcset="{root}logo-ardoise-blanc-400.webp 400w, {root}logo-ardoise-blanc-800.webp 800w" sizes="200px" alt="{esc(NOM)}" width="400" height="194" loading="lazy"></a>
    </div>
    {''.join(cols)}
    <div><p class="ft-h">Le site</p><ul>
      <li><a href="{root}">Accueil</a></li>
      <li><a href="{root}annonce/">Nos annonces</a></li>
      <li><a href="{root}immobilier/">Nos secteurs</a></li>
      <li><a href="{root}immobilier/prix/">Prix de l'immobilier</a></li>
      <li><a href="{root}vendre/">Vendre</a></li>
      <li><a href="{root}estimation-immobiliere/">Estimation gratuite</a></li>
      <li><a href="{root}honoraires/">Honoraires</a></li>
      <li><a href="{root}guides/">Guides</a></li>
      <li><a href="{root}lagence/">L'agence</a></li>
      <li><a href="{root}#parrainage">Parrainage</a></li>
      <li><a href="{root}contact/">Contact</a></li>
    </ul></div>
    <div><p class="ft-h">Nous contacter</p><ul>
      {''.join(f'<li>{esc(d["nom"])}<br><a href="tel:{d["intl"]}">{d["tel"].replace(" ", "&nbsp;")}</a></li>' for d in DUO)}
      <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
    </ul></div>
  </div>
  <div class="ft-bas">
    <p>© {datetime.date.today().year} {esc(NOM)} · {esc(MENTION)}</p>
    <p class="ft-legal"><a href="{root}mentions-legales/">Mentions légales</a> · <a href="{root}honoraires/">Honoraires</a> · <a href="{root}confidentialite/">Protection des données</a> · <a href="{root}cgu/">CGU</a> · <a href="{root}cookies/">Cookies</a></p>
    <a href="https://www.creationsiteimmobilier.fr/" target="_blank" rel="noopener">Site créé par creationsiteimmobilier</a>
  </div>
</footer>
"""


def fil_ariane(root, items):
    """items : liste de (libellé, lien ou None)."""
    parts = []
    for i, (lib, href) in enumerate(items):
        if href:
            parts.append(f'<li><a href="{href}">{esc(lib)}</a></li>')
        else:
            parts.append(f'<li aria-current="page">{esc(lib)}</li>')
    return f'<nav class="ariane" aria-label="Fil d\'Ariane"><ol>{"".join(parts)}</ol></nav>'


def ld_agence(area, url):
    return {
        "@type": "RealEstateAgent",
        "@id": BASE_URL + "#agence",
        "name": NOM,
        "url": BASE_URL,
        "telephone": TEL_INTL,
        "email": EMAIL,
        "image": BASE_URL + "og-image.jpg",
        "logo": BASE_URL + "logo-ardoise-marine.png",
        "employee": [{"@type": "Person", "name": d["nom"], "telephone": d["intl"]} for d in DUO],
        "areaServed": area,
    }


def ld_ariane(items):
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(items)
        ],
    }


def bloc_cta(root, titre, texte):
    return f"""<section class="cta" aria-labelledby="cta-t">
  <div class="wrap"><div class="cta-in">
    <h2 id="cta-t">{typo(titre)}</h2>
    <p>{typo(texte)}</p>
    <div class="btns">
      <a class="btn btn-rouge" href="{root}#estimation">Estimer mon bien</a>
      <a class="btn btn-blanc" href="{root}#contact">Nous contacter</a>
      <a class="btn btn-ligne" href="tel:{TEL_INTL}">{ICONE_TEL}<span>{TEL.replace(' ', '&nbsp;')}</span></a>
    </div>
    <p class="cta-note">Vous connaissez quelqu'un qui souhaite vendre ? <a href="{root}#parrainage">Notre parrainage vous rapporte 400&nbsp;€</a>.</p>
  </div></div>
</section>
"""


ETAPES = [
    ("Estimation gratuite", "Nous visitons votre bien, étudions les ventes comparables et vous présentons un prix argumenté, sans engagement."),
    ("Mise en valeur", "Photos soignées, description précise et conseils simples pour présenter votre bien sous son meilleur jour."),
    ("Diffusion et visites", "Votre annonce est diffusée sur notre site et via le réseau 3G IMMO ; nous filtrons les contacts et organisons les visites."),
    ("Jusqu'à l'acte", "Nous vérifions le financement des acquéreurs, préparons l'avant-contrat avec le notaire et restons à vos côtés jusqu'à la signature."),
]


def bloc_bareme():
    lignes = "".join(f"<tr><th scope=\"row\">{typo(a)}</th><td>{typo(b)}</td></tr>" for a, b in BAREME)
    return f"""<div class="bareme">
      <p class="bareme-t">Nos honoraires de vente</p>
      <table><tbody>{lignes}</tbody></table>
      <p class="petit">Honoraires à la charge de l'acquéreur. L'estimation est gratuite et sans engagement.</p>
    </div>"""


def bloc_conseiller(root):
    cartes = "".join(f"""<div class="duo-c">
        <img src="{root}{d['photo']}" alt="{esc(d['nom'])}" width="400" height="400" loading="lazy">
        <p class="conseiller-n">{esc(d['nom'])}</p>
        <p><a class="lien" href="tel:{d['intl']}">{d['tel'].replace(' ', '&nbsp;')}</a></p>
        {f'<p class="petit"><a class="lien duo-m" href="mailto:{EMAILS_DUO[d["nom"]]}">{EMAILS_DUO[d["nom"]].replace("@", "<wbr>@")}</a></p>' if d['nom'] in EMAILS_DUO else ''}
      </div>""" for d in DUO)
    return f"""<aside class="conseiller duo">
      <p class="duo-t">{typo("Vos interlocuteurs, du premier rendez-vous à la signature chez le notaire")}</p>
      <div class="duo-g">{cartes}</div>
      <p class="petit">{typo("Nous intervenons à Angers et dans son agglomération, ainsi qu'à Sablé-sur-Sarthe et dans ses alentours.")} <a class="lien" href="mailto:{EMAIL}">Nous écrire</a></p>
    </aside>"""


# ------------------------------------------------------------------ prix de l'immobilier (ventes réelles DVF, data/prix.json)
def charger_prix():
    try:
        with open(os.path.join(RACINE, "data", "prix.json"), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


PRIX = charger_prix()
MIN_VENTES = 10


def periode_txt():
    p = (PRIX or {}).get("periode") or []
    if len(p) < 2:
        return ""
    fin = "fin " + p[1][:4] if p[1].endswith("-12-31") else p[1]
    return f"de {p[0][:4]} à {fin}"


def eur_m2(n):
    return typo(f"{int(n):,} €".replace(",", " ")) + "/m²"


def carte_prix(titre, st):
    return f"""<div class="prix-c">
          <p class="prix-c-t">{esc(titre)}</p>
          <p class="prix-c-v">{eur_m2(st["p50"])}</p>
          <p class="prix-c-d">{typo(f"La moitié des ventes entre {int(st['p25']):,} € et {int(st['p75']):,} € le m²".replace(",", " "))}</p>
          <p class="prix-c-n">{typo(f"{int(st['n']):,} ventes".replace(",", " "))}</p>
        </div>"""


def _charger(nom):
    try:
        with open(os.path.join(RACINE, "data", nom), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


DETAIL = _charger("prix-detail.json")          # ventes DVF par année (_parts/dvf_detail.py)
VENDUS = (_charger("vendus-3g.json") or {}).get("vendus", [])   # nos ventes réelles (vendus_3g.py)
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
CENTRES = {"angers": ("d'Angers", (47.4736, -0.5542)), "sable": ("de Sablé-sur-Sarthe", (47.8399, -0.3347))}


def km(a, b):
    import math
    la1, lo1 = map(math.radians, a); la2, lo2 = map(math.radians, b)
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def repere_distance(c):
    """Distance à vol d'oiseau jusqu'au centre du secteur (calculée, pas estimée)."""
    nom_c, ctr = CENTRES[c["secteur"]]
    d = km(tuple(c["geo"]), ctr)
    if d < 2:
        return ""
    return f"À {round(d)} km à vol d'oiseau du centre {nom_c}"


def bloc_evolution(c):
    """Ventes DVF année par année : nombre de ventes et prix médian (affiché à partir de 8 ventes)."""
    d = ((DETAIL or {}).get("communes") or {}).get(c["nom"])
    if not d:
        return ""
    ans = sorted(d)
    lignes, petit_n = [], False
    for cle, lib in (("m", "Maisons"), ("a", "Appartements")):
        cel = []
        total = sum((d[an].get(cle) or {}).get("n", 0) for an in ans)
        if total < 10:
            continue
        for an in ans:
            st = d[an].get(cle) or {"n": 0}
            petit_n = petit_n or 0 < st["n"] < 20
            v = (eur_m2(st["p50"]) + "<br>") if "p50" in st else ""
            cel.append(f'<td>{v}<span class="petit">{typo(str(st["n"]) + " vente" + ("s" if st["n"] > 1 else ""))}</span></td>')
        lignes.append(f'<tr><th scope="row">{lib}</th>{"".join(cel)}</tr>')
    if not lignes:
        return ""
    entete = "".join(f'<th scope="col">{an}</th>' for an in ans)
    note = " Moins de 20 ventes dans l'année : la médiane varie fortement d'un bien à l'autre, à lire avec prudence." if petit_n else ""
    return f"""
      <h3 class="evol-t">Année par année</h3>
      <div class="evol"><table><thead><tr><th></th>{entete}</tr></thead><tbody>{"".join(lignes)}</tbody></table></div>
      <p class="petit">{typo("Prix médian au m² et nombre de ventes enregistrées (DVF). Médiane affichée à partir de 8 ventes." + note)}</p>"""


def bloc_nos_ventes(c, root):
    v = sorted((x for x in VENDUS if x.get("ville") == c["nom"]), key=lambda x: x.get("date", ""), reverse=True)
    if not v:
        return ""
    cartes = "".join(f"""<li><img src="{root}{esc(x['img'])}" alt="{esc('Vendu : ' + (x.get('type') or 'bien').lower() + ' à ' + c['nom'])}" width="320" height="220" loading="lazy">
        <p class="nv-t">{esc(x.get('type') or 'Bien')} vendu{'e' if (x.get('type') or '').lower() in ('maison', 'propriété') else ''}</p>
        <p class="petit">{esc(MOIS[int(x['date'][5:7]) - 1] + ' ' + x['date'][:4]) if x.get('date') else ''}</p></li>""" for x in v[:12])
    n = len(v)
    return f"""
  <section class="sec" aria-labelledby="nos-ventes">
    <div class="wrap">
      <p class="kicker">Nos ventes</p>
      <h2 id="nos-ventes">{typo(f"{n} bien{'s' if n > 1 else ''} vendu{'s' if n > 1 else ''} par nos soins {c['a']}")}</h2>
      <ul class="nv">{cartes}</ul>
      <p class="petit">{typo("Ventes conclues par Charles MOREL, telles que publiées sur sa page 3G IMMO.")}</p>
    </div>
  </section>"""


def guides_commune(c, root):
    """Liens vers les guides utiles depuis une page commune."""
    l = []
    if c["slug"] == "angers":
        l.append(f'<a class="lien" href="{root}guides/prix-immobilier-quartiers-angers/">Prix par quartier d\'Angers</a>')
    g = "ou-acheter-autour-d-angers" if c["secteur"] == "angers" else "ou-acheter-autour-de-sable"
    autour = "d’Angers" if c["secteur"] == "angers" else "de Sablé"
    l.append(f'<a class="lien" href="{root}guides/{g}/">Où acheter autour {autour} ?</a>')
    l.append(f'<a class="lien" href="{root}guides/">Tous nos guides</a>')
    return "Nos guides : " + " · ".join(l)


def bloc_prix_commune(c, root):
    if not PRIX:
        return ""
    d = (PRIX.get("communes") or {}).get(c["nom"])
    if not d:
        return ""
    cartes = []
    if (d.get("m") or {}).get("n", 0) >= MIN_VENTES:
        cartes.append(carte_prix("Maisons", d["m"]))
    if (d.get("a") or {}).get("n", 0) >= MIN_VENTES:
        cartes.append(carte_prix("Appartements", d["a"]))
    if not cartes:
        return ""
    return f"""
  <section class="sec" aria-labelledby="prix">
    <div class="wrap">
      <p class="kicker">Prix de l'immobilier</p>
      <h2 id="prix">Prix au m² {esc(c["a"])}</h2>
      <p class="lead-2">{typo("Prix médians des ventes réellement conclues " + c["a"] + ", " + periode_txt() + ", d'après les données publiques DVF de l'administration fiscale. L'écart entre deux biens vient de l'emplacement, de l'état et des prestations : seule une visite permet de situer le vôtre.")}</p>
      <div class="prix-g">{"".join(cartes)}</div>{bloc_evolution(c)}
      <div class="btns"><a class="btn btn-rouge" href="{root}estimation-immobiliere/">Estimer mon bien</a><a class="btn btn-contour" href="{root}immobilier/prix/">Prix des communes voisines</a></div>
      <p class="petit">{typo("Source : Demandes de valeurs foncières (DVF), DGFiP, data.gouv.fr. Prix au m² de surface habitable, hors terrains à bâtir.")}</p>
    </div>
  </section>"""


def page_prix(communes, secteurs):
    root = "../../"
    chemin = "immobilier/prix/"
    url = BASE_URL + chemin
    titre = "Prix au m² d'Angers à Sablé-sur-Sarthe (DVF) | L'Ardoise"
    desc = "Prix médian au m² des maisons et appartements vendus, commune par commune, d'Angers à Sablé-sur-Sarthe : ventes réelles (DVF) " + periode_txt() + "."
    par_nom = {x["nom"]: x for x in communes}
    blocs = []
    for cle, sect in secteurs.items():
        st = (PRIX.get("secteurs") or {}).get(cle) or {}
        lignes = []
        rows = [(n, d) for n, d in (PRIX.get("communes") or {}).items() if d.get("s") == cle
                and max((d.get("m") or {}).get("n", 0), (d.get("a") or {}).get("n", 0)) >= MIN_VENTES]
        rows.sort(key=lambda r: -((r[1].get("m") or {}).get("n", 0) + (r[1].get("a") or {}).get("n", 0)))
        for n, d in rows:
            lien = f'<a class="lien" href="../{par_nom[n]["slug"]}/">{esc(n)}</a>' if n in par_nom else esc(n)
            def cel(k):
                x = d.get(k) or {}
                return f'{eur_m2(x["p50"])}<span>{typo(str(x["n"]) + " ventes")}</span>' if x.get("n", 0) >= MIN_VENTES else '<span>trop peu de ventes</span>'
            lignes.append(f'<tr><th scope="row">{lien}</th><td>{cel("m")}</td><td>{cel("a")}</td></tr>')
        resume = "".join(carte_prix(t, st[k]) for k, t in (("m", "Maisons"), ("a", "Appartements")) if (st.get(k) or {}).get("n", 0) >= MIN_VENTES)
        blocs.append(f"""<section class="sec{' sec-gris' if cle != 'angers' else ''}" aria-labelledby="p-{cle}">
    <div class="wrap">
      <h2 id="p-{cle}">{esc(sect["nom"])}</h2>
      <div class="prix-g">{resume}</div>
      <div class="tab-prix-w"><table class="tab-prix"><thead><tr><th scope="col">Commune</th><th scope="col">Maisons</th><th scope="col">Appartements</th></tr></thead>
      <tbody>{"".join(lignes)}</tbody></table></div>
    </div>
  </section>""")
    graph = {"@context": "https://schema.org", "@graph": [
        ld_ariane([("Accueil", BASE_URL), ("Nos secteurs", BASE_URL + "immobilier/"), ("Prix de l'immobilier", url)])]}
    corps = f"""{entete(root)}
<main id="contenu">
  <section class="intro">
    <div class="wrap">
      {fil_ariane(root, [("Accueil", root), ("Nos secteurs", root + "immobilier/"), ("Prix de l'immobilier", None)])}
      <p class="kicker">Ventes réelles · {esc(periode_txt())}</p>
      <h1>Prix de l'immobilier d'Angers à Sablé-sur-Sarthe</h1>
      <p class="lead">{typo("Prix médian au m² des maisons et des appartements réellement vendus, commune par commune, d'après les données publiques DVF de l'administration fiscale. Ces repères ne remplacent pas une estimation : l'emplacement, l'état et les prestations font varier la valeur d'un bien.")}</p>
      <div class="btns"><a class="btn btn-rouge" href="{root}#estimation">Estimer mon bien gratuitement</a></div>
    </div>
  </section>
  {"".join(blocs)}
  <section class="sec"><div class="wrap"><p class="petit">{typo("Source : Demandes de valeurs foncières (DVF), DGFiP, data.gouv.fr, " + periode_txt() + ". Prix médian au m² de surface habitable ; communes affichées à partir de " + str(MIN_VENTES) + " ventes.")}</p></div></section>
{bloc_cta(root, "Combien vaut votre bien ?", "Un avis de valeur argumenté, après visite, gratuit et sans engagement.")}
</main>
{pied(root, communes, secteurs)}
</body>
</html>
"""
    return chemin + "index.html", head(titre, desc, chemin, root, jsonld(graph)) + corps


# ------------------------------------------------------------------ page commune
AGENCES = ("angers", "sable-sur-sarthe")


def page_commune(c, communes, secteurs):
    root = "../../"
    par_slug = {x["slug"]: x for x in communes}
    sect = secteurs[c["secteur"]]
    nom, a = c["nom"], c["a"]
    cps = c["cp"]
    cp_txt = ", ".join(cps)
    chemin = f"immobilier/{c['slug']}/"
    url = BASE_URL + chemin
    # titre ≤ 60 caractères : le plus complet qui tient (SEO, 26/11/2026)
    agence = c["slug"] in AGENCES   # Angers et Sablé : pages « agence immobilière » (SEO, phase 3)
    titre = [t for t in ((f"Agence immobilière {a} : vente, achat | L'Ardoise", f"Agence immobilière {a} | L'Ardoise") if agence else ()) + (
                         f"Immobilier {a} : achat, vente, estimation | L'Ardoise",
                         f"Immobilier {a} : vente, achat | L'Ardoise",
                         f"Immobilier {a} | L'Ardoise Immobilière",
                         f"Immobilier {a} | L'Ardoise") if len(t) <= 60][0]

    # JSON-LD
    ville = {"@type": "City", "name": nom,
             "containedInPlace": {"@type": "AdministrativeArea", "name": c["dep"]}}
    faq_ld = {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": plain(q["q"]),
         "acceptedAnswer": {"@type": "Answer", "text": plain(q["a"])}} for q in c["faq"]]}
    graph = {"@context": "https://schema.org", "@graph": [
        ld_agence(ville, url),
        ld_ariane([("Accueil", BASE_URL), ("Nos secteurs", BASE_URL + "immobilier/"), (nom, url)]),
        dict(faq_ld, **{"@id": url + "#faq"}),
    ]}

    vivre = "".join(f"<p>{typo(p)}</p>" for p in c["vivre"])
    reperes = "".join(f"<li>{typo(r)}</li>" for r in c.get("reperes", []) + ([repere_distance(c)] if repere_distance(c) else []))
    acheter = "".join(f"<p>{typo(p)}</p>" for p in c["acheter"])
    etapes = "".join(f'<li><span class="etape-n">{i + 1}</span><div><h3>{typo(t)}</h3><p>{typo(d)}</p></div></li>'
                     for i, (t, d) in enumerate(ETAPES))
    faq = "".join(f'<details><summary>{typo(q["q"])}</summary><p>{typo(q["a"])}</p></details>' for q in c["faq"])
    voisins = "".join(
        f'<li><a href="../{v}/"><span>{esc(par_slug[v]["nom"])}</span><small>{esc(", ".join(par_slug[v]["cp"]))}</small></a></li>'
        for v in c["voisins"] if v in par_slug)
    secteur_js = esc(json.dumps(sect["alentours"], ensure_ascii=False))

    corps = f"""{entete(root)}
<main id="contenu">
  <section class="intro">
    <div class="wrap">
      {fil_ariane(root, [("Accueil", root), ("Nos secteurs", "../"), (nom, None)])}
      <p class="kicker">{esc(sect["nom"])} · {esc(cp_txt)}</p>
      <h1>{"Agence immobilière" if agence else "Immobilier"} {esc(a)}</h1>
      <p class="lead">{typo(c["intro"])}</p>
      <div class="btns">
        <a class="btn btn-rouge" href="{root}#estimation">Estimer mon bien</a>
        <a class="btn btn-marine" href="#biens">Voir nos biens</a>
      </div>
    </div>
  </section>

  <section class="sec" aria-labelledby="vivre">
    <div class="wrap grille-2">
      <div>
        <p class="kicker">Le cadre de vie</p>
        <h2 id="vivre">Vivre {esc(a)}</h2>
        {vivre}
      </div>
      <div class="reperes">
        <p class="reperes-t">Points de repère</p>
        <ul>{reperes}</ul>
      </div>
    </div>
  </section>

{bloc_prix_commune(c, root)}{bloc_nos_ventes(c, root)}
  <section class="sec sec-gris" aria-labelledby="vendre">
    <div class="wrap">
      <p class="kicker">Vendre</p>
      <h2 id="vendre">Vendre votre bien {esc(a)}</h2>
      <p class="lead-2">{typo(c["vendre"])}</p>
      <p>{typo("Estimation offerte, mise en valeur, diffusion sur les grands portails, visites filtrées et suivi jusqu'à l'acte :")} <a class="lien" href="{root}vendre/">notre méthode de vente, étape par étape</a>. {typo("Honoraires à la charge de l'acquéreur : forfait de 5 000 € TTC jusqu'à 100 000 € net vendeur, puis 5 % ou 4 % TTC")} (<a class="lien" href="{root}honoraires/">barème complet</a>).</p>
      <div class="grille-bas">{bloc_conseiller(root)}</div>
      <div class="btns"><a class="btn btn-rouge" href="{root}estimation-immobiliere/">Demander mon estimation gratuite</a></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="acheter">
    <div class="wrap etroit">
      <p class="kicker">Acheter</p>
      <h2 id="acheter">Acheter {esc(a)}</h2>
      {acheter}
      <p><a class="lien" href="{root}#contact">Confiez-nous votre recherche</a> : nous vous prévenons dès qu'un bien correspondant se présente.</p>
    </div>
  </section>

  <section class="sec sec-gris" id="biens" aria-labelledby="biens-t">
    <div class="wrap">
      <p class="kicker">Nos annonces</p>
      <h2 id="biens-t">Nos biens {esc(a)} et alentours</h2>
      <div id="biens-commune" class="biens" aria-live="polite"
           data-flux="{esc(FLUX_3G)}" data-commune="{esc(nom)}" data-a="{esc(a)}" data-root="{root}"
           data-secteur="{secteur_js}" data-alias="{esc(json.dumps(c.get("deleguees", []), ensure_ascii=False))}">
        <p class="biens-msg">Chargement des annonces…</p>
      </div>
      <noscript><p class="biens-msg">Retrouvez toutes nos annonces sur la page <a class="lien" href="{root}#acheter">Acheter</a>.</p></noscript>
      <div class="btns"><a class="btn btn-ligne-marine" href="{root}#acheter">Toutes nos annonces</a></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="faq">
    <div class="wrap etroit">
      <p class="kicker">Questions fréquentes</p>
      <h2 id="faq">Vos questions sur l'immobilier {esc(a)}</h2>
      <div class="faq">{faq}</div>
    </div>
  </section>

  <section class="sec sec-gris" aria-labelledby="proximite">
    <div class="wrap">
      <p class="kicker">{esc(sect["nom"])}</p>
      <h2 id="proximite">Nous intervenons aussi à proximité</h2>
      <ul class="voisins">{voisins}</ul>
      <p class="petit">{typo("Et aussi : " + sect["autres"] + ".")} <a class="lien" href="../">Voir tous nos secteurs</a></p>
      <p>{guides_commune(c, root)}</p>
    </div>
  </section>

{bloc_cta(root, f"Un projet immobilier {a} ?", "Estimation gratuite, conseils pour vendre, recherche du bien qui vous ressemble : parlons-en. Nous vous répondons personnellement.")}
</main>
{pied(root, communes, secteurs)}
<script src="{root}assets/biens-commune.js" defer></script>
</body>
</html>
"""
    page = head(titre, c["meta"], chemin, root, jsonld(graph)) + corps
    return chemin + "index.html", page


# ------------------------------------------------------------------ page « Nos secteurs »
def page_secteurs(communes, secteurs):
    root = "../"
    chemin = "immobilier/"
    url = BASE_URL + chemin
    titre = "Nos secteurs, d'Angers à Sablé-sur-Sarthe | L'Ardoise"
    desc = ("Nos communes pour acheter, vendre ou estimer : Angers et son agglomération, Sablé-sur-Sarthe "
            "et ses alentours, avec Charles MOREL et Antoine HÉRY.")
    area = [{"@type": "City", "name": c["nom"], "url": BASE_URL + f"immobilier/{c['slug']}/"} for c in communes]
    graph = {"@context": "https://schema.org", "@graph": [
        ld_agence(area, url),
        ld_ariane([("Accueil", BASE_URL), ("Nos secteurs", url)]),
        {"@type": "ItemList", "name": "Pages par commune", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": BASE_URL + f"immobilier/{c['slug']}/", "name": f"Immobilier {c['a']}"}
            for i, c in enumerate(communes)]},
    ]}
    groupes = []
    for cle, sect in secteurs.items():
        cartes = "".join(
            f'<li><a class="carte-c" href="{c["slug"]}/"><span class="carte-c-n">{esc(c["nom"])}</span>'
            f'<span class="carte-c-cp">{esc(", ".join(c["cp"]))}</span><span class="carte-c-t">{typo(c["teaser"])}</span>'
            f'<span class="carte-c-l">Immobilier {esc(c["a"])} →</span></a></li>'
            for c in communes if c["secteur"] == cle)
        groupes.append(f"""<section class="sec{' sec-gris' if cle != 'angers' else ''}" aria-labelledby="s-{cle}">
    <div class="wrap">
      <h2 id="s-{cle}">{esc(sect["nom"])}</h2>
      <p class="lead-2">{typo(sect["intro"])}</p>
      <ul class="cartes-c">{cartes}</ul>
      <p class="petit">{typo("Nous intervenons aussi à " + sect["autres"] + ".")}</p>
    </div>
  </section>""")
    corps = f"""{entete(root)}
<main id="contenu">
  <section class="intro">
    <div class="wrap">
      {fil_ariane(root, [("Accueil", root), ("Nos secteurs", None)])}
      <p class="kicker">Achat · Vente · Estimation</p>
      <h1>Nos secteurs, d'Angers à Sablé-sur-Sarthe</h1>
      <p class="lead">{typo("Nous intervenons à Angers et dans son agglomération, ainsi qu'à Sablé-sur-Sarthe et dans ses alentours, le long de la Sarthe. Choisissez votre commune pour découvrir son cadre de vie, nos conseils pour vendre ou acheter et nos biens disponibles.")}</p>
    </div>
  </section>
  {"".join(groupes)}
{bloc_cta(root, "Votre commune n'est pas dans la liste ?", "Nous intervenons dans tout le secteur d'Angers et autour de Sablé-sur-Sarthe : contactez-nous pour en parler, l'estimation est gratuite.")}
</main>
{pied(root, communes, secteurs)}
</body>
</html>
"""
    return chemin + "index.html", head(titre, desc, chemin, root, jsonld(graph)) + corps


# ------------------------------------------------------------------ CSS
CSS = """/* Pages « Immobilier à <commune> » — L'Ardoise Immobilière. Généré par _communes/generer.py : modifier le script, pas ce fichier. */
:root{--marine:#021430;--rouge:#F6A737;--rouge-t:#021430;--gris:#F5F6F9;--filet:#D6DBE5;--texte2:#5A6B86;--r:14px}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;font-family:Montserrat,system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:300;font-size:1rem;line-height:1.7;color:var(--marine);background:#fff}
img{max-width:100%;height:auto;display:block}
a{color:inherit}
h1,h2,h3{font-weight:800;line-height:1.2;margin:0 0 .6em;letter-spacing:-.01em}
h1{font-size:clamp(1.9rem,6vw,3rem)}
h2{font-size:clamp(1.45rem,4.2vw,2.1rem)}
h3{font-size:1.05rem;font-weight:700}
p{margin:0 0 1em}
strong{font-weight:600}
:focus-visible{outline:2px solid var(--rouge);outline-offset:3px}
.skip{position:absolute;left:-9999px;top:0;background:var(--marine);color:#fff;padding:.6rem 1rem;z-index:10}
.skip:focus{left:8px;top:8px}
.wrap{width:100%;max-width:1120px;margin:0 auto;padding:0 16px}
.etroit>*{max-width:820px}
@media(min-width:700px){.wrap{padding:0 28px}}

/* En-tête */
.hd{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--filet)}
.hd-in{max-width:1120px;margin:0 auto;padding:10px 16px;display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}
.hd-logo img{height:34px;width:auto}
.hd-nav{order:3;flex:1 1 100%;min-width:0;display:flex;gap:16px;justify-content:flex-start;overflow-x:auto;scrollbar-width:none;border-top:1px solid var(--filet);padding-top:6px}
.hd-nav::-webkit-scrollbar{display:none}
.hd-nav a{white-space:nowrap}
.hd-nav a{font-size:.8125rem;font-weight:500;letter-spacing:0;text-transform:none;text-decoration:none;padding:.45rem .3rem}
.hd-nav a:hover{color:var(--rouge)}
.hd-tel{margin-left:auto;display:inline-flex;align-items:center;gap:.4rem;background:var(--marine);color:#fff;text-decoration:none;border-radius:999px;padding:.45rem .9rem;font-size:.8125rem;font-weight:700;letter-spacing:.02em;white-space:nowrap}
.hd-tel:hover{background:#0D2650}
@media(max-width:400px){.hd-in{gap:8px 10px}.hd-logo img{height:25px}.hd-tel{padding:.45rem .75rem;font-size:.75rem;gap:.3rem}}
@media(min-width:860px){
  .hd-in{padding:14px 28px;flex-wrap:nowrap}
  .hd-logo img{height:44px}
  .hd-nav{order:0;flex:0 1 auto;margin-left:auto;border:0;padding:0;gap:22px;overflow:visible}
  .hd-tel{margin-left:8px}
}

/* Fil d'Ariane */
.ariane ol{list-style:none;margin:0 0 22px;padding:0;display:flex;flex-wrap:wrap;gap:4px;font-size:.8125rem;color:var(--texte2)}
.ariane li+li::before{content:"›";margin-right:6px}
.ariane a{color:var(--texte2)}
.ariane a:hover{color:var(--rouge)}

/* Sections */
.intro{background:var(--gris);padding:32px 0 48px;border-bottom:1px solid var(--filet)}
.sec{padding:56px 0}
.sec-gris{background:var(--gris)}
@media(min-width:860px){.intro{padding:44px 0 72px}.sec{padding:84px 0}}
.kicker{font-size:.75rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#F6A737;margin-bottom:.8em}
.lead{font-size:clamp(1.05rem,2.6vw,1.2rem);max-width:760px}
.lead-2{font-size:1.05rem;max-width:820px}
.petit{font-size:.875rem;color:var(--texte2)}
.lien{color:var(--rouge-t);font-weight:600;text-underline-offset:3px}
.grille-2{display:grid;gap:28px}
@media(min-width:860px){.grille-2{grid-template-columns:1.6fr 1fr;gap:56px;align-items:start}}
.grille-bas{margin-top:36px}
@media(min-width:860px){.grille-bas{grid-template-columns:1fr 1fr;gap:28px}}

/* Boutons pilule */
.btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;min-height:48px;padding:.75rem 1.6rem;border-radius:999px;font-size:.95rem;font-weight:600;letter-spacing:0;text-transform:none;text-decoration:none;border:1.5px solid transparent;transition:background .25s,color .25s,border-color .25s}
.btn-rouge{background:var(--rouge);color:#021430}
.btn-rouge:hover{background:#E08E1F}
.btn-marine{background:var(--marine);color:#fff}
.btn-marine:hover{background:#0B2A5C}
.btn-blanc{background:#fff;color:var(--marine)}
.btn-blanc:hover{background:var(--gris)}
.btn-ligne{border-color:rgba(255,255,255,.7);color:#fff}
.btn-ligne:hover{background:rgba(255,255,255,.12)}
.btn-contour{border-color:var(--marine);color:var(--marine);background:#fff}
.prix-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin:20px 0 8px}
.prix-c{background:#fff;border:1px solid var(--filet);border-radius:18px;padding:20px 22px}
.sec-gris .prix-c{background:#fff}
.prix-c p{margin:0}
.prix-c-t{font-size:.8rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--texte2)}
.prix-c-v{font-size:2rem;font-weight:800;color:var(--marine);line-height:1.2;margin:6px 0 4px!important}
.prix-c-d{font-size:.9rem;color:var(--texte2)}
.prix-c-n{font-size:.85rem;font-weight:600;margin-top:8px!important}
.tab-prix-w{overflow-x:auto;margin-top:18px;border:1px solid var(--filet);border-radius:14px;background:#fff}
.tab-prix{width:100%;border-collapse:collapse;font-size:.95rem}
.tab-prix th,.tab-prix td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--filet);vertical-align:top}
.tab-prix thead th{font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:var(--texte2);background:var(--gris)}
.tab-prix td span{display:block;font-size:.8rem;color:var(--texte2)}
.tab-prix tbody tr:last-child th,.tab-prix tbody tr:last-child td{border-bottom:0}
@media(max-width:520px){.tab-prix{font-size:.82rem}.tab-prix th,.tab-prix td{padding:8px 8px}.tab-prix thead th{font-size:.68rem;letter-spacing:.04em}}
.btn-contour:hover{background:var(--gris)}
.btn-ligne-marine{border-color:var(--marine);color:var(--marine)}
.btn-ligne-marine:hover{background:var(--marine);color:#fff}
@media(max-width:480px){.intro .btn,.cta .btn{flex:1 1 100%}}

/* Points de repère */
.reperes{background:var(--gris);border:1px solid var(--filet);border-radius:var(--r);padding:22px 24px}
.reperes-t{font-weight:700;font-size:.8125rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:.6em}
.reperes ul{list-style:none;margin:0;padding:0}
.reperes li{padding:.55rem 0 .55rem 1.3rem;border-bottom:1px solid var(--filet);position:relative;font-weight:500}
.reperes li:last-child{border-bottom:0}
.reperes li::before{content:"";position:absolute;left:0;top:1.05rem;width:7px;height:7px;border-radius:50%;background:var(--rouge)}

/* Étapes de vente */
.etapes{list-style:none;margin:32px 0 0;padding:0;display:grid;gap:14px}
.evol-t{font-size:1rem;margin:28px 0 10px}
.evol{overflow-x:auto}
.evol table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--filet);border-radius:var(--r);font-size:.92rem}
.evol th,.evol td{padding:10px 12px;border-bottom:1px solid var(--filet);text-align:left;vertical-align:top}
.evol thead th{font-weight:700;color:var(--marine)}
.evol td{font-weight:700;color:var(--marine)}
.evol td .petit{font-weight:400;color:var(--texte2)}
.nv{list-style:none;margin:20px 0 10px;padding:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
.nv li{background:#fff;border:1px solid var(--filet);border-radius:var(--r);overflow:hidden}
.nv img{display:block;width:100%;height:auto;aspect-ratio:5/2;object-fit:cover;object-position:center bottom}
.nv .nv-t{font-weight:700;margin:10px 14px 0}
.nv .petit{margin:2px 14px 12px}
@media(min-width:700px){.etapes{grid-template-columns:1fr 1fr}}
@media(min-width:1000px){.etapes{grid-template-columns:repeat(4,1fr)}}
.etapes li{background:#fff;border:1px solid var(--filet);border-radius:var(--r);padding:20px;display:flex;gap:14px}
@media(min-width:1000px){.etapes li{flex-direction:column}}
.etape-n{flex:none;width:34px;height:34px;border-radius:50%;background:var(--marine);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:.9rem}
.etapes h3{margin-bottom:.35em}
.etapes p{margin:0;font-size:.9rem}

/* Barème */
.bareme{background:#fff;border:1px solid var(--filet);border-radius:var(--r);padding:22px 24px}
.bareme-t{font-weight:800;font-size:1.05rem;margin-bottom:.6em}
.bareme table{width:100%;border-collapse:collapse;margin-bottom:.8em}
.bareme th,.bareme td{padding:.6rem 0;border-bottom:1px solid var(--filet);font-size:.9rem;text-align:left;vertical-align:top}
.bareme th{font-weight:400;padding-right:12px}
.bareme td{font-weight:700;text-align:right;white-space:nowrap}

/* Conseiller */
.conseiller{display:flex;gap:18px;align-items:flex-start;background:#fff;border:1px solid var(--filet);border-radius:var(--r);padding:22px 24px}
.conseiller img{width:84px;height:84px;border-radius:50%;object-fit:cover;flex:none}
.conseiller p{font-size:.9rem;margin-bottom:.5em}
.conseiller-n{font-weight:800;font-size:1.05rem!important;margin-bottom:0!important}
.conseiller-r{color:var(--texte2);font-size:.8125rem!important}
.duo{display:block;text-align:center}
.duo-t{font-weight:700;font-size:.95rem!important;margin-bottom:16px!important}
.duo-g{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;margin-bottom:14px}
.grille-2>*,.duo-c{min-width:0}
.duo-m{overflow-wrap:anywhere;font-size:.75rem}
@media(max-width:480px){.duo-g{gap:10px}.duo-m{font-size:.66rem;letter-spacing:-.01em}}
.duo-c img{width:84px;height:84px;margin:0 auto 10px}
.duo-c p{margin-bottom:.2em}
.duo .petit{font-size:.8125rem;color:var(--texte2);margin:0}
@media(max-width:420px){.conseiller:not(.duo){flex-direction:column}}

/* Biens */
.biens{display:grid;gap:18px;margin-top:28px;grid-template-columns:1fr}
@media(min-width:620px){.biens{grid-template-columns:1fr 1fr}}
@media(min-width:960px){.biens{grid-template-columns:repeat(3,1fr)}}
.biens-msg{grid-column:1/-1;margin:0;color:var(--texte2)}
.biens-vide{grid-column:1/-1;background:#fff;border:1px dashed var(--filet);border-radius:var(--r);padding:28px 24px}
.biens-vide p{margin-bottom:.6em}
.biens-vide strong{display:block;font-size:1.1rem;font-weight:800;margin-bottom:.4em}
.bien{display:flex;flex-direction:column;background:#fff;border:1px solid var(--filet);border-radius:var(--r);overflow:hidden;text-decoration:none;transition:box-shadow .2s}
.bien:hover{box-shadow:0 16px 36px rgba(2,20,48,.1)}
.bien-ph{position:relative;aspect-ratio:4/3;background:var(--gris)}
.bien-ph img{width:100%;height:100%;object-fit:cover}
.bien-badge{position:absolute;left:12px;top:12px;background:var(--rouge);color:#021430;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.3rem .7rem;border-radius:999px}
.bien-badge.marine{background:var(--marine)}
.bien-txt{padding:16px 18px 18px;display:flex;flex-direction:column;gap:2px;flex:1}
.bien-type{font-weight:700;font-size:1rem}
.bien-ville{font-size:.875rem;color:var(--texte2)}
.bien-carac{font-size:.875rem;margin-top:4px}
.bien-prix{margin-top:auto;padding-top:10px;font-weight:800;font-size:1.15rem}
.biens-sous{grid-column:1/-1;margin:0;font-size:.95rem}

/* FAQ */
.faq details{border-bottom:1px solid var(--filet)}
.faq details:first-child{border-top:1px solid var(--filet)}
.faq summary{cursor:pointer;list-style:none;padding:18px 36px 18px 0;font-weight:600;position:relative}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";position:absolute;right:4px;top:12px;font-size:1.5rem;font-weight:300;color:var(--rouge)}
.faq details[open] summary::after{content:"–"}
.faq details p{padding:0 0 18px;margin:0}

/* Communes voisines */
.voisins{list-style:none;margin:24px 0 18px;padding:0;display:grid;gap:10px;grid-template-columns:1fr 1fr}
@media(min-width:860px){.voisins{grid-template-columns:repeat(4,1fr)}}
.voisins a{display:flex;flex-direction:column;background:#fff;border:1px solid var(--filet);border-radius:var(--r);padding:16px 18px;text-decoration:none;font-weight:700;transition:border-color .25s}
.voisins a:hover{border-color:var(--rouge)}
.voisins small{font-weight:400;font-size:.8125rem;color:var(--texte2)}

/* Page « Nos secteurs » */
.cartes-c{list-style:none;margin:28px 0 18px;padding:0;display:grid;gap:14px}
@media(min-width:620px){.cartes-c{grid-template-columns:1fr 1fr}}
@media(min-width:960px){.cartes-c{grid-template-columns:repeat(3,1fr)}}
.carte-c{display:flex;flex-direction:column;height:100%;background:#fff;border:1px solid var(--filet);border-radius:var(--r);padding:22px;text-decoration:none;transition:border-color .25s,box-shadow .25s}
.carte-c:hover{border-color:var(--rouge);box-shadow:0 14px 32px rgba(2,20,48,.08)}
.carte-c-n{font-weight:800;font-size:1.2rem}
.carte-c-cp{font-size:.8125rem;color:var(--texte2);margin-bottom:.6em}
.carte-c-t{font-size:.9rem;flex:1}
.carte-c-l{margin-top:12px;font-size:.78rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--rouge-t)}

/* Appel à l'action */
.cta{padding:16px 0 56px}
.cta-in{background:var(--marine);color:#fff;border-radius:22px;padding:40px 24px;text-align:center}
@media(min-width:860px){.cta{padding:0 0 84px}.cta-in{padding:56px 48px}}
.cta h2{color:#fff}
.cta p{max-width:640px;margin-left:auto;margin-right:auto}
.cta .btns{justify-content:center}
.cta-note{margin-top:22px;font-size:.875rem;color:#C9D1DE}
.cta-note a{color:#fff;font-weight:600}

/* Pied de page */
.ft{background:var(--marine);color:#C9D1DE;font-size:.875rem}
.ft a{color:#fff;text-decoration:none}
.ft a:hover{text-decoration:underline}
.ft-in{max-width:1120px;margin:0 auto;padding:48px 16px 28px;display:grid;gap:28px;grid-template-columns:1fr 1fr}
.ft-brand{grid-column:1/-1;display:flex;justify-content:center}
.ft-brand img{width:200px;margin:0 auto 8px}
.ft-h{color:#fff;font-weight:700;font-size:.75rem;letter-spacing:.16em;text-transform:uppercase;margin-bottom:.8em}
.ft ul{list-style:none;margin:0;padding:0}
.ft li{margin-bottom:.4em}
.ft-in>div{min-width:0}
.ft li a{overflow-wrap:anywhere}
@media(min-width:860px){.ft-in{padding:56px 28px 36px;grid-template-columns:repeat(4,1fr)}}
.ft-bas{max-width:1120px;margin:0 auto;padding:18px 16px 28px;border-top:1px solid rgba(255,255,255,.16);display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between;font-size:.8125rem}
.ft-bas p{margin:0}
@media(min-width:700px){.ft-bas{padding:18px 28px 32px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
"""


# ------------------------------------------------------------------ JS (biens du flux)
def js_biens(bandeau, forcees):
    return """/* Biens du flux 3G sur les pages communes — généré par _communes/generer.py (ne pas modifier à la main). */
(function () {
  'use strict';
  var el = document.getElementById('biens-commune');
  if (!el) return;
  var PHOTOS_BANDEAU = """ + json.dumps(bandeau) + """;
  var COMMUNES_FORCEES = """ + json.dumps(forcees, ensure_ascii=False) + """;
  var root = el.getAttribute('data-root') || '../../';
  var commune = el.getAttribute('data-commune');
  var aCommune = el.getAttribute('data-a') || ('à ' + commune);
  var secteur = [];
  try { secteur = JSON.parse(el.getAttribute('data-secteur') || '[]'); } catch (e) {}

  function cle(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z]+/g, ' ').trim(); }
  function txt(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function eur(n) { return Math.round(Number(n) || 0).toLocaleString('fr-FR') + '\\u00a0€'; }
  function slug(parts) { return parts.join('-').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function imgOpt(u) { return u.indexOf('admin.3gimmobilier.fr') === -1 ? u : 'https://wsrv.nl/?url=' + u.replace(/^https?:\\/\\//, '') + '&w=600&output=webp&q=74'; }
  function estBandeau(u) { var m = String(u).match(/get_file_id\\/(\\d+)/); return !!(m && PHOTOS_BANDEAU[m[1]]); }

  var cleCommune = cle(commune);
  // communes déléguées (ex. Ballée pour Val-du-Maine) : leurs annonces comptent comme celles de la commune
  var clesIci = {}; clesIci[cleCommune] = 1;
  try { JSON.parse(el.getAttribute('data-alias') || '[]').forEach(function (v) { clesIci[cle(v)] = 1; }); } catch (e) {}
  var clesSecteur = {};
  secteur.forEach(function (v) { clesSecteur[cle(v)] = 1; });

  function conv(x) {
    var m = String(x.city || '').match(/^(.*?)\\s*\\((\\d{5})\\)\\s*$/);
    var ville = m ? m[1].trim() : String(x.city || '').trim(), cp = m ? m[2] : '';
    if (!ville && COMMUNES_FORCEES[x.id]) { ville = COMMUNES_FORCEES[x.id][0]; cp = COMMUNES_FORCEES[x.id][1]; }
    var vus = {}, photos = [x.img].concat(x.gallery || []).filter(function (u) { if (!u || vus[u]) return false; vus[u] = 1; return true; });
    var bonnes = photos.filter(function (u) { return !estBandeau(u); });
    var type = x.type ? String(x.type).charAt(0).toUpperCase() + String(x.type).slice(1) : 'Bien';
    return { id: x.id, type: type, ville: ville, cp: cp, prix: x.price, surface: x.surface, pieces: x.rooms,
             badge: String(x.badge || ''), photo: bonnes[0] || photos[0] || '', location: x.transaction === 'location' };
  }

  function carte(b) {
    var parts = [];
    if (b.type) parts.push(b.type);
    if (b.ville) parts.push(b.ville);
    if (b.surface) parts.push(b.surface + 'm2');
    if (b.pieces) parts.push(b.pieces + 'pieces');
    parts.push('ref-' + b.id);
    var carac = [];
    if (b.surface) carac.push(b.surface + '\\u00a0m²');
    if (b.pieces) carac.push(b.pieces + (b.pieces > 1 ? ' pièces' : ' pièce'));
    var badge = '';
    if (/compromis/i.test(b.badge)) badge = '<span class="bien-badge marine">Sous compromis</span>';
    else if (/exclusiv/i.test(b.badge)) badge = '<span class="bien-badge">Exclusivité</span>';
    var titre = b.type + (b.ville ? ' à ' + b.ville : '');
    var img = b.photo
      ? '<img src="' + txt(imgOpt(b.photo)) + '" data-orig="' + txt(b.photo) + '" alt="' + txt(titre) + '" loading="lazy" width="600" height="450">'
      : '';
    return '<a class="bien" href="' + root + '#bien/' + slug(parts) + '">' +
      '<div class="bien-ph">' + img + badge + '</div>' +
      '<div class="bien-txt"><span class="bien-type">' + txt(b.type) + '</span>' +
      '<span class="bien-ville">' + txt(b.ville) + (b.cp ? ' (' + txt(b.cp) + ')' : '') + '</span>' +
      (carac.length ? '<span class="bien-carac">' + txt(carac.join(' · ')) + '</span>' : '') +
      (b.prix ? '<span class="bien-prix">' + eur(b.prix) + '</span>' : '') +
      '</div></a>';
  }

  function vide() {
    el.innerHTML = '<div class="biens-vide"><strong>Aucun bien ' + txt(aCommune) + ' en ce moment</strong>' +
      '<p>Confiez-nous votre recherche\\u202f: nous vous prévenons dès qu\\'un bien correspondant à votre projet se présente.</p>' +
      '<a class="btn btn-rouge" href="' + root + '#contact">Confier ma recherche</a></div>';
  }

  function afficher(liste, sousTitre) {
    el.innerHTML = (sousTitre ? '<p class="biens-sous">' + sousTitre + '</p>' : '') + liste.map(carte).join('');
    el.querySelectorAll('img[data-orig]').forEach(function (img) {
      img.addEventListener('error', function () {
        var o = img.getAttribute('data-orig');
        if (o && img.src !== o) { img.removeAttribute('data-orig'); img.src = o; } else { img.remove(); }
      });
    });
  }

  // Flux 3G + statuts de l'espace pro (lecture seule) : les biens masqués ou vendus ne sont pas proposés
  var statuts = fetch('https://immobilier-angevin.galfomorel.workers.dev/statuts')
    .then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
  Promise.all([fetch(el.getAttribute('data-flux')).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }), statuts])
    .then(function (res) {
      var d = res[0], hors = {};
      ((res[1] && res[1].ventes) || []).forEach(function (v) { if (v.masque || v.statut === 'vendu') hors[String(v.id)] = 1; });
      var brut = (Array.isArray(d) ? d : (d.properties || [])).filter(function (x) { return !hors[String(x.id)]; });
      var tous = brut.map(conv).filter(function (b) { return b.ville && !b.location; });
      var ici = tous.filter(function (b) { return clesIci[cle(b.ville)] === 1; });
      var autour = tous.filter(function (b) { return clesIci[cle(b.ville)] !== 1 && clesSecteur[cle(b.ville)] === 1; });
      if (ici.length) {
        // Peu de biens dans la commune : on complète avec quelques biens des alentours
        var complement = ici.length < 3 ? autour.slice(0, 3 - ici.length) : [];
        afficher(ici.concat(complement));
        if (complement.length) {
          var cartes = el.querySelectorAll('.bien');
          var sep = document.createElement('p');
          sep.className = 'biens-sous';
          sep.textContent = 'Également dans les environs\\u00a0:';
          el.insertBefore(sep, cartes[ici.length]);
        }
        return;
      }
      if (autour.length) {
        afficher(autour.slice(0, 6), 'Pas de bien ' + txt(aCommune) + ' en ce moment\\u202f: voici nos biens dans les communes voisines. ' +
          '<a class="lien" href="' + root + '#contact">Confiez-nous votre recherche</a>.');
        return;
      }
      if (tous.length) {   // ni dans la commune ni autour : nos biens du moment, d'Angers à Sablé-sur-Sarthe
        afficher(tous.slice(0, 6), 'Pas de bien ' + txt(aCommune) + ' en ce moment\\u202f: voici nos biens du moment, d\\u2019Angers à Sablé-sur-Sarthe. ' +
          '<a class="lien" href="' + root + '#contact">Confiez-nous votre recherche</a>.');
        return;
      }
      vide();
    })
    .catch(function () {
      el.innerHTML = '<p class="biens-msg">Les annonces n\\'ont pas pu être chargées. Retrouvez-les sur la page <a class="lien" href="' + root + '#acheter">Acheter</a>.</p>';
    });
})();
"""


# ------------------------------------------------------------------ sitemap / robots
def _noindex(fichier):
    """Page retirée (bien vendu ou disparu) : elle n'a rien à faire dans le sitemap."""
    with open(fichier, encoding="utf-8") as f:
        return 'content="noindex' in f.read(4000)


def sitemap(communes):
    urls = [("", "weekly", "1.0"), ("immobilier/", "monthly", "0.8")] + ([("immobilier/prix/", "monthly", "0.8")] if PRIX else [])
    urls += [(f"immobilier/{c['slug']}/", "weekly", "0.7") for c in communes]
    # pages de rubrique générées par pages.py (Vendre, Estimation, L'agence, Contact, Honoraires) ; les pages légales sont en noindex
    guides = os.path.join(RACINE, "guides")
    extra = (["guides/"] + [f"guides/{n}/" for n in sorted(os.listdir(guides)) if os.path.isdir(os.path.join(guides, n))]) if os.path.isdir(guides) else []
    for r in ["estimation-immobiliere/", "vendre/", "lagence/", "contact/", "honoraires/"] + extra:
        f = os.path.join(RACINE, r, "index.html")
        if os.path.isfile(f) and not _noindex(f):
            urls.append((r, "monthly", "0.8"))
    # pages d'annonces générées par annonces.py (une adresse par bien en vente)
    dossier = os.path.join(RACINE, "annonce")
    if os.path.isdir(os.path.join(dossier)):
        urls.append(("annonce/", "daily", "0.8"))
        urls += [(f"annonce/{n}/", "daily", "0.8") for n in sorted(os.listdir(dossier))
                 if os.path.isfile(os.path.join(dossier, n, "index.html")) and not _noindex(os.path.join(dossier, n, "index.html"))]
    lignes = "".join(
        f"  <url><loc>{esc(BASE_URL + u)}</loc><lastmod>{AUJOURDHUI}</lastmod><changefreq>{f}</changefreq><priority>{p}</priority></url>\n"
        for u, f, p in urls)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + lignes + "</urlset>\n")


def robots():
    return f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}sitemap.xml\n"


# ------------------------------------------------------------------ main
def main():
    with open(os.path.join(ICI, "communes.json"), encoding="utf-8") as f:
        data = json.load(f)
    secteurs, communes = data["secteurs"], data["communes"]
    slugs = {c["slug"] for c in communes}
    for c in communes:
        manquants = [v for v in c["voisins"] if v not in slugs]
        if manquants:
            raise SystemExit(f"{c['slug']} : communes voisines inconnues {manquants}")
    bandeau, forcees = lire_constantes_site()

    faits = []
    faits.append(ecrire("assets/pages.css", CSS))
    faits.append(ecrire("assets/biens-commune.js", js_biens(bandeau, forcees)))
    faits.append(ecrire(*page_secteurs(communes, secteurs)))
    if PRIX:
        faits.append(ecrire(*page_prix(communes, secteurs)))
    for c in communes:
        faits.append(ecrire(*page_commune(c, communes, secteurs)))
    faits.append(ecrire("sitemap.xml", sitemap(communes)))
    faits.append(ecrire("robots.txt", robots()))
    print(f"{len(faits)} fichiers écrits (BASE_URL = {BASE_URL}) :")
    for f in faits:
        print("  " + f)


if __name__ == "__main__":
    main()
