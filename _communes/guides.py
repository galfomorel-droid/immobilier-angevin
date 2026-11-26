#!/usr/bin/env python3
"""Guides (phase 5 de la mission SEO, 26/11/2026) : guides/ et ses pages.

Règle : aucun chiffre inventé. Les guides « prix » sont calculés sur les ventes réelles (data/prix.json et
data/prix-detail.json, DVF) ; les guides « vendre / frais » s'appuient sur les textes officiels, cités avec leur lien.

À relancer après _communes/pages.py :  python3 _communes/guides.py"""
import os, sys, json, math

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import generer as G  # noqa: E402
import pages as PG    # noqa: E402

T, E = G.typo, G.esc
ROOT = "../../"
PRIX = G.PRIX or {}
DETAIL = G.DETAIL or {}
COMMUNES, SECTEURS = PG.COMMUNES, PG.SECTEURS
PAGES_COMMUNES = {c["nom"]: c["slug"] for c in COMMUNES}
with open(os.path.join(ICI, "quartiers-angers.json"), encoding="utf-8") as f:
    QUARTIERS = json.load(f)
GUIDES = []   # (chemin, titre court, chapeau) pour la page d'accueil des guides


def periode():
    return G.periode_txt()


def m2(v):
    return G.eur_m2(v)


def nb(n):
    """1234 → « 1 234 » (espace insécable fine)."""
    return f"{int(n):,}".replace(",", "\u202f")


def lien_commune(nom, racine=ROOT):
    s = PAGES_COMMUNES.get(nom)
    return f'<a class="lien" href="{racine}immobilier/{s}/">{E(nom)}</a>' if s else E(nom)


def page_guide(chemin, titre, desc, h1, chapeau, corps, sources, ld_extra=None):
    """Page de guide : même gabarit que les pages de rubrique, fil d'Ariane Accueil › Guides › titre."""
    url = G.BASE_URL + chemin
    racine = "../" * chemin.count("/")
    srcs = "".join(f'<li><a class="lien" href="{E(u)}" rel="noopener">{E(n)}</a></li>' for n, u in sources)
    html_corps = f"""  <section class="intro">
    <div class="wrap">
      {G.fil_ariane(racine, [("Accueil", racine), ("Guides", racine + "guides/"), (h1, None)])}
      <p class="kicker">Guide</p>
      <h1>{T(h1)}</h1>
      <p class="lead">{T(chapeau)}</p>
      <p class="petit">{T("Mis à jour le " + G.AUJOURDHUI[8:10] + "/" + G.AUJOURDHUI[5:7] + "/" + G.AUJOURDHUI[:4] + " · L'Ardoise Immobilière, Charles MOREL et Antoine HÉRY")}</p>
    </div>
  </section>
{corps}
  <section class="sec"><div class="wrap etroit">
    <h2 class="gd-src-t">Sources</h2>
    <ul class="gd-src">{srcs}</ul>
  </div></section>
{G.bloc_cta(racine, "Un projet de vente ou d'achat ?", "Estimation gratuite, conseils et accompagnement jusqu'à l'acte : parlons-en.")}"""
    graph = [dict({"@type": "Article", "@id": url + "#article", "headline": h1, "description": desc, "inLanguage": "fr-FR",
                   "dateModified": G.AUJOURDHUI, "mainEntityOfPage": url,
                   "author": [{"@type": "Person", "name": "Charles MOREL"}, {"@type": "Person", "name": "Antoine HÉRY"}],
                   "publisher": {"@id": G.BASE_URL + "#agence"}}, **(ld_extra or {})),
             G.ld_ariane([("Accueil", G.BASE_URL), ("Guides", G.BASE_URL + "guides/"), (h1, url)])]
    assert len(titre) <= 60 and len(desc) <= 155, (chemin, len(titre), len(desc))
    tete = G.head(titre, desc, chemin, racine, G.jsonld({"@context": "https://schema.org", "@graph": graph})).replace(
        f'<link rel="stylesheet" href="{racine}assets/pages.css">',
        f'<link rel="stylesheet" href="{racine}assets/pages.css">\n<link rel="stylesheet" href="{racine}assets/rubriques.css">\n<link rel="stylesheet" href="{racine}assets/guides.css">')
    GUIDES.append((chemin, h1, chapeau))
    return chemin + "index.html", tete + f"""{G.entete(racine)}
<main id="contenu">
{html_corps}
</main>
{G.pied(racine, COMMUNES, SECTEURS)}
</body>
</html>
"""


