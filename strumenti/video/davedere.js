// Video lunghi «#DaVedere» (oltre 1 minuto): un anime raccontato da una voce AI italiana, con grafica nostra e sottotitoli.
// Il testo di ogni video è in davedere/<nome>.json: {titolo, didascalia, scene: [{label, title, accent, widget, testo}]}.
// Uso: node davedere.js davedere/solo-leveling.json <cartella> [voce]   ·   --prova al posto della voce: solo fotogrammi, senza audio
// La voce è edge-tts (pip install edge-tts): gira nell'Action «Video DaVedere», che ha internet libero.
const fs = require("fs"), path = require("path"), {execFileSync} = require("child_process");
const {rendi, foto} = require("./rendi");

const [src, out = "davedere-out", voceArg] = process.argv.slice(2), PROVA = voceArg === "--prova", VOCE = PROVA ? null : voceArg || "it-IT-DiegoNeural";
const T = JSON.parse(fs.readFileSync(src, "utf8")), OUT = path.resolve(out), AU = path.join(OUT, "audio");
fs.mkdirSync(AU, {recursive: true});
const sh = (cmd, args) => execFileSync(cmd, args, {stdio: ["ignore", "pipe", "inherit"]}).toString();
const durata = f => parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));

// sottotitoli: gruppi di ~5 parole, tempi in proporzione alle lettere
function pezzi(testo, d, da = .15) {
  const w = testo.split(/\s+/), g = []; for (let i = 0; i < w.length; i += 5) g.push(w.slice(i, i + 5).join(" "));
  const tot = g.reduce((a, x) => a + x.length + 2, 0); let acc = da;
  return g.map(x => { const a = acc; acc += (x.length + 2) / tot * d; return {x, a, b: acc}; });
}

// immagini da AniList: {"a": "titolo anime"} = copertina (o {"id": 21}), {"c": "nome personaggio"} = personaggio
const IMG = path.join(OUT, "img"); let nImg = 0;
async function gql(query, variables) {
  for (let k = 0; k < 4; k++) {
    const r = await fetch("https://graphql.anilist.co", {method: "POST", headers: {"Content-Type": "application/json", Accept: "application/json", "User-Agent": "DubITA-video"}, body: JSON.stringify({query, variables})});
    if (r.status === 429) { await new Promise(z => setTimeout(z, 4000)); continue; }
    return (await r.json()).data;
  }
}
async function immagine(ref) {
  let url;
  if (ref.c) {   // "da": parte del titolo dell'anime, per i nomi comuni (es. Ray di The Promised Neverland)
    const d = await gql("query($s:String){Page(perPage:10){characters(search:$s,sort:FAVOURITES_DESC){image{large} media(perPage:5){nodes{title{romaji english}}}}}}", {s: ref.c});
    const cs = d?.Page?.characters || [], ok = c => !ref.da || c.media.nodes.some(m => JSON.stringify(m.title).toLowerCase().includes(ref.da.toLowerCase()));
    url = (cs.find(ok) || {}).image?.large; }
  else { const d = await gql("query($s:String,$id:Int){Page(perPage:1){media(search:$s,id:$id,type:ANIME,sort:POPULARITY_DESC){coverImage{extraLarge}}}}", ref.id ? {id: ref.id} : {s: ref.a}); url = d?.Page?.media?.[0]?.coverImage?.extraLarge; }
  if (!url) { console.error("immagine non trovata:", JSON.stringify(ref)); return null; }
  const f = path.join(IMG, `${++nImg}.jpg`); fs.writeFileSync(f, Buffer.from(await (await fetch(url)).arrayBuffer())); return f;
}

(async () => {
  let t = 0; const voci = [];
  if (!PROVA) fs.mkdirSync(IMG, {recursive: true});
  for (const sc of T.scene) if (sc.img) sc.imgs = PROVA ? [] : await Promise.all(sc.img.map(immagine));
  const scenes = T.scene.map((sc, i) => {
    let d;
    if (!sc.testo) d = sc.dur - .35;   // scena senza voce: dura quanto scritto nel testo
    else if (PROVA) d = sc.testo.length / 15;
    else { const f = path.join(AU, `s${i}.mp3`); sh("edge-tts", ["--voice", VOCE, (T.velocita || "--rate=+6%"), "--text", sc.testo, "--write-media", f]); d = durata(f); voci.push({f, inizio: t + .15}); }
    const {testo, img, ...resto} = sc, dur = d + .35, sub = testo ? pezzi(testo, d) : [];
    const o = {...resto, type: sc.type || (img ? "foto" : "talk"), imgs: sc.imgs, dur, sub};
    t += dur; return o;
  });
  if (t < 62) { scenes[scenes.length - 1].dur += 62 - t; t = 62; }   // la sfida chiede almeno un minuto: l'ultima scena resta un po' di più
  const spec = {scenes, noMark: true}, base = path.basename(src, ".json");
  fs.writeFileSync(path.join(OUT, base + ".json"), JSON.stringify(spec, null, 1));
  if (PROVA) { let a = 0; const tempi = scenes.map(s => { const x = +(a + s.dur * .7).toFixed(2); a += s.dur; return x; });
    console.log(await foto(spec, tempi, path.join(OUT, base)), `durata stimata ${t.toFixed(1)} s`); return; }
  const muto = path.join(OUT, "muto.mp4"); await rendi(spec, muto);
  if (!voci.length) {   // video senza voce: la musica la sceglie chi pubblica, dentro TikTok
    fs.renameSync(muto, path.join(OUT, base + ".mp4")); fs.rmSync(AU, {recursive: true, force: true}); fs.rmSync(IMG, {recursive: true, force: true});
    fs.writeFileSync(path.join(OUT, base + ".txt"), `DIDASCALIA\n${T.didascalia}\n`); console.log(`${base}.mp4 · ${t.toFixed(1)} s (senza voce)`); return;
  }
  const filt = voci.map((v, i) => `[${i}:a]adelay=${Math.round(v.inizio * 1000)}|${Math.round(v.inizio * 1000)}[a${i}]`).join(";") + ";" + voci.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${voci.length}:normalize=0,apad[aout]`;
  sh("ffmpeg", ["-y", "-loglevel", "error", ...voci.flatMap(v => ["-i", v.f]), "-filter_complex", filt, "-map", "[aout]", "-t", String(t), "-ar", "44100", path.join(OUT, "voce.wav")]);
  sh("ffmpeg", ["-y", "-loglevel", "error", "-i", muto, "-i", path.join(OUT, "voce.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", path.join(OUT, base + ".mp4")]);
  fs.rmSync(muto); fs.rmSync(AU, {recursive: true, force: true}); fs.rmSync(IMG, {recursive: true, force: true}); fs.rmSync(path.join(OUT, "voce.wav"));
  fs.writeFileSync(path.join(OUT, base + ".txt"), `TESTO LETTO\n${T.scene.map(s => s.testo || "").join("\n")}\n\nDIDASCALIA\n${T.didascalia}\n`);
  console.log(`${base}.mp4 · ${t.toFixed(1)} s`);
})().catch(e => { console.error(e); process.exit(1); });
