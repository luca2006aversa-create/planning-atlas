/* Exports : emploi du temps (Excel, PDF, image) et questionnaire (PDF à imprimer).
   Tout se fait dans le navigateur ; la bibliothèque Excel ne se charge qu'au premier export Excel. */

const EX = { portee: "sem", moi: false, taches: true };
const exNom = (uid) => (uid && (pseudoDe(uid) || "")) || "";
const exCouleur = (t) => getComputedStyle(document.documentElement).getPropertyValue("--t-" + t).trim() || "#6d7b75";
const exHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const exSite = () => SITES[S.site].nom + " · " + SITES[S.site].groupes;
const exLigne = (c) => `${c.debut || ""}${c.fin ? "–" + c.fin : ""}`;

function exJours() {
  const l = plus(lundiDe(auj()), 7 * S.semaine), nb = EX.portee === "sem" ? 7 : EX.portee === "deux" ? 14 : null;
  let cr = S.creneaux.filter((c) => c.date && (!EX.moi || estMoi(c.qui) || /tous/i.test(c.qui || "")));
  if (nb) { const fin = plus(l, nb - 1); cr = cr.filter((c) => c.date >= l && c.date <= fin); }
  const dates = [...new Set(cr.map((c) => c.date))].sort();
  return { jours: dates.map((d) => ({ date: d, items: cr.filter((c) => c.date === d).sort(parHeure) })), du: dates[0], au: dates[dates.length - 1] };
}
const exPeriode = (p) => p.du ? (p.du === p.au ? fmt(p.du, { day: "numeric", month: "long", year: "numeric" }) : `du ${fmt(p.du, { day: "numeric", month: "long" })} au ${fmt(p.au, { day: "numeric", month: "long", year: "numeric" })}`) : "";
const exFichier = (ext) => `planning-${S.site}-${auj()}.${ext}`;

/* ---- Excel ---- */
function chargerScript(src) { return new Promise((ok, ko) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => ko(new Error("chargement impossible")); document.head.appendChild(s); }); }
async function exExcel() {
  if (!window.XLSX) await chargerScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
  const p = exJours(), wb = XLSX.utils.book_new();
  const lignes = [["Jour", "Date", "Début", "Fin", "Type", "Titre", "Lieu", "Qui", "Consignes", "Créé par", "Modifié par"]];
  for (const j of p.jours) for (const c of j.items)
    lignes.push([fmt(j.date, { weekday: "long", day: "numeric", month: "long" }), j.date, c.debut || "", c.fin || "", TYPES[typeDe(c)], c.titre || "", c.lieu || "", c.qui || "", c.consignes || "", exNom(crea(c)), exNom(c.par)]);
  const ws = XLSX.utils.aoa_to_sheet(lignes);
  ws["!cols"] = [18, 12, 8, 8, 10, 38, 24, 22, 44, 16, 16].map((w) => ({ wch: w }));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, ws, "Emploi du temps");
  if (EX.taches) {
    const t = [["Tâche", "Statut", "Responsable", "Échéance", "Thème", "Détail", "Créée par", "Modifiée par"]];
    for (const x of [...S.taches].sort((a, b) => (a.echeance || "9").localeCompare(b.echeance || "9")))
      t.push([x.titre || "", STATUTS[statutDe(x)], x.responsable || "", x.echeance || "", x.theme || "", x.detail || "", exNom(crea(x)), exNom(x.par)]);
    const w2 = XLSX.utils.aoa_to_sheet(t); w2["!cols"] = [40, 10, 18, 12, 16, 50, 16, 16].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, w2, "Tâches");
  }
  XLSX.writeFile(wb, exFichier("xlsx"));
}

