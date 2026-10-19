// Delen 8 – 10: logaritmen
const logT = (g, x) => g === 10 ? `\\log ${x}` : `\\log_{${g}} ${x}`;
const VAK = (sjabloon, velden, tex) => ({ soort: 'vakjes', sjabloon, velden, tex });
const LOGHULP = `
  <div class="kader"><div class="kader-titel">Zo typ je je antwoord</div>
    <p>Een breuk typ je met een schuine streep: <code>3/2</code>, <code>-1/9</code>. Een kommagetal mag ook: <code>0,5</code>.</p>
    <p>Bij sommige oefeningen vul je meerdere vakjes in, bijvoorbeeld het grondtal van een logaritme.</p>
  </div>`;

// ======================= DEEL 8: het begrip logaritme =======================
const DEEL8 = (() => {
  const { rnd, kies, brT, brE, wT, getalT, getalE } = G;
  // getal g^k als TeX en invoertaal (k geheel, mag negatief)
  function machtGetal(g, k) {
    if (k >= 0) return { T: `${g ** k}`, E: `${g ** k}` };
    if (g === 10) { const s = (10 ** k).toFixed(-k); return { T: getalT(s), E: getalE(s) }; }
    return { T: `\\frac{1}{${g ** -k}}`, E: `1/${g ** -k}` };
  }
  function bereken() {
    const vorm = kies(['macht', 'macht', 'macht', 'wortel', 'grondtalmacht']);
    let g, argT, p, q;
    if (vorm === 'macht') {
      for (;;) { g = kies([2, 3, 4, 5, 10, 6, 7]); p = rnd(-3, 5); q = 1; if (Math.abs(g ** p) <= 1000 && g ** -p <= 1000) break; }
      argT = machtGetal(g, p).T;
    } else if (vorm === 'wortel') {
      g = kies([2, 3, 5, 7]); const m = kies([1, 1, 3]); const n = m === 3 ? 2 : kies([2, 3]);
      if (g ** m > 125) return bereken();
      argT = wT(n, g ** m); p = m; q = n;
    } else {
      const b = kies([2, 3]); const i = b === 2 ? kies([2, 3, 4]) : kies([2, 3]);
      g = b ** i; argT = `${b}`; p = 1; q = i;
    }
    const ant = brT(p, q);
    return { soort: 'bereken', opdracht: 'Bereken zonder rekentoestel.', tex: logT(g, argT), antw: A(brE(p, q), ['getal'], ant),
      uitleg: [`${logT(g, argT)} = ${ant} \\quad\\text{want}\\quad ${g}^{${ant}} = ${argT}`] };
  }
  function naarLog() {
    for (;;) {
      const g = kies([2, 3, 4, 5, 10]); const k = rnd(-3, 5); if (k === 0 || k === 1 || g ** Math.abs(k) > 1000) continue;
      const x = machtGetal(g, k);
      return { soort: 'naarlog', opdracht: 'Schrijf als logaritme. Vul ook het grondtal in (bij log x is dat 10).', tex: `${g}^{${k}} = ${x.T}`,
        antw: VAK([{ tex: '\\log' }, { veld: 0, sub: true }, { veld: 1 }, { tex: '=' }, { veld: 2 }],
          [{ expr: `${g}`, vormen: [] }, { expr: x.E, vormen: [] }, { expr: `${k}`, vormen: [] }], `${logT(g, x.T)} = ${k}`),
        uitleg: [`a^y = x \\;\\Leftrightarrow\\; \\log_a x = y`, `${g}^{${k}} = ${x.T} \\;\\Leftrightarrow\\; ${logT(g, x.T)} = ${k}`] };
    }
  }
  function naarMacht() {
    for (;;) {
      const g = kies([2, 3, 4, 5, 10]); const k = rnd(-3, 5); if (k === 0 || k === 1 || g ** Math.abs(k) > 1000) continue;
      const x = machtGetal(g, k);
      return { soort: 'naarmacht', opdracht: 'Schrijf als macht.', tex: `${logT(g, x.T)} = ${k}`,
        antw: VAK([{ veld: 0 }, { veld: 1, sup: true }, { tex: '=' }, { veld: 2 }],
          [{ expr: `${g}`, vormen: [] }, { expr: `${k}`, vormen: [] }, { expr: x.E, vormen: [] }], `${g}^{${k}} = ${x.T}`),
        uitleg: [`\\log_a x = y \\;\\Leftrightarrow\\; a^y = x`, `${logT(g, x.T)} = ${k} \\;\\Leftrightarrow\\; ${g}^{${k}} = ${x.T}`] };
    }
  }
  function bepaalX() {
    if (Math.random() < 0.5) { // log_x A = k
      for (;;) {
        const g = rnd(2, 10), k = rnd(2, 4); if (g ** k > 1000) continue;
        const tex = `\\log_{x} ${g ** k} = ${k}`;
        return { soort: 'bepaalx', opdracht: 'Bepaal x.', tex, voor: 'x =', antw: A(`${g}`, ['getal'], `${g}`),
          uitleg: [`${tex} \\;\\Leftrightarrow\\; x^{${k}} = ${g ** k}`, `x = ${wT(k, g ** k)} = ${g}`] };
      }
    }
    for (;;) { // log_g x = k
      const g = kies([2, 3, 4, 5, 10]); const k = rnd(-3, 4); if (k === 0 || g ** Math.abs(k) > 1000) continue;
      const x = machtGetal(g, k), tex = `${logT(g, 'x')} = ${k}`;
      return { soort: 'bepaalx', opdracht: 'Bepaal x.', tex, voor: 'x =', antw: A(x.E, ['getal'], x.T),
        uitleg: [`${tex} \\;\\Leftrightarrow\\; x = ${g}^{${k}} = ${x.T}`] };
    }
  }
  return {
    nr: 8, titel: 'Logaritmen: het begrip', kort: 'Definitie, omzetten tussen macht en logaritme.', klaar: true,
    theorie: `
      <div class="kader def"><div class="kader-titel">Definitie</div>
        <p class="midden">$\\log_a x = y \\;\\Leftrightarrow\\; a^y = x \\qquad (a > 0,\\; a \\neq 1,\\; x > 0)$</p>
        <p>$\\log_a x$ is de exponent die je op $a$ moet zetten om $x$ te krijgen.</p>
        <p class="midden">$\\log_2 8 = 3 \\quad\\text{want}\\quad 2^3 = 8$</p>
      </div>
      <div class="twee">
        <div class="kader eig"><div class="kader-titel">Afspraken</div>
          <p>$\\log x = \\log_{10} x$</p>
          <p>$\\log_a a = 1 \\qquad \\log_a 1 = 0$</p></div>
        <div class="kader eig"><div class="kader-titel">Handig</div>
          <p>Schrijf het getal als macht van het grondtal:</p>
          <p>$\\dfrac{1}{9} = 3^{-2} \\qquad \\sqrt{5} = 5^{\\frac{1}{2}} \\qquad 0{,}001 = 10^{-3} \\qquad 2 = 4^{\\frac{1}{2}}$</p></div>
      </div>
      <div class="kader werk"><div class="kader-titel">x bepalen</div>
        <p>Schrijf de logaritme om naar een macht.</p>
        <p>$\\log_x 125 = 3 \\;\\Leftrightarrow\\; x^3 = 125 \\;\\Rightarrow\\; x = 5$</p>
        <p>$\\log_3 x = -2 \\;\\Leftrightarrow\\; x = 3^{-2} = \\dfrac{1}{9}$</p>
      </div>
      ${LOGHULP}`,
    voorbeelden: [
      { tex: '\\log_2 32', stappen: ['32 = 2^5', '\\log_2 32 = 5'] },
      { tex: '\\log_3 \\frac{1}{9}', stappen: ['\\frac{1}{9} = 3^{-2}', '\\log_3 \\frac{1}{9} = -2'] },
      { tex: '\\log_5 \\sqrt{5}', stappen: ['\\sqrt{5} = 5^{\\frac{1}{2}}', '\\log_5 \\sqrt{5} = \\frac{1}{2}'] },
      { tex: '\\log 0{,}001', stappen: ['0{,}001 = 10^{-3}', '\\log 0{,}001 = -3'] },
      { tex: '4^3 = 64 \\quad\\text{als logaritme}', stappen: ['\\log_4 64 = 3'] },
      { tex: '\\log_2 \\frac{1}{8} = -3 \\quad\\text{als macht}', stappen: ['2^{-3} = \\frac{1}{8}'] },
    ],
    soorten: {
      bereken: { naam: 'Logaritme berekenen', gen: bereken },
      naarlog: { naam: 'Macht → logaritme', gen: naarLog },
      naarmacht: { naam: 'Logaritme → macht', gen: naarMacht },
      bepaalx: { naam: 'x bepalen', gen: bepaalX },
    },
    oefenMix: [['bereken', 3], ['naarlog', 1], ['naarmacht', 1], ['bepaalx', 2]],
    test: [['bereken', 5], ['naarlog', 1], ['naarmacht', 1], ['bepaalx', 3]],
    testSchudAlles: true,
  };
})();

