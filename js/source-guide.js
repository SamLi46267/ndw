/* Collection policies correspond to the workflows in .github/workflows. */
(function (root) {
  'use strict';

  var sources = [
    { id: 'china', links: ['#/china', 'https://platform.weathercn.com/'] },
    { id: 'gdacs', links: ['#/global', 'https://www.gdacs.org/', 'https://www.gdacs.org/xml/rss.xml'] },
    { id: 'quakes', links: ['#/global', 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php', 'https://apizero.cn/'] },
    { id: 'nws', links: ['#/bulletins', 'https://www.weather.gov/', 'https://www.weather.gov/documentation/services-web-api'] },
    { id: 'directory', links: ['#/database', '#/rescue', 'https://www.ifrc.org/national-societies-directory'] }
  ];

  var copy = {
    en: {
      title: 'Sources and coverage',
      intro: 'An event time tells you when something happened. An issue time dates the notice. A last check tells you when the source was read successfully. Scheduled checks and publication can be delayed.',
      china: {
        title: 'China weather warnings · WeatherCN',
        scope: 'WeatherCN supplies city-level notices. GeoWarning rotates through 77 configured cities, normally checking four per 15-minute slot. A full rotation takes about five hours on schedule.',
        read: 'Select a city to see its last successful check. At six hours the result becomes historical. District matches depend on place names in the original notice. Read the issuing authority’s text for the affected area and instructions.',
        links: ['City warnings', 'WeatherCN data platform']
      },
      gdacs: {
        title: 'Floods, cyclones, wildfires and droughts · GDACS',
        scope: 'GeoWarning checks the GDACS current-event feed on a five-minute schedule for these four hazards. After 30 minutes without a fresh check, dashed map markers show the last reported positions.',
        read: 'A marker locates a report. The affected area can extend beyond that point. GDACS green, orange and red levels express potential humanitarian impact. Consult the event report for its assessment and local authorities for protective action.',
        links: ['Global map', 'GDACS reports', 'GDACS current feed']
      },
      quakes: {
        title: 'Earthquakes · APIZERO and USGS',
        scope: 'The 15-minute collection job requests the past day from APIZERO (M2.5 and above, up to 300 records). When that source is unavailable, it uses the USGS all-magnitudes past-day feed. Provider coverage can change the count.',
        read: 'Latitude and longitude locate the estimated epicenter. Depth is reported in kilometres. Magnitude describes the size of the earthquake at its source. Shaking at a particular place also depends on distance, depth and ground conditions.',
        links: ['Earthquake map', 'USGS feed fields', 'APIZERO (极数本源 · 全球地震速报)']
      },
      nws: {
        title: 'U.S. weather bulletins · National Weather Service',
        scope: 'GeoWarning checks the NWS when this page opens and every two minutes while visible. If your browser cannot reach NWS, the page uses GeoWarning’s published snapshot and shows when it was collected. The list shows up to 40 bulletins for the selected area.',
        read: 'The list shows unexpired alerts and updates marked Actual, ordered by issue time. Open a bulletin to read the original English text, affected area and expiry. Additional bulletins may apply to your location. Check your local NWS office for current instructions.',
        links: ['Browse bulletins', 'Find your NWS office', 'NWS API documentation']
      },
      directory: {
        title: 'Historical records and rescue contacts',
        scope: 'The archive preserves reports the project received. Daily USGS backfills cover M2.5 and above. Collection gaps and different provider thresholds affect comparisons between places and dates.',
        read: 'The directory includes national Red Cross and Red Crescent societies from IFRC GO and separately sourced local organizations. A directory entry identifies a contact resource. For immediate help, use the local emergency number.',
        links: ['Search the archive', 'Rescue directory', 'IFRC society directory']
      }
    },
    zh: {
      title: '数据来源与覆盖范围',
      intro: '事件时间指事件发生的时间，发布时间指机构发出通告的时间。上次查询指成功读取来源的时间。定时采集与发布都可能延迟。',
      china: {
        title: '中国气象预警 · WeatherCN',
        scope: 'WeatherCN 按城市提供预警。本站轮流查询 77 个已配置城市，通常每 15 分钟查询 4 个。按计划运行时，一轮约需 5 小时。',
        read: '选择城市可查看上次成功查询时间。距查询满 6 小时后，结果标记为历史记录。区县筛选依据预警原文中的地名，请查阅发布机构的原文，确认影响区域和防御措施。',
        links: ['查看城市预警', 'WeatherCN 数据平台']
      },
      gdacs: {
        title: '洪水、热带气旋、野火与干旱 · GDACS',
        scope: '本站计划每 5 分钟查询一次 GDACS 当前事件列表，收录这四类灾害。如果 30 分钟内没有成功更新，地图以虚线标出上次报告的位置。',
        read: '地图标记代表报告的位置，实际影响范围可能更广。GDACS 的绿、橙、红三级表示潜在的人道主义影响。查看事件报告可了解评估依据，防护行动请遵循当地主管部门的指示。',
        links: ['全球灾害地图', 'GDACS 事件报告', 'GDACS 当前事件订阅源']
      },
      quakes: {
        title: '地震 · 极数本源与 USGS',
        scope: '地震采集计划每 15 分钟运行一次，优先从极数本源 · 全球地震速报（APIZERO） 获取过去一天震级 2.5 及以上的记录，最多 300 条。该来源不可用时，改用 USGS 过去一天的全部震级订阅源。不同来源的收录范围会影响数量。',
        read: '经纬度表示估算的震中位置，震源深度以千米为单位。震级反映地震本身的大小。某地感受到的震动还取决于距离、震源深度和当地地质条件。',
        links: ['地震地图', 'USGS 数据字段说明', '极数本源 · 全球地震速报']
      },
      nws: {
        title: '美国气象通告 · 美国国家气象局',
        scope: '页面打开时及可见时每两分钟查询一次 NWS。若浏览器无法连接 NWS，则使用 GeoWarning 发布的快照并显示采集时间。每个地区最多显示 40 条通告。',
        read: '列表按发布时间排列，显示标为实际事件且尚未到期的预警及更新。打开通告可查看英文原文、影响区域和到期时间。当地可能还有其他通告，请查阅辖区 NWS 办公室发布的最新指示。',
        links: ['查看气象通告', '查找辖区 NWS 办公室', 'NWS 接口文档']
      },
      directory: {
        title: '历史档案与救援联系',
        scope: '档案保存本站已收到的报告。USGS 每日历史补录覆盖震级 2.5 及以上的地震。比较不同日期或地区时，需考虑采集空缺和不同来源的收录门槛。',
        read: '救援目录收录 IFRC GO 提供的各国红十字会和红新月会资料，并附有另行查证来源的地方机构。目录可帮助查找联络渠道。如需紧急援助，请拨打当地紧急电话。',
        links: ['查询档案', '救援目录', 'IFRC 各国红会名录']
      }
    },
    es: {
      title: 'Fuentes y cobertura',
      intro: 'La hora del evento indica cuándo ocurrió. La hora de emisión corresponde al aviso. La última consulta indica cuándo se pudo leer la fuente. La recopilación y la publicación pueden retrasarse.',
      china: {
        title: 'Avisos meteorológicos de China · WeatherCN',
        scope: 'WeatherCN distribuye avisos por ciudad. GeoWarning consulta 77 ciudades por turnos, normalmente cuatro cada 15 minutos. Una ronda completa tarda unas cinco horas si se cumple el horario.',
        read: 'Seleccione una ciudad para ver la última consulta correcta. A las seis horas el resultado pasa al historial. Los distritos se identifican por sus nombres en el aviso original. Consulte el texto de la autoridad emisora para conocer la zona afectada y las medidas indicadas.',
        links: ['Avisos por ciudad', 'Plataforma de WeatherCN']
      },
      gdacs: {
        title: 'Inundaciones, ciclones, incendios forestales y sequías · GDACS',
        scope: 'GeoWarning consulta la lista de eventos actuales de GDACS cada cinco minutos según el horario previsto. Tras 30 minutos sin una nueva consulta correcta, los marcadores discontinuos indican las últimas posiciones comunicadas.',
        read: 'El marcador sitúa el informe. La zona afectada puede ser mucho mayor. Los niveles verde, naranja y rojo de GDACS expresan el posible impacto humanitario. Consulte el informe para conocer la evaluación y siga las instrucciones de las autoridades locales.',
        links: ['Mapa mundial', 'Informes de GDACS', 'Fuente de eventos actuales de GDACS']
      },
      quakes: {
        title: 'Sismos · APIZERO y USGS',
        scope: 'La tarea programada cada 15 minutos solicita a APIZERO hasta 300 registros del último día de magnitud 2,5 o superior. Si la fuente no está disponible, utiliza los registros del último día de todas las magnitudes del USGS. El recuento depende de la cobertura.',
        read: 'Las coordenadas sitúan el epicentro estimado. La profundidad se expresa en kilómetros. La magnitud describe el tamaño del sismo en su origen. La sacudida en un lugar también depende de la distancia, la profundidad y las condiciones del terreno.',
        links: ['Mapa sísmico', 'Campos de datos del USGS', 'APIZERO (极数本源 · 全球地震速报)']
      },
      nws: {
        title: 'Boletines de EE. UU. · National Weather Service',
        scope: 'GeoWarning consulta el NWS al abrir la página y cada dos minutos mientras está visible. Si el navegador no puede conectarse al NWS, la página utiliza la instantánea publicada por GeoWarning e indica cuándo se recopiló. Se muestran hasta 40 boletines para el área seleccionada.',
        read: 'Los avisos vigentes y sus actualizaciones con estado Actual (evento real) se ordenan por hora de emisión. Abra un boletín para ver el texto original en inglés, la zona afectada y el vencimiento. Puede haber más avisos. Consulte las instrucciones de la oficina local del NWS.',
        links: ['Consultar boletines', 'Buscar una oficina del NWS', 'Documentación de la API del NWS']
      },
      directory: {
        title: 'Archivo histórico y contactos de rescate',
        scope: 'El archivo conserva los informes recibidos por el proyecto. La recopilación histórica diaria del USGS abarca sismos de magnitud 2,5 o superior. Las lagunas de recopilación y los umbrales de cada fuente influyen en las comparaciones.',
        read: 'El directorio incluye sociedades nacionales de la Cruz Roja y de la Media Luna Roja de IFRC GO y organizaciones locales de otras fuentes. Las fichas permiten localizar contactos. Si necesita ayuda inmediata, llame al número local de emergencias.',
        links: ['Buscar en el archivo', 'Directorio de rescate', 'Directorio de sociedades de la Federación']
      }
    },
    fr: {
      title: 'Sources et couverture',
      intro: 'L’heure de l’événement indique quand il a eu lieu. L’heure d’émission date le bulletin. La dernière consultation indique quand la source a pu être lue. La collecte et la publication peuvent prendre du retard.',
      china: {
        title: 'Alertes météo en Chine · WeatherCN',
        scope: 'WeatherCN diffuse les avis par ville. GeoWarning consulte 77 villes à tour de rôle, généralement quatre par tranche de 15 minutes. Un cycle complet dure environ cinq heures si le calendrier est respecté.',
        read: 'Sélectionnez une ville pour connaître l’heure de la dernière consultation réussie. Au bout de six heures, le résultat passe en historique. Les districts sont identifiés par les lieux cités dans l’avis original. Consultez le texte de l’autorité émettrice pour la zone touchée et les consignes.',
        links: ['Alertes par ville', 'Plateforme WeatherCN']
      },
      gdacs: {
        title: 'Inondations, cyclones, feux de forêt et sécheresses · GDACS',
        scope: 'GeoWarning prévoit de consulter toutes les cinq minutes la liste GDACS des événements en cours pour ces quatre aléas. Après 30 minutes sans nouvelle vérification, les marqueurs en pointillé indiquent les dernières positions signalées.',
        read: 'Le marqueur situe le signalement. La zone touchée peut être plus étendue. Les niveaux vert, orange et rouge de GDACS expriment l’impact humanitaire potentiel. Consultez le rapport pour l’évaluation et suivez les consignes des autorités locales.',
        links: ['Carte mondiale', 'Rapports GDACS', 'Flux des événements GDACS']
      },
      quakes: {
        title: 'Séismes · APIZERO et USGS',
        scope: 'La collecte prévue toutes les 15 minutes demande à APIZERO jusqu’à 300 séismes de magnitude 2,5 ou plus sur la dernière journée. En cas d’indisponibilité, le flux USGS couvre toutes les magnitudes sur la dernière journée. Le nombre dépend de la couverture de la source.',
        read: 'Les coordonnées situent l’épicentre estimé. La profondeur est exprimée en kilomètres. La magnitude mesure la taille du séisme à sa source. Les secousses ressenties localement dépendent aussi de la distance, de la profondeur et de la nature du sol.',
        links: ['Carte des séismes', 'Champs de données USGS', 'APIZERO (极数本源 · 全球地震速报)']
      },
      nws: {
        title: 'Bulletins météo des États-Unis · National Weather Service',
        scope: 'GeoWarning consulte le NWS à l’ouverture de la page, puis toutes les deux minutes lorsqu’elle est visible. Si le navigateur ne peut pas joindre le NWS, la page utilise l’instantané publié par GeoWarning et indique l’heure de collecte. La liste affiche jusqu’à 40 bulletins pour la zone sélectionnée.',
        read: 'Les alertes et mises à jour en vigueur portant le statut Actual (événement réel) sont classées par heure d’émission. Ouvrez le bulletin pour lire le texte original anglais, la zone concernée et l’échéance. D’autres avis peuvent s’appliquer. Consultez les consignes du bureau local du NWS.',
        links: ['Consulter les bulletins', 'Trouver un bureau du NWS', 'Documentation de l’API du NWS']
      },
      directory: {
        title: 'Archives et contacts de secours',
        scope: 'Les archives conservent les rapports reçus par le projet. La collecte historique quotidienne de l’USGS couvre les magnitudes de 2,5 ou plus. Les lacunes de collecte et les différents seuils influencent les comparaisons entre lieux et dates.',
        read: 'L’annuaire regroupe des Sociétés nationales de la Croix-Rouge et du Croissant-Rouge issues d’IFRC GO, ainsi que des organismes locaux documentés séparément. Il permet de trouver des contacts. Pour une aide immédiate, appelez le numéro d’urgence local.',
        links: ['Chercher dans les archives', 'Annuaire des secours', 'Annuaire des Sociétés nationales']
      }
    },
    it: {
      title: 'Fonti e copertura',
      intro: 'L’ora dell’evento indica quando si è verificato. L’ora di emissione si riferisce al bollettino. L’ultimo controllo indica quando è stato possibile consultare la fonte. La raccolta e la pubblicazione possono subire ritardi.',
      china: {
        title: 'Allerte meteo in Cina · WeatherCN',
        scope: 'WeatherCN distribuisce gli avvisi per città. GeoWarning consulta a rotazione 77 città, solitamente quattro ogni 15 minuti. Un ciclo completo dura circa cinque ore se il programma viene rispettato.',
        read: 'Seleziona una città per vedere l’ultimo controllo riuscito. Dopo sei ore il risultato diventa storico. I distretti sono individuati tramite i luoghi citati nell’avviso originale. Leggi il testo dell’autorità emittente per verificare l’area interessata e le indicazioni.',
        links: ['Allerte per città', 'Piattaforma WeatherCN']
      },
      gdacs: {
        title: 'Alluvioni, cicloni, incendi boschivi e siccità · GDACS',
        scope: 'GeoWarning prevede di consultare ogni cinque minuti l’elenco degli eventi in corso del GDACS per questi quattro pericoli. Dopo 30 minuti senza un nuovo controllo, i marcatori tratteggiati indicano le ultime posizioni segnalate.',
        read: 'Il marcatore localizza la segnalazione. L’area colpita può essere più estesa. I livelli verde, arancione e rosso del GDACS indicano il potenziale impatto umanitario. Consulta il rapporto per la valutazione e segui le indicazioni delle autorità locali.',
        links: ['Mappa mondiale', 'Rapporti GDACS', 'Flusso degli eventi GDACS']
      },
      quakes: {
        title: 'Terremoti · APIZERO e USGS',
        scope: 'La raccolta programmata ogni 15 minuti richiede ad APIZERO fino a 300 eventi dell’ultimo giorno di magnitudo pari o superiore a 2,5. Se la fonte non è disponibile, utilizza il flusso USGS di tutte le magnitudo dell’ultimo giorno. Il conteggio dipende dalla copertura.',
        read: 'Le coordinate individuano l’epicentro stimato. La profondità è riportata in chilometri. La magnitudo misura la grandezza del terremoto alla sorgente. Lo scuotimento locale dipende anche dalla distanza, dalla profondità e dalle condizioni del terreno.',
        links: ['Mappa dei terremoti', 'Campi dati USGS', 'APIZERO (极数本源 · 全球地震速报)']
      },
      nws: {
        title: 'Bollettini meteo degli Stati Uniti · National Weather Service',
        scope: 'GeoWarning consulta il NWS all’apertura della pagina e ogni due minuti mentre è visibile. Se il browser non riesce a raggiungere il NWS, vengono mostrati i dati pubblicati da GeoWarning con l’ora di raccolta. L’elenco mostra fino a 40 bollettini per l’area selezionata.',
        read: 'Gli avvisi e gli aggiornamenti in vigore con stato Actual (evento reale) sono ordinati per ora di emissione. Apri un bollettino per leggere il testo originale in inglese, l’area interessata e la scadenza. Potrebbero esserci altri avvisi. Consulta le istruzioni dell’ufficio locale del NWS.',
        links: ['Consulta i bollettini', 'Trova un ufficio NWS', 'Documentazione API del NWS']
      },
      directory: {
        title: 'Archivio storico e contatti di soccorso',
        scope: 'L’archivio conserva i rapporti ricevuti dal progetto. Il recupero storico giornaliero da USGS copre eventi di magnitudo pari o superiore a 2,5. Lacune nella raccolta e soglie diverse influenzano i confronti tra luoghi e date.',
        read: 'L’elenco comprende società nazionali della Croce Rossa e della Mezzaluna Rossa da IFRC GO e organizzazioni locali documentate separatamente. Le schede aiutano a trovare i contatti. Per assistenza immediata chiama il numero di emergenza locale.',
        links: ['Cerca nell’archivio', 'Elenco dei soccorsi', 'Elenco IFRC delle società nazionali']
      }
    }
  };

  function render(lang) {
    var page = Object.hasOwn(copy, lang) ? copy[lang] : copy.en;
    return '<section class="source-guide" id="source-guide" aria-labelledby="source-guide-title">' +
      '<h1 id="source-guide-title">' + page.title + '</h1><p>' + page.intro + '</p>' +
      '<div class="source-guide-list">' + sources.map(function (source) {
        var row = page[source.id];
        return '<details id="source-' + source.id + '"><summary>' + row.title + '</summary>' +
          '<p>' + row.scope + '</p><p>' + row.read + '</p><p class="source-guide-links">' +
          source.links.map(function (href, index) {
            return '<a href="' + href + '">' + row.links[index] + '</a>';
          }).join(' ') + '</p></details>';
      }).join('') + '</div></section>';
  }

  root.NDSourceGuide = { render: render };
})(window);
