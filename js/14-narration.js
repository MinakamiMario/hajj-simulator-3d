'use strict';
// ============================================================
//  REISBEGELEIDER — verhalende gids-narratie tijdens het spelen
//  Toont per scène een reeks warme uitlegregels (als een moutawif
//  die je meeneemt). Tikken = volgende regel. Auto-advance op leestijd.
//  Optioneel: ingesproken audio (VoxCPM) via GidsAudio.
// ============================================================
const Gids = {
  lines:[], idx:-1, timer:null, box:null, txt:null, more:null, _wired:false,
  _wire(){
    if(this._wired)return;
    this.box=el('gids'); if(!this.box)return;
    this.txt=el('gids-txt'); this.more=el('gids-more');
    this.box.addEventListener('click',(e)=>{ e.stopPropagation(); this.next(); });
    const close=el('gids-close'); if(close)close.addEventListener('click',(e)=>{ e.stopPropagation(); this.hide(); });
    this._wired=true;
  },
  start(lines){
    this._wire(); if(!this.box)return;
    this.stop();
    this.lines=Array.isArray(lines)?lines.slice():[];
    if(!this.lines.length){ this.hide(); return; }
    this.idx=-1;
    // kleine vertraging zodat de scènetitel eerst even staat
    this.timer=setTimeout(()=>this.next(),1400);
  },
  next(){
    clearTimeout(this.timer);
    this.idx++;
    if(!this.lines || this.idx>=this.lines.length){ this.hide(); return; }
    const line=this.lines[this.idx];
    if(this.txt)this.txt.textContent=line;
    if(this.more)this.more.textContent=(this.idx<this.lines.length-1)?'tik voor verder ▸':'tik om te sluiten';
    this.box.classList.add('show');
    if(window.GidsAudio && typeof GidsAudio.play==='function') GidsAudio.play(State.scene,this.idx);
    const dur=Math.min(13000, 4200 + line.length*42);          // leestijd ~ lengte
    this.timer=setTimeout(()=>this.next(),dur);
  },
  hide(){ clearTimeout(this.timer); if(this.box)this.box.classList.remove('show'); },
  stop(){ this.hide(); this.lines=[]; this.idx=-1;
    if(window.GidsAudio && typeof GidsAudio.stop==='function') GidsAudio.stop(); }
};
window.Gids=Gids;

