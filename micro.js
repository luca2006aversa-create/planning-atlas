/* Dictée vocale : un bouton micro à côté des champs de réponse. Utilise la reconnaissance vocale du navigateur
   (Chrome, Edge, Safari récent) : vietnamien (vi-VN) ou français (fr-FR) selon la langue du questionnaire. */
const Reco = window.SpeechRecognition || window.webkitSpeechRecognition;
(() => {
  const st = document.createElement("style");
  st.textContent = `.dicter{position:relative;display:grid}.dicter textarea,.dicter input{padding-right:56px}
.micro{position:absolute;right:8px;top:8px;width:42px;height:42px;border-radius:50%;border:1px solid var(--line);background:var(--surface);color:var(--ink);display:grid;place-items:center;cursor:pointer;padding:0}
.dicter input+.micro{top:50%;transform:translateY(-50%);width:36px;height:36px}
.micro svg{width:20px;height:20px}
.micro[aria-pressed="true"]{background:#c43d2b;border-color:#c43d2b;color:#fff;animation:pulse 1.3s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 #c43d2b66}70%{box-shadow:0 0 0 12px #c43d2b00}100%{box-shadow:0 0 0 0 #c43d2b00}}
.dicte{font-size:.8rem;color:var(--muted)}`;
  document.head.appendChild(st);
})();
const MICRO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
/* HTML d'un champ avec micro : `champ` = le <textarea> ou <input> déjà écrit, `id` = son identifiant */
const avecMicro = (champ, id, label) => Reco ? `<div class="dicter">${champ}<button type="button" class="micro" data-micro="${id}" aria-pressed="false" aria-label="${label || "Dicter"}" title="${label || "Dicter"}">${MICRO_SVG}</button></div>` : champ;
const microNotifier = (t) => { if (typeof toast === "function") toast(t); else alert(t); };
let microActif = null;
const microBtn = (id) => document.querySelector('[data-micro="' + id + '"]');
const microBase = (c) => (c.value ? c.value.replace(/s+$/, "") + " " : "");
function microArreter() {
  if (!microActif) return;
  const m = microActif; microActif = null; m.voulu = false;
  try { m.rec.stop(); } catch (e) {}
  const b = microBtn(m.id); if (b) b.setAttribute("aria-pressed", "false");
}
function microDemarrer(bouton) {
  const id = bouton.dataset.micro, cible = () => document.getElementById(id); if (!cible()) return;
  if (!Reco) return microNotifier("La dictée n'est pas disponible sur ce navigateur : utilise Chrome ou Safari récent.");
  const lang = (typeof microLang === "function" ? microLang() : "fr") === "vi" ? "vi-VN" : "fr-FR";
  const m = { id, voulu: true, base: microBase(cible()) };
  const lancer = () => {
    const rec = new Reco(); m.rec = rec; rec.lang = lang; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => {
      let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      const c = cible(); if (!c) return; /* l'écran peut se redessiner pendant la dictée : on retrouve le champ par son identifiant */
      c.value = m.base + t.trim(); c.dispatchEvent(new Event("input", { bubbles: true }));
      const b = microBtn(id); if (b) b.setAttribute("aria-pressed", "true");
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { microNotifier("Micro refusé : autorise le micro pour ce site dans le navigateur."); microArreter(); }
      else if (e.error === "network") { microNotifier("La dictée a besoin d'internet."); microArreter(); }
      else if (e.error === "language-not-supported") { microNotifier("Cette langue n'est pas gérée par la dictée de ce téléphone."); microArreter(); }
    };
    rec.onend = () => {
      const c = cible();
      if (m.voulu && microActif === m && c) { m.base = microBase(c); try { lancer(); } catch (x) { microArreter(); } }
      else { const b = microBtn(id); if (b) b.setAttribute("aria-pressed", "false"); }
    };
    rec.start();
  };
  microArreter(); microActif = m; bouton.setAttribute("aria-pressed", "true");
  try { lancer(); } catch (e) { microArreter(); microNotifier("Impossible de lancer la dictée."); }
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-micro]"); if (!b) return;
  if (b.getAttribute("aria-pressed") === "true") microArreter(); else microDemarrer(b);
});
document.addEventListener("submit", microArreter, true);
