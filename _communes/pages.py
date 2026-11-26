#!/usr/bin/env python3
"""Pages statiques des rubriques du site (phase 3 de la mission SEO, 26/11/2026).

Les rubriques de l'application (Vendre, Estimer, L'agence, Contact, Honoraires, pages légales) n'avaient pas
d'adresse propre : Google ne voyait que l'accueil. Ce script leur donne une vraie page, avec l'en-tête et le
pied des pages communes. Les textes sont ceux du site (index.html) : rien n'est inventé.
Les formulaires restent dans l'application : les boutons y mènent (../#estimation, ../#contact).

  estimation-immobiliere/  vendre/  lagence/  contact/  honoraires/          (indexées, dans le sitemap)
  mentions-legales/  confidentialite/  cgu/  cookies/                         (noindex, hors sitemap)

À relancer après un changement de textes :  python3 _communes/pages.py   (après _parts/build.py)
Les pages légales sont lues dans la variable legalPages d'index.html (évaluée par Node)."""
import os, sys, re, json, html, subprocess

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import generer as G  # noqa: E402

RACINE = G.RACINE
ROOT = "../"
with open(os.path.join(ICI, "communes.json"), encoding="utf-8") as f:
    _D = json.load(f)
COMMUNES, SECTEURS = _D["communes"], _D["secteurs"]
with open(os.path.join(RACINE, "index.html"), encoding="utf-8") as f:
    SITE = f.read()

PAGES_INDEXEES = ["estimation-immobiliere/", "vendre/", "lagence/", "contact/", "honoraires/"]
PAGES_LEGALES = {"mentions-legales/": "mentions", "confidentialite/": "rgpd", "cgu/": "cgu", "cookies/": "cookies-info"}
T = G.typo


# ------------------------------------------------------------------ morceaux
def legal_pages():
    a = SITE.index("var _TODO = function")
    e = SITE.index("};", SITE.index("var legalPages", a)) + 2
    src = SITE[a:e] + "\nprocess.stdout.write(JSON.stringify(legalPages));"
    return json.loads(subprocess.run(["node", "-e", src], capture_output=True, text=True, check=True).stdout)


LIENS_LEGAUX = {"mentions": "mentions-legales/", "rgpd": "confidentialite/", "honoraires": "honoraires/",
                "cgu": "cgu/", "cookies-info": "cookies/"}


def nettoyer_legal(h):
    """HTML d'une page légale de l'application → contenu de page statique (titre retiré, h3 → h2)."""
    titre = re.search(r'<div class="legal-title">(.*?)</div>', h).group(1)
    h = re.sub(r'<div class="legal-title">.*?</div>', "", h, count=1)
    h = re.sub(r'<div class="legal-date">(.*?)</div>', r'<p class="petit">\1</p>', h)
    h = h.replace('<div class="legal-section">', '<section class="lg-s">').replace("</div>", "</section>")
    h = re.sub(r"<h3>", "<h2>", h).replace("</h3>", "</h2>")
    h = re.sub(r'<button[^>]*>.*?</button>', "", h, flags=re.S)
    h = re.sub(r'\sstyle="[^"]*"', "", h)
    # liens internes vers les autres pages légales
    h = re.sub(r"""<a [^>]*onclick="showLegal\('([\w-]+)'\)[^"]*"[^>]*>""",
               lambda m: '<a class="lien" href="%s%s">' % (ROOT, LIENS_LEGAUX.get(m.group(1), "")), h)
    h = re.sub(r'<table>', '<table class="lg-t">', h)
    return html.unescape(titre), h


def portails():
    """Les trois groupes de portails de la rubrique Vendre, tels qu'affichés dans l'application."""
    i = SITE.index('id="page-vendre"')
    blocs = []
    for g in ("vd-hab", "vd-pro", "vd-ter"):
        k = SITE.index('<div class="vd-group %s">' % g, i)
        f = SITE.index("</ul>", k) + len("</ul>")
        b = SITE[k:f] + "</div>"
        blocs.append(b.replace('src="img/', 'src="%simg/' % ROOT))
    return "".join(blocs)


