// Leerkrachtenpagina: leerlingen beheren, testen heropenen, rapporten downloaden.
(() => {
  const app = document.getElementById('app');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = (s) => W.tex(s);
  const KLAAR = DELEN.filter(d => d.klaar);

  const S = { token: API.sessie.get('lk-token'), view: 'login', data: null, detail: null, nieuw: null, fout: '', melding: '' };

  // ---------- hulp
  const datum = (iso, metUur = true) => iso ? new Date(iso).toLocaleString('nl-BE', metUur ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  const pct = (j, n) => n ? Math.round(100 * j / n) + '%' : '—';
  const vandaag = () => new Date().toLocaleDateString('sv-SE');
  const bestandsnaam = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const gebruikersnaamVoor = (vn, n) => (n ? vn + '.' + n : vn).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9.]/g, '');

  function info(st, nr) {
    const geslaagd = st.geslaagd.includes(nr);
    const viaTest = nr === 1 || st.geslaagd.includes(nr - 1);
    const vrij = st.vrijgegeven.includes(nr);
    const open = viaTest || vrij;
    const testen = st.testen.filter(t => t.deel === nr);
    const bezig = testen.find(t => t.status === 'bezig');
    const ingediend = testen.filter(t => t.status === 'ingediend');
    const over = (st.toegestaan[nr] || 1) - testen.length;
    const oef = st.oefeningen[nr] || { aantal: 0, juist: 0 };
    const beste = ingediend.reduce((b, t) => (!b || t.score > b.score ? t : b), null);
    const wacht = open && !geslaagd && !bezig && over <= 0;
    return { geslaagd, open, viaTest, vrij, testen, bezig, ingediend, over, oef, beste, wacht, laatste: ingediend[ingediend.length - 1] };
  }
  function huidig(st) {
    for (const d of KLAAR) { const i = info(st, d.nr); if (!i.geslaagd) return i.open ? d : null; }
    return 'klaar';
  }
  function totaalOef(st) { return Object.values(st.oefeningen).reduce((a, o) => ({ aantal: a.aantal + o.aantal, juist: a.juist + o.juist }), { aantal: 0, juist: 0 }); }
  function statusLabel(i, d) {
    if (!d.klaar) return '<span class="etiket grijs">Nog niet online</span>';
    if (i.geslaagd) return `<span class="etiket groen">✓ Geslaagd (${i.beste.score}/${i.beste.max})</span>`;
    if (!i.open) return '<span class="etiket grijs">Vergrendeld</span>';
    if (i.bezig) return '<span class="etiket oranje">Test bezig</span>';
    if (i.wacht) return '<span class="etiket rood">Test niet geslaagd – wacht op heropenen</span>';
    return `<span class="etiket oranje">Open${i.vrij && !i.viaTest ? ' (door jou vrijgegeven)' : ''}</span>`;
  }

  async function roep(fn, params) {
    try { return await API.call(fn, { p_token: S.token, ...params }); }
    catch (e) { if (e.code === 'SESSIE_VERLOPEN') { API.sessie.del('lk-token'); S.token = null; S.view = 'login'; S.fout = 'Je sessie is verlopen. Meld je opnieuw aan.'; render(); } throw e; }
  }
  function modaal(titel, html, knoppen) {
    return new Promise(res => {
      const m = document.createElement('div'); m.className = 'modaal-achter';
      m.innerHTML = `<div class="modaal"><h2>${titel}</h2>${html}<div class="knoppen" style="justify-content:flex-end"></div></div>`;
      const k = m.querySelector('.knoppen');
      knoppen.forEach(([t, w, c]) => { const b = document.createElement('button'); b.textContent = t; if (c) b.className = c; b.onclick = () => { m.remove(); res(w); }; k.appendChild(b); });
      document.body.appendChild(m); k.lastChild.focus();
    });
  }
  function download(naam, inhoud, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([inhoud], { type }));
    a.download = naam; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv(rijen) {
    const cel = (x) => { const s = String(x ?? ''); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return '﻿' + rijen.map(r => r.map(cel).join(';')).join('\r\n');
  }
  function leerlingLink() { return new URL('index.html', location.href).href.replace(/index\.html$/, ''); }

  // ---------- weergave
  function kop() {
    return `${API.DEMO ? '<div class="demo-band">DEMO — gegevens blijven enkel in deze browser · leerkracht-wachtwoord: demo · <a href="index.html">naar de leerlingenpagina</a></div>' : ''}
      <header class="balk"><div class="streep"></div>
        <div class="logo">${esc(CONFIG.TITEL)}<small>Leerkracht · ${esc(CONFIG.ONDERTITEL)}</small></div>
        ${S.token ? `<div class="rechts">
          ${S.view !== 'overzicht' ? '<button class="licht" data-a="overzicht">Overzicht</button>' : ''}
          <button class="licht" data-a="afmelden">Afmelden</button></div>` : ''}
      </header>`;
  }
  function render() {
    let h = '';
    if (S.view === 'login') h = vLogin();
    if (S.view === 'overzicht') h = vOverzicht();
    if (S.view === 'leerling') h = vLeerling();
    if (S.view === 'toevoegen') h = vToevoegen();
    app.innerHTML = kop() + `<main>${S.melding ? `<div class="melding ok">${S.melding}</div>` : ''}${h}</main>`;
    S.melding = '';
    W.renderIn(app);
    koppel();
  }

  function vLogin() {
    return `<div class="login kaart"><h1>Leerkracht</h1>
      ${S.fout ? `<div class="melding fout">${esc(S.fout)}</div>` : ''}
      <form id="loginform"><label for="pw">Wachtwoord</label><input type="password" id="pw" autocomplete="current-password" required>
      <div style="margin-top:16px"><button type="submit" style="width:100%">Aanmelden</button></div></form></div>`;
  }

  function vOverzicht() {
    const ll = S.data.leerlingen;
    const wachten = ll.filter(l => l.actief && KLAAR.some(d => info(l.status, d.nr).wacht));
    return `<div class="werkbalk"><h1 class="vul" style="margin:0">Leerlingen (${ll.length})</h1>
        <button data-a="toevoegen">+ Leerlingen toevoegen</button>
        <button class="licht" data-a="csv">Overzicht (Excel)</button>
        <button class="licht" data-a="vernieuw">Vernieuwen</button></div>
      <p class="klein">Link voor de leerlingen: <b>${esc(leerlingLink())}</b></p>
      ${wachten.length ? `<div class="melding let"><b>Wachten op heropenen:</b> ${wachten.map(l => {
        const d = KLAAR.find(d => info(l.status, d.nr).wacht);
        return `<button class="link" data-a="leerling" data-id="${l.id}">${esc(l.voornaam)} ${esc(l.naam)}</button> (deel ${d.nr})`;
      }).join(', ')}</div>` : ''}
      ${ll.length === 0 ? '<div class="kaart"><p>Nog geen leerlingen. Klik op <b>+ Leerlingen toevoegen</b>.</p></div>' : `
      <div class="kaart tabelwrap"><table class="lijst">
        <tr><th>Leerling</th><th>Voortgang</th><th>Nu bezig met</th><th>Oefeningen</th><th>Laatst actief</th><th></th></tr>
        ${ll.map(l => {
          const st = l.status, h = huidig(st), tot = totaalOef(st);
          return `<tr class="klik" data-a="leerling" data-id="${l.id}">
            <td><b>${esc(l.naam)} ${esc(l.voornaam)}</b><div class="klein">${esc(l.klas)} · ${esc(l.gebruikersnaam)}${l.actief ? '' : ' · <span class="etiket grijs">gedeactiveerd</span>'}</div></td>
            <td><div class="voortgang">${DELEN.map(d => { const i = info(st, d.nr); return `<span class="${i.geslaagd ? 'g' : i.wacht ? 'w' : (i.open && d.klaar) ? 'b' : ''}" title="Deel ${d.nr}">${d.nr}</span>`; }).join('')}</div></td>
            <td>${h === 'klaar' ? '<span class="etiket groen">Alle beschikbare delen geslaagd</span>' : h ? `Deel ${h.nr}${info(st, h.nr).wacht ? ' <span class="etiket rood">wacht</span>' : ''}` : '—'}</td>
            <td>${tot.aantal} <span class="klein">(${pct(tot.juist, tot.aantal)} juist)</span></td>
            <td class="klein">${datum(l.laatst_actief)}</td>
            <td><button class="licht" data-a="rapport" data-id="${l.id}">Rapport</button></td></tr>`;
        }).join('')}
      </table></div>
      <p class="klein"><span class="voortgang" style="display:inline-flex;vertical-align:middle"><span class="g"></span></span> geslaagd &nbsp;
        <span class="voortgang" style="display:inline-flex;vertical-align:middle"><span class="b"></span></span> open &nbsp;
        <span class="voortgang" style="display:inline-flex;vertical-align:middle"><span class="w"></span></span> test niet geslaagd, wacht op heropenen &nbsp;
        <span class="voortgang" style="display:inline-flex;vertical-align:middle"><span></span></span> vergrendeld / nog niet online</p>`}`;
  }

  function sindsLaatsteTest(det, nr) {
    const i = info(det.status, nr);
    if (!i.laatste) return null;
    const na = det.recent.filter(o => o.deel === nr && new Date(o.tijd) > new Date(i.laatste.ingediend));
    return { aantal: na.length, juist: na.filter(o => o.juist).length };
  }

  function vLeerling() {
    const det = S.detail, l = det.leerling, st = det.status, tot = totaalOef(st), h = huidig(st);
    const delen = DELEN.filter(d => d.klaar || info(st, d.nr).oef.aantal || info(st, d.nr).testen.length);
    return `<p class="klein"><button class="link" data-a="overzicht">← Alle leerlingen</button></p>
      <div class="werkbalk"><h1 class="vul" style="margin:0">${esc(l.voornaam)} ${esc(l.naam)}</h1>
        <button data-a="rapport" data-id="${l.id}">Rapport downloaden (PDF)</button></div>
      <p class="klein">${esc(l.klas)} · gebruikersnaam <b>${esc(l.gebruikersnaam)}</b> · account sinds ${datum(l.aangemaakt, false)}${l.actief ? '' : ' · <b>gedeactiveerd</b>'}</p>
      <div class="cijfers">
        <div class="cijfer"><div class="w">${st.geslaagd.length}/${DELEN.length}</div><div class="l">delen geslaagd</div></div>
        <div class="cijfer"><div class="w">${h === 'klaar' ? '✓ klaar' : h ? 'Deel ' + h.nr : '—'}</div><div class="l">nu bezig met</div></div>
        <div class="cijfer"><div class="w">${tot.aantal}</div><div class="l">oefeningen (${pct(tot.juist, tot.aantal)} juist)</div></div>
        <div class="cijfer"><div class="w" style="font-size:15px">${datum(l.laatst_actief)}</div><div class="l">laatst actief</div></div>
      </div>
      <h2>Per deel</h2>
      ${delen.map(d => {
        const i = info(st, d.nr), sinds = sindsLaatsteTest(det, d.nr);
        const soorten = det.per_soort.filter(s => s.deel === d.nr);
        return `<div class="deelblok"><div class="kop"><b>Deel ${d.nr}: ${esc(d.titel)}</b>${statusLabel(i, d)}</div>
          <p class="klein">Oefeningen: <b>${i.oef.aantal}</b> (${pct(i.oef.juist, i.oef.aantal)} juist)
            ${sinds ? ` · sinds de laatste test: <b>${sinds.aantal}</b> (${pct(sinds.juist, sinds.aantal)} juist)` : ''}
            ${soorten.length ? ' · ' + soorten.map(s => `${esc((d.soorten && d.soorten[s.soort] ? d.soorten[s.soort].naam : s.soort))}: ${s.juist}/${s.aantal}`).join(' · ') : ''}</p>
          ${i.testen.length ? `<table class="lijst"><tr><th>Poging</th><th>Gestart</th><th>Score</th><th>Resultaat</th><th></th></tr>
            ${i.testen.map((t, k) => {
              const vol = det.testen.find(x => x.id === t.id);
              return `<tr><td>${k + 1}</td><td class="klein">${datum(t.gestart)}</td><td>${t.status === 'bezig' ? '—' : `${t.score}/${t.max}`}</td>
                <td>${t.status === 'bezig' ? '<span class="etiket oranje">bezig</span>' : t.geslaagd ? '<span class="etiket groen">geslaagd</span>' : '<span class="etiket rood">niet geslaagd</span>'}</td>
                <td>${t.status === 'ingediend' ? `<button class="link" data-a="toontest" data-id="${t.id}">antwoorden</button>` : ''}</td></tr>
                <tr class="verborgen" id="test-${t.id}"><td colspan="5">${vol ? testDetail(vol) : ''}</td></tr>`;
            }).join('')}</table>` : '<p class="klein">Nog geen test gemaakt.</p>'}
          <div class="knoppen" style="justify-content:flex-start">
            ${d.klaar && i.open && !i.geslaagd && !i.bezig && i.over <= 0 ? `<button class="oranje" data-a="heropen" data-deel="${d.nr}">Test opnieuw openzetten</button>` : ''}
            ${d.klaar && d.nr > 1 && !i.viaTest ? (i.vrij ? `<button class="licht" data-a="vrij" data-deel="${d.nr}" data-aan="0">Vrijgave intrekken</button>` : `<button class="licht" data-a="vrij" data-deel="${d.nr}" data-aan="1">Deel vrijgeven zonder test</button>`) : ''}
          </div></div>`;
      }).join('')}
      ${det.per_dag.length ? `<h2>Activiteit per dag</h2><div class="kaart tabelwrap"><table class="lijst"><tr><th>Dag</th><th>Deel</th><th>Oefeningen</th><th>Juist</th></tr>
        ${det.per_dag.slice().reverse().map(r => `<tr><td>${datum(r.dag, false)}</td><td>${r.deel}</td><td>${r.aantal}</td><td>${pct(r.juist, r.aantal)}</td></tr>`).join('')}</table></div>` : ''}
      <h2>Account</h2>
      <div class="knoppen" style="justify-content:flex-start">
        <button class="licht" data-a="reset">Nieuw wachtwoord</button>
        <button class="licht" data-a="actief" data-aan="${l.actief ? 0 : 1}">${l.actief ? 'Deactiveren' : 'Opnieuw activeren'}</button>
        <button class="rood" data-a="verwijder">Verwijderen</button>
      </div>`;
  }

  function testDetail(t) {
    if (!t.antwoorden) return '';
    return `<div style="padding:6px 0">${t.vragen.map((v, k) => {
      const a = t.antwoorden[k] || {};
      const jouw = a.gegevenTex ? T(a.gegevenTex) : `<b>${esc(a.gegeven)}</b>`;
      return `<div class="klein" style="padding:4px 0">${a.juist ? '✓' : '✗'} ${T(v.tex)} &nbsp;→ juist: ${T(W.antwoordTex(v.antw))} &nbsp;· leerling: ${jouw}${a.bericht ? ` <i>(${esc(a.bericht)})</i>` : ''}</div>`;
    }).join('')}</div>`;
  }

  function vToevoegen() {
    if (S.nieuw) {
      return `<h1>Nieuwe accounts</h1>
        <div class="melding let">Bewaar of druk deze lijst nu af: wachtwoorden zijn later <b>niet meer te zien</b> (je kan ze wel opnieuw instellen).</div>
        <div class="werkbalk"><button data-a="kaartjes">Inlogkaartjes (PDF)</button><button class="licht" data-a="nieuwcsv">Lijst (Excel)</button>
          <span class="vul"></span><button class="licht" data-a="overzicht">Klaar</button></div>
        <div class="kaart tabelwrap"><table class="lijst logins"><tr><th>Naam</th><th>Klas</th><th>Gebruikersnaam</th><th>Wachtwoord</th></tr>
          ${S.nieuw.map(n => `<tr><td>${esc(n.voornaam)} ${esc(n.naam)}</td><td>${esc(n.klas)}</td><td>${esc(n.gebruikersnaam)}</td><td>${esc(n.wachtwoord)}</td></tr>`).join('')}</table></div>`;
    }
    return `<p class="klein"><button class="link" data-a="overzicht">← Alle leerlingen</button></p>
      <h1>Leerlingen toevoegen</h1>
      <div class="kaart">
        <label for="klas">Klas</label><input type="text" id="klas" value="5DOF" style="max-width:200px">
        <label for="namen">Eén leerling per lijn: <b>Voornaam Naam</b> (of <b>Naam, Voornaam</b>)</label>
        <textarea id="namen" rows="8" placeholder="Jan Peeters&#10;Fatima El Amrani&#10;Vermeulen, Lotte"></textarea>
        <div id="voorbeeld" class="klein" style="margin-top:8px"></div>
        <div class="knoppen" style="justify-content:flex-start"><button data-a="maak">Accounts aanmaken</button></div>
      </div>`;
  }

  function leesNamen() {
    const klas = document.getElementById('klas').value.trim();
    return document.getElementById('namen').value.split(/\r?\n/).map(r => r.trim()).filter(Boolean).map(r => {
      let vn, n;
      if (r.includes(',')) { [n, vn] = r.split(',').map(x => x.trim()); }
      else if (r.includes('\t')) { [vn, n] = r.split('\t').map(x => x.trim()); }
      else { const p = r.split(/\s+/); vn = p.shift(); n = p.join(' '); }
      return { voornaam: vn || '', naam: n || '', klas, gebruikersnaam: gebruikersnaamVoor(vn || '', n || '') };
    }).filter(x => x.voornaam);
  }

  // ---------- rapport (PDF)
  function rapportHTML(det) {
    const l = det.leerling, st = det.status, tot = totaalOef(st), h = huidig(st);
    const rij = (cellen, th) => `<tr>${cellen.map(c => `<${th ? 'th' : 'td'}>${c}</${th ? 'th' : 'td'}>`).join('')}</tr>`;
    const delen = DELEN.filter(d => d.klaar || info(st, d.nr).oef.aantal || info(st, d.nr).testen.length);
    const kaal = (s) => s.replace(/<[^>]+>/g, '');
    return `<div class="rapport">
      <style>
        .rapport { font-family: Verdana, sans-serif; color: #1f2733; background: #fff; font-size: 11px; line-height: 1.5; width: 680px; padding: 4px; }
        .rapport .wis { font-family: 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif; font-size: 13px; }
        .rapport h1 { color: #1c4e8a; font-size: 18px; margin: 0 0 2px; }
        .rapport h2 { color: #1c4e8a; font-size: 13px; margin: 16px 0 6px; border-bottom: 2px solid #e8772e; padding-bottom: 2px; }
        .rapport table { border-collapse: collapse; width: 100%; }
        .rapport th { background: #e8f0fa; text-align: left; }
        .rapport th, .rapport td { border: 1px solid #ccd3dd; padding: 3px 6px; vertical-align: top; }
        .rapport .kopband { display: flex; justify-content: space-between; border-bottom: 3px solid #1c4e8a; padding-bottom: 6px; margin-bottom: 8px; }
        .rapport .g { color: #2e7d4f; font-weight: bold; } .rapport .r { color: #b83a2e; font-weight: bold; }
        .rapport .katex { font-size: 1.05em; }
        .rapport tr, .rapport .blok { page-break-inside: avoid; }
      </style>
      <div class="kopband"><div><h1>Rapport remediëring: ${esc(CONFIG.TITEL)}</h1>
        <div><b>${esc(l.voornaam)} ${esc(l.naam)}</b> · ${esc(l.klas)} · gebruikersnaam ${esc(l.gebruikersnaam)}</div></div>
        <div style="text-align:right">De Resonant<br>${datum(new Date().toISOString())}</div></div>
      <table>${rij(['Delen geslaagd', 'Nu bezig met', 'Oefeningen', 'Laatst actief'], true)}
        ${rij([`${st.geslaagd.length} / ${DELEN.length}`, h === 'klaar' ? 'alle beschikbare delen geslaagd' : h ? `deel ${h.nr}` : '—', `${tot.aantal} (${pct(tot.juist, tot.aantal)} juist)`, datum(l.laatst_actief)])}</table>
      <h2>Voortgang per deel</h2>
      <table>${rij(['Deel', 'Status', 'Oefeningen', 'Testpogingen'], true)}
        ${delen.map(d => { const i = info(st, d.nr); return rij([`${d.nr}. ${esc(d.titel)}`, kaal(statusLabel(i, d)), `${i.oef.aantal} (${pct(i.oef.juist, i.oef.aantal)} juist)`,
          i.testen.map(t => t.status === 'bezig' ? `${datum(t.gestart)}: bezig` : `${datum(t.ingediend)}: <span class="${t.geslaagd ? 'g' : 'r'}">${t.score}/${t.max}</span>`).join('<br>') || '—']); }).join('')}</table>
      ${det.per_soort.length ? `<h2>Oefeningen per soort</h2><table>${rij(['Deel', 'Soort', 'Aantal', 'Juist'], true)}
        ${det.per_soort.map(s => { const d = DELEN.find(x => x.nr === s.deel); return rij([s.deel, esc(d && d.soorten && d.soorten[s.soort] ? d.soorten[s.soort].naam : s.soort), s.aantal, `${s.juist} (${pct(s.juist, s.aantal)})`]); }).join('')}</table>` : ''}
      ${det.per_dag.length ? `<h2>Activiteit per dag</h2><table>${rij(['Dag', 'Deel', 'Oefeningen', 'Juist'], true)}
        ${det.per_dag.map(r => rij([datum(r.dag, false), r.deel, r.aantal, pct(r.juist, r.aantal)])).join('')}</table>` : ''}
      ${det.testen.filter(t => t.status === 'ingediend').map(t => `<div class="blok"><h2>Test deel ${t.deel} · ${datum(t.ingediend)} · <span class="${t.geslaagd ? 'g' : 'r'}">${t.score}/${t.max_score}</span></h2>
        <table>${rij(['', 'Opgave', 'Juiste antwoord', 'Antwoord leerling'], true)}
        ${t.vragen.map((v, k) => { const a = (t.antwoorden || [])[k] || {}; return rij([a.juist ? '<span class="g">✓</span>' : '<span class="r">✗</span>', `<span class="wis">${esc(W.platteTekst(v.tex))}</span>`, `<span class="wis">${esc(W.platteTekst(W.antwoordTex(v.antw)))}</span>`, (a.gegevenTex ? `<span class="wis">${esc(W.platteTekst(a.gegevenTex))}</span>` : esc(a.gegeven)) + (a.bericht ? `<br><i>${esc(a.bericht)}</i>` : '')]); }).join('')}</table></div>`).join('')}
    </div>`;
  }

  async function maakPDF(html, naam, opties = {}) {
    const houder = document.createElement('div');
    houder.style.cssText = 'position:fixed;left:-10000px;top:0;background:#fff';
    houder.innerHTML = html; document.body.appendChild(houder);
    try {
      if (!window.html2pdf) throw new Error('PDF-bibliotheek niet geladen');
      await html2pdf().set({
        margin: [12, 12, 12, 12], filename: naam,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.blok', '.kaartje'] }, ...opties,
      }).from(houder.firstElementChild).save();
    } finally { houder.remove(); }
  }

  async function rapport(id) {
    try {
      const det = (S.detail && S.detail.leerling.id === id) ? S.detail : await roep('lk_leerling', { p_id: id });
      await maakPDF(rapportHTML(det), `Rapport_${bestandsnaam(det.leerling.naam + '_' + det.leerling.voornaam)}_${vandaag()}.pdf`);
    } catch (e) { modaal('Rapport mislukt', `<p>${esc(e.message)}</p>`, [['OK', 1]]); }
  }

  function kaartjesHTML(lijst) {
    const link = leerlingLink();
    return `<div style="font-family:Verdana,sans-serif;color:#1f2733;background:#fff;width:680px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${lijst.map(n => `<div class="kaartje" style="border:1px dashed #888;border-radius:6px;padding:10px 12px;font-size:12px;line-height:1.6">
        <div style="color:#1c4e8a;font-weight:bold;border-bottom:2px solid #e8772e;margin-bottom:4px">${esc(CONFIG.TITEL)} · ${esc(CONFIG.ONDERTITEL)}</div>
        <div><b>${esc(n.voornaam)} ${esc(n.naam)}</b> (${esc(n.klas)})</div>
        <div>Website: ${esc(link)}</div>
        <div>Gebruikersnaam: <b style="font-family:'Courier New',monospace;font-size:14px">${esc(n.gebruikersnaam)}</b></div>
        <div>Wachtwoord: <b style="font-family:'Courier New',monospace;font-size:14px">${esc(n.wachtwoord)}</b></div></div>`).join('')}</div>`;
  }

  // ---------- acties
  async function laadOverzicht() { S.data = await roep('lk_overzicht', {}); }
  async function laadDetail(id) { S.detail = await roep('lk_leerling', { p_id: id }); }

  function koppel() {
    const f = document.getElementById('loginform');
    if (f) {
      document.getElementById('pw').focus();
      f.onsubmit = async (e) => {
        e.preventDefault();
        try {
          const r = await API.call('lk_login', { p_wachtwoord: document.getElementById('pw').value });
          S.token = r.token; API.sessie.set('lk-token', r.token); S.fout = '';
          await laadOverzicht(); S.view = 'overzicht';
        } catch (err) { S.fout = err.message; }
        render();
      };
    }
    const namen = document.getElementById('namen');
    if (namen) namen.oninput = () => {
      const l = leesNamen();
      document.getElementById('voorbeeld').innerHTML = l.length ? `${l.length} leerling(en): ` + l.map(x => `<b>${esc(x.voornaam)}</b> ${esc(x.naam)} → ${esc(x.gebruikersnaam)}`).join(' · ') : '';
    };

    app.querySelectorAll('[data-a]').forEach(el => el.onclick = async (ev) => {
      ev.stopPropagation();
      const a = el.dataset.a;
      try {
        if (a === 'afmelden') { API.call('lk_logout', { p_token: S.token }).catch(() => {}); API.sessie.del('lk-token'); S.token = null; S.view = 'login'; return render(); }
        if (a === 'overzicht') { await laadOverzicht(); S.view = 'overzicht'; S.nieuw = null; S.detail = null; return render(); }
        if (a === 'vernieuw') { await laadOverzicht(); return render(); }
        if (a === 'leerling') { await laadDetail(el.dataset.id); S.view = 'leerling'; render(); return window.scrollTo(0, 0); }
        if (a === 'toevoegen') { S.view = 'toevoegen'; S.nieuw = null; return render(); }
        if (a === 'rapport') { el.disabled = true; el.textContent = 'Bezig…'; await rapport(el.dataset.id); el.disabled = false; el.textContent = el.dataset.id && S.view === 'overzicht' ? 'Rapport' : 'Rapport downloaden (PDF)'; return; }
        if (a === 'toontest') { document.getElementById('test-' + el.dataset.id).classList.toggle('verborgen'); return; }
        if (a === 'csv') {
          const kop = ['Klas', 'Naam', 'Voornaam', 'Gebruikersnaam', 'Actief', 'Delen geslaagd', 'Nu bezig met', 'Oefeningen', '% juist', ...KLAAR.map(d => `Test deel ${d.nr}`), 'Laatst actief'];
          const rijen = S.data.leerlingen.map(l => {
            const st = l.status, h = huidig(st), tot = totaalOef(st);
            return [l.klas, l.naam, l.voornaam, l.gebruikersnaam, l.actief ? 'ja' : 'nee', st.geslaagd.length, h === 'klaar' ? 'alles geslaagd' : h ? 'deel ' + h.nr : '', tot.aantal, tot.aantal ? Math.round(100 * tot.juist / tot.aantal) : '',
              ...KLAAR.map(d => info(st, d.nr).ingediend.map(t => `${t.score}/${t.max}`).join(' | ')), datum(l.laatst_actief)];
          });
          return download(`Overzicht_remediering_${vandaag()}.csv`, csv([kop, ...rijen]), 'text/csv;charset=utf-8');
        }
        if (a === 'maak') {
          const lijst = leesNamen();
          if (!lijst.length) return modaal('Geen namen', '<p>Typ minstens één naam.</p>', [['OK', 1]]);
          S.nieuw = await roep('lk_leerlingen_toevoegen', { p_lijst: lijst });
          return render();
        }
        if (a === 'kaartjes') { el.disabled = true; await maakPDF(kaartjesHTML(S.nieuw), `Inlogkaartjes_${vandaag()}.pdf`); el.disabled = false; return; }
        if (a === 'nieuwcsv') return download(`Logins_${vandaag()}.csv`, csv([['Klas', 'Naam', 'Voornaam', 'Gebruikersnaam', 'Wachtwoord'], ...S.nieuw.map(n => [n.klas, n.naam, n.voornaam, n.gebruikersnaam, n.wachtwoord])]), 'text/csv;charset=utf-8');

        const l = S.detail && S.detail.leerling;
        if (a === 'heropen') {
          const nr = +el.dataset.deel, sinds = sindsLaatsteTest(S.detail, nr);
          const ok = await modaal('Test opnieuw openzetten?', `<p>${esc(l.voornaam)} krijgt <b>één nieuwe poging</b> voor de test van deel ${nr}, met nieuwe vragen.</p>
            ${sinds ? `<p class="klein">Sinds de vorige test: ${sinds.aantal} oefeningen, ${pct(sinds.juist, sinds.aantal)} juist.</p>` : ''}`, [['Annuleren', 0, 'licht'], ['Openzetten', 1, 'oranje']]);
          if (!ok) return;
          await roep('lk_test_heropenen', { p_id: l.id, p_deel: nr }); await laadDetail(l.id);
          S.melding = `De test van deel ${nr} staat opnieuw open voor ${esc(l.voornaam)}.`; return render();
        }
        if (a === 'vrij') {
          await roep('lk_deel_vrijgeven', { p_id: l.id, p_deel: +el.dataset.deel, p_aan: el.dataset.aan === '1' }); await laadDetail(l.id); return render();
        }
        if (a === 'reset') {
          if (!await modaal('Nieuw wachtwoord?', `<p>Het oude wachtwoord van ${esc(l.voornaam)} werkt daarna niet meer.</p>`, [['Annuleren', 0, 'licht'], ['Nieuw wachtwoord', 1]])) return;
          const r = await roep('lk_wachtwoord_reset', { p_id: l.id });
          return modaal('Nieuw wachtwoord', `<p>${esc(l.voornaam)} ${esc(l.naam)}<br>Gebruikersnaam: <b>${esc(l.gebruikersnaam)}</b><br>Wachtwoord: <b style="font-family:monospace;font-size:18px">${esc(r.wachtwoord)}</b></p>`, [['OK', 1]]);
        }
        if (a === 'actief') {
          await roep('lk_leerling_wijzigen', { p_id: l.id, p_actief: el.dataset.aan === '1', p_verwijderen: false }); await laadDetail(l.id); return render();
        }
        if (a === 'verwijder') {
          if (!await modaal('Leerling verwijderen?', `<p>Alle gegevens van <b>${esc(l.voornaam)} ${esc(l.naam)}</b> (oefeningen, testen) worden definitief gewist. Download eerst het rapport als je het wil bewaren.</p>`, [['Annuleren', 0, 'licht'], ['Definitief verwijderen', 1, 'rood']])) return;
          await roep('lk_leerling_wijzigen', { p_id: l.id, p_actief: false, p_verwijderen: true });
          await laadOverzicht(); S.view = 'overzicht'; S.detail = null; S.melding = 'Leerling verwijderd.'; return render();
        }
      } catch (e) { if (e.code !== 'SESSIE_VERLOPEN') modaal('Dat lukte niet', `<p>${esc(e.message)}</p>`, [['OK', 1]]); }
    });
  }

  (async () => {
    if (S.token) { try { await laadOverzicht(); S.view = 'overzicht'; } catch (e) { S.token = null; S.view = 'login'; } }
    render();
  })();
})();
