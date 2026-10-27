// Trasforma la descrizione di un video (scene) in un file MP4 verticale 1080×1920, usando modello.html.
// Uso da riga di comando: node rendi.js descrizione.json uscita.mp4   ·   node rendi.js descrizione.json --foto 1,4.5,9
const {chromium} = require("playwright"), {spawn} = require("child_process"), path = require("path"), fs = require("fs");
const MODELLO = "file://" + path.join(__dirname, "modello.html");

async function apri(spec, browser) {
  const p = await browser.newPage({viewport: {width: 1080, height: 1920}});
  await p.addInitScript(s => { window.VIDEO = s; }, spec);
  await p.goto(MODELLO); await p.evaluate(() => document.fonts.ready);
  return p;
}

async function rendi(spec, out, {fps = 30, browser} = {}) {
  const b = browser || await chromium.launch();
  const p = await apri(spec, b), total = await p.evaluate(() => TOTAL), n = Math.ceil(total * fps);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest",
    "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", out], {stdio: ["pipe", "inherit", "inherit"]});
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => render(t), i / fps);
    const buf = await p.screenshot({type: "jpeg", quality: 92});
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  const code = await new Promise(r => ff.on("close", r));
  await p.close(); if (!browser) await b.close();
  if (code !== 0) throw new Error("ffmpeg ha dato errore per " + out);
  return total;
}

async function foto(spec, tempi, prefisso, {browser} = {}) {
  const b = browser || await chromium.launch(), p = await apri(spec, b), files = [];
  for (const t of tempi) { await p.evaluate(t => render(t), t); const f = `${prefisso}_${t}.png`; await p.screenshot({path: f}); files.push(f); }
  await p.close(); if (!browser) await b.close();
  return files;
}

module.exports = {rendi, foto};
if (require.main === module) (async () => {
  const [src, out, t] = process.argv.slice(2), spec = JSON.parse(fs.readFileSync(src, "utf8"));
  if (out === "--foto") console.log(await foto(spec, t.split(",").map(Number), "foto"));
  else console.log(`${out}: ${(await rendi(spec, out)).toFixed(1)} s`);
})();
