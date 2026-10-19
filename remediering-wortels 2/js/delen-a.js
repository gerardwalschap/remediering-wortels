// Delen 2 – 7: wortels en machten met rationale exponenten
const A = (expr, vormen, tex) => ({ soort: 'expr', expr, vormen, tex });

// ======================= DEEL 2: rekenen met wortels van getallen =======================
const DEEL2 = (() => {
  const { rnd, kies, wT, isNdeMacht, h } = G;

  // een eenvoudige term met gekende waarde (voor sommen en noemers)
  function term() {
    const soort = kies(['macht', 'macht', 'gewoon']);
    if (soort === 'macht') {
      const n = kies([2, 2, 3, 4, 5]);
      const b = (Math.random() < 0.6 ? -1 : 1) * (n === 5 ? rnd(1, 2) : rnd(2, n === 2 ? 7 : 4));
      const w = n % 2 ? b : Math.abs(b);
      return { tex: wT(n, `${b < 0 ? `(${b})` : b}^{${n}}`), w };
    }
    const n = kies([2, 3, 3, 4]);
    const b = n === 2 ? rnd(2, 9) : n === 3 ? rnd(1, 5) : rnd(1, 3);
    const neg = n === 3 && Math.random() < 0.5;
    return { tex: wT(n, (neg ? -1 : 1) * b ** n), w: (neg ? -1 : 1) * b };
  }
  function product() {
    for (;;) {
      const n = kies([2, 3, 3, 4]); const r = n === 2 ? rnd(2, 12) : n === 3 ? rnd(2, 6) : rnd(2, 4);
      const P = r ** n, ds = [];
      for (let d = 2; d < P; d++) if (P % d === 0 && !isNdeMacht(d, n) && !isNdeMacht(P / d, n) && d <= 200 && P / d <= 400) ds.push(d);
      if (!ds.length) continue;
      const neg = n === 3 && Math.random() < 0.5;
      const x = (neg ? -1 : 1) * kies(ds), y = Math.abs(P / x), w = neg ? -r : r;
      const tex = `${wT(n, x)} \\cdot ${wT(n, y)}`;
      return { soort: 'product', opdracht: 'Bereken zonder rekentoestel.', tex, antw: A(`${w}`, ['getal'], `${w}`),
        uitleg: [`${tex} = ${wT(n, `${h(x)} \\cdot ${y}`)} = ${wT(n, x * y)} = ${w}`] };
    }
  }
  function quotient() {
    const n = kies([2, 3, 3, 4]);
    const y = kies([2, 3, 5, 6, 7]);
    const r = n === 2 ? rnd(2, 9) : n === 3 ? rnd(2, 5) : rnd(2, 3);
    const neg = n === 3 && Math.random() < 0.5;
    const x = (neg ? -1 : 1) * r ** n * y, w = neg ? -r : r;
    const tex = `${wT(n, x)} : ${wT(n, y)}`;
    return { soort: 'quotient', opdracht: 'Bereken zonder rekentoestel.', tex, antw: A(`${w}`, ['getal'], `${w}`),
      uitleg: [`${tex} = ${wT(n, `${h(x)} : ${y}`)} = ${wT(n, x / y)} = ${w}`] };
  }
  function machtOnder() {
    const n = kies([2, 2, 3, 4, 4, 5]);
    const b = (Math.random() < 0.7 ? -1 : 1) * (n === 5 ? rnd(2, 3) : rnd(2, 9));
    const w = n % 2 ? b : Math.abs(b);
    const tex = wT(n, `${b < 0 ? `(${b})` : b}^{${n}}`);
    const reden = n % 2 ? `${n} \\text{ is oneven: het teken blijft}` : `${n} \\text{ is even: de uitkomst is positief}`;
    return { soort: 'machtonder', opdracht: 'Bereken zonder rekentoestel.', tex, antw: A(`${w}`, ['getal'], `${w}`),
      uitleg: [`${tex} = ${w} \\qquad (${reden})`] };
  }
  function som() {
    const p = term(), q = term(), plus = Math.random() < 0.5;
    const w = plus ? p.w + q.w : p.w - q.w;
    const tex = `${p.tex} ${plus ? '+' : '-'} ${q.tex}`;
    return { soort: 'som', opdracht: 'Bereken zonder rekentoestel.', tex, antw: A(`${w}`, ['getal'], `${w}`),
      uitleg: [`${tex} = ${p.w} ${plus ? '+' : '-'} ${h(q.w)} = ${w}`] };
  }
  function breuk() {
    for (;;) {
      const t = Math.random() < 0.5 ? product() : quotient();
      const N = t.antw.expr * 1;
      const p = term(), q = term(), plus = Math.random() < 0.5;
      const D = plus ? p.w + q.w : p.w - q.w;
      if (!D || N % D !== 0 || Math.abs(D) > 12) continue;
      const nt = `${p.tex} ${plus ? '+' : '-'} ${q.tex}`;
      const w = N / D;
      return { soort: 'breuk', opdracht: 'Bereken. Werk eerst de teller en de noemer apart uit.', tex: `\\dfrac{${t.tex}}{${nt}}`,
        antw: A(`${w}`, ['getal'], `${w}`),
        uitleg: [`\\text{teller: } ${t.uitleg[0]}`, `\\text{noemer: } ${nt} = ${p.w} ${plus ? '+' : '-'} ${h(q.w)} = ${D}`, `\\text{uitkomst: } \\dfrac{${N}}{${D}} = ${w}`] };
    }
  }

  return {
    nr: 2, titel: 'Rekenen met wortels van getallen', kort: 'Product, quotiënt, som en breuken met wortels.', klaar: true,
    theorie: `
      <div class="kader def"><div class="kader-titel">Rekenregels voor wortels</div>
        <p>Voor wortels met dezelfde wortelexponent $n$ (als de wortels bestaan):</p>
        <p class="midden">$\\sqrt[n]{a} \\cdot \\sqrt[n]{b} = \\sqrt[n]{a \\cdot b} \\qquad\\qquad \\sqrt[n]{a} : \\sqrt[n]{b} = \\sqrt[n]{a : b}$</p>
      </div>
      <div class="twee">
        <div class="kader eig"><div class="kader-titel">Product</div>
          <p>$\\sqrt[3]{-16} \\cdot \\sqrt[3]{4} = \\sqrt[3]{-64} = -4$</p>
          <p>$\\sqrt[4]{8} \\cdot \\sqrt[4]{162} = \\sqrt[4]{1296} = 6$</p></div>
        <div class="kader eig"><div class="kader-titel">Quotiënt</div>
          <p>$\\sqrt[3]{250} : \\sqrt[3]{2} = \\sqrt[3]{125} = 5$</p>
          <p>$\\sqrt[3]{-54} : \\sqrt[3]{2} = \\sqrt[3]{-27} = -3$</p></div>
      </div>
      <div class="kader eig"><div class="kader-titel">Wortel uit een macht: $\\sqrt[n]{a^n}$</div>
        <p>$n$ oneven: het teken blijft. &nbsp; $\\sqrt[3]{(-6)^3} = -6$</p>
        <p>$n$ even: de uitkomst is altijd positief. &nbsp; $\\sqrt{(-6)^2} = 6 \\qquad \\sqrt[4]{(-5)^4} = 5$</p>
      </div>
      <div class="kader werk"><div class="kader-titel">Breuken</div>
        <p>Werk eerst de <b>teller</b> en de <b>noemer</b> apart uit. Deel daarna.</p>
        <p class="midden">$\\dfrac{\\sqrt[3]{-16} \\cdot \\sqrt[3]{4}}{\\sqrt[5]{-32} + \\sqrt{(-3)^2}} = \\dfrac{\\sqrt[3]{-64}}{-2 + 3} = \\dfrac{-4}{1} = -4$</p>
      </div>`,
    voorbeelden: [
      { tex: '\\sqrt[3]{-16} \\cdot \\sqrt[3]{4}', stappen: ['= \\sqrt[3]{-16 \\cdot 4}', '= \\sqrt[3]{-64}', '= -4'] },
      { tex: '\\sqrt[4]{8} \\cdot \\sqrt[4]{162}', stappen: ['= \\sqrt[4]{8 \\cdot 162}', '= \\sqrt[4]{1296}', '= 6 \\quad\\text{want}\\quad 6^4 = 1296'] },
      { tex: '\\sqrt[3]{250} : \\sqrt[3]{2}', stappen: ['= \\sqrt[3]{250 : 2}', '= \\sqrt[3]{125}', '= 5'] },
      { tex: '\\sqrt[4]{(-5)^4} - \\sqrt{(-4)^2}', stappen: ['\\sqrt[4]{(-5)^4} = 5 \\quad\\text{en}\\quad \\sqrt{(-4)^2} = 4 \\quad (n \\text{ even})', '= 5 - 4 = 1'] },
      { tex: '\\dfrac{\\sqrt{(-6)^2} - \\sqrt[3]{(-6)^3}}{\\sqrt[3]{-3} \\cdot \\sqrt[3]{9}}', stappen: ['\\text{teller: } 6 - (-6) = 12', '\\text{noemer: } \\sqrt[3]{-27} = -3', '\\dfrac{12}{-3} = -4'] },
    ],
    soorten: {
      product: { naam: 'Product van wortels', gen: product },
      quotient: { naam: 'Quotiënt van wortels', gen: quotient },
      machtonder: { naam: 'Wortel uit een macht', gen: machtOnder },
      som: { naam: 'Som en verschil', gen: som },
      breuk: { naam: 'Breuk: teller en noemer', gen: breuk },
    },
    oefenMix: [['product', 2], ['quotient', 2], ['machtonder', 2], ['som', 2], ['breuk', 2]],
    test: [['product', 2], ['quotient', 2], ['machtonder', 2], ['som', 2], ['breuk', 2]],
  };
})();

