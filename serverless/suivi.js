/**
 * SUIVI DES DEMANDES D'ESTIMATION : aucun propriétaire ne repart avec son chiffre sans être recontacté.
 *
 *  1. Chaque demande arrive « à rappeler » (demandes.js) ; l'espace pro affiche son état et sa date de rappel.
 *  2. Tous les matins (cron), Charles reçoit la liste des propriétaires à rappeler ce jour-là ou en retard,
 *     jusqu'à ce que la demande change d'état dans l'espace pro.
 *  3. Le propriétaire peut demander une visite d'estimation (créneaux) depuis son résultat ou depuis un e-mail.
 *  4. S'il l'a accepté (case à cocher, décochée par défaut), il reçoit au plus 3 e-mails de suivi :
 *     J+2 (affiner l'estimation par une visite), J+10 (les prix réels de sa commune), J+30 (où en est le projet).
 *     Les relances s'arrêtent dès qu'une visite est demandée ou que la demande est traitée, et en un clic (lien d'arrêt).
 *
 * Stockage (KV) : demande:<ordre> (voir demandes.js) et suivi:<jeton> → clé de la demande.
 */
import { JOUR, esc, eur, emailValide, texte, limiter, envoyerEmail, gabarit, pageHtml, alertesActives } from './demandes.js';

export const ETATS = {
  nouveau: 'Nouvelle demande',
  a_rappeler: 'À rappeler',
  rappele: 'Rappelé',
  rdv_demande: 'Visite demandée',
  rdv_pris: 'Visite programmée',
  mandat: 'Mandat signé',
  perdu: 'Sans suite',
};
const A_TRAITER = ['nouveau', 'a_rappeler', 'rdv_demande'];          // apparaissent dans le récapitulatif du matin
const SANS_RELANCE = ['rdv_demande', 'rdv_pris', 'mandat', 'perdu'];  // plus d'e-mails de suivi au propriétaire
const RELANCES_JOURS = [2, 10, 30];
const MAX_RELANCES_PAR_TOURNEE = 10;   // + récapitulatif + prix.json : reste dans la limite de 50 requêtes avec les alertes (30)
const CRENEAUX = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Matin', 'Midi', 'Après-midi', 'Fin de journée', 'Dès que possible'];

const jetonValide = (t) => typeof t === 'string' && /^[0-9a-f]{48}$/.test(t);
const urlSite = (env) => (env.SITE_URL || '').replace(/\/?$/, '/');
const urlRelais = (env) => (env.RELAIS_URL || '').replace(/\/?$/, '/');
const lienVisite = (env, j) => urlSite(env) + '?rdv=' + j + '#estimation';
const lienArret = (env, j) => urlRelais(env) + 'suivi?arreter=' + j;

async function demandeParJeton(env, j) {
  if (!jetonValide(j)) return null;
  const cle = await env.STATUTS.get('suivi:' + j);
  if (!cle) return null;
  const dem = await env.STATUTS.get(cle, 'json');
  return dem ? { cle, dem } : null;
}
async function enregistrer(env, cle, dem) {
  await env.STATUTS.put(cle, JSON.stringify(dem), { expirationTtl: 3 * 365 * JOUR });
}
function changerEtat(dem, etat, rappel) {
  dem.suivi = dem.suivi || { etat: 'nouveau', relances: 0, historique: [] };
  dem.suivi.etat = etat;
  if (rappel !== undefined) dem.suivi.rappel = rappel;
  dem.suivi.historique = (dem.suivi.historique || []).concat({ le: new Date().toISOString(), etat }).slice(-30);
}
const bienDe = (d) => [d.type, d.surface ? d.surface + ' m²' : ''].filter(Boolean).join(' de ') + ' à ' + d.ville;