// ============================================================
//  NARRATIE per scène (NL, reisbegeleider-toon — verhaal + uitleg)
// ============================================================
const NARRATION = {
  0:[ "Welkom. Vannacht begint iets waar je misschien je hele leven naar verlangd hebt: je Hajj.",
      "Voel je hart maar — daar, in alle rust, maak je je intentie. De Niyyah leeft in je hart; daar komt het op aan. Velen spreken er straks bij de Miqaat ook woorden bij, zoals 'Labbayka Hajjan' — maar de kern is je stille besluit: 'O Allah, voor U onderneem ik deze reis.'",
      "Ga zo dadelijk met een gerust hart slapen. Morgen, als de zon opkomt, pak je je koffer en begint de weg naar Mekka." ],
  1:[ "Goedemorgen. Op Hajj reis je licht — niet alleen je koffer is licht, ook je hart laat ballast achter.",
      "Pak met aandacht: paspoort, ihraam, reukloze zeep, je du'a-boekje. Maar parfum, en voor mannen genaaide kleren, laat je hier — in ihraam gelden andere regels.",
      "De taxi staat zo voor de deur. Vanaf nu ben je gast van de Meest Genadige." ],
  2:[ "We naderen de Miqaat — de grens waar de staat van ihraam ingaat. Niemand mag deze grens met de bedoeling van Hajj passeren zonder in ihraam te zijn.",
      "Heb je je thuis nog niet omgekleed? Doe het nu, achterin. Voor mannen: twee witte, ongenaaide lappen — koning en bedelaar zien er gelijk uit voor Allah. Vrouwen dragen gewone, ingetogen kleding.",
      "En dan, uit duizenden monden tegelijk: 'Labbayk Allahumma labbayk' — Hier ben ik, o Allah, hier ben ik. Zeg het mee." ],
  3:[ "Loop rustig met me mee door de poort... en kijk. Dáár is ze — het eerste huis dat voor de mensen werd gebouwd om Allah te aanbidden.",
      "Veel pelgrims huilen op dit moment, en dat is goed. Een betrouwbare overlevering die juist de eerste blik op de Ka'ba een gegarandeerd verhoorde du'a toeschrijft is er niet — maar dit is wél een gezegend moment op een gezegende plaats, dus hef gerust je handen en vraag van harte.",
      "Neem de tijd. Je hebt hier je hele leven van gedroomd." ],
  4:[ "We beginnen de tawaf bij de Hajar al-Aswad — de Zwarte Steen; je ziet de groene lijn. Zeven keer rond, de Ka'ba altijd aan je linkerhand.",
      "Je draait mee met de hele schepping; zo draaien de engelen rond Zijn troon. Loop, maak dhikr, en houd je hart bij Allah.",
      "Tussen Rukn al-Yamani en de Hajar al-Aswad zeg je: 'Rabbanā ātinā fid-dunyā hasanah, wa fil-ākhirati hasanah, wa qinā ʿadhāban-nār' — Heer, geef ons het goede in dit leven én in het hiernamaals, en bescherm ons tegen het Vuur." ],
  5:[ "Nu lopen we in de voetstappen van een moeder. Hajar, alleen met haar baby Ismail in een kale vallei, snelde hier zeven keer heen en weer, zoekend naar water.",
      "Zij vertrouwde op Allah en gaf niet op — en uit het niets ontsprong Zamzam, dat tot vandaag stroomt. Dit is de beloning van volhouden.",
      "Zeven keer leg je de weg af: begin bij Safa en eindig — bij de zevende keer — bij Marwa. Mannen versnellen even tussen de twee groene lichten." ],
  6:[ "Dit is het hart van de Hajj. De Profeet ﷺ zei het kort: 'De Hajj ís Arafat.' Wie deze dag hier staat, heeft de Hajj.",
      "Voor je ligt Jabal al-Rahma, de Berg van Genade, waar de afscheidspreek werd gehouden. Volg het baken naar boven.",
      "Sta hier tot zonsondergang, handen geheven. Vandaag daalt de vergeving als regen — vraag, en blijf vragen. Op geen enkele dag bevrijdt Allah meer mensen van het Vuur dan vandaag." ],
  7:[ "Na zonsondergang trekken we verder naar Muzdalifah. Hier is geen tent, geen luxe — alleen jij, de open hemel en de sterren.",
      "Rust uit, want morgen is een lange dag. En raap voor je slaapt wat steentjes; die heb je nodig voor de jamarat.",
      "Kijk eens omhoog. Onder dezelfde sterren rustten de profeten voor jou." ],
  8:[ "Het is ochtend. Hier weerstond Ibrahim ﷺ de influistering van de shaytaan die hem van Allahs bevel wilde afhouden — en wierp stenen.",
      "Wij doen het hem na: zeven steentjes naar de pijler, bij elke worp 'Allahu Akbar'. Het is geen woede tegen een steen, maar jouw eigen 'nee' tegen het kwaad.",
      "Blijf rustig, duw niemand. Kracht zit in beheersing, niet in haast." ],
  9:[ "Het is de dag van Eid al-Adha. Eerst regel je je offerdier, de Hadi — in navolging van Ibrahim ﷺ; het vlees gaat naar wie het nodig heeft.",
      "Daarna naar de kapper. Mannen scheren het hoofd kaal (halq) of korten het in (taqsir); vrouwen knippen een klein stukje van hun haar, zo'n vingertopje lang.",
      "Met die knip kom je deels uit ihraam — de meeste verboden vervallen weer; alleen de omgang met je echtgenoot blijft nog tot na de Tawaf al-Ifada. Het voelt als een nieuw begin." ],
  10:[ "We keren terug naar de Ka'ba voor de Tawaf al-Ifada — een kernzuil van de Hajj. Opnieuw zeven ronden, nu uit ihraam.",
       "Voel het verschil met de eerste keer: toen kwam je vol verlangen, nu kom je vervuld — na Arafat, Muzdalifah en Mina.",
       "Is dit meteen je afscheidstawaf? Dan is het je laatste daad in Mekka: een groet aan het Huis voordat je vertrekt." ],
  11:[ "Welkom in Medina, al-Munawwarah, de Verlichte Stad. Let op: dit bezoek is een geliefde ziyarah, maar geen onderdeel van de Hajj zelf.",
       "Naast de moskee ligt al-Baqi, waar veel metgezellen rusten. Groet hen met vrede: 'As-salāmu ʿalaykum, bewoners van deze plaats.'",
       "Ga dan de moskee van de Profeet ﷺ binnen via Bab as-Salam, de Poort van Vrede — rustig, met ingehouden stem." ],
  12:[ "We staan in de gebedshal van de Profeet ﷺ. Tussen zijn kamer en zijn preekstoel ligt de Rawda, die hij 'een tuin van de tuinen van het Paradijs' noemde — je herkent haar aan het groene tapijt.",
       "Bid hier rustig twee rak'ah, als de drukte het toelaat. Haast je niet; dit is een plek om stil te worden.",
       "Geef daarna salam aan de Profeet ﷺ bij het gouden traliewerk — zacht en eerbiedig. De groet bereikt hem." ],
  13:[ "Tot slot Quba — de allereerste moskee van de islam, met eigen handen gebouwd door de Profeet ﷺ toen hij in Medina aankwam.",
       "Hij ﷺ zei: wie zich thuis reinigt, hierheen komt en twee rak'ah bidt, krijgt de beloning van een Umrah. Een klein bezoek, een grote gift.",
       "Bid je twee rak'ah, en sluit dan deze gezegende reis af." ],
  14:[ "En dan... ben je weer thuis. Dezelfde voordeur, dezelfde mensen — maar jij bent niet meer dezelfde.",
       "De Profeet ﷺ zei: wie de Hajj verricht zonder grofheid of zonde, keert terug rein als de dag dat zijn moeder hem baarde.",
       "Moge Allah jouw Hajj aanvaarden. Tot ziens, hajji — en wie weet, tot de volgende keer." ]
};
window.NARRATION=NARRATION;