// ======================= DEEL 3: wortels van getallen vereenvoudigen =======================
const DEEL3 = (() => {
  const { rnd, kies, wT, wE, heeftNdeMachtFactor } = G;
  function vereenvoudig(ns, soort) {
    for (;;) {
      const n = kies(ns);
      const k = n === 2 ? rnd(2, 10) : n === 3 ? rnd(2, 5) : rnd(2, 3);
      const r = kies(n === 2 ? [2, 3, 5, 6, 7, 10, 11] : n === 3 ? [2, 3, 4, 5, 6, 7, 9, 10] : [2, 3, 4, 5, 6, 8]);
      if (heeftNdeMachtFactor(r, n) || k ** n * r > 1500) continue;
      const neg = n % 2 === 1 && Math.random() < 0.3;
      const x = (neg ? -1 : 1) * k ** n * r, kk = (neg ? -1 : 1) * k;
      const antT = `${kk}${wT(n, r)}`;
      return { soort, opdracht: 'Vereenvoudig.', tex: wT(n, x), antw: A(`${kk}*${wE(n, r)}`, ['vereenvoudigd'], antT),
        uitleg: [`${wT(n, x)} = ${wT(n, `${neg ? '-' : ''}${k ** n} \\cdot ${r}`)} = ${antT} \\qquad \\text{want } ${k}^{${n}} = ${k ** n}`] };
    }
  }
  return {
    nr: 3, titel: 'Wortels van getallen vereenvoudigen', kort: 'Bijvoorbeeld ∛250 = 5∛2.', klaar: true,
    theorie: `
      <div class="kader def"><div class="kader-titel">Factoren buiten het wortelteken brengen</div>
        <p class="midden">$\\sqrt[n]{a^n \\cdot b} = a \\cdot \\sqrt[n]{b}$</p>
        <p class="midden">$\\sqrt[3]{250} = \\sqrt[3]{125 \\cdot 2} = 5\\sqrt[3]{2}$</p>
      </div>
      <div class="kader werk"><div class="kader-titel">Werkwijze</div>
        <ol>
          <li>Zoek de <b>grootste $n$-de macht</b> die een deler is van het getal onder het wortelteken (gebruik de tabel).</li>
          <li>Schrijf het getal als product: $n$-de macht $\\cdot$ rest.</li>
          <li>Breng de $n$-de machtswortel van die macht <b>buiten</b> het wortelteken.</li>
          <li>Bij een oneven $n$ mag het minteken buiten: $\\sqrt[3]{-54} = -3\\sqrt[3]{2}$.</li>
        </ol>
        <p class="klein">Controle: onder het wortelteken mag geen $n$-de macht meer als factor zitten.</p>
      </div>
      <div class="kader"><div class="kader-titel">Handige machten</div><div class="tabelwrap">
        <table class="machten">
          <tr><th>$b$</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th></tr>
          <tr><td>$b^2$</td><td>4</td><td>9</td><td>16</td><td>25</td><td>36</td><td>49</td><td>64</td><td>81</td><td>100</td></tr>
          <tr><td>$b^3$</td><td>8</td><td>27</td><td>64</td><td>125</td><td>216</td><td>343</td><td>512</td><td>729</td><td>1000</td></tr>
          <tr><td>$b^4$</td><td>16</td><td>81</td><td>256</td><td>625</td><td>1296</td><td></td><td></td><td></td><td></td></tr>
        </table></div></div>
      ${INVOERHULP}`,
    voorbeelden: [
      { tex: '\\sqrt{80}', stappen: ['\\text{grootste kwadraat in 80: } 16', '\\sqrt{80} = \\sqrt{16 \\cdot 5}', '= 4\\sqrt{5}'] },
      { tex: '\\sqrt[4]{80}', stappen: ['\\text{grootste vierdemacht in 80: } 16 = 2^4', '\\sqrt[4]{80} = \\sqrt[4]{16 \\cdot 5}', '= 2\\sqrt[4]{5}'] },
      { tex: '\\sqrt[3]{81}', stappen: ['\\text{grootste derdemacht in 81: } 27 = 3^3', '\\sqrt[3]{81} = \\sqrt[3]{27 \\cdot 3}', '= 3\\sqrt[3]{3}'] },
      { tex: '\\sqrt[3]{-54}', stappen: ['\\sqrt[3]{-54} = \\sqrt[3]{-27 \\cdot 2}', '= -3\\sqrt[3]{2}'] },
      { tex: '\\sqrt[4]{162}', stappen: ['\\sqrt[4]{162} = \\sqrt[4]{81 \\cdot 2}', '= 3\\sqrt[4]{2}'] },
    ],
    soorten: {
      even: { naam: 'Vierkantswortel en vierdemachtswortel', gen: () => vereenvoudig([2, 2, 4], 'even') },
      oneven: { naam: 'Derdemachtswortel', gen: () => vereenvoudig([3], 'oneven') },
    },
    oefenMix: [['even', 1], ['oneven', 1]],
    test: [['even', 5], ['oneven', 5]],
    testSchudAlles: true,
  };
})();

