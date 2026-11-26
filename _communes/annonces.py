#!/usr/bin/env python3
"""Pages statiques « une annonce = une adresse » pour Google (priorité 5 de l'audit, 25/11/2026).

Le contenu est extrait de la fiche telle que le site l'affiche (navigateur automatisé, lecture seule),
puis mis en page avec l'en-tête et le pied des pages communes. Résultat :
  annonce/<slug>/index.html   une page par bien en vente (hors vendus et biens masqués)
  annonce/index.html          la liste de toutes les annonces
  sitemap.xml                 régénéré avec ces adresses (via generer.sitemap)

À relancer après chaque changement d'annonces :  python3 _communes/annonces.py
(les pages communes : python3 _communes/generer.py ; les deux peuvent tourner dans n'importe quel ordre)."""
import os, sys, re, json, shutil, socket, threading, subprocess, functools, http.server, html

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import generer as G  # noqa: E402

RACINE = G.RACINE
FLUX = "https://raw.githubusercontent.com/galfomorel-droid/charles-morel-immobilier/main/data/biens.json"


def extraire():
    """Sert le site en local, ouvre chaque fiche dans Chromium et renvoie leur contenu."""
    s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    Handler = functools.partial(Silencieux, directory=RACINE)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        r = subprocess.run(["node", os.path.join(ICI, "extraire_annonces.cjs"), f"http://127.0.0.1:{port}/"],
                           capture_output=True, text=True, timeout=600)
        if r.returncode != 0:
            raise SystemExit("Extraction impossible : " + r.stderr[-500:])
        return json.loads(r.stdout)
    finally:
        srv.shutdown()


def img(url, w):
    """Même redimensionnement que le site (imgOpt) : les photos 3G d'origine font jusqu'à 5 712 px."""
    if not isinstance(url, str) or "admin.3gimmobilier.fr" not in url:
        return url
    return "https://wsrv.nl/?url=" + re.sub(r"^https?://", "", url) + "&w=%d&we&output=webp&q=74" % w


def nettoyer(fragment, root):
    """HTML extrait de la page : liens internes rendus absolus depuis /annonce/<slug>/, sans gestionnaires d'évènements."""
    fragment = re.sub(r'\son[a-z]+="[^"]*"', "", fragment)
    fragment = re.sub(r'\sid="[^"]*"', "", fragment)
    fragment = re.sub(r'\sstyle="[^"]*"', "", fragment)   # styles du site principal (variables de couleur différentes ici)
    fragment = re.sub(r'href="#', f'href="{root}#', fragment)
    return fragment


