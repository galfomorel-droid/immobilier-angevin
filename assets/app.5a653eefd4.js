
// ============== SYSTÈME DE TOAST + CONFIRM ==============
(function(){
  var stack = null;
  function getStack() {
    if (!stack) stack = document.getElementById('toastStack');
    return stack;
  }
  var icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
  window.showToast = function(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;
    var s = getStack();
    if (!s) { console.log('[toast]', type, message); return; }
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<span class="toast-icon">' + (icons[type]||'i') + '</span>' +
                  '<span class="toast-text"></span>' +
                  '<button type="button" class="toast-close" aria-label="Fermer">✕</button>';
    t.querySelector('.toast-text').textContent = message;
    s.appendChild(t);
    var close = function(){
      t.classList.add('fade-out');
      setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    };
    t.querySelector('.toast-close').addEventListener('click', close);
    if (duration > 0) setTimeout(close, duration);
    return close;
  };

  // Remplaçant moderne de confirm() — retourne une Promise
  window.showConfirm = function(message, opts) {
    opts = opts || {};
    return new Promise(function(resolve){
      var overlay = document.getElementById('confirmOverlay');
      var msg = document.getElementById('confirmMsg');
      var title = document.getElementById('confirmTitle');
      var ok = document.getElementById('confirmOkBtn');
      var cancel = document.getElementById('confirmCancelBtn');
      title.textContent = opts.title || 'Confirmation';
      msg.textContent = message;
      ok.textContent = opts.okText || 'Confirmer';
      cancel.textContent = opts.cancelText || 'Annuler';
      ok.className = 'confirm-btn ' + (opts.danger ? 'confirm-btn-danger' : 'confirm-btn-ok');
      overlay.classList.add('open');
      var done = function(val){
        overlay.classList.remove('open');
        ok.removeEventListener('click', onOk);
        cancel.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onBg);
        document.removeEventListener('keydown', onKey);
        resolve(val);
      };
      var onOk = function(){ done(true); };
      var onCancel = function(){ done(false); };
      var onBg = function(e){ if (e.target === overlay) done(false); };
      var onKey = function(e){
        if (e.key === 'Escape') done(false);
        if (e.key === 'Enter') done(true);
      };
      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
      overlay.addEventListener('click', onBg);
      document.addEventListener('keydown', onKey);
      setTimeout(function(){ ok.focus(); }, 50);
    });
  };
})();

;

// =====================================================================
// COORDONNÉES DE L'AGENCE — à compléter ici, tout le site se met à jour
// (boutons « Nous appeler », e-mail, adresse, WhatsApp, réseaux, formulaires)
// =====================================================================
var AGENCE = {
  nom: "L'Ardoise Immobilière",
  conseiller: 'Charles MOREL',
  // Flux des annonces 3G IMMO de Charles (synchro GitHub toutes les 4 h, même flux que le site Sabolien).
  // Seuls les biens situés dans le secteur d'Angers (SECTEUR_ANGERS) sont affichés.
  flux3G: 'https://raw.githubusercontent.com/galfomorel-droid/charles-morel-immobilier/main/data/biens.json',
  location: false,      // true = réactive la partie location (menu « Louer », annonces à louer…) — pages à remettre dans _parts/body.html
  telephone: '06 38 55 53 55',     // active tous les boutons « Nous appeler »
  email: 'contact@lardoiseimmobiliere.com',
  whatsapp: '33638555355',         // (indicatif 33, sans le 0 ni le +) → affiche la bulle WhatsApp
  adresse: '',          // ex. '12 rue Lenepveu, 49100 Angers'
  horaires: 'Du lundi au samedi, sur rendez-vous',
  reseaux: {   // URL complètes des pages
    facebook: 'https://www.facebook.com/profile.php?id=61566342466588',
    instagram: 'https://www.instagram.com/limmobilier_sabolien/',
    linkedin: 'https://www.linkedin.com/in/charles-morel44/',
    tiktok: 'https://www.tiktok.com/@charles.morel3gimmo'
  },
  web3formsKey: '',     // clé gratuite sur web3forms.com : les formulaires arrivent par e-mail
  statutProxyUrl: 'https://immobilier-angevin.galfomorel.workers.dev/',   // relais Cloudflare de l'espace pro (serverless/statut-proxy.js)
  parrainagePrime: '400 €'
};
function _telIntl(t) { var d = String(t || '').replace(/[^0-9+]/g, ''); if (!d) return ''; if (d.charAt(0) === '0') d = '+33' + d.slice(1); return d; }
function contactDirect() {
  if (AGENCE.telephone) return ' Contactez-nous directement au ' + AGENCE.telephone + '.';
  if (AGENCE.email) return ' Écrivez-nous à ' + AGENCE.email + '.';
  return '';
}
// Tant qu'aucune clé n'est renseignée, on n'affiche JAMAIS de faux « message envoyé ».
function formsActifs() {
  if (AGENCE.web3formsKey) return true;
  showToast("Aperçu du site : l'envoi des formulaires sera activé à la mise en ligne." + contactDirect(), 'warning', 7000);
  return false;
}
function appliquerCoordonnees() {
  document.querySelectorAll('[data-tel]').forEach(function (a) {
    if (!AGENCE.telephone) return;
    a.setAttribute('href', 'tel:' + _telIntl(AGENCE.telephone));
    a.removeAttribute('onclick');
    if (!a.hasAttribute('data-keep-label')) a.textContent = AGENCE.telephone;
  });
  document.querySelectorAll('[data-email]').forEach(function (a) {
    if (!AGENCE.email) return;
    a.setAttribute('href', 'mailto:' + AGENCE.email);
    a.removeAttribute('onclick');
    a.textContent = AGENCE.email;
  });
  document.querySelectorAll('[data-adresse]').forEach(function (e) { if (AGENCE.adresse) e.textContent = AGENCE.adresse; });
  document.querySelectorAll('[data-horaires]').forEach(function (e) { if (AGENCE.horaires) e.textContent = AGENCE.horaires; });
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    if (!AGENCE.whatsapp) return;
    a.href = 'https://wa.me/' + AGENCE.whatsapp; a.hidden = false;
  });
  var wa = document.getElementById('waFloat');
  if (wa && AGENCE.whatsapp) {
    wa.hidden = false;
    wa.href = 'https://wa.me/' + AGENCE.whatsapp + '?text=' + encodeURIComponent("Bonjour, je vous contacte depuis votre site L'Ardoise Immobilière.");
  }
  var nbReseaux = 0;
  document.querySelectorAll('[data-reseau]').forEach(function (a) {
    var url = (AGENCE.reseaux || {})[a.getAttribute('data-reseau')];
    if (url) { a.href = url; a.hidden = false; if (a.closest('#reseaux')) nbReseaux++; }
    else a.hidden = true;
  });
  var rs = document.getElementById('reseaux'); if (rs) rs.hidden = nbReseaux === 0;
  var fs = document.getElementById('ftSocial');
  if (fs) fs.hidden = !Object.keys(AGENCE.reseaux || {}).some(function (k) { return AGENCE.reseaux[k]; });
  var y = document.getElementById('ftYear'); if (y) y.textContent = new Date().getFullYear();
}

// ----- Achat / location -----
var filterTransaction = 'vente';
function _estLocation(b) { return !!b && b.transaction === 'location'; }
function _txActive(b) { return AGENCE.location || !_estLocation(b); }

// ----- Secteur : Angers Loire Métropole (29 communes) + anciennes communes déléguées -----
var SECTEUR_ANGERS = ['Angers','Avrillé','Beaucouzé','Bouchemaine','Briollay','Béhuard','Cantenay-Épinard','Feneu','Le Plessis-Grammoire',
  'Les Ponts-de-Cé','Loire-Authion','Longuenée-en-Anjou','Montreuil-Juigné','Mûrs-Érigné','Rives-du-Loir-en-Anjou','Saint-Barthélemy-d\'Anjou',
  'Saint-Clément-de-la-Place','Saint-Lambert-la-Potherie','Saint-Léger-de-Linières','Saint-Martin-du-Fouilloux','Sainte-Gemmes-sur-Loire',
  'Sarrigné','Savennières','Soulaines-sur-Aubance','Soulaire-et-Bourg','Trélazé','Verrières-en-Anjou','Écouflant','Écuillé',
  // communes déléguées
  'Saint-Sylvain-d\'Anjou','Pellouailles-les-Vignes','Andard','Bauné','Brain-sur-l\'Authion','Corné','La Bohalle','La Daguenière',
  'Saint-Mathurin-sur-Loire','Villevêque','Soucelles','La Meignanne','La Membrolle-sur-Longuenée','Le Plessis-Macé','Pruillé',
  'Saint-Jean-de-Linières','Saint-Martin-du-Fouilloux'];
var _SECTEUR_KEYS = (function () { var m = {}; SECTEUR_ANGERS.forEach(function (v) { m[_cleVille(v)] = 1; }); return m; })();
function _cleVille(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, ' ').trim(); }
// Secteurs d'intervention : agglomération d'Angers + secteur de Sablé-sur-Sarthe (biens en Maine-et-Loire 49, Mayenne 53, Sarthe 72)
function _dansSecteur(b) { return !!b && (_SECTEUR_KEYS[_cleVille(b.ville)] === 1 || /^(49|53|72)\d{3}$/.test(String(b.cp || ''))); }

// Identifiants des photos 3G à bandeau (liste du site Sabolien, scripts/scan-banners.mjs — à recopier si de nouveaux biens arrivent)
var PHOTOS_BANDEAU = {"1048653": 1, "1048718": 1, "1055054": 1, "1060555": 1, "1067381": 1, "1067385": 1, "1082612": 1, "1082616": 1, "1113051": 1, "1113067": 1, "1152486": 1, "1152490": 1, "1174881": 1, "1177410": 1, "1223539": 1, "1223551": 1, "1223552": 1, "1231174": 1, "1235796": 1, "1235797": 1, "1235805": 1, "1238221": 1, "1238222": 1, "1238235": 1, "1238236": 1, "1238254": 1, "1238272": 1, "1238273": 1};
// Biens dont la commune manque dans le flux 3G : identifiant 3G → [commune, code postal]
var COMMUNES_FORCEES = { 2000024081: ['Solesmes', '72300'] };
// Conversion d'une annonce du flux 3G (format « Sabolien ») vers le format du site
function _from3G(x) {
  var m = String(x.city || '').match(/^(.*?)\s*\((\d{5})\)\s*$/);
  var ville = m ? m[1].trim() : String(x.city || '').trim(), cp = m ? m[2] : '';
  // Commune absente dans 3G : corrigée à la main (indiquée par Charles)
  if (!ville && COMMUNES_FORCEES[x.id]) { ville = COMMUNES_FORCEES[x.id][0]; cp = COMMUNES_FORCEES[x.id][1]; }
  var type = x.type ? x.type.charAt(0).toUpperCase() + x.type.slice(1) : 'Bien';
  var badge = String(x.badge || '').toLowerCase();
  var vus = {}, photos = [x.img].concat(x.gallery || []).filter(function (u) { if (!u || vus[u]) return false; vus[u] = 1; return true; });
  // Photos « bandeau publicitaire 3G » (portraits) : jamais en couverture, rangées en fin de galerie
  var _estBandeau = function (u) { var m = String(u).match(/get_file_id\/(\d+)/); return !!(m && PHOTOS_BANDEAU[m[1]]); };
  photos = photos.filter(function (u) { return !_estBandeau(u); }).concat(photos.filter(_estBandeau));
  var titre = String(x.title || '').replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').trim();
  if (!titre || /:/.test(titre) || titre.length < 8) titre = type + (x.rooms ? ' ' + x.rooms + ' pièces' : '') + (ville ? ' à ' + ville : '');
  return {
    id: x.id, ref: x.ref, transaction: 'vente', titre: titre, type: type, ville: ville, cp: cp,
    prix: x.price, prixFAI: x.price, surface: x.surface, pieces: x.rooms, chambres: x.bedrooms,
    salleBain: x.bathrooms, sdb: x.showerRooms, terrain: x.land || 0, annee: x.year || null,
    exclusif: /exclusiv/.test(badge),
    statut: /compromis/.test(badge) ? 'sous_compromis' : (/offre/.test(badge) ? 'offre_en_cours' : 'en_vente'),
    description: x.desc || '', img: photos[0] || '', photos: photos,
    dpe: x.dpe || null, dpeClasse: x.dpe || null, gesClasse: x.ges || null,
    honoraires: /vendeur/i.test(String(x.honoraires || '')) ? 'vendeur' : 'acquéreur',
    createdAt: x.createdAt || null, publicUrl: x.publicUrl || '',
    taxeFonciere: x.taxeFonciere || null, surfaceUtile: x.surfaceUtile || null, chauffage: x.heating || null,
    garages: x.garages || 0, parkings: x.parkings || 0, exposition: x.exposition || null, etat: x.etat || null, niveaux: x.niveaux || null
  };
}
// Liste des annonces affichables, quel que soit le format reçu (flux 3G ou data/biens.json)
function _listeAnnonces(bj) {
  var brut = Array.isArray(bj) ? bj : (bj.properties || []);
  return brut.map(function (x) {
      var y = (x && x.city !== undefined && x.price !== undefined) ? _from3G(x) : x;
      y._villeVide = !String(y.ville || '').trim();   // commune inconnue → impossible de vérifier le secteur
      return y;
    })
    .map(_normalizeBien).filter(_txActive).filter(function (b) { return !b._villeVide && _dansSecteur(b); });
}
function _eur(n) { return (Math.round(Number(n) || 0)).toLocaleString('fr-FR') + ' €'; }
function _dateFr(d) { try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } }
var BUDGETS = { vente: [150000, 250000, 350000, 500000, 800000], location: [500, 700, 900, 1200, 1600] };
function _majBudgetOptions(selId, tx, prefixe) {
  var sel = document.getElementById(selId); if (!sel) return;
  var cur = sel.value, loc = tx === 'location';
  sel.innerHTML = '<option value="">' + (loc ? 'Loyer max' : 'Budget max') + '</option>' + BUDGETS[tx].map(function (v) {
    return '<option value="' + v + '">' + prefixe + v.toLocaleString('fr-FR') + ' €' + (loc ? ' / mois' : '') + '</option>';
  }).join('');
  if (cur && BUDGETS[tx].indexOf(parseInt(cur)) !== -1) sel.value = cur;
}
function heroTxChange() { var tx = (document.getElementById('heroTx') || {}).value || 'vente'; _majBudgetOptions('heroBudget', tx, '≤ '); }
function setTransaction(tx) {
  tx = (tx === 'location') ? 'location' : 'vente';
  var change = tx !== filterTransaction;
  filterTransaction = tx;
  var loc = tx === 'location';
  var set = function (id, t) { var e = document.getElementById(id); if (e) e.textContent = t; };
  set('biensKicker', loc ? 'Louer' : 'Acheter');
  var _bt = document.getElementById('biensTitre'), _btH = loc ? 'Nos biens <span class="cb-accent">à louer</span>' : 'Nos biens <span class="cb-accent">à vendre</span>';
  if (_bt && _bt.innerHTML !== _btH) _bt.innerHTML = _btH;
  set('biensIntro', loc ? "Studios, appartements et maisons à louer à Angers et dans l'agglomération, vides ou meublés."
                        : "Maisons, appartements et terrains à vendre à Angers, à Sablé-sur-Sarthe et alentours, visités et sélectionnés par nos soins.");
  document.querySelectorAll('.tx-tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tx') === tx); });
  document.querySelectorAll('[data-tx-only]').forEach(function (el) { el.hidden = el.getAttribute('data-tx-only') !== tx; });
  _majBudgetOptions('biensBudget', tx, "Jusqu'à ");
  if (change) { filterBudgetMax = 0; var bb = document.getElementById('biensBudget'); if (bb) bb.value = ''; }
}
function ouvrirContact(objet) {
  showPage('contact');
  setTimeout(function () {
    var s = document.getElementById('contactObjet'); if (s) { s.value = objet || ''; contactObjetChange(); }
    var m = document.getElementById('contactMessage');
    if (m && !m.value && objet === 'location-proprio') m.value = 'Bonjour, je souhaite mettre mon bien en location. Voici quelques informations : type de bien, adresse, surface, disponibilité…';
    var f = document.getElementById('contactObjet'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);
}

// ===== Mode DEBUG =====
// Active les logs détaillés en ajoutant ?debug=1 à l'URL ou en tapant
// localStorage.setItem('ia_debug', '1') dans la console.
// En prod, les console.log/warn restent silencieux.
(function(){
  try {
    var debug = (location.search.indexOf('debug=1') !== -1) ||
                (localStorage.getItem('ia_debug') === '1');
    if (!debug) {
      var noop = function(){};
      window.console.log = noop;
      window.console.info = noop;
      window.console.debug = noop;
      // On garde console.warn et console.error pour les vraies anomalies
    }
  } catch(e) {}
})();

// (saveBiens() défini plus bas, version unique avec gestion du quota — doublon mort retiré le 26/06)


// ===== DONNÉES BIENS =====
const defaultImgs = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
  'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=600&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80',
];
// Visuel de secours NEUTRE (aux couleurs du site) affiché si une photo manque ou
// ne se charge pas — évite d'afficher une fausse villa à la place du vrai bien.
var PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
  '<rect width="1200" height="800" fill="#E8EBF1"/>' +
  '<g fill="none" stroke="#021430" stroke-width="11" stroke-linejoin="round" stroke-linecap="round">' +
  '<path d="M540 360 L600 308 L660 360"/><rect x="556" y="360" width="88" height="84"/>' +
  '<path d="M588 444 L588 402 L612 402 L612 444"/></g>' +
  '<text x="600" y="520" font-family="Georgia, serif" font-size="30" font-style="italic" fill="#8C8270" text-anchor="middle">Photo à venir</text>' +
  '</svg>'
);
const galImgs = [];

const DEFAULT_BIENS = [];
;
let biens = []
var vendusAuto = []; // ventes détectées auto depuis 3G (data/vendus-auto.json) — alimentent « Nos dernières ventes »
let nextId = 7;
let filterType = 'all';
let filterVilles = [];   // multi-sélection de villes ([] = toutes)
var filterSecteur = '';  // 'angers' | 'sable' | '' (cartes de l'accueil, ?secteur=)
let filterBudgetMax = 0;   // 0 = sans limite
let filterSurfaceMin = 0;
let filterChambresMin = 0;
let filterRef = '';
let filterBudgetMin = 0;
let filterTerrainMin = 0;
let sortBiens = 'recent';  // recent | prix_asc | prix_desc | surface_desc
let previousPage = 'biens';

// ===== NAVIGATION PAGES =====
function _adminDom() {
  var p = document.getElementById('page-admin'), t = document.getElementById('tpl-admin');
  if (p && t && !p.firstElementChild) p.appendChild(t.content.cloneNode(true));
}
function showPage(id) {
  if (id === 'admin') _adminDom();
  var _ALIAS = { estimer: 'estimation', 'me-connaitre': 'apropos', connaitre: 'apropos', agence: 'apropos', parrainer: 'parrainage' };
  if (_ALIAS[id]) id = _ALIAS[id];
  if (id === 'admin' && !_adminPwd) { ouvrirEspacePro(); return; }
  if (id === 'louer' && !AGENCE.location) id = 'acheter';
  if (id === 'acheter' || id === 'louer') { setTransaction(id === 'louer' ? 'location' : 'vente'); id = 'biens'; }
  var _navId = (id === 'biens') ? (filterTransaction === 'location' ? 'louer' : 'acheter') : id;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) {
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Update nav
  const nav = document.getElementById('nav');
  if (id === 'home') {
    nav.classList.remove('scrolled');
    updateNavOnScroll();
  } else {
    nav.classList.add('scrolled');
  }
  // Init pages dynamiques
  if (id === 'home') renderHomeGrid();
  if (id === 'biens') { renderBiensGrid(); refreshVilleSelects(); }
  if (id === 'estimation') refreshVilleSelects();
  if (id === 'favoris') renderFavoris();
  if (id === 'admin') renderAdmin();
  document.querySelectorAll('.nav-links a[data-nav], .tabbar a[data-nav]').forEach(function(a){ var on = a.getAttribute('data-nav') === _navId; a.classList.toggle('is-active', on); if (a.closest('.tabbar')) { if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); } });
  if (typeof favMajUI === 'function') favMajUI();

  // ===== SEO DYNAMIQUE PAR PAGE =====
  _updateSeoForPage(_navId);

  // Mise à jour du hash pour Google + partage + historique
  if (id !== 'fiche' && window.history && window.history.replaceState) {
    var newHash = (id === 'home') ? '' : '#' + (id === 'apropos' ? 'agence' : _navId);
    try { window.history.replaceState(null, '', window.location.pathname + newHash); } catch (e) {}
  }
}

function _updateSeoForPage(id) {
  if (typeof _setOrUpdateMeta !== 'function') return;
  var seoByPage = {
  "home": {
    "title": "Agence immobilière Angers & Sablé-sur-Sarthe | L'Ardoise",
    "desc": "Agence immobilière d'Angers à Sablé-sur-Sarthe : maisons, appartements et terrains à vendre, estimation gratuite et suivi jusqu'à l'acte."
  },
  "acheter": {
    "title": "Maisons à vendre Angers & Sablé-sur-Sarthe | L'Ardoise",
    "desc": "Maisons, appartements et terrains à vendre à Angers et dans son agglomération, à Sablé-sur-Sarthe et alentours. Alertes e-mail et visites rapides."
  },
  "louer": {
    "title": "Locations à Angers | L'Ardoise Immobilière",
    "desc": "Studios, appartements et maisons à louer à Angers et dans l'agglomération, vides ou meublés. Visites rapides, dossier simple."
  },
  "apropos": {
    "title": "L'agence : Charles Morel et Antoine Héry | L'Ardoise",
    "desc": "Charles Morel et Antoine Héry vous accompagnent pour acheter, vendre ou estimer votre bien d'Angers à Sablé-sur-Sarthe, jusqu'à la signature."
  },
  "estimation": {
    "title": "Estimation immobilière gratuite Angers & Sablé | L'Ardoise",
    "desc": "Estimation gratuite de votre maison ou appartement d'Angers à Sablé-sur-Sarthe : fourchette immédiate d'après les ventes réelles, puis avis sur place."
  },
  "vendre": {
    "title": "Vendre sa maison à Angers ou Sablé | L'Ardoise Immobilière",
    "desc": "Vendre au bon prix d'Angers à Sablé-sur-Sarthe : estimation offerte, photos soignées, diffusion sur les grands portails et suivi jusqu'à l'acte."
  },
  "parrainage": {
    "title": "Parrainage : recommandez un vendeur | L'Ardoise Immobilière",
    "desc": "Un proche veut vendre d'Angers à Sablé-sur-Sarthe ? Présentez-le-nous : une prime de remerciement vous est versée si la vente se conclut."
  },
  "outils": {
    "title": "Simulateurs : emprunt, notaire, mensualité | L'Ardoise",
    "desc": "Calculez votre capacité d'emprunt, vos frais de notaire, votre mensualité et la durée de votre prêt. Simulations gratuites et indicatives."
  },
  "favoris": {
    "title": "Mes favoris | L'Ardoise Immobilière",
    "desc": "Retrouvez les biens que vous avez ajoutés à vos favoris."
  },
  "contact": {
    "title": "Contact : agence immobilière Angers & Sablé | L'Ardoise",
    "desc": "Contactez Charles Morel ou Antoine Héry pour acheter, vendre ou faire estimer votre bien d'Angers à Sablé-sur-Sarthe. Réponse sous 24 heures."
  }
};
  var info = seoByPage[id];
  if (info) {
    document.title = info.title;
    _setOrUpdateMeta('description', info.desc);
    _setOrUpdateMeta('og:title', info.title, 'property');
    _setOrUpdateMeta('og:description', info.desc, 'property');
    _setOrUpdateMeta('og:type', 'website', 'property');
    _setOrUpdateMeta('og:url', window.location.origin + window.location.pathname + (id === 'home' ? '' : '#' + (id === 'apropos' ? 'agence' : id)), 'property');
    _setOrUpdateMeta('twitter:title', info.title);
    _setOrUpdateMeta('twitter:description', info.desc);
    // Supprimer le JSON-LD bien si on n'est plus sur une fiche
    if (id !== 'fiche') {
      var el = document.getElementById('ldjson-bien');
      if (el) el.remove();
    }
  }
}

// Contenu des pages légales
// Contenu des pages légales — les champs <span class="todo"> sont à compléter avec les informations officielles de l'agence
var _TODO = function (t) { return '<span class="todo">[' + (t || 'à compléter') + ']</span>'; };
var legalPages = {
  'mentions':
    '<div class="legal-title">Mentions légales</div>' +
    '<div class="legal-date">Dernière mise à jour : novembre 2026</div>' +
    '<div class="legal-section"><h3>Éditeur du site</h3>' +
      '<p><strong>L\'Ardoise Immobilière</strong>, nom commercial de <strong>Charles MOREL</strong>, conseiller immobilier<br>' +
      'Entrepreneur individuel (EI), agent commercial, inscrit au RSAC de Le Mans sous le numéro 900 233 800<br>' +
      'Téléphone : 06 38 55 53 55 · E-mail : contact@lardoiseimmobiliere.com</p>' +
      '<p>Directeur de la publication : Charles MOREL</p></div>' +
    '<div class="legal-section"><h3>Réseau de rattachement</h3>' +
      '<p>3G IMMO, réseau national de mandataires immobiliers indépendants<br>' +
      'Siège social : 4 bis avenue d\'Aléry, 74000 Annecy · RCS Annecy 491 726 915 · Téléphone : 04 50 45 82 47</p></div>' +
    '<div class="legal-section"><h3>Carte professionnelle et garanties</h3>' +
      '<p>Charles MOREL exerce sous le réseau 3G IMMO, titulaire de la carte professionnelle « Transactions sur immeubles et fonds de commerce » délivrée par la CCI de Haute-Savoie. ' +
      'Garantie financière et assurance responsabilité civile professionnelle souscrites par le réseau 3G IMMO, conformément à la loi Hoguet du 2 janvier 1970 et à son décret d\'application du 20 juillet 1972. ' +
      'Charles MOREL ne perçoit aucun fonds, effet ou valeur au sens de l\'article 3 alinéa 2 de la loi Hoguet.</p></div>' +
    '<div class="legal-section"><h3>Médiateur de la consommation</h3>' +
      '<p>Conformément aux articles L.611-1 et suivants du Code de la consommation, en cas de litige non résolu directement avec Charles MOREL, vous pouvez recourir gratuitement au médiateur de la consommation : MEDICYS, 73 boulevard de Clichy, 75009 Paris (app.medicys-consommation.fr).</p></div>' +
    '<div class="legal-section"><h3>Hébergement</h3>' +
      '<p>Site hébergé par GitHub Pages : GitHub Inc., 88 Colin P. Kelly Jr Street, San Francisco, CA 94107, États-Unis (github.com).</p></div>' +
    '<div class="legal-section"><h3>Propriété intellectuelle et crédits</h3>' +
      '<p>Le logo, la charte graphique et les textes du site sont la propriété de Charles MOREL · L\'Ardoise Immobilière. Toute reproduction sans autorisation est interdite. ' +
      'Photographies d\'ambiance d\'Angers : Unsplash (licence Unsplash). Carte du secteur : cours d\'eau et contours © contributeurs OpenStreetMap (ODbL).</p></div>' +
    '<div class="legal-section"><h3>Annonces</h3>' +
      '<p>Les annonces sont fournies à titre indicatif et ne constituent pas une offre contractuelle. Les caractéristiques des biens (surfaces, prix, diagnostics) sont communiquées par les propriétaires. Les prix de vente s\'entendent honoraires inclus. Toute transaction donne lieu à un mandat écrit conforme à la loi Hoguet.</p></div>',

  'honoraires':
    '<div class="legal-title">Barème des honoraires</div>' +
    '<div class="legal-date">Montants toutes taxes comprises (TVA 20 % incluse)</div>' +
    '<div class="legal-section"><h3>Transaction (vente)</h3>' +
      '<p>Calculés sur le prix net vendeur : un forfait pour les petits montants, puis un pourcentage dégressif.</p>' +
      '<table class="honoraires-table" style="width:100%;margin-top:12px;"><thead><tr><th>Prix net vendeur</th><th>Honoraires TTC</th></tr></thead><tbody>' +
        '<tr><td>Jusqu\'à 100 000 €</td><td>5 000 € TTC (forfait)</td></tr>' +
        '<tr><td>De 100 001 € à 300 000 €</td><td>5 % TTC</td></tr>' +
        '<tr><td>Plus de 300 000 €</td><td>4 % TTC</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:12px;">Les honoraires sont à la charge de l\'acquéreur, sauf mention contraire stipulée dans le mandat de vente. Ils ne sont dus qu\'à la signature de l\'acte authentique chez le notaire. L\'estimation du bien et les rendez-vous préparatoires sont gratuits et sans engagement.</p></div>' +
    '<p style="font-size:.8rem;color:var(--gris);">Barème affiché conformément à l\'arrêté du 10 janvier 2017 et à la loi Hoguet.</p>',

  'rgpd':
    '<div class="legal-title">Protection des données personnelles</div>' +
    '<div class="legal-date">Dernière mise à jour : novembre 2026</div>' +
    '<div class="legal-section"><h3>Responsable du traitement</h3>' +
      '<p>Charles MOREL · L\'Ardoise Immobilière, entrepreneur individuel, agent commercial du réseau 3G IMMO, contact@lardoiseimmobiliere.com.</p></div>' +
    '<div class="legal-section"><h3>Données collectées et finalités</h3>' +
      '<p>Les données saisies dans les formulaires (nom, prénom, téléphone, e-mail, informations sur votre bien ou votre recherche) sont utilisées uniquement pour répondre à votre demande : prise de contact, estimation, visite, recherche de bien, parrainage. Base légale : votre consentement et les mesures précontractuelles prises à votre demande.</p>' +
      '<p><b>Estimation en ligne.</b> La fourchette de prix est calculée dans votre navigateur à partir des données publiques DVF (ventes immobilières publiées par l\'administration fiscale) ; c\'est une estimation indicative, qui ne remplace pas un avis de valeur. Votre demande est transmise à Charles MOREL pour qu\'il vous recontacte.</p>' +
      '<p><b>Suivi de votre estimation.</b> Après une demande d\'estimation, nous vous rappelons au numéro indiqué. Si vous avez coché la case prévue, vous recevez en plus au plus 3 e-mails de suivi (proposition de visite, prix du marché dans votre commune, point sur votre projet) ; ils s\'arrêtent dès que vous demandez une visite ou en un clic grâce au lien présent dans chaque e-mail.</p>' +
      '<p><b>Alertes e-mail.</b> Si vous créez une alerte, votre adresse e-mail et vos critères de recherche servent uniquement à vous envoyer les nouveaux biens correspondants. L\'alerte ne démarre qu\'après votre clic de confirmation, et chaque e-mail contient un lien pour l\'arrêter : l\'adresse est alors effacée. Une alerte non confirmée est effacée au bout de 7 jours.</p></div>' +
    '<div class="legal-section"><h3>Destinataires et durée de conservation</h3>' +
      '<p>Les données sont destinées exclusivement à Charles MOREL et, pour le suivi des mandats, au réseau 3G IMMO. Elles ne sont ni vendues ni cédées, et sont conservées 3 ans à compter du dernier contact. Les demandes d\'estimation et les alertes sont stockées chez Cloudflare (hébergement du serveur du site) et les e-mails sont envoyés par le service Resend ; les autres formulaires transitent par le service d\'envoi Web3Forms. Ces prestataires agissent comme sous-traitants et peuvent héberger des données hors de l\'Union européenne, avec les garanties prévues par le RGPD (clauses contractuelles types).</p></div>' +
    '<div class="legal-section"><h3>Vos droits</h3>' +
      '<p>Vous disposez d\'un droit d\'accès, de rectification, d\'effacement, de limitation, d\'opposition et de portabilité de vos données. Pour les exercer : contact@lardoiseimmobiliere.com. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).</p></div>',

  'cgu':
    '<div class="legal-title">Conditions générales d\'utilisation</div>' +
    '<div class="legal-date">Dernière mise à jour : novembre 2026</div>' +
    '<div class="legal-section"><h3>Objet</h3>' +
      '<p>Le site de L\'Ardoise Immobilière présente les services de l\'agence et les biens proposés à la vente. Son utilisation implique l\'acceptation des présentes conditions.</p></div>' +
    '<div class="legal-section"><h3>Informations publiées</h3>' +
      '<p>Les informations (descriptifs, surfaces, prix, diagnostics) sont données à titre indicatif et peuvent évoluer. Les simulateurs proposés sur la page Outils fournissent des résultats indicatifs qui ne constituent ni une offre de prêt ni un conseil financier.</p></div>' +
    '<div class="legal-section"><h3>Responsabilité</h3>' +
      '<p>L\'agence s\'efforce d\'assurer l\'exactitude des informations publiées mais ne saurait être tenue responsable d\'erreurs ou d\'omissions, ni d\'une indisponibilité temporaire du site.</p></div>',

  'cookies-info':
    '<div class="legal-title">Cookies</div>' +
    '<div class="legal-date">Dernière mise à jour : novembre 2026</div>' +
    '<div class="legal-section"><h3>Ce que le site enregistre</h3>' +
      '<p>Ce site ne dépose aucun cookie publicitaire ni de mesure d\'audience. Il enregistre seulement dans votre navigateur (stockage local) vos biens favoris et une copie des annonces pour un affichage plus rapide. Ces informations restent sur votre appareil et ne sont pas transmises.</p></div>' +
    '<div class="legal-section"><h3>Services tiers</h3>' +
      '<p>Les polices de caractères (Google Fonts), les cartes (OpenStreetMap) et certaines images sont chargées depuis des services tiers, qui peuvent recevoir votre adresse IP pour afficher ces contenus.</p></div>'
};

function showLegal(page) {
  var modal = document.getElementById('modal-legal');
  var lc = document.getElementById('legal-content');
  if (legalPages[page]) {
    lc.innerHTML = legalPages[page];
    modal.style.display = 'block';
    modal.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    // Attacher les boutons après injection du HTML
    var prefBtn = document.getElementById('btn-cookie-prefs');
    if (prefBtn) {
      prefBtn.onclick = function() {
        closeLegal();
        setTimeout(openCookieModal, 200);
      };
    }
  }
}

function closeLegal() {
  document.getElementById('modal-legal').style.display = 'none';
  document.body.style.overflow = '';
}

// ===== PARTAGE D'UN BIEN =====
// Bien actuellement affiché (mémorisé pour le partage)
window._bienAffiche = null;

function _bienShareData(b) {
  if (!b) {
    return { url: window.location.href, titre: "Bien immobilier · L'Ardoise Immobilière", texte: "Découvrez ce bien sur le site de L'Ardoise Immobilière." };
  }
  var url = window.location.href.split('#')[0] + '#bien/' + (b.id || '');
  var titre = (b.type || 'Bien') + (_estLocation(b) ? ' à louer' : ' à vendre');
  if (b.ville) titre += ' à ' + b.ville;
  if (b.surface) titre += ' · ' + b.surface + ' m²';
  if (b.chambres) titre += ' · ' + b.chambres + ' chambre' + (b.chambres > 1 ? 's' : '');
  var texte = "Découvrez ce bien proposé par L'Ardoise Immobilière : " + titre;
  return { url: url, titre: titre, texte: texte };
}

function toggleShareMenu(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  var menu = document.getElementById('ficheShareMenu');
  var btn  = e && e.currentTarget;
  if (!menu) return;

  // Tentative de partage natif sur mobile (Android/iOS) si dispo — UX la plus fluide
  if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    var d = _bienShareData(window._bienAffiche);
    navigator.share({ title: d.titre, text: d.texte, url: d.url }).catch(function(){});
    return;
  }

  // Sinon, ouvre/ferme le menu déroulant
  var open = menu.classList.toggle('is-open');
  menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');

  // Clic à l'extérieur pour fermer
  if (open) {
    setTimeout(function(){
      document.addEventListener('click', _closeShareMenuOnOutside, { once: true });
    }, 0);
  }
}
function _closeShareMenuOnOutside(e) {
  var menu = document.getElementById('ficheShareMenu');
  var wrap = document.querySelector('.fiche-share-wrap');
  if (!menu || !wrap) return;
  if (!wrap.contains(e.target)) {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    var btn = wrap.querySelector('.fiche-share-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  } else {
    // Clic à l'intérieur — on ré-écoute pour le prochain clic extérieur
    document.addEventListener('click', _closeShareMenuOnOutside, { once: true });
  }
}

function shareBien(via) {
  var d = _bienShareData(window._bienAffiche);
  var encUrl = encodeURIComponent(d.url);
  var encTxt = encodeURIComponent(d.texte + '\n\n' + d.url);
  var encTitre = encodeURIComponent(d.titre);
  var target;

  switch (via) {
    case 'whatsapp':
      target = 'https://wa.me/?text=' + encTxt;
      window.open(target, '_blank', 'noopener,noreferrer');
      break;
    case 'email':
      target = 'mailto:?subject=' + encTitre + '&body=' + encTxt;
      window.location.href = target;
      break;
    case 'facebook':
      target = 'https://www.facebook.com/sharer/sharer.php?u=' + encUrl;
      window.open(target, '_blank', 'noopener,noreferrer,width=600,height=500');
      break;
    case 'sms':
      // Format universel iOS+Android : sms:?body=…
      target = 'sms:?&body=' + encTxt;
      window.location.href = target;
      break;
    case 'copy':
      var copyTxt = d.url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyTxt).then(function(){
          if (typeof showToast === 'function') showToast('✓ Lien copié dans le presse-papiers', 'success');
        }).catch(function(){
          _fallbackCopy(copyTxt);
        });
      } else {
        _fallbackCopy(copyTxt);
      }
      break;
  }

  // Ferme le menu après l'action
  var menu = document.getElementById('ficheShareMenu');
  if (menu) {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
  }
}

function _fallbackCopy(text) {
  try {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (typeof showToast === 'function') showToast('✓ Lien copié', 'success');
  } catch(e) {
    if (typeof showToast === 'function') showToast('Impossible de copier le lien', 'error');
  }
}

function goBack() {
  showPage('biens');
}

// ===== RENDU CARTES =====
function formatPrix(p) {
  if (!p || p === 0) return 'Prix sur demande';
  p = parseInt(p) || 0;
  if (p >= 1000000) return (p/1000000).toFixed(2).replace('.',',').replace(',00','') + ' M€ FAI';
  return p.toLocaleString('fr-FR') + ' € FAI';
}

// Affichage public du prix : on masque le prix et on affiche le statut à la place
// dès qu'un bien est sous compromis, offre en cours ou vendu.
function formatPrixPublic(b) {
  if (!b) return '';
  if (_estLocation(b)) return b.prix ? _eur(b.prix) + ' / mois CC' : 'Loyer sur demande';
  if (b.statut === 'vendu')           return 'Vendu';
  if (b.statut === 'sous_compromis')  return 'Sous compromis';
  if (b.statut === 'offre_en_cours')  return 'Offre en cours';
  return formatPrix(b.prix);
}

// Indique si on doit MASQUER tout ce qui touche au prix (table, "à propos du prix", etc.)
function isPrixMasque(b) {
  return b && (b.statut === 'vendu' || b.statut === 'sous_compromis' || b.statut === 'offre_en_cours');
}

function genRef(id) {
  return 'REF. IA-' + String(id).padStart(4, '0');
}

// ===== MISE EN FORME DESCRIPTION =====
function escapeHtmlDesc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==================================================================
// MISE EN FORME PREMIUM DES DESCRIPTIONS IMMOBILIÈRES
// ==================================================================

function formatDescription(text, bien) {
  if (!text) return '';
  var raw = String(text).replace(/\r/g, '').trim();
  if (!raw) return '';
  bien = bien || {};

  // 1) Isoler le bloc légal
  var split = _descSplitLegal(raw);
  var mainText = split.main;
  var legalText = split.legal;

  // 2) Extraire les sections structurées
  var parsed = _descParseSections(mainText);

  // 3) Extraire proximités / distances / temps
  var proximities = _descExtractProximities(mainText);

  // 4) Extraire intro + hook/tags
  var introData = _descProcessIntro(parsed.intro);

  // 5) Construire le HTML premium
  return _descBuildHtml({
    hook: introData.hook,
    tags: introData.tags,
    introBody: introData.body,
    sections: parsed.sections,
    proximities: proximities,
    bien: bien,
    legal: legalText
  });
}

function _descSplitLegal(text) {
  var patterns = [
    /Honoraires de \d/i,
    /Honoraires à la charge/i,
    /Consulter le barème/i,
    /Votre agent commercial/i,
    /Selon l['']article/i,
    /Les informations sur les risques/i,
    /\* ?Prix net/i,
    /Document non contractuel/i,
    /RSAC de /i,
    /Code Monétaire/i
  ];
  var start = -1;
  for (var i = 0; i < patterns.length; i++) {
    var m = text.search(patterns[i]);
    if (m !== -1 && (start === -1 || m < start)) start = m;
  }
  if (start > 0) {
    return { main: text.substring(0, start).trim(), legal: text.substring(start).trim() };
  }
  return { main: text, legal: '' };
}

function _descParseSections(mainText) {
  // Catégories de sections avec mapping vers un titre premium et un type
  var headerGroups = [
    { regex: /^(Au rez-de-chaussée|Au rez de chaussée|Rez-de-chaussée)$/i, title: 'Au rez-de-chaussée', type: 'rdc', icon: 'home' },
    { regex: /^(À l['']étage|A l['']étage|Au 1er étage|Au premier étage|Au 1er Étage)$/i, title: 'À l\u2019étage', type: 'etage', icon: 'stairs' },
    { regex: /^(Au 2ème étage|Au 2nd étage|Au 2e étage|Au second étage|Au 3ème étage)$/i, title: 'Étage supérieur', type: 'etage-haut', icon: 'stairs' },
    { regex: /^(Au sous-sol|En sous-sol|Sous-sol)$/i, title: 'Au sous-sol', type: 'sousol', icon: 'layers' },
    { regex: /^(Au rez-de-jardin|Rez-de-jardin)$/i, title: 'Rez-de-jardin', type: 'rdj', icon: 'leaf' },
    { regex: /^(À l['']extérieur|A l['']extérieur|Extérieurs?|Jardin|Terrasse)$/i, title: 'L\u2019extérieur', type: 'exterieur', icon: 'leaf' },
    { regex: /^(Prestations techniques|Prestations)$/i, title: 'Les prestations', type: 'prestations', icon: 'gear' },
    { regex: /^(Caractéristiques techniques|Caractéristiques)$/i, title: 'Caractéristiques', type: 'carac', icon: 'gear' },
    { regex: /^(Situation|Emplacement|À proximité|A proximité)$/i, title: 'La situation', type: 'situation', icon: 'map' },
    { regex: /^(Annexes)$/i, title: 'Les annexes', type: 'annexes', icon: 'layers' },
    { regex: /^(Côté nuit)$/i, title: 'Côté nuit', type: 'nuit', icon: 'stairs' },
    { regex: /^(Côté jour)$/i, title: 'Côté jour', type: 'jour', icon: 'home' }
  ];

  var allNames = [
    "Au rez-de-chaussée", "Au rez de chaussée", "Rez-de-chaussée",
    "À l'étage", "A l'étage", "À l\u2019étage", "A l\u2019étage",
    "Au 1er étage", "Au premier étage",
    "Au 2ème étage", "Au 2nd étage", "Au 2e étage", "Au second étage", "Au 3ème étage",
    "Au sous-sol", "En sous-sol", "Sous-sol",
    "À l'extérieur", "A l'extérieur", "Extérieurs", "Extérieur",
    "Prestations techniques", "Prestations",
    "Situation", "Emplacement", "À proximité", "A proximité",
    "Jardin", "Terrasse",
    "Caractéristiques techniques", "Caractéristiques",
    "Annexes", "Au rez-de-jardin", "Rez-de-jardin",
    "Côté nuit", "Côté jour"
  ];
  allNames.sort(function(a,b){ return b.length - a.length; });
  var escNames = allNames.map(function(h){ return h.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); });
  var sectionRe = new RegExp('(^|[\\.\\s])(' + escNames.join('|') + ')\\s*:\\s*', 'gi');

  var found = [];
  var mm;
  while ((mm = sectionRe.exec(mainText)) !== null) {
    var offset = mm.index + mm[1].length;
    found.push({ idx: offset, raw: mm[2], end: sectionRe.lastIndex });
  }

  var result = { intro: '', sections: [] };
  if (found.length === 0) { result.intro = mainText; return result; }
  result.intro = mainText.substring(0, found[0].idx).trim();

  for (var j = 0; j < found.length; j++) {
    var match = found[j];
    var nextIdx = (j + 1 < found.length) ? found[j + 1].idx : mainText.length;
    var content = mainText.substring(match.end, nextIdx).trim();

    var matched = null;
    for (var k = 0; k < headerGroups.length; k++) {
      if (headerGroups[k].regex.test(match.raw)) { matched = headerGroups[k]; break; }
    }
    var title = matched ? matched.title : match.raw;
    var type = matched ? matched.type : 'other';
    var icon = matched ? matched.icon : 'home';
    var items = _descExtractItems(content);
    // Détecter un texte de clôture collé au dernier item (ex: "... à proximité Belle prestation...")
    var closing = '';
    if (items.length > 0) {
      var lastItem = items[items.length - 1];
      var closeMatch = lastItem.match(/^([^.]{3,}?)\.\s+([A-ZÀ-Ý].*)$/);
      if (closeMatch && closeMatch[2].length >= 12) {
        items[items.length - 1] = closeMatch[1].trim();
        closing = closeMatch[2].trim();
      }
    }
    result.sections.push({
      title: title,
      originalTitle: match.raw,
      type: type,
      icon: icon,
      content: content,
      items: items,
      closing: closing,
      textBefore: _descTextBeforeBullets(content)
    });
  }
  return result;
}

function _descExtractItems(content) {
  if (!/[·•]/.test(content)) return [];
  var first = content.search(/[·•]/);
  var listPart = content.substring(first);
  return listPart.split(/\s*[·•]\s*/)
    .map(function(s){ return s.trim(); })
    .filter(function(s){ return s.length > 0; });
}
function _descTextBeforeBullets(content) {
  if (!/[·•]/.test(content)) return content.trim();
  var first = content.search(/[·•]/);
  return content.substring(0, first).trim();
}

function _descProcessIntro(intro) {
  if (!intro) return { hook: '', tags: [], body: '' };
  var txt = intro.trim();
  // Détection tags em-dash au début : "... — Tag1 — Tag2 — Suite de phrase"
  var tags = [];
  var body = txt;
  if (txt.indexOf('\u2014') !== -1 || txt.indexOf(' - ') !== -1) {
    var segs = txt.split(/\s*\u2014\s*/);
    if (segs.length >= 3) {
      // On retire les segments courts et ponctués (tags)
      var middle = segs.slice(1, -1);
      var lastSeg = segs[segs.length - 1];
      // Essayer de séparer tag initial du reste dans le dernier segment
      var lastMatch = lastSeg.match(/^([^.\n]{3,60}?)\s+(Située|Situé|Implantée|Implanté|Cette|Ce|Construite|Construit|Entièrement|Au coeur|Au cœur|Nichée|Niché|Dans|En plein|Profitez|Vous serez|Offrant|Idéal)\s+(.+)$/);
      if (lastMatch) {
        middle.push(lastMatch[1].trim());
        body = segs[0].trim() + ' ' + lastMatch[2] + ' ' + lastMatch[3];
      } else {
        body = segs[0].trim() + (lastSeg ? ' ' + lastSeg.trim() : '');
      }
      tags = middle.map(function(s){ return s.trim(); }).filter(function(s){ return s.length >= 3 && s.length <= 80; });
    }
  }
  // Hook = première tagline courte ; on la retire des tags secondaires
  var hook = '';
  if (tags.length > 0) {
    hook = tags[0];
    tags = tags.slice(1);
  }
  return { hook: hook, tags: tags, body: body.trim() };
}

function _descExtractProximities(text) {
  var prox = [];
  var seen = {};
  // "5 minutes de la plage", "10 min du centre-ville", "à 2 min de la gare"
  var re = /(?:à\s+)?(\d+)\s*(?:minutes?|min\.?|mn)\s+(?:de|du|des|à|a)\s+(la |le |l['\u2019]|les )?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-\u2019' ]{1,40}?)(?=[\s\.\,·•]|\n|$)/gi;
  var m;
  while ((m = re.exec(text)) !== null) {
    var mins = parseInt(m[1]);
    var place = (m[3] || '').trim().replace(/[\.,]$/, '');
    if (!place || place.length > 40) continue;
    // Nettoyer sur premier mot / deux mots pertinents
    var placeParts = place.split(/\s+/).slice(0, 3);
    var key = placeParts.join(' ').toLowerCase();
    if (seen[key]) continue;
    seen[key] = true;
    prox.push({ mins: mins, place: placeParts.join(' ') });
    if (prox.length >= 6) break;
  }
  return prox;
}

function _descProxIcon(place) {
  var p = place.toLowerCase();
  if (/plage|mer|océan|ocean/.test(p)) return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 21c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><circle cx="12" cy="8" r="3"/></svg>';
  if (/gare|train|tgv/.test(p)) return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><circle cx="8.5" cy="15.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><path d="M8 19l-2 3M16 19l2 3"/></svg>';
  if (/centre.?ville|bourg|centre/.test(p)) return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-7h6v7"/></svg>';
  if (/école|ecole|collège|college|lycée|lycee/.test(p)) return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
  if (/commerce|marché|marche|boutique/.test(p)) return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M8 9V6a4 4 0 018 0v3"/></svg>';
  if (/aéroport|aeroport|avion/.test(p)) return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.18 9L2 12l8 3 2 7 2-6 6-6-3-3-7 2z"/></svg>';
  if (/autoroute|accès|acces|route/.test(p)) return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-16M20 20l-4-16M12 4v4M12 12v4M12 20v0"/></svg>';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-7.5-8-13a8 8 0 0116 0c0 5.5-8 13-8 13z"/><circle cx="12" cy="9" r="3"/></svg>';
}

function _descSectionIcon(iconKey) {
  switch(iconKey) {
    case 'home': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11L12 3l9 8v10H3z"/><path d="M9 21v-7h6v7"/></svg>';
    case 'stairs': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4v-4h4v-4h4V8h4V4"/></svg>';
    case 'layers': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
    case 'leaf': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 014 13c0-5 4-9 9-9h6v6c0 5-4 9-9 9z"/><path d="M2 22l6-6"/></svg>';
    case 'gear': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.2-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.8A1.7 1.7 0 003 14H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.2 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.9-2.9l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>';
    case 'map': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3V6z"/><path d="M8 3v15M16 6v15"/></svg>';
    default: return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/></svg>';
  }
}

function _descKeyFeatures(bien, mainText) {
  var feats = [];
  if (bien && bien.chambres) {
    feats.push({ value: bien.chambres, label: bien.chambres > 1 ? 'chambres' : 'chambre', icon: 'bed' });
  }
  if (bien && bien.surface) {
    feats.push({ value: bien.surface + ' m²', label: 'habitables', icon: 'square' });
  }
  if (bien && bien.terrain) {
    feats.push({ value: bien.terrain + ' m²', label: 'de terrain', icon: 'tree' });
  }
  if (bien && bien.pieces) {
    feats.push({ value: bien.pieces, label: bien.pieces > 1 ? 'pièces' : 'pièce', icon: 'grid' });
  }
  // Détection de features textuelles
  var detected = [];
  var lowTxt = (mainText || '').toLowerCase();
  var featureHints = [
    { re: /piscine/, label: 'Piscine', icon: 'pool' },
    { re: /poêle\s*(?:à\s*bois|bois)/, label: 'Poêle à bois', icon: 'fire' },
    { re: /cheminée/, label: 'Cheminée', icon: 'fire' },
    { re: /garage/, label: 'Garage', icon: 'car' },
    { re: /jardin(?:s| arboré| paysagé)?/, label: 'Jardin', icon: 'tree' },
    { re: /terrasse/, label: 'Terrasse', icon: 'sun' },
    { re: /cave/, label: 'Cave', icon: 'layers' },
    { re: /dépendance/, label: 'Dépendance', icon: 'home' },
    { re: /dressing/, label: 'Dressing', icon: 'grid' }
  ];
  featureHints.forEach(function(h){
    if (h.re.test(lowTxt)) detected.push({ value: '', label: h.label, icon: h.icon, small: true });
  });
  return { primary: feats.slice(0, 4), secondary: detected.slice(0, 6) };
}

function _descFeatureIcon(iconKey) {
  switch(iconKey) {
    case 'bed': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16v-5a3 3 0 013-3h14a3 3 0 013 3v5"/><path d="M2 20v-4h20v4"/></svg>';
    case 'square': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h4M9 3v4"/></svg>';
    case 'tree': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 8h3v6h2V8h3z"/><path d="M12 14v8M8 22h8"/></svg>';
    case 'grid': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
    case 'pool': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20c2 0 2-2 5-2s3 2 5 2 2-2 5-2 3 2 5 2"/><path d="M6 14V6a3 3 0 013-3"/><path d="M18 14V6a3 3 0 00-3-3"/></svg>';
    case 'fire': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s4 6 4 10a4 4 0 01-8 0c0-2 1-3 2-4 0 0-1-3 2-6z"/></svg>';
    case 'car': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l2-5h10l2 5"/><rect x="3" y="13" width="18" height="6" rx="2"/><circle cx="7" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>';
    case 'sun': return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4 12H2M22 12h-2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></svg>';
    case 'layers': return _descSectionIcon('layers');
    case 'home': return _descSectionIcon('home');
    default: return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/></svg>';
  }
}

function _descBuildHtml(ctx) {
  var html = '';
  var hasSections = ctx.sections && ctx.sections.length > 0;

  // ========== HOOK + INTRO ==========
  if (ctx.hook) {
    html += '<div class="desc-hook">' + escapeHtmlDesc(ctx.hook) + '</div>';
  }
  if (ctx.tags && ctx.tags.length > 0) {
    html += '<div class="desc-tags">';
    ctx.tags.forEach(function(t){
      html += '<span class="desc-tag">' + escapeHtmlDesc(t) + '</span>';
    });
    html += '</div>';
  }
  if (ctx.introBody) {
    // Préserver les sauts de ligne saisis dans le textarea de l'admin :
    // chaque double-saut = nouveau paragraphe ; saut simple = <br>
    var paragraphs = ctx.introBody.split(/\n\s*\n+/);
    var introHtml = paragraphs
      .map(function(p){
        return '<p>' + escapeHtmlDesc(p.trim()).replace(/\n/g, '<br>') + '</p>';
      })
      .join('');
    html += '<div class="desc-intro">' + introHtml + '</div>';
  }

  // ========== KEY FEATURES (badges) ==========
  var feats = _descKeyFeatures(ctx.bien, ctx.introBody + ' ' + ctx.sections.map(function(s){return s.content;}).join(' '));
  if (feats.primary.length > 0) {
    html += '<div class="desc-features-grid">';
    feats.primary.forEach(function(f){
      html += '<div class="desc-feature-card">' +
        '<div class="desc-feature-icon">' + _descFeatureIcon(f.icon) + '</div>' +
        '<div class="desc-feature-value">' + escapeHtmlDesc(f.value) + '</div>' +
        '<div class="desc-feature-label">' + escapeHtmlDesc(f.label) + '</div>' +
      '</div>';
    });
    html += '</div>';
  }
  if (feats.secondary.length > 0) {
    html += '<div class="desc-chips">';
    feats.secondary.forEach(function(f){
      html += '<span class="desc-chip">' +
        '<span class="desc-chip-icon">' + _descFeatureIcon(f.icon) + '</span>' +
        escapeHtmlDesc(f.label) +
      '</span>';
    });
    html += '</div>';
  }

  // ========== PROXIMITIES ==========
  if (ctx.proximities && ctx.proximities.length > 0) {
    html += '<div class="desc-prox-section">';
    html += '<h3 class="desc-prox-title">À proximité</h3>';
    html += '<div class="desc-prox-grid">';
    ctx.proximities.forEach(function(p){
      html += '<div class="desc-prox-card">' +
        '<div class="desc-prox-icon">' + _descProxIcon(p.place) + '</div>' +
        '<div class="desc-prox-text">' +
          '<div class="desc-prox-time">' + p.mins + ' min</div>' +
          '<div class="desc-prox-place">' + escapeHtmlDesc(p.place) + '</div>' +
        '</div>' +
      '</div>';
    });
    html += '</div></div>';
  }

  // ========== SECTIONS ==========
  ctx.sections.forEach(function(sec){
    // La section "Situation" est déjà représentée via les proximités si elles ont été détectées
    if (sec.type === 'situation' && ctx.proximities.length > 0) {
      // Filtrer les items qui ne sont pas des distances
      var nonProxItems = sec.items.filter(function(it){
        return !/\d+\s*(min|minute|mn)/i.test(it);
      });
      if (nonProxItems.length === 0 && !sec.textBefore) return;
      html += _descRenderCard(sec, nonProxItems);
    } else if (sec.type === 'prestations' || sec.type === 'carac') {
      html += _descRenderPrestationsCard(sec);
    } else {
      html += _descRenderCard(sec, sec.items);
    }
  });

  // Si aucune section n'a été détectée, afficher l'intro restante
  if (!hasSections && !ctx.introBody && ctx.sections.length === 0) {
    // Déjà rendu dans l'intro
  }

  // ========== LEGAL ==========
  // ⚠️ On ne rend PAS le bloc légal extrait du texte admin.
  // Les mentions légales (honoraires + RSAC + Géorisques + non-contractuel)
  // sont déjà affichées par les sections dédiées :
  //   - fichePrixSection : pourcentage honoraires calculé dynamiquement (correct à la décimale)
  //   - ficheLegal : RSAC, Géorisques, mentions légales obligatoires
  // Cela évite tout doublon et garantit un pourcentage toujours juste.
  // ctx.legal est volontairement ignoré ici.

  return html || '<p>' + escapeHtmlDesc(ctx.introBody || '') + '</p>';
}

function _descRenderCard(sec, items) {
  var html = '<section class="desc-card">';
  html += '<header class="desc-card-header">';
  html += '<div class="desc-card-icon">' + _descSectionIcon(sec.icon) + '</div>';
  html += '<h3 class="desc-card-title">' + escapeHtmlDesc(sec.title) + '</h3>';
  html += '</header>';

  if (sec.textBefore) {
    html += '<p class="desc-card-text">' + escapeHtmlDesc(sec.textBefore) + '</p>';
  }
  if (items && items.length > 0) {
    html += '<ul class="desc-card-list">';
    items.forEach(function(it){
      html += '<li>' + escapeHtmlDesc(it) + '</li>';
    });
    html += '</ul>';
  } else if (!sec.textBefore && sec.content) {
    html += '<p class="desc-card-text">' + escapeHtmlDesc(sec.content) + '</p>';
  }
  if (sec.closing) {
    html += '<p class="desc-card-closing">' + escapeHtmlDesc(sec.closing) + '</p>';
  }
  html += '</section>';
  return html;
}

function _descRenderPrestationsCard(sec) {
  var html = '<section class="desc-card desc-card-prestations">';
  html += '<header class="desc-card-header">';
  html += '<div class="desc-card-icon">' + _descSectionIcon(sec.icon) + '</div>';
  html += '<h3 class="desc-card-title">' + escapeHtmlDesc(sec.title) + '</h3>';
  html += '</header>';
  if (sec.textBefore) {
    html += '<p class="desc-card-text">' + escapeHtmlDesc(sec.textBefore) + '</p>';
  }
  if (sec.items && sec.items.length > 0) {
    html += '<ul class="desc-card-list desc-card-list-2col">';
    sec.items.forEach(function(it){
      html += '<li>' + escapeHtmlDesc(it) + '</li>';
    });
    html += '</ul>';
  }
  if (sec.closing) {
    html += '<p class="desc-card-closing">' + escapeHtmlDesc(sec.closing) + '</p>';
  }
  html += '</section>';
  return html;
}

function _descRenderLegal(legalText) {
  var html = escapeHtmlDesc(legalText)
    .replace(/ (https?:\/\/\S+|www\.\S+)/gi, ' <a href="$1" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/(Consulter le barème[^.]*\.?)/i, '</p><p>$1')
             .replace(/(Votre agent commercial[^.]*)/i, '</p><p>$1')
             .replace(/(Selon l['']article[^.]*\.)/i, '</p><p>$1</p><p>')
             .replace(/(Les informations sur les risques[^.]*\.?[^.]*\.?)/i, '</p><p>$1')
             .replace(/(\* ?Prix net[^.]*\.)/i, '</p><p>$1')
             .replace(/(Document non contractuel\.?)/i, '</p><p>$1</p>');
  var out = '<aside class="desc-legal"><p>' + html + '</p></aside>';
  return out.replace(/<p>\s*<\/p>/g, '');
}

// Helper d'échappement HTML générique (utilisé partout pour les valeurs des biens)
function _esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function bienCardHTML(b) {
  var div = document.createElement('div');
  div.className = 'bien-card';
  div.style.cursor = 'pointer';
  div.setAttribute('data-id', b.id);
  // Vignettes (haut-gauche) : nouveauté, exclusivité, sous compromis, offre, baisse de prix.
  // (Pas de « coup de cœur », et plus de vignette type Appartement/Maison — déjà écrit sous la photo.)
  var vgs = [];
  // « Nouveauté » / « Baisse de prix » : override manuel de l'admin (b.nouveaute / b.baisse)
  // prioritaire sur la détection automatique (mise en ligne < 21 j / baisse détectée sur 3G).
  var estNouveau = (b.nouveaute !== undefined) ? !!b.nouveaute : !!(b.createdAt && (Date.now() - new Date(b.createdAt).getTime()) < 21 * 86400000);
  var estBaisse = (b.baisse !== undefined) ? !!b.baisse : !!b.baisseDePrix;
  if (estNouveau) vgs.push('<span class="bien-vg vg-new">Nouveauté</span>');
  if (b.exclusif) vgs.push('<span class="bien-vg vg-exclu">Exclusivité</span>');
  if (b.partenaire) vgs.push('<span class="bien-vg vg-partenaire">En partenariat</span>');
  if (b.statut === 'sous_compromis') vgs.push('<span class="bien-vg vg-compromis">Sous compromis</span>');
  if (b.statut === 'offre_en_cours') vgs.push('<span class="bien-vg vg-offre">Offre en cours</span>');
  if (estBaisse) vgs.push('<span class="bien-vg vg-baisse">Baisse de prix</span>');
  if (_estLocation(b)) vgs.unshift('<span class="bien-vg vg-loc">À louer</span>');
  var vignettes = vgs.length ? '<div class="bien-vignettes">' + vgs.join('') + '</div>' : '';
  var ref = b.ref && String(b.ref).trim() ? String(b.ref).trim() : genRef(b.id);
  var chambres = b.chambres ? b.chambres : (b.pieces ? b.pieces - 1 : 0);
  var altTxt = (b.type || 'Bien') + (_estLocation(b) ? ' à louer ' : ' à vendre ') + (b.ville || 'Angers') +
    (b.surface ? ' - ' + b.surface + ' m²' : '') +
    (b.chambres ? ' - ' + b.chambres + ' chambres' : '') +
    " - L'Ardoise Immobilière";
  div.innerHTML =
    '<div class="bien-card-img">' +
      bcSlides(b, altTxt) +
      vignettes + favBouton(b.id) + _agentAvatar(b) +
      '<span class="bien-card-discover">Découvrir ce bien →</span>' +
      bcControls(b) +
    '</div>' +
    '<div class="bien-card-body">' +
      '<div class="bien-card-type">' + _esc(b.type || 'Bien') + '</div>' +
      '<div class="bien-card-loc">' + _esc(b.ville || '') + (b.cp ? ' (' + _esc(b.cp) + ')' : '') + '</div>' +
      '<div class="bien-card-specs">' + _specsCarte(b) + '</div>' +
      '<div class="bien-card-footer">' +
        '<span class="bien-card-ref">' + _esc(ref) + '</span>' +
        '<div class="bien-card-price' + (isPrixMasque(b) ? ' bien-card-price--statut' : '') + '">' + _esc(formatPrixPublic(b)) + '</div>' +
      '</div>' +
    '</div>';
  div.addEventListener('click', function() { showFiche(parseInt(b.id)); });
  return div;
}

function renderHomeGrid() {
  const grid = document.getElementById('homeGrid');
  if (!grid) return;
  // On exclut les biens vendus de la page d'accueil (ils apparaissent dans "Nos dernières ventes")
  const actifs = biens.filter(function(b){ return b.statut !== 'vendu'; })
    .sort(function(a, b){ return (parseInt(b.id) || 0) - (parseInt(a.id) || 0); }); // plus récents d'abord (ordre d'ajout)
  // Sélection « à la une » choisie depuis l'admin ; repli sur les plus récents si aucune.
  // (Carrousel horizontal → on en montre plusieurs, façon Barnes.)
  const choisis = actifs.filter(function(b){ return b.alaune; });
  const featured = choisis.length ? choisis : actifs.slice(0, 9);
  grid.innerHTML = '';
  featured.forEach(function(b) { grid.appendChild(bienCardHTML(b)); });
  var _sec = document.getElementById('biens-home');
  if (_sec) _sec.classList.toggle('une-vide', featured.length === 0);
  if (!featured.length) {
    grid.innerHTML = '<div class="une-empty"><h3>De nouveaux biens arrivent à Angers</h3>' +
      '<p>Certains biens trouvent preneur avant même d\'être publiés. Confiez-nous votre recherche : nous vous prévenons en priorité dès qu\'un bien correspond.</p>' +
      '<div class="cb-actions"><button class="cb-btn" onclick="ouvrirCriteres()">Confier ma recherche</button>' +
      '<button class="cb-btn ghost" onclick="showPage(\'estimation\')">Estimer mon bien</button></div></div>';
  }
  observeFadeIns();
  renderVendusCarousel();
  renderReseauxThumbs();
}
// Défilement du carrousel « Nos biens à la une »
function scrollUne(dir) {
  var c = document.getElementById('homeGrid');
  if (c) c.scrollBy({ left: dir * 360, behavior: 'smooth' });
}

// Remplit les 3 vignettes « feed » de chaque carte réseau avec de VRAIES photos
// des annonces du site (chaque carte reçoit des photos différentes). Si aucune
// photo n'est dispo, on garde les visuels par défaut du HTML.
function renderReseauxThumbs() {
  var cards = document.querySelectorAll('#reseaux .reseau-card');
  if (!cards.length || typeof biens === 'undefined') return;
  var photos = biens
    .filter(function(b){ return b.statut !== 'vendu'; })
    .map(function(b){ return b.img; })
    .filter(function(u){ return u && /^https?:/.test(u); });
  if (photos.length < 3) return; // pas assez de vraies photos → on laisse les visuels par défaut
  var k = 0;
  cards.forEach(function(card){
    card.querySelectorAll('.reseau-feed span').forEach(function(sp){
      sp.style.backgroundImage = "url('" + imgOpt(photos[k % photos.length], 240) + "')";
      k++;
    });
  });
}

// Filtrage + tri partagés (grille ET carte)
function getBiensFiltres() {
  let f = biens.filter(function(b){ return b.statut !== 'vendu' && (b.transaction || 'vente') === filterTransaction; });
  if (filterType !== 'all') f = f.filter(b => b.type === filterType);
  if (filterVilles.length) f = f.filter(b => filterVilles.indexOf(b.ville) !== -1);
  if (filterSecteur) f = f.filter(function (b) { return _villeDansSecteur(b.ville, filterSecteur); });
  if (filterBudgetMax > 0) f = f.filter(b => (parseInt(b.prix) || 0) <= filterBudgetMax);
  if (filterSurfaceMin > 0) f = f.filter(b => (parseInt(b.surface) || 0) >= filterSurfaceMin);
  if (filterBudgetMin > 0) f = f.filter(b => (parseInt(b.prix) || 0) >= filterBudgetMin);
  if (filterTerrainMin > 0) f = f.filter(b => (parseInt(b.terrain) || 0) >= filterTerrainMin);
  if (filterChambresMin > 0) f = f.filter(b => (parseInt(b.chambres) || 0) >= filterChambresMin);
  if (filterRef) { var q = filterRef.toLowerCase().trim(); f = f.filter(b => String(b.ref || '').toLowerCase().indexOf(q) !== -1); }
  if (typeof filterFeatures !== 'undefined' && filterFeatures.length) f = f.filter(function(b){ var k = bienFeatures(b); return filterFeatures.every(function(x){ return k.indexOf(x) !== -1; }); });
  f.sort(function(a, b){
    if (sortBiens === 'prix_asc')  return (parseInt(a.prix)||0) - (parseInt(b.prix)||0);
    if (sortBiens === 'prix_desc') return (parseInt(b.prix)||0) - (parseInt(a.prix)||0);
    if (sortBiens === 'surface_desc') return (parseInt(b.surface)||0) - (parseInt(a.surface)||0);
    return (parseInt(b.id) || 0) - (parseInt(a.id) || 0);
  });
  return f;
}
function renderBiensGrid() {
  const grid = document.getElementById('biensGrid');
  if (!grid) return;
  if (typeof renderFeatChips === 'function') renderFeatChips();
  var filtered = getBiensFiltres();
  var _rs = document.getElementById('biensReset');
  if (_rs) _rs.hidden = !(filterType !== 'all' || filterVilles.length || filterSecteur || filterBudgetMax || filterBudgetMin || filterSurfaceMin || filterTerrainMin || filterChambresMin || filterRef || (typeof filterFeatures !== 'undefined' && filterFeatures.length));
  var countEl = document.getElementById('biensCount');
  if (countEl) countEl.textContent = filtered.length + ' résultat' + (filtered.length > 1 ? 's' : '');
  if (typeof renderAlerteBox === 'function') renderAlerteBox();
  grid.innerHTML = '';
  if (filtered.length) {
    filtered.forEach(function(b) { grid.appendChild(bienCardHTML(b)); });
  } else {
    grid.innerHTML = '<p style="padding:3rem;color:var(--gris);grid-column:1/-1">Aucun bien ne correspond pour le moment à votre recherche. ' +
      '<a href="#alerteBox" onclick="creerAlerte();return false;" style="color:var(--or-fonce);text-decoration:underline;">Confiez-nous votre recherche</a> : nous vous prévenons dès qu\'un bien correspond.</p>';
  }
  observeFadeIns();
  if (_carteVisible) renderBiensMap();  // maj carte si ouverte
}

// ===== CARTE (Leaflet, chargé à la demande) =====
var _carteVisible = false, _leafletMap = null, _leafletLayer = null, _leafletLoading = false;
var VILLE_COORDS = {  // centres : point « commune » de la Base Adresse Nationale (vérifiés le 25/11/2026)
  'Angers': [47.4675, -0.5616], 'Avrillé': [47.5020, -0.5963], 'Trélazé': [47.4484, -0.4864],
  'Les Ponts-de-Cé': [47.4293, -0.5220], 'Saint-Barthélemy-d\'Anjou': [47.4723, -0.4902], 'Beaucouzé': [47.4741, -0.6289],
  'Bouchemaine': [47.4291, -0.6133], 'Écouflant': [47.5179, -0.5198], 'Mûrs-Érigné': [47.3975, -0.5475],
  'Sainte-Gemmes-sur-Loire': [47.4323, -0.5695], 'Montreuil-Juigné': [47.5391, -0.6093], 'Verrières-en-Anjou': [47.5176, -0.4737],
  'Saint-Sylvain-d\'Anjou': [47.5176, -0.4737], 'Loire-Authion': [47.4674, -0.3612], 'Saint-Léger-de-Linières': [47.4623, -0.7059],
  'Longuenée-en-Anjou': [47.5537, -0.6682], 'Brissac Loire Aubance': [47.3471, -0.4136], 'Cantenay-Épinard': [47.5419, -0.5686],
  // Secteur de Sablé-sur-Sarthe
  'Sablé-sur-Sarthe': [47.8392, -0.3387], 'Solesmes': [47.8457, -0.3003], 'Juigné-sur-Sarthe': [47.8559, -0.2974],
  'Précigné': [47.7633, -0.3152], 'Parcé-sur-Sarthe': [47.8349, -0.1984], 'Noyen-sur-Sarthe': [47.8616, -0.0974],
  'Louailles': [47.7892, -0.2490], 'Vion': [47.8134, -0.2704], 'Avoise': [47.8654, -0.2066], 'Pincé': [47.7992, -0.3783],
  'Morannes sur Sarthe-Daumeray': [47.7183, -0.3785], 'Bouère': [47.8656, -0.4820], 'Val-du-Maine': [47.9322, -0.4168],
  'Ballée': [47.9322, -0.4168], 'Saint-Denis-d\'Anjou': [47.7894, -0.4366], 'Saint-Loup-du-Dorat': [47.8853, -0.4103],
  'Mont-Saint-Jean': [48.2483, -0.1057], 'Auvers-le-Hamon': [47.9066, -0.3491], 'Asnières-sur-Vègre': [47.8900, -0.2343],
  'Bouessay': [47.8727, -0.3923], 'Grez-en-Bouère': [47.8772, -0.5256], 'Saint-Brice': [47.8669, -0.4292],
  'Malicorne-sur-Sarthe': [47.8125, -0.0982], 'Brûlon': [47.9706, -0.2368], 'Durtal': [47.6809, -0.2571], 'Les Hauts-d\'Anjou': [47.6808, -0.4878]
}
function _coordVille(ville, id) {
  var _b = (typeof biens !== 'undefined' && biens.find(function (x) { return String(x.id) === String(id); })) || {};
  var base = VILLE_COORDS[ville] || (/^(72|53)/.test(String(_b.cp || '')) ? VILLE_COORDS['Sablé-sur-Sarthe'] : VILLE_COORDS['Angers']);
  var n = parseInt(id) || 0; // décalage déterministe pour ne pas empiler les biens d'une même ville
  return [base[0] + (((Math.floor(n / 7)) % 7 - 3) * 0.0016), base[1] + ((n % 7 - 3) * 0.0016)];
}
function _chargerLeaflet(cb) {
  if (window.L) { cb(); return; }
  if (_leafletLoading) { setTimeout(function(){ _chargerLeaflet(cb); }, 200); return; }
  _leafletLoading = true;
  var css = document.createElement('link'); css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
  var js = document.createElement('script'); js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  js.onload = cb; document.head.appendChild(js);
}
function toggleVueCarte() {
  _carteVisible = !_carteVisible;
  var grid = document.getElementById('biensGrid'), map = document.getElementById('biensMap');
  var btn = document.getElementById('biensVueBtn'), label = document.getElementById('biensVueLabel');
  if (_carteVisible) {
    grid.style.display = 'none'; map.style.display = 'block';
    if (btn) btn.classList.add('active'); if (label) label.textContent = 'Liste';
    _chargerLeaflet(renderBiensMap);
  } else {
    map.style.display = 'none'; grid.style.display = '';
    if (btn) btn.classList.remove('active'); if (label) label.textContent = 'Carte';
  }
}
function renderBiensMap() {
  if (!window.L) return;
  var el = document.getElementById('biensMap'); if (!el) return;
  if (!_leafletMap) {
    _leafletMap = L.map(el, { scrollWheelZoom: false }).setView([47.29, -2.40], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19, subdomains: 'abc'
    }).addTo(_leafletMap);
  }
  if (_leafletLayer) _leafletLayer.remove();
  _leafletLayer = L.layerGroup().addTo(_leafletMap);
  var liste = getBiensFiltres(), bounds = [];
  liste.forEach(function(b){
    var c = _coordVille(b.ville, b.id); bounds.push(c);
    var prix = (typeof formatPrixPublic === 'function') ? formatPrixPublic(b) : ((b.prix||0) + ' €');
    L.marker(c).addTo(_leafletLayer).bindPopup(
      '<div class="biens-map-popup"><strong>' + (b.type||'Bien') + '</strong><br>' +
      (b.ville||'') + (b.surface ? ' · ' + b.surface + ' m²' : '') + '<br>' +
      '<span style="color:#021430;font-weight:600;">' + prix + '</span><br>' +
      '<a onclick="showFiche(' + (parseInt(b.id)||0) + ');return false;">Voir le bien →</a></div>');
  });
  setTimeout(function(){ _leafletMap.invalidateSize(); if (bounds.length) _leafletMap.fitBounds(bounds, { padding: [40,40], maxZoom: 13 }); }, 120);
}
// Applique une valeur de filtre depuis les <select> et re-rend
function reinitialiserFiltres() {
  filterType = 'all'; filterVilles = []; filterSecteur = ''; filterBudgetMax = 0; filterBudgetMin = 0; filterSurfaceMin = 0;
  filterTerrainMin = 0; filterChambresMin = 0; filterRef = '';
  if (typeof filterFeatures !== 'undefined') filterFeatures = [];
  syncFiltresBiens();
  renderBiensGrid();
}
function setFiltre(champ, valeur) {
  if (champ === 'type') filterType = valeur || 'all';
  else if (champ === 'budget') filterBudgetMax = parseInt(valeur) || 0;
  else if (champ === 'surface') filterSurfaceMin = parseInt(valeur) || 0;
  else if (champ === 'chambres') filterChambresMin = parseInt(valeur) || 0;
  else if (champ === 'ref') filterRef = valeur || '';
  else if (champ === 'budgetmin') filterBudgetMin = parseInt(valeur) || 0;
  else if (champ === 'terrain') filterTerrainMin = parseInt(valeur) || 0;
  else if (champ === 'tri') sortBiens = valeur || 'recent';
  renderBiensGrid();
}
// Recherche depuis le hero → applique et bascule sur la page Biens
function lancerRechercheHero() {
  var g = function(id){ var e = document.getElementById(id); return e ? e.value : ''; };
  setTransaction(g('heroTx') || 'vente');
  filterType = g('heroType') || 'all';
  // filterVilles est déjà piloté par les cases à cocher du hero (multi-sélection)
  filterBudgetMax = parseInt(g('heroBudget')) || 0;
  filterSurfaceMin = parseInt(g('heroSurface')) || 0;
  filterChambresMin = parseInt(g('heroChambres')) || 0;
  filterRef = g('heroRef') || '';
  sortBiens = 'recent';
  showPage('biens');
  window.scrollTo(0, 0);
  syncFiltresBiens();     // répercuter dans les <select> de la page Biens
  renderBiensGrid();
}
// Recopie l'état des filtres dans les <select> de la page Biens
function syncFiltresBiens() {
  var map = { biensType: filterType === 'all' ? '' : filterType,
    biensBudget: filterBudgetMax || '', biensSurface: filterSurfaceMin || '',
    biensChambres: filterChambresMin || '', biensTri: sortBiens,
    biensBudgetMin: filterBudgetMin || '', biensTerrain: filterTerrainMin || '', biensRef: filterRef || '' };
  Object.keys(map).forEach(function(id){ var e = document.getElementById(id); if (e) e.value = String(map[id]); });
  syncVilleMultiselect();
}
// « Créer une alerte » : ouvre le formulaire de contact pré-rempli avec la recherche
function creerAlerte() {
  var _bx = document.getElementById('alerteBox');
  if (_alertesOuvertes && _bx && !_bx.hidden) {
    _bx.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var _em = document.getElementById('alerteEmail'); if (_em) setTimeout(function () { _em.focus({ preventScroll: true }); }, 400);
    return;
  }
  ouvrirCriteres({
    type: filterType !== 'all' ? filterType : '',
    villes: filterVilles.join(', '),
    budget: filterBudgetMax || '',
    surface: filterSurfaceMin || '',
    chambres: filterChambresMin || ''
  }, filterTransaction);
}

// Rendre dynamiquement le carrousel des biens vendus (combine les biens "vendus" de l'admin + ceux de 3gimmo)
var CONSEILLERS = {"charles": {"prenom": "Charles", "nomFamille": "MOREL", "nom": "Charles MOREL", "role": "", "vignette": "img/charles-morel-avatar.webp", "tel": "06 38 55 53 55", "email": "charlesmorel@lardoiseimmobiliere.com"}, "antoine": {"prenom": "Antoine", "nomFamille": "HÉRY", "nom": "Antoine HÉRY", "role": "", "vignette": "img/equipe-antoine-hery-avatar.webp", "tel": "06 82 87 33 31", "email": "antoinehery@lardoiseimmobiliere.com"}};
var CONSEILLER_DEFAUT = 'charles';
// ===== REFONTE BINÔME (24/11/2026) — chiffres clés de l'accueil =====
// Biens vendus = 193 ventes réalisées avant le site (chiffre donné par Charles le 24/11/2026)
//               + chaque bien passé en « Vendu » dans l'espace pro.
var VENDUS_DEPART = 193;
// Biens en vente = annonces publiées sur le site (hors vendus) ; biens vendus = cartes du bandeau « dernières ventes ».
function majChiffres(nbVendus) {
  try {
    var nbVente = (biens || []).filter(function (b) { return b.statut !== 'vendu' && (b.transaction || 'vente') === 'vente'; }).length;
    var lignes = [['chiffreVente', nbVente], ['chiffreVendus', nbVendus || 0]];
    var _ev = document.getElementById('estVendus'); if (_ev && nbVendus) _ev.textContent = nbVendus;
    if (typeof renderFavoris === 'function' && document.querySelector('#page-favoris.active')) renderFavoris();   // biens chargés après l'arrivée directe sur #favoris
    lignes.forEach(function (l) {
      var n = document.getElementById(l[0]), bloc = document.getElementById(l[0] + 'Bloc');
      if (!n || !bloc) return;
      n.setAttribute('data-cible', l[1]);
      var ch = document.getElementById('chiffres');
      n.textContent = (ch && ch.getAttribute('data-compte') !== '1' && document.documentElement.classList.contains('anim')) ? 0 : l[1];
      if (ch && ch.getAttribute('data-compte') === '1' && typeof _compter === 'function') _compter(n);
      bloc.hidden = !(l[1] > 0);
    });
  } catch (e) {}
}

// Onglet actif de la barre mobile au premier affichage (ensuite, showPage s'en charge)
function majOngletMobile() {
  var p = document.querySelector('.page.active');
  var cle = { 'page-home': 'home', 'page-biens': 'acheter', 'page-vendre': 'vendre', 'page-estimation': 'estimation', 'page-contact': 'contact' }[p ? p.id : ''];
  document.querySelectorAll('.tabbar a[data-nav]').forEach(function (a) {
    var on = a.getAttribute('data-nav') === cle;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}
window.addEventListener('load', function () { if (!document.querySelector('.tabbar .is-active')) majOngletMobile(); });

// Fiche : caractéristiques en grille à icônes (remplace le tableau ; les valeurs vides « — » ne sont plus affichées)
var _CARAC_ICO = (function () {
  var p = {
    ref: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    lieu: '<path d="M12 21s-7-6.3-7-11.5A7 7 0 0 1 19 9.5C19 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    maison: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    pieces: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/>',
    lit: '<path d="M3 18V7"/><path d="M3 13h18v5"/><path d="M21 13a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10.5" r="1.5"/>',
    eau: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    niveaux: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    surface: '<path d="M4 4h16v16H4z"/><path d="M4 9h3M4 14h3M9 4v3M14 4v3"/>',
    terrain: '<path d="M12 22v-6"/><path d="M12 3 6 13h12L12 3z"/><path d="M3 22h18"/>',
    date: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    euro: '<path d="M17 6.5A7 7 0 1 0 17 17.5"/><path d="M4 10.5h9M4 13.5h9"/>',
    chauffage: '<path d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 0-7.5z"/>',
    garage: '<path d="M3 21V9l9-5 9 5v12"/><path d="M7 21v-7h10v7"/><path d="M7 17h10"/>',
    soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    etat: '<path d="M20 6 9 17l-5-5"/>',
    cle: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8"/><path d="m17 6 3 3"/>'
  };
  var o = {};
  Object.keys(p).forEach(function (k) { o[k] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p[k] + '</svg>'; });
  return o;
})();
function _caracIco(l) {
  var t = String(l).toLowerCase();
  if (/référence/.test(t)) return _CARAC_ICO.ref;
  if (/secteur|ville/.test(t)) return _CARAC_ICO.lieu;
  if (/type/.test(t)) return _CARAC_ICO.maison;
  if (/pièces/.test(t)) return _CARAC_ICO.pieces;
  if (/chambre/.test(t)) return _CARAC_ICO.lit;
  if (/salle/.test(t)) return _CARAC_ICO.eau;
  if (/niveau/.test(t)) return _CARAC_ICO.niveaux;
  if (/terrain/.test(t)) return _CARAC_ICO.terrain;
  if (/surface/.test(t)) return _CARAC_ICO.surface;
  if (/année|disponible/.test(t)) return _CARAC_ICO.date;
  if (/chauffage/.test(t)) return _CARAC_ICO.chauffage;
  if (/garage|parking/.test(t)) return _CARAC_ICO.garage;
  if (/exposition/.test(t)) return _CARAC_ICO.soleil;
  if (/état/.test(t)) return _CARAC_ICO.etat;
  if (/location/.test(t)) return _CARAC_ICO.cle;
  return _CARAC_ICO.euro;
}
function _carac(l, v) {
  if (!l || v === undefined || v === null || v === '' || v === '—') return '';
  return '<div class="carac"><span class="carac-ico">' + _caracIco(l) + '</span><span class="carac-txt"><span class="carac-l">' + l + '</span><span class="carac-v">' + v + '</span></span></div>';
}

// ===== Conseiller de chaque bien (« qui s'occupe de ce bien », comme La Cabane) =====
// CONSEILLERS est injecté par refonte.py (source unique, aussi utilisée pour la section équipe).
// Un bien porte `conseiller: 'antoine'` ; sans ce champ (flux 3G), c'est Charles.
function conseillerDe(b) { return (b && CONSEILLERS[b.conseiller]) || CONSEILLERS[CONSEILLER_DEFAUT]; }
function _agentAvatar(b) {
  var c = conseillerDe(b);
  return '<span class="bien-card-agent" title="' + _esc(c.nom) + ' s’occupe de ce bien"><img src="' + c.vignette + '" alt="Conseiller : ' + _esc(c.nom) + '" width="44" height="44" loading="lazy" decoding="async"></span>';
}
function majConseillerFiche(b) {
  // microtâche : s'exécute dès que showFiche a fini de remplir la fiche, mais avant que le navigateur ne l'affiche
  (window.queueMicrotask || function (f) { Promise.resolve().then(f); })(function () { _ficheCabaneMaj(b); });
  var c = conseillerDe(b);
  var ph = document.getElementById('ficheAgentPhoto');
  if (ph) { ph.src = c.vignette; ph.alt = c.nom; }
  var nm = document.querySelector('.fiche-agent-card .fiche-agent-name');
  if (nm) nm.innerHTML = _esc(c.prenom) + '<br>' + _esc(c.nomFamille);
  // Téléphone : celui du conseiller s'il est renseigné, sinon celui de l'agence (déjà posé au chargement)
  if (c.tel) {
    var href = 'tel:+33' + c.tel.replace(/\D/g, '').replace(/^0/, '');
    document.querySelectorAll('.fiche-agent-card [data-tel], .fiche-mobile-bar [data-tel]').forEach(function (a) {
      a.href = href;
      if (!a.hasAttribute('data-keep-label')) a.textContent = c.tel;
    });
  }
}

// Espace pro : choisir le conseiller de chaque bien (enregistré avec les statuts, comme « Exclusivité »)
function _adminConseillerSelect(b, dis) {
  var cur = b.conseiller && CONSEILLERS[b.conseiller] ? b.conseiller : CONSEILLER_DEFAUT;
  return '<label class="admin-conseiller">Conseiller <select' + dis + ' onchange="adminSetConseiller(' + b.id + ', this.value)">' +
    Object.keys(CONSEILLERS).map(function (k) { return '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + _esc(CONSEILLERS[k].nom) + '</option>'; }).join('') +
    '</select></label>';
}
function adminSetConseiller(id, v) { return _adminMajBadge(id, { conseiller: v }); }

// ===== Biens en partenariat (data/biens-partenaires.json) : ajoutés aux biens du flux, hors filtre de secteur =====
async function _biensPartenaires() {
  try {
    var r = await fetch('data/biens-partenaires.json?t=' + Date.now(), { cache: 'no-cache' });
    if (!r.ok) return [];
    var j = await r.json();
    return (j.biens || []).map(function (b) { return _normalizeBien(b); });
  } catch (e) { return []; }
}
function _mentionPartenaire(b) {
  var p = b.partenaire || {};
  return '<p style="margin-bottom:.8rem;">Bien proposé en partenariat avec <strong style="color:var(--noir);font-weight:600;">' + _esc(p.nom) + '</strong>' +
    (p.adresse ? ' (' + _esc(p.adresse) + ')' : '') + ', agence titulaire du mandat (réf. ' + _esc(b.ref) + '). Votre interlocuteur : ' + _esc(conseillerDe(b).nom) + '.' +
    (p.honoraires ? ' Honoraires : ' + _esc(p.honoraires) + '.' : '') +
    (p.energie ? ' Dépenses annuelles d’énergie estimées : ' + _esc(p.energie) + '.' : '') +
    (p.url ? ' <a href="' + _esc(p.url) + '" target="_blank" rel="noopener" style="color:var(--or-fonce);border-bottom:1px solid currentColor;">Voir l’annonce d’origine</a>' : '') + '</p>';
}

// ===== Page « Nos annonces » : curseur de budget, bouton Rechercher, affichage grille / liste =====
var BUD_MAX = 1000000;
function _eurBud(n) { return n.toLocaleString('fr-FR').replace(/ | /g, ' ') + ' €'; }
function _majCurseur() {
  var mi = document.getElementById('budMin'), ma = document.getElementById('budMax'); if (!mi || !ma) return;
  mi.value = Math.min(filterBudgetMin || 0, BUD_MAX); ma.value = filterBudgetMax ? Math.min(filterBudgetMax, BUD_MAX) : BUD_MAX;
  _peindreCurseur();
}
function _peindreCurseur() {
  var mi = document.getElementById('budMin'), ma = document.getElementById('budMax'), pl = document.getElementById('budPlage'), v = document.getElementById('budVal');
  if (!mi || !ma) return;
  var a = +mi.value, b = +ma.value;
  if (pl) { pl.style.left = (a / BUD_MAX * 100) + '%'; pl.style.right = (100 - b / BUD_MAX * 100) + '%'; }
  if (v) v.textContent = 'De ' + _eurBud(a) + ' à ' + _eurBud(b) + (b >= BUD_MAX ? ' et +' : '');
}
var _budTempo = null;
function _budChange(e) {
  var mi = document.getElementById('budMin'), ma = document.getElementById('budMax');
  if (+mi.value > +ma.value) { if (e && e.target === mi) mi.value = ma.value; else ma.value = mi.value; }
  _peindreCurseur();
  clearTimeout(_budTempo);
  _budTempo = setTimeout(function () {
    filterBudgetMin = +mi.value || 0;
    filterBudgetMax = (+ma.value >= BUD_MAX) ? 0 : +ma.value;
    var s1 = document.getElementById('biensBudgetMin'), s2 = document.getElementById('biensBudget');
    if (s1) s1.value = ''; if (s2) s2.value = '';
    renderBiensGrid();
  }, 180);
}
function lancerRechercheAnnonces() {
  renderBiensGrid();
  var g = document.querySelector('.biens-resultbar') || document.getElementById('biensGrid');
  if (g) window.scrollTo({ top: g.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
}
function _vueAnnonces(v) {
  var g = document.getElementById('biensGrid'); if (!g) return;
  g.classList.toggle('vue-liste', v === 'liste');
  document.querySelectorAll('.vue-bascule button').forEach(function (b) { var on = b.getAttribute('data-vue') === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  try { localStorage.setItem('ia_vue', v); } catch (e) {}
}
document.addEventListener('DOMContentLoaded', function () {
  ['budMin', 'budMax'].forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener('input', _budChange); });
  document.querySelectorAll('.vue-bascule button').forEach(function (b) { b.addEventListener('click', function () { _vueAnnonces(b.getAttribute('data-vue')); }); });
  var v = 'grille'; try { v = localStorage.getItem('ia_vue') || 'grille'; } catch (e) {}
  _vueAnnonces(v); _majCurseur();
  if (typeof favMajUI === 'function') { var _fav0 = favMajUI; favMajUI = function () { _fav0.apply(this, arguments); _majFavsAnnonces(); }; }
  _majFavsAnnonces();
});
function _majFavsAnnonces() { var n = document.getElementById('favsAnnoncesN'); if (n) { try { n.textContent = favListe().length; } catch (e) { n.textContent = '0'; } } }

// ===================== FICHE ANNONCE FAÇON LA CABANE (24/11/2026) =====================
// Mise en page sur une colonne : en-tête (type, ville, référence), grande photo + vignettes, prix, caractéristiques,
// bilan énergétique en cases A→G, description, localisation, mensualités, « Contacter <conseiller> », autres biens.
var _fjIdx = 0;
function _ficheCabaneInit() {
  var p = document.getElementById('page-fiche'); if (!p || p.classList.contains('fj')) return;
  p.classList.add('fj');
  var body = p.querySelector('.fiche-body'), main = body && body.firstElementChild, side = p.querySelector('.fiche-sidebar');
  var gal = document.getElementById('ficheGallery');
  if (!body || !main || !gal) return;
  // En-tête : kicker + titre + ville | référence
  var tete = document.createElement('div'); tete.className = 'fj-tete';
  tete.innerHTML = '<div class="fj-tete-g"><span class="fj-kicker" id="fjKicker">Acheter</span></div><p class="fj-ref" id="fjRef"></p>';
  var tg = tete.querySelector('.fj-tete-g');
  tg.appendChild(document.getElementById('ficheTitre')); tg.appendChild(document.getElementById('ficheLoc'));
  gal.parentNode.insertBefore(tete, gal);
  // Enveloppe autour de la galerie (son contenu est réécrit à chaque fiche) : boutons favori / PDF / partage posés sur la photo
  var env = document.createElement('div'); env.className = 'fj-galenv'; gal.parentNode.insertBefore(env, gal); env.appendChild(gal);
  var act = p.querySelector('.fiche-actions-bar'); if (act) env.appendChild(act);
  // Vignettes sous la photo
  var th = document.createElement('div'); th.className = 'fj-vignettes'; th.id = 'fjVignettes'; env.parentNode.insertBefore(th, env.nextSibling);
  // Bloc prix (prix + détails) à côté des chiffres clés
  var pp = document.createElement('div'); pp.className = 'fj-prixbloc';
  pp.innerHTML = '<div class="fj-prix"></div>'; pp.firstChild.appendChild(document.getElementById('fichePrix'));
  var det = document.createElement('div'); det.className = 'fj-prix-det'; det.id = 'fjPrixDet'; pp.firstChild.appendChild(det);
  var keys = document.getElementById('ficheKeys'); if (keys) pp.appendChild(keys);
  main.insertBefore(pp, main.firstChild);
  // Titres de sections
  var t = function (txt, avant, id) { var h = document.createElement('h2'); h.className = 'fj-h2'; h.textContent = txt; if (id) h.id = id; avant.parentNode.insertBefore(h, avant); return h; };
  var desc = document.getElementById('ficheDesc'); if (desc) t('Description', desc);
  var dpe = document.getElementById('ficheDPE');
  // Ordre : caractéristiques, bilan énergétique, description, (extras : localisation, mensualités…), prix détaillé, mentions
  var specs = document.getElementById('ficheSpecs');
  if (specs && dpe) { var hd = t('Bilan énergétique', specs.nextSibling, 'fjDpeTitre'); hd.parentNode.insertBefore(dpe, hd.nextSibling); }
  var extras = document.getElementById('ficheExtras'), prixS = document.getElementById('fichePrixSection'), legal = document.getElementById('ficheLegal');
  if (extras) { if (prixS) main.appendChild(prixS); if (legal) main.appendChild(legal); }
  // Section « Contacter … » : carte du conseiller + formulaire (plus de colonne latérale)
  var sec = document.createElement('section'); sec.className = 'fj-contact';
  sec.innerHTML = '<h2 class="fj-h2">Contacter <span id="fjContactPrenom">Charles</span></h2><div class="fj-contact-grille"></div>';
  var gr = sec.querySelector('.fj-contact-grille');
  var card = p.querySelector('.fiche-agent-card'), form = p.querySelector('.fiche-contact-form'), lien = p.querySelector('.fiche-agency-link');
  if (card) { var col = document.createElement('div'); col.className = 'fj-contact-carte'; col.appendChild(card); if (lien) col.appendChild(lien); gr.appendChild(col); }
  if (form) gr.appendChild(form);
  main.appendChild(sec);
  if (side) side.hidden = true;
}
function _fjCouleurs(k) {
  return k === 'ges' ? { A: '#A4DBF8', B: '#8CB4D3', C: '#7792B1', D: '#6D7896', E: '#5D6178', F: '#474B5F', G: '#2C2F3F' }
                     : { A: '#009C6D', B: '#52B153', C: '#78BD76', D: '#F4E70F', E: '#F0B50F', F: '#EB8235', G: '#D7221F' };
}
function _fjEchelle(titre, classe, valeur, unite, k) {
  var c = _fjCouleurs(k), cl = String(classe || '').toUpperCase();
  var cases = 'ABCDEFG'.split('').map(function (l) {
    var on = l === cl, fonce = (k === 'ges' && 'DEFG'.indexOf(l) !== -1) || (k !== 'ges' && l === 'G');
    return '<span class="fj-dpe-l' + (on ? ' on' : '') + '" style="background:' + c[l] + ';color:' + (fonce ? '#fff' : '#021430') + '">' + l +
      (on && valeur ? '<small>' + valeur + '<br>' + unite + '</small>' : '') + '</span>';
  }).join('');
  return '<div class="fj-dpe-bloc"><p class="fj-dpe-t">' + titre + '</p><div class="fj-dpe-cases">' + cases + '</div></div>';
}
function _ficheCabaneMaj(b) {
  _ficheCabaneInit();
  var p = document.getElementById('page-fiche'); if (!p || !b) return;
  var c = conseillerDe(b);
  var k = document.getElementById('fjKicker'); if (k) k.textContent = (typeof _estLocation === 'function' && _estLocation(b)) ? 'Louer' : 'Acheter';
  var ref = document.getElementById('fjRef'); if (ref) ref.innerHTML = 'Référence du bien : <strong>' + _esc(b.ref || b.id) + '</strong>';
  var loc = document.getElementById('ficheLoc'); if (loc) loc.textContent = (b.ville || '') + (b.cp ? ' (' + b.cp + ')' : '');
  var pr = document.getElementById('fjContactPrenom'); if (pr) pr.textContent = c.prenom;
  // Prix : au m² et honoraires
  var det = document.getElementById('fjPrixDet');
  if (det) {
    var fai = parseInt(b.prixFAI || b.prix) || 0, hh = parseInt(b.prixHH) || 0, s = parseFloat(b.surface) || 0, lignes = [];
    var masque = (typeof isPrixMasque === 'function') && isPrixMasque(b);
    if (!masque && fai && s && !_estLocation(b)) lignes.push('<span class="fj-m2">' + Math.round(fai / s).toLocaleString('fr-FR') + ' € / m²</span>');
    if (!masque && fai && hh && fai > hh && b.honoraires !== 'vendeur') lignes.push('dont ' + (Math.round((fai - hh) / hh * 1000) / 10).toLocaleString('fr-FR') + ' % d’honoraires à la charge de l’acquéreur');
    if (!masque && !_estLocation(b)) lignes.push('<em>* FAI : frais d’agence inclus.</em>');
    det.innerHTML = lignes.map(function (l) { return '<p>' + l + '</p>'; }).join('');
  }
  // Sous-titre des caractéristiques
  var specs = document.getElementById('ficheSpecs'), st = specs && specs.querySelector('.caracs-titre');
  if (st) st.innerHTML = 'Caractéristiques<span class="fj-sous">' + [b.pieces ? b.pieces + ' pièces' : '', b.surface ? 'Surface : ' + b.surface + ' m²' : ''].filter(Boolean).join(' – ') + '</span>';
  // Bilan énergétique en cases (si le DPE est connu)
  var dpe = document.getElementById('ficheDPE'), dt = document.getElementById('fjDpeTitre');
  if (dpe && b.dpeClasse) {
    dpe.innerHTML = '<div class="fj-dpe">' + _fjEchelle('Consommation énergétique', b.dpeClasse, b.dpeConso, 'kWh/m².an', 'dpe') +
      (b.gesClasse ? _fjEchelle('Émissions de gaz à effet de serre', b.gesClasse, b.gesConso, 'kg CO₂/m².an', 'ges') : '<div class="fj-dpe-bloc"><p class="fj-dpe-t">Émissions de gaz à effet de serre</p><p class="fj-dpe-nr">Non renseignées</p></div>') + '</div>' +
      ((b.partenaire && b.partenaire.energie) ? '<p class="fj-dpe-n">Dépenses annuelles d’énergie pour un usage standard : ' + _esc(b.partenaire.energie) + '.</p>' : '');
    if (dt) dt.hidden = false;
  } else if (dt) dt.hidden = !(dpe && dpe.textContent.trim());
  // Localisation avant les mensualités (comme La Cabane)
  var ex = document.getElementById('ficheExtras');
  if (ex) {
    var blocs = [].slice.call(ex.querySelectorAll(':scope > .fiche-bloc')), calc = ex.querySelector('.fiche-calc');
    var locb = blocs.find(function (x) { var h = x.querySelector('h3'); return h && /Localisation/.test(h.textContent); });
    if (calc && locb && calc.compareDocumentPosition(locb) & Node.DOCUMENT_POSITION_FOLLOWING) ex.insertBefore(locb, calc);
  }
  // Galerie : une grande photo, flèches, vignettes
  _fjIdx = 0; _fjGalerie(b);
}
function _fjGalerie(b) {
  var gal = document.getElementById('ficheGallery'); if (!gal) return;
  var photos = (b.photos && b.photos.length ? b.photos : (b.img ? [b.img] : []));
  var mainImg = gal.querySelector('.fiche-gallery-main img');
  var sub = gal.querySelector('.fiche-gallery-sub'); if (sub) sub.remove();
  gal.className = 'fiche-gallery fj-galerie';
  if (!gal.querySelector('.fj-fleche')) {
    gal.insertAdjacentHTML('beforeend', '<button type="button" class="fj-fleche prec" aria-label="Photo précédente">‹</button><button type="button" class="fj-fleche suiv" aria-label="Photo suivante">›</button>');
    gal.querySelector('.fj-fleche.prec').addEventListener('click', function (e) { e.stopPropagation(); _fjAller(-1); });
    gal.querySelector('.fj-fleche.suiv').addEventListener('click', function (e) { e.stopPropagation(); _fjAller(1); });
  }
  gal.querySelectorAll('.fj-fleche').forEach(function (f) { f.hidden = photos.length < 2; });
  gal._photos = photos;
  if (mainImg) mainImg.onclick = function () { if (typeof openLightbox === 'function') openLightbox(_fjIdx); };
  var th = document.getElementById('fjVignettes');
  if (th) {
    var n = Math.min(photos.length, 6);
    th.innerHTML = photos.slice(0, n).map(function (u, i) {
      return '<button type="button" class="fj-vig' + (i === 0 ? ' on' : '') + '" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + _esc(imgOpt(u, 300)) + '" alt="" loading="lazy" decoding="async"></button>';
    }).join('') + '<button type="button" class="fj-cpt" aria-label="Voir les ' + photos.length + ' photos"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.2"/></svg><strong>' + photos.length + '</strong> Photos</button>';
    th.querySelectorAll('.fj-vig').forEach(function (v) { v.addEventListener('click', function () { _fjMontrer(+v.getAttribute('data-i')); }); });
    th.querySelector('.fj-cpt').addEventListener('click', function () { if (typeof openLightbox === 'function') openLightbox(_fjIdx); });
  }
}
function _fjMontrer(i) {
  var gal = document.getElementById('ficheGallery'); if (!gal || !gal._photos) return;
  var ph = gal._photos; _fjIdx = (i + ph.length) % ph.length;
  var img = gal.querySelector('.fiche-gallery-main img');
  if (img) { img.removeAttribute('srcset'); img.src = imgOpt(ph[_fjIdx], 1600); img.setAttribute('data-orig', ph[_fjIdx]); }
  document.querySelectorAll('#fjVignettes .fj-vig').forEach(function (v) { v.classList.toggle('on', +v.getAttribute('data-i') === _fjIdx); });
}
function _fjAller(d) { _fjMontrer(_fjIdx + d); }

// Ligne d'icônes des cartes de biens (surface, terrain, pièces, chambres, salles d'eau / de bain)
function _specsCarte(b) {
  var ico = function (p) { return '<svg class="bien-card-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
  var I = {
    surface: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h3M3 15h3M9 3v3M15 3v3M21 9h-3M21 15h-3M9 21v-3M15 21v-3"/>',
    terrain: '<path d="M12 21v-7"/><path d="M12 3 7 12h10L12 3z"/><path d="M9 21h6"/>',
    pieces: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M12 3v18M3 12h9"/>',
    chambres: '<path d="M3 18V8"/><path d="M3 14h18v4"/><path d="M21 14a3 3 0 0 0-3-3h-7v3"/><path d="M3 21v-3M21 21v-3"/>',
    eau: '<path d="M7 4h10"/><path d="M12 4v4"/><path d="M8 11a4 4 0 0 1 8 0"/><path d="M9 15v1M12 15v1M15 15v1M9 19v1M12 19v1M15 19v1"/>'
  };
  var pl = function (n, s, p) { return n + ' ' + (n > 1 ? p : s); };
  var sdb = (parseInt(b.sdb) || 0), sdbain = (parseInt(b.salleBain) || 0), out = [];
  if (b.surface) out.push([I.surface, b.surface + ' m²']);
  if (parseInt(b.terrain) > 0) out.push([I.terrain, parseInt(b.terrain).toLocaleString('fr-FR') + ' m²']);
  if (parseInt(b.pieces) > 0) out.push([I.pieces, pl(parseInt(b.pieces), 'pièce', 'pièces')]);
  if (parseInt(b.chambres) > 0) out.push([I.chambres, pl(parseInt(b.chambres), 'chambre', 'chambres')]);
  if (sdb > 0) out.push([I.eau, pl(sdb, 'salle d’eau', 'salles d’eau')]);
  if (sdbain > 0) out.push([I.eau, pl(sdbain, 'salle de bain', 'salles de bain')]);
  return out.map(function (x) { return '<span class="bien-card-spec">' + ico(x[0]) + ' ' + x[1] + '</span>'; }).join('');
}

// ===== Fiche : « Services / Se déplacer » façon La Cabane (carte + liste des lieux les plus proches) =====
// Données : data/poi.json (_parts/poi.py, © contributeurs OpenStreetMap) ; distances à vol d'oiseau depuis le centre du secteur.
var _FJA_ICO = {
  ecole: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  commerce: '<path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
  sante: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
  loisir: '<path d="M12 22v-5"/><path d="M12 3 6 11h3l-4 6h14l-4-6h3z"/>',
  bus: '<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M8 18v2M16 18v2"/><circle cx="8.5" cy="14.5" r=".6"/><circle cx="15.5" cy="14.5" r=".6"/>',
  tram: '<rect x="6" y="5" width="12" height="13" rx="3"/><path d="M9 2h6M12 2v3M6 12h12M8 21l2-3M16 21l-2-3"/>',
  train: '<rect x="5" y="3" width="14" height="14" rx="4"/><path d="M5 10h14M8 21l2-4M16 21l-2-4"/><circle cx="9" cy="13.5" r=".6"/><circle cx="15" cy="13.5" r=".6"/>'
};
var _FJA_TYPES = {
  ecoles: { ico: 'ecole', l: { creche: 'Crèche', maternelle: 'École maternelle', primaire: 'École', college: 'Collège', lycee: 'Lycée', sup: 'Enseignement supérieur' } },
  commerces: { ico: 'commerce', l: { supermarket: 'Supermarché', bakery: 'Boulangerie', convenience: 'Épicerie', butcher: 'Boucherie', greengrocer: 'Primeur', marche: 'Marché' } },
  sante: { ico: 'sante', l: { pharmacy: 'Pharmacie', doctors: 'Médecin', hospital: 'Hôpital', clinic: 'Centre de santé', dentist: 'Dentiste' } },
  loisirs: { ico: 'loisir', l: { park: 'Parc', sports_centre: 'Équipement sportif', swimming_pool: 'Piscine', playground: 'Aire de jeux' } },
  transports: { ico: 'bus', l: { bus: 'Arrêt de bus', tram: 'Arrêt de tram', train: 'Gare' } }
};
var _FJA_GROUPES = {
  services: { tous: 'Tous les services', f: [['ecoles', 'Écoles'], ['commerces', 'Commerces'], ['sante', 'Santé'], ['loisirs', 'Parcs et sports']] },
  deplacer: { tous: 'Tous les transports', f: [['bus', 'Bus'], ['tram', 'Tram'], ['train', 'Train et gares']] }
};
var _fja = { c: null, map: null, pts: [], g: 'services', f: 'tous', couche: null, ville: '' };
function _fjaSvg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (_FJA_ICO[k] || _FJA_ICO.bus) + '</svg>'; }
function _fjaDist(a, b) {
  var x = (b[1] - a[1]) * Math.PI / 180 * Math.cos((a[0] + b[0]) / 2 * Math.PI / 180), y = (b[0] - a[0]) * Math.PI / 180;
  return 6371000 * Math.sqrt(x * x + y * y);
}
function _fjaDistTxt(m) { return m < 1000 ? (Math.max(10, Math.round(m / 10) * 10)) + ' m' : (Math.round(m / 100) / 10).toLocaleString('fr-FR') + ' km'; }
function _ficheAutour(c, map, b) {
  _fja.c = c; _fja.map = map; _fja.pts = []; _fja.ville = b.ville; _fja.couche = null;
  var box = document.getElementById('fjAutour'); if (!box) return;
  var go = function () {
    if (map !== _ficheMap) return;
    var d = (_poiData && _poiData[b.ville]) || {};
    Object.keys(_FJA_TYPES).forEach(function (cat) {
      (d[cat] || []).forEach(function (p) {
        var st = p[3] || (cat === 'transports' ? (/gare/i.test(p[2]) ? 'train' : 'bus') : '');
        _fja.pts.push({ lat: p[0], lng: p[1], nom: p[2], cat: cat, st: st, adr: p[4] || '', d: _fjaDist(c, [p[0], p[1]]),
          ico: cat === 'transports' ? (st || 'bus') : _FJA_TYPES[cat].ico,
          type: (_FJA_TYPES[cat].l[st]) || { ecoles: 'Établissement scolaire', commerces: 'Commerce', sante: 'Santé', loisirs: 'Loisirs', transports: 'Transport' }[cat] });
      });
    });
    _fja.pts.sort(function (x, y) { return x.d - y.d; });
    box.hidden = !_fja.pts.length;
    var gr = document.getElementById('fjaGrille'); if (gr) gr.classList.toggle('sans-liste', !_fja.pts.length);
    if (_ficheMap) _ficheMap.invalidateSize();
    if (!_fja.pts.length) return;
    var aS = _fja.pts.some(function (p) { return p.cat !== 'transports'; }), aD = _fja.pts.some(function (p) { return p.cat === 'transports'; });
    box.querySelectorAll('.fja-onglets button').forEach(function (bt) { bt.hidden = bt.getAttribute('data-g') === 'services' ? !aS : !aD; });
    _fjaGroupe(aS ? 'services' : 'deplacer');
  };
  if (_poiData) { go(); return; }
  fetch('data/poi.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('poi'); return r.json(); })
    .then(function (j) { _poiData = j; go(); })
    .catch(function () { _poiData = {}; box.hidden = true; });
}
function _fjaCle(p, g) { return g === 'deplacer' ? p.st : p.cat; }
function _fjaGroupe(g) {
  _fja.g = g; _fja.f = 'tous';
  document.querySelectorAll('#fjAutour .fja-onglets button').forEach(function (bt) { bt.setAttribute('aria-pressed', bt.getAttribute('data-g') === g ? 'true' : 'false'); });
  var dispo = _fja.pts.filter(function (p) { return (g === 'deplacer') === (p.cat === 'transports'); });
  var f = _FJA_GROUPES[g].f.filter(function (x) { return dispo.some(function (p) { return _fjaCle(p, g) === x[0]; }); });
  var el = document.getElementById('fjaFiltres');
  if (el) el.innerHTML = [['tous', _FJA_GROUPES[g].tous]].concat(f).map(function (x) {
    return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (x[0] === 'tous') + '" onclick="_fjaFiltre(\'' + x[0] + '\')">' + x[1] + '</button>';
  }).join('');
  _fjaFiltre('tous');
}
function _fjaFiltre(f) {
  _fja.f = f; var g = _fja.g;
  document.querySelectorAll('#fjaFiltres button').forEach(function (bt) { bt.setAttribute('aria-pressed', bt.getAttribute('data-f') === f ? 'true' : 'false'); });
  var dispo = _fja.pts.filter(function (p) { return (g === 'deplacer') === (p.cat === 'transports'); }), liste;
  if (f === 'tous') {   // les plus proches de chaque catégorie, mélangés par distance
    var n = {}; liste = dispo.filter(function (p) { var k = _fjaCle(p, g); n[k] = (n[k] || 0) + 1; return n[k] <= 3; }).slice(0, 12);
  } else liste = dispo.filter(function (p) { return _fjaCle(p, g) === f; }).slice(0, 10);
  var ul = document.getElementById('fjaListe');
  if (ul) ul.innerHTML = liste.length ? liste.map(function (p, i) {
    return '<li><button type="button" onclick="_fjaVoir(' + i + ')"><span class="fja-ico">' + _fjaSvg(p.ico) + '</span>' +
      '<span class="fja-txt"><strong>' + _esc(p.nom) + '</strong><span>' + _esc(p.type) + '</span>' + (p.adr ? '<span>' + _esc(p.adr) + '</span>' : '') + '</span>' +
      '<span class="fja-d">' + _fjaDistTxt(p.d) + '</span></button></li>';
  }).join('') : '<li class="fja-vide">Aucun lieu trouvé à proximité.</li>';
  var map = _fja.map; if (!map || !window.L) return;
  if (_fja.couche) map.removeLayer(_fja.couche);
  _fja.couche = L.featureGroup(); _fja.liste = liste; _fja.marq = [];
  liste.forEach(function (p) {
    var m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'fja-pin', html: '<span>' + _fjaSvg(p.ico) + '</span>', iconSize: [38, 38], iconAnchor: [19, 19] }), title: p.nom, keyboard: false })
      .bindTooltip(_esc(p.nom) + ' · ' + _fjaDistTxt(p.d), { direction: 'top', offset: [0, -18] });
    m.addTo(_fja.couche); _fja.marq.push(m);
  });
  _fja.couche.addTo(map);
  var bornes = L.latLng(_fja.c).toBounds(1900);
  if (liste.length) bornes.extend(_fja.couche.getBounds());
  map.fitBounds(bornes, { padding: [24, 24], maxZoom: 15 });
}
function _fjaVoir(i) {
  var m = _fja.marq && _fja.marq[i]; if (!m || !_fja.map) return;
  _fja.map.setView(m.getLatLng(), Math.max(_fja.map.getZoom(), 15), { animate: true });
  m.openTooltip();
  document.querySelectorAll('#fjaListe li').forEach(function (li, j) { li.classList.toggle('on', j === i); });
}

// ===== Fiche : description affichée fidèlement (texte 3G intact : paragraphes, listes, liens) =====
function _descLiens(h) {
  return h.replace(/\[([^\]]+)\]\(((?:https?:|mailto:|tel:)[^)\s]+)\)/g, function (m, t, u) {
    return '<a href="' + u + '"' + (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
  });
}
function _descFidele(texte) {
  var brut = String(texte || '').replace(/\r/g, '').trim(); if (!brut) return '';
  var principal = (typeof _descSplitLegal === 'function') ? _descSplitLegal(brut).main : brut;   // mentions légales : déjà affichées plus bas
  var html = '', apresTitre = false;
  principal.split(/\n\s*\n+/).forEach(function (bloc) {
    var lignes = bloc.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lignes.length) return;
    var esc = function (s) { return _descLiens(_esc(s)); };
    if (lignes.length === 1 && lignes[0].length <= 45 && /:\s*$/.test(lignes[0])) {
      html += '<p class="desc-st">' + esc(lignes[0].replace(/\s*:\s*$/, '')) + '</p>'; apresTitre = true; return;
    }
    if (lignes.length >= 2 && apresTitre && lignes.every(function (l) { return l.length <= 160; })) {
      html += '<ul class="desc-liste">' + lignes.map(function (l) { l = l.replace(/^[-•·]\s*/, ''); return '<li' + (/^[A-Za-z0-9À-ÿ«"(]/.test(l) ? '' : ' class="sans-puce"') + '>' + esc(l) + '</li>'; }).join('') + '</ul>';
    } else {
      html += '<p>' + lignes.map(esc).join('<br>') + '</p>';
    }
    apresTitre = false;
  });
  return '<div class="desc-fidele">' + html + '</div>';
}

// La réorganisation de la fiche (une seule fois) se fait dès le chargement, avant tout affichage d'annonce :
// sur réseau lent, elle arrivait après le premier affichage et poussait le contenu de 230 px (CLS 0,14 sur mobile).
document.addEventListener('DOMContentLoaded', function () { try { _ficheCabaneInit(); } catch (e) {} });

// Ventes reprises de la page conseiller 3G de Charles (data/vendus-3g.json, mis à jour par _communes/vendus_3g.py)
var _vendus3G = [];
fetch('data/vendus-3g.json', { cache: 'no-cache' })
  .then(function (r) { return r.ok ? r.json() : { vendus: [] }; })
  .then(function (d) {
    _vendus3G = (d && d.vendus) || [];
    try { if (typeof biens !== 'undefined' && biens && biens.length) renderVendusCarousel(); } catch (e) {}
  })
  .catch(function () {});

// ===== Suivi des estimations : demande de visite (résultat et lien des e-mails), espace pro =====
var _estJeton = '';
var EST_JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
var EST_MOMENTS = ['Matin', 'Midi', 'Après-midi', 'Fin de journée', 'Dès que possible'];
function _estVisiteHTML(intro) {
  if (!_estJeton) return '';
  var puce = function (c) { return '<button type="button" class="est-cren" aria-pressed="false" onclick="this.setAttribute(\'aria-pressed\', this.getAttribute(\'aria-pressed\') === \'true\' ? \'false\' : \'true\')">' + c + '</button>'; };
  return '<div class="est-visite" id="estVisite">' +
    '<h3 class="est-visite-t">' + (intro || 'Affinez ce prix : visite d’estimation gratuite') + '</h3>' +
    '<p class="est-visite-p">30 minutes chez vous pour un prix argumenté, sans engagement. Indiquez vos disponibilités, nous vous rappelons pour fixer le rendez-vous.</p>' +
    '<p class="est-visite-l">Jours</p><div class="est-crens">' + EST_JOURS.map(puce).join('') + '</div>' +
    '<p class="est-visite-l">Moments</p><div class="est-crens">' + EST_MOMENTS.map(puce).join('') + '</div>' +
    '<label class="est-visite-l" for="estVisiteMsg">Précision (facultatif)</label>' +
    '<textarea id="estVisiteMsg" class="form-input" rows="2" maxlength="600" placeholder="Ex. : plutôt après 17 h"></textarea>' +
    '<button type="button" class="cb-btn accent est-visite-go" onclick="estDemanderVisite()">Demander ma visite</button>' +
    '<p class="est-visite-ok" id="estVisiteOk" role="status" hidden></p></div>';
}
async function estDemanderVisite() {
  var box = document.getElementById('estVisite'); if (!box || !_estJeton) return;
  var creneaux = [].slice.call(box.querySelectorAll('.est-cren[aria-pressed="true"]')).map(function (b) { return b.textContent; });
  if (!creneaux.length) { showToast('Choisissez au moins un jour ou un moment.', 'error'); return; }
  var btn = box.querySelector('.est-visite-go'); btn.disabled = true; btn.textContent = 'Envoi…';
  var ok = false, prenom = '';
  try {
    var r = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'visite', jeton: _estJeton, creneaux: creneaux, message: (document.getElementById('estVisiteMsg') || {}).value || '' }) });
    ok = r.ok; if (ok) prenom = ((await r.json()) || {}).prenom || '';
  } catch (e) {}
  var m = document.getElementById('estVisiteOk');
  if (ok) {
    [].forEach.call(box.querySelectorAll('.est-crens, .est-visite-l, textarea, .est-visite-go, .est-visite-p'), function (e) { e.hidden = true; e.style.display = 'none'; });
    m.hidden = false; m.innerHTML = '<b>Merci' + (prenom ? ' ' + _esc(prenom) : '') + ' !</b> Votre demande de visite est bien reçue : nous vous rappelons très vite pour fixer le rendez-vous (' + _esc(creneaux.join(', ')) + ').';
  } else {
    btn.disabled = false; btn.textContent = 'Demander ma visite';
    showToast('Envoi impossible pour le moment : appelez-nous au ' + (AGENCE.telephone || '06 38 55 53 55') + '.', 'error', 7000);
  }
}
// Lien « Choisir un créneau » des e-mails de suivi : ?rdv=<jeton>#estimation
// lu tout de suite : le routeur du site réécrit ensuite l'adresse (le paramètre disparaîtrait)

// ===== Secteurs d'Angers et de Sablé : cartes de l'accueil + filtre de la page Acheter =====
var _SECTEUR_VILLES = {"angers": ["Angers", "Avrillé", "Beaucouzé", "Bouchemaine", "Briollay", "Béhuard", "Cantenay-Épinard", "Feneu", "Le Plessis-Grammoire", "Les Ponts-de-Cé", "Loire-Authion", "Longuenée-en-Anjou", "Montreuil-Juigné", "Mûrs-Érigné", "Rives-du-Loir-en-Anjou", "Saint-Barthélemy-d'Anjou", "Saint-Clément-de-la-Place", "Saint-Lambert-la-Potherie", "Saint-Léger-de-Linières", "Saint-Martin-du-Fouilloux", "Sainte-Gemmes-sur-Loire", "Sarrigné", "Savennières", "Soulaines-sur-Aubance", "Soulaire-et-Bourg", "Trélazé", "Verrières-en-Anjou", "Écouflant", "Écuillé", "Saint-Sylvain-d'Anjou", "Pellouailles-les-Vignes", "Andard", "Bauné", "Brain-sur-l'Authion", "Corné", "La Bohalle", "La Daguenière", "Saint-Mathurin-sur-Loire", "Villevêque", "Soucelles", "La Meignanne", "La Membrolle-sur-Longuenée", "Le Plessis-Macé", "Pruillé", "Saint-Jean-de-Linières"], "sable": ["Sablé-sur-Sarthe", "Solesmes", "Juigné-sur-Sarthe", "Précigné", "Parcé-sur-Sarthe", "Noyen-sur-Sarthe", "Louailles", "Vion", "Morannes-sur-Sarthe", "Bouère", "Ballée", "Saint-Denis-d'Anjou", "Saint-Loup-du-Dorat", "Avoise", "Asnières-sur-Vègre", "Auvers-le-Hamon", "Courtillers", "Notre-Dame-du-Pé", "Pincé", "Le Bailleul", "Malicorne-sur-Sarthe"]};
var _SECTEUR_NOMS = { angers: "Secteur d'Angers", sable: 'Secteur de Sablé' };
// _cleVille(…) existe déjà plus haut (filtre du flux 3G) : on le réutilise.
// Communes déléguées → commune nouvelle dessinée sur la carte
var _VILLE_ALIAS = { 'ballee': 'val du maine', 'saint sylvain d anjou': 'verrieres en anjou', 'pellouailles les vignes': 'verrieres en anjou',
  'andard': 'loire authion', 'baune': 'loire authion', 'brain sur l authion': 'loire authion', 'corne': 'loire authion', 'la bohalle': 'loire authion',
  'la dagueniere': 'loire authion', 'saint mathurin sur loire': 'loire authion', 'villeveque': 'rives du loir en anjou', 'soucelles': 'rives du loir en anjou',
  'la meignanne': 'longuenee en anjou', 'la membrolle sur longuenee': 'longuenee en anjou', 'le plessis mace': 'longuenee en anjou', 'pruille': 'longuenee en anjou',
  'saint jean de linieres': 'saint leger de linieres', 'daumeray': 'morannes sur sarthe daumeray' };
function _cleCarte(v) { var k = _cleVille(v); return _VILLE_ALIAS[k] || k; }
var _secteurCles = {};
function _secteurDe(v) {
  var k = _cleVille(v); if (!k) return '';
  if (!_secteurCles.angers) {
    Object.keys(_SECTEUR_VILLES).forEach(function (s) {
      _secteurCles[s] = _SECTEUR_VILLES[s].map(_cleVille);
      [].forEach.call(document.querySelectorAll('.sect-carte[data-secteur="' + s + '"] .cm'), function (g) { _secteurCles[s].push(_cleVille(g.getAttribute('data-ville'))); });
    });
  }
  for (var s in _secteurCles) {
    if (_secteurCles[s].some(function (c) { return k === c || k.indexOf(c + ' ') === 0 || c.indexOf(k + ' ') === 0; })) return s;
  }
  return '';
}
function _villeDansSecteur(v, s) { return _secteurDe(v) === s; }
function _biensEnVente() { return (typeof biens !== 'undefined' ? biens : []).filter(function (b) { return b.statut !== 'vendu' && (b.transaction || 'vente') === 'vente'; }); }
function _allerAcheter() {
  if (typeof syncVilleMultiselect === 'function') syncVilleMultiselect();
  if (typeof showPage === 'function') showPage('acheter');
  if (typeof renderBiensGrid === 'function') renderBiensGrid();
  window.scrollTo(0, 0);
}
function voirSecteur(s) { filterVilles = []; filterSecteur = s; _allerAcheter(); }
function voirVille(v) { filterSecteur = ''; filterVilles = [v]; _allerAcheter(); }
// Nombre de biens par commune et par secteur, sur les cartes
function _secteursMaj() {
  var liste = _biensEnVente(), parVille = {}, parSecteur = { angers: 0, sable: 0 };
  liste.forEach(function (b) {
    var k = _cleCarte(b.ville); parVille[k] = parVille[k] || { n: 0, nom: b.ville }; parVille[k].n++;
    var s = _secteurDe(b.ville); if (s) parSecteur[s]++;
  });
  [].forEach.call(document.querySelectorAll('.sect-carte .cm'), function (g) {
    var k = _cleVille(g.getAttribute('data-ville')), n = 0, nom = g.getAttribute('data-ville');
    Object.keys(parVille).forEach(function (x) { if (x === k || x.indexOf(k + ' ') === 0 || k.indexOf(x + ' ') === 0) { n += parVille[x].n; nom = parVille[x].nom; } });
    g.setAttribute('data-n', n); g.setAttribute('data-nom-flux', nom);
    g.classList.toggle('has', n > 0);
    var t = n ? n + ' bien' + (n > 1 ? 's' : '') + ' en vente' : 'Voir le secteur';
    g.setAttribute('aria-label', g.getAttribute('data-ville') + ' : ' + t);
    var ti = g.querySelector('title'); if (ti) ti.textContent = g.getAttribute('data-ville') + ' · ' + t;
  });
  [].forEach.call(document.querySelectorAll('[data-sect-n]'), function (p) {
    var n = parSecteur[p.getAttribute('data-sect-n')] || 0;
    p.textContent = n ? n + ' bien' + (n > 1 ? 's' : '') + ' en vente' : 'Biens à venir';
  });
}
function _secteursInit() {
  [].forEach.call(document.querySelectorAll('.sect-carte'), function (carte) {
    var s = carte.getAttribute('data-secteur'), zone = carte.querySelector('.sect-map'), bulle = carte.querySelector('.sect-bulle');
    var lien = carte.querySelector('.sect-lien');
    lien.addEventListener('click', function (e) { e.preventDefault(); voirSecteur(s); });
    function montrer(g, x, y) {
      var n = +g.getAttribute('data-n') || 0;
      bulle.textContent = g.getAttribute('data-ville') + ' · ' + (n ? n + ' bien' + (n > 1 ? 's' : '') + ' en vente' : 'voir le secteur');
      var r = zone.getBoundingClientRect();
      bulle.style.left = Math.max(8, Math.min(r.width - 8, x - r.left)) + 'px';
      bulle.style.top = (y - r.top) + 'px';
      bulle.classList.add('on');
    }
    [].forEach.call(carte.querySelectorAll('.cm'), function (g) {
      function ouvrir() { var n = +g.getAttribute('data-n') || 0; if (n) voirVille(g.getAttribute('data-nom-flux') || g.getAttribute('data-ville')); else voirSecteur(s); }
      g.addEventListener('click', ouvrir);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(); } });
      g.addEventListener('mousemove', function (e) { montrer(g, e.clientX, e.clientY - 14); });
      g.addEventListener('focus', function () { var b = g.getBoundingClientRect(); montrer(g, b.left + b.width / 2, b.top + b.height / 2); });
      g.addEventListener('mouseleave', function () { bulle.classList.remove('on'); });
      g.addEventListener('blur', function () { bulle.classList.remove('on'); });
    });
  });
  // Dessin au scroll : chaque carte se dessine quand elle arrive à l'écran
  var cartes = document.querySelectorAll('.sect-carte');
  if (document.documentElement.classList.contains('anim') && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('vue'); io.unobserve(e.target);
        setTimeout(function () { e.target.classList.add('fini'); }, 2200);
      });
    }, { threshold: 0.3 });
    [].forEach.call(cartes, function (c) { io.observe(c); });
  } else {
    [].forEach.call(cartes, function (c) { c.classList.add('vue', 'fini'); });
  }
  _secteursMaj();
  // Lien direct : ./?secteur=angers#acheter
  var q = ''; try { q = (new URLSearchParams(location.search)).get('secteur') || ''; } catch (e) {}
  if (q === 'angers' || q === 'sable') {
    filterSecteur = q; filterVilles = [];
    setTimeout(function () { _allerAcheter(); }, 50);
  }
}
document.addEventListener('DOMContentLoaded', _secteursInit);
// Les biens arrivent après le chargement : on recompte à chaque rendu de la liste
if (typeof renderBiensGrid === 'function') {
  var _renderBiensGridAvantSecteurs = renderBiensGrid;
  renderBiensGrid = function () { var r = _renderBiensGridAvantSecteurs.apply(this, arguments); try { _secteursMaj(); } catch (e) {} return r; };
}

var _rdvLien = (function () { try { return (new URLSearchParams(location.search)).get('rdv') || ''; } catch (e) { return ''; } })();
async function _estVisiteDepuisLien() {
  var j = _rdvLien;
  if (!j || !/^[0-9a-f]{48}$/.test(j) || !AGENCE.statutProxyUrl) return;
  if (typeof showPage === 'function') showPage('estimation');
  var info = null;
  try { var r = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'visite-info', jeton: j }) }); if (r.ok) info = await r.json(); } catch (e) {}
  var card = document.getElementById('estCard'); if (!card || !info) return;
  _estJeton = j;
  var el = document.createElement('div'); el.className = 'est-card est-visite-lien';
  el.innerHTML = '<span class="cb-kicker">Votre estimation</span><h2 class="est-q">Bonjour ' + _esc(info.prenom || '') + '</h2>' +
    '<p class="est-help">' + _esc(info.bien || '') + (info.estimation ? ' · estimation en ligne : <b>' + _esc(info.estimation.split(' (')[0]) + '</b>' : '') + '</p>' +
    (info.dejaDemandee ? '<p class="est-help"><b>Votre demande de visite est déjà enregistrée</b> : nous vous rappelons pour fixer le rendez-vous. Vous pouvez préciser d’autres disponibilités ci-dessous.</p>' : '') +
    _estVisiteHTML('Choisissez vos disponibilités pour la visite');
  card.parentNode.insertBefore(el, card);
  setTimeout(function () { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -100); }, 300);
}
document.addEventListener('DOMContentLoaded', function () { setTimeout(_estVisiteDepuisLien, 400); });

// Espace pro : état, date de rappel, note
var SUIVI_ETATS = [['nouveau', 'Nouvelle demande'], ['a_rappeler', 'À rappeler'], ['rappele', 'Rappelé'], ['rdv_demande', 'Visite demandée'],
  ['rdv_pris', 'Visite programmée'], ['mandat', 'Mandat signé'], ['perdu', 'Sans suite']];
function _adminADue(x) {
  var s = x.suivi || { etat: 'nouveau', rappel: x.recu };
  return ['nouveau', 'a_rappeler', 'rdv_demande'].indexOf(s.etat) !== -1 && s.rappel && Date.parse(s.rappel) <= Date.now();
}
function _adminTrierDemandes(d) {
  return d.slice().sort(function (a, b) { return (_adminADue(b) ? 1 : 0) - (_adminADue(a) ? 1 : 0); });
}
function _adminSuiviHTML(x) {
  var s = x.suivi || { etat: 'nouveau', rappel: x.recu, note: '' };
  var k = _esc(x.cle).replace(/[^a-z0-9:]/gi, '');
  var jour = s.rappel ? String(s.rappel).slice(0, 10) : '';
  return '<div class="admin-suivi" data-cle="' + _esc(x.cle) + '">' +
    (x.visite ? '<p class="admin-suivi-visite">Visite demandée · disponibilités : <b>' + _esc((x.visite.creneaux || []).join(', ')) + '</b>' + (x.visite.message ? ' · « ' + _esc(x.visite.message) + ' »' : '') + '</p>' : '') +
    '<div class="admin-suivi-g">' +
      '<label>État<select class="form-select" data-k="etat">' + SUIVI_ETATS.map(function (e) { return '<option value="' + e[0] + '"' + (e[0] === s.etat ? ' selected' : '') + '>' + e[1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Rappeler le<input type="date" class="form-input" data-k="rappel" value="' + _esc(jour) + '"></label>' +
    '</div>' +
    '<label class="admin-suivi-n">Note<textarea class="form-input" rows="2" data-k="note" maxlength="1000">' + _esc(s.note || '') + '</textarea></label>' +
    '<p class="admin-src">' + (x.consentSuivi ? 'E-mails de suivi acceptés' + (s.relances ? ' · ' + s.relances + ' envoyé' + (s.relances > 1 ? 's' : '') : '') : 'Pas d’e-mails de suivi (non acceptés)') + '</p>' +
    '<div class="admin-bien-actions"><button class="btn-statut" onclick="adminMajSuivi(this)">Enregistrer le suivi</button></div></div>';
}
async function adminMajSuivi(btn) {
  var box = btn.closest('.admin-suivi'); if (!box) return;
  var val = function (k) { var e = box.querySelector('[data-k="' + k + '"]'); return e ? e.value : ''; };
  btn.disabled = true;
  try {
    var r = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: _adminPwd, action: 'suivi', cle: box.getAttribute('data-cle'), etat: val('etat'), rappel: val('rappel'), note: val('note') }) });
    if (!r.ok) throw new Error();
    showToast('Suivi enregistré.', 'success', 2500);
    _adminChargerDemandes(true);
  } catch (e) { showToast('Enregistrement impossible pour le moment.', 'error', 5000); btn.disabled = false; }
}

// ===== ANIMATIONS DE L'ACCUEIL (24/11/2026, demande de Charles : « aussi bien que La Cabane ») =====
// Tout est désactivé si le visiteur a demandé moins d'animations (classe html.sans-anim, posée dans <head>).
var _ANIM = document.documentElement.classList.contains('anim');

// 1. Diaporama du haut de page : fondu entre les photos d'Angers + lent zoom (CSS)
function _heroDiaporama() {
  var slides = [].slice.call(document.querySelectorAll('#heroBg .hero-slide'));
  if (!slides.length || !_ANIM) return;
  var mobile = window.matchMedia('(max-width: 900px)').matches;
  function _charger() {
    slides.forEach(function (s) {
      var src = mobile ? s.getAttribute('data-img-mobile') : s.getAttribute('data-img');
      s.style.backgroundImage = 'linear-gradient(to bottom, rgba(2,20,48,.34) 0%, rgba(2,20,48,.22) 42%, rgba(2,20,48,.58) 100%), url("' + src + '")';
    });
  }
  if (document.readyState === 'complete') setTimeout(_charger, 1500);
  else window.addEventListener('load', function () { setTimeout(_charger, 1500); });
  var i = -1;
  setInterval(function () {
    if (document.hidden) return;
    slides.forEach(function (s) { s.classList.remove('on'); });
    i = (i + 1) % (slides.length + 1);           // la photo d'origine (sous les calques) compte comme une étape
    if (i < slides.length) slides[i].classList.add('on');
  }, 6500);
}

// 2. Chiffres clés qui défilent jusqu'à leur valeur
function _compter(el) {
  var cible = parseInt(el.getAttribute('data-cible') || el.textContent, 10) || 0;
  if (!_ANIM || cible <= 0) { el.textContent = cible; return; }
  var t0 = null, d = 1400;
  function pas(t) {
    if (!t0) t0 = t;
    var p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(cible * e);
    if (p < 1) requestAnimationFrame(pas);
  }
  requestAnimationFrame(pas);
}

// 3. Apparition au défilement (titres, cartes, blocs) + carte du secteur + silhouette de maison
function _animerAccueil() {
  if (!_ANIM || !('IntersectionObserver' in window)) return;
  var home = document.getElementById('page-home'); if (!home) return;
  var cibles = home.querySelectorAll('.cb-kicker, .section-tag, .cb-h2, .section-title, .cb-lead, .une-desc, .une-cta, .une-arrows, ' +
    '.cb-card, .equipe-carte, .avis3-tete, .avis3-onglets, .avis3-carrousel, .chiffres-grid, .rs3-item, .seo-title, .cta-title, .cta-sub, .cb-actions, #homeGrid, .cb-map');
  [].forEach.call(cibles, function (el) {
    if (el.closest('#hero')) return;
    el.classList.add('rv');
    var freres = [].filter.call(el.parentElement.children, function (x) { return x.classList.contains('rv'); });
    var rang = freres.indexOf(el);
    if (/cb-card|equipe-carte|avis2-card|rs3-item/.test(el.className)) el.style.transitionDelay = Math.min(rang, 5) * 110 + 'ms';
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  [].forEach.call(home.querySelectorAll('.rv'), function (el) { io.observe(el); });

  // Carte : les communes apparaissent une à une
  var sect = document.getElementById('secteur');
  if (sect) {
    [].forEach.call(sect.querySelectorAll('.city'), function (g, k) { g.style.setProperty('--d', (300 + k * 90) + 'ms'); });
    var ioC = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { sect.classList.add('carte-vue'); ioC.disconnect(); } }, { threshold: 0.25 });
    ioC.observe(sect);
  }
  // Chiffres : défilent quand la bande arrive à l'écran
  var ch = document.getElementById('chiffres');
  if (ch) {
    [].forEach.call(ch.querySelectorAll('.chiffre-n'), function (n) { if (!n.hasAttribute('data-cible')) { n.setAttribute('data-cible', n.textContent); n.textContent = '0'; } });
    var ioN = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      [].forEach.call(ch.querySelectorAll('.chiffre-n'), function (n) { if (n.offsetParent) _compter(n); });
      ch.setAttribute('data-compte', '1'); ioN.disconnect();
    }, { threshold: 0.5 });
    ioN.observe(ch);
  }
  // Silhouette de maison fixe en fond, visible pendant les sections claires du milieu de page
  var fond = home.querySelector('.fond-maison');
  if (fond) {
    var vues = new Set();
    var ioF = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) vues.add(e.target); else vues.delete(e.target); });
      fond.classList.toggle('on', vues.size > 0 && home.classList.contains('active'));
    }, { threshold: 0.15 });
    [].forEach.call(home.querySelectorAll('#chiffres, .equipe, #services'), function (s) { ioF.observe(s); });
  }
}

// Le diaporama attend la fin du chargement (+ 2 s) : ses photos ne ralentissent pas l'affichage de la page
window.addEventListener('load', function () { setTimeout(_heroDiaporama, 2000); });
document.addEventListener('DOMContentLoaded', function () {
  _animerAccueil();
  var intro = document.getElementById('intro-logo');
  if (intro) setTimeout(function () { intro.remove(); }, 1600);
});

// ===== Avis clients : onglets, carrousel, « Lire la suite », défilement automatique =====
function initAvis() {
  var sec = document.getElementById('avis'); if (!sec || !sec.classList.contains('avis3')) return;
  var piste = sec.querySelector('.avis3-piste');
  var cartes = [].slice.call(sec.querySelectorAll('.avis3-carte'));
  var _snap = function () { piste.classList.add('snap'); };
  ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin'].forEach(function (ev) { piste.addEventListener(ev, _snap, { once: true, passive: true }); });
  function majPlus() {
    cartes.forEach(function (c) {
      var t = c.querySelector('.avis3-txt'), b = c.querySelector('.avis3-plus');
      if (c.classList.contains('ouvert')) { b.hidden = false; return; }
      b.hidden = !(t.scrollHeight > t.clientHeight + 2);
    });
  }
  cartes.forEach(function (c) {
    c.querySelector('.avis3-plus').addEventListener('click', function () {
      var o = c.classList.toggle('ouvert'); this.textContent = o ? 'Réduire' : 'Lire la suite';
    });
  });
  [].forEach.call(sec.querySelectorAll('.avis3-onglets button'), function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      [].forEach.call(sec.querySelectorAll('.avis3-onglets button'), function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      cartes.forEach(function (c) { c.hidden = !(f === 'tous' || c.getAttribute('data-c') === f); });
      piste.scrollTo({ left: 0 }); majPlus();
    });
  });
  function pas() { var c = cartes.find(function (x) { return !x.hidden; }); return c ? c.getBoundingClientRect().width + 20 : 320; }
  function aller(dir) {
    var fin = piste.scrollLeft + piste.clientWidth >= piste.scrollWidth - 4;
    if (dir > 0 && fin) piste.scrollTo({ left: 0, behavior: 'smooth' });
    else piste.scrollBy({ left: dir * pas(), behavior: 'smooth' });
  }
  sec.querySelector('.avis3-fleche.prec').addEventListener('click', function () { aller(-1); });
  sec.querySelector('.avis3-fleche.suiv').addEventListener('click', function () { aller(1); });
  // Défilement automatique (pause au survol, au toucher et hors écran)
  if (_ANIM) {
    var pause = false, visible = false;
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { sec.addEventListener(ev, function () { pause = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { sec.addEventListener(ev, function () { pause = false; }); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.3 }).observe(sec);
    setInterval(function () { if (visible && !pause && !document.hidden && document.getElementById('page-home').classList.contains('active')) aller(1); }, 4500);
    // « 100 % » qui défile
    var n = sec.querySelector('.avis3-n');
    if (n && 'IntersectionObserver' in window) {
      n.textContent = '0';
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { _compter(n); io.disconnect(); } }, { threshold: 0.6 });
      io.observe(n);
    }
  }
  majPlus(); window.addEventListener('resize', majPlus);
}
document.addEventListener('DOMContentLoaded', initAvis);

function renderVendusCarousel() {
  var track = document.querySelector('.vendus-track');
  if (!track) return;

  // Biens vendus depuis l'admin (statut = 'vendu')
  var biensVendus = biens
    .filter(function(b){ return b.statut === 'vendu'; })
    .sort(function(a,b){
      return (new Date(b.dateVente||0)) - (new Date(a.dateVente||0));
    });

  // Biens vendus historiques (depuis 3gimmo) — hardcodés
  var _dejaVus = {};
  biensVendus.forEach(function (b) { _dejaVus[String(b.id)] = 1; });
  (vendusAuto || []).forEach(function (v) { _dejaVus[String(v.id)] = 1; });
  var historiques = (typeof _vendus3G !== 'undefined' ? _vendus3G : [])
    .filter(function (v) { return !_dejaVus[String(v.id)]; })
    .map(function (v) { return { id: v.id, type: v.type || 'Bien', ville: v.ville || '', cp: v.cp || '', date: v.date || '', img: v.img || '', visuel3G: true }; });

  // Convertir les biens vendus admin au même format
  var adminVendus = biensVendus.map(function(b){
    return { id: b.id, type: b.type || 'Bien', ville: b.ville || '', cp: b.cp || '', date: b.dateVente || '', img: b.img || '' };
  });

  // Ventes détectées AUTO depuis 3G (bien archivé/vendu → disparu du flux), sans doublonner l'admin.
  var idsAdmin = {};
  adminVendus.forEach(function(v){ idsAdmin[v.id] = true; });
  var autoVendus = (vendusAuto || [])
    .filter(function(v){ return !idsAdmin[Number(v.id)]; })
    .map(function(v){ return { id: v.id, type: v.type || 'Bien', ville: v.ville || '', img: v.img || '' }; });

  // On met d'abord les ventes récentes (admin + auto 3G), puis les historiques
  var tous = adminVendus.concat(autoVendus).concat(historiques);
  majChiffres(VENDUS_DEPART + adminVendus.length);

  // Si aucun bien (cas impossible vu les 4 historiques), masquer la section
  if (tous.length === 0) {
    var section = document.querySelector('.vendus-section');
    if (section) section.style.display = 'none';
    return;
  }
  var section = document.querySelector('.vendus-section');
  if (section) section.style.display = '';

  // Construire les cartes (doubler pour la boucle infinie)
  var _MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function _moisVente(d) {
    var m = /^(\d{4})-(\d{2})/.exec(String(d || ''));
    return m ? 'Vendu en ' + _MOIS[parseInt(m[2], 10) - 1] + ' ' + m[1] : 'Vendu';
  }
  function _esc(t) { return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function buildCard(v, ariaHidden) {
    var ville = _esc(v.ville), cp = v.cp ? ' <span class="vd2-cp">(' + _esc(v.cp) + ')</span>' : '';
    return '<div class="vendus-card vd2"' + (ariaHidden ? ' aria-hidden="true"' : '') + '>' +
      (v.img ? '<img class="vd2-photo" src="' + imgOpt(v.img, 500) + '" data-orig="' + _esc(v.img) + '" alt="' + _esc('Vendu : ' + (v.type || 'bien').toLowerCase() + (v.ville ? ' à ' + v.ville : '')) + '" decoding="async" loading="lazy" fetchpriority="low" onerror="this.remove()">' : '') +
      '<div class="vd2-cadre">' +
        '<span class="vd2-badge">Vendu</span>' +
        '<div class="vd2-type">' + _esc(v.type || 'Bien') + '</div>' +
        '<div class="vd2-ville">' + ville + cp + '</div>' +
        '<div class="vd2-date">' + _moisVente(v.date).replace(/^Vendu en /, '') + '</div>' +
      '</div>' +
    '</div>';
  }

  var html = tous.map(function(v){ return buildCard(v, false); }).join('');
  var _boucle = tous.length >= 4;
  track.classList.toggle('vendus-static', !_boucle);
  // Doubler pour le défilement en boucle
  if (_boucle) html += tous.map(function(v){ return buildCard(v, true); }).join('');

  track.innerHTML = html;
}

function filterBiens(type, btn) {
  filterType = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBiensGrid();
}

function filterByType(t) {
  filterType = t;
  renderBiensGrid();
}
function filterByVille(v) {
  filterVilles = v ? [v] : [];
  renderBiensGrid();
}

// ===== FICHE BIEN =====
function showFiche(id) {
  const b = biens.find(x => x.id == id || parseInt(x.id) === parseInt(id));
  if (!b) return;
  // Mémorise le bien affiché pour le bouton "Partager"
  window._bienAffiche = b;
  majConseillerFiche(b);
  previousPage = document.querySelector('.page.active').id.replace('page-','');
  
  // H1 SEO-friendly : type + ville + caractéristiques clés
  var h1Parts = [b.type || 'Bien', _estLocation(b) ? 'à louer' : 'à vendre', b.ville || 'Angers'];
  if (b.pieces) h1Parts.push('· ' + b.pieces + ' pièces');
  if (b.surface) h1Parts.push('· ' + b.surface + ' m²');
  document.getElementById('ficheTitre').textContent = b.titre ? b.titre : h1Parts.join(' ');
  document.getElementById('ficheTitre').setAttribute('data-seo-h1', h1Parts.join(' '));
  document.getElementById('ficheLoc').textContent = b.ville || '';
  var accEl = document.getElementById('ficheAccroche');
  if (accEl) {
    // 3G renvoie parfois un simple code (« 41 », « 33 ») dans ce champ : on n'affiche qu'une vraie phrase
    if (b.accroche && /[a-zà-ÿ]{3}/i.test(String(b.accroche))) { accEl.textContent = String(b.accroche).trim(); accEl.style.display = ''; }
    else { accEl.style.display = 'none'; }
  }
  document.getElementById('fichePrix').textContent = formatPrixPublic(b);
  
  const refDisplay = b.ref || genRef(b.id).replace('REF. ','');
  document.getElementById('ficheBadge').innerHTML = 
    '<span class="bien-card-badge" style="display:inline-block;margin-bottom:1rem;">' + b.type + '</span>' +
    (b.exclusif ? '<span class="bien-card-exclusive" style="display:inline-block;margin-bottom:1rem;margin-left:.5rem;">Exclusivité</span>' : '');

  // Tableau des infos
  let tableRows = '';
  tableRows += buildRow('Référence agence', refDisplay, 'Pièces', b.pieces ? b.pieces + ' pièces' : '—');
  tableRows += buildRow('Secteur / Ville', b.ville, 'Chambres', b.chambres ? b.chambres + ' chambres' : '—');
  tableRows += buildRow('Type de bien', b.type, 'Salle de bain', b.salleBain ? b.salleBain + ' salle(s)' : '—');
  tableRows += buildRow('Salle d\'eau', b.sdb ? b.sdb + ' salle(s)' : '—', 'Niveaux', b.niveaux ? b.niveaux + ' niveaux' : '—');
  tableRows += buildRow('Surface', b.surface ? b.surface + ' m²' : '—', '', '');
  if (b.terrain) tableRows += buildRow('Terrain', b.terrain + ' m²', '', '');
  if (b.annee) tableRows += buildRow('Année de construction', b.annee, '', '');
  if (b.taxeFonciere || b.chauffage) tableRows += buildRow('Taxe foncière', b.taxeFonciere ? _eur(b.taxeFonciere) + ' / an' : '—', 'Chauffage', b.chauffage || '—');
  if (b.garages || b.parkings || b.exposition) tableRows += buildRow('Garage / parking', [b.garages ? b.garages + ' garage' + (b.garages > 1 ? 's' : '') : '', b.parkings ? b.parkings + ' place' + (b.parkings > 1 ? 's' : '') : ''].filter(Boolean).join(' · ') || '—', 'Exposition', b.exposition || '—');
  if (b.surfaceUtile && b.surfaceUtile != b.surface) tableRows += buildRow('Surface utile', b.surfaceUtile + ' m²', 'État', b.etat || '—');
  // Prix masqué si bien sous compromis / offre / vendu
  if (_estLocation(b)) {
    tableRows += buildRow('Loyer charges comprises', b.prix ? _eur(b.prix) + ' / mois' : '—', 'Dont charges', b.charges ? _eur(b.charges) + ' / mois' : '—');
    tableRows += buildRow('Loyer hors charges', b.loyerHC ? _eur(b.loyerHC) + ' / mois' : '—', 'Dépôt de garantie', b.depotGarantie ? _eur(b.depotGarantie) : '—');
    tableRows += buildRow('Location', b.meuble ? 'Meublée' : 'Non meublée', 'Disponible', b.disponibleLe ? 'le ' + _dateFr(b.disponibleLe) : 'Immédiatement');
  } else if (!isPrixMasque(b)) {
    tableRows += buildRow('Prix', formatPrix(b.prix), '', '');
    // On affiche toujours « Honoraires acquéreur » avec le montant si renseigné
    if (b.montantHonoraires) tableRows += buildRow('Honoraires acquéreur', b.montantHonoraires.toLocaleString('fr-FR') + ' €', '', '');
  }

  document.getElementById('ficheSpecs').innerHTML = '<h2 class="caracs-titre">Caractéristiques</h2><div class="caracs">' + tableRows + '</div>';

  document.getElementById('ficheDesc').innerHTML = _descFidele(b.description || b.desc || '');

  // Section prix détaillée — masquée si bien sous compromis / offre / vendu
  const prixSection = document.getElementById('fichePrixSection');
  let prixHtml = '';
  if (prixSection && _estLocation(b)) {
    prixHtml = '<div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--beige);">' +
      '<h3 style="font-family:var(--sans);font-size:1rem;font-weight:600;margin-bottom:.4rem;color:var(--noir);">À propos du loyer</h3>' +
      '<table class="fiche-loc-table"><tbody>' +
        '<tr><td>Loyer mensuel charges comprises</td><td>' + _eur(b.prix) + '</td></tr>' +
        (b.loyerHC ? '<tr><td>dont loyer hors charges</td><td>' + _eur(b.loyerHC) + '</td></tr>' : '') +
        (b.charges ? '<tr><td>dont provision sur charges (régularisation annuelle)</td><td>' + _eur(b.charges) + '</td></tr>' : '') +
        (b.depotGarantie ? '<tr><td>Dépôt de garantie</td><td>' + _eur(b.depotGarantie) + '</td></tr>' : '') +
        (b.honorairesLocataire ? '<tr><td>Honoraires TTC à la charge du locataire</td><td>' + _eur(b.honorairesLocataire) + '</td></tr>' : '') +
        (b.honorairesEdl ? '<tr><td>dont état des lieux</td><td>' + _eur(b.honorairesEdl) + '</td></tr>' : '') +
      '</tbody></table></div>';
  } else if (prixSection && !isPrixMasque(b) && (b.prixFAI || b.prixHH || b.pctHonoraires)) {
    prixHtml = '<div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--beige);">';
    prixHtml += '<h3 style="font-family:var(--sans);font-size:1rem;font-weight:500;margin-bottom:1rem;color:var(--noir);">À propos du prix</h3>';

    // ⚠️ Pourcentage calculé DYNAMIQUEMENT depuis prixFAI et prixHH (toujours correct)
    // On ignore la valeur stockée car elle peut être corrompue (parfois c'est le montant en €)
    var pctCalc = null;
    if (b.prixFAI && b.prixHH && b.prixHH > 0 && b.prixFAI > b.prixHH) {
      pctCalc = ((b.prixFAI - b.prixHH) / b.prixHH * 100);
    } else if (b.pctHonoraires && b.pctHonoraires > 0 && b.pctHonoraires <= 15) {
      // Fallback : valeur stockée uniquement si elle est réaliste (≤ 15%)
      pctCalc = parseFloat(b.pctHonoraires);
    }
    // Honoraires "à la charge de" : doit être un texte (acquéreur/vendeur/partagés)
    var qui = (typeof b.honoraires === 'string' && b.honoraires) ? b.honoraires : 'acquéreur';
    var quiTxt = (qui === 'vendeur') ? 'du vendeur' : (qui === 'partagés' ? 'partagés' : "de l'acquéreur");

    if (pctCalc !== null) {
      // Affichage français : virgule décimale, max 2 décimales, on enlève les zéros inutiles
      // Exemples : 4 → "4", 3.79 → "3,79", 3.5 → "3,5", 3.7900 → "3,79"
      var pctRound = Math.round(pctCalc * 100) / 100; // arrondi à 2 décimales
      var pctStr;
      if (pctRound === Math.floor(pctRound)) {
        pctStr = pctRound.toFixed(0);
      } else {
        pctStr = pctRound.toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
      }
      prixHtml += '<p style="font-size:.88rem;color:var(--gris);margin-bottom:.5rem;">Honoraires TTC inclus à la charge ' + quiTxt + ' à <strong>' + pctStr + ' %</strong> du prix du bien hors honoraires.</p>';
    }
    if (b.prixFAI) prixHtml += '<p style="font-size:.9rem;color:var(--noir);margin-bottom:.3rem;">Prix du bien honoraires inclus : <strong>' + b.prixFAI.toLocaleString('fr-FR') + ' €</strong></p>';
    if (b.prixHH) prixHtml += '<p style="font-size:.9rem;color:var(--noir);">Prix du bien hors honoraires : <strong>' + b.prixHH.toLocaleString('fr-FR') + ' €</strong></p>';
    prixHtml += '</div>';
  }
  if (prixSection) prixSection.innerHTML = prixHtml;

  // Bloc légal obligatoire affiché à la fin de chaque annonce
  const legalSection = document.getElementById('ficheLegal');
  if (legalSection) {
    legalSection.innerHTML =
      '<div style="margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--beige);font-size:.8rem;line-height:1.7;color:var(--gris);">' +
        (b.partenaire ? _mentionPartenaire(b) : ('<p style="margin-bottom:.8rem;">Votre agent commercial 3G IMMO : <strong style="color:var(--noir);font-weight:600;">Charles MOREL</strong>, ' +
          'entrepreneur individuel inscrit au RSAC de Le Mans n° <strong style="color:var(--noir);font-weight:500;">900 233 800</strong>. ' +
          'Carte professionnelle « Transactions sur immeubles et fonds de commerce » du réseau 3G IMMO, délivrée par la CCI de Haute-Savoie.</p>')) +
        (_estLocation(b)
          ? '<p style="margin-bottom:.8rem;">Honoraires de location fixés dans la limite des plafonds prévus par le décret n° 2014-890 du 1er août 2014. Barème complet disponible sur la page <a href="#honoraires" onclick="showLegal(\'honoraires\');return false;" style="color:var(--or-fonce);">Honoraires</a>.</p>'
          : '<p style="margin-bottom:.8rem;">Selon l\'article L.561-5 du Code monétaire et financier, une pièce d\'identité vous sera demandée pour l\'organisation de la visite.</p>') +
        '<p style="margin-bottom:.8rem;">Les informations sur les risques auxquels ce bien est exposé sont disponibles sur le site Géorisques : ' +
          '<a href="https://www.georisques.gouv.fr" target="_blank" rel="noopener" style="color:var(--or-fonce);border-bottom:1px solid currentColor;">www.georisques.gouv.fr</a></p>' +
        '<p style="font-style:italic;font-size:.75rem;margin-top:1rem;">' +
          (_estLocation(b) ? 'Loyer mensuel charges comprises, hors honoraires. Document non contractuel.' : '* Prix honoraires inclus, hors frais notariés, d\'enregistrement et de publicité foncière. Document non contractuel.') +
        '</p>' +
      '</div>';
  }

  // DPE — avec fallback sur les anciens noms de champs (dpe/dpeVal/ges/gesVal)
  // pour que les biens sauvés via l'ancien formulaire d'édition s'affichent aussi
  if (!b.dpeClasse && b.dpe) b.dpeClasse = b.dpe;
  if (!b.dpeConso && b.dpeVal) b.dpeConso = b.dpeVal;
  if (!b.gesClasse && b.ges) b.gesClasse = b.ges;
  if (!b.gesConso && b.gesVal) b.gesConso = b.gesVal;

  const dpeSection = document.getElementById('ficheDPE');
  if (dpeSection) {
    dpeSection.innerHTML = b.dpeClasse ? buildDPEHtml(b) : '';
  }

  // Galerie photos
  const photos = (b.photos && b.photos.length > 0) ? b.photos : [b.img];
  window._currentPhotos = photos;
  const photo1 = photos[0] || b.img;
  const photo2 = photos[1] || null;
  const photo3 = photos[2] || null;
  var altBase = (b.type || 'Bien') + ' ' + (b.ville || 'Angers') +
    (b.surface ? ' ' + b.surface + ' m²' : '') + " - L'Ardoise Immobilière";
  var nbPhotos = photos.length;
  var photoBtnHtml = '<button type="button" class="fiche-photos-btn" onclick="event.stopPropagation();openLightbox(0)">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' +
      nbPhotos + ' Photo' + (nbPhotos > 1 ? 's' : '') +
    '</button>';

  // Construction de la galerie selon le nombre de photos
  var galleryHtml = '<div class="fiche-gallery-main">' +
      '<img src="' + (photo1 ? imgOpt(photo1, 1600) : PLACEHOLDER_IMG) + '"' + (photo1 ? ' srcset="' + imgOpt(photo1, 800) + ' 800w, ' + imgOpt(photo1, 1600) + ' 1600w" sizes="(max-width: 760px) 100vw, 62vw"' : '') + ' data-orig="' + (photo1 || '') + '" alt="' + altBase.replace(/"/g,'&quot;') + '" loading="eager" fetchpriority="high" decoding="async" onclick="openLightbox(0)" onerror="imgRepli(this)">' +
      photoBtnHtml +
    '</div>';

  var galleryMode = 'single'; // 1 seule photo
  if (photo2 && photo3) {
    // 3+ photos : main + 2 sub empilées à droite
    galleryMode = 'three';
    galleryHtml += '<div class="fiche-gallery-sub">' +
      '<img src="' + imgOpt(photo2, 900) + '" data-orig="' + photo2 + '" alt="' + altBase.replace(/"/g,'&quot;') + ' - vue 2" decoding="async" onclick="openLightbox(1)" onerror="imgRepli(this)">' +
      '<img src="' + imgOpt(photo3, 900) + '" data-orig="' + photo3 + '" alt="' + altBase.replace(/"/g,'&quot;') + ' - vue 3" decoding="async" onclick="openLightbox(2)" onerror="imgRepli(this)">' +
    '</div>';
  } else if (photo2) {
    // 2 photos : main + 1 sub pleine hauteur à droite
    galleryMode = 'two';
    galleryHtml += '<div class="fiche-gallery-sub">' +
      '<img src="' + imgOpt(photo2, 1200) + '" data-orig="' + photo2 + '" alt="' + altBase.replace(/"/g,'&quot;') + ' - vue 2" decoding="async" onclick="openLightbox(1)" onerror="imgRepli(this)">' +
    '</div>';
  }

  var ficheGalleryEl = document.getElementById('ficheGallery');
  ficheGalleryEl.innerHTML = galleryHtml;
  ficheGalleryEl.classList.remove('single', 'two', 'three');
  ficheGalleryEl.classList.add(galleryMode);

  // ===== Sidebar Barnes-style : bandeau prix + photo agent =====
  var priceBar = document.getElementById('fichePriceBar');
  if (priceBar) {
    priceBar.style.backgroundImage = photo1 ? 'url("' + imgOpt(photo1, 900) + '")' : '';
  }
  var priceBarTitle = document.getElementById('fichePriceBarTitle');
  if (priceBarTitle) {
    var titleTxt = (b.type || '').toUpperCase();
    if (b.ville) titleTxt += ' ' + b.ville.toUpperCase();
    if (b.surface) titleTxt += ' - ' + b.surface + ' M²';
    priceBarTitle.textContent = titleTxt || 'BIEN';
  }
  var priceBarPrice = document.getElementById('fichePriceBarPrice');
  if (priceBarPrice) priceBarPrice.textContent = formatPrixPublic(b);


  // Pré-remplir message de contact avec la référence du bien
  var msgField = document.getElementById('ficheContactMessage');
  var refBien = b.ref && String(b.ref).trim() ? String(b.ref).trim() : genRef(b.id);
  if (msgField) {
    msgField.value = "Bonjour, je souhaiterais plus d'informations sur " + (_estLocation(b) ? 'la location' : 'le bien') + " (Réf : " + refBien + "). Pouvez-vous me recontacter à ce sujet ?";
  }
  var successBox = document.getElementById('ficheContactSuccess');
  if (successBox) successBox.classList.remove('show');

  // Biens similaires
  renderSimilaires(b);

  // ======== SEO DYNAMIQUE : title, meta, schema.org par bien ========
  updateSeoForBien(b);

  // URL SEO-friendly avec slug descriptif
  if (window.history && window.history.replaceState) {
    var slug = _slugifyBien(b);
    try { window.history.replaceState(null, '', window.location.pathname + '#bien/' + slug); } catch (e) {}
  }

  if (typeof renderFicheExtras === 'function') renderFicheExtras(b);
  showPage('fiche');
}

function _slugifyBien(b) {
  var parts = [];
  if (b.type) parts.push(b.type);
  if (b.ville) parts.push(b.ville);
  if (b.surface) parts.push(b.surface + 'm2');
  if (b.pieces) parts.push(b.pieces + 'pieces');
  parts.push('ref-' + b.id);
  return parts.join('-')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ======== SEO : mise à jour dynamique title, meta, JSON-LD par bien ========
function updateSeoForBien(b) {
  if (!b) return;
  var loc = _estLocation(b);
  var ref = (b.ref && String(b.ref).trim()) ? String(b.ref).trim() : genRef(b.id);
  var villePretty = b.ville || 'Angers';
  var typeB = b.type || 'Bien';
  var pieces = b.pieces ? b.pieces + ' pièces' : '';
  var surface = b.surface ? b.surface + ' m²' : '';
  var prixNum = b.prix || b.prixFAI || 0;
  var prixFmt = formatPrixPublic(b);
  var verbe = loc ? ' à louer ' : ' à vendre ';
  var titleParts = [typeB + verbe + villePretty];
  if (pieces) titleParts.push(pieces);
  if (surface) titleParts.push(surface);
  if (prixNum) titleParts.push(prixFmt);
  var _prixT = prixNum ? ', ' + prixFmt.replace(/\s*(FAI|HAI|frais d'agence inclus)\s*$/i, '') : '';
  var _cands = [
    typeB + (pieces ? ' ' + pieces : '') + (surface ? ' ' + surface : '') + ' à ' + villePretty + _prixT + " | L'Ardoise",
    typeB + (surface ? ' ' + surface : '') + ' à ' + villePretty + _prixT + " | L'Ardoise",
    typeB + verbe + villePretty + _prixT + " | L'Ardoise",
    typeB + verbe + villePretty + " | L'Ardoise"];
  var _titre = _cands.filter(function (t) { return t.length <= 60; })[0] || _cands[_cands.length - 1];
  titleParts = [_titre];
  document.title = _titre;
  var descFields = [];
  descFields.push(typeB + (pieces ? ' ' + pieces : '') + (surface ? ' de ' + surface : '') + verbe + 'à ' + villePretty + '.');
  if (b.chambres) descFields.push(b.chambres + ' chambre' + (b.chambres > 1 ? 's' : '') + '.');
  if (b.terrain && !loc) descFields.push('Terrain ' + b.terrain + ' m².');
  if (prixNum) descFields.push((loc ? 'Loyer : ' : 'Prix : ') + prixFmt + '.');
  descFields.push("Contactez L'Ardoise Immobilière, agence immobilière d'Angers à Sablé-sur-Sarthe.");
  var desc = descFields.join(' ');
  if (desc.length > 155) { descFields.pop(); descFields.push("Contactez L'Ardoise Immobilière."); desc = descFields.join(' '); }
  if (desc.length > 155) desc = desc.slice(0, 154).replace(/\s+\S*$/, '') + '…';
  _setOrUpdateMeta('description', desc);
  _setOrUpdateMeta('og:title', titleParts.join(' · '), 'property');
  _setOrUpdateMeta('og:description', desc, 'property');
  _setOrUpdateMeta('og:type', 'product', 'property');
  if (b.img) _setOrUpdateMeta('og:image', b.img, 'property');
  _setOrUpdateMeta('og:url', window.location.href, 'property');
  _setOrUpdateMeta('twitter:title', titleParts.join(' · '));
  _setOrUpdateMeta('twitter:description', desc);
  if (b.img) _setOrUpdateMeta('twitter:image', b.img);
  var photos = (b.photos && b.photos.length > 0) ? b.photos : (b.img ? [b.img] : []);
  var residenceType = /appartement/i.test(typeB) ? 'Apartment' : (/terrain/i.test(typeB) ? 'LandOffer' : 'House');
  var schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Residence", "Accommodation", residenceType],
        "@id": window.location.href + '#residence',
        "name": typeB + (pieces ? ' ' + pieces : '') + ' à ' + villePretty,
        "description": (b.description || '').substring(0, 500).replace(/\s+/g, ' '),
        "image": photos,
        "numberOfRooms": b.pieces || undefined,
        "numberOfBedrooms": b.chambres || undefined,
        "floorSize": b.surface ? { "@type": "QuantitativeValue", "value": b.surface, "unitCode": "MTK" } : undefined,
        "address": { "@type": "PostalAddress", "addressLocality": villePretty, "postalCode": b.cp || undefined, "addressRegion": "Pays de la Loire", "addressCountry": "FR" }
      },
      {
        "@type": "Offer",
        "@id": window.location.href + '#offre',
        "name": typeB + verbe + villePretty,
        "url": window.location.href,
        "sku": ref,
        "price": isPrixMasque(b) ? undefined : (prixNum || undefined),
        "priceCurrency": "EUR",
        "businessFunction": loc ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
        "availability": b.statut === 'vendu' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        "seller": { "@type": "RealEstateAgent", "name": "L'Ardoise Immobilière" }
      }
    ]
  };
  _setOrUpdateLdJson('ldjson-bien', schema);
}

function _setOrUpdateMeta(name, content, attr) {
  attr = attr || 'name';
  if (!content) return;
  var selector = 'meta[' + attr + '="' + name + '"]';
  var el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function _setOrUpdateLdJson(id, data) {
  var el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

// Réinitialiser le SEO quand on quitte la fiche
function resetSeoToHome() {
  document.title = "Agence immobilière Angers & Sablé-sur-Sarthe | L'Ardoise";
  _setOrUpdateMeta('description', "Agence immobilière d'Angers à Sablé-sur-Sarthe : maisons, appartements et terrains à vendre, estimation gratuite et suivi jusqu'à l'acte.");
  _setOrUpdateMeta('og:title', "Agence immobilière Angers & Sablé-sur-Sarthe | L'Ardoise", 'property');
  _setOrUpdateMeta('og:description', "Agence immobilière d'Angers à Sablé-sur-Sarthe : maisons, appartements et terrains à vendre, estimation gratuite et suivi jusqu'à l'acte.", 'property');
  _setOrUpdateMeta('og:type', 'website', 'property');
  _setOrUpdateMeta('og:url', window.location.origin + window.location.pathname, 'property');
  // Supprimer le schema bien si présent
  var el = document.getElementById('ldjson-bien');
  if (el) el.remove();
}

// Soumission du formulaire contact depuis la fiche
async function submitFicheContact(e) {
  e.preventDefault();
  var form = e.target;
  var data = {
    nom: form.nom.value.trim(), prenom: form.prenom.value.trim(), telephone: form.telephone.value.trim(),
    email: form.email.value.trim(), message: form.message.value.trim(), consent: form.consent.checked
  };
  if (!data.nom || !data.prenom || !data.email || !data.telephone || !data.message) { showToast('Merci de remplir les champs obligatoires.', 'error'); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { showToast('E-mail invalide.', 'error'); return false; }
  if (!formsActifs()) return false;
  var b = window._bienAffiche || {};
  var ref = b.ref && String(b.ref).trim() ? String(b.ref).trim() : genRef(b.id);
  var btn = form.querySelector('.fiche-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }
  try {
    var res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: AGENCE.web3formsKey,
        subject: 'Demande sur le bien ' + ref + ' - ' + data.prenom + ' ' + data.nom,
        from_name: data.prenom + ' ' + data.nom,
        nom: data.prenom + ' ' + data.nom, email: data.email, telephone: data.telephone,
        bien: (b.type || 'Bien') + ' ' + (_estLocation(b) ? 'à louer' : 'à vendre') + ' à ' + (b.ville || '') + ' (réf. ' + ref + ')',
        message: data.message, accepte_actualites: data.consent ? 'Oui' : 'Non'
      })
    });
    var r = await res.json().catch(function () { return {}; });
    if (!res.ok || !r.success) throw new Error('envoi');
    var successBox = document.getElementById('ficheContactSuccess');
    if (successBox) successBox.classList.add('show');
    form.reset();
    setTimeout(function () { if (successBox) successBox.classList.remove('show'); }, 6000);
  } catch (err) {
    showToast("Erreur d'envoi." + contactDirect(), 'error', 6000);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Envoyer votre message'; }
  }
  return false;
}

function renderSimilaires(b) {
  const section = document.getElementById('ficheSimilaires');
  if (!section) return;
  var _pool = biens.filter(function(x){ return (x.transaction || 'vente') === (b.transaction || 'vente'); });

  // 1. Biens dans la même ville (priorité)
  let similaires = _pool.filter(function(x) {
    return x.id !== b.id && x.ville === b.ville && x.statut !== 'vendu';
  });
  // 2. Compléter avec biens du même type
  if (similaires.length < 3) {
    const autres = _pool.filter(function(x) {
      return x.id !== b.id && x.type === b.type && x.statut !== 'vendu' &&
             !similaires.find(function(s) { return s.id === x.id; });
    });
    similaires = similaires.concat(autres);
  }
  // 3. Compléter avec n'importe quel autre bien actif
  if (similaires.length < 3) {
    const autres = _pool.filter(function(x) {
      return x.id !== b.id && x.statut !== 'vendu' &&
             !similaires.find(function(s) { return s.id === x.id; });
    });
    similaires = similaires.concat(autres);
  }
  similaires = similaires.slice(0, 3);

  if (similaires.length === 0) { section.innerHTML = ''; return; }

  var simGrid = document.createElement('div');
  simGrid.className = 'similaires-grid';
  // Si 1 ou 2 cartes, on ajuste pour qu'elles ne s'étirent pas
  if (similaires.length === 1) simGrid.classList.add('similaires-grid-1');
  else if (similaires.length === 2) simGrid.classList.add('similaires-grid-2');
  similaires.forEach(function(s) { simGrid.appendChild(bienCardHTML(s)); });
  section.innerHTML = '<h3 class="similaires-title">' + (_estLocation(b) ? 'Autres locations aux alentours' : 'Autres biens aux alentours') + '</h3>';
  section.appendChild(simGrid);
}

function buildRow(l1, v1, l2, v2) {
  return _carac(l1, v1) + _carac(l2, v2);
  const td = 'style="padding:.6rem 0;color:var(--gris);"';
  const th = 'style="padding:.6rem 1rem .6rem 0;font-weight:500;letter-spacing:.06em;font-size:.72rem;text-transform:uppercase;color:var(--noir);width:35%;"';
  const th2 = 'style="padding:.6rem 1rem .6rem 2rem;font-weight:500;letter-spacing:.06em;font-size:.72rem;text-transform:uppercase;color:var(--noir);width:25%;"';
  return '<tr style="border-bottom:1px solid var(--beige);">' +
    '<td ' + th + '>' + l1 + '</td><td ' + td + '>' + v1 + '</td>' +
    (l2 ? '<td ' + th2 + '>' + l2 + '</td><td ' + td + '>' + v2 + '</td>' : '<td></td><td></td>') +
    '</tr>';
}

// DPE officiel : deux réglettes en flèches (énergie + émissions GES) avec la classe
// active AGRANDIE et bordée de noir, + estimation des coûts annuels. Reproduit le
// format réglementaire (comme le diagnostic papier).
function buildDPEHtml(b) {
  var dpeColors = {A:'#319834',B:'#52b153',C:'#9bc83c',D:'#f8cc05',E:'#f09c29',F:'#e8671c',G:'#F6A737'};
  var gesColors = {A:'#c8e8f5',B:'#9dcde8',C:'#7ab0d4',D:'#6090bb',E:'#4f6fa0',F:'#3a4f80',G:'#1e2d5a'};
  var classes = ['A','B','C','D','E','F','G'];

  // Construit une réglette SVG (7 flèches). `rounded` = style GES (bouts arrondis).
  function reglette(active, colors, rounded) {
    var GAP = 6, H = 26, HA = 46, W0 = 66, STEP = 20, PT = 15;
    var y = 0, body = '';
    classes.forEach(function(c, i) {
      var isA = (c === active);
      var h = isA ? HA : H;
      var w = W0 + i * STEP;
      var stroke = isA ? ' stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"' : '';
      if (rounded) {
        var r = (h - 4) / 2;
        body += '<rect x="2" y="' + (y + 2) + '" width="' + (w - 4) + '" height="' + (h - 4) + '" rx="' + r + '" ry="' + r + '" fill="' + colors[c] + '"' + stroke + '/>';
      } else {
        var ex = isA ? 5 : 0; // pointe un peu plus longue quand actif
        var pts = ['2,' + (y + 2), (w - PT) + ',' + (y + 2), (w + ex) + ',' + (y + h / 2), (w - PT) + ',' + (y + h - 2), '2,' + (y + h - 2)].join(' ');
        body += '<polygon points="' + pts + '" fill="' + colors[c] + '"' + stroke + '/>';
      }
      var light = rounded && (c === 'A' || c === 'B' || c === 'C');
      var tCol = light ? '#021430' : '#fff';
      var fs = isA ? 22 : 13;
      var tx = rounded ? (w / 2) : 13;
      var anchor = rounded ? 'middle' : 'start';
      body += '<text x="' + tx + '" y="' + (y + h / 2 + 1) + '" fill="' + tCol + '" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="' + fs + '" text-anchor="' + anchor + '" dominant-baseline="central">' + c + '</text>';
      y += h + GAP;
    });
    var width = W0 + 6 * STEP + 12;
    return '<svg viewBox="-2 -2 ' + (width + 4) + ' ' + (y + 4) + '" width="100%" style="max-width:' + width + 'px;overflow:visible;display:block;">' + body + '</svg>';
  }

  var lab = 'font-size:.72rem;font-weight:600;line-height:1.3;';
  var html = '<div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--beige);">';
  html += '<h3 style="font-family:var(--sans);font-size:1rem;font-weight:600;margin-bottom:1.4rem;color:var(--noir);">Diagnostic de performance énergétique (DPE)</h3>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:2.2rem 2.6rem;align-items:start;">';

  // ---- Colonne ÉNERGIE ----
  html += '<div>';
  html += '<div style="' + lab + 'color:#1F6B22;margin-bottom:.7rem;">Logement extrêmement performant</div>';
  html += reglette(b.dpeClasse, dpeColors, false);
  html += '<div style="' + lab + 'color:#F6A737;margin-top:.7rem;">Logement extrêmement consommateur d\'énergie</div>';
  if (b.dpeConso) html += '<div style="margin-top:.6rem;font-size:.8rem;color:var(--gris);"><strong style="color:var(--noir);font-size:1.05rem;">' + b.dpeConso + '</strong> kWh/m².an</div>';
  html += '</div>';

  // ---- Colonne ÉMISSIONS (GES) ----
  html += '<div>';
  html += '<div style="' + lab + 'color:var(--gris);margin-bottom:.2rem;">* Dont émissions de gaz à effet de serre</div>';
  html += '<div style="' + lab + 'color:#1F6B22;margin-bottom:.7rem;">peu d\'émissions de CO₂</div>';
  if (b.gesClasse) {
    html += reglette(b.gesClasse, gesColors, true);
    html += '<div style="' + lab + 'color:#1e2d5a;margin-top:.7rem;">émissions de CO₂ très importantes</div>';
    if (b.gesConso) html += '<div style="margin-top:.6rem;font-size:.8rem;color:var(--gris);"><strong style="color:var(--noir);font-size:1.05rem;">' + b.gesConso + '</strong> kg CO₂/m².an</div>';
  } else {
    html += '<div style="font-size:.78rem;color:var(--gris);font-style:italic;padding:.4rem 0;">Émissions GES non renseignées</div>';
  }
  html += '</div>';

  html += '</div>'; // fin grid

  // ---- Estimation des coûts annuels ----
  if (b.dpeCoutMin && b.dpeCoutMax) {
    html += '<div style="margin-top:1.8rem;padding-top:1.2rem;border-top:1px solid var(--beige);">';
    html += '<div style="font-size:.85rem;font-weight:600;color:var(--noir);margin-bottom:.4rem;">Estimation des coûts annuels d\'énergie du logement</div>';
    html += '<div style="font-size:.95rem;color:var(--gris);">entre <strong style="color:var(--or-fonce);">' + Number(b.dpeCoutMin).toLocaleString('fr-FR') + ' €</strong> et <strong style="color:var(--or-fonce);">' + Number(b.dpeCoutMax).toLocaleString('fr-FR') + ' €</strong> par an</div>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}


var villes = ['Angers', 'Avrillé', 'Trélazé', 'Les Ponts-de-Cé', 'Saint-Barthélemy-d\'Anjou', 'Beaucouzé', 'Bouchemaine', 'Écouflant', 'Mûrs-Érigné', 'Sainte-Gemmes-sur-Loire', 'Montreuil-Juigné', 'Verrières-en-Anjou'];

// Types / villes réellement présents parmi les biens ACTIFS (barre de recherche intelligente)
function typesPresents() {
  var set = {};
  biens.forEach(function(b){ if (b.statut !== 'vendu' && b.type) set[b.type] = true; });
  return Object.keys(set).sort(function(a, b){ return a.localeCompare(b, 'fr'); });
}
function villesPresentes() {
  var set = {};
  biens.forEach(function(b){ if (b.statut !== 'vendu' && b.ville) set[b.ville] = true; });
  return Object.keys(set).sort(function(a, b){ return a.localeCompare(b, 'fr'); });
}
// Panneaux multi-villes (cases à cocher) — partagés hero + page Biens (même modèle filterVilles)
function buildVilleMultiselect(villesL) {
  // on nettoie la sélection des villes qui n'existent plus
  filterVilles = filterVilles.filter(function(v){ return villesL.indexOf(v) !== -1; });
  _buildVillePanel('biensVillePanel', villesL);
  _buildVillePanel('heroVillePanel', villesL);
  syncVilleMultiselect();
}
function _buildVillePanel(panelId, villesL) {
  var panel = document.getElementById(panelId);
  if (!panel) return;
  panel.innerHTML = '';
  villesL.forEach(function(v){
    var lab = document.createElement('label');
    lab.className = 'ms-opt';
    var cb = document.createElement('input');
    cb.type = 'checkbox'; cb.value = v; cb.checked = filterVilles.indexOf(v) !== -1;
    cb.addEventListener('change', function(){ onVilleCheck(cb); });
    var sp = document.createElement('span'); sp.textContent = v;
    lab.appendChild(cb); lab.appendChild(sp);
    panel.appendChild(lab);
  });
}
function onVilleCheck(cb) {
  var v = cb.value;
  filterSecteur = '';
  if (cb.checked) { if (filterVilles.indexOf(v) === -1) filterVilles.push(v); }
  else { filterVilles = filterVilles.filter(function(x){ return x !== v; }); }
  syncVilleMultiselect();
  renderBiensGrid();
}
function syncVilleMultiselect() {
  var txt = !filterVilles.length ? (filterSecteur ? _SECTEUR_NOMS[filterSecteur] : null)
    : (filterVilles.length === 1 ? filterVilles[0] : filterVilles.length + ' villes sélectionnées');
  var bl = document.getElementById('biensVilleLabel'); if (bl) bl.textContent = txt || 'Toutes les villes';
  var hl = document.getElementById('heroVilleLabel'); if (hl) hl.textContent = txt || 'Ville';
  ['biensVillePanel', 'heroVillePanel'].forEach(function(pid){
    var panel = document.getElementById(pid);
    if (panel) Array.prototype.forEach.call(panel.querySelectorAll('input[type=checkbox]'), function(cb){ cb.checked = filterVilles.indexOf(cb.value) !== -1; });
  });
}
function toggleVilleMenu(e, id) {
  if (e) e.stopPropagation();
  var ms = document.getElementById(id || 'biensVilleMS');
  if (ms) ms.classList.toggle('open');
}
document.addEventListener('click', function(e){
  ['biensVilleMS', 'heroVilleMS'].forEach(function(id){
    var ms = document.getElementById(id);
    if (ms && ms.classList.contains('open') && !ms.contains(e.target)) ms.classList.remove('open');
  });
});

function refreshVilleSelects() {
  // ===== Barres de recherche INTELLIGENTES : uniquement les types/villes réellement présents =====
  var villesL = villesPresentes();
  var typesL = typesPresents();
  // Types dynamiques (hero + page Biens) — ex. « Villa » n'apparaît pas s'il n'y a aucun villa
  ['heroType', 'biensType'].forEach(function(id){
    var sel = document.getElementById(id); if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = '<option value="">Type de bien</option>';
    typesL.forEach(function(t){ var o = document.createElement('option'); o.value = t; o.textContent = t; if (t === cur) o.selected = true; sel.appendChild(o); });
    if (typesL.indexOf(cur) === -1) sel.value = '';
  });
  // Ville : MULTI-sélection (cases à cocher) — hero ET page Biens
  buildVilleMultiselect(villesL);
  // Admin select ville
  const adminSel = document.getElementById('aVille');
  if (adminSel) {
    const currentVal = adminSel.value;
    // Garder les options existantes + ajouter nouvelles villes + option ajout
    adminSel.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = ''; defaultOpt.textContent = 'Sélectionner une ville…';
    defaultOpt.disabled = true;
    adminSel.appendChild(defaultOpt);
    villes.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      if (v === currentVal) opt.selected = true;
      adminSel.appendChild(opt);
    });
    const newOpt = document.createElement('option');
    newOpt.value = '__new__'; newOpt.textContent = '+ Ajouter une ville...';
    adminSel.appendChild(newOpt);
    // Si aucune valeur actuelle, on sélectionne la première ville réelle
    if (!currentVal && villes.length > 0) {
      adminSel.value = villes[0];
    }
  }
  // Édition d'un bien — select Ville
  const editSel = document.getElementById('editVille');
  if (editSel) {
    const currentVal = editSel.value;
    editSel.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = ''; defaultOpt.textContent = 'Sélectionner une ville…';
    editSel.appendChild(defaultOpt);
    villes.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      if (v === currentVal) opt.selected = true;
      editSel.appendChild(opt);
    });
    // Si la valeur actuelle n'est pas dans la liste (ville custom), on l'ajoute aussi
    if (currentVal && !villes.includes(currentVal)) {
      const customOpt = document.createElement('option');
      customOpt.value = currentVal; customOpt.textContent = currentVal;
      customOpt.selected = true;
      editSel.appendChild(customOpt);
    }
  }
  // Estimation
  const estimSel = null;   // liste figée des communes (prix DVF), voir build.py
  if (estimSel) {
    estimSel.innerHTML = '';
    villes.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      estimSel.appendChild(opt);
    });
    const autreOpt = document.createElement('option');
    autreOpt.value = 'Autre'; autreOpt.textContent = 'Autre';
    estimSel.appendChild(autreOpt);
  }
  // Contact zones
  const contactZones = document.querySelector('.contact-zones-list');
  if (contactZones) {
    contactZones.innerHTML = villes.map(v => `<span class="contact-zone">${v}</span>`).join('');
  }
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', function(e) {
    if (e.target === this) closeModal(this.id);
  });
});

// ===== FORMS =====
async function submitModal(e) {
  if (e && e.preventDefault) e.preventDefault();

  var v = function(id){ var el = document.getElementById(id); return el ? el.value.trim() : ''; };
  var nom     = v('modalNom');
  var email   = v('modalEmail');
  var tel     = v('modalTel');
  var projet  = v('modalProjet');
  var message = v('modalMessage');

  // Validation côté client
  if (!nom || !email || !tel) {
    showToast('Merci de remplir nom, email et téléphone.', 'error');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Email invalide.', 'error');
    return;
  }
  if (!/^[0-9 .+\-()]{8,20}$/.test(tel)) {
    showToast('Numéro de téléphone invalide.', 'error');
    return;
  }

  if (!formsActifs()) return;
  var btn = document.getElementById('modalSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }

  try {
    var res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: AGENCE.web3formsKey,
        subject: 'Nouveau message contact - ' + nom + ' (' + projet + ')',
        from_name: nom,
        nom: nom,
        email: email,
        telephone: tel,
        projet: projet,
        message: message || '(aucun message)'
      })
    });
    var _r = await res.json().catch(function(){ return {}; });
    if (!res.ok || !_r.success) throw new Error('envoi');
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = 'Envoyer ma demande'; }
    showToast("Erreur d'envoi." + contactDirect(), 'error', 6000);
    return;
  }

  // Succès
  var form = document.getElementById('contactFormWrap');
  var success = document.getElementById('contactSuccess');
  if (form) form.style.display = 'none';
  if (success) success.classList.add('show');
  if (btn) { btn.disabled = false; btn.textContent = 'Envoyer ma demande'; }
  setTimeout(function() {
    closeModal('modal-contact');
    if (form) {
      form.style.display = 'block';
      form.reset();
    }
    if (success) success.classList.remove('show');
  }, 3000);
}

// =====================================================================
// ESTIMATION EN LIGNE (prix réels DVF) + ALERTES E-MAIL « nouveaux biens »
// Les demandes partent vers le relais Cloudflare (AGENCE.statutProxyUrl, serverless/demandes.js) :
// elles sont enregistrées et visibles dans l'espace pro, et envoyées par e-mail à Charles si l'envoi est branché.
// =====================================================================
var _prixDvf = null;
function _chargerPrixDvf() {
  if (_prixDvf) return Promise.resolve(_prixDvf);
  return fetch('data/prix.json', { cache: 'force-cache' })
    .then(function (r) { if (!r.ok) throw new Error('prix'); return r.json(); })
    .then(function (j) { _prixDvf = j; return j; })
    .catch(function () { return null; });
}
function _arrondiPrix(v) { var pas = v >= 300000 ? 5000 : 1000; return Math.round(v / pas) * pas; }

// Fourchette indicative à partir du prix médian au m² des ventes de la commune (ou du secteur)
function _estCalculer(d, dvf) {
  var k = /^(Maison|Villa|Maison de ville)$/.test(d.type) ? 'm' : (d.type === 'Appartement' ? 'a' : null);
  var surface = parseFloat(String(d.surface).replace(',', '.')) || 0;
  if (!k || !dvf || surface < 10 || surface > 1000) return null;
  var commune = null, nom = '';
  Object.keys(dvf.communes).some(function (n) { if (_cleVille(n) === _cleVille(d.ville)) { commune = dvf.communes[n]; nom = n; return true; } return false; });
  if (!commune) return null;
  var st = commune[k], secteur = false;
  if (!st) { st = (dvf.secteurs[commune.s] || {})[k]; secteur = true; }
  if (!st) return null;
  var coef = 1, ajust = [];
  var etats = { 'Neuf / récent': 1.08, 'Très bon état': 1.04, 'Bon état': 1, 'À rafraîchir': 0.92, 'Travaux importants à prévoir': 0.82 };
  if (etats[d.etat] && etats[d.etat] !== 1) { coef *= etats[d.etat]; ajust.push('l\'état du bien'); }
  var dpes = { A: 1.04, B: 1.03, C: 1.01, E: 0.98, F: 0.94, G: 0.9 };
  if (dpes[d.dpe]) { coef *= dpes[d.dpe]; ajust.push('le DPE'); }
  if (d.type === 'Villa') { coef *= 1.05; ajust.push('le standing'); }
  var p = d.prestations || [], plus = 1;
  if (p.indexOf('Piscine') !== -1) plus *= 1.03;
  if (p.indexOf('Vue dégagée') !== -1) plus *= 1.02;
  if (k === 'a' && (p.indexOf('Terrasse') !== -1 || p.indexOf('Balcon') !== -1)) plus *= 1.02;
  if (k === 'a' && (p.indexOf('Garage') !== -1 || p.indexOf('Parking') !== -1)) plus *= 1.02;
  if (plus > 1) { coef *= plus; ajust.push('les prestations'); }
  coef = Math.max(0.75, Math.min(1.2, coef));
  var centre = st.p50 * coef * surface;
  var ecart = Math.max(0.06, Math.min(0.12, (st.p75 - st.p25) / (2 * st.p50) * 0.5)) + (secteur ? 0.03 : 0);
  return {
    bas: _arrondiPrix(centre * (1 - ecart)), haut: _arrondiPrix(centre * (1 + ecart)), centre: _arrondiPrix(centre),
    pm2: st.p50, n: st.n, lieu: secteur ? (commune.s === 'sable' ? 'le secteur de Sablé-sur-Sarthe' : 'l\'agglomération d\'Angers') : nom,
    secteur: secteur, k: k, ajust: ajust,
    periode: dvf.periode ? dvf.periode[0] + '–' + String(dvf.periode[1]).slice(0, 4) : ''
  };
}

function _estResultatHTML(est, prenom, envoye) {
  var tel = AGENCE.telephone || '', wa = AGENCE.whatsapp || '';
  var actions = '<div class="est-res-actions">' +
    (tel ? '<a class="cb-btn ghost" href="tel:' + _telIntl(tel) + '">Appeler Charles · ' + _esc(tel) + '</a>' : '') +
    (wa ? '<a class="cb-btn ghost" href="https://wa.me/' + _esc(wa) + '" target="_blank" rel="noopener">Écrire sur WhatsApp</a>' : '') +
    '<button type="button" class="est-back" onclick="estRecommencer()">Faire une autre estimation</button></div>';
  var alerte = envoye ? '' : '<p class="est-res-warn" role="alert">Votre demande n\'a pas pu être transmise automatiquement : appelez-nous ou écrivez-nous pour que nous l\'affinions avec vous.</p>';
  if (!est) {
    return '<div class="est-res" tabindex="-1" id="estRes"><span class="cb-kicker">Demande reçue</span>' +
      '<h2 class="est-q">Merci ' + _esc(prenom) + ', nous nous occupons de votre estimation</h2>' + alerte +
      '<p class="est-help">Pour ce type de bien ou cette commune, une estimation automatique ne serait pas fiable : nous vous recontactons sous 24 h pour vous donner un avis de valeur argumenté, après une visite si besoin. C\'est gratuit et sans engagement.</p>' + actions + _estVisiteHTML() + '</div>';
  }
  var typeTxt = est.k === 'm' ? 'maisons vendues' : 'appartements vendus';
  return '<div class="est-res" tabindex="-1" id="estRes"><span class="cb-kicker">Votre estimation indicative</span>' +
    '<h2 class="est-q">Merci ' + _esc(prenom) + ', votre bien est estimé entre</h2>' +
    '<p class="est-res-fourchette"><strong>' + _eur(est.bas) + '</strong><span>et</span><strong>' + _eur(est.haut) + '</strong></p>' +
    '<p class="est-res-centre">Valeur centrale : <b>' + _eur(est.centre) + '</b></p>' + alerte +
    '<div class="est-res-base"><p><b>Comment ce chiffre est calculé.</b> Prix médian des ' + typeTxt + (est.secteur ? ' dans ' : ' à ') + _esc(est.lieu) + ' : <b>' + est.pm2.toLocaleString('fr-FR') + ' €/m²</b>, sur ' + est.n.toLocaleString('fr-FR') + ' ventes réelles (' + _esc(est.periode) + ', données publiques DVF de l\'administration fiscale)' +
      (est.ajust.length ? ', ajusté selon ' + est.ajust.join(', ').replace(/, ([^,]*)$/, ' et $1') : '') + '.' +
      (est.secteur ? ' Il y a trop peu de ventes dans votre commune : le calcul utilise tout le secteur, la fourchette est donc plus large.' : '') + '</p>' +
      '<p>Un calcul automatique ne voit ni la rue, ni la vue, ni la luminosité, ni la qualité des travaux. <b>Nous vous recontactons sous 24 h</b> pour affiner ce prix lors d\'une visite, gratuitement et sans engagement.</p></div>' +
    actions + _estVisiteHTML() + '</div>';
}

async function submitEstimation() {
  var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
  var d = {
    prenom: v('estimPrenom'), nom: v('estimNom'), email: v('estimEmail'), tel: v('estimTel'), type: v('estimType'), ville: v('estimVille'),
    adresse: v('estimAdresse'), surface: v('estimSurface'), terrain: v('estimTerrain'), pieces: v('estimPieces'), chambres: v('estimChambres'),
    sdb: v('estimSdb'), annee: v('estimAnnee'), etage: v('estimEtage'), etat: v('estimEtat'), projet: v('estimProjet'), dpe: v('estimDpe'), message: v('estimMessage')
  };
  var _suiviOk = !!(document.getElementById('estimSuivi') || {}).checked;
  _estJeton = '';
  var prest = [];
  document.querySelectorAll('#estimPrestations input[type=checkbox]:checked').forEach(function (cb) { prest.push(cb.value); });
  if (!d.prenom || !d.nom) { showToast('Merci de renseigner vos prénom et nom.', 'error'); return; }
  if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { showToast('Merci d\'indiquer un e-mail valide.', 'error'); return; }
  if (!/^[0-9 .+\-()]{8,20}$/.test(d.tel)) { showToast('Merci d\'indiquer un numéro de téléphone valide.', 'error'); return; }
  if (!d.type) { showToast('Merci de sélectionner le type de bien.', 'error'); estGo(1); return; }
  if (!d.ville) { showToast('Merci de sélectionner la commune.', 'error'); estGo(2); return; }
  if (!d.surface) { showToast('Merci d\'indiquer la surface habitable.', 'error'); estGo(3); return; }
  var btn = document.querySelector('#page-estimation .form-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Calcul en cours…'; }
  var est = _estCalculer({ type: d.type, ville: d.ville, surface: d.surface, etat: d.etat, dpe: d.dpe, prestations: prest }, await _chargerPrixDvf());
  var demande = Object.assign({}, d, { consentSuivi: _suiviOk, prestations: prest.join(', '), estimation: est ? _eur(est.bas) + ' – ' + _eur(est.haut) + ' (médiane ' + est.pm2 + ' €/m², ' + est.lieu + ')' : '' });
  var envoye = false;
  if (AGENCE.statutProxyUrl) {
    try {
      var r = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'estimation', demande: demande, site: v('estimSite') }) });
      envoye = r.ok;
      if (r.ok) { try { _estJeton = ((await r.json()) || {}).jeton || ''; } catch (e) {} }
    } catch (e) { envoye = false; }
  }
  if (btn) { btn.disabled = false; btn.textContent = 'Voir mon estimation'; }
  var card = document.getElementById('estCard');
  if (!card) return;
  card.classList.add('est-fini');
  var box = document.getElementById('estResultat');
  if (!box) { box = document.createElement('div'); box.id = 'estResultat'; card.appendChild(box); }
  box.innerHTML = _estResultatHTML(est, d.prenom, envoye);
  document.querySelectorAll('#estProgress span').forEach(function (s) { s.classList.add('on'); });
  var top = card.getBoundingClientRect().top + window.scrollY - 110;
  window.scrollTo({ top: top, behavior: 'smooth' });
  var res = document.getElementById('estRes'); if (res) setTimeout(function () { res.focus({ preventScroll: true }); }, 300);
}
function estRecommencer() {
  var card = document.getElementById('estCard'); if (card) card.classList.remove('est-fini');
  var box = document.getElementById('estResultat'); if (box) box.innerHTML = '';
  ['estimAdresse', 'estimSurface', 'estimTerrain', 'estimPieces', 'estimChambres', 'estimSdb', 'estimAnnee', 'estimEtage', 'estimMessage'].forEach(function (id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  ['estimType', 'estimEtat', 'estimDpe'].forEach(function (id) { var el = document.getElementById(id); if (el) el.selectedIndex = 0; });
  document.querySelectorAll('#estimPrestations input[type=checkbox]').forEach(function (cb) { cb.checked = false; });
  document.querySelectorAll('.est-type').forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
  estGo(1);
}

// ----------------------------------------------------------------- alertes e-mail (page des biens)
var _alertesOuvertes = null;
function _alertesEtat() {
  if (_alertesOuvertes !== null || !AGENCE.statutProxyUrl) return Promise.resolve(!!_alertesOuvertes);
  return fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'etat' }) })
    .then(function (r) { return r.json(); }).then(function (j) { _alertesOuvertes = !!j.alertes; return _alertesOuvertes; })
    .catch(function () { _alertesOuvertes = false; return false; });
}
function _criteresAlerte() {
  return {
    type: filterType !== 'all' ? filterType : '', villes: filterVilles.slice(0, 10),
    budgetMin: filterBudgetMin || 0, budgetMax: filterBudgetMax || 0, surfaceMin: filterSurfaceMin || 0,
    chambresMin: filterChambresMin || 0, terrainMin: filterTerrainMin || 0
  };
}
function _resumeAlerte(c) {
  var p = [c.type ? c.type.toLowerCase() : 'tous types de biens'];
  if (c.villes.length) p.push('à ' + c.villes.join(', '));
  if (c.budgetMin && c.budgetMax) p.push('de ' + _eur(c.budgetMin) + ' à ' + _eur(c.budgetMax));
  else if (c.budgetMax) p.push('jusqu\'à ' + _eur(c.budgetMax));
  else if (c.budgetMin) p.push('à partir de ' + _eur(c.budgetMin));
  if (c.surfaceMin) p.push(c.surfaceMin + ' m² minimum');
  if (c.chambresMin) p.push(c.chambresMin + ' chambre' + (c.chambresMin > 1 ? 's' : '') + ' minimum');
  if (c.terrainMin) p.push('terrain de ' + c.terrainMin.toLocaleString('fr-FR') + ' m² minimum');
  if (!c.villes.length) p.push('dans tous les secteurs');
  return p.join(', ');
}
function renderAlerteBox() {
  var box = document.getElementById('alerteBox'); if (!box) return;
  _alertesEtat().then(function (ok) {
    box.hidden = !ok;
    if (!ok || box.getAttribute('data-envoye') === '1') return;
    var r = document.getElementById('alerteResume'); if (r) r.textContent = _resumeAlerte(_criteresAlerte());
  });
}
async function creerAlerteEmail(ev) {
  if (ev) ev.preventDefault();
  var email = ((document.getElementById('alerteEmail') || {}).value || '').trim();
  var ok = (document.getElementById('alerteConsent') || {}).checked;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Merci d\'indiquer un e-mail valide.', 'error'); return; }
  if (!ok) { showToast('Merci de cocher la case d\'accord pour recevoir les alertes.', 'error'); return; }
  var btn = document.getElementById('alerteBtn'); if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }
  var status = 0, err = '';
  try {
    var r = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'alerte', email: email, criteres: _criteresAlerte(), consentement: true, site: ((document.getElementById('alerteSite') || {}).value || '') }) });
    status = r.status; try { err = (await r.json()).error || ''; } catch (e) {}
  } catch (e) { status = -1; }
  if (btn) { btn.disabled = false; btn.textContent = 'Créer mon alerte'; }
  if (status !== 200) { showToast(err ? err + '.' : 'Impossible de créer l\'alerte pour le moment.' + contactDirect(), 'error', 7000); return; }
  var box = document.getElementById('alerteBox');
  box.setAttribute('data-envoye', '1');
  box.innerHTML = '<div class="alerte-ok" role="status" tabindex="-1" id="alerteOk"><strong>Plus qu\'une étape : vérifiez votre boîte mail.</strong>' +
    '<p>Nous venons d\'envoyer un e-mail à ' + _esc(email) + '. Cliquez sur « Activer mon alerte » pour recevoir les nouveaux biens. Pensez à regarder dans les indésirables.</p></div>';
  var o = document.getElementById('alerteOk'); if (o) o.focus();
}

async function submitContact() {
  var val = function(id){ return ((document.getElementById(id) || {}).value || '').trim(); };
  var nom = val('contactNom'), email = val('contactEmail'), tel = val('contactTel'), msg = val('contactMessage');
  var objetSel = document.getElementById('contactObjet');
  var objet = (objetSel && objetSel.value) ? objetSel.options[objetSel.selectedIndex].text : '';
  if (!nom || !email || !msg) { showToast('Merci de remplir votre nom, e-mail et message.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('E-mail invalide.', 'error'); return; }
  if (tel && !/^[0-9 .+\-()]{8,20}$/.test(tel)) { showToast('Numéro de téléphone invalide.', 'error'); return; }
  var consent = document.getElementById('contactConsent');
  if (consent && !consent.checked) { showToast("Merci de cocher la case d'accord pour l'utilisation de vos données.", 'error'); return; }
  var payload = {
    access_key: AGENCE.web3formsKey,
    subject: 'Nouveau message depuis votre site - ' + nom + (objet ? ' (' + objet + ')' : ''),
    name: nom, email: email, phone: tel || '—', objet: objet || '—', message: msg
  };
  if (objetSel && objetSel.value === 'criteres') {
    var opts = [];
    document.querySelectorAll('#critOptions input:checked').forEach(function(cb){ opts.push(cb.value); });
    payload.criteres_type = val('critType') || 'Indifférent';
    payload.criteres_communes = val('critVilles') || '—';
    payload.criteres_budget_max = val('critBudget') ? Number(val('critBudget')).toLocaleString('fr-FR') + ' €' : '—';
    payload.criteres_surface_min = val('critSurface') ? val('critSurface') + ' m²' : '—';
    payload.criteres_options = opts.length ? opts.join(', ') : '—';
  }
  if (!formsActifs()) return;
  var btn = document.getElementById('contactSubmitBtn') || document.querySelector('#page-contact .form-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours...'; }
  try {
    var res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await res.json();
    if (data.success) {
      showToast('✅ Message envoyé ! Nous vous répondons très rapidement.', 'success', 5000);
      ['contactNom','contactEmail','contactTel','contactMessage','critVilles','critBudget','critSurface'].forEach(function(id) {
        var el = document.getElementById(id); if (el) el.value = '';
      });
      ['contactObjet','critType'].forEach(function(id){ var el = document.getElementById(id); if (el) el.selectedIndex = 0; });
      document.querySelectorAll('#critOptions input, #contactConsent').forEach(function(cb){ cb.checked = false; });
      contactObjetChange();
    } else {
      showToast("Erreur d'envoi." + contactDirect(), 'error', 6000);
    }
  } catch(e) {
    showToast('Erreur réseau.' + contactDirect(), 'error', 6000);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Envoyer ma demande'; }
  }
}

// ===== REFONTE « façon La Cabane » : favoris, estimation en étapes, critères d'achat, parrainage =====
// Montant du parrainage : renseigné dans AGENCE.parrainagePrime (ex. '500 €').
var PARRAINAGE_PRIME = AGENCE.parrainagePrime || '';
var _HEART_PATH = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z';

// --- Favoris (enregistrés dans le navigateur du visiteur) ---
var FAV_KEY = 'cp_favoris';
function favListe() {
  try { var a = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); return Array.isArray(a) ? a.map(String) : []; }
  catch (e) { return []; }
}
function favSave(a) { try { localStorage.setItem(FAV_KEY, JSON.stringify(a)); } catch (e) {} favMajUI(); }
function estFavori(id) { return favListe().indexOf(String(id)) !== -1; }
function toggleFav(id, ev) {
  if (ev) { ev.stopPropagation(); ev.preventDefault(); }
  var a = favListe(), k = String(id), i = a.indexOf(k);
  if (i === -1) { a.push(k); if (typeof showToast === 'function') showToast('Ajouté à vos favoris', 'success', 2200); }
  else a.splice(i, 1);
  favSave(a);
  var pf = document.getElementById('page-favoris');
  if (pf && pf.classList.contains('active')) renderFavoris();
}
function favBouton(id) {
  var on = estFavori(id);
  return '<button type="button" class="fav-btn' + (on ? ' on' : '') + '" data-fav="' + _esc(String(id)) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Retirer des favoris' : 'Ajouter aux favoris') + '" onclick="toggleFav(\'' + _esc(String(id)) + '\', event)">' +
         '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + _HEART_PATH + '"/></svg></button>';
}
function favMajUI() {
  var n = favListe().length;
  document.querySelectorAll('.fav-count').forEach(function (el) { el.textContent = n ? n : ''; el.setAttribute('data-n', n); });
  document.querySelectorAll('.fav-btn[data-fav]').forEach(function (b) {
    var on = estFavori(b.getAttribute('data-fav'));
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', on ? 'Retirer des favoris' : 'Ajouter aux favoris');
  });
  var fb = document.getElementById('ficheFavBtn');
  if (fb && window._bienAffiche) {
    var on2 = estFavori(window._bienAffiche.id);
    fb.classList.toggle('on', on2);
    var lg = fb.querySelector('.lbl-lg'); if (lg) lg.textContent = on2 ? 'Dans mes favoris' : 'Ajouter aux favoris';
    var sm = fb.querySelector('.lbl-sm'); if (sm) sm.textContent = 'Favori';
  }
}
function renderFavoris() {
  var g = document.getElementById('favGrid'); if (!g) return;
  var ids = favListe();
  var liste = (typeof biens !== 'undefined' ? biens : []).filter(function (b) { return ids.indexOf(String(b.id)) !== -1; });
  g.innerHTML = '';
  liste.forEach(function (b) { g.appendChild(bienCardHTML(b)); });
  var vide = document.getElementById('favEmpty'), act = document.getElementById('favActions');
  if (vide) vide.hidden = liste.length > 0;
  if (act) act.hidden = liste.length === 0;
  var sug = document.getElementById('favSuggest'), sugG = document.getElementById('favSuggestG');
  if (sug && sugG) {
    var dispo = (typeof biens !== 'undefined' ? biens : []).filter(function (b) { return b.statut !== 'vendu'; }).slice(0, 3);
    sugG.innerHTML = ''; dispo.forEach(function (b) { sugG.appendChild(bienCardHTML(b)); });
    sug.hidden = liste.length > 0 || !dispo.length;
  }
  favMajUI();
}
function favDemanderInfos() {
  var ids = favListe();
  var liste = (typeof biens !== 'undefined' ? biens : []).filter(function (b) { return ids.indexOf(String(b.id)) !== -1; });
  var lignes = liste.map(function (b) {
    var ref = b.ref && String(b.ref).trim() ? String(b.ref).trim() : (typeof genRef === 'function' ? genRef(b.id) : b.id);
    return '- ' + (b.type || 'Bien') + ' à ' + (b.ville || '') + ' (réf. ' + ref + ')';
  });
  showPage('contact');
  setTimeout(function () {
    var s = document.getElementById('contactObjet'); if (s) { s.value = 'acheter'; contactObjetChange(); }
    var m = document.getElementById('contactMessage');
    if (m) m.value = 'Bonjour, je souhaite avoir plus d\'informations sur ces biens :\n' + lignes.join('\n');
  }, 150);
}
function favToutEffacer() { favSave([]); renderFavoris(); }

// --- Estimation en 5 étapes ---
var estStep = 1;
function estGo(n) {
  n = Math.max(1, Math.min(5, n)); estStep = n;
  document.querySelectorAll('#estCard .est-step').forEach(function (s) { s.classList.toggle('active', +s.getAttribute('data-step') === n); });
  document.querySelectorAll('#estProgress span').forEach(function (s, i) { s.classList.toggle('on', i < n); });
  var back = document.getElementById('estBack'); if (back) back.hidden = (n === 1);
  var nx = document.getElementById('estNext'); if (nx) nx.style.display = (n === 5) ? 'none' : '';
  var card = document.getElementById('estCard');
  if (card) { var top = card.getBoundingClientRect().top + window.scrollY - 110; if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' }); }
}
function estChoisirType(btn) {
  document.querySelectorAll('.est-type').forEach(function (b) { b.classList.toggle('on', b === btn); b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
  var sel = document.getElementById('estimType'); if (sel) sel.value = btn.getAttribute('data-type');
  setTimeout(function () { estGo(2); }, 220);
}
function estSuivant() {
  var v = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
  if (estStep === 1 && !v('estimType')) { showToast('Choisissez le type de bien.', 'error'); return; }
  if (estStep === 2 && !v('estimVille')) { showToast('Indiquez la commune du bien.', 'error'); return; }
  if (estStep === 3 && !v('estimSurface')) { showToast('Indiquez la surface habitable.', 'error'); return; }
  estGo(estStep + 1);
}
// Autocomplétion d'adresse (Base Adresse Nationale — Géoplateforme IGN, repli sur api-adresse)
var _estAddrTimer = null, _estAddrSeq = 0;
function estAdresseSaisie(q) {
  clearTimeout(_estAddrTimer);
  var box = document.getElementById('estSugg');
  if (!q || q.trim().length < 4) { if (box) box.innerHTML = ''; return; }
  _estAddrTimer = setTimeout(function () { estChercherAdresse(q.trim()); }, 250);
}
function estChercherAdresse(q) {
  var seq = ++_estAddrSeq;
  var params = 'q=' + encodeURIComponent(q) + '&limit=5&lat=47.6&lon=-0.47';
  var urls = ['https://data.geopf.fr/geocodage/search?' + params, 'https://api-adresse.data.gouv.fr/search/?' + params];
  (function essai(i) {
    if (i >= urls.length) return;
    fetch(urls[i]).then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (d) { if (seq === _estAddrSeq) estAfficherSugg((d && d.features) || []); })
      .catch(function () { essai(i + 1); });
  })(0);
}
function estAfficherSugg(feats) {
  var box = document.getElementById('estSugg'); if (!box) return;
  box.innerHTML = '';
  feats.forEach(function (f) {
    var p = f.properties || {};
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'option'); b.textContent = p.label || '';
    b.onclick = function () { estChoisirAdresse(p); };
    box.appendChild(b);
  });
}
function estChoisirAdresse(p) {
  var inp = document.getElementById('estimAdresse'); if (inp) inp.value = p.label || inp.value;
  var box = document.getElementById('estSugg'); if (box) box.innerHTML = '';
  var ville = p.city || p.municipality || '';
  var sel = document.getElementById('estimVille');
  if (!sel || !ville) return;
  var norm = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/-/g, ' ').replace('escoublac', '').trim(); };
  for (var i = 0; i < sel.options.length; i++) { if (norm(sel.options[i].text) === norm(ville)) { sel.selectedIndex = i; return; } }
  var o = document.createElement('option'); o.text = ville; sel.add(o, sel.options[sel.options.length - 1]); sel.value = ville;
}
document.addEventListener('click', function (e) {
  var box = document.getElementById('estSugg');
  if (box && box.innerHTML && !e.target.closest('.est-addr')) box.innerHTML = '';
});

// --- Contact : objet de la demande + critères d'achat ---
function contactObjetChange() {
  var o = (document.getElementById('contactObjet') || {}).value;
  var c = document.getElementById('contactCriteres'); if (c) c.hidden = (o !== 'criteres');
}
function ouvrirCriteres(pre, tx) {
  showPage('contact');
  setTimeout(function () {
    var s = document.getElementById('contactObjet'); if (s) { s.value = 'criteres'; contactObjetChange(); }
    pre = pre || {};
    var lbl = document.getElementById('critBudgetLbl'); if (lbl) lbl.textContent = (tx === 'location') ? 'Loyer maximum (€ / mois)' : 'Budget maximum (€)';
    if (tx === 'location') { var m0 = document.getElementById('contactMessage'); if (m0 && !m0.value) m0.value = 'Bonjour, je recherche une location et souhaite être prévenu(e) dès qu\'un bien correspondant est disponible.'; }
    var set = function (id, v) { var e = document.getElementById(id); if (e && v) e.value = v; };
    set('critType', pre.type); set('critVilles', pre.villes); set('critBudget', pre.budget); set('critSurface', pre.surface);
    var m = document.getElementById('contactMessage');
    if (m && !m.value) m.value = 'Bonjour, je souhaite être prévenu(e) en priorité dès qu\'un bien correspondant à mes critères est disponible' + (pre.chambres ? ' (au moins ' + pre.chambres + ' chambre(s))' : '') + '.';
    var f = document.getElementById('contactCriteres'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);
}

// --- Parrainage ---
async function submitParrainage(e) {
  if (e) e.preventDefault();
  var val = function (id) { return ((document.getElementById(id) || {}).value || '').trim(); };
  var parNom = val('parNom'), parTel = val('parTel'), parEmail = val('parEmail'), proNom = val('proNom'), proTel = val('proTel');
  if (!parNom || !parTel || !parEmail || !proNom || !proTel) { showToast('Merci de remplir les champs obligatoires.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parEmail)) { showToast('E-mail invalide.', 'error'); return; }
  if (!(document.getElementById('parAccord') || {}).checked) { showToast('Merci de confirmer l\'accord du propriétaire.', 'error'); return; }
  if (!formsActifs()) return;
  var btn = document.getElementById('parSubmit');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours...'; }
  try {
    var res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: AGENCE.web3formsKey,
        subject: 'Parrainage depuis votre site - ' + parNom + ' recommande ' + proNom,
        name: parNom, email: parEmail, phone: parTel,
        proprietaire_nom: proNom, proprietaire_telephone: proTel,
        commune_du_bien: val('proVille') || '—', type_de_bien: val('proType') || '—',
        message: val('parMessage') || '—', accord_proprietaire: 'Oui'
      })
    });
    var data = await res.json();
    if (data.success) {
      showToast('Merci ! Votre recommandation est bien envoyée, nous contactons le propriétaire rapidement.', 'success', 6000);
      var f = document.getElementById('parrainageForm'); if (f) f.reset();
    } else showToast("Erreur d'envoi." + contactDirect(), 'error', 6000);
  } catch (err) {
    showToast('Erreur réseau.' + contactDirect(), 'error', 6000);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Envoyer ma recommandation'; }
  }
}

// --- Divers ---
function voirAvis() {
  showPage('home');
  setTimeout(function () { var a = document.getElementById('avis'); if (a) window.scrollTo({ top: a.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); }, 500);
}
document.addEventListener('DOMContentLoaded', function () {
  if (PARRAINAGE_PRIME) { var p = document.getElementById('parrainagePrime'); if (p) { p.textContent = PARRAINAGE_PRIME; p.classList.remove('is-text'); } }
  favMajUI();
});

// ===== PAGE OUTILS =====
/* ===================================================================
   PAGE OUTILS — simulateurs immobiliers (vanilla JS, sans dépendance)
   Portage de fiche-bien-sabolien/src/lib/simulators.ts (+ UI simulators.tsx).
   Tout est encapsulé dans une IIFE ; seuls window.outils_open et
   window.outils_math (fonctions de calcul pures, pour tests/debug) sont exposés.
   =================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  1. CALCULS (fonctions pures)                                       */
  /* ------------------------------------------------------------------ */

  /** Taux d'endettement maximal recommandé (HCSF), assurance incluse. */
  var MAX_DEBT_RATIO = 0.35;

  /** Mensualité d'un prêt amortissable (hors assurance). Taux annuel en %. */
  function monthlyPayment(capital, ratePct, years) {
    var n = Math.round(years * 12);
    if (capital <= 0 || n <= 0) return 0;
    var r = ratePct / 100 / 12;
    if (r === 0) return capital / n;
    return (capital * r) / (1 - Math.pow(1 + r, -n));
  }

  /** Capital empruntable pour une mensualité donnée (assurance incluse dans la mensualité). */
  function borrowableCapital(monthly, ratePct, years, insurancePct) {
    var n = Math.round(years * 12);
    if (monthly <= 0 || n <= 0) return 0;
    var r = ratePct / 100 / 12;
    var annuityFactor = r === 0 ? 1 / n : r / (1 - Math.pow(1 + r, -n));
    return monthly / (annuityFactor + insurancePct / 100 / 12);
  }

  /** Nombre de mois pour rembourser `capital` avec une mensualité donnée (hors assurance). null si impossible. */
  function repaymentMonths(capital, ratePct, monthly) {
    if (capital <= 0 || monthly <= 0) return null;
    var r = ratePct / 100 / 12;
    // -1e-9 : évite qu'un arrondi flottant (ex. 240,0000001) ajoute un mois fantôme
    if (r === 0) return Math.ceil(capital / monthly - 1e-9);
    if (monthly <= capital * r) return null; // la mensualité ne couvre même pas les intérêts
    return Math.ceil(-Math.log(1 - (capital * r) / monthly) / Math.log(1 + r) - 1e-9);
  }

  /**
   * Ajout par rapport à la version Next : coût exact en tenant compte de la
   * dernière échéance (plus faible que les autres). Retourne null si impossible.
   */
  function repaymentSchedule(capital, ratePct, monthly) {
    var months = repaymentMonths(capital, ratePct, monthly);
    if (months === null) return null;
    var r = ratePct / 100 / 12;
    var k = months - 1; // échéances pleines
    var last;
    if (r === 0) {
      last = capital - monthly * k;
    } else {
      var g = Math.pow(1 + r, k);
      last = (capital * g - (monthly * (g - 1)) / r) * (1 + r); // capital restant dû + intérêts du dernier mois
    }
    var total = monthly * k + last;
    return { months: months, lastPayment: last, total: total, interest: Math.max(0, total - capital) };
  }

  /* ----------------------------- Frais de notaire ---------------------------- */

  /*
   * Taux départemental des droits de mutation (DMTO) — situation au 1er juin 2026.
   * Loi de finances 2025 (art. 1594 D CGI) : les départements peuvent porter leur
   * taux de 4,50 % à 5 % pour les actes signés du 1er avril 2025 au 31 mars 2028,
   * SAUF pour les primo-accédants achetant leur résidence principale (restent au
   * taux antérieur, 4,50 % au plus).
   * Sources : WebLex (27/04/2026 et 12/06/2026), JeChange (21/09/2026).
   *  - 5 %    : tous les départements non listés ci-dessous (dont Loire-Atlantique 44).
   *  - 4,50 % : 05, 06, 07, 16, 26, 48, 60, 65, 71, Guadeloupe (971), Mayotte (976).
   *  - 3,80 % : Indre (36).
   * HYPOTHÈSE : les sources comptent 88 départements à 5 %, ce tableau en compte 89 ;
   * l'écart (1 département) n'a pas pu être identifié. Vérifier sur impots.gouv.fr
   * (« Taux des droits d'enregistrement ») lors de chaque mise à jour annuelle (1er juin).
   */
  var DEFAULT_DEPT_RATE = 5;
  var DEPT_RATE_EXCEPTIONS = {
    '05': 4.5, '06': 4.5, '07': 4.5, '16': 4.5, '26': 4.5, '48': 4.5,
    '60': 4.5, '65': 4.5, '71': 4.5, '971': 4.5, '976': 4.5,
    '36': 3.8
  };
  /* Taux réduit voté pour les primo-accédants (WebLex 12/06/2026 : seule la Savoie, 4 %). */
  var DEPT_PRIMO_RATES = { '73': 4 };
  var PRIMO_MAX_RATE = 4.5;

  var DEPARTMENTS = [
    ['01', 'Ain'], ['02', 'Aisne'], ['03', 'Allier'], ['04', 'Alpes-de-Haute-Provence'], ['05', 'Hautes-Alpes'],
    ['06', 'Alpes-Maritimes'], ['07', 'Ardèche'], ['08', 'Ardennes'], ['09', 'Ariège'], ['10', 'Aube'],
    ['11', 'Aude'], ['12', 'Aveyron'], ['13', 'Bouches-du-Rhône'], ['14', 'Calvados'], ['15', 'Cantal'],
    ['16', 'Charente'], ['17', 'Charente-Maritime'], ['18', 'Cher'], ['19', 'Corrèze'], ['2A', 'Corse-du-Sud'],
    ['2B', 'Haute-Corse'], ['21', "Côte-d'Or"], ['22', "Côtes-d'Armor"], ['23', 'Creuse'], ['24', 'Dordogne'],
    ['25', 'Doubs'], ['26', 'Drôme'], ['27', 'Eure'], ['28', 'Eure-et-Loir'], ['29', 'Finistère'],
    ['30', 'Gard'], ['31', 'Haute-Garonne'], ['32', 'Gers'], ['33', 'Gironde'], ['34', 'Hérault'],
    ['35', 'Ille-et-Vilaine'], ['36', 'Indre'], ['37', 'Indre-et-Loire'], ['38', 'Isère'], ['39', 'Jura'],
    ['40', 'Landes'], ['41', 'Loir-et-Cher'], ['42', 'Loire'], ['43', 'Haute-Loire'], ['44', 'Loire-Atlantique'],
    ['45', 'Loiret'], ['46', 'Lot'], ['47', 'Lot-et-Garonne'], ['48', 'Lozère'], ['49', 'Maine-et-Loire'],
    ['50', 'Manche'], ['51', 'Marne'], ['52', 'Haute-Marne'], ['53', 'Mayenne'], ['54', 'Meurthe-et-Moselle'],
    ['55', 'Meuse'], ['56', 'Morbihan'], ['57', 'Moselle'], ['58', 'Nièvre'], ['59', 'Nord'],
    ['60', 'Oise'], ['61', 'Orne'], ['62', 'Pas-de-Calais'], ['63', 'Puy-de-Dôme'], ['64', 'Pyrénées-Atlantiques'],
    ['65', 'Hautes-Pyrénées'], ['66', 'Pyrénées-Orientales'], ['67', 'Bas-Rhin'], ['68', 'Haut-Rhin'], ['69', 'Rhône'],
    ['70', 'Haute-Saône'], ['71', 'Saône-et-Loire'], ['72', 'Sarthe'], ['73', 'Savoie'], ['74', 'Haute-Savoie'],
    ['75', 'Paris'], ['76', 'Seine-Maritime'], ['77', 'Seine-et-Marne'], ['78', 'Yvelines'], ['79', 'Deux-Sèvres'],
    ['80', 'Somme'], ['81', 'Tarn'], ['82', 'Tarn-et-Garonne'], ['83', 'Var'], ['84', 'Vaucluse'],
    ['85', 'Vendée'], ['86', 'Vienne'], ['87', 'Haute-Vienne'], ['88', 'Vosges'], ['89', 'Yonne'],
    ['90', 'Territoire de Belfort'], ['91', 'Essonne'], ['92', 'Hauts-de-Seine'], ['93', 'Seine-Saint-Denis'], ['94', 'Val-de-Marne'],
    ['95', "Val-d'Oise"], ['971', 'Guadeloupe'], ['972', 'Martinique'], ['973', 'Guyane'], ['974', 'La Réunion'],
    ['976', 'Mayotte']
  ];

  function deptInfo(code) {
    return {
      rate: Object.prototype.hasOwnProperty.call(DEPT_RATE_EXCEPTIONS, code) ? DEPT_RATE_EXCEPTIONS[code] : DEFAULT_DEPT_RATE,
      primoRate: Object.prototype.hasOwnProperty.call(DEPT_PRIMO_RATES, code) ? DEPT_PRIMO_RATES[code] : null
    };
  }

  var COMMUNAL_RATE = 1.2;      // taxe communale, %
  var COLLECTION_FEE = 0.0237;  // frais d'assiette et de recouvrement : 2,37 % de la part départementale
  var NEW_BUILD_RATE = 0.715;   // neuf (VEFA) : taxe de publicité foncière réduite, %
  var DISBURSEMENTS = 1200;     // débours et formalités : forfait estimatif
  var VAT = 1.2;                // TVA 20 % sur les émoluments
  /** Émoluments proportionnels du notaire (tranches HT, barème en vigueur depuis 2021), TVA en sus. */
  var FEE_BRACKETS = [
    [6500, 3.87],
    [17000, 1.596],
    [60000, 1.064],
    [Infinity, 0.799]
  ];

  /**
   * o = { price, isNew, deptRate, firstTimeBuyer, primoRate? }
   * Ex. 44, ancien, non primo : 5 + 1,2 + 5 × 2,37 % = 6,3185 % de droits de mutation.
   *     44, ancien, primo      : 4,5 + 1,2 + 4,5 × 2,37 % = 5,80665 %.
   */
  function notaryFees(o) {
    var price = o.price;
    if (!(price > 0)) return { duties: 0, fees: 0, csi: 0, disbursements: 0, total: 0, pct: 0, dutiesRate: 0 };
    var cap = o.primoRate != null ? o.primoRate : PRIMO_MAX_RATE;
    var dept = o.firstTimeBuyer ? Math.min(o.deptRate, cap) : o.deptRate;
    var dutiesRate = o.isNew ? NEW_BUILD_RATE : dept + COMMUNAL_RATE + dept * COLLECTION_FEE;
    var duties = (price * dutiesRate) / 100;

    var feesHT = 0;
    var lower = 0;
    for (var i = 0; i < FEE_BRACKETS.length; i++) {
      var upper = FEE_BRACKETS[i][0];
      var rate = FEE_BRACKETS[i][1];
      if (price <= lower) break;
      feesHT += ((Math.min(price, upper) - lower) * rate) / 100;
      lower = upper;
    }
    var fees = feesHT * VAT;
    var csi = Math.max(15, price * 0.001); // contribution de sécurité immobilière : 0,10 %, minimum 15 €
    var total = duties + fees + csi + DISBURSEMENTS;
    return { duties: duties, fees: fees, csi: csi, disbursements: DISBURSEMENTS, total: total, pct: (total / price) * 100, dutiesRate: dutiesRate };
  }

  /** Prix de bien finançable avec un budget total, frais de notaire (ancien) déduits. */
  function priceFromBudget(budget, deptRate, firstTimeBuyer, primoRate) {
    if (budget <= 0) return 0;
    var lo = 0;
    var hi = budget;
    for (var i = 0; i < 40; i++) {
      var mid = (lo + hi) / 2;
      var cost = mid + notaryFees({ price: mid, isNew: false, deptRate: deptRate, firstTimeBuyer: firstTimeBuyer, primoRate: primoRate }).total;
      if (cost > budget) hi = mid;
      else lo = mid;
    }
    return lo;
  }

  /* ------------------------- Saisie & formatage fr-FR ------------------------ */

  /**
   * Lit un nombre saisi « à la française » : "1 234,5" / "1234.5" / "250.000" (si montant).
   * Retourne null si vide, NaN si illisible.
   */
  function parseNum(raw, isMoney) {
    var s = String(raw == null ? '' : raw).replace(/[\s   ']/g, '').replace(/[€%]/g, '');
    if (s === '') return null;
    if (s.indexOf(',') !== -1) s = s.replace(/\./g, '').replace(',', '.');
    else if (isMoney && /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  var NNBSP = ' '; // espace fine insécable (séparateur de milliers fr-FR)
  var NBSP = ' ';

  function fmtInt(n) {
    var v = Math.round(Math.abs(n));
    var s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
    return (n < 0 && v !== 0 ? '-' : '') + s;
  }
  function eur(n) { return (typeof n === 'number' && isFinite(n)) ? fmtInt(n) + NBSP + '€' : '—'; }
  function pct(n, digits) { return n.toFixed(digits).replace('.', ',') + NBSP + '%'; }
  function fmtDec(n) { return String(Math.round(n * 1000) / 1000).replace('.', ','); }
  function durationLabel(months) {
    var y = Math.floor(months / 12), m = months % 12, parts = [];
    if (y) parts.push(y + NBSP + (y > 1 ? 'ans' : 'an'));
    if (m) parts.push(m + NBSP + 'mois');
    return parts.join(' ') || '0' + NBSP + 'mois';
  }

  window.outils_math = {
    MAX_DEBT_RATIO: MAX_DEBT_RATIO,
    monthlyPayment: monthlyPayment,
    borrowableCapital: borrowableCapital,
    repaymentMonths: repaymentMonths,
    repaymentSchedule: repaymentSchedule,
    notaryFees: notaryFees,
    priceFromBudget: priceFromBudget,
    deptInfo: deptInfo,
    DEPARTMENTS: DEPARTMENTS,
    parseNum: parseNum,
    eur: eur
  };

  /* ------------------------------------------------------------------ */
  /*  2. INTERFACE                                                       */
  /* ------------------------------------------------------------------ */

  var HOME_DEPT = '49'; // Maine-et-Loire : département par défaut + base du budget d'achat
  var NAV_OFFSET = 100; // hauteur de la nav fixe (~84 px) + marge
  var root = null;
  var isNew = false;

  function $(id) { return document.getElementById(id); }
  /* N'écrit que si le texte change (évite des annonces aria-live inutiles). */
  function setText(key, txt) { var el = $('outils-o-' + key); if (el && el.textContent !== txt) el.textContent = txt; }
  function dash(keys) { for (var i = 0; i < keys.length; i++) setText(keys[i], '—'); }
  function setWarn(resId, on) { var el = $(resId); if (el) el.classList[on ? 'add' : 'remove']('is-warn'); }

  /** Lit et valide un champ. { ok, v } ; marque aria-invalid si la saisie est illisible / négative / hors bornes. */
  function readField(id) {
    var el = $(id);
    if (!el) return { ok: false };
    var v = parseNum(el.value, el.getAttribute('data-money') === '1');
    var max = parseFloat(el.getAttribute('data-max'));
    var res;
    if (v === null) res = el.getAttribute('data-req') === '1' ? { ok: false, empty: true } : { ok: true, v: 0 };
    else if (isNaN(v) || v < 0 || (!isNaN(max) && v > max)) res = { ok: false };
    else if (v === 0 && el.getAttribute('data-pos') === '1') res = { ok: false, empty: true };
    else res = { ok: true, v: v };
    if (res.ok || res.empty) el.removeAttribute('aria-invalid');
    else el.setAttribute('aria-invalid', 'true');
    return res;
  }
  function allOk(list) { for (var i = 0; i < list.length; i++) if (!list[i].ok) return false; return true; }
  var MSG_FILL = 'Complétez les champs (montants positifs) pour afficher le résultat.';

  /* a. Capacité d'emprunt */
  function calcCapacite() {
    var inc = readField('outils-cap-revenus');
    var ch = readField('outils-cap-charges');
    var ap = readField('outils-cap-apport');
    var rt = readField('outils-cap-taux');
    var ins = readField('outils-cap-assurance');
    var years = parseFloat(($('outils-cap-duree') || {}).value);
    var keys = ['cap-main', 'cap-mens', 'cap-emprunt', 'cap-apport', 'cap-frais', 'cap-enveloppe'];
    if (!allOk([inc, ch, ap, rt, ins]) || !(years > 0)) {
      dash(keys); setText('cap-hint', MSG_FILL); setWarn('outils-res-capacite', false); return;
    }
    var maxMonthly = inc.v * MAX_DEBT_RATIO - ch.v;
    if (maxMonthly <= 0) {
      dash(keys);
      setText('cap-hint', 'Vos charges atteignent déjà 35 % de vos revenus : pas de capacité d’emprunt supplémentaire en l’état.');
      setWarn('outils-res-capacite', true);
      return;
    }
    var capital = borrowableCapital(maxMonthly, rt.v, years, ins.v);
    var budget = capital + ap.v;
    var d = deptInfo(HOME_DEPT);
    var price = priceFromBudget(budget, d.rate, false, d.primoRate);
    setWarn('outils-res-capacite', false);
    setText('cap-main', eur(price));
    setText('cap-hint', 'Prix du bien envisageable, frais de notaire déduits (ancien, Maine-et-Loire).');
    setText('cap-mens', eur(maxMonthly));
    setText('cap-emprunt', eur(capital));
    setText('cap-apport', eur(ap.v));
    setText('cap-frais', eur(budget - price));
    setText('cap-enveloppe', eur(budget));
  }

  /* b. Frais de notaire */
  function calcNotaire() {
    var p = readField('outils-not-prix');
    var sel = $('outils-not-dept');
    var primoBox = $('outils-not-primo');
    var primoWrap = $('outils-not-primo-wrap');
    if (primoWrap) primoWrap.hidden = isNew;
    setText('not-dlabel', isNew ? 'Taxe de publicité foncière' : 'Droits de mutation');
    if (!p.ok || !sel) {
      dash(['not-main', 'not-droits', 'not-emol', 'not-debours', 'not-csi', 'not-cout']);
      setText('not-hint', MSG_FILL);
      return;
    }
    var d = deptInfo(sel.value || HOME_DEPT);
    var r = notaryFees({
      price: p.v,
      isNew: isNew,
      deptRate: d.rate,
      firstTimeBuyer: !isNew && !!(primoBox && primoBox.checked),
      primoRate: d.primoRate
    });
    setText('not-main', eur(r.total));
    setText('not-hint', 'soit ' + pct(r.pct, 1) + ' du prix du bien');
    setText('not-dlabel', isNew
      ? 'Taxe de publicité foncière (' + fmtDec(r.dutiesRate) + NBSP + '%)'
      : 'Droits de mutation (' + pct(r.dutiesRate, 2) + ')');
    setText('not-droits', eur(r.duties));
    setText('not-emol', eur(r.fees));
    setText('not-debours', eur(r.disbursements));
    setText('not-csi', eur(r.csi));
    setText('not-cout', eur(p.v + r.total));
  }

  /* c. Mensualité */
  function calcMensualite() {
    var c = readField('outils-men-montant');
    var rt = readField('outils-men-taux');
    var ins = readField('outils-men-assurance');
    var years = parseFloat(($('outils-men-duree') || {}).value);
    if (!allOk([c, rt, ins]) || !(years > 0)) {
      dash(['men-main', 'men-hors', 'men-ass', 'men-int', 'men-cass', 'men-cout']);
      setText('men-hint', MSG_FILL);
      return;
    }
    var n = Math.round(years * 12);
    var m = monthlyPayment(c.v, rt.v, years);
    var insM = (c.v * ins.v) / 100 / 12;
    var interest = Math.max(0, m * n - c.v);
    var insTotal = insM * n;
    setText('men-main', eur(m + insM));
    setText('men-hint', 'pendant ' + n + NBSP + 'mois (' + years + NBSP + 'ans)');
    setText('men-hors', eur(m));
    setText('men-ass', eur(insM));
    setText('men-int', eur(interest));
    setText('men-cass', eur(insTotal));
    setText('men-cout', eur(interest + insTotal));
  }

  /* d. Durée de remboursement */
  function calcDuree() {
    var c = readField('outils-dur-montant');
    var rt = readField('outils-dur-taux');
    var mm = readField('outils-dur-mens');
    var keys = ['dur-main', 'dur-last', 'dur-total', 'dur-int'];
    if (!allOk([c, rt, mm])) {
      dash(keys); setText('dur-hint', MSG_FILL); setWarn('outils-res-duree', false); return;
    }
    var s = repaymentSchedule(c.v, rt.v, mm.v);
    if (s === null) {
      var minInterest = (c.v * rt.v) / 100 / 12;
      dash(keys);
      setText('dur-main', 'Impossible');
      setText('dur-hint', 'Cette mensualité ne couvre pas les intérêts du premier mois (' + eur(minInterest) +
        ') : le capital ne diminuerait jamais. Visez une mensualité supérieure à ' + eur(minInterest) + '.');
      setWarn('outils-res-duree', true);
      return;
    }
    var hint = s.months + NBSP + 'mensualités';
    if (s.months > 300) hint += ' : au-delà de 25 ans, les banques prêtent rarement pour une résidence principale.';
    setWarn('outils-res-duree', s.months > 300);
    setText('dur-main', durationLabel(s.months));
    setText('dur-hint', hint);
    setText('dur-last', eur(s.lastPayment));
    setText('dur-total', eur(s.total));
    setText('dur-int', eur(s.interest));
  }

  function recalc() {
    calcCapacite();
    calcNotaire();
    calcMensualite();
    calcDuree();
  }

  /* Reformate proprement à la sortie du champ : "250000" → "250 000", "3.5" → "3,5". */
  function reformat(e) {
    var el = e.target;
    if (!el || el.tagName !== 'INPUT' || el.type !== 'text') return;
    var isMoney = el.getAttribute('data-money') === '1';
    var v = parseNum(el.value, isMoney);
    if (v === null || isNaN(v) || v < 0) return;
    el.value = isMoney ? fmtInt(v) : fmtDec(v);
  }

  /* Remplit les listes déroulantes (départements, durées). */
  function fillSelects() {
    var dept = $('outils-not-dept');
    if (dept && !dept.options.length) {
      for (var i = 0; i < DEPARTMENTS.length; i++) {
        var o = document.createElement('option');
        o.value = DEPARTMENTS[i][0];
        o.textContent = DEPARTMENTS[i][0] + ' – ' + DEPARTMENTS[i][1];
        if (o.value === HOME_DEPT) o.selected = true;
        dept.appendChild(o);
      }
    }
    var ranged = root.querySelectorAll('select[data-range]');
    for (var j = 0; j < ranged.length; j++) {
      var sel = ranged[j];
      if (sel.options.length) continue;
      var bounds = sel.getAttribute('data-range').split(',');
      var def = sel.getAttribute('data-default');
      for (var y = parseInt(bounds[0], 10); y <= parseInt(bounds[1], 10); y++) {
        var op = document.createElement('option');
        op.value = String(y);
        op.textContent = y + ' ans';
        if (String(y) === def) op.selected = true;
        sel.appendChild(op);
      }
    }
  }

  /* ---------------------------- Accordéon ---------------------------- */
  function items() { return root.querySelectorAll('.outils-item'); }
  function setItem(item, open) {
    var btn = item.querySelector('.outils-trigger');
    if (open) item.classList.add('is-open'); else item.classList.remove('is-open');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function ensureVisible(item) {
    // après l'animation (le panneau précédent se replie et décale la page)
    setTimeout(function () {
      if (!item.offsetParent) return; // page non affichée
      var top = item.getBoundingClientRect().top;
      if (top < NAV_OFFSET || top > window.innerHeight * 0.6) {
        try { window.scrollBy({ top: top - NAV_OFFSET, behavior: 'smooth' }); }
        catch (err) { window.scrollBy(0, top - NAV_OFFSET); }
      }
    }, 380);
  }
  function openItem(item, scroll) {
    var all = items();
    for (var i = 0; i < all.length; i++) setItem(all[i], all[i] === item);
    if (scroll) ensureVisible(item);
  }
  function toggleItem(btn) {
    var item = btn.closest('.outils-item');
    if (!item) return;
    if (item.classList.contains('is-open')) setItem(item, false);
    else openItem(item, true);
  }
  /* Flèches haut/bas, Début/Fin entre les en-têtes (motif accordéon WAI-ARIA). */
  function accKeys(e) {
    var t = e.target;
    if (!t.classList || !t.classList.contains('outils-trigger')) return;
    var btns = root.querySelectorAll('.outils-trigger');
    var idx = Array.prototype.indexOf.call(btns, t);
    var next = -1;
    if (e.key === 'ArrowDown') next = (idx + 1) % btns.length;
    else if (e.key === 'ArrowUp') next = (idx - 1 + btns.length) % btns.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = btns.length - 1;
    if (next > -1) { e.preventDefault(); btns[next].focus(); }
  }

  /** API publique : ouvre un simulateur ('capacite' | 'notaire' | 'mensualite' | 'duree'). */
  window.outils_open = function (key) {
    if (!root) init();
    if (!root) return;
    var item = root.querySelector('.outils-item[data-key="' + key + '"]');
    if (item) openItem(item, true);
  };

  function init() {
    root = $('page-outils');
    if (!root || root.getAttribute('data-outils-ready') === '1') return;
    root.setAttribute('data-outils-ready', '1');
    fillSelects();

    root.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('.outils-trigger, .outils-seg button') : null;
      if (!t || !root.contains(t)) return;
      if (t.classList.contains('outils-trigger')) { toggleItem(t); return; }
      isNew = t.getAttribute('data-neuf') === '1';
      var seg = t.parentNode.querySelectorAll('button');
      for (var i = 0; i < seg.length; i++) seg[i].setAttribute('aria-pressed', seg[i] === t ? 'true' : 'false');
      calcNotaire();
    });
    root.addEventListener('input', recalc);
    root.addEventListener('change', recalc);
    root.addEventListener('focusout', reformat);
    root.addEventListener('keydown', accKeys);
    recalc();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// ===== Critères de recherche détectés dans l'annonce (idée reprise du site Sabolien) =====
// Indicatif : une annonce qui ne mentionne pas un équipement n'est pas retenue pour ce critère.
var filterFeatures = [];
var BIEN_FEATURES = [
  { key: 'plain-pied', label: 'Plain-pied', test: function (b, t) { return /plain[- ]pied/.test(t); } },
  { key: 'a-renover', label: 'À rénover', test: function (b, t) { return /à rénover|a renover|à rafraîchir|travaux à prévoir|à restaurer|à réhabiliter/.test(t); } },
  { key: 'grand-terrain', label: 'Grand terrain', test: function (b) { return (parseInt(b.terrain) || 0) >= 1000; } },
  { key: 'jardin', label: 'Jardin', test: function (b, t) { return /jardin/.test(t) || (b.type === 'Maison' && (parseInt(b.terrain) || 0) >= 200); } },
  { key: 'terrasse', label: 'Terrasse / balcon', test: function (b, t) { return /terrasse|balcon|loggia/.test(t); } },
  { key: 'piscine', label: 'Piscine', test: function (b, t) { return /piscine/.test(t); } },
  { key: 'tram', label: 'Proche tram', test: function (b, t) { return /tram/.test(t); } },
  { key: 'gare', label: 'Proche gare', test: function (b, t) { return /gare/.test(t); } },
  { key: 'belle-vue', label: 'Belle vue', test: function (b, t) { return /belle vue|vue dégagée|vue imprenable|vue panoramique|sans vis-à-vis|vue sur la maine|vue sur le château|vue sur la loire/.test(t); } },
  { key: 'caractere', label: 'Tuffeau / caractère', test: function (b, t) { return /tuffeau|moulures|parquet|cachet|caractère|haussmann/.test(t); } },
  { key: 'cheminee', label: 'Cheminée / poêle', test: function (b, t) { return /chemin[ée]e|poêle|poele|insert/.test(t); } },
  { key: 'cave', label: 'Cave / sous-sol', test: function (b, t) { return /\bcave\b|sous-sol|cellier/.test(t); } },
  { key: 'garage', label: 'Garage / parking', test: function (b, t) { return /garage|parking|stationnement|\bbox\b|carport/.test(t); } },
  { key: 'ascenseur', label: 'Ascenseur', test: function (b, t) { return /ascenseur/.test(t); } },
  { key: 'gardien', label: 'Gardien', test: function (b, t) { return /gardien|concierge/.test(t); } }
];
function bienFeatures(b) {
  if (b._feat) return b._feat;
  var t = [b.titre, b.accroche, b.description, b.desc].join(' ').toLowerCase();
  b._feat = BIEN_FEATURES.filter(function (f) { try { return f.test(b, t); } catch (e) { return false; } }).map(function (f) { return f.key; });
  return b._feat;
}
function renderFeatChips() {
  var box = document.getElementById('featChips'); if (!box || typeof biens === 'undefined') return;
  var actifs = biens.filter(function (b) { return b.statut !== 'vendu'; });
  box.classList.toggle('is-open', !!window._featOpen);
  if (typeof _majCurseur === 'function') _majCurseur();
  var _sb = document.querySelector('#page-biens .search-bar');
  if (_sb) _sb.classList.toggle('plus-ouvert', !!window._featOpen || !!(filterBudgetMin || filterSurfaceMin || filterChambresMin || filterTerrainMin || filterRef));
  var nbOn = filterFeatures.length;
  var toggle = '<button type="button" class="feat-toggle" onclick="window._featOpen=!window._featOpen;renderFeatChips();" aria-expanded="' + !!window._featOpen + '">' +
    (window._featOpen ? 'Masquer les critères' : '+ Plus de critères' + (nbOn ? ' (' + nbOn + ' choisi' + (nbOn > 1 ? 's' : '') + ')' : '')) + '</button>';
  box.innerHTML = toggle + BIEN_FEATURES.map(function (f) {
    var n = actifs.filter(function (b) { return bienFeatures(b).indexOf(f.key) !== -1; }).length;
    var on = filterFeatures.indexOf(f.key) !== -1;
    return '<button type="button" class="feat-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + (n || on ? '' : ' disabled') +
      ' onclick="toggleFeature(\'' + f.key + '\')">' + f.label + ' <span>' + n + '</span></button>';
  }).join('') + (filterFeatures.length ? '<button type="button" class="feat-reset" onclick="filterFeatures=[];renderFeatChips();renderBiensGrid();">Effacer les critères</button>' : '');
}
function toggleFeature(k) {
  var i = filterFeatures.indexOf(k);
  if (i === -1) filterFeatures.push(k); else filterFeatures.splice(i, 1);
  renderFeatChips(); renderBiensGrid();
}

// ===== Fiche : points clés, carte du secteur, Géorisques, boutons, barre mobile =====
var _ficheMap = null;
// ===== Fiche annonce : calculette de mensualités + commodités à proximité (audit La Cabane) =====
var _calcPrix = 0;
function _ficheCalculetteHTML(prix) {
  _calcPrix = prix;
  var apport = Math.round(prix * 0.1 / 1000) * 1000;
  return '<div class="fiche-bloc fiche-calc"><h3>Calculez vos mensualités</h3>' +
    '<div class="fiche-calc-grid">' +
      '<label>Apport personnel (€)<input type="number" id="calcApport" min="0" step="1000" value="' + apport + '" oninput="_ficheCalculer()"></label>' +
      '<label>Durée du prêt<select id="calcDuree" onchange="_ficheCalculer()"><option value="15">15 ans</option><option value="20">20 ans</option><option value="25" selected>25 ans</option></select></label>' +
      '<label>Taux du prêt (%)<input type="number" id="calcTaux" min="0" max="10" step="0.05" value="3.5" oninput="_ficheCalculer()"></label>' +
    '</div>' +
    '<div class="fiche-calc-res" aria-live="polite"><span>Mensualité estimée</span><strong id="calcMens">—</strong><small id="calcDetail"></small></div>' +
    '<p class="fiche-note">Estimation indicative, hors assurance emprunteur : frais de notaire d\'un bien ancien estimés à 7,5 % et financés. Ajustez le taux selon votre banque. ' +
    '<a href="#outils" onclick="showPage(\'outils\');return false;">Simulation détaillée</a></p></div>';
}
function _ficheCalculer() {
  var a = document.getElementById('calcApport'); if (!a || !_calcPrix) return;
  var apport = Math.max(0, parseFloat(a.value) || 0);
  var n = (parseInt(document.getElementById('calcDuree').value) || 25) * 12;
  var t = Math.max(0, parseFloat(document.getElementById('calcTaux').value) || 0) / 100 / 12;
  var notaire = Math.round(_calcPrix * 0.075);
  var capital = Math.max(0, _calcPrix + notaire - apport);
  var m = capital ? (t > 0 ? capital * t / (1 - Math.pow(1 + t, -n)) : capital / n) : 0;
  document.getElementById('calcMens').textContent = Math.round(m).toLocaleString('fr-FR') + ' € / mois';
  document.getElementById('calcDetail').textContent = 'Montant emprunté : ' + Math.round(capital).toLocaleString('fr-FR') + ' € (dont ≈ ' + notaire.toLocaleString('fr-FR') + ' € de frais de notaire)';
}

var _poiData = null, _poiCouches = {};
var POI_CATS = [
  { k: 'ecoles', l: 'Écoles', c: '#2E6FBA' },
  { k: 'commerces', l: 'Commerces', c: '#B8731E' },
  { k: 'sante', l: 'Santé', c: '#1B7A3E' },
  { k: 'transports', l: 'Transports', c: '#021430' },
  { k: 'loisirs', l: 'Parcs et loisirs', c: '#F6A737' }
];
// Commodités pré-calculées par _parts/poi.py (data/poi.json, © contributeurs OpenStreetMap)
function _fichePoi(c, map, ville) {
  var box = document.getElementById('fichePoi'), chips = document.getElementById('fichePoiChips');
  if (!box || !chips) return;
  _poiCouches = {};
  var afficher = function () {
    var d = _poiData && _poiData[ville];
    if (!d || map !== _ficheMap || !document.getElementById('fichePoi')) return;
    var html = '';
    POI_CATS.forEach(function (cat) {
      var pts = d[cat.k] || [];
      if (!pts.length) return;
      var couche = L.layerGroup();
      pts.forEach(function (p) {
        L.circleMarker([p[0], p[1]], { radius: 5, color: '#fff', weight: 1.5, fillColor: cat.c, fillOpacity: .95 })
          .bindTooltip(_esc(p[2] || cat.l)).addTo(couche);
      });
      _poiCouches[cat.k] = couche;
      html += '<button type="button" class="poi-chip" aria-pressed="false" data-k="' + cat.k + '" onclick="_ficheTogglePoi(this)"><i style="background:' + cat.c + '"></i>' + cat.l + ' <b>' + pts.length + '</b></button>';
    });
    if (!html) return;
    chips.innerHTML = html; box.hidden = false;
  };
  if (_poiData) { afficher(); return; }
  fetch('data/poi.json', { cache: 'force-cache' })
    .then(function (r) { if (!r.ok) throw new Error('poi'); return r.json(); })
    .then(function (j) { _poiData = j; afficher(); })
    .catch(function () { _poiData = {}; });
}
function _ficheTogglePoi(btn) {
  var k = btn.getAttribute('data-k'), couche = _poiCouches[k]; if (!couche || !_ficheMap) return;
  var on = btn.getAttribute('aria-pressed') !== 'true';
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  if (on) { couche.addTo(_ficheMap); _ficheMap.setZoom(14); } else { _ficheMap.removeLayer(couche); }
}

function renderFicheExtras(b) {
  var prixNum = parseInt(b.prixFAI || b.prix) || 0, surf = parseFloat(b.surface) || 0;
  var masque = (typeof isPrixMasque === 'function') && isPrixMasque(b);
  var keys = [];
  if (surf) keys.push(['Surface', surf + ' m²']);
  if (b.pieces) keys.push(['Pièces', b.pieces]);
  if (b.chambres) keys.push(['Chambres', b.chambres]);
  if (parseInt(b.terrain)) keys.push(['Terrain', parseInt(b.terrain).toLocaleString('fr-FR') + ' m²']);
  if (!masque && prixNum && surf && !_estLocation(b)) keys.push(['Prix / m²', Math.round(prixNum / surf).toLocaleString('fr-FR') + ' €']);
  var dpe = b.dpeClasse || b.dpe;
  if (dpe && /^[A-G]$/i.test(dpe)) keys.push(['DPE', '<span class="fk-dpe fk-' + dpe.toUpperCase() + '">' + dpe.toUpperCase() + '</span>']);
  var kEl = document.getElementById('ficheKeys');
  if (kEl) kEl.innerHTML = keys.map(function (k) { return '<div class="fk"><span>' + k[0] + '</span><strong>' + k[1] + '</strong></div>'; }).join('');

  var ref = b.ref && String(b.ref).trim() ? String(b.ref).trim() : (typeof genRef === 'function' ? genRef(b.id) : b.id);
  var url = location.origin + location.pathname + '#bien/' + (typeof _slugifyBien === 'function' ? _slugifyBien(b) : ('ref-' + b.id));
  var waTxt = encodeURIComponent('Bonjour, je suis intéressé(e) par le bien réf. ' + ref + ' (' + (b.type || 'bien') + ' à ' + (b.ville || '') + ') : ' + url);
  var mailSubj = encodeURIComponent('Bien réf. ' + ref + ' · ' + (b.type || 'Bien') + ' à ' + (b.ville || ''));
  var ville = b.ville || 'Angers';
  var ex = document.getElementById('ficheExtras');
  if (ex) {
    ex.innerHTML =
      ((!masque && prixNum && !_estLocation(b)) ? _ficheCalculetteHTML(prixNum) : '') +
      '<div class="fiche-bloc">' +
        '<h3>Localisation</h3>' +
        '<p class="fiche-note">Secteur approximatif : ' + _esc(ville) + '. L\'adresse exacte vous est communiquée lors de la visite.</p>' +
        '<div class="fj-autour" id="fjAutour" hidden>' +
          '<div class="fja-onglets" role="group" aria-label="Autour du bien"><button type="button" data-g="services" aria-pressed="true" onclick="_fjaGroupe(\'services\')">Services</button><button type="button" data-g="deplacer" aria-pressed="false" onclick="_fjaGroupe(\'deplacer\')">Se déplacer</button></div>' +
          '<div class="fja-filtres" id="fjaFiltres" role="group" aria-label="Filtrer les lieux"></div>' +
        '</div>' +
        '<div class="fja-grille sans-liste" id="fjaGrille"><div id="ficheMap" class="fiche-map" role="img" aria-label="Secteur approximatif du bien à ' + _esc(ville) + '"></div><ul class="fja-liste" id="fjaListe" aria-live="polite"></ul></div>' +
        '<p class="fiche-note fja-note">Distances à vol d’oiseau depuis le centre du secteur. Lieux : © contributeurs OpenStreetMap.</p>' +
      '</div>' +
      '';
  }
  if (typeof _chargerLeaflet === 'function') {
    _chargerLeaflet(function () {
      var el = document.getElementById('ficheMap'); if (!el || !window.L) return;
      if (_ficheMap) { try { _ficheMap.remove(); } catch (e) {} _ficheMap = null; }
      var c = (b.partenaire && b.lat && b.lng) ? [b.lat, b.lng] : ((typeof VILLE_COORDS !== 'undefined' && VILLE_COORDS[b.ville]) || _coordVille(b.ville, b.id));
      _ficheMap = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView(c, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 17, subdomains: 'abc' }).addTo(_ficheMap);
      L.circle(c, { radius: 900, color: '#021430', weight: 2, fillColor: '#021430', fillOpacity: .12 }).addTo(_ficheMap);
      setTimeout(function () { if (_ficheMap) _ficheMap.invalidateSize(); }, 300);
      _ficheAutour(c, _ficheMap, b);
    });
  }
  _ficheCalculer();
  var mb = document.getElementById('ficheMobilePrix');
  if (mb) mb.textContent = (typeof formatPrixPublic === 'function') ? formatPrixPublic(b) : '';
}
function ficheVisiter() {
  var f = document.querySelector('#page-fiche .fiche-contact-form'); if (!f) return;
  var m = document.getElementById('ficheContactMessage');
  var b = window._bienAffiche || {};
  var ref = b.ref && String(b.ref).trim() ? String(b.ref).trim() : (typeof genRef === 'function' ? genRef(b.id) : '');
  if (m) m.value = 'Bonjour, je souhaite organiser une visite du bien (Réf : ' + ref + '). Voici mes disponibilités : ';
  window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
  setTimeout(function () { var n = f.querySelector('input'); if (n) n.focus({ preventScroll: true }); }, 600);
}
// Le bouton PDF fonctionne même si le module PDF n'est pas encore chargé (repli : impression)
if (typeof window.telechargerFichePDF !== 'function') window.telechargerFichePDF = function () { window.print(); };

// ===== Galerie plein écran : glisser au doigt + plein écran =====
(function () {
  var x0 = null, y0 = null;
  document.addEventListener('touchstart', function (e) {
    var lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('open') || e.touches.length !== 1) return;
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) lightboxNav(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener('click', function (e) {
    var lb = document.getElementById('lightbox');
    if (lb && lb.classList.contains('open') && e.target === lb) closeLightbox();
  });
})();
function lightboxFullscreen() {
  var lb = document.getElementById('lightbox'); if (!lb) return;
  if (document.fullscreenElement) { document.exitFullscreen && document.exitFullscreen(); return; }
  var fn = lb.requestFullscreen || lb.webkitRequestFullscreen;
  if (fn) fn.call(lb);
}


// ===== FICHE PDF (générée dans le navigateur : jsPDF + QR code, photos via wsrv.nl) =====
/* =====================================================================
   FICHE PDF TÉLÉCHARGEABLE — bouton « Télécharger la fiche (PDF) »
   - jsPDF 2.5.1 + qrcode-generator 1.4.4 chargés à la demande (cdnjs)
   - Photos 3G via le proxy CORS wsrv.nl, recadrées en canvas (cover)
   - N'expose que window.telechargerFichePDF()
   ===================================================================== */
(function () {
  'use strict';

  var JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  var QR_URL    = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
  var SITE_BASE = location.origin + location.pathname;
  var ERR_MSG   = 'Le PDF n\'a pas pu être généré, utilisez « Imprimer ».';
  var MAX_PHOTOS = 10;

  var AGENT = {
    nom: 'Charles MOREL',
    role: "Conseiller immobilier · L'Ardoise Immobilière",
    tel: AGENCE.telephone || '', telHref: AGENCE.telephone ? 'tel:' + _telIntl(AGENCE.telephone) : '',
    mail: AGENCE.email || '',
    site: location.hostname && !/^(localhost|127\.)/.test(location.hostname) ? location.hostname : '',
    avatar: 'img/charles-morel-avatar.webp'
  };
  var FOOTER_TXT = "L'Ardoise Immobilière · Charles MOREL, agent commercial du réseau 3G IMMO, EI inscrit au RSAC de Le Mans n° 900 233 800, " +
    "carte professionnelle de la société 3G IMMO (CCI de Haute-Savoie). Document non contractuel, informations données à titre indicatif.";

  // ---- Charte ----
  var NAVY = [2, 20, 48], ACCENT = [220, 7, 29], LIGHT = [245, 246, 249], LINE = [214, 219, 229];
  var GREY = [96, 106, 128], MUTED = [134, 144, 164], WHITE = [255, 255, 255], SUBTLE = [190, 198, 214], BODY = [30, 40, 62];
  var DPE_COL = { A: '#009C6D', B: '#52B153', C: '#78BD76', D: '#F4E70F', E: '#F0B50F', F: '#EB8235', G: '#D7221F' };
  var GES_COL = { A: '#A4DBF8', B: '#8CB4D3', C: '#7792B1', D: '#606F8F', E: '#4D5272', F: '#393551', G: '#2C1A48' };
  var CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  // ---- Géométrie A4 (mm) ----
  var PW = 210, M = 14, CW = PW - 2 * M;
  var BOTTOM = 279;          // limite basse du contenu (pied de page en dessous)
  var GAP = 2.5;             // gouttière entre photos

  var _jspdfP = null, _qrP = null, _busy = false;

  /* ------------------------------------------------------------------ */
  /*  Utilitaires                                                        */
  /* ------------------------------------------------------------------ */
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function num(v) { var n = Number(v); return isFinite(n) && n > 0 ? n : 0; }
  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); }
  function toast(msg, type, ms) { try { if (typeof showToast === 'function') showToast(msg, type, ms); } catch (e) {} }

  // jsPDF + Helvetica standard = encodage WinAnsi (cp1252) : Latin-1 + € ’ “ ” – — … œ • s'affichent bien.
  // Tout le reste (espaces fines, exposants, emojis, puces Unicode…) est converti ou supprimé.
  var CP1252_EXTRA = '€\u201A\u0192\u201E…\u2020\u2021\u02C6\u2030\u0160\u2039Œ\u017D‘’“”•–—\u02DC\u2122\u0161\u203Aœ\u017E\u0178';
  var CHAR_MAP = {
    '\u202F': '\u00A0', '\u2007': '\u00A0', '\u2009': ' ', '\u2002': ' ', '\u2003': ' ', '\u2004': ' ', '\u2005': ' ', '\u2006': ' ',
    '\u2008': ' ', '\u200A': ' ', '\u205F': ' ', '\u3000': ' ', '\t': ' ',
    '\u200B': '', '\u200C': '', '\u200D': '', '\u2060': '', '\uFEFF': '', '\uFE0F': '', '\uFE0E': '', '\u20E3': '', '\u00AD': '',
    '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2212': '-', '\u2043': '-', '\u2015': '—', '\u2032': '\'', '\u2033': '"',
    '\u201B': '’', '\u201F': '”', '\u2264': '<=', '\u2265': '>=', '\u2248': '~', '\u2260': '!=',
    '\u2192': '->', '\u2190': '<-', '\u2194': '<->', '\u21D2': '=>', '\u279C': '->', '\u2794': '->', '\u27A1': '->',
    '\u1D49': 'e', '\u02B3': 'r', '\u1D48': 'd', '\u02E2': 's', '\u1D50': 'm', '\u207F': 'n', '\u1D57': 't', '\u02B0': 'h',
    '\u2070': '0', '\u2074': '4', '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9',
    '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3', '\u2084': '4', '\u2085': '5', '\u2086': '6', '\u2087': '7', '\u2088': '8', '\u2089': '9',
    '\u25CF': '•', '\u25CB': '•', '\u25E6': '•', '\u25AA': '•', '\u25AB': '•', '\u25A0': '•', '\u25A1': '•',
    '\u25C6': '•', '\u25C7': '•', '\u25BA': '•', '\u25B6': '•', '\u2219': '·', '\u22C5': '·',
    '\u2116': 'n°', '\u2103': '°C', '\u33A1': 'm²'
  };
  function okChar(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 0x20 && c <= 0x7E) || (c >= 0xA0 && c <= 0xFF) || c === 10 || CP1252_EXTRA.indexOf(ch) !== -1;
  }
  function san(s) {
    if (s == null) return '';
    s = String(s).replace(/\r\n?/g, '\n');
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), code = s.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF) { i++; continue; }   // emoji / hors BMP : supprimé
      if (code >= 0xDC00 && code <= 0xDFFF) continue;
      if (okChar(ch)) { out += ch; continue; }
      if (Object.prototype.hasOwnProperty.call(CHAR_MAP, ch)) { out += CHAR_MAP[ch]; continue; }
      if ((code >= 0x2300 && code <= 0x23FF) || (code >= 0x2600 && code <= 0x27BF) || (code >= 0x2B00 && code <= 0x2BFF)) continue;
      var base = ch.normalize ? ch.normalize('NFD').replace(/[\u0300-\u036F]/g, '') : '';
      if (base && base.split('').every(okChar)) out += base;   // ex. « \u0151 » -> « o »
    }
    // espaces multiples ; ponctuation haute française et guillemets insécables (pas de « ; » seul en début de ligne)
    return out.replace(/ {2,}/g, ' ').replace(/ ([;:!?»])/g, '\u00A0$1').replace(/« /g, '«\u00A0');
  }
  function slug(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036F]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // ---- Réutilisation des helpers du site (avec repli) ----
  function prixMasque(b) {
    if (typeof isPrixMasque === 'function') return !!isPrixMasque(b);
    return b.statut === 'vendu' || b.statut === 'sous_compromis' || b.statut === 'offre_en_cours';
  }
  function prixPublic(b) {
    if (typeof formatPrixPublic === 'function') return formatPrixPublic(b);
    var p = num(b.prix || b.prixFAI);
    return p ? fmtInt(p) + ' € FAI' : 'Prix sur demande';
  }
  function refAffichee(b) {
    if (b.ref && String(b.ref).trim()) return String(b.ref).trim();
    if (typeof genRef === 'function') return String(genRef(b.id)).replace(/^REF\.\s*/i, '');
    return String(b.id || '');
  }
  function titreBien(b) {
    var t = (b.titre && String(b.titre).trim()) ? String(b.titre).trim() : (b.type || 'Bien') + (b.ville ? ' à ' + b.ville : '');
    return t.replace(/\b1 pièces\b/i, '1 pièce');   // titres 3G : « Appartement 1 pièces »
  }
  // L'accroche 3G contient parfois un simple code numérique (« 41 ») : on l'ignore.
  function accrocheValide(b) {
    var a = String(b.accroche || '').trim();
    return (a.length >= 10 && /[A-Za-zÀ-ÿ]{3,}/.test(a)) ? a : '';
  }
  function urlAnnonce(b) {
    var real = /^https?:$/.test(location.protocol) && !/^(localhost|127\.|\[?::1\]?$|0\.0\.0\.0)/.test(location.hostname);
    if (real && /^#bien\//.test(location.hash || '')) return location.href;
    var base = real ? location.origin + location.pathname : SITE_BASE;
    var s = (typeof _slugifyBien === 'function') ? _slugifyBien(b) : String(b.id || '');
    return base + '#bien/' + s;
  }
  function nomFichier(b) {
    return 'Fiche-' + [slug(b.type || 'Bien'), slug(b.ville), 'ref', slug(refAffichee(b))].filter(Boolean).join('-') + '.pdf';
  }

  /* ------------------------------------------------------------------ */
  /*  Chargement des librairies (une seule fois, promesse en cache)      */
  /* ------------------------------------------------------------------ */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = function () { resolve(); };
      s.onerror = function () { if (s.parentNode) s.parentNode.removeChild(s); reject(new Error('Chargement impossible : ' + src)); };
      document.head.appendChild(s);
    });
  }
  function loadJsPDF() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    if (!_jspdfP) {
      _jspdfP = loadScript(JSPDF_URL).then(function () {
        if (!(window.jspdf && window.jspdf.jsPDF)) throw new Error('jsPDF indisponible');
      }).catch(function (e) { _jspdfP = null; throw e; });
    }
    return _jspdfP;
  }
  function loadQR() {   // facultatif : sans QR, le PDF est quand même généré
    if (typeof window.qrcode === 'function') return Promise.resolve(true);
    if (!_qrP) {
      _qrP = loadScript(QR_URL).then(function () { return typeof window.qrcode === 'function'; })
        .catch(function () { _qrP = null; return false; });
    }
    return _qrP;
  }

  /* ------------------------------------------------------------------ */
  /*  Images : proxy CORS + recadrage canvas                             */
  /* ------------------------------------------------------------------ */
  function proxied(url, w) {
    return 'https://wsrv.nl/?url=' + encodeURIComponent(String(url).replace(/^https?:\/\//, '')) + '&w=' + (w || 1400) + '&output=jpg&q=78';
  }
  function loadImg(src, ms) {
    return new Promise(function (resolve) {
      var img = new Image(), done = false;
      var t = setTimeout(function () { if (!done) { done = true; resolve(null); } }, ms || 15000);
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        if (done) return; done = true; clearTimeout(t);
        resolve((img.naturalWidth || img.width) ? img : null);
      };
      img.onerror = function () { if (done) return; done = true; clearTimeout(t); resolve(null); };
      img.src = src;
    });
  }
  function roundPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  // Recadrage « cover » au ratio exact de la boîte PDF (coins arrondis ou cercle sur fond `bg`).
  // Renvoie un dataURL JPEG, ou null si l'image est inutilisable (canvas « tainted », etc.).
  function cropImg(img, wMm, hMm, opt) {
    opt = opt || {};
    try {
      var k = opt.pxPerMm || 6;
      var cw = Math.max(1, Math.round(wMm * k)), ch = Math.max(1, Math.round(hMm * k));
      var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      var ctx = cv.getContext('2d');
      var bg = opt.bg || WHITE;
      ctx.fillStyle = 'rgb(' + bg.join(',') + ')'; ctx.fillRect(0, 0, cw, ch);
      ctx.save();
      if (opt.shape === 'circle') { ctx.beginPath(); ctx.arc(cw / 2, ch / 2, Math.min(cw, ch) / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip(); }
      else if (opt.radiusMm) { roundPath(ctx, 0, 0, cw, ch, opt.radiusMm * k); ctx.clip(); }
      var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      var s = Math.max(cw / iw, ch / ih), sw = cw / s, sh = ch / s;
      var sx = (iw - sw) / 2, sy = (ih - sh) * (opt.focusY == null ? 0.5 : opt.focusY);
      if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
      ctx.restore();
      return cv.toDataURL('image/jpeg', opt.q || 0.84);
    } catch (e) { return null; }
  }
  // Charge (en parallèle) jusqu'à MAX_PHOTOS photos + le portrait. Les échecs sont ignorés.
  function loadAssets(b) {
    var list = [];
    (b.photos && b.photos.length ? b.photos : [b.img]).forEach(function (u) {
      if (u && typeof u === 'string' && list.indexOf(u) === -1) list.push(u);
    });
    if (!list.length && b.img) list.push(b.img);
    var jobs = list.slice(0, MAX_PHOTOS).map(function (u, i) {
      return loadImg(/^data:/.test(u) ? u : proxied(u, i < 2 ? 1400 : 800), 15000);
    });
    jobs.push(loadImg(AGENT.avatar, 8000));
    return Promise.all(jobs).then(function (imgs) {
      var avatar = imgs.pop();
      return { imgs: imgs.filter(Boolean), avatar: avatar };
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Description : nettoyage + découpage en blocs                       */
  /* ------------------------------------------------------------------ */
  var LEGAL_RE = [/Honoraires de \d/i, /Honoraires à la charge/i, /Consulter le barème/i, /Votre agent commercial/i,
    /Selon l['’]article/i, /Les informations sur les risques/i, /\* ?Prix net/i, /Document non contractuel/i, /RSAC de /i, /Code Monétaire/i];
  function sansMentionsLegales(t) {
    if (typeof _descSplitLegal === 'function') { try { return _descSplitLegal(t).main; } catch (e) {} }
    var start = -1;
    LEGAL_RE.forEach(function (re) { var m = t.search(re); if (m !== -1 && (start === -1 || m < start)) start = m; });
    return start > 0 ? t.substring(0, start).trim() : t;
  }
  // Marqueurs de liste en début de ligne : tirets, puces Unicode, emojis…
  var BULLET_LEAD = /^(?:[\-–—*•\u25CF\u25CB\u25E6\u25AA\u25AB\u25A0\u25A1\u25C6\u25C7\u25BA\u25B6\u27A2\u27A4\u2713\u2714\u2611\u2605\u2756\u2794\u2192·>]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2300-\u23FF\u2600-\u27BF\u2B00-\u2BFF]|[\uFE0F\u200D\u20E3])+\s*/;

  function parseDescription(raw) {
    var t = String(raw || '').replace(/\r\n?/g, '\n').trim();
    if (!t) return [];
    t = sansMentionsLegales(t);
    var blocks = [], blank = true;
    t.split('\n').forEach(function (l) {
      var tr = l.replace(/^[\s\u00A0]+/, '').replace(/\s+$/, '');
      if (!tr) { blank = true; return; }
      var m = tr.match(BULLET_LEAD), isBullet = false, txt = tr;
      // on exige un vrai symbole suivi de texte (« -5 % » n'est pas une puce)
      if (m && m[0].replace(/\s/g, '') && tr.length > m[0].length && !/^[\-–—]\d/.test(tr)) {
        isBullet = true; txt = tr.slice(m[0].length);
      }
      txt = san(txt).trim();
      if (!txt) return;
      blocks.push({ text: txt, bullet: isBullet, blankBefore: blank });
      blank = false;
    });
    for (var i = 0; i < blocks.length; i++) {
      var nx = blocks[i + 1], tx = blocks[i].text;
      var blankAfter = !nx || nx.blankBefore;
      var shortish = tx.length <= 75 && tx.split(/\s+/).length <= 11 && !/[.!?,;…]$/.test(tx);
      blocks[i].heading = !blocks[i].bullet && !!nx && shortish &&
        (/:$/.test(tx) || nx.bullet || (blocks[i].blankBefore && blankAfter && tx.length <= 60));
    }
    return blocks;
  }

  /* ------------------------------------------------------------------ */
  /*  Construction du PDF (synchrone)                                    */
  /* ------------------------------------------------------------------ */
  function buildDoc(b, assets) {
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    var masque = prixMasque(b);
    var ref = refAffichee(b);
    var titre = titreBien(b);
    var url = urlAnnonce(b);
    var imgs = (assets && assets.imgs) || [];

    doc.setProperties({
      title: san('Fiche ' + titre + ' · Réf. ' + ref),
      subject: san('Fiche descriptive : ' + titre),
      author: san(AGENT.nom),
      keywords: san([b.type, b.ville, 'immobilier', 'Angers', "L'Ardoise Immobilière"].filter(Boolean).join(', ')),
      creator: "L'Ardoise Immobilière"
    });

    // --- primitives ---
    function fill(c) { doc.setFillColor(c[0], c[1], c[2]); }
    function stroke(c) { doc.setDrawColor(c[0], c[1], c[2]); }
    function color(c) { doc.setTextColor(c[0], c[1], c[2]); }
    function font(style, size) { doc.setFont('helvetica', style || 'normal'); doc.setFontSize(size); }
    // Largeur réelle : jsPDF mesure AVEC crénage mais dessine SANS, ses métriques Helvetica sont ~1 % trop
    // étroites (550 vs 556) et certains glyphes WinAnsi prennent une largeur par défaut (² = 530 au lieu de 333).
    var WFIX = 1.011;
    var AFM = { '²': 333, '³': 333, '¹': 333, '€': 556, 'œ': 944, 'Œ': 1000, '\u00A0': 278,
      '×': 584, '½': 834, '¼': 834, '¾': 834 };
    function tw(s, cs) {
      s = san(s);
      var ws = doc.getCharWidthsArray(s, { doKerning: false }), u = 0;
      for (var i = 0; i < s.length; i++) u += AFM[s.charAt(i)] ? AFM[s.charAt(i)] / 1000 : ws[i] * WFIX;
      return u * doc.internal.getFontSize() / doc.internal.scaleFactor + (cs ? cs * s.length : 0);
    }
    function txt(s, x, y, o) {
      o = o || {}; s = san(s);
      var w = tw(s, o.cs);
      if (o.align === 'right') x -= w; else if (o.align === 'center') x -= w / 2;
      if (o.cs) doc.text(s, x, y, { charSpace: o.cs }); else doc.text(s, x, y);
      return w;
    }
    function split(s, w) { return doc.splitTextToSize(san(s), w / 1.02); }
    function fitFont(s, maxW, size, min, style, cs) {
      font(style, size);
      while (size > min && tw(s, cs) > maxW) { size -= 0.25; font(style, size); }
    }
    function rich(segs, x, y) {   // segments {t, bold} sur une même ligne
      segs.forEach(function (sg) { font(sg.bold ? 'bold' : 'normal', 8.6); color(NAVY); x += txt(sg.t, x, y); });
    }
    function sectionTitle(label, y) {
      font('bold', 12.5); color(NAVY); txt(label, M, y + 4.6);
      fill(ACCENT); doc.rect(M, y + 7, 12, 0.7, 'F');
      return y + 12;
    }
    function pageHeaderSmall() {
      fill(NAVY); doc.rect(0, 0, PW, 12, 'F');
      fill(ACCENT); doc.rect(0, 12, PW, 0.6, 'F');
      font('bold', 10.5); color(WHITE); txt("L'Ardoise Immobilière", M, 7.8);
      font('normal', 7.2); color(SUBTLE);
      var right = 'Réf. ' + ref + '  ·  ' + titre;
      while (tw(right) > CW - 45 && right.length > 12) right = right.slice(0, -2);
      txt(right, PW - M, 7.6, { align: 'right' });
    }
    function newPage() { doc.addPage(); pageHeaderSmall(); return 20; }
    function ensure(y, h) { return (y + h > BOTTOM) ? newPage() : y; }
    function photo(img, x, y, w, h, k, r) {
      var d = img && cropImg(img, w, h, { pxPerMm: k || 6, radiusMm: r == null ? 1.4 : r, q: k >= 7 ? 0.86 : 0.82 });
      if (d) doc.addImage(d, 'JPEG', x, y, w, h, undefined, 'FAST');
      return !!d;
    }

    /* ============================ PAGE 1 ============================ */
    fill(NAVY); doc.rect(0, 0, PW, 22, 'F');
    fill(ACCENT); doc.rect(0, 22, PW, 0.8, 'F');
    font('bold', 17); color(WHITE); txt("L'Ardoise Immobilière", M, 11.2);
    font('bold', 6.6); color(SUBTLE); txt('ACHAT  ·  VENTE  ·  ESTIMATION  ·  ANGERS', M, 16.6, { cs: 0.45 });
    font('bold', 11); color(WHITE); txt('Réf. ' + ref, PW - M, 11.2, { align: 'right' });
    font('bold', 6.6); color(SUBTLE); txt('FICHE DESCRIPTIVE', PW - M, 16.6, { align: 'right', cs: 0.45 });

    // Ville (sur-titre) + titre (2 lignes max)
    var y = 31.5;
    if (b.ville) { font('bold', 8); color(ACCENT); txt(String(b.ville).toUpperCase(), M, y, { cs: 0.55 }); y += 7.6; }
    else y += 4;
    var tSize = 19;
    font('bold', tSize);
    var tLines = split(titre, CW);
    if (tLines.length > 1) { tSize = 16.5; font('bold', tSize); tLines = split(titre, CW); }
    if (tLines.length > 2) { tLines = tLines.slice(0, 2); tLines[1] = tLines[1].replace(/\s+\S*$/, '') + '…'; }
    color(NAVY);
    tLines.forEach(function (l, i) { doc.text(l, M, y + i * tSize * 0.42); });
    y += (tLines.length - 1) * tSize * 0.42 + 5.5;

    // Vignettes (même logique que les cartes du site)
    var badges = [];
    if (b.exclusif) badges.push({ t: 'EXCLUSIVITÉ', bg: ACCENT, fg: WHITE });
    if (b.statut === 'sous_compromis') badges.push({ t: 'SOUS COMPROMIS', bg: NAVY, fg: WHITE });
    if (b.statut === 'offre_en_cours') badges.push({ t: 'OFFRE EN COURS', bg: NAVY, fg: WHITE });
    if (b.statut === 'vendu') badges.push({ t: 'VENDU', bg: NAVY, fg: WHITE });
    var baisse = (b.baisse !== undefined) ? !!b.baisse : !!b.baisseDePrix;
    if (baisse && !masque) badges.push({ t: 'BAISSE DE PRIX', bg: WHITE, fg: NAVY, border: ACCENT });
    function drawBadges(x, yy) {
      badges.forEach(function (bd) {
        font('bold', 6.5);
        var w = tw(bd.t, 0.3) + 5.6, h = 5.6;
        fill(bd.bg);
        if (bd.border) { stroke(bd.border); doc.setLineWidth(0.35); doc.roundedRect(x, yy, w, h, h / 2, h / 2, 'FD'); }
        else doc.roundedRect(x, yy, w, h, h / 2, h / 2, 'F');
        color(bd.fg); txt(bd.t, x + 2.8, yy + 3.85, { cs: 0.3 });
        x += w + 2;
      });
    }

    // Photos : la principale occupe toute la hauteur disponible au-dessus des vignettes
    var factsH = 19, priceH = 25, THUMB_H = 44;
    var factsY = BOTTOM - factsH;
    var priceY = factsY - 5 - priceH;
    var photosBottom = priceY - 5;
    var thumbs = imgs.slice(1, 4);
    var mainDone = false;
    if (imgs[0]) {
      var mainH = photosBottom - y - (thumbs.length ? THUMB_H + GAP : 0);
      mainH = Math.min(mainH, thumbs.length ? 140 : 165);
      mainDone = photo(imgs[0], M, y, CW, mainH, 7, 1.6);
      if (mainDone && badges.length) drawBadges(M + 4, y + 4);
      if (mainDone && thumbs.length) {
        var n = thumbs.length, tW = (CW - (n - 1) * GAP) / n;
        thumbs.forEach(function (im, i) { photo(im, M + i * (tW + GAP), y + mainH + GAP, tW, THUMB_H); });
      }
    }
    if (!mainDone) {   // aucune photo exploitable : panneau sobre à la place
      var phH = photosBottom - y;
      fill(LIGHT); doc.roundedRect(M, y, CW, phH, 2, 2, 'F');
      font('bold', 15); color(NAVY); txt("L'Ardoise Immobilière", PW / 2, y + phH / 2 - 2, { align: 'center' });
      font('normal', 9); color(GREY); txt('Photos et visite sur demande' + (AGENT.tel ? ' : ' + AGENT.tel : ''), PW / 2, y + phH / 2 + 5, { align: 'center' });
      fill(ACCENT); doc.rect(PW / 2 - 6, y + phH / 2 + 9, 12, 0.7, 'F');
      if (badges.length) drawBadges(M + 4, y + 4);
    }

    // Bloc prix
    stroke(LINE); doc.setLineWidth(0.3); doc.line(M, priceY, M + CW, priceY);
    var leftW = 74;
    font('bold', 7); color(ACCENT); txt(masque ? 'STATUT' : 'PRIX', M, priceY + 8.5, { cs: 0.5 });
    var prixTxt = prixPublic(b);
    fitFont(prixTxt, leftW - 4, 22, 14, 'bold');
    color(NAVY); txt(prixTxt, M, priceY + 18.5);
    stroke(LINE); doc.line(M + leftW, priceY + 4, M + leftW, priceY + priceH - 2);
    // Honoraires : même logique que #fichePrixSection (pourcentage recalculé depuis prixFAI / prixHH)
    var hx = M + leftW + 6, hw = CW - leftW - 6, hLines = [];
    if (_estLocation(b)) {
      hLines.push({ t: 'Loyer mensuel charges comprises : ' + fmtInt(b.prix) + '\u00A0€', bold: true });
      if (b.loyerHC) hLines.push({ t: 'dont loyer hors charges : ' + fmtInt(b.loyerHC) + '\u00A0€' });
      if (b.charges) hLines.push({ t: 'dont provision sur charges : ' + fmtInt(b.charges) + '\u00A0€' });
      if (b.depotGarantie) hLines.push({ t: 'Dépôt de garantie : ' + fmtInt(b.depotGarantie) + '\u00A0€' });
      if (b.honorairesLocataire) hLines.push({ t: 'Honoraires TTC locataire : ' + fmtInt(b.honorairesLocataire) + '\u00A0€' + (b.honorairesEdl ? ' (dont état des lieux ' + fmtInt(b.honorairesEdl) + '\u00A0€)' : '') });
    } else if (!masque) {
      var pct = null;
      if (b.prixFAI && b.prixHH && b.prixHH > 0 && b.prixFAI > b.prixHH) pct = (b.prixFAI - b.prixHH) / b.prixHH * 100;
      else if (b.pctHonoraires && b.pctHonoraires > 0 && b.pctHonoraires <= 15) pct = parseFloat(b.pctHonoraires);
      var qui = (typeof b.honoraires === 'string' && b.honoraires) ? b.honoraires : 'acquéreur';
      var quiTxt = (qui === 'vendeur') ? 'du vendeur' : (qui === 'partagés' ? 'partagée entre vendeur et acquéreur' : 'de l\'acquéreur');
      if (pct !== null) {
        var pr = Math.round(pct * 100) / 100;
        var pctStr = (pr === Math.floor(pr)) ? pr.toFixed(0) : pr.toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
        hLines.push({ t: 'Honoraires TTC inclus à la charge ' + quiTxt + ' : ' + pctStr + '\u00A0% du prix du bien hors honoraires.', bold: true });
      } else if (qui === 'vendeur') {
        hLines.push({ t: 'Honoraires à la charge du vendeur.', bold: true });
      } else {
        hLines.push({ t: 'Honoraires TTC inclus, à la charge ' + quiTxt + '.', bold: true });
        hLines.push({ t: 'Barème : forfait de 5 000 € TTC jusqu’à 100 000 € net vendeur, 5 % TTC de 100 001 à 300 000 €, 4 % TTC au-delà.' });
      }
      if (b.prixFAI) hLines.push({ t: 'Prix du bien honoraires inclus : ' + fmtInt(b.prixFAI) + '\u00A0€' });
      if (b.prixHH) hLines.push({ t: 'Prix du bien hors honoraires : ' + fmtInt(b.prixHH) + '\u00A0€' });
      hLines.push({ t: '* Prix hors frais notariés, d’enregistrement et de publicité foncière.', small: true });
    } else {
      hLines.push({ t: 'Ce bien fait l’objet d’un engagement ou n’est plus disponible à la vente.', bold: true });
      hLines.push({ t: "Contactez L'Ardoise Immobilière pour découvrir des biens similaires à Angers et alentour." });
    }
    var wrapped = [];
    hLines.forEach(function (hl) {
      font(hl.bold ? 'bold' : 'normal', hl.small ? 6.8 : 7.8);
      split(hl.t, hw).forEach(function (s) { wrapped.push({ s: s, hl: hl }); });
    });
    var LH = 3.55, hy = priceY + 4 + Math.max(0, (priceH - 4 - wrapped.length * LH) / 2) + 2.6;
    wrapped.forEach(function (w) {
      font(w.hl.bold ? 'bold' : 'normal', w.hl.small ? 6.8 : 7.8); color(w.hl.bold ? NAVY : (w.hl.small ? MUTED : GREY));
      doc.text(w.s, hx, hy); hy += LH;
    });

    // Chiffres clés
    var facts = [];
    if (num(b.surface)) facts.push([fmtInt(b.surface) + ' m²', 'SURFACE HABITABLE']);
    if (num(b.pieces)) facts.push([String(b.pieces), num(b.pieces) > 1 ? 'PIÈCES' : 'PIÈCE']);
    if (num(b.chambres)) facts.push([String(b.chambres), num(b.chambres) > 1 ? 'CHAMBRES' : 'CHAMBRE']);
    if (num(b.terrain)) facts.push([fmtInt(b.terrain) + ' m²', 'TERRAIN']);
    var pxNum = num(b.prix || b.prixFAI);
    if (!masque && pxNum && num(b.surface)) facts.push([fmtInt(pxNum / num(b.surface)) + ' €/m²', 'PRIX / M²']);
    if (num(b.annee)) facts.push([String(b.annee), 'ANNÉE']);
    if (facts.length) {
      var fg = 2.5, fw = (CW - (facts.length - 1) * fg) / facts.length;
      facts.forEach(function (f, i) {
        var fx = M + i * (fw + fg);
        fill(LIGHT); doc.roundedRect(fx, factsY, fw, factsH, 1.6, 1.6, 'F');
        fitFont(f[0], fw - 4, 13, 9, 'bold'); color(NAVY); txt(f[0], fx + fw / 2, factsY + 9.2, { align: 'center' });
        var cs = 0.3; font('bold', 6.2);
        if (tw(f[1], cs) > fw - 3) cs = 0;
        fitFont(f[1], fw - 3, 6.2, 4.8, 'bold', cs); color(MUTED); txt(f[1], fx + fw / 2, factsY + 14.6, { align: 'center', cs: cs });
      });
    }

    /* ======================= PAGES SUIVANTES ======================= */
    y = newPage();
    var extra = imgs.slice(4);       // photos restantes pour combler les fins de page
    var galleryTitled = false;
    function gallery(yTop, limit) {  // place 1 à 2 rangées de 3 photos dans [yTop, limit]
      var head = galleryTitled ? 0 : 12, avail = limit - yTop - head;
      if (extra.length < 2 || avail < 32) return yTop;
      var rows = Math.min(2, Math.ceil(extra.length / 3));
      while (rows > 1 && (avail - (rows - 1) * GAP) / rows < 32) rows--;
      var rowH = Math.min(46, (avail - (rows - 1) * GAP) / rows);
      if (!galleryTitled) { yTop = sectionTitle('En images', yTop); galleryTitled = true; }
      for (var r = 0; r < rows && extra.length; r++) {
        var row = extra.splice(0, 3), w = (CW - (row.length - 1) * GAP) / row.length;
        row.forEach(function (im, i) { photo(im, M + i * (w + GAP), yTop, w, rowH); });
        yTop += rowH + GAP;
      }
      return yTop + 4;
    }

    // ---- Description (2 colonnes, équilibrées sur la dernière page) ----
    var blocks = parseDescription(b.description || b.desc || '');
    var lead = san(accrocheValide(b));
    if (!lead && blocks.length && blocks[0].text.length <= 150 && !/[.!?]$/.test(blocks[0].text) && !blocks[0].bullet) {
      lead = blocks.shift().text;
      if (blocks[0]) blocks[0].blankBefore = true;
    }
    if (blocks.length || lead) {
      y = sectionTitle('Description', y);
      if (lead) {
        font('bold', 10.5); color(NAVY);
        split(lead, CW).forEach(function (l) { doc.text(l, M, y + 3.6); y += 4.9; });
        y += 2.6;
      }
      var COLG = 8, COLW = (CW - COLG) / 2;
      var items = [];
      blocks.forEach(function (bk, bi) {
        var style = bk.heading ? 'bold' : 'normal', size = bk.heading ? 9.4 : 8.9;
        var indent = bk.bullet ? 3.6 : 0;
        font(style, size);
        var ls = split(bk.text, COLW - indent - 0.5);
        var gap = bi === 0 ? 0 : (bk.heading ? 3.4 : (bk.bullet && blocks[bi - 1].bullet ? 0.7 : (bk.blankBefore ? 2.6 : 1.4)));
        ls.forEach(function (s, li) {
          items.push({
            s: s, style: style, size: size, lh: bk.heading ? 4.7 : 4.25, indent: indent,
            dot: bk.bullet && li === 0, gap: li === 0 ? gap : 0, c: bk.heading ? NAVY : BODY,
            // titres : gardés avec 2 lignes ; pas de ligne isolée en bas/haut de colonne
            keep: bk.heading ? 2 : ((li === 0 || li === ls.length - 2) && ls.length > 2 ? 1 : 0)
          });
        });
      });
      var flow = function (i, top, H, draw) {   // remplit 2 colonnes de hauteur H ; renvoie l'index suivant
        var col = 0, cy = 0, maxY = top;
        while (i < items.length) {
          var it = items[i], need = (cy > 0 ? it.gap : 0) + it.lh, more = 0;
          for (var k = 1; k <= it.keep && i + k < items.length; k++) more += items[i + k].gap + items[i + k].lh;
          if (cy > 0 && cy + need + more > H) { col++; cy = 0; if (col >= 2) break; continue; }
          cy += (cy > 0 ? it.gap : 0);
          if (draw) {
            var x = M + col * (COLW + COLG), base = top + cy + it.lh * 0.74;
            font(it.style, it.size); color(it.c);
            doc.text(it.s, x + it.indent, base);
            if (it.dot) { fill(ACCENT); doc.circle(x + 1.1, base - 1.05, 0.62, 'F'); }
          }
          cy += it.lh; i++;
          if (top + cy > maxY) maxY = top + cy;
        }
        return { i: i, maxY: maxY };
      };
      var idx = 0;
      while (idx < items.length) {
        var avail = BOTTOM - y, H = avail;
        if (flow(idx, y, avail, false).i >= items.length) {   // la fin tient sur la page : on équilibre
          var lo = 8, hi = avail;
          while (hi - lo > 0.4) { var mid = (lo + hi) / 2; if (flow(idx, y, mid, false).i >= items.length) hi = mid; else lo = mid; }
          H = hi;
        }
        var res = flow(idx, y, H, true);
        if (res.i === idx) { y = newPage(); continue; }
        idx = res.i;
        y = (idx < items.length) ? newPage() : res.maxY + 8;
      }
    }

    // ---- Caractéristiques ----
    var carac = [];
    function add(l, v) { if (v !== null && v !== undefined && v !== '' && v !== 0 && v !== '0') carac.push([l, String(v)]); }
    add('Type de bien', b.type);
    add('Ville', b.ville);
    add('Surface habitable', num(b.surface) ? fmtInt(b.surface) + ' m²' : '');
    add('Terrain', num(b.terrain) ? fmtInt(b.terrain) + ' m²' : '');
    add('Pièces', num(b.pieces) ? b.pieces : '');
    add('Chambres', num(b.chambres) ? b.chambres : '');
    add('Salle(s) de bains', num(b.salleBain) ? b.salleBain : '');
    add('Salle(s) d’eau', num(b.sdb) ? b.sdb : '');
    add('Niveaux', num(b.niveaux) ? b.niveaux : '');
    add('Année de construction', num(b.annee) ? b.annee : '');
    add('Référence', ref);
    var rowH = 7.2, rows = Math.ceil(carac.length / 2);
    y = ensure(y, 12 + rows * rowH + 4);
    y = sectionTitle('Caractéristiques', y);
    var cg = 10, cw2 = (CW - cg) / 2;
    carac.forEach(function (c, i) {
      var x = M + (i % 2) * (cw2 + cg), ry = y + Math.floor(i / 2) * rowH;
      font('normal', 8.4); color(GREY); txt(c[0], x, ry + 4.8);
      font('bold', 8.6); color(NAVY); txt(c[1], x + cw2, ry + 4.8, { align: 'right' });
      stroke(LINE); doc.setLineWidth(0.25); doc.line(x, ry + rowH, x + cw2, ry + rowH);
    });
    y += rows * rowH + 9;

    // ---- Performance énergétique ----
    var dpeC = String(b.dpeClasse || b.dpe || '').trim().toUpperCase();
    var gesC = String(b.gesClasse || b.ges || '').trim().toUpperCase();
    var hasDpe = CLASSES.indexOf(dpeC) !== -1, hasGes = CLASSES.indexOf(gesC) !== -1;
    var dpeVal = num(b.dpeConso || b.dpeVal), gesVal = num(b.gesConso || b.gesVal);
    var coutMin = num(b.dpeCoutMin), coutMax = num(b.dpeCoutMax);
    var md = String(b.dateDpe || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    var dateD = md ? md[3] + '/' + md[2] + '/' + md[1] : '';
    var anneeRef = b.dpeAnneeRef || b.anneeRefDpe || '';

    var BAR_H = 4.7, BAR_G = 1.05, BAR_W0 = 15, BAR_STEP = 4.3, PT = 2.4;
    var scaleH = 7 * BAR_H + 6 * BAR_G;
    var dpeH = hasDpe ? (12 + 10.5 + scaleH + 6 + (coutMin && coutMax ? 10.5 : 0) + (dateD ? 4.5 : 0) + 10) : 36;
    var CARD_H = 44;
    // DPE et carte contact restent sur la même page (jamais de carte seule sur une page)
    if (y + dpeH + CARD_H > BOTTOM) { y = gallery(y, BOTTOM); y = newPage(); }
    y = sectionTitle('Performance énergétique', y);

    function scale(x, top, active, cols, value, unit, topLbl, botLbl, topC, botC, title) {
      font('bold', 8.6); color(NAVY); txt(title, x, top + 3);
      font('normal', 6.4); color(topC); txt(topLbl, x, top + 8);
      var by = top + 10.5;
      CLASSES.forEach(function (c, i) {
        var w = BAR_W0 + i * BAR_STEP, yy = by + i * (BAR_H + BAR_G), col = hex(cols[c]);
        fill(col);
        doc.lines([[w - PT, 0], [PT, BAR_H / 2], [-PT, BAR_H / 2], [-(w - PT), 0]], x, yy, [1, 1], 'F', true);
        var lum = 0.299 * col[0] + 0.587 * col[1] + 0.114 * col[2];
        font('bold', 7.6); color(lum > 165 ? NAVY : WHITE); txt(c, x + 1.8, yy + BAR_H / 2 + 1.3);
        if (c !== active) return;
        // classe du bien : contour + étiquette valeur pointant vers la barre
        stroke(NAVY); doc.setLineWidth(0.55); doc.setLineJoin('round');
        doc.lines([[w - PT + 0.6, 0], [PT + 0.6, BAR_H / 2 + 0.6], [-(PT + 0.6), BAR_H / 2 + 0.6], [-(w - PT + 0.6), 0]], x - 0.6, yy - 0.6, [1, 1], 'S', true);
        var tx = x + w + 2.2, tyC = yy + BAR_H / 2, th = 7.4;
        var vTxt = value ? fmtInt(value) : 'Classe ' + c, uTxt = value ? ' ' + unit : '';
        font('bold', 9.5); var w1 = tw(vTxt); font('normal', 6.6); var w2 = tw(uTxt);
        var tagW = w1 + w2 + 5.5;
        fill(NAVY);
        doc.lines([[tagW, 0], [0, th], [-tagW, 0], [-2.6, -th / 2]], tx + 2.6, tyC - th / 2, [1, 1], 'F', true);
        font('bold', 9.5); color(WHITE); txt(vTxt, tx + 4.4, tyC + 1.5);
        font('normal', 6.6); color(SUBTLE); txt(uTxt, tx + 4.4 + w1, tyC + 1.5);
      });
      font('normal', 6.4); color(botC); txt(botLbl, x, by + scaleH + 4);
      return by + scaleH + 4;
    }

    if (hasDpe) {
      var half = CW / 2 + 2;
      var endY = scale(M, y, dpeC, DPE_COL, dpeVal, 'kWh/m²/an', 'Logement extrêmement performant',
        'Logement extrêmement consommateur d’énergie', hex('#009C6D'), hex('#D7221F'), 'Consommation énergétique (DPE)');
      if (hasGes) {
        scale(M + half, y, gesC, GES_COL, gesVal, 'kg CO2/m²/an', 'Peu d’émissions de CO2',
          'Émissions de CO2 très importantes', hex('#5A86B5'), hex('#2C1A48'), 'Émissions de gaz à effet de serre (GES)');
      } else {
        font('bold', 8.6); color(NAVY); txt('Émissions de gaz à effet de serre (GES)', M + half, y + 3);
        font('normal', 8); color(GREY); txt('Non communiquées', M + half, y + 9);
      }
      y = endY + 6;
      if (coutMin && coutMax) {
        fill(LIGHT); doc.roundedRect(M, y - 1, CW, 8.4, 1.4, 1.4, 'F');
        rich([
          { t: 'Estimation des coûts annuels d’énergie du logement : ' },
          { t: 'entre ' + fmtInt(coutMin) + '\u00A0€ et ' + fmtInt(coutMax) + '\u00A0€', bold: true },
          { t: ' par an' + (anneeRef ? ' (année de référence ' + anneeRef + ')' : '') + '.' }
        ], M + 3.5, y + 4.3);
        y += 10.5;
      }
      if (dateD) { font('normal', 7.2); color(GREY); txt('DPE réalisé le ' + dateD + '.', M, y + 2.5); y += 4.5; }
    } else {
      fill(LIGHT); doc.roundedRect(M, y, CW, 12, 1.6, 1.6, 'F');
      font('bold', 9); color(NAVY); txt('DPE en cours / non communiqué', M + 4, y + 7.4);
      y += 16;
    }
    font('normal', 6.8); color(MUTED);
    txt('Les informations sur les risques auxquels ce bien est exposé sont disponibles sur le site Géorisques : www.georisques.gouv.fr', M, y + 3);
    y += 10;

    // ---- Carte contact : sous le DPE, ou ancrée en bas si des photos comblent l'espace ----
    var gy = gallery(y, BOTTOM - CARD_H - 4);
    var cy = (gy !== y) ? BOTTOM - CARD_H : Math.min(y, BOTTOM - CARD_H);
    fill(LIGHT); doc.roundedRect(M, cy, CW, CARD_H, 2.5, 2.5, 'F');
    var tx0 = M + 8;
    var av = assets && assets.avatar && cropImg(assets.avatar, 28, 28, { pxPerMm: 10, shape: 'circle', bg: LIGHT, focusY: 0.35, q: 0.9 });
    if (av) {
      var D = 28, cxp = M + 7 + D / 2, cyp = cy + CARD_H / 2;
      doc.addImage(av, 'JPEG', cxp - D / 2, cyp - D / 2, D, D, undefined, 'FAST');
      stroke(ACCENT); doc.setLineWidth(0.6); doc.circle(cxp, cyp, D / 2 + 0.9, 'S');
      tx0 = M + 7 + D + 8;
    }
    font('bold', 7); color(ACCENT); txt('VOTRE CONTACT', tx0, cy + 8.5, { cs: 0.5 });
    font('bold', 13.5); color(NAVY); txt(AGENT.nom, tx0, cy + 15);
    font('normal', 8); color(ACCENT); txt(AGENT.role, tx0, cy + 20);
    var ly = cy + 27;
    [['Tél.', AGENT.tel, AGENT.telHref], ['E-mail', AGENT.mail, 'mailto:' + AGENT.mail], ['Site', AGENT.site, 'https://' + AGENT.site + '/']]
      .filter(function (r) { return r[1]; })
      .forEach(function (r) {
        font('normal', 7.4); color(MUTED); txt(r[0], tx0, ly);
        font('bold', 9); color(NAVY); var w = txt(r[1], tx0 + 11, ly);
        doc.link(tx0 + 11, ly - 3.2, w, 4.2, { url: r[2] });
        ly += 4.9;
      });
    // QR code vers l'annonce (vectoriel)
    var Q = 30, qx = M + CW - 7 - Q, qy = cy + 4.5;
    if (typeof window.qrcode === 'function') {
      try {
        var qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
        var nMod = qr.getModuleCount(), cell = (Q - 2) / nMod;
        fill(WHITE); doc.roundedRect(qx - 1.2, qy - 1.2, Q + 2.4, Q + 2.4, 1.2, 1.2, 'F');
        fill(NAVY);
        for (var rr = 0; rr < nMod; rr++) {
          var run = -1;
          for (var cc = 0; cc <= nMod; cc++) {
            var dark = cc < nMod && qr.isDark(rr, cc);
            if (dark && run < 0) run = cc;
            if (!dark && run >= 0) { doc.rect(qx + 1 + run * cell, qy + 1 + rr * cell, (cc - run) * cell + 0.02, cell + 0.02, 'F'); run = -1; }
          }
        }
        doc.link(qx, qy, Q, Q, { url: url });
        font('normal', 6.8); color(GREY); txt('Voir l’annonce en ligne', qx + Q / 2, qy + Q + 4.6, { align: 'center' });
      } catch (e) { /* QR facultatif */ }
    }

    // ---- Pied de page sur chaque page ----
    var N = doc.getNumberOfPages();
    for (var p = 1; p <= N; p++) {
      doc.setPage(p);
      stroke(LINE); doc.setLineWidth(0.25); doc.line(M, 283, M + CW, 283);
      font('normal', 6.2); color(MUTED);
      split(FOOTER_TXT, CW - 22).forEach(function (l, i) { doc.text(l, M, 286.6 + i * 2.8); });
      font('bold', 6.8); color(NAVY); txt('page ' + p + ' / ' + N, PW - M, 286.6, { align: 'right' });
    }
    doc.setPage(1);
    return doc;
  }

  /* ------------------------------------------------------------------ */
  /*  Point d'entrée public                                              */
  /* ------------------------------------------------------------------ */
  window.telechargerFichePDF = async function () {
    var b = window._bienAffiche;
    if (!b) { toast('Aucun bien sélectionné.', 'error', 4000); return; }
    if (_busy) return;
    _busy = true;
    var btn = document.getElementById('ficheBtnPdf');
    var orig = btn ? btn.innerHTML : null;
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Préparation…'; }
    try {
      var qrP = loadQR();
      var assetsP = loadAssets(b).catch(function () { return { imgs: [], avatar: null }; });
      await loadJsPDF();
      var res = await Promise.all([assetsP, qrP]);
      var doc = buildDoc(b, res[0]);
      doc.save(nomFichier(b));
      toast('Fiche PDF téléchargée', 'success', 3000);
    } catch (e) {
      if (window.console) console.error('[Fiche PDF]', e);
      toast(ERR_MSG, 'error', 6000);
    } finally {
      if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = orig; }
      _busy = false;
    }
  };
})();

// ===== Mini-diaporama sur les cartes : faire défiler les photos sans ouvrir l'annonce =====
var BC_MAX = 10;   // photos max par carte (les suivantes restent visibles dans l'annonce)
var BC_CHEV = { prev: '<path d="M15 18l-6-6 6-6"/>', next: '<path d="M9 18l6-6-6-6"/>' };
function bcPhotos(b) {
  var l = (Array.isArray(b.photos) ? b.photos : []).filter(Boolean);
  if (b.img && l.indexOf(b.img) === -1) l.unshift(b.img);
  if (!l.length) l = [b.img || PLACEHOLDER_IMG];
  return l.slice(0, BC_MAX);
}
function bcSlides(b, alt) {
  var ph = bcPhotos(b);
  return '<div class="bc-track" data-n="' + ph.length + '">' + ph.map(function (u, i) {
    // seule la 1re photo est chargée tout de suite ; les autres à la demande (data-src)
    return '<div class="bc-slide"><img ' + (i === 0 && imgOpt(u, 480) !== u ? 'srcset="' + _esc(imgOpt(u, 480)) + ' 480w, ' + _esc(imgOpt(u, 800)) + ' 800w" sizes="(max-width: 700px) 92vw, 360px" ' : '') + (i === 0 ? 'src' : 'data-src') + '="' + _esc(imgOpt(u, 800)) + '" data-orig="' + _esc(u) + '" alt="' + _esc(alt + (i ? ', photo ' + (i + 1) : '')) +
           '" loading="lazy" decoding="async" onerror="imgRepli(this)"></div>';
  }).join('') + '</div>';
}
function bcArrow(dir, label) {
  return '<button type="button" class="bc-arrow bc-' + dir + '" aria-label="' + label + '" onclick="bcNav(event,this,' + (dir === 'prev' ? -1 : 1) + ')">' +
         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + BC_CHEV[dir] + '</svg></button>';
}
function bcControls(b) {
  var n = bcPhotos(b).length;
  if (n < 2) return '';
  return bcArrow('prev', 'Photo précédente') + bcArrow('next', 'Photo suivante') +
         '<div class="bc-dots" aria-hidden="true">' + bcDotsHTML(0, n) + '</div>';
}
function bcDotsHTML(i, n) {   // 5 points max, fenêtre glissante autour de la photo affichée
  var max = 9, start = Math.max(0, Math.min(i - 4, n - max)), end = Math.min(n, start + max), h = '';
  for (var k = start; k < end; k++) h += '<span' + (k === i ? ' class="on"' : '') + '></span>';
  return h;
}
function bcCharger(tr, k) {
  var im = tr.children[k] && tr.children[k].querySelector('img[data-src]');
  if (im) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); }
}
function bcGo(box, i) {
  var tr = box.querySelector('.bc-track'); if (!tr) return;
  var n = +tr.getAttribute('data-n') || 1;
  i = ((i % n) + n) % n;
  box.setAttribute('data-i', i);
  bcCharger(tr, i); bcCharger(tr, (i + 1) % n);
  tr.style.transform = 'translateX(' + (-100 * i) + '%)';
  var d = box.querySelector('.bc-dots'); if (d) d.innerHTML = bcDotsHTML(i, n);
}
function bcNav(ev, btn, dir) {
  if (ev) { ev.stopPropagation(); ev.preventDefault(); }   // n'ouvre pas l'annonce
  var box = btn.closest('.bien-card-img'); if (!box) return;
  bcGo(box, (+box.getAttribute('data-i') || 0) + dir);
}
(function () {
  // Survol (ordinateur) : on précharge la 2e photo pour un défilement instantané
  document.addEventListener('mouseover', function (e) {
    var box = e.target.closest && e.target.closest('.bien-card-img');
    if (box && !box._pre) { box._pre = 1; var tr = box.querySelector('.bc-track'); if (tr) bcCharger(tr, 1); }
  });
  // Glisser au doigt (téléphone) — sauf dans le carrousel de l'accueil, qui défile déjà au doigt
  var box = null, sx = 0, sy = 0;
  document.addEventListener('touchstart', function (e) {
    var b = e.target.closest && e.target.closest('.bien-card-img');
    box = (b && b.querySelector('.bc-arrow') && !b.closest('.une-carousel')) ? b : null;
    if (box) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!box) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      bcGo(box, (+box.getAttribute('data-i') || 0) + (dx < 0 ? 1 : -1));
      box._swipe = Date.now();
    }
    box = null;
  }, { passive: true });
  // un glissement ne doit pas ouvrir l'annonce
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.bien-card-img');
    if (b && b._swipe && Date.now() - b._swipe < 450) { e.stopPropagation(); e.preventDefault(); }
  }, true);
})();

// ===== Photos 3G allégées =====
// Les photos 3G pèsent 2 à 3 Mo (jusqu'à 5 712 px de large). On les sert redimensionnées en WebP
// via le relais d'images wsrv.nl (≈ 40 Ko pour une carte, 85× plus léger). Si le relais ne répond pas,
// la photo d'origine 3G est rechargée automatiquement (attribut data-orig), puis l'image de remplacement.
function imgOpt(url, w) {
  if (!url || typeof url !== 'string' || (url.indexOf('admin.3gimmobilier.fr') === -1 && url.indexOf('media.3gimmo.com') === -1)) return url;
  return 'https://wsrv.nl/?url=' + url.replace(/^https?:\/\//, '') + '&w=' + (w || 800) + '&we&output=webp&q=74';
}
function imgRepli(img) {
  img.removeAttribute('srcset');
  var o = img.getAttribute('data-orig');
  if (o && img.src !== o) { img.removeAttribute('data-orig'); img.src = o; return; }
  img.onerror = null; img.src = PLACEHOLDER_IMG;
}

// ===== HAMBURGER =====
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('hamburger');
  menu.classList.toggle('open');
  btn.classList.toggle('open');
  document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
}
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow = '';
}

// ===== SCROLL NAV =====
function updateNavOnScroll() {
  const nav = document.getElementById('nav');
  const activePage = document.querySelector('.page.active');
  if (activePage && activePage.id !== 'page-home') return;
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', updateNavOnScroll, { passive: true });

// ===== FADE IN OBSERVER =====
function observeFadeIns() {
  const elements = document.querySelectorAll('.fade-in:not(.visible)');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  elements.forEach(el => observer.observe(el));
}

// ===== INIT =====
// (loadBiens() — version unique « modèle Saben » définie plus bas : cache local immédiat
//  puis fetch data/biens.json + overlay data/ventes.json. Ancien doublon mort retiré le 26/06.)

// On initialise dès que le DOM est prêt (pas besoin d'attendre toutes les images)
document.addEventListener('DOMContentLoaded', () => {
  // Hero visible immédiatement, sans attendre
  const bg = document.getElementById('heroBg');
  const hc = document.getElementById('heroContent');
  if (bg) bg.classList.add('loaded');
  if (hc) hc.classList.add('visible');
  appliquerCoordonnees();

  // Rendu immédiat (utilise les biens de localStorage si dispo)
  renderHomeGrid();
  refreshVilleSelects();
  initCookieBanner();

  // ====== ROUTAGE depuis l'URL au chargement (SEO / partage) ======
  _routeFromHash();

  // Charger les biens Supabase en arrière-plan (sans bloquer l'affichage)
  loadBiens().then(() => {
    renderHomeGrid();
    refreshVilleSelects();
    var _pa = document.querySelector('.page.active');
    if (/^#bien\//.test(location.hash) && (!_pa || _pa.id !== 'page-fiche')) _routeFromHash();
  }).catch(function(){});
});

// ===== MISE À JOUR AUTOMATIQUE (sans recharger la page) =====
// Un visiteur qui garde la page ouverte (ou revient sur l'onglet) doit voir les
// changements faits depuis l'admin (vendu, sous compromis, à la une…) SANS avoir à
// rafraîchir — sinon il pourrait appeler pour un bien déjà vendu. On revérifie les
// données régulièrement et on ne ré-affiche QUE si quelque chose de visible a changé.
var _lastDataSig = null;
function _signatureDonnees(tb, tv) {
  try {
    var bj = JSON.parse(tb);
    var props = Array.isArray(bj) ? bj : (bj.properties || []);
    var vj = tv ? JSON.parse(tv) : { ventes: [] };
    return JSON.stringify({
      b: props.map(function(p){ return [p.id, p.statut, p.exclusif, p.prix, p.titre, p.img]; }),
      v: (vj.ventes || []).map(function(x){ return [x.id, x.statut, x.exclusif, x.alaune, x.nouveaute, x.baisse]; })
    });
  } catch(e) { return null; }
}
async function autoRefreshData() {
  if (document.hidden) return;
  try {
    var rb = await fetch(AGENCE.flux3G + '?t=' + Date.now(), { cache: 'no-cache' }).catch(function(){ return null; });
    var rv = await fetch(_urlStatuts() + '?t=' + Date.now(), { cache: 'no-cache' }).catch(function(){ return null; });
    var tb = (rb && rb.ok) ? await rb.text() : '';
    var tv = (rv && rv.ok) ? await rv.text() : '';
    if (!tb) return; // fetch raté → on ne touche à rien (on garde l'affichage actuel)
    var sig = _signatureDonnees(tb, tv);
    if (sig === null) return;
    if (_lastDataSig === null) { _lastDataSig = sig; return; } // 1er passage : on mémorise
    if (sig !== _lastDataSig) {
      _lastDataSig = sig;
      loadBiens(); // changement détecté → re-fetch + fusion + ré-affichage de toutes les vues
    }
  } catch(e) {}
}
setInterval(autoRefreshData, 180000); // toutes les 3 min
var _lastVisRefresh = 0;
document.addEventListener('visibilitychange', function(){
  if (document.visibilityState === 'visible' && (Date.now() - _lastVisRefresh) > 60000) {
    _lastVisRefresh = Date.now();
    autoRefreshData();
  }
});

// Gérer les boutons back/forward du navigateur
window.addEventListener('popstate', function(){ _routeFromHash(); });
window.addEventListener('hashchange', function(){ _routeFromHash(); });

function _routeFromHash() {
  var hash = (window.location.hash || '').replace(/^#/, '');
  if (!hash) { _updateSeoForPage('home'); return; }
  // Format "bien/slug-ref-12"
  var bienMatch = hash.match(/^bien\/.*ref-(\d+)/i);
  if (bienMatch) {
    var id = parseInt(bienMatch[1]);
    if (id && typeof showFiche === 'function') { showFiche(id); return; }
  }
  // Pages simples
  var _alias = { estimer: 'estimation', 'me-connaitre': 'apropos', connaitre: 'apropos', agence: 'apropos', parrainer: 'parrainage' };
  if (_alias[hash]) hash = _alias[hash];
  var validPages = ['home','biens','acheter','louer','apropos','estimation','contact','fiche','vendre','parrainage','outils','favoris'];
  if (validPages.indexOf(hash) !== -1) {
    if (typeof showPage === 'function') showPage(hash);
    return;
  }
  var _legal = { 'mentions-legales': 'mentions', confidentialite: 'rgpd', honoraires: 'honoraires', cgu: 'cgu', cookies: 'cookies-info' };
  if (_legal[hash] && typeof showLegal === 'function') showLegal(_legal[hash]);
}

// ===== LIGHTBOX =====
let _lbIdx = 0;

function openLightbox(idx) {
  const photos = window._currentPhotos;
  if (!photos || photos.length === 0) return;
  _lbIdx = idx;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  updateLightbox();
}

function closeLightbox() {
  if (document.fullscreenElement && document.exitFullscreen) { try { document.exitFullscreen(); } catch (e) {} }
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function lightboxNav(dir) {
  const photos = window._currentPhotos;
  _lbIdx = (_lbIdx + dir + photos.length) % photos.length;
  updateLightbox();
}

function updateLightbox() {
  const photos = window._currentPhotos;
  var _lbImg = document.getElementById('lightbox-img');
  _lbImg.setAttribute('data-orig', photos[_lbIdx]);
  _lbImg.onerror = function () { imgRepli(this); };
  _lbImg.src = imgOpt(photos[_lbIdx], 2000);
  document.getElementById('lightbox-counter').textContent = (_lbIdx + 1) + ' / ' + photos.length;
  _lbImg.alt = 'Photo ' + (_lbIdx + 1) + ' sur ' + photos.length + ((document.getElementById('ficheTitre') || {}).textContent ? ' : ' + document.getElementById('ficheTitre').textContent : '');

  // Flèches : masquer si 1 seule photo
  document.getElementById('lightbox-prev').style.display = photos.length > 1 ? 'flex' : 'none';
  document.getElementById('lightbox-next').style.display = photos.length > 1 ? 'flex' : 'none';

  // Miniatures
  const thumbs = document.getElementById('lightbox-thumbs');
  thumbs.innerHTML = photos.map((p, i) =>
    `<img src="${imgOpt(p, 200)}" alt="Photo du bien ${i + 1}" class="${i === _lbIdx ? 'active' : ''}" onclick="(_lbIdx=${i}, updateLightbox())">`
  ).join('');
  // Fix onclick dans template string
  thumbs.querySelectorAll('img').forEach((img, i) => {
    img.onclick = () => { _lbIdx = i; updateLightbox(); };
  });
}

// Fermer avec Escape ou clic fond
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (lb && lb.classList.contains('open')) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxNav(-1);
    if (e.key === 'ArrowRight') lightboxNav(1);
  }
  const ml = document.getElementById('modal-legal');
  if (ml && ml.style.display === 'block' && e.key === 'Escape') closeLegal();
});
var _lb = document.getElementById('lightbox');
if (_lb) { _lb.addEventListener('click', function(e) { if (e.target === this) closeLightbox(); }); }

;

async function loadBiens() {
  // ===== Modèle « Saben » : annonces depuis data/biens.json (synchro 3G committée),
  // ventes manuelles depuis data/ventes.json. Plus de Supabase. =====

  // 1. Cache localStorage immédiat (affichage instantané)
  try {
    var saved = localStorage.getItem('ia_biens');
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) {
        biens = parsed.map(_normalizeBien).filter(_txActive).filter(function (b) { return !b._villeVide && _dansSecteur(b); });
        renderHomeGrid();
      }
    }
  } catch(e) {}

  // 2. Charger les annonces actives + l'overlay des ventes
  try {
    var results = await Promise.all([
      fetch(AGENCE.flux3G + '?t=' + Date.now(), { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('flux'); return r; })
        .catch(function () { return fetch('data/biens.json?t=' + Date.now(), { cache: 'no-cache' }); }),
      fetch(_urlStatuts() + '?t=' + Date.now(), { cache: 'no-cache' }).catch(function(){ return null; }),
      null   // (data/vendus-auto.json : non utilisé)
    ]);
    var bRes = results[0], vRes = results[1], vaRes = results[2];

    var actifs = [];
    if (bRes && bRes.ok) {
      var bj = await bRes.json();
      actifs = _listeAnnonces(bj);
    }
    {
      var _ids = {}; actifs.forEach(function (b) { _ids[b.id] = 1; });
      actifs = actifs.concat((await _biensPartenaires()).filter(function (b) { return !_ids[b.id]; }));
    }

    var ventes = [];
    if (vRes && vRes.ok) {
      try {
        var vj = await vRes.json();
        ventes = (vj.ventes || []).map(_normalizeBien);
      } catch(e) {}
    }

    // Ventes détectées AUTO depuis 3G (bien archivé/vendu → disparu du flux) — fichier séparé.
    vendusAuto = [];
    if (vaRes && vaRes.ok) {
      try {
        var vaj = await vaRes.json();
        vendusAuto = (vaj.ventes || []);
      } catch(e) {}
    }
    // Si l'admin vient de publier, GitHub Pages peut encore servir l'ancien ventes.json
    // (~1 min de délai). On fait alors foi de l'overlay publié, gardé en local 5 min.
    try {
      var _pend = JSON.parse(localStorage.getItem('ia_overlay_pending') || 'null');
      if (_pend && _pend.ts && Array.isArray(_pend.ventes) && (Date.now() - _pend.ts) < 300000) {
        ventes = _pend.ventes.map(_normalizeBien);
      } else if (_pend) {
        localStorage.removeItem('ia_overlay_pending');
      }
    } catch(e) {}

    if (actifs.length > 0 || ventes.length > 0) {
      // Les biens vendus (overlay) priment : on retire l'éventuel doublon actif
      // Overlay manuel (data/ventes.json) — PRIORITAIRE sur le statut 3G :
      //  • 'vendu' → retiré des annonces actives, ajouté aux ventes (snapshot)
      //  • 'sous_compromis' / 'offre_en_cours' → appliqué au bien actif (badge), reste en grille
      // Overlay manuel (data/ventes.json) — source des BADGES (statut + exclusivité) :
      //  • 'vendu' → retiré des actifs, ajouté aux ventes (snapshot)
      //  • autre → applique statut ET/OU exclusif au bien actif (prioritaire sur 3G)
      var soldMap = {}, overrideMap = {};
      ventes.forEach(function(v){
        if (v.statut === 'vendu') soldMap[v.id] = v;
        else overrideMap[v.id] = v;
      });
      var vendus = Object.keys(soldMap).map(function(k){ var v = soldMap[k]; v.statut = 'vendu'; return v; });
      var actifsVisibles = actifs.filter(function(b){ return !soldMap[b.id]; });
      actifsVisibles.forEach(function(b){
        var ov = overrideMap[b.id];
        if (ov) {
          if (ov.statut) b.statut = ov.statut;
          if (ov.exclusif !== undefined) b.exclusif = !!ov.exclusif;
          if (ov.alaune !== undefined) b.alaune = !!ov.alaune;
          if (ov.nouveaute !== undefined) b.nouveaute = !!ov.nouveaute;
          if (ov.baisse !== undefined) b.baisse = !!ov.baisse;
          if (ov.masque !== undefined) b.masque = !!ov.masque;
          if (ov.conseiller) b.conseiller = ov.conseiller;
        }
        if (b.statut === 'vendu') b.statut = 'en_vente';  // sécurité (le vendu vient de soldMap)
      });

      var _tous = vendus.concat(actifsVisibles);
      biensMasques = _tous.filter(function(b){ return !!b.masque; });
      biens = _tous.filter(function(b){ return !b.masque; });

      // Filtre villes dynamique
      biens.forEach(function(b){
        var v = b && b.ville ? String(b.ville).trim() : '';
        if (v && villes.indexOf(v) === -1) villes.push(v);
      });

      var ids = biens.map(function(b){ return parseInt(b.id) || 0; }).filter(function(n){ return n > 0; });
      nextId = (ids.length > 0 ? Math.max.apply(null, ids) : 0) + 1;
      try {
        localStorage.setItem('ia_biens', JSON.stringify(biens));
        localStorage.setItem('ia_nextId', String(nextId));
      } catch(e) {}
      renderHomeGrid();
      // Rafraîchir TOUTES les vues avec les données fraîches (pas seulement l'accueil),
      // sinon une liste « Biens » ou une fiche déjà affichée garderait l'ancien statut du cache.
      if (typeof renderBiensGrid === 'function') renderBiensGrid();
      if (typeof renderVendusCarousel === 'function') renderVendusCarousel();
      try {
        var _pageActive = document.querySelector('.page.active');
        if (_pageActive && _pageActive.id === 'page-fiche' && window._bienAffiche) {
          var _frais = biens.find(function(x){ return parseInt(x.id) === parseInt(window._bienAffiche.id); });
          if (_frais) showFiche(_frais.id);
        }
        if (typeof renderAdmin === 'function' && _pageActive && _pageActive.id === 'page-admin') renderAdmin();
      } catch(e) {}
      console.log('✅ ' + biens.length + ' biens (' + actifsVisibles.length + ' en vente + ' + vendus.length + ' vendus)');
    } else if (biens.length === 0) {
      // Aucune donnée réelle disponible : on N'AFFICHE PAS de fausses annonces de démo
      // (ce serait trompeur sur un site immobilier réel). On laisse une liste vide.
      biens = [];
      renderHomeGrid();
    }
  } catch(e) {
    if (biens.length === 0) {
      biens = [];
      renderHomeGrid();
    }
    console.warn('Chargement data/biens.json indisponible — cache local utilisé.', e);
  }
}

// Normalise un bien pour l'affichage (ville par défaut, unification DPE/GES).
// Villes canoniques (unifie les variantes 3G : accents, tirets, casse)
var VILLES_CANON = ['Angers','Avrillé','Trélazé','Les Ponts-de-Cé','Saint-Barthélemy-d\'Anjou','Beaucouzé','Bouchemaine','Écouflant','Mûrs-Érigné','Sainte-Gemmes-sur-Loire','Montreuil-Juigné','Verrières-en-Anjou','Loire-Authion','Saint-Léger-de-Linières','Longuenée-en-Anjou','Brissac Loire Aubance','Cantenay-Épinard'];
function _normVilleKey(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[\s\-]+/g,' ').trim(); }
var _VILLES_CANON_MAP = (function(){ var m={}; VILLES_CANON.forEach(function(v){ m[_normVilleKey(v)] = v; }); return m; })();
function _canonVille(v){ var k=_normVilleKey(v); return _VILLES_CANON_MAP[k] || v; }

function _normalizeBien(b) {
  b.id = parseInt(b.id);
  if (b.description && !b.desc) b.desc = b.description;
  if (b.transaction !== 'location') b.transaction = 'vente';
  // Vente : décomposition honoraires inclus / hors honoraires selon le barème (à la charge de l'acquéreur)
  if (b.transaction === 'vente' && (b.prixFAI || b.prix) && !b.prixHH && b.statut !== 'vendu' && b.honoraires !== 'vendeur') {
    var fai = parseInt(b.prixFAI || b.prix) || 0, net;
    if (fai - 5000 <= 100000) net = fai - 5000;
    else if (fai / 1.05 <= 300000) net = Math.round(fai / 1.05);
    else net = Math.round(fai / 1.04);
    if (net > 0) { b.prixFAI = fai; b.prixHH = net; if (!b.honoraires) b.honoraires = 'acquéreur'; }
  }
  if (b.ville) b.ville = _canonVille(b.ville);
  if (!b.ville || !String(b.ville).trim()) b.ville = 'Angers';
  if (!b.dpeClasse && b.dpe) b.dpeClasse = b.dpe;
  if (!b.dpeConso && b.dpeVal) b.dpeConso = b.dpeVal;
  if (!b.gesClasse && b.ges) b.gesClasse = b.ges;
  if (!b.gesConso && b.gesVal) b.gesConso = b.gesVal;
  return b;
}

// =====================================================================
// ESPACE PRO — pilotage des statuts (même principe que cotepresquile.com)
// Le mot de passe n'est PAS dans le site : il est vérifié par le relais Cloudflare
// (AGENCE.statutProxyUrl), qui enregistre data/ventes.json dans le dépôt GitHub.
// =====================================================================
var _adminPwd = '';
var biensMasques = [];   // biens retirés du site depuis l'espace pro (toujours présents dans 3G)
function _adminTrouver(id) { var f = function (x) { return parseInt(x.id) === parseInt(id); }; return biens.find(f) || biensMasques.find(f); }
function _urlStatuts() { return AGENCE.statutProxyUrl ? AGENCE.statutProxyUrl.replace(/\/?$/, '/') + 'statuts' : 'data/ventes.json'; }
function _adminMode(setup) {
  var a = document.getElementById('adminLoginForm'), b = document.getElementById('adminSetupForm');
  if (a) a.hidden = !!setup; if (b) b.hidden = !setup;
  var st = document.getElementById('adminModalSub');
  if (st) st.textContent = setup ? 'Première connexion : choisissez votre mot de passe (8 caractères minimum).' : 'Accès réservé à Charles MOREL.';
}
var _adminAttempts = 0, _adminLockedUntil = 0, _adminBusy = false;

async function ouvrirEspacePro() {
  _adminDom();
  if (_adminPwd) { showPage('admin'); return; }
  var e = document.getElementById('adminError'); if (e) e.style.display = 'none';
  _adminMode(false);
  openModal('modal-admin');
  if (AGENCE.statutProxyUrl) {
    try {
      var r = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'etat' }) });
      var j = await r.json(); if (r.ok && j.configure === false) _adminMode(true);
    } catch (err) {}
  }
  setTimeout(function () { var i = document.getElementById(document.getElementById('adminSetupForm') && !document.getElementById('adminSetupForm').hidden ? 'adminPwdNew' : 'adminPwd'); if (i) i.focus(); }, 150);
}

async function creerMotDePasseAdmin() {
  var p1 = ((document.getElementById('adminPwdNew') || {}).value || ''), p2 = ((document.getElementById('adminPwdNew2') || {}).value || '');
  if (p1.length < 8) { showToast('8 caractères minimum.', 'error'); return; }
  if (p1 !== p2) { showToast('Les deux mots de passe ne sont pas identiques.', 'error'); return; }
  var btn = document.getElementById('adminSetupBtn'); if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement…'; }
  var status = 0;
  try {
    var r = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setup', password: p1 }) });
    status = r.status;
  } catch (err) { status = -1; }
  if (btn) { btn.disabled = false; btn.textContent = 'Créer mon mot de passe'; }
  if (status === 409) { showToast('Un mot de passe existe déjà : connectez-vous.', 'warning', 6000); _adminMode(false); return; }
  if (status !== 200) { showToast('Impossible d\'enregistrer le mot de passe pour le moment.', 'error', 6000); return; }
  document.getElementById('adminPwdNew').value = ''; document.getElementById('adminPwdNew2').value = '';
  _adminPwd = p1;
  if (window.PasswordCredential && navigator.credentials && navigator.credentials.store) {
    try { navigator.credentials.store(new PasswordCredential({ id: 'espace-pro-angevin', name: "Espace pro · L'Ardoise Immobilière", password: p1 })).catch(function () {}); } catch (err) {}
  }
  closeModal('modal-admin');
  document.body.classList.add('admin-mode');
  showToast('Mot de passe créé. Bienvenue dans votre espace pro.', 'success', 5000);
  showPage('admin');
}

async function checkAdmin() {
  if (Date.now() < _adminLockedUntil) {
    showToast('Trop de tentatives. Réessayez dans ' + Math.ceil((_adminLockedUntil - Date.now()) / 1000) + ' s.', 'error');
    return;
  }
  var pwd = ((document.getElementById('adminPwd') || {}).value || '');
  if (!pwd) { showToast('Mot de passe requis', 'error'); return; }
  if (!AGENCE.statutProxyUrl) { showToast("L'espace pro n'est pas encore activé : le serveur des statuts reste à brancher.", 'warning', 7000); return; }
  var btn = document.getElementById('adminLoginBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Vérification…'; }
  var status = 0;
  try {
    var r = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwd, check: true }) });
    status = r.status;
  } catch (e) { status = -1; }
  if (btn) { btn.disabled = false; btn.textContent = 'Accéder'; }
  if (status === -1) { showToast('Connexion au serveur impossible. Réessayez dans un instant.', 'error', 6000); return; }
  if (status === 200) {
    _adminAttempts = 0; _adminPwd = pwd;
    if (window.PasswordCredential && navigator.credentials && navigator.credentials.store) {
      try { navigator.credentials.store(new PasswordCredential({ id: 'espace-pro-angevin', name: "Espace pro · L'Ardoise Immobilière", password: pwd })).catch(function () {}); } catch (e) {}
    }
    closeModal('modal-admin');
    document.getElementById('adminPwd').value = '';
    document.getElementById('adminError').style.display = 'none';
    document.body.classList.add('admin-mode');
    showPage('admin');
    return;
  }
  if (status !== 401) { showToast('Le serveur des statuts ne répond pas correctement (' + status + ').', 'error', 6000); return; }
  _adminAttempts++;
  if (_adminAttempts >= 5) { _adminLockedUntil = Date.now() + 60000; _adminAttempts = 0; showToast('Trop de tentatives : verrouillé 60 secondes.', 'error', 6000); }
  document.getElementById('adminError').style.display = 'block';
}

function adminDeconnexion() {
  _adminPwd = ''; _adminDemandesChargees = false;
  document.body.classList.remove('admin-mode');
  showPage('home');
  showToast("Vous êtes déconnecté de l'espace pro.", 'info', 3000);
}

function _adminEtiquettes(b) {
  return {
    nouveau: (b.nouveaute !== undefined) ? !!b.nouveaute : !!(b.createdAt && (Date.now() - new Date(b.createdAt).getTime()) < 21 * 86400000),
    baisse: (b.baisse !== undefined) ? !!b.baisse : !!b.baisseDePrix
  };
}

function _adminLigne(b) {
  var statut = b.statut || 'en_vente', et = _adminEtiquettes(b), dis = _adminBusy ? ' disabled' : '';
  var badge = statut === 'sous_compromis' ? '<span class="admin-statut-badge admin-statut-compromis">Sous compromis</span>'
    : statut === 'offre_en_cours' ? '<span class="admin-statut-badge admin-statut-offre">Offre en cours</span>'
    : statut === 'vendu' ? '<span class="admin-statut-badge admin-statut-vendu">Vendu</span>' : '';
  var ref = b.ref && String(b.ref).trim() ? String(b.ref).trim() : genRef(b.id);
  var actions = (statut === 'vendu')
    ? '<button class="btn-statut btn-vendu active"' + dis + ' onclick="adminSetStatut(' + b.id + ', \'vendu\')" title="Retirer le statut « Vendu »">Vendu ✓ · remettre en vente</button>'
    : '<button class="btn-statut btn-une ' + (b.alaune ? 'active' : '') + '"' + dis + ' onclick="adminSetUne(' + b.id + ')" title="Afficher / retirer des « Biens à la une » (accueil)">★ À la une</button>' +
      '<button class="btn-statut btn-new ' + (et.nouveau ? 'active' : '') + '"' + dis + ' onclick="adminSetNouveaute(' + b.id + ')" title="Étiquette « Nouveauté »">Nouveauté</button>' +
      '<button class="btn-statut btn-baisse ' + (et.baisse ? 'active' : '') + '"' + dis + ' onclick="adminSetBaisse(' + b.id + ')" title="Étiquette « Baisse de prix »">Baisse de prix</button>' +
      '<button class="btn-statut btn-exclu ' + (b.exclusif ? 'active' : '') + '"' + dis + ' onclick="adminSetExclusif(' + b.id + ')" title="Exclusivité">Exclusivité</button>' +
      '<button class="btn-statut btn-offre ' + (statut === 'offre_en_cours' ? 'active' : '') + '"' + dis + ' onclick="adminSetStatut(' + b.id + ', \'offre_en_cours\')" title="Offre en cours">Offre</button>' +
      '<button class="btn-statut btn-compromis ' + (statut === 'sous_compromis' ? 'active' : '') + '"' + dis + ' onclick="adminSetStatut(' + b.id + ', \'sous_compromis\')" title="Sous compromis">Compromis</button>' +
      '<button class="btn-statut btn-vendu"' + dis + ' onclick="adminSetStatut(' + b.id + ', \'vendu\')" title="Vendu → Nos dernières ventes">Vendu</button>';
  if (b.masque) actions = '<button class="btn-statut btn-reafficher"' + dis + ' onclick="adminSetMasque(' + b.id + ', false)" title="Remettre ce bien sur le site">↺ Réafficher sur le site</button>';
  else actions += '<button class="btn-statut btn-supprimer"' + dis + ' onclick="adminSetMasque(' + b.id + ', true)" title="Retirer ce bien du site (il reste dans 3G)">Supprimer</button>';
  return '<div class="admin-bien-row">' +
      '<img class="admin-bien-img" src="' + _esc(b.img ? imgOpt(b.img, 300) : PLACEHOLDER_IMG) + '" alt="">' +
      '<div class="admin-bien-info"><h4>' + _esc(b.titre || b.type || 'Bien') + ' ' + badge + '</h4>' +
        '<p>' + _esc(b.ville || '') + ' · ' + _esc(b.type || '') + ' · ' + _esc(formatPrixPublic(b)) + '</p>' +
        '<p class="admin-src">Réf. ' + _esc(ref) + (statut !== 'vendu' && !b.masque ? ' · <a href="#" onclick="showFiche(' + b.id + ');return false;" style="text-decoration:underline;">voir l\'annonce</a>' : '') + '</p></div>' +
      '<div class="admin-bien-actions">' + _adminConseillerSelect(b, dis) + actions + '</div>' +
    '</div>';
}

function renderAdmin() {
  var list = document.getElementById('adminList'); if (!list) return;
  var actifs = biens.filter(function (b) { return b.statut !== 'vendu'; }).sort(function (a, b) { return (parseInt(b.id) || 0) - (parseInt(a.id) || 0); });
  var vendus = biens.filter(function (b) { return b.statut === 'vendu'; }).sort(function (a, b) { return new Date(b.dateVente || 0) - new Date(a.dateVente || 0); });
  list.innerHTML = actifs.length ? actifs.map(_adminLigne).join('') : '<p class="admin-aide">Aucun bien en ligne pour le moment.</p>';
  var w = document.getElementById('adminVendusWrap'), v = document.getElementById('adminVendus');
  if (w) w.hidden = vendus.length === 0;
  if (v) v.innerHTML = vendus.map(_adminLigne).join('');
  var mw = document.getElementById('adminMasquesWrap'), m = document.getElementById('adminMasques');
  if (mw) mw.hidden = biensMasques.length === 0;
  if (m) m.innerHTML = biensMasques.map(_adminLigne).join('');
  if (!_adminDemandesChargees) _adminChargerDemandes(false);
}

// ----- Demandes d'estimation et alertes e-mail (relais Cloudflare, serverless/demandes.js)
var _adminDemandesChargees = false;
function _adminDate(iso) { try { return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso || ''; } }
async function _adminChargerDemandes(force) {
  if (!_adminPwd || !AGENCE.statutProxyUrl) return;
  _adminDemandesChargees = true;
  var info = document.getElementById('adminDemandesInfo'), liste = document.getElementById('adminDemandes');
  var ainfo = document.getElementById('adminAlertesInfo'), aliste = document.getElementById('adminAlertes');
  if (!info || !liste) return;
  if (force) info.textContent = 'Chargement…';
  var j = null;
  try {
    var r = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: _adminPwd, action: 'demandes' }) });
    if (r.ok) j = await r.json();
  } catch (e) {}
  if (!j) { info.textContent = 'Impossible de charger les demandes pour le moment.'; _adminDemandesChargees = false; return; }
  var d = _adminTrierDemandes(j.demandes || []), a = j.alertes || [];
  var _aTraiter = d.filter(_adminADue).length;
  info.textContent = (_aTraiter ? _aTraiter + ' à rappeler maintenant (en haut). ' : '') + (d.length ? d.length + ' demande' + (d.length > 1 ? 's' : '') + ' au total.' : 'Aucune demande pour le moment.') +
    (j.emails ? ' Chaque nouvelle demande vous est aussi envoyée par e-mail.' : ' L\'envoi par e-mail n\'est pas encore branché : consultez vos demandes ici.') +
    ' Elles sont effacées automatiquement après 3 ans.';
  liste.innerHTML = d.map(function (x) {
    var bien = [x.type, x.surface ? x.surface + ' m²' : '', x.terrain ? 'terrain ' + x.terrain + ' m²' : '', x.pieces ? x.pieces + ' p.' : ''].filter(Boolean).join(' · ');
    var plus = [x.etat, x.dpe ? 'DPE ' + x.dpe : '', x.annee ? 'construit en ' + x.annee : '', x.prestations, x.projet].filter(Boolean).join(' · ');
    return '<div class="admin-demande' + (_adminADue(x) ? ' a-rappeler' : '') + '">' +
      '<div class="admin-demande-tete"><strong>' + _esc(x.prenom + ' ' + x.nom) + '</strong><span>' + _esc(_adminDate(x.recu)) + '</span></div>' +
      '<p><a href="tel:' + _esc(String(x.tel || '').replace(/[^0-9+]/g, '')) + '">' + _esc(x.tel) + '</a> · <a href="mailto:' + _esc(x.email) + '">' + _esc(x.email) + '</a></p>' +
      '<p><b>' + _esc(bien) + '</b> à ' + _esc((x.adresse ? x.adresse + ', ' : '') + x.ville) + '</p>' +
      (plus ? '<p class="admin-src">' + _esc(plus) + '</p>' : '') +
      (x.estimation ? '<p>Estimation affichée : <b>' + _esc(x.estimation) + '</b></p>' : '<p class="admin-src">Pas d\'estimation automatique (type de bien ou commune sans données).</p>') +
      (x.message ? '<p class="admin-demande-msg">« ' + _esc(x.message) + ' »</p>' : '') +
      _adminSuiviHTML(x) +
      '<div class="admin-bien-actions"><button class="btn-statut btn-supprimer" onclick="adminSupprimerDemande(\'' + _esc(x.cle) + '\')">Supprimer</button></div>' +
    '</div>';
  }).join('');
  if (ainfo) ainfo.textContent = !j.alertesActives
    ? 'Les alertes ne sont pas encore proposées aux visiteurs : elles s\'ouvriront dès que l\'envoi d\'e-mails sera branché sur votre nom de domaine.'
    : (a.length ? a.length + ' alerte' + (a.length > 1 ? 's' : '') + '. Les abonnés reçoivent un e-mail chaque matin s\'il y a un nouveau bien ou une baisse de prix pour leur recherche.' : 'Aucune alerte pour le moment.');
  if (aliste) aliste.innerHTML = a.map(function (x) {
    return '<div class="admin-demande"><div class="admin-demande-tete"><strong>' + _esc(x.email) + '</strong><span>' + (x.confirme ? 'Active' : 'En attente de confirmation') + ' · ' + _esc(_adminDate(x.cree)) + '</span></div>' +
      '<p>' + _esc(x.criteres) + '</p>' +
      '<div class="admin-bien-actions"><button class="btn-statut btn-supprimer" onclick="adminSupprimerDemande(\'' + _esc(x.cle) + '\')">Supprimer</button></div></div>';
  }).join('');
}
async function adminSupprimerDemande(cle) {
  var ok = await showConfirm(/^alerte:/.test(cle) ? 'Supprimer cette alerte ? L\'abonné ne recevra plus d\'e-mails.' : 'Supprimer définitivement cette demande ?', { title: 'Espace pro', okText: 'Supprimer', cancelText: 'Annuler', danger: true });
  if (!ok) return;
  try {
    var r = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: _adminPwd, action: 'supprimer', cle: cle }) });
    if (!r.ok) throw new Error();
    showToast('Supprimé.', 'success', 3000);
  } catch (e) { showToast('Suppression impossible pour le moment.', 'error', 5000); }
  _adminChargerDemandes(true);
}

async function _chargerOverlay() {
  try { var r = await fetch(_urlStatuts() + '?t=' + Date.now(), { cache: 'no-cache' }); if (r.ok) { var j = await r.json(); return Array.isArray(j.ventes) ? j.ventes : []; } } catch (e) {}
  return [];
}

async function _publierStatuts(ventes) {
  if (!AGENCE.statutProxyUrl) { showToast('Serveur des statuts non configuré.', 'error', 7000); return false; }
  if (!_adminPwd) { showToast("Reconnectez-vous à l'espace pro.", 'error', 6000); return false; }
  try {
    var res = await fetch(AGENCE.statutProxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: _adminPwd, ventes: ventes }) });
    if (res.status === 401) { showToast('Mot de passe refusé par le serveur.', 'error', 6000); return false; }
    if (!res.ok) { showToast('Échec de publication (' + res.status + ').', 'error', 6000); return false; }
    return true;
  } catch (e) { showToast('Connexion au serveur impossible.', 'error', 6000); return false; }
}

async function _adminMajBadge(id, changes) {
  if (_adminBusy) return;
  var b = _adminTrouver(id);
  if (!b) return;
  _adminBusy = true; renderAdmin();
  try {
    var overlay = await _chargerOverlay();
    // GitHub Pages met ~1 min à servir le fichier publié : on part de la dernière version publiée d'ici.
    try { var pend = JSON.parse(localStorage.getItem('ia_overlay_pending') || 'null'); if (pend && (Date.now() - pend.ts) < 300000 && Array.isArray(pend.ventes)) overlay = pend.ventes; } catch (e) {}
    var i = overlay.findIndex(function (v) { return parseInt(v.id) === parseInt(id); });
    var e = (i >= 0) ? overlay[i] : { id: parseInt(id) };
    if (changes.statut !== undefined) { e.statut = changes.statut; e.dateVente = (changes.statut === 'vendu') ? new Date().toISOString() : null; e.override = true; }
    if (changes.exclusif !== undefined) { e.exclusif = !!changes.exclusif; e.override = true; }
    if (changes.alaune !== undefined) e.alaune = !!changes.alaune;
    if (changes.nouveaute !== undefined) e.nouveaute = !!changes.nouveaute;
    if (changes.baisse !== undefined) e.baisse = !!changes.baisse;
    if (changes.masque !== undefined) { if (changes.masque) e.masque = true; else delete e.masque; e.override = true; }
    if (changes.conseiller !== undefined) { if (changes.conseiller && changes.conseiller !== CONSEILLER_DEFAUT) e.conseiller = changes.conseiller; else delete e.conseiller; }
    e.titre = b.titre || ''; e.type = b.type || 'Bien'; e.ville = b.ville || ''; e.cp = b.cp || ''; e.img = b.img || ''; e.prix = b.prix || 0;
    if (i >= 0) overlay[i] = e; else overlay.unshift(e);
    overlay = overlay.filter(function (v) {
      return v.override || v.conseiller || v.alaune || v.exclusif || v.masque || (typeof v.nouveaute !== 'undefined') || (typeof v.baisse !== 'undefined') || (v.statut && v.statut !== 'en_vente');
    });
    var ok = await _publierStatuts(overlay);
    if (!ok) return;
    try { localStorage.setItem('ia_overlay_pending', JSON.stringify({ ts: Date.now(), ventes: overlay })); } catch (err) {}
    if (changes.statut !== undefined) { b.statut = changes.statut; b.dateVente = e.dateVente || null; }
    if (changes.exclusif !== undefined) b.exclusif = !!changes.exclusif;
    if (changes.alaune !== undefined) b.alaune = !!changes.alaune;
    if (changes.nouveaute !== undefined) b.nouveaute = !!changes.nouveaute;
    if (changes.baisse !== undefined) b.baisse = !!changes.baisse;
    if (changes.conseiller !== undefined) { if (changes.conseiller && changes.conseiller !== CONSEILLER_DEFAUT) b.conseiller = changes.conseiller; else delete b.conseiller; }
    if (changes.masque !== undefined) {
      b.masque = !!changes.masque;
      biens = biens.filter(function (x) { return x !== b; }); biensMasques = biensMasques.filter(function (x) { return x !== b; });
      if (b.masque) biensMasques.unshift(b); else biens.push(b);
    }
    try { localStorage.setItem('ia_biens', JSON.stringify(biens)); } catch (err) {}
    renderHomeGrid();
    if (typeof renderBiensGrid === 'function') renderBiensGrid();
    renderVendusCarousel();
    showToast('Publié sur le site.', 'success', 4000);
  } finally {
    _adminBusy = false; renderAdmin();
  }
}

async function adminSetStatut(id, statut) {
  var b = biens.find(function (x) { return parseInt(x.id) === parseInt(id); }); if (!b) return;
  var cible = (b.statut === statut) ? 'en_vente' : statut;
  var labels = { sous_compromis: 'Sous compromis', offre_en_cours: 'Offre en cours', vendu: 'Vendu' };
  var msg = (cible === 'en_vente') ? 'Retirer ce statut et remettre le bien « en vente » sur le site ?' : 'Marquer ce bien « ' + (labels[statut] || statut) + ' » sur le site ?';
  var ok = await showConfirm(msg, { title: 'Espace pro', okText: 'Publier', cancelText: 'Annuler' });
  if (!ok) return;
  await _adminMajBadge(id, { statut: cible });
}
async function adminSetExclusif(id) { var b = biens.find(function (x) { return parseInt(x.id) === parseInt(id); }) || {}; await _adminMajBadge(id, { exclusif: !b.exclusif }); }
async function adminSetUne(id) { var b = biens.find(function (x) { return parseInt(x.id) === parseInt(id); }) || {}; await _adminMajBadge(id, { alaune: !b.alaune }); }
async function adminSetNouveaute(id) { var b = biens.find(function (x) { return parseInt(x.id) === parseInt(id); }) || {}; await _adminMajBadge(id, { nouveaute: !_adminEtiquettes(b).nouveau }); }
async function adminSetBaisse(id) { var b = biens.find(function (x) { return parseInt(x.id) === parseInt(id); }) || {}; await _adminMajBadge(id, { baisse: !_adminEtiquettes(b).baisse }); }

async function adminSetMasque(id, masquer) {
  var msg = masquer
    ? 'Retirer ce bien du site ? Il restera dans 3G, et vous pourrez le réafficher depuis « Biens retirés du site ».'
    : 'Remettre ce bien sur le site ?';
  var ok = await showConfirm(msg, { title: 'Espace pro', okText: masquer ? 'Supprimer du site' : 'Réafficher', cancelText: 'Annuler', danger: !!masquer });
  if (!ok) return;
  await _adminMajBadge(id, { masque: !!masquer });
}

// Cookies
function initCookieBanner() {
  if (!localStorage.getItem('cookieConsent')) {
    setTimeout(function() { var b=document.getElementById('cookie-banner'); if(b)b.style.display='flex'; }, 1500);
  }
}
function closeCookieBanner(a) {
  localStorage.setItem('cookieConsent', a?'accepted':'refused');
  var b=document.getElementById('cookie-banner'); if(b)b.style.display='none';
}
function openCookieModal(){var m=document.getElementById('modal-cookies');if(m)m.classList.add('open');}
function closeCookieModal(){var m=document.getElementById('modal-cookies');if(m)m.classList.remove('open');}
function saveCookiePrefs(){localStorage.setItem('cookieConsent','custom');closeCookieModal();}
function showCookieSection(key,el){
  document.querySelectorAll('.cookies-nav-item').forEach(function(i){i.classList.remove('active');});
  el.classList.add('active');
  var titles={confidentialite:"Votre confidentialité",necessaires:"Cookies nécessaires",fonctionnalite:"Fonctionnalité",performance:"Performance",info:"Plus d'information"};
  var htmls={
    confidentialite:"<p>Les cookies améliorent votre navigation.</p>",
    necessaires:"<p>Essentiels au fonctionnement du site.</p>",
    fonctionnalite:"<p>Mémorisent vos préférences.</p>",
    performance:"<p>Analysent la fréquentation de façon anonyme.</p>",
    info:"<p>Pour toute question : voir la page Contact.</p>"
  };
  var el2=document.getElementById('cookie-section-content');
  if(el2&&titles[key]) el2.innerHTML='<h3>'+titles[key]+'</h3>'+(htmls[key]||'');
}
