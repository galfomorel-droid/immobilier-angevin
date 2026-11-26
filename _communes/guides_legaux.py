"""Guides « vendre / frais » (phase 5 SEO, 26/11/2026), appelés par guides.py.

Chaque affirmation vient d'une source officielle lue le 26/11/2026 (liens en bas de chaque guide).
Points non vérifiés volontairement absents : validité du diagnostic bruit et de l'information mérule,
délai « habituel » jusqu'à l'acte, coût des diagnostics. À revoir si la loi change (taux des droits de
mutation : délibérations départementales possibles du 1er décembre 2026 au 15 avril 2027)."""
import generer as G

T, E = G.typo, G.esc
VERIF = "Sources consultées le 26 novembre 2026."

SP = "https://www.service-public.gouv.fr/particuliers/vosdroits/"
SRC = {
    "ddt": ("Service-Public : diagnostics immobiliers obligatoires (F10798)", SP + "F10798"),
    "audit": ("Service-Public : audit énergétique lors de la vente (F37110)", SP + "F37110"),
    "eco": ("Ministère de la Transition écologique : diagnostics techniques immobiliers",
            "https://www.ecologie.gouv.fr/politiques-publiques/diagnostics-techniques-immobiliers"),
    "avant": ("Service-Public : promesse et compromis de vente (F2965)", SP + "F2965"),
    "l271": ("Code de la construction et de l'habitation, article L271-1 (rétractation)",
             "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037667917"),
    "l313": ("Code de la consommation, article L313-41 (condition suspensive de prêt)",
             "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032433227"),
    "f188": ("Service-Public : prêt immobilier, délais (F188)", SP + "F188"),
    "hoguet": ("Loi n° 70-9 du 2 janvier 1970 (loi Hoguet), article 6 : mandat écrit",
               "https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000032043077"),
    "pv": ("Service-Public : plus-value immobilière (F10864)", SP + "F10864"),
    "notaires": ("Notaires : frais et taxes immobilières, qui paie quoi entre vendeur et acquéreur",
                 "https://ghd.notaires.fr/articles/frais-taxes-immobilieres-qui-paie-quoi-entre-vendeur-lacquereur-1048.htm"),
    "frais": ("impots.gouv.fr : j'achète un bien immobilier, qu'aurai-je à payer comme frais au notaire ?",
              "https://www.impots.gouv.fr/particulier/questions/jachete-un-bien-immobilier-quaurai-je-payer-comme-frais-au-notaire"),
    "dmto": ("DGFiP : taux des droits de mutation applicables au 1er juin 2026, par département",
             "https://www.impots.gouv.fr/sites/default/files/media/1_metier/3_partenaire/notaires/dmto/dmto_2026-06.pdf"),
    "deliber": ("collectivites-locales.gouv.fr : droits de mutation à titre onéreux",
                "https://www.collectivites-locales.gouv.fr/gerer-les-finances-publiques-locales/fiscalite-locale/fiscalite-indirecte-locale/droits-de-mutation"),
    "primo": ("Service-Public : hausse des droits de mutation, primo-accédants (A18183)",
              "https://www.service-public.gouv.fr/particuliers/actualites/A18183"),
}


def src(*cles):
    return [SRC[c] for c in cles]


