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

/*
    Netlify + GitHub token video sistemi:
    - GH_TOKEN frontend-ə çıxmır, yalnız Netlify Function içində istifadə olunur.
    - Videolar repo içində video/ qovluğundan avtomatik tapılır.
    - Fayl adları random ola bilər.
*/
const VIDEO_CONFIG = {
    apiEndpoint: '/.netlify/functions/github-videos',
    localManifest: 'video/manifest.json',
    allowedExtensions: [
        'mp4', 'webm', 'ogv', 'ogg', 'mov', 'm4v', 'avi', 'mkv',
        '3gp', '3g2', 'mpeg', 'mpg', 'ts', 'mts', 'm2ts'
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
let audioUnlocked = false;

const isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
const isLowPower = (navigator.hardwareConcurrency || 8) < 4 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        avi: 'video/x-msvideo',
        mkv: 'video/x-matroska',
        '3gp': 'video/3gpp',
        '3g2': 'video/3gpp2',
        mpeg: 'video/mpeg',
        mpg: 'video/mpeg',
        ts: 'video/mp2t',
        mts: 'video/mp2t',
        m2ts: 'video/mp2t'
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

async function fetchVideosFromNetlifyFunction() {
    const res = await fetch(VIDEO_CONFIG.apiEndpoint, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.error || `Netlify video API xətası: ${res.status}`);
    }

    const list = Array.isArray(data) ? data : data.videos;
    if (!Array.isArray(list)) return [];

    return list
        .map((item) => {
            if (typeof item === 'string') {
                const name = item.split('/').pop() || '';
                return { name, url: item };
            }

            const name = item.name || item.title || item.url?.split('/').pop() || '';
            const url = item.url || item.src || '';
            return { name, url, title: item.title };
        })
        .filter((item) => item.url && isSupportedVideoFile(item.name || item.url));
}

async function fetchLocalManifest() {
    const res = await fetch(VIDEO_CONFIG.localManifest, { cache: 'no-store' });
    if (!res.ok) throw new Error('manifest tapılmadı');

    const data = await res.json();
    const list = Array.isArray(data) ? data : data.videos;

    if (!Array.isArray(list)) return [];

    return list
        .map((item) => {
            if (typeof item === 'string') {
                const name = item.split('/').pop();
                return { name, url: item.startsWith('http') ? item : `video/${item}` };
            }

            const name = item.name || item.title || item.url?.split('/').pop() || '';
            const url = item.url || item.src || '';
            return { name, url, title: item.title };
        })
        .filter((item) => item.url && isSupportedVideoFile(item.name || item.url));
}

async function getVideoFiles() {
    try {
        const functionFiles = await fetchVideosFromNetlifyFunction();
        if (functionFiles.length) return functionFiles;
    } catch (err) {
        console.warn(err);
    }

    try {
        const manifestFiles = await fetchLocalManifest();
        if (manifestFiles.length) return manifestFiles;
    } catch (err) {
        console.warn(err);
    }

    return [];
}

function updateLoader() {
    if (loaderDone) return;
    loadedVideos = Math.min(totalVideos, loadedVideos + 1);
    const progress = (loadedVideos / totalVideos) * 100;

    if (loaderBar) loaderBar.style.width = `${progress}%`;
    if (loadedCountEl) loadedCountEl.textContent = loadedVideos;

    if (loadedVideos >= totalVideos) closeLoader(520);
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

function createVideoCard(file, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.title = file.title || prettyTitle(file.name || file.url, index);

    const video = document.createElement('video');
    video.loop = true;
    video.playsInline = true;
    video.preload = isTouchDevice ? 'metadata' : 'auto';
    video.muted = true;
    video.volume = 0;

    const source = document.createElement('source');
    source.src = file.url;
    source.type = getMimeType(file.name || file.url);

    video.appendChild(source);
    card.appendChild(video);

    video.addEventListener('loadedmetadata', updateLoader, { once: true });
    video.addEventListener('loadeddata', updateLoader, { once: true });
    video.addEventListener('canplaythrough', updateLoader, { once: true });
    video.addEventListener('error', updateLoader, { once: true });

    return card;
}

function unlockAudioOnGesture() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    videos.forEach((video) => {
        video.muted = false;
    });
}

function mountVideos(files) {
    if (!gallery) return;

    if (!files.length) {
        totalVideos = 1;
        if (totalCountEl) totalCountEl.textContent = '0';
        if (emptyState) emptyState.hidden = false;
        closeLoader(700);
        return;
    }

    files.forEach((file, index) => {
        const card = createVideoCard(file, index);
        gallery.appendChild(card);
    });

    cards = Array.from(document.querySelectorAll('.card'));
    videos = Array.from(document.querySelectorAll('video'));
    totalVideos = videos.length || 1;

    if (totalCountEl) totalCountEl.textContent = totalVideos;
    if (scrollSpace) {
        scrollSpace.style.height = `${Math.max(360, totalVideos * 105)}vh`;
    }

    document.addEventListener('pointerdown', unlockAudioOnGesture, { once: true, passive: true });
    document.addEventListener('touchstart', unlockAudioOnGesture, { once: true, passive: true });

    setTimeout(() => closeLoader(0), 12000);
}

function initParticles() {
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const amount = isLowPower ? 55 : isTouchDevice ? 80 : 135;
    particles = Array.from({ length: amount }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 0.6 + Math.random() * 1.8,
        speedX: (Math.random() - 0.5) * 0.18,
        speedY: (Math.random() - 0.5) * 0.18,
        opacity: 0.22 + Math.random() * 0.72,
        twinkle: Math.random() * Math.PI * 2,
        color: particleColors[Math.floor(Math.random() * particleColors.length)]
    }));
}

