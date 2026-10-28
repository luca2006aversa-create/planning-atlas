/* Planning Atlas, version indépendante : remplace la base claude.ai par Supabase.
   Les données gardent la même forme : une ligne par document (collection, id, contenu JSON). */
const SB = supabase.createClient(CONFIG.url, CONFIG.cle);
const nouvelId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 20);
const photoUrl = (id) => SB.storage.from("photos").getPublicUrl(id).data.publicUrl;

/* ---------- même interface que le db de claude.ai, branchée sur la table « docs » ---------- */
const cache = {}, abonnes = {}, abonnesDoc = {};
let charge = false;
const table = (col) => (cache[col] ??= new Map());
const erreur = (e) => ({ code: e && (e.code === "42501" || /row-level security/i.test(e.message || "")) ? "invalid_argument" : "unavailable", message: e && e.message });
function emettre(col) {
  const docs = [...table(col)].map(([id, data]) => ({ id, exists: true, data: () => data }));
  (abonnes[col] || []).forEach((cb) => cb({ docs, metadata: { fromCache: false } }));
  for (const [cle, cbs] of Object.entries(abonnesDoc)) {
    const [c, i] = cle.split("/");
    if (c === col) { const d = table(col).get(i); cbs.forEach((cb) => cb({ exists: !!d, data: () => d })); }
  }
}
async function charger() {
  const { data, error } = await SB.from("docs").select("col,id,data");
  if (error) throw erreur(error);
  for (const m of Object.values(cache)) m.clear();
  for (const r of data) table(r.col).set(r.id, r.data);
  charge = true;
  new Set([...Object.keys(abonnes), ...Object.keys(abonnesDoc).map((k) => k.split("/")[0])]).forEach(emettre);
}
const filesMaj = new Map();
const ref = (col, id) => ({
  id,
  async set(data) {
    if (data.site === undefined && !["membres", "consignes", "sites"].includes(col)) data = { ...data, site: S.site };
    const { error } = await SB.from("docs").upsert({ col, id, data, maj: new Date().toISOString() });
    if (error) throw erreur(error);
    table(col).set(id, data); emettre(col);
  },
  /* modification partielle : les écritures d'un même document passent l'une après l'autre, et chacune repart de la version
     la plus récente du serveur (sinon deux modifications rapprochées s'écrasaient : le texte tapé disparaissait) */
  update(patch) {
    const cle = col + "/" + id, prec = filesMaj.get(cle) || Promise.resolve();
    const fait = prec.then(async () => {
      let base = table(col).get(id) || {};
      try { const { data, error } = await SB.from("docs").select("data").eq("col", col).eq("id", id).maybeSingle(); if (!error && data && data.data) base = data.data; } catch (e) {}
      await this.set({ ...base, ...patch });
    });
    filesMaj.set(cle, fait.catch(() => {}));
    return fait;
  },
  async delete() {
    const { error } = await SB.from("docs").delete().match({ col, id });
    if (error) throw erreur(error);
    table(col).delete(id); emettre(col);
  },
  onSnapshot(cb) {
    (abonnesDoc[col + "/" + id] ??= []).push(cb);
    if (charge) { const d = table(col).get(id); cb({ exists: !!d, data: () => d }); }
    return () => {};
  },
});
const dbSB = {
  collection: (col) => ({
    doc: (id) => ref(col, id || nouvelId()),
    onSnapshot(cb) { (abonnes[col] ??= []).push(cb); if (charge) emettre(col); return () => {}; },
  }),
  doc: (p) => { const [c, i] = p.split("/"); return ref(c, i); },
};
const assetsSB = {
  async upload(blob, opt) {
    const type = (opt && opt.type) || blob.type || "image/jpeg";
    const id = nouvelId() + (type === "image/png" ? ".png" : ".jpg");
    const { error } = await SB.storage.from("photos").upload(id, blob, { contentType: type, cacheControl: "31536000" });
    if (error) throw { code: /size|large/i.test(error.message) ? "too_large" : "upstream_error", message: error.message };
    return { id, url: photoUrl(id) };
  },
  async delete(id) { await SB.storage.from("photos").remove([id]); return { deleted: true }; },
};
const userSB = { id: async () => S.moi, can: async () => true, profiles: async (ids) => Object.fromEntries([].concat(ids).map((i) => [i, { name: "" }])) };

