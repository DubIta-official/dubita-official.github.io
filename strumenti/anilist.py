"""Scarica da AniList (dati pubblici) il palinsesto dei prossimi giorni e le copertine per i video di DubITA.
Lo usa l'Action «Copie per il giro». Uso: python3 strumenti/anilist.py <cartella di uscita>
Scrive palinsesto.json (episodi in uscita da ieri a +7 giorni) e copertine/<id>.jpg (anime del palinsesto e del torneo),
più torneo.json con l'id AniList di ogni partecipante del torneo."""
import json, os, sys, time, urllib.request

API = "https://graphql.anilist.co"
def gql(query, var):
    for i in range(4):
        try:
            req = urllib.request.Request(API, json.dumps({"query": query, "variables": var}).encode(),
                                         {"Content-Type": "application/json", "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)["data"]
        except Exception as e:
            err = e; time.sleep(5 * (i + 1))   # AniList limita le richieste: si aspetta e si riprova
    raise err

MEDIA = "id title{romaji english} format episodes isAdult countryOfOrigin popularity genres coverImage{extraLarge large color} season seasonYear status siteUrl"
Q_PAL = """query($from:Int,$to:Int,$page:Int){Page(page:$page,perPage:50){pageInfo{hasNextPage}
 airingSchedules(airingAt_greater:$from,airingAt_lesser:$to,sort:TIME){airingAt episode media{%s}}}}""" % MEDIA
Q_CERCA = "query($s:String){Media(search:$s,type:ANIME,sort:POPULARITY_DESC){%s}}" % MEDIA

def scarica_img(url, dest):
    if os.path.exists(dest) or not url: return
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "DubITA"}), timeout=40) as r:
        open(dest, "wb").write(r.read())

def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "anilist"
    os.makedirs(os.path.join(out, "copertine"), exist_ok=True)
    now = int(time.time()); da, a = now - 86400, now + 7 * 86400
    eps, page = [], 1
    while page <= 10:
        d = gql(Q_PAL, {"from": da, "to": a, "page": page})["Page"]
        eps += [e for e in d["airingSchedules"] if not e["media"]["isAdult"] and e["media"]["countryOfOrigin"] == "JP"]
        if not d["pageInfo"]["hasNextPage"]: break
        page += 1; time.sleep(1)
    json.dump({"scaricato": now, "episodi": eps}, open(os.path.join(out, "palinsesto.json"), "w"), ensure_ascii=False)
    print(f"palinsesto: {len(eps)} episodi")
    # copertine: i 40 anime più popolari del palinsesto
    viste = {}
    for e in sorted(eps, key=lambda e: -(e["media"]["popularity"] or 0)):
        viste.setdefault(e["media"]["id"], e["media"])
    for m in list(viste.values())[:40]:
        try: scarica_img(m["coverImage"]["extraLarge"] or m["coverImage"]["large"], os.path.join(out, "copertine", f"{m['id']}.jpg"))
        except Exception as ex: print("copertina non scaricata", m["id"], ex)
    # torneo
    tf = os.path.join(os.path.dirname(os.path.abspath(__file__)), "video", "torneo.json")
    if os.path.exists(tf):
        t = json.load(open(tf, encoding="utf-8")); ris = []
        for p in t["partecipanti"]:
            try:
                m = gql(Q_CERCA, {"s": p["cerca"]})["Media"]; time.sleep(1)
                scarica_img(m["coverImage"]["extraLarge"] or m["coverImage"]["large"], os.path.join(out, "copertine", f"{m['id']}.jpg"))
                ris.append({"corto": p["corto"], "id": m["id"], "titolo": m["title"]["romaji"], "colore": m["coverImage"]["color"]})
            except Exception as ex:
                ris.append({"corto": p["corto"], "id": None}); print("torneo: non trovato", p["cerca"], ex)
        json.dump(ris, open(os.path.join(out, "torneo.json"), "w"), ensure_ascii=False, indent=1)
        print("torneo: " + ", ".join(f"{r['corto']}={r.get('titolo')}" for r in ris))

if __name__ == "__main__":
    main()
