// Hulpfuncties: toeval, KaTeX, antwoorden nakijken
const W = (() => {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const kies = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const schud = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gewogen = (lijst) => { // [[waarde, gewicht], ...]
    const tot = lijst.reduce((s, x) => s + x[1], 0); let r = Math.random() * tot;
    for (const [w, g] of lijst) { if ((r -= g) < 0) return w; } return lijst[lijst.length - 1][0];
  };

  // ---- TeX-hulpjes
  const wortel = (n, a) => n === 2 ? `\\sqrt{${a}}` : `\\sqrt[${n}]{${a}}`;
  const getal = (x) => String(x);                       // -3 -> "-3"
  const haakjes = (x) => x < 0 ? `(${x})` : String(x);   // -3 -> "(-3)"

  // ---- KaTeX
  function tex(s, display = false) {
    try { return katex.renderToString(s, { throwOnError: false, displayMode: display }); }
    catch (e) { return s; }
  }
  function renderIn(el) {
    if (window.renderMathInElement) {
      renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
    }
  }

  // ---- Antwoorden lezen en nakijken
  // Geeft {soort:'bn'} | {soort:'getal', waarde} | {soort:'leeg'} | {soort:'ongeldig'}
  function leesAntwoord(invoer) {
    let s = String(invoer ?? '').trim().toLowerCase();
    if (!s) return { soort: 'leeg' };
    s = s.replace(/[−–—]/g, '-').replace(/\s+/g, ' ');
    if (/^(bestaat ?niet|bn|b\.n\.?|∄)$/.test(s)) return { soort: 'bn' };
    const z = s.replace(/\s/g, '');
    if (/^[+-]?\d+([.,]\d+)?$/.test(z)) return { soort: 'getal', waarde: parseFloat(z.replace(',', '.')) };
    const br = z.match(/^([+-]?)(\d+)\/(\d+)$/);
    if (br && +br[3] !== 0) return { soort: 'getal', waarde: (br[1] === '-' ? -1 : 1) * (+br[2]) / (+br[3]) };
    return { soort: 'ongeldig' };
  }

  function isJuist(antw, invoer) {
    const g = leesAntwoord(invoer);
    if (antw.soort === 'bn') return g.soort === 'bn';
    if (antw.soort === 'getal') return g.soort === 'getal' && Math.abs(g.waarde - antw.waarde) < 1e-9;
    return false;
  }

  function antwoordTex(antw) {
    if (antw.tex) return antw.tex;
    if (antw.soort === 'bn') return '\\text{bestaat niet}';
    if (antw.soort === 'getal') return getal(antw.waarde);
    return '?';
  }

  function toonInvoer(invoer) {
    const g = leesAntwoord(invoer);
    if (g.soort === 'leeg') return '—';
    if (g.soort === 'bn') return 'bestaat niet';
    return String(invoer).trim();
  }

  // TeX -> gewone tekst (voor PDF-rapporten, waar KaTeX niet goed afdrukt)
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
  const sup = (s) => String(s).split('').map(c => SUP[c] ?? c).join('');
  const SUBM = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', a: 'ₐ', x: 'ₓ' };
  const sub = (s) => String(s).split('').map(c => SUBM[c] ?? c).join('');
  function platteTekst(t) {
    let s = String(t).replace(/\\dfrac/g, '\\frac').replace(/\\left\(|\\Big\(/g, '(').replace(/\\right\)|\\Big\)/g, ')')
      .replace(/\{,\}/g, ',').replace(/\\log\s*_\s*\{([^{}]*)\}/g, (m, g) => 'log' + sub(g)).replace(/\\log_\{([^{}]*)\}/g, (m, g) => 'log' + sub(g)).replace(/\\log_(\w)/g, (m, g) => 'log' + sub(g))
      .replace(/\\log/g, 'log').replace(/\\Leftrightarrow/g, '⇔').replace(/\\square/g, '□');
    for (let i = 0; i < 5; i++) {
      const enkel = (x) => /^[\w.,−-]+$/.test(x.trim()) ? x.trim() : '(' + x + ')';
      s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (m, a, b) => enkel(a) + '/' + enkel(b))
           .replace(/\\sqrt\[(\d+)\]\{([^{}]*)\}/g, (m, n, x) => (n === '3' ? '∛' : n === '4' ? '∜' : sup(n) + '√') + (/^[\w.]+$/.test(x) ? x : '(' + x + ')'))
           .replace(/\\sqrt\{([^{}]*)\}/g, (m, x) => '√' + (/^[\w.]+$/.test(x) ? x : '(' + x + ')'))
           .replace(/\^\{([-\d]+)\}/g, (m, e) => sup(e)).replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/\^(\d)/g, (m, e) => sup(e))
           .replace(/\\text\{([^{}]*)\}/g, '$1');
    }
    return s.replace(/\\(quad|qquad)/g, '  ').replace(/\\[,;: ]/g, ' ').replace(/\\geq/g, '≥').replace(/\\leq/g, '≤')
            .replace(/\\cdot/g, '·').replace(/-/g, '−').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  }

  return { rnd, kies, schud, gewogen, wortel, getal, haakjes, tex, renderIn, leesAntwoord, isJuist, antwoordTex, toonInvoer, platteTekst };
})();