/* ---------- messages propres à cette version ---------- */
function info() {
  const e = $("#info");
  if (!db) { e.hidden = false; e.textContent = "Connexion à la base impossible pour l'instant : vérifie le réseau puis recharge la page."; return; }
  e.hidden = true;
}
function refus(e) {
  const c = e && e.code;
  if (c === "invalid_argument") toast("Accès refusé : recharge la page et entre le code du groupe.");
  else if (c === "too_large") toast("Fichier trop lourd.");
  else toast("Échec de l'enregistrement, vérifie le réseau et réessaie.");
}

/* ---------- entrée : code du groupe + identifiant, une fois par appareil ---------- */
function ecranEntree() {
  return new Promise((ok) => {
    const d = $("#entree"), f = $("#fEntree");
    d.showModal();
    d.addEventListener("cancel", (e) => e.preventDefault());
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = $("#e_code").value.trim(), pseudo = $("#e_pseudo").value.trim(), b = f.querySelector("button");
      if (!code || !pseudo) return;
      b.disabled = true;
      const { data, error } = await SB.rpc("rejoindre", { code, pseudo });
      b.disabled = false;
      if (error) { $("#e_msg").textContent = "Erreur de connexion : " + error.message; return; }
      if (!data) { $("#e_msg").textContent = "Code du groupe incorrect."; $("#e_code").select(); return; }
      const site = (document.querySelector('input[name="e_site"]:checked') || {}).value || "hanoi"; S.site = site; try { localStorage.setItem("site", site); } catch (x) {} d.close(); ok();
    });
  });
}

/* ---------- GPS en direct : trajet, position actuelle, position des photos ---------- */
let suivi = null, trajet = null, verrou = null, maPos = null;
function positionActuelle(attente = 8000) {
  if (maPos && Date.now() - maPos.t < 30000) return Promise.resolve(maPos);
  if (!("geolocation" in navigator)) return Promise.resolve(null);
  return new Promise((ok) => navigator.geolocation.getCurrentPosition(
    (p) => { maPos = { lon: p.coords.longitude, lat: p.coords.latitude, t: Date.now() }; ok(maPos); },
    () => ok(null), { enableHighAccuracy: true, timeout: attente, maximumAge: 20000 }));
}
async function lireExif(file) {
  const r = (await lireExifBrut(file)) || {};
  if (r.lat == null) { const p = await positionActuelle(); if (p) { r.lat = +p.lat.toFixed(6); r.lon = +p.lon.toFixed(6); r.source = "telephone"; } }
  return r;
}
async function garderEcran() { try { verrou = await navigator.wakeLock.request("screen"); } catch (e) {} }
document.addEventListener("visibilitychange", () => { if (suivi != null && document.visibilityState === "visible") garderEcran(); });
function demarrerTrajet() {
  if (!("geolocation" in navigator)) { toast("Ce navigateur ne donne pas la position."); return; }
  trajet = { id: nouvelId(), pts: [], debut: new Date().toISOString(), envoi: 0 };
  suivi = navigator.geolocation.watchPosition((p) => {
    const { longitude: lon, latitude: lat, accuracy } = p.coords;
    maPos = { lon, lat, t: Date.now(), prec: Math.round(accuracy) };
    if (accuracy <= 60) {
      const q = trajet.pts, n = q.length;
      if (!n || Math.hypot((lon - q[n - 2]) * 111320 * Math.cos(lat * Math.PI / 180), (lat - q[n - 1]) * 110540) > 5) q.push(+lon.toFixed(6), +lat.toFixed(6));
      if (Date.now() - trajet.envoi > 20000) envoyerTrajet(false);
    }
    if ($("#carte")) majCarte();
  }, (e) => toast({ 1: "Position refusée : autorise la localisation pour ce site.", 2: "Pas de signal GPS pour l'instant.", 3: "Le GPS met du temps à répondre…" }[e.code] || e.message),
  { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
  garderEcran(); toast("Enregistrement du trajet lancé : garde la page ouverte."); majCarte();
}
async function envoyerTrajet(fini) {
  if (!trajet) return;
  if (trajet.pts.length < 4) return;
  trajet.envoi = Date.now();
  try {
    await db.collection("traces").doc(trajet.id).set({ nom: `Trajet de ${monPseudo() || "quelqu'un"}, ${quand(Date.parse(trajet.debut))}`, pts: trajet.pts,
      debut: trajet.debut, fin: new Date().toISOString(), par: S.moi, cree: Date.parse(trajet.debut), enDirect: !fini });
  } catch (e) { refus(e); }
}
async function arreterTrajet() {
  navigator.geolocation.clearWatch(suivi); suivi = null;
  await envoyerTrajet(true); const n = trajet ? trajet.pts.length / 2 : 0; trajet = null;
  if (verrou) { verrou.release().catch(() => {}); verrou = null; }
  toast(n > 1 ? `Trajet enregistré (${n} points)` : "Trajet trop court, rien d'enregistré"); majCarte();
}
const gpsBoutons = () => S.ecrire ? (suivi != null
  ? `<button class="btn rouge" data-gps="stop">■ Arrêter le trajet · ${trajet ? trajet.pts.length / 2 : 0} pts${maPos && maPos.prec ? " · ±" + maPos.prec + " m" : ""}</button>`
  : `<button class="btn jaune" data-gps="go">● Enregistrer mon trajet</button>`) + `<button class="btn" data-gps="ici">Où suis-je ?</button>` : "";
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-gps]"); if (!b) return;
  if (b.dataset.gps === "go") demarrerTrajet();
  else if (b.dataset.gps === "stop") arreterTrajet();
  else {
    const p = await positionActuelle(10000);
    if (!p) { toast("Position introuvable : autorise la localisation pour ce site."); return; }
    majCarte(); if (carte) carte.setView([p.lat, p.lon], Math.max(carte.getZoom(), 17));
  }
});
addEventListener("beforeunload", (e) => { if (suivi != null) { envoyerTrajet(false); e.preventDefault(); } });

