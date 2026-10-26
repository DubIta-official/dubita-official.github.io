// Controllo di archivio.js prima di pubblicare: node strumenti/controlla.js
// Esce con errore se il file non si carica o se una voce è scritta male; poi stampa alcuni esempi.
const fs = require("fs"), vm = require("vm"), path = require("path");
const file = path.join(__dirname, "..", "archivio.js");
const ctx = vm.createContext({console});
vm.runInContext(`const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();`, ctx);
try { vm.runInContext(fs.readFileSync(file, "utf8"), ctx, {filename: "archivio.js"}); }
catch (e) { console.error("ERRORE: archivio.js non si carica:\n" + e.stack); process.exit(1); }

const errors = [];
const get = expr => vm.runInContext(expr, ctx);
const DUBDB = get("DUBDB"), STAGIONE = get("STAGIONE"), STAGIONE_SUB = get("STAGIONE_SUB"), TRAME = get("TRAME"), DUB_CHECKED = get("DUB_CHECKED");
const ST = ["dub", "partial", "soon", "sub", "none"];
const isNorm = k => typeof k === "string" && k === get(`norm(${JSON.stringify(k)})`) && k.length > 1;

if (!/^\d{1,2} (gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre) \d{4}$/.test(DUB_CHECKED)) errors.push(`DUB_CHECKED scritto male: "${DUB_CHECKED}" (formato: "25 ottobre 2026")`);
if (!["WINTER", "SPRING", "SUMMER", "FALL"].includes(STAGIONE.season) || !(STAGIONE.year > 2020)) errors.push("STAGIONE: season o year non validi");
for (const f of ["panoramica", "listone"]) if (!/^https:\/\//.test(STAGIONE[f] || "")) errors.push(`STAGIONE.${f}: serve un link https`);
DUBDB.forEach((e, i) => {
  const where = `DUBDB[${i}] (${(e.k || [])[0]})`;
  if (!Array.isArray(e.k) || !e.k.length) errors.push(`${where}: manca k`);
  else e.k.forEach(k => { if (!isNorm(k)) errors.push(`${where}: la chiave "${k}" non è normalizzata (minuscole, senza punteggiatura)`); });
  if (!ST.includes(e.st)) errors.push(`${where}: st deve essere uno di ${ST.join(", ")}`);
  if (typeof e.n !== "string" || !e.n.trim()) errors.push(`${where}: manca la nota n`);
  if (!/^https:\/\//.test(e.src || "")) errors.push(`${where}: manca la fonte src (link https)`);
  if (e.v !== undefined && !/^\d{1,2} (gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre) \d{4}$/.test(e.v)) errors.push(`${where}: v scritto male: "${e.v}" (formato: "26 ottobre 2026")`);
  for (const f of ["s", "pt"]) if (e[f] !== undefined && !(Array.isArray(e[f]) && e[f].every(Number.isInteger))) errors.push(`${where}: ${f} deve essere un elenco di numeri`);
});
STAGIONE_SUB.forEach(([ks, p], i) => {
  if (!Array.isArray(ks) || !ks.every(isNorm)) errors.push(`STAGIONE_SUB[${i}]: chiavi non normalizzate`);
  if (typeof p !== "string" || !p) errors.push(`STAGIONE_SUB[${i}]: manca la piattaforma`);
});
TRAME.forEach((t, i) => { if (!Array.isArray(t.k) || typeof t.t !== "string" || t.t.length < 40) errors.push(`TRAME[${i}]: voce incompleta`); });

if (errors.length) { console.error("ERRORI in archivio.js:\n- " + errors.join("\n- ")); process.exit(1); }

const sample = [
  ["Rent-a-Girlfriend", "Kanojo, Okarishimasu", 2020, "FINISHED"],
  ["Rent-a-Girlfriend Season 5", "Kanojo, Okarishimasu 5th Season", 2026, "FINISHED"],
  ["Black Clover Season 2", "Black Clover (2026)", 2026, "RELEASING"],
  ["JUJUTSU KAISEN Season 2", "Jujutsu Kaisen 2nd Season", 2023, "FINISHED"],
  ["Frieren: Beyond Journey's End", "Sousou no Frieren", 2023, "FINISHED"]
];
console.log(`OK · ${DUBDB.length} voci, ${STAGIONE_SUB.length} anime della stagione, ${TRAME.length} trame · verificato il ${DUB_CHECKED} · stagione ${STAGIONE.season} ${STAGIONE.year}`);
for (const [en, ro, y, st] of sample) {
  const m = {id: Math.random(), format: "TV", status: st, season: "", seasonYear: y, title: {english: en, romaji: ro}};
  const e = get("matchEntry")(DUBDB, m);
  console.log(`  ${en.padEnd(34)} → ${e ? e.st + (e.p ? " · " + e.p : "") : "non in archivio"}`);
}
