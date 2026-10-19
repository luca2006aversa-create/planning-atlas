// Fabrique site/index.html (version Supabase) à partir de ../planning.html (version claude.ai).
// Usage : node construire.js   — à relancer après chaque modification de planning.html.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "planning.html"), "utf8");
const finStyle = src.indexOf("</style>") + "</style>".length;
const debScript = src.indexOf("<script>"), finScript = src.lastIndexOf("</script>");
const tete = src.slice(0, finStyle), corps = src.slice(finStyle, debScript);
let js = src.slice(debScript + "<script>".length, finScript);

const remplacer = (avant, apres) => { if (!js.includes(avant)) throw new Error("introuvable : " + avant.slice(0, 60)); js = js.split(avant).join(apres); };
js = js.slice(0, js.lastIndexOf("\n(async()=>{"));                       // le démarrage claude.ai est remplacé par sb.js
js = js.replace(/\/_blob\/\$\{esc\(([^)]+)\)\}/g, "${esc(photoUrl($1))}");
remplacer('const LIEN_Q="https://claude.ai/artifact/JzRz1KLCw9AJzgs52L7Cro#questionnaire";', 'const LIEN_Q=location.origin+location.pathname+"#questionnaire";');
remplacer("async function lireExif(file){", "async function lireExifBrut(file){");
remplacer('${S.ecrire?`<span class="btn fichier">', '${gpsBoutons()}${S.ecrire?`<span class="btn fichier">');
remplacer('$("#marques").innerHTML=m;', 'm+=maPosMarque();$("#marques").innerHTML=m;');
remplacer("Position lue dans la photo", "Position trouvée");
remplacer("Les trajets viennent de fichiers GPX enregistrés sur le téléphone (OsmAnd, Strava, « Terrain » de SiteScope…). Les photos se placent seules sur la carte quand elles gardent leur position et leur direction.",
  "« Enregistrer mon trajet » suit ta position pendant la marche : garde la page ouverte, écran allumé. On peut aussi importer un fichier GPX. Les photos se placent seules sur la carte.");

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#17302a">
${tete}
<style>
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}img{max-width:100%}[hidden]{display:none!important}
.pin.ici{width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#2d6a9f;border:3px solid #fff;box-shadow:0 0 0 7px rgba(45,106,159,.25);pointer-events:none}
</style>
</head><body>
${corps}
<dialog id="entree"><form id="fEntree" style="display:grid;gap:14px;padding:22px">
  <h3>Planning Atlas</h3>
  <p class="qui" style="margin:0">Entre le code du groupe et ton prénom. Tu ne le feras qu'une fois sur cet appareil.</p>
  <div class="champ"><label for="e_code">Code du groupe</label><input id="e_code" type="password" autocomplete="off" required></div>
  <div class="champ"><label for="e_pseudo">Ton prénom ou identifiant</label><input id="e_pseudo" maxlength="30" autocomplete="nickname" required placeholder="ex. Luca"></div>
  <p id="e_msg" class="retard" style="margin:0"></p>
  <button class="btn jaune">Entrer</button>
</form></dialog>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script src="config.js"></script>
<script>${js}</script>
<script src="sb.js"></script>
</body></html>
`;
fs.writeFileSync(path.join(__dirname, "index.html"), html);
console.log("ok index.html", Math.round(html.length / 1024), "Ko");
