/****************************************************
  VİDEO LİSTASİ – BURANI ÖZ FAYLLARINIZLA DƏYİŞİN
  Hər bir obyekt:
    title  : kartın üzərində görünəcək ad
    sources: massiv – fərqli formatlar üçün (brauzer dəstəklədiyini seçəcək)
             [{ src: 'video/xxx.mp4', type: 'video/mp4' }, ...]
    poster : (istəyə bağlı) video yüklənənədək görünəcək şəkil
****************************************************/
const videoList = [
  { title: 'İlk tanışlıq',      sources: [{ src: 'video/tanisliq.mp4', type: 'video/mp4' }] },
  { title: 'Dəniz kənarında',   sources: [{ src: 'video/deniz.mp4', type: 'video/mp4' }, { src: 'video/deniz.webm', type: 'video/webm' }] },
  { title: 'Doğum günü sürprizi', sources: [{ src: 'video/adgunu.mp4', type: 'video/mp4' }] },
  { title: 'Payız gəzintisi',   sources: [{ src: 'video/payiz.mp4', type: 'video/mp4' }] },
  { title: 'Birlikdə yemək',    sources: [{ src: 'video/yemek.webm', type: 'video/webm' }, { src: 'video/yemek.mp4', type: 'video/mp4' }] },
  { title: 'Konsert anı',       sources: [{ src: 'video/konsert.mp4', type: 'video/mp4' }] },
  { title: 'Gəzinti xatirəsi',  sources: [{ src: 'video/gezinti.mp4', type: 'video/mp4' }] },
  { title: 'Axşam söhbəti',     sources: [{ src: 'video/axsam.mp4', type: 'video/mp4' }] }
  // İstədiyiniz qədər əlavə edə bilərsiniz. Yuxarıdakı nümunələri öz fayllarınıza uyğun dəyişin.
];

/****************************************************
  SİSTEM KODU – AŞAĞIDAKILARA TOXUNMAYIN
****************************************************/
const totalVideos = videoList.length;
let loadedVideos = 0;
let loaderDone = false;
let targetScroll = window.scrollY || 0;
let currentScroll = targetScroll;
let scrollVelocity = 0;
let particles = [];
let lastClosestIndex = -1;
let lastFrame = 0;
let userInteracted = false;

const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowPower = (navigator.hardwareConcurrency || 8) <= 4 || isReducedMotion;
const enableParticles = !isSmallScreen && !isLowPower;
const particleColors = ['#ff4d6d', '#ff8da4', '#ffe9ef', '#ffffff'];

// DOM elementləri
const gallery = document.getElementById('videoGallery');
const preloader = document.getElementById('preloader');
const loaderBar = document.getElementById('loader-bar');
const loadedCountEl = document.getElementById('loaded-count');
const totalCountEl = document.getElementById('total-count');
const scrollSpace = document.getElementById('scrollSpace');
const scrollHint = document.querySelector('.scroll-hint');
const canvas = document.getElementById('particles');
const ctx = canvas?.getContext('2d', { alpha: true });

// Kartları dinamik yaradaq
gallery.innerHTML = ''; // təmizlə
videoList.forEach((videoData, index) => {
  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('data-title', videoData.title);
  card.setAttribute('data-index', index);

  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('disablepictureinpicture', '');
  video.setAttribute('preload', index < (isSmallScreen ? 3 : 5) ? 'auto' : 'metadata');
  if (videoData.poster) {
    video.setAttribute('poster', videoData.poster);
  }

  // <source> elementlərini əlavə et
  videoData.sources.forEach(srcObj => {
    const source = document.createElement('source');
    source.src = srcObj.src;
    source.type = srcObj.type;
    video.appendChild(source);
  });

  card.appendChild(video);
  gallery.appendChild(card);
});

// Qalan elementlər
const cards = Array.from(document.querySelectorAll('.card'));
const videos = Array.from(document.querySelectorAll('video'));

