// Extrait le contenu des fiches telles que le site les affiche (mêmes données, mêmes mentions légales).
// Lecture seule : toute requête autre que GET vers le relais Cloudflare est bloquée.
const { chromium } = require(process.env.PLAYWRIGHT || '/Users/charlesmorel/Desktop/Projets-code/atelier/node_modules/playwright');
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/*', r => (r.request().method() !== 'GET' && /workers\.dev/.test(r.request().url())) ? r.abort() : r.continue());
  await ctx.addInitScript(() => { try { sessionStorage.setItem('introVue', '1'); } catch (e) {} });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof biens !== 'undefined' && biens.length > 0, null, { timeout: 30000 });
  await p.waitForTimeout(2500);   // statuts du relais + biens en partenariat
  const ids = await p.evaluate(() => biens.filter(b => b.statut !== 'vendu' && !b.masque).map(b => b.id));
  const out = [];
  for (const id of ids) {
    await p.evaluate(i => showFiche(i), id);
    await p.waitForTimeout(500);
    out.push(await p.evaluate(i => {
      const b = biens.find(x => String(x.id) === String(i));
      const T = id => { const e = document.getElementById(id); return e ? e.innerText.trim() : ''; };
      const H = id => { const e = document.getElementById(id); return e ? e.innerHTML : ''; };
      const c = (typeof conseillerDe === 'function') ? conseillerDe(b) : null;
      return {
        id: String(b.id), slug: _slugifyBien(b), titre: T('ficheTitre'), loc: T('ficheLoc'), ref: T('fjRef'),
        docTitle: document.title, metaDesc: (document.querySelector('meta[name=description]') || {}).content || '',
        type: b.type || '', ville: b.ville || '', cp: b.cp || '', prix: b.prix || 0, prixAffiche: formatPrixPublic(b),
        prixMasque: (typeof isPrixMasque === 'function') && isPrixMasque(b),
        surface: b.surface || '', pieces: b.pieces || '', chambres: b.chambres || '', terrain: b.terrain || '',
        dpe: b.dpeClasse || '', ges: b.gesClasse || '',
        photos: (b.photos && b.photos.length ? b.photos : (b.img ? [b.img] : [])).slice(0, 12),
        prixBloc: (document.querySelector('.fj-prix') || {}).innerText || '',
        cles: [...document.querySelectorAll('#ficheKeys .fk')].map(e => [...e.children].map(x => x.innerText.trim())).filter(x => x.length >= 2 && x[1]),
        caracs: [...document.querySelectorAll('#ficheSpecs .carac')].map(e => [e.querySelector('.carac-l').innerText.trim(), e.querySelector('.carac-v').innerText.trim()]),
        descHTML: H('ficheDesc'), dpeTexte: T('ficheDPE'), prixSection: H('fichePrixSection'), legal: H('ficheLegal'),
        partenaire: b.partenaire ? (b.partenaire.nom || 'partenaire') : '',
        conseiller: c ? { nom: c.nom, prenom: c.prenom, role: c.role, tel: c.tel, photo: c.vignette } : null
      };
    }, id));
  }
  const cfg = await p.evaluate(() => ({ relais: AGENCE.statutProxyUrl }));
  console.log(JSON.stringify({ cfg, annonces: out }));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
