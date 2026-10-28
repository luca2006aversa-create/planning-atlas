/* Entretiens : une galerie de personnes (photo, nom, infos) ; chaque personne a sa page : infos, résumé, questions et réponses,
   notes brutes, photos et documents à transcrire. Le questionnaire reste disponible dans un sous-onglet.
   Les entretiens sont des documents de la collection « reponses » (les fiches du questionnaire et celles en ligne en font partie). */

S.sousEnt = (() => { try { return localStorage.getItem("sousent") === "questionnaire" ? "questionnaire" : "personnes"; } catch (e) { return "personnes"; } })();
S.persId = null;
{ const o = ONGLETS.find((x) => x[0] === "questionnaire"); o[1] = "Entretiens"; o[2] = "Entretiens"; o[3] = "i-gens"; }

const peCss = document.createElement("style");
peCss.textContent = `.pgrille{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:12px}
.pcarte{border:1px solid var(--line);background:var(--surface);border-radius:14px;overflow:hidden;padding:0;text-align:left;display:grid;grid-template-rows:auto 1fr;cursor:pointer;color:inherit;min-width:0}
.pcarte:hover{border-color:var(--muted)}
.pphoto{position:relative;aspect-ratio:4/5;background:var(--sunk);display:grid;place-items:center;overflow:hidden}
.pphoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pini{width:84px;height:84px;border-radius:50%;display:grid;place-items:center;color:#fff;font:700 2rem var(--display)}
.pbadge{position:absolute;left:8px;top:8px;background:#e4572e;color:#fff;border-radius:99px;padding:3px 9px;font-size:.72rem;font-weight:700}
.pbadge.ok{background:#2f7a4f}
.pinfo{padding:9px 11px 11px;display:grid;gap:2px;align-content:start;min-width:0}
.pinfo b{font-size:.98rem;line-height:1.25;overflow-wrap:anywhere}
.pinfo span{font-size:.8rem;color:var(--muted);overflow-wrap:anywhere}
.pnouv{display:grid;place-items:center;border:2px dashed var(--line);background:transparent;border-radius:14px;min-height:140px;color:var(--muted);font-weight:700;cursor:pointer}
.pnouv:hover{border-color:var(--jaune);color:var(--ink)}
.ppage{display:grid;gap:14px;grid-template-columns:1fr}
@media (min-width:1000px){.ppage{grid-template-columns:300px 1fr;align-items:start}}
.pportrait{aspect-ratio:4/5;border-radius:14px;overflow:hidden;background:var(--sunk);position:relative;display:grid;place-items:center}
.pportrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pportrait .pini{width:120px;height:120px;font-size:2.8rem}
.pdl{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:.9rem;margin:0}.pdl dt{color:var(--muted)}.pdl dd{margin:0;overflow-wrap:anywhere}
.pqr{display:grid;gap:6px;padding:10px 0;border-top:1px solid var(--line)}.pqr:first-of-type{border-top:0;padding-top:0}
.pqr .pq{font-weight:700;overflow-wrap:anywhere}
.pqr textarea,.pqr input[type=text]{width:100%;font:inherit;color:inherit;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:8px 10px}
.pqr textarea{min-height:64px;resize:vertical}
.pqi{display:grid;grid-template-columns:1fr auto;gap:6px;padding:8px 0;border-top:1px solid var(--line)}.pqi:first-of-type{border-top:0}
.pqi textarea{width:100%;font:inherit;color:inherit;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:8px 10px;resize:vertical;min-height:44px}
.pdlg{max-width:520px;width:94vw;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--ink);padding:18px}
.pdlg::backdrop{background:#000a}
.pdlg .grille{display:grid;gap:10px}
.pif{display:grid;gap:3px;font-size:.8rem;color:var(--muted);font-weight:600}
.pif input,.pif select{font:inherit;font-weight:400;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:8px 10px;width:100%;min-width:0}
.cr-bloc .pif+.pif,.cr-bloc .pif+.duo,.cr-bloc .duo+.pif{margin-top:2px}`;
document.head.appendChild(peCss);