// ======================= DEEL 9: rekenregels =======================
const DEEL9 = (() => {
  const { rnd, kies, brT, brE, gcd } = G;
  const L = logT;
  const isMachtVan = (x, g) => { while (x > 1 && x % g === 0) x /= g; return x === 1; };
  const delers = (x) => { const d = []; for (let i = 2; i < x; i++) if (x % i === 0) d.push(i); return d; };
  const op = (c) => c < 0 ? '-' : '+';

  function som() {
    for (;;) {
      const g = kies([2, 3, 6, 10, 10, 12]), k = rnd(1, 3), P = g ** k; if (P > 1000) continue;
      const ds = delers(P).filter(d => d <= P / d || Math.random() < 0.5); if (!ds.length) continue;
      const p = kies(ds), q = P / p;
      const tex = `${L(g, p)} + ${L(g, q)}`;
      return { soort: 'som', opdracht: 'Bereken met de rekenregels.', tex, antw: A(`${k}`, ['getal'], `${k}`),
        uitleg: [`= ${L(g, `(${p} \\cdot ${q})`)} = ${L(g, P)}`, `= ${k} \\quad\\text{want}\\quad ${g}^{${k}} = ${P}`] };
    }
  }
  function verschil() {
    for (;;) {
      const g = kies([2, 3, 5, 10]), k = rnd(1, 3), q = kies([2, 3, 4, 5, 6, 7]);
      if (isMachtVan(q, g) || g ** k * q > 1000) continue;
      const p = g ** k * q, tex = `${L(g, p)} - ${L(g, q)}`;
      return { soort: 'verschil', opdracht: 'Bereken met de rekenregels.', tex, antw: A(`${k}`, ['getal'], `${k}`),
        uitleg: [`= ${L(g, `\\frac{${p}}{${q}}`)} = ${L(g, g ** k)}`, `= ${k}`] };
    }
  }
  function factor() {
    for (;;) {
      const g = kies([2, 3, 5]), s = kies([2, 3, 5, 6]), r = kies([2, 2, 3]);
      if (s === g || isMachtVan(s, g) || s ** r > 1000) continue;
      const p = g * s, q = s ** r, tex = `${r}${L(g, p)} - ${L(g, q)}`;
      return { soort: 'factor', opdracht: 'Bereken met de rekenregels.', tex, antw: A(`${r}`, ['getal'], `${r}`),
        uitleg: [`= ${L(g, `${p}^{${r}}`)} - ${L(g, q)} = ${L(g, p ** r)} - ${L(g, q)}`, `= ${L(g, `\\frac{${p ** r}}{${q}}`)} = ${L(g, g ** r)} = ${r}`] };
    }
  }
  function macht() {
    const g = kies([2, 3, 5]), m = g === 5 ? 2 : kies([2, 3]), r = rnd(2, 7);
    const tex = L(g, `${g ** m}^{${r}}`);
    return { soort: 'macht', opdracht: 'Bereken met de rekenregels.', tex, antw: A(`${m * r}`, ['getal'], `${m * r}`),
      uitleg: [`= ${r} \\cdot ${L(g, g ** m)} = ${r} \\cdot ${m} = ${m * r}`] };
  }
  function drie() {
    for (;;) {
      const g = kies([10, 10, 2, 6]), k = rnd(2, 3), s = kies([2, 3, 4, 5]); const P = g ** k * s;
      if (P > 5000 || isMachtVan(s, g)) continue;
      const ds = delers(P).filter(d => d >= 4 && P / d >= 4 && !isMachtVan(d, g) && d <= 200 && P / d <= 200 && d !== s && P / d !== s);
      if (!ds.length) continue;
      const p = kies(ds), q = P / p, tex = `${L(g, p)} + ${L(g, q)} - ${L(g, s)}`;
      return { soort: 'drie', opdracht: 'Bereken met de rekenregels.', tex, antw: A(`${k}`, ['getal'], `${k}`),
        uitleg: [`= ${L(g, `\\frac{${p} \\cdot ${q}}{${s}}`)} = ${L(g, g ** k)} = ${k}`] };
    }
  }
  // coëfficiënten als [teller, noemer]
  const COEF = [[1, 1], [2, 1], [3, 1], [1, 2], [-1, 1], [-2, 1], [-1, 2], [-3, 1]];
  const coefT = ([p, q]) => (q === 1 ? (Math.abs(p) === 1 ? '' : `${Math.abs(p)}`) : `\\frac{${Math.abs(p)}}{${q}}`);
  const factorT = (v, [p, q]) => { p = Math.abs(p); const m = p === 1 ? v : `${v}^{${p}}`; return q === 2 ? `\\sqrt{${m}}` : m; };
  function argT(vs, cs) {
    const t = [], n = [];
    vs.forEach((v, i) => (cs[i][0] > 0 ? t : n).push(factorT(v, cs[i])));
    const T = t.join('') || '1';
    if (n.length) return `\\frac{${T}}{${n.join('')}}`;
    return t.length > 1 ? `\\left(${T}\\right)` : T;
  }
  function kiesCoefs(k) {
    for (;;) { const cs = Array.from({ length: k }, () => kies(COEF)); if (cs[0][0] > 0 && cs.some(c => c[0] < 0 || c[1] > 1)) return cs; }
  }
  function eenLog() {
    const vs = Math.random() < 0.5 ? ['x', 'y', 'z'] : ['x', 'y'];
    const cs = kiesCoefs(vs.length);
    const tex = vs.map((v, i) => `${i ? op(cs[i][0]) + ' ' : ''}${coefT(cs[i])}\\log_a ${v}`).join(' ');
    const expr = vs.map((v, i) => `${v}^(${brE(cs[i][0], cs[i][1])})`).join('*');
    const ant = `\\log_a ${argT(vs, cs)}`;
    return { soort: 'eenlog', opdracht: 'Schrijf als één logaritme (x, y, z > 0).', tex,
      antw: VAK([{ tex: '\\log_a \\Big(' }, { veld: 0, breed: true, vrij: true }, { tex: '\\Big)' }], [{ expr, vormen: [] }], ant),
      uitleg: [`= ${vs.map((v, i) => `${i ? '+ ' : ''}\\log_a ${v}^{${brT(cs[i][0], cs[i][1])}}`).join(' ')}`, `= ${ant}`] };
  }
  function uitsplitsen() {
    const vs = ['x', 'y', 'z'];
    const cs = kiesCoefs(3);
    const tex = `\\log_a ${argT(vs, cs)}`;
    const sjabloon = [];
    vs.forEach((v, i) => { if (i) sjabloon.push({ tex: '+' }); sjabloon.push({ veld: i }); sjabloon.push({ tex: `\\log_a ${v}` }); });
    const ant = vs.map((v, i) => `${i ? op(cs[i][0]) + ' ' : (cs[i][0] < 0 ? '-' : '')}${coefT(cs[i])}\\log_a ${v}`).join(' ');
    return { soort: 'uitsplitsen', opdracht: 'Schrijf als som en verschil van logaritmen (x, y, z > 0). Typ een min mee als dat nodig is, bv. -1 of -1/2.', tex,
      antw: VAK(sjabloon, cs.map(c => ({ expr: brE(c[0], c[1]), vormen: [] })), ant),
      uitleg: [`${tex} = ${ant}`] };
  }
  return {
    nr: 9, titel: 'Logaritmen: rekenregels', kort: 'Som, verschil en macht.', klaar: true,
    theorie: `
      <div class="kader def"><div class="kader-titel">Rekenregels</div>
        <p class="midden">$\\log_a(x \\cdot y) = \\log_a x + \\log_a y \\qquad\\qquad \\log_a \\dfrac{x}{y} = \\log_a x - \\log_a y$</p>
        <p class="midden">$\\log_a x^r = r \\cdot \\log_a x$</p>
      </div>
      <div class="twee">
        <div class="kader eig"><div class="kader-titel">Samennemen tot één logaritme</div>
          <p>$\\log_6 4 + \\log_6 9 = \\log_6 36 = 2$</p>
          <p>$2\\log_3 6 - \\log_3 4 = \\log_3 36 - \\log_3 4 = \\log_3 9 = 2$</p></div>
        <div class="kader eig"><div class="kader-titel">Met letters</div>
          <p>$\\log_a x + 2\\log_a y = \\log_a (xy^2)$</p>
          <p>$\\log_a \\dfrac{x^2y}{z} = 2\\log_a x + \\log_a y - \\log_a z$</p>
          <p class="klein">$\\sqrt{y} = y^{\\frac{1}{2}}$, dus $\\log_a \\sqrt{y} = \\frac{1}{2}\\log_a y$.</p></div>
      </div>
      <div class="kader werk"><div class="kader-titel">Werkwijze bij berekenen</div>
        <ol>
          <li>Zet een getal vóór de logaritme eerst als exponent: $2\\log_3 6 = \\log_3 6^2$.</li>
          <li>Neem alles samen tot één logaritme (product en quotiënt).</li>
          <li>Bereken die logaritme met de definitie.</li>
        </ol>
      </div>
      ${LOGHULP}`,
    voorbeelden: [
      { tex: '\\log_6 4 + \\log_6 9', stappen: ['= \\log_6 (4 \\cdot 9) = \\log_6 36', '= 2'] },
      { tex: '2\\log_3 6 - \\log_3 4', stappen: ['= \\log_3 36 - \\log_3 4', '= \\log_3 \\frac{36}{4} = \\log_3 9', '= 2'] },
      { tex: '\\log 50 + \\log 40 - \\log 2', stappen: ['= \\log \\frac{50 \\cdot 40}{2} = \\log 1000', '= 3'] },
      { tex: '\\log_2 8^5', stappen: ['= 5 \\cdot \\log_2 8 = 5 \\cdot 3', '= 15'] },
      { tex: '3\\log_a x - \\frac{1}{2}\\log_a y + \\log_a z', stappen: ['= \\log_a x^3 - \\log_a \\sqrt{y} + \\log_a z', '= \\log_a \\frac{x^3 z}{\\sqrt{y}}'] },
      { tex: '\\log_a \\frac{x^2 y}{z}', stappen: ['= \\log_a x^2 + \\log_a y - \\log_a z', '= 2\\log_a x + \\log_a y - \\log_a z'] },
    ],
    soorten: {
      som: { naam: 'Som', gen: som },
      verschil: { naam: 'Verschil', gen: verschil },
      factor: { naam: 'Met een getal vóór de log', gen: factor },
      macht: { naam: 'Logaritme van een macht', gen: macht },
      drie: { naam: 'Drie termen', gen: drie },
      eenlog: { naam: 'Schrijf als één logaritme', gen: eenLog },
      uitsplitsen: { naam: 'Schrijf als som en verschil', gen: uitsplitsen },
    },
    oefenMix: [['som', 2], ['verschil', 2], ['factor', 2], ['macht', 1], ['drie', 1], ['eenlog', 2], ['uitsplitsen', 2]],
    test: [['som', 2], ['verschil', 2], ['factor', 2], ['macht', 1], ['drie', 1], ['eenlog', 1], ['uitsplitsen', 1]],
    testSchudAlles: true,
  };
})();

