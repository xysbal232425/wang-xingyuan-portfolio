const works = [
  {name: "儿科问诊现场", file: "assets/films/film-01"},
  {name: "孩子的脾胃与感冒", file: "assets/films/film-02"},
  {name: "孩子下眼睑的颜色", file: "assets/films/film-03"},
  {name: "秋季饮食科普", file: "assets/films/film-04"},
  {name: "装修工地实拍", file: "assets/films/film-05"},
  {name: "深色地砖怎么选", file: "assets/films/film-06"},
  {name: "水电完工现场", file: "assets/films/film-07"},
  {name: "客厅地砖选色", file: "assets/films/film-08"},
  {name: "城市短片 · 版本一", file: "assets/films/film-09"},
  {name: "城市短片 · 版本二", file: "assets/films/film-10"},
];
const stage = document.querySelector('.p-works .stage');
const gallery = document.querySelector('.gallery');
const orbit = document.createElement('div');
orbit.className = 'orbit';
gallery.append(orbit);
const projects = document.querySelector('.projects');
const dialog = document.querySelector('dialog');
const detail = document.querySelector('.detail');
const counter = document.querySelector('.counter span');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mod = (n, length) => ((n % length) + length) % length;
const pad = n => String(n + 1).padStart(2, '0');
let position = 0, target = 0, selected = 0, step = 300;
let dirty = true, drag = null, dragged = false, lastTime = 0;
const play = document.querySelector('#play');
let playing = !reduced.matches, resumeAfter = 0;
function updatePlay() {
  play.textContent = playing ? '暂停' : '播放';
  play.setAttribute('aria-label', playing ? '暂停自动滚动' : '开始自动滚动');
}
updatePlay();
play.onclick = () => { playing = !playing; resumeAfter = 0; updatePlay(); };
reduced.addEventListener('change', () => { playing = !reduced.matches; updatePlay(); });

function showWork(index) {
  const work = works[index];
  detail.innerHTML = '<h2 id="work-title"></h2><video class="work-player" controls playsinline></video>';
  detail.querySelector('h2').textContent = work.name;
  const player = detail.querySelector('video');
  player.poster = work.file + '.jpg';
  player.src = work.file + '.mp4';
  dialog.setAttribute('aria-labelledby', 'work-title');
  dialog.showModal();
  const full = dialog.querySelector('.film-full');
  full.hidden = !(document.fullscreenEnabled && player.requestFullscreen || player.webkitEnterFullscreen);
  full.onclick = () => {
    if (document.fullscreenEnabled && player.requestFullscreen) player.requestFullscreen().catch(() => {});
    else if (player.webkitEnterFullscreen) player.webkitEnterFullscreen();
  };
  player.play().catch(() => {});
}