const peReponses = () => [...S.reponses].sort((a, b) => (a.quand || 0) - (b.quand || 0));
const peNumero = (r) => peReponses().findIndex((x) => x.id === r.id) + 1;
const peNom = (r) => r.nom || ((r.source === "lien" ? "Entretien en ligne" : "Entretien") + " n° " + peNumero(r));
const peIni = (r) => { const t = (r.nom || "").trim(); return t ? t.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase() : "?"; };
const peLigne = (r) => [r.profil, r.age ? r.age + " ans" : "", r.lieu].filter(Boolean).join(" · ");
const peNbRep = (r) => Object.values(r.rep || {}).filter((x) => x && (x.v || x.autre)).length + (r.qr || []).filter((x) => x.q || x.r).length;
const pePieces = (id) => S.fichiers.filter((f) => f.personne === id);
const peJourTxt = (r) => r.quand ? new Date(r.quand).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";
const peNum = (t) => String(t || "").replace(/[^\d+]/g, "");
function peCoord(r) {
  const l = (nom, val, lien, copie) => val ? `<dt>${nom}</dt><dd>${lien ? `<a href="${esc(lien)}" target="_blank" rel="noopener noreferrer" style="color:inherit;font-weight:600">${esc(val)}</a>` : esc(val)}${copie ? ` <button class="btn" data-pcopie="${esc(copie)}" style="padding:2px 9px;font-size:.75rem">Copier</button>` : ""}</dd>` : "";
  const z = peNum(r.zalo), t = peNum(r.telephone), rows = l("Zalo", r.zalo, z ? "https://zalo.me/" + z : "", r.zalo) + l("Téléphone", r.telephone, t ? "tel:" + t : "", r.telephone) + l("Email", r.email, r.email ? "mailto:" + r.email : "", r.email) + l("Adresse", r.adresse, "", "") + l("Autre", r.contact, "", "");
  return `<div class="cr-bloc"><h2>Coordonnées</h2>${rows ? `<dl class="pdl">${rows}</dl>` : `<p class="cr-vide">Aucune coordonnée pour l'instant.${S.ecrire ? " Utilise « Modifier les infos »." : ""}</p>`}</div>`;
}
const peMaj = (id, d) => { const r = S.reponses.find((x) => x.id === id) || {}; return db.collection("reponses").doc(id).update({ ...d, auteur: r.auteur || r.par || S.moi, par: S.moi, maj: Date.now() }).catch((e) => refus(e)); };

function peCarte(r) {
  const piece = pePieces(r.id).length, badge = r.valide ? `<span class="pbadge ok">Validé</span>` : r.a_transcrire && !r.transcrit ? `<span class="pbadge">À transcrire</span>` : "";
  return `<button class="pcarte" data-pers="${esc(r.id)}"><span class="pphoto">${r.photo ? `<img src="${esc(photoUrl(r.photo))}" alt="" loading="lazy">` : `<b class="pini" style="background:${couleurDe(r.id)}">${esc(peIni(r))}</b>`}${badge}</span>
    <span class="pinfo"><b>${esc(peNom(r))}</b>${peLigne(r) ? `<span>${esc(peLigne(r))}</span>` : ""}<span>${esc(peJourTxt(r))}${peNbRep(r) ? ` · ${peNbRep(r)} réponse${peNbRep(r) > 1 ? "s" : ""}` : ""}${piece ? ` · ${piece} doc.` : ""}</span></span></button>`;
}
function peGalerie() {
  const l = S.reponses.filter((r) => cherche(r, "nom", "profil", "lieu", "resume", "texte_libre")).sort((a, b) => (b.quand || 0) - (a.quand || 0));
  return `<div class="pgrille">${S.ecrire && db ? `<button class="pnouv" data-persnouveau="1">+ Nouvelle personne</button>` : ""}${l.map(peCarte).join("")}</div>${l.length ? "" : vide("Aucun entretien pour l'instant. Ajoute la première personne.")}`;
}

