// Crea i video del giorno per TikTok a partire dall'archivio verificato (archivio.js), più le didascalie da copiare.
// Uso: node strumenti/video/genera.js [cartella di uscita] [data AAAA-MM-GG] [--prova]
//   --prova: invece dei video salva solo alcuni fotogrammi PNG (veloce, per controllare la grafica).
// Ogni giorno escono 3 video: un quiz «Doppiato o no?», una lista (a rotazione) e una scheda singola.
// La scelta dipende dalla data: rilanciando lo stesso giorno escono gli stessi video.
const fs = require("fs"), path = require("path"), vm = require("vm");
const {rendi, foto} = require("./rendi.js");
const {chromium} = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const args = process.argv.slice(2).filter(a => !a.startsWith("--")), PROVA = process.argv.includes("--prova");
const OUT = path.resolve(args[0] || "video-oggi");
const OGGI = args[1] || new Date().toISOString().slice(0, 10);

/* ---------- dati ---------- */
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(ROOT, "archivio.js"), "utf8") + ";this.DUBDB=DUBDB;this.SUB=STAGIONE_SUB;this.STAGIONE=STAGIONE;", ctx);
const NOMI = JSON.parse(fs.readFileSync(path.join(__dirname, "nomi.json"), "utf8"));
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const senzaNome = new Set();
const nome = k => { if (NOMI[k]) return NOMI[k]; senzaNome.add(k); return null; };
const stagione = e => !e.s ? "" : e.s.length === 1 ? `${e.s[0]}ª stagione` : `Stagioni ${Math.min(...e.s)}-${Math.max(...e.s)}`;
const dataDa = n => { const m = (n || "").match(/dal(?:l')?\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?/i);
  if (!m) return null; const mi = MESI.indexOf(m[2].toLowerCase());
  return {g: +m[1], m: mi, a: m[3] ? +m[3] : null, lunga: `dal ${m[1]} ${m[2]}${m[3] ? " " + m[3] : ""}`, corta: `dal ${m[1]} ${m[2].slice(0, 3)}`}; };

const DUB = ctx.DUBDB.map(e => ({e, id: e.k[0], titolo: nome(e.k[0]), sub: stagione(e), st: e.st, p: e.p, data: dataDa(e.n)}))
  .filter(x => x.titolo && ["dub", "partial", "soon", "sub", "none"].includes(x.st));
const SOLO_SUB = ctx.SUB.map(([k, p]) => ({id: k[0], titolo: nome(k[0]), sub: "", st: "sub", p})).filter(x => x.titolo);

/* ---------- caso deterministico dalla data ---------- */
function rng(seed) { let h = 1779033703 ^ seed.length; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 3432918353), h = h << 13 | h >>> 19;
  return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
const pesca = (r, arr, n) => { const a = [...arr], o = []; while (o.length < n && a.length) o.push(a.splice(Math.floor(r() * a.length), 1)[0]); return o; };
const giorno = Math.floor(Date.parse(OGGI + "T12:00:00Z") / 864e5);

/* ---------- verdetti ---------- */
function verdetto(x) {
  const piatt = x.p ? [x.p] : [];
  if (x.st === "dub") return {verdict: "SÌ", tone: "yes", info: [...piatt, ...(x.data ? [x.data.lunga] : [])]};
  if (x.st === "partial") return {verdict: "SÌ", tone: "partial", info: [...piatt, "Doppiaggio in corso"]};
  if (x.st === "soon") return {verdict: "IN ARRIVO", tone: "soon", info: [...piatt, x.data ? "Annunciato " + x.data.lunga : "Doppiaggio annunciato"]};
  if (x.st === "sub") return {verdict: "NO", tone: "no", info: ["Solo sottotitolato", ...piatt]};
  return {verdict: "NO", tone: "no", info: ["Nessun doppiaggio"]};
}
const PIATT = {"Netflix": ["NETFLIX", "#ff3b4a", "#netflix"], "Crunchyroll": ["CRUNCHYROLL", "#ff8a1f", "#crunchyroll"],
  "Prime Video": ["PRIME VIDEO", "#2fb4ff", "#primevideo"], "Disney+": ["DISNEY+", "#5b7bff", "#disneyplus"]};
const tag = s => "#" + s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
const BASE = "#anime #animeita #doppiaggioitaliano #doppiaggio #animetiktok #perte";
const outro = {type: "outro"};

/* ---------- formati ---------- */
function quiz(r) {
  const si = DUB.filter(x => ["dub", "partial"].includes(x.st)), no = [...SOLO_SUB, ...DUB.filter(x => ["sub", "none"].includes(x.st))];
  const scelti = pesca(r, [...pesca(r, si, 2), ...pesca(r, no, 1)], 3);   // mescolati: almeno un sì e un no
  return {nome: "quiz", scenes: [
    {type: "hook", chip: "QUIZ ANIME", lines: ["DOPPIATO", "O NO?"], accent: 1},
    ...scelti.map((x, i) => ({type: "quiz", n: `${i + 1}/3`, title: x.titolo, sub: x.sub, ...verdetto(x)})),
    {type: "outro", lines: ["Quante ne hai", "indovinate?"], cta: "Scrivilo nei commenti · Cerca il tuo anime sul sito"}],
    didascalia: `Doppiato in italiano o no? 👀 Quante ne hai indovinate su 3? Scrivilo nei commenti!\n${scelti.map(x => `• ${x.titolo}${x.sub ? " (" + x.sub + ")" : ""}`).join("\n")}\nCerca qualsiasi anime sul nostro sito, link in bio 🔗\n${BASE} #quiz ${scelti.map(x => tag(x.titolo)).join(" ")}`};
}
function scheda(r) {
  const pool = DUB.filter(x => ["dub", "partial", "soon"].includes(x.st)), x = pesca(r, pool, 1)[0];
  return {nome: "scheda", scenes: [
    {type: "hook", chip: "LO SAPEVI?", lines: ["È DOPPIATO", "IN ITALIANO?"], accent: 1},
    {type: "quiz", title: x.titolo, sub: x.sub, ...verdetto(x), dur: 5},
    {type: "outro", lines: ["E il tuo anime", "preferito?"], cta: "Cercalo sul sito · Seguici per i nuovi doppiaggi"}],
    didascalia: `${x.titolo}${x.sub ? " (" + x.sub + ")" : ""} è doppiato in italiano? Ecco la risposta 🎙️\nVuoi sapere di un altro anime? Scrivilo nei commenti o cercalo sul sito, link in bio 🔗\n${BASE} ${tag(x.titolo)}${PIATT[x.p] ? " " + PIATT[x.p][2] : ""}`};
}
function lista(r, quale) {
  if (quale === "piattaforma") {
    const ok = Object.keys(PIATT).filter(p => DUB.filter(x => x.p === p && x.st === "dub").length >= 3);
    const p = ok[giorno % ok.length], [nomeP, colore, ht] = PIATT[p];
    const items = pesca(r, DUB.filter(x => x.p === p && x.st === "dub"), 5);
    return {nome: "lista-" + tag(p).slice(1), scenes: [
      {type: "hook", chip: "DA VEDERE IN ITALIANO", lines: [`${items.length} ANIME DOPPIATI`, "SU", nomeP], accent: 2},
      {type: "list", label: "DOPPIATI IN ITALIANO SU", title: nomeP, color: colore, items: items.map(x => [x.titolo + (x.sub ? " – " + x.sub : ""), x.data ? x.data.corta : ""])},
      outro],
      didascalia: `${items.length} anime doppiati in italiano da vedere su ${p} 🇮🇹 Quale manca? Scrivilo nei commenti!\nTutti i doppiaggi sul nostro sito, link in bio 🔗\n${BASE} ${ht} ${items.map(x => tag(x.titolo)).join(" ")}`};
  }
  if (quale === "solosub") {
    const items = pesca(r, SOLO_SUB, 5);
    return {nome: "lista-solo-sub", scenes: [
      {type: "hook", chip: ctx.STAGIONE.nome.toUpperCase().replace("L'", ""), lines: ["QUESTI ANIME", "NON HANNO", "IL DOPPIAGGIO"], accent: 2},
      {type: "list", label: "PER ORA SOLO", title: "SOTTOTITOLATI", color: "#ff4d6a", items: items.map(x => [x.titolo, x.p.split(" · ")[0]])},
      {type: "outro", lines: ["Quale vorresti", "doppiato?"], cta: "Scrivilo nei commenti · Il sito si aggiorna ogni giorno"}],
      didascalia: `Questi anime di ${ctx.STAGIONE.nome} per ora sono solo sottotitolati 😢 Quale vorresti doppiato in italiano?\nSe arriva un annuncio, lo trovi subito sul nostro sito, link in bio 🔗\n${BASE} #sottotitoli ${items.map(x => tag(x.titolo)).join(" ")}`};
  }
  if (quale === "arrivo") {
    const items = pesca(r, DUB.filter(x => x.st === "soon"), 5);
    if (items.length < 2) return lista(r, "piattaforma");
    return {nome: "lista-in-arrivo", scenes: [
      {type: "hook", chip: "ANNUNCIATI", lines: ["DOPPIAGGI", "IN ARRIVO"], accent: 1},
      {type: "list", label: "PRESTO IN ITALIANO", title: "IN ARRIVO", color: "#ffc53d", items: items.map(x => [x.titolo + (x.sub ? " – " + x.sub : ""), x.p.split(" · ")[0]])},
      outro],
      didascalia: `Doppiaggi italiani annunciati e in arrivo 🎙️ Quale aspetti di più?\nDate e piattaforme aggiornate sul nostro sito, link in bio 🔗\n${BASE} #novita ${items.map(x => tag(x.titolo)).join(" ")}`};
  }
  // novità: doppiaggi con data, i più recenti
  const items = DUB.filter(x => ["dub", "partial"].includes(x.st) && x.data && x.data.a)
    .sort((a, b) => (b.data.a - a.data.a) || (b.data.m - a.data.m) || (b.data.g - a.data.g)).slice(0, 5);
  if (items.length < 3) return lista(r, "piattaforma");
  return {nome: "lista-novita", scenes: [
    {type: "hook", chip: "APPENA USCITI", lines: ["ORA PARLANO", "ITALIANO"], accent: 1},
    {type: "list", label: "GLI ULTIMI", title: "DOPPIAGGI", color: "#2ee59d", items: items.map(x => [x.titolo + (x.sub ? " – " + x.sub : ""), x.data.corta])},
    outro],
    didascalia: `Gli ultimi anime usciti doppiati in italiano 🇮🇹 Li hai già visti?\nTutte le date e le piattaforme sul nostro sito, link in bio 🔗\n${BASE} #novita ${items.map(x => tag(x.titolo)).join(" ")}`};
}

/* ---------- main ---------- */
(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const LISTE = ["piattaforma", "solosub", "novita", "piattaforma", "arrivo"];
  const video = [quiz(rng(OGGI + "q")), lista(rng(OGGI + "l"), LISTE[giorno % LISTE.length]), scheda(rng(OGGI + "s"))];
  const b = await chromium.launch(), testi = [`Video DubITA del ${OGGI}\n`];
  for (const [i, v] of video.entries()) {
    const base = path.join(OUT, `${OGGI}_${i + 1}_${v.nome}`);
    fs.writeFileSync(base + ".json", JSON.stringify({scenes: v.scenes}, null, 1));
    if (PROVA) { const f = await foto({scenes: v.scenes}, [2, 4.5, 6.6, 8.9, 11.5, 15], base, {browser: b}); console.log(f.join("\n")); }
    else { const s = await rendi({scenes: v.scenes}, base + ".mp4", {browser: b}); console.log(`${base}.mp4 · ${s.toFixed(1)} s`); }
    testi.push(`— VIDEO ${i + 1}: ${path.basename(base)}.mp4\n${v.didascalia}\n`);
  }
  await b.close();
  fs.writeFileSync(path.join(OUT, `${OGGI}_didascalie.txt`), testi.join("\n"));
  if (senzaNome.size) console.log("Anime senza nome in nomi.json (esclusi dai video): " + [...senzaNome].join(", "));
})().catch(e => { console.error(e); process.exit(1); });