# ------------------------------------------------------------------ Vendre : étapes et diagnostics
def guide_vendre(page_guide):
    R = "../../"
    etapes = [
        ("Faire estimer le bien", f'Une estimation fondée sur les ventes réelles du secteur et sur la visite. <a class="lien" href="{R}estimation-immobiliere/">Notre estimation est gratuite</a>.'),
        ("Signer un mandat", "Avec un professionnel de l'immobilier, le mandat doit obligatoirement être écrit (loi Hoguet, article 6)."),
        ("Réunir les diagnostics", "Le dossier de diagnostic technique est annexé à la promesse ou à l'acte de vente : mieux vaut le préparer dès la mise en vente (tableau ci-dessous)."),
        ("Promesse ou compromis", "Une promesse unilatérale signée sous seing privé doit être enregistrée dans les 10 jours, sinon elle est nulle. Avec un compromis, un dépôt de garantie, souvent de 10 %, est versé."),
        ("Délai de rétractation", "L'acquéreur non professionnel dispose de 10 jours pour se rétracter, à compter du lendemain de la première présentation de la lettre recommandée qui lui notifie l'acte, ou de sa remise en main propre."),
        ("Obtention du prêt", "Si l'acquéreur emprunte, la condition suspensive de prêt dure au moins un mois ; en pratique, 45 à 60 jours. Si le prêt est refusé, les sommes versées lui sont rendues sans retenue."),
        ("Acte authentique", "La vente est signée chez le notaire, à la date librement fixée par les parties dans l'avant-contrat."),
    ]
    diags = [
        ("Diagnostic de performance énergétique (DPE)", "Appartement ; maison d'au moins 50 m² de surface de plancher", "10 ans"),
        ("Audit énergétique", "Maison (ou immeuble à propriétaire unique) classée E, F ou G ; classe D à partir du 1er janvier 2034", "5 ans"),
        ("Plomb (CREP)", "Logement construit avant le 1er janvier 1949", "1 an si du plomb dépasse le seuil ; sinon, le constat reste valable"),
        ("Amiante", "Permis de construire délivré avant le 1er juillet 1997", "Illimitée"),
        ("Électricité", "Installation de plus de 15 ans", "3 ans"),
        ("Gaz", "Installation de plus de 15 ans", "3 ans"),
        ("Termites", "Zone délimitée par arrêté préfectoral", "6 mois"),
        ("Assainissement non collectif", "Maison non raccordée au tout-à-l'égout", "3 ans"),
        ("État des risques", "Zone exposée à des risques (naturels, miniers, technologiques, sismiques, radon)", "6 mois"),
        ("Bruit", "Zone d'exposition au bruit d'un aérodrome", "Voir la fiche Service-Public"),
        ("Mérule", "Zone couverte par un arrêté : l'information figure dans la promesse ou l'acte", "—"),
    ]
    lignes = "".join(f'<tr><th scope="row">{T(a)}</th><td>{T(b)}</td><td>{T(c)}</td></tr>' for a, b, c in diags)
    corps = f"""  <section class="sec" aria-labelledby="etapes">
    <div class="wrap etroit">
      <h2 id="etapes">Les étapes d'une vente</h2>
      <ol class="gd-etapes">{"".join(f"<li><strong>{T(t)}</strong><br>{d if '<a ' in d else T(d)}</li>" for t, d in etapes)}</ol>
      <p class="gd-note">{T("Nous vous accompagnons à chaque étape, de l'estimation à la signature chez le notaire : préparation des diagnostics, visites, offres et suivi du financement de l'acquéreur.")}</p>
    </div>
  </section>
  <section class="sec sec-gris" aria-labelledby="diags">
    <div class="wrap">
      <h2 id="diags">Les diagnostics obligatoires</h2>
      <p class="lead-2">{T("Le dossier de diagnostic technique réunit les diagnostics qui concernent votre logement : la plupart dépendent de sa date de construction, de l'âge des installations et de la commune.")}</p>
      <div class="rb-tab"><table>
        <thead><tr><th scope="col">Diagnostic</th><th scope="col">Quand est-il obligatoire ?</th><th scope="col">Durée de validité</th></tr></thead>
        <tbody>{lignes}</tbody>
      </table></div>
      <p class="petit">{T("Le carnet d'information du logement est aussi transmis à l'acquéreur pour les logements construits ou rénovés (permis ou déclaration de travaux) depuis le 1er janvier 2023. " + VERIF)}</p>
    </div>
  </section>"""
    return page_guide("guides/vendre-sa-maison-etapes-diagnostics/",
                      "Vendre sa maison : étapes et diagnostics | L'Ardoise",
                      "Vendre sa maison étape par étape : mandat, diagnostics obligatoires et leur validité, compromis, rétractation de 10 jours, prêt, acte chez le notaire.",
                      "Vendre sa maison : les étapes et les diagnostics obligatoires",
                      "Du mandat à l'acte chez le notaire, les étapes d'une vente et les diagnostics à fournir, avec leur durée de validité, d'après les textes officiels.",
                      corps, src("ddt", "audit", "eco", "avant", "l271", "l313", "f188", "hoguet"))