def fil(nom):
    return G.fil_ariane(ROOT, [("Accueil", ROOT), (nom, None)])


def ld_page(chemin, nom, typ="WebPage", extra=None):
    url = G.BASE_URL + chemin
    graph = [dict({"@type": typ, "@id": url + "#page", "url": url, "name": nom, "inLanguage": "fr-FR",
                   "isPartOf": {"@id": G.BASE_URL + "#site"}, "about": {"@id": G.BASE_URL + "#agence"}}, **(extra or {})),
             G.ld_agence([{"@type": "City", "name": "Angers"}, {"@type": "City", "name": "Sablé-sur-Sarthe"}], url),
             G.ld_ariane([("Accueil", G.BASE_URL), (nom, url)])]
    return {"@context": "https://schema.org", "@graph": graph}


def page(chemin, titre, desc, nom_ariane, corps, ld, noindex=False):
    assert len(titre) <= 60 and len(desc) <= 155, (chemin, len(titre), len(desc))
    tete = G.head(titre, desc, chemin, ROOT, G.jsonld(ld)).replace(
        f'<link rel="stylesheet" href="{ROOT}assets/pages.css">',
        f'<link rel="stylesheet" href="{ROOT}assets/pages.css">\n<link rel="stylesheet" href="{ROOT}assets/rubriques.css">')
    if noindex:
        tete = tete.replace('<meta name="robots" content="index, follow, max-image-preview:large">',
                            '<meta name="robots" content="noindex, follow">')
    return chemin + "index.html", tete + f"""{G.entete(ROOT)}
<main id="contenu">
{corps}
</main>
{G.pied(ROOT, COMMUNES, SECTEURS)}
</body>
</html>
"""


def intro(nom_ariane, kicker, h1, lead, boutons):
    return f"""  <section class="intro">
    <div class="wrap">
      {fil(nom_ariane)}
      <p class="kicker">{T(kicker)}</p>
      <h1>{T(h1)}</h1>
      <p class="lead">{T(lead)}</p>
      <div class="btns">{boutons}</div>
    </div>
  </section>"""


BTN_ESTIMER = f'<a class="btn btn-rouge" href="{ROOT}#estimation">Lancer mon estimation</a>'
BTN_TEL = f'<a class="btn btn-ligne-marine" href="tel:{G.TEL_INTL}">{G.ICONE_TEL}<span>{G.TEL.replace(" ", "&nbsp;")}</span></a>'
BTN_CONTACT = f'<a class="btn btn-marine" href="{ROOT}#contact">Nous écrire</a>'


def cartes(items, cls="rb-cartes"):
    return f'<ul class="{cls}">' + "".join(f"<li><h3>{T(t)}</h3><p>{T(d)}</p></li>" for t, d in items) + "</ul>"


def etapes(items):
    return '<ol class="etapes">' + "".join(
        f'<li><span class="etape-n">{i + 1}</span><div><h3>{T(t)}</h3><p>{T(d)}</p></div></li>' for i, (t, d) in enumerate(items)) + "</ol>"


def faq(items):
    return '<div class="faq">' + "".join(f"<details><summary>{T(q)}</summary><p>{T(r)}</p></details>" for q, r in items) + "</div>"


def ld_faq(items, url):
    return {"@type": "FAQPage", "@id": url + "#faq", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in items]}


