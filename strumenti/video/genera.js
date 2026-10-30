// Crea i video del giorno per TikTok a partire dall'archivio verificato (archivio.js), più le didascalie da copiare.
// Uso: node strumenti/video/genera.js [cartella di uscita] [data AAAA-MM-GG] [--prova] [--torneo] [--extra]
//   --prova: invece dei video salva solo alcuni fotogrammi PNG (veloce, per controllare la grafica).
//   --torneo: crea solo il video della prossima sfida del torneo (strumenti/video/torneo.json).
//   --extra: crea solo i due video extra: «Indovina l'anime dalla copertina» e «I più seguiti del momento».
//   --indovina=L-N: crea «Indovina l'anime», livello L (1 facile, 2 medio, 3 difficile), video N del livello (6 anime ciascuno, da indovina.json).
// Ogni giorno escono 3 video: il quiz «Il tuo anime è doppiato?», i doppiaggi in arrivo e le nuove uscite
// (episodi del giorno da AniList, anche non doppiati). La scelta dipende dalla data: rilanciando lo stesso giorno escono gli stessi video.
// Copertine e palinsesto arrivano dalla cartella anilist/ del ramo «copie» (li scarica l'Action ogni mattina).
const fs = require("fs"), path = require("path"), vm = require("vm");
const {rendi, foto} = require("./rendi.js");
const {chromium} = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const args = process.argv.slice(2).filter(a => !a.startsWith("--")), PROVA = process.argv.includes("--prova"), TORNEO = process.argv.includes("--torneo"), EXTRA = process.argv.includes("--extra");
const IND = (process.argv.find(a => a.startsWith("--indovina=")) || "").split("=")[1];
const OUT = path.resolve(args[0] || "video-oggi");
const OGGI = args[1] || new Date().toISOString().slice(0, 10);

/* ---------- dati ---------- */
const ctx = vm.createContext({});
vm.runInContext(`const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();`, ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "archivio.js"), "utf8") + ";this.DUBDB=DUBDB;this.SUB=STAGIONE_SUB;this.STAGIONE=STAGIONE;this.dubData=dubData;", ctx);

/* dati di AniList dal ramo «copie» (palinsesto e copertine); se mancano, i video escono senza copertine */
function anilist() {
  const dir = path.join(require("os").tmpdir(), "dubita-anilist");
  try {
    const {execSync} = require("child_process");
    execSync("git fetch -q origin copie", {cwd: ROOT, stdio: "ignore"});
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
    execSync(`git archive origin/copie anilist | tar -x -C "${dir}"`, {cwd: ROOT, stdio: "ignore"});
    return path.join(dir, "anilist");
  } catch { console.log("Dati AniList non disponibili: video senza copertine e senza nuove uscite."); return null; }
}
const AL = anilist();
const leggi = f => { try { return JSON.parse(fs.readFileSync(path.join(AL, f), "utf8")); } catch { return null; } };
const copertina = id => { const f = AL && id && path.join(AL, "copertine", id + ".jpg"); return f && fs.existsSync(f) ? f : ""; };
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
    {type: "hook", chip: "LA SFIDA · 3 ANIME", lines: ["IL TUO ANIME", "È DOPPIATO?"], accent: 1},
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