# ------------------------------------------------------------------ 1. Prix par quartier d'Angers
def carte_quartiers(stats):
    """Carte SVG des 10 quartiers (contours officiels), teinte selon le prix médian des appartements."""
    pts = [p for q in QUARTIERS["quartiers"] for p in q["contour"]]
    lat0 = sum(p[1] for p in pts) / len(pts)
    kx = math.cos(math.radians(lat0))
    xs = [p[0] * kx for p in pts]; ys = [p[1] for p in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    W = 640; H = round(W * (y1 - y0) / (x1 - x0))
    sx = lambda lon: round((lon * kx - x0) / (x1 - x0) * (W - 20) + 10, 1)
    sy = lambda lat: round((y1 - lat) / (y1 - y0) * (H - 20) + 10, 1)
    vals = [stats[q["nom"]]["a"]["p50"] for q in QUARTIERS["quartiers"] if "p50" in (stats.get(q["nom"], {}).get("a") or {})]
    lo, hi = min(vals), max(vals)
    teintes = ["#E9EEF7", "#C3D0E6", "#8FA6CC", "#4F6FA8", "#1F3D73"]
    formes, nums = [], []
    for i, q in enumerate(sorted(QUARTIERS["quartiers"], key=lambda q: q["nom"])):
        st = (stats.get(q["nom"], {}).get("a") or {})
        k = min(4, int((st["p50"] - lo) / (hi - lo + 1) * 5)) if "p50" in st else 0
        d = "M" + " L".join(f"{sx(x)} {sy(y)}" for x, y in q["contour"]) + " Z"
        formes.append(f'<path d="{d}" fill="{teintes[k]}" stroke="#fff" stroke-width="1.5"><title>{E(q["nom"])} : {E(str(st.get("p50", "—")))} €/m² (appartements)</title></path>')
        cx = sum(sx(x) for x, _ in q["contour"]) / len(q["contour"]); cy = sum(sy(y) for _, y in q["contour"]) / len(q["contour"])
        nums.append(f'<text x="{cx:.0f}" y="{cy:.0f}" class="gq-n" fill="{"#fff" if k >= 3 else "#021430"}">{i + 1}</text>')
    legende = "".join(f'<span><i style="background:{c}"></i></span>' for c in teintes)
    return (f'<figure class="gq-carte"><svg viewBox="0 0 {W} {H}" role="img" aria-label="Carte des quartiers d\'Angers selon le prix médian des appartements">'
            f'{"".join(formes)}{"".join(nums)}</svg>'
            f'<figcaption><span class="gq-leg">{T(nb(lo) + " €/m²")} {legende} {T(nb(hi) + " €/m²")}</span>'
            f'<span class="petit">{T("Prix médian des appartements vendus, " + periode() + ". Contours : Ville d’Angers (ODbL).")}</span></figcaption></figure>')


def guide_quartiers():
    chemin = "guides/prix-immobilier-quartiers-angers/"
    qs = DETAIL.get("quartiers_angers") or {}
    stats = {q: d["tout"] for q, d in qs.items()}
    noms = sorted(QUARTIERS["quartiers"], key=lambda q: q["nom"])
    lignes = []
    for i, q in enumerate(noms):
        st = stats.get(q["nom"], {})
        m, a = st.get("m") or {}, st.get("a") or {}
        def cel(s):
            if "p50" not in s:
                return "—"
            return f'{m2(s["p50"])}<br><span class="petit">{T(nb(s["n"]) + " ventes · de " + nb(s["p25"]) + " à " + nb(s["p75"]) + " €")}</span>'
        lignes.append(f'<tr><td class="gq-i">{i + 1}</td><th scope="row">{E(q["nom"])}</th><td>{cel(a)}</td><td>{cel(m)}</td></tr>')
    # constats calculés (aucune appréciation inventée)
    av = sorted(((d["a"]["p50"], q) for q, d in stats.items() if "p50" in (d.get("a") or {})), reverse=True)
    mv = sorted(((d["m"]["p50"], q) for q, d in stats.items() if "p50" in (d.get("m") or {})), reverse=True)
    ville = (PRIX.get("communes") or {}).get("Angers", {})
    constats = [
        f"Appartements : le prix médian va de {nb(av[-1][0])} €/m² ({av[-1][1]}) à {nb(av[0][0])} €/m² ({av[0][1]}), pour une médiane de {nb(ville['a']['p50'])} €/m² sur toute la ville.",
        f"Maisons : de {nb(mv[-1][0])} €/m² ({mv[-1][1]}) à {nb(mv[0][0])} €/m² ({mv[0][1]}), pour une médiane de {nb(ville['m']['p50'])} €/m² sur toute la ville.",
        f"Le quartier qui compte le plus de ventes d'appartements est {max(stats, key=lambda q: (stats[q].get('a') or {}).get('n', 0))} ; pour les maisons, {max(stats, key=lambda q: (stats[q].get('m') or {}).get('n', 0))}.",
    ]
    corps = f"""  <section class="sec" aria-labelledby="carte">
    <div class="wrap grille-2 gq">
      <div>
        <h2 id="carte">{T("Les prix d'Angers, quartier par quartier")}</h2>
        <ul class="gd-puces">{"".join(f"<li>{T(c)}</li>" for c in constats)}</ul>
        <p>{T("Un prix médian partage les ventes en deux moitiés : autant de biens se sont vendus au-dessus qu'en dessous. Dans un même quartier, l'écart entre deux biens reste important : étage, état, extérieur, stationnement, exposition. Seule une visite permet de situer le vôtre.")}</p>
        <p><a class="btn btn-rouge" href="{ROOT}estimation-immobiliere/">Estimer mon bien</a></p>
      </div>
      {carte_quartiers(stats)}
    </div>
  </section>
  <section class="sec sec-gris" aria-labelledby="tableau">
    <div class="wrap">
      <h2 id="tableau">Prix médian au m² par quartier</h2>
      <div class="rb-tab"><table>
        <thead><tr><th scope="col">N°</th><th scope="col">Quartier</th><th scope="col">Appartements</th><th scope="col">Maisons</th></tr></thead>
        <tbody>{"".join(lignes)}</tbody>
      </table></div>
      <p class="petit">{T("Ventes d'un seul logement (maison ou appartement) enregistrées " + periode() + ", rattachées au quartier par leur position. Fourchette : la moitié des ventes se situe entre ces deux prix au m².")}</p>
      <p>{T("Voir aussi :")} <a class="lien" href="{ROOT}immobilier/angers/">notre page Angers</a> · <a class="lien" href="{ROOT}guides/ou-acheter-autour-d-angers/">où acheter autour d'Angers</a> · <a class="lien" href="{ROOT}immobilier/prix/">prix de toutes nos communes</a></p>
    </div>
  </section>"""
    return page_guide(chemin, "Prix immobilier par quartier à Angers (DVF) | L'Ardoise",
                      "Prix médian au m² des appartements et des maisons vendus dans les 10 quartiers d'Angers, d'après les ventes réelles DVF de 2023 à 2025.",
                      "Prix de l'immobilier par quartier à Angers",
                      f"Combien se vendent vraiment les appartements et les maisons dans chaque quartier d'Angers ? Les prix médians ci-dessous sont calculés sur les ventes réellement conclues {periode()}.",
                      corps,
                      [("Demandes de valeurs foncières (DVF), DGFiP — data.gouv.fr", "https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres-geolocalisees/"),
                       ("Quartiers de la Ville d'Angers — data.angers.fr (ODbL)", "https://data.angers.fr/explore/dataset/ccq_007/")])


# ------------------------------------------------------------------ 2 et 3. Où acheter autour d'Angers / de Sablé
def guide_ou_acheter(secteur):
    nom_s, ctr = G.CENTRES[secteur]
    ville_c = "Angers" if secteur == "angers" else "Sablé-sur-Sarthe"
    chemin = "guides/ou-acheter-autour-d-angers/" if secteur == "angers" else "guides/ou-acheter-autour-de-sable/"
    rows = []
    for nom, d in (PRIX.get("communes") or {}).items():
        if d.get("s") != secteur or not d.get("m") or d["m"]["n"] < 20:
            continue
        dist = G.km((d["lat"], d["lon"]), ctr)
        ans = (DETAIL.get("communes") or {}).get(nom, {})
        rows.append((dist, nom, d, ans))
    rows.sort()
    lignes = "".join(
        f'<tr><th scope="row">{lien_commune(nom)}</th><td>{T(f"{round(dist)} km") if dist >= 2 else "—"}</td>'
        f'<td>{m2(d["m"]["p50"])}</td><td>{T(str(d["m"]["n"]))}</td><td>{m2(d["a"]["p50"]) if (d.get("a") or {}).get("n", 0) >= 10 else "—"}</td></tr>'
        for dist, nom, d, ans in rows)
    proches = [r for r in rows if r[0] < 12 and r[1] != ville_c]
    moins = sorted(proches, key=lambda r: r[2]["m"]["p50"])[:4]
    plus = sorted(proches, key=lambda r: -r[2]["m"]["p50"])[:3]
    actives = sorted(rows, key=lambda r: -r[2]["m"]["n"])[:4]
    centre = (PRIX.get("communes") or {}).get(ville_c, {})
    constats = [
        f"À {ville_c}, le prix médian d'une maison est de {nb(centre['m']['p50'])} €/m² ({nb(centre['m']['n'])} ventes).",
        "À moins de 12 km, les prix médians les plus bas pour une maison : " + ", ".join(f"{r[1]} ({nb(r[2]['m']['p50'])} €/m²)" for r in moins) + ".",
        "Les plus élevés : " + ", ".join(f"{r[1]} ({nb(r[2]['m']['p50'])} €/m²)" for r in plus) + ".",
        "Les marchés les plus actifs (nombre de maisons vendues) : " + ", ".join(f"{r[1]} ({r[2]['m']['n']})" for r in actives) + ".",
    ]
    titre_h1 = f"Où acheter autour {nom_s} ?"
    corps = f"""  <section class="sec" aria-labelledby="constats">
    <div class="wrap etroit">
      <h2 id="constats">{T("Ce que disent les ventes réelles")}</h2>
      <ul class="gd-puces">{"".join(f"<li>{T(c)}</li>" for c in constats)}</ul>
      <p>{T("Le bon choix dépend d'abord de votre quotidien : trajets, écoles, commerces, type de maison recherché. Le tableau ci-dessous permet de comparer les communes sur des bases objectives ; nous vous aidons ensuite à visiter et à évaluer chaque bien.")}</p>
    </div>
  </section>
  <section class="sec sec-gris" aria-labelledby="tab">
    <div class="wrap">
      <h2 id="tab">{T("Les communes, de la plus proche à la plus éloignée")}</h2>
      <div class="rb-tab"><table>
        <thead><tr><th scope="col">Commune</th><th scope="col">Distance</th><th scope="col">Maison, prix médian</th><th scope="col">Maisons vendues</th><th scope="col">Appartement, prix médian</th></tr></thead>
        <tbody>{lignes}</tbody>
      </table></div>
      <p class="petit">{T("Distance à vol d'oiseau depuis le centre " + nom_s + ". Ventes " + periode() + " (DVF), communes d'au moins 20 maisons vendues. « — » : moins de 10 ventes d'appartements.")}</p>
      <p><a class="btn btn-rouge" href="{ROOT}annonce/">Voir nos annonces</a> <a class="btn btn-contour" href="{ROOT}#contact">Confier ma recherche</a></p>
    </div>
  </section>"""
    court = "Angers" if secteur == "angers" else "Sablé-sur-Sarthe"
    return page_guide(chemin, f"Où acheter autour {'d’Angers' if secteur == 'angers' else 'de Sablé'} ? Prix et communes | L'Ardoise".replace("’", "'"),
                      f"Communes autour {nom_s} comparées : distance, prix médian au m² des maisons et nombre de ventes réelles (DVF {periode().replace('de ', '')}).",
                      titre_h1,
                      f"Vous cherchez une maison autour {nom_s} ? Voici les communes comparées sur des chiffres réels : distance, prix médian et nombre de ventes {periode()}.",
                      corps,
                      [("Demandes de valeurs foncières (DVF), DGFiP — data.gouv.fr", "https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres-geolocalisees/")])


# ------------------------------------------------------------------ page d'accueil des guides
def page_hub():
    chemin = "guides/"
    cartes = "".join(f'<li><h3><a href="../{c}">{T(t)}</a></h3><p>{T(ch)}</p></li>' for c, t, ch in sorted(GUIDES, key=lambda g: g[0]))
    corps = f"""  <section class="intro">
    <div class="wrap">
      {G.fil_ariane("../", [("Accueil", "../"), ("Guides", None)])}
      <p class="kicker">Guides</p>
      <h1>{T("Nos guides pour vendre et acheter d'Angers à Sablé")}</h1>
      <p class="lead">{T("Prix réels par quartier et par commune, étapes et frais d'une vente : des repères chiffrés et sourcés, mis à jour avec les dernières données publiques.")}</p>
    </div>
  </section>
  <section class="sec"><div class="wrap"><ul class="rb-cartes rb-liens-c">{cartes}</ul></div></section>"""
    ld = PG.ld_page(chemin, "Guides", "CollectionPage")
    tete = G.head("Guides immobiliers Angers & Sablé-sur-Sarthe | L'Ardoise",
                  "Prix par quartier d'Angers, communes où acheter autour d'Angers et de Sablé, étapes et frais d'une vente : nos guides chiffrés et sourcés.",
                  chemin, "../", G.jsonld(ld)).replace('<link rel="stylesheet" href="../assets/pages.css">',
                                                       '<link rel="stylesheet" href="../assets/pages.css">\n<link rel="stylesheet" href="../assets/rubriques.css">')
    return chemin + "index.html", tete + f"""{G.entete("../")}
<main id="contenu">
{corps}
</main>
{G.pied("../", COMMUNES, SECTEURS)}
</body>
</html>
"""


CSS = """/* Guides — généré par _communes/guides.py */
.gd-puces{margin:12px 0 18px;padding-left:1.1em}
.gd-puces li{margin:0 0 8px}
.gd-src-t{font-size:1.05rem}
.gd-src{padding-left:1.1em;font-size:.9rem}
.gd-src li{margin:0 0 6px;overflow-wrap:anywhere}
.gq{align-items:center}
.gq-carte{margin:0}
.gq-carte svg{width:100%;height:auto;display:block}
.gq-n{font:700 15px/1 Montserrat,system-ui,sans-serif;text-anchor:middle;dominant-baseline:middle;pointer-events:none}
.gq-carte figcaption{display:flex;flex-direction:column;gap:6px;margin-top:10px;font-size:.85rem}
.gq-leg{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.gq-leg span{display:inline-flex}
.gq-leg i{display:inline-block;width:26px;height:12px;border-radius:3px}
.gq-i{color:var(--texte2);width:2.5em}
.gd-etapes{counter-reset:e;list-style:none;padding:0;margin:16px 0}
.gd-etapes li{position:relative;padding:0 0 14px 44px}
.gd-etapes li::before{counter-increment:e;content:counter(e);position:absolute;left:0;top:0;width:30px;height:30px;border-radius:50%;background:var(--marine);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center}
.gd-note{background:#fff;border-left:4px solid var(--rouge);padding:12px 16px;border-radius:0 10px 10px 0;margin:16px 0}
"""

LEGAUX = []   # guides juridiques et fiscaux ajoutés par guides_legaux.py (faits vérifiés, sources officielles)


def main():
    faits = [G.ecrire("assets/guides.css", CSS)]
    faits.append(G.ecrire(*guide_quartiers()))
    faits.append(G.ecrire(*guide_ou_acheter("angers")))
    faits.append(G.ecrire(*guide_ou_acheter("sable")))
    try:
        import guides_legaux  # noqa: F401  (même dossier)
        for f in guides_legaux.PAGES:
            faits.append(G.ecrire(*f(page_guide)))
    except ImportError:
        pass
    faits.append(G.ecrire(*page_hub()))
    faits.append(G.ecrire("sitemap.xml", G.sitemap(COMMUNES)))
    print(len(faits), "fichiers écrits ;", len(GUIDES), "guides")


if __name__ == "__main__":
    main()
