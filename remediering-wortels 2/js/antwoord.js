// Invulvelden voor antwoorden: vrije invoer (met voorbeeldweergave en knoppen) en invulvakjes.
const Antwoord = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = (s) => W.tex(s);
  let laatste = null; // id van het laatst gebruikte invulveld

  const isOud = (v) => v.antw.soort === 'getal' || v.antw.soort === 'bn'; // deel 1
  const leeg = (v) => ({ invoer: '', bn: false, vakjes: v.antw.soort === 'vakjes' ? v.antw.velden.map(() => '') : [] });

  function heeftToetsenbord(v) {
    const a = v.antw;
    if (a.soort === 'expr') return !(a.vormen || []).includes('getal');
    if (a.soort === 'vakjes') return a.sjabloon.some(s => s.vrij);
    return false;
  }

  function voorbeeld(invoer) {
    if (!String(invoer || '').trim()) return '<span class="klein">Je antwoord verschijnt hier.</span>';
    const s = E.ontleed(invoer);
    return s.ok ? `<span class="klein">Gelezen als:</span> ${T(s.tex)}` : `<span class="klein fouttekst">${esc(s.fout)}</span>`;
  }

  function html(id, v, w, uit) {
    const a = v.antw;
    if (a.soort === 'expr') {
      return `<div class="antwoordrij"><span class="is">${T(v.voor || '=')}</span>
          <input type="text" class="expr" id="${id}" value="${esc(w.invoer)}" placeholder="antwoord" autocomplete="off" autocapitalize="none" spellcheck="false" ${uit ? 'disabled' : ''}></div>
        <div class="voorbeeld" id="${id}-vb">${uit ? '' : voorbeeld(w.invoer)}</div>`;
    }
    if (a.soort === 'vakjes') {
      const delen = a.sjabloon.map(s => {
        if (s.tex !== undefined) return `<span class="vt">${T(s.tex)}</span>`;
        const k = `${id}-${s.veld}`;
        return `<input type="text" id="${k}" data-veld="${s.veld}" class="vak${s.sub ? ' sub' : ''}${s.sup ? ' sup' : ''}${s.breed ? ' breed' : ''}${s.vrij ? ' expr' : ''}" value="${esc(w.vakjes[s.veld])}" autocomplete="off" autocapitalize="none" spellcheck="false" ${uit ? 'disabled' : ''} aria-label="vakje ${s.veld + 1}">`;
      }).join('');
      const vrij = a.sjabloon.find(s => s.vrij);
      return `<div class="vakjesrij">${delen}</div>${vrij && !uit ? `<div class="voorbeeld" id="${id}-${vrij.veld}-vb">${voorbeeld(w.vakjes[vrij.veld])}</div>` : ''}`;
    }
    return '';
  }

  const NWORTEL = [5, 6, 7, 8, 9, 10, 12];
  function toetsenbord() {
    const k = (txt, label, titel) => `<button type="button" class="tk" data-ins="${esc(txt)}" title="${titel || ''}">${label}</button>`;
    return `<div class="toetsenbord" role="toolbar" aria-label="Wiskundige tekens">
      ${k('√()', '√', 'vierkantswortel')}${k('∛()', '∛', 'derdemachtswortel')}${k('∜()', '∜', 'vierdemachtswortel')}
      <span class="nwortel"><select class="tk-n" aria-label="wortelexponent">${NWORTEL.map(n => `<option value="${n}">${n}</option>`).join('')}</select>${k('N', 'ⁿ√', 'wortel met gekozen exponent')}</span>
      ${k('^()', 'xⁿ', 'exponent')}${k('^(/)', 'x<sup>p/q</sup>', 'breuk als exponent')}${k('/', '/', 'breukstreep')}${k('()', '( )', 'haakjes')}${k('·', '·', 'maal')}
      ${k('a', 'a')}${k('b', 'b')}${k('c', 'c')}
      <button type="button" class="tk" data-ins="⌫" title="wis laatste teken">⌫</button>
    </div>`;
  }

  // invoegen op de cursorpositie; bij "()" komt de cursor tussen de haakjes
  function voegIn(el, txt) {
    const begin = el.selectionStart ?? el.value.length, eind = el.selectionEnd ?? el.value.length;
    if (txt === '⌫') {
      const b = begin === eind ? Math.max(0, begin - 1) : begin;
      el.value = el.value.slice(0, b) + el.value.slice(eind); el.setSelectionRange(b, b);
    } else {
      el.value = el.value.slice(0, begin) + txt + el.value.slice(eind);
      let pos = begin + txt.length;
      if (txt.endsWith('()')) pos -= 1; else if (txt === '^(/)') pos -= 2;
      el.setSelectionRange(pos, pos);
    }
    el.focus();
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function koppelToetsenbord(root) {
    root.querySelectorAll('.toetsenbord').forEach(tb => {
      tb.querySelectorAll('button.tk').forEach(b => {
        b.onmousedown = (e) => e.preventDefault(); // focus in het invulveld houden
        b.onclick = () => {
          const el = laatste && document.getElementById(laatste);
          const doel = el && !el.disabled ? el : root.querySelector('input.expr:not([disabled])');
          if (!doel) return;
          let txt = b.dataset.ins;
          if (txt === 'N') txt = String(tb.querySelector('.tk-n').value).split('').map(c => SUP[+c]).join('') + '√()';
          voegIn(doel, txt);
        };
      });
    });
  }

  // events: invoer bijhouden, voorbeeld bijwerken, Enter
  function koppel(id, v, w, { bijWijziging, bijEnter } = {}) {
    const a = v.antw;
    const velden = a.soort === 'expr' ? [[document.getElementById(id), null]]
      : a.soort === 'vakjes' ? a.velden.map((_, i) => [document.getElementById(`${id}-${i}`), i]) : [];
    velden.forEach(([el, i], n) => {
      if (!el) return;
      el.addEventListener('focus', () => { laatste = el.id; });
      el.addEventListener('input', () => {
        if (i === null) w.invoer = el.value; else w.vakjes[i] = el.value;
        const vb = document.getElementById(`${el.id}-vb`);
        if (vb) { vb.innerHTML = voorbeeld(el.value); }
        bijWijziging && bijWijziging();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const volgende = velden[n + 1] && velden[n + 1][0];
        if (volgende && !volgende.disabled) volgende.focus(); else bijEnter && bijEnter();
      });
    });
    return velden.length ? velden[0][0] : null;
  }

  function lees(id, v, w) {
    const a = v.antw;
    if (a.soort === 'expr') { const el = document.getElementById(id); if (el) w.invoer = el.value; }
    if (a.soort === 'vakjes') a.velden.forEach((_, i) => { const el = document.getElementById(`${id}-${i}`); if (el) w.vakjes[i] = el.value; });
  }

  function isIngevuld(v, w) {
    if (isOud(v)) return w.bn || !!String(w.invoer).trim();
    if (v.antw.soort === 'vakjes') return w.vakjes.every(x => String(x).trim());
    return !!String(w.invoer).trim();
  }

  // {status: juist | fout | vorm | ongeldig | leeg, bericht}
  function nakijk(v, w) {
    const a = v.antw;
    if (isOud(v)) {
      const invoer = w.bn ? 'bestaat niet' : w.invoer, g = W.leesAntwoord(invoer);
      if (g.soort === 'leeg') return { status: 'leeg', bericht: 'Vul eerst een antwoord in.' };
      if (g.soort === 'ongeldig') return { status: 'ongeldig', bericht: 'Typ een getal (bv. -3) of klik op "bestaat niet".' };
      return { status: W.isJuist(a, invoer) ? 'juist' : 'fout' };
    }
    if (a.soort === 'expr') return E.controleer(w.invoer, a.expr, a.vormen);
    if (a.soort === 'vakjes') {
      const r = a.velden.map((f, i) => E.controleer(w.vakjes[i], f.expr, f.vormen));
      const leeg = r.findIndex(x => x.status === 'leeg');
      if (leeg >= 0) return { status: 'leeg', bericht: 'Vul alle vakjes in.' };
      const ong = r.findIndex(x => x.status === 'ongeldig');
      if (ong >= 0) return { status: 'ongeldig', bericht: `Vakje ${ong + 1}: ${r[ong].bericht}` };
      if (r.some(x => x.status === 'fout')) return { status: 'fout' };
      const vorm = r.find(x => x.status === 'vorm');
      if (vorm) return { status: 'vorm', bericht: vorm.bericht };
      return { status: 'juist' };
    }
    return { status: 'fout' };
  }

  // wat de leerling ingaf: als tekst (voor opslag) en als TeX (voor weergave)
  function gegeven(v, w) {
    const a = v.antw;
    if (isOud(v)) { const t = W.toonInvoer(w.bn ? 'bestaat niet' : w.invoer); return { tekst: t, tex: null }; }
    if (a.soort === 'expr') {
      const t = String(w.invoer).trim(); if (!t) return { tekst: '—', tex: null };
      return { tekst: t, tex: E.texVan(t) };
    }
    if (a.soort === 'vakjes') {
      if (!w.vakjes.some(x => String(x).trim())) return { tekst: '—', tex: null };
      const tex = a.sjabloon.map(s => {
        if (s.tex !== undefined) return s.tex;
        const x = String(w.vakjes[s.veld]).trim(), t = x ? (E.texVan(x) || `\\text{${x.replace(/[\\{}$&#^_%~]/g, '')}}`) : '\\square';
        return s.sub ? `_{${t}}` : s.sup ? `^{${t}}` : ` ${s.vrij ? t : `{${t}}`} `;
      }).join(' ');
      return { tekst: w.vakjes.map(x => String(x).trim() || '…').join(' | '), tex };
    }
    return { tekst: '', tex: null };
  }

  return { leeg, html, toetsenbord, koppelToetsenbord, koppel, lees, nakijk, gegeven, isIngevuld, heeftToetsenbord, isOud };
})();