function drawParticles() {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const velocityFactor = 1 + Math.min(5, scrollVelocity * 0.04);
    const time = Date.now() * 0.001;

    particles.forEach((p) => {
        const alpha = p.opacity * (0.58 + Math.sin(time * 1.5 + p.twinkle) * 0.22);
        ctx.globalAlpha = Math.max(0.08, alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * velocityFactor, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (scrollVelocity > 2) {
            p.y += (p.y - window.innerHeight / 2) * 0.006 * Math.min(scrollVelocity, 12);
        }

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
        return { scrollStep: 230, baseRadius: 330, yFactor: 0.44, snapRange: 135, focusRange: 135, scaleFocus: 1.055 };
    }
    if (width <= 768) {
        return { scrollStep: 240, baseRadius: 390, yFactor: 0.44, snapRange: 145, focusRange: 145, scaleFocus: 1.055 };
    }
    return { scrollStep: 250, baseRadius: 600, yFactor: 0.45, snapRange: 150, focusRange: 150, scaleFocus: 1.06 };
}

function handleVideoFocus(video, card, isClosest) {
    if (!video) return;

    if (isClosest) {
        const playPromise = video.play();
        if (playPromise) playPromise.catch(() => {});
        video.volume += (1 - video.volume) * 0.08;
        card.classList.add('focused');
    } else {
        video.volume += (0 - video.volume) * 0.10;
        if (video.volume < 0.04) {
            video.volume = 0;
            if (!video.paused) video.pause();
        }
        card.classList.remove('focused');
    }
}

function animate() {
    const prevScroll = currentScroll;
    currentScroll += (targetScroll - currentScroll) * 0.085;
    scrollVelocity = Math.abs(currentScroll - prevScroll);

    const time = Date.now() * 0.001;
    const settings = getResponsiveSettings();

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

    cards.forEach((card, index) => {
        const rawRelScroll = currentScroll - (index * settings.scrollStep);
        const video = card.querySelector('video');

        let relScroll = rawRelScroll;
        if (Math.abs(rawRelScroll) < settings.snapRange) {
            relScroll = rawRelScroll * Math.pow(Math.abs(rawRelScroll / settings.snapRange), 0.5);
        }

        const isClosest = Math.abs(rawRelScroll) < settings.focusRange;
        handleVideoFocus(video, card, isClosest);

        const floatY = Math.sin(time + index * 0.8) * (isTouchDevice ? 9 : 14);
        const floatX = Math.cos(time + index * 0.8) * (isTouchDevice ? 6 : 10);
        const floatRot = Math.sin(time * 0.5 + index) * 1.6;
        const yPos = (-relScroll * settings.yFactor) + floatY;
        const angle = (relScroll * 0.14) + (floatX * 0.1);
        const breathing = Math.sin(time * 0.8 + index) * (isTouchDevice ? 9 : 15);
        const speedExpand = Math.min(32, scrollVelocity * 0.48);
        const radius = settings.baseRadius + breathing + speedExpand;
        const scale = isClosest ? settings.scaleFocus : 1;

        card.style.transform = `
            rotateY(${angle}deg)
            translateY(${yPos}px)
            translateZ(${radius}px)
            rotateX(${-yPos * 0.01 + floatRot}deg)
            scale(${scale})
        `;

        const angleRad = (angle % 360) * Math.PI / 180;
        const zDepth = Math.cos(angleRad);
        const blurAmount = Math.max(0, (1 - zDepth) * (isTouchDevice ? 7 : 9));
        const fadeRange = isTouchDevice ? 1050 : 1500;
        const opacityY = 1 - Math.abs(yPos / fadeRange);
        const opacityZ = Math.pow((zDepth + 1) / 2, 2) * 0.78 + 0.22;
        const finalOpacity = Math.max(0, Math.min(1, opacityY * opacityZ));

        card.style.filter = `blur(${blurAmount}px)`;
        card.style.opacity = finalOpacity;
        card.style.zIndex = Math.round((zDepth + 1) * 100);
    });

    requestAnimationFrame(animate);
}

async function start() {
    initParticles();
    drawParticles();

    const files = await getVideoFiles();
    mountVideos(files);

    animate();
}

start();