// ======================= DEEL 4: machten met rationale exponenten (getallen) =======================
const DEEL4 = (() => {
  const { rnd, kies, wT, gcd, brT, getalT } = G;
  function kiesMacht(maxUit = 1000) {
    for (;;) {
      const n = kies([2, 2, 3, 3, 4, 5]); const b = rnd(2, n === 2 ? 9 : n === 3 ? 5 : n === 4 ? 3 : 2);
      const m = rnd(1, 5); if (m === n || gcd(m, n) !== 1 || b ** m > maxUit || b ** n > 1024) continue;
      return { n, b, m, x: b ** n };
    }
  }
  function positief() {
    const { n, b, m, x } = kiesMacht();
    const tex = `${x}^{\\frac{${m}}{${n}}}`, w = b ** m;
    return { soort: 'positief', opdracht: 'Bereken zonder rekentoestel.', tex, antw: A(`${w}`, ['getal'], `${w}`),
      uitleg: [`${tex} = \\left(${wT(n, x)}\\right)^{${m}} = ${b}^{${m}} = ${w}`] };
  }
  function negatief() {
    const { n, b, m, x } = kiesMacht(1000);
    const tex = `${x}^{-\\frac{${m}}{${n}}}`, w = b ** m;
    return { soort: 'negatief', opdracht: 'Bereken zonder rekentoestel.', tex, antw: A(`1/${w}`, ['getal'], `\\frac{1}{${w}}`),
      uitleg: [`${tex} = \\dfrac{1}{${x}^{\\frac{${m}}{${n}}}} = \\dfrac{1}{\\left(${wT(n, x)}\\right)^{${m}}} = \\dfrac{1}{${b}^{${m}}} = \\dfrac{1}{${w}}`] };
  }
  function decimaal() {
    const D = [[0.5, 1, 2], [1.5, 3, 2], [2.5, 5, 2], [0.25, 1, 4], [0.75, 3, 4], [1.25, 5, 4], [0.2, 1, 5], [0.4, 2, 5], [0.6, 3, 5], [0.8, 4, 5]];
    for (;;) {
      const [d, p, q] = kies(D); const b = rnd(2, q === 2 ? 9 : q === 4 ? 3 : 2);
      if (b ** p > 1000) continue;
      const neg = Math.random() < 0.2, x = b ** q, w = b ** p;
      const tex = `${x}^{${neg ? '-' : ''}${getalT(d)}}`;
      const st = [`${neg ? '-' : ''}${getalT(d)} = ${neg ? '-' : ''}\\frac{${p}}{${q}}`];
      if (neg) st.push(`${tex} = \\dfrac{1}{\\left(${wT(q, x)}\\right)^{${p}}} = \\dfrac{1}{${b}^{${p}}} = \\dfrac{1}{${w}}`);
      else st.push(`${tex} = ${x}^{\\frac{${p}}{${q}}} = \\left(${wT(q, x)}\\right)^{${p}} = ${b}^{${p}} = ${w}`);
      return { soort: 'decimaal', opdracht: 'Bereken zonder rekentoestel.', tex, antw: neg ? A(`1/${w}`, ['getal'], `\\frac{1}{${w}}`) : A(`${w}`, ['getal'], `${w}`), uitleg: st };
    }
  }
  return {
    nr: 4, titel: 'Machten met rationale exponenten', kort: 'Bijvoorbeeld 16^(3/4) en 27^(−2/3).', klaar: true,
    theorie: `
      <div class="kader def"><div class="kader-titel">Macht met een breuk als exponent</div>
        <p class="midden">$a^{\\frac{m}{n}} = \\sqrt[n]{a^m} = \\left(\\sqrt[n]{a}\\right)^m \\qquad (a > 0)$</p>
        <p>Tip: neem <b>eerst de wortel</b>, dan de macht. Dan blijven de getallen klein.</p>
        <p class="midden">$16^{\\frac{3}{4}} = \\left(\\sqrt[4]{16}\\right)^3 = 2^3 = 8$</p>
      </div>
      <div class="twee">
        <div class="kader eig"><div class="kader-titel">Negatieve exponent</div>
          <p class="midden">$a^{-r} = \\dfrac{1}{a^r}$</p>
          <p>$27^{-\\frac{2}{3}} = \\dfrac{1}{27^{\\frac{2}{3}}} = \\dfrac{1}{\\left(\\sqrt[3]{27}\\right)^2} = \\dfrac{1}{3^2} = \\dfrac{1}{9}$</p></div>
        <div class="kader eig"><div class="kader-titel">Decimale exponent</div>
          <p>Schrijf de exponent eerst als breuk.</p>
          <p>$0{,}5 = \\frac{1}{2} \\quad 1{,}5 = \\frac{3}{2} \\quad 2{,}5 = \\frac{5}{2} \\quad 0{,}25 = \\frac{1}{4} \\quad 0{,}75 = \\frac{3}{4} \\quad 0{,}2 = \\frac{1}{5} \\quad 0{,}4 = \\frac{2}{5}$</p>
          <p>$9^{2{,}5} = 9^{\\frac{5}{2}} = \\left(\\sqrt{9}\\right)^5 = 3^5 = 243$</p></div>
      </div>
      ${INVOERHULP}`,
    voorbeelden: [
      { tex: '16^{\\frac{3}{4}}', stappen: ['= \\left(\\sqrt[4]{16}\\right)^3', '= 2^3', '= 8'] },
      { tex: '27^{-\\frac{2}{3}}', stappen: ['= \\dfrac{1}{27^{\\frac{2}{3}}}', '= \\dfrac{1}{\\left(\\sqrt[3]{27}\\right)^2} = \\dfrac{1}{3^2}', '= \\dfrac{1}{9}'] },
      { tex: '9^{2{,}5}', stappen: ['2{,}5 = \\frac{5}{2}', '9^{\\frac{5}{2}} = \\left(\\sqrt{9}\\right)^5 = 3^5', '= 243'] },
      { tex: '125^{\\frac{2}{3}}', stappen: ['= \\left(\\sqrt[3]{125}\\right)^2', '= 5^2', '= 25'] },
      { tex: '32^{0{,}4}', stappen: ['0{,}4 = \\frac{2}{5}', '32^{\\frac{2}{5}} = \\left(\\sqrt[5]{32}\\right)^2 = 2^2', '= 4'] },
    ],
    soorten: {
      positief: { naam: 'Positieve exponent', gen: positief },
      negatief: { naam: 'Negatieve exponent', gen: negatief },
      decimaal: { naam: 'Decimale exponent', gen: decimaal },
    },
    oefenMix: [['positief', 2], ['negatief', 1], ['decimaal', 1]],
    test: [['positief', 4], ['negatief', 3], ['decimaal', 3]],
    testSchudAlles: true,
  };
})();

