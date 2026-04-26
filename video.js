const preloader = document.getElementById('preloader');
const loaderBar = document.getElementById('loader-bar');
const loadedCountEl = document.getElementById('loaded-count');
const totalCountEl = document.getElementById('total-count');
const canvas = document.getElementById('particles');
const ctx = canvas?.getContext('2d');
const gallery = document.querySelector('.gallery');
const emptyState = document.getElementById('video-empty');
const shardSystem = document.querySelector('.shard-system');
const shards = document.querySelectorAll('.shard');
const pillarGlow = document.querySelector('.pillar-glow');
const lightBeam = document.querySelector('.light-beam');
const scrollHint = document.querySelector('.scroll-hint');
const scrollSpace = document.querySelector('.scroll-space');
const soundToggle = document.getElementById('sound-toggle');

const VIDEO_CONFIG = {
    manifestUrl: '/video-manifest.json',
    localManifest: 'video/manifest.json',
    allowedExtensions: [
        'mp4', 'webm', 'ogv', 'ogg', 'mov', 'm4v',
        '3gp', '3g2', 'mpeg', 'mpg'
    ]
};

let cards = [];
let videos = [];
let loadedVideos = 0;
let totalVideos = 1;
let loaderDone = false;
let targetScroll = window.scrollY || 0;
let currentScroll = targetScroll;
let scrollVelocity = 0;
let particles = [];
let activeIndex = -1;
let lastPreloadCenter = -99;
let frameCount = 0;
let soundEnabled = false;

const isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
const isSmallMobile = window.innerWidth <= 768 || isTouchDevice;
const isLowPower = isSmallMobile || (navigator.hardwareConcurrency || 8) < 4 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const particleColors = ['#ff4d6d', '#ff8da4', '#ffe9ef', '#ffffff'];

function getFileExtension(name = '') {
    return name.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || '';
}

function isSupportedVideoFile(name = '') {
    return VIDEO_CONFIG.allowedExtensions.includes(getFileExtension(name));
}

function getMimeType(name = '') {
    const ext = getFileExtension(name);
    const types = {
        mp4: 'video/mp4',
        m4v: 'video/mp4',
        webm: 'video/webm',
        ogv: 'video/ogg',
        ogg: 'video/ogg',
        mov: 'video/quicktime',
        '3gp': 'video/3gpp',
        '3g2': 'video/3gpp2',
        mpeg: 'video/mpeg',
        mpg: 'video/mpeg'
    };
    return types[ext] || `video/${ext}`;
}

function prettyTitle(fileName = '', index = 0) {
    const clean = decodeURIComponent(fileName)
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!clean) return `${index + 1}. xatirə`;
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

async function getVideoFiles() {
    const urls = [
        '/video-manifest.json',
        './video-manifest.json',
        'video-manifest.json',
        VIDEO_CONFIG.localManifest
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url + '?v=' + Date.now(), { cache: 'no-store' });
            if (!res.ok) continue;

            const data = await res.json();
            const list = Array.isArray(data.videos) ? data.videos : data;

            if (!Array.isArray(list)) continue;

            return list
                .map((item) => {
                    if (typeof item === 'string') {
                        const name = item.split('/').pop() || '';
                        return { name, url: item };
                    }

                    const name = item.name || item.title || item.url?.split('/').pop() || item.path?.split('/').pop() || '';
                    const url = item.url || item.src || item.path || '';
                    return { name, url, title: item.title, type: item.type };
                })
                .filter((item) => item.url && isSupportedVideoFile(item.name || item.url));
        } catch (e) {
            console.warn('Manifest oxunmadı:', url, e);
        }
    }

    return [];
}

