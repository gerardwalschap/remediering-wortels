// Rekenkern: leest antwoorden zoals  5∛2 · 2a²·∛(2ab) · a^(7/6) · ¹²√(5^25) · -1/9
// en controleert (1) of ze gelijk zijn aan de oplossing en (2) of ze in de gevraagde vorm staan.
// Letters stellen strikt positieve getallen voor.
const E = (() => {
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  class Fout extends Error { constructor(m) { super(m); this.ongeldig = true; } }

  // ---------- breuken
  class Q {
    constructor(n, d = 1) {
      if (d === 0) throw new Fout('Je deelt door nul.');
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d) || 1; this.n = n / g; this.d = d / g;
    }
    add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
    mul(o) { return new Q(this.n * o.n, this.d * o.d); }
    div(o) { return new Q(this.n * o.d, this.d * o.n); }
    neg() { return new Q(-this.n, this.d); }
    eq(o) { return this.n === o.n && this.d === o.d; }
    get int() { return this.d === 1; }
    get v() { return this.n / this.d; }
  }

  // ---------- waarden: teken · product van (priemgetal of letter)^(rationale exponent)
  function priemen(n) {
    const f = {}; let p = 2;
    while (p * p <= n) { while (n % p === 0) { f[p] = (f[p] || 0) + 1; n /= p; } p += p === 2 ? 1 : 2; }
    if (n > 1) f[n] = (f[n] || 0) + 1;
    return f;
  }
  const NUL = { nul: true };
  function vanGetal(q) {
    if (q.n === 0) return NUL;
    const f = {};
    for (const [p, e] of Object.entries(priemen(Math.abs(q.n)))) f['#' + p] = new Q(e);
    for (const [p, e] of Object.entries(priemen(q.d))) f['#' + p] = (f['#' + p] || new Q(0)).add(new Q(-e));
    return { teken: q.n < 0 ? -1 : 1, f };
  }
  function maal(a, b) {
    if (a.nul || b.nul) return NUL;
    const f = { ...a.f };
    for (const [k, e] of Object.entries(b.f)) f[k] = (f[k] || new Q(0)).add(e);
    return { teken: a.teken * b.teken, f };
  }
  function macht(a, e) {
    if (a.nul) { if (e.v > 0) return NUL; throw new Fout('Nul tot een negatieve macht bestaat niet.'); }
    let teken = 1;
    if (a.teken < 0) {
      if (e.d % 2 === 0) throw new Fout('Een even wortel van een negatief getal bestaat niet.');
      teken = e.n % 2 ? -1 : 1;
    }
    const f = {};
    for (const [k, x] of Object.entries(a.f)) f[k] = x.mul(e);
    return { teken, f };
  }
  const opgeruimd = (a) => a.nul ? [] : Object.entries(a.f).filter(([, e]) => e.n !== 0).sort(([x], [y]) => x < y ? -1 : 1);
  function gelijk(a, b) {
    if (a.nul || b.nul) return !!a.nul === !!b.nul;
    if (a.teken !== b.teken) return false;
    const x = opgeruimd(a), y = opgeruimd(b);
    return x.length === y.length && x.every(([k, e], i) => y[i][0] === k && y[i][1].eq(e));
  }
  function alsBreuk(a) { // null als het geen rationaal getal is
    if (a.nul) return new Q(0);
    let t = 1, n = 1;
    for (const [k, e] of opgeruimd(a)) {
      if (k[0] !== '#' || !e.int) return null;
      const p = +k.slice(1);
      if (e.n > 0) t *= p ** e.n; else n *= p ** (-e.n);
    }
    return new Q(a.teken * t, n);
  }

  // ---------- lezen
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUPMIN = '⁻';
  function tokens(invoer) {
    let s = String(invoer).replace(/[−–—]/g, '-').replace(/[×·•∙*]/g, '*').replace(/:/g, '/')
      .replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, '').replace(/\[/g, '(').replace(/\]/g, ')').toLowerCase();
    const t = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9.]/.test(c)) {
        const m = s.slice(i).match(/^\d*\.?\d+|^\d+/); if (!m) throw new Fout('Onverwacht punt.');
        t.push({ t: 'num', s: m[0] }); i += m[0].length; continue;
      }
      if (/[a-z]/.test(c)) { t.push({ t: 'let', v: c }); i++; continue; }
      if (SUP.includes(c) || c === SUPMIN) {
        let r = ''; while (i < s.length && (SUP.includes(s[i]) || s[i] === SUPMIN)) { r += s[i] === SUPMIN ? '-' : SUP.indexOf(s[i]); i++; }
        if (s[i] === '√') { i++; t.push({ t: 'wortel', n: +r }); }
        else t.push({ t: 'sup', s: r });
        continue;
      }
      if (c === '√') { t.push({ t: 'wortel', n: 2 }); i++; continue; }
      if (c === '∛') { t.push({ t: 'wortel', n: 3 }); i++; continue; }
      if (c === '∜') { t.push({ t: 'wortel', n: 4 }); i++; continue; }
      if ('()^*/+-'.includes(c)) { t.push({ t: c }); i++; continue; }
      throw new Fout(`Het teken "${c}" begrijp ik niet.`);
    }
    return t;
  }

  function lees(invoer) {
    const t = tokens(invoer); let i = 0;
    const kijk = () => t[i] && t[i].t, neem = () => t[i++];
    const verwacht = (x) => { if (kijk() !== x) throw new Fout(x === ')' ? 'Er ontbreekt een haakje ")".' : `Ik verwacht "${x}".`); i++; };
    const begintFactor = () => ['num', 'let', '(', 'wortel'].includes(kijk());

    function som() {
      const termen = [term()];
      while (kijk() === '+' || kijk() === '-') { const op = neem().t; const x = term(); termen.push(op === '-' ? { t: 'neg', x } : x); }
      return termen.length === 1 ? termen[0] : { t: 'som', ts: termen };
    }
    function term() {
      let a = unair();
      for (;;) {
        if (kijk() === '*') { neem(); a = maalKnoop(a, unair()); }
        else if (kijk() === '/') { neem(); a = { t: 'deel', a, b: unair() }; }
        else if (begintFactor()) a = maalKnoop(a, unair());
        else return a;
      }
    }
    const maalKnoop = (a, b) => a.t === 'maal' ? { t: 'maal', fs: [...a.fs, b] } : { t: 'maal', fs: [a, b] };
    function unair() {
      if (kijk() === '-') { neem(); return { t: 'neg', x: unair() }; }
      if (kijk() === '+') { neem(); return unair(); }
      return machtKnoop();
    }
    function machtKnoop() {
      const b = primair();
      if (kijk() === '^') { neem(); return { t: 'macht', b, e: exponent() }; }
      if (kijk() === 'sup') { const s = neem().s; return { t: 'macht', b, e: s.startsWith('-') ? { t: 'neg', x: { t: 'num', s: s.slice(1) } } : { t: 'num', s } }; }
      return b;
    }
    function exponent() {
      if (kijk() === '(') { neem(); const x = som(); verwacht(')'); return { t: 'haak', x }; }
      if (kijk() === '-') { neem(); return { t: 'neg', x: exponent() }; }
      if (kijk() === 'num') return { t: 'num', s: neem().s };
      if (kijk() === 'sup') return { t: 'num', s: neem().s };
      throw new Fout('Na ^ moet een exponent komen, bv. a^3 of a^(2/3).');
    }
    function primair() {
      const k = kijk();
      if (k === 'num') return { t: 'num', s: neem().s };
      if (k === 'let') return { t: 'let', v: neem().v };
      if (k === '(') { neem(); const x = som(); verwacht(')'); return { t: 'haak', x }; }
      if (k === 'wortel') {
        const n = neem().n; if (!(n >= 2)) throw new Fout('De wortelexponent moet minstens 2 zijn.');
        if (kijk() === '(') { neem(); const x = som(); verwacht(')'); return { t: 'wortel', n, x }; }
        if (!['num', 'let'].includes(kijk())) throw new Fout('Na het wortelteken moet iets komen.');
        return { t: 'wortel', n, x: machtKnoop() };
      }
      if (k === undefined) throw new Fout('Je antwoord is onvolledig.');
      throw new Fout(`Op deze plaats verwacht ik geen "${k === 'sup' ? 'exponent' : k}".`);
    }
    if (!t.length) throw new Fout('Leeg antwoord.');
    const boom = som();
    if (i < t.length) throw new Fout(kijk() === ')' ? 'Er staat een haakje ")" te veel.' : 'Ik begrijp je antwoord niet helemaal.');
    return boom;
  }

  function getal(s) {
    if (s.includes('.')) { const [a, b] = s.split('.'); return new Q(+(a + b), 10 ** b.length); }
    if (s.length > 12) throw new Fout('Dat getal is te groot.');
    return new Q(+s);
  }
  function waarde(k) {
    switch (k.t) {
      case 'num': return vanGetal(getal(k.s));
      case 'let': return { teken: 1, f: { [k.v]: new Q(1) } };
      case 'haak': return waarde(k.x);
      case 'neg': { const w = waarde(k.x); return w.nul ? w : { ...w, teken: -w.teken }; }
      case 'maal': return k.fs.map(waarde).reduce(maal);
      case 'deel': { const b = waarde(k.b); if (b.nul) throw new Fout('Je deelt door nul.'); return maal(waarde(k.a), macht(b, new Q(-1))); }
      case 'macht': {
        const e = alsBreuk(waarde(k.e)); if (!e) throw new Fout('Een exponent moet een (breuk)getal zijn.');
        if (Math.abs(e.n) > 400 || e.d > 400) throw new Fout('Die exponent is te groot.');
        return macht(waarde(k.b), e);
      }
      case 'wortel': return macht(waarde(k.x), new Q(1, k.n));
      case 'som': {
        const qs = k.ts.map(x => alsBreuk(waarde(x)));
        if (qs.some(q => !q)) throw new Fout('Schrijf je antwoord als één term (zonder + of −).');
        return vanGetal(qs.reduce((a, b) => a.add(b)));
      }
    }
    throw new Fout('Ik begrijp je antwoord niet.');
  }

  // ---------- TeX
  const komma = (s) => s.replace('.', '{,}');
  function tex(k) {
    switch (k.t) {
      case 'num': return komma(k.s);
      case 'let': return k.v;
      case 'haak': return `\\left(${tex(k.x)}\\right)`;
      case 'neg': return `-${['som'].includes(k.x.t) ? `\\left(${tex(k.x)}\\right)` : tex(k.x)}`;
      case 'som': return k.ts.map((x, i) => x.t === 'neg' && i ? `- ${tex(x.x)}` : (i ? '+ ' : '') + tex(x)).join(' ');
      case 'maal': return k.fs.map((f, i) => {
        if (!i) return tex(f);
        const vorige = k.fs[i - 1];
        const punt = f.t === 'wortel' || vorige.t === 'wortel' || ['num', 'neg', 'deel'].includes(f.t) || (f.t === 'macht' && f.b.t === 'num') || f.t === 'haak' && vorige.t === 'haak';
        return (punt ? ' \\cdot ' : ' ') + tex(f);
      }).join('');
      case 'deel': return `\\frac{${tex(k.a.t === 'haak' ? k.a.x : k.a)}}{${tex(k.b.t === 'haak' ? k.b.x : k.b)}}`;
      case 'macht': {
        const b = ['num', 'let', 'haak'].includes(k.b.t) ? tex(k.b) : `\\left(${tex(k.b)}\\right)`;
        const e = k.e.t === 'haak' ? tex(k.e.x) : tex(k.e);
        return `${b}^{${e}}`;
      }
      case 'wortel': return k.n === 2 ? `\\sqrt{${tex(k.x.t === 'haak' ? k.x.x : k.x)}}` : `\\sqrt[${k.n}]{${tex(k.x.t === 'haak' ? k.x.x : k.x)}}`;
    }
    return '';
  }

  // ---------- vormcontrole
  const zonderMin = (k) => { while (k.t === 'neg' || k.t === 'haak') k = k.x; return k; };
  function bevat(k, test) {
    if (!k || typeof k !== 'object') return false;
    if (test(k)) return true;
    return ['x', 'a', 'b', 'e'].some(p => bevat(k[p], test)) || (k.fs || k.ts || []).some(x => bevat(x, test));
  }
  const isGetalKnoop = (k) => zonderMin(k).t === 'num';
  function factoren(k, uit = []) { // platte lijst van factoren in teller en noemer
    if (k.t === 'neg' || k.t === 'haak') return factoren(k.x, uit);
    if (k.t === 'maal') { k.fs.forEach(f => factoren(f, uit)); return uit; }
    if (k.t === 'deel') { factoren(k.a, uit); factoren(k.b, uit); return uit; }
    uit.push(k); return uit;
  }
  const expWaarde = (e) => alsBreuk(waarde(e));
  const breukNietVereenvoudigd = (e) => { const z = zonderMin(e); return z.t === 'deel' && isGetalKnoop(z.a) && isGetalKnoop(z.b) && gcd(+zonderMin(z.a).s, +zonderMin(z.b).s) > 1; };

  const VORMEN = {
    getal(k) {
      const z = zonderMin(k);
      if (z.t === 'num') return null;
      if (z.t === 'deel' && isGetalKnoop(z.a) && isGetalKnoop(z.b)) {
        const a = zonderMin(z.a).s, b = zonderMin(z.b).s;
        if (!a.includes('.') && !b.includes('.') && gcd(+a, +b) > 1) return 'Vereenvoudig de breuk nog.';
        return null;
      }
      return 'Schrijf je antwoord als een getal of een breuk, zonder wortels of machten.';
    },
    een_macht(k) {
      const z = zonderMin(k);
      if (z.t === 'let' || z.t === 'num') return null;
      if (z.t === 'macht' && ['let', 'num'].includes(z.b.t) && !bevat(z.e, x => x.t === 'let' || x.t === 'wortel')) {
        if (breukNietVereenvoudigd(z.e.t === 'haak' ? z.e.x : z.e)) return 'Vereenvoudig de breuk in de exponent nog.';
        return null;
      }
      return 'Schrijf je antwoord als één macht, bv. a^(7/6).';
    },
    een_wortel(k) {
      const z = zonderMin(k);
      if (z.t === 'wortel' && !bevat(z.x, x => x.t === 'wortel')) return null;
      return 'Schrijf je antwoord als één wortel, bv. ¹²√(5^25).';
    },
    vereenvoudigd(k) {
      if (bevat(k, x => x.t === 'som')) return 'Werk alles uit tot één term.';
      const per = {};
      for (const f of factoren(k)) {
        if (f.t === 'num' || f.t === 'let') { per[f.t === 'let' ? f.v : '#'] = (per[f.t === 'let' ? f.v : '#'] || 0) + 1; continue; }
        if (f.t === 'macht' && ['let', 'num'].includes(f.b.t)) {
          const e = expWaarde(f.e); if (!e || !e.int) return 'Er staat nog een macht met een breuk als exponent: schrijf die als wortel en haal factoren buiten.';
          const s = f.b.t === 'let' ? f.b.v : '#'; per[s] = (per[s] || 0) + 1; continue;
        }
        if (f.t === 'wortel') {
          if (bevat(f.x, x => x.t === 'wortel')) return 'Er staat nog een wortel in een wortel.';
          const w = waarde(f.x);
          if (w.nul) return 'Een wortel uit 0 is gewoon 0.';
          if (w.teken < 0) return 'Haal het minteken buiten de wortel.';
          const r = opgeruimd(w);
          if (!r.length) return 'Een wortel uit 1 is gewoon 1.';
          for (const [, e] of r) {
            if (!e.int || e.n < 0) return 'Onder het wortelteken mogen geen breuken of negatieve exponenten staan.';
            if (e.n >= f.n) return 'Je kan nog factoren buiten het wortelteken brengen.';
          }
          continue;
        }
        return 'Je antwoord is nog niet zo ver mogelijk vereenvoudigd.';
      }
      if (Object.values(per).some(n => n > 1)) return 'Voeg gelijke factoren nog samen.';
      return null;
    },
    geen_neg(k) {
      return bevat(k, x => x.t === 'macht' && (expWaarde(x.e) || new Q(0)).v < 0) ? 'Schrijf je antwoord zonder negatieve exponenten.' : null;
    },
    geen_wortel(k) { return bevat(k, x => x.t === 'wortel') ? 'Schrijf je antwoord met (rationale) exponenten, zonder wortelteken.' : null; },
  };

  // ---------- publieke functies
  function ontleed(invoer) { // {ok, boom, waarde, tex} of {ok:false, fout}
    try { const boom = lees(invoer); const w = waarde(boom); return { ok: true, boom, waarde: w, tex: tex(boom) }; }
    catch (e) { if (e.ongeldig) return { ok: false, fout: e.message }; throw e; }
  }
  // resultaat: {status: 'juist' | 'fout' | 'vorm' | 'ongeldig' | 'leeg', bericht}
  function controleer(invoer, verwacht, vormen = []) {
    if (!String(invoer ?? '').trim()) return { status: 'leeg', bericht: 'Vul eerst een antwoord in.' };
    const s = ontleed(invoer);
    if (!s.ok) return { status: 'ongeldig', bericht: s.fout };
    const v = ontleed(verwacht);
    if (!v.ok) throw new Error('Oplossing onleesbaar: ' + verwacht + ' — ' + v.fout);
    if (!gelijk(s.waarde, v.waarde)) return { status: 'fout' };
    for (const vorm of vormen) {
      const m = VORMEN[vorm](s.boom);
      if (m) return { status: 'vorm', bericht: m };
    }
    return { status: 'juist' };
  }
  const texVan = (invoer) => { const s = ontleed(invoer); return s.ok ? s.tex : null; };

  return { Q, ontleed, controleer, texVan, gelijk, waarde, lees, VORMEN, alsBreuk };
})();
if (typeof module !== 'undefined') module.exports = E;