// ======================= DEEL 5: van wortel naar macht en terug =======================
const DEEL5 = (() => {
  const { rnd, kies, wT, wE, gcd, lcm, red, brT, mT, mE, haalBuiten, wortelVormT, wortelVormE } = G;
  const grondtal = () => kies(['a', 'a', 'a', 2, 3, 5, 7]);
  const machtT = (g, m) => m === 1 ? `${g}` : `${g}^{${m}}`;
  const machtE = (g, m) => m === 1 ? `${g}` : `${g}^(${m})`;
  const opdr = (g, t) => t + (typeof g === 'string' ? ' (a > 0)' : '');

  function naarMacht() {
    const g = grondtal(); const n = rnd(2, 9); let m = rnd(1, 15); if (m === n) m++;
    const tex = wT(n, machtT(g, m)), [p, q] = red(m, n);
    return { soort: 'naarmacht', opdracht: opdr(g, 'Schrijf als één macht.'), tex, antw: A(mE(g, p, q), ['een_macht'], mT(g, p, q)),
      uitleg: [`${tex} = ${g}^{\\frac{${m}}{${n}}}${q !== n ? ` = ${mT(g, p, q)}` : ''}`] };
  }
  function naarWortel() {
    for (;;) {
      const g = grondtal(); const q = rnd(2, 9), p = rnd(1, 13);
      if (p === q || gcd(p, q) !== 1) continue;
      const tex = mT(g, p, q);
      return { soort: 'naarwortel', opdracht: opdr(g, 'Schrijf als één wortel.'), tex, antw: A(wE(q, machtE(g, p)), ['een_wortel'], wT(q, machtT(g, p))),
        uitleg: [`${tex} = ${wT(q, machtT(g, p))}`] };
    }
  }
  function tweeWortels() { // ⁿ√(g^p) en ᵐ√(g^q) met n ≠ m
    for (;;) { const n = rnd(2, 5), m = rnd(2, 5); if (n === m) continue; return { n, m, p: rnd(1, 7), q: rnd(1, 7) }; }
  }
  function product() {
    const { n, m, p, q } = tweeWortels(); const L = lcm(n, m);
    const [s, t] = red(p * m + q * n, n * m);
    const tex = `${wT(n, machtT('a', p))} \\cdot ${wT(m, machtT('a', q))}`;
    return { soort: 'product', opdracht: 'Vereenvoudig tot één macht van a (a > 0).', tex, antw: A(mE('a', s, t), ['een_macht'], mT('a', s, t)),
      uitleg: [`${tex} = a^{\\frac{${p}}{${n}}} \\cdot a^{\\frac{${q}}{${m}}}`, `= a^{\\frac{${p}}{${n}} + \\frac{${q}}{${m}}} = a^{\\frac{${p * L / n}}{${L}} + \\frac{${q * L / m}}{${L}}}`, `= ${mT('a', s, t)}`] };
  }
  function quotient() {
    for (;;) {
      const n = rnd(2, 4), m = Math.random() < 0.4 ? n : rnd(2, 4), p = rnd(2, 9), q = rnd(1, 6);
      const [s, t] = red(p * m - q * n, n * m); if (s === 0) continue;
      const L = lcm(n, m);
      const tex = `\\dfrac{${wT(n, machtT('a', p))}}{${wT(m, machtT('a', q))}}`;
      return { soort: 'quotient', opdracht: 'Vereenvoudig tot één macht van a (a > 0).', tex, antw: A(mE('a', s, t), ['een_macht'], mT('a', s, t)),
        uitleg: [`${tex} = \\dfrac{a^{\\frac{${p}}{${n}}}}{a^{\\frac{${q}}{${m}}}} = a^{\\frac{${p}}{${n}} - \\frac{${q}}{${m}}}`, n === m ? `= a^{\\frac{${p - q}}{${n}}}` : `= a^{\\frac{${p * L / n}}{${L}} - \\frac{${q * L / m}}{${L}}}`, `= ${mT('a', s, t)}`] };
    }
  }
  function machtVanMacht() {
    for (;;) {
      const q = rnd(2, 6), p = rnd(1, 7), r = rnd(2, 6); if (gcd(p, q) !== 1) continue;
      const [s, t] = red(p * r, q);
      const tex = `\\left(a^{\\frac{${p}}{${q}}}\\right)^{${r}}`;
      return { soort: 'machtvanmacht', opdracht: 'Vereenvoudig tot één macht van a (a > 0).', tex, antw: A(mE('a', s, t), ['een_macht'], mT('a', s, t)),
        uitleg: [`${tex} = a^{\\frac{${p}}{${q}} \\cdot ${r}} = a^{\\frac{${p * r}}{${q}}}${t !== q ? ` = ${mT('a', s, t)}` : ''}`] };
    }
  }
  function eenWortelGetal() {
    for (;;) {
      const g = kies([2, 3, 5, 6, 7]); const n = rnd(2, 8), m = rnd(2, 8); if (n === m) continue;
      const p = rnd(1, 11), q = rnd(1, 11), deel = Math.random() < 0.35;
      const [s, t] = red(deel ? p * m - q * n : p * m + q * n, n * m); if (t === 1 || s <= 0) continue;
      const L = lcm(n, m);
      const tex = deel ? `\\dfrac{${wT(n, machtT(g, p))}}{${wT(m, machtT(g, q))}}` : `${wT(n, machtT(g, p))} \\cdot ${wT(m, machtT(g, q))}`;
      return { soort: 'eenwortelgetal', opdracht: 'Schrijf als één wortel.', tex, antw: A(wE(t, machtE(g, s)), ['een_wortel'], wT(t, machtT(g, s))),
        uitleg: [`${tex} = ${g}^{\\frac{${p}}{${n}}} ${deel ? '\\!:\\!' : '\\cdot'} ${g}^{\\frac{${q}}{${m}}} = ${g}^{\\frac{${p * L / n}}{${L}} ${deel ? '-' : '+'} \\frac{${q * L / m}}{${L}}}`, `= ${g}^{${brT(s, t)}} = ${wT(t, machtT(g, s))}`] };
    }
  }
  function eenWortelVereenvoudig() {
    for (;;) {
      const n = rnd(2, 5), m = rnd(2, 5); if (n === m) continue;
      const p = rnd(1, 6), q = rnd(1, 6);
      const [s, t] = red(p * m + q * n, n * m); if (t === 1 || s < t) continue;
      const L = lcm(n, m), r = haalBuiten(t, 1, { a: s });
      const tex = `${wT(n, machtT('a', p))} \\cdot ${wT(m, machtT('a', q))}`;
      return { soort: 'eenwortel', opdracht: 'Schrijf als één wortel en vereenvoudig zo ver mogelijk (a > 0).', tex,
        antw: A(wortelVormE(t, r), ['vereenvoudigd'], wortelVormT(t, r)),
        uitleg: [`${tex} = a^{\\frac{${p}}{${n}}} \\cdot a^{\\frac{${q}}{${m}}} = a^{\\frac{${p * L / n}}{${L}} + \\frac{${q * L / m}}{${L}}} = a^{${brT(s, t)}}`, `= ${wT(t, machtT('a', s))} = ${wortelVormT(t, r)}`] };
    }
  }

  return {
    nr: 5, titel: 'Van wortel naar macht en terug', kort: 'Schrijven als één macht of één wortel.', klaar: true,
    theorie: `
      <div class="kader def"><div class="kader-titel">Verband tussen machten en wortels</div>
        <p class="midden">$\\sqrt[n]{a^m} = a^{\\frac{m}{n}} \\qquad\\qquad \\sqrt[3]{7^4} = 7^{\\frac{4}{3}} \\qquad\\qquad a^{\\frac{5}{6}} = \\sqrt[6]{a^5}$</p>
        <p class="klein">De exponent onder het wortelteken komt in de <b>teller</b>, de wortelexponent in de <b>noemer</b>.</p>
      </div>
      <div class="kader eig"><div class="kader-titel">Rekenregels voor machten</div>
        <p class="midden">$a^p \\cdot a^q = a^{p+q} \\qquad \\dfrac{a^p}{a^q} = a^{p-q} \\qquad \\left(a^p\\right)^q = a^{p \\cdot q}$</p>
        <p class="klein">Breuken optellen of aftrekken: eerst gelijknamig maken.</p>
      </div>
      <div class="kader werk"><div class="kader-titel">Werkwijze: product of quotiënt van wortels</div>
        <ol>
          <li>Schrijf elke wortel als een <b>macht</b>.</li>
          <li>Tel de exponenten op (product) of trek ze af (quotiënt). Maak de breuken eerst gelijknamig.</li>
          <li>Schrijf terug als <b>één wortel</b> als dat gevraagd is.</li>
        </ol>
        <p class="midden">$\\sqrt[3]{2^5} \\cdot \\sqrt[4]{2^7} = 2^{\\frac{5}{3}} \\cdot 2^{\\frac{7}{4}} = 2^{\\frac{20}{12} + \\frac{21}{12}} = 2^{\\frac{41}{12}} = \\sqrt[12]{2^{41}}$</p>
      </div>
      <div class="kader werk"><div class="kader-titel">Eén wortel én vereenvoudigen</div>
        <p>Staat er "vereenvoudig zo ver mogelijk", breng dan nog factoren buiten de wortel: deel de exponent door de wortelexponent.</p>
        <p class="midden">$\\sqrt[3]{a^2} \\cdot \\sqrt[4]{a^3} = a^{\\frac{17}{12}} = \\sqrt[12]{a^{17}} = a \\cdot \\sqrt[12]{a^5} \\qquad (17 = 1 \\cdot 12 + 5)$</p>
      </div>
      ${INVOERHULP}`,
    voorbeelden: [
      { tex: '\\sqrt[4]{a^6}', stappen: ['= a^{\\frac{6}{4}}', '= a^{\\frac{3}{2}}'] },
      { tex: '9^{\\frac{11}{5}} \\quad\\text{(als wortel)}', stappen: ['= \\sqrt[5]{9^{11}}'] },
      { tex: '\\sqrt{a} \\cdot \\sqrt[3]{a^2}', stappen: ['= a^{\\frac{1}{2}} \\cdot a^{\\frac{2}{3}}', '= a^{\\frac{3}{6} + \\frac{4}{6}}', '= a^{\\frac{7}{6}}'] },
      { tex: '\\dfrac{\\sqrt{a^7}}{\\sqrt{a^3}}', stappen: ['= \\dfrac{a^{\\frac{7}{2}}}{a^{\\frac{3}{2}}}', '= a^{\\frac{7}{2} - \\frac{3}{2}} = a^{\\frac{4}{2}}', '= a^2'] },
      { tex: '\\left(a^{\\frac{2}{3}}\\right)^3', stappen: ['= a^{\\frac{2}{3} \\cdot 3}', '= a^2'] },
      { tex: '\\sqrt[3]{5^4} \\cdot \\sqrt[4]{5^3} \\quad\\text{(als één wortel)}', stappen: ['= 5^{\\frac{4}{3}} \\cdot 5^{\\frac{3}{4}}', '= 5^{\\frac{16}{12} + \\frac{9}{12}} = 5^{\\frac{25}{12}}', '= \\sqrt[12]{5^{25}}'] },
      { tex: '\\sqrt[3]{a^2} \\cdot \\sqrt[4]{a^3} \\quad\\text{(één wortel, vereenvoudigd)}', stappen: ['= a^{\\frac{8}{12} + \\frac{9}{12}} = a^{\\frac{17}{12}}', '= \\sqrt[12]{a^{17}}', '= a \\cdot \\sqrt[12]{a^5}'] },
    ],
    soorten: {
      naarmacht: { naam: 'Wortel → macht', gen: naarMacht },
      naarwortel: { naam: 'Macht → wortel', gen: naarWortel },
      product: { naam: 'Product → één macht', gen: product },
      quotient: { naam: 'Quotiënt → één macht', gen: quotient },
      machtvanmacht: { naam: 'Macht van een macht', gen: machtVanMacht },
      eenwortelgetal: { naam: 'Als één wortel (getallen)', gen: eenWortelGetal },
      eenwortel: { naam: 'Eén wortel en vereenvoudigen', gen: eenWortelVereenvoudig },
    },
    oefenMix: [['naarmacht', 2], ['naarwortel', 2], ['product', 2], ['quotient', 2], ['machtvanmacht', 1], ['eenwortelgetal', 2], ['eenwortel', 2]],
    test: [['naarmacht', 1], ['naarwortel', 1], ['product', 2], ['quotient', 1], ['machtvanmacht', 1], ['eenwortelgetal', 2], ['eenwortel', 2]],
  };
})();

