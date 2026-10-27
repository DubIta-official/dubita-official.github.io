"""Scarica il foglio delle segnalazioni e le pagine fonte di DubITA in copie testuali.
Lo usa l'Action «Copie per il giro» (.github/workflows/copie.yml), che poi cifra tutto nel ramo «copie».
Uso: python3 strumenti/scarica.py <cartella di uscita>

Scrive, nella cartella di uscita:
  segnalazioni.csv          il foglio, così com'è (dal secret FOGLIO_CSV_URL)
  pagine/<nome>.txt         testo leggibile di ogni pagina scaricata
  indice.md                 elenco di cosa è stato scaricato, quando, ed eventuali errori

Pagine scaricate: la pagina del tag doppiaggio-italiano di AnimeClick, gli articoli più recenti che elenca,
la panoramica e il Listone indicati in STAGIONE dentro archivio.js, e gli indirizzi nella variabile PAGINE_EXTRA
(separati da spazi o a capo; il giro automatico li passa avviando l'Action a mano).
"""
import html, os, re, sys, time, urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
TAG = "https://www.animeclick.it/notizie/tags/doppiaggio-italiano"
MAX_ARTICOLI = 20
log = []

def get(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "it-IT,it;q=0.9"})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read().decode(r.headers.get_content_charset() or "utf-8", "replace")
        except Exception as e:
            err = e
            time.sleep(3 * (i + 1))
    raise err

class Testo(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "head", "nav", "footer", "form", "iframe"}
    BLOCK = {"p", "div", "br", "li", "h1", "h2", "h3", "h4", "h5", "tr", "section", "article", "table", "ul", "ol"}
    def __init__(self):
        super().__init__(convert_charrefs=True); self.out = []; self.skip = 0; self.href = None
    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP: self.skip += 1
        if tag in self.BLOCK: self.out.append("\n")
        if tag == "a": self.href = dict(attrs).get("href")
        if tag == "td": self.out.append(" | ")
    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip: self.skip -= 1
        if tag in self.BLOCK: self.out.append("\n")
        if tag == "a" and self.href and not self.skip and self.href.startswith("http"):
            self.out.append(f" <{self.href}>")
        if tag == "a": self.href = None
    def handle_data(self, d):
        if not self.skip: self.out.append(d)

def testo(page):
    p = Testo(); p.feed(page)
    t = "".join(p.out)
    t = re.sub(r"[ \t\r\f\v]+", " ", t)
    return re.sub(r"\n\s*\n+", "\n\n", t).strip()

def nome(url):
    return re.sub(r"[^a-z0-9]+", "-", url.lower().split("://", 1)[-1])[:120].strip("-")

def salva(url, page):
    title = re.search(r"<title[^>]*>(.*?)</title>", page, re.S | re.I)
    title = html.unescape(title.group(1)).strip() if title else ""
    pub = re.search(r'(?:article:published_time|datePublished)["\']?\s*(?:content=|:)\s*["\']([^"\']+)', page)
    path = f"pagine/{nome(url)}.txt"
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"URL: {url}\nTITOLO: {title}\nPUBBLICATO: {pub.group(1) if pub else '?'}\nSCARICATO: {ora()}\n\n{testo(page)}\n")
    log.append(f"- OK {url} → `{path}` · {title}" + (f" · pubblicato {pub.group(1)}" if pub else ""))

def ora():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    try: archivio = open(os.path.join(root, "archivio.js"), encoding="utf-8").read()
    except OSError: archivio = ""
    out = sys.argv[1] if len(sys.argv) > 1 else "copie"
    os.makedirs(os.path.join(out, "pagine"), exist_ok=True)
    os.chdir(out)
    url = os.environ.get("FOGLIO_CSV_URL", "").strip()
    m = re.match(r"(https://docs\.google\.com/spreadsheets/d/[^/]+)", url)
    if m and "format=csv" not in url and "out:csv" not in url:
        url = m.group(1) + "/export?format=csv"   # accetta anche il link /edit?usp=sharing
    if not url:
        log.append("- ERRORE segnalazioni: manca il secret FOGLIO_CSV_URL")
    else:
        try:
            csv = get(url)
            if csv.lstrip().startswith("<"): raise RuntimeError("il foglio ha risposto con una pagina HTML, non un CSV (è condiviso con «chiunque abbia il link»?)")
            open("segnalazioni.csv", "w", encoding="utf-8").write(csv)
            log.append(f"- OK segnalazioni → `segnalazioni.csv` ({csv.count(chr(10))} righe)")
        except Exception as e:
            log.append(f"- ERRORE segnalazioni: {e}")

    urls = []
    try:
        tag = get(TAG); salva(TAG, tag)
        for m in re.finditer(r'href="((?:https://www\.animeclick\.it)?/news/\d+-[^"#?]+)"', tag):
            u = m.group(1); u = u if u.startswith("http") else "https://www.animeclick.it" + u
            if u not in urls: urls.append(u)
        urls = urls[:MAX_ARTICOLI]
    except Exception as e:
        log.append(f"- ERRORE {TAG}: {e}")
    extra = re.findall(r'(?:panoramica|listone):\s*"(https://[^"]+)"', archivio)
    extra += os.environ.get("PAGINE_EXTRA", "").split()
    for u in extra:
        if u.startswith("https://") and u not in urls: urls.append(u)
    for u in urls:
        try: salva(u, get(u)); time.sleep(1.5)
        except Exception as e: log.append(f"- ERRORE {u}: {e}")

    with open("indice.md", "w", encoding="utf-8") as f:
        f.write(f"# Copie per il giro di DubITA\n\nUltimo scaricamento: {ora()}\n\n" + "\n".join(log) + "\n")
    print("\n".join(log))

if __name__ == "__main__":
    main()