// ----------------------------------------------------------------- le propriétaire demande une visite d'estimation
export async function demanderVisite(body, request, env) {
  if (body.site) return { status: 200, corps: { ok: true } };   // pot de miel anti-robots
  const t = await demandeParJeton(env, body.jeton);
  if (!t) return { status: 404, corps: { error: 'Demande introuvable' } };
  const creneaux = (Array.isArray(body.creneaux) ? body.creneaux : []).filter((c) => CRENEAUX.includes(c)).slice(0, 11);
  if (!creneaux.length) return { status: 400, corps: { error: 'Choisissez au moins un créneau' } };
  if (!(await limiter(request, env))) return { status: 429, corps: { error: 'Trop de demandes, réessayez plus tard' } };
  const { cle, dem } = t;
  dem.visite = { creneaux, message: texte(body.message, 600), le: new Date().toISOString() };
  changerEtat(dem, 'rdv_demande', new Date().toISOString());
  await enregistrer(env, cle, dem);
  if (env.EMAIL_AGENT) {
    await envoyerEmail(env, {
      to: env.EMAIL_AGENT, replyTo: emailValide(dem.email) ? dem.email : undefined,
      subject: 'Visite d\'estimation demandée : ' + dem.prenom + ' ' + dem.nom + ' (' + dem.ville + ')',
      html: gabarit(env, 'Visite d\'estimation demandée', `<p style="font-size:15px;line-height:1.6;margin:0 0 12px;"><strong>${esc(dem.prenom)} ${esc(dem.nom)}</strong> souhaite une visite pour affiner l'estimation de son bien : ${esc(bienDe(dem))}.</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Disponibilités : <strong>${esc(creneaux.join(', '))}</strong></p>
${dem.visite.message ? `<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">« ${esc(dem.visite.message)} »</p>` : ''}
<p style="margin:18px 0 0;"><a href="tel:${esc(String(dem.tel || '').replace(/[^0-9+]/g, ''))}" style="display:inline-block;background:#F6A737;color:#021430;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;">Appeler ${esc(dem.prenom)} · ${esc(dem.tel)}</a></p>`,
        'Pensez à passer la demande en « Visite programmée » dans l\'espace pro une fois le rendez-vous fixé.'),
      text: dem.prenom + ' ' + dem.nom + ' demande une visite (' + bienDe(dem) + '). Disponibilités : ' + creneaux.join(', ') + '. Tél. ' + dem.tel,
    });
  }
  return { status: 200, corps: { ok: true, prenom: dem.prenom } };
}

// Lecture publique minimale pour le lien « Choisir un créneau » (prénom et bien seulement, rien de sensible)
export async function infoVisite(body, env) {
  const t = await demandeParJeton(env, body.jeton);
  if (!t) return { status: 404, corps: { error: 'Demande introuvable' } };
  return { status: 200, corps: { prenom: t.dem.prenom, bien: bienDe(t.dem), estimation: t.dem.estimation || '', dejaDemandee: !!t.dem.visite } };
}

// ----------------------------------------------------------------- lien d'arrêt des e-mails de suivi
export async function pageSuivi(request, env) {
  const u = new URL(request.url);
  const j = u.searchParams.get('arreter');
  const t = await demandeParJeton(env, j);
  if (!t) return pageHtml(env, 'Lien invalide', 'Ce lien n\'est pas valide ou a expiré.');
  if (request.method === 'POST' || u.searchParams.get('ok') === '1') {
    t.dem.consentSuivi = false; t.dem.suiviArreteLe = new Date().toISOString();
    await enregistrer(env, t.cle, t.dem);
    return pageHtml(env, 'C\'est noté', 'Vous ne recevrez plus d\'e-mails de suivi de votre estimation. Vous pouvez toujours nous appeler au ' + esc(env.TELEPHONE || '06 38 55 53 55') + '.',
      `<a class="b" href="${esc(urlSite(env))}">Retour au site</a>`);
  }
  return pageHtml(env, 'Arrêter les e-mails de suivi ?', 'Vous ne recevrez plus d\'e-mails au sujet de l\'estimation de votre bien (' + esc(bienDe(t.dem)) + ').',
    '<form method="post"><button type="submit">Arrêter les e-mails</button></form>');
}

// ----------------------------------------------------------------- espace pro : changer l'état, la date de rappel, la note
export async function majSuivi(body, env) {
  if (typeof body.cle !== 'string' || !/^demande:[0-9a-f:]+$/.test(body.cle)) return { status: 400, corps: { error: 'Clé invalide' } };
  const dem = await env.STATUTS.get(body.cle, 'json');
  if (!dem) return { status: 404, corps: { error: 'Demande introuvable' } };
  if (body.etat && !ETATS[body.etat]) return { status: 400, corps: { error: 'État inconnu' } };
  let rappel;
  if (body.rappel !== undefined) {
    if (body.rappel === '' || body.rappel === null) rappel = null;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(body.rappel)) rappel = body.rappel + 'T07:00:00.000Z';
    else return { status: 400, corps: { error: 'Date de rappel invalide' } };
  }
  if (body.etat && body.etat !== (dem.suivi || {}).etat) changerEtat(dem, body.etat, rappel);
  else if (rappel !== undefined) { dem.suivi = dem.suivi || { etat: 'nouveau', relances: 0, historique: [] }; dem.suivi.rappel = rappel; }
  if (body.note !== undefined) { dem.suivi = dem.suivi || {}; dem.suivi.note = texte(body.note, 1000); }
  await enregistrer(env, body.cle, dem);
  return { status: 200, corps: { ok: true, suivi: dem.suivi } };
}

// ----------------------------------------------------------------- tournée du matin (cron)
async function toutesLesDemandes(env) {
  const out = [];
  let cursor;
  do {
    const l = await env.STATUTS.list({ prefix: 'demande:', cursor });
    for (const k of l.keys) { const v = await env.STATUTS.get(k.name, 'json'); if (v) out.push({ cle: k.name, dem: v }); }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
  return out;
}

let _prix = null;   // data/prix.json, lu une seule fois par tournée
async function prixCommune(env, ville) {
  try {
    if (!_prix) { const r = await fetch(urlSite(env) + 'data/prix.json'); if (!r.ok) return null; _prix = await r.json(); }
    const p = _prix;
    const cle = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, ' ').trim();
    const nom = Object.keys(p.communes || {}).find((c) => cle(c) === cle(ville));
    const c = nom ? p.communes[nom] : null;
    const sect = c && p.secteurs ? p.secteurs[c.s] : null;
    return { commune: c, secteur: sect, nom, periode: p.periode };
  } catch (e) { return null; }
}

// ['2023', '2025-12-31'] → « de 2023 à fin 2025 »
function periodeTxt(p) {
  if (!Array.isArray(p) || p.length < 2) return '';
  const fin = /^(\d{4})-12-31$/.test(p[1]) ? 'fin ' + p[1].slice(0, 4) : String(p[1]);
  return ', de ' + esc(String(p[0]).slice(0, 4)) + ' à ' + esc(fin);
}

function emailRelance(env, n, dem, prix) {
  const j = dem.jeton, visite = lienVisite(env, j), arret = lienArret(env, j);
  const bouton = `<p style="margin:20px 0 6px;"><a href="${esc(visite)}" style="display:inline-block;background:#F6A737;color:#021430;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;">Choisir un créneau de visite</a></p>
<p style="font-size:14px;line-height:1.6;margin:8px 0 0;color:#5b6475;">Ou appelez-nous au ${esc(env.TELEPHONE || '06 38 55 53 55')}, ou répondez simplement à cet e-mail.</p>`;
  const pied = `Vous recevez cet e-mail car vous avez demandé une estimation sur notre site et accepté d'en recevoir le suivi (3 e-mails au plus). <a href="${esc(arret)}" style="color:#5b6475;">Ne plus recevoir ces e-mails</a>`;
  const bonjour = `<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Bonjour ${esc(dem.prenom)},</p>`;
  let sujet, titre, corps;
  if (n === 0) {
    sujet = 'Affinons l\'estimation de votre ' + String(dem.type || 'bien').toLowerCase();
    titre = 'Affinons votre estimation';
    corps = bonjour + `<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Vous avez estimé votre bien (${esc(bienDe(dem))}) sur notre site${dem.estimation ? ' : <strong>' + esc(dem.estimation.split(' (')[0]) + '</strong>' : ''}.</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Ce calcul repose sur les ventes réelles du secteur, mais il ne voit ni l'état exact, ni l'exposition, ni les travaux réalisés. Une visite de 30 minutes nous permet de vous donner un prix argumenté, gratuitement et sans engagement.</p>` + bouton;
  } else if (n === 1) {
    const c = prix && (prix.commune || prix.secteur);
    const k = /appart/i.test(dem.type || '') ? 'a' : 'm';
    const st = c && c[k] && c[k].n ? c[k] : null;
    sujet = 'Les prix de vente réels à ' + dem.ville;
    titre = 'Ce qui se vend à ' + esc(dem.ville);
    corps = bonjour + (st
      ? `<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">D'après les ventes enregistrées par l'administration fiscale (DVF${periodeTxt(prix.periode)}), ${st.n.toLocaleString('fr-FR')} ${k === 'a' ? 'appartements ont été vendus' : 'maisons ont été vendues'} ${prix.commune ? 'à ' + esc(prix.nom) : 'dans le secteur'}.</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Prix médian : <strong>${eur(st.p50)} / m²</strong>. La moitié des ventes se situe entre ${eur(st.p25)} et ${eur(st.p75)} / m² : l'écart vient de l'emplacement, de l'état et des prestations, que seule une visite permet d'apprécier.</p>`
      : `<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Dans votre commune, les ventes sont trop peu nombreuses pour un prix moyen fiable : c'est justement là qu'un avis de terrain fait la différence.</p>`) + bouton;
  } else {
    sujet = 'Votre projet immobilier avance-t-il ?';
    titre = 'Où en est votre projet ?';
    corps = bonjour + `<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Il y a un mois, vous avez estimé votre bien (${esc(bienDe(dem))}). Que votre projet soit pour bientôt ou pour plus tard, nous restons à votre disposition pour un avis de valeur précis, gratuit et sans engagement.</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">C'est notre dernier message à ce sujet.</p>` + bouton;
  }
  return { sujet, html: gabarit(env, titre, corps, pied), texte: dem.prenom + ', ' + sujet + '. Choisir un créneau : ' + visite + '\nNe plus recevoir ces e-mails : ' + arret };
}

export async function tourneeSuivi(env) {
  const rapport = { demandes: 0, aRappeler: 0, recap: false, relances: 0, erreurs: 0 };
  const maintenant = Date.now();
  const tout = await toutesLesDemandes(env);
  rapport.demandes = tout.length;

  // 1. Récapitulatif du matin pour Charles : demandes à traiter dont la date de rappel est passée
  const dues = tout.filter(({ dem }) => dem.suivi && A_TRAITER.includes(dem.suivi.etat) && dem.suivi.rappel && Date.parse(dem.suivi.rappel) <= maintenant)
    .sort((a, b) => Date.parse(a.dem.suivi.rappel) - Date.parse(b.dem.suivi.rappel));
  rapport.aRappeler = dues.length;
  if (dues.length && env.EMAIL_AGENT) {
    const lignes = dues.map(({ dem }) => {
      const jours = Math.floor((maintenant - Date.parse(dem.recu)) / (JOUR * 1000));
      const retard = jours >= 1 && dem.suivi.etat === 'nouveau';
      return `<tr><td style="padding:12px 0;border-bottom:1px solid #eef0f4;vertical-align:top;">
<p style="margin:0 0 4px;font-size:15px;"><strong>${esc(dem.prenom)} ${esc(dem.nom)}</strong> · <span style="color:${retard ? '#B42318' : '#5b6475'};">${esc(ETATS[dem.suivi.etat])}${retard ? ' depuis ' + jours + ' jour' + (jours > 1 ? 's' : '') : ''}</span></p>
<p style="margin:0 0 4px;font-size:14px;color:#5b6475;">${esc(bienDe(dem))}${dem.estimation ? ' · estimé ' + esc(dem.estimation.split(' (')[0]) : ''}</p>
${dem.visite ? `<p style="margin:0 0 4px;font-size:14px;">Disponibilités : ${esc(dem.visite.creneaux.join(', '))}</p>` : ''}
${dem.suivi.note ? `<p style="margin:0 0 4px;font-size:14px;color:#5b6475;">Note : ${esc(dem.suivi.note)}</p>` : ''}
<p style="margin:6px 0 0;"><a href="tel:${esc(String(dem.tel || '').replace(/[^0-9+]/g, ''))}" style="color:#936421;font-weight:bold;text-decoration:none;">${esc(dem.tel)}</a></p></td></tr>`;
    }).join('');
    const n = dues.length;
    const r = await envoyerEmail(env, {
      to: env.EMAIL_AGENT,
      subject: n + ' propriétaire' + (n > 1 ? 's' : '') + ' à rappeler aujourd\'hui',
      html: gabarit(env, n + ' propriétaire' + (n > 1 ? 's' : '') + ' à rappeler', `<p style="font-size:15px;line-height:1.6;margin:0 0 8px;">Ces demandes d'estimation attendent votre appel. Une fois appelé, changez leur état dans l'espace pro (ou choisissez une nouvelle date de rappel) : elles disparaîtront de ce récapitulatif.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lignes}</table>
<p style="margin:20px 0 0;"><a href="${esc(urlSite(env))}#admin" style="display:inline-block;background:#021430;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;">Ouvrir l'espace pro</a></p>`),
      text: dues.map(({ dem }) => dem.prenom + ' ' + dem.nom + ' · ' + dem.tel + ' · ' + bienDe(dem) + ' · ' + ETATS[dem.suivi.etat]).join('\n'),
    });
    rapport.recap = r.ok; if (!r.ok) rapport.erreurs++;
  }

  // 2. Relances au propriétaire (seulement avec son accord, au plus 3, arrêtées dès qu'une visite est demandée)
  if (alertesActives(env)) {
    _prix = null;
    for (const { cle, dem } of tout) {
      if (rapport.relances >= MAX_RELANCES_PAR_TOURNEE) break;
      const s = dem.suivi;
      if (!s || !dem.consentSuivi || !dem.jeton || !emailValide(dem.email) || SANS_RELANCE.includes(s.etat)) continue;
      const n = s.relances || 0;
      if (n >= RELANCES_JOURS.length) continue;
      const age = (maintenant - Date.parse(dem.recu)) / (JOUR * 1000);
      if (age < RELANCES_JOURS[n]) continue;
      if (s.derniereRelance && maintenant - Date.parse(s.derniereRelance) < 2 * JOUR * 1000) continue;
      let prix = null;
      if (n === 1) prix = await prixCommune(env, dem.ville);
      const m = emailRelance(env, n, dem, prix);
      const r = await envoyerEmail(env, { to: dem.email, replyTo: env.EMAIL_AGENT, subject: m.sujet, html: m.html, text: m.texte, desabonnement: lienArret(env, dem.jeton) });
      if (r.ok) {
        s.relances = n + 1; s.derniereRelance = new Date().toISOString();
        s.historique = (s.historique || []).concat({ le: s.derniereRelance, etat: s.etat, relance: n + 1 }).slice(-30);
        await enregistrer(env, cle, dem);
        rapport.relances++;
      } else rapport.erreurs++;
      await new Promise((r) => setTimeout(r, 600));   // Resend : 2 envois par seconde maximum
    }
  }
  return rapport;
}