function peQuestionnaire(r) {
  const qs = [...S.questions].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)), L = QL[S.langQ];
  const mic = (c, id) => typeof avecMicro === "function" ? avecMicro(c, id, L.dicter) : c;
  return qs.map((q, i) => { const x = (r.rep || {})[q.id] || {};
    return `<div class="pqr"><span class="pq" lang="${S.langQ}">${i + 1}. ${esc(qt(q))}</span>${q.type === "ouverte"
      ? mic(`<textarea id="qr_${esc(q.id)}" data-pqr="${esc(q.id)}" rows="2" aria-label="${L.rep}">${esc(x.v || "")}</textarea>`, "qr_" + q.id)
      : `<div class="choix">${["oui", "non", "autre"].map((k) => `<label><input type="radio" name="qr_${esc(q.id)}" id="qr_${esc(q.id)}_${k}" data-pqr="${esc(q.id)}" value="${k}"${x.v === k ? " checked" : ""}><span>${L[k]}</span></label>`).join("")}</div>${mic(`<input type="text" id="qra_${esc(q.id)}" data-pqr="${esc(q.id)}" placeholder="${L.prec}" value="${esc(x.autre || "")}">`, "qra_" + q.id)}`}</div>`; }).join("") || `<p class="cr-vide">Pas encore de questions : écris-les dans le sous-onglet Questionnaire.</p>`;
}
function peLibres(r) {
  const qr = r.qr || [];
  return `${qr.map((x, i) => `<div class="pqi"><div style="display:grid;gap:6px"><textarea id="qrq_${i}" data-pqi="${i}" data-k="q" rows="1" placeholder="Question">${esc(x.q || "")}</textarea><textarea id="qrr_${i}" data-pqi="${i}" data-k="r" rows="2" placeholder="Réponse">${esc(x.r || "")}</textarea></div><button class="btn ico" data-qrsuppr="${i}" aria-label="Supprimer">✕</button></div>`).join("") || `<p class="cr-vide">Aucune question-réponse libre. Dépose les notes à transcrire ci-dessous, ou ajoute-les à la main.</p>`}${S.ecrire ? `<div><button class="btn" data-qrajout="1">${ic("i-plus", 14)}Ajouter une question et sa réponse</button></div>` : ""}`;
}
function peReponseTxt(a) { return a.v === "oui" ? "Oui" : a.v === "non" ? "Non" : a.v === "autre" && !a.autre ? "Autre" : a.v || ""; }
function peLectureQR(r) {
  const q = [...S.questions].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)).map((x) => { const a = (r.rep || {})[x.id]; return a && (a.v || a.autre) ? { q: qt(x), r: peReponseTxt(a) + (a.autre ? (a.v === "autre" || !a.v ? "" : " : ") + a.autre : "") } : null; }).filter(Boolean);
  const l = (r.qr || []).filter((x) => x.q || x.r).map((x) => ({ q: x.q, r: x.r }));
  return [...q, ...l].map((x) => `<div class="pqr"><span class="pq">${esc(x.q || "")}</span><p style="margin:0;white-space:pre-wrap;overflow-wrap:anywhere">${esc(x.r || "")}</p></div>`).join("");
}
const peChamp = (k, l, v, t = "text", extra = "") => `<label class="pif"><span>${l}</span><input type="${t}" id="pi_${k}" data-pi="${k}" value="${esc(v || "")}"${extra}></label>`;
function peAsideEdition(r) {
  const dt = r.quand ? new Date(r.quand) : null, jour = dt ? iso(dt) : "", heure = dt ? String(dt.getHours()).padStart(2, "0") + ":" + String(dt.getMinutes()).padStart(2, "0") : "";
  return `<aside class="cr-grille" style="grid-template-columns:1fr"><div class="pportrait">${r.photo ? `<img src="${esc(photoUrl(r.photo))}" alt="">` : `<b class="pini" style="background:${couleurDe(r.id)}">${esc(peIni(r))}</b>`}</div>
    <div><button class="btn" data-persphoto="${esc(r.id)}" style="width:100%;justify-content:center">${r.photo ? "Changer la photo" : "Ajouter une photo"}</button></div>
    <div class="cr-bloc"><h2>Infos</h2>${peChamp("nom", "Nom ou prénom", r.nom)}<div class="duo">${peChamp("age", "Âge", r.age, "text", ' inputmode="numeric"')}${peChamp("profil", "Profil, métier", r.profil)}</div>${peChamp("lieu", "Lieu de l'entretien", r.lieu)}
      <div class="duo"><label class="pif"><span>Jour</span><input type="date" id="pi_jour" data-pi="quand" value="${jour}"></label><label class="pif"><span>Heure</span><input type="time" id="pi_heure" data-pi="quand" value="${heure}"></label></div>
      <label class="pif"><span>Langue de l'entretien</span><select id="pi_langue" data-pi="langue">${["", "Vietnamien", "Français", "Anglais", "Autre"].map((x) => `<option value="${x}"${x === (r.langue || "") ? " selected" : ""}>${x || "—"}</option>`).join("")}</select></label>
      <span class="qui">Recueilli par ${r.auteur || r.par ? auteur({ par: r.auteur || r.par }) : "quelqu'un"}</span></div>
    <div class="cr-bloc"><h2>Coordonnées</h2>${peChamp("zalo", "Zalo", r.zalo, "text", ' inputmode="tel" autocomplete="off"')}${peChamp("telephone", "Téléphone", r.telephone, "text", ' inputmode="tel" autocomplete="off"')}${peChamp("email", "E-mail", r.email, "email", ' autocomplete="off"')}${peChamp("adresse", "Adresse ou lieu où la retrouver", r.adresse)}${peChamp("contact", "Autre contact ou remarque", r.contact)}</div></aside>`;
}
function pePage(r) {
  const piece = pePieces(r.id).sort((a, b) => (a.cree || 0) - (b.cree || 0)), mic = (c, id) => typeof avecMicro === "function" ? avecMicro(c, id, "Dicter") : c;
  const lecture = !!r.valide, montreQ = S.persQ === r.id || Object.keys(r.rep || {}).length > 0;
  const info = (k, v) => v ? `<dt>${k}</dt><dd>${v}</dd>` : "";
  const entete = `<div class="tete"><h1>${esc(peNom(r))}<small>${esc(peLigne(r))}</small></h1>
    <div class="outils"><button class="btn" data-persretour="1">← Personnes</button>${lecture ? `<span class="pbadge ok" style="position:static;align-self:center">Validé</span>` : `<span class="pbadge" style="position:static;align-self:center;background:#6d7b75">Brouillon</span>`}<button class="btn" data-persrecap="${esc(r.id)}">Récap PDF</button><button class="btn" data-perscopier="${esc(r.id)}">Copier en texte</button>${S.ecrire && !lecture ? `<button class="btn rouge" data-perssuppr="${esc(r.id)}">Supprimer</button>` : ""}</div></div>`;
  const aside = `<aside class="cr-grille" style="grid-template-columns:1fr"><div class="pportrait">${r.photo ? `<img src="${esc(photoUrl(r.photo))}" alt="">` : `<b class="pini" style="background:${couleurDe(r.id)}">${esc(peIni(r))}</b>`}</div>
    <div class="cr-bloc"><h2>Infos</h2><dl class="pdl">${info("Nom", esc(r.nom || ""))}${info("Âge", r.age ? esc(r.age) + " ans" : "")}${info("Profil", esc(r.profil || ""))}${info("Lieu", esc(r.lieu || ""))}${info("Entretien", esc(r.quand ? quand(r.quand) : ""))}${info("Langue", esc(r.langue || ""))}${info("Recueilli par", r.auteur || r.par ? auteur({ par: r.auteur || r.par }) : "")}</dl></div>${peCoord(r)}</aside>`;
  if (lecture) {
    const qr = peLectureQR(r);
    return entete + `<div class="ppage">${aside}<div class="cr-grille" style="grid-template-columns:1fr">
      ${r.resume ? `<div class="cr-bloc"><h2>Résumé</h2><p style="margin:0;white-space:pre-wrap;overflow-wrap:anywhere">${esc(r.resume)}</p></div>` : ""}
      ${qr ? `<div class="cr-bloc"><h2>Questions et réponses</h2>${qr}</div>` : ""}
      ${r.texte_libre ? `<div class="cr-bloc"><h2>Notes</h2><p style="margin:0;white-space:pre-wrap;overflow-wrap:anywhere">${esc(r.texte_libre)}</p></div>` : ""}
      ${piece.length ? `<div class="cr-bloc"><h2>Captures et documents <small>${piece.length}</small></h2><div class="fichiers">${piece.map(fiCarte).join("")}</div></div>` : ""}
      <div class="cr-bloc" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${S.ecrire ? `<button class="btn" data-persmodifier="${esc(r.id)}">Modifier</button>` : ""}<button class="btn" data-persrecap="${esc(r.id)}">Récap PDF</button><span class="qui">Fiche validée ${r.par && r.par !== (r.auteur || r.par) ? "· dernière modification par " + auteur(r) + " " : ""}· ${esc(quand(r.maj))}</span></div>
    </div></div>`;
  }
  return entete + `<div class="ppage">${peAsideEdition(r)}
  <div class="cr-grille" style="grid-template-columns:1fr">
    <div class="cr-bloc"><h2>Résumé de la personne</h2>${S.ecrire && db ? mic(`<textarea id="pf_resume" data-pf="resume" placeholder="Qui est cette personne, ce qu'elle a dit d'essentiel, ce qu'on retient…">${esc(r.resume || "")}</textarea>`, "pf_resume") : `<p>${esc(r.resume || "")}</p>`}</div>
    ${montreQ ? `<div class="cr-bloc" id="persQR"><h2>Questionnaire <small><span class="seg" role="group" aria-label="Langue" style="display:inline-flex">${[["fr", "FR"], ["vi", "VI"]].map(([k, l]) => `<button data-qlang="${k}" aria-pressed="${S.langQ === k}">${l}</button>`).join("")}</span></small></h2>${peQuestionnaire(r)}</div>` : S.ecrire && db && S.questions.length ? `<div class="cr-bloc"><h2>Questionnaire</h2><div><button class="btn" data-persq="1">Remplir le questionnaire pour cette personne</button></div></div>` : ""}
    <div class="cr-bloc" id="persLibres"><h2>Autres questions et réponses <small>${(r.qr || []).length}</small></h2>${peLibres(r)}</div>
    <div class="cr-bloc"><h2>Notes brutes</h2>${S.ecrire && db ? mic(`<textarea id="pf_texte_libre" data-pf="texte_libre" rows="6" placeholder="Colle ou dicte ici le texte de l'entretien…">${esc(r.texte_libre || "")}</textarea>`, "pf_texte_libre") : `<p style="white-space:pre-wrap">${esc(r.texte_libre || "")}</p>`}</div>
    <div class="cr-bloc"><h2>Photos, captures et documents <small>${piece.length}</small></h2>
      <p class="qui" style="margin:0">Dépose ici les photos des notes écrites à la main, les captures d'écran (conversations Zalo…), les PDF ou les documents de cette personne. Demande ensuite à Claude de les transcrire : il en tire la liste des questions et réponses et un résumé.</p>
      ${S.ecrire && db ? `<div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn jaune" data-fichoisir="pers:${esc(r.id)}">${ic("i-plus", 14)}Ajouter des fichiers</button><button class="btn" data-camera="pers:${esc(r.id)}">Photographier une page</button>
        ${r.a_transcrire && !r.transcrit ? `<button class="btn" data-perstranscrit="${esc(r.id)}">Marquer comme transcrit</button>` : piece.length && !r.a_transcrire ? `<button class="btn" data-persatranscrire="${esc(r.id)}">Marquer « à transcrire »</button>` : ""}</div>` : ""}
      ${piece.length ? `<div class="fichiers">${piece.map(fiCarte).join("")}</div>` : ""}</div>
    ${S.ecrire && db ? `<div class="cr-bloc"><h2>Terminer</h2><p class="qui" style="margin:0">Quand tout est relu, valide la fiche : elle s'affiche alors comme un récap propre, sans cases à remplir. Tu pourras la rouvrir avec « Modifier », tout en bas.</p><div><button class="btn jaune" data-persvalider="${esc(r.id)}">Valider la fiche</button></div></div>` : ""}
  </div></div>`;
}
/* récap d'un entretien : mise en page A4 avec les captures et les photos enregistrées */
async function peRecap(r) {
  toast("Préparation du récap…");
  const piece = pePieces(r.id).sort((a, b) => (a.cree || 0) - (b.cree || 0)), imgs = [];
  for (const f of piece.filter(fiImage).slice(0, 24)) { try { imgs.push({ u: await fiUrl(f), t: f.nom }); } catch (e) {} }
  const autres = piece.filter((f) => !fiImage(f)).map((f) => exHtml(f.nom));
  const q = [...S.questions].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)).map((x) => { const a = (r.rep || {})[x.id]; return a && (a.v || a.autre) ? { q: x.texte, r: peReponseTxt(a) + (a.autre ? (a.v === "autre" || !a.v ? "" : " : ") + a.autre : "") } : null; }).filter(Boolean);
  const l = (r.qr || []).filter((x) => x.q || x.r), tout = [...q, ...l.map((x) => ({ q: x.q, r: x.r }))];
  const corps = `<h1>${exHtml(peNom(r))}</h1><p class="sous">${exHtml([peLigne(r), r.quand ? new Date(r.quand).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "", r.langue ? "en " + r.langue.toLowerCase() : ""].filter(Boolean).join(" · "))} · ${exHtml(exSite())}</p>
    ${r.resume ? `<h2>Résumé</h2><p class="t">${exHtml(r.resume)}</p>` : ""}
    ${tout.length ? `<h2>Questions et réponses</h2>${tout.map((x) => `<div class="qa"><b>${exHtml(x.q || "")}</b><br>${exHtml(x.r || "")}</div>`).join("")}` : ""}
    ${r.texte_libre ? `<h2>Notes</h2><p class="t">${exHtml(r.texte_libre)}</p>` : ""}
    ${imgs.length ? `<h2>Captures et photos (${imgs.length})</h2>${imgs.map((p) => `<figure><img src="${exHtml(p.u)}"><figcaption>${exHtml(p.t)}</figcaption></figure>`).join("")}` : ""}
    ${autres.length ? `<h2>Autres documents</h2><ul>${autres.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}`;
  exImprimer("Récap " + peNom(r), corps, `h1{font-size:24px;margin:0}.sous{margin:2px 0 10px;color:#555}h2{font-size:14px;background:#17302a;color:#fff;padding:4px 9px;margin:16px 0 8px}.t{white-space:pre-wrap;margin:0}.qa{break-inside:avoid;margin:0 0 9px}figure{margin:0 0 12px;break-inside:avoid}img{max-width:100%;max-height:230mm;display:block;border:1px solid #ccc}figcaption{font-size:10px;color:#666;margin-top:2px}ul{margin:0;padding-left:18px}`);
}
const VUE_QUESTIONNAIRE = VUES.questionnaire;
VUES.questionnaire = () => {
  if (S.seulQ) return VUE_QUESTIONNAIRE();
  const seg = `<div class="seg" role="group" aria-label="Entretiens" style="max-width:360px">${[["personnes", `Personnes · ${S.reponses.length}`], ["questionnaire", "Questionnaire"]].map(([k, v]) => `<button data-sousent="${k}" aria-pressed="${S.sousEnt === k}">${v}</button>`).join("")}</div>`;
  if (S.sousEnt === "questionnaire") return seg + VUE_QUESTIONNAIRE();
  const r = S.persId && S.reponses.find((x) => x.id === S.persId);
  if (r) return pePage(r);
  S.persId = null;
  return `<div class="tete"><h1>Entretiens<small>Les personnes rencontrées : photo, infos, réponses</small></h1>${seg}</div>${peGalerie()}`;
};

/* fenêtre « nouvelle personne » / « modifier les infos » */
function peDialogue(id) {
  const r = id ? S.reponses.find((x) => x.id === id) : null, o = r || {};
  let d = document.getElementById("pdlg"); if (!d) { d = document.createElement("dialog"); d.id = "pdlg"; d.className = "pdlg"; document.body.appendChild(d); d.addEventListener("click", (e) => { if (e.target === d) d.close(); }); }
  const dt = o.quand ? new Date(o.quand) : new Date(), iso2 = iso(dt), hh = o.quand ? String(dt.getHours()).padStart(2, "0") + ":" + String(dt.getMinutes()).padStart(2, "0") : "";
  const ch = (k, l, v, t = "text", extra = "") => `<div class="champ"><label for="pe_${k}">${l}</label><input type="${t}" id="pe_${k}" value="${esc(v ?? "")}"${extra}></div>`;
  d.innerHTML = `<h3 style="margin:0 0 10px">${r ? "Modifier les infos" : "Nouvelle personne"}</h3><div class="grille">
    <div class="champ"><span class="l">Photo (facultatif)</span><div style="display:flex;align-items:center;gap:10px">${o.photo ? `<img src="${esc(photoUrl(o.photo))}" alt="" style="width:56px;height:56px;border-radius:50%;object-fit:cover">` : ""}<input type="file" id="pe_photo" accept="image/*"></div><span class="qui">Demande l'accord de la personne avant de la photographier.</span></div>
    ${ch("nom", "Nom ou prénom", o.nom, "text", ' autocomplete="off"')}
    <div class="duo">${ch("age", "Âge", o.age, "text", ' inputmode="numeric"')}${ch("profil", "Profil, métier", o.profil, "text", '')}</div>
    ${ch("lieu", "Lieu de l'entretien", o.lieu, "text", '')}
    <div class="duo">${ch("jour", "Jour", iso2, "date")}${ch("heure", "Heure (facultatif)", hh, "time")}</div>
    <div class="champ"><label for="pe_langue">Langue de l'entretien</label><select id="pe_langue">${["", "Vietnamien", "Français", "Anglais", "Autre"].map((x) => `<option value="${x}"${x === (o.langue || "") ? " selected" : ""}>${x || "—"}</option>`).join("")}</select></div>
    <div class="champ"><span class="l">Coordonnées (facultatif, restent dans l'équipe)</span></div>
    <div class="duo">${ch("zalo", "Zalo", o.zalo, "text", ' inputmode="tel" autocomplete="off"')}${ch("telephone", "Téléphone", o.telephone, "text", ' inputmode="tel" autocomplete="off"')}</div>
    ${ch("email", "E-mail", o.email, "email", ' autocomplete="off"')}
    ${ch("adresse", "Adresse ou lieu où la retrouver", o.adresse, "text", '')}
    ${ch("contact", "Autre contact ou remarque", o.contact, "text", '')}
    </div><div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end"><button class="btn" data-peannuler="1">Annuler</button><button class="btn jaune" data-pesauver="${esc(id || "")}">Enregistrer</button></div>`;
  d.showModal();
}
async function peSauver(id) {
  if (!db) return;
  const v = (k) => ($("#pe_" + k).value || "").trim(), b = $('[data-pesauver]'); b.disabled = true;
  try {
    const d = { nom: v("nom"), age: v("age"), profil: v("profil"), lieu: v("lieu"), langue: v("langue"), zalo: v("zalo"), telephone: v("telephone"), email: v("email"), adresse: v("adresse"), contact: v("contact"), quand: Date.parse(v("jour") + "T" + (v("heure") || "12:00")) || Date.now() };
    const f = $("#pe_photo").files[0];
    if (f) { const blob = await reduire(f), r = await assets.upload(blob, { type: blob.type === "image/jpeg" ? "image/jpeg" : (f.type || "image/jpeg") }); d.photo = r.id; }
    if (id) await db.collection("reponses").doc(id).update({ ...d, par: S.moi, maj: Date.now() });
    else { const nid = nouvelId(), now = Date.now(); await db.collection("reponses").doc(nid).set({ ...d, rep: {}, qr: [], source: "personne", par: S.moi, auteur: S.moi, cree: now, maj: now }); S.persId = nid; }
    $("#pdlg").close(); render(); toast("Enregistré");
  } catch (e) { refus(e); b.disabled = false; }
}
function peTexte(r) {
  const L = [`${peNom(r)}${peLigne(r) ? " : " + peLigne(r) : ""}`, r.quand ? "Entretien : " + quand(r.quand) : "", r.langue ? "Langue : " + r.langue : "", r.zalo ? "Zalo : " + r.zalo : "", r.telephone ? "Téléphone : " + r.telephone : "", r.email ? "E-mail : " + r.email : "", ""];
  if (r.resume) L.push("RÉSUMÉ", r.resume, "");
  const q = [...S.questions].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)).map((x) => { const a = (r.rep || {})[x.id]; return a && (a.v || a.autre) ? `Q : ${x.texte}\nR : ${a.v === "oui" ? "Oui" : a.v === "non" ? "Non" : a.v === "autre" && !a.autre ? "Autre" : a.v || ""}${a.autre ? " " + a.autre : ""}` : ""; }).filter(Boolean);
  const l = (r.qr || []).filter((x) => x.q || x.r).map((x) => `Q : ${x.q || ""}\nR : ${x.r || ""}`);
  if (q.length || l.length) L.push("QUESTIONS ET RÉPONSES", ...q, ...l, "");
  if (r.texte_libre) L.push("NOTES", r.texte_libre);
  return L.filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n");
}

