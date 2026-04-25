const gallery = document.getElementById('videoGallery');
const preloader = document.getElementById('preloader');
const loaderBar = document.getElementById('loader-bar');
const loadedCountEl = document.getElementById('loaded-count');
const totalCountEl = document.getElementById('total-count');
const scrollSpace = document.getElementById('scrollSpace');
const scrollHint = document.querySelector('.scroll-hint');
const canvas = document.getElementById('particles');
const ctx = canvas?.getContext('2d', { alpha: true });

let loadedVideos = 0;
let loaderDone = false;
let targetScroll = 0;
let currentScroll = 0;
let scrollVelocity = 0;
let particles = [];
let lastClosestIndex = -1;
let lastFrame = 0;
let userInteracted = false;
let cards = [];
let videos = [];
let totalVideos = 0;

const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowPower = (navigator.hardwareConcurrency || 8) <= 4 || isReducedMotion;
const enableParticles = !isSmallScreen && !isLowPower;
const particleColors = ['#ff4d6d', '#ff8da4', '#ffe9ef', '#ffffff'];

const countedVideos = new WeakSet();
function markVideoReady(video) {
  if (loaderDone || countedVideos.has(video)) return;
  countedVideos.add(video);
  loadedVideos = Math.min(totalVideos, loadedVideos + 1);
  const required = isSmallScreen ? 2 : Math.min(totalVideos, 4);
  const progress = totalVideos > 0 ? Math.min(100, Math.max((loadedVideos / required) * 100, (loadedVideos / totalVideos) * 100)) : 100;
  if (loaderBar) loaderBar.style.width = `${progress}%`;
  if (loadedCountEl) loadedCountEl.textContent = Math.min(loadedVideos, totalVideos);
  if (loadedVideos >= required || totalVideos === 0) closeLoader(200);
}

function closeLoader(delay = 0) {
  if (loaderDone) return;
  loaderDone = true;
  setTimeout(() => {
    if (loaderBar) loaderBar.style.width = '100%';
    if (loadedCountEl && totalCountEl) loadedCountEl.textContent = totalVideos;
    if (preloader) preloader.classList.add('hidden');
    setTimeout(() => { if (preloader) preloader.style.display = 'none'; }, 900);
  }, delay);
}

function guessMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimes = { mp4: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', ogg: 'video/ogg', mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska' };
  return mimes[ext] || 'video/mp4';
}

function createCards(videoList) {
  gallery.innerHTML = '';
  videoList.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    const title = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    card.setAttribute('data-title', title);
    card.setAttribute('data-index', index);

    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('preload', index < (isSmallScreen ? 3 : 5) ? 'auto' : 'metadata');
    video.style.background = '#000';

    const source = document.createElement('source');
    source.src = file.path;
    source.type = file.type || guessMimeType(file.name);
    video.appendChild(source);
    video.src = file.path; // fallback

    card.appendChild(video);
    gallery.appendChild(card);
  });
}

function prepareVideos() {
  cards = Array.from(document.querySelectorAll('.card'));
  videos = Array.from(document.querySelectorAll('video'));
  totalVideos = videos.length;
  if (totalCountEl) totalCountEl.textContent = totalVideos;

  videos.forEach(video => {
    if (video.readyState >= 1) markVideoReady(video);
    else {
      video.addEventListener('loadedmetadata', () => markVideoReady(video), { once: true });
      video.addEventListener('canplay', () => markVideoReady(video), { once: true });
      video.addEventListener('error', () => markVideoReady(video), { once: true });
    }
  });
}

function handleFirstInteraction() {
  if (userInteracted) return;
  userInteracted = true;
  videos.forEach(v => { v.muted = true; v.play().catch(() => {}); });
}
['touchstart', 'pointerdown', 'click'].forEach(e => window.addEventListener(e, handleFirstInteraction, { once: true, passive: true }));

function updateScrollSpace() {
  if (!scrollSpace) return;
  const s = getResponsiveSettings();
  scrollSpace.style.height = `${Math.max(window.innerHeight, (totalVideos - 1) * s.scrollStep + window.innerHeight)}px`;
}

function getResponsiveSettings() {
  const w = window.innerWidth, h = window.innerHeight;
  if (w <= 420) return { scrollStep: Math.max(200, h * 0.55), yFactor: 0.65, snapRange: 120, focusRange: 140, scaleFocus: 1.02 };
  if (w <= 768) return { scrollStep: Math.max(220, h * 0.50), yFactor: 0.62, snapRange: 140, focusRange: 160, scaleFocus: 1.025 };
  return { scrollStep: 250, yFactor: 0.45, snapRange: 150, focusRange: 150, scaleFocus: 1.06 };
}

function warmNearbyVideos(i) {
  [i - 1, i + 1].forEach(idx => {
    const v = videos[idx];
    if (!v || v.preload === 'auto') return;
    v.preload = 'auto';
    try { v.load(); } catch (_) {}
  });
}

