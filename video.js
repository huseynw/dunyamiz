const cards = Array.from(document.querySelectorAll('.card'));
const videos = Array.from(document.querySelectorAll('video'));
const preloader = document.getElementById('preloader');
const loaderBar = document.getElementById('loader-bar');
const loadedCountEl = document.getElementById('loaded-count');
const canvas = document.getElementById('particles');
const ctx = canvas?.getContext('2d', { alpha: true });
const shardSystem = document.querySelector('.shard-system');
const shards = Array.from(document.querySelectorAll('.shard'));
const pillarGlow = document.querySelector('.pillar-glow');
const lightBeam = document.querySelector('.light-beam');
const scrollHint = document.querySelector('.scroll-hint');
const scrollSpace = document.querySelector('.scroll-space');

let loadedVideos = 0;
const totalVideos = videos.length || 1;
let loaderDone = false;
let targetScroll = window.scrollY || 0;
let currentScroll = targetScroll;
let scrollVelocity = 0;
let particles = [];
let resizeTimer = null;
let lastClosestIndex = -1;
let lastFrame = 0;
let userInteracted = false;

const isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowPower = (navigator.hardwareConcurrency || 8) <= 4 || isReducedMotion;
const enableParticles = !isSmallScreen && !isLowPower;
const particleColors = ['#ff4d6d', '#ff8da4', '#ffe9ef', '#ffffff'];

// ---------- PRELOADER ----------
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

// ---------- CLOUDINARY URL OPTİMİZASİYASI ----------
function mobileOptimizedUrl(url) {
    if (!url || !url.includes('/upload/')) return url;
    // köhnə keyfiyyət bayraqlarını təmizlə
    const cleanUrl = url.replace(/\/upload\/(?:q_auto[^/]*,?w_\d+\/)+/g, '/upload/');
    if (isSmallScreen) {
        return cleanUrl.replace('/upload/', '/upload/q_auto:eco,w_480/');
    }
    return cleanUrl.replace('/upload/', '/upload/q_auto:good,w_720/');
}

