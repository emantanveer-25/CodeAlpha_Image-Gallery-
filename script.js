/* ---------------- data ---------------- */
const PHOTOS = [
  { id:1015, title:"River Bend",        cat:"nature" },
  { id:1016, title:"Alpine Pass",       cat:"travel" },
  { id:1018, title:"Forest Path",       cat:"nature" },
  { id:1021, title:"Canyon Light",      cat:"nature" },
  { id:1024, title:"Good Boy",          cat:"wildlife" },
  { id:1035, title:"Deep Woods",        cat:"nature" },
  { id:1040, title:"Mountain Mirror",   cat:"travel" },
  { id:1043, title:"Highland Ridge",    cat:"nature" },
  { id:1050, title:"Old Quarter",       cat:"urban" },
  { id:1057, title:"Misty Road",        cat:"travel" },
  { id:1060, title:"Night Timber",      cat:"nature" },
  { id:1067, title:"Coastal Line",      cat:"urban" },
  { id:1074, title:"Trail Companion",   cat:"wildlife" },
  { id:1080, title:"Snow Line",         cat:"nature" },
].map((p,i)=>({
  ...p,
  index:i,
  no:String(i+1).padStart(2,'0'),
  thumb:`https://picsum.photos/id/${p.id}/500/500`,
  full:`https://picsum.photos/id/${p.id}/1400/1000`
}));

const CATS = [
  {key:"all", label:"All"},
  {key:"nature", label:"Nature"},
  {key:"travel", label:"Travel"},
  {key:"urban", label:"Urban"},
  {key:"wildlife", label:"Wildlife"},
];

/* ---------------- render grid ---------------- */
const galleryEl = document.getElementById('gallery');
const filtersEl = document.getElementById('filters');
let activeCat = 'all';

function countFor(key){
  return key==='all' ? PHOTOS.length : PHOTOS.filter(p=>p.cat===key).length;
}

function renderFilters(){
  filtersEl.innerHTML = CATS.map(c=>`
    <button class="filter-btn mono ${c.key===activeCat?'active':''}" data-cat="${c.key}">
      ${c.label} <span class="count">${countFor(c.key)}</span>
    </button>
  `).join('');
  filtersEl.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeCat = btn.dataset.cat;
      renderFilters();
      renderGrid();
    });
  });
}

function renderGrid(){
  galleryEl.innerHTML = PHOTOS.map(p=>{
    const visible = activeCat==='all' || p.cat===activeCat;
    return `
    <div class="frame ${visible?'':'hidden-item'}" data-index="${p.index}" style="animation-delay:${(p.index%10)*0.03}s">
      <img src="${p.thumb}" alt="${p.title}" loading="lazy">
      <div class="frame-info">
        <div class="title">${p.title}</div>
      </div>
    </div>`;
  }).join('');
  galleryEl.querySelectorAll('.frame').forEach(f=>{
    f.addEventListener('click', ()=> openLightbox(parseInt(f.dataset.index)));
  });
}

renderFilters();
renderGrid();

/* ---------------- lightbox ---------------- */
const lightbox = document.getElementById('lightbox');
const lbImage = document.getElementById('lbImage');
const lbIndex = document.getElementById('lbIndex');
const lbTotal = document.getElementById('lbTotal');
const lbTitle = document.getElementById('lbTitle');
const filmstrip = document.getElementById('filmstrip');
const backdropDim = document.getElementById('backdropDim');
lbTotal.textContent = String(PHOTOS.length).padStart(2,'0');

let current = 0;

// per-photo edit state persists while browsing
const editState = {};
function freshState(){
  return { brightness:100, contrast:100, saturation:100, warmth:0, preset:'none', rotation:0, flipH:false, cropSrc:null };
}
PHOTOS.forEach(p=> editState[p.index] = freshState());

