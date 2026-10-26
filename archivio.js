/* ==========================================================================
   DubITA · archivio.js
   Dati dei doppiaggi italiani verificati, stagione in corso e trame tradotte.
   È l'unico file che l'aggiornamento automatico modifica: le regole sono in AGGIORNAMENTO.md.
   ========================================================================== */
/* ---------- ARCHIVIO DOPPIAGGI ITALIANI (verificato a mano) ----------
   Ogni voce: k = titoli (inizio del titolo, già normalizzato), s = stagioni, pt = parti, y/yx = anno minimo/massimo,
   ex = parole che escludono, inc = basta che il titolo contenga la chiave.
   st: "dub" doppiato · "partial" doppiaggio in corso · "soon" annunciato · "sub" solo sottotitolato · "none" nessun doppiaggio (confermato)
   v = data in cui la voce è stata verificata (facoltativa, es. "26 ottobre 2026") */
const DUB_CHECKED = "26 ottobre 2026";
const SRC = {
  rag: "https://www.antoniogenna.net/doppiaggio/anim/rentagirlfriend.htm",
  ragNews: "https://www.animeclick.it/news/107762-rent-a-girlfriend-su-crunchyroll-la-prima-stagione-doppiata",
  autumn: "https://www.animeclick.it/news/111951-anime-autunno-2026-panoramica-sui-doppiaggi-italiani",
  summer: "https://www.animeclick.it/news/110943-crunchyroll-annuncia-palinsesto-estate-2026-e-nuovi-doppiaggi",
  spring: "https://www.animeclick.it/news/110132-crunchyroll-annuncia-il-palinsesto-della-primavera-2026-e-nuovi-doppiaggi",
  bc: "https://www.animeclick.it/news/amp/110679-black-clover-informazioni-sul-doppiaggio-di-crunchyroll.amp.html",
  tag: "https://www.animeclick.it/notizie/tags/doppiaggio-italiano",
  crCat: "https://nosubanime.altervista.org/guida-agli-anime-doppiati-in-italiano-su-crunchyroll-cosa-guardare/",
  solo: "https://www.animeclick.it/news/101942-solo-leveling-doppiato-su-crunchyroll-ecco-il-cast-italiano",
  kaiju: "https://www.animeclick.it/news/102862-kaiju-no-8-il-doppiaggio-uscira-lo-stesso-giorno-della-versione-giapponese",
  jjk2: "https://www.animeclick.it/news/110273-jujutsu-kaisen-la-seconda-stagione-anime-arriva-su-italia-2-e-su-mediaset-infinity",
  mha: "https://www.animeclick.it/news/97580-my-hero-academia-arriva-doppiato-su-crunchyroll",
  mha6: "https://www.animeclick.it/news/104202-my-hero-academia-la-sesta-stagione-arriva-in-tv-su-italia-2-in-autunno"
};
const RAG = ["rent a girlfriend", "kanojo okarishimasu"];
const DUBDB = [
  // Rent-a-Girlfriend: stagioni 1-4 doppiate, la 5 no
  {k: RAG, s: [1], yx: 2020, st: "dub", p: "Crunchyroll", n: "Doppiata da MOLOK Studios, disponibile dal 29 luglio 2025.", src: SRC.rag},
  {k: RAG, s: [2], st: "dub", p: "Crunchyroll", n: "Doppiata, disponibile dal 1 aprile 2026.", src: SRC.rag},
  {k: RAG, s: [3], st: "dub", p: "Crunchyroll", n: "Doppiata, disponibile dal 28 maggio 2026.", src: SRC.rag},
  {k: RAG, s: [4], st: "dub", p: "Crunchyroll", n: "Doppiata, disponibile da luglio 2026.", src: SRC.rag},
  {k: RAG, s: [5], st: "sub", p: "Crunchyroll", n: "Disponibile solo sottotitolata: nessun doppiaggio annunciato.", src: SRC.rag},

  // Black Clover
  {k: ["black clover"], s: [1], yx: 2021, st: "partial", p: "Crunchyroll", n: "Doppiaggio in corso (VSI Roma): i primi episodi sono già disponibili, gli altri arrivano a blocchi.", src: SRC.bc},
  {k: ["black clover"], s: [2], st: "soon", p: "Crunchyroll", n: "Doppiaggio in lavorazione, data da annunciare.", src: SRC.autumn},

  // Autunno 2026
  {k: ["overgeared"], st: "dub", p: "Crunchyroll", n: "Simuldub dal 27 settembre 2026.", src: SRC.autumn},
  {k: ["kusuriya no hitorigoto", "the apothecary diaries", "il monologo della speziale"], s: [3], st: "soon", p: "Crunchyroll", n: "Simuldub annunciato, data da comunicare.", src: SRC.autumn},
  {k: ["magic knight rayearth", "mahou kishi rayearth"], y: 2026, st: "soon", p: "Crunchyroll", n: "Simuldub annunciato, data da comunicare.", src: SRC.autumn},
  {k: ["firefly wedding", "hotaru no yomeiri"], st: "soon", p: "Crunchyroll", n: "Simuldub annunciato, data da comunicare.", src: SRC.autumn},
  {k: ["jojo no kimyou na bouken steel ball run", "jojo s bizarre adventure steel ball run"], st: "dub", p: "Netflix", n: "Simuldub dal 25 settembre 2026.", src: SRC.autumn},
  {k: ["the ramparts of ice", "koori no jouheki"], s: [1], st: "dub", p: "Netflix", n: "Doppiata.", src: SRC.tag},
  {k: ["the ramparts of ice", "koori no jouheki"], s: [2], st: "dub", p: "Netflix", n: "Simuldub dal 1 ottobre 2026.", src: SRC.autumn},
  {k: ["ranma 1 2"], s: [3], st: "dub", p: "Netflix", n: "Simuldub dal 3 ottobre 2026.", src: SRC.autumn},
  {k: ["ao no hako", "blue box"], s: [2], st: "dub", p: "Netflix", n: "Simuldub dal 4 ottobre 2026.", src: SRC.autumn},
  {k: ["cyberpunk edgerunners"], s: [2], st: "dub", p: "Netflix", n: "Simuldub dal 20 ottobre 2026.", src: SRC.autumn},
  {k: ["marronnier"], inc: true, st: "dub", p: "Prime Video", n: "Simuldub dal 3 ottobre 2026.", src: SRC.autumn},
  {k: ["tank chair"], st: "dub", p: "Prime Video", n: "Simuldub dal 4 ottobre 2026.", src: SRC.autumn},
  {k: ["three titans", "mitsudomoe"], inc: true, st: "dub", p: "Disney+", n: "Simuldub dal 2 ottobre 2026, con nuovo cast.", src: SRC.autumn},
  {k: ["tokyo revengers"], s: [1], yx: 2021, ex: ["three titans", "mitsudomoe", "seiya", "christmas", "tenjiku"], st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["bleach sennen kessen hen", "bleach thousand year blood war"], st: "partial", p: "Disney+", n: "Doppiaggio in corso: la quarta parte arriva in italiano durante l'autunno 2026.", src: SRC.autumn},
  {k: ["boruto naruto next generations"], st: "partial", p: "Prime Video", n: "Doppiaggio in corso a blocchi di 30 episodi (91-120 dal 15 ottobre, 121-150 dal 15 novembre, 151-180 dal 15 dicembre); finale previsto ad aprile 2027.", src: SRC.autumn},

  // Estate 2026
  {k: ["black torch"], st: "dub", p: "Crunchyroll", n: "Simuldub dal 4 luglio 2026.", src: SRC.summer},
  {k: ["inept villainess"], inc: true, st: "dub", p: "Crunchyroll", n: "Doppiaggio annunciato a giugno 2026, dettagli pubblicati ad agosto.", src: SRC.tag},
  {k: ["mushoku tensei"], s: [3], st: "soon", p: "Crunchyroll", n: "Doppiaggio annunciato, data da comunicare.", src: SRC.summer},
  {k: ["re zero kara hajimeru isekai seikatsu", "re zero starting life in another world"], s: [4], st: "soon", p: "Crunchyroll", n: "Doppiaggio annunciato, data da comunicare.", src: SRC.summer},
  {k: ["tensei shitara slime datta ken", "that time i got reincarnated as a slime"], s: [4], st: "dub", p: "Crunchyroll", n: "Simuldub ogni venerdì.", src: SRC.summer},
  {k: ["tensei shitara slime datta ken", "that time i got reincarnated as a slime"], s: [1], yx: 2019, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["yomi no tsugai", "daemons of the shadow realm"], st: "dub", p: "Crunchyroll", n: "Simuldub ogni sabato.", src: SRC.summer},
  {k: ["kimetsu no yaiba mugen jou hen", "demon slayer kimetsu no yaiba infinity castle"], st: "dub", p: "Crunchyroll", n: "Il Castello dell'Infinito è doppiato su Crunchyroll da luglio 2026.", src: SRC.tag},
  {k: ["yuusha kei ni shosu", "sentenced to be a hero"], st: "dub", p: "Crunchyroll", n: "Doppiato (luglio 2026).", src: SRC.tag},

  // Primavera 2026
  {k: ["tongari boushi no atelier", "witch hat atelier", "atelier of witch hat"], st: "dub", p: "Crunchyroll", n: "Doppiato (primavera 2026).", src: SRC.spring},
  {k: ["dr stone science future"], pt: [3], st: "soon", p: "Crunchyroll", n: "Doppiaggio annunciato per la terza parte.", src: SRC.spring},
  {k: ["dr stone"], s: [1], yx: 2019, ex: ["science future", "new world", "stone wars", "ryuusui", "ryusui"], st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},

  // Film
  {k: ["koe no katachi", "a silent voice", "la forma della voce"], y: 2016, yx: 2016, st: "dub", p: "Cinema · DVD e Blu-ray Dynit", n: "Film doppiato in italiano (La forma della voce): al cinema il 24-25 ottobre 2017 con Dynit e Nexo Digital, poi in DVD e Blu-ray Dynit con audio italiano.", src: "https://www.animeclick.it/news/71861-la-forma-della-voce-i-dettagli-delledizione-home-video-dynit", v: "26 ottobre 2026"},

  // Altre piattaforme (Netflix, Prime Video, Disney+, Yamato, Dynit)
  {k: ["jojo no kimyou na bouken stardust crusaders", "jojo s bizarre adventure stardust crusaders",
       "jojo no kimyou na bouken diamond wa kudakenai", "jojo s bizarre adventure diamond is unbreakable",
       "jojo no kimyou na bouken ougon no kaze", "jojo s bizarre adventure golden wind"], st: "dub", p: "Netflix", n: "Parti 3, 4 e 5 doppiate su Netflix da gennaio 2026.", src: SRC.tag},
  {k: ["medalist"], s: [2], st: "dub", p: "Disney+", n: "Doppiata (aprile 2026).", src: SRC.tag},
  {k: ["wandance"], st: "dub", p: "Disney+", n: "Doppiato (maggio 2026).", src: SRC.tag},
  {k: ["rooster fighter", "niwatori fighter"], st: "dub", p: "Disney+", n: "Doppiato (marzo 2026).", src: SRC.tag},
  {k: ["snowball earth"], st: "dub", p: "Disney+", n: "Doppiato (settembre 2026).", src: SRC.tag},
  {k: ["cat s eye"], y: 2025, st: "dub", p: "Disney+", n: "Nuova serie doppiata (settembre 2025).", src: SRC.tag},
  {k: ["akane banashi"], st: "dub", p: "Yamato Video", n: "Doppiato (aprile 2026).", src: SRC.tag},
  {k: ["jigoku sensei nube", "hell teacher nube"], y: 2025, st: "dub", p: "Yamato Video", n: "Doppiato (annuncio di novembre 2025).", src: SRC.tag},
  {k: ["dandelion"], st: "dub", p: "Netflix", n: "Doppiato (aprile 2026).", src: SRC.tag},
  {k: ["chainsmoker cat"], st: "dub", p: "Netflix", n: "Doppiato (luglio 2026).", src: SRC.tag},
  {k: ["yamada kun to lv999 no koi wo suru", "my love story with yamada kun at lv999"], st: "dub", p: "Netflix", n: "Doppiato (luglio 2026).", src: SRC.tag},
  {k: ["thunder3", "thunder 3"], st: "dub", p: "Netflix", n: "Doppiato (luglio 2026).", src: SRC.tag},
  {k: ["sparks of tomorrow"], st: "dub", p: "Netflix", n: "Doppiato (luglio 2026).", src: SRC.tag},
  {k: ["the ribbon hero"], st: "dub", p: "Netflix", n: "Doppiato (agosto 2026).", src: SRC.tag},
  {k: ["milky subway", "milky subway the galactic limited express"], st: "dub", p: "Netflix", n: "Doppiato (giugno 2026).", src: SRC.tag},
  {k: ["cosmic princess kaguya", "chou kaguya hime"], st: "dub", p: "Netflix", n: "Doppiato (gennaio 2026).", src: SRC.tag},
  {k: ["shiboyugi", "shibou yuugi de meshi wo kuu"], st: "dub", p: "Netflix / Crunchyroll", n: "Doppiato (gennaio 2026).", src: SRC.tag},
  {k: ["hikaru ga shinda natsu", "the summer hikaru died"], s: [1], yx: 2025, st: "dub", p: "Netflix", n: "Doppiato (novembre 2025).", src: SRC.tag},
  {k: ["cyberpunk edgerunners"], s: [1], yx: 2022, st: "dub", p: "Netflix", n: "Serie originale Netflix, doppiata in italiano.", src: SRC.autumn},
  {k: ["the ghost in the shell", "koukaku kidoutai"], y: 2026, st: "dub", p: "Prime Video", n: "Doppiato (luglio 2026).", src: SRC.tag},
  {k: ["hokuto no ken", "fist of the north star"], y: 2026, st: "dub", p: "Prime Video", n: "Nuova serie doppiata (aprile 2026).", src: SRC.tag},
  {k: ["nippon sangoku"], st: "dub", p: "Prime Video", n: "Doppiato (aprile 2026).", src: SRC.tag},
  {k: ["darwin jihen", "darwin s incident"], st: "dub", p: "Prime Video", n: "Doppiato (gennaio 2026).", src: SRC.tag},
  {k: ["ninja to gokudou", "ninja vs gokudo"], st: "dub", p: "Prime Video", n: "Doppiato (ottobre 2025).", src: SRC.tag},
  {k: ["sanda"], y: 2025, st: "dub", p: "Prime Video", n: "Doppiato (settembre 2025).", src: SRC.tag},
  {k: ["deadman wonderland"], st: "dub", p: "Dynit", n: "Doppiaggio annunciato a maggio 2026.", src: SRC.tag},
  {k: ["dance in the vampire bund"], st: "dub", p: "Dynit", n: "Doppiaggio annunciato a luglio 2026.", src: SRC.tag},
  {k: ["kekkai sensen", "blood blockade battlefront"], s: [1], yx: 2015, st: "dub", p: "Dynit", n: "Doppiaggio annunciato a luglio 2026.", src: SRC.tag},

  // Serie lunghe in corso: gli episodi vecchi sono doppiati, quelli nuovi arrivano in ritardo
  {k: ["one piece"], st: "partial", p: "Italia 2 · Crunchyroll", n: "Doppiato in italiano con anni di ritardo rispetto al Giappone: gli episodi nuovi escono prima sottotitolati, il doppiaggio arriva dopo a blocchi.", src: "https://www.animeclick.it/news/92226-one-piece-su-italia-2-dal-20-ottobre-le-nuove-puntate-in-prima-tv"},
  {k: ["meitantei conan", "detective conan", "case closed"], st: "partial", p: "Italia 2 · Anime Generation", n: "Gli episodi storici sono doppiati e passano su Italia 2; quelli nuovi escono in simulcast sottotitolati su Anime Generation.", src: "https://www.animeclick.it/news/109862-yamato-video-in-arrivo-il-simulcast-di-detective-conan-su-anime-generation"},
  {k: ["pokemon 2023", "pokemon horizons", "pokemon horizons the series"], st: "partial", p: "Boing · Netflix", n: "Orizzonti Pokémon è doppiato in italiano; i nuovi archi arrivano in TV e su Netflix con qualche mese di ritardo.", src: "https://multiplayer.it/notizie/orizzonti-pokemon-stagione-2-ha-un-periodo-di-uscita-in-italia-sara-visibile-in-chiaro-su-boing.html"},
  {k: ["doraemon 2005", "doraemon"], y: 2005, st: "partial", p: "Boing · Italia 1", n: "Serie doppiata in italiano e trasmessa in TV; gli episodi più recenti arrivano in ritardo.", src: "https://www.antoniogenna.net/"},
  {k: ["crayon shin chan", "shin chan"], ex: ["movie", "gekijouban"], st: "partial", p: "Boing", n: "Serie doppiata in italiano e trasmessa in TV; gli episodi più recenti arrivano in ritardo.", src: "https://www.antoniogenna.net/"},

  // Grandi serie già doppiate
  {k: ["ore dake level up na ken", "solo leveling"], s: [1], yx: 2024, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.solo},
  {k: ["kaijuu 8 gou", "kaiju no 8"], s: [1], yx: 2024, st: "dub", p: "Crunchyroll", n: "Prima stagione in simuldub.", src: SRC.kaiju},
  {k: ["jujutsu kaisen"], s: [1], yx: 2021, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["jujutsu kaisen"], s: [2], st: "dub", p: "Crunchyroll · Italia 2", n: "Seconda stagione doppiata, trasmessa anche su Italia 2.", src: SRC.jjk2},
  {k: ["jujutsu kaisen 0", "gekijouban jujutsu kaisen 0"], st: "dub", p: "Crunchyroll", n: "Film doppiato.", src: SRC.crCat},
  {k: ["boku no hero academia", "my hero academia"], s: [1, 2, 3, 4, 5, 6], yx: 2023, st: "dub", p: "Crunchyroll · Italia 2", n: "Stagioni doppiate; la sesta è passata anche su Italia 2.", src: SRC.mha6},
  {k: ["spy x family", "spy family"], s: [1], yx: 2022, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["chainsaw man"], s: [1], yx: 2022, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["shingeki no kyojin", "attack on titan"], s: [2, 3], st: "dub", p: "Crunchyroll", n: "Stagioni 2 e 3 doppiate.", src: SRC.crCat},
  {k: ["sono bisque doll wa koi wo suru", "my dress up darling"], s: [1], yx: 2022, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["tate no yuusha no nariagari", "the rising of the shield hero"], s: [1], yx: 2019, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["uzaki chan wa asobitai", "uzaki chan wants to hang out"], s: [1], yx: 2020, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["ousama ranking", "ranking of kings"], s: [1], yx: 2021, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["mob psycho 100"], s: [1], yx: 2016, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["shiguang dailiren", "link click"], s: [1], yx: 2021, st: "dub", p: "Crunchyroll", n: "Doppiato.", src: SRC.crCat},
  {k: ["mashle"], s: [1], yx: 2023, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["yuusha ga shinda", "the legendary hero is dead"], st: "dub", p: "Crunchyroll", n: "Doppiato.", src: SRC.crCat},
  {k: ["kaminaki sekai no kamisama katsudou", "kamikatsu"], st: "dub", p: "Crunchyroll", n: "Doppiato.", src: SRC.crCat},
  {k: ["jigokuraku", "hell s paradise"], s: [1], yx: 2023, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["blue lock"], s: [1], yx: 2023, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["jidou hanbaiki ni umarekawatta", "reborn as a vending machine"], s: [1], yx: 2023, st: "dub", p: "Crunchyroll", n: "Prima stagione doppiata.", src: SRC.crCat},
  {k: ["zom 100", "zombie 100"], st: "dub", p: "Crunchyroll", n: "Doppiato.", src: SRC.crCat}
];

