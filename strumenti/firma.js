// Firma invisibile di DubITA nelle trame tradotte: node strumenti/firma.js
// Inserisce nel testo di ogni trama di TRAME (in archivio.js) una sequenza di caratteri invisibili che codifica "DubITA".
// Sul sito non si vede, ma resta nel testo se qualcuno copia le trame: serve a dimostrare che vengono da qui.
// Si può eseguire più volte: le trame già firmate non vengono toccate. Per controllare: node strumenti/firma.js --verifica
// Per cercare la firma in un testo copiato altrove (salvato in un file): node strumenti/firma.js --cerca file.txt
const fs = require("fs"), path = require("path");
const file = path.join(__dirname, "..", "archivio.js");
const FIRMA = "⁠" + [..."DubITA"].map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join("")
  .replace(/0/g, "​").replace(/1/g, "‌") + "⁠";
const ci = process.argv.indexOf("--cerca");
if (ci > 0) {
  const t = fs.readFileSync(process.argv[ci + 1], "utf8"), n = t.split(FIRMA).length - 1;
  console.log(n ? `Firma di DubITA trovata ${n} volte: il testo viene da DubITA.` : "Firma di DubITA non trovata.");
  process.exit(n ? 0 : 1);
}
const src = fs.readFileSync(file, "utf8");
const start = src.indexOf("const TRAME = ["), end = src.indexOf("];", start);
if (start < 0 || end < 0) { console.error("TRAME non trovato in archivio.js"); process.exit(1); }
let firmate = 0, nuove = 0;
const block = src.slice(start, end).replace(/(\bt: ")((?:[^"\\]|\\.)*)(")/g, (all, a, t, b) => {
  if (t.includes(FIRMA)) { firmate++; return all; }
  nuove++;
  const i = t.indexOf(". ");                 // dopo la prima frase, così non sta né all'inizio né alla fine
  return a + (i > 0 ? t.slice(0, i + 1) + FIRMA + t.slice(i + 1) : t + FIRMA) + b;
});
if (process.argv.includes("--verifica")) {
  console.log(nuove ? `${nuove} trame senza firma (esegui node strumenti/firma.js)` : `Tutte le ${firmate} trame sono firmate`);
  process.exit(nuove ? 1 : 0);
}
if (nuove) fs.writeFileSync(file, src.slice(0, start) + block + src.slice(end));
console.log(`Firma aggiunta a ${nuove} trame, ${firmate} erano già firmate.`);
