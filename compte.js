/* Compte rendu de la journée : l'emploi du temps, les tâches, les notes, les entretiens, les photos, les fichiers et les trajets
   du jour sont rassemblés tout seuls ; le résumé et « à retenir » s'écrivent à la main. Export PDF, copie en texte. */

COLS.push("comptes"); S.comptes = []; S.jourCR = auj();
ONGLETS.splice(8, 0, ["compte", "Compte rendu", null, "i-cr"]);
FAB.compte = "";
document.querySelector("svg defs, svg")?.insertAdjacentHTML("beforeend",
  `<symbol id="i-cr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7M9 8h2"/></symbol>`);
const crCss = document.createElement("style");
crCss.textContent = `.cr-chips{display:flex;flex-wrap:wrap;gap:8px}
.cr-chip{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:8px 14px;display:grid;line-height:1.1;min-width:92px}
.cr-chip b{font:700 1.5rem var(--display)}.cr-chip span{font-size:.78rem;color:var(--muted)}
.cr-grille{display:grid;gap:14px;grid-template-columns:1fr}
@media (min-width:1000px){.cr-grille{grid-template-columns:1fr 1fr}.cr-grille .large{grid-column:1/-1}}
.cr-bloc{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;gap:10px;align-content:start;min-width:0}
.cr-bloc h2{margin:0;font:700 1.05rem var(--display);letter-spacing:.06em;text-transform:uppercase;display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.cr-bloc h2 small{font:500 .78rem var(--body);color:var(--muted);text-transform:none;letter-spacing:0}
.cr-bloc textarea{width:100%;min-height:96px;font:inherit;color:inherit;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px 12px;resize:vertical}
.cr-ligne{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;padding:6px 0;border-top:1px solid var(--line)}
.cr-ligne:first-of-type{border-top:0;padding-top:0}
.cr-ligne .h{font-weight:700;font-variant-numeric:tabular-nums;color:var(--muted);min-width:46px}
.cr-ligne .t{overflow-wrap:anywhere}.cr-ligne .m{font-size:.8rem;color:var(--muted)}
.cr-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.cr-photos figure{margin:0;display:grid;gap:3px;min-width:0}.cr-photos img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;background:var(--sunk)}
.cr-photos figcaption{font-size:.75rem;color:var(--muted);overflow-wrap:anywhere}
.cr-vide{color:var(--muted);font-size:.9rem;margin:0}
.cr-bloc details{border-top:1px solid var(--line);padding:6px 0}.cr-bloc details:first-of-type{border-top:0}
.cr-bloc summary{cursor:pointer;font-weight:600}.cr-qr{display:grid;gap:6px;margin-top:6px;font-size:.88rem}.cr-qr b{font-weight:600}.cr-qr p{margin:0;overflow-wrap:anywhere}`;
document.head.appendChild(crCss);

