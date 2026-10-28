/* Fichiers : la bibliothèque du groupe (PDF, documents, tableurs, photos, cartes…), par site.
   Les fichiers sont dans le stockage Supabase (dossier privé « documents », réservé aux membres) ;
   la liste (nom, thème, note, lieu) est dans la collection « fichiers ». */

COLS.push("fichiers"); S.fichiers = [];
ONGLETS.splice(7, 0, ["fichiers", "Fichiers", null, "i-fich"]);
FAB.fichiers = "";
FORMS.fichiers = { nom: "Fichier", champs: [
  ["nom", "Nom du fichier", "text", 1], ["theme", "Thème", "text", 0, null, ""],
  ["lieu", "Lieu associé", "lieu"], ["jour", "Jour (pour l'afficher dans l'emploi du temps)", "date"], ["heure", "Heure (facultatif)", "time"], ["note", "Description", "textarea", 0, null, "De quoi s'agit-il, d'où vient-il, à quoi il sert…"]] };
document.querySelector("svg defs, svg")?.insertAdjacentHTML("beforeend",
  `<symbol id="i-fich" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></symbol>`);
const fiCss = document.createElement("style");
fiCss.textContent = `.fichiers{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px}
.fcarte{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;min-width:0;display:grid;grid-template-rows:auto auto}
.fprev{position:relative;aspect-ratio:4/3;border:0;padding:0;background:var(--sunk);display:grid;place-items:center;cursor:pointer;overflow:hidden;color:#fff}
.fprev img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fprev.pdf img{object-fit:contain;object-position:top;background:#fff}
.fprev .ficone{display:grid;justify-items:center;gap:6px}
.fprev .ficone svg{width:44px;height:44px;opacity:.9}
.fprev .ficone b{font:800 1.05rem var(--display);letter-spacing:.06em}
.fmenu{position:absolute;right:6px;top:6px;z-index:2;width:34px;height:34px;border-radius:50%;border:0;background:#000000a8;color:#fff;display:grid;place-items:center;cursor:pointer;padding:0;backdrop-filter:blur(4px)}
.fmenu svg{width:18px;height:18px}
.fmenu:hover{background:#000}
.fpied{padding:9px 11px 10px;display:grid;gap:2px;min-width:0}
.fnom{font-weight:700;font-size:.9rem;line-height:1.25;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere}
.fsous{font-size:.75rem;color:var(--muted);display:flex;gap:6px;flex-wrap:wrap}
.finfo{max-width:480px;width:94vw;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--ink);padding:0;overflow:hidden}
.finfo::backdrop{background:#000a}
.finfo .haut{aspect-ratio:16/9;background:var(--sunk);position:relative;display:grid;place-items:center;color:#fff}
.finfo .haut img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#111}
.finfo .corps{padding:14px 16px 16px;display:grid;gap:10px}
.finfo h3{margin:0;font:700 1.1rem/1.3 var(--body);text-transform:none;letter-spacing:0;overflow-wrap:anywhere}
.finfo dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:.88rem}
.finfo dt{color:var(--muted)}.finfo dd{margin:0;overflow-wrap:anywhere}
.finfo .desc{background:var(--sunk);border-radius:10px;padding:10px 12px;font-size:.92rem;white-space:pre-wrap;overflow-wrap:anywhere}
.finfo .acts{display:flex;flex-wrap:wrap;gap:8px}
.flight{border:0;padding:0;background:#000;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;color:#fff}
.flight::backdrop{background:#000}
.flight .zone{position:absolute;inset:0;display:grid;place-items:center}
.flight img{max-width:100%;max-height:100%;object-fit:contain}
.flight .bar{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;background:linear-gradient(#000c,transparent);z-index:3}
.flight .bar b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.flight button.r{width:40px;height:40px;border-radius:50%;border:0;background:#ffffff22;color:#fff;font-size:1.2rem;cursor:pointer;display:grid;place-items:center;padding:0}
.flight .nav{position:absolute;top:50%;transform:translateY(-50%);z-index:3}.flight .nav.g{left:10px}.flight .nav.d{right:10px}
.depose{border:2px dashed var(--line);border-radius:14px;padding:16px;text-align:center;display:grid;gap:8px;justify-items:center;background:var(--surface)}
.depose.survol{border-color:var(--jaune);background:var(--sunk)}
.quota{font-size:.8rem;color:var(--muted)}
@media (max-width:700px){.depose .glisse{display:none}.depose{padding:12px}}
@media (min-width:701px){#depose{grid-auto-flow:column;justify-content:center;align-items:center;gap:14px;padding:12px 16px}}
.jauge-stock{display:grid;gap:4px;width:min(420px,100%)}.jauge-stock i{display:block;height:6px;border-radius:99px;background:var(--sunk);overflow:hidden}.jauge-stock i b{display:block;height:100%;background:var(--s-fait)}.jauge-stock.haut i b{background:var(--alerte)}.jauge-stock .quota{text-align:center}
details.depose{text-align:left;justify-items:stretch;padding:10px 14px}details.depose>summary{cursor:pointer;font-weight:700;list-style:none}details.depose>summary::-webkit-details-marker{display:none}details.depose>summary::after{content:" ▾";color:var(--muted)}details.depose[open]>summary::after{content:" ▴"}`;
document.head.appendChild(fiCss);