// ======================= DEEL 10: grondtalwissel =======================
const DEEL10 = (() => {
  const { rnd, kies, brT, brE, red } = G;
  // log_{basis} arg met basis = p^e en arg = p^j  →  j/e
  function deel() {
    for (;;) {
      const p = kies([2, 2, 3, 3, 5]);
      const bv = kies(['macht', 'macht', 'macht', 'breuk', 'wortel']);
      let e, bT;
      if (bv === 'macht') { e = rnd(2, p === 2 ? 4 : p === 3 ? 3 : 2); bT = `${p ** e}`; }
      else if (bv === 'breuk') { e = -rnd(1, 2); bT = `\\frac{1}{${p ** -e}}`; }
      else { e = 0.5; bT = `\\sqrt{${p}}`; }
      const j = rnd(-3, 6); if (!j || Math.abs(p ** j) > 1000 || p ** -j > 1000) continue;
      const aT = j > 0 ? `${p ** j}` : `\\frac{1}{${p ** -j}}`;
      const [s, t] = e === 0.5 ? red(2 * j, 1) : red(j, e);
      return { p, e, j, s, t, tex: `\\log_{${bT}} ${aT}`, bT, aT };
    }
  }
  const eT = (e) => e === 0.5 ? '\\frac{1}{2}' : `${e}`;
  function wissel() {
    let d; do { d = deel(); } while (d.t === 1 && Math.random() < 0.6);
    const ant = brT(d.s, d.t);
    return { soort: 'wissel', opdracht: 'Bereken exact met de formule voor grondtalwissel.', tex: d.tex, antw: A(brE(d.s, d.t), ['getal'], ant),
      uitleg: [`${d.tex} = \\dfrac{\\log_{${d.p}} ${d.aT}}{\\log_{${d.p}} ${d.bT}} = \\dfrac{${d.j}}{${eT(d.e)}} = ${ant}`] };
  }
  function som() {
    for (;;) {
      const a = deel(), b = deel(); if (a.p === b.p || a.t === 1 || b.t === 1) continue;
      const [s, t] = red(a.s * b.t + b.s * a.t, a.t * b.t);
      const tex = `${a.tex} + ${b.tex}`;
      return { soort: 'som', opdracht: 'Bereken met de formule voor grondtalwissel.', tex, antw: A(brE(s, t), ['getal'], brT(s, t)),
        uitleg: [`${a.tex} = \\dfrac{\\log_{${a.p}} ${a.aT}}{\\log_{${a.p}} ${a.bT}} = ${brT(a.s, a.t)}`, `${b.tex} = \\dfrac{\\log_{${b.p}} ${b.aT}}{\\log_{${b.p}} ${b.bT}} = ${brT(b.s, b.t)}`, `${brT(a.s, a.t)} + ${brT(b.s, b.t)} = ${brT(s, t)}`] };
    }
  }
  function product() {
    for (;;) {
      const [p, q] = kies([[2, 3], [3, 2], [2, 5], [5, 2], [3, 5]]);
      const i = rnd(1, 3), k = rnd(1, 2), j = rnd(1, 5), l = rnd(1, 5);
      if (p ** i > 125 || q ** k > 125 || q ** j > 250 || p ** l > 250 || (i === 1 && k === 1 && Math.random() < 0.5)) continue;
      const [s, t] = red(j * l, i * k);
      const tex = `\\log_{${p ** i}} ${q ** j} \\cdot \\log_{${q ** k}} ${p ** l}`;
      const c = (n, x) => n === 1 ? `\\log ${x}` : `${n}\\log ${x}`;
      return { soort: 'product', opdracht: 'Bereken exact met de formule voor grondtalwissel.', tex, antw: A(brE(s, t), ['getal'], brT(s, t)),
        uitleg: [`= \\dfrac{\\log ${q ** j}}{\\log ${p ** i}} \\cdot \\dfrac{\\log ${p ** l}}{\\log ${q ** k}}`, `= \\dfrac{${c(j, q)}}{${c(i, p)}} \\cdot \\dfrac{${c(l, p)}}{${c(k, q)}}`, `= \\dfrac{${j * l}}{${i * k}}${t !== i * k ? ` = ${brT(s, t)}` : ''}`] };
    }
  }
  function breuken() {
    const [p, q] = kies([[2, 3], [3, 5], [2, 5], [3, 7], [2, 7]]);
    if (Math.random() < 0.5) { // log q / log p · log p^k / log q = k
      const k = rnd(2, 4); const P = p ** k; if (P > 300) return breuken();
      const tex = `\\dfrac{\\log ${q}}{\\log ${p}} \\cdot \\dfrac{\\log ${P}}{\\log ${q}}`;
      return { soort: 'breuken', opdracht: 'Bereken exact zonder rekentoestel.', tex, antw: A(`${k}`, ['getal'], `${k}`),
        uitleg: [`= \\dfrac{\\log ${P}}{\\log ${p}} = \\log_{${p}} ${P} = ${k}`] };
    }
    const c = [rnd(1, 4), rnd(1, 4), rnd(1, 4), rnd(1, 4)];
    const cT = (n, x) => n === 1 ? `\\log ${x}` : `${n}\\log ${x}`;
    const tex = `\\dfrac{${cT(c[0], p)}}{${cT(c[1], q)}} \\cdot \\dfrac{${cT(c[2], q)}}{${cT(c[3], p)}}`;
    const [s, t] = red(c[0] * c[2], c[1] * c[3]);
    return { soort: 'breuken', opdracht: 'Bereken exact zonder rekentoestel.', tex, antw: A(brE(s, t), ['getal'], brT(s, t)),
      uitleg: [`\\log ${p} \\text{ en } \\log ${q} \\text{ vallen weg: } \\dfrac{${c[0]} \\cdot ${c[2]}}{${c[1]} \\cdot ${c[3]}} = ${brT(s, t)}`] };
  }
  return {
    nr: 10, titel: 'Logaritmen: grondtalwissel', kort: 'Overgaan op een geschikt grondtal.', klaar: true,
    theorie: `
      <div class="kader def"><div class="kader-titel">Formule voor grondtalwissel</div>
        <p class="midden">$\\log_b x = \\dfrac{\\log_a x}{\\log_a b}$</p>
        <p>Je mag zelf een nieuw grondtal $a$ kiezen. Kies het zo dat je beide logaritmen <b>zonder rekentoestel</b> kan berekenen.</p>
      </div>
      <div class="kader werk"><div class="kader-titel">Werkwijze</div>
        <ol>
          <li>Schrijf het grondtal en het getal als macht van <b>hetzelfde getal</b>: $8 = 2^3$, $32 = 2^5$.</li>
          <li>Ga over op dat getal als grondtal.</li>
          <li>Bereken teller en noemer.</li>
        </ol>
        <p class="midden">$\\log_8 32 = \\dfrac{\\log_2 32}{\\log_2 8} = \\dfrac{5}{3} \\qquad\\qquad \\log_{\\frac{1}{4}} 32 = \\dfrac{\\log_2 32}{\\log_2 \\frac{1}{4}} = \\dfrac{5}{-2} = -\\dfrac{5}{2}$</p>
      </div>
      <div class="kader eig"><div class="kader-titel">Producten van logaritmen</div>
        <p>Schrijf elke logaritme als breuk met $\\log$. Gelijke factoren vallen weg.</p>
        <p class="midden">$\\log_4 27 \\cdot \\log_3 32 = \\dfrac{\\log 27}{\\log 4} \\cdot \\dfrac{\\log 32}{\\log 3} = \\dfrac{3\\log 3}{2\\log 2} \\cdot \\dfrac{5\\log 2}{\\log 3} = \\dfrac{15}{2}$</p>
      </div>
      ${LOGHULP}`,
    voorbeelden: [
      { tex: '\\log_8 32', stappen: ['= \\dfrac{\\log_2 32}{\\log_2 8}', '= \\dfrac{5}{3}'] },
      { tex: '\\log_9 27', stappen: ['= \\dfrac{\\log_3 27}{\\log_3 9}', '= \\dfrac{3}{2}'] },
      { tex: '\\log_{\\sqrt{2}} 8', stappen: ['= \\dfrac{\\log_2 8}{\\log_2 \\sqrt{2}}', '= \\dfrac{3}{\\frac{1}{2}} = 6'] },
      { tex: '\\log_8 16 + \\log_9 27', stappen: ['= \\dfrac{\\log_2 16}{\\log_2 8} + \\dfrac{\\log_3 27}{\\log_3 9}', '= \\dfrac{4}{3} + \\dfrac{3}{2} = \\dfrac{8}{6} + \\dfrac{9}{6}', '= \\dfrac{17}{6}'] },
      { tex: '\\log_2 3 \\cdot \\log_3 8', stappen: ['= \\dfrac{\\log 3}{\\log 2} \\cdot \\dfrac{\\log 8}{\\log 3}', '= \\dfrac{\\log 8}{\\log 2} = \\log_2 8', '= 3'] },
    ],
    soorten: {
      wissel: { naam: 'Grondtalwissel', gen: wissel },
      som: { naam: 'Som van twee logaritmen', gen: som },
      product: { naam: 'Product van twee logaritmen', gen: product },
      breuken: { naam: 'Breuken met log', gen: breuken },
    },
    oefenMix: [['wissel', 3], ['som', 1], ['product', 1], ['breuken', 1]],
    test: [['wissel', 5], ['som', 2], ['product', 2], ['breuken', 1]],
  };
})();