const crJour = (t) => t ? iso(new Date(t)) : "";
const crHeure = (t) => t ? new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
const crKm = (pts) => { let d = 0; for (let i = 2; i + 1 < (pts || []).length; i += 2) { const a = pts[i - 1] * Math.PI / 180, b = pts[i + 1] * Math.PI / 180, dl = (pts[i] - pts[i - 2]) * Math.PI / 180, dp = b - a; const x = Math.sin(dp / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin(dl / 2) ** 2; d += 2 * 6371 * Math.asin(Math.sqrt(x)); } return d; };
const crId = (d) => S.site + "-" + d;
const crDoc = (d) => S.comptes.find((x) => x.id === crId(d)) || {};
const crQuestion = (id, r) => (r && r.q) || (S.questions.find((q) => q.id === id) || {}).texte || "Question";
function crDonnees(d) {
  const tri = (a, c) => a.sort((x, y) => (x[c] || 0) - (y[c] || 0));
  const duJour = (o) => o.jour ? o.jour === d : crJour(o.cree) === d;
  const notes = tri(S.mur.filter(duJour), "cree");
  return {
    creneaux: S.creneaux.filter((c) => c.date === d).sort(parHeure),
    tachesFaites: S.taches.filter((t) => statutDe(t) === "fait" && crJour(t.maj) === d),
    tachesMaj: S.taches.filter((t) => statutDe(t) !== "fait" && (crJour(t.maj) === d || crJour(t.cree) === d)),
    notes, photosMur: notes.filter((m) => m.photo),
    notesTexte: notes.filter((m) => m.texte),
    reponses: tri(S.reponses.filter((r) => crJour(r.quand) === d), "quand"),
    fichiers: tri(S.fichiers.filter(duJour), "cree"),
    traces: S.traces.filter((t) => crJour(t.cree) === d || crJour(t.debut) === d),
    lieux: S.lieux.filter((l) => crJour(l.cree) === d),
    tableau: S.tableau.filter((x) => x.k !== "trait" && x.k !== "lien" && crJour(x.cree) === d),
  };
}
const crFicheHtml = (r, i, n) => {
  const lignes = Object.entries(r.rep || {}).map(([qid, x]) => `<p><b>${esc(crQuestion(qid, x))}</b><br>${x.v === "oui" ? "Oui" : x.v === "non" ? "Non" : x.v === "autre" && !x.autre ? "Autre" : esc(x.v || "")}${x.autre ? ` : ${esc(x.autre)}` : ""}</p>`).join("");
  return `<details><summary>Entretien ${n - i} · ${esc(crHeure(r.quand))}${r.lieu ? ` · ${esc(r.lieu)}` : ""}${r.profil ? ` · ${esc(r.profil)}` : ""}</summary><div class="cr-qr">${r.texte_libre ? `<p style="white-space:pre-wrap">${esc(r.texte_libre)}</p>` : ""}${lignes || (r.texte_libre ? "" : '<p class="cr-vide">Fiche vide</p>')}</div></details>`;
};
function crPhotos(D) {
  const mur = D.photosMur.map((m) => `<figure><img src="${esc(photoUrl(m.photo))}" alt="" loading="lazy"><figcaption>${esc(m.texte || "")}${m.cap != null ? ` · vers ${cap8(m.cap)}` : ""}</figcaption></figure>`);
  const fi = D.fichiers.filter(fiImage).map((f) => { const p = fiChemin(f), c = fiLiens.get(p); return `<figure><img data-fpath="${esc(p)}" alt=""${c ? ` src="${esc(c.url)}"` : ""} loading="lazy" decoding="async"><figcaption>${esc(f.nom)}</figcaption></figure>`; });
  return [...mur, ...fi];
}
VUES.compte = () => {
  const d = S.jourCR, D = crDonnees(d), cr = crDoc(d), ph = crPhotos(D), km = D.traces.reduce((s, t) => s + crKm(t.pts), 0);
  const nomJ = fmt(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const chip = (n, l) => `<div class="cr-chip"><b>${n}</b><span>${l}</span></div>`;
  const ligne = (h, t, m) => `<div class="cr-ligne"><span class="h">${h}</span><div><div class="t">${t}</div>${m ? `<div class="m">${m}</div>` : ""}</div></div>`;
  const champ = (id, titre, val, aide) => `<div class="cr-bloc large"><h2>${titre}</h2>${S.ecrire && db ? `<textarea id="${id}" placeholder="${aide}">${esc(val || "")}</textarea>${cr.par ? `<span class="qui">Dernière modification par ${auteur(cr)} · ${esc(quand(cr.maj))}</span>` : ""}` : `<p class="${val ? "" : "cr-vide"}">${esc(val || "Rien d'écrit.")}</p>`}</div>`;
  return `<div class="tete"><h1>Compte rendu<small>${esc(nomJ)}</small></h1>
    <div class="outils"><button class="btn" data-crexport="pdf">PDF</button><button class="btn" data-crexport="texte">Copier en texte</button><button class="btn ico" data-crjour="-1" aria-label="Jour précédent">${ic("i-g")}</button>${d !== auj() ? `<button class="btn" data-crjour="0">Aujourd'hui</button>` : ""}<button class="btn ico" data-crjour="1" aria-label="Jour suivant">${ic("i-d")}</button><input type="date" id="crDate" value="${d}" aria-label="Choisir le jour" style="border:1px solid var(--line);border-radius:999px;padding:7px 12px;background:var(--surface);color:var(--ink);font:inherit"></div></div>
  <div class="cr-chips">${chip(D.creneaux.length, "créneaux")}${chip(D.tachesFaites.length, "tâches terminées")}${chip(D.notes.length, "notes")}${chip(ph.length, "photos")}${chip(D.reponses.length, "entretiens")}${chip(D.fichiers.length, "fichiers")}${chip(km ? km.toFixed(1).replace(".", ",") : "0", "km parcourus")}</div>
  <div class="cr-grille">
  ${champ("crResume", "Résumé de la journée", cr.resume, "Ce qui s'est passé, ce qu'on a appris, les difficultés…")}
  ${champ("crDemain", "À retenir et pour demain", cr.demain, "Décisions prises, points à vérifier, ce qu'il reste à faire demain…")}
  <div class="cr-bloc"><h2>Emploi du temps <small>${D.creneaux.length}</small></h2>${D.creneaux.map((c) => ligne(esc(c.debut || "—"), `<b>${esc(c.titre)}</b> · ${esc(TYPES[typeDe(c)])}`, [c.lieu, c.qui].filter(Boolean).map(esc).join(" · "))).join("") || '<p class="cr-vide">Aucun créneau ce jour-là.</p>'}</div>
  <div class="cr-bloc"><h2>Tâches <small>${D.tachesFaites.length} terminée${D.tachesFaites.length > 1 ? "s" : ""}</small></h2>${[...D.tachesFaites.map((t) => ligne("✓", esc(t.titre), [t.responsable, t.theme].filter(Boolean).map(esc).join(" · "))), ...D.tachesMaj.map((t) => ligne(statutDe(t) === "encours" ? "◐" : "○", esc(t.titre), [STATUTS[statutDe(t)], t.responsable].filter(Boolean).map(esc).join(" · ")))].join("") || '<p class="cr-vide">Aucune tâche mise à jour.</p>'}</div>
  <div class="cr-bloc large"><h2>Entretiens <small>${D.reponses.length}</small></h2>${D.reponses.map((r, i) => crFicheHtml(r, i, D.reponses.length)).join("") || '<p class="cr-vide">Aucun entretien enregistré ce jour-là.</p>'}</div>
  <div class="cr-bloc"><h2>Notes du mur <small>${D.notesTexte.length}</small></h2>${D.notesTexte.map((m) => ligne(esc(crHeure(m.cree)), esc(m.texte), [m.theme, nomLieu(m.lieu)].filter(Boolean).map(esc).join(" · "))).join("") || '<p class="cr-vide">Aucune note.</p>'}</div>
  <div class="cr-bloc"><h2>Lieux et trajets <small>${D.lieux.length + D.traces.length}</small></h2>${[...D.lieux.map((l) => ligne("📍", esc(l.nom), esc(l.note || ""))), ...D.traces.map((t) => ligne("〰", esc(t.nom || "Trajet"), crKm(t.pts).toFixed(2).replace(".", ",") + " km"))].join("") || '<p class="cr-vide">Aucun lieu ni trajet.</p>'}${D.tableau.length ? `<p class="m">${D.tableau.length} élément${D.tableau.length > 1 ? "s" : ""} ajouté${D.tableau.length > 1 ? "s" : ""} au tableau.</p>` : ""}</div>
  <div class="cr-bloc large"><h2>Photos <small>${ph.length}</small></h2>${ph.length ? `<div class="cr-photos">${ph.slice(0, S.crToutes ? ph.length : 36).join("")}</div>${ph.length > 36 ? `<div><button class="btn" data-crtoutes="1">${S.crToutes ? "Réduire" : "Afficher les " + ph.length + " photos"}</button></div>` : ""}` : '<p class="cr-vide">Aucune photo ce jour-là.</p>'}</div>
  <div class="cr-bloc large"><h2>Fichiers ajoutés <small>${D.fichiers.length}</small></h2>${[...(D.fichiers.some(fiImage) ? [ligne("🖼", `${D.fichiers.filter(fiImage).length} photo${D.fichiers.filter(fiImage).length > 1 ? "s" : ""} déposée${D.fichiers.filter(fiImage).length > 1 ? "s" : ""} (voir « Photos » plus haut)`, "")] : []), ...D.fichiers.filter((f) => !fiImage(f)).map((f) => ligne(esc(crHeure(f.cree)), esc(f.nom), `${esc(fiTaille(f.taille || 0))} · ${auteur(f)}`))].join("") || '<p class="cr-vide">Aucun fichier ajouté.</p>'}</div>
  </div>`;
};

/* enregistrement du texte écrit à la main (quand on quitte le champ) */
document.addEventListener("focusout", async (e) => {
  if (e.target.id !== "crResume" && e.target.id !== "crDemain") return;
  if (!db || !S.ecrire) return;
  const d = S.jourCR, prev = crDoc(d), resume = ($("#crResume") || {}).value ?? prev.resume ?? "", demain = ($("#crDemain") || {}).value ?? prev.demain ?? "";
  if ((prev.resume || "") === resume && (prev.demain || "") === demain) return;
  const now = Date.now();
  try { await db.collection("comptes").doc(crId(d)).set({ date: d, resume, demain, par: S.moi, auteur: prev.auteur || S.moi, cree: prev.cree || now, maj: now }); toast("Compte rendu enregistré"); } catch (x) { refus(x); }
});
document.addEventListener("change", (e) => { if (e.target.id === "crDate" && e.target.value) { S.jourCR = e.target.value; render(); } });

/* texte et PDF */
function crTexte(d, D) {
  const cr = crDoc(d), L = [`COMPTE RENDU · ${SITES[S.site].nom} · ${fmt(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`, ""];
  const sec = (t, a) => { if (a.length) { L.push(t.toUpperCase(), ...a, ""); } };
  if (cr.resume) sec("Résumé", [cr.resume]);
  if (cr.demain) sec("À retenir et pour demain", [cr.demain]);
  sec("Emploi du temps", D.creneaux.map((c) => `- ${c.debut || "—"}${c.fin ? "–" + c.fin : ""} ${c.titre} (${TYPES[typeDe(c)]})${c.lieu ? ", " + c.lieu : ""}${c.qui ? ", " + c.qui : ""}`));
  sec("Tâches terminées", D.tachesFaites.map((t) => `- ${t.titre}${t.responsable ? " (" + t.responsable + ")" : ""}`));
  sec("Tâches mises à jour", D.tachesMaj.map((t) => `- ${t.titre} : ${STATUTS[statutDe(t)]}`));
  sec("Entretiens", D.reponses.map((r, i) => `Entretien ${i + 1} (${crHeure(r.quand)}${r.lieu ? ", " + r.lieu : ""}${r.profil ? ", " + r.profil : ""})\n` + (r.texte_libre ? "  " + r.texte_libre.replace(/\n/g, "\n  ") + "\n" : "") + Object.entries(r.rep || {}).map(([q, x]) => `  · ${crQuestion(q, x)} → ${x.v}${x.autre ? " : " + x.autre : ""}`).join("\n")));
  sec("Notes", D.notesTexte.map((m) => `- ${m.texte}`));
  sec("Photos", [`${crPhotos(D).length} photo(s) du jour`]);
  sec("Fichiers ajoutés", [...(D.fichiers.some(fiImage) ? [`- ${D.fichiers.filter(fiImage).length} photo(s) déposée(s)`] : []), ...D.fichiers.filter((f) => !fiImage(f)).map((f) => `- ${f.nom}`)]);
  return L.join("\n");
}
async function crPdf(d, D) {
  const cr = crDoc(d), photos = [];
  for (const m of D.photosMur.slice(0, 24)) photos.push({ u: photoUrl(m.photo), t: m.texte || "" });
  for (const f of D.fichiers.filter(fiImage).slice(0, 24 - photos.length)) { try { photos.push({ u: await fiUrl({ ...f, chemin: fiChemin(f) }), t: f.nom }); } catch (e) {} }
  const li = (a) => a.length ? `<ul>${a.map((x) => `<li>${x}</li>`).join("")}</ul>` : `<p class="v">Rien.</p>`;
  const corps = `<h1>Compte rendu · ${exHtml(exSite())}</h1><p class="sous">${exHtml(fmt(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</p>
  ${cr.resume ? `<h2>Résumé de la journée</h2><p class="t">${exHtml(cr.resume)}</p>` : ""}${cr.demain ? `<h2>À retenir et pour demain</h2><p class="t">${exHtml(cr.demain)}</p>` : ""}
  <h2>Emploi du temps</h2>${li(D.creneaux.map((c) => `<b>${exHtml(c.debut || "—")}${c.fin ? "–" + exHtml(c.fin) : ""}</b> ${exHtml(c.titre)} <i>(${exHtml(TYPES[typeDe(c)])})</i>${c.lieu || c.qui ? `<br><span class="m">${exHtml([c.lieu, c.qui].filter(Boolean).join(" · "))}</span>` : ""}`))}
  <h2>Tâches</h2>${li([...D.tachesFaites.map((t) => `✓ ${exHtml(t.titre)}${t.responsable ? ` <span class="m">(${exHtml(t.responsable)})</span>` : ""}`), ...D.tachesMaj.map((t) => `${exHtml(t.titre)} <span class="m">: ${exHtml(STATUTS[statutDe(t)])}</span>`)])}
  <h2>Entretiens (${D.reponses.length})</h2>${D.reponses.map((r, i) => `<div class="q"><b>Entretien ${i + 1}</b> · ${exHtml(crHeure(r.quand))}${r.lieu ? " · " + exHtml(r.lieu) : ""}${r.profil ? " · " + exHtml(r.profil) : ""}${r.texte_libre ? `<br><span class="t">${exHtml(r.texte_libre)}</span>` : ""}${Object.entries(r.rep || {}).map(([q, x]) => `<br><span class="m">${exHtml(crQuestion(q, x))}</span> → ${exHtml(x.v || "")}${x.autre ? " : " + exHtml(x.autre) : ""}`).join("")}</div>`).join("") || `<p class="v">Aucun entretien.</p>`}
  <h2>Notes</h2>${li(D.notesTexte.map((m) => exHtml(m.texte)))}
  <h2>Photos (${photos.length})</h2>${photos.length ? `<div class="ph">${photos.map((p) => `<figure><img src="${exHtml(p.u)}"><figcaption>${exHtml(p.t)}</figcaption></figure>`).join("")}</div>` : `<p class="v">Aucune photo.</p>`}
  <h2>Fichiers ajoutés</h2>${li([...(D.fichiers.some(fiImage) ? [`${D.fichiers.filter(fiImage).length} photo(s) déposée(s)${D.fichiers.filter(fiImage).length > photos.length ? ` (${photos.length} affichées ci-dessus)` : ""}`] : []), ...D.fichiers.filter((f) => !fiImage(f)).map((f) => exHtml(f.nom))])}`;
  exImprimer("Compte rendu " + d, corps, `h1{font-size:22px;margin:0}.sous{margin:2px 0 8px;color:#555;text-transform:capitalize}h2{font-size:14px;background:#17302a;color:#fff;padding:4px 9px;margin:16px 0 6px}ul{margin:0;padding-left:18px}li{margin:3px 0}.m{color:#555;font-size:12px}.t{white-space:pre-wrap}.v{color:#777}.q{break-inside:avoid;margin:0 0 8px;font-size:12px}.ph{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}figure{margin:0;break-inside:avoid}img{width:100%;aspect-ratio:4/3;object-fit:cover}figcaption{font-size:10px;color:#555}`);
}
document.addEventListener("click", async (e) => {
  const j = e.target.closest("[data-crjour]"), x = e.target.closest("[data-crexport]"), tt = e.target.closest("[data-crtoutes]");
  if (tt) { S.crToutes = !S.crToutes; render(); return; }
  if (j) { S.jourCR = j.dataset.crjour === "0" ? auj() : plus(S.jourCR, +j.dataset.crjour); render(); return; }
  if (!x) return;
  const d = S.jourCR, D = crDonnees(d);
  if (x.dataset.crexport === "texte") { const t = crTexte(d, D); try { await navigator.clipboard.writeText(t); toast("Compte rendu copié : colle-le où tu veux"); } catch (err) { prompt("Copie le texte :", t); } }
  else { toast("Préparation du PDF…"); await crPdf(d, D); }
});