function updateLoader(force = false) {
    if (loaderDone && !force) return;
    loadedVideos = Math.min(totalVideos, loadedVideos + 1);
    const progress = Math.min(100, (loadedVideos / totalVideos) * 100);

    if (loaderBar) loaderBar.style.width = `${progress}%`;
    if (loadedCountEl) loadedCountEl.textContent = loadedVideos;

    if (loadedVideos >= Math.min(totalVideos, isSmallMobile ? 2 : totalVideos)) closeLoader(350);
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


function setSoundEnabled(enabled) {
    soundEnabled = enabled;

    videos.forEach((video) => {
        video.muted = !enabled;
        video.defaultMuted = !enabled;
        video.volume = enabled ? 1 : 0;
    });

    if (soundToggle) {
        soundToggle.classList.toggle('active', enabled);
        soundToggle.setAttribute('aria-label', enabled ? 'Videoların səsini bağla' : 'Videoların səsini aç');
        soundToggle.innerHTML = enabled
            ? '<i class="fas fa-volume-high"></i><span>Səs açıq</span>'
            : '<i class="fas fa-volume-xmark"></i><span>Səsi aç</span>';
    }
}

if (soundToggle) {
    soundToggle.addEventListener('click', () => {
        setSoundEnabled(!soundEnabled);
        const current = videos[activeIndex];
        if (current && soundEnabled) {
            current.play().catch(() => {});
        }
    }, { passive: true });
}

function normalizeVideoUrl(url = '') {
    if (/^https?:\/\//i.test(url)) return url;
    return '/' + String(url).replace(/^\/+/, '');
}

function createVideoCard(file, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.title = file.title || prettyTitle(file.name || file.url, index);

    const video = document.createElement('video');
    video.loop = true;
    video.playsInline = true;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.preload = 'none';
    video.dataset.src = normalizeVideoUrl(file.url || file.path);
    video.dataset.type = file.type || getMimeType(file.name || file.url || file.path);

    card.appendChild(video);
    return card;
}

function attachVideoSource(video) {
    if (!video || video.dataset.loaded === '1') return;

    const source = document.createElement('source');
    source.src = video.dataset.src;
    source.type = video.dataset.type;

    video.appendChild(source);
    video.dataset.loaded = '1';
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => updateLoader(), { once: true });
    video.addEventListener('canplay', () => updateLoader(), { once: true });
    video.addEventListener('error', () => updateLoader(), { once: true });

    video.load();
}

function preloadAround(index) {
    if (!videos.length || Math.abs(index - lastPreloadCenter) < 1) return;
    lastPreloadCenter = index;

    const range = isSmallMobile ? 1 : 2;

    videos.forEach((video, i) => {
        if (Math.abs(i - index) <= range) {
            attachVideoSource(video);
        } else if (isSmallMobile && Math.abs(i - index) > 2 && video.dataset.loaded === '1') {
            video.pause();
            video.removeAttribute('src');
            video.innerHTML = '';
            video.dataset.loaded = '0';
            video.preload = 'none';
        }
    });
}

function mountVideos(files) {
    if (!gallery) return;

    if (!files.length) {
        totalVideos = 1;
        if (totalCountEl) totalCountEl.textContent = '0';
        if (emptyState) emptyState.hidden = false;
        closeLoader(500);
        return;
    }

    files.forEach((file, index) => {
        const card = createVideoCard(file, index);
        gallery.appendChild(card);
    });

    cards = Array.from(document.querySelectorAll('.card'));
    videos = Array.from(document.querySelectorAll('.card video'));
    totalVideos = videos.length || 1;

    if (totalCountEl) totalCountEl.textContent = totalVideos;
    if (scrollSpace) scrollSpace.style.height = `${Math.max(340, totalVideos * (isSmallMobile ? 118 : 105))}vh`;

    preloadAround(0);
    closeLoader(isSmallMobile ? 2200 : 4500);
}

function initParticles() {
    if (!canvas || !ctx || isSmallMobile) {
        if (canvas) canvas.style.display = 'none';
        return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const amount = isLowPower ? 35 : 95;
    particles = Array.from({ length: amount }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 0.6 + Math.random() * 1.6,
        speedX: (Math.random() - 0.5) * 0.14,
        speedY: (Math.random() - 0.5) * 0.14,
        opacity: 0.20 + Math.random() * 0.62,
        twinkle: Math.random() * Math.PI * 2,
        color: particleColors[Math.floor(Math.random() * particleColors.length)]
    }));
}