// Preloader funksiyaları
const countedVideos = new WeakSet();
function markVideoReady(video) {
  if (loaderDone || countedVideos.has(video)) return;
  countedVideos.add(video);
  loadedVideos = Math.min(totalVideos, loadedVideos + 1);
  const required = isSmallScreen ? 2 : Math.min(totalVideos, 4);
  const progress = Math.min(100, Math.max((loadedVideos / required) * 100, (loadedVideos / totalVideos) * 100));

  if (loaderBar) loaderBar.style.width = `${progress}%`;
  if (loadedCountEl) loadedCountEl.textContent = Math.min(loadedVideos, totalVideos);
  if (loadedVideos >= required) closeLoader(200);
}

function closeLoader(delay = 0) {
  if (loaderDone) return;
  loaderDone = true;
  setTimeout(() => {
    if (loaderBar) loaderBar.style.width = '100%';
    if (loadedCountEl) loadedCountEl.textContent = totalVideos;
    if (preloader) preloader.classList.add('hidden');
    setTimeout(() => {
      if (preloader) preloader.style.display = 'none';
    }, 900);
  }, delay);
}

// Videoları hazırla
function prepareVideos() {
  if (totalCountEl) totalCountEl.textContent = totalVideos;

  videos.forEach((video) => {
    // Hazır olma hadisələrini dinlə
    if (video.readyState >= 1) {
      markVideoReady(video);
    } else {
      video.addEventListener('loadedmetadata', () => markVideoReady(video), { once: true });
      video.addEventListener('canplay', () => markVideoReady(video), { once: true });
      video.addEventListener('error', () => markVideoReady(video), { once: true });
    }
  });
}

prepareVideos();
setTimeout(() => closeLoader(0), isSmallScreen ? 3000 : 6000);

// İlk istifadəçi toxunuşunda oynat
function handleFirstInteraction() {
  if (userInteracted) return;
  userInteracted = true;
  videos.forEach(v => {
    v.muted = true;
    v.play().catch(() => {});
  });
}
['touchstart', 'pointerdown', 'click'].forEach(eventName => {
  window.addEventListener(eventName, handleFirstInteraction, { once: true, passive: true });
});

// Scroll boşluğu
function updateScrollSpace() {
  if (!scrollSpace) return;
  const settings = getResponsiveSettings();
  const neededHeight = (totalVideos - 1) * settings.scrollStep + window.innerHeight;
  scrollSpace.style.height = `${neededHeight}px`;
}
window.addEventListener('resize', updateScrollSpace, { passive: true });
updateScrollSpace();

// Responsiv parametrlər
function getResponsiveSettings() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 420) return { scrollStep: Math.max(200, h * 0.55), yFactor: 0.65, snapRange: 120, focusRange: 140, scaleFocus: 1.02 };
  if (w <= 768) return { scrollStep: Math.max(220, h * 0.50), yFactor: 0.62, snapRange: 140, focusRange: 160, scaleFocus: 1.025 };
  return { scrollStep: 250, yFactor: 0.45, snapRange: 150, focusRange: 150, scaleFocus: 1.06 };
}

// Yaxın videoları əvvəlcədən yüklə
function warmNearbyVideos(index) {
  [index - 1, index + 1].forEach((i) => {
    const v = videos[i];
    if (!v || v.preload === 'auto') return;
    v.preload = 'auto';
    try { v.load(); } catch (_) {}
  });
}

// Video fokus
function handleVideoFocus(video, card, isClosest, index) {
  if (!video) return;
  if (isClosest) {
    if (video.preload !== 'auto') {
      video.preload = 'auto';
      try { video.load(); } catch (_) {}
    }
    video.muted = true;
    if (video.paused && userInteracted) {
      video.play().catch(() => {});
    }
    card.classList.add('focused');
    if (index !== lastClosestIndex) {
      lastClosestIndex = index;
      warmNearbyVideos(index);
    }
  } else {
    if (!video.paused) video.pause();
    card.classList.remove('focused');
  }
}

