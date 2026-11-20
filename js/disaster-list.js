/* Complete paginated lists of the published current and historical datasets. */
(function(){
 var view,mode,rows=[],page=1,search='',type='all',language='en',generation=0, requestedEvent='';
 var perPage=30, refreshTimer, filters={};
 var hazardTypes=['EQ','WF','FL','TC','DR','VO','TS'];
 function t(zh,en){return window.NDLocale.phrase(zh,en,language);}
 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function date(value){if(!value)return '—';var ms=typeof value==='number'?value:GdacsStatus.time(value);return isFinite(ms)?new Date(ms).toLocaleString(language==='zh'?'zh-CN':language,{timeZone:'UTC',timeZoneName:'short'}):'—';}
 function typeName(k){return {EQ:t('地震','Earthquake'),WF:t('山火','Wildfire'),FL:t('洪水','Flood'),TC:t('热带气旋','Tropical cyclone'),DR:t('干旱','Drought'),VO:t('火山','Volcano'),TS:t('海啸','Tsunami')}[k]||k;}
 function sourceLink(raw){var url=GdacsStatus.reportUrl(raw);return url?'<a target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+t('官方报告','Official report')+' ↗</a>':'';}
 function normalise(data,index){
  if(!data)return [];
  if(index===0){return (mode==='live'?(GdacsStatus.quakeWindow(data,Date.now())?.quakes || []).map(function(q){return {id:q.id,name:q.place,time:q.timestamp,mag:q.magnitude,lon:q.longitude,lat:q.latitude,depth:q.depth_km,url:q.url,alert:String(q.alert||'').toLowerCase(),tsunami:!!q.tsunami};}):GdacsStatus.uniqueCatalogRows(data.rows||[]).map(function(r){return {catalogType:r[6],id:r[7]||r[0]+':'+r[1]+':'+r[2],name:r[5],time:r[0],lon:r[1],lat:r[2],depth:r[3],mag:r[4]};})).map(function(q){return Object.assign(q,{type:GdacsStatus.isEarthquakeType(q.catalogType)?'EQ':q.catalogType,kind:'quake',country:'',source:data.sourceName||data.source||'—',checked:mode==='live'?data.fetchedAt:null,summary:'M'+q.mag,time:+q.time});});}
  return (data.features||[]).filter(function(f){return mode==='history'||GdacsStatus.active(f.properties||{},Date.now());}).map(function(f){var p=f.properties||{},c=(f.geometry&&f.geometry.coordinates)||[];return {id:[p.eventtype,p.eventid,p.episodeid].join(':'),type:p.eventtype,kind:'gdacs',active:p._active!==false,alert:String(p.alertlevel||'').toLowerCase(),name:/^event in rss format$/i.test(p.name||'')?(p.htmldescription||typeName(p.eventtype)+' · '+p.country):(p.name||p.description),country:p.country,lon:c[0],lat:c[1],time:GdacsStatus.reportTime(p),from:p.fromdate,to:p.todate,checked:p._verifiedAt||data.checkedAt||data.generatedAt,summary:[window.NDLocale.text(String(p.alertlevel||'').replace(/^./,function(c){return c.toUpperCase();}),language),p.severitydata&&p.severitydata.severitytext].filter(Boolean).join(' · '),body:p.htmldescription||p.description,source:p.source||'GDACS',url:p.url&&p.url.report,overdue:mode==='live'&&!GdacsStatus.fresh(p,Date.now())};});
 }
 function coordinates(r){
  if(!Number.isFinite(r.lat)||!Number.isFinite(r.lon)||Math.abs(r.lat)>90||Math.abs(r.lon)>180)return '—';
  return Math.abs(r.lat).toFixed(4)+'° '+(r.lat<0?'S':'N')+', '+Math.abs(r.lon).toFixed(4)+'° '+(r.lon<0?'W':'E');
 }
 function results(){
  var needle=NDDirectorySearch.fold(search);
  var cutoff=Date.now()-(Number(filters.days)||0)*86400000;
  var minMag=Math.max(Number(filters.minMag)||0,filters.significant==='1'?4.5:0);
  var filtered=rows.filter(function(r){
   if(type!=='all'&&r.type!==type)return false;
   if(filters.source&&r.kind!==filters.source)return false;
   if(filters.alert&&r.alert!==filters.alert)return false;
   if(minMag&&!(r.mag>=minMag))return false;
   if(filters.tsunami==='1'&&!r.tsunami)return false;
   if(filters.active==='1'&&!r.active)return false;
   if(filters.withCountry==='1'&&!r.country)return false;
   if(filters.days&&Math.max(r.time,GdacsStatus.time(r.to)||0)<cutoff)return false;
   return !needle||(filters.event===search?String(r.id)===search:r.search.includes(needle));
  });
  if(filters.sort==='magnitude')filtered.sort(function(a,b){return (b.mag||0)-(a.mag||0)||b.time-a.time;});
  var pages=Math.max(1,Math.ceil(filtered.length/perPage));
  page=Math.min(page,pages);
  view.querySelector('[data-disaster-count]').textContent=window.NDLocale.count(filtered.length,'records',language)+' · '+page+' / '+pages;
  var openEvents=new Set(Array.from(view.querySelectorAll('[data-event-id][open]'),function(el){return el.dataset.eventId;}));
  view.querySelector('[data-disaster-rows]').innerHTML=filtered.slice((page-1)*perPage,page*perPage).map(function(r){
   var magnitudeStyle=r.kind==='quake'?' style="color:'+window.NDCore.magnitudeColor(r.mag, true)+'"':'';
   return '<details class="disaster-record" data-event-id="' + esc(r.id) + '" data-hazard="' + esc(r.type) + '" data-alert="' + esc(r.alert || 'unknown') + '"><summary><span class="rescue-type">'+esc(typeName(r.type))+'</span><h2>'+esc(r.name||'—')+'</h2><span>'+(r.country?esc(r.country)+' · ':'')+esc(date(r.time))+'</span><strong'+magnitudeStyle+'>'+esc(r.summary||'')+'</strong><span class="record-open">'+t('查看详情','View details')+' +</span></summary><div class="disaster-record-body">'+(r.overdue?'<p class="history-notice">'+t('上次报告；当前状态等待更新确认。','Last reported; current status awaits a fresh update.')+'</p>':'')+'<dl><dt>'+t('来源','Source')+'</dt><dd>'+esc(r.source)+'</dd><dt>'+t('坐标','Coordinates')+'</dt><dd>'+coordinates(r)+'</dd>'+
     (r.kind==='quake'?'<dt>'+t('深度','Depth')+'</dt><dd>'+(Number.isFinite(r.depth)?esc(r.depth)+' km':'—')+'</dd>':
      '<dt>'+t('报告时间范围','Reported period')+'</dt><dd>'+esc(date(r.from))+' → '+esc(date(r.to))+'</dd>')+
     (r.checked?'<dt>'+t('上次采集','Last checked')+'</dt><dd>'+esc(date(r.checked))+'</dd>':'')+'</dl>'+(r.body?'<p class="rescue-type">'+t('来源原文','Original source text')+'</p><p class="disaster-original">'+esc(r.body)+'</p>':'')+sourceLink(r.url)+' '+window.NDRescue.button(r.country||r.name,'',language)+'</div></details>';}).join('')||'<p>'+t('没有匹配记录。','No matching records.')+'</p>';
  view.querySelector('[data-disaster-prev]').disabled=page===1;view.querySelector('[data-disaster-next]').disabled=page===pages;
  view.querySelectorAll('[data-event-id]').forEach(function(el){if(openEvents.has(el.dataset.eventId))el.open=true;});
  if(requestedEvent){var target=Array.from(view.querySelectorAll('[data-event-id]')).find(function(el){return el.dataset.eventId===requestedEvent;});if(target)target.open=true;requestedEvent='';}
  if(window.NDUnits)NDUnits.enhance(view.querySelector('[data-disaster-rows]'));
 }
 function render(el,query){
  clearTimeout(refreshTimer);
  filters=query;
  view=el;mode=query.mode==='history'?'history':'live';language=window.__modules.i18n.getLang();page=1;search=query.event||query.q||'';requestedEvent=query.event||'';type=hazardTypes.includes(query.type)?query.type:'all';rows=[];var token=++generation;
  var clearLink=Object.keys(query).some(function(key){return key!=='mode';})
   ? '<a class="btn btn-outline" href="#/disasters?mode='+mode+'">'+t('查看全部记录','View all records')+'</a>' : '';
  document.title=mode==='live'?t('实时灾害','Live disasters'):t('灾害历史','Disaster history');
  view.innerHTML='<section class="disaster-list-page"><div class="container"><a class="back-link" href="#/global?mode='+mode+'">← '+t('世界地图','World map')+'</a><header><div class="eyebrow">'+t('全球灾害记录','GLOBAL DISASTER RECORDS')+'</div><h1>'+esc(document.title)+'</h1><p>'+ (mode==='live'?t('GDACS 上次列出的当前事件与最近地震。采集延迟不代表灾害已结束。','GDACS last-listed current events and recent earthquakes. Collection delays do not establish that an event ended.'):t('全部已保存的 GDACS 与地震记录，包含过去的事件及报告。','All retained GDACS and earthquake records, including past events and reports.'))+'</p><nav class="disaster-mode"><a href="#/disasters?mode=live" '+(mode==='live'?'aria-current="page"':'')+'>'+t('实时灾害','Live disasters')+'</a><a href="#/disasters?mode=history" '+(mode==='history'?'aria-current="page"':'')+'>'+t('历史记录','History')+'</a></nav></header><div class="rescue-search-bar"><label>'+t('搜索地点或事件','Search place or event')+'<input data-disaster-search type="search" value="'+esc(search)+'"></label><label>'+t('灾害类型','Disaster type')+'<select data-disaster-type><option value="all">'+t('全部类型','All types')+'</option>'+hazardTypes.map(function(k){return '<option value="'+k+'"'+(k===type?' selected':'')+'>'+esc(typeName(k))+'</option>';}).join('')+'</select></label>'+clearLink+'</div><p class="global-meta" data-disaster-sources></p><p data-disaster-error role="status"></p><p data-disaster-count role="status">'+t('正在加载…','Loading…')+'</p><div data-disaster-rows></div><div class="disaster-pager"><button class="btn btn-outline" data-disaster-prev disabled>← '+t('上一页','Previous')+'</button><button class="btn btn-outline" data-disaster-next disabled>'+t('下一页','Next')+' →</button></div></div></section>';
  var urls=mode==='live'?['public-data/global-earthquakes.json','public-data/gdacs-events.json']:[query.catalog==='recent'?'public-data/global-quakes-recent.json':'public-data/global-quakes-history.json','public-data/gdacs-disaster-history.json'];
  var snapshots=[null,null], renderedRows;
  function isCurrent(){
   return token===generation&&location.hash.split('?')[0]==='#/disasters';
  }
  async function refresh(){
   if(!isCurrent())return;
   if(!document.hidden||!snapshots.some(Boolean)){
    var updates=await Promise.all(urls.map(async function(url){
     try{
      var response=await fetch(url,{cache:'no-cache',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error(response.status);
      return await response.json();
     }catch(error){return null;}
    }));
    if(!isCurrent())return;
    updates.forEach(function(update,index){
     if(update)snapshots[index]=update;
    });
    var notices=[];
    if(updates.some(function(update){return !update;})){
     notices.push(t('部分数据源暂不可用，显示已加载的记录。','Some data sources could not be loaded; showing available records.'));
    }
    if(mode==='live'){
     var now=Date.now();
     var gdacsCheck=snapshots[1]&&GdacsStatus.time(snapshots[1].checkedAt||snapshots[1].generatedAt);
     if((snapshots[0]&&!GdacsStatus.quakeSnapshotFresh(snapshots[0],now))||
        (snapshots[1]&&(!isFinite(gdacsCheck)||gdacsCheck>now+300000||now-gdacsCheck>=1800000))){
      notices.push(t('实时数据更新已延迟。','Live data updates are overdue.'));
     }
    }
    view.querySelector('[data-disaster-error]').textContent=notices.join(' ');
    var provenance=view.querySelector('[data-disaster-sources]');
    provenance.textContent=snapshots.map(function(data,index){
     if(!data)return '';
     var checked=index===0?data.fetchedAt:data.checkedAt;
     if(!checked)return '';
     return (index===0?(data.source||'USGS'):'GDACS')+' · '+t('上次采集','Last checked')+' '+date(checked);
    }).filter(Boolean).join('  /  ');
    rows=normalise(snapshots[0],0).concat(normalise(snapshots[1],1)).map(function(r){
     r.search=NDDirectorySearch.fold([r.id,r.name,r.country,r.summary,typeName(r.type),r.type].join(' '));
     return r;
    }).sort(function(a,b){return b.time-a.time;});
    var signature=mode==='live'?JSON.stringify(rows):null;
    if(signature!==renderedRows){
     renderedRows=signature;
     results();
    }
   }
   if(mode==='live'&&isCurrent())refreshTimer=setTimeout(refresh,60000);
  }
  refresh();
 }
 document.addEventListener('input',function(e){if(e.target.matches('[data-disaster-search]')){search=e.target.value;page=1;results();}});
 document.addEventListener('change',function(e){if(e.target.matches('[data-disaster-type]')){type=e.target.value;filters={};page=1;results();}});
 document.addEventListener('click',function(e){if(e.target.closest('[data-disaster-prev]')){page--;results();}if(e.target.closest('[data-disaster-next]')){page++;results();}});
 window.NDDisasterList={render:render};
})();