const HUB = (typeof CONFIG !== "undefined" && CONFIG.hub ? String(CONFIG.hub).replace(/\/$/, "") : "");
const FI_MAX_SB = 50 * 1024 * 1024, FI_MAX_HUB = ((typeof CONFIG !== "undefined" && CONFIG.hubMaxMo) || 100) * 1048576, fiLiens = new Map();
const fiMax = () => HUB ? FI_MAX_HUB : FI_MAX_SB;
const fiMaxTxt = () => fiMax() >= 1073741824 ? Math.round(fiMax() / 1073741824) + " Go" : Math.round(fiMax() / 1048576) + " Mo";
const fiJeton = async () => { const { data } = await SB.auth.getSession(); return data.session ? data.session.access_token : ""; };
const fiSurHub = (f) => f && f.stock === "hub";
async function fiSignerHub(chemins) {
  const r = await fetch(HUB + "/sign", { method: "POST", headers: { Authorization: "Bearer " + await fiJeton(), "Content-Type": "application/json" }, body: JSON.stringify({ chemins }) });
  if (!r.ok) throw new Error("hub " + r.status); const j = await r.json(); return j.urls;
}
async function fiSupprimer(f) {
  if (!f || !f.chemin) return;
  if (fiSurHub(f)) await fetch(HUB + "/file?chemin=" + encodeURIComponent(f.chemin), { method: "DELETE", headers: { Authorization: "Bearer " + await fiJeton() } }).catch(() => {});
  else await SB.storage.from("documents").remove([f.chemin, f.chemin + ".vign.jpg"]).catch(() => {});
}
function fiEnvoiHub(f, chemin, progres) {
  return new Promise(async (ok, ko) => {
    const x = new XMLHttpRequest(); x.open("POST", HUB + "/upload?site=" + encodeURIComponent(S.site));
    x.setRequestHeader("Authorization", "Bearer " + await fiJeton()); x.setRequestHeader("X-Nom", encodeURIComponent(f.name)); x.setRequestHeader("Content-Type", f.type || "application/octet-stream");
    x.upload.onprogress = (e) => { if (e.lengthComputable) progres(Math.round(e.loaded / e.total * 100)); };
    x.onload = () => { if (x.status === 200) { try { ok(JSON.parse(x.responseText)); } catch (e) { ko(new Error("réponse illisible")); } } else { let m = "erreur " + x.status; try { m = JSON.parse(x.responseText).erreur || m; } catch (e) {} ko(new Error(m)); } };
    x.onerror = () => ko(new Error("le NAS ne répond pas")); x.send(f);
  });
}
const fiTaille = (n) => n >= 1048576 ? (n / 1048576).toFixed(n >= 10485760 ? 0 : 1).replace(".", ",") + " Mo" : Math.max(1, Math.round(n / 1024)) + " Ko";
const fiExt = (f) => { const e = (String(f.nom || "").split(".").pop() || "").toUpperCase(); return e.length <= 4 ? e : "FICHIER"; };
const fiImage = (f) => /^image\/(jpeg|png|webp|gif)/.test(f.type || "");
const fiSur = (nom) => String(nom).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80);
async function fiUrl(f) {
  const chemin = f.chemin, c = fiLiens.get(chemin); if (c && c.exp > Date.now() + 60000) return c.url;
  if (fiSurHub(f)) { const u = (await fiSignerHub([chemin]))[chemin]; const url = HUB + u; fiLiens.set(chemin, { url, exp: Date.now() + 540000 }); return url; }
  const { data, error } = await SB.storage.from("documents").createSignedUrl(chemin, 3600); if (error) throw error;
  fiLiens.set(chemin, { url: data.signedUrl, exp: Date.now() + 3600000 }); return data.signedUrl;
}
async function fiVignettes() {
  const a = [...document.querySelectorAll("img[data-fpath]")].filter((i) => !i.src); if (!a.length) return;
  const manque = [...new Set(a.map((i) => i.dataset.fpath).filter((p) => !fiLiens.has(p)))];
  const surHub = manque.filter((p) => fiSurHub(S.fichiers.find((x) => x.chemin === p))), surSb = manque.filter((p) => !surHub.includes(p));
  if (surSb.length) { const { data } = await SB.storage.from("documents").createSignedUrls(surSb, 3600); for (const r of data || []) if (r.signedUrl) fiLiens.set(r.path, { url: r.signedUrl, exp: Date.now() + 3600000 }); }
  if (surHub.length) { try { const u = await fiSignerHub(surHub); for (const p of surHub) if (u[p]) fiLiens.set(p, { url: HUB + u[p], exp: Date.now() + 540000 }); } catch (e) {} }
  for (const i of a) { const c = fiLiens.get(i.dataset.fpath); if (c) { i.onload = () => fiVignAuto(i); i.src = c.url; } }
}
let fiVignFile = Promise.resolve();
async function fiMiniatureBlob(src, w, h) {
  const k = Math.min(1, 480 / Math.max(w, h)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height); return new Promise((r) => c.toBlob(r, "image/jpeg", 0.72));
}
async function fiEnregistrerVign(f, blob) {
  const { error } = await SB.storage.from("documents").upload(f.chemin + ".vign.jpg", blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  if (error && !/exist|duplicate/i.test(error.message)) return;
  await db.collection("fichiers").doc(f.id).update({ vign: true });
}
/* une photo déjà déposée sans miniature : on la crée une fois, quand elle est affichée en entier */
function fiVignAuto(img) {
  const f = S.fichiers.find((x) => x.chemin === img.dataset.fpath);
  if (!f || f.vign || fiSurHub(f) || !S.ecrire || !db || !img.naturalWidth || Math.max(img.naturalWidth, img.naturalHeight) < 700) return;
  fiVignFile = fiVignFile.then(async () => { try { const b = await fiMiniatureBlob(img, img.naturalWidth, img.naturalHeight); if (b) await fiEnregistrerVign(f, b); } catch (e) {} });
}
const fiPdf = (f) => /pdf$/i.test(f.type || "") || /\.pdf$/i.test(f.nom || "");
const fiPdfVign = new Map();
const FI_COULEURS = { DOC: "#2b579a", DOCX: "#2b579a", ODT: "#2b579a", XLS: "#1d6f42", XLSX: "#1d6f42", CSV: "#1d6f42", ODS: "#1d6f42", PPT: "#d24726", PPTX: "#d24726", ZIP: "#6b6f76", PDF: "#c43d2b", TXT: "#5b6d66" };
const fiCouleur = (f) => FI_COULEURS[fiExt(f)] || "#5b6d66";
const ICONE_DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
const ICONE_3PTS = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
const fiChemin = (f) => f.vign && !fiSurHub(f) ? f.chemin + ".vign.jpg" : f.chemin;
function fiApercu(f) {
  const p = fiChemin(f), c = fiLiens.get(p);
  if (fiImage(f)) return `<img data-fpath="${esc(p)}" alt="${esc(f.nom)}"${c ? ` src="${esc(c.url)}"` : ""} loading="lazy" decoding="async">`;
  if (fiPdf(f)) { const v = fiPdfVign.get(f.chemin); return (v ? `<img src="${v}" alt="">` : `<img data-fpdf="${esc(f.chemin)}" alt="" hidden>`) + (v ? "" : `<span class="ficone" data-fsecours><b>PDF</b></span>`); }
  return `<span class="ficone">${ICONE_DOC}<b>${esc(fiExt(f))}</b></span>`;
}
function fiCarte(f) {
  const fond = fiImage(f) || fiPdf(f) ? "" : ` style="background:${fiCouleur(f)}"`;
  return `<div class="fcarte"><button class="fprev${fiPdf(f) ? " pdf" : ""}" data-fouvrir="${esc(f.id)}"${fond} aria-label="Ouvrir ${esc(f.nom)}">${fiApercu(f)}</button>
    <button class="fmenu" data-finfo="${esc(f.id)}" aria-label="Informations sur ${esc(f.nom)}" title="Informations">${ICONE_3PTS}</button>
    <div class="fpied"><span class="fnom">${esc(f.nom)}</span><span class="fsous"><span>${esc(fiTaille(f.taille || 0))}</span><span>${auteur(f)}</span></span></div></div>`;
}
/* miniatures des PDF : première page, dessinée sur place (pdf.js) */
let fiPdfPret = null; const fiFile = [];
function fiChargerPdfJs() {
  if (window.pdfjsLib) return Promise.resolve();
  return fiPdfPret ??= new Promise((ok, ko) => { const s = document.createElement("script"); s.src = "vendor/pdf.min.js"; s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js"; ok(); }; s.onerror = () => ko(new Error("pdf.js")); document.head.appendChild(s); });
}
async function fiMiniature(f) {
  try {
    await fiChargerPdfJs();
    const doc = await pdfjsLib.getDocument({ url: await fiUrl(f), disableAutoFetch: true, disableStream: false }).promise;
    const p = await doc.getPage(1), v0 = p.getViewport({ scale: 1 }), k = 360 / v0.width, v = p.getViewport({ scale: k });
    const c = document.createElement("canvas"); c.width = v.width; c.height = v.height;
    await p.render({ canvasContext: c.getContext("2d"), viewport: v }).promise;
    fiPdfVign.set(f.chemin, c.toDataURL("image/jpeg", 0.72)); doc.destroy();
  } catch (e) { fiPdfVign.set(f.chemin, ""); }
}
async function fiMiniaturesPdf() {
  const im = [...document.querySelectorAll("img[data-fpdf]")];
  for (const i of im) {
    const f = S.fichiers.find((x) => x.chemin === i.dataset.fpdf); if (!f || fiPdfVign.has(f.chemin) || fiFile.includes(f.chemin) || (f.taille || 0) > 40 * 1048576) continue;
    fiFile.push(f.chemin);
  }
  if (fiMiniaturesPdf.enCours) return; fiMiniaturesPdf.enCours = true;
  while (fiFile.length) {
    const c = fiFile.shift(), f = S.fichiers.find((x) => x.chemin === c); if (!f) continue;
    await fiMiniature(f); const v = fiPdfVign.get(c);
    if (v) document.querySelectorAll("img[data-fpdf]").forEach((i) => { if (i.dataset.fpdf === c) { i.src = v; i.hidden = false; const sec = i.parentElement.querySelector("[data-fsecours]"); if (sec) sec.remove(); } });
  }
  fiMiniaturesPdf.enCours = false;
}
/* fiche d'informations (les trois petits points), visionneuse, téléchargement */
const fiJour = (t) => t ? new Date(t).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
async function fiTelecharger(f) {
  try {
    let u;
    if (fiSurHub(f)) u = (await fiUrl(f)) + "&dl=1";
    else { const { data, error } = await SB.storage.from("documents").createSignedUrl(f.chemin, 600, { download: f.nom }); if (error) throw error; u = data.signedUrl; }
    const a = document.createElement("a"); a.href = u; a.download = f.nom; document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { toast("Téléchargement impossible."); }
}
function fiInfo(id) {
  const f = S.fichiers.find((x) => x.id === id); if (!f) return;
  let d = document.getElementById("finfo"); if (!d) { d = document.createElement("dialog"); d.id = "finfo"; d.className = "finfo"; document.body.appendChild(d); d.addEventListener("click", (e) => { if (e.target === d) d.close(); }); }
  const c = fiLiens.get(f.chemin), v = fiPdfVign.get(f.chemin), lieu = nomLieu(f.lieu);
  const ligne = (k, val) => val ? `<dt>${k}</dt><dd>${val}</dd>` : "";
  d.innerHTML = `<div class="haut"${fiImage(f) || fiPdf(f) ? "" : ` style="background:${fiCouleur(f)}"`}>${fiImage(f) && c ? `<img src="${esc(c.url)}" alt="">` : v ? `<img src="${v}" alt="" style="object-fit:contain;background:#fff">` : `<span class="ficone" style="display:grid;justify-items:center">${ICONE_DOC.replace("<svg", '<svg width="54" height="54"')}<b style="font:800 1.1rem var(--display)">${esc(fiExt(f))}</b></span>`}</div>
    <div class="corps"><h3>${esc(f.nom)}</h3>
    ${f.note ? `<div class="desc">${esc(f.note)}</div>` : `<div class="desc" style="color:var(--muted)">Pas encore de description.${S.ecrire ? " Utilise « Modifier »." : ""}</div>`}
    <dl>${ligne("Ajouté par", auteur(f))}${ligne("Ajouté le", esc(fiJour(f.cree)))}${f.par && crea(f) && f.par !== crea(f) ? ligne("Modifié par", auteur(f)) + ligne("Modifié le", esc(fiJour(f.maj))) : ""}${ligne("Taille", esc(fiTaille(f.taille || 0)))}${ligne("Type", esc(fiExt(f)))}${ligne("Pour le jour", f.jour ? esc(fmt(f.jour, { weekday: "long", day: "numeric", month: "long" }) + (f.heure ? " à " + f.heure : "")) : "")}${ligne("Lieu", esc(lieu))}${ligne("Thème", esc(f.theme))}${ligne("Stockage", fiSurHub(f) ? "NAS" : "Supabase")}</dl>
    <div class="acts"><button class="btn jaune" data-fouvrir="${esc(f.id)}">Ouvrir</button><button class="btn" data-ftelecharger="${esc(f.id)}">Télécharger</button>${S.ecrire ? `<button class="btn" data-fmodifier="${esc(f.id)}">Modifier</button><button class="btn rouge" data-fsuppr="${esc(f.id)}">Supprimer</button>` : ""}<button class="btn" data-ffermer="1" style="margin-left:auto">Fermer</button></div></div>`;
  nommer(d); d.showModal();
}
let fiLight = { liste: [], i: 0 };
function fiVoir(id) {
  const imgs = S.fichiers.filter((x) => fiImage(x) && cherche(x, "nom", "note", "theme") && (!S.theme || x.theme === S.theme)).sort((a, b) => (b.cree || 0) - (a.cree || 0));
  fiLight = { liste: imgs, i: Math.max(0, imgs.findIndex((x) => x.id === id)) };
  let d = document.getElementById("flight"); if (!d) { d = document.createElement("dialog"); d.id = "flight"; d.className = "flight"; document.body.appendChild(d); d.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") fiVoirAutre(-1); if (e.key === "ArrowRight") fiVoirAutre(1); }); }
  fiVoirMaj(); if (!d.open) d.showModal();
}
async function fiVoirMaj() {
  const d = document.getElementById("flight"), f = fiLight.liste[fiLight.i]; if (!f) return d.close();
  const u = await fiUrl(f).catch(() => "");
  d.innerHTML = `<div class="bar"><button class="r" data-ffermerlight="1" aria-label="Fermer">✕</button><b>${esc(f.nom)}</b><button class="r" data-finfo="${esc(f.id)}" aria-label="Informations">${ICONE_3PTS.replace("<svg", '<svg width="18" height="18"')}</button></div>
    <div class="zone"><img src="${esc(u)}" alt="${esc(f.nom)}"></div>${fiLight.liste.length > 1 ? `<button class="r nav g" data-fnav="-1" aria-label="Précédente">‹</button><button class="r nav d" data-fnav="1" aria-label="Suivante">›</button>` : ""}`;
}
const fiVoirAutre = (n) => { const l = fiLight.liste.length; if (!l) return; fiLight.i = (fiLight.i + n + l) % l; fiVoirMaj(); };
/* Dossier privé sur le NAS : deux liens enregistrés pour le site (dépôt = envoi seulement, dossier = lecture). Le site ne se connecte jamais au NAS. */
const lienOk = (u) => { try { const x = new URL(u); return x.protocol === "https:" || x.protocol === "http:"; } catch (e) { return false; } };
const nasCarte = () => { const r = reglageSite(), d = r.nas_depot, v = r.nas_voir;
  return `<details class="depose"${d || v ? " open" : ""}><summary>Dossier partagé (Google Drive, OneDrive, NAS…)</summary>
  ${d || v ? `<div style="display:flex;flex-wrap:wrap;gap:8px">${d ? `<a class="btn jaune" href="${esc(d)}" target="_blank" rel="noopener noreferrer">Ajouter des fichiers</a>` : ""}${v ? `<a class="btn" href="${esc(v)}" target="_blank" rel="noopener noreferrer">Ouvrir le dossier</a>` : ""}</div>` : `<span class="quota">Pour de gros volumes : colle ici le lien d'un dossier partagé (au-delà de 1 Go, c'est la solution la plus simple).</span>`}
  ${S.ecrire && db ? `<div><button class="btn" data-nasconf="1">${d || v ? "Changer les liens" : "Enregistrer les liens du dossier"}</button></div>` : ""}</details>`; };
document.addEventListener("click", async (e) => {
  if (!e.target.closest("[data-nasconf]")) return;
  const r = reglageSite(), a = prompt("Lien pour AJOUTER des fichiers (dossier partagé en mode « éditeur »). Laisse vide pour l'effacer :", r.nas_depot || "");
  if (a === null) return; const v = prompt("Lien pour CONSULTER le dossier (mode « lecteur »). Laisse vide pour l'effacer :", r.nas_voir || ""); if (v === null) return;
  if ((a.trim() && !lienOk(a.trim())) || (v.trim() && !lienOk(v.trim()))) return toast("Ces liens doivent commencer par https://");
  const { id, ...reste } = r;
  try { await db.collection("sites").doc(S.site).set({ ...reste, nas_depot: a.trim(), nas_voir: v.trim(), par: S.moi, maj: Date.now() }); toast("Liens du dossier enregistrés"); } catch (x) { refus(x); }
});
VUES.fichiers = () => {
  const themes = [...new Set(S.fichiers.map((m) => m.theme).filter(Boolean))].sort();
  if (S.theme && !themes.includes(S.theme)) S.theme = "";
  const l = S.fichiers.filter((x) => cherche(x, "nom", "note", "theme") && (!S.theme || x.theme === S.theme)).sort((a, b) => (b.cree || 0) - (a.cree || 0));
  const total = S.fichiers.reduce((s, x) => s + (x.taille || 0), 0);
  return `<div class="tete"><h1>Fichiers<small>PDF, documents, tableurs, photos : tout au même endroit</small></h1></div>
  ${S.ecrire && db ? `<div class="depose" id="depose"><span class="glisse">Glisse des fichiers ici, ou</span><button class="btn jaune" data-fichoisir="">${ic("i-plus", 14)}Ajouter des fichiers</button><div class="jauge-stock${!HUB && total > 0.8 * 1073741824 ? " haut" : ""}"><span class="quota">${HUB ? "Stockage sur le NAS, " + fiMaxTxt() + " maximum par fichier" : "50 Mo maximum par fichier"} · ${esc(fiTaille(total))} déposés${HUB ? "" : " sur ~1 Go (photos du mur en plus)"}</span>${HUB ? "" : `<i><b style="width:${Math.min(100, Math.round(total / 10737418.24))}%"></b></i>`}</div></div>` : ""}
  ${nasCarte()}
  ${themes.length ? `<div class="puces">${[["", "Tout"], ...themes.map((x) => [x, x])].map(([k, v]) => `<button data-theme="${esc(k)}" aria-pressed="${S.theme === k}">${esc(v)}</button>`).join("")}</div>` : ""}
  ${l.length ? `<div class="fichiers">${l.map(fiCarte).join("")}</div>` : vide("Aucun fichier pour l'instant. Dépose un PDF, un tableur, une photo…")}`;
};
async function fiEnvoyer(liste, extra = {}) {
  const fichiers = [...liste]; let ok = 0;
  for (const [i, f] of fichiers.entries()) {
    if (f.size > fiMax()) { toast(`« ${f.name} » dépasse ${HUB ? fiMaxTxt() : "50 Mo"} : trop lourd.`); continue; }
    toast(`Envoi ${i + 1}/${fichiers.length} : ${f.name}…`);
    let chemin, taille = f.size;
    if (HUB) {
      try { const r = await fiEnvoiHub(f, null, (p) => toast(`Envoi ${i + 1}/${fichiers.length} : ${f.name} · ${p} %`)); chemin = r.chemin; taille = r.taille; }
      catch (e) { toast("Envoi vers le NAS impossible : " + e.message); return; }
    } else {
      chemin = `${S.site}/${nouvelId()}-${fiSur(f.name)}`;
      const { error } = await SB.storage.from("documents").upload(chemin, f, { contentType: f.type || "application/octet-stream", cacheControl: "3600" });
      if (error) { toast(/bucket/i.test(error.message) ? "Le dossier de fichiers n'est pas encore activé : lance le SQL « documents » dans Supabase." : "Envoi impossible : " + error.message); return; }
    }
    const now = Date.now();
    let vign = false;
    if (!HUB && fiImage({ type: f.type })) { try { const bm = await createImageBitmap(f), b = await fiMiniatureBlob(bm, bm.width, bm.height); if (b) { const r = await SB.storage.from("documents").upload(chemin + ".vign.jpg", b, { contentType: "image/jpeg", cacheControl: "31536000" }); vign = !r.error; } } catch (e) {} }
    try { await db.collection("fichiers").doc(nouvelId()).set({ nom: f.name, chemin, taille, vign, stock: HUB ? "hub" : "sb", type: f.type || "", theme: S.theme || "", note: "", ...extra, par: S.moi, auteur: S.moi, cree: now, maj: now }); ok++; }
    catch (e) { await fiSupprimer({ chemin, stock: HUB ? "hub" : "sb" }); refus(e); return; }
  }
  if (ok) toast(ok === 1 ? "Fichier ajouté" : `${ok} fichiers ajoutés`);
}
/* un seul sélecteur de fichiers, hors de l'écran redessiné : l'écran se redessine à chaque changement des autres (temps réel),
   ce qui faisait disparaître le sélecteur pendant le choix d'un fichier */
let fiCible = null;
function fiChoisir(cible) {
  fiCible = cible; let i = document.getElementById("fiGlobal");
  if (!i) {
    i = document.createElement("input"); i.type = "file"; i.id = "fiGlobal"; i.multiple = true; i.hidden = true; document.body.appendChild(i);
    i.addEventListener("change", async () => { const c = fiCible, fs = [...i.files]; i.value = ""; if (!fs.length || !c) return; await fiEnvoyer(fs, c.extra || {}); if (c.apres) c.apres(); });
  }
  i.click();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-fichoisir]"); if (!b || !S.ecrire || !db) return;
  const v = b.dataset.fichoisir;
  if (v.startsWith("pers:")) { const id = v.slice(5); fiChoisir({ extra: { personne: id, theme: "Entretiens" }, apres: () => peMaj(id, { a_transcrire: true, transcrit: false }) }); }
  else fiChoisir({ extra: {} });
});
document.addEventListener("change", (e) => { if (e.target.id === "fiFichiers" && e.target.files.length) { fiEnvoyer(e.target.files); e.target.value = ""; } });
document.addEventListener("dragover", (e) => { const z = e.target.closest && e.target.closest("#depose"); if (z) { e.preventDefault(); z.classList.add("survol"); } });
document.addEventListener("dragleave", (e) => { const z = e.target.closest && e.target.closest("#depose"); if (z) z.classList.remove("survol"); });
document.addEventListener("drop", (e) => { const z = e.target.closest && e.target.closest("#depose"); if (!z) return; e.preventDefault(); z.classList.remove("survol"); if (e.dataTransfer.files.length && S.ecrire && db) fiEnvoyer(e.dataTransfer.files); });
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-fouvrir],[data-finfo],[data-ftelecharger],[data-fmodifier],[data-fsuppr],[data-ffermer],[data-ffermerlight],[data-fnav]"); if (!t) return;
  const dd = t.dataset, f = S.fichiers.find((x) => x.id === (dd.fouvrir || dd.finfo || dd.ftelecharger || dd.fmodifier || dd.fsuppr));
  if (dd.ffermer) return document.getElementById("finfo").close();
  if (dd.ffermerlight) return document.getElementById("flight").close();
  if (dd.fnav) return fiVoirAutre(+dd.fnav);
  if (dd.finfo) { if (f) fiInfo(f.id); return; }
  if (!f) return;
  if (dd.ftelecharger) return fiTelecharger(f);
  if (dd.fmodifier) { document.getElementById("finfo").close(); return ouvrir("fichiers", f.id, {}); }
  if (dd.fsuppr) {
    if (!confirm("Supprimer « " + f.nom + " » pour tout le groupe ?")) return;
    try { await db.collection("fichiers").doc(f.id).delete(); await fiSupprimer(f); document.getElementById("finfo").close(); toast("Fichier supprimé"); } catch (x) { refus(x); }
    return;
  }
  if (dd.fouvrir) {
    const fi = document.getElementById("finfo"); if (fi && fi.open) fi.close();
    if (fiImage(f)) return fiVoir(f.id);
    const w = window.open("", "_blank");
    try { const u = await fiUrl(f); if (w) w.location = u; else location.href = u; }
    catch (x) { if (w) w.close(); toast("Impossible d'ouvrir ce fichier."); }
  }
});
new MutationObserver(() => { if (["fichiers", "compte", "questionnaire"].includes(S.vue)) { fiVignettes(); if (S.vue !== "compte") fiMiniaturesPdf(); } }).observe(document.getElementById("vue"), { childList: true });