# ------------------------------------------------------------------ Estimation immobilière
def page_estimation():
    chemin = "estimation-immobiliere/"
    nom = "Estimation immobilière"
    lignes = []
    for c in COMMUNES:
        d = ((G.PRIX or {}).get("communes") or {}).get(c["nom"]) or {}
        m = d.get("m") or {}
        a = d.get("a") or {}
        if m.get("n", 0) < G.MIN_VENTES and a.get("n", 0) < G.MIN_VENTES:
            continue
        cel = lambda st: G.eur_m2(st["p50"]) if st.get("n", 0) >= G.MIN_VENTES else "—"
        lignes.append(f'<tr><th scope="row"><a class="lien" href="{ROOT}immobilier/{c["slug"]}/">{G.esc(c["nom"])}</a></th>'
                      f'<td>{cel(m)}</td><td>{cel(a)}</td></tr>')
    methode = [
        ("Une fourchette immédiate", "Décrivez votre bien en 2 minutes : la fourchette est calculée sur les ventes réellement conclues dans votre commune (données publiques DVF)."),
        ("Un avis de valeur sur place", "Nous visitons votre bien et vous remettons un avis de valeur argumenté, fondé sur les ventes récentes du quartier et l'état du marché."),
        ("Une stratégie adaptée", "Délais, contraintes, prochain projet : nous faisons le point pour bâtir une stratégie de vente adaptée."),
    ]
    q = [
        ("L'estimation est-elle gratuite ?", "Oui. L'estimation et les rendez-vous préparatoires sont gratuits et sans engagement."),
        ("Sous quel délai ?", "La fourchette en ligne s'affiche dès que vous validez le formulaire. Nous vous recontactons ensuite pour l'affiner : estimation offerte sous 24 h."),
        ("Sur quelles données repose la fourchette en ligne ?", "Sur les Demandes de valeurs foncières (DVF) publiées par l'administration fiscale : les prix des ventes réellement conclues dans votre commune, " + G.periode_txt() + "."),
        ("Où intervenez-vous ?", "À Angers et dans son agglomération, ainsi qu'à Sablé-sur-Sarthe et dans ses alentours."),
    ]
    url = G.BASE_URL + chemin
    ld = ld_page(chemin, nom, extra={"description": "Estimation immobilière gratuite d'Angers à Sablé-sur-Sarthe."})
    ld["@graph"].append(ld_faq(q, url))
    corps = f"""{intro(nom, "Estimation gratuite", "Estimation immobilière gratuite à Angers et Sablé-sur-Sarthe",
                 "Décrivez votre bien en 2 minutes : vous obtenez aussitôt une fourchette de prix calculée sur les ventes réelles de votre commune, puis nous vous proposons une visite pour l'affiner, gratuitement et sans engagement.",
                 BTN_ESTIMER + BTN_TEL)}

  <section class="sec" aria-labelledby="methode">
    <div class="wrap">
      <p class="kicker">Notre méthode</p>
      <h2 id="methode">Comment nous estimons votre bien</h2>
      {etapes(methode)}
    </div>
  </section>

  <section class="sec sec-gris" aria-labelledby="prix">
    <div class="wrap">
      <p class="kicker">Prix de l'immobilier</p>
      <h2 id="prix">Prix médian au m² dans nos communes</h2>
      <p class="lead-2">{T("Prix médians des ventes réellement conclues " + G.periode_txt() + ", d'après les données publiques DVF. L'écart entre deux biens vient de l'emplacement, de l'état et des prestations : seule une visite permet de situer le vôtre.")}</p>
      <div class="rb-tab"><table>
        <thead><tr><th scope="col">Commune</th><th scope="col">Maisons</th><th scope="col">Appartements</th></tr></thead>
        <tbody>{"".join(lignes)}</tbody>
      </table></div>
      <p class="petit">{T("Source : Demandes de valeurs foncières (DVF), DGFiP, data.gouv.fr. Prix au m² de surface habitable ; « — » : moins de 10 ventes.")} <a class="lien" href="{ROOT}immobilier/prix/">Toutes les communes</a></p>
    </div>
  </section>

  <section class="sec" aria-labelledby="faq">
    <div class="wrap etroit">
      <p class="kicker">Questions fréquentes</p>
      <h2 id="faq">Vos questions sur l'estimation</h2>
      {faq(q)}
    </div>
  </section>

  <section class="sec sec-gris"><div class="wrap">{G.bloc_conseiller(ROOT)}</div></section>

{G.bloc_cta(ROOT, "Combien vaut votre bien ?", "Le premier rendez-vous et l'estimation sont offerts.")}"""
    return page(chemin, "Estimation immobilière gratuite Angers & Sablé | L'Ardoise",
                "Estimation gratuite de votre maison ou appartement d'Angers à Sablé-sur-Sarthe : fourchette immédiate d'après les ventes réelles, puis avis sur place.",
                nom, corps, ld)