function drawParticles() {
    if (!canvas || !ctx || isSmallMobile) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const time = Date.now() * 0.001;

    particles.forEach((p) => {
        const alpha = p.opacity * (0.58 + Math.sin(time * 1.5 + p.twinkle) * 0.22);
        ctx.globalAlpha = Math.max(0.08, alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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

window.addEventListener('resize', initParticles, { passive: true });
window.addEventListener('scroll', () => {
    targetScroll = window.scrollY || 0;
    if (scrollHint && targetScroll > 60) scrollHint.style.opacity = '0';
}, { passive: true });

function getResponsiveSettings() {
    const width = window.innerWidth;
    if (width <= 420) {
        return { scrollStep: 285, baseRadius: 210, yFactor: 0.52, snapRange: 92, focusRange: 90, scaleFocus: 1.01 };
    }
    if (width <= 768) {
        return { scrollStep: 300, baseRadius: 245, yFactor: 0.52, snapRange: 102, focusRange: 100, scaleFocus: 1.015 };
    }
    return { scrollStep: 250, baseRadius: 600, yFactor: 0.45, snapRange: 150, focusRange: 150, scaleFocus: 1.06 };
}

function handleVideoFocus(video, card, isClosest, index) {
    if (!video) return;

    if (isClosest) {
        if (activeIndex !== index) {
            activeIndex = index;
            preloadAround(index);
        }

        attachVideoSource(video);

        video.muted = !soundEnabled;
        video.defaultMuted = !soundEnabled;
        video.volume = soundEnabled ? 1 : 0;

        if (video.paused) {
            const playPromise = video.play();
            if (playPromise) playPromise.catch(() => {});
        }

        card.classList.add('focused');
    } else {
        if (!video.paused) video.pause();
        card.classList.remove('focused');
    }
}

function animate() {
    frameCount += 1;
    const prevScroll = currentScroll;
    currentScroll += (targetScroll - currentScroll) * (isSmallMobile ? 0.16 : 0.085);
    scrollVelocity = Math.abs(currentScroll - prevScroll);

    const time = Date.now() * 0.001;
    const settings = getResponsiveSettings();
    const estimatedIndex = Math.max(0, Math.min(cards.length - 1, Math.round(currentScroll / settings.scrollStep)));

    if (isSmallMobile && frameCount % 2 === 0 && scrollVelocity > 2.5) {
        requestAnimationFrame(animate);
        return;
    }

    if (shardSystem) shardSystem.style.transform = `rotateY(${currentScroll * (isSmallMobile ? 0.018 : 0.045)}deg)`;

    if (!isSmallMobile) {
        shards.forEach((shard, i) => {
            const offset = Math.sin(time + i) * 18;
            const individualRot = currentScroll * (0.018 + i * 0.008);
            const depth = 56 + i * 10;
            shard.style.transform = `rotateY(${i * 72 + individualRot}deg) translateZ(${depth}px) translateY(${offset}px)`;
        });
    }

    if (pillarGlow && lightBeam) {
        const intensity = isSmallMobile ? 0.24 : 0.28 + (scrollVelocity * 0.026);
        pillarGlow.style.opacity = Math.min(0.58, intensity);
        lightBeam.style.opacity = Math.min(0.44, intensity);
        lightBeam.style.width = `${isSmallMobile ? 8 : 10 + Math.min(24, scrollVelocity * 1.7)}px`;
    }

    cards.forEach((card, index) => {
        const rawRelScroll = currentScroll - (index * settings.scrollStep);
        const video = videos[index];

        const farAway = Math.abs(index - estimatedIndex) > (isSmallMobile ? 3 : 6);
        if (farAway) {
            card.style.opacity = '0';
            if (video && !video.paused) video.pause();
            card.classList.remove('focused');
            return;
        }

        let relScroll = rawRelScroll;
        if (Math.abs(rawRelScroll) < settings.snapRange) {
            relScroll = rawRelScroll * Math.pow(Math.abs(rawRelScroll / settings.snapRange), 0.5);
        }

        const isClosest = Math.abs(rawRelScroll) < settings.focusRange;
        handleVideoFocus(video, card, isClosest, index);

        const floatY = isSmallMobile ? 0 : Math.sin(time + index * 0.8) * 14;
        const floatX = isSmallMobile ? 0 : Math.cos(time + index * 0.8) * 10;
        const floatRot = isSmallMobile ? 0 : Math.sin(time * 0.5 + index) * 1.6;
        const yPos = (-relScroll * settings.yFactor) + floatY;
        const angle = (relScroll * (isSmallMobile ? 0.075 : 0.14)) + (floatX * 0.1);
        const breathing = isSmallMobile ? 0 : Math.sin(time * 0.8 + index) * 15;
        const speedExpand = isSmallMobile ? 0 : Math.min(32, scrollVelocity * 0.48);
        const radius = settings.baseRadius + breathing + speedExpand;
        const scale = isClosest ? settings.scaleFocus : 1;

        card.style.transform = `rotateY(${angle}deg) translateY(${yPos}px) translateZ(${radius}px) rotateX(${-yPos * 0.006 + floatRot}deg) scale(${scale})`;

        const angleRad = (angle % 360) * Math.PI / 180;
        const zDepth = Math.cos(angleRad);
        const blurAmount = isSmallMobile ? 0 : Math.max(0, (1 - zDepth) * 9);
        const fadeRange = isSmallMobile ? 820 : 1500;
        const opacityY = 1 - Math.abs(yPos / fadeRange);
        const opacityZ = Math.pow((zDepth + 1) / 2, 2) * 0.78 + 0.22;
        const finalOpacity = Math.max(0, Math.min(1, opacityY * opacityZ));

        card.style.filter = blurAmount ? `blur(${blurAmount}px)` : 'none';
        card.style.opacity = finalOpacity;
        card.style.zIndex = Math.round((zDepth + 1) * 100);
    });

    requestAnimationFrame(animate);
}

async function start() {
    try {
        initParticles();
        drawParticles();

        const files = await getVideoFiles();
        console.log('Tapılan videolar:', files);

        if (totalCountEl) totalCountEl.textContent = files.length;

        mountVideos(files);
        animate();
    } catch (err) {
        console.error('START ERROR:', err);
        if (totalCountEl) totalCountEl.textContent = 'ERR';
        closeLoader(800);
    }
}

start();