/* ---- impression / PDF ---- */
function exImprimer(titre, corps, css) {
  const doc = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${exHtml(titre)}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font:13px/1.45 Arial,Helvetica,sans-serif;color:#111;margin:0}${css}</style></head><body>${corps}</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.open(); w.document.write(doc); w.document.close(); w.onload = () => { w.focus(); w.print(); }; setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 700); return; }
  const f = document.createElement("iframe"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"; document.body.appendChild(f);
  f.contentWindow.document.open(); f.contentWindow.document.write(doc); f.contentWindow.document.close();
  setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); }, 500);
}
function exPdf() {
  const p = exJours();
  const corps = `<h1>Emploi du temps · ${exHtml(exSite())}</h1><p class="sous">${exHtml(exPeriode(p))}${EX.moi ? " · " + exHtml(monPseudo()) : ""}</p>` +
    (p.jours.map((j) => `<section><h2>${exHtml(fmt(j.date, { weekday: "long", day: "numeric", month: "long" }))}</h2><table>${j.items.map((c) => `<tr><td class="h">${exHtml(exLigne(c) || "—")}</td><td class="t"><i style="background:${exCouleur(typeDe(c))}"></i>${exHtml(TYPES[typeDe(c)])}</td><td><b>${exHtml(c.titre)}</b>${c.lieu || c.qui ? `<br><span class="m">${exHtml([c.lieu, c.qui].filter(Boolean).join(" · "))}</span>` : ""}${c.consignes ? `<br><span class="m">${exHtml(c.consignes)}</span>` : ""}</td></tr>`).join("")}</table></section>`).join("") || `<p>Aucun créneau sur cette période.</p>`);
  exImprimer("Emploi du temps", corps, `h1{font-size:22px;margin:0 0 2px}.sous{margin:0 0 14px;color:#555}h2{font-size:14px;text-transform:capitalize;background:#17302a;color:#fff;padding:5px 9px;margin:14px 0 0}section{break-inside:avoid}table{width:100%;border-collapse:collapse}td{padding:6px 8px;border-bottom:1px solid #ddd;vertical-align:top}.h{width:84px;font-weight:700;white-space:nowrap}.t{width:92px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}.t i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px}.m{color:#555;font-size:12px}`);
}

/* ---- image (PNG) ---- */
function exLignes(ctx, txt, larg) {
  const mots = String(txt || "").split(/\s+/), out = []; let cur = "";
  for (const m of mots) { const t = cur ? cur + " " + m : m; if (ctx.measureText(t).width > larg && cur) { out.push(cur); cur = m; } else cur = t; }
  if (cur) out.push(cur); return out;
}
async function exPng() {
  try { await document.fonts.ready; } catch (e) {}
  const p = exJours(), W = 1400, M = 56, X1 = M + 190, LW = W - M - X1, FONT = '"Be Vietnam Pro","Segoe UI",Arial,sans-serif';
  const dessiner = (ctx, sec) => {
    let y = M; const t = (txt, x, yy, taille, poids, col) => { ctx.font = `${poids} ${taille}px ${FONT}`; ctx.fillStyle = col; ctx.fillText(txt, x, yy); };
    ctx.textBaseline = "top";
    if (!sec) { /* mesure seulement */ }
    t("Emploi du temps · " + exSite(), M, y, 40, 800, "#17302a"); y += 54;
    t(exPeriode(p) + (EX.moi ? " · " + monPseudo() : ""), M, y, 24, 500, "#5b6d66"); y += 52;
    if (!p.jours.length) { t("Aucun créneau sur cette période.", M, y, 24, 500, "#17302a"); y += 40; }
    for (const j of p.jours) {
      if (sec) { ctx.fillStyle = "#17302a"; ctx.fillRect(M, y, W - 2 * M, 44); }
      const nomJ = fmt(j.date, { weekday: "long", day: "numeric", month: "long" }); t(nomJ.charAt(0).toUpperCase() + nomJ.slice(1), M + 16, y + 9, 24, 700, "#eef1ec"); y += 44;
      for (const c of j.items) {
        ctx.font = `700 24px ${FONT}`; const tl = exLignes(ctx, c.titre, LW - 20);
        ctx.font = `500 19px ${FONT}`; const ml = exLignes(ctx, [c.lieu, c.qui].filter(Boolean).join("  ·  "), LW - 20), cl = c.consignes ? exLignes(ctx, c.consignes, LW - 20) : [];
        const h = 18 + 22 + tl.length * 32 + ml.length * 27 + cl.length * 27 + 16;
        if (sec) { ctx.fillStyle = "#ffffff"; ctx.fillRect(M, y, W - 2 * M, h); ctx.fillStyle = "#d3dcd5"; ctx.fillRect(M, y + h - 1, W - 2 * M, 1); ctx.fillStyle = exCouleur(typeDe(c)); ctx.fillRect(M, y, 6, h - 1); }
        t(exLigne(c) || "—", M + 22, y + 16, 24, 700, "#17302a");
        t(TYPES[typeDe(c)].toUpperCase(), X1, y + 14, 16, 700, exCouleur(typeDe(c)));
        let yy = y + 38; tl.forEach((l) => { t(l, X1, yy, 24, 700, "#17302a"); yy += 32; });
        ml.forEach((l) => { t(l, X1, yy, 19, 500, "#5b6d66"); yy += 27; }); cl.forEach((l) => { t(l, X1, yy, 19, 500, "#5b6d66"); yy += 27; });
        y += h;
      }
      y += 22;
    }
    t("Planning Atlas · exporté le " + new Date().toLocaleDateString("fr-FR"), M, y + 6, 16, 500, "#8a9a93"); return y + 6 + 16 + M;
  };
  const mesure = document.createElement("canvas").getContext("2d"), H = Math.ceil(dessiner(mesure, false));
  const k = 2, c = document.createElement("canvas"); c.width = W * k; c.height = H * k; const ctx = c.getContext("2d"); ctx.scale(k, k);
  ctx.fillStyle = "#eef1ec"; ctx.fillRect(0, 0, W, H); dessiner(ctx, true);
  const blob = await new Promise((r) => c.toBlob(r, "image/png")), a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = exFichier("png"); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ---- boîte de dialogue de l'emploi du temps ---- */
function exDialogue() {
  let d = document.getElementById("exdlg");
  if (!d) { d = document.createElement("dialog"); d.id = "exdlg"; d.style.cssText = "max-width:460px;width:92vw;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);padding:18px"; document.body.appendChild(d); }
  const r = (v, l) => `<label class="case" style="display:flex;gap:8px;align-items:center"><input type="radio" name="exp" value="${v}"${EX.portee === v ? " checked" : ""}>${l}</label>`;
  d.innerHTML = `<h3 style="margin:0 0 12px">Exporter l'emploi du temps</h3><div style="display:grid;gap:8px;margin-bottom:12px">
    ${r("sem", "La semaine affichée")}${r("deux", "La semaine affichée et la suivante")}${r("tout", "Tout le planning")}
    ${monPseudo() ? `<label class="case" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="exMoi"${EX.moi ? " checked" : ""}>Seulement mes créneaux (${esc(monPseudo())})</label>` : ""}
    <label class="case" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="exTaches"${EX.taches ? " checked" : ""}>Excel : ajouter la liste des tâches</label></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn jaune" data-exporter="xlsx">Excel</button><button class="btn" data-exporter="pdf">PDF</button><button class="btn" data-exporter="png">Image</button><button class="btn" data-exporter="fermer" style="margin-left:auto">Fermer</button></div>
    <p class="qui" id="exMsg" style="margin:10px 0 0"></p>`;
  d.showModal();
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-export],[data-exporter]"); if (!b) return;
  if (b.dataset.export === "planning") return exDialogue();
  if (b.dataset.export === "questions") return exQuestions();
  const m = b.dataset.exporter, d = document.getElementById("exdlg");
  if (m === "fermer") return d.close();
  const rad = d.querySelector('input[name="exp"]:checked'); EX.portee = rad ? rad.value : "sem";
  EX.moi = !!(d.querySelector("#exMoi") && d.querySelector("#exMoi").checked); EX.taches = !!d.querySelector("#exTaches").checked;
  const msg = d.querySelector("#exMsg"); msg.textContent = "Préparation…";
  try { if (m === "xlsx") await exExcel(); else if (m === "pdf") exPdf(); else await exPng(); msg.textContent = m === "pdf" ? "Dans la fenêtre d'impression, choisis « Enregistrer en PDF »." : "Fichier créé."; }
  catch (x) { msg.textContent = "Export impossible : " + (x.message || "erreur") + "."; }
});

