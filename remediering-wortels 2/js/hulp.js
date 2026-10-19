// Uitleg hoe je antwoorden intypt (onderaan de theorie)
const INVOERHULP = `
  <div class="kader"><div class="kader-titel">Zo typ je je antwoord</div>
    <table class="machten invoertabel">
      <tr><th>wiskunde</th><th>typ</th></tr>
      <tr><td>$5\\sqrt[3]{2}$</td><td><code>5∛2</code> &nbsp;(knop ∛)</td></tr>
      <tr><td>$3a^2b \\cdot \\sqrt[3]{2ab^2}$</td><td><code>3a^2b∛(2ab^2)</code></td></tr>
      <tr><td>$a^{\\frac{7}{6}}$</td><td><code>a^(7/6)</code></td></tr>
      <tr><td>$\\sqrt[12]{5^{25}}$</td><td>knop ⁿ√, kies 12, dan <code>(5^25)</code></td></tr>
      <tr><td>$\\dfrac{1}{9}$ &nbsp; $-\\dfrac{3ab^3}{c^3}$</td><td><code>1/9</code> &nbsp; <code>-3ab^3/c^3</code></td></tr>
    </table>
    <p class="klein">Onder het invulvak zie je meteen hoe je antwoord gelezen wordt. Controleer dat voor je verdergaat.</p>
  </div>`;

// Bouwstenen voor de oefengeneratoren: TeX (voor weergave) en invoertaal (voor het nakijken).
const G = (() => {
  const { rnd, kies } = W;
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => a / gcd(a, b) * b;
  const SUPC = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = (n) => String(n).split('').map(c => c === '-' ? '⁻' : SUPC[+c]).join('');

  // wortels
  const wT = (n, x) => n === 2 ? `\\sqrt{${x}}` : `\\sqrt[${n}]{${x}}`;
  const wE = (n, x) => (n === 2 ? '√' : n === 3 ? '∛' : n === 4 ? '∜' : sup(n) + '√') + `(${x})`;

  // breuken
  const red = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q) || 1; return [p / g, q / g]; };
  const brT = (p, q) => { [p, q] = red(p, q); return q === 1 ? `${p}` : p < 0 ? `-\\frac{${-p}}{${q}}` : `\\frac{${p}}{${q}}`; };
  const brE = (p, q) => { [p, q] = red(p, q); return q === 1 ? `${p}` : `${p}/${q}`; };
  const getalT = (x) => String(x).replace('.', '{,}');
  const getalE = (x) => String(x).replace('.', ',');

  // machten:  g^{p/q}
  const mT = (g, p, q = 1) => { [p, q] = red(p, q); return q === 1 && p === 1 ? `${g}` : `${g}^{${brT(p, q)}}`; };
  const mE = (g, p, q = 1) => { [p, q] = red(p, q); return q === 1 && p === 1 ? `${g}` : `${g}^(${brE(p, q)})`; };

  // eentermen: c · a^i · b^j ...   (l = {a: i, b: j}, exponenten gehele getallen, 0 = weglaten)
  function monoT(c, l = {}, metEen = false) {
    let s = '';
    for (const [v, e] of Object.entries(l)) if (e) s += e === 1 ? v : `${v}^{${e}}`;
    if (!s) return `${c}`;
    if (c === 1 && !metEen) return s;
    if (c === -1 && !metEen) return '-' + s;
    return `${c}${s}`;
  }
  function monoE(c, l = {}) {
    const f = [];
    if (c !== 1 || !Object.values(l).some(Boolean)) f.push(`${c}`);
    for (const [v, e] of Object.entries(l)) if (e) f.push(e === 1 ? v : `${v}^(${e})`);
    return f.join('*');
  }
  // eenterm met gehele exponenten, negatieve exponenten als breuk (zonder negatieve exponenten)
  function monoBreukT(cp, cq, l) {
    const t = {}, n = {};
    for (const [v, e] of Object.entries(l)) { if (e > 0) t[v] = e; if (e < 0) n[v] = -e; }
    [cp, cq] = red(cp, cq);
    const heeftN = cq !== 1 || Object.keys(n).length;
    if (!heeftN) return monoT(cp, t);
    const teller = monoT(Math.abs(cp), t);
    return `${cp < 0 ? '-' : ''}\\frac{${teller}}{${monoT(cq, n)}}`;
  }
  function monoBreukE(cp, cq, l) { // zonder negatieve exponenten: teller/(noemer)
    const t = {}, n = {};
    for (const [v, e] of Object.entries(l)) { if (e > 0) t[v] = e; if (e < 0) n[v] = -e; }
    [cp, cq] = red(cp, cq);
    const teller = monoE(cp, t), noemer = monoE(cq, n);
    return noemer === '1' ? teller : `${teller}/(${noemer})`;
  }

  // vereenvoudig ⁿ√(c · Π v^e):  geeft {buiten: {c, l}, binnen: {c, l}}
  function haalBuiten(n, c, l) {
    let teken = c < 0 ? -1 : 1; c = Math.abs(c);
    let bc = 1, ic = 1;
    for (let p = 2; c > 1 && p <= c; p++) {
      let e = 0; while (c % p === 0) { c /= p; e++; }
      bc *= p ** Math.floor(e / n); ic *= p ** (e % n);
    }
    const bl = {}, il = {};
    for (const [v, e] of Object.entries(l)) { bl[v] = Math.floor(e / n); il[v] = e % n; }
    return { buiten: { c: teken * bc, l: bl }, binnen: { c: ic, l: il } };
  }
  const leegBinnen = (b) => b.c === 1 && !Object.values(b.l).some(Boolean);
  // TeX en invoertaal van  buiten · ⁿ√(binnen)
  function wortelVormT(n, r) {
    const bi = leegBinnen(r.binnen) ? '' : wT(n, monoT(r.binnen.c, r.binnen.l));
    const bu = monoT(r.buiten.c, r.buiten.l);
    if (!bi) return bu;
    if (bu === '1') return bi; if (bu === '-1') return '-' + bi;
    return `${bu} \\cdot ${bi}`;
  }
  function wortelVormE(n, r) {
    const bi = leegBinnen(r.binnen) ? '' : wE(n, monoE(r.binnen.c, r.binnen.l));
    const bu = monoE(r.buiten.c, r.buiten.l);
    if (!bi) return bu;
    return `${bu}*${bi}`;
  }
  const isNdeMacht = (x, n) => { x = Math.abs(x); const r = Math.round(x ** (1 / n)); return [r - 1, r, r + 1].some(y => y >= 0 && y ** n === x); };
  const heeftNdeMachtFactor = (x, n) => { for (let p = 2; p ** n <= Math.abs(x); p++) if (x % (p ** n) === 0) return true; return false; };

  const h = (x) => x < 0 ? `(${x})` : `${x}`;
  return { rnd, kies, gcd, lcm, sup, wT, wE, red, brT, brE, getalT, getalE, mT, mE, monoT, monoE, monoBreukT, monoBreukE, haalBuiten, wortelVormT, wortelVormE, leegBinnen, isNdeMacht, heeftNdeMachtFactor, h };
})();