const GIORNI = ["DOMENICA", "LUNEDÌ", "MARTEDÌ", "MERCOLEDÌ", "GIOVEDÌ", "VENERDÌ", "SABATO"];
const PILL = {dub: ["ITA", "#2ee59d"], partial: ["ITA in corso", "#3ee0ff"], soon: ["ITA in arrivo", "#ffc53d"], sub: ["SUB ITA", "#ffffff"], none: ["no ITA", "#ff4d6a"], noann: ["no ITA", "#ff4d6a"]};
function uscite() {
  const pal = leggi("palinsesto.json"); if (!pal) return null;
  const romaGiorno = ts => new Date(ts * 1000).toLocaleDateString("sv-SE", {timeZone: "Europe/Rome"});
  let eps = pal.episodi.filter(e => romaGiorno(e.airingAt) === OGGI && ["TV", "TV_SHORT", "ONA"].includes(e.media.format));
  eps = [...new Map(eps.sort((a, b) => (b.media.popularity || 0) - (a.media.popularity || 0)).map(e => [e.media.id, e])).values()];
  const conCop = eps.filter(e => copertina(e.media.id)).slice(0, 6);
  if (conCop.length < 4) return null;
  const items = conCop.map(e => { const m = e.media, d = ctx.dubData(m), st = d ? d.st : "noann", [pl, col] = PILL[st] || PILL.noann;
    const n = (m.title.english || m.title.romaji).replace(/\s+/g, " ");
    return {n: n.length > 38 ? n.slice(0, 36).trim() + "…" : n, ep: `Episodio ${e.episode}${m.episodes === e.episode ? " · FINALE" : ""}`, img: copertina(m.id), pl, col, titolo: n, st}; });
  const gg = GIORNI[new Date(OGGI + "T12:00:00").getDay()], num = +OGGI.slice(8);
  return {nome: "nuove-uscite", scenes: [
    {type: "hook", chip: "NUOVI EPISODI", lines: ["ESCONO", "OGGI"], accent: 1},
    {type: "grid", label: "NUOVI EPISODI · " + gg + " " + num, title: "IN USCITA OGGI", color: "#3ee0ff", items},
    {type: "outro", lines: ["Quale guardi", "stasera?"], cta: "Doppiato o no? Controlla ogni anime sul sito"}],
    didascalia: `Nuovi episodi anime in uscita oggi, ${gg.toLowerCase()} ${num} 📺 Quale guardi stasera?\n${items.map(x => `• ${x.titolo} – ${x.ep}${x.st === "dub" || x.st === "partial" ? " (anche doppiato 🇮🇹)" : ""}`).join("\n")}\nDoppiato o solo sottotitolato? Lo trovi sul nostro sito, link in bio 🔗\n${BASE} #nuoviepisodi #animedelgiorno ${items.slice(0, 4).map(x => tag(x.titolo)).join(" ")}`};
}

