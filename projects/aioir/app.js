/* AiOIR survey: dependency-free, static GitHub Pages client. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const safeUrl = value => /^https?:\/\//i.test(value || '') ? esc(value) : '';
  const link = (href, text, cls = '') => safeUrl(href) ? `<a class="${cls}" href="${safeUrl(href)}" target="_blank" rel="noopener noreferrer">${text}</a>` : '';
  let catalog = window.AIOIR_CATALOG;
  let paperState = {year:'', query:'', venue:'', code:false, page:1};
  const params = new URLSearchParams(location.search);
  let boardState = {group:params.get('benchmark') || 'three',track:params.get('track') || 'weatherstream',metric:params.get('metric') || 'both',category:params.get('category') ?? 'All-in-One',query:params.get('q') || '',onlyNew:params.get('new') === '1',sort:params.get('sort') || 'avg',dir:params.get('dir') === 'asc' ? 1 : -1};
  let visibleRows = [];

  function common() {
    document.querySelectorAll('[data-stat="papers"]').forEach(e => e.textContent = catalog.papers.length);
    document.querySelectorAll('[data-stat="results"]').forEach(e => e.textContent = catalog.benchmarks.reduce((sum,b) => sum+b.rows.length,0));
    $('data-status').textContent = 'Data updated ' + new Date(catalog.updated+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
    initPapers();
    initBoard();
  }
  function venueOf(p) {
    const venue=p.venue.replace(/\s*20\d\d.*/,'').trim();
    return venue.replace(/^IEEE\s+(?:Trans\.\s*)?/,'').replace('ACMMM','ACM MM').replace('NIPS','NeurIPS').replace('arxiv','arXiv');
  }
  function initPapers() {
    $('paper-count').textContent=catalog.papers.length;
    const venues=[...new Set(catalog.papers.map(venueOf))].sort((a,b)=>a.localeCompare(b));
    $('venue-filter').innerHTML='<option value="">All venues</option>'+venues.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    $('venue-filter').value=paperState.venue;
    const years=[...new Set(catalog.papers.map(p=>p.year))].sort((a,b)=>b-a);
    $('year-tabs').innerHTML=[['','All years'],...years.map(y=>[y,y])].map(([v,label])=>`<button type="button" data-year="${v}" aria-pressed="${String(paperState.year)===String(v)}" class="${String(paperState.year)===String(v)?'active':''}">${label}<span>${v?catalog.papers.filter(p=>p.year===v).length:catalog.papers.length}</span></button>`).join('');
    $('year-tabs').onclick=e=>{const b=e.target.closest('[data-year]');if(b){paperState.year=b.dataset.year;paperState.page=1;initPapers();}};
    $('paper-search').oninput=e=>{paperState.query=e.target.value;paperState.page=1;renderPapers();};
    $('venue-filter').onchange=e=>{paperState.venue=e.target.value;paperState.page=1;renderPapers();};
    $('code-filter').onchange=e=>{paperState.code=e.target.checked;paperState.page=1;renderPapers();};
    $('reset-papers').onclick=()=>{paperState={year:'',query:'',venue:'',code:false,page:1};$('paper-search').value='';$('code-filter').checked=false;initPapers();};
    $('copy-citation').onclick=async()=>{try{await navigator.clipboard.writeText($('bibtex').textContent);$('copy-status').textContent='BibTeX copied.';}catch{$('copy-status').textContent='Select and copy the BibTeX text shown here.';}};
    renderPapers();
  }
  function renderPapers() {
    const q=paperState.query.toLowerCase().trim();
    const rows=catalog.papers.filter(p=>(!paperState.year || p.year===Number(paperState.year)) && (!paperState.venue || venueOf(p)===paperState.venue) && (!paperState.code || p.code) && (!q || `${p.title} ${p.authors} ${p.venue} ${p.year}`.toLowerCase().includes(q)));
    const size=30,pages=Math.max(1,Math.ceil(rows.length/size));
    paperState.page=Math.min(pages,paperState.page);
    const start=(paperState.page-1)*size;
    $('paper-status').textContent=rows.length?`${start+1}–${Math.min(start+size,rows.length)} of ${rows.length} papers`:'No papers match these filters';
    $('papers').innerHTML=rows.slice(start,start+size).map(p=>`<article class="paper-row"><div class="paper-year"><strong>${p.year}</strong></div><div><h3>${p.paper?link(p.paper,esc(p.title)):esc(p.title)}</h3><p class="paper-authors">${esc(p.authors)}</p><span class="venue-tag">${esc(p.venue)}</span></div><div class="paper-actions">${link(p.paper,'Paper ↗')}${link(p.code,'Code ↗')}</div></article>`).join('') || '<div class="empty-state">No matching papers. Try a different search or reset the filters.</div>';
    $('paper-pagination').innerHTML=rows.length?`<button id="prev-page" ${paperState.page===1?'disabled':''}>← Previous</button><span>Page ${paperState.page} / ${pages}</span><button id="next-page" ${paperState.page===pages?'disabled':''}>Next →</button>`:'';
    if($('prev-page'))$('prev-page').onclick=()=>{paperState.page--;renderPapers();$('library').scrollIntoView({block:'start'});};
    if($('next-page'))$('next-page').onclick=()=>{paperState.page++;renderPapers();$('library').scrollIntoView({block:'start'});};
  }

  function group() { return catalog.benchmarks.find(g=>g.id===boardState.group) || catalog.benchmarks[0]; }
  function activeMetric() { return boardState.metric==='both'?'psnr':boardState.metric; }
  function metricIndex() { return {psnr:0,ssim:1,lpips:2}[activeMetric()]; }
  function rowsInTrack() {const g=group();return g.rows.filter(r=>!g.tracks || r.track===boardState.track);}
  function initBoard(persistUrl = false) {
    const g=group();boardState.group=g.id;
    if (g.tracks && !g.tracks.some(t=>t.id===boardState.track)) boardState.track=g.tracks[0].id;
    if (!g.columns.some(c=>c.id===boardState.sort) && boardState.sort!=='method' && boardState.sort!=='params') boardState.sort='avg';
    if (!['both','psnr','ssim','lpips'].includes(boardState.metric) || boardState.metric==='lpips' && boardState.track!=='weatherbench')boardState.metric='both';
    $('benchmark-tabs').innerHTML=catalog.benchmarks.map((b,i)=>`<button type="button" data-group="${b.id}" class="${b.id===g.id?'active':''}" aria-pressed="${b.id===g.id}">${esc(b.short)}<span>${String(i+1).padStart(2,'0')}</span></button>`).join('');
    $('benchmark-tabs').onclick=e=>{const b=e.target.closest('[data-group]');if(b){boardState.group=b.dataset.group;boardState.sort='avg';boardState.category=['three','five'].includes(boardState.group)?'All-in-One':'';boardState.query='';boardState.metric='both';boardState.dir=-1;initBoard(true);}};
    $('benchmark-kicker').textContent=`BENCHMARK ${String(catalog.benchmarks.indexOf(g)+1).padStart(2,'0')} / 05`;
    $('board-title').textContent=g.title;
    $('board-description').textContent=g.description;
    $('track-tabs').hidden=!g.tracks;
    $('track-tabs').innerHTML=(g.tracks||[]).map(t=>`<button type="button" data-track="${t.id}" class="${t.id===boardState.track?'active':''}" aria-pressed="${t.id===boardState.track}">${esc(t.label)}</button>`).join('');
    $('track-tabs').onclick=e=>{const b=e.target.closest('[data-track]');if(b){boardState.track=b.dataset.track;boardState.category='';boardState.metric='both';boardState.dir=-1;initBoard(true);}};
    const cats=[...new Set(rowsInTrack().map(r=>r.category).filter(Boolean))];
    if(!cats.includes(boardState.category))boardState.category='';
    $('category-filter').innerHTML='<option value="">All categories</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
    $('category-filter').value=boardState.category;
    $('category-filter').disabled=cats.length===0;
    const hasLpips=g.id==='realworld' && boardState.track==='weatherbench';
    $('metric-filter').innerHTML='<option value="both">PSNR / SSIM</option><option value="psnr">PSNR</option><option value="ssim">SSIM</option>'+(hasLpips?'<option value="lpips">LPIPS ↓</option>':'');
    $('metric-filter').value=boardState.metric;
    $('method-search').value=boardState.query;
    $('new-filter').checked=boardState.onlyNew;
    $('method-search').oninput=e=>{boardState.query=e.target.value;renderBoard();};
    $('category-filter').onchange=e=>{boardState.category=e.target.value;renderBoard();};
    $('metric-filter').onchange=e=>{boardState.metric=e.target.value;boardState.dir=catalog.metrics[activeMetric()].higher?-1:1;renderBoard();};
    $('new-filter').onchange=e=>{boardState.onlyNew=e.target.checked;renderBoard();};
    $('reset-board').onclick=()=>{boardState.query='';boardState.category='';boardState.onlyNew=false;initBoard(true);};
    $('download-csv').onclick=downloadCsv;
    $('update-details').innerHTML=`<p><strong>${esc(catalog.updated)}</strong> · Added ${catalog.updates.newRows} result rows from original papers, including ${catalog.updates.newMethods.map(esc).join(', ')}. WeatherBench baseline rows are attributed to ClusIR’s comparison table.</p><p>${catalog.updates.corrections.map(esc).join(' ')}</p><p>${catalog.updates.excluded.map(esc).join(' ')}</p>`;
    renderBoard(persistUrl);
  }
  function updateUrl() {
    const p=new URLSearchParams({benchmark:boardState.group});
    if(group().tracks)p.set('track',boardState.track);
    if(boardState.metric!=='both')p.set('metric',boardState.metric);
    p.set('category',boardState.category);
    if(boardState.query)p.set('q',boardState.query);
    if(boardState.onlyNew)p.set('new','1');
    if(boardState.sort!=='avg')p.set('sort',boardState.sort);
    if(boardState.dir===1)p.set('dir','asc');
    history.replaceState(null,'','?'+p.toString()+'#leaderboard');
  }
  function valueOf(row,key) {
    if(key==='method')return row.method;
    if(key==='params') {const nums=String(row.params).match(/\d+(?:\.\d+)?/g);return nums?nums.reduce((n,x)=>n+Number(x),0):null;}
    return row.scores[key]?.[metricIndex()] ?? null;
  }
  function renderBoard(persistUrl = true) {
    const g=group(),q=boardState.query.toLowerCase().trim();
    visibleRows=rowsInTrack().filter(r=>(!boardState.category || r.category===boardState.category) && (!boardState.onlyNew || r.added) && (!q || `${r.method} ${r.venue} ${r.approach}`.toLowerCase().includes(q)));
    visibleRows.sort((a,b)=>{const av=valueOf(a,boardState.sort),bv=valueOf(b,boardState.sort);if(av===null)return bv===null?0:1;if(bv===null)return -1;return boardState.dir*(typeof av==='string'?av.localeCompare(bv):av-bv)||a.method.localeCompare(b.method);});
    const metric=catalog.metrics[activeMetric()];
    $('board-status').textContent=`${visibleRows.length} / ${rowsInTrack().length} results · Ranked within this selection`;
    $('sort-help').textContent=`${metric.higher?'Higher is better ↑':'Lower is better ↓'} · Click a column to sort`;
    const sortButton=(key,title)=>`<button type="button" class="sort-button" data-sort="${key}">${title}<span>${boardState.sort===key?(boardState.dir===-1?'↓':'↑'):'↕'}</span></button>`;
    const ariaSort=key=>boardState.sort===key?(boardState.dir===1?'ascending':'descending'):'none';
    const head=$('leaderboard-table').querySelector('thead');
    head.innerHTML=`<tr><th scope="col" class="method-head" aria-sort="${ariaSort('method')}">${sortButton('method','Method')}</th>${g.columns.map(c=>`<th scope="col" aria-sort="${ariaSort(c.id)}">${sortButton(c.id,esc(c.label))}</th>`).join('')}<th scope="col" aria-sort="${ariaSort('params')}">${sortButton('params','Params (M)')}</th></tr>`;
    head.onclick=e=>{const b=e.target.closest('[data-sort]');if(!b)return;const key=b.dataset.sort;if(boardState.sort===key)boardState.dir*=-1;else{boardState.sort=key;boardState.dir=['method','params'].includes(key)?1:metric.higher?-1:1;}renderBoard();};
    const best={};
    for(const c of g.columns){const nums=visibleRows.map(r=>r.scores[c.id]?.[metricIndex()]).filter(v=>v!==undefined&&v!==null);best[c.id]=nums.length?(metric.higher?Math.max(...nums):Math.min(...nums)):null;}
    let rank=0,last=null;
    $('leaderboard-table').querySelector('tbody').innerHTML=visibleRows.map((r,i)=>{
      const v=valueOf(r,boardState.sort);if(v!==last || i===0)rank=i+1;last=v;
      return `<tr><td class="method-cell"><div><span class="rank ${rank<=3?'top':''}">${rank}</span><div><button type="button" class="method-button" data-row="${r.id}">${esc(r.method)} ${r.added?'<span class="new-badge">NEW</span>':''}${r.corrected?'<span class="corrected-badge" title="Corrected against original paper"> †</span>':''}<span class="method-venue">${esc(r.venue || r.category || 'Reported result')}</span></button></div></div></td>${g.columns.map(c=>{
        const pair=r.scores[c.id],v=pair?.[metricIndex()];
        let label='—';
        if(v!==undefined&&v!==null){label=boardState.metric==='both'?`${pair[0].toFixed(2)}<span class="metric-divider">/</span><span class="metric-sub">${pair[1].toFixed(4).replace(/0$/,'')}</span>`:v.toFixed(metric.digits);}
        return `<td class="${c.id==='avg'?'avg-cell':''}"><span class="metric-value ${v!==undefined && v===best[c.id]?'best':''}">${label}</span></td>`;
      }).join('')}<td class="params-cell">${esc(String(r.params).replace(/M/g,''))}</td></tr>`;
    }).join('');
    $('leaderboard-table').querySelector('tbody').onclick=e=>{const b=e.target.closest('[data-row]');if(b)showMethod(g.rows.find(r=>r.id===b.dataset.row));};
    $('table-caption').textContent=`${g.title}${g.tracks?' — '+g.tracks.find(t=>t.id===boardState.track).label:''}. ${boardState.metric==='both'?'PSNR in dB / SSIM':metric.label}. Sorted by ${boardState.sort} ${boardState.dir===-1?'descending':'ascending'}.`;
    $('empty-board').hidden=visibleRows.length!==0;
    if (persistUrl) updateUrl();
  }
  function showMethod(r) {
    const matched=catalog.papers.find(p=>p.code && p.code===r.code || p.paper && p.paper===r.paper);
    $('method-details').innerHTML=`<p class="dialog-kicker">RESULT PROVENANCE ${r.added?' / NEW ADDITION':''}</p><h2>${esc(r.method)}</h2><p class="detail-meta">${[r.venue,r.category,r.params+' parameters'].filter(Boolean).map(esc).join(' · ')}</p>${matched?`<p>${esc(matched.title)}</p>`:''}<p class="detail-note">${esc(r.note)}</p>${r.approach?`<p class="detail-meta">Approach: ${esc(r.approach)}</p>`:''}<div class="resource-links">${link(r.source,esc(r.sourceLabel)+' ↗')}${link(r.paper,'Paper ↗')}${link(r.code,'Code ↗')}</div><p class="detail-source">Source: ${link(r.source,esc(r.source))}</p>`;
    $('method-dialog').showModal();
  }
  function csvEscape(v) {let s=String(v??'');if(/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function downloadCsv() {
    const g=group(),ids=boardState.metric==='both'?[0,1]:[metricIndex()];
    const metrics=['PSNR','SSIM','LPIPS'];
    const header=['Method','Category','Venue','Params',...g.columns.flatMap(c=>ids.map(i=>c.label+' '+metrics[i])),'Source','Source table','Notes','Added'];
    const rows=visibleRows.map(r=>[r.method,r.category,r.venue,r.params,...g.columns.flatMap(c=>ids.map(i=>r.scores[c.id]?.[i]??'')),r.source,r.sourceLabel,r.note,r.added]);
    const csv='\ufeff'+[header,...rows].map(row=>row.map(csvEscape).join(',')).join('\r\n');
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
    a.href=url;a.download=`aioir-${g.id}${g.tracks?'-'+boardState.track:''}-${catalog.updated}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  if(!catalog){$('data-status').textContent='Data unavailable — please use the GitHub source.';return;}
  common();
  const sectionLinks = document.querySelectorAll('nav [data-section]');
  const setSection = id => sectionLinks.forEach(a => {
    const active = a.dataset.section === id;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
  sectionLinks.forEach(a => a.addEventListener('click', () => setSection(a.dataset.section)));
  if (location.hash === '#leaderboard') setSection('leaderboard');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setSection(entry.target.id); });
    }, { rootMargin: '-90px 0px -55% 0px' });
    ['library', 'leaderboard'].forEach(id => observer.observe($(id)));
  }
  // A local snapshot keeps Pages usable offline. New source data replaces it only when changed.
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),6500);
  fetch('https://raw.githubusercontent.com/Harbinzzy/All-in-One-Image-Restoration-Survey/main/data/catalog.json',{signal:controller.signal,cache:'no-cache'})
    .then(r=>{if(!r.ok)throw new Error('catalog unavailable');return r.json();})
    .then(data=>{if(data.schemaVersion===1 && Array.isArray(data.papers) && Array.isArray(data.benchmarks) && data.updated>=catalog.updated && JSON.stringify(data)!==JSON.stringify(catalog)){catalog=data;common();}})
    .catch(()=>{/* Use the checked-in snapshot when offline or GitHub is unavailable. */})
    .finally(()=>clearTimeout(timeout));
})();
