# Aggiornamento automatico di DubITA

Queste sono le regole che l'aggiornamento automatico (un'attività programmata di Claude) segue a ogni giro.
Il sito è `index.html`; i dati dei doppiaggi sono **solo** in `archivio.js`. L'aggiornamento modifica soltanto
`archivio.js` e `stato.json`. Non tocca mai `index.html`.

## Principio

Un dato sbagliato fa più danni di un dato mancante. Si aggiunge o si cambia una voce **solo** se una fonte
aperta e letta durante il giro lo conferma. Se non si trova una conferma, la voce resta com'è.

Fonti accettate, in ordine di affidabilità:

1. annunci ufficiali delle piattaforme (Crunchyroll, Netflix, Prime Video, Disney+, Yamato Video, Dynit, Anime Factory);
2. notizie di AnimeClick.it (in particolare il tag doppiaggio-italiano e le panoramiche stagionali);
3. le schede di antoniogenna.net (Il mondo dei doppiatori).

Non sono fonti valide: commenti degli utenti, forum, video, ipotesi, la segnalazione stessa.

## Il giro, passo per passo

1. Leggi `stato.json`, `archivio.js` e questo file.
2. **Segnalazioni.** Scarica il foglio delle segnalazioni in CSV (il link è nelle istruzioni dell'attività,
   non in questo repository). Considera solo le righe con data successiva a `stato.json → ultimaSegnalazione`.
   Le date del foglio sono nel formato mese/giorno/anno (es. `10/25/2026 14:47:18`). Ignora prove e spam
   (testi senza senso, titoli inesistenti). Per ogni segnalazione seria cerca una fonte: se conferma, aggiorna
   l'archivio; altrimenti lascia tutto com'è. Le segnalazioni di anime mancanti nel calendario o nella ricerca
   riguardano AniList: annotale nel resoconto finale, non si risolvono qui.
3. **Notizie.** Apri https://www.animeclick.it/notizie/tags/doppiaggio-italiano e leggi le notizie uscite dopo
   `stato.json → ultimeNotizie`. Apri gli articoli che annunciano doppiaggi, date o piattaforme e aggiorna le voci.
4. **Cambio di stagione.** Se la data di oggi è fuori dalla stagione in `STAGIONE` (inverno = gennaio-marzo,
   primavera = aprile-giugno, estate = luglio-settembre, autunno = ottobre-dicembre), o mancano meno di 10 giorni
   al suo inizio, cerca su AnimeClick la **panoramica sui doppiaggi italiani** e il **Listone** della nuova
   stagione. Se sono già usciti: aggiorna `STAGIONE` (season, year, nome, panoramica, listone), riscrivi
   `STAGIONE_SUB` con gli anime nuovi disponibili solo sottotitolati e aggiungi a `DUBDB` i doppiaggi annunciati.
   Se non sono ancora usciti, non cambiare `STAGIONE`: la regola si spegne da sola due settimane dopo la fine
   della stagione, ed è meglio nessuna etichetta che un'etichetta sbagliata.
5. Se hai cambiato qualcosa, aggiorna `DUB_CHECKED` con la data di oggi in italiano (es. `"26 ottobre 2026"`).
6. Aggiorna sempre `stato.json` (ultimaSegnalazione, ultimeNotizie, ultimoGiro).
7. Esegui `node strumenti/controlla.js`. Se segnala errori, correggili. Se non riesci, **non pubblicare**.
8. Pubblica con un commit su `main` solo se qualcosa è cambiato. Messaggio del commit in italiano, per esempio
   `Archivio: Frieren 2 doppiato su Crunchyroll, 2 segnalazioni verificate`.
9. Scrivi un resoconto breve in italiano: cosa è cambiato con le fonti, segnalazioni accettate, scartate e perché,
   e cosa richiede l'attenzione del proprietario.

## Come si scrive una voce di DUBDB

```js
{k: ["titolo romaji", "titolo inglese"], s: [2], st: "dub", p: "Crunchyroll",
 n: "Doppiata, disponibile dal 1 aprile 2026.", src: "https://link-della-fonte", v: "26 ottobre 2026"}
```

- `k`: inizio dei titoli come li scrive AniList, **normalizzati**: minuscole, senza accenti, ogni segno
  diverso da lettere e numeri sostituito da uno spazio (es. "Re:Zero" → `"re zero"`, "Dr. STONE" → `"dr stone"`).
- `s`: stagioni a cui vale la voce (facoltativo; senza `s` vale per tutte). `pt`: parti/cour (facoltativo).
- `y` / `yx`: anno minimo / massimo della stagione su AniList, per non confondere serie con lo stesso titolo.
- `ex`: parole che escludono (es. titoli di film o spin-off). `inc: true`: basta che il titolo contenga la chiave.
- `st`: `dub` (doppiato), `partial` (doppiaggio in corso), `soon` (annunciato), `sub` (solo sottotitolato),
  `none` (nessun doppiaggio, **confermato** da una fonte). Gli anime della stagione che non compaiono nella panoramica
  ricevono da soli l'etichetta "Nessun annuncio": non serve scriverli nell'archivio.
- `p`: piattaforma. `n`: una frase in italiano, con la data se c'è. `src`: il link della fonte aperta.
- `v`: la data di oggi in italiano (es. `"26 ottobre 2026"`). Va messa su ogni voce che aggiungi o cambi: sul sito
  compare come "voce verificata il …".

Quando un doppiaggio annunciato esce davvero, la voce passa da `soon` a `dub` (o `partial`) e si aggiornano `n` e `src`.

## Trame tradotte

`TRAME` contiene trame tradotte a mano in italiano, con le stesse chiavi di `DUBDB`. Si possono aggiungere,
fedeli alla descrizione originale e senza note come "(Source: …)". Non sono obbligatorie a ogni giro.