/* ---------- torneo ---------- */
const ROUND = [["OTTAVI", 8], ["QUARTI", 4], ["SEMIFINALE", 2], ["FINALE", 1]];
function torneo() {
  const tf = path.join(__dirname, "torneo.json"), T = JSON.parse(fs.readFileSync(tf, "utf8"));
  const ids = leggi("torneo.json") || [], img = c => { const x = ids.find(i => i.corto === c); return x ? copertina(x.id) : ""; };
  const P = T.partecipanti.map(p => ({n: p.corto, img: img(p.corto)}));
  const V = T.vincitori.map(v => typeof v === "string" ? {n: v} : v);
  const slots = [P.map(p => ({...p}))], partite = [];
  let k = 0;
  for (let r = 0; r < 4; r++) { slots[r + 1] = [];
    for (let i = 0; i < ROUND[r][1]; i++) { const a = slots[r][2 * i], b = slots[r][2 * i + 1];
      partite.push({r, i, a, b});
      const v = V[k++];
      if (v && a && b) { if (![a.n, b.n].includes(v.n)) throw new Error(`torneo.json: «${v.n}» non gioca la sfida ${a.n} – ${b.n}`);
        const w = v.n === a.n ? a : b, l = w === a ? b : a; w.esito = "win"; l.esito = "lose"; slots[r + 1][i] = {n: w.n, img: w.img}; partite[partite.length - 1].v = v; }
      else slots[r + 1][i] = null; } }
  const fatte = V.length, prossima = partite[fatte], prec = fatte ? partite[fatte - 1] : null;
  const scenes = [];
  const cur = prossima ? [prossima.r, prossima.i] : null;
  const nSfida = prossima ? ROUND[prossima.r][1] - (partite.filter(x => x.r === prossima.r && !x.v).length) + 1 : 0;
  const label = prossima ? `${ROUND[prossima.r][0]} · SFIDA ${nSfida} DI ${ROUND[prossima.r][1]}` : "IL VINCITORE";
  if (!prec) scenes.push({type: "mosaic", chip: `${T.nome} · EDIZIONE ${T.edizione}`, imgs: P, lines: ["16 ANIME", "1 SOLO VINCITORE"], accent: 0, cta: "Decidete voi 👇"});
  else { const w = prec.a.esito === "win" ? prec.a : prec.b, l = w === prec.a ? prec.b : prec.a;
    scenes.push({type: "result", label: prossima ? "HA VINTO" : "CAMPIONE!", win: {n: w.n, img: w.img}, lose: {n: l.n, img: l.img}, perc: prec.v.perc}); }
  if (prossima) {
    const nomiTurno = {0: "OTTAVI DI FINALE", 1: "QUARTI DI FINALE", 2: "SEMIFINALI", 3: "FINALE"};
    const delTurno = partite.filter(x => x.r === prossima.r).map(x => ({a: x.a && {...x.a}, b: x.b && {...x.b}, cur: x === prossima}));
    scenes.push({type: "pairs", title: T.nome, label: nomiTurno[prossima.r], matches: delTurno});
    scenes.push({type: "vs", chip: label, a: {n: prossima.a.n, img: prossima.a.img, k: "1"}, b: {n: prossima.b.n, img: prossima.b.img, k: "2"}, cta: "COMMENTA 1 O 2 👇", dur: 5.4});
    scenes.push({type: "outro", lines: ["Chi passa", "il turno?"], cta: `Commenta 1 per ${prossima.a.n} · 2 per ${prossima.b.n}`});
  } else {
    scenes.push({type: "bracket", title: T.nome, label, slots, cur});
    scenes.push({type: "outro", lines: ["Il campione", "è deciso!"], cta: "Quale torneo facciamo adesso? Scrivilo nei commenti"});
  }
  const did = prossima
    ? `${T.nome} ⚔️ ${label.toLowerCase()}: ${prossima.a.n} contro ${prossima.b.n}!\nCommenta 1 per ${prossima.a.n} o 2 per ${prossima.b.n} 👇 Il più votato passa al turno successivo.\n${prec ? `Sfida precedente: ha vinto ${prec.v.n}${prec.v.perc ? " con il " + prec.v.perc : ""}.\n` : ""}${BASE} #torneoanime #animebattle ${tag(prossima.a.n)} ${tag(prossima.b.n)}`
    : `${T.nome}: il campione è ${prec.v.n}! 🏆 Quale torneo facciamo adesso? Scrivilo nei commenti\n${BASE} #torneoanime ${tag(prec.v.n)}`;
  const sondaggio = prossima ? `COME SI CONTANO I VOTI: conta i commenti con 1 e con 2 (o usa anche un sondaggio TikTok con le risposte ${prossima.a.n} / ${prossima.b.n}).\nPer il prossimo video scrivimi chi ha vinto, ed eventualmente la percentuale.` : "";
  return {nome: `torneo-sfida-${fatte + 1}`, scenes, didascalia: did + (sondaggio ? "\n\n" + sondaggio : "")};
}

/* ---------- extra: indovina dalla copertina ---------- */
const PILL_DUB = st => ({dub: ["DOPPIATO IN ITALIANO", "#2ee59d"], partial: ["DOPPIAGGIO ITA IN CORSO", "#3ee0ff"], soon: ["DOPPIAGGIO ITA IN ARRIVO", "#ffc53d"],
  sub: ["SOLO SOTTOTITOLATO", "#ffffff"], none: ["NON DOPPIATO", "#ff4d6a"]})[st];
function indovina(r) {
  const T = JSON.parse(fs.readFileSync(path.join(__dirname, "torneo.json"), "utf8")), ids = leggi("torneo.json") || [];
  const pool = T.partecipanti.map(p => { const x = ids.find(i => i.corto === p.corto); return x && copertina(x.id) ? {n: p.corto, img: copertina(x.id), romaji: x.titolo} : null; }).filter(Boolean);
  if (pool.length < 4) return null;
  const scelti = pesca(r, pool, 4);
  const origini = ["50% 30%", "40% 45%", "60% 35%", "50% 55%"];
  const scenes = [{type: "hook", chip: "QUIZ · 4 ANIME", lines: ["INDOVINA", "L'ANIME", "DALLA COPERTINA"], accent: 0},
    ...scelti.map((x, i) => { const d = ctx.dubData({id: "indovina-" + x.n, format: "TV", status: "FINISHED", title: {english: x.n, romaji: x.romaji}}), pl = d && PILL_DUB(d.st);
      return {type: "guess", num: `${i + 1}/4`, n: x.n, img: x.img, origin: origini[i], pill: pl ? {t: pl[0] + (d.p && ["dub", "partial", "soon"].includes(d.st) ? " · " + d.p.split(" · ")[0] : ""), col: pl[1]} : null}; }),
    {type: "outro", lines: ["Quanti ne hai", "indovinati?"], cta: "Scrivilo nei commenti · Il doppiaggio di ogni anime è sul sito"}];
  return {nome: "indovina-copertina", scenes,
    didascalia: `Riesci a indovinare l'anime dalla copertina? 🔍 Quanti ne hai presi su 4? Scrivilo nei commenti!\nE se ti chiedi se è doppiato in italiano, lo trovi sul nostro sito, link in bio 🔗\n${BASE} #quizanime #indovinalanime #animequiz`};
}