// ---------- VİDEOLARI HAZIRLA ----------
function prepareVideos() {
    videos.forEach((video, index) => {
        const src = video.getAttribute('src') || video.dataset.src || '';
        if (src) {
            video.src = mobileOptimizedUrl(src);
        }

        // bütün videoları səssiz və playsinline et
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('disablepictureinpicture', '');

        // ilk 3 videonu mobil / ilk 5-i masaüstü üçün yüklə
        if (index < (isSmallScreen ? 3 : 5)) {
            video.preload = 'auto';
            video.load();
        } else {
            video.preload = 'metadata';
        }

        // hazır olduqda preloader-ə xəbər ver
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
// ehtiyat taymer: maksimum 4 saniyə sonra loader-i bağla
setTimeout(() => closeLoader(0), isSmallScreen ? 3000 : 6000);

// ---------- İLK İSTİFADƏÇİ TOXUNUŞUNDA OYNAT ----------
function handleFirstInteraction() {
    if (userInteracted) return;
    userInteracted = true;
    // bütün videoları oynatmağa cəhd et (səssizdirlər)
    videos.forEach(v => {
        v.muted = true;
        v.play().catch(() => {});
    });
}

['touchstart', 'pointerdown', 'click'].forEach(eventName => {
    window.addEventListener(eventName, handleFirstInteraction, { once: true, passive: true });
});

// ---------- PARTİCLE SİSTEMİ ----------
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

// ---------- SCROLL BOŞLUĞUNU DİNAMİK TƏNZİMLƏ ----------
function updateScrollSpace() {
    if (!scrollSpace) return;
    const settings = getResponsiveSettings();
    // (kart sayı - 1) * addım + bir ekran hündürlük
    const neededHeight = (totalVideos - 1) * settings.scrollStep + window.innerHeight;
    scrollSpace.style.height = `${neededHeight}px`;
}
window.addEventListener('resize', updateScrollSpace, { passive: true });
updateScrollSpace();

// ---------- RESPONSİV PARAMETRLƏR ----------
function getResponsiveSettings() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width <= 420) {
        return { 
            scrollStep: Math.max(200, height * 0.55),
            yFactor: 0.65,
            snapRange: 130,
            focusRange: 140,
            scaleFocus: 1.02 
        };
    }
    if (width <= 768) {
        return { 
            scrollStep: Math.max(220, height * 0.50),
            yFactor: 0.62,
            snapRange: 145,
            focusRange: 160,
            scaleFocus: 1.025 
        };
    }
    return { 
        scrollStep: 250,
        yFactor: 0.45,
        snapRange: 150,
        focusRange: 150,
        scaleFocus: 1.06 
    };
}

// ---------- YAXIN VİDEOLARI İSTİLƏŞDİR ----------
function warmNearbyVideos(index) {
    [index - 1, index + 1].forEach((i) => {
        const v = videos[i];
        if (!v || v.preload === 'auto') return;
        v.preload = 'auto';
        try { v.load(); } catch (_) {}
    });
    // arxa plandakı uzaq videoları boşalt
    videos.forEach((v, i) => {
        if (Math.abs(i - index) > 2 && v.preload === 'auto' && !v.paused) {
            // sadəcə uzaq olanları dayandır, metadata saxla
        }
    });
}

// ---------- VİDEO FOKUS İDARƏSİ ----------
function handleVideoFocus(video, card, isClosest, index) {
    if (!video) return;

    if (isClosest) {
        if (video.preload !== 'auto') {
            video.preload = 'auto';
            try { video.load(); } catch (_) {}
        }
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
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

// ---------- ƏSAS ANİMASİYA DÖVRƏSİ ----------
function animate(now = 0) {
    // mobil üçün ~30fps, masaüstü üçün limitsiz
    const frameInterval = isSmallScreen ? 32 : 0;
    if (isSmallScreen && now - lastFrame < frameInterval) {
        requestAnimationFrame(animate);
        return;
    }
    lastFrame = now;

    const prevScroll = currentScroll;
    const easing = isSmallScreen ? 0.28 : 0.085;
    currentScroll += (targetScroll - currentScroll) * easing;
    scrollVelocity = Math.abs(currentScroll - prevScroll);

    const settings = getResponsiveSettings();

    // === masaüstü 3D effektlər ===
    if (!isSmallScreen && !isReducedMotion) {
        const time = Date.now() * 0.001;
        if (shardSystem) {
            shardSystem.style.transform = `rotateY(${currentScroll * 0.045}deg)`;
        }
        shards.forEach((shard, i) => {
            const offset = Math.sin(time + i) * 18;
            const individualRot = currentScroll * (0.018 + i * 0.008);
            const depth = 56 + i * 10;
            shard.style.transform = `rotateY(${i * 72 + individualRot}deg) translateZ(${depth}px) translateY(${offset}px)`;
        });
        if (pillarGlow && lightBeam) {
            const intensity = 0.28 + (scrollVelocity * 0.026);
            pillarGlow.style.opacity = Math.min(0.74, intensity);
            lightBeam.style.opacity = Math.min(0.58, intensity);
            lightBeam.style.width = `${10 + Math.min(24, scrollVelocity * 1.7)}px`;
        }
    } else if (isSmallScreen && pillarGlow && lightBeam) {
        pillarGlow.style.opacity = Math.min(0.30, 0.18 + (scrollVelocity * 0.006));
        lightBeam.style.opacity = Math.min(0.24, 0.18 + (scrollVelocity * 0.006));
    }

    // === kart animasiyası ===
    cards.forEach((card, index) => {
        const rawRelScroll = currentScroll - (index * settings.scrollStep);
        const video = card.querySelector('video');
        let relScroll = rawRelScroll;

        // yumşaq snap
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

        // mobil üçün sadə 2D transform
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

// ---------- BAŞLAT ----------
initParticles();
drawParticles();
animate();
