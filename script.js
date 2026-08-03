const typeLabels = {news:'خبر', article:'مقال', report:'تقرير'};
const typeClasses = {news:'type-news', article:'type-article', report:'type-report'};
let activeFilter = 'all';
let activeSort = 'newest';
let activeQuery = '';
const saved = new Set(JSON.parse(localStorage.getItem('dana_editorial_saved') || '[]'));

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function dateFmt(d){
  return new Intl.DateTimeFormat('ar-SA',{day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'));
}
function readTime(a){
  return Math.max(1, Math.ceil([a.title,a.excerpt,...(a.body||[])].join(' ').split(/\s+/).length/190));
}
function sortedArticles(){
  return [...window.ARTICLES].sort((a,b)=>{
    if(activeSort === 'oldest') return new Date(a.date)-new Date(b.date);
    if(activeSort === 'longest') return readTime(b)-readTime(a);
    return new Date(b.date)-new Date(a.date);
  });
}
function filteredArticles(){
  const q = activeQuery.toLowerCase().trim();
  return sortedArticles().filter(a=>{
    const filterOk = activeFilter === 'all' || (activeFilter === 'saved' ? saved.has(a.slug) : a.type === activeFilter);
    const text = [a.title,a.excerpt,a.place,a.author,...(a.tags||[]),...(a.body||[])].join(' ').toLowerCase();
    return filterOk && (!q || text.includes(q));
  });
}
function badge(a){ return `<span class="badge ${typeClasses[a.type]}">${typeLabels[a.type]}</span>`; }
function meta(a){ return `<span>${a.place}</span><span>•</span><span>${dateFmt(a.date)}</span><span>•</span><span>${readTime(a)} دقائق</span>`; }

function renderStats(){
  $('#statTotal').textContent = window.ARTICLES.length;
  $('#statNews').textContent = window.ARTICLES.filter(a=>a.type==='news').length;
  $('#statArticles').textContent = window.ARTICLES.filter(a=>a.type==='article').length;
  $('#statReports').textContent = window.ARTICLES.filter(a=>a.type==='report').length;
}

function renderLead(){
  const a = window.ARTICLES.find(x=>x.featured) || sortedArticles()[0];
  const img = a.image || 'assets/images/media-ministry-visit.jpeg';
  $('#leadStory').innerHTML = `
    <div class="lead-image" style="background-image:url('${img}')"></div>
    <div class="lead-body">
      ${badge(a)}
      <div class="meta">${meta(a)}</div>
      <h2>${a.title}</h2>
      <p>${a.excerpt}</p>
      <button class="read-btn" data-open="${a.slug}">قراءة المادة كاملة ←</button>
    </div>
  `;
}

function storyCard(a, index=0){
  const tags = (a.tags||[]).slice(0,2).map(t=>'#'+t).join(' ');
  return `
    <article class="story-card ${index===0?'wide':''}">
      <div>
        <div class="card-top">
          ${badge(a)}
          <button class="save ${saved.has(a.slug)?'saved':''}" data-save="${a.slug}" aria-label="حفظ">★</button>
        </div>
        <div class="meta">${meta(a)}</div>
        <h3>${a.title}</h3>
        <p>${a.excerpt}</p>
      </div>
      <div class="card-foot">
        <button class="read-btn" data-open="${a.slug}">قراءة</button>
        <span class="tags-line">${tags}</span>
      </div>
    </article>
  `;
}

function renderStories(){
  const list = filteredArticles();
  $('#storyGrid').innerHTML = list.length ? list.map(storyCard).join('') : '<div class="empty">لا توجد نتائج مطابقة.</div>';
}

function renderPicks(){
  const picks = window.ARTICLES.filter(a=>a.pick).slice(0,5);
  $('#pickList').innerHTML = picks.map(a=>`
    <button class="pick-item" data-open="${a.slug}">
      <strong>${a.title}</strong>
      <small>${typeLabels[a.type]} • ${dateFmt(a.date)}</small>
    </button>
  `).join('');
}

function renderTags(){
  const tags = [...new Set(window.ARTICLES.flatMap(a=>a.tags||[]))].slice(0,24);
  $('#tagList').innerHTML = tags.map(t=>`<button data-tag="${t}">${t}</button>`).join('');
}

function openReader(slug){
  const a = window.ARTICLES.find(x=>x.slug===slug);
  if(!a) return;
  $('#readerContent').innerHTML = `
    ${a.image ? `<img class="reader-img" src="${a.image}" alt="">` : ''}
    ${badge(a)}
    <h1>${a.title}</h1>
    <div class="meta">${meta(a)}</div>
    <p class="lead">${a.excerpt}</p>
    <div class="reader-actions">
      <button data-save="${a.slug}">${saved.has(a.slug)?'إزالة من المحفوظة':'حفظ المادة'}</button>
      <button id="copyTitle">نسخ العنوان</button>
      <button id="printArticle">طباعة</button>
    </div>
    <div class="reader-body">${(a.body||[]).map(p=>`<p>${p}</p>`).join('')}</div>
  `;
  $('#reader').classList.add('open');
  $('#reader').setAttribute('aria-hidden','false');
  document.body.classList.add('reader-open');
}

function closeReader(){
  $('#reader').classList.remove('open');
  $('#reader').setAttribute('aria-hidden','true');
  document.body.classList.remove('reader-open');
}

function setFilter(f){
  activeFilter = f;
  $$('#filters button').forEach(b=>b.classList.toggle('active', b.dataset.filter === f));
  renderStories();
}

function toggleSave(slug){
  saved.has(slug) ? saved.delete(slug) : saved.add(slug);
  localStorage.setItem('dana_editorial_saved', JSON.stringify([...saved]));
  renderStories();
}

function init(){
  $('#year').textContent = new Date().getFullYear();
  renderStats();
  renderLead();
  renderStories();
  renderPicks();
  renderTags();

  $('#searchInput').addEventListener('input', e=>{activeQuery=e.target.value; renderStories();});
  $('#sortSelect').addEventListener('change', e=>{activeSort=e.target.value; renderStories();});
  $$('#filters button').forEach(b=>b.addEventListener('click', ()=>setFilter(b.dataset.filter)));
  $$('[data-jump]').forEach(b=>b.addEventListener('click', ()=>{location.hash='latest'; setFilter(b.dataset.jump);}));
  $('#menuToggle').addEventListener('click', ()=>$('#mainNav').classList.toggle('open'));
  $$('#mainNav a').forEach(a=>a.addEventListener('click', ()=>$('#mainNav').classList.remove('open')));

  document.addEventListener('click', e=>{
    const open = e.target.closest('[data-open]');
    if(open) openReader(open.dataset.open);
    const saveBtn = e.target.closest('[data-save]');
    if(saveBtn) toggleSave(saveBtn.dataset.save);
    const tag = e.target.closest('[data-tag]');
    if(tag){ activeQuery = tag.dataset.tag; $('#searchInput').value = activeQuery; location.hash='latest'; renderStories(); }
    if(e.target.id === 'copyTitle') navigator.clipboard.writeText($('#readerContent h1').textContent).then(()=>e.target.textContent='تم النسخ');
    if(e.target.id === 'printArticle') window.print();
  });

  $('#readerClose').addEventListener('click', closeReader);
  $('#reader').addEventListener('click', e=>{ if(e.target.id==='reader') closeReader(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeReader(); });
}
init();