/* ---------- indovina l'anime a livelli (6 anime per video) ---------- */
function indovinaLivello(spec) {
  const [L, N] = spec.split("-").map(Number), cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "indovina.json"), "utf8"));
  const lv = cfg.livelli[L - 1]; if (!lv) throw new Error(`--indovina: il livello ${L} non esiste (1-${cfg.livelli.length})`);
  const scaricati = leggi("indovina.json") || [];
  const blocco = lv.anime.slice((N - 1) * 6, N * 6);
  if (blocco.length < 6) throw new Error(`--indovina: il livello ${L} ha solo ${Math.floor(lv.anime.length / 6)} video; aggiungi anime in indovina.json`);
  const scelti = blocco.map(p => { const x = scaricati.find(i => i.corto === p.corto && i.id); return {n: p.corto, img: x ? copertina(x.id) : "", x}; });
  const senza = scelti.filter(x => !x.img).map(x => x.n);
  if (senza.length) throw new Error("Copertine non ancora scaricate per: " + senza.join(", ") + ". Avvia l'Action «Copie per il giro» e riprova.");
  const origini = ["50% 30%", "40% 45%", "60% 35%", "50% 55%", "45% 40%", "55% 25%"];
  const succ = cfg.livelli[L] ? `Prossimo livello: ${cfg.livelli[L].nome}` : "Hai superato il livello più difficile!";
  const scenes = [{type: "hook", chip: `LIVELLO ${L} · ${lv.nome}`, lines: ["INDOVINA", "L'ANIME", "DALLA COPERTINA"], accent: 0, dur: 2.6},
    ...scelti.map((y, i) => { const d = ctx.dubData({id: `ind-${L}-${y.n}`, format: "TV", status: "FINISHED", title: {english: y.x.inglese || y.n, romaji: y.x.titolo}}), pl = d && PILL_DUB(d.st);
      return {type: "guess", num: `LIVELLO ${L} · ${i + 1}/6`, n: y.n, img: y.img, origin: origini[i], zoom: lv.zoom, blur: lv.blur, reveal: 2.6, dur: 4.4,
        pill: pl ? {t: pl[0] + (d.p && ["dub", "partial", "soon"].includes(d.st) ? " · " + d.p.split(" · ")[0] : ""), col: pl[1]} : null}; }),
    {type: "outro", lines: ["Quanti su 6?", `Livello ${L} ${L === 3 ? "superato?" : "superato?"}`], cta: `Scrivi il tuo punteggio nei commenti · ${succ}`}];
  return {nome: `indovina-livello${L}-${N}`, scenes,
    didascalia: `Indovina l'anime dalla copertina 🔍 LIVELLO ${L} · ${lv.nome.toLowerCase()} (${N}) — quanti ne indovini su 6? Scrivi il tuo punteggio nei commenti!\n${succ.replace("Prossimo livello", "Il prossimo livello")} 👀 Seguici per non perderlo.\nE se ti chiedi se è doppiato in italiano, lo trovi sul nostro sito, link in bio 🔗\n${BASE} #quizanime #indovinalanime #livello${L} #animequiz\n\nSOLUZIONI (non metterle nella didascalia): ${scelti.map((x, i) => `${i + 1}. ${x.n}`).join(" · ")}`};
}