// ============================================================
//  GESPROKEN OVERRIDES — voor regels met Arabische termen/du'a:
//  het scherm toont de leesbare transliteratie (NARRATION), maar de
//  TTS spreekt het Arabisch in ARABISCH SCHRIFT uit (authentiek).
//  Sleutel = "scene_regelindex". Gebruikt door tools/narration_tts.py.
// ============================================================
const NARRATION_SAY = {
  '0_1': "Voel je hart maar — daar, in alle rust, maak je je intentie. De Niyyah leeft in je hart; daar komt het op aan. Velen spreken er straks bij de Miqaat ook woorden bij, zoals لَبَّيْكَ حَجًّا — maar de kern is je stille besluit: o Allah, voor U onderneem ik deze reis.",
  '2_2': "En dan, uit duizenden monden tegelijk: لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ — Hier ben ik, o Allah, hier ben ik. Zeg het mee.",
  '4_2': "Tussen الرُّكْن اليَمَانِي en de الحَجَر الأَسْوَد zeg je: رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ — Heer, geef ons het goede in dit leven én in het hiernamaals, en bescherm ons tegen het Vuur.",
  '6_0': "Dit is het hart van de Hajj. De Profeet zei het kort: الحَجُّ عَرَفَة — de Hajj ís Arafat. Wie deze dag hier staat, heeft de Hajj.",
  '11_1': "Naast de moskee ligt al-Baqi, waar veel metgezellen rusten. Groet hen met vrede: السَّلَامُ عَلَيْكُمْ يَا أَهْلَ الدِّيَارِ."
};
window.NARRATION_SAY=NARRATION_SAY;

// ============================================================
//  GidsAudio — speelt ingesproken narratie (VoxCPM) als de clip
//  bestaat; anders blijft de tekst-auto-advance werken (stil).
//  Bestanden: assets/audio/gids/scene{N}_{i}.wav  (zie tools/narration_tts.py)
// ============================================================
const GidsAudio = {
  cur:null, on:true, base:'assets/audio/gids/', ext:'.mp3',     // gecomprimeerd voor het web
  play(scene,idx){
    this.stop(); if(!this.on)return;
    const a=new Audio(this.base+'scene'+scene+'_'+idx+this.ext);
    this.cur=a;
    a.addEventListener('playing',()=>{ if(window.Gids)clearTimeout(Gids.timer); });   // audio stuurt het tempo
    a.addEventListener('ended',()=>{ if(this.cur===a && window.Gids)Gids.next(); });
    a.addEventListener('error',()=>{});                                               // clip ontbreekt → tekst-only
    a.play().catch(()=>{});
  },
  stop(){ if(this.cur){ try{this.cur.pause();}catch(e){} this.cur=null; } }
};
window.GidsAudio=GidsAudio;
