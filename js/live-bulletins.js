// National Weather Service CAP messages from the API or a published snapshot.
(function (root) {
  'use strict';
  const endpoint = 'https://api.weather.gov/alerts/active';
  const pollInterval = 10 * 60000;
  const mapPath = 'assets/us-states-map.json';
  const pageSize = 40;
  const snapshotPath = 'public-data/nws-active-alerts.json';
  const maxSnapshotAge = 6 * 3600000;
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
      published: 'Published NWS snapshot', overdue: 'Snapshot update overdue',
      mapTitle: "Alerts by state", mapHelp: "Choose a state to filter the list. Color shows the number of NWS bulletins that include at least one zone in that state.", mapLegend: "Alert count", bulletinsTitle: "Active bulletins", mapFailed: "Map unavailable",
      cadence: 'Checks every 10 minutes while this page is visible.'
    },
    zh: {
      title: '美国天气预警', lead: '查阅美国国家气象局（NWS）针对其覆盖的陆地和海域发布的原始通报。每次最多显示 40 条，按发布时间从新到旧排列。可按州或属地查看当地通报。',
      filter: '州或属地', all: '全部覆盖地区', refresh: '刷新', map: 'NWS 官方地图',
      loading: '正在查询 NWS 通报…', failed: '暂时无法获取 NWS 数据。请查看官方地图了解当前预警。',
      empty: '此次响应中没有符合条件且尚未过期的通报。', issued: '发布', expires: '通报到期', issuer: '发布机构',
      checked: '数据查询时间', updated: '数据源最后变更', agency: '官方通报原文', instructions: '发布机构建议',
      published: '已发布的 NWS 快照', overdue: '快照更新已延迟',
      mapTitle: "按州查看预警", mapHelp: "选择州以筛选列表。颜色表示至少涵盖该州一个预警区域的 NWS 通告数量。", mapLegend: "通告数量", bulletinsTitle: "有效通告", mapFailed: "地图不可用",
      cadence: '页面可见时每 10 分钟查询一次。'
    },
    es: {
      title: 'Alertas meteorológicas de EE. UU.', lead: 'Consulta los boletines originales del Servicio Meteorológico Nacional (NWS) para las zonas terrestres y marítimas cubiertas. Cada consulta muestra hasta 40 mensajes, por fecha de emisión descendente. Filtra por estado o territorio para consultar tu zona.',
      filter: 'Estado o territorio', all: 'Todas las zonas cubiertas', refresh: 'Actualizar', map: 'Mapa oficial del NWS',
      loading: 'Consultando el NWS…', failed: 'El servicio del NWS no está disponible. Consulta el mapa oficial para ver los avisos actuales.',
      empty: 'Esta respuesta no contiene mensajes vigentes que cumplan los criterios.', issued: 'Emisión', expires: 'Caducidad del mensaje', issuer: 'Emisor',
      checked: 'Consulta', updated: 'Último cambio en la fuente', agency: 'Mensaje oficial', instructions: 'Instrucciones del emisor',
      published: 'Instantánea publicada del NWS', overdue: 'Actualización de la instantánea retrasada',
      mapTitle: "Alertas por estado", mapHelp: "Elige un estado para filtrar la lista. El color indica el número de boletines del NWS que incluyen al menos una zona de ese estado.", mapLegend: "Número de alertas", bulletinsTitle: "Boletines vigentes", mapFailed: "Mapa no disponible",
      cadence: 'Se consulta cada 10 minutos mientras esta página está visible.'
    },
    fr: {
      title: 'Alertes météo aux États-Unis', lead: 'Consultez les bulletins originaux du National Weather Service (NWS) pour les zones terrestres et maritimes couvertes. Chaque requête affiche jusqu’à 40 messages, du plus récent au plus ancien. Filtrez par État ou territoire pour consulter les bulletins locaux.',
      filter: 'État ou territoire', all: 'Toutes les zones couvertes', refresh: 'Actualiser', map: 'Carte officielle du NWS',
      loading: 'Consultation du NWS…', failed: 'Le flux du NWS est indisponible. Consultez la carte officielle pour les alertes en cours.',
      empty: 'Cette réponse ne contient aucun message en cours de validité répondant aux critères.', issued: 'Émission', expires: 'Expiration du message', issuer: 'Émetteur',
      checked: 'Flux consulté', updated: 'Dernière modification du flux', agency: 'Message officiel', instructions: 'Consignes de l’émetteur',
      published: 'Instantané publié du NWS', overdue: 'Actualisation de l’instantané en retard',
      mapTitle: "Alertes par État", mapHelp: "Choisissez un État pour filtrer la liste. La couleur indique le nombre de bulletins du NWS concernant au moins une zone de cet État.", mapLegend: "Nombre d’alertes", bulletinsTitle: "Bulletins en vigueur", mapFailed: "Carte indisponible",
      cadence: 'Consultation toutes les 10 minutes lorsque cette page est visible.'
    },
    it: {
      title: 'Allerte meteo degli Stati Uniti', lead: 'Consulta i bollettini originali del National Weather Service (NWS) per le aree terrestri e marine coperte. Ogni richiesta mostra fino a 40 messaggi, dal più recente. Filtra per stato o territorio per consultare i bollettini locali.',
      filter: 'Stato o territorio', all: 'Tutte le aree coperte', refresh: 'Aggiorna', map: 'Mappa ufficiale del NWS',
      loading: 'Consultazione del NWS…', failed: 'Il servizio NWS non è disponibile. Consulta la mappa ufficiale per le allerte in corso.',
      empty: 'Questa risposta non contiene messaggi validi che soddisfino i criteri.', issued: 'Emissione', expires: 'Scadenza del messaggio', issuer: 'Ente emittente',
      checked: 'Ultima consultazione', updated: 'Ultima modifica alla fonte', agency: 'Messaggio ufficiale', instructions: 'Istruzioni dell’ente emittente',
      published: 'Dati NWS pubblicati', overdue: 'Aggiornamento dei dati in ritardo',
      mapTitle: "Allerte per Stato", mapHelp: "Scegli uno Stato per filtrare l’elenco. Il colore indica il numero di bollettini NWS che includono almeno una zona dello Stato.", mapLegend: "Numero di allerte", bulletinsTitle: "Bollettini in vigore", mapFailed: "Mappa non disponibile",
      cadence: 'Aggiornamento ogni 10 minuti mentre la pagina è visibile.'
    }
  };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function stamp(value) {
    return typeof value === 'string' && /(?:Z|[+-]\d\d:\d\d)$/i.test(value) ? Date.parse(value) : NaN;
  }
  function readFeed(payload, now, area) {
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
      const zones = Array.isArray(p.geocode?.UGC) ? p.geocode.UGC : [];
      const states = [...new Set(zones.filter(code => typeof code === 'string' && /^[A-Z]{2}[CZ]\d{3}$/.test(code))
        .map(code => code.slice(0, 2)).filter(code => Object.hasOwn(areas, code)))];
      entries.set(p.id, { id: p.id, sent, expires, states, event: p.event, area: p.areaDesc, issuer: p.senderName,
        headline: p.headline, description: p.description, instruction: p.instruction });
    }
    const allRows = Array.from(entries.values()).filter(row => !replaced.has(row.id)).sort((a, b) => b.sent - a.sent);
    const rows = area ? allRows.filter(row => row.states.includes(area)) : allRows;
    const updated = stamp(payload.updated);
    return { updated: updated <= now ? updated : null, rows: rows.slice(0, pageSize), allRows };
  }

  async function loadBulletins(area, signal, fetcher = fetch, now = Date.now) {
    async function get(url, timeout, options) {
      const response = await fetcher(url, {
        ...options, cache: 'no-cache', signal: AbortSignal.any([signal, AbortSignal.timeout(timeout)])
      });
      if (!response.ok) throw Error('NWS data HTTP ' + response.status);
      return response.json();
    }

    try {
      const payload = await get(endpoint, 4500, {
        headers: { Accept: 'application/geo+json' }, credentials: 'omit'
      });
      if (payload?.pagination?.next) throw Error('Use the complete published NWS snapshot');
      const checkedAt = now();
      return { ...readFeed(payload, checkedAt, area), checkedAt, published: false };
    } catch (error) {
      if (signal.aborted) throw error;
      const payload = await get(snapshotPath, 8000);
      const checkedAt = stamp(payload?.checkedAt);
      const readAt = now();
      if (!Number.isFinite(checkedAt) || checkedAt > readAt + 300000 || readAt - checkedAt >= maxSnapshotAge) {
        throw Error('NWS snapshot unavailable or too old');
      }
      return {
        ...readFeed(payload, readAt, Object.hasOwn(areas, area) ? area : ''),
        checkedAt, published: true
      };
    }
  }

  function render(lang) {
    const t = messages[lang] || messages.en;
    const options = Object.entries(areas).map(([key, name]) => '<option value="' + key + '">' + name + ' (' + key + ')</option>').join('');
    return '<section class="live-bulletins" data-nws-bulletins><div class="container">' +
      '<header class="bulletin-head"><h1>' + t.title + '</h1><p>' + t.lead + '</p></header>' +
      '<div class="bulletin-actions"><label>' + t.filter + ' <select><option value="">' + t.all + '</option>' + options + '</select></label>' +
      '<button type="button">' + t.refresh + '</button><a href="https://www.weather.gov/" target="_blank" rel="noopener noreferrer">' + t.map + ' ↗</a></div>' +
      '<p class="bulletin-status" role="status">' + t.loading + '</p>' +
      '<div class="bulletin-dashboard"><section class="bulletin-map-card" aria-labelledby="nwsMapTitle">' +
        '<h2 id="nwsMapTitle">' + t.mapTitle + '</h2><p>' + t.mapHelp + '</p>' +
        '<div class="bulletin-map"></div>' +
        '<div class="bulletin-map-legend"><span>' + t.mapLegend + '</span>' +
          ['0', '1–4', '5–14', '15+'].map((n, i) => '<span data-count-band="' + i + '">' + n + '</span>').join('') +
          '<a href="https://github.com/topojson/us-atlas" target="_blank" rel="noopener noreferrer">U.S. Census Bureau / US Atlas ↗</a></div>' +
        '</section><section class="bulletin-records" aria-labelledby="nwsRecordsTitle">' +
        '<div class="bulletin-records-heading"><h2 id="nwsRecordsTitle">' + t.bulletinsTitle + '</h2><span class="bulletin-total"></span></div>' +
        '<div class="bulletin-list"></div></section></div>' +
      '<p class="bulletin-meta bulletin-cadence">' + t.cadence + '</p></div></section>';
  }

  function mapHtml(data) {
    const paths = [];
    const labels = [];
    for (const [code, name] of Object.entries(areas)) {
      if (!Object.hasOwn(data.states, name)) continue;
      const [path, x, y, size] = data.states[name];
      paths.push('<path class="bulletin-state" data-state="' + code + '" d="' + esc(path) + '"><title>' + esc(name) + '</title></path>');
      if (size > 1700) labels.push('<text x="' + Number(x) + '" y="' + Number(y) + '">' + code + '</text>');
    }
    return '<svg viewBox="' + esc(data.viewBox.join(' ')) + '" class="bulletin-state-map" aria-hidden="true">' +
      '<g>' + paths.join('') + '</g><g class="bulletin-state-labels">' + labels.join('') + '</g></svg>';
  }

  function stateCounts(rows) {
    const counts = {};
    for (const row of rows) {
      for (const state of row.states) counts[state] = (counts[state] || 0) + 1;
    }
    return counts;
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
    const map = section.querySelector('.bulletin-map');
    const listTitle = section.querySelector('#nwsRecordsTitle');
    const listTotal = section.querySelector('.bulletin-total');
    const mapRequest = new AbortController();
    fetch(mapPath, { signal: mapRequest.signal })
      .then(response => {
        if (!response.ok) throw Error('Map HTTP ' + response.status);
        return response.json();
      })
      .then(data => {
        if (!section.isConnected || mapRequest.signal.aborted) return;
        map.innerHTML = mapHtml(data);
        if (feed) updateRows();
      }).catch(() => {
        if (!mapRequest.signal.aborted) map.textContent = t.mapFailed;
      });
    const status = section.querySelector('.bulletin-status'), list = section.querySelector('.bulletin-list');
    const formatter = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    function clock(ms) {
      return '<time datetime="' + new Date(ms).toISOString() + '">' + esc(formatter.format(ms)) + '</time>';
    }
    let pending, expiryTimer, feed, attemptedAt, lastHtml;

    function updateMap(valid) {
      const counts = stateCounts(valid || []);
      map.querySelectorAll('[data-state]').forEach(path => {
        const state = path.dataset.state;
        const count = counts[state] || 0;
        if (valid) path.dataset.countBand = count >= 15 ? 3 : count >= 5 ? 2 : count > 0 ? 1 : 0;
        else delete path.dataset.countBand;
        path.classList.toggle('is-selected', select.value === state);
        path.querySelector('title').textContent = areas[state] + (valid ? ' · ' + t.mapLegend + ' ' + count : '');
      });
    }

    function updateRows() {
      clearTimeout(expiryTimer);
      const now = Date.now();
      const tooOld = feed.published && now - feed.checkedAt >= maxSnapshotAge;
      const valid = tooOld ? [] : feed.allRows.filter(row => row.expires > now);
      const scoped = select.value ? valid.filter(row => row.states.includes(select.value)) : valid;
      const html = scoped.slice(0, pageSize).map(row => rowHtml(row, t, clock)).join('') ||
        (tooOld ? '' : '<p class="bulletin-list-empty">' + t.empty + '</p>');
      listTitle.textContent = select.value ? areas[select.value] : t.bulletinsTitle;
      listTotal.textContent = tooOld ? '' : scoped.length > pageSize ? pageSize + ' / ' + scoped.length : String(scoped.length);
      updateMap(tooOld ? null : valid);
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
      if (tooOld) {
        status.textContent = t.failed;
        return;
      }
      const source = feed.published ? t.published + ' · ' : '';
      const delayed = feed.published && now - feed.checkedAt >= 30 * 60000 ? ' · ' + t.overdue : '';
      status.innerHTML = source + t.checked + ' · ' + clock(feed.checkedAt) + delayed +
        (feed.updated ? ' / ' + t.updated + ' · ' + clock(feed.updated) : '');
      const nextChanges = valid.map(row => row.expires);
      if (feed.published) {
        if (!delayed) nextChanges.push(feed.checkedAt + 30 * 60000);
        nextChanges.push(feed.checkedAt + maxSnapshotAge);
      }
      if (nextChanges.length) {
        expiryTimer = setTimeout(updateRows, Math.min(2147483647, Math.min(...nextChanges) - now + 1));
      }
    }
    function clearRows() {
      clearTimeout(expiryTimer);
      feed = null;
      lastHtml = null;
      list.replaceChildren();
      listTotal.textContent = '';
      updateMap(null);
    }
    async function load() {
      if (pending || document.hidden || !section.isConnected) return;
      const request = new AbortController();
      pending = request;
      button.disabled = true;
      status.textContent = t.loading;
      attemptedAt = Date.now();
      try {
        const result = await loadBulletins('', request.signal);
        if (pending !== request) return;
        feed = result;
        updateRows();
      } catch (error) {
        if (pending !== request) return;
        clearRows();
        status.textContent = t.failed;
      } finally {
        if (pending === request) {
          pending = null;
          button.disabled = false;
        }
      }
    }
    function changeArea() {
      if (feed) updateRows();
      else updateMap(null);
      list.scrollTop = 0;
    }
    function selectState(event) {
      const path = event.target.closest('[data-state]');
      if (!path) return;
      select.value = select.value === path.dataset.state ? '' : path.dataset.state;
      changeArea();
    }
    function visibilityChanged() {
      if (!document.hidden && (!feed || Date.now() - attemptedAt >= pollInterval)) {
        clearRows();
        load();
      }
    }
    select.addEventListener('change', changeArea);
    map.addEventListener('click', selectState);
    button.addEventListener('click', load);
    document.addEventListener('visibilitychange', visibilityChanged);
    const poll = setInterval(load, pollInterval);
    dispose = function () {
      clearInterval(poll);
      mapRequest.abort();
      map.removeEventListener('click', selectState);
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
  if (typeof module === 'object' && module.exports) module.exports = { ...api, readFeed, loadBulletins, stateCounts, mapHtml, rowHtml, messages };
  else root.NDLiveBulletins = api;
})(typeof window === 'object' ? window : globalThis);
