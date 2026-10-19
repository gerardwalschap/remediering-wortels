// Verbinding met de databank (Supabase). Zonder SUPABASE_URL draait alles in demo-modus in de browser.
const API = (() => {
  const DEMO = !(window.CONFIG && CONFIG.SUPABASE_URL);

  const FOUTEN = {
    FOUTE_LOGIN: 'Gebruikersnaam of wachtwoord klopt niet.',
    SESSIE_VERLOPEN: 'Je bent afgemeld. Meld je opnieuw aan.',
    DEEL_GESLOTEN: 'Dit deel is nog niet open.',
    AL_GESLAAGD: 'Je bent al geslaagd voor deze test.',
    GEEN_POGINGEN: 'Je hebt deze test al gemaakt. Enkel je leerkracht kan hem opnieuw openzetten.',
    AL_INGEDIEND: 'Deze test is al ingediend.',
    NETWERK: 'Geen verbinding met de server. Controleer je internet en probeer opnieuw.',
  };

  class Fout extends Error {
    constructor(code) { super(FOUTEN[code] || code); this.code = code; }
  }

  async function call(fn, params = {}) {
    if (DEMO) {
      try { return await Demo.call(fn, params); }
      catch (e) { throw new Fout(e.message); }
    }
    let r;
    try {
      r = await fetch(`${CONFIG.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        // nieuwe 'sb_publishable_'-sleutels gaan enkel in de apikey-header; oude JWT-sleutels ook als Bearer
        headers: Object.assign({ 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY },
          String(CONFIG.SUPABASE_ANON_KEY).startsWith('eyJ') ? { Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY } : {}),
        body: JSON.stringify(params),
      });
    } catch (e) { throw new Fout('NETWERK'); }
    const txt = await r.text();
    let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
    if (!r.ok) throw new Fout((data && data.message) || 'NETWERK');
    return data;
  }

  // Kleine opslag die nooit crasht (privévenster, geblokkeerde opslag, …)
  const mem = {};
  const sessie = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return mem[k] ?? null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { delete mem[k]; } },
  };

  return { call, DEMO, Fout, sessie };
})();