// ======================= DEEL 6: wortels met letters vereenvoudigen =======================
const DEEL6 = (() => {
  const { rnd, kies, wT, monoT, haalBuiten, wortelVormT, wortelVormE, heeftNdeMachtFactor } = G;
  function splitsT(n, c, l) { // ∛(27 · 2 · a^6 · a · b^3 · b^2)
    const d = [];
    const r = haalBuiten(n, c, l);
    const cb = Math.abs(r.buiten.c) ** n * (c < 0 ? -1 : 1);
    if (Math.abs(cb) !== 1) d.push(`${cb}`); else if (c < 0) d.push('-1');
    if (r.binnen.c !== 1) d.push(`${r.binnen.c}`);
    for (const v of Object.keys(l)) {
      if (r.buiten.l[v]) d.push(`${v}^{${n * r.buiten.l[v]}}`);
      if (r.binnen.l[v]) d.push(r.binnen.l[v] === 1 ? v : `${v}^{${r.binnen.l[v]}}`);
    }
    return wT(n, d.join(' \\cdot '));
  }
  function maak(soort, n, c, l, opdracht) {
    const r = haalBuiten(n, c, l);
    const tex = wT(n, monoT(c, l)), ant = wortelVormT(n, r);
    return { soort, opdracht, tex, antw: A(wortelVormE(n, r), ['vereenvoudigd'], ant),
      uitleg: [`${tex} = ${splitsT(n, c, l)}`, `= ${ant}`] };
  }
  function zonderGetal() {
    for (;;) {
      const n = rnd(2, 8), twee = Math.random() < 0.5;
      const l = twee ? { a: rnd(1, 3 * n), b: rnd(1, 3 * n) } : { [kies(['a', 'b'])]: rnd(n + 1, 3 * n) };
      if (!Object.values(l).some(e => e >= n)) continue;
      return maak('zondergetal', n, 1, l, 'Vereenvoudig zo ver mogelijk (a, b > 0).');
    }
  }
  function metGetal() {
    for (;;) {
      const n = kies([2, 2, 3, 3, 4]);
      const k = n === 2 ? rnd(1, 6) : n === 3 ? rnd(1, 3) : rnd(1, 2);
      const r = kies(n === 2 ? [1, 2, 3, 5, 6, 7] : n === 3 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 5]);
      if (heeftNdeMachtFactor(r, n) || (k === 1 && r === 1)) continue;
      const neg = n % 2 === 1 && Math.random() < 0.25;
      const c = (neg ? -1 : 1) * k ** n * r;
      const l = { a: rnd(0, 3 * n), b: rnd(1, 2 * n + 1) };
      if (!Object.values(l).some(e => e >= n)) continue;
      if (!l.a) delete l.a;
      return maak('metgetal', n, c, l, 'Vereenvoudig zo ver mogelijk (a, b > 0).');
    }
  }
  return {
    nr: 6, titel: 'Wortels met letters vereenvoudigen', kort: 'Factoren buiten het wortelteken brengen.', klaar: true,
    theorie: `
      <div class="kader def"><div class="kader-titel">Een macht buiten het wortelteken brengen</div>
        <p>Deel de exponent door de wortelexponent $n$. Het <b>quotiënt</b> gaat buiten, de <b>rest</b> blijft onder het wortelteken.</p>
        <p class="midden">$\\sqrt[3]{a^4} = \\sqrt[3]{a^3 \\cdot a} = a\\sqrt[3]{a} \\qquad\\qquad \\sqrt[7]{a^{12}} = a\\sqrt[7]{a^5} \\quad (12 = 1 \\cdot 7 + 5)$</p>
        <p class="klein">We veronderstellen dat de letters strikt positief zijn.</p>
      </div>
      <div class="kader werk"><div class="kader-titel">Werkwijze</div>
        <ol>
          <li>Het <b>getal</b>: zoek de grootste $n$-de macht die erin zit (zoals in deel 3).</li>
          <li>Elke <b>letter</b>: deel de exponent door $n$ (quotiënt buiten, rest binnen).</li>
          <li>Schrijf alles wat buiten komt vóór het wortelteken.</li>
        </ol>
        <p class="midden">$\\sqrt[3]{54a^7b^5} = \\sqrt[3]{27 \\cdot 2 \\cdot a^6 \\cdot a \\cdot b^3 \\cdot b^2} = 3a^2b \\cdot \\sqrt[3]{2ab^2}$</p>
      </div>
      ${INVOERHULP}`,
    voorbeelden: [
      { tex: '\\sqrt[3]{a^4}', stappen: ['= \\sqrt[3]{a^3 \\cdot a}', '= a\\sqrt[3]{a}'] },
      { tex: '\\sqrt[3]{a^7b^{19}}', stappen: ['7 = 2 \\cdot 3 + 1 \\qquad 19 = 6 \\cdot 3 + 1', '= a^2b^6\\sqrt[3]{ab}'] },
      { tex: '\\sqrt{32a^7b^3}', stappen: ['= \\sqrt{16 \\cdot 2 \\cdot a^6 \\cdot a \\cdot b^2 \\cdot b}', '= 4a^3b\\sqrt{2ab}'] },
      { tex: '\\sqrt[3]{54a^7b^5}', stappen: ['= \\sqrt[3]{27 \\cdot 2 \\cdot a^6 \\cdot a \\cdot b^3 \\cdot b^2}', '= 3a^2b\\sqrt[3]{2ab^2}'] },
      { tex: '\\sqrt[4]{16a^8}', stappen: ['= \\sqrt[4]{2^4 \\cdot a^8}', '= 2a^2 \\quad\\text{(er blijft niets onder de wortel)}'] },
    ],
    soorten: {
      zondergetal: { naam: 'Enkel letters', gen: zonderGetal },
      metgetal: { naam: 'Getal en letters', gen: metGetal },
    },
    oefenMix: [['zondergetal', 1], ['metgetal', 2]],
    test: [['zondergetal', 4], ['metgetal', 6]],
  };
})();