# ------------------------------------------------------------------ Vendre
def page_vendre():
    chemin = "vendre/"
    nom = "Vendre"
    methode = [
        ("Comprendre votre projet", "Délais, contraintes, prochain projet : nous faisons le point pour bâtir une stratégie adaptée."),
        ("Estimer au juste prix", "Un avis de valeur argumenté, fondé sur les ventes récentes du quartier et l'état du marché."),
        ("Mettre en valeur", "Photos soignées, annonce rédigée avec soin et conseils de présentation pour séduire dès la première visite."),
        ("Diffuser largement", "Votre bien est présenté sur notre site, sur les grands portails immobiliers et auprès de nos acquéreurs."),
        ("Organiser les visites", "Nous qualifions chaque acquéreur et assurons les visites, avec un compte rendu à chaque fois."),
        ("Vous accompagner jusqu'à l'acte", "Négociation, compromis, notaire : nous sommes à vos côtés jusqu'à la signature définitive."),
    ]
    exclu = [
        ("Un prix cohérent, défendu", "Un seul prix affiché partout : votre bien garde toute sa valeur aux yeux des acquéreurs."),
        ("Une priorité dans notre agenda", "Nous nous investissons pleinement : mise en avant renforcée et relances actives de nos acquéreurs."),
        ("Une annonce maîtrisée", "Pas de doublons ni de prix contradictoires : une présentation unique et soignée."),
        ("Un suivi transparent", "Des comptes rendus réguliers : vous savez toujours où en est votre vente."),
    ]
    liens_c = " · ".join(f'<a class="lien" href="{ROOT}immobilier/{c["slug"]}/">{G.esc(c["nom"])}</a>' for c in COMMUNES)
    corps = f"""{intro(nom, "Vendre", "Vendre sa maison à Angers ou Sablé-sur-Sarthe",
                 "Une vente réussie se prépare : estimation argumentée, mise en valeur soignée, diffusion large et suivi régulier. Nous nous occupons de tout, à vos côtés.",
                 f'<a class="btn btn-rouge" href="{ROOT}estimation-immobiliere/">Estimer mon bien</a>' + BTN_CONTACT)}

  <section class="sec" aria-labelledby="methode">
    <div class="wrap">
      <p class="kicker">Notre méthode</p>
      <h2 id="methode">Votre vente, étape par étape</h2>
      {etapes(methode)}
    </div>
  </section>

  <section class="sec sec-gris" aria-labelledby="diffusion">
    <div class="wrap">
      <p class="kicker">Diffusion</p>
      <h2 id="diffusion">Une diffusion ciblée sur les grands portails</h2>
      <p class="lead-2">{T("Maison, appartement, local commercial ou terrain : votre annonce est présentée sur notre site, sur les portails les plus adaptés à votre bien, puis à notre fichier d'acquéreurs.")}</p>
      <div class="rb-portails">{portails()}</div>
    </div>
  </section>

  <section class="sec" aria-labelledby="exclu">
    <div class="wrap">
      <p class="kicker">Le mandat exclusif</p>
      <h2 id="exclu">Pourquoi choisir l'exclusivité ?</h2>
      {cartes(exclu)}
    </div>
  </section>

  <section class="sec sec-gris" aria-labelledby="hono">
    <div class="wrap grille-2 grille-bas">
      <div>
        <p class="kicker">Honoraires</p>
        <h2 id="hono">Des honoraires clairs</h2>
        <p>{T("Honoraires à la charge de l'acquéreur, sauf mention contraire dans le mandat, calculés sur le prix net vendeur et dus uniquement à la signature de l'acte authentique.")}</p>
        <p><a class="lien" href="{ROOT}honoraires/">Voir le barème complet</a></p>
      </div>
      {G.bloc_bareme()}
    </div>
  </section>

  <section class="sec" aria-labelledby="ou">
    <div class="wrap etroit">
      <p class="kicker">Nos secteurs</p>
      <h2 id="ou">Vendre dans votre commune</h2>
      <p>{T("Prix des ventes récentes, atouts de la commune, acquéreurs qui la recherchent : nos pages communes rassemblent ce qu'il faut savoir avant de vendre.")}</p>
      <p class="rb-liens">{liens_c}</p>
    </div>
  </section>

  <section class="sec sec-gris"><div class="wrap">{G.bloc_conseiller(ROOT)}</div></section>

{G.bloc_cta(ROOT, "Confiez-nous votre bien", "Parlons de votre projet : le premier rendez-vous et l'estimation sont offerts.")}"""
    return page(chemin, "Vendre sa maison à Angers ou Sablé | L'Ardoise Immobilière",
                "Vendre au bon prix d'Angers à Sablé-sur-Sarthe : estimation offerte, photos soignées, diffusion sur les grands portails et suivi jusqu'à l'acte.",
                nom, corps, ld_page(chemin, "Vendre sa maison à Angers ou Sablé-sur-Sarthe"))