/* ---------- extra: i più seguiti del momento ---------- */
function popolari() {
  const pal = leggi("palinsesto.json"); if (!pal) return null;
  const visti = new Map();
  for (const e of pal.episodi) if (["TV", "TV_SHORT", "ONA"].includes(e.media.format) && copertina(e.media.id) && !visti.has(e.media.id)) visti.set(e.media.id, e);
  const top = [...visti.values()].sort((a, b) => (b.media.popularity || 0) - (a.media.popularity || 0)).slice(0, 6);
  if (top.length < 4) return null;
  const items = top.map(e => { const m = e.media, d = ctx.dubData(m), st = d ? d.st : "noann", [pl, col] = PILL[st] || PILL.noann;
    const n = (m.title.english || m.title.romaji).replace(/\s+/g, " ");
    return {n: n.length > 38 ? n.slice(0, 36).trim() + "…" : n, ep: d && d.p && ["dub", "partial", "soon"].includes(st) ? d.p.split(" · ")[0] : "", img: copertina(m.id), pl, col, titolo: n, st}; });
  const ita = items.filter(x => ["dub", "partial"].includes(x.st)).length;
  return {nome: "piu-seguiti", scenes: [
    {type: "mosaic", chip: "IN ONDA ADESSO", imgs: items.map(x => ({n: x.n, img: x.img})), lines: [`I ${items.length} PIÙ SEGUITI`, "li puoi vedere", "in italiano?"], accent: 0, cta: "Scopriamolo 👇", dur: 3.2},
    {type: "grid", label: "I PIÙ SEGUITI DEL MOMENTO", title: "IN ITALIANO?", color: "#3ee0ff", items},
    {type: "outro", lines: [ita ? `${ita} su ${items.length}` : "Nessuno", ita === 1 ? "è doppiato" : "sono doppiati"], cta: "Quale vorresti doppiato? Scrivilo nei commenti"}],
    didascalia: `I ${items.length} anime più seguiti del momento: quali puoi vedere in italiano? 🇮🇹\n${items.map(x => `• ${x.titolo} – ${x.pl}${x.ep ? " (" + x.ep + ")" : ""}`).join("\n")}\nTutti i doppiaggi verificati sul nostro sito, link in bio 🔗\n${BASE} #animedelmomento ${items.slice(0, 4).map(x => tag(x.titolo)).join(" ")}`};
}

/* ---------- main ---------- */
(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const video = IND ? [indovinaLivello(IND)] : TORNEO ? [torneo()] : EXTRA ? [indovina(rng(OGGI + "i")), popolari()].filter(Boolean)
    : [quiz(rng(OGGI + "q")), lista(rng(OGGI + "l"), "arrivo"), uscite() || lista(rng(OGGI + "n"), ["solosub", "novita", "piattaforma"][giorno % 3])];   // senza AniList: a rotazione
  const b = await chromium.launch(), testi = [`Video DubITA del ${OGGI}\n`];
  for (const [i, v] of video.entries()) {
    const base = path.join(OUT, TORNEO || EXTRA || IND ? `${OGGI}_${v.nome}` : `${OGGI}_${i + 1}_${v.nome}`);
    fs.writeFileSync(base + ".json", JSON.stringify({scenes: v.scenes}, null, 1));
    if (PROVA) { const f = await foto({scenes: v.scenes}, [2, 4.5, 6.6, 8.9, 11.5, 15], base, {browser: b}); console.log(f.join("\n")); }
    else { const s = await rendi({scenes: v.scenes}, base + ".mp4", {browser: b}); console.log(`${base}.mp4 · ${s.toFixed(1)} s`); }
    testi.push(`— VIDEO ${i + 1}: ${path.basename(base)}.mp4\n${v.didascalia}\n`);
  }
  await b.close();
  fs.writeFileSync(path.join(OUT, `${OGGI}_${TORNEO ? "torneo_" : EXTRA ? "extra_" : IND ? `indovina${IND}_` : ""}didascalie.txt`), testi.join("\n"));
  if (senzaNome.size) console.log("Anime senza nome in nomi.json (esclusi dai video): " + [...senzaNome].join(", "));
})().catch(e => { console.error(e); process.exit(1); });