// ======================= DEEL 7: samengestelde opgaven =======================
const DEEL7 = (() => {
  const { rnd, kies, wT, monoT, monoBreukT, monoBreukE, lcm, red, brT, haalBuiten, wortelVormT, wortelVormE, isNdeMacht, h } = G;
  const delers = (x) => { const d = []; for (let i = 1; i <= Math.abs(x); i++) if (x % i === 0) d.push(i); return d; };

  function noemerTerm(c, v, p) { // term met waarde c·v^p, geschreven als wortel
    const vp = p === 1 ? v : `${v}^{${p}}`;
    const opties = [];
    if (c > 0) {
      opties.push(() => wT(2, `(${c === 1 ? '' : c}${vp})^{2}`));
      opties.push(() => wT(2, `(-${c === 1 ? '' : c}${vp})^{2}`));
      if (c <= 3) opties.push(() => wT(4, monoT(c ** 4, { [v]: 4 * p })));
    }
    if (Math.abs(c) <= 5) opties.push(() => wT(3, monoT(c ** 3, { [v]: 3 * p })));
    if (Math.abs(c) <= 2) opties.push(() => wT(5, monoT(c ** 5, { [v]: 5 * p })));
    return kies(opties)();
  }
  function breuk() {
    for (;;) {
      const m = kies([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]); const i = rnd(1, 3), j = rnd(1, 3);
      const M3 = m ** 3, ds = delers(Math.abs(M3)).filter(d => d > 1 && d < Math.abs(M3) && !isNdeMacht(d, 3) && !isNdeMacht(M3 / d, 3));
      if (!ds.length) continue;
      let x = kies(ds), y = M3 / x; if (Math.random() < 0.5) { x = -x; y = -y; }
      const i1 = rnd(1, 3 * i - 1), j1 = rnd(0, 3 * j);
      const X = monoT(x, { a: i1, b: j1 }), Y = monoT(y, { a: 3 * i - i1, b: 3 * j - j1 });
      // noemer: c1·v^p ± c2·v^p
      const v = kies(['a', 'b']), p = rnd(1, 3);
      const Ds = delers(Math.abs(m)).flatMap(d => [d, -d]);
      const D = kies(Ds); const c1 = kies([-3, -2, 2, 3, 4, 5]); const c2 = D - c1;
      if (!c2 || Math.abs(c2) > 6 || Math.abs(c1) > 5) continue;
      const t1 = noemerTerm(c1, v, p), t2 = noemerTerm(Math.abs(c2), v, p);
      const noemerT = `${t1} ${c2 < 0 ? '-' : '+'} ${t2}`;
      const l = { a: i - (v === 'a' ? p : 0), b: j - (v === 'b' ? p : 0) };
      const ant = monoBreukT(m, D, l);
      const DT = monoT(D, { [v]: p });
      return { soort: 'breuk', opdracht: 'Vereenvoudig zo ver mogelijk. Werk eerst de teller en de noemer apart uit (a, b > 0).',
        tex: `\\dfrac{${wT(3, X)} \\cdot ${wT(3, Y)}}{${noemerT}}`,
        antw: A(monoBreukE(m, D, l), ['vereenvoudigd', 'geen_neg'], ant),
        uitleg: [`\\text{teller: } ${wT(3, monoT(M3, { a: 3 * i, b: 3 * j }))} = ${monoT(m, { a: i, b: j })}`,
          `\\text{noemer: } ${monoT(c1, { [v]: p })} ${c2 < 0 ? '-' : '+'} ${monoT(Math.abs(c2), { [v]: p })} = ${DT}`,
          `\\dfrac{${monoT(m, { a: i, b: j })}}{${DT}} = ${ant}`] };
    }
  }
  function rationaal() {
    for (;;) {
      const n = kies([2, 3, 4]), m = kies([2, 3, 4]);
      const p1 = rnd(-3, 5), q1 = rnd(-3, 5), p2 = rnd(-3, 5), q2 = rnd(-3, 5);
      if (![p1, q1, p2, q2].some(x => x < 0) || [p1, q1, p2, q2].filter(x => x === 0).length > 1) continue;
      const k = lcm(n, m);
      const A_ = k * p1 / n + k * p2 / m, B = k * q1 / n + k * q2 / m;
      if (!A_ && !B) continue;
      const tex = `\\left(${wT(n, monoT(1, { a: p1, b: q1 }))} \\cdot ${wT(m, monoT(1, { a: p2, b: q2 }))}\\right)^{${k}}`;
      const l = { a: A_, b: B };
      const ant = monoBreukT(1, 1, l);
      const e = (x, d) => brT(x, d);
      const plus = (x, d) => x < 0 ? `- ${brT(-x, d)}` : `+ ${brT(x, d)}`;
      return { soort: 'rationaal', opdracht: 'Vereenvoudig met rationale exponenten. Schrijf je antwoord zonder negatieve exponenten (a, b > 0).', tex,
        antw: A(monoBreukE(1, 1, l), ['vereenvoudigd', 'geen_neg'], ant),
        uitleg: [`= \\left(a^{${e(p1, n)}} b^{${e(q1, n)}} \\cdot a^{${e(p2, m)}} b^{${e(q2, m)}}\\right)^{${k}}`,
          `= a^{\\left(${e(p1, n)} ${plus(p2, m)}\\right) \\cdot ${k}} \\; b^{\\left(${e(q1, n)} ${plus(q2, m)}\\right) \\cdot ${k}}`,
          `= a^{${A_}} b^{${B}} = ${ant}`] };
    }
  }
  function quotient() {
    for (;;) {
      const n = kies([2, 3, 3, 4, 5]);
      const p = rnd(2, 3 * n), q = rnd(1, 3 * n), r = rnd(1, p - 1), s = rnd(0, q);
      const l = { a: p - r, b: q - s };
      if (!Object.values(l).some(e => e >= n)) continue;
      const res = haalBuiten(n, 1, l);
      const tex = `\\dfrac{${wT(n, monoT(1, { a: p, b: q }))}}{${wT(n, monoT(1, { a: r, b: s }))}}`;
      return { soort: 'quotient', opdracht: 'Vereenvoudig zo ver mogelijk (a, b > 0).', tex,
        antw: A(wortelVormE(n, res), ['vereenvoudigd'], wortelVormT(n, res)),
        uitleg: [`= ${wT(n, `\\dfrac{${monoT(1, { a: p, b: q })}}{${monoT(1, { a: r, b: s })}}`)} = ${wT(n, monoT(1, l))}`, `= ${wortelVormT(n, res)}`] };
    }
  }
  return {
    nr: 7, titel: 'Samengestelde opgaven', kort: 'Teller en noemer apart uitwerken.', klaar: true,
    theorie: `
      <div class="kader werk"><div class="kader-titel">Breuken met wortels en letters</div>
        <ol>
          <li>Werk de <b>teller</b> uit: wortels met dezelfde wortelexponent samennemen, dan vereenvoudigen.</li>
          <li>Werk de <b>noemer</b> uit: elke wortel apart berekenen, gelijksoortige termen optellen.</li>
          <li><b>Deel</b>: getallen delen, exponenten van dezelfde letter aftrekken.</li>
        </ol>
        <p class="midden">$\\dfrac{\\sqrt[3]{-3a^5b^2} \\cdot \\sqrt[3]{-72ab^4}}{\\sqrt[4]{16a^8} - \\sqrt{(-5a^2)^2}} = \\dfrac{\\sqrt[3]{216a^6b^6}}{2a^2 - 5a^2} = \\dfrac{6a^2b^2}{-3a^2} = -2b^2$</p>
        <p class="klein">Let op: $\\sqrt{(-5a^2)^2} = 5a^2$ (even wortel: positief).</p>
      </div>
      <div class="kader werk"><div class="kader-titel">Met rationale exponenten</div>
        <ol>
          <li>Schrijf elke wortel als macht: $\\sqrt[4]{a^3b} = a^{\\frac{3}{4}}b^{\\frac{1}{4}}$.</li>
          <li>Pas de rekenregels voor machten toe per letter.</li>
          <li>Schrijf je antwoord <b>zonder negatieve exponenten</b>: $a^{-3}b^2 = \\dfrac{b^2}{a^3}$.</li>
        </ol>
        <p class="midden">$\\left(\\sqrt[4]{a^3b} \\cdot \\sqrt{a^{-1}b^3}\\right)^4 = \\left(a^{\\frac{3}{4}}b^{\\frac{1}{4}} \\cdot a^{-\\frac{1}{2}}b^{\\frac{3}{2}}\\right)^4 = \\left(a^{\\frac{1}{4}}b^{\\frac{7}{4}}\\right)^4 = ab^7$</p>
      </div>
      ${INVOERHULP}`,
    voorbeelden: [
      { tex: '\\dfrac{\\sqrt[3]{a^7b^4}}{\\sqrt[3]{a^4b}}', stappen: ['= \\sqrt[3]{\\dfrac{a^7b^4}{a^4b}} = \\sqrt[3]{a^3b^3}', '= ab'] },
      { tex: '\\left(\\sqrt[3]{a^5b^3} \\cdot \\sqrt[4]{a^{-2}b^{-3}}\\right)^{12}', stappen: ['= \\left(a^{\\frac{5}{3}}b \\cdot a^{-\\frac{1}{2}}b^{-\\frac{3}{4}}\\right)^{12}', '= a^{\\frac{5}{3} \\cdot 12 - \\frac{1}{2} \\cdot 12} \\; b^{12 - \\frac{3}{4} \\cdot 12}', '= a^{20 - 6} b^{12 - 9} = a^{14}b^3'] },
      { tex: '\\dfrac{\\sqrt[3]{-16a^4b} \\cdot \\sqrt[3]{4a^2b^5}}{\\sqrt[5]{-32a^{10}} + \\sqrt{(-3a^2)^2}}', stappen: ['\\text{teller: } \\sqrt[3]{-64a^6b^6} = -4a^2b^2', '\\text{noemer: } -2a^2 + 3a^2 = a^2', '\\dfrac{-4a^2b^2}{a^2} = -4b^2'] },
      { tex: '\\dfrac{\\sqrt[3]{-24a^2b^4} \\cdot \\sqrt[3]{9ab^5}}{\\sqrt{(-3c^3)^2} + \\sqrt[5]{-c^{15}}}', stappen: ['\\text{teller: } \\sqrt[3]{-216a^3b^9} = -6ab^3', '\\text{noemer: } 3c^3 - c^3 = 2c^3', '\\dfrac{-6ab^3}{2c^3} = -\\dfrac{3ab^3}{c^3}'] },
    ],
    soorten: {
      quotient: { naam: 'Quotiënt van wortels', gen: quotient },
      rationaal: { naam: 'Met rationale exponenten', gen: rationaal },
      breuk: { naam: 'Breuk: teller en noemer', gen: breuk },
    },
    oefenMix: [['quotient', 1], ['rationaal', 1], ['breuk', 2]],
    test: [['quotient', 3], ['rationaal', 3], ['breuk', 4]],
  };
})();