def page_annonce(a, relais):
    root = "../../"
    chemin = f"annonce/{a['slug']}/"
    url = G.BASE_URL + chemin
    fiche = f"{root}#bien/{a['slug']}"
    titre = a["docTitle"] or f"{a['titre']} | {G.NOM}"
    desc_txt = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", a["descHTML"]))).strip()
    meta = a["metaDesc"] or desc_txt
    if len(meta) > 155:   # description ≤ 155 caractères, coupée à un mot
        meta = re.sub(r"\s+\S*$", "", meta[:154]) + "…"
    photos = [p for p in a["photos"] if isinstance(p, str) and p.startswith("http")]

    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "RealEstateListing", "name": a["titre"], "url": url, "description": desc_txt[:500],
         "image": photos[:6],
         "offers": ({"@type": "Offer", "price": a["prix"], "priceCurrency": "EUR", "availability": "https://schema.org/InStock"}
                    if a["prix"] and not a["prixMasque"] else None),
         "about": {"@type": "Place", "address": {"@type": "PostalAddress", "addressLocality": a["ville"],
                                                 "postalCode": a["cp"], "addressCountry": "FR"}},
         "provider": {"@id": G.BASE_URL + "#agence"}},
        G.ld_ariane([("Accueil", G.BASE_URL), ("Nos annonces", G.BASE_URL + "annonce/"), (a["titre"], url)]),
    ]}
    ld["@graph"][0] = {k: v for k, v in ld["@graph"][0].items() if v}

    galerie = ""
    if photos:
        vignettes = []
        for i, u in enumerate(photos[:5]):
            premiere = i == 0
            vignettes.append('<a href="%s" class="an-ph%s"><img src="%s" alt="%s, photo %d" loading="%s"%s decoding="async"></a>' % (
                fiche, " an-ph-1" if premiere else "", G.esc(img(u, 1400 if premiere else 500)), G.esc(a["titre"]), i + 1,
                "eager" if premiere else "lazy", ' fetchpriority="high"' if premiere else ""))
        galerie = '<div class="an-gal">' + "".join(vignettes) + "</div>"
        if len(photos) > 5:
            galerie += f'<p class="an-plus"><a class="lien" href="{fiche}">Voir les {len(photos)} photos</a></p>'

    cles = ('<ul class="an-cles">' + "".join(f"<li><span>{G.esc(k[0])}</span><strong>{G.esc(k[-1])}</strong></li>" for k in a.get("cles", [])) + "</ul>") if a.get("cles") else ""
    # Bilan énergétique : classes DPE / GES (le texte affiché par la fiche est une échelle graphique, illisible en texte brut)
    depenses = [l.strip() for l in (a.get("dpeTexte") or "").split("\n") if l.strip().startswith("Dépenses annuelles")]
    dpe_html = ""
    if a.get("dpe") or a.get("ges"):
        dpe_html = ('<h2>Bilan énergétique</h2><ul class="an-dpe">'
                    + '<li><span>Consommation énergétique</span><strong class="an-cl an-cl-%s">%s</strong></li>' % (G.esc(a.get("dpe") or "x").lower(), G.esc(a.get("dpe") or "Non renseignée"))
                    + '<li><span>Émissions de gaz à effet de serre</span><strong class="an-cl an-cl-%s">%s</strong></li>' % (G.esc(a.get("ges") or "x").lower(), G.esc(a.get("ges") or "Non renseignées"))
                    + "</ul>" + "".join('<p class="petit">%s</p>' % G.typo(d) for d in depenses))
    caracs = "".join(f"<li><span>{G.esc(l)}</span><strong>{G.esc(v)}</strong></li>" for l, v in a["caracs"])
    prix_lignes = [l.strip() for l in a["prixBloc"].split("\n") if l.strip()]
    prix = ""
    if prix_lignes:
        prix = f'<p class="an-prix">{G.esc(prix_lignes[0])}</p>' + "".join(f'<p class="an-prix-d">{G.esc(l)}</p>' for l in prix_lignes[1:])
    c = a["conseiller"] or {}
    conseiller = ""
    if c:
        intl = "+33" + c["tel"].replace(" ", "")[1:] if c.get("tel") else ""
        conseiller = f"""<aside class="an-cons">
        <img src="{root}{G.esc(c['photo'])}" alt="" width="72" height="72" loading="lazy">
        <div><p class="an-cons-n">{G.esc(c['nom'])}</p>
        {f'<a class="lien" href="tel:{intl}">{G.esc(c["tel"])}</a>' if intl else ''}</div>
      </aside>"""

    script = f"""<script>
(function () {{
  // Bien vendu ou retiré depuis la création de cette page : on le signale et on demande à Google de l'oublier
  var id = {json.dumps(a['id'])}, part = {json.dumps(bool(a['partenaire']))};
  var flux = part ? '{root}data/biens-partenaires.json' : {json.dumps(FLUX)};
  Promise.all([
    fetch(flux, {{ cache: 'no-cache' }}).then(function (r) {{ return r.json(); }}),
    fetch({json.dumps(relais.rstrip('/') + '/statuts')}).then(function (r) {{ return r.json(); }}).catch(function () {{ return {{}}; }})
  ]).then(function (r) {{
    var l = r[0]; l = Array.isArray(l) ? l : (l.properties || l.biens || []);
    var present = l.some(function (x) {{ return String(x.id) === id; }});
    var st = ((r[1] && r[1].ventes) || []).filter(function (v) {{ return String(v.id) === id; }})[0] || {{}};
    if (present && st.statut !== 'vendu' && !st.masque) return;
    var m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
    var b = document.getElementById('anIndispo'); if (b) {{ b.hidden = false; b.querySelector('strong').textContent = st.statut === 'vendu' ? 'Ce bien est vendu.' : "Ce bien n'est plus disponible."; }}
  }}).catch(function () {{}});
}})();
</script>"""

    corps = f"""{G.entete(root)}
<main id="contenu">
  <section class="intro an-intro"><div class="wrap">
    {G.fil_ariane(root, [("Accueil", root), ("Nos annonces", root + "annonce/"), (a["titre"], None)])}
    <p class="an-indispo" id="anIndispo" hidden><strong></strong> <a class="lien" href="{root}#acheter">Voir nos biens disponibles</a></p>
    <p class="surtitre">{G.esc(a['type'] or 'Bien')} à vendre · {G.esc(a['ville'])}{(' (' + G.esc(a['cp']) + ')') if a['cp'] else ''}</p>
    <h1>{G.typo(a['titre'])}</h1>
    <p class="an-ref">{G.esc(a['ref'])}</p>
    {cles}
  </div></section>
  <section class="an-corps"><div class="wrap an-grille">
    <div class="an-g">
      {galerie}
      <h2>Description</h2>
      <div class="an-desc">{nettoyer(a['descHTML'], root)}</div>
      {('<h2>Caractéristiques</h2><ul class="an-caracs">' + caracs + '</ul>') if caracs else ''}
      {dpe_html}
      <div class="an-legal">{nettoyer(a['prixSection'], root)}{nettoyer(a['legal'], root)}</div>
    </div>
    <aside class="an-d">
      <div class="an-carte">
        {prix}
        <a class="btn btn-rouge an-btn" href="{fiche}">Voir l'annonce complète</a>
        <a class="btn btn-contour an-btn" href="{root}#contact">Nous contacter</a>
        {conseiller}
      </div>
    </aside>
  </div></section>
</main>
{G.pied(root, COMMUNES, SECTEURS)}
{script}
</body>
</html>
"""
    tete = G.head(titre, meta, chemin, root, G.jsonld(ld))
    if photos:
        tete = tete.replace(f'content="{G.esc(G.BASE_URL)}og-image.jpg"', f'content="{G.esc(img(photos[0], 1200))}"')
        tete = tete.replace('<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n', "")
    tete = tete.replace(f'<link rel="stylesheet" href="{root}assets/pages.css">',
                        f'<link rel="stylesheet" href="{root}assets/pages.css">\n<link rel="stylesheet" href="{root}assets/annonce.css">')
    tete = tete.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">')
    return chemin + "index.html", tete + corps