function buildFilterString(st){
  let filter = `brightness(${st.brightness}%) contrast(${st.contrast}%) saturate(${st.saturation}%)`;
  if(st.warmth !== 0){
    filter += ` sepia(${Math.min(Math.abs(st.warmth)*1.4,45)}%) hue-rotate(${st.warmth>0? -8: 8}deg)`;
  }
  if(st.preset === 'bw') filter += ' grayscale(100%)';
  if(st.preset === 'sepia') filter += ' sepia(70%) saturate(140%)';
  if(st.preset === 'vibrant') filter += ' saturate(165%) contrast(112%) hue-rotate(4deg)';
  if(st.preset === 'cool') filter += ' hue-rotate(15deg) saturate(120%)';
  if(st.preset === 'warm') filter += ' hue-rotate(-10deg) saturate(115%) brightness(103%)';
  return filter;
}

function renderFilmstrip(){
  filmstrip.innerHTML = PHOTOS.map(p=>`<img src="${p.thumb}" data-index="${p.index}" class="${p.index===current?'active':''}">`).join('');
  filmstrip.querySelectorAll('img').forEach(img=>{
    img.addEventListener('click', ()=> showPhoto(parseInt(img.dataset.index)));
  });
}

function showPhoto(i){
  current = i;
  const p = PHOTOS[i];
  const st = editState[i];
  lbImage.style.opacity = 0;
  setTimeout(()=>{
    lbImage.src = st.cropSrc || p.full;
    lbImage.style.transform = `rotate(${st.rotation}deg) scaleX(${st.flipH?-1:1})`;
    lbImage.style.filter = buildFilterString(st);
    lbImage.style.opacity = 1;
  }, 120);
  lbIndex.textContent = p.no;
  lbTitle.textContent = p.title;
  renderFilmstrip();
  syncEditPanel(st);
  if(cropActive) exitCropMode(false);
}