function handleVideoFocus(video, card, isClosest, index) {
  if (!video) return;
  if (isClosest) {
    if (video.preload !== 'auto') { video.preload = 'auto'; try { video.load(); } catch (_) {} }
    video.muted = true;
    if (video.paused && userInteracted) video.play().catch(() => {});
    card.classList.add('focused');
    if (index !== lastClosestIndex) { lastClosestIndex = index; warmNearbyVideos(index); }
  } else {
    if (!video.paused) video.pause();
    card.classList.remove('focused');
  }
}

function animate(now = 0) {
  if (isSmallScreen && now - lastFrame < 32) { requestAnimationFrame(animate); return; }
  lastFrame = now;

  const prevScroll = currentScroll;
  currentScroll += (targetScroll - currentScroll) * (isSmallScreen ? 0.28 : 0.085);
  scrollVelocity = Math.abs(currentScroll - prevScroll);
  const s = getResponsiveSettings();

  cards.forEach((card, i) => {
    const raw = currentScroll - i * s.scrollStep;
    let rel = raw;
    if (Math.abs(raw) < s.snapRange) rel = raw * Math.pow(Math.abs(raw / s.snapRange) || 0.001, 0.5);
    const isClosest = Math.abs(raw) < s.focusRange;
    handleVideoFocus(card.querySelector('video'), card, isClosest, i);

    const yPos = -rel * s.yFactor;
    const dist = Math.min(1, Math.abs(raw) / 500);
    const scale = isClosest ? s.scaleFocus : Math.max(0.7, 0.94 - dist * 0.12);
    const opacity = Math.max(0.15, 1 - dist * 0.9);

    if (isSmallScreen) {
      card.style.transform = `translate3d(-50%, calc(-50% + ${yPos}px), 0) scale(${scale})`;
    } else {
      const t = Date.now() * 0.001;
      const fy = Math.sin(t + i * 0.8) * 14;
      const fx = Math.cos(t + i * 0.8) * 10;
      const fr = Math.sin(t * 0.5 + i) * 1.6;
      card.style.transform = `rotateY(${rel * 0.14 + fx * 0.1}deg) translateY(${yPos + fy}px) translateZ(${600 + Math.sin(t * 0.8 + i) * 15 + Math.min(32, scrollVelocity * 0.48)}px) rotateX(${-yPos * 0.01 + fr}deg) scale(${scale})`;
    }
    card.style.opacity = opacity;
    card.style.zIndex = isClosest ? 5 : Math.max(1, 4 - Math.round(Math.abs(raw) / s.scrollStep));
  });
  requestAnimationFrame(animate);
}

// Particles
function initParticles() {
  if (!enableParticles || !canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  particles = Array.from({ length: 58 }, () => ({
    x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
    size: 0.6 + Math.random() * 1.5,
    speedX: (Math.random() - 0.5) * 0.14, speedY: (Math.random() - 0.5) * 0.14,
    opacity: 0.18 + Math.random() * 0.48,
    twinkle: Math.random() * Math.PI * 2,
    color: particleColors[Math.floor(Math.random() * particleColors.length)]
  }));
}
function drawParticles() {
  if (!enableParticles || !canvas || !ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const vf = 1 + Math.min(2.2, scrollVelocity * 0.025), t = Date.now() * 0.001;
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0.06, p.opacity * (0.62 + Math.sin(t * 1.2 + p.twinkle) * 0.18));
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * vf, 0, Math.PI * 2); ctx.fill();
    p.x += p.speedX; p.y += p.speedY;
    if (p.x < -10) p.x = window.innerWidth + 10; if (p.x > window.innerWidth + 10) p.x = -10;
    if (p.y < -10) p.y = window.innerHeight + 10; if (p.y > window.innerHeight + 10) p.y = -10;
  });
  ctx.globalAlpha = 1;
  if (enableParticles) requestAnimationFrame(drawParticles);
}

window.addEventListener('scroll', () => { targetScroll = window.scrollY || 0; if (scrollHint && targetScroll > 60) scrollHint.style.opacity = '0'; }, { passive: true });
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { updateScrollSpace(); initParticles(); }, 180); }, { passive: true });

async function init() {
  try {
    const res = await fetch('video-list.json');
    if (!res.ok) throw new Error('video-list.json tapılmadı');
    const videoList = await res.json();
    if (!videoList.length) {
      console.warn('Heç bir video tapılmadı, loader bağlanır.');
      closeLoader(0);
      return;
    }
    createCards(videoList);
    prepareVideos();
    updateScrollSpace();
    initParticles();
    drawParticles();
    animate();
  } catch (e) {
    console.error('Yükləmə xətası:', e);
    closeLoader(0);
  }
}
init();
