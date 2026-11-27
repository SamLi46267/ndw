// National Weather Service CAP messages from the API or a published snapshot.
(function (root) {
  'use strict';
  const endpoint = 'https://api.weather.gov/alerts/active';
  const pollInterval = 10 * 60000;
  const mapPath = 'assets/us-states-map.json';
  const pageSize = 40;
  const snapshotPath = 'public-data/nws-active-alerts.json';
  const maxSnapshotAge = 6 * 3600000;
  const severityLevels = ['extreme', 'severe', 'moderate', 'minor'];
  // The compact northeastern states use callouts in the open Atlantic.
  const calloutPositions = { VT: 145, NH: 176, MA: 207, RI: 238, CT: 269, NJ: 300, DE: 331, MD: 362, DC: 393 };
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
      title: 'U.S. weather alerts', lead: 'Read original National Weather Service bulletins for covered land and marine areas. Messages are sorted newest first. Filter by state or territory for local coverage.',
      viewAll: 'View all U.S. alerts', allTitle: 'All U.S. weather alerts', backToMap: 'U.S. alert map',
      filter: 'State or territory', all: 'All covered areas', refresh: 'Refresh', map: 'Official NWS map',
      loading: 'Checking the NWS feed…', failed: 'The NWS feed is unavailable. Check the official map for current warnings.',
      empty: 'No qualifying unexpired messages in this response.', issued: 'Issued', expires: 'Message expires', issuer: 'Issued by',
      checked: 'Feed checked', updated: 'Feed last changed', agency: 'Official message', instructions: 'Issuer instructions',
      published: 'Published NWS snapshot', overdue: 'Snapshot update overdue',
      mapTitle: "Alerts by state", mapHelp: "Choose a state to filter the list. Color shows the highest severity reported by the NWS for that state.", mapCount: "Alert count", bulletinsTitle: "Active bulletins", mapFailed: "Map unavailable",
      mapHighest: 'Highest reported severity', mapClear: 'No active alerts', mapSeverityUnknown: 'Severity unknown',
      mapPan: 'Scroll the map sideways to see every state.', mapUnknown: 'Alert data unavailable',
      severity: { extreme: 'Extreme', severe: 'Severe', moderate: 'Moderate', minor: 'Minor' },
      cadence: 'Checks every 10 minutes while this page is visible.'
    },
    zh: {
      title: '美国天气预警', lead: '查阅美国国家气象局（NWS）针对其覆盖的陆地和海域发布的原始通报。通报按发布时间从新到旧排列。可按州或属地查看当地通报。',
      viewAll: '查看全美预警', allTitle: '全美天气预警', backToMap: '美国预警地图',
      filter: '州或属地', all: '全部覆盖地区', refresh: '刷新', map: 'NWS 官方地图',
      loading: '正在查询 NWS 通报…', failed: '暂时无法获取 NWS 数据。请查看官方地图了解当前预警。',
      empty: '此次响应中没有符合条件且尚未过期的通报。', issued: '发布', expires: '通报到期', issuer: '发布机构',
      checked: '数据查询时间', updated: '数据源最后变更', agency: '官方通报原文', instructions: '发布机构建议',
      published: '已发布的 NWS 快照', overdue: '快照更新已延迟',
      mapTitle: "按州查看预警", mapHelp: "选择州以筛选列表。颜色表示 NWS 在该州报告的最高预警等级。", mapCount: "通告数量", bulletinsTitle: "有效通告", mapFailed: "地图不可用",
      mapHighest: '最高预警等级', mapClear: '无有效预警', mapSeverityUnknown: '等级未知',
      mapPan: '横向滑动地图可查看所有州。', mapUnknown: '预警数据不可用',
      severity: { extreme: '极重', severe: '严重', moderate: '中等', minor: '轻微' },
      cadence: '页面可见时每 10 分钟查询一次。'
    },
    es: {
      title: 'Alertas meteorológicas de EE. UU.', lead: 'Consulta los boletines originales del Servicio Meteorológico Nacional (NWS) para las zonas terrestres y marítimas cubiertas. Los mensajes se ordenan del más reciente al más antiguo. Filtra por estado o territorio para consultar tu zona.',
      viewAll: 'Ver todas las alertas de EE. UU.', allTitle: 'Todas las alertas meteorológicas de EE. UU.', backToMap: 'Mapa de alertas de EE. UU.',
      filter: 'Estado o territorio', all: 'Todas las zonas cubiertas', refresh: 'Actualizar', map: 'Mapa oficial del NWS',
      loading: 'Consultando el NWS…', failed: 'El servicio del NWS no está disponible. Consulta el mapa oficial para ver los avisos actuales.',
      empty: 'Esta respuesta no contiene mensajes vigentes que cumplan los criterios.', issued: 'Emisión', expires: 'Caducidad del mensaje', issuer: 'Emisor',
      checked: 'Consulta', updated: 'Último cambio en la fuente', agency: 'Mensaje oficial', instructions: 'Instrucciones del emisor',
      published: 'Instantánea publicada del NWS', overdue: 'Actualización de la instantánea retrasada',
      mapTitle: "Alertas por estado", mapHelp: "Elige un estado para filtrar la lista. El color indica la gravedad más alta comunicada por el NWS para ese estado.", mapCount: "Número de alertas", bulletinsTitle: "Boletines vigentes", mapFailed: "Mapa no disponible",
      mapHighest: 'Gravedad máxima comunicada', mapClear: 'Sin alertas vigentes', mapSeverityUnknown: 'Gravedad desconocida',
      mapPan: 'Desplaza el mapa horizontalmente para ver todos los estados.', mapUnknown: 'Datos de alertas no disponibles',
      severity: { extreme: 'Extrema', severe: 'Grave', moderate: 'Moderada', minor: 'Leve' },
      cadence: 'Se consulta cada 10 minutos mientras esta página está visible.'
    },
    fr: {
      title: 'Alertes météo aux États-Unis', lead: 'Consultez les bulletins originaux du National Weather Service (NWS) pour les zones terrestres et maritimes couvertes. Les messages sont classés du plus récent au plus ancien. Filtrez par État ou territoire pour consulter les bulletins locaux.',
      viewAll: 'Voir toutes les alertes des États-Unis', allTitle: 'Toutes les alertes météo aux États-Unis', backToMap: 'Carte des alertes aux États-Unis',
      filter: 'État ou territoire', all: 'Toutes les zones couvertes', refresh: 'Actualiser', map: 'Carte officielle du NWS',
      loading: 'Consultation du NWS…', failed: 'Le flux du NWS est indisponible. Consultez la carte officielle pour les alertes en cours.',
      empty: 'Cette réponse ne contient aucun message en cours de validité répondant aux critères.', issued: 'Émission', expires: 'Expiration du message', issuer: 'Émetteur',
      checked: 'Flux consulté', updated: 'Dernière modification du flux', agency: 'Message officiel', instructions: 'Consignes de l’émetteur',
      published: 'Instantané publié du NWS', overdue: 'Actualisation de l’instantané en retard',
      mapTitle: "Alertes par État", mapHelp: "Choisissez un État pour filtrer la liste. La couleur indique la gravité maximale signalée par le NWS pour cet État.", mapCount: "Nombre d’alertes", bulletinsTitle: "Bulletins en vigueur", mapFailed: "Carte indisponible",
      mapHighest: 'Gravité maximale signalée', mapClear: 'Aucune alerte en vigueur', mapSeverityUnknown: 'Gravité inconnue',
      mapPan: 'Faites défiler la carte horizontalement pour voir tous les États.', mapUnknown: 'Données d’alerte indisponibles',
      severity: { extreme: 'Extrême', severe: 'Sévère', moderate: 'Modérée', minor: 'Mineure' },
      cadence: 'Consultation toutes les 10 minutes lorsque cette page est visible.'
    },
    it: {
      title: 'Allerte meteo degli Stati Uniti', lead: 'Consulta i bollettini originali del National Weather Service (NWS) per le aree terrestri e marine coperte. I messaggi sono ordinati dal più recente al meno recente. Filtra per stato o territorio per consultare i bollettini locali.',
      viewAll: 'Vedi tutte le allerte USA', allTitle: 'Tutte le allerte meteo degli Stati Uniti', backToMap: 'Mappa delle allerte USA',
      filter: 'Stato o territorio', all: 'Tutte le aree coperte', refresh: 'Aggiorna', map: 'Mappa ufficiale del NWS',
      loading: 'Consultazione del NWS…', failed: 'Il servizio NWS non è disponibile. Consulta la mappa ufficiale per le allerte in corso.',
      empty: 'Questa risposta non contiene messaggi validi che soddisfino i criteri.', issued: 'Emissione', expires: 'Scadenza del messaggio', issuer: 'Ente emittente',
      checked: 'Ultima consultazione', updated: 'Ultima modifica alla fonte', agency: 'Messaggio ufficiale', instructions: 'Istruzioni dell’ente emittente',
      published: 'Dati NWS pubblicati', overdue: 'Aggiornamento dei dati in ritardo',
      mapTitle: "Allerte per Stato", mapHelp: "Scegli uno Stato per filtrare l’elenco. Il colore indica il livello più alto segnalato dal NWS per quello Stato.", mapCount: "Numero di allerte", bulletinsTitle: "Bollettini in vigore", mapFailed: "Mappa non disponibile",
      mapHighest: 'Gravità massima segnalata', mapClear: 'Nessuna allerta in vigore', mapSeverityUnknown: 'Gravità sconosciuta',
      mapPan: 'Scorri la mappa in orizzontale per vedere tutti gli stati.', mapUnknown: 'Dati sulle allerte non disponibili',
      severity: { extreme: 'Estrema', severe: 'Grave', moderate: 'Moderata', minor: 'Lieve' },
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
      const severity = typeof p.severity === 'string' ? p.severity.trim().toLowerCase() : '';
      entries.set(p.id, { severity: severityLevels.includes(severity) ? severity : '', id: p.id, sent, expires, states, event: p.event, area: p.areaDesc, issuer: p.senderName,
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

  function render(lang, listOnly = false) {
    const t = messages[lang] || messages.en;
    const options = Object.entries(areas).map(([key, name]) => '<option value="' + key + '">' + name + ' (' + key + ')</option>').join('');
    const pageTitle = listOnly ? t.allTitle : t.title;
    return '<section class="live-bulletins' + (listOnly ? ' bulletin-list-page' : '') + '" data-nws-bulletins><div class="container">' +
      (listOnly ? '<a class="back-link" href="#/bulletins">← ' + t.backToMap + '</a>' : '') +
      '<header class="bulletin-head"><h1>' + pageTitle + '</h1><p>' + t.lead + '</p></header>' +
      '<div class="bulletin-actions"><label>' + t.filter + ' <select><option value="">' + t.all + '</option>' + options + '</select></label>' +
      '<button type="button">' + t.refresh + '</button><a href="https://www.weather.gov/" target="_blank" rel="noopener noreferrer">' + t.map + ' ↗</a></div>' +
      '<p class="bulletin-status" role="status">' + t.loading + '</p>' +
      (listOnly ? '' : '<div class="bulletin-dashboard">' + mapPanel(t)) +
      '<section class="bulletin-records" aria-labelledby="nwsRecordsTitle">' +
        '<div class="bulletin-records-heading"><h2 id="nwsRecordsTitle">' + t.bulletinsTitle + '</h2><span class="bulletin-total"></span></div>' +
        (listOnly ? '' : '<a class="btn btn-outline bulletin-view-all" href="#/bulletins/all">' + t.viewAll + '</a>') +
        '<div class="bulletin-list"></div></section>' + (listOnly ? '' : '</div>') +
      '<p class="bulletin-meta bulletin-cadence">' + t.cadence + '</p></div></section>';
  }

  function mapPanel(t) {
    return '<section class="bulletin-map-card" aria-labelledby="nwsMapTitle">' +
        '<h2 id="nwsMapTitle">' + t.mapTitle + '</h2><p>' + t.mapHelp + '</p>' +
        '<p class="bulletin-map-pan">' + t.mapPan + '</p>' +
        '<div class="bulletin-map-viewport" tabindex="0" role="region" aria-labelledby="nwsMapTitle"><div class="bulletin-map"></div></div>' +
        '<p class="bulletin-map-selection" role="status" hidden></p>' +
        '<div class="bulletin-map-legend"><strong>' + t.mapHighest + '</strong>' +
          severityLevels.map(level => '<span data-map-level="' + level + '">' + t.severity[level] + '</span>').join('') +
          '<span data-map-level="clear">' + t.mapClear + '</span>' +
          '<span data-map-level="unspecified">' + t.mapSeverityUnknown + '</span>' +
          '<span data-map-level="unavailable" class="bulletin-map-unknown">' + t.mapUnknown + '</span>' +
          '<a href="https://github.com/topojson/us-atlas" target="_blank" rel="noopener noreferrer">U.S. Census Bureau / US Atlas ↗</a></div>' +
        '</section>';
  }

  function mapHtml(data) {
    const paths = [];
    const labels = [];
    const callouts = [];
    const insets = { AK: [101.7, 456], HI: [280, 535] };
    for (const [code, name] of Object.entries(areas)) {
      if (!Object.hasOwn(data.states, name)) continue;
      const [path, x, y, size] = data.states[name];
      paths.push('<path class="bulletin-state" data-state="' + code + '" d="' + esc(path) + '"><title>' + esc(name) + '</title></path>');
      if (Object.hasOwn(calloutPositions, code)) {
        const row = calloutPositions[code];
        callouts.push('<g class="bulletin-state-callout" data-state="' + code + '"><title>' + esc(name) + '</title>' +
          '<path d="M' + Number(x) + ',' + Number(y) + ' L968,' + row + '"/>' +
          '<rect x="968" y="' + (row - 12) + '" width="46" height="24" rx="5"/>' +
          '<text x="991" y="' + row + '">' + code + '</text></g>');
      } else if (size > 1700 || insets[code]) {
        const [labelX, labelY] = insets[code] || [Number(x), Number(y)];
        labels.push('<text x="' + labelX + '" y="' + labelY + '">' + code + '</text>');
      }
    }
    const [left, top, width, height] = data.viewBox;
    return '<svg viewBox="' + esc([left, top, width + 58, height].join(' ')) + '" class="bulletin-state-map" aria-hidden="true">' +
      '<g class="bulletin-map-insets"><path d="M-64 445H162L211 516V612H-64Z"/><rect x="215" y="520" width="128" height="92" rx="8"/></g>' +
      '<g>' + paths.join('') + '</g><g class="bulletin-state-labels">' + labels.join('') + '</g>' +
      '<g class="bulletin-state-callouts">' + callouts.join('') + '</g></svg>';
  }

  function stateSummaries(rows) {
    const summaries = {};
    for (const row of rows) {
      const rank = severityLevels.indexOf(row.severity);
      for (const state of row.states) {
        const summary = summaries[state] ??= { count: 0, severity: '' };
        summary.count += 1;
        const previousRank = severityLevels.indexOf(summary.severity);
        if (rank >= 0 && (previousRank < 0 || rank < previousRank)) summary.severity = row.severity;
      }
    }
    return summaries;
  }

  function rowHtml(row, t, clock) {
    const severity = severityLevels.includes(row.severity) ? row.severity : '';
    // Older published snapshots did not preserve CAP severity. Highlight their
    // named bulletin type without presenting it as a reported severity.
    const type = /\b(warning|watch|advisory|statement)\s*$/i.exec(row.event)?.[1].toLowerCase();
    const accent = severity || ({ warning: 'severe', watch: 'moderate', advisory: 'minor', statement: 'minor' })[type] || 'unknown';
    return '<details class="bulletin-row" data-accent="' + accent + '" data-id="' + esc(row.id) + '"><summary><span>' +
      '<span class="bulletin-event"><strong>' + esc(row.event) + '</strong>' +
      (severity ? '<span class="bulletin-severity">' + esc(t.severity[severity]) + '</span>' : '') +
      '</span><span class="bulletin-area">' + esc(row.area) + '</span></span><span class="bulletin-meta">' +
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
    const selection = section.querySelector('.bulletin-map-selection');
    const unknown = section.querySelector('.bulletin-map-unknown');
    const listTitle = section.querySelector('#nwsRecordsTitle');
    const listTotal = section.querySelector('.bulletin-total');
    const mapRequest = map ? new AbortController() : null;
    if (mapRequest) {
      fetch(mapPath, { signal: mapRequest.signal })
        .then(response => {
          if (!response.ok) throw Error('Map HTTP ' + response.status);
          return response.json();
        })
        .then(data => {
          if (!section.isConnected || mapRequest.signal.aborted) return;
          map.innerHTML = mapHtml(data);
          if (feed) updateRows();
          else updateMap(null);
        }).catch(() => {
          if (!mapRequest.signal.aborted) map.textContent = t.mapFailed;
        });
    }
    const status = section.querySelector('.bulletin-status'), list = section.querySelector('.bulletin-list');
    const formatter = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    function clock(ms) {
      return '<time datetime="' + new Date(ms).toISOString() + '">' + esc(formatter.format(ms)) + '</time>';
    }
    let pending, expiryTimer, feed, attemptedAt, lastHtml;

    function updateMap(valid) {
      if (!map) return;
      const summaries = stateSummaries(valid || []);
      unknown.hidden = Boolean(valid);
      function stateDescription(state) {
        if (!valid) return areas[state] + ' · ' + t.mapUnknown;
        const summary = summaries[state];
        const level = summary ? (t.severity[summary.severity] || t.mapSeverityUnknown) : t.mapClear;
        return areas[state] + ' · ' + level + ' · ' + t.mapCount + ' ' + (summary?.count || 0);
      }
      selection.hidden = !select.value;
      selection.textContent = select.value ? stateDescription(select.value) : '';
      map.querySelectorAll('[data-state]').forEach(node => {
        const state = node.dataset.state;
        const summary = summaries[state];
        node.dataset.mapLevel = !valid ? 'unavailable' : summary ? (summary.severity || 'unspecified') : 'clear';
        node.classList.toggle('is-selected', select.value === state);
        node.querySelector('title').textContent = stateDescription(state);
      });
    }

    function updateRows() {
      clearTimeout(expiryTimer);
      const now = Date.now();
      const tooOld = feed.published && now - feed.checkedAt >= maxSnapshotAge;
      const valid = tooOld ? [] : feed.allRows.filter(row => row.expires > now);
      const scoped = select.value ? valid.filter(row => row.states.includes(select.value)) : valid;
      const visible = map ? scoped.slice(0, pageSize) : scoped;
      const html = visible.map(row => rowHtml(row, t, clock)).join('') ||
        (tooOld ? '' : '<p class="bulletin-list-empty">' + t.empty + '</p>');
      listTitle.textContent = select.value ? areas[select.value] : t.bulletinsTitle;
      listTotal.textContent = tooOld ? '' : visible.length < scoped.length ? visible.length + ' / ' + scoped.length : String(scoped.length);
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
    map?.addEventListener('click', selectState);
    button.addEventListener('click', load);
    document.addEventListener('visibilitychange', visibilityChanged);
    const poll = setInterval(load, pollInterval);
    dispose = function () {
      clearInterval(poll);
      mapRequest?.abort();
      map?.removeEventListener('click', selectState);
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
  if (typeof module === 'object' && module.exports) module.exports = { ...api, readFeed, loadBulletins, stateSummaries, mapHtml, rowHtml, messages };
  else root.NDLiveBulletins = api;
})(typeof window === 'object' ? window : globalThis);