# ------------------------------------------------------------------ L'agence
def page_agence():
    chemin = "lagence/"
    nom = "L'agence"
    bios = [
        ("Charles MOREL", "06 38 55 53 55", "+33638555355", "img/equipe-charles-morel.webp",
         "Diplômé d'un Bachelor Responsable commercial et marketing spécialisé dans l'immobilier, Charles a exercé quatre ans comme conseiller indépendant sur le secteur de Sablé-sur-Sarthe, où il comptait parmi les meilleurs de son secteur et accompagnait déjà de nombreux clients angevins. Sa rencontre avec Antoine Héry a été une évidence : ouvrir leur agence, à deux."),
        ("Antoine HÉRY", "06 82 87 33 31", "+33682873331", "img/equipe-antoine-hery.webp",
         "Antoine compte dix ans d'expérience dans l'immobilier, dont sept ans à Angers. Il a ensuite passé trois ans comme commercial Grand Ouest pour une agence parisienne, où il gérait des biens de prestige dans l'ouest de la France et à Paris. Fort de ce parcours, il revient aujourd'hui à Angers pour s'associer avec Charles Morel et ouvrir son agence, en gardant le meilleur de ses dix années d'expérience."),
    ]
    equipe = "".join(f"""<article class="rb-pers">
        <img src="{ROOT}{ph}" alt="{G.esc(n)}" width="640" height="640" loading="lazy">
        <div><h3>{G.esc(n)}</h3>
        <p><a class="lien" href="tel:{intl}">{tel.replace(' ', '&nbsp;')}</a>{(' · <a class="lien" href="mailto:%s">%s</a>' % (G.EMAILS_DUO[n], G.EMAILS_DUO[n].replace('@', '<wbr>@'))) if n in G.EMAILS_DUO else ''}</p>
        <p>{T(bio)}</p></div>
      </article>""" for n, tel, intl, ph, bio in bios)
    engagements = [
        ("Une expertise locale", "Nous connaissons les prix réels, les micro-marchés angevins et les opportunités avant qu'elles ne deviennent publiques."),
        ("Un accompagnement sur mesure", "Pas de standardisation : chaque client a un interlocuteur dédié, de la première visite à la signature."),
        ("Une vraie réactivité", "Nous répondons rapidement à vos questions. Dans l'immobilier, la réactivité fait souvent la différence."),
    ]
    valeurs = [
        ("Transparence", "Des informations claires et des échanges sincères pour sécuriser votre projet."),
        ("Disponibilité", "Nous répondons à vos messages et à vos appels rapidement."),
        ("Expertise de terrain", "Nous visitons chaque bien que nous proposons, pour vous donner un avis éclairé."),
        ("Suivi dans la durée", "Notre accompagnement ne s'arrête pas à la signature : nous vous orientons vers les bons interlocuteurs."),
    ]
    secteurs = "".join(
        f'<div><h3>{G.esc(s["nom"])}</h3><p class="rb-liens">'
        + " · ".join(f'<a class="lien" href="{ROOT}immobilier/{c["slug"]}/">{G.esc(c["nom"])}</a>' for c in COMMUNES if c["secteur"] == k)
        + f'</p><p class="petit">{T("Et aussi : " + s["autres"] + ".")}</p></div>'
        for k, s in SECTEURS.items())
    ld = ld_page(chemin, "L'agence : Charles Morel et Antoine Héry", "AboutPage")
    corps = f"""{intro(nom, "L'agence", "Charles Morel et Antoine Héry, votre agence d'Angers à Sablé",
                 "L'Ardoise Immobilière, c'est une agence montée à deux : Charles MOREL et Antoine HÉRY accompagnent ensemble particuliers et investisseurs dans l'achat, la vente et l'estimation de biens d'Angers à Sablé-sur-Sarthe.",
                 f'<a class="btn btn-rouge" href="{ROOT}contact/">Nous contacter</a><a class="btn btn-marine" href="{ROOT}estimation-immobiliere/">Estimer mon bien</a>')}

  <section class="sec" aria-labelledby="equipe">
    <div class="wrap">
      <p class="kicker">Notre équipe</p>
      <h2 id="equipe">Charles MOREL et Antoine HÉRY</h2>
      <p class="lead-2">{T("Notre conviction : un projet immobilier réussi repose sur un prix juste, une information claire et un interlocuteur réellement disponible.")}</p>
      <div class="rb-equipe">{equipe}</div>
    </div>
  </section>

  <section class="sec sec-gris" aria-labelledby="approche">
    <div class="wrap etroit">
      <p class="kicker">Notre approche</p>
      <h2 id="approche">Bien plus qu'une transaction</h2>
      <p>{T("Notre rôle ne se limite pas à vendre ou acheter un bien. Nous accompagnons des étapes de vie importantes, avec exigence, clarté et engagement.")}</p>
      <p>{T("Une première acquisition, une mutation professionnelle, une succession, un investissement locatif : chaque projet a ses enjeux, ses délais et ses contraintes. Nous prenons le temps de les comprendre avant de vous proposer une stratégie.")}</p>
      <p>{T("Notre ancrage local nous permet de vous conseiller avec justesse sur les quartiers, les prix et les perspectives de chaque bien.")}</p>
    </div>
  </section>

  <section class="sec" aria-labelledby="engag">
    <div class="wrap">
      <p class="kicker">Ce qui fait la différence</p>
      <h2 id="engag">Nos engagements, au quotidien</h2>
      {cartes(engagements)}
      <h2 class="rb-h2b">Les valeurs qui guident notre travail</h2>
      {cartes(valeurs)}
    </div>
  </section>

  <section class="sec sec-gris" aria-labelledby="territoire">
    <div class="wrap">
      <p class="kicker">Notre territoire</p>
      <h2 id="territoire">D'Angers à Sablé-sur-Sarthe</h2>
      <p class="lead-2">{T("Nous intervenons dans tous les quartiers d'Angers et dans son agglomération, ainsi qu'à Sablé-sur-Sarthe et dans ses alentours.")}</p>
      <div class="grille-2">{secteurs}</div>
    </div>
  </section>

{G.bloc_cta(ROOT, "Parlons de votre projet", "Une question, une visite, une estimation ? Nous vous répondons personnellement.")}"""
    return page(chemin, "L'agence : Charles Morel et Antoine Héry | L'Ardoise",
                "Charles Morel et Antoine Héry vous accompagnent pour acheter, vendre ou estimer votre bien d'Angers à Sablé-sur-Sarthe, jusqu'à la signature.",
                nom, corps, ld)


