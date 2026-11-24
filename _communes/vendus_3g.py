#!/usr/bin/env python3
"""Biens vendus de Charles MOREL, repris de sa page conseiller 3G (https://3gimmo.com/cmorel) → data/vendus-3g.json.
Lu par le carrousel « Nos dernières ventes » du site. Si la page ne répond pas ou ne contient aucune vente,
le fichier existant est conservé tel quel."""
import os, re, io, json, html, datetime, urllib.request
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, "data", "vendus-3g.json")
PAGE = "https://3gimmo.com/cmorel"
DOSSIER_IMG = os.path.join(RACINE, "img", "vendus")
# Cadre (gauche, haut, droite, bas, en fraction de l'image) choisi visuel par visuel : sans le bandeau
# « Nous recherchons », sans les portraits ni les coordonnées. Les ventes futures passent par l'espace pro
# (photo de l'annonce) ; une vente uniquement sur 3G prend le cadre par défaut.
CADRE_PAR_DEFAUT = (0.29, 0.19, 0.72, 0.60)
CADRES = {
    "2000012621": (0.32, 0.21, 0.75, 0.6),
    "2000003808": (0.29, 0.21, 0.72, 0.62),
    "2000008318": (0.3, 0.25, 0.75, 0.64),
    "2000010134": (0.28, 0.28, 0.73, 0.64),
    "2000009478": (0.3, 0.29, 0.75, 0.64),
    "1462416337": (0.3, 0.25, 0.75, 0.64),
    "1462414665": (0.28, 0.215, 0.71, 0.6),
    "1462416624": (0.3, 0.215, 0.73, 0.6),
    "1462417377": (0.3, 0.215, 0.73, 0.6),
    "1462417238": (0.28, 0.215, 0.71, 0.6),
    "1462414723": (0.3, 0.215, 0.73, 0.6),
    "1462412320": (0.3, 0.215, 0.73, 0.6),
    "1462409849": (0.25, 0.02, 0.95, 0.6),
    "1462414677": (0.2, 0.1, 0.95, 0.65),
    "1462413081": (0.3, 0.05, 0.95, 0.68)
}
PETITS = {"Sur", "De", "Du", "Des", "La", "Le", "Les", "En", "Et", "Aux", "Au", "Sous"}


def ville_propre(v):
    """« Sablé-Sur-Sarthe » → « Sablé-sur-Sarthe » (petits mots en minuscules, sauf en tête)."""
    mots = re.split(r"([ -])", v.strip())
    return "".join(m.lower() if (i > 0 and m in PETITS) else m for i, m in enumerate(mots))


def recadrer(url, ref):
    """Les visuels 3G « VENDU » portent les photos et noms des conseillers de l'époque (bandeau + portraits).
    On ne garde que la maison et le macaron VENDU : le bandeau sombre est en bas, à droite ou à gauche selon le modèle."""
    sortie = os.path.join(DOSSIER_IMG, ref + ".webp")
    if os.path.exists(sortie):
        return "img/vendus/" + ref + ".webp"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; ImmobilierAngevin/1.0)"})
    im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert("RGB")
    W, H = im.size
    boite = CADRES.get(ref, CADRE_PAR_DEFAUT)
    c = im.crop((int(boite[0] * W), int(boite[1] * H), int(boite[2] * W), int(boite[3] * H)))
    c.thumbnail((800, 800))
    os.makedirs(DOSSIER_IMG, exist_ok=True)
    c.save(sortie, "WEBP", quality=78)
    return "img/vendus/" + ref + ".webp"


def main():
    req = urllib.request.Request(PAGE, headers={"User-Agent": "Mozilla/5.0 (compatible; ImmobilierAngevin/1.0)"})
    s = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")
    ventes = []
    for t, ref, corps in re.findall(r'<li data-time="(\d+) ?" data-ref="(\d+) ?" class="containerBienMesBiensVendus">(.*?)</li>', s, re.S):
        if not re.search(r'<p class="C_T">\s*Vendu', corps):
            continue
        img = re.search(r'data-src="([^"]+)"', corps)
        types = [x.strip() for x in re.findall(r"<p>([^<&][^<]*)</p>", corps) if x.strip()]
        lieu = re.search(r'class="villeMesBiensVendus ville">\s*([^<]+?)\s*</p>', corps)
        ville, cp = html.unescape(lieu.group(1)) if lieu else "", ""
        m = re.match(r"(.*?)\s*\((\d{5})\)$", ville)
        if m:
            ville, cp = m.group(1), m.group(2)
        ventes.append({
            "id": ref, "date": datetime.date.fromtimestamp(int(t)).isoformat(),
            "type": types[-1] if types else "Bien", "ville": ville_propre(ville), "cp": cp,
            "img": recadrer(img.group(1).replace("/get_file_id_mini/", "/get_file_id/"), ref) if img else "",
        })
    if not ventes:
        print("Aucune vente trouvée sur", PAGE, ": fichier inchangé"); return
    ventes.sort(key=lambda v: v["date"], reverse=True)
    os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
    with open(SORTIE, "w", encoding="utf-8") as f:
        json.dump({"source": PAGE, "maj": datetime.date.today().isoformat(), "vendus": ventes}, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(len(ventes), "ventes écrites dans", SORTIE)


if __name__ == "__main__":
    main()