// Əsas animasiya
function animate(now = 0) {
  const frameInterval = isSmallScreen ? 32 : 0;
  if (isSmallScreen && now - lastFrame < frameInterval) {
    requestAnimationFrame(animate);
    return;
  }
  lastFrame = now;

  const prevScroll = currentScroll;
  currentScroll += (targetScroll - currentScroll) * (isSmallScreen ? 0.28 : 0.085);
  scrollVelocity = Math.abs(currentScroll - prevScroll);
  const settings = getResponsiveSettings();

  // Masaüstü 3D effektlər (sadələşdirilmiş, pillar-container CSS-də qalıb)
  // Partikullar əlavə olaraq drawParticles() ilə idarə olunur

  cards.forEach((card, index) => {
    const rawRelScroll = currentScroll - (index * settings.scrollStep);
    const video = card.querySelector('video');
    let relScroll = rawRelScroll;

    if (Math.abs(rawRelScroll) < settings.snapRange) {
      const safeRatio = Math.max(0.001, Math.abs(rawRelScroll / settings.snapRange));
      relScroll = rawRelScroll * Math.pow(safeRatio, 0.5);
    }

    const isClosest = Math.abs(rawRelScroll) < settings.focusRange;
    handleVideoFocus(video, card, isClosest, index);

    const yPos = -relScroll * settings.yFactor;
    const distance = Math.min(1, Math.abs(rawRelScroll) / 500);
    const scale = isClosest ? settings.scaleFocus : Math.max(0.7, 0.94 - distance * 0.12);
    const opacity = Math.max(0.15, 1 - distance * 0.9);

    if (isSmallScreen) {
      card.style.transform = `translate3d(-50%, calc(-50% + ${yPos}px), 0) scale(${scale})`;
    } else {
      const time = Date.now() * 0.001;
      const floatY = Math.sin(time + index * 0.8) * 14;
      const floatX = Math.cos(time + index * 0.8) * 10;
      const floatRot = Math.sin(time * 0.5 + index) * 1.6;
      const angle = (relScroll * 0.14) + (floatX * 0.1);
      const breathing = Math.sin(time * 0.8 + index) * 15;
      const speedExpand = Math.min(32, scrollVelocity * 0.48);
      const radius = 600 + breathing + speedExpand;
      card.style.transform = `rotateY(${angle}deg) translateY(${yPos + floatY}px) translateZ(${radius}px) rotateX(${-yPos * 0.01 + floatRot}deg) scale(${scale})`;
    }

    card.style.opacity = opacity;
    card.style.zIndex = isClosest ? 5 : Math.max(1, 4 - Math.round(Math.abs(rawRelScroll) / settings.scrollStep));
  });

  requestAnimationFrame(animate);
}

// Partikul sistemi (köhnəsi ilə eyni)
function initParticles() {
  if (!enableParticles || !canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  particles = Array.from({ length: 58 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: 0.6 + Math.random() * 1.5,
    speedX: (Math.random() - 0.5) * 0.14,
    speedY: (Math.random() - 0.5) * 0.14,
    opacity: 0.18 + Math.random() * 0.48,
    twinkle: Math.random() * Math.PI * 2,
    color: particleColors[Math.floor(Math.random() * particleColors.length)]
  }));
}

function drawParticles() {
  if (!enableParticles || !canvas || !ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const velocityFactor = 1 + Math.min(2.2, scrollVelocity * 0.025);
  const time = Date.now() * 0.001;

  particles.forEach((p) => {
    const alpha = p.opacity * (0.62 + Math.sin(time * 1.2 + p.twinkle) * 0.18);
    ctx.globalAlpha = Math.max(0.06, alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * velocityFactor, 0, Math.PI * 2);
    ctx.fill();

    p.x += p.speedX;
    p.y += p.speedY;

    if (p.x < -10) p.x = window.innerWidth + 10;
    if (p.x > window.innerWidth + 10) p.x = -10;
    if (p.y < -10) p.y = window.innerHeight + 10;
    if (p.y > window.innerHeight + 10) p.y = -10;
  });

  ctx.globalAlpha = 1;
  if (enableParticles) requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initParticles, 180);
}, { passive: true });

window.addEventListener('scroll', () => {
  targetScroll = window.scrollY || 0;
  if (scrollHint && targetScroll > 60) scrollHint.style.opacity = '0';
}, { passive: true });

initParticles();
drawParticles();
animate();