def page_liste(annonces):
    root = "../"
    chemin = "annonce/"
    titre = "Annonces immobilières Angers & Sablé-sur-Sarthe | L'Ardoise"
    desc = "Toutes les annonces de L'Ardoise Immobilière : maisons, appartements et terrains à vendre d'Angers à Sablé-sur-Sarthe."
    items = ""
    for n, a in enumerate([x for x in annonces if x["photos"]]):
        prio = ' fetchpriority="high"' if n == 0 else ""
        items += ('<li><a href="%s/"><img src="%s" alt="" loading="%s"%s decoding="async">'
                  '<span class="an-l-t">%s</span><span class="an-l-v">%s%s</span><span class="an-l-p">%s</span></a></li>') % (
            a["slug"], G.esc(img(a["photos"][0], 700)), "eager" if n < 3 else "lazy", prio, G.typo(a["titre"]),
            G.esc(a["ville"]), (" (" + G.esc(a["cp"]) + ")") if a["cp"] else "", G.esc(a["prixAffiche"]))
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "ItemList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": G.BASE_URL + "annonce/" + a["slug"] + "/", "name": a["titre"]}
            for i, a in enumerate(annonces)]},
        G.ld_ariane([("Accueil", G.BASE_URL), ("Nos annonces", G.BASE_URL + chemin)])]}
    tete = G.head(titre, desc, chemin, root, G.jsonld(ld)).replace(
        f'<link rel="stylesheet" href="{root}assets/pages.css">',
        f'<link rel="stylesheet" href="{root}assets/pages.css">\n<link rel="stylesheet" href="{root}assets/annonce.css">')
    corps = f"""{G.entete(root)}
<main id="contenu">
  <section class="intro"><div class="wrap">
    {G.fil_ariane(root, [("Accueil", root), ("Nos annonces", None)])}
    <p class="surtitre">Acheter · {len(annonces)} biens</p>
    <h1>Nos annonces</h1>
    <p class="chapo">{G.typo(desc)}</p>
    <div class="btns"><a class="btn btn-rouge" href="{root}#acheter">Rechercher un bien</a></div>
  </div></section>
  <section><div class="wrap"><ul class="an-liste">{items}</ul></div></section>
</main>
{G.pied(root, COMMUNES, SECTEURS)}
</body>
</html>
"""
    return chemin + "index.html", tete + corps