// STAGIONE IN CORSO: da aggiornare all'inizio di ogni stagione (gennaio, aprile, luglio, ottobre)
// season: WINTER | SPRING | SUMMER | FALL (come su AniList); year: anno della stagione su AniList
const STAGIONE = {season: "FALL", year: 2026, nome: "l'autunno 2026",
  panoramica: "https://www.animeclick.it/news/111951-anime-autunno-2026-panoramica-sui-doppiaggi-italiani",
  listone: "https://www.animeclick.it/news/111514-novita-anime-stagionali-autunno-2026-il-listone"};
// Anime nuovi della stagione disponibili in Italia SOLO sottotitolati, con la piattaforma (fonte: il Listone di AnimeClick)
const STAGIONE_SUB = [
  [["zombie sagashitemasu", "i m looking for a zombie"], "Crunchyroll"],
  [["toaru anbu no item", "a certain dark item"], "Crunchyroll"],
  [["a tale of the secret saint", "silent witch"], "Crunchyroll"],
  [["seitokai ni mo ana wa aru"], "Yamato Video"],
  [["aoashi"], "Crunchyroll"],
  [["battle spirits"], "Crunchyroll · Dynit"],
  [["jyuou mujin dandivine", "dandivine"], "Crunchyroll"],
  [["dark machine"], "Crunchyroll"],
  [["demons crest", "devils crest", "devil s crest"], "Prime Video"],
  [["dragon ball super beerus"], "Yamato Video"],
  [["yowaki max reijou", "even though i m a super timid noble girl"], "Crunchyroll"],
  [["kanata kara", "from far away"], "Crunchyroll"],
  [["shinja zero no megami sama", "full clearing another world"], "Crunchyroll"],
  [["fx senshi kurumi chan", "fx fighter kurumi chan"], "Crunchyroll"],
  [["doumo suki na hito ni horegusuri", "hello i am a witch"], "Crunchyroll"],
  [["horror collector"], "Crunchyroll"],
  [["keroro"], "Crunchyroll"],
  [["kashita maryoku wa ribo harai", "magic repo man"], "Crunchyroll"],
  [["magical explorer"], "Crunchyroll"],
  [["mahou shoujo ikusei keikaku", "magical girl raising project"], "Dynit"],
  [["kyouran reijou nia liston", "nia liston"], "Yamato Video"],
  [["psyren"], "Crunchyroll"],
  [["reborn as a space mercenary"], "Crunchyroll"],
  [["romelia senki", "romelia war chronicle"], "Crunchyroll"],
  [["sasaki to pii chan", "sasaki and peeps"], "Crunchyroll"],
  [["tensei goblin", "so what s wrong with getting reborn as a goblin"], "Crunchyroll"],
  [["suikoden"], "Yamato Video"],
  [["choujun choujou senpai", "super psychic policeman chojo"], "Crunchyroll"],
  [["tensei shitara ken deshita", "reincarnated as a sword"], "Yamato Video"],
  [["shiotaiou no satou san", "the cold sato san"], "Crunchyroll"],
  [["tantei wa mou shindeiru", "the detective is already dead"], "Crunchyroll"],
  [["hyouken no majutsushi ga sekai wo suberu", "hyouken no majutsushi ga sekai o suberu", "the iceblade sorcerer shall rule the world"], "Crunchyroll"],
  [["tsuihou sareta cheat fuyo majutsushi", "the laid off cheat granting mage"], "Crunchyroll"],
  [["shin prince of tennis", "the prince of tennis ii"], "Crunchyroll"],
  [["shuiro no kamen", "the vermilion mask"], "Crunchyroll"],
  [["sekai saikyou no majo", "the world s strongest witch"], "Crunchyroll"],
  [["tougen anki"], "Crunchyroll"],
  [["ojisan wa kawaii mono ga osuki", "uncle s obsession with cute things"], "Crunchyroll"],
  [["vertex force"], "Crunchyroll"],
  [["wild last boss", "yasei no last boss"], "Crunchyroll"],
  [["kanteiyaku", "appraisal skill"], "Crunchyroll"],
  [["diamond no ace", "ace of the diamond"], "Crunchyroll"],
  [["a returner s magic should be special", "kikanshita mahou"], "Crunchyroll"]
];
function seasonActive(){
  // la regola vale dall'inizio della stagione fino a 2 settimane dopo la fine: se nessuno la aggiorna, si spegne da sola
  const start = {WINTER: 0, SPRING: 3, SUMMER: 6, FALL: 9}[STAGIONE.season];
  if (start === undefined) return false;
  const from = new Date(STAGIONE.year, start, 1), to = new Date(STAGIONE.year, start + 3, 15);
  const d = new Date(); return d >= from && d <= to;
}
function seasonRule(m){
  // Solo per gli anime in onda adesso: gli annunci di doppiaggio della stagione sono già tutti nell'archivio
  if (!seasonActive()) return null;
  if (m.status !== "RELEASING" && !(m.season === STAGIONE.season && m.seasonYear === STAGIONE.year)) return null;
  const ts = [m.title.english, m.title.romaji].filter(Boolean).map(norm);
  const hit = STAGIONE_SUB.find(([ks]) => ks.some(k => ts.some(t => t === k || t.startsWith(k + " "))));
  if (hit) return {rule: true, st: "sub", p: hit[1], n: `Disponibile in Italia solo sottotitolato: non compare tra i doppiaggi annunciati per ${STAGIONE.nome}.`, src: STAGIONE.listone};
  return {rule: true, st: "noann", p: "", n: `Finora non è stato annunciato nessun doppiaggio italiano: non compare tra i doppiaggi annunciati per ${STAGIONE.nome}, su nessuna piattaforma. Se arriva un annuncio, la scheda si aggiorna.`, src: STAGIONE.panoramica};
}
const ROMAN = {II: 2, III: 3, IV: 4, V: 5, VI: 6};
function seasonOf(m){
  if (m.format === "MOVIE") return "film";
  const ts = [m.title.english, m.title.romaji].filter(Boolean);
  for (const t of ts) {
    const x = t.match(/season\s*(\d+)/i) || t.match(/(\d+)\s*(?:st|nd|rd|th)\s*season/i);
    if (x) return +x[1];
  }
  const r = m.title.romaji || "";
  const rx = r.match(/\s(II|III|IV|V|VI)(?=\s|:|$)/); if (rx) return ROMAN[rx[1]];
  const nx = r.match(/\s(\d{1,2})$/); if (nx && !r.includes("/")) return +nx[1];
  return 1;
}
function partOf(m){
  for (const t of [m.title.english, m.title.romaji].filter(Boolean)) {
    const x = t.match(/part\s*(\d+)/i) || t.match(/(\d+)\s*(?:st|nd|rd|th)\s*cour/i) || t.match(/cour\s*(\d+)/i);
    if (x) return +x[1];
  }
  return 1;
}
const dubMemo = new Map();
// trova la voce giusta in un elenco (archivio doppiaggi, trame tradotte): titolo, stagione, parte e anno
function matchEntry(list, m){
  const ts = [m.title.english, m.title.romaji].filter(Boolean).map(norm);
  const se = seasonOf(m), pa = partOf(m), y = m.seasonYear || 0;
  let best = null, bl = 0;
  for (const e of list) {
    for (const k of e.k) {
      const hit = ts.some(t => e.inc ? t.includes(k) : (t === k || t.startsWith(k + " ")));
      if (!hit || k.length <= bl) continue;
      if (e.s && !e.s.includes(se)) continue;
      if (e.pt && !e.pt.includes(pa)) continue;
      if (e.y && y && y < e.y) continue;
      if (e.yx && y && y > e.yx) continue;
      if (e.ex && ts.some(t => e.ex.some(x => t.includes(x)))) continue;
      best = e; bl = k.length;
    }
  }
  return best;
}
function dubData(m){
  if (dubMemo.has(m.id)) return dubMemo.get(m.id);
  const best = matchEntry(DUBDB, m) || seasonRule(m);
  dubMemo.set(m.id, best);
  return best;
}
const DUB_LABEL = {dub: ["ITA", "ita", "Doppiato in italiano"], partial: ["ITA in corso", "ita", "Doppiaggio italiano in corso"],
  soon: ["ITA in arrivo", "soon", "Doppiaggio italiano annunciato"], sub: ["SUB ITA", "sub", "Solo sottotitolato in italiano"],
  none: ["No ITA", "sub", "Nessun doppiaggio italiano"],
  noann: ["Nessun annuncio", "sub", "Nessun doppiaggio annunciato"]};

