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

let loadedVideos = 0;
const totalVideos = videos.length || 1;
let loaderDone = false;
let targetScroll = window.scrollY || 0;
let currentScroll = targetScroll;
let scrollVelocity = 0;
let particles = [];
let resizeTimer = null;
let lastClosestIndex = -1;

const isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowPower = (navigator.hardwareConcurrency || 8) <= 4 || isReducedMotion;
const enableParticles = !isSmallScreen && !isLowPower;
const particleColors = ['#ff4d6d', '#ff8da4', '#ffe9ef', '#ffffff'];

function updateLoader() {
    if (loaderDone) return;
    loadedVideos = Math.min(totalVideos, loadedVideos + 1);
    const progress = (loadedVideos / totalVideos) * 100;

    if (loaderBar) loaderBar.style.width = `${progress}%`;
    if (loadedCountEl) loadedCountEl.textContent = loadedVideos;
    if (loadedVideos >= Math.min(totalVideos, isSmallScreen ? 2 : totalVideos)) closeLoader(360);
}

function closeLoader(delay = 0) {
    if (loaderDone) return;
    loaderDone = true;
    setTimeout(() => {
        if (loaderBar) loaderBar.style.width = '100%';
        if (loadedCountEl) loadedCountEl.textContent = totalVideos;
        if (preloader) preloader.classList.add('hidden');
    }, delay);
}

function mobileOptimizedUrl(url) {
    if (!isSmallScreen || !url.includes('/upload/')) return url;
    return url
        .replace('q_auto,f_auto,w_720/', 'q_auto,w_480/')
        .replace('q_auto,w_720/', 'q_auto,w_480/');
}

function prepareVideos() {
    videos.forEach((video, index) => {
        const src = video.currentSrc || video.getAttribute('src') || '';
        if (src) video.src = mobileOptimizedUrl(src);

        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.preload = index <= (isSmallScreen ? 1 : 3) ? 'metadata' : 'none';

        if (video.readyState >= 2) {
            updateLoader();
        } else {
            video.addEventListener('loadedmetadata', updateLoader, { once: true });
            video.addEventListener('loadeddata', updateLoader, { once: true });
            video.addEventListener('error', updateLoader, { once: true });
        }
    });
}

prepareVideos();
setTimeout(() => closeLoader(0), isSmallScreen ? 4200 : 9000);

function initParticles() {
    if (!enableParticles || !canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const amount = 72;
    particles = Array.from({ length: amount }, () => ({
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
    requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initParticles, 180);
}, { passive: true });

window.addEventListener('scroll', () => {
    targetScroll = window.scrollY || 0;
    if (scrollHint && targetScroll > 60) scrollHint.style.opacity = '0';
}, { passive: true });

['touchstart', 'pointerdown', 'click'].forEach((eventName) => {
    window.addEventListener(eventName, () => {
        const focusedVideo = document.querySelector('.card.focused video') || videos[0];
        if (focusedVideo) {
            focusedVideo.muted = true;
            focusedVideo.play().catch(() => {});
        }
    }, { once: true, passive: true });
});

function getResponsiveSettings() {
    const width = window.innerWidth;
    if (width <= 420) {
        return { scrollStep: 220, baseRadius: 195, yFactor: 0.54, snapRange: 120, focusRange: 135, scaleFocus: 1.035 };
    }
    if (width <= 768) {
        return { scrollStep: 230, baseRadius: 230, yFactor: 0.52, snapRange: 132, focusRange: 150, scaleFocus: 1.04 };
    }
    return { scrollStep: 250, baseRadius: 600, yFactor: 0.45, snapRange: 150, focusRange: 150, scaleFocus: 1.06 };
}

function handleVideoFocus(video, card, isClosest, index) {
    if (!video) return;

    if (isClosest) {
        video.preload = 'auto';
        video.muted = true;
        video.defaultMuted = true;
        if (video.paused) video.play().catch(() => {});
        video.volume = 0;
        card.classList.add('focused');

        if (index !== lastClosestIndex) {
            lastClosestIndex = index;
            const nextVideo = videos[index + 1];
            const prevVideo = videos[index - 1];
            if (nextVideo) nextVideo.preload = 'metadata';
            if (prevVideo) prevVideo.preload = 'metadata';
        }
    } else {
        if (!video.paused) video.pause();
        card.classList.remove('focused');
    }
}

function animate() {
    const prevScroll = currentScroll;
    const easing = isSmallScreen ? 0.18 : 0.085;
    currentScroll += (targetScroll - currentScroll) * easing;
    scrollVelocity = Math.abs(currentScroll - prevScroll);

    const time = Date.now() * 0.001;
    const settings = getResponsiveSettings();

    if (!isReducedMotion && shardSystem) {
        shardSystem.style.transform = `rotateY(${currentScroll * (isSmallScreen ? 0.025 : 0.045)}deg)`;
    }

    if (!isSmallScreen) {
        shards.forEach((shard, i) => {
            const offset = Math.sin(time + i) * 18;
            const individualRot = currentScroll * (0.018 + i * 0.008);
            const depth = 56 + i * 10;
            shard.style.transform = `rotateY(${i * 72 + individualRot}deg) translateZ(${depth}px) translateY(${offset}px)`;
        });
    }

    if (pillarGlow && lightBeam) {
        const intensity = isSmallScreen ? 0.24 + (scrollVelocity * 0.01) : 0.28 + (scrollVelocity * 0.026);
        pillarGlow.style.opacity = Math.min(isSmallScreen ? 0.42 : 0.74, intensity);
        lightBeam.style.opacity = Math.min(isSmallScreen ? 0.36 : 0.58, intensity);
        lightBeam.style.width = `${isSmallScreen ? 8 : 10 + Math.min(24, scrollVelocity * 1.7)}px`;
    }

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

        const floatY = isSmallScreen ? 0 : Math.sin(time + index * 0.8) * 14;
        const floatX = isSmallScreen ? 0 : Math.cos(time + index * 0.8) * 10;
        const floatRot = isSmallScreen ? 0 : Math.sin(time * 0.5 + index) * 1.6;
        const yPos = (-relScroll * settings.yFactor) + floatY;
        const angle = isSmallScreen ? relScroll * 0.055 : (relScroll * 0.14) + (floatX * 0.1);
        const breathing = isSmallScreen ? 0 : Math.sin(time * 0.8 + index) * 15;
        const speedExpand = isSmallScreen ? 0 : Math.min(32, scrollVelocity * 0.48);
        const radius = settings.baseRadius + breathing + speedExpand;
        const scale = isClosest ? settings.scaleFocus : 1;

        card.style.transform = `rotateY(${angle}deg) translateY(${yPos}px) translateZ(${radius}px) rotateX(${-yPos * (isSmallScreen ? 0.004 : 0.01) + floatRot}deg) scale(${scale})`;

        const angleRad = (angle % 360) * Math.PI / 180;
        const zDepth = Math.cos(angleRad);
        const blurAmount = isSmallScreen ? 0 : Math.max(0, (1 - zDepth) * 9);
        const fadeRange = isSmallScreen ? 720 : 1500;
        const opacityY = 1 - Math.abs(yPos / fadeRange);
        const opacityZ = Math.pow((zDepth + 1) / 2, 2) * 0.78 + 0.22;
        const finalOpacity = Math.max(0, Math.min(1, opacityY * opacityZ));

        card.style.filter = blurAmount ? `blur(${blurAmount}px)` : 'none';
        card.style.opacity = finalOpacity;
        card.style.zIndex = Math.round((zDepth + 1) * 100);
    });

    requestAnimationFrame(animate);
}

initParticles();
drawParticles();
animate();