/* ---- questionnaire à imprimer ---- */
function exQuestions() {
  const qs = [...S.questions].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  if (!qs.length) return toast("Écris d'abord des questions.");
  const lien = lienQ(), cases = `<span class="c"></span> Oui &nbsp;&nbsp;&nbsp; <span class="c"></span> Non &nbsp;&nbsp;&nbsp; <span class="c"></span> Autre : <span class="trait court"></span>`;
  const corps = `<h1>Questionnaire · ${exHtml(exSite())}</h1><p class="sous">Workshop S5 · Atlas</p>
  <div class="entete"><span>Date : <span class="trait court"></span></span><span>Lieu : <span class="trait long"></span></span><span>Profil (facultatif) : <span class="trait long"></span></span></div>` +
    qs.map((q, i) => `<div class="q"><p class="qt"><b>${i + 1}.</b> ${exHtml(q.texte)}</p>${q.type === "ouverte" ? `<div class="ligne"></div><div class="ligne"></div>` : `<p class="rep">${cases}</p>`}</div>`).join("") +
    `<p class="pied">Réponse en ligne : ${exHtml(lien)}</p>`;
  exImprimer("Questionnaire", corps, `h1{font-size:22px;margin:0}.sous{margin:2px 0 14px;color:#555}.entete{display:flex;gap:18px;flex-wrap:wrap;margin-bottom:18px;font-size:12px}.trait{display:inline-block;border-bottom:1px dotted #333;vertical-align:baseline}.trait.court{width:110px}.trait.long{width:170px}.q{break-inside:avoid;margin:0 0 20px}.qt{margin:0 0 8px;font-size:14px}.rep{margin:6px 0 0;font-size:14px}.c{display:inline-block;width:15px;height:15px;border:1.5px solid #111;border-radius:3px;vertical-align:-3px;margin-right:4px}.ligne{border-bottom:1.5px dotted #444;height:30px}.pied{margin-top:24px;font-size:11px;color:#666}`);
}
