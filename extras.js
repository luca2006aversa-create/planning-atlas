/* Extras : tableau blanc partagé + appareil photo avec position et direction.
   Chargé avant sb.js : il ajoute l'onglet « Tableau » et la collection « tableau » (une ligne par élément, par site). */

/* ---------- branchement sur l'appli ---------- */
COLS.push("tableau"); S.tableau = [];
ONGLETS.splice(5, 0, ["tableau", "Tableau", "Tableau", "i-tab"]);
FAB.tableau = "";

const style = document.createElement("style");
style.textContent = `
.tb-barre{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.tb-vue{position:relative;overflow:hidden;height:calc(100dvh - 300px);min-height:360px;border-radius:var(--r);border:1px solid var(--line);background-color:#fbfaf6;
  background-image:radial-gradient(#cfd3cc 1.2px,transparent 1.3px);background-size:32px 32px;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}
@media (max-width:899px){.tb-vue{height:calc(100dvh - 330px - var(--nav-h))}}
.tb-vue.stylo,.tb-vue.note,.tb-vue.titre{cursor:crosshair}
.tb-vue.gomme{cursor:not-allowed}
.tb-monde{position:absolute;left:0;top:0;transform-origin:0 0}
.tb-svg{position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible;pointer-events:none}
.tb-svg path.lien{fill:none;stroke:#3b3f45;stroke-width:2.5;stroke-linecap:round}.tb-svg path.lien.sel{stroke:#2d6a9f;stroke-width:4}.tb-svg path.hit{fill:none;stroke:transparent;stroke-width:16}.tb-vue.main .tb-svg path.hit,.tb-vue.gomme .tb-svg path.hit{pointer-events:stroke;cursor:pointer}.tb-el.source{outline:3px dashed #e4572e;outline-offset:3px}
.tb-svg polyline{fill:none;stroke-linecap:round;stroke-linejoin:round}
.tb-vue.gomme .tb-svg polyline{pointer-events:stroke}
.tb-el{position:absolute;box-sizing:border-box;color:#1d1e20}
.tb-el.note{border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.22);padding:10px}
.tb-el textarea{width:100%;height:100%;border:0;background:transparent;resize:none;font:500 15px/1.35 var(--body,system-ui);color:inherit;padding:0;pointer-events:none;outline:0}
.tb-el.edit textarea{pointer-events:auto;cursor:text}
.tb-el.titre textarea{font:800 30px/1.15 var(--display,system-ui)}
.tb-el.img img{width:100%;height:100%;display:block;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.28);pointer-events:none;object-fit:cover;background:#ddd}
.tb-el.sel{outline:2px solid #2d6a9f;outline-offset:3px}
.tb-el .poignee{position:absolute;right:-9px;bottom:-9px;width:18px;height:18px;border-radius:50%;background:#2d6a9f;border:2px solid #fff;display:none;cursor:nwse-resize;touch-action:none}
.tb-el.sel .poignee{display:block}
.tb-el .signe{position:absolute;left:0;top:100%;margin-top:4px;font:600 11px/1 var(--body,system-ui);color:#6b7570;white-space:nowrap;pointer-events:none}
.tb-ui{position:absolute;right:10px;top:10px;display:grid;gap:6px;z-index:5}
.tb-aide{position:absolute;left:12px;bottom:10px;font-size:.78rem;color:#6b7570;pointer-events:none;max-width:70%}
.cam{border:0;padding:0;background:#000;color:#fff;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh}
.cam::backdrop{background:#000}
.cam video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cam .haut,.cam .bas{position:absolute;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:16px;padding:14px;z-index:2}
.cam .haut{top:0;padding-top:calc(14px + env(safe-area-inset-top,0px));background:linear-gradient(#000a,transparent);font-size:.85rem;flex-direction:column;gap:2px;text-align:center}
.cam .bas{bottom:0;padding-bottom:calc(20px + env(safe-area-inset-bottom,0px));background:linear-gradient(transparent,#000a)}
.cam .declic{width:72px;height:72px;border-radius:50%;border:5px solid #fff;background:#ffffffcc;padding:0}
.cam .declic:active{background:#fff}
.cam .petit{border:1px solid #fff8;background:#0006;color:#fff;border-radius:999px;padding:9px 16px;font-weight:700}
.cam .boussole{display:inline-block;transition:transform .15s}
.pt-neuf{position:absolute;right:8px;top:8px;width:11px;height:11px;border-radius:50%;background:#e4572e;border:2px solid var(--surface);box-shadow:0 0 0 1px #e4572e66}
.signe{font-size:.76rem;color:var(--muted);display:block}
`;
document.head.appendChild(style);
document.querySelector("svg defs, svg")?.insertAdjacentHTML("beforeend",
  `<symbol id="i-tab" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21l4-4 4 4M7 12l3-3 3 2 4-4"/></symbol>`);

