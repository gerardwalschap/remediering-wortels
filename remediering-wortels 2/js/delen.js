// Inhoud van het leerpad. Elk deel: theorie, uitgewerkte voorbeelden, oefensoorten (generatoren) en testsamenstelling.
// Een generator geeft een gewoon object terug: { soort, tex, antw:{soort:'getal',waarde}|{soort:'bn'}, uitleg }

const DEEL1_SOORTEN = (() => {
  const { rnd, kies, wortel, haakjes } = W;

  // bereik per wortelexponent (zodat alles in de machtentabel staat)
  const BEREIK = { 2: [2, 12], 3: [1, 6], 4: [1, 5], 5: [1, 3], 6: [1, 2] };
  // 1 als grondtal komt maar af en toe voor (te makkelijk)
  const grondtal = (n, min = 1) => (n === 3 && Math.random() < 0.12) ? 10
    : rnd(Math.max(min === 1 && Math.random() < 0.92 ? 2 : min, BEREIK[n][0]), BEREIK[n][1]);

  function oneven(min = 1) {
    const n = kies([3, 3, 3, 5]);
    const b = grondtal(n, min);
    const t = Math.random() < 0.6 ? -1 : 1;
    const a = t * b ** n, w = t * b;
    return { n, a, w, tex: wortel(n, a),
      uitleg: `${wortel(n, a)} = ${w} \\quad\\text{want}\\quad ${haakjes(w)}^{${n}} = ${a}` };
  }
  function even(min = 1) {
    const n = kies([2, 4, 4, 4, 6]);
    const b = n === 2 ? rnd(2, 12) : grondtal(n, min);
    const a = b ** n;
    return { n, a, w: b, tex: wortel(n, a),
      uitleg: `${wortel(n, a)} = ${b} \\quad\\text{want}\\quad ${b}^{${n}} = ${a} \\;\\text{en}\\; ${b} \\geq 0` };
  }

  return {
    oneven: { naam: 'Oneven wortelexponent', gen() {
      const r = oneven(); return { soort: 'oneven', tex: r.tex, antw: { soort: 'getal', waarde: r.w }, uitleg: r.uitleg }; } },

    even: { naam: 'Even wortelexponent', gen() {
      const r = even(); return { soort: 'even', tex: r.tex, antw: { soort: 'getal', waarde: r.w }, uitleg: r.uitleg }; } },

    bestaatniet: { naam: 'Bestaat het wel?', gen() {
      const n = kies([2, 4, 4, 6]);
      let a;
      if (Math.random() < 0.6) a = -((n === 2 ? rnd(2, 12) : grondtal(n)) ** n);
      else a = -kies(n === 2 ? [8, 12, 20, 50] : [80, 20, 50, 100]);
      const tex = wortel(n, a);
      return { soort: 'bestaatniet', tex, antw: { soort: 'bn' },
        uitleg: `${tex}\\;\\text{ bestaat niet: } ${n} \\text{ is even en } ${a} < 0.\\;\\text{Een getal tot een even macht is nooit negatief.}` };
    } },

    combinatie: { naam: 'Som of verschil van wortels', gen() {
      // één oneven en één even wortel, in willekeurige volgorde, met + of −
      const p = oneven(2), q = even(2);
      const [x, y] = Math.random() < 0.5 ? [p, q] : [q, p];
      const plus = Math.random() < 0.55;
      const uit = plus ? x.w + y.w : x.w - y.w;
      const tex = `${x.tex} ${plus ? '+' : '-'} ${y.tex}`;
      const tussen = `${x.w} ${plus ? '+' : '-'} ${haakjes(y.w)}`;
      return { soort: 'combinatie', tex, antw: { soort: 'getal', waarde: uit },
        uitleg: `${tex} = ${tussen} = ${uit}` };
    } },
  };
})();

