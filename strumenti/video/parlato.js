// Video parlato «DubITA ti consiglia un anime»: apre il sito vero su un telefono simulato, scorre la home,
// va su Consigli, tocca «Consigliami un anime» (solo doppiati) e una voce AI italiana racconta l'anime uscito.
// Gira nell'Action «Video parlato» (serve internet libero: sito, AniList, voce). Uso: node parlato.js <cartella> [voce]
// Voce: edge-tts (pip install edge-tts). Uscita: parlato.mp4 + parlato.txt (testo letto e didascalia).
const fs = require("fs"), path = require("path"), {execFileSync} = require("child_process");
const {chromium, devices} = require("playwright");

const OUT = path.resolve(process.argv[2] || "parlato"), VOCE = process.argv[3] || "it-IT-DiegoNeural";
const SITO = "https://dubita-official.github.io/";
const FPS = 30, FR = path.join(OUT, "frames"), AU = path.join(OUT, "audio");
fs.rmSync(OUT, {recursive: true, force: true}); [OUT, FR, AU].forEach(d => fs.mkdirSync(d, {recursive: true}));

const sh = (cmd, args) => execFileSync(cmd, args, {stdio: ["ignore", "pipe", "inherit"]}).toString();
const durata = f => parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));
let nAudio = 0;
function voce(testo) {   // ritorna {f, d}
  const f = path.join(AU, `s${++nAudio}.mp3`);
  sh("edge-tts", ["--voice", VOCE, "--rate=+12%", "--text", testo, "--write-media", f]);
  return {f, d: durata(f), testo};
}
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({...devices["Pixel 7"], viewport: {width: 360, height: 640}, deviceScaleFactor: 3, locale: "it-IT", timezoneId: "Europe/Rome"});
  const page = await ctx.newPage();
  await page.goto(SITO, {waitUntil: "networkidle"});
  await page.waitForTimeout(2500);

  // livello sopra il sito: titolo d'apertura, sottotitoli e dito che tocca
  await page.addStyleTag({content: `html{scroll-behavior:auto!important}
    #vx-hook{position:fixed;left:14px;right:14px;top:70px;z-index:99999;text-align:center;font:900 38px/1.05 Inter,system-ui,sans-serif;color:#fff;
      padding:18px 12px;border-radius:22px;background:rgba(11,8,32,.86);box-shadow:0 10px 40px rgba(0,0,0,.5);letter-spacing:-.02em}
    #vx-hook b{background:linear-gradient(90deg,#ff4fa3,#b44dff,#4d8bff);-webkit-background-clip:text;background-clip:text;color:transparent}
    #vx-sub{position:fixed;left:14px;right:14px;bottom:96px;z-index:99999;text-align:center;font:900 25px/1.15 Inter,system-ui,sans-serif;color:#fff;
      padding:12px 14px;border-radius:18px;background:rgba(11,8,32,.88);border:2px solid rgba(255,255,255,.15)}
    #vx-sub:empty{display:none}
    #vx-dito{position:fixed;z-index:100000;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.55);
      border:3px solid #fff;box-shadow:0 0 0 0 rgba(255,79,163,.7);pointer-events:none;opacity:0}`});
  await page.evaluate(() => { for (const id of ["vx-hook", "vx-sub", "vx-dito"]) { const d = document.createElement("div"); d.id = id; document.body.appendChild(d); } });
  const ov = (o) => page.evaluate(o => {
    const h = document.getElementById("vx-hook"), s = document.getElementById("vx-sub"), d = document.getElementById("vx-dito");
    h.style.display = o.hook ? "block" : "none"; if (o.hook) h.innerHTML = o.hook;
    s.textContent = o.sub || "";
    if (o.dito) { d.style.left = o.dito.x + "px"; d.style.top = o.dito.y + "px"; d.style.opacity = o.dito.o; d.style.transform = `scale(${o.dito.s})`;
      d.style.boxShadow = `0 0 0 ${o.dito.r}px rgba(255,79,163,${.7 * (1 - o.dito.r / 40)})`; } else d.style.opacity = 0;
    if (o.y != null) window.scrollTo(0, o.y);
  }, o);

  let frame = 0;
  const shot = async () => { await page.screenshot({path: path.join(FR, String(frame++).padStart(5, "0") + ".jpg"), type: "jpeg", quality: 88}); };
  const segs = [];   // {f, d, inizio}
  let t = 0;
  // sottotitoli: il testo diviso a gruppi di ~4 parole, tempi in proporzione alle lettere
  const pezzi = (testo, d) => { const w = testo.split(/\s+/), g = []; for (let i = 0; i < w.length; i += 4) g.push(w.slice(i, i + 4).join(" "));
    const tot = g.reduce((a, x) => a + x.length + 2, 0); let acc = 0; return g.map(x => { const a = acc; acc += (x.length + 2) / tot * d; return {x, a, b: acc}; }); };
  const subAt = (seg, lt) => { if (!seg || lt < 0 || lt > seg.d + .15) return ""; const p = seg.pz.find(p => lt < p.b) || seg.pz[seg.pz.length - 1]; return p.x; };
  const fase = async (seg, extra, drawFn) => {   // registra la fase per la durata della voce + extra
    seg.inizio = t; seg.pz = pezzi(seg.testo, seg.d); segs.push(seg);
    const n = Math.round((seg.d + extra) * FPS);
    for (let i = 0; i < n; i++) { const lt = i / FPS; await drawFn(lt, (seg.d + extra), i, n); await shot(); }
    t += n / FPS;
  };
  const box = async sel => { const b = await page.locator(sel).first().boundingBox(); return {x: b.x + b.width / 2, y: b.y + b.height / 2}; };
  const dito = (p, k) => ({x: p.x, y: p.y, o: k < 0 ? 0 : k < .15 ? k / .15 : k > .85 ? (1 - k) / .15 : 1, s: k > .35 && k < .55 ? .82 : 1, r: k > .45 ? Math.min(40, (k - .45) * 120) : 0});

  // 1. apertura: home che scorre
  const s1 = voce("Non sai che anime guardare? Chiedilo a DubITA.");
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await fase(s1, .2, (lt, D) => ov({hook: "NON SAI CHE <b>ANIME</b><br>GUARDARE?", sub: subAt(s1, lt - .1), y: Math.min(maxY, 900) * ease(clamp(lt / D))}));

  // 2. Consigli → «Consigliami un anime», solo doppiati in italiano
  const s2 = voce("Tocca Consigli, e poi: Consigliami un anime.");
  await page.evaluate(() => { rndOnlyDub = true; document.getElementById("rndDub").setAttribute("aria-pressed", "true"); });
  const pNav = await box('nav button[data-view="tips"]');
  let pBtn = null, cliccato = false, aperto = false;
  await fase(s2, .5, async (lt, D) => {
    const k = lt / D;
    if (k < .5) { const kd = clamp((k - .05) / .4); if (kd >= .45 && !aperto) { aperto = true; await page.click('nav button[data-view="tips"]'); await page.waitForTimeout(300); await page.evaluate(() => scrollTo(0, 0)); pBtn = await box("#rnd"); }
      return ov({sub: subAt(s2, lt), dito: dito(pNav, kd)}); }
    const kd = clamp((k - .5) / .45);
    if (kd >= .45 && !cliccato) { cliccato = true; await page.click("#rnd");
      await page.waitForSelector("#rcard .rcard", {timeout: 30000});
      await page.waitForFunction(() => { const d = document.querySelector("#rplot .desc"), i = document.querySelector("#rcard img");
        return i && i.complete && d && !/Traduco/.test(document.getElementById("rplot").textContent); }, null, {timeout: 40000}).catch(() => {});
      await page.waitForTimeout(500); }
    return ov({sub: subAt(s2, lt), dito: dito(pBtn, kd)});
  });

  // 3. l'anime consigliato
  const m = await page.evaluate(() => {
    const id = +document.querySelector("#rcard [data-open]").dataset.open, m = mediaCache.get(id), e = dubData(m);
    return {titolo: title(m), generi: (m.genres || []).slice(0, 3).map(g => GENRE_IT[g] || g), ep: m.format !== "MOVIE" ? m.episodes : null, film: m.format === "MOVIE",
      anno: m.seasonYear, voto: m.averageScore, st: e && e.st, p: e && e.p, trama: (document.querySelector("#rplot .desc") || {}).textContent || ""};
  });
  const frasi = []; for (const f of m.trama.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+/g) || []) { if (frasi.length && (frasi.join(" ") + f).length > 150) break; frasi.push(f.trim()); }   // le prime frasi, in ordine
  const generi = m.generi.length > 1 ? m.generi.slice(0, -1).join(", ") + " e " + m.generi[m.generi.length - 1] : m.generi[0] || "";
  const piatt = (m.p || "").split(/\s*[·/]\s*/).filter(Boolean).join(" e ");
  // a voce niente Crunchyroll (la voce non lo pronuncia bene): la piattaforma si vede comunque sulla scheda del sito
  const dette = (m.p || "").split(/\s*[·/]\s*/).filter(p => p && !/crunchyroll/i.test(p)).join(" e ");
  const testo3 = [`Oggi ti consiglio: ${m.titolo}.`,
    `${generi}${m.voto ? `, con un voto di ${m.voto} su 100` : ""}.`,
    frasi.join(" "),
    m.st === "partial" ? `E il doppiaggio italiano è in arrivo${dette ? " su " + dette : ""}!` : `E la cosa migliore: è doppiato in italiano${dette ? ", su " + dette : ""}!`].filter(Boolean).join(" ");
  const s3 = voce(testo3);
  const cardY = await page.evaluate(() => { const c = document.querySelector("#rcard .rcard").getBoundingClientRect(); return {top: c.top + scrollY, h: c.height}; });
  const y0 = Math.max(0, cardY.top - 70), y1 = Math.max(y0, Math.min(cardY.top + cardY.h - 640 + 200, y0 + 520));
  await fase(s3, .25, (lt, D) => ov({sub: subAt(s3, lt), y: y0 + (y1 - y0) * ease(clamp((lt - 1.2) / (D - 2)))}));

  // 4. chiusura
  const s4 = voce("Link in bio. Seguici per un consiglio ogni giorno!");
  await fase(s4, .8, (lt, D) => ov({hook: "DubITA<br><b>link in bio</b>", sub: subAt(s4, lt), y: y1 + (y0 - y1) * ease(clamp(lt / 1.2))}));
  await browser.close();

  // audio: ogni voce al suo inizio, poi video + audio
  const filt = segs.map((s, i) => `[${i}:a]adelay=${Math.round((s.inizio + .1) * 1000)}|${Math.round((s.inizio + .1) * 1000)}[a${i}]`).join(";") + ";" + segs.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${segs.length}:normalize=0,apad[aout]`;
  sh("ffmpeg", ["-y", "-loglevel", "error", ...segs.flatMap(s => ["-i", s.f]), "-filter_complex", filt, "-map", "[aout]", "-t", String(t), "-ar", "44100", path.join(OUT, "voce.wav")]);
  sh("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(FR, "%05d.jpg"), "-i", path.join(OUT, "voce.wav"),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", path.join(OUT, "parlato.mp4")]);
  fs.rmSync(FR, {recursive: true, force: true});
  const tag = s => "#" + s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
  fs.writeFileSync(path.join(OUT, "parlato.txt"), `TESTO LETTO\n${segs.map(s => s.testo).join("\n")}\n\nDIDASCALIA\n` +
    `Non sai cosa guardare? Oggi DubITA ti consiglia ${m.titolo} 🎙️ ${m.st === "partial" ? "Doppiaggio italiano in corso" : "Ed è doppiato in italiano"}${piatt ? " su " + piatt : ""} 🇮🇹\n` +
    `L'hai già visto? Scrivilo nei commenti! Il consiglio lo trovi anche sul sito, link in bio 🔗\n#anime #animeita #doppiaggioitaliano #animedavedere #consiglianime #animetiktok #perte ${tag(m.titolo)}\n`);
  console.log(`parlato.mp4 · ${t.toFixed(1)} s · ${m.titolo}`);
})().catch(e => { console.error(e); process.exit(1); });