CSS_ANNONCE = """/* Pages « annonce » — générées par _communes/annonces.py : modifier le script, pas ce fichier. */
.an-intro{padding-bottom:12px}
.an-ref{color:var(--texte2);font-size:.875rem;margin:0}
.an-cles{list-style:none;margin:18px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:10px}
.an-cles li{background:#fff;border:1px solid var(--filet);border-radius:14px;padding:10px 16px;display:flex;flex-direction:column;min-width:96px}
.an-cles span{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--texte2)}
.an-cles strong{font-size:1.05rem}
.an-indispo{background:#EEF1F7;border:1px solid #C9D3E3;color:var(--marine);border-radius:12px;padding:12px 16px;margin:0 0 16px}
.an-corps{padding-top:8px}
.an-grille{display:grid;gap:28px}
@media(min-width:960px){.an-grille{grid-template-columns:minmax(0,1fr) 340px;align-items:start}.an-d{position:sticky;top:100px}}
@media(max-width:959px){.an-d{order:-1}}
.an-gal{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px}
.an-ph{display:block;border-radius:12px;overflow:hidden;background:#E9EDF3;aspect-ratio:4/3}
.an-ph img{width:100%;height:100%;object-fit:cover}
.an-ph-1{grid-column:1/-1;aspect-ratio:16/10;border-radius:18px}
.an-plus{margin:6px 0 0;font-size:.9rem}
.an-g h2{font-size:clamp(1.3rem,3vw,1.7rem);margin-top:1.6em}
.an-desc p{margin:0 0 .9em}
.an-desc .desc-st{font-weight:700;margin:1.2em 0 .4em}
.an-desc ul{margin:0 0 1em;padding-left:1.2em}
.an-caracs{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:0 24px}
.an-caracs li{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--filet)}
.an-caracs span{color:var(--texte2)}
.an-dpe{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.an-dpe li{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--filet)}
.an-dpe span{color:var(--texte2)}
.an-cl{min-width:38px;text-align:center;padding:4px 10px;border-radius:8px;color:#fff;background:#5B6475}
.an-cl-a{background:#1F6B22}.an-cl-b{background:#3C8A2E}.an-cl-c{background:#6E9F28}.an-cl-d{background:#B59A00;color:#1d2433}.an-cl-e{background:#C26A0F}.an-cl-f{background:#B4421A}.an-cl-g{background:#9B1C1C}
.an-legal{margin-top:28px;font-size:.85rem;color:var(--texte2)}
.an-legal h3,.an-legal h4{font-size:.95rem;color:var(--marine)}
.an-carte{background:#fff;border:1px solid var(--filet);border-radius:18px;padding:22px;box-shadow:0 10px 30px rgba(2,20,48,.06)}
.an-prix{font-size:1.9rem;font-weight:800;color:var(--rouge-t);margin:0 0 4px;line-height:1.15}
.an-prix-d{font-size:.85rem;color:var(--texte2);margin:0 0 2px}
.an-btn{width:100%;justify-content:center;margin-top:12px}
.an-cons{display:flex;gap:14px;align-items:center;margin-top:18px;padding-top:18px;border-top:1px solid var(--filet)}
.an-cons img{width:60px;height:60px;border-radius:50%;object-fit:cover}
.an-cons p{margin:0}
.an-cons-n{font-weight:800}
.an-cons-r{font-size:.8rem;color:var(--texte2)}
.an-liste{list-style:none;margin:0;padding:0;display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.an-liste a{display:flex;flex-direction:column;text-decoration:none;background:#fff;border:1px solid var(--filet);border-radius:18px;overflow:hidden;height:100%}
.an-liste img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#E9EDF3}
.an-l-t{font-weight:800;padding:14px 16px 2px}
.an-l-v{color:var(--texte2);font-size:.9rem;padding:0 16px}
.an-l-p{font-weight:800;padding:8px 16px 16px;margin-top:auto}
"""


def main():
    global COMMUNES, SECTEURS
    with open(os.path.join(ICI, "communes.json"), encoding="utf-8") as f:
        d = json.load(f)
    COMMUNES, SECTEURS = d["communes"], d["secteurs"]
    data = extraire()
    annonces, relais = data["annonces"], data["cfg"]["relais"]
    if not annonces:
        raise SystemExit("Aucune annonce extraite : rien n'est modifié.")
    faits = [G.ecrire("assets/annonce.css", CSS_ANNONCE)]
    garder = set()
    for a in annonces:
        chemin, contenu = page_annonce(a, relais)
        faits.append(G.ecrire(chemin, contenu)); garder.add(a["slug"])
    faits.append(G.ecrire(*page_liste(annonces)))
    # pages d'annonces disparues du site (vendues, retirées) : supprimées
    dossier = os.path.join(RACINE, "annonce")
    for nom in os.listdir(dossier):
        p = os.path.join(dossier, nom)
        if os.path.isdir(p) and nom not in garder:
            shutil.rmtree(p); print("  retirée :", nom)
    # sitemap : réécrit seulement si la liste des adresses change (sinon seule la date du jour changerait)
    nouveau = G.sitemap(COMMUNES)
    try:
        with open(os.path.join(RACINE, "sitemap.xml"), encoding="utf-8") as f:
            ancien = f.read()
    except OSError:
        ancien = ""
    if re.findall(r"<loc>([^<]+)</loc>", ancien) != re.findall(r"<loc>([^<]+)</loc>", nouveau):
        faits.append(G.ecrire("sitemap.xml", nouveau))
    print(f"{len(annonces)} annonces, {len(faits)} fichiers écrits")


if __name__ == "__main__":
    main()
