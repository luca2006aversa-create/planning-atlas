/* Fichiers : la bibliothèque du groupe (PDF, documents, tableurs, photos, cartes…), par site.
   Les fichiers sont dans le stockage Supabase (dossier privé « documents », réservé aux membres) ;
   la liste (nom, thème, note, lieu) est dans la collection « fichiers ». */

COLS.push("fichiers"); S.fichiers = [];
ONGLETS.splice(7, 0, ["fichiers", "Fichiers", null, "i-fich"]);
FAB.fichiers = "";
FORMS.fichiers = { nom: "Fichier", champs: [
  ["nom", "Nom du fichier", "text", 1], ["theme", "Thème", "text", 0, null, "ex. Crues, Agriculture, Cartes, Entretiens"],
  ["lieu", "Lieu associé", "lieu"], ["note", "Description", "textarea", 0, null, "De quoi s'agit-il, d'où vient-il, à quoi il sert…"]] };
document.querySelector("svg defs, svg")?.insertAdjacentHTML("beforeend",
  `<symbol id="i-fich" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></symbol>`);
const fiCss = document.createElement("style");
fiCss.textContent = `.fichiers{display:grid;gap:8px}
.fich{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px;min-width:0}
.fich .vign{width:56px;height:56px;border-radius:8px;background:var(--sunk);display:grid;place-items:center;font:800 .8rem var(--display);letter-spacing:.04em;color:var(--muted);overflow:hidden}
.fich .vign img{width:100%;height:100%;object-fit:cover}
.fich .ouvrir{border:0;background:transparent;text-align:left;padding:0;display:grid;gap:2px;min-width:0;color:inherit;cursor:pointer}
.fich .nom{font-weight:700;overflow-wrap:anywhere;line-height:1.3}
.fich .meta{font-size:.8rem;color:var(--muted);display:flex;flex-wrap:wrap;gap:2px 10px}
.fich .note{font-size:.85rem;color:var(--muted);overflow-wrap:anywhere}
.depose{border:2px dashed var(--line);border-radius:14px;padding:16px;text-align:center;display:grid;gap:8px;justify-items:center;background:var(--surface)}
.depose.survol{border-color:var(--jaune);background:var(--sunk)}
.quota{font-size:.8rem;color:var(--muted)}`;
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
  else await SB.storage.from("documents").remove([f.chemin]).catch(() => {});
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
  for (const i of a) { const c = fiLiens.get(i.dataset.fpath); if (c) i.src = c.url; }
}
function fiCarte(f) {
  const lieu = nomLieu(f.lieu), c = fiLiens.get(f.chemin);
  return `<div class="fich"><div class="vign">${fiImage(f) ? `<img data-fpath="${esc(f.chemin)}" alt=""${c ? ` src="${esc(c.url)}"` : ""} loading="lazy">` : esc(fiExt(f))}</div>
    <button class="ouvrir" data-fouvrir="${esc(f.id)}"><span class="nom">${esc(f.nom)}</span>
      <span class="meta"><span>${esc(fiExt(f))} · ${esc(fiTaille(f.taille || 0))}</span>${lieu ? `<span>${ic("i-lieu", 12)} ${esc(lieu)}</span>` : ""}${f.theme ? `<span class="etiquette">${esc(f.theme)}</span>` : ""}<span>${auteur(f)} · ${esc(quand(f.cree))}</span></span>
      ${f.note ? `<span class="note">${esc(f.note)}</span>` : ""}</button>
    ${S.ecrire ? `<button class="btn ico" data-ouvrir="fichiers" data-id="${esc(f.id)}" aria-label="Modifier">✎</button>` : ""}</div>`;
}
/* Dossier privé sur le NAS : deux liens enregistrés pour le site (dépôt = envoi seulement, dossier = lecture). Le site ne se connecte jamais au NAS. */
const lienOk = (u) => { try { const x = new URL(u); return x.protocol === "https:" || x.protocol === "http:"; } catch (e) { return false; } };
const nasCarte = () => { const r = reglageSite(), d = r.nas_depot, v = r.nas_voir;
  return `<div class="depose" style="text-align:left;justify-items:stretch"><b>Dossier partagé (Google Drive, OneDrive, NAS…)</b>
  ${d || v ? `<div style="display:flex;flex-wrap:wrap;gap:8px">${d ? `<a class="btn jaune" href="${esc(d)}" target="_blank" rel="noopener noreferrer">Ajouter des fichiers</a>` : ""}${v ? `<a class="btn" href="${esc(v)}" target="_blank" rel="noopener noreferrer">Ouvrir le dossier</a>` : ""}</div>` : `<span class="quota">Pour de gros volumes : colle ici le lien d'un dossier partagé (au-delà de 1 Go, c'est la solution la plus simple).</span>`}
  ${S.ecrire && db ? `<div><button class="btn" data-nasconf="1">${d || v ? "Changer les liens" : "Enregistrer les liens du dossier"}</button></div>` : ""}</div>`; };
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
  ${S.ecrire && db ? `<div class="depose" id="depose"><span>Glisse des fichiers ici, ou</span><label class="btn jaune" style="cursor:pointer">${ic("i-plus", 14)}Ajouter des fichiers<input type="file" id="fiFichiers" multiple hidden></label><span class="quota">${HUB ? "Stockage sur le NAS, " + fiMaxTxt() + " maximum par fichier" : "50 Mo maximum par fichier"} · ${esc(fiTaille(total))} déjà déposés ici</span></div>` : ""}
  ${nasCarte()}
  ${themes.length ? `<div class="puces">${[["", "Tout"], ...themes.map((x) => [x, x])].map(([k, v]) => `<button data-theme="${esc(k)}" aria-pressed="${S.theme === k}">${esc(v)}</button>`).join("")}</div>` : ""}
  ${l.length ? `<div class="fichiers">${l.map(fiCarte).join("")}</div>` : vide("Aucun fichier pour l'instant. Dépose un PDF, un tableur, une photo…")}`;
};
async function fiEnvoyer(liste) {
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
    try { await db.collection("fichiers").doc(nouvelId()).set({ nom: f.name, chemin, taille, stock: HUB ? "hub" : "sb", type: f.type || "", theme: S.theme || "", note: "", par: S.moi, auteur: S.moi, cree: now, maj: now }); ok++; }
    catch (e) { await fiSupprimer({ chemin, stock: HUB ? "hub" : "sb" }); refus(e); return; }
  }
  if (ok) toast(ok === 1 ? "Fichier ajouté" : `${ok} fichiers ajoutés`);
}
document.addEventListener("change", (e) => { if (e.target.id === "fiFichiers" && e.target.files.length) { fiEnvoyer(e.target.files); e.target.value = ""; } });
document.addEventListener("dragover", (e) => { const z = e.target.closest && e.target.closest("#depose"); if (z) { e.preventDefault(); z.classList.add("survol"); } });
document.addEventListener("dragleave", (e) => { const z = e.target.closest && e.target.closest("#depose"); if (z) z.classList.remove("survol"); });
document.addEventListener("drop", (e) => { const z = e.target.closest && e.target.closest("#depose"); if (!z) return; e.preventDefault(); z.classList.remove("survol"); if (e.dataTransfer.files.length && S.ecrire && db) fiEnvoyer(e.dataTransfer.files); });
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-fouvrir]"); if (!b) return;
  const f = S.fichiers.find((x) => x.id === b.dataset.fouvrir); if (!f) return;
  const w = window.open("", "_blank");
  try { const u = await fiUrl(f); if (w) w.location = u; else location.href = u; }
  catch (x) { if (w) w.close(); toast("Impossible d'ouvrir ce fichier."); }
});
new MutationObserver(() => { if (S.vue === "fichiers") fiVignettes(); }).observe(document.getElementById("vue"), { childList: true });
