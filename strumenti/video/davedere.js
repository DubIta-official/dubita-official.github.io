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

(async () => {
  let t = 0; const voci = [];
  const scenes = T.scene.map((sc, i) => {
    let d;
    if (PROVA) d = sc.testo.length / 15;
    else { const f = path.join(AU, `s${i}.mp3`); sh("edge-tts", ["--voice", VOCE, "--rate=+6%", "--text", sc.testo, "--write-media", f]); d = durata(f); voci.push({f, inizio: t + .15}); }
    const dur = d + .45, o = {type: "talk", label: sc.label, title: sc.title, accent: sc.accent, widget: sc.widget, dur, sub: pezzi(sc.testo, d)};
    t += dur; return o;
  });
  const spec = {scenes, noMark: true}, base = path.basename(src, ".json");
  fs.writeFileSync(path.join(OUT, base + ".json"), JSON.stringify(spec, null, 1));
  if (PROVA) { let a = 0; const tempi = scenes.map(s => { const x = +(a + s.dur * .7).toFixed(2); a += s.dur; return x; });
    console.log(await foto(spec, tempi, path.join(OUT, base)), `durata stimata ${t.toFixed(1)} s`); return; }
  const muto = path.join(OUT, "muto.mp4"); await rendi(spec, muto);
  const filt = voci.map((v, i) => `[${i}:a]adelay=${Math.round(v.inizio * 1000)}|${Math.round(v.inizio * 1000)}[a${i}]`).join(";") + ";" + voci.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${voci.length}:normalize=0,apad[aout]`;
  sh("ffmpeg", ["-y", "-loglevel", "error", ...voci.flatMap(v => ["-i", v.f]), "-filter_complex", filt, "-map", "[aout]", "-t", String(t), "-ar", "44100", path.join(OUT, "voce.wav")]);
  sh("ffmpeg", ["-y", "-loglevel", "error", "-i", muto, "-i", path.join(OUT, "voce.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", path.join(OUT, base + ".mp4")]);
  fs.rmSync(muto); fs.rmSync(AU, {recursive: true, force: true}); fs.rmSync(path.join(OUT, "voce.wav"));
  fs.writeFileSync(path.join(OUT, base + ".txt"), `TESTO LETTO\n${T.scene.map(s => s.testo).join("\n")}\n\nDIDASCALIA\n${T.didascalia}\n`);
  console.log(`${base}.mp4 · ${t.toFixed(1)} s`);
})().catch(e => { console.error(e); process.exit(1); });