# ------------------------------------------------------------------ Contact
def page_contact():
    chemin = "contact/"
    nom = "Contact"
    ld = ld_page(chemin, "Contact", "ContactPage")
    corps = f"""{intro(nom, "Contact", "Contactez L'Ardoise Immobilière",
                 "Une question, une visite, une estimation ? Appelez-nous ou écrivez-nous : nous vous répondons rapidement.",
                 f'<a class="btn btn-rouge" href="{ROOT}#contact">Écrire via le formulaire</a>' + BTN_TEL)}

  <section class="sec" aria-labelledby="inter">
    <div class="wrap grille-2 grille-bas">
      {G.bloc_conseiller(ROOT)}
      <div class="rb-infos">
        <h2 id="inter">L'agence</h2>
        <dl>
          <dt>Rendez-vous</dt><dd>{T("Du lundi au samedi, sur rendez-vous")}</dd>
          <dt>Secteurs</dt><dd>{T("Angers et son agglomération, Sablé-sur-Sarthe et ses alentours")} · <a class="lien" href="{ROOT}immobilier/">nos communes</a></dd>
          <dt>E-mail</dt><dd><a class="lien" href="mailto:{G.EMAIL}">{G.EMAIL.replace("@", "<wbr>@")}</a></dd>
          <dt>Téléphone</dt><dd><a class="lien" href="tel:{G.TEL_INTL}">{G.TEL.replace(' ', '&nbsp;')}</a></dd>
        </dl>
        <p class="petit">{G.esc(G.MENTION)} · <a class="lien" href="{ROOT}mentions-legales/">mentions légales</a></p>
      </div>
    </div>
  </section>

  <section class="sec sec-gris" aria-labelledby="pourquoi">
    <div class="wrap">
      <p class="kicker">Vous souhaitez</p>
      <h2 id="pourquoi">Nous écrire à quel sujet ?</h2>
      <ul class="rb-cartes rb-liens-c">
        <li><h3><a href="{ROOT}annonce/">Acheter un bien</a></h3><p>{T("Nos annonces d'Angers à Sablé-sur-Sarthe, et une alerte e-mail pour être prévenu des nouveautés.")}</p></li>
        <li><h3><a href="{ROOT}vendre/">Vendre un bien</a></h3><p>{T("Notre méthode, la diffusion de votre annonce et nos honoraires.")}</p></li>
        <li><h3><a href="{ROOT}estimation-immobiliere/">Faire estimer un bien</a></h3><p>{T("Une fourchette immédiate d'après les ventes réelles, puis un avis de valeur sur place.")}</p></li>
        <li><h3><a href="{ROOT}#parrainage">Parrainer un propriétaire</a></h3><p>{T("Vous connaissez un vendeur ? Présentez-le-nous.")}</p></li>
      </ul>
    </div>
  </section>"""
    return page(chemin, "Contact : agence immobilière Angers & Sablé | L'Ardoise",
                "Contactez Charles Morel ou Antoine Héry pour acheter, vendre ou faire estimer votre bien d'Angers à Sablé-sur-Sarthe. Réponse sous 24 heures.",
                nom, corps, ld)