const DELEN = [
  {
    nr: 1,
    titel: 'n-de machtswortels berekenen',
    kort: 'Bereken een wortel of besluit dat hij niet bestaat.',
    klaar: true,
    invoer: 'getal_bn',
    opdracht: 'Bereken. Bestaat de wortel niet? Klik dan op "bestaat niet".',
    theorie: `
      <div class="kader def">
        <div class="kader-titel">Wat is een n-de machtswortel?</div>
        <p>$\\sqrt[n]{a}$ is het getal dat je tot de $n$-de macht moet verheffen om $a$ te krijgen.</p>
        <p class="midden">$\\sqrt[3]{8} = 2 \\quad\\text{want}\\quad 2^3 = 8$</p>
        <p class="klein">Bij een gewone vierkantswortel schrijf je de 2 niet: $\\sqrt{25} = \\sqrt[2]{25} = 5$.</p>
      </div>

      <div class="twee">
        <div class="kader eig">
          <div class="kader-titel">$n$ is oneven &nbsp;(3, 5, 7, …)</div>
          <p>De wortel bestaat <b>altijd</b>. Het teken blijft behouden.</p>
          <p>$\\sqrt[3]{27} = 3 \\quad\\text{want}\\quad 3^3 = 27$</p>
          <p>$\\sqrt[3]{-27} = -3 \\quad\\text{want}\\quad (-3)^3 = -27$</p>
        </div>
        <div class="kader eig">
          <div class="kader-titel">$n$ is even &nbsp;(2, 4, 6, …)</div>
          <p>De wortel bestaat <b>enkel als het getal onder het wortelteken niet negatief is</b>. De uitkomst is nooit negatief.</p>
          <p>$\\sqrt[4]{16} = 2 \\quad\\text{want}\\quad 2^4 = 16$ &nbsp;(niet $-2$!)</p>
          <p>$\\sqrt[4]{-80}$ <b>bestaat niet</b>: een getal tot een even macht is nooit negatief.</p>
        </div>
      </div>

      <div class="kader werk">
        <div class="kader-titel">Werkwijze</div>
        <ol>
          <li>Kijk naar $n$: is die <b>even</b> of <b>oneven</b>?</li>
          <li>$n$ even én een negatief getal onder het wortelteken? Dan <b>bestaat de wortel niet</b>.</li>
          <li>Zoek het getal dat tot de $n$-de macht het getal onder het wortelteken geeft (gebruik de tabel).</li>
          <li>$n$ oneven en een negatief getal onder het wortelteken? Dan is de uitkomst <b>negatief</b>.</li>
        </ol>
      </div>

      <div class="kader werk">
        <div class="kader-titel">Som of verschil van wortels</div>
        <p>Bereken eerst elke wortel apart, reken daarna uit.</p>
        <p class="midden">$\\sqrt[3]{-216} + \\sqrt[4]{16} = -6 + 2 = -4$</p>
      </div>

      <div class="kader">
        <div class="kader-titel">Handige machten</div>
        <table class="machten">
          <tr><th>$b$</th><th>$b^2$</th><th>$b^3$</th><th>$b^4$</th><th>$b^5$</th><th>$b^6$</th></tr>
          <tr><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td><td>1</td></tr>
          <tr><td>2</td><td>4</td><td>8</td><td>16</td><td>32</td><td>64</td></tr>
          <tr><td>3</td><td>9</td><td>27</td><td>81</td><td>243</td><td>729</td></tr>
          <tr><td>4</td><td>16</td><td>64</td><td>256</td><td>1024</td><td></td></tr>
          <tr><td>5</td><td>25</td><td>125</td><td>625</td><td>3125</td><td></td></tr>
          <tr><td>6</td><td>36</td><td>216</td><td>1296</td><td></td><td></td></tr>
          <tr><td>10</td><td>100</td><td>1000</td><td>10 000</td><td>100 000</td><td></td></tr>
        </table>
      </div>`,
    voorbeelden: [
      { tex: '\\sqrt[4]{81}', stappen: ['n = 4 \\text{ is even en } 81 \\geq 0 \\text{: de wortel bestaat.}', '3^4 = 81', '\\sqrt[4]{81} = 3'] },
      { tex: '\\sqrt[3]{-8}', stappen: ['n = 3 \\text{ is oneven: de wortel bestaat altijd.}', '(-2)^3 = -8', '\\sqrt[3]{-8} = -2'] },
      { tex: '\\sqrt[5]{-32}', stappen: ['n = 5 \\text{ is oneven: de wortel bestaat altijd.}', '(-2)^5 = -32', '\\sqrt[5]{-32} = -2'] },
      { tex: '\\sqrt[4]{-80}', stappen: ['n = 4 \\text{ is even en } -80 < 0.', '\\text{Een getal tot de 4de macht is nooit negatief.}', '\\sqrt[4]{-80} \\text{ bestaat niet.}'] },
      { tex: '\\sqrt[3]{125} - \\sqrt{49}', stappen: ['\\sqrt[3]{125} = 5 \\text{ want } 5^3 = 125', '\\sqrt{49} = 7 \\text{ want } 7^2 = 49', '5 - 7 = -2'] },
    ],
    soorten: DEEL1_SOORTEN,
    oefenMix: [['oneven', 3], ['even', 3], ['bestaatniet', 1], ['combinatie', 2]],
    test: [['even', 3], ['oneven', 3], ['bestaatniet', 1], ['combinatie', 3]],
  },
  DEEL2, DEEL3, DEEL4, DEEL5, DEEL6, DEEL7, DEEL8, DEEL9, DEEL10,
];

// Maakt een unieke reeks testvragen volgens de samenstelling van het deel.
function maakTest(deel) {
  // De eenvoudige soorten worden door elkaar gezet; de laatste soort (de moeilijkste) blijft achteraan.
  const groepen = [], gezien = new Set();
  for (const [soort, aantal] of deel.test) {
    const groep = [];
    let n = 0, pogingen = 0;
    while (n < aantal && pogingen++ < 500) {
      const v = deel.soorten[soort].gen();
      if (gezien.has(v.tex)) continue;
      gezien.add(v.tex); groep.push(v); n++;
    }
    groepen.push(groep);
  }
  if (deel.testSchudAlles) return W.schud(groepen.flat());
  const laatste = groepen.pop() || [];
  return W.schud(groepen.flat()).concat(laatste);
}
