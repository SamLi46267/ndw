// National Weather Service CAP messages, requested directly from its active alerts API.
(function (root) {
  'use strict';
  const endpoint = 'https://api.weather.gov/alerts/active';
  const pollInterval = 120000;
  const areas = {
    AL: 'Alabama', AK: 'Alaska', AS: 'American Samoa', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida',
    GA: 'Georgia', GU: 'Guam', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
    MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska',
    NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
    PA: 'Pennsylvania', PR: 'Puerto Rico', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', VI: 'U.S. Virgin Islands', UT: 'Utah',
    VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
  };
  const messages = {
    en: {
      title: 'U.S. weather alerts', lead: 'Read original National Weather Service bulletins for covered land and marine areas. Each request shows up to 40 messages, newest issue time first. Filter by state or territory for local coverage.',
      filter: 'State or territory', all: 'All covered areas', refresh: 'Refresh', map: 'Official NWS map',
      loading: 'Checking the NWS feed…', failed: 'The NWS feed is unavailable. Check the official map for current warnings.',
      empty: 'No qualifying unexpired messages in this response.', issued: 'Issued', expires: 'Message expires', issuer: 'Issued by',
      checked: 'Feed checked', updated: 'Feed last changed', agency: 'Official message', instructions: 'Issuer instructions',
      cadence: 'Checks every two minutes while this page is visible.'
    },
    zh: {
      title: '美国天气预警', lead: '查阅美国国家气象局（NWS）针对其覆盖的陆地和海域发布的原始通报。每次最多显示 40 条，按发布时间从新到旧排列。可按州或属地查看当地通报。',
      filter: '州或属地', all: '全部覆盖地区', refresh: '刷新', map: 'NWS 官方地图',
      loading: '正在查询 NWS 通报…', failed: '暂时无法获取 NWS 数据。请查看官方地图了解当前预警。',
      empty: '此次响应中没有符合条件且尚未过期的通报。', issued: '发布', expires: '通报到期', issuer: '发布机构',
      checked: '数据查询时间', updated: '数据源最后变更', agency: '官方通报原文', instructions: '发布机构建议',
      cadence: '页面可见时每两分钟查询一次。'
    },
    es: {
      title: 'Alertas meteorológicas de EE. UU.', lead: 'Consulta los boletines originales del Servicio Meteorológico Nacional (NWS) para las zonas terrestres y marítimas cubiertas. Cada consulta muestra hasta 40 mensajes, por fecha de emisión descendente. Filtra por estado o territorio para consultar tu zona.',
      filter: 'Estado o territorio', all: 'Todas las zonas cubiertas', refresh: 'Actualizar', map: 'Mapa oficial del NWS',
      loading: 'Consultando el NWS…', failed: 'El servicio del NWS no está disponible. Consulta el mapa oficial para ver los avisos actuales.',
      empty: 'Esta respuesta no contiene mensajes vigentes que cumplan los criterios.', issued: 'Emisión', expires: 'Caducidad del mensaje', issuer: 'Emisor',
      checked: 'Consulta', updated: 'Último cambio en la fuente', agency: 'Mensaje oficial', instructions: 'Instrucciones del emisor',
      cadence: 'Se consulta cada dos minutos mientras esta página está visible.'
    },
    fr: {
      title: 'Alertes météo aux États-Unis', lead: 'Consultez les bulletins originaux du National Weather Service (NWS) pour les zones terrestres et maritimes couvertes. Chaque requête affiche jusqu’à 40 messages, du plus récent au plus ancien. Filtrez par État ou territoire pour consulter les bulletins locaux.',
      filter: 'État ou territoire', all: 'Toutes les zones couvertes', refresh: 'Actualiser', map: 'Carte officielle du NWS',
      loading: 'Consultation du NWS…', failed: 'Le flux du NWS est indisponible. Consultez la carte officielle pour les alertes en cours.',
      empty: 'Cette réponse ne contient aucun message en cours de validité répondant aux critères.', issued: 'Émission', expires: 'Expiration du message', issuer: 'Émetteur',
      checked: 'Flux consulté', updated: 'Dernière modification du flux', agency: 'Message officiel', instructions: 'Consignes de l’émetteur',
      cadence: 'Consultation toutes les deux minutes lorsque cette page est visible.'
    },
    it: {
      title: 'Allerte meteo degli Stati Uniti', lead: 'Consulta i bollettini originali del National Weather Service (NWS) per le aree terrestri e marine coperte. Ogni richiesta mostra fino a 40 messaggi, dal più recente. Filtra per stato o territorio per consultare i bollettini locali.',
      filter: 'Stato o territorio', all: 'Tutte le aree coperte', refresh: 'Aggiorna', map: 'Mappa ufficiale del NWS',
      loading: 'Consultazione del NWS…', failed: 'Il servizio NWS non è disponibile. Consulta la mappa ufficiale per le allerte in corso.',
      empty: 'Questa risposta non contiene messaggi validi che soddisfino i criteri.', issued: 'Emissione', expires: 'Scadenza del messaggio', issuer: 'Ente emittente',
      checked: 'Ultima consultazione', updated: 'Ultima modifica alla fonte', agency: 'Messaggio ufficiale', instructions: 'Istruzioni dell’ente emittente',
      cadence: 'Aggiornamento ogni due minuti mentre la pagina è visibile.'
    }
  };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function stamp(value) {
    return typeof value === 'string' && /(?:Z|[+-]\d\d:\d\d)$/i.test(value) ? Date.parse(value) : NaN;
  }
  function urlFor(area) {
    const query = new URLSearchParams({ status: 'actual', limit: '40' });
    if (Object.hasOwn(areas, area)) query.set('area', area);
    return endpoint + '?' + query;
  }
  function readFeed(payload, now) {
    if (!payload || payload.type !== 'FeatureCollection' || !Array.isArray(payload.features)) throw Error('Invalid NWS response');
    const replaced = new Set();
    const entries = new Map();
    for (const feature of payload.features) {
      const p = feature && feature.properties;
      if (!p || typeof p.status !== 'string' || typeof p.messageType !== 'string') throw Error('Malformed NWS feature');
      if (p.status !== 'Actual') continue;
      const sent = stamp(p.sent);
      if (!Number.isFinite(sent)) throw Error('Invalid NWS issue time');
      if (sent > now) continue;
      if ((p.messageType === 'Cancel' || p.messageType === 'Update') && Array.isArray(p.references)) {
        for (const prior of p.references) if (prior && prior.identifier) replaced.add(prior.identifier);
      }
      if (p.messageType !== 'Alert' && p.messageType !== 'Update') continue;
      const expires = stamp(p.expires);
      const effective = stamp(p.effective);
      if (!Number.isFinite(expires) || !Number.isFinite(effective)) throw Error('Invalid NWS validity period');
      if (expires <= now || effective > now) continue;
      if (typeof p.id !== 'string' || !p.id || typeof p.event !== 'string' || !p.event ||
          typeof p.areaDesc !== 'string' || !p.areaDesc) throw Error('Incomplete NWS bulletin');
      entries.set(p.id, { id: p.id, sent, expires, event: p.event, area: p.areaDesc, issuer: p.senderName,
        headline: p.headline, description: p.description, instruction: p.instruction });
    }
    const rows = Array.from(entries.values()).filter(row => !replaced.has(row.id)).sort((a, b) => b.sent - a.sent);
    const updated = stamp(payload.updated);
    return { updated: updated <= now ? updated : null, rows: rows.slice(0, 40) };
  }

  function render(lang) {
    const t = messages[lang] || messages.en;
    const options = Object.entries(areas).map(([key, name]) => '<option value="' + key + '">' + name + ' (' + key + ')</option>').join('');
    return '<section class="live-bulletins" data-nws-bulletins><div class="container">' +
      '<header class="bulletin-head"><h1>' + t.title + '</h1><p>' + t.lead + '</p></header>' +
      '<div class="bulletin-actions"><label>' + t.filter + ' <select><option value="">' + t.all + '</option>' + options + '</select></label>' +
      '<button type="button">' + t.refresh + '</button><a href="https://www.weather.gov/" target="_blank" rel="noopener noreferrer">' + t.map + ' ↗</a></div>' +
      '<p class="bulletin-status" role="status">' + t.loading + '</p><div class="bulletin-list"></div>' +
      '<p class="bulletin-meta">' + t.cadence + '</p></div></section>';
  }
  function rowHtml(row, t, clock) {
    return '<details class="bulletin-row" data-id="' + esc(row.id) + '"><summary><span><strong>' + esc(row.event) +
      '</strong><span class="bulletin-area">' + esc(row.area) + '</span></span><span class="bulletin-meta">' +
      t.issued + ' · ' + clock(row.sent) + '</span></summary><div class="bulletin-detail">' +
      (row.headline ? '<p><strong>' + esc(row.headline) + '</strong></p>' : '') +
      (row.issuer ? '<p>' + t.issuer + ' · ' + esc(row.issuer) + '</p>' : '') +
      '<p>' + t.expires + ' · ' + clock(row.expires) + '</p>' +
      (row.description ? '<p class="bulletin-text">' + esc(row.description) + '</p>' : '') +
      (row.instruction ? '<p><strong>' + t.instructions + '</strong></p><p class="bulletin-text">' + esc(row.instruction) + '</p>' : '') +
      '<a href="https://api.weather.gov/alerts/' + encodeURIComponent(row.id) + '" target="_blank" rel="noopener noreferrer">' +
      t.agency + ' ↗</a></div></details>';
  }

  let dispose;
  function unmount() {
    if (dispose) dispose();
    dispose = undefined;
  }
  function mount(container, lang) {
    unmount();
    const section = container.querySelector('[data-nws-bulletins]');
    if (!section) return;
    const t = messages[lang] || messages.en;
    const select = section.querySelector('select'), button = section.querySelector('button');
    const status = section.querySelector('.bulletin-status'), list = section.querySelector('.bulletin-list');
    const formatter = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    function clock(ms) {
      return '<time datetime="' + new Date(ms).toISOString() + '">' + esc(formatter.format(ms)) + '</time>';
    }
    let pending, expiryTimer, feed, checked, lastHtml;

    function updateRows() {
      clearTimeout(expiryTimer);
      const now = Date.now(), valid = feed.rows.filter(row => row.expires > now);
      const html = valid.map(row => rowHtml(row, t, clock)).join('');
      if (html !== lastHtml) {
        const openIds = new Set(Array.from(list.querySelectorAll('details[open]'), item => item.dataset.id));
        const focused = document.activeElement.closest('.bulletin-row');
        const focusedTag = focused && document.activeElement.tagName;
        list.innerHTML = html;
        list.querySelectorAll('details').forEach(item => {
          item.open = openIds.has(item.dataset.id);
          if (focused && item.dataset.id === focused.dataset.id) item.querySelector(focusedTag)?.focus({ preventScroll: true });
        });
        lastHtml = html;
      }
      status.innerHTML = (valid.length ? '' : t.empty + ' ') + t.checked + ' · ' + clock(checked) +
        (feed.updated ? ' / ' + t.updated + ' · ' + clock(feed.updated) : '');
      if (valid.length) {
        const earliest = Math.min(...valid.map(row => row.expires));
        expiryTimer = setTimeout(updateRows, Math.min(2147483647, earliest - now + 1));
      }
    }
    function clearRows() {
      clearTimeout(expiryTimer);
      feed = null;
      lastHtml = null;
      list.replaceChildren();
    }
    async function load() {
      if (pending || document.hidden || !section.isConnected) return;
      const request = new AbortController();
      pending = request;
      button.disabled = true;
      status.textContent = t.loading;
      const timeout = setTimeout(() => request.abort(), 15000);
      try {
        const response = await fetch(urlFor(select.value), {
          headers: { Accept: 'application/geo+json' }, credentials: 'omit', cache: 'no-cache', signal: request.signal
        });
        if (!response.ok) throw Error('NWS ' + response.status);
        const payload = await response.json();
        if (pending !== request) return;
        checked = Date.now();
        feed = readFeed(payload, checked);
        updateRows();
      } catch (error) {
        if (pending !== request) return;
        clearRows();
        status.textContent = t.failed;
      } finally {
        clearTimeout(timeout);
        if (pending === request) {
          pending = null;
          button.disabled = false;
        }
      }
    }
    function changeArea() {
      if (pending) pending.abort();
      pending = null;
      clearRows();
      load();
    }
    function visibilityChanged() {
      if (!document.hidden && (!feed || Date.now() - checked >= pollInterval)) {
        clearRows();
        load();
      }
    }
    select.addEventListener('change', changeArea);
    button.addEventListener('click', load);
    document.addEventListener('visibilitychange', visibilityChanged);
    const poll = setInterval(load, pollInterval);
    dispose = function () {
      clearInterval(poll);
      clearTimeout(expiryTimer);
      if (pending) pending.abort();
      pending = null;
      select.removeEventListener('change', changeArea);
      button.removeEventListener('click', load);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
    load();
  }
  const api = { render, mount, unmount };
  if (typeof module === 'object' && module.exports) module.exports = { ...api, readFeed, urlFor, rowHtml, messages };
  else root.NDLiveBulletins = api;
})(typeof window === 'object' ? window : globalThis);