# ------------------------------------------------------------------ Honoraires et pages légales
def page_legale(chemin, cle, LP, titre_page, desc, noindex):
    titre, contenu = nettoyer_legal(LP[cle])
    corps = f"""  <section class="intro">
    <div class="wrap">
      {fil(titre)}
      <h1>{T(titre)}</h1>
    </div>
  </section>
  <section class="sec"><div class="wrap etroit rb-legal">
{contenu}
  </div></section>"""
    if cle == "honoraires":
        corps += "\n" + G.bloc_cta(ROOT, "Une question sur nos honoraires ?", "Le premier rendez-vous et l'estimation sont offerts.")
    return page(chemin, titre_page, desc, titre, corps, ld_page(chemin, titre), noindex=noindex)


CSS = """/* Pages de rubrique (Vendre, Estimer, L'agence, Contact, légal) — généré par _communes/pages.py */
.rb-cartes{list-style:none;margin:24px 0 0;padding:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.rb-cartes li{background:#fff;border:1px solid var(--filet);border-radius:14px;padding:20px}
.sec-gris .rb-cartes li{background:#fff}
.rb-cartes h3{font-size:1.02rem;margin:0 0 6px}
.rb-cartes p{margin:0;font-size:.92rem}
.rb-liens-c h3 a{color:var(--marine);text-decoration:none;border-bottom:2px solid var(--rouge)}
.rb-h2b{margin-top:48px}
.rb-tab{overflow-x:auto;margin:20px 0 12px}
.rb-tab table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;font-size:.95rem}
.rb-tab th,.rb-tab td{padding:10px 14px;border-bottom:1px solid var(--filet);text-align:left}
.rb-tab thead th{background:var(--marine);color:#fff;font-weight:600}
.rb-tab td{white-space:nowrap}
.rb-liens{line-height:2}
.rb-equipe{display:grid;gap:24px;margin-top:24px}
.rb-pers{display:grid;gap:20px;grid-template-columns:1fr;align-items:start;background:#fff;border:1px solid var(--filet);border-radius:16px;padding:20px}
.rb-pers img{width:100%;max-width:220px;height:auto;border-radius:12px}
.rb-pers h3{margin:0 0 4px}
@media(min-width:760px){.rb-pers{grid-template-columns:220px 1fr}}
.rb-infos dl{margin:12px 0;display:grid;grid-template-columns:auto 1fr;gap:8px 16px}
.rb-infos dt{font-weight:700;color:var(--marine)}
.rb-infos dd{margin:0;min-width:0;overflow-wrap:anywhere}
.rb-legal h2{font-size:1.15rem;margin:28px 0 8px}
.rb-legal .lg-t{width:100%;border-collapse:collapse;margin:12px 0}
.rb-legal .lg-t th,.rb-legal .lg-t td{padding:8px 12px;border-bottom:1px solid var(--filet);text-align:left}
.rb-portails .vd-group{margin:22px 0 0}
.rb-portails .vd-gt{font-weight:700;color:var(--marine);margin:0 0 10px}
.rb-portails .vd-logos{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px}
.rb-portails .prt-logo{background:#fff;border:1px solid var(--filet);border-radius:10px;min-height:60px;padding:8px 14px;display:flex;align-items:center;justify-content:center;font-size:.9rem}
.rb-portails .prt-logo img{max-height:30px;width:auto;max-width:130px}
"""


def main():
    LP = legal_pages()
    faits = [G.ecrire("assets/rubriques.css", CSS)]
    faits.append(G.ecrire(*page_estimation()))
    faits.append(G.ecrire(*page_vendre()))
    faits.append(G.ecrire(*page_agence()))
    faits.append(G.ecrire(*page_contact()))
    faits.append(G.ecrire(*page_legale("honoraires/", "honoraires", LP, "Honoraires de vente | L'Ardoise Immobilière",
                                       "Barème des honoraires de L'Ardoise Immobilière d'Angers à Sablé-sur-Sarthe : forfait jusqu'à 100 000 €, puis 5 % ou 4 % TTC.", False)))
    for chemin, cle in PAGES_LEGALES.items():
        t = nettoyer_legal(LP[cle])[0]
        faits.append(G.ecrire(*page_legale(chemin, cle, LP, f"{t} | L'Ardoise Immobilière"[:60],
                                           f"{t} du site de L'Ardoise Immobilière, d'Angers à Sablé-sur-Sarthe.", True)))
    faits.append(G.ecrire("sitemap.xml", G.sitemap(COMMUNES)))
    print(len(faits), "fichiers écrits")


if __name__ == "__main__":
    main()