/* enregistrement automatique en quittant un champ */
async function peAuto(t) {
  if (!S.persId || !db || !S.ecrire || !t || !t.dataset) return;
  const r = S.reponses.find((x) => x.id === S.persId); if (!r) return;
  if (t.dataset.pi) { await peSauveInfo(r, t.dataset.pi); return; }
  if (t.dataset.pf) { const el = document.getElementById(t.id) || t; if ((r[t.dataset.pf] || "") !== el.value) await peMaj(r.id, { [t.dataset.pf]: el.value }); return; }
  if (t.dataset.pqi != null) {
    const qr = []; document.querySelectorAll("#persLibres .pqi").forEach((div) => { const a = div.querySelector('[data-k="q"]'), b = div.querySelector('[data-k="r"]'); qr.push({ q: a.value.trim(), r: b.value.trim() }); });
    if (JSON.stringify(qr) !== JSON.stringify((r.qr || []).map((x) => ({ q: x.q || "", r: x.r || "" })))) await peMaj(r.id, { qr });
  }
}
document.addEventListener("focusout", (e) => { peAuto(e.target); });
const peMinuteurs = new Map();
document.addEventListener("input", (e) => {
  const t = e.target; if (!t.dataset || !(t.dataset.pi || t.dataset.pf || t.dataset.pqi != null) || !t.id) return;
  clearTimeout(peMinuteurs.get(t.id)); peMinuteurs.set(t.id, setTimeout(() => peAuto(document.getElementById(t.id) || t), 900));
});
async function peSauveInfo(r, k) {
  let v;
  if (k === "quand") { const j = ($("#pi_jour") || {}).value, h = ($("#pi_heure") || {}).value; v = Date.parse(j + "T" + (h || "12:00")); if (!isFinite(v)) return; if (v === r.quand) return; }
  else { const el = $("#pi_" + k); if (!el) return; v = el.value.trim(); if ((r[k] || "") === v) return; }
  await peMaj(r.id, { [k]: v });
}
document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.dataset && t.dataset.pi && S.persId && db && S.ecrire) { const r = S.reponses.find((x) => x.id === S.persId); if (r) await peSauveInfo(r, t.dataset.pi); return; }
  if (t.dataset && t.dataset.pqr && S.persId && db && S.ecrire) {
    const r = S.reponses.find((x) => x.id === S.persId); if (!r) return;
    const rep = { ...(r.rep || {}) };
    for (const q of S.questions) {
      if (q.type === "ouverte") { const el = document.getElementById("qr_" + q.id); if (el) { const v = el.value.trim(); if (v) rep[q.id] = { q: q.texte, v }; else delete rep[q.id]; } }
      else { const ch = document.querySelector(`input[name="qr_${q.id}"]:checked`), a = document.getElementById("qra_" + q.id); if (ch || a) { const v = ch ? ch.value : "", au = a ? a.value.trim() : ""; if (v || au) rep[q.id] = { q: q.texte, v: v || "autre", ...(au ? { autre: au } : {}) }; else delete rep[q.id]; } }
    }
    await peMaj(r.id, { rep });
  }
  if (t.dataset && t.dataset.persfich && S.ecrire && db) {
    const id = t.dataset.persfich, files = [...t.files]; t.value = "";
    await fiEnvoyer(files, { personne: id, theme: "Entretiens" });
    await peMaj(id, { a_transcrire: true, transcrit: false });
  }
});
document.addEventListener("click", async (e) => {
  const c = e.target.closest("[data-persphoto],[data-persvalider],[data-persmodifier],[data-persrecap],[data-pcopie],[data-persq],[data-pers],[data-persretour],[data-persnouveau],[data-persedit],[data-perssuppr],[data-perscopier],[data-sousent],[data-qrajout],[data-qrsuppr],[data-peannuler],[data-pesauver],[data-perstranscrit],[data-persatranscrire]");
  if (!c) return; const d = c.dataset;
  if (d.sousent) { S.sousEnt = d.sousent; try { localStorage.setItem("sousent", d.sousent); } catch (x) {} render(); return; }
  if (d.persphoto) {
    let i = document.getElementById("pePhotoGlobal");
    if (!i) { i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.id = "pePhotoGlobal"; i.hidden = true; document.body.appendChild(i);
      i.addEventListener("change", async () => { const f = i.files[0], id = i.dataset.cible; i.value = ""; if (!f || !id) return; try { const blob = await reduire(f), r = await assets.upload(blob, { type: blob.type === "image/jpeg" ? "image/jpeg" : (f.type || "image/jpeg") }); await peMaj(id, { photo: r.id }); toast("Photo enregistrée"); } catch (x) { refus(x); } }); }
    i.dataset.cible = d.persphoto; i.click(); return;
  }
  if (d.persrecap) { const rr = S.reponses.find((x) => x.id === d.persrecap); if (rr) await peRecap(rr); return; }
  if (d.persvalider) { const rr = S.reponses.find((x) => x.id === d.persvalider); if (!rr) return; const dom = (id) => { const e = document.getElementById(id); return e ? e.value.trim() : ""; }; const vide = !(rr.resume || dom("pf_resume")) && !(rr.qr || []).some((x) => x.q || x.r) && !document.querySelector("#persLibres textarea[data-pqi]:not(:placeholder-shown)") && !Object.keys(rr.rep || {}).length && !document.querySelector("#persQR input:checked") && !(rr.texte_libre || dom("pf_texte_libre")) && !pePieces(rr.id).length; if (vide && !confirm("Cette fiche est vide. La valider quand même ?")) return; await peMaj(rr.id, { valide: true }); scrollTo(0, 0); toast("Fiche validée"); return; }
  if (d.persmodifier) { await peMaj(d.persmodifier, { valide: false }); toast("Fiche rouverte pour modification"); return; }
  if (d.pcopie) { try { await navigator.clipboard.writeText(d.pcopie); toast("Copié"); } catch (x) { prompt("Copie :", d.pcopie); } return; }
  if (d.persq) { S.persQ = S.persId; render(); return; }
  if (d.pers) { S.persId = d.pers; S.persQ = null; render(); scrollTo(0, 0); return; }
  if (d.persretour) { S.persId = null; render(); return; }
  if (d.persnouveau) return peDialogue(null);
  if (d.persedit) return peDialogue(d.persedit);
  if (d.peannuler) return document.getElementById("pdlg").close();
  if (d.pesauver !== undefined) return peSauver(d.pesauver || null);
  const r = S.reponses.find((x) => x.id === (d.perssuppr || d.perscopier || d.perstranscrit || d.persatranscrire || S.persId));
  if (d.perscopier && r) { const t = peTexte(r); try { await navigator.clipboard.writeText(t); toast("Fiche copiée en texte"); } catch (x) { prompt("Copie le texte :", t); } return; }
  if (d.perssuppr && r) { if (!confirm("Supprimer cet entretien (réponses et notes) ? Les fichiers déposés restent dans l'onglet Fichiers.")) return; try { await db.collection("reponses").doc(r.id).delete(); S.persId = null; toast("Entretien supprimé"); } catch (x) { refus(x); } return; }
  if (d.perstranscrit && r) return peMaj(r.id, { transcrit: true, a_transcrire: false });
  if (d.persatranscrire && r) return peMaj(r.id, { a_transcrire: true, transcrit: false });
  if (d.qrajout && r) return peMaj(r.id, { qr: [...(r.qr || []), { q: "", r: "" }] });
  if (d.qrsuppr != null && r) return peMaj(r.id, { qr: (r.qr || []).filter((_, i) => i !== +d.qrsuppr) });
});