/* ---------- TRAME TRADOTTE A MANO ---------- */
const TRAME = [
  {k: RAG, s: [1], yx: 2020, t: "Kazuya Kinoshita è uno studente universitario di 20 anni a cui va tutto storto. Era riuscito a baciare la sua ragazza una volta, ma dopo un mese lei l'ha lasciato. «Uffa… Maledizione. Non voglio mai più passare una cosa del genere.» Pieno di rancore, Kazuya ricorre a un certo metodo per uscire con una ragazza. Arriva al luogo dell'appuntamento e all'improvviso sente: «Sei Kazuya, vero?» Davanti a lui c'è una bellissima ragazza che si sistema i lunghi capelli neri dietro l'orecchio e gli sorride. Si chiama Chizuru Mizuhara. Da un solo noleggio nasce qualcosa di vero! Sta per cominciare una commedia romantica sfrenata, piena di amore ed emozioni!"},
  {k: RAG, s: [5], t: "Durante il viaggio di famiglia alle terme tradizionali, Kazuya Kinoshita non è riuscito a far progredire il rapporto con Chizuru Ichinose, la sua ragazza a noleggio. Dopo aver ricevuto da lei segnali contrastanti, Kazuya decide che, una volta tornato a Tokyo, metterà fine alla loro lunga finzione. Intanto la sua ex, Mami Nanami, è disposta a tutto pur di smascherare la recita di Chizuru. Quando Mami fa crollare all'improvviso la finta relazione davanti a famiglia e amici, Kazuya dovrà agire subito se vuole salvare la sua vita sociale."},
  {k: ["black clover"], s: [1], yx: 2021, t: "In un mondo in cui la magia è tutto, Asta e Yuno vengono trovati abbandonati davanti a una chiesa nello stesso giorno. Yuno ha poteri magici eccezionali, mentre Asta è l'unico al mondo a non averne affatto. A quindici anni entrambi ricevono un grimorio, un libro che amplifica la magia di chi lo possiede. Quello di Asta è un raro grimorio dell'anti-magia, capace di annullare e respingere gli incantesimi degli avversari. Opposti ma buoni rivali, Asta e Yuno sono pronti alle sfide più dure per realizzare il loro sogno comune: diventare l'Imperatore Magico. Arrendersi non è mai un'opzione!"},
  {k: ["ao no hako", "blue box"], s: [1], yx: 2025, t: "Due innamorati divisi dallo sport: avranno una possibilità? Taiki Inomata adora il badminton, ma ha ancora tanta strada da fare per arrivare ai campionati nazionali. Quando vede Chinatsu Kano, una studentessa più grande, allenarsi con tutta sé stessa nella squadra femminile di basket, se ne innamora perdutamente. Dopo una svolta inaspettata che li avvicina, forse lo sport non sarà più il loro primo pensiero!"}
];