/* ---------- tableau blanc ---------- */
const TB_COULEURS = ["#fff3b0", "#ffd9cc", "#ffd6e8", "#ffe0b2", "#d6e9ff", "#d9f2d0", "#eadcff", "#e4e4e0", "#ffffff"];
const TB_FONDS = [["points", "Points"], ["grille", "Quadrillé"], ["uni", "Uni"]];
const TB_ENCRES = ["#1d1e20", "#c0392b", "#2f6fb0", "#2e7d52", "#e4572e", "#7b4fa0"];
const T = { cam: { x: 40, y: 40, z: 1 }, outil: "main", encre: "#1d1e20", ep: 3, sel: null, ptrs: new Map(), geste: null, edition: false, differe: false, aEditer: null, vu: null, lienDe: null, fond: (() => { try { return localStorage.getItem("tbfond") || "points"; } catch (e) { return "points"; } })() };
const tbPeut = () => S.ecrire && db;
const tbDoc = (id) => S.tableau.find((x) => x.id === id);
const tbOutil = (k, l) => `<button data-tbo="${k}" aria-pressed="${T.outil === k}">${l}</button>`;

function tbBarreHtml() {
  const s = tbDoc(T.sel);
  const couleurs = s && (s.k === "note" || s.k === "titre") ? TB_COULEURS.map((c) => `<button class="nuance" style="--c:${c}" data-tbcouleur="${c}" aria-label="Couleur ${c}"></button>`).join("") : "";
  return `<div class="seg" role="group" aria-label="Outil">${tbOutil("main", "Déplacer")}${tbPeut() ? tbOutil("note", "Note") + tbOutil("titre", "Titre") + tbOutil("stylo", "Stylo") + tbOutil("gomme", "Gomme") + tbOutil("lier", "Relier") : ""}</div>
  ${T.outil === "stylo" ? `<div class="g" role="group" aria-label="Encre" style="display:flex;gap:6px">${TB_ENCRES.map((c) => `<button class="nuance" style="--c:${c}" data-tbencre="${c}" aria-pressed="${T.encre === c}" aria-label="Encre ${c}"></button>`).join("")}</div>
  <div class="seg" role="group" aria-label="Épaisseur">${[[2, "Fin"], [4, "Moyen"], [9, "Gras"]].map(([e, l]) => `<button data-tbep="${e}" aria-pressed="${T.ep === e}">${l}</button>`).join("")}</div>` : ""}
  ${tbPeut() ? `<span class="btn fichier" role="button">Photo<input type="file" id="tbFichier" accept="image/*" aria-label="Ajouter une photo au tableau"></span>
  <button class="btn" data-tbmur="1">Photo du mur</button><button class="btn" data-camera="tableau">Appareil</button>` : ""}
  <div class="seg" role="group" aria-label="Fond">${TB_FONDS.map(([k, l]) => `<button data-tbfond="${k}" aria-pressed="${T.fond === k}">${l}</button>`).join("")}</div>
  ${couleurs}${s && tbPeut() ? `<button class="btn rouge" data-tbsuppr="1">Supprimer</button>` : ""}`;
}
function tbCam() {
  const v = $("#tbVue"); if (!v) return;
  $("#tbMonde").style.transform = `translate(${T.cam.x}px,${T.cam.y}px) scale(${T.cam.z})`;
  const g = `${32 * T.cam.z}px ${32 * T.cam.z}px`; v.style.backgroundSize = T.fond === "grille" ? `${g},${g}` : g;
  v.style.backgroundImage = T.fond === "uni" ? "none" : T.fond === "grille" ? "linear-gradient(#dfe3dc 1px,transparent 1px),linear-gradient(90deg,#dfe3dc 1px,transparent 1px)" : "radial-gradient(#cfd3cc 1.2px,transparent 1.3px)";
  v.style.backgroundPosition = T.fond === "grille" ? `${T.cam.x}px ${T.cam.y}px,${T.cam.x}px ${T.cam.y}px` : `${T.cam.x}px ${T.cam.y}px`;
}
const tbPt = (e) => { const r = $("#tbVue").getBoundingClientRect(); return { x: (e.clientX - r.left - T.cam.x) / T.cam.z, y: (e.clientY - r.top - T.cam.y) / T.cam.z }; };
const tbCentre = () => { const r = $("#tbVue").getBoundingClientRect(); return { x: (r.width / 2 - T.cam.x) / T.cam.z, y: (r.height / 2 - T.cam.y) / T.cam.z }; };
const tbStyle = (d) => `left:${d.x}px;top:${d.y}px;width:${d.w}px;height:${d.h}px`;
function tbDessiner() {
  const sv = $("#tbSvg"); if (!sv) return;
  if (T.edition) { T.differe = true; return; }
  const tri = [...S.tableau].sort((a, b) => (a.cree || 0) - (b.cree || 0));
  sv.innerHTML = `<defs><marker id="tbFleche" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#3b3f45"/></marker></defs><g id="tbLiensG"></g>` + tri.filter((d) => d.k === "trait").map((d) => {
    const p = d.pts || [], q = []; for (let i = 0; i + 1 < p.length; i += 2) q.push(p[i] + "," + p[i + 1]);
    return `<polyline data-tid="${esc(d.id)}" points="${q.join(" ")}" stroke="${esc(d.couleur || "#1d1e20")}" stroke-width="${+d.ep || 3}"/>`;
  }).join("");
  tbLiens();
  $("#tbEls").innerHTML = tri.filter((d) => d.k !== "trait" && d.k !== "lien").map((d) => {
    const sel = (T.sel === d.id ? " sel" : "") + (T.lienDe === d.id ? " source" : ""), poi = tbPeut() ? `<i class="poignee" data-tbpoignee="1"></i>` : "";
    const signe = `<span class="signe">${d.par ? auteur(d) : ""}</span>`;
    if (d.k === "image") return `<div class="tb-el img${sel}" data-tid="${esc(d.id)}" style="${tbStyle(d)}"><img src="${esc(photoUrl(d.photo))}" alt="" draggable="false">${poi}${sel ? signe : ""}</div>`;
    const fond = d.k === "titre" ? "" : `background:${esc(d.couleur || TB_COULEURS[0])};`;
    return `<div class="tb-el ${d.k === "titre" ? "titre" : "note"}${sel}" data-tid="${esc(d.id)}" style="${tbStyle(d)};${fond}"><textarea data-tbtexte="${esc(d.id)}" aria-label="Texte" placeholder="${d.k === "titre" ? "Titre" : "Écris ici…"}">${esc(d.texte || "")}</textarea>${poi}${sel ? signe : ""}</div>`;
  }).join("");
  nommer($("#tbEls"));
  if (T.aEditer) { const id = T.aEditer; T.aEditer = null; tbEcrire(id); }
}
/* liens entre éléments : une flèche du bord de l'un au bord de l'autre */
function tbBord(d, vers) {
  const cx = d.x + d.w / 2, cy = d.y + d.h / 2, dx = vers.x - cx, dy = vers.y - cy; if (!dx && !dy) return { x: cx, y: cy };
  const k = Math.min(dx ? (d.w / 2 + 4) / Math.abs(dx) : 1e9, dy ? (d.h / 2 + 4) / Math.abs(dy) : 1e9); return { x: cx + dx * k, y: cy + dy * k };
}
function tbLiens() {
  const g = document.getElementById("tbLiensG"); if (!g) return;
  g.innerHTML = S.tableau.filter((d) => d.k === "lien").map((l) => {
    const a = tbDoc(l.de), b = tbDoc(l.vers); if (!a || !b || a.k === "trait" || b.k === "trait") return "";
    const ca = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, cb = { x: b.x + b.w / 2, y: b.y + b.h / 2 }, p = tbBord(a, cb), q = tbBord(b, ca);
    const mx = (p.x + q.x) / 2 - (q.y - p.y) * .12, my = (p.y + q.y) / 2 + (q.x - p.x) * .12, dd = `M${p.x} ${p.y}Q${mx} ${my} ${q.x} ${q.y}`;
    return `<path class="lien${T.sel === l.id ? " sel" : ""}" d="${dd}" marker-end="url(#tbFleche)"/><path class="hit" data-tid="${esc(l.id)}" data-lien="1" d="${dd}"/>`;
  }).join("");
}
function tbVue() {
  return `<div class="tete"><h1>Tableau<small>Un grand tableau blanc partagé : notes, schémas à main levée, photos</small></h1></div>
  <div class="tb-barre" id="tbBarre"></div>
  <div class="tb-vue main" id="tbVue"><div class="tb-monde" id="tbMonde"><svg class="tb-svg" id="tbSvg"></svg><div id="tbEls"></div></div>
    <div class="tb-ui"><button class="btn ico" data-tbzoom="1.4" aria-label="Zoomer">${ic("i-plus")}</button><button class="btn ico" data-tbzoom="0.7" aria-label="Dézoomer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg></button><button class="btn ico" data-tbzoom="0" aria-label="Tout voir">${ic("i-carte")}</button></div>
    <div class="tb-aide" id="tbAide"></div></div>
  <p class="qui">Glisse pour te déplacer, pince ou molette pour zoomer. « Relier » trace une flèche entre deux éléments ; les couleurs des notes servent de thèmes. Touche une note déjà choisie pour écrire dedans. Tout le groupe voit les changements en direct.</p>`;
}
function tbRendre() {
  if (!$("#tbVue")) { $("#vue").innerHTML = tbVue(); T.vu = null; }
  const b = $("#tbBarre"); if (b) { const h = tbBarreHtml(); if (b.dataset.h !== h) { b.innerHTML = h; b.dataset.h = h; } }
  const v = $("#tbVue"); v.className = "tb-vue " + T.outil;
  $("#tbAide").textContent = T.outil === "lier" ? (T.lienDe ? "Touche l'élément à relier." : "Touche le premier élément, puis le second.") : !S.tableau.length ? "Tableau vide : choisis « Note » puis touche le tableau." : "";
  if (T.vu !== S.site) { T.vu = S.site; tbTout(true); }
  tbCam(); tbDessiner();
}
function tbTout(sansAnim) {
  const v = $("#tbVue"); if (!v) return;
  const r = v.getBoundingClientRect(), it = S.tableau.filter((d) => d.k !== "trait");
  const pts = [];
  for (const d of S.tableau) { if (d.k === "lien") continue; if (d.k === "trait") for (let i = 0; i + 1 < (d.pts || []).length; i += 2) pts.push([d.pts[i], d.pts[i + 1]]); else pts.push([d.x, d.y], [d.x + d.w, d.y + d.h]); }
  if (!pts.length) { T.cam = { x: 40, y: 40, z: 1 }; return; }
  const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
  const z = Math.max(.15, Math.min(1.5, Math.min((r.width - 60) / Math.max(1, x1 - x0), (r.height - 60) / Math.max(1, y1 - y0))));
  T.cam = { z, x: r.width / 2 - (x0 + x1) / 2 * z, y: r.height / 2 - (y0 + y1) / 2 * z };
}
function tbZoomer(k, cx, cy) {
  const v = $("#tbVue"), r = v.getBoundingClientRect(), c = T.cam;
  cx = cx ?? r.width / 2; cy = cy ?? r.height / 2;
  const z = Math.max(.1, Math.min(4, c.z * k)), f = z / c.z;
  T.cam = { z, x: cx - (cx - c.x) * f, y: cy - (cy - c.y) * f }; tbCam();
}
function tbEcrire(id) {
  const el = document.querySelector(`.tb-el[data-tid="${CSS.escape(id)}"]`); if (!el || !tbPeut()) return;
  T.sel = id; el.classList.add("edit", "sel"); T.edition = true;
  const ta = el.querySelector("textarea"); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  ta.onblur = async () => {
    T.edition = false; el.classList.remove("edit");
    const d = tbDoc(id), t = ta.value;
    if (d && (d.texte || "") !== t) { d.texte = t; await tbMaj(id, { texte: t }); }
    if (T.differe) { T.differe = false; tbDessiner(); }
  };
}
async function tbMaj(id, d) { try { await db.collection("tableau").doc(id).update({ ...d, par: S.moi, maj: Date.now() }); } catch (e) { refus(e); } }
async function tbAjouter(d) {
  const id = nouvelId(), now = Date.now();
  try { await db.collection("tableau").doc(id).set({ ...d, par: S.moi, auteur: S.moi, cree: now, maj: now }); return id; } catch (e) { refus(e); return null; }
}
async function tbSupprimer(id) { try { await db.collection("tableau").doc(id).delete(); if (T.sel === id) T.sel = null; for (const l of S.tableau.filter((x) => x.k === "lien" && (x.de === id || x.vers === id))) await db.collection("tableau").doc(l.id).delete(); } catch (e) { refus(e); } }
async function tbImage(photo, ratio) {
  const c = tbCentre(), w = 300, h = Math.round(w * (ratio || .75));
  const id = await tbAjouter({ k: "image", photo, x: Math.round(c.x - w / 2), y: Math.round(c.y - h / 2), w, h });
  if (id) { T.sel = id; T.outil = "main"; tbRendre(); }
}
async function tbEnvoyer(fichier) {
  if (!assets) return toast("Les photos ne sont pas disponibles.");
  try {
    const blob = await reduire(fichier), b = await createImageBitmap(blob).catch(() => null);
    const r = await assets.upload(blob, { type: blob.type === "image/jpeg" ? "image/jpeg" : (fichier.type || "image/jpeg") });
    await tbImage(r.id, b ? b.height / b.width : .75);
  } catch (e) { refus(e); }
}
function tbChoisirMur() {
  const ph = S.mur.filter((m) => m.photo).sort((a, b) => (b.cree || 0) - (a.cree || 0));
  let d = document.getElementById("tbpick"); if (!d) { d = document.createElement("dialog"); d.id = "tbpick"; d.style.cssText = "max-width:560px;width:92vw;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);padding:16px"; document.body.appendChild(d); }
  d.innerHTML = `<h3 style="margin:0 0 10px">Photo du mur</h3>${ph.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;max-height:60vh;overflow:auto">${ph.map((m) => `<button data-tbmurphoto="${esc(m.photo)}" style="padding:0;border:0;background:none"><img src="${esc(photoUrl(m.photo))}" alt="${esc(m.texte || "Photo")}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px"></button>`).join("")}</div>` : `<p class="vide">Pas encore de photo sur le mur.</p>`}
    <div style="margin-top:12px;text-align:right"><button class="btn" data-tbfermer="1">Fermer</button></div>`;
  d.showModal();
}

/* gestes : déplacer le fond, bouger / redimensionner un élément, dessiner, gommer, pincer */
function tbInit() {
  const v = $("#vue");
  v.addEventListener("pointerdown", (e) => {
    const z = e.target.closest("#tbVue"); if (!z || e.target.closest(".tb-ui")) return;
    if (T.edition && !e.target.closest("textarea")) document.activeElement?.blur();
    if (e.target.closest("textarea") && T.edition) return;
    T.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (T.ptrs.size === 2) { tbFinTrait(true); const [a, b] = [...T.ptrs.values()]; T.geste = { t: "pince", d: Math.hypot(a.x - b.x, a.y - b.y), cam: { ...T.cam }, c: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }; return; }
    z.setPointerCapture(e.pointerId);
    const el = e.target.closest(".tb-el"), id = el && el.dataset.tid, p = tbPt(e), d = id && tbDoc(id);
    const lienH = e.target.closest("path[data-lien]");
    if (lienH && T.outil === "main") { T.sel = lienH.dataset.tid; T.geste = { t: "rien" }; tbSelectionner(); tbLiens(); return; }
    if (T.outil === "lier" && tbPeut()) {
      if (d && d.k !== "trait") { if (!T.lienDe) { T.lienDe = id; } else if (T.lienDe !== id) { if (!S.tableau.some((x) => x.k === "lien" && x.de === T.lienDe && x.vers === id)) tbAjouter({ k: "lien", de: T.lienDe, vers: id }); T.lienDe = null; } else T.lienDe = null; } else T.lienDe = null;
      T.geste = { t: "rien" }; tbRendre(); tbDessiner(); return;
    }
    if (T.outil === "gomme") { const h = e.target.closest("polyline,path[data-lien]"); T.geste = { t: "gomme" }; if (h && tbPeut()) tbSupprimer(h.dataset.tid); else if (d && tbPeut() && T.outil === "gomme") tbSupprimer(id); return; }
    if (T.outil === "stylo" && tbPeut()) { T.geste = { t: "stylo", pts: [p] }; const pl = document.createElementNS("http://www.w3.org/2000/svg", "polyline"); pl.setAttribute("stroke", T.encre); pl.setAttribute("stroke-width", T.ep); pl.setAttribute("points", p.x + "," + p.y); pl.id = "tbLive"; $("#tbSvg").appendChild(pl); return; }
    if ((T.outil === "note" || T.outil === "titre") && tbPeut() && !d) {
      const titre = T.outil === "titre", w = titre ? 360 : 200, h = titre ? 56 : 150; T.outil = "main";
      tbAjouter({ k: titre ? "titre" : "note", x: Math.round(p.x - w / 2), y: Math.round(p.y - h / 2), w, h, texte: "", couleur: TB_COULEURS[0] }).then((nid) => { if (nid) { T.sel = nid; T.aEditer = nid; tbRendre(); } });
      T.geste = { t: "rien" }; return;
    }
    if (d && e.target.closest("[data-tbpoignee]") && tbPeut()) { T.sel = id; T.geste = { t: "taille", id, d0: { w: d.w, h: d.h }, p0: p }; return; }
    if (d) { const deja = T.sel === id; T.sel = id; T.geste = { t: "bouge", id, d0: { x: d.x, y: d.y }, p0: p, bouge: false, deja, el }; tbSelectionner(); return; }
    T.sel = null; tbSelectionner(); T.geste = { t: "fond", x0: e.clientX, y0: e.clientY, cam: { ...T.cam } };
  });
  v.addEventListener("pointermove", (e) => {
    if (!T.ptrs.has(e.pointerId)) return;
    T.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = T.geste; if (!g) return;
    if (g.t === "pince" && T.ptrs.size >= 2) {
      const [a, b] = [...T.ptrs.values()], dist = Math.hypot(a.x - b.x, a.y - b.y), r = $("#tbVue").getBoundingClientRect();
      const k = Math.max(.1, Math.min(4, g.cam.z * dist / (g.d || 1))), f = k / g.cam.z, cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top, c0x = g.c.x - r.left, c0y = g.c.y - r.top;
      T.cam = { z: k, x: cx - (c0x - g.cam.x) * f, y: cy - (c0y - g.cam.y) * f }; tbCam(); return;
    }
    if (g.t === "fond") { T.cam = { ...g.cam, x: g.cam.x + e.clientX - g.x0, y: g.cam.y + e.clientY - g.y0 }; tbCam(); }
    else if (g.t === "bouge") {
      const p = tbPt(e), dx = p.x - g.p0.x, dy = p.y - g.p0.y;
      if (!g.bouge && Math.hypot(dx, dy) * T.cam.z < 5) return;
      if (!tbPeut()) return; g.bouge = true; const d = tbDoc(g.id); d.x = Math.round(g.d0.x + dx); d.y = Math.round(g.d0.y + dy);
      g.el.style.left = d.x + "px"; g.el.style.top = d.y + "px"; tbLiens();
    } else if (g.t === "taille") {
      const p = tbPt(e), d = tbDoc(g.id); d.w = Math.max(60, Math.round(g.d0.w + p.x - g.p0.x));
      d.h = d.k === "image" ? Math.round(d.w * g.d0.h / g.d0.w) : Math.max(40, Math.round(g.d0.h + p.y - g.p0.y));
      const el = document.querySelector(`.tb-el[data-tid="${CSS.escape(g.id)}"]`); if (el) { el.style.width = d.w + "px"; el.style.height = d.h + "px"; } tbLiens();
    } else if (g.t === "stylo") {
      const p = tbPt(e), q = g.pts[g.pts.length - 1];
      if (Math.hypot(p.x - q.x, p.y - q.y) * T.cam.z > 2) { g.pts.push(p); $("#tbLive").setAttribute("points", g.pts.map((a) => a.x.toFixed(1) + "," + a.y.toFixed(1)).join(" ")); }
    } else if (g.t === "gomme") {
      const h = document.elementFromPoint(e.clientX, e.clientY); const pl = h && h.closest && h.closest("polyline[data-tid],path[data-lien]"); if (pl && tbPeut()) tbSupprimer(pl.dataset.tid);
    }
  });
  const fin = (e) => {
    if (!T.ptrs.has(e.pointerId)) return; T.ptrs.delete(e.pointerId);
    const g = T.geste; if (T.ptrs.size) return; T.geste = null; if (!g) return;
    if (g.t === "bouge") { const d = tbDoc(g.id); if (g.bouge) tbMaj(g.id, { x: d.x, y: d.y }); else if (g.deja && d && d.k !== "image") tbEcrire(g.id); else tbRendre(); }
    else if (g.t === "taille") { const d = tbDoc(g.id); tbMaj(g.id, { w: d.w, h: d.h }); }
    else if (g.t === "stylo") tbFinTrait(false, g);
    else if (g.t === "fond") tbRendre();
  };
  v.addEventListener("pointerup", fin); v.addEventListener("pointercancel", (e) => { if (T.geste && T.geste.t === "stylo") tbFinTrait(true); fin(e); });
  v.addEventListener("wheel", (e) => { const z = e.target.closest("#tbVue"); if (!z) return; e.preventDefault(); const r = z.getBoundingClientRect(); tbZoomer(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  v.addEventListener("input", (e) => { const ta = e.target.closest("[data-tbtexte]"); if (ta) { const d = tbDoc(ta.dataset.tbtexte); if (d) d.texte = ta.value; } });
}
function tbSelectionner() { document.querySelectorAll(".tb-el").forEach((el) => el.classList.toggle("sel", el.dataset.tid === T.sel)); const b = $("#tbBarre"); if (b) { const h = tbBarreHtml(); if (b.dataset.h !== h) { b.innerHTML = h; b.dataset.h = h; } } }
function tbFinTrait(annule, g) {
  const live = $("#tbLive"); if (live) live.remove();
  g = g || T.geste; if (annule || !g || g.t !== "stylo") { if (T.geste && T.geste.t === "stylo") T.geste = null; return; }
  if (g.pts.length < 2) return;
  const pts = []; for (const p of g.pts) pts.push(+p.x.toFixed(1), +p.y.toFixed(1));
  tbAjouter({ k: "trait", pts, couleur: T.encre, ep: T.ep });
}
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-tbfond],[data-tbo],[data-tbencre],[data-tbep],[data-tbcouleur],[data-tbsuppr],[data-tbzoom],[data-tbmur],[data-tbmurphoto],[data-tbfermer],[data-camera]"); if (!c) return;
  const d = c.dataset;
  if (d.tbfond) { T.fond = d.tbfond; try { localStorage.setItem("tbfond", T.fond); } catch (x) {} tbRendre(); }
  else if (d.tbo) { T.lienDe = null; T.outil = d.tbo; if (d.tbo !== "main") T.sel = null; tbRendre(); }
  else if (d.tbencre) { T.encre = d.tbencre; tbRendre(); }
  else if (d.tbep) { T.ep = +d.tbep; tbRendre(); }
  else if (d.tbcouleur && T.sel) { const s = tbDoc(T.sel); if (s) { s.couleur = d.tbcouleur; tbMaj(s.id, { couleur: d.tbcouleur }); tbDessiner(); } }
  else if (d.tbsuppr && T.sel) { if (confirm("Supprimer cet élément du tableau ?")) tbSupprimer(T.sel); }
  else if (d.tbzoom != null) { if (d.tbzoom === "0") { tbTout(); tbCam(); } else tbZoomer(+d.tbzoom); }
  else if (d.tbmur) tbChoisirMur();
  else if (d.tbmurphoto) { document.getElementById("tbpick").close(); tbImage(d.tbmurphoto, .75); }
  else if (d.tbfermer) document.getElementById("tbpick").close();
  else if (d.camera) ouvrirCamera(d.camera);
});
document.addEventListener("change", (e) => { if (e.target.id === "tbFichier" && e.target.files[0]) { tbEnvoyer(e.target.files[0]); e.target.value = ""; } });
document.addEventListener("keydown", (e) => { if ((e.key === "Delete" || e.key === "Backspace") && S.vue === "tableau" && T.sel && !T.edition && !e.target.closest("input,textarea,select") && tbPeut()) tbSupprimer(T.sel); });
VUES.tableau = () => "";
tbInit();

/* ---------- appareil photo : position et direction prises au moment de la photo ---------- */
let cam = null;
const capDepuis = (a, b, g) => { const r = Math.PI / 180, cA = Math.cos(a * r), sA = Math.sin(a * r), cB = Math.cos(b * r), sB = Math.sin(b * r), cG = Math.cos(g * r), sG = Math.sin(g * r);
  const rA = -cA * sG - sA * sB * cG, rB = -sA * sG + cA * sB * cG; let h = Math.atan(rA / rB); if (rB < 0) h += Math.PI; else if (rA < 0) h += 2 * Math.PI; return Math.round(h * 180 / Math.PI) % 360; };
async function ouvrirCamera(vers) {
  if (!S.ecrire || !db) return toast("Connecte-toi pour ajouter des photos.");
  /* l'autorisation de la boussole doit être demandée pendant le geste (iPhone) */
  try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); } catch (e) {}
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return cameraSecours(vers);
  let flux;
  try { flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } }, audio: false }); }
  catch (e) { toast("Appareil photo refusé : je passe par l'appareil du téléphone."); return cameraSecours(vers); }
  let d = document.getElementById("camdlg");
  if (!d) { d = document.createElement("dialog"); d.id = "camdlg"; d.className = "cam"; document.body.appendChild(d); }
  d.innerHTML = `<video autoplay playsinline muted></video><div class="haut"><span id="camPos">Position : recherche…</span><span id="camCap">Direction : …</span></div>
    <div class="bas"><button class="petit" id="camNon">Annuler</button><button class="declic" id="camOk" aria-label="Prendre la photo"></button><button class="petit" id="camChange">Autre caméra</button></div>`;
  const video = d.querySelector("video"); video.srcObject = flux;
  cam = { flux, pos: null, cap: null, face: "environment", vers };
  const fin = () => { cam.flux.getTracks().forEach((t) => t.stop()); if (cam.suivi != null) navigator.geolocation.clearWatch(cam.suivi); removeEventListener("deviceorientationabsolute", ori, true); removeEventListener("deviceorientation", ori, true); d.close(); cam = null; };
  if ("geolocation" in navigator) cam.suivi = navigator.geolocation.watchPosition((p) => { cam.pos = { lat: p.coords.latitude, lon: p.coords.longitude, prec: Math.round(p.coords.accuracy) }; const e = $("#camPos"); if (e) e.textContent = `Position : ±${cam.pos.prec} m`; }, () => { const e = $("#camPos"); if (e) e.textContent = "Position indisponible"; }, { enableHighAccuracy: true, maximumAge: 5000 });
  const ori = (ev) => {
    let c = null;
    if (ev.webkitCompassHeading != null) c = Math.round(ev.webkitCompassHeading);
    else if (ev.alpha != null && ev.beta != null && ev.gamma != null && (ev.absolute || ev.type === "deviceorientationabsolute")) c = capDepuis(ev.alpha, ev.beta, ev.gamma);
    if (c != null) { cam.cap = c; const e = $("#camCap"); if (e) e.textContent = `Direction : ${cap8(c)} (${c}°)`; }
  };
  addEventListener("deviceorientationabsolute", ori, true); addEventListener("deviceorientation", ori, true);
  d.querySelector("#camNon").onclick = fin;
  d.querySelector("#camChange").onclick = async () => {
    try { cam.flux.getTracks().forEach((t) => t.stop()); cam.face = cam.face === "environment" ? "user" : "environment"; cam.flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: cam.face } }, audio: false }); video.srcObject = cam.flux; } catch (e) { toast("Pas d'autre caméra."); }
  };
  d.querySelector("#camOk").onclick = async () => {
    const w = video.videoWidth, h = video.videoHeight; if (!w) return;
    const k = Math.min(1, 1600 / Math.max(w, h)), c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", .88));
    const pos = cam.pos || await positionActuelle(4000), exif = { source: "appareil", prise: new Date().toISOString().slice(0, 19) };
    if (pos) { exif.lat = +pos.lat.toFixed(6); exif.lon = +pos.lon.toFixed(6); }
    if (cam.cap != null && cam.face === "environment") exif.cap = cam.cap;
    const dest = cam.vers; fin(); photoPrise(new File([blob], "photo.jpg", { type: "image/jpeg" }), exif, dest);
  };
  d.addEventListener("cancel", (ev) => { ev.preventDefault(); fin(); }, { once: true });
  d.showModal();
}
function cameraSecours(vers) {
  const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.setAttribute("capture", "environment");
  i.onchange = async () => { const f = i.files[0]; if (!f) return; photoPrise(f, await lireExif(f), vers); };
  i.click();
}
async function photoPrise(fichier, exif, vers) {
  if (vers === "tableau") return tbEnvoyer(fichier);
  if (vers && vers.startsWith("pers:")) { const id = vers.slice(5); await fiEnvoyer([fichier], { personne: id, theme: "Entretiens" }); return peMaj(id, { a_transcrire: true, transcrit: false }); }
  if (!($("#dlg").open && $("#f_photo"))) { S.vue = "mur"; ouvrir("mur", null, {}); }
  const fi = $("#f_photo"); if (!fi) return;
  const dt = new DataTransfer(); dt.items.add(fichier); fi.files = dt.files;
  const a = $("#apercu"); a.src = URL.createObjectURL(fichier); a.hidden = false; edit.exif = exif;
  $("#exifInfo").textContent = exif.lat != null ? `Photo prise ici${exif.cap != null ? `, vers ${cap8(exif.cap)} (${exif.cap}°)` : ""} : elle apparaîtra sur la carte.` : "Position introuvable : associe la photo à un lieu pour la situer.";
  if (!$("#f_texte").value) $("#f_texte").focus();
}
