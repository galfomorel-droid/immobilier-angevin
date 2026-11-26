/* Mesure d'audience sans cookie — généré par _communes/generer.py depuis _communes/coordonnees.json (ne pas modifier à la main). */
(function () {
  var CFG = {"outil": "", "site": ""};
  var refus = false; try { refus = localStorage.getItem('cookieConsent') === 'refused'; } catch (e) {}
  window.mesurer = function (nom) {
    if (refus) return;
    try {
      if (CFG.outil === 'goatcounter' && window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'evenement-' + nom, title: nom, event: true });
      else if (CFG.outil === 'plausible' && window.plausible) window.plausible(nom);
    } catch (e) {}
  };
  if (refus) return;
  var s = document.createElement('script'); s.async = true;
  if (CFG.outil === 'goatcounter') { s.src = 'https://gc.zgo.at/count.js'; s.setAttribute('data-goatcounter', 'https://' + CFG.site + '.goatcounter.com/count'); }
  else { window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); }; s.defer = true; s.src = 'https://plausible.io/js/script.js'; s.setAttribute('data-domain', CFG.site); }
  document.head.appendChild(s);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('tel:') === 0) window.mesurer('clic-telephone');
    else if (h.indexOf('mailto:') === 0) window.mesurer('clic-email');
    else if (h.indexOf('wa.me') !== -1) window.mesurer('clic-whatsapp');
  }, true);
})();
