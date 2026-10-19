// Leerlingenapp: aanmelden, leerpad, theorie, voorbeelden, oefenen, test.
(() => {
  const app = document.getElementById('app');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = (s, d) => W.tex(s, d);

  const S = {
    token: API.sessie.get('ll-token'),
    status: null, view: 'login', deel: null, tab: 'theorie',
    oef: {}, test: null, fout: '', bezig: false,
  };

  // ---------- algemene hulp
  function info(nr) {
    const st = S.status, d = DELEN.find(x => x.nr === nr);
    const geslaagd = st.geslaagd.includes(nr);
    const open = nr === 1 || st.geslaagd.includes(nr - 1) || st.vrijgegeven.includes(nr);
    const testen = st.testen.filter(t => t.deel === nr);
    const bezig = testen.find(t => t.status === 'bezig');
    const ingediend = testen.filter(t => t.status === 'ingediend');
    const over = (st.toegestaan[nr] || 1) - testen.length;
    const oef = st.oefeningen[nr] || { aantal: 0, juist: 0 };
    const beste = ingediend.reduce((b, t) => (!b || t.score > b.score ? t : b), null);
    return { d, geslaagd, open, testen, bezig, ingediend, over, oef, beste, laatste: ingediend[ingediend.length - 1] };
  }
  const nodig = (max) => Math.ceil(S.status.drempel * max / 100);

  async function roep(fn, params) {
    try { return await API.call(fn, { p_token: S.token, ...params }); }
    catch (e) {
      if (e.code === 'SESSIE_VERLOPEN') { afmelden(true); }
      throw e;
    }
  }
  function afmelden(verlopen) {
    if (!verlopen && S.token) API.call('ll_logout', { p_token: S.token }).catch(() => {});
    API.sessie.del('ll-token');
    Object.assign(S, { token: null, status: null, view: 'login', test: null, oef: {}, fout: verlopen ? 'Je sessie is verlopen. Meld je opnieuw aan.' : '' });
    render();
  }

  function modaal(titel, html, knoppen) {
    return new Promise(res => {
      const m = document.createElement('div');
      m.className = 'modaal-achter';
      m.innerHTML = `<div class="modaal" role="dialog" aria-modal="true"><h2>${titel}</h2>${html}<div class="knoppen" style="justify-content:flex-end"></div></div>`;
      const k = m.querySelector('.knoppen');
      knoppen.forEach(([tekst, waarde, klasse]) => {
        const b = document.createElement('button'); b.textContent = tekst; if (klasse) b.className = klasse;
        b.onclick = () => { m.remove(); res(waarde); }; k.appendChild(b);
      });
      document.body.appendChild(m); W.renderIn(m);
      k.lastChild.focus();
    });
  }

  // ---------- weergave
  function kop() {
    const naam = S.status ? `${esc(S.status.leerling.voornaam)} ${esc(S.status.leerling.naam)}` : '';
    return `${API.DEMO ? '<div class="demo-band">DEMO — gegevens blijven enkel in deze browser · leerling: demo / demo · <a href="leerkracht.html">naar de leerkrachtpagina</a></div>' : ''}
      <header class="balk"><div class="streep"></div>
        <div class="logo">${esc(CONFIG.TITEL)}<small>${esc(CONFIG.ONDERTITEL)}</small></div>
        ${S.status ? `<div class="rechts"><span>${naam}</span>
          ${S.view !== 'pad' ? '<button class="licht" data-a="pad">Leerpad</button>' : ''}
          <button class="licht" data-a="afmelden">Afmelden</button></div>` : ''}
      </header>`;
  }

  function render() {
    let inhoud = '';
    if (S.view === 'login') inhoud = vLogin();
    else if (S.view === 'pad') inhoud = vPad();
    else if (S.view === 'deel') inhoud = vDeel();
    app.innerHTML = kop() + `<main>${inhoud}</main>`;
    W.renderIn(app);
    koppel();
  }

  function vLogin() {
    return `<div class="login kaart">
      <h1>Aanmelden</h1>
      <p class="klein midden">Gebruik de gebruikersnaam en het wachtwoord dat je van je leerkracht kreeg.</p>
      ${S.fout ? `<div class="melding fout">${esc(S.fout)}</div>` : ''}
      <form id="loginform">
        <label for="gn">Gebruikersnaam</label><input type="text" id="gn" autocomplete="username" autocapitalize="none" spellcheck="false" required>
        <label for="pw">Wachtwoord</label><input type="password" id="pw" autocomplete="current-password" required>
        <div style="margin-top:16px"><button type="submit" style="width:100%" ${S.bezig ? 'disabled' : ''}>Aanmelden</button></div>
      </form></div>`;
  }

  function stapKnop(d) {
    const i = info(d.nr);
    let klasse = 'dicht', etiket = '<span class="etiket grijs">🔒 Vergrendeld</span>', klik = false;
    if (!d.klaar) { etiket = '<span class="etiket grijs">Binnenkort</span>'; }
    else if (i.geslaagd) { klasse = 'geslaagd'; etiket = `<span class="etiket groen">✓ Geslaagd ${i.beste ? i.beste.score + '/' + i.beste.max : ''}</span>`; klik = true; }
    else if (i.open) {
      klasse = 'open'; klik = true;
      if (i.bezig) etiket = '<span class="etiket oranje">Test bezig</span>';
      else if (i.over <= 0) etiket = '<span class="etiket rood">Oefen verder</span>';
      else etiket = '<span class="etiket oranje">Nu aan de beurt</span>';
    }
    const binnen = `<div class="nr">${i.geslaagd ? '✓' : d.nr}</div>
      <div><div class="titel">Deel ${d.nr}: ${esc(d.titel)}</div><div class="sub">${esc(d.kort)}</div></div>${etiket}`;
    return klik && d.klaar ? `<button class="stap ${klasse}" data-a="deel" data-nr="${d.nr}">${binnen}</button>` : `<div class="stap ${klasse}">${binnen}</div>`;
  }

  function vPad() {
    const st = S.status;
    const totaal = DELEN.filter(d => d.klaar).length;
    const gesl = st.geslaagd.length;
    return `<h1>Dag ${esc(st.leerling.voornaam)}!</h1>
      <p>Werk de delen één voor één af: lees de theorie, bekijk de voorbeelden, oefen zoveel je wil en maak dan de test.
      Haal je <b>${st.drempel}%</b>, dan gaat het volgende deel open.</p>
      <p class="klein">Geslaagd: ${gesl} van ${DELEN.length} delen${totaal < DELEN.length ? ` · nog niet alle delen zijn beschikbaar` : ''}.</p>
      <div class="groep-titel">A · n-de machtswortels en rationale exponenten</div>
      <div class="pad">${DELEN.filter(d => d.nr <= 7).map(stapKnop).join('')}</div>
      <div class="groep-titel">B · Logaritmen</div>
      <div class="pad">${DELEN.filter(d => d.nr >= 8).map(stapKnop).join('')}</div>`;
  }

  function vDeel() {
    const d = DELEN.find(x => x.nr === S.deel);
    const tabs = [['theorie', 'Theorie'], ['voorbeelden', 'Voorbeelden'], ['oefenen', 'Oefenen'], ['test', 'Test']];
    let inhoud = '';
    if (S.tab === 'theorie') inhoud = d.theorie + `<div class="knoppen"><button data-a="tab" data-tab="voorbeelden">Verder naar de voorbeelden →</button></div>`;
    if (S.tab === 'voorbeelden') inhoud = vVoorbeelden(d);
    if (S.tab === 'oefenen') inhoud = vOefenen(d);
    if (S.tab === 'test') inhoud = vTest(d);
    return `<p class="klein"><button class="link" data-a="pad">← Leerpad</button></p>
      <h1>Deel ${d.nr}: ${esc(d.titel)}</h1>
      <div class="tabs">${tabs.map(([k, l], i) => `<button class="tab ${S.tab === k ? 'actief' : ''}" data-a="tab" data-tab="${k}"><span class="stapnr">${i + 1}</span>${l}</button>`).join('')}</div>
      ${inhoud}`;
  }

  // ---------- voorbeelden
  const vbStap = {};
  function vVoorbeelden(d) {
    return `<p>Probeer elk voorbeeld eerst zelf. Klik daarna stap voor stap door de oplossing.</p>` +
      d.voorbeelden.map((v, i) => {
        const k = d.nr + '-' + i, n = vbStap[k] || 0;
        return `<div class="vb"><div class="opgave"><b>Voorbeeld ${i + 1}.</b> &nbsp; ${T(v.tex)}</div>
          <div class="stappen">${v.stappen.slice(0, n).map(s => `<div>${T(s)}</div>`).join('')}</div>
          ${n < v.stappen.length ? `<div style="margin-top:8px"><button class="licht" data-a="vbstap" data-k="${k}">${n === 0 ? 'Toon de oplossing' : 'Volgende stap'}</button></div>` : ''}
        </div>`;
      }).join('') + `<div class="knoppen"><button data-a="tab" data-tab="oefenen">Zelf oefenen →</button></div>`;
  }

  // ---------- oefenen
  function oefState(d) {
    if (!S.oef[d.nr]) S.oef[d.nr] = { soort: 'alles', vraag: null, w: null, nagekeken: null, n: 0, j: 0, reeks: [], melding: '' };
    const o = S.oef[d.nr];
    if (!o.vraag) nieuweVraag(d, o);
    return o;
  }
  function nieuweVraag(d, o) {
    let v, i = 0;
    do { v = d.soorten[o.soort === 'alles' ? W.gewogen(d.oefenMix) : o.soort].gen(); }
    while (o.vraag && v.tex === o.vraag.tex && i++ < 20);
    Object.assign(o, { vraag: v, w: Antwoord.leeg(v), nagekeken: null, melding: '' });
  }
  const opdracht = (d, v) => v.opdracht || d.opdracht || 'Bereken.';
  const uitlegHTML = (v) => [].concat(v.uitleg || []).map(u => `<div class="uitlegregel">${T(u)}</div>`).join('');

  // deel 1: getal + knop "bestaat niet"
  function invoerVeld(id, waarde, bn, uit) {
    return `<input type="text" id="${id}" value="${esc(bn ? '' : waarde)}" placeholder="${bn ? 'bestaat niet' : 'antwoord'}" inputmode="text" autocomplete="off" spellcheck="false" ${bn || uit ? 'disabled' : ''}>
      <button class="bn ${bn ? 'aan' : ''}" data-a="bn" data-id="${id}" ${uit ? 'disabled' : ''} title="Klik als de wortel niet bestaat">bestaat niet</button>`;
  }
  function widget(id, v, w, uit) {
    if (Antwoord.isOud(v)) return `<div class="antwoordrij"><span class="is">${T('=')}</span>${invoerVeld(id, w.invoer, w.bn, uit)}</div>`;
    return Antwoord.html(id, v, w, uit);
  }

  function vOefenen(d) {
    const o = oefState(d), i = info(d.nr), v = o.vraag;
    const laatste10 = o.reeks.slice(-10);
    const klaarVoorTest = laatste10.length >= 10 && laatste10.filter(Boolean).length >= 8 && !i.geslaagd && (i.over > 0 || i.bezig);
    let fb = '';
    const n = o.nagekeken;
    if (n) {
      if (n.status === 'juist') fb = `<div class="feedback j"><div class="kop">✓ Juist!</div>${uitlegHTML(v)}</div>`;
      else if (n.status === 'vorm') fb = `<div class="feedback f"><div class="kop">✗ Bijna. ${esc(n.bericht)}</div><div>Juiste antwoord: ${T(W.antwoordTex(v.antw))}</div>${uitlegHTML(v)}</div>`;
      else fb = `<div class="feedback f"><div class="kop">✗ Niet juist. Het juiste antwoord is ${T(W.antwoordTex(v.antw))}.</div>${uitlegHTML(v)}</div>`;
    }
    return `<div class="oef-boven">
        <div><label for="soort">Soort oefeningen</label>
          <select id="soort">${[['alles', 'Alles door elkaar'], ...Object.entries(d.soorten).map(([k, s]) => [k, s.naam])].map(([k, l]) => `<option value="${k}" ${o.soort === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
        <div class="teller"><span>Deze keer: <b>${o.j}</b> juist van <b>${o.n}</b></span>
          <span class="bolletjes" title="Je laatste 10 oefeningen">${Array.from({ length: 10 }, (_, k) => { const r = laatste10[k]; return `<span class="bol ${r === true ? 'j' : r === false ? 'f' : ''}"></span>`; }).join('')}</span></div>
      </div>
      ${klaarVoorTest ? `<div class="melding ok">Je had 8 of meer van je laatste 10 oefeningen juist. Je lijkt klaar voor de test! <button class="link" data-a="tab" data-tab="test">Naar de test →</button></div>` : ''}
      <div class="kaart">
        <div class="klein midden">${esc(opdracht(d, v))}</div>
        <div class="opgave-groot">${T(v.tex, false)}</div>
        ${widget('oefin', v, o.w, !!n)}
        ${!n && Antwoord.heeftToetsenbord(v) ? Antwoord.toetsenbord() : ''}
        ${o.melding ? `<div class="melding let midden">${esc(o.melding)}</div>` : ''}
        ${fb}
        <div class="knoppen">${n ? '<button class="oranje" data-a="volgende" id="volgende">Volgende oefening →</button>' : '<button data-a="controleer">Controleer</button>'}</div>
      </div>
      <p class="klein midden">Je hebt in totaal al ${i.oef.aantal} oefeningen van dit deel gemaakt.</p>`;
  }

  async function controleer() {
    const d = DELEN.find(x => x.nr === S.deel), o = S.oef[d.nr], v = o.vraag;
    if (Antwoord.isOud(v)) { const veld = document.getElementById('oefin'); if (veld && !o.w.bn) o.w.invoer = veld.value; }
    else Antwoord.lees('oefin', v, o.w);
    const r = Antwoord.nakijk(v, o.w);
    if (r.status === 'leeg' || r.status === 'ongeldig') { o.melding = r.bericht; return render(); }
    const juist = r.status === 'juist';
    o.nagekeken = r; o.melding = ''; o.n++; if (juist) o.j++; o.reeks.push(juist);
    const oe = (S.status.oefeningen[d.nr] ||= { aantal: 0, juist: 0 }); oe.aantal++; if (juist) oe.juist++;
    render();
    const knop = document.getElementById('volgende'); if (knop) knop.focus();
    roep('ll_oefening', { p_deel: d.nr, p_soort: v.soort, p_juist: juist }).catch(() => {});
  }

  // ---------- test
  function vTest(d) {
    const i = info(d.nr);
    const t = S.test && S.test.deel === d.nr ? S.test : null;
    if (t && t.resultaat) return vResultaat(d, t);
    if (t) return vTestBezig(d, t);
    if (i.geslaagd) {
      const volgende = DELEN.find(x => x.nr === d.nr + 1);
      return `<div class="kaart midden"><div class="score-groot j">${i.beste.score}/${i.beste.max}</div>
        <p>Je bent geslaagd voor de test van dit deel. Goed gedaan!</p>
        ${volgende && volgende.klaar ? `<button data-a="deel" data-nr="${volgende.nr}">Naar deel ${volgende.nr} →</button>` : volgende ? '<p class="klein">Het volgende deel komt binnenkort online.</p>' : '<p><b>Je hebt het hele leerpad afgewerkt!</b></p>'}</div>`;
    }
    if (i.bezig) {
      return `<div class="kaart"><h2>Je test is nog bezig</h2><p>Je bent deze test al gestart. Ga verder waar je gebleven was.</p>
        <div class="knoppen"><button class="oranje" data-a="teststart">Ga verder met de test</button></div></div>`;
    }
    if (i.over <= 0) {
      const l = i.laatste;
      return `<div class="kaart"><h2>Test gemaakt</h2>
        <p>Je behaalde <b>${l.score}/${l.max}</b>. Je hebt minstens <b>${nodig(l.max)}/${l.max}</b> nodig.</p>
        <div class="melding let">Oefen verder op dit deel. Als je klaar bent, vraag je aan je leerkracht om de test opnieuw open te zetten.</div>
        <div class="knoppen"><button data-a="tab" data-tab="oefenen">Verder oefenen</button></div></div>`;
    }
    const aantal = d.test.reduce((s, x) => s + x[1], 0);
    return `<div class="kaart"><h2>Test deel ${d.nr}</h2>
      <ul class="regels">
        <li>De test bestaat uit <b>${aantal} vragen</b>.</li>
        <li>Je hebt minstens <b>${nodig(aantal)}/${aantal}</b> (${S.status.drempel}%) nodig om naar het volgende deel te gaan.</li>
        <li>Je kan de test <b>maar één keer</b> maken. Zodra je start, telt je poging, ook als je de pagina sluit.</li>
        <li>Gebruik geen rekentoestel. Neem een kladblad om je tussenstappen te noteren.</li>
        <li>Een antwoord dat klopt maar niet in de gevraagde vorm staat (bv. niet vereenvoudigd), telt als fout.</li>
      </ul>
      ${i.ingediend.length ? `<p class="klein">Je leerkracht heeft de test opnieuw opengezet. Vorige score: ${i.laatste.score}/${i.laatste.max}.</p>` : ''}
      <div class="melding info">Twijfel je nog? <button class="link" data-a="tab" data-tab="oefenen">Oefen eerst nog wat</button>.</div>
      <div class="knoppen"><button class="oranje" data-a="teststart">Start de test</button></div></div>`;
  }

  function vTestBezig(d, t) {
    const beantwoord = t.vragen.filter((v, k) => Antwoord.isIngevuld(v, t.antw[k])).length;
    const kbd = t.vragen.some(v => Antwoord.heeftToetsenbord(v));
    let vorige = '';
    return `<div class="melding info" id="testteller">Test deel ${d.nr} · ${beantwoord} van ${t.vragen.length} vragen beantwoord. Je antwoorden worden bijgehouden tot je indient.</div>
      <div class="kaart">
      ${t.vragen.map((v, k) => {
        const o = opdracht(d, v), toon = o !== vorige; vorige = o;
        return `<div class="testvraag blok"><div class="vnr">${k + 1}.</div>
          <div class="inhoud-blok">${toon ? `<div class="klein">${esc(o)}</div>` : ''}
            <div class="opg">${T(v.tex)}</div>${widget('t' + k, v, t.antw[k], false)}</div></div>`;
      }).join('')}
      ${kbd ? `<div class="toetsenbord-plakker">${Antwoord.toetsenbord()}</div>` : ''}
      <div class="knoppen"><button class="oranje" data-a="indienen">Test indienen</button></div></div>`;
  }

  function vResultaat(d, t) {
    const r = t.resultaat;
    const volgende = DELEN.find(x => x.nr === d.nr + 1);
    return `<div class="kaart midden">
        <div class="score-groot ${r.geslaagd ? 'j' : 'f'}">${r.score}/${r.max}</div>
        ${r.geslaagd
          ? `<p><b>Proficiat, je bent geslaagd!</b> ${volgende ? `Deel ${volgende.nr} is nu open.` : 'Je hebt het hele leerpad afgewerkt!'}</p>
             ${volgende && volgende.klaar ? `<button data-a="deel" data-nr="${volgende.nr}">Naar deel ${volgende.nr} →</button>` : ''}`
          : `<p>Je had minstens ${nodig(r.max)}/${r.max} nodig. Bekijk hieronder je fouten en oefen verder. Je leerkracht kan de test daarna opnieuw openzetten.</p>
             <button data-a="tab" data-tab="oefenen">Verder oefenen</button>`}
      </div>
      <h2>Verbetering</h2>
      <div class="kaart">${t.vragen.map((v, k) => {
        const a = r.details[k];
        const jouw = a.gegevenTex ? T(a.gegevenTex) : esc(a.gegeven);
        return `<div class="testvraag blok ${a.juist ? 'j' : 'f'}"><div class="vnr">${a.juist ? '✓' : '✗'}</div>
          <div class="inhoud-blok"><div class="opg">${T(v.tex)}</div>
          <div>Juiste antwoord: ${T(W.antwoordTex(v.antw))}</div>
          <div class="klein">Jouw antwoord: ${jouw}${a.bericht ? ` · <i>${esc(a.bericht)}</i>` : ''}</div>
          ${a.juist ? '' : `<div class="klein">${uitlegHTML(v)}</div>`}</div></div>`;
      }).join('')}</div>`;
  }

  function testOpslaan() { if (S.test && !S.test.resultaat) API.sessie.set('test-' + S.test.id, JSON.stringify(S.test.antw)); }
  function leesTestInvoer() {
    if (!S.test || S.test.resultaat) return;
    S.test.vragen.forEach((v, k) => {
      const w = S.test.antw[k];
      if (Antwoord.isOud(v)) { const el = document.getElementById('t' + k); if (el && !w.bn) w.invoer = el.value; }
      else Antwoord.lees('t' + k, v, w);
    });
    testOpslaan();
  }

  async function testStart() {
    const d = DELEN.find(x => x.nr === S.deel), i = info(d.nr);
    if (!i.bezig) {
      const ok = await modaal('Test starten?', '<p>Je kan deze test maar <b>één keer</b> maken. Zodra je start, telt je poging.</p>', [['Nog niet', false, 'licht'], ['Start de test', true, 'oranje']]);
      if (!ok) return;
    }
    try {
      const r = await roep('ll_test_start', { p_deel: d.nr, p_vragen: maakTest(d) });
      let antw = null;
      try { antw = JSON.parse(API.sessie.get('test-' + r.id)); } catch (e) { }
      if (!Array.isArray(antw) || antw.length !== r.vragen.length) antw = r.vragen.map(v => Antwoord.leeg(v));
      S.test = { id: r.id, deel: d.nr, vragen: r.vragen, antw };
      S.status = await roep('ll_status', {});
      render();
    } catch (e) { await modaal('Dat lukte niet', `<p>${esc(e.message)}</p>`, [['OK', true]]); S.status = await roep('ll_status', {}).catch(() => S.status); render(); }
  }

  async function indienen() {
    leesTestInvoer();
    const t = S.test;
    const resultaten = t.vragen.map((v, k) => Antwoord.nakijk(v, t.antw[k]));
    const open = resultaten.filter(r => r.status === 'leeg').length;
    const ongeldig = resultaten.filter(r => r.status === 'ongeldig').length;
    let waarschuwing = '';
    if (open) waarschuwing += `<div class="melding let">Je hebt nog <b>${open}</b> ${open === 1 ? 'vraag' : 'vragen'} niet (volledig) beantwoord.</div>`;
    if (ongeldig) waarschuwing += `<div class="melding let"><b>${ongeldig}</b> ${ongeldig === 1 ? 'antwoord kan' : 'antwoorden kunnen'} niet gelezen worden en ${ongeldig === 1 ? 'telt' : 'tellen'} als fout. Kijk naar het voorbeeld onder het invulvak.</div>`;
    const ok = await modaal('Test indienen?', `${waarschuwing}<p>Na het indienen kan je niets meer veranderen.</p>`, [['Terug naar de test', false, 'licht'], ['Indienen', true, 'oranje']]);
    if (!ok) return;
    const details = t.vragen.map((v, k) => {
      const g = Antwoord.gegeven(v, t.antw[k]), r = resultaten[k];
      const d = { gegeven: g.tekst, juist: r.status === 'juist' };
      if (g.tex) d.gegevenTex = g.tex;
      if (r.status === 'vorm' || r.status === 'ongeldig') d.bericht = r.bericht;
      return d;
    });
    const score = details.filter(x => x.juist).length;
    try {
      const r = await roep('ll_test_indienen', { p_test: t.id, p_antwoorden: details, p_score: score });
      API.sessie.del('test-' + t.id);
      t.resultaat = { score: r.score, max: r.max, geslaagd: r.geslaagd, details };
      S.status = r.status;
      render(); window.scrollTo(0, 0);
    } catch (e) { await modaal('Indienen mislukt', `<p>${esc(e.message)}</p><p>Je antwoorden zijn bewaard. Probeer opnieuw.</p>`, [['OK', true]]); }
  }

  // ---------- events
  function koppel() {
    const f = document.getElementById('loginform');
    if (f) f.onsubmit = async (e) => {
      e.preventDefault();
      S.bezig = true; S.fout = '';
      try {
        const r = await API.call('ll_login', { p_gebruikersnaam: document.getElementById('gn').value, p_wachtwoord: document.getElementById('pw').value });
        S.token = r.token; S.status = r.status; API.sessie.set('ll-token', r.token); S.view = 'pad';
      } catch (err) { S.fout = err.message; }
      S.bezig = false; render();
      if (S.view === 'login') document.getElementById('gn').focus();
    };

    const sel = document.getElementById('soort');
    if (sel) sel.onchange = () => { const d = DELEN.find(x => x.nr === S.deel), o = S.oef[d.nr]; o.soort = sel.value; nieuweVraag(d, o); render(); };

    const d = S.view === 'deel' ? DELEN.find(x => x.nr === S.deel) : null;
    if (d && S.tab === 'oefenen' && S.oef[d.nr]) {
      const o = S.oef[d.nr], v = o.vraag;
      if (Antwoord.isOud(v)) {
        const oefin = document.getElementById('oefin');
        if (oefin) {
          oefin.oninput = () => { o.w.invoer = oefin.value; };
          oefin.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); controleer(); } };
          if (!oefin.disabled) oefin.focus({ preventScroll: true });
        }
      } else if (!o.nagekeken) {
        const eerste = Antwoord.koppel('oefin', v, o.w, { bijEnter: controleer });
        if (eerste && !eerste.disabled) eerste.focus({ preventScroll: true });
      }
    }
    Antwoord.koppelToetsenbord(app);
    const vk = document.getElementById('volgende');
    if (vk) vk.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); vk.click(); } };

    if (S.test && !S.test.resultaat && S.tab === 'test') {
      const t = S.test;
      const telBij = () => {
        const n = t.vragen.filter((v, k) => Antwoord.isIngevuld(v, t.antw[k])).length;
        const el = document.getElementById('testteller');
        if (el) el.textContent = `Test deel ${t.deel} · ${n} van ${t.vragen.length} vragen beantwoord. Je antwoorden worden bijgehouden tot je indient.`;
        testOpslaan();
      };
      t.vragen.forEach((v, k) => {
        const w = t.antw[k];
        const naar = () => { const n = document.querySelector(`#t${k + 1}, #t${k + 1}-0`); if (n && !n.disabled) n.focus(); };
        if (Antwoord.isOud(v)) {
          const el = document.getElementById('t' + k);
          if (el) {
            el.oninput = () => { w.invoer = el.value; telBij(); };
            el.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); naar(); } };
          }
        } else Antwoord.koppel('t' + k, v, w, { bijWijziging: telBij, bijEnter: naar });
      });
    }

    app.querySelectorAll('[data-a]').forEach(el => el.onclick = async () => {
      const a = el.dataset.a;
      if (a === 'afmelden') return afmelden(false);
      if (a === 'pad') { leesTestInvoer(); S.view = 'pad'; if (S.test && S.test.resultaat) S.test = null; return render(); }
      if (a === 'deel') { leesTestInvoer(); S.view = 'deel'; S.deel = +el.dataset.nr; S.tab = 'theorie'; if (S.test && (S.test.resultaat || S.test.deel !== S.deel)) S.test = null; render(); return window.scrollTo(0, 0); }
      if (a === 'tab') {
        leesTestInvoer(); S.tab = el.dataset.tab;
        if (S.tab === 'test' && !S.test && info(S.deel).bezig) { return testStart(); }
        if (S.tab !== 'test' && S.test && S.test.resultaat) S.test = null;
        render(); return window.scrollTo(0, 0);
      }
      if (a === 'vbstap') { vbStap[el.dataset.k] = (vbStap[el.dataset.k] || 0) + 1; return render(); }
      if (a === 'controleer') return controleer();
      if (a === 'volgende') { const d = DELEN.find(x => x.nr === S.deel); nieuweVraag(d, S.oef[d.nr]); return render(); }
      if (a === 'bn') {
        const id = el.dataset.id;
        if (id === 'oefin') { const o = S.oef[S.deel]; o.w.bn = !o.w.bn; o.melding = ''; return render(); }
        leesTestInvoer();
        const k = +id.slice(1); S.test.antw[k].bn = !S.test.antw[k].bn; testOpslaan(); return render();
      }
      if (a === 'teststart') return testStart();
      if (a === 'indienen') return indienen();
    });
  }

  // ---------- start
  (async () => {
    if (S.token) {
      try { S.status = await API.call('ll_status', { p_token: S.token }); S.view = 'pad'; }
      catch (e) { API.sessie.del('ll-token'); S.token = null; }
    }
    render();
  })();
})();