# ------------------------------------------------------------------ Frais du vendeur
def guide_frais_vente(page_guide):
    R = "../../"
    corps = f"""  <section class="sec" aria-labelledby="qui">
    <div class="wrap etroit">
      <h2 id="qui">Ce que paie le vendeur</h2>
      <ul class="gd-puces">
        <li>{T("Les diagnostics obligatoires du dossier de diagnostic technique.")} <a class="lien" href="{R}guides/vendre-sa-maison-etapes-diagnostics/">La liste et leur validité</a>.</li>
        <li>{T("La mainlevée de l'hypothèque, si un prêt garanti par une hypothèque court encore sur le bien.")}</li>
        <li>{T("L'état daté, pour un lot de copropriété.")}</li>
        <li>{T("L'impôt sur la plus-value, s'il est dû (ci-dessous).")}</li>
      </ul>
      <p>{T("Les frais d'acquisition, dits « frais de notaire », sont payés par l'acquéreur.")} <a class="lien" href="{R}guides/frais-de-notaire-maine-et-loire-sarthe/">Leur montant en Maine-et-Loire, en Sarthe et en Mayenne</a>.</p>
      <p class="gd-note">{T("Nos honoraires sont à la charge de l'acquéreur : forfait de 5 000 € TTC jusqu'à 100 000 € net vendeur, puis 5 % ou 4 % TTC.")} <a class="lien" href="{R}honoraires/">Barème complet</a>.</p>
    </div>
  </section>
  <section class="sec sec-gris" aria-labelledby="pv">
    <div class="wrap etroit">
      <h2 id="pv">La plus-value immobilière</h2>
      <ul class="gd-puces">
        <li>{T("La vente de votre résidence principale est totalement exonérée.")}</li>
        <li>{T("Pour un autre bien (résidence secondaire, logement loué…), la plus-value est taxée à 19 % au titre de l'impôt sur le revenu, plus 17,2 % de prélèvements sociaux.")}</li>
        <li>{T("Des abattements s'appliquent selon la durée de détention : exonération d'impôt sur le revenu au-delà de 22 ans, et de prélèvements sociaux au-delà de 30 ans.")}</li>
        <li>{T("Une taxe supplémentaire de 2 à 6 % s'ajoute quand la plus-value imposable dépasse 50 000 €.")}</li>
      </ul>
      <div class="rb-tab"><table>
        <thead><tr><th scope="col">Années de détention</th><th scope="col">Abattement, impôt sur le revenu</th><th scope="col">Abattement, prélèvements sociaux</th></tr></thead>
        <tbody>
          <tr><th scope="row">{T("Moins de 6 ans")}</th><td>0</td><td>0</td></tr>
          <tr><th scope="row">{T("De la 6e à la 21e année")}</th><td>{T("6 % par an")}</td><td>{T("1,65 % par an")}</td></tr>
          <tr><th scope="row">{T("22e année")}</th><td>{T("4 % (exonération totale au-delà)")}</td><td>{T("1,60 %")}</td></tr>
          <tr><th scope="row">{T("De la 23e à la 30e année")}</th><td>—</td><td>{T("9 % par an (exonération totale au-delà)")}</td></tr>
        </tbody>
      </table></div>
      <p class="petit">{T("Le notaire calcule et verse l'impôt au moment de la vente. " + VERIF)}</p>
    </div>
  </section>"""
    return page_guide("guides/frais-de-vente-immobiliere/",
                      "Frais de vente : ce que paie le vendeur | L'Ardoise",
                      "Diagnostics, mainlevée d'hypothèque, état daté, plus-value : ce que paie le vendeur d'un bien immobilier, avec les taux et abattements officiels.",
                      "Les frais quand on vend un bien immobilier",
                      "Diagnostics, mainlevée, plus-value : ce qui reste à la charge du vendeur, et ce qui ne l'est pas, d'après les sources officielles.",
                      corps, src("notaires", "pv", "frais", "ddt"))