/* ---------- appli installable ---------- */
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
let invite = null;
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); invite = e; $("#installer").hidden = false; });
$("#installer").addEventListener("click", async () => { if (!invite) return; invite.prompt(); await invite.userChoice; invite = null; $("#installer").hidden = true; });
addEventListener("appinstalled", () => { $("#installer").hidden = true; toast("Appli installée"); });

/* ---------- démarrage ---------- */
(async () => {
  try { const v = localStorage.getItem("vue"); if (v && VUES[v] && v !== "questionnaire") S.vue = v; } catch (e) {}
  if (S.seulQ) document.querySelector(".marque b").innerHTML = "Questionnaire <span>Atlas</span>";
  render();
  try {
    let { data: { session } } = await SB.auth.getSession();
    if (!session) {
      const r = await SB.auth.signInAnonymously();
      if (r.error) throw r.error;
      session = r.data.session;
    }
    S.moi = session.user.id;
    const { data: adh } = await SB.from("adherents").select("uid").eq("uid", S.moi).maybeSingle();
    if (!adh) await ecranEntree();
    db = dbSB; user = userSB; assets = assetsSB; S.identite = true;
    for (const col of [...COLS, "consignes", "sites"]) db.collection(col).onSnapshot((s) => { R[col] = s.docs.map((d) => ({ id: d.id, ...d.data() })); appliquerSite(); render(); });
    
    await charger();
    { const m = (R.membres || []).find((x) => x.id === S.moi); if (m && m.site && SITES[m.site] && m.site !== S.site) { S.site = m.site; try { localStorage.setItem("site", m.site); } catch (x) {} } else if (m && !m.site) db.collection("membres").doc(S.moi).update({ site: S.site }).catch(() => {}); appliquerSite(); }
    SB.channel("docs").on("postgres_changes", { event: "*", schema: "public", table: "docs" }, (p) => {
      const r = p.eventType === "DELETE" ? p.old : p.new; if (!r || !r.col) return;
      if (p.eventType === "DELETE") table(r.col).delete(r.id); else table(r.col).set(r.id, r.data);
      emettre(r.col);
    }).subscribe((st) => {
      etat(st === "SUBSCRIBED", st === "SUBSCRIBED" ? "En direct" : "Reconnexion…");
      if (st === "SUBSCRIBED" && charge) charger().catch(() => {});
    });
    info(); render();
  } catch (e) {
    console.error(e); db = null; info(); etat(false, "Hors connexion");
    $("#info").textContent = "Connexion impossible : " + (e.message || e.code || "erreur inconnue") + ". Recharge la page.";
  }
})();
