/* Biens du flux 3G sur les pages communes — généré par _communes/generer.py (ne pas modifier à la main). */
(function () {
  'use strict';
  var el = document.getElementById('biens-commune');
  if (!el) return;
  var PHOTOS_BANDEAU = {"1048653": 1, "1048718": 1, "1055054": 1, "1060555": 1, "1067381": 1, "1067385": 1, "1082612": 1, "1082616": 1, "1113051": 1, "1113067": 1, "1152486": 1, "1152490": 1, "1174881": 1, "1177410": 1, "1223539": 1, "1223551": 1, "1223552": 1, "1231174": 1, "1235796": 1, "1235797": 1, "1235805": 1, "1238221": 1, "1238222": 1, "1238235": 1, "1238236": 1, "1238254": 1, "1238272": 1, "1238273": 1};
  var COMMUNES_FORCEES = {"2000024081": ["Solesmes", "72300"]};
  var root = el.getAttribute('data-root') || '../../';
  var commune = el.getAttribute('data-commune');
  var aCommune = el.getAttribute('data-a') || ('à ' + commune);
  var secteur = [];
  try { secteur = JSON.parse(el.getAttribute('data-secteur') || '[]'); } catch (e) {}

  function cle(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, ' ').trim(); }
  function txt(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function eur(n) { return Math.round(Number(n) || 0).toLocaleString('fr-FR') + '\u00a0€'; }
  function slug(parts) { return parts.join('-').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function imgOpt(u) { return u.indexOf('admin.3gimmobilier.fr') === -1 ? u : 'https://wsrv.nl/?url=' + u.replace(/^https?:\/\//, '') + '&w=600&output=webp&q=74'; }
  function estBandeau(u) { var m = String(u).match(/get_file_id\/(\d+)/); return !!(m && PHOTOS_BANDEAU[m[1]]); }

  var cleCommune = cle(commune);
  var clesSecteur = {};
  secteur.forEach(function (v) { clesSecteur[cle(v)] = 1; });

  function conv(x) {
    var m = String(x.city || '').match(/^(.*?)\s*\((\d{5})\)\s*$/);
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
    if (b.surface) carac.push(b.surface + '\u00a0m²');
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
      '<p>Confiez-moi votre recherche\u202f: je vous préviens dès qu\'un bien correspondant à votre projet se présente.</p>' +
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

  fetch(el.getAttribute('data-flux'))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      var brut = Array.isArray(d) ? d : (d.properties || []);
      var tous = brut.map(conv).filter(function (b) { return b.ville && !b.location; });
      var ici = tous.filter(function (b) { return cle(b.ville) === cleCommune; });
      var autour = tous.filter(function (b) { return cle(b.ville) !== cleCommune && clesSecteur[cle(b.ville)] === 1; });
      if (ici.length) {
        // Peu de biens dans la commune : on complète avec quelques biens des alentours
        var complement = ici.length < 3 ? autour.slice(0, 3 - ici.length) : [];
        afficher(ici.concat(complement));
        if (complement.length) {
          var cartes = el.querySelectorAll('.bien');
          var sep = document.createElement('p');
          sep.className = 'biens-sous';
          sep.textContent = 'Également dans les environs\u00a0:';
          el.insertBefore(sep, cartes[ici.length]);
        }
        return;
      }
      if (autour.length) {
        afficher(autour.slice(0, 6), 'Pas de bien ' + txt(aCommune) + ' en ce moment\u202f: voici mes biens dans les communes voisines. ' +
          '<a class="lien" href="' + root + '#contact">Confiez-moi votre recherche</a>.');
        return;
      }
      vide();
    })
    .catch(function () {
      el.innerHTML = '<p class="biens-msg">Les annonces n\'ont pas pu être chargées. Retrouvez-les sur la page <a class="lien" href="' + root + '#acheter">Acheter</a>.</p>';
    });
})();