# ------------------------------------------------------------------ Frais de notaire (acquéreur)
def guide_frais_notaire(page_guide):
    R = "../../"
    prix = 200000
    dep, com, assiette = 0.05, 0.012, 0.0237

    def total(taux_dep):
        return prix * taux_dep + prix * com + prix * taux_dep * assiette

    eur = lambda v: T(f"{round(v):,} €".replace(",", " "))
    corps = f"""  <section class="sec" aria-labelledby="dmto">
    <div class="wrap etroit">
      <h2 id="dmto">Les droits de mutation, l'essentiel des frais</h2>
      <p>{T("Les « frais de notaire » payés par l'acquéreur d'un logement ancien comprennent surtout des droits et taxes reversés à l'État et aux collectivités, et une part plus faible qui rémunère le notaire.")}</p>
      <div class="rb-tab"><table>
        <thead><tr><th scope="col">Droit ou taxe</th><th scope="col">Taux</th></tr></thead>
        <tbody>
          <tr><th scope="row">{T("Part départementale : Maine-et-Loire (49), Sarthe (72), Mayenne (53)")}</th><td>{T("5,00 %")}</td></tr>
          <tr><th scope="row">{T("Taxe communale")}</th><td>{T("1,20 %")}</td></tr>
          <tr><th scope="row">{T("Frais d'assiette et de recouvrement")}</th><td>{T("2,37 % de la part départementale")}</td></tr>
          <tr><th scope="row">{T("Total des droits de mutation")}</th><td><strong>{T("6,32 %")}</strong></td></tr>
          <tr><th scope="row">{T("Contribution de sécurité immobilière")}</th><td>{T("0,10 % (15 € au minimum)")}</td></tr>
        </tbody>
      </table></div>
      <p class="petit">{T("Taux départementaux applicables au 1er juin 2026 (tableau de la DGFiP). Le taux de 5 % est une hausse temporaire, du 1er avril 2025 au 31 mars 2028 ; les départements peuvent délibérer de nouveau entre le 1er décembre 2026 et le 15 avril 2027.")}</p>
      <h2>Premier achat de votre résidence principale</h2>
      <p>{T("Si vous achetez votre résidence principale et que vous n'avez pas été propriétaire de votre résidence principale dans les deux ans précédant l'achat, la part départementale reste plafonnée à 4,5 %. Le total des droits de mutation est alors de 4,50 % + 1,20 % + 2,37 % × 4,50 %, soit environ 5,81 %.")}</p>
      <h2>Exemple pour un bien à 200 000 €</h2>
      <div class="rb-tab"><table>
        <thead><tr><th scope="col"></th><th scope="col">Droits de mutation</th></tr></thead>
        <tbody>
          <tr><th scope="row">{T("Cas général (6,32 %)")}</th><td>{eur(total(dep))}</td></tr>
          <tr><th scope="row">{T("Premier achat de résidence principale (5,81 %)")}</th><td>{eur(total(0.045))}</td></tr>
        </tbody>
      </table></div>
      <p class="petit">{T("Calcul à partir des taux ci-dessus, hors contribution de sécurité immobilière, émoluments et débours du notaire.")}</p>
      <h2>La rémunération du notaire</h2>
      <p>{T("Les émoluments du notaire suivent un tarif réglementé, proportionnel au prix et dégressif par tranches : 3,870 %, puis 1,596 %, 1,064 % et 0,799 % sur la dernière tranche.")}</p>
      <p><a class="btn btn-rouge" href="{R}#outils">Simuler mes frais de notaire</a></p>
      <p class="petit">{VERIF}</p>
    </div>
  </section>"""
    return page_guide("guides/frais-de-notaire-maine-et-loire-sarthe/",
                      "Frais de notaire Maine-et-Loire, Sarthe 2026 | L'Ardoise",
                      "Frais de notaire dans l'ancien en Maine-et-Loire, Sarthe et Mayenne : droits de mutation à 6,32 %, cas du premier achat, exemple chiffré à 200 000 €.",
                      "Frais de notaire en Maine-et-Loire, en Sarthe et en Mayenne",
                      "Combien coûtent les frais d'acquisition d'un logement ancien autour d'Angers et de Sablé-sur-Sarthe ? Les taux officiels en vigueur et un exemple chiffré.",
                      corps, src("frais", "dmto", "deliber", "primo"))


PAGES = [guide_vendre, guide_frais_vente, guide_frais_notaire]