dialog.addEventListener('close', () => {
  if (document.fullscreenElement === dialog.querySelector('.screen-player')) {
    document.exitFullscreen().catch(() => {});
  }
  const player = detail.querySelector('video');
  if (player) {
    player.pause();
    player.onerror = null;
    player.removeAttribute('src');
    player.load();
  }
});
function choose(index) {
  target += mod(index - target + works.length / 2, works.length) - works.length / 2;
  resumeAfter = performance.now() + 4000;
}
const cards = works.map(({name, file}, index) => {
  const link = document.createElement('button');
  link.setAttribute('aria-label', '查看' + name);
  link.title = name;
  link.onclick = () => choose(index);
  projects.append(link);
  const base = document.createElement('button');
  base.className = 'card';
  base.setAttribute('aria-label', '打开作品视频：' + name);
  base.style.setProperty('--photo', `url("${file}.jpg")`);
  // Narrow tangent panels let each photograph bend around the globe as it turns.
  const panels = Array.from({length: 12}, (_, n) => {
    const panel = document.createElement('span');
    panel.style.backgroundPositionX = (n / 11 * 100) + '%';
    base.append(panel);
    return panel;
  });
  base.onclick = () => { if (!dragged) showWork(index); };
  orbit.append(base);
  return {base, link, panels};
});
let radius = 0;
const pitch = 16 * Math.PI / 180;
function sizeOrbit() {
  const width = cards[0].base.offsetWidth;
  radius = Math.min(gallery.clientWidth * .39, width * 1.8);
  step = width * 1.10;
  orbit.style.perspective = (radius * 3.2) + 'px';
  const surfaceRadius = width * 1.25;
  for (const {panels} of cards) {
    const panelWidth = width / panels.length;
    panels.forEach((panel, n) => {
      const angle = ((n + .5) * panelWidth - width / 2) / surfaceRadius;
      const x = surfaceRadius * Math.sin(angle), z = surfaceRadius * (Math.cos(angle) - 1);
      panel.style.width = (panelWidth + 1.8) + 'px';
      panel.style.transform = `translateX(-50%) translate3d(${x}px,0,${z}px) rotateY(${angle}rad)`;
    });
  }
}
function paintGallery() {
  for (const [i, {base, link}] of cards.entries()) {
    const angle = (i - position) * 2 * Math.PI / cards.length;
    const depth = Math.cos(angle);
    const x = radius * Math.sin(angle);
    const y = radius * Math.sin(pitch) * depth;
    const z = radius * Math.cos(pitch) * (depth - 1);
    // Ease the yaw near the front so the adjacent works remain legible.
    const yaw = angle - .82 * Math.sin(angle);
    base.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateX(${-pitch}rad) rotateY(${yaw}rad)`;
    base.style.setProperty('--shade', String(.39 + .61 * (depth + 1) / 2));
    base.style.pointerEvents = depth > 0 ? 'auto' : 'none';
    const active = mod(Math.round(position), works.length) === i;
    link.setAttribute('aria-current', String(active));
    base.tabIndex = active ? 0 : -1;
  }
  selected = mod(Math.round(position),works.length);
  counter.textContent = pad(selected) + ' / ' + works.length + ' · ' + works[selected].name;
}
function advance(direction) { choose(Math.round(target) + direction); }
document.querySelector('#prev').onclick = () => advance(-1);
document.querySelector('#next').onclick = () => advance(1);
document.querySelector('.counter').onclick = () => showWork(selected);
document.querySelector('.close').onclick = () => dialog.close();
dialog.onclick = e => { if (e.target === dialog && !detail.contains(e.target)) {
  const b = dialog.getBoundingClientRect();
  if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) dialog.close();
}};
gallery.addEventListener('wheel', e => {
  if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault();
  const delta = e.deltaX;
  target += delta * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? gallery.clientWidth : 1) / step;
  resumeAfter = performance.now() + 4000;
}, { passive:false });
stage.addEventListener('pointerdown', e => {
  dragged = false;
  if (e.button !== 0 || !gallery.contains(e.target)) return;
  drag = {id:e.pointerId, start:e.clientX, origin:target};
});
window.addEventListener('pointermove', e => {
  if (drag && e.pointerId === drag.id && Math.abs(drag.start-e.clientX) > 4) {
    dragged = true;
    target = drag.origin + (drag.start - e.clientX) / step;
    resumeAfter = performance.now() + 4000;
  }
});
window.addEventListener('pointerup', () => { drag = null; });
window.addEventListener('pointercancel', () => { drag = null; });
window.addEventListener('keydown', e => {
  if (dialog.open || !stage.contains(e.target) || !['ArrowRight','ArrowLeft'].includes(e.key)) return;
  e.preventDefault();
  advance(e.key === 'ArrowRight' ? 1 : -1);
});

function resize() { sizeOrbit(); dirty = true; }
window.addEventListener('resize', resize);
resize();
let galleryVisible = false;
let animationFrame = 0;
new IntersectionObserver(([entry]) => {
  galleryVisible = entry.isIntersecting;
  if (galleryVisible && !animationFrame) {
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(tick);
  }
}).observe(gallery);
function tick(now) {
  animationFrame = 0;
  if (!galleryVisible) return;
  const dt = Math.min(64,now-lastTime);
  lastTime = now;
  if (playing && !drag && !dialog.open && !document.hidden && now > resumeAfter) target += dt / 5600;
  if (target !== position) {
    position += (target-position)*(reduced.matches ? 1 : 1-Math.exp(-dt/85));
    if (Math.abs(target-position)<.0003) position = target;
    dirty = true;
  }
  if (dirty) { paintGallery(); dirty = false; }
  animationFrame = requestAnimationFrame(tick);
}