function openLightbox(i){
  showPhoto(i);
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox(){
  lightbox.classList.remove('open');
  closeEditDrawer();
  document.body.style.overflow = '';
}
document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('prevBtn').addEventListener('click', ()=> showPhoto((current-1+PHOTOS.length)%PHOTOS.length));
document.getElementById('nextBtn').addEventListener('click', ()=> showPhoto((current+1)%PHOTOS.length));

document.addEventListener('keydown', (e)=>{
  if(!lightbox.classList.contains('open')) return;
  if(e.key==='Escape'){ editDrawer.classList.contains('open') ? closeEditDrawer() : closeLightbox(); }
  if(e.key==='ArrowLeft') showPhoto((current-1+PHOTOS.length)%PHOTOS.length);
  if(e.key==='ArrowRight') showPhoto((current+1)%PHOTOS.length);
});

/* ---------------- edit drawer ---------------- */
const editDrawer = document.getElementById('editDrawer');
document.getElementById('editToggle').addEventListener('click', ()=>{
  editDrawer.classList.add('open');
  backdropDim.classList.add('show');
});
function closeEditDrawer(){
  editDrawer.classList.remove('open');
  backdropDim.classList.remove('show');
  if(cropActive) exitCropMode(false);
}
document.getElementById('editClose').addEventListener('click', closeEditDrawer);
backdropDim.addEventListener('click', closeEditDrawer);

const sliders = ['brightness','contrast','saturation','warmth'];
sliders.forEach(key=>{
  const el = document.getElementById(key);
  el.addEventListener('input', ()=>{
    const st = editState[current];
    st[key] = parseInt(el.value);
    document.getElementById('val'+key[0].toUpperCase()+key.slice(1)).textContent = key==='warmth' ? `${el.value}°` : `${el.value}%`;
    applyLiveFilter();
  });
});

document.getElementById('presetGrid').addEventListener('click', (e)=>{
  const btn = e.target.closest('.preset-btn');
  if(!btn) return;
  editState[current].preset = btn.dataset.preset;
  document.querySelectorAll('.preset-btn').forEach(b=>b.classList.toggle('active', b===btn));
  applyLiveFilter();
});

function applyLiveFilter(){
  lbImage.style.filter = buildFilterString(editState[current]);
}

document.getElementById('rotateTool').addEventListener('click', ()=>{
  const st = editState[current];
  st.rotation = (st.rotation + 90) % 360;
  lbImage.style.transform = `rotate(${st.rotation}deg) scaleX(${st.flipH?-1:1})`;
});
document.getElementById('flipTool').addEventListener('click', (e)=>{
  const st = editState[current];
  st.flipH = !st.flipH;
  e.currentTarget.classList.toggle('active', st.flipH);
  lbImage.style.transform = `rotate(${st.rotation}deg) scaleX(${st.flipH?-1:1})`;
});

function syncEditPanel(st){
  document.getElementById('brightness').value = st.brightness;
  document.getElementById('contrast').value = st.contrast;
  document.getElementById('saturation').value = st.saturation;
  document.getElementById('warmth').value = st.warmth;
  document.getElementById('valBrightness').textContent = st.brightness+'%';
  document.getElementById('valContrast').textContent = st.contrast+'%';
  document.getElementById('valSaturation').textContent = st.saturation+'%';
  document.getElementById('valWarmth').textContent = st.warmth+'°';
  document.querySelectorAll('.preset-btn').forEach(b=> b.classList.toggle('active', b.dataset.preset===st.preset));
  document.getElementById('flipTool').classList.toggle('active', st.flipH);
}

document.getElementById('resetEdits').addEventListener('click', ()=>{
  editState[current] = freshState();
  showPhoto(current);
  showToast('Edits reset');
});

/* ---------------- crop tool ---------------- */
const cropOverlay = document.getElementById('cropOverlay');
const cropTool = document.getElementById('cropTool');
const cropConfirmRow = document.getElementById('cropConfirmRow');
let cropActive = false;
let cropRect = {x:12,y:12,w:76,h:76}; // percentages relative to displayed image

function enterCropMode(){
  cropActive = true;
  cropTool.classList.add('active');
  cropConfirmRow.style.display = 'flex';
  cropOverlay.classList.add('active');
  positionCropOverlay();
}
function exitCropMode(apply){
  cropActive = false;
  cropTool.classList.remove('active');
  cropConfirmRow.style.display = 'none';
  cropOverlay.classList.remove('active');
}
cropTool.addEventListener('click', ()=> cropActive ? exitCropMode(false) : enterCropMode());
document.getElementById('cropCancel').addEventListener('click', ()=> exitCropMode(false));

function positionCropOverlay(){
  const rect = lbImage.getBoundingClientRect();
  const stageRect = document.getElementById('lbStage').getBoundingClientRect();
  cropOverlay.style.left = (rect.left - stageRect.left + rect.width*cropRect.x/100) + 'px';
  cropOverlay.style.top = (rect.top - stageRect.top + rect.height*cropRect.y/100) + 'px';
  cropOverlay.style.width = (rect.width*cropRect.w/100) + 'px';
  cropOverlay.style.height = (rect.height*cropRect.h/100) + 'px';
}

// dragging / resizing the crop box
let dragMode = null, dragStart = null;
cropOverlay.addEventListener('mousedown', (e)=>{
  const handle = e.target.closest('.crop-handle');
  dragMode = handle ? handle.className.split(' ')[1] : 'move';
  dragStart = { x:e.clientX, y:e.clientY, rect:{...cropRect} };
  e.preventDefault();
});
document.addEventListener('mousemove', (e)=>{
  if(!dragMode || !cropActive) return;
  const imgRect = lbImage.getBoundingClientRect();
  const dxPct = (e.clientX - dragStart.x) / imgRect.width * 100;
  const dyPct = (e.clientY - dragStart.y) / imgRect.height * 100;
  let r = {...dragStart.rect};
  if(dragMode==='move'){
    r.x = clamp(r.x + dxPct, 0, 100-r.w);
    r.y = clamp(r.y + dyPct, 0, 100-r.h);
  } else {
    if(dragMode.includes('n')){ r.y = clamp(r.y+dyPct,0,r.y+r.h-8); r.h = dragStart.rect.h - (r.y-dragStart.rect.y); }
    if(dragMode.includes('s')){ r.h = clamp(dragStart.rect.h + dyPct, 8, 100-r.y); }
    if(dragMode.includes('w')){ r.x = clamp(r.x+dxPct,0,r.x+r.w-8); r.w = dragStart.rect.w - (r.x-dragStart.rect.x); }
    if(dragMode.includes('e')){ r.w = clamp(dragStart.rect.w + dxPct, 8, 100-r.x); }
  }
  cropRect = r;
  positionCropOverlay();
});
document.addEventListener('mouseup', ()=> dragMode=null);
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
window.addEventListener('resize', ()=> cropActive && positionCropOverlay());

document.getElementById('cropApply').addEventListener('click', ()=>{
  const st = editState[current];
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = ()=>{
    const sx = img.naturalWidth * cropRect.x/100;
    const sy = img.naturalHeight * cropRect.y/100;
    const sw = img.naturalWidth * cropRect.w/100;
    const sh = img.naturalHeight * cropRect.h/100;
    const c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    c.getContext('2d').drawImage(img, sx,sy,sw,sh, 0,0,sw,sh);
    st.cropSrc = c.toDataURL('image/jpeg', 0.95);
    lbImage.src = st.cropSrc;
    exitCropMode(true);
    cropRect = {x:8,y:8,w:84,h:84};
    showToast('Crop applied');
  };
  img.src = st.cropSrc || PHOTOS[current].full;
});

/* ---------------- save / download ---------------- */
function renderFinalCanvas(callback){
  const p = PHOTOS[current];
  const st = editState[current];
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = ()=>{
    const sw = img.naturalWidth, sh = img.naturalHeight;
    const swapped = st.rotation % 180 !== 0;
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = swapped ? sh : sw;
    rotCanvas.height = swapped ? sw : sh;
    const rctx = rotCanvas.getContext('2d');
    rctx.translate(rotCanvas.width/2, rotCanvas.height/2);
    rctx.rotate(st.rotation * Math.PI/180);
    if(st.flipH) rctx.scale(-1,1);
    rctx.drawImage(img, -sw/2, -sh/2);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = rotCanvas.width;
    finalCanvas.height = rotCanvas.height;
    const fctx = finalCanvas.getContext('2d');
    fctx.filter = buildFilterString(st);
    fctx.drawImage(rotCanvas,0,0);
    callback(finalCanvas, p);
  };
  img.onerror = ()=> showToast("Couldn't load full image — try again");
  img.src = st.cropSrc || p.full;
}

document.getElementById('saveEdits').addEventListener('click', ()=>{
  renderFinalCanvas((canvas, p)=>{
    const link = document.createElement('a');
    link.download = `${p.title.toLowerCase().replace(/\s+/g,'-')}-edited.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
    showToast('Photo saved to downloads');
  });
});

document.getElementById('lbDownload').addEventListener('click', ()=>{
  renderFinalCanvas((canvas, p)=>{
    const link = document.createElement('a');
    link.download = `${p.title.toLowerCase().replace(/\s+/g,'-')}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
    showToast('Photo saved to downloads');
  });
});

/* ---------------- toast ---------------- */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2200);
}

/* swipe support on mobile */
let touchStartX = 0;
document.getElementById('lbStage').addEventListener('touchstart', (e)=> touchStartX = e.touches[0].clientX);
document.getElementById('lbStage').addEventListener('touchend', (e)=>{
  const dx = e.changedTouches[0].clientX - touchStartX;
  if(Math.abs(dx) > 50 && !cropActive){
    dx > 0 ? showPhoto((current-1+PHOTOS.length)%PHOTOS.length) : showPhoto((current+1)%PHOTOS.length);
  }
});