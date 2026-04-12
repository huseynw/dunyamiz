const targetDate = new Date("2026-04-04T13:00:00"); 
let currentWaveColor = "rgb(255,255,255)";
const config = {
    githubUsername: "huseynw",
    repoName: "dunyamiz",              
    firstMeetingDate: "2025-10-22T00:00:00",
    startDate: "2025-08-03T00:00:00", 
    meetingCount: 99,    
    musicTitle: "Gözlərin dəydi gözümə"
};

// Security - Disable right-click and dev tools
//document.addEventListener('contextmenu', event => event.preventDefault());
//document.onkeydown = function(e) {
  //  if (e.keyCode == 123 || 
    //    (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || 
      //  (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
        //return false;
    //}
//};

//setInterval(function() {
  //  checkDevTools();
//}, 1000);

//function checkDevTools() {
  //  const start = new Date();
    //debugger; 
    //const end = new Date();
    //if (end - start > 100) {
      //  document.body.innerHTML = "<h1 style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Giriş Qadağandır! 🚱</h1>";
    //}
//}

//setInterval(() => {
  //  console.clear();
//}, 100);

// Audio Elements
const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('playPauseBtn');
const muteBtn = document.getElementById('muteBtn');
const seekBar = document.getElementById('seekBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

window.allImages = []; 
let currentImgIdx = 0;
let isPlaying = false;

const isMobileDevice = window.matchMedia('(max-width: 768px)').matches;

function setAppHeight() {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}

window.addEventListener('resize', setAppHeight, { passive: true });
window.addEventListener('orientationchange', setAppHeight, { passive: true });
window.addEventListener('pageshow', setAppHeight, { passive: true });

function setupMobileAudioResilience() {
    const dom = typeof getMusicDom === 'function' ? getMusicDom() : null;
    const audioEl = dom?.audio || document.getElementById('yt-audio') || document.getElementById('audio');

    if (!audioEl) return;

    audioEl.setAttribute('playsinline', 'true');
    audioEl.setAttribute('webkit-playsinline', 'true');
    audioEl.setAttribute('preload', 'metadata');

    const resumeAudioStack = async () => {
        try {
            if (audioContext && audioContext.state === 'suspended') {
                await audioContext.resume();
            }
        } catch {}

        try {
            if (window.ytWaveAudioContext && window.ytWaveAudioContext.state === 'suspended') {
                await window.ytWaveAudioContext.resume();
            }
        } catch {}

        try {
            if (!audioEl.paused && typeof audioEl.play === 'function') {
                await audioEl.play();
            }
        } catch {}
    };

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) resumeAudioStack();
    });

    window.addEventListener('focus', resumeAudioStack, { passive: true });
    window.addEventListener('pageshow', resumeAudioStack, { passive: true });

    ['touchstart', 'click'].forEach((evt) => {
        document.addEventListener(evt, resumeAudioStack, { passive: true });
    });
}

function setupAudioNetworkFixes() {
    const audioEl = document.getElementById('yt-audio') || document.getElementById('audio');
    if (!audioEl) return;

    audioEl.addEventListener('stalled', async () => {
        try {
            if (!audioEl.paused) await audioEl.play();
        } catch {}
    });

    audioEl.addEventListener('waiting', () => {
        document.body.classList.add('audio-buffering');
    });

    const clearBuffering = () => {
        document.body.classList.remove('audio-buffering');
    };

    audioEl.addEventListener('playing', clearBuffering);
    audioEl.addEventListener('canplay', clearBuffering);
    audioEl.addEventListener('seeked', clearBuffering);
}

function initLightboxSwipe() {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.dataset.swipeBound === '1') return;

    lb.dataset.swipeBound = '1';
    let startX = 0;
    let endX = 0;

    lb.addEventListener('touchstart', (e) => {
        startX = e.changedTouches[0].clientX;
    }, { passive: true });

    lb.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        const diff = endX - startX;

        if (Math.abs(diff) < 45) return;

        if (diff < 0) {
            document.getElementById('next-btn')?.click();
        } else {
            document.getElementById('prev-btn')?.click();
        }
    }, { passive: true });
}

// ========== SPA NAVIGATION ==========
function initSPANavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.spa-page');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');
            const targetElement = document.getElementById(`page-${targetPage}`);
            
            if (targetElement.classList.contains('active')) return;

            // Aktiv pəncərəni tap
            const currentPage = document.querySelector('.spa-page.active');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Çıxış animasiyası (GSAP)
            if (currentPage) {
                gsap.to(currentPage, {
                    y: -30, opacity: 0, duration: 0.4, ease: "power2.in",
                    onComplete: () => {
                        currentPage.classList.remove('active');
                        currentPage.style.display = 'none';
                        
                        // Giriş animasiyası (GSAP)
                        targetElement.style.display = 'block';
                        targetElement.classList.add('active');
                        gsap.fromTo(targetElement, 
                            { y: 40, opacity: 0 }, 
                            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
                        );
                        
                        // Elementlərin fərqli sürətlə axması (Stagger)
                        gsap.fromTo(targetElement.querySelectorAll('.page-title, .animate-item, .time-together-card, .detailed-time-card'),
                            { y: 30, opacity: 0 },
                            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.2)", delay: 0.1 }
                        );
                    }
                });
            }
        });
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initSPANavigation();
    setupMediaSession();
    setAppHeight();
    setupMobileAudioResilience();
    setupAudioNetworkFixes();
    initLightboxSwipe();
    const meetEl = document.getElementById('meet-count');
    if(meetEl) meetEl.innerText = config.meetingCount;
    
    updateCounter();
    setInterval(updateCounter, 1000);
});

// ========== PASSWORD SYSTEM ==========
const enterBtn = document.getElementById('enter-btn');
const passPanel = document.getElementById('password-panel');
const verifyBtn = document.getElementById('verify-btn');
const passInput = document.getElementById('pass-input');
const errorMsg = document.getElementById('error-msg');

enterBtn.addEventListener('click', () => {
    enterBtn.style.display = 'none'; 
    passPanel.style.display = 'flex'; 
    passInput.focus();
});

verifyBtn.addEventListener('click', async () => {
    const passVal = passInput.value;
    const originalBtnText = verifyBtn.innerHTML;
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    verifyBtn.disabled = true;

    try {
        const res = await fetch('/.netlify/functions/admin-proxy', {
            method: 'POST',
            body: JSON.stringify({ type: 'verify_site', password: passVal })
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('welcome-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('welcome-screen').style.display = 'none';
                const mainContent = document.getElementById('main-content');
                mainContent.classList.remove('hidden');
                
                // Animasiyalar
                const startVal = new Date(config.startDate).getTime();
                const diffVal = new Date().getTime() - startVal;
                const dVal = Math.floor(diffVal / (1000 * 60 * 60 * 24));
                const hVal = Math.floor(diffVal / (1000 * 60 * 60));
                const mVal = Math.floor(diffVal / (1000 * 60));

                window.isAnimating = true;
                animateValue('meet-count', 0, config.meetingCount, 2500);
                animateValue('total-days', 0, dVal, 2500);
                animateValue('detail-days', 0, dVal, 2500);
                animateValue('total-hours-love', 0, hVal, 2500);
                animateValue('total-minutes-love', 0, mVal, 2500);
                setTimeout(() => { window.isAnimating = false; }, 2600);

                setTimeout(() => mainContent.classList.add('animate-start'), 100);
            }, 800);

            fetchImages();
            if (audio) {
                initVisualizer(audio);
                audio.play().then(() => {
                    isPlaying = true;
                    if (document.getElementById('track-art')) document.getElementById('track-art').classList.add('playing');
                    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    updateLegacyMediaSession();
                }).catch(() => console.log('Musiqi gözləmədə...'));
            }
        } else {
            throw new Error();
        }
    } catch (err) {
        errorMsg.style.display = 'block';
        passInput.value = "";
        passInput.animate([
            { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }
        ], { duration: 200 });
        verifyBtn.innerHTML = originalBtnText;
        verifyBtn.disabled = false;
    }
});

passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifyBtn.click();
});
// ========== TIME TOGETHER COUNTER (ASCENDING) ==========
// 1. Rəqəmləri artıran köməkçi funksiya
function updateCounter() {
    const start = new Date(config.startDate).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    if (isNaN(diff)) return;
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const totalMinutes = Math.floor(diff / (1000 * 60));

    if (!window.isAnimating) {
        if(document.getElementById('total-days')) document.getElementById('total-days').innerText = d;
        if(document.getElementById('detail-days')) document.getElementById('detail-days').innerText = d;
        if(document.getElementById('total-hours-love')) document.getElementById('total-hours-love').innerText = totalHours.toLocaleString('tr-TR');
        if(document.getElementById('total-minutes-love')) document.getElementById('total-minutes-love').innerText = totalMinutes.toLocaleString('tr-TR');
        if(document.getElementById('meet-count')) document.getElementById('meet-count').innerText = config.meetingCount;
    }

    if(document.getElementById('hours')) document.getElementById('hours').innerText = h < 10 ? '0' + h : h;
    if(document.getElementById('minutes')) document.getElementById('minutes').innerText = m < 10 ? '0' + m : m;
    if(document.getElementById('seconds')) document.getElementById('seconds').innerText = s < 10 ? '0' + s : s;
    if(document.getElementById('detail-hours')) document.getElementById('detail-hours').innerText = h;
    if(document.getElementById('detail-minutes')) document.getElementById('detail-minutes').innerText = m;
    if(document.getElementById('detail-seconds')) document.getElementById('detail-seconds').innerText = s;
}
function parseImageDate(img) {
    if (img.git_date) {
        const d = new Date(img.git_date);
        if (!isNaN(d)) return d;
    }

    const fileName = (img.name || '').replace(/\.[^.]+$/, '');

    // 2026-04-06_18-30
    let match = fileName.match(/(\d{4})-(\d{2})-(\d{2})[_ ](\d{2})-(\d{2})/);
    if (match) {
        const [, y, mo, da, h, mi] = match;
        return new Date(`${y}-${mo}-${da}T${h}:${mi}:00`);
    }

    // 2026-04-06 18:30
    match = fileName.match(/(\d{4})-(\d{2})-(\d{2})[_ ](\d{2}):(\d{2})/);
    if (match) {
        const [, y, mo, da, h, mi] = match;
        return new Date(`${y}-${mo}-${da}T${h}:${mi}:00`);
    }

    // 2026-04-06
    match = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [, y, mo, da] = match;
        return new Date(`${y}-${mo}-${da}T00:00:00`);
    }

    return null;
}
function formatAzDate(input) {
    const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d)) return "Tarix bilinmir";
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
async function fetchImages() {
    const stack = document.getElementById('gallery-stack');
    if (!stack) return;

    stack.className = 'gallery-timeline';
    stack.innerHTML = '<p class="timeline-loading"><i class="fas fa-spinner fa-spin"></i> Xatirələr yüklənir...</p>';

    const url = `https://api.github.com/repos/${config.githubUsername}/${config.repoName}/contents/gallery`;

    try {
        const response = await fetch("/.netlify/functions/github-content?path=gallery");
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 403) {
                stack.innerHTML = '<p class="timeline-empty">GitHub API limiti dolub. Bir az sonra yenidən yoxla.</p>';
            } else {
                stack.innerHTML = `<p class="timeline-empty">${data?.message || 'Qalereya yüklənmədi.'}</p>`;
            }
            return;
        }

        if (!Array.isArray(data)) {
            stack.innerHTML = '<p class="timeline-empty">Qalereya məlumatı düzgün gəlmədi.</p>';
            return;
        }

        window.allImages = data
            .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
            .sort((a, b) => new Date(a.git_date || 0) - new Date(b.git_date || 0));


        if (window.allImages.length === 0) {
            stack.innerHTML = '<p class="timeline-empty">Hələ ki, şəkil yoxdur.</p>';
            return;
        }

        let html = '';

        window.allImages.forEach((img, idx) => {
            const side = idx % 2 === 0 ? 'left' : 'right';
            const dateText = formatAzDate(img.git_date);

            html += `
                <article class="timeline-item ${side}">
                    <div class="photo-frame gallery-item" data-index="${idx}">
                        <img src="${img.download_url}" loading="lazy" alt="Bizim Xatirəmiz">
                        <div class="hover-heart"><i class="fas fa-heart"></i></div>
                    </div>
                    <div class="timeline-date">
                        <i class="far fa-clock"></i> ${dateText}
                    </div>
                </article>
            `;
        });

        stack.innerHTML = html;

        document.querySelectorAll('.gallery-item').forEach(item => {
            item.onclick = function() {
                const index = parseInt(this.getAttribute('data-index'));
                window.openLightbox(index);
            };
        });

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        document.querySelectorAll('.timeline-item').forEach(item => {
            observer.observe(item);
        });

        syncAdminOverview();

    } catch (e) {
        console.error("Fetch xətası:", e);
        stack.innerHTML = '<p class="timeline-empty">Sistem xətası!</p>';
    }
}
window.openLightbox = function(index) {
    currentImgIdx = index;
    const lb = document.getElementById('lightbox');
    if (lb) {
        lb.style.display = "flex";
        lb.classList.add('active');
        updateLightboxContent();
    }
};

// 5. Şəkli, Tarixi və Yükləmə linkini yeniləmək
async function updateLightboxContent() {
    const images = window.allImages;
    const imgData = images[currentImgIdx];
    const lbImg = document.getElementById('lightbox-img');
    const dateEl = document.getElementById('image-date');

    if (!imgData || !lbImg) return;

    lbImg.src = imgData.download_url;

    if (dateEl) {
        const dateText = imgData.git_date
            ? formatAzDate(imgData.git_date)
            : "Tarix bilinmir";

        dateEl.innerHTML = `<i class="far fa-clock"></i> ${dateText}`;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const lb = document.getElementById('lightbox');
    
    // Bağlamaq
    document.getElementById('close-lb-btn')?.addEventListener('click', () => {
        lb.style.display = "none";
        lb.classList.remove('active');
    });

    // Geri
    document.getElementById('prev-btn')?.addEventListener('click', () => {
        if (window.allImages.length === 0) return;
        currentImgIdx = (currentImgIdx - 1 + window.allImages.length) % window.allImages.length;
        updateLightboxContent();
    });

    // İrəli
    document.getElementById('next-btn')?.addEventListener('click', () => {
        if (window.allImages.length === 0) return;
        currentImgIdx = (currentImgIdx + 1) % window.allImages.length;
        updateLightboxContent();
    });

    // Yükləmək
    document.getElementById('download-btn')?.addEventListener('click', async () => {
        const imgData = window.allImages[currentImgIdx];
        if(!imgData) return;
        try {
            const response = await fetch(imgData.download_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = imgData.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            window.open(imgData.download_url, '_blank');
        }
    });
});
document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.style.display === "none") return;

    if (e.key === "Escape") {
        lb.style.display = "none";
        lb.classList.remove('active');
    }
    if (e.key === "ArrowRight") document.getElementById('next-btn').click();
    if (e.key === "ArrowLeft") document.getElementById('prev-btn').click();
});
// 6. Şəkli brauzerdə açmaq əvəzinə birbaşa cihaza yükləyən funksiya
async function downloadImageFile(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename || 'bizim_xatira.jpg';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
    } catch (error) {
        window.open(url, '_blank');
    }
}

function getDynamicPath() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const minLen = 8;
    const maxLen = 60;
    const length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
    
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ========== HEART PARTICLES ==========
function createHeart() {
    if (document.querySelectorAll('.heart-particle').length > (isMobileDevice ? 10 : 18)) return;

    const heart = document.createElement('div');
    heart.classList.add('heart-particle');
    heart.innerHTML = '❤︎⁠'; 
    heart.style.color = 'pink';
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.fontSize = Math.random() * 20 + 10 + "px";
    heart.style.animationDuration = Math.random() * 2 + 3 + "s";

    document.body.appendChild(heart);

    setTimeout(() => {
        heart.remove();
    }, 4000);
}

setInterval(createHeart, isMobileDevice ? 1400 : 500);

// ========== LETTERS ==========
const letters = {
    "miss": {
        title: "Darıxanda...",
        text: "Bilirəm, məsafələr bəzən adamın ürəyini sıxır. Amma unutma ki, biz eyni səmaya baxırıq. Darıxmaq əslində sevgimizin nə qədər güclü olduğunu göstərir. İndi gözlərini yum, dərindən nəfəs al və əlini ürəyinin üzərinə qoy. Hiss etdin? Mən tam ordayam, səninləyəm. Səni çox sevirəm."
    },
    "sad": {
        title: "Kefin olmayanda...",
        text: "Bilirəm, bəzən hər şey üst-üstə gəlir, insan sadəcə susmaq və dünyadan qaçmaq istəyir. Əgər hazırda özünü elə hiss edirsənsə, bil ki, mən həmişə burdayam. Hətta bəzən bu kədərin səbəbi mən olsam belə, bil ki, bu heç vaxt istəyərək olmayıb. Səni incitdiyim anlar üçün məni bağışla... Mən bəlkə hər problemi həll edə bilmərəm, amma səninlə birlikdə hər şeyə qarşı dura bilərəm. İstədiyin an mənə söykənə bilərsən. Sənin hər halın mənim üçün dəyərlidir, təkcə güləndə yox. Sakitləş, dincəl və unutma: nə olursa olsun, mən həmişə sənin tərəfindəyəm."
    },
    "happy": {
        title: "Xoşbəxt olanda...",
        text: "Bax bunu eşitmək istəyirəm. Sənin xoşbəxtliyin mənim üçün hər şeydən önəmlidir. Bu gününün dadını çıxar, gül, əylən. Sən xoşbəxt olanda mən də dünyanın ən xoşbəxt adamı oluram. Həmişə belə parılda, günəşim!"
    },
    "us": {
        title: "Bizim üçün...",
        text: "Nə yaxşı ki, həyat yollarımız kəsişdirib. Sən mənim təkcə sevgilim yox, həm də ən yaxşı dostumsan. Səninlə keçən hər saniyə mənim üçün hədiyyədir. Birlikdə hələ neçə gözəl günlərimiz olacaq. Yaxşı ki varsan, Cəmaləm."
    }
};

window.openLetter = function(type) {
    const modal = document.getElementById('letter-modal');
    document.getElementById('letter-title').innerText = letters[type].title;
    document.getElementById('letter-text').innerText = letters[type].text;
    modal.style.display = 'flex';
};

window.closeLetter = function() { 
    document.getElementById('letter-modal').style.display = 'none'; 
};

// ========== LOVE PHRASES ==========
const lovePhrases = [
    "Səni sevirəm", "I Love You", "Seni Seviyorum", "Je t'aime", "Ich liebe dich", "Te amo", "Ti amo", "Eu te amo", 
    "Ik hou van jou", "Jag älskar dig", "Jeg elsker dig", "Kocham Cię", "Szeretlek", "Miluji tě", "Te iubesc", 
    "Volim te", "Σ' αγαπώ", "Я тебя люблю", "Men seni sevaman", "S'agapo", "Ana behibek", "Mahal kita", 
    "Wo ai ni", "Aishiteru", "Saranghae", "Ami tomake bhalobashi", "Naku penda", "Mən səni sevirəm"
];

let phraseIndex = 0;

function fastChangeLoveText() {
    const textElement = document.getElementById('changing-love');
    if (!textElement) return;
    phraseIndex = (phraseIndex + 1) % lovePhrases.length;
    textElement.innerText = lovePhrases[phraseIndex];
}

setInterval(fastChangeLoveText, 200);

// ========== AUDIO VISUALIZER ==========
let audioContext, analyser, source, canvas, ctx, visualizerFrame;

function resizeVisualizerCanvas() {
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const displayWidth = Math.max(1, Math.floor(canvas.clientWidth || canvas.offsetWidth || 0));
    const displayHeight = Math.max(1, Math.floor(canvas.clientHeight || canvas.offsetHeight || 0));

    if (!displayWidth || !displayHeight) return;

    canvas.width = Math.floor(displayWidth * ratio);
    canvas.height = Math.floor(displayHeight * ratio);

    if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
    }
}

function stopVisualizer() {
    if (visualizerFrame) {
        cancelAnimationFrame(visualizerFrame);
        visualizerFrame = null;
    }
}

function initVisualizer(audioElement) {
    if (!audioElement) return;

    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (!analyser) {
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.82;
        }

        if (!source) {
            source = audioContext.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            source.connect(audioContext.destination);
        }

        canvas = document.getElementById('visualizer');
        if (!canvas) return;

        ctx = canvas.getContext('2d');
        if (!ctx) return;

        resizeVisualizerCanvas();
        window.addEventListener('resize', resizeVisualizerCanvas, { passive: true });

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const maxBars = isMobileDevice ? Math.min(14, bufferLength) : Math.min(22, bufferLength);

        const draw = () => {
            visualizerFrame = requestAnimationFrame(draw);
            if (document.hidden || !canvas || !ctx) return;

            const width = canvas.clientWidth || canvas.offsetWidth || 0;
            const height = canvas.clientHeight || canvas.offsetHeight || 0;
            if (!width || !height) return;

            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, width, height);

            const centerY = height / 2;
            const activeBars = Math.min(22, bufferLength);
            const barWidth = Math.max(4, Math.floor(width / (activeBars * 1.9)));
            const gap = Math.max(2, Math.floor(barWidth * 0.55));
            const totalWidth = activeBars * barWidth + (activeBars - 1) * gap;
            let x = Math.max(0, (width - totalWidth) / 2);

            for (let i = 0; i < activeBars; i++) {
                const mirroredIndex = Math.floor((i / activeBars) * bufferLength);
                const value = dataArray[mirroredIndex] / 255;
                const barHeight = Math.max(6, value * height * 0.82);
                const y = centerY - barHeight / 2;
                const radius = Math.min(barWidth / 2, 8);

                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(x, y, barWidth, barHeight, radius);
                } else {
                    ctx.rect(x, y, barWidth, barHeight);
                }

                const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
                gradient.addColorStop(0, currentWaveColor || 'rgba(255,255,255,0.95)');
                gradient.addColorStop(1, 'rgba(255,255,255,0.18)');
                ctx.fillStyle = gradient;
                ctx.shadowBlur = 18;
                ctx.shadowColor = currentWaveColor || 'rgba(255,255,255,0.8)';
                ctx.fill();

                x += barWidth + gap;
            }

            ctx.shadowBlur = 0;
        };

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }

        if (!visualizerFrame) {
            draw();
        }
    } catch (e) {
        console.error('Vizualizator xətası:', e);
    }
}

// ========== MEETING TIMER ==========
function updateMeetingTimer() {
    const now = new Date();
    const diff = targetDate - now;
    
    const aylar = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
    const gun = targetDate.getDate();
    const ayAdı = aylar[targetDate.getMonth()];
    const saat = String(targetDate.getHours()).padStart(2, '0');
    const deqiqe = String(targetDate.getMinutes()).padStart(2, '0');
    const formatliTarix = `${gun} ${ayAdı} saat ${saat}:${deqiqe}`;
    
    const dateEl = document.getElementById('next-meeting-date');
    if (dateEl) dateEl.innerText = "Görüş vaxtı: " + formatliTarix;

    if (diff <= 0) {
        const h3El = document.querySelector('.meeting-timer h3');
        if (h3El) h3El.innerText = "Görüş vaxtı gəldi!";
        return;
    }
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    if(document.getElementById('meet-days')) document.getElementById('meet-days').innerText = d < 10 ? "0" + d : d;
    if(document.getElementById('meet-hours')) document.getElementById('meet-hours').innerText = h < 10 ? "0" + h : h;
    if(document.getElementById('meet-minutes')) document.getElementById('meet-minutes').innerText = m < 10 ? "0" + m : m;
    if(document.getElementById('meet-seconds')) document.getElementById('meet-seconds').innerText = s < 10 ? "0" + s : s;
}

setInterval(updateMeetingTimer, 1000);
updateMeetingTimer();

// ========== MEDIA SESSION ==========


let shouldResumeMainAudio = false;
let shouldResumeYTPlayer = false;

document.addEventListener('visibilitychange', async () => {
    const dom = typeof getMusicDom === 'function' ? getMusicDom() : null;
    const legacyAudio = audio;
    const ytAudio = dom?.audio || null;

    if (document.hidden) {
        shouldResumeMainAudio = !!(legacyAudio && !legacyAudio.paused);
        shouldResumeYTPlayer = !!(ytAudio && !ytAudio.paused);
        return;
    }

    if (shouldResumeYTPlayer && ytAudio?.paused) {
        ytAudio.play().catch(() => {});
    } else if (shouldResumeMainAudio && legacyAudio?.paused) {
        legacyAudio.play().catch(() => {});
    }

    shouldResumeMainAudio = false;
    shouldResumeYTPlayer = false;
});

// ========== DYNAMIC CONTENT ==========
function updateDynamicContent() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = "";
    
    if (hour >= 5 && hour < 12) {
        greeting = "Sabahın xeyir";
    } else if (hour >= 12 && hour < 18) {
        greeting = "Günortan xeyir";
    } else if (hour >= 18 && hour < 23) {
        greeting = "Axşamın xeyir";
    } else {
        greeting = "Gecən xeyirə qalsın";
    }
    
    const greetingElement = document.getElementById("dynamic-greeting");
    if (greetingElement) {
        greetingElement.innerHTML = greeting + ", Cəmaləm <span style='color: #ff4d6d;'>🤍</span>";
    }
    
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${String(hour).padStart(2, '0')}:${minute}:${second}`;
    
    const aylar = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
    const gunler = ["Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə"];
    const gunAdi = gunler[now.getDay()];
    const ayGun = now.getDate();
    const ayAdi = aylar[now.getMonth()];
    const il = now.getFullYear();
    
    const clockElement = document.getElementById("live-clock");
    if (clockElement) {
        clockElement.innerText = `${timeString} | ${gunAdi}, ${ayGun} ${ayAdi} ${il}`;
    }
}

setInterval(updateDynamicContent, 1000);
updateDynamicContent();

// ========== AUDIO CONTROLS ==========
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

if (audio) {
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.preload = 'metadata';

    audio.addEventListener('loadedmetadata', () => {
        if (seekBar) seekBar.max = Math.floor(audio.duration || 0);
        if (durationEl) durationEl.textContent = formatTime(audio.duration || 0);
        if (typeof updateLegacyMediaSession === 'function') updateLegacyMediaSession();
    });

    audio.addEventListener('timeupdate', () => {
        if (seekBar) seekBar.value = Math.floor(audio.currentTime || 0);
        if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime || 0);
        if (seekBar && audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            seekBar.style.setProperty('--progress', progress + '%');
        }
        if (typeof updateLegacyMediaSession === 'function') updateLegacyMediaSession();
    });

    audio.addEventListener('play', async () => {
        const dom = typeof getMusicDom === 'function' ? getMusicDom() : null;
        if (dom?.audio && !dom.audio.paused) {
            dom.audio.pause();
        }
        isPlaying = true;
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        document.getElementById('track-art')?.classList.add('playing');
        if (audioContext?.state === 'suspended') {
            try { await audioContext.resume(); } catch (_) {}
        }
        initVisualizer(audio);
        if (typeof updateLegacyMediaSession === 'function') updateLegacyMediaSession();
    });

    audio.addEventListener('pause', () => {
        isPlaying = false;
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        document.getElementById('track-art')?.classList.remove('playing');
        if (typeof updateLegacyMediaSession === 'function') updateLegacyMediaSession();
    });

    seekBar?.addEventListener('input', () => {
        audio.currentTime = Number(seekBar.value || 0);
    });

    playPauseBtn?.addEventListener('click', async () => {
        if (audio.paused) {
            try {
                await audio.play();
            } catch (err) {
                console.error('Legacy audio play error:', err);
            }
        } else {
            audio.pause();
        }
    });

    muteBtn?.addEventListener('click', () => {
        audio.muted = !audio.muted;
        muteBtn.innerHTML = audio.muted
            ? '<i class="fas fa-volume-mute"></i>'
            : '<i class="fas fa-volume-up"></i>';
    });
}

// ========== LOVE POWER (HEART HOLD) ==========
let holdTimer;
let power = 0;
const heartBtn = document.getElementById('hold-heart');
const percentText = document.getElementById('power-percent');
const loveBg = document.createElement('div');
loveBg.className = 'love-active-bg';
document.body.appendChild(loveBg);

function startHolding() {
    holdTimer = setInterval(() => {
        if (power < 100) {
            power += 2;
            updatePower();
        }
    }, 50);
}

function stopHolding() {
    clearInterval(holdTimer);
    const drainTimer = setInterval(() => {
        if (power > 0) {
            power -= 4;
            updatePower();
        } else {
            clearInterval(drainTimer);
        }
    }, 30);
}

function updatePower() {
    percentText.innerText = power + "%";
    heartBtn.style.transform = `scale(${1 + (power / 100)})`;
    loveBg.style.opacity = power / 100;
    
    if (power >= 100) {
        heartBtn.style.filter = `drop-shadow(0 0 30px #ff4d6d)`;
        percentText.innerText = "Səni Çox Sevirəm 🤍";
    } else {
        heartBtn.style.filter = `drop-shadow(0 0 ${power/3}px #ff4d6d)`;
    }
}

if(heartBtn) {
    heartBtn.addEventListener('mousedown', startHolding);
    heartBtn.addEventListener('mouseup', stopHolding);
    heartBtn.addEventListener('mouseleave', stopHolding);
    heartBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startHolding();
    });
    heartBtn.addEventListener('touchend', stopHolding);
}

// ========== TRAIL PARTICLES ==========
function createParticle(x, y) {
    const p = document.createElement('div');
    p.className = 'trail-particle';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    
    const size = Math.random() * 7 + 3; 
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
}

document.addEventListener('mousemove', (e) => createParticle(e.clientX, e.clientY));
document.addEventListener('touchmove', (e) => createParticle(e.touches[0].clientX, e.touches[0].clientY));

// ========== TILT EFFECT ==========
const tiltElements = document.querySelectorAll('.time-box, .music-player, .quote-card, .envelope');

tiltElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (centerY - y) / 10;
        const rotateY = (x - centerX) / 10;
        
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        el.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 25px var(--primary-glow)`;
    });
    
    el.addEventListener('mouseleave', () => {
        el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        el.style.boxShadow = '';
    });
});

// ========== ADMIN PANEL ==========
let clicks = 0;
let clickTimer;

window.addEventListener('click', (e) => {
    if (e.target.closest('.admin-content') || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;

    clicks++;
    clearTimeout(clickTimer);
    if (clicks === 4) {
        openAdminPanel();
        clicks = 0;
    }
    clickTimer = setTimeout(() => { clicks = 0; }, 500); 
});
function slugifyMusicName(str = "") {
    return str
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ə/g, 'e')
        .replace(/Ə/g, 'E')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'I')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'O')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'U')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C')
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'G')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim();
}

function encodeBase64Utf8(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
}

function encodeFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e?.target?.result || '';
            const base64 = String(result).split(',')[1] || '';
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function formatFileSize(bytes = 0) {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function setAdminStatus(message = '', type = 'info') {
    const statusEl = document.getElementById('admin-status');
    if (!statusEl) return;

    if (!message) {
        statusEl.textContent = '';
        statusEl.className = 'admin-status';
        return;
    }

    statusEl.textContent = String(message).trim();
    statusEl.className = `admin-status is-visible is-${type}`;
}

async function parseAdminApiResponse(response) {
    const rawText = await response.text();
    let data = {};

    if (rawText) {
        try {
            data = JSON.parse(rawText);
        } catch (_) {
            data = { rawText };
        }
    }

    return { rawText, data };
}

function toPlainErrorText(value = '') {
    return String(value)
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildAdminRequestError(response, result = {}, rawText = '') {
    const requestId = response.headers.get('x-nf-request-id') || response.headers.get('x-request-id') || '';
    const mainDetail = result?.error || result?.message || result?.details?.error || result?.details?.message || result?.stack || toPlainErrorText(rawText);
    const lines = [
        `Xəta baş verdi (${response.status} ${response.statusText}).`,
        mainDetail || 'Serverdən xəta detalları alınmadı.'
    ];

    if (requestId) {
        lines.push(`Request ID: ${requestId}`);
    }

    return lines.filter(Boolean).join('\n');
}

function setAdminButtonLoading(button, isLoading, label) {
    if (!button) return;
    if (!button.dataset.defaultLabel) {
        button.dataset.defaultLabel = button.innerHTML;
    }

    button.disabled = isLoading;
    button.innerHTML = isLoading
        ? `<i class="fas fa-spinner fa-spin"></i><span>${label || 'Gözləyin...'}</span>`
        : button.dataset.defaultLabel;
}

async function convertAudioFileToBase64(file) {
    const buffer = await readFileAsArrayBuffer(file);
    return arrayBufferToBase64(buffer);
}
async function uploadToCloudinary(file, { cloudName, preset, resourceType = 'auto', folder = '' }) {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const formData = new FormData();

    formData.append('file', file);
    formData.append('upload_preset', preset);

    if (folder) {
        formData.append('folder', folder);
    }

    const res = await fetch(url, {
        method: 'POST',
        body: formData
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.error?.message || 'Cloudinary upload xətası baş verdi.');
    }

    return data;
}
function getAdminPasswordFieldId(type) {
    return {
        update_config: 'admin-password-settings',
        upload_image: 'admin-password-gallery',
        upload_music: 'admin-password-music',
        upload_note: 'admin-password-extras'
    }[type] || 'admin-password-settings';
}
function getAdminPassword(type) {
    const fieldId = getAdminPasswordFieldId(type);
    const input = document.getElementById(fieldId);
    return input ? input.value.trim() : '';
}
async function handleAdminUpdate(type) {
    const password = getAdminPassword(type);
    if (!password) {
        setAdminStatus('Bu bölmə üçün şifrəni daxil et!', 'error');
        return alert('Bu bölmə üçün şifrəni daxil et!');
    }

    const triggerButton = {
        update_config: document.getElementById('update-config-btn'),
        upload_image: document.getElementById('upload-image-btn'),
        upload_music: document.getElementById('upload-music-btn')
    }[type];

    let requestPayload = { path: '' };

    try {
        setAdminStatus('Əməliyyat hazırlanır...', 'info');
        setAdminButtonLoading(triggerButton, true, 'Yüklənir...');

        if (type === 'update_config') {
            const newDate = document.getElementById('admin-date').value;
            const newCount = document.getElementById('admin-count').value;

            if (!newDate && !newCount) {
                throw new Error('Dəyişiklik yoxdur!');
            }

            requestPayload = {
                path: 'hcayar.js',
                newDate,
                newCount
            };
        }

        else if (type === 'upload_image') {
            const fileInput = document.getElementById('admin-file');
            const file = fileInput?.files?.[0];

            if (!file) throw new Error('Şəkil seçin!');

            const base64 = await encodeFileAsBase64(file);

            requestPayload = {
                path: `gallery/${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
                content: base64
            };
        }

        else if (type === 'upload_music') {
            const audioFile = document.getElementById('admin-music-file')?.files?.[0];
            const coverFile = document.getElementById('admin-music-cover')?.files?.[0] || null;
            const title = document.getElementById('admin-music-title')?.value.trim();
            const artist = document.getElementById('admin-music-artist')?.value.trim();
            const lyricsType = document.getElementById('admin-lyrics-type')?.value || 'none';
            const lyricsText = document.getElementById('admin-lyrics-text')?.value || '';
            const musicSource = document.getElementById('admin-music-source')?.value || 'github';

            if (!audioFile) throw new Error('Musiqi faylı seç!');
            if (!title) throw new Error('Mahnı adı yaz!');
            if (!artist) throw new Error('Artist adı yaz!');
            const ext = audioFile.name.split('.').pop()?.toLowerCase();
            if (ext !== 'mp3') throw new Error('Yalnız MP3 yüklə!');
            const slugBase = `${title}-${artist}`
                .toLowerCase()
                .replace(/[^a-z0-9əöüğşıç-]+/gi, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '') || `track-${Date.now()}`;

            const slug = `${slugBase}-${Date.now()}`;

            let audioField = '';
            let coverField = '';

            const musicMeta = {
                id: slug,
                title,
                artist,
                lyrics: {
                    type: lyricsType,
                    text: lyricsText.trim()
                },
                uploadedAt: new Date().toISOString()
            };

            if (musicSource === 'cloudinary') {
                setAdminStatus('Cloudinary-yə yüklənir...', 'info');

                const cloudName = 'dkhuq9o1h';

                const audioUpload = await uploadToCloudinary(audioFile, {
                    cloudName,
                    preset: 'dunyamiz_audio_unsigned',
                    resourceType: 'video',
                    folder: 'dunyamiz/music'
                });

                audioField = audioUpload.secure_url;

                if (coverFile) {
                    const coverUpload = await uploadToCloudinary(coverFile, {
                        cloudName,
                        preset: 'dunyamiz_cover_unsigned',
                        resourceType: 'image',
                        folder: 'dunyamiz/covers'
                    });

                    coverField = coverUpload.secure_url;
                }

                musicMeta.audio = audioField;
                if (coverField) musicMeta.cover = coverField;

                requestPayload = {
                    path: `musiqiler/${slug}.json`,
                    content: encodeBase64Utf8(JSON.stringify(musicMeta, null, 2))
                };

                type = 'upload_music_json';
            } else {
                setAdminStatus('GitHub üçün fayllar hazırlanır...', 'info');

                const audioBase64 = await convertAudioFileToBase64(audioFile);
                const coverBase64 = coverFile ? await encodeFileAsBase64(coverFile) : '';
                const coverExt = coverFile ? (coverFile.name.split('.').pop()?.toLowerCase() || 'jpg') : '';
                const coverFileName = coverFile ? `${slug}.${coverExt}` : '';

                audioField = `musiqiler/${slug}.mp3`;
                coverField = coverFileName ? `musiqiler/${coverFileName}` : '';

                musicMeta.audio = audioField;
                if (coverField) musicMeta.cover = coverField;

                requestPayload = {
                    slug,
                    audioPath: audioField,
                    jsonPath: `musiqiler/${slug}.json`,
                    audioContent: audioBase64,
                    coverPath: coverField,
                    coverContent: coverBase64,
                    jsonContent: encodeBase64Utf8(JSON.stringify(musicMeta, null, 2))
                };
            }
        }
        setAdminStatus('Serverə göndərilir...', 'info');
        const response = await fetch('/.netlify/functions/admin-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                password,
                payload: requestPayload
            })
        });

        const { rawText, data: result } = await parseAdminApiResponse(response);

        if (!response.ok || !result.success) {
            throw new Error(buildAdminRequestError(response, result, rawText));
        }

        setAdminStatus('Uğurla yerinə yetirildi! Səhifə yenilənir...', 'success');
        setTimeout(() => location.reload(), 900);
    } catch (err) {
        console.error(err);
        const errorMessage = err?.message || 'Serverə qoşulmaq mümkün olmadı.';
        setAdminStatus(errorMessage, 'error');
    } finally {
        setAdminButtonLoading(triggerButton, false);
    }
}

// ========== WEATHER API ==========
async function updateWeatherTheme() {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.3777&longitude=49.892&current_weather=true');
        const data = await res.json();
        const code = data.current_weather.weathercode;
        const temp = Math.round(data.current_weather.temperature);
        const statusText = document.getElementById('weather-status');
        const weatherWrap = document.getElementById('weather-container');
        if (!statusText || !weatherWrap) return;

        let message = '';
        let accent = '#ff4d6d';
        let glow = 'rgba(255, 77, 109, 0.35)';
        let icon = '☁️';

        if ([0, 1].includes(code)) {
            icon = '☀️';
            accent = '#ffb347';
            glow = 'rgba(255, 179, 71, 0.35)';
            message = `Bakıda hava tərtəmizdir (${temp}°C) — sənin kimi parlaq.`;
        } else if ([2, 3].includes(code)) {
            icon = '⛅';
            accent = '#8ec5ff';
            glow = 'rgba(142, 197, 255, 0.35)';
            message = `Bakı bu gün sakit və bir az buludludur (${temp}°C).`;
        } else if ([45, 48].includes(code)) {
            icon = '🌫️';
            accent = '#b0bec5';
            glow = 'rgba(176, 190, 197, 0.28)';
            message = `Hər tərəf dumanlıdır (${temp}°C), amma sevgi tərəfi aydındır.`;
        } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
            icon = '🌧️';
            accent = '#6ea8fe';
            glow = 'rgba(110, 168, 254, 0.30)';
            message = `Bakıda yağış yağır (${temp}°C). Özünü isti saxla.`;
        } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
            icon = '❄️';
            accent = '#d8f3ff';
            glow = 'rgba(216, 243, 255, 0.28)';
            message = `Hava qarlıdır (${temp}°C). Bu səhnə də çox zərif görünür.`;
        } else if ([95, 96, 99].includes(code)) {
            icon = '⚡';
            accent = '#c084fc';
            glow = 'rgba(192, 132, 252, 0.30)';
            message = `Bakıda ildırım var (${temp}°C), amma burada aura yenə romantikdir.`;
        } else {
            icon = '💫';
            message = `Bakıda hava dəyişkəndir (${temp}°C), amma burada hiss sabitdir.`;
        }

        weatherWrap.style.borderColor = glow;
        weatherWrap.style.boxShadow = `0 10px 30px ${glow}`;
        weatherWrap.style.background = 'rgba(255,255,255,0.08)';
        weatherWrap.style.backdropFilter = 'blur(14px)';
        weatherWrap.style.borderRadius = '18px';
        weatherWrap.style.maxWidth = '520px';
        weatherWrap.style.margin = '12px auto 0';
        weatherWrap.style.border = '1px solid rgba(255,255,255,0.12)';
        document.documentElement.style.setProperty('--weather-accent', accent);
        statusText.innerHTML = `<span style="font-size:18px;margin-right:8px;">${icon}</span>${message}`;
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) {
            initWeatherParticles('rain');
        } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
            initWeatherParticles('snow');
        } else {
            initWeatherParticles('none');
        }
    } catch (err) {
        console.error('Hava məlumatı alınmadı.');
    }
}
// Hava Partiklları
let weatherAnimId;
function initWeatherParticles(type) {
    const canvas = document.getElementById('weather-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    cancelAnimationFrame(weatherAnimId);
    
    if (type === 'none') { ctx.clearRect(0,0, canvas.width, canvas.height); return; }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particles = [];
    const maxParticles = type === 'rain' ? 100 : 50;

    for (let i = 0; i < maxParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            length: type === 'rain' ? Math.random() * 20 + 10 : Math.random() * 3 + 2,
            speed: type === 'rain' ? Math.random() * 10 + 10 : Math.random() * 1 + 0.5,
            opacity: Math.random() * 0.5 + 0.2,
            wind: type === 'rain' ? Math.random() * 2 - 1 : Math.random() * 3 - 1.5
        });
    }

    function draww() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1.5;

        particles.forEach(p => {
            if (type === 'rain') {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.wind, p.y + p.length);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.length, 0, Math.PI * 2);
                ctx.fill();
            }
            p.y += p.speed;
            p.x += p.wind;

            if (p.y > canvas.height) {
                p.y = 0;
                p.x = Math.random() * canvas.width;
            }
        });
        weatherAnimId = requestAnimationFrame(draw);
    }
    draww();
}
window.addEventListener('resize', () => {
    const canvas = document.getElementById('weather-canvas');
    if(canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
});
// ========== SCRATCH CARD ==========
function initScratchCard() {
    const sCanvas = document.getElementById('scratch-canvas');
    if (!sCanvas) return;
    
    const sCtx = sCanvas.getContext('2d', { willReadFrequently: true });
    sCtx.fillStyle = '#444444'; 
    sCtx.beginPath();
    sCtx.rect(0, 0, sCanvas.width, sCanvas.height);
    sCtx.fill();
    
    function scratch(e) {
        const rect = sCanvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        sCtx.globalCompositeOperation = 'destination-out';
        sCtx.beginPath();
        sCtx.arc(x, y, 25, 0, Math.PI * 2); 
        sCtx.fill();
    }
    
    sCanvas.addEventListener('mousedown', () => {
        sCanvas.addEventListener('mousemove', scratch);
    });
    window.addEventListener('mouseup', () => {
        sCanvas.removeEventListener('mousemove', scratch);
    });
    sCanvas.addEventListener('touchmove', (e) => { 
        e.preventDefault(); 
        scratch(e); 
    }, {passive: false});
}

window.addEventListener('DOMContentLoaded', initScratchCard);
updateWeatherTheme();

// ========== ADMIN BUTTONS ==========
document.addEventListener('DOMContentLoaded', () => {
    const updateBtn = document.getElementById('update-config-btn');
    const uploadImageBtn = document.getElementById('upload-image-btn');
    const uploadMusicBtn = document.getElementById('upload-music-btn');
    const galleryFileInput = document.getElementById('admin-file');
    const musicFileInput = document.getElementById('admin-music-file');
    const coverFileInput = document.getElementById('admin-music-cover');
    const coverPreview = document.getElementById('admin-cover-preview');
    const galleryMeta = document.getElementById('admin-file-meta');
    const musicMeta = document.getElementById('admin-music-file-meta');
    const coverMeta = document.getElementById('admin-music-cover-meta');

    if (updateBtn) {
        updateBtn.onclick = () => handleAdminUpdate('update_config');
    }

    if (uploadImageBtn) {
        uploadImageBtn.onclick = () => handleAdminUpdate('upload_image');
    }

    if (uploadMusicBtn) {
        uploadMusicBtn.onclick = () => handleAdminUpdate('upload_music');
    }

    galleryFileInput?.addEventListener('change', () => {
        const file = galleryFileInput.files?.[0];
        if (galleryMeta) {
            galleryMeta.textContent = file
                ? `${file.name} • ${formatFileSize(file.size)}`
                : 'PNG, JPG, WEBP və digər şəkillər dəstəklənir.';
        }
    });

    musicFileInput?.addEventListener('change', () => {
        const file = musicFileInput.files?.[0];
        if (musicMeta) {
            musicMeta.textContent = file
                ? `${file.name} • ${formatFileSize(file.size)}`
                : 'Yalnız .mp3 formatı qəbul edilir.';
        }
    });

    coverFileInput?.addEventListener('change', () => {
        const file = coverFileInput.files?.[0];
        if (coverMeta) {
            coverMeta.textContent = file
                ? `${file.name} • ${formatFileSize(file.size)}`
                : 'İstəyə bağlıdır. Yükləsən, JSON-a da əlavə olunacaq.';
        }

        if (!coverPreview) return;
        if (!file) {
            coverPreview.src = DEFAULT_MUSIC_COVER;
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        coverPreview.src = previewUrl;
        coverPreview.onload = () => URL.revokeObjectURL(previewUrl);
    });
});
// Bu kodu hcayar.js faylının ən sonuna yapışdır
document.addEventListener('DOMContentLoaded', () => {
    const letterTypes = {
        'env-miss': 'miss',
        'env-sad': 'sad',
        'env-happy': 'happy',
        'env-us': 'us'
    };

    // Məktubları açmaq üçün
    for (const [id, type] of Object.entries(letterTypes)) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', () => {
                const modal = document.getElementById('letter-modal');
                // Sizin letters obyektinizdən məlumatları çəkir
                document.getElementById('letter-title').innerText = letters[type].title;
                document.getElementById('letter-text').innerText = letters[type].text;
                modal.style.display = 'flex';
            });
        }
    }

    // Modalın bağlanması üçün
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('letter-modal').style.display = 'none';
        });
    }
});
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeOut * (end - start) + start);
        
        if (id === 'total-minutes-love' || id === 'total-hours-love') {
            obj.innerText = current.toLocaleString('tr-TR');
        } else {
            obj.innerText = current;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerText = (id === 'total-minutes-love' || id === 'total-hours-love') 
                ? end.toLocaleString('tr-TR') : end;
        }
    };
    window.requestAnimationFrame(step);
}
document.addEventListener('DOMContentLoaded', () => {
    const closeAdminBtn = document.querySelector('.close-admin');
    const adminPanel = document.getElementById('admin-panel');

    // X düyməsinə basanda bağlamaq üçün
    if (closeAdminBtn && adminPanel) {
        closeAdminBtn.addEventListener('click', () => {
            adminPanel.style.display = 'none';
        });
    }

    // Əlavə olaraq: Panelin kənarına (boz arxafona) basanda da bağlanması üçün
    window.addEventListener('click', (event) => {
        if (event.target === adminPanel) {
            adminPanel.style.display = 'none';
        }
    });
});
// Notlar funksiyası
// Notlar funksiyası
window.showNote = function(i) {
    try {
        if (!window.currentNotes || !window.currentNotes[i]) return;
        const n = window.currentNotes[i];
        
        document.getElementById('view-note-title').innerText = n.title;
        document.getElementById('view-note-author').innerText = n.author + " tərəfindən";
        document.getElementById('view-note-text').innerText = n.content;
        
        // Saat ikonunu qorumaq üçün innerText əvəzinə innerHTML istifadə edirik:
        document.getElementById('view-note-date').innerHTML = `<i class="far fa-clock"></i> ${n.dateStr}`;
        
        document.getElementById('view-note-modal').style.display = 'flex';
    } catch (err) {
        console.error("Not açılarkən xəta baş verdi:", err);
        alert("Notu açmaq mümkün olmadı.");
    }
};

async function loadNotes() {
    const container = document.getElementById('notes-container');
    if(!container) return;
    
    try {
        const url = `https://api.github.com/repos/${config.githubUsername}/${config.repoName}/contents/notlar`;
        const res = await fetch('/.netlify/functions/github-content?path=notlar');
        if(!res.ok) { 
            container.innerHTML = "<p style='opacity:0.6;'>Hələ ki, not yoxdur.</p>"; 
            return; 
        }
        
        const files = await res.json();
        let notesData = [];
        const jsonFiles = files.filter(x => x.name.endsWith('.json'));
        
        for(let f of jsonFiles) {
            const dataRes = await fetch(f.download_url);
            notesData.push(await dataRes.json());
        }

        notesData.sort((a,b) => new Date(b.dateIso) - new Date(a.dateIso));
        window.currentNotes = notesData;

        // "onclick" atributunu çıxarır və məlumatı "data-index" kimi saxlayırıq
        container.innerHTML = notesData.map((n, i) => `
            <div class="note-card" data-index="${i}">
                <span class="note-card-author">${n.author}</span>
                <h3 class="note-card-title">${n.title}</h3>
                <span class="note-card-date">${n.dateStr}</span>
            </div>
        `).join('');

        // Bütün kartlara klik (click) funksiyasını təhlükəsiz yolla bağlayırıq
        document.querySelectorAll('.note-card').forEach(card => {
            card.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                window.showNote(parseInt(index));
            });
        });

    } catch(e) { 
        console.error("Xəta:", e);
        container.innerHTML = "<p style='opacity:0.6; color:#ff4d6d;'>Notlar yüklənərkən xəta baş verdi.</p>"; 
    }
}
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    
    // Modal idarəetmələri
    const addModal = document.getElementById('add-note-modal');
    const viewModal = document.getElementById('view-note-modal');
    
    document.getElementById('open-add-note-btn').onclick = () => addModal.style.display = 'flex';
    document.getElementById('close-add-note-btn').onclick = () => addModal.style.display = 'none';
    document.getElementById('close-view-note-btn').onclick = () => viewModal.style.display = 'none';

    // Not əlavə etmə məntiqi
    document.getElementById('submit-note-btn').onclick = async () => {
        const author = document.getElementById('note-author').value;
        let title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();
        const pass = getAdminPassword('upload_note') || prompt("Admin şifrəsi:");

        if(!content || !pass) return alert("Məzmun və şifrə mütləqdir!");

        const now = new Date();
        const dateStr = now.toLocaleString('az-AZ').replace(',', '');
        if(!title) title = dateStr;

        const noteObj = { author, title, content, dateStr, dateIso: now.toISOString() };
        // UTF-8 dəstəyi ilə Base64-ə çevirmə
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(noteObj))));

        const btn = document.getElementById('submit-note-btn');
        btn.innerText = "Yüklənir...";
        btn.disabled = true;
        
        try {
            const res = await fetch('/.netlify/functions/admin-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'upload_note',
                    password: pass,
                    payload: { path: `notlar/not_${Date.now()}.json`, content: b64 }
                })
            });

            if(res.ok) {
                alert("Not uğurla əlavə edildi! 🤍");
                location.reload();
            } else {
                alert("Xəta: Şifrə yanlış ola bilər.");
                btn.innerText = "Təsdiqlə";
                btn.disabled = false;
            }
        } catch(e) {
            alert("Sistem xətası baş verdi.");
            btn.innerText = "Təsdiqlə";
            btn.disabled = false;
        }
    };
});
window.musicLibrary = [];
window.currentMusic = null;
window.currentMusicIndex = -1;
window.currentMusicLyricsParsed = [];
window.currentMusicLyricsType = 'none';
window.currentLyricsActiveIndex = -1;
window.currentLyricsActiveWordIndex = -1;

const DEFAULT_MUSIC_COVER = 'assets/music-cover.jpg';
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${config.githubUsername}/${config.repoName}/main/`;

function resolveMusicAssetUrl(value, fallback = '') {
    if (!value) return fallback;

    const cleaned = String(value).trim();
    if (!cleaned) return fallback;

    if (/^https?:\/\//i.test(cleaned)) {
        return cleaned;
    }

    const normalized = cleaned.replace(/^\/+/, '');
    if (!normalized.includes('/')) {
        return `${GITHUB_RAW_BASE}musiqiler/${encodeURIComponent(normalized)}`;
    }

    return `${GITHUB_RAW_BASE}${normalized.split('/').map(part => encodeURIComponent(part)).join('/')}`;
}
function normalizeTrackMeta(meta = {}) {
    const audioValue = meta.audio || (meta.file ? `musiqiler/${meta.file}` : '');
    const coverValue = meta.cover || meta.coverUrl || '';

    return {
        ...meta,
        audio: audioValue,
        cover: coverValue,
        audioUrl: resolveMusicAssetUrl(audioValue),
        coverUrl: resolveMusicAssetUrl(coverValue, DEFAULT_MUSIC_COVER)
    };
}
function formatMusicTime(seconds = 0) {
    if (!isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function escapeHtmlMusic(text = '') {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parseLrcTimeToSeconds(timeStr) {
    const cleaned = String(timeStr).replace(',', '.').trim();
    const match = cleaned.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (!match) return null;

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const fraction = Number((match[3] || '0').padEnd(3, '0').slice(0, 3)) / 1000;
    return minutes * 60 + seconds + fraction;
}

function parseSyncedLyrics(lrcText = '') {
    const rawLines = String(lrcText).split(/\r?\n/);
    const parsed = [];

    rawLines.forEach((rawLine) => {
        const lineTags = [...rawLine.matchAll(/\[(\d{1,2}:\d{2}(?:[\.,]\d{1,3})?)\]/g)];
        if (!lineTags.length) return;

        const content = rawLine.replace(/\[(\d{1,2}:\d{2}(?:[\.,]\d{1,3})?)\]/g, '').trim();
        const wordMatches = [...content.matchAll(/<(\d{1,2}:\d{2}(?:[\.,]\d{1,3})?)>([^<]+)/g)];

        const words = wordMatches.map((match, wordIndex) => ({
            index: wordIndex,
            time: parseLrcTimeToSeconds(match[1]),
            text: match[2] || ''
        })).filter((word) => word.time !== null && word.text.trim());

        lineTags.forEach((tag, lineIndex) => {
            const lineTime = parseLrcTimeToSeconds(tag[1]);
            if (lineTime === null) return;

            const lineText = words.length
                ? words.map((word) => word.text).join('').trim()
                : content.replace(/<(\d{1,2}:\d{2}(?:[\.,]\d{1,3})?)>/g, '').trim();

            parsed.push({
                id: `${lineTime}-${lineIndex}`,
                time: lineTime,
                text: lineText || '…',
                words
            });
        });
    });

    parsed.sort((a, b) => a.time - b.time);
    return parsed;
}

function getMusicDom() {
    return {
        playlist: document.getElementById('music-playlist'),
        trackCount: document.getElementById('music-track-count'),
        activePlayer: document.getElementById('yt-active-player'),
        audio: document.getElementById('yt-audio'),
        openFullBtn: document.getElementById('yt-open-full-btn'),
        expandHitbox: document.getElementById('yt-expand-hitbox'),
        minimizeBtn: document.getElementById('yt-minimize-btn'),
        lyricsToggle: document.getElementById('yt-lyrics-toggle'),
        closeLyricsBtn: document.querySelector('.btn-close-lyrics'),
        lyricsPanel: document.getElementById('yt-lyrics-panel'),
        lyricsContainer: document.getElementById('yt-lyrics-container'),
        titleFull: document.getElementById('yt-player-title'),
        artistFull: document.getElementById('yt-player-artist'),
        titleMini: document.getElementById('yt-player-title-mini'),
        artistMini: document.getElementById('yt-player-artist-mini'),
        coverFull: document.getElementById('yt-cover-image'),
        coverMini: document.getElementById('yt-cover-image-mini'),
        seekbar: document.getElementById('yt-seekbar'),
        currentTime: document.getElementById('yt-current-time'),
        duration: document.getElementById('yt-duration'),
        playBtnFull: document.getElementById('yt-play-btn'),
        playBtnMini: document.getElementById('yt-play-btn-mini'),
        prevBtn: document.getElementById('yt-prev-btn'),
        prevBtnMini: document.getElementById('yt-prev-btn-mini'),
        nextBtn: document.getElementById('yt-next-btn'),
        nextBtnMini: document.getElementById('yt-next-btn-mini'),
        volumeSlider: document.getElementById('volume-slider'),
        volumeValue: document.getElementById('volume-value'),
        rotatingDisc: document.getElementById('yt-rotating-disc'),
        playerBg: document.getElementById('yt-player-bg'),
        waveform: document.getElementById('yt-waveform')
    };
}

function setPlayerExpanded(expanded) {
    const { activePlayer, lyricsPanel } = getMusicDom();
    if (!activePlayer) return;

    activePlayer.classList.toggle('expanded', expanded);
    activePlayer.classList.toggle('player-mini', !expanded);

    if (!expanded && lyricsPanel) {
        lyricsPanel.classList.add('lyrics-hidden');
        activePlayer.classList.remove('lyrics-open');
        lyricsPanel.setAttribute('aria-hidden', 'true');
    }

    updateLyricsToggleState();
}

window.togglePlayerMode = function(forceExpanded) {
    const { activePlayer } = getMusicDom();
    if (!activePlayer) return;

    const expanded = typeof forceExpanded === 'boolean'
        ? forceExpanded
        : !activePlayer.classList.contains('expanded');

    setPlayerExpanded(expanded);
};

function updateLyricsToggleState() {
    const { activePlayer, lyricsToggle, lyricsPanel } = getMusicDom();
    if (!activePlayer || !lyricsToggle || !lyricsPanel) return;

    const isExpanded = activePlayer.classList.contains('expanded');
    const isOpen = !lyricsPanel.classList.contains('lyrics-hidden');
    lyricsToggle.classList.toggle('is-open', isOpen && isExpanded);
    lyricsToggle.setAttribute('aria-label', isOpen ? 'Sözləri bağla' : 'Sözləri aç');
}

window.toggleLyricsPanel = function(forceOpen) {
    const { activePlayer, lyricsPanel } = getMusicDom();
    if (!activePlayer || !lyricsPanel) return;

    if (!activePlayer.classList.contains('expanded')) {
        setPlayerExpanded(true);
    }

    const shouldOpen = typeof forceOpen === 'boolean'
        ? forceOpen
        : lyricsPanel.classList.contains('lyrics-hidden');

    lyricsPanel.classList.toggle('lyrics-hidden', !shouldOpen);
    activePlayer.classList.toggle('lyrics-open', shouldOpen);
    lyricsPanel.setAttribute('aria-hidden', String(!shouldOpen));
    updateLyricsToggleState();
};

async function fetchMusicJsonList() {
    const url = `https://api.github.com/repos/${config.githubUsername}/${config.repoName}/contents/musiqiler`;
    const response = await fetch("/.netlify/functions/github-content?path=musiqiler");
    const files = await response.json();

    if (!Array.isArray(files)) {
        throw new Error(files?.message || 'musiqiler qovluğu oxunmadı');
    }

    const jsonFiles = files.filter((file) => file.name.toLowerCase().endsWith('.json'));

    const jsonData = await Promise.all(
        jsonFiles.map(async (file) => {
            const res = await fetch(file.download_url);
            if (!res.ok) return null;
            const data = await res.json();

            const normalized = normalizeTrackMeta({
                ...data,
                id: data.id || file.name,
                jsonName: file.name,
                title: data.title || 'Adsız mahnı',
                artist: data.artist || 'Naməlum artist'
            });

            return normalized;
        })
    );
    return jsonData
        .filter(Boolean)
        .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
}

function renderMusicPlaylist() {
    const { playlist, trackCount } = getMusicDom();
    if (!playlist) return;

    if (!window.musicLibrary.length) {
        playlist.innerHTML = `<div class="music-empty-state"><i class="fas fa-music"></i><span>Hələ musiqi əlavə edilməyib.</span></div>`;
        if (trackCount) trackCount.textContent = '0 mahnı';
        return;
    }

    playlist.innerHTML = window.musicLibrary.map((track, index) => {
        const isActive = window.currentMusicIndex === index;
        const thumbSrc = track.coverUrl || DEFAULT_MUSIC_COVER;

        return `
            <div class="yt-track-item ${isActive ? 'active' : ''}" data-music-index="${index}">
                <img class="yt-track-thumb" src="${thumbSrc}" alt="${escapeHtmlMusic(track.title)}">
                <div class="yt-track-text">
                    <div class="yt-track-title">${escapeHtmlMusic(track.title)}</div>
                    <div class="yt-track-artist">${escapeHtmlMusic(track.artist)}</div>
                </div>
                <div class="yt-track-meta">
                    <i class="fas ${isActive ? 'fa-volume-high' : 'fa-play'}"></i>
                </div>
            </div>
        `;
    }).join('');

    if (trackCount) {
        trackCount.textContent = `${window.musicLibrary.length} mahnı`;
    }

    playlist.querySelectorAll('.yt-track-item').forEach((item) => {
        item.addEventListener('click', () => {
            const index = Number(item.dataset.musicIndex);
            openMusicTrack(index);
        });
    });
}
function renderPlainLyrics(text = '') {
    const { lyricsContainer } = getMusicDom();
    if (!lyricsContainer) return;

    if (!text.trim()) {
        lyricsContainer.innerHTML = `<div class="yt-lyrics-empty">Sözlər əlavə edilməyib.</div>`;
        return;
    }

    const html = text
        .split(/\r?\n/)
        .map((line) => `<div class="yt-lyrics-line passed">${escapeHtmlMusic(line) || '&nbsp;'}</div>`)
        .join('');

    lyricsContainer.innerHTML = html || `<div class="yt-lyrics-empty">Sözlər əlavə edilməyib.</div>`;
}

function renderSyncedLyrics(parsedLyrics = []) {
    const { lyricsContainer } = getMusicDom();
    if (!lyricsContainer) return;

    if (!parsedLyrics.length) {
        lyricsContainer.innerHTML = `<div class="yt-lyrics-empty">Synced lyrics tapılmadı.</div>`;
        return;
    }

    lyricsContainer.innerHTML = parsedLyrics.map((line, index) => {
        if (line.words && line.words.length) {
            const wordsHtml = line.words.map((word, wordIndex) => `
                <span 
                    class="yt-lyrics-word" 
                    data-lyrics-index="${index}" 
                    data-word-index="${wordIndex}" 
                    data-word-time="${word.time}"
                >${escapeHtmlMusic(word.text)}</span>
            `).join('');

            return `
                <div 
                    class="yt-lyrics-line yt-lyrics-line--word yt-lyrics-line--clickable" 
                    data-lyrics-index="${index}"
                    data-line-time="${line.time}"
                >
                    ${wordsHtml}
                </div>
            `;
        }

        return `
            <div 
                class="yt-lyrics-line yt-lyrics-line--clickable" 
                data-lyrics-index="${index}"
                data-line-time="${line.time}"
            >
                ${escapeHtmlMusic(line.text.trim())}
            </div>
        `;
    }).join('');
}
function renderCurrentTrackLyrics(track) {
    const lyrics = track?.lyrics || {};
    const type = lyrics.type || 'none';
    const text = lyrics.text || '';

    window.currentMusicLyricsType = type;
    window.currentLyricsActiveIndex = -1;
    window.currentLyricsActiveWordIndex = -1;
    window.currentMusicLyricsParsed = [];

    if (type === 'plain') {
        renderPlainLyrics(text);
    } else if (type === 'synced') {
        const parsed = parseSyncedLyrics(text);
        window.currentMusicLyricsParsed = parsed;
        renderSyncedLyrics(parsed);
    } else {
        renderPlainLyrics('');
    }
}

function updateSyncedLyricsByTime(currentTime) {
    if (window.currentMusicLyricsType !== 'synced') return;
    if (!window.currentMusicLyricsParsed.length) return;
    const { lyricsPanel } = getMusicDom();
    const { lyricsContainer } = getMusicDom();
    if (!lyricsContainer) return;

    let activeIndex = -1;
    for (let i = 0; i < window.currentMusicLyricsParsed.length; i++) {
        if (currentTime >= window.currentMusicLyricsParsed[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }

    const activeLine = activeIndex >= 0 ? window.currentMusicLyricsParsed[activeIndex] : null;
    let activeWordIndex = -1;
    if (activeLine?.words?.length) {
        for (let i = 0; i < activeLine.words.length; i++) {
            if (currentTime >= activeLine.words[i].time) {
                activeWordIndex = i;
            } else {
                break;
            }
        }
    }

    if (
        activeIndex === window.currentLyricsActiveIndex &&
        activeWordIndex === window.currentLyricsActiveWordIndex
    ) {
        return;
    }
    if (activeIndex !== window.currentLyricsActiveIndex && activeIndex >= 0) {
        if (lyricsPanel && currentWaveColor) {
            const glowColor = currentWaveColor.replace('rgb', 'rgba').replace(')', ', 0.15)');
            const intenseGlow = currentWaveColor.replace('rgb', 'rgba').replace(')', ', 0.3)');
            lyricsPanel.style.background = `radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, ${intenseGlow} 0%, rgba(255,255,255,0.04) 70%)`;
            lyricsPanel.style.boxShadow = `inset 0 0 50px ${glowColor}, 0 10px 30px rgba(0,0,0,0.3)`;
            setTimeout(() => {
                lyricsPanel.style.boxShadow = `inset 0 0 20px rgba(255,255,255,0.02), 0 10px 30px rgba(0,0,0,0.3)`;
            }, 400);
        }
    }

    window.currentLyricsActiveIndex = activeIndex;
    window.currentLyricsActiveWordIndex = activeWordIndex;

    const lines = lyricsContainer.querySelectorAll('.yt-lyrics-line');
    lines.forEach((lineEl, index) => {
        lineEl.classList.toggle('active', index === activeIndex);
        lineEl.classList.toggle('passed', index < activeIndex);

        const wordEls = lineEl.querySelectorAll('.yt-lyrics-word');
        wordEls.forEach((wordEl, wordIndex) => {
            wordEl.classList.toggle('passed', index < activeIndex || (index === activeIndex && wordIndex < activeWordIndex));
            wordEl.classList.toggle('active', index === activeIndex && wordIndex === activeWordIndex);
        });
    });

    const activeEl = lyricsContainer.querySelector(`.yt-lyrics-line[data-lyrics-index="${activeIndex}"]`);
    if (activeEl) {
        const containerRect = lyricsContainer.getBoundingClientRect();
        const itemRect = activeEl.getBoundingClientRect();
        const delta = itemRect.top - containerRect.top - (containerRect.height / 2) + (itemRect.height / 2);
        lyricsContainer.scrollTo({
            top: lyricsContainer.scrollTop + delta,
            behavior: 'smooth'
        });
    }
}

function readMusicCoverFromUrl(audioUrl) {
    return new Promise((resolve) => {
        if (!window.jsmediatags) {
            resolve(DEFAULT_MUSIC_COVER);
            return;
        }

        window.jsmediatags.read(audioUrl, {
            onSuccess: (tag) => {
                const picture = tag?.tags?.picture;
                if (!picture || !picture.data || !picture.format) {
                    resolve(DEFAULT_MUSIC_COVER);
                    return;
                }

                let binary = '';
                const bytes = picture.data;
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }

                resolve(`data:${picture.format};base64,${window.btoa(binary)}`);
            },
            onError: () => resolve(DEFAULT_MUSIC_COVER)
        });
    });
}
function getDominantColorFromImage(imgSrc) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgSrc;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = 50;
            canvas.height = 50;

            ctx.drawImage(img, 0, 0, 50, 50);

            const data = ctx.getImageData(0, 0, 50, 50).data;

            let r = 0, g = 0, b = 0;
            let count = 0;

            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }

            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);

            resolve(`rgb(${r}, ${g}, ${b})`);
        };

        img.onerror = () => resolve("rgb(255,255,255)");
    });
}
async function updateMusicCover(track) {
    const { coverFull, coverMini, playerBg } = getMusicDom();

    const setCover = (src) => {
        if (coverFull) coverFull.src = src;
        if (coverMini) coverMini.src = src;
        if (playerBg) playerBg.style.backgroundImage = `url("${src}")`;
        getDominantColorFromImage(src).then(color => {
            currentWaveColor = color;
        });
        const playlistThumb = document.querySelector(
            `.yt-track-item[data-music-index="${window.currentMusicIndex}"] .yt-track-thumb`
        );
        if (playlistThumb) playlistThumb.src = src;
    };

    if (track.coverUrl) {
        setCover(track.coverUrl);
        return;
    }

    setCover(DEFAULT_MUSIC_COVER);

    try {
        const coverSrc = await readMusicCoverFromUrl(track.audioUrl);
        const currentTrackStillSame = window.currentMusic && window.currentMusic.id === track.id;
        if (!currentTrackStillSame) return;
        setCover(coverSrc || DEFAULT_MUSIC_COVER);
    } catch {
        setCover(DEFAULT_MUSIC_COVER);
    }
}

function updateMusicPlayButtonState() {
    const { audio, playBtnFull, playBtnMini, rotatingDisc } = getMusicDom();
    if (!audio) return;

    const icon = audio.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    if (playBtnFull) playBtnFull.innerHTML = icon;
    if (playBtnMini) playBtnMini.innerHTML = icon;
    if (rotatingDisc) rotatingDisc.classList.toggle('playing', !audio.paused);
}

function updateVolumeUi(value) {
    const { volumeSlider, volumeValue, audio } = getMusicDom();
    const numericValue = Math.min(1, Math.max(0, Number(value)));
    if (volumeSlider) volumeSlider.value = numericValue;
    if (audio) audio.volume = numericValue;
    if (volumeValue) volumeValue.textContent = `${Math.round(numericValue * 100)}%`;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fadeAudio(audioEl, from, to, duration = 350) {
    if (!audioEl) return;

    const steps = 12;
    const stepTime = duration / steps;
    const diff = to - from;

    audioEl.volume = from;

    for (let i = 1; i <= steps; i++) {
        audioEl.volume = Math.max(0, Math.min(1, from + (diff * i / steps)));
        await sleep(stepTime);
    }
}

async function fadeOutAndPause(audioEl, duration = 350) {
    if (!audioEl) return;
    const startVolume = Number(audioEl.volume ?? 1);

    await fadeAudio(audioEl, startVolume, 0, duration);
    audioEl.pause();
    audioEl.volume = startVolume;
}

async function fadeInAndPlay(audioEl, targetVolume = 1, duration = 350) {
    if (!audioEl) return;

    audioEl.volume = 0;
    await audioEl.play();
    await fadeAudio(audioEl, 0, targetVolume, duration);
}

function animateTrackChange() {
    const dom = getMusicDom();

    const animTargets = [
        dom.coverFull,
        dom.coverMini,
        dom.titleFull,
        dom.artistFull,
        dom.titleMini,
        dom.artistMini,
        dom.rotatingDisc
    ].filter(Boolean);

    animTargets.forEach(el => {
        el.classList.remove('track-switch-anim');
        void el.offsetWidth;
        el.classList.add('track-switch-anim');
    });
}
function restartAnimation(el, className) {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
}

function runMorphTransition(track) {
    const dom = getMusicDom();

    const coverTargets = [dom.coverFull, dom.coverMini].filter(Boolean);
    const textTargets = [
        dom.titleFull,
        dom.artistFull,
        dom.titleMini,
        dom.artistMini
    ].filter(Boolean);

    coverTargets.forEach((coverEl) => {
        const parent = coverEl.parentElement;
        if (!parent) return;

        parent.classList.add('morph-stage', 'morph-animating');

        const ghost = document.createElement('img');
        ghost.src = coverEl.src || '';
        ghost.className = 'morph-ghost';
        parent.appendChild(ghost);

        restartAnimation(coverEl, 'morph-target-in');

        ghost.addEventListener('animationend', () => {
            ghost.remove();
            parent.classList.remove('morph-animating');
        }, { once: true });
    });

    textTargets.forEach((el) => {
        restartAnimation(el, 'morph-text-in');
    });
}

async function animateTextSwap(track) {
    const dom = getMusicDom();
    const textTargets = [
        dom.titleFull,
        dom.artistFull,
        dom.titleMini,
        dom.artistMini
    ].filter(Boolean);

    textTargets.forEach((el) => restartAnimation(el, 'morph-text-out'));

    await new Promise(resolve => setTimeout(resolve, 180));

    if (dom.titleFull) dom.titleFull.textContent = track.title || 'Adsız mahnı';
    if (dom.artistFull) dom.artistFull.textContent = track.artist || 'Naməlum artist';
    if (dom.titleMini) dom.titleMini.textContent = track.title || 'Adsız mahnı';
    if (dom.artistMini) dom.artistMini.textContent = track.artist || 'Naməlum artist';

    textTargets.forEach((el) => {
        el.classList.remove('morph-text-out');
        restartAnimation(el, 'morph-text-in');
    });
}
function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', async () => {
        const dom = getMusicDom();
        const targetAudio = dom.audio?.src ? dom.audio : audio;
        if (!targetAudio) return;

        try {
            await targetAudio.play();
            updateMusicPlayButtonState();
            if (audio && targetAudio === audio && playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
        } catch (err) {
            console.error('MediaSession play error:', err);
        }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        const dom = getMusicDom();
        const targetAudio = dom.audio?.src && !dom.audio.paused ? dom.audio : audio;
        if (!targetAudio) return;

        targetAudio.pause();
        updateMusicPlayButtonState();
        if (audio && targetAudio === audio && playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (window.musicLibrary?.length) {
            playPrevMusic();
        }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (window.musicLibrary?.length) {
            playNextMusic();
        }
    });

    try {
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const dom = getMusicDom();
            const targetAudio = dom.audio?.src && !dom.audio.paused ? dom.audio : audio;
            if (!targetAudio) return;
            targetAudio.currentTime = Math.max(0, targetAudio.currentTime - (details.seekOffset || 10));
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const dom = getMusicDom();
            const targetAudio = dom.audio?.src && !dom.audio.paused ? dom.audio : audio;
            if (!targetAudio || !Number.isFinite(targetAudio.duration)) return;
            targetAudio.currentTime = Math.min(targetAudio.duration, targetAudio.currentTime + (details.seekOffset || 10));
        });
    } catch (_) {}
}

function updateLegacyMediaSession() {
    if (!('mediaSession' in navigator) || !audio) return;

    const legacyCover = document.getElementById('track-art')?.getAttribute('src') || 'assets/music-cover.jpg';

    navigator.mediaSession.metadata = new MediaMetadata({
        title: document.getElementById('song-title')?.textContent?.trim() || config.musicTitle || 'Mahnı',
        artist: 'Hüseyn və Cəmalənin Dünyası',
        album: 'Legacy Player',
        artwork: [
            { src: legacyCover, sizes: '192x192', type: 'image/png' },
            { src: legacyCover, sizes: '512x512', type: 'image/png' }
        ]
    });

    navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing';

    if ('setPositionState' in navigator.mediaSession && Number.isFinite(audio.duration)) {
        try {
            navigator.mediaSession.setPositionState({
                duration: audio.duration || 0,
                playbackRate: audio.playbackRate || 1,
                position: audio.currentTime || 0
            });
        } catch (_) {}
    }
}

function updateMediaSessionMetadata(track) {
    if (!('mediaSession' in navigator) || !track) return;

    const artworkSrc = track.coverUrl || track.cover || DEFAULT_MUSIC_COVER;
    const resolvedArtwork = resolveMusicAssetUrl(artworkSrc, DEFAULT_MUSIC_COVER);

    navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'Adsız mahnı',
        artist: track.artist || 'Naməlum artist',
        album: 'Hüseyn və Cəmalənin Dünyası',
        artwork: [
            { src: resolvedArtwork, sizes: '96x96', type: 'image/png' },
            { src: resolvedArtwork, sizes: '128x128', type: 'image/png' },
            { src: resolvedArtwork, sizes: '192x192', type: 'image/png' },
            { src: resolvedArtwork, sizes: '256x256', type: 'image/png' },
            { src: resolvedArtwork, sizes: '384x384', type: 'image/png' },
            { src: resolvedArtwork, sizes: '512x512', type: 'image/png' }
        ]
    });
}

function updateMediaSessionPlaybackState() {
    if (!('mediaSession' in navigator)) return;

    const dom = getMusicDom();
    if (!dom.audio) return;

    navigator.mediaSession.playbackState = dom.audio.paused ? 'paused' : 'playing';

    if ('setPositionState' in navigator.mediaSession) {
        try {
            navigator.mediaSession.setPositionState({
                duration: dom.audio.duration || 0,
                playbackRate: dom.audio.playbackRate || 1,
                position: dom.audio.currentTime || 0
            });
        } catch (_) {}
    }
}
async function openMusicTrack(index) {
    const track = window.musicLibrary[index];
    const dom = getMusicDom();
    if (!track || !dom.audio) return;

    const wasExpanded = dom.activePlayer?.classList.contains('expanded') || false;
    const wasLyricsOpen = dom.activePlayer?.classList.contains('lyrics-open') || false;

    const mainAudio = document.getElementById("audio");

    if (mainAudio && !mainAudio.paused) {
        mainAudio.pause();
        mainAudio.currentTime = mainAudio.currentTime || 0;
        isPlaying = false;
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        document.getElementById('track-art')?.classList.remove('playing');
    }

    if (!dom.audio.paused && dom.audio.src) {
        dom.audio.pause();
    }

    window.currentMusic = track;
    window.currentMusicIndex = index;
    updateMediaSessionMetadata(track);

    await animateTextSwap(track);

    dom.audio.pause();
    dom.audio.crossOrigin = 'anonymous';
    dom.audio.playsInline = true;
    dom.audio.setAttribute('playsinline', 'true');
    dom.audio.src = track.audioUrl;
    dom.audio.load();
    dom.audio.currentTime = 0;
    dom.audio.volume = Number(dom.volumeSlider?.value || 0.85);
    dom.audio.muted = false;

    if (dom.seekbar) dom.seekbar.value = 0;
    if (dom.currentTime) dom.currentTime.textContent = '00:00';
    if (dom.duration) dom.duration.textContent = '00:00';

    renderCurrentTrackLyrics(track);
    renderMusicPlaylist();
    updateMusicCover(track);
    animateTrackChange();
    runMorphTransition(track);

    if (dom.activePlayer) {
        dom.activePlayer.style.display = 'block';
        setPlayerExpanded(wasExpanded);

        if (wasExpanded && wasLyricsOpen) {
            window.toggleLyricsPanel(true);
        } else if (dom.lyricsPanel) {
            dom.lyricsPanel.classList.add('lyrics-hidden');
            dom.activePlayer.classList.remove('lyrics-open');
            dom.lyricsPanel.setAttribute('aria-hidden', 'true');
            updateLyricsToggleState();
        }
    }

    try {
        await unlockYTPlayback();
        await dom.audio.play();
    } catch (err) {
        console.error('Music play error:', err);
    }

    updateMusicPlayButtonState();
    updateMediaSessionPlaybackState();
}
function playPrevMusic() {
    if (!window.musicLibrary.length) return;
    const newIndex = window.currentMusicIndex <= 0
        ? window.musicLibrary.length - 1
        : window.currentMusicIndex - 1;
        
    // Düzəliş edilən hissə:
    openMusicTrack(newIndex);
}

function playNextMusic() {
    if (!window.musicLibrary.length) return;
    const newIndex = window.currentMusicIndex >= window.musicLibrary.length - 1
        ? 0
        : window.currentMusicIndex + 1;
        
    // Düzəliş edilən hissə:
    openMusicTrack(newIndex);
}

function initPlayerSwipe() {
    const { activePlayer } = getMusicDom();
    if (!activePlayer) return;
    if (activePlayer.dataset.swipeBound === '1') return;

    activePlayer.dataset.swipeBound = '1';

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    activePlayer.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];
        startX = touch.clientX;
        startY = touch.clientY;
    }, { passive: true });

    activePlayer.addEventListener('touchend', (e) => {
        const touch = e.changedTouches[0];
        endX = touch.clientX;
        endY = touch.clientY;

        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) < 50) return;
        if (Math.abs(diffY) > Math.abs(diffX)) return;

        if (diffX < 0) {
            activePlayer.classList.remove('swiping-prev');
            activePlayer.classList.add('swiping-next');
            setTimeout(() => activePlayer.classList.remove('swiping-next'), 280);
            playNextMusic();
        } else {
            activePlayer.classList.remove('swiping-next');
            activePlayer.classList.add('swiping-prev');
            setTimeout(() => activePlayer.classList.remove('swiping-prev'), 280);
            playPrevMusic();
        }
    }, { passive: true });
}
let ytWaveCtx = null;
let ytWaveAnalyser = null;
let ytWaveSource = null;
let ytWaveAnimationId = null;
let ytWaveDataArray = null;
let ytWaveEnabled = false;
let ytWaveInitialized = false;
let ytWaveFallbackMode = false;

async function ensureYTAudioReady() {
    const { audio } = getMusicDom();
    if (!audio) return false;

    audio.crossOrigin = 'anonymous';
    audio.playsInline = true;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        ytWaveFallbackMode = true;
        return false;
    }

    if (!ytWaveCtx) {
        try {
            ytWaveCtx = new AudioCtx();
        } catch (err) {
            console.error('AudioContext yaradıla bilmədi:', err);
            ytWaveFallbackMode = true;
            return false;
        }
    }

    if (ytWaveCtx.state === 'suspended') {
        try {
            await ytWaveCtx.resume();
        } catch (err) {
            console.error('AudioContext resume alınmadı:', err);
        }
    }

    return ytWaveCtx.state === 'running';
}

async function initYTWaveformSafe() {
    const { audio, waveform } = getMusicDom();
    if (!audio || !waveform) return false;
    if (ytWaveInitialized) return true;

    const ready = await ensureYTAudioReady();
    if (!ready || !ytWaveCtx) {
        ytWaveFallbackMode = true;
        return false;
    }

    try {
        const analyser = ytWaveCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;

        const source = ytWaveCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ytWaveCtx.destination);

        ytWaveAnalyser = analyser;
        ytWaveSource = source;
        ytWaveDataArray = new Uint8Array(analyser.frequencyBinCount);
        ytWaveInitialized = true;
        ytWaveEnabled = true;
        ytWaveFallbackMode = false;

        drawYTWaveform();
        return true;
    } catch (err) {
        console.error('Waveform init xətası:', err);
        ytWaveFallbackMode = true;
        ytWaveEnabled = false;
        return false;
    }
}

async function unlockYTPlayback() {
    const ok = await ensureYTAudioReady();
    if (!ok) return false;
    await initYTWaveformSafe();
    return true;
}
async function initYTWaveform() {
    return await initYTWaveformSafe();
}
function drawYTWaveform() {
    const { waveform, audio } = getMusicDom();
    if (!waveform) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = waveform.getBoundingClientRect();
    waveform.width = Math.max(1, Math.floor(rect.width * dpr));
    waveform.height = Math.max(1, Math.floor(rect.height * dpr));

    const ctx = waveform.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const render = () => {
        const width = waveform.clientWidth;
        const height = waveform.clientHeight;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);

        const totalBars = 42;
        const gap = 4;
        const barWidth = Math.max(3, (width - (totalBars - 1) * gap) / totalBars);
        const totalWidth = totalBars * barWidth + (totalBars - 1) * gap;
        let x = (width - totalWidth) / 2;

        const drawBar = (x, y, w, h, radius) => {
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x, y, w, h, radius);
            } else {
                ctx.rect(x, y, w, h);
            }
            ctx.fill();
        };

        if (
            ytWaveEnabled &&
            ytWaveAnalyser &&
            ytWaveDataArray &&
            audio &&
            !audio.paused &&
            !ytWaveFallbackMode
        ) {
            ytWaveAnalyser.getByteFrequencyData(ytWaveDataArray);

            ctx.shadowBlur = 18;
            ctx.shadowColor = currentWaveColor;

            for (let i = 0; i < totalBars; i++) {
                const sourceIndex = Math.floor((i / totalBars) * ytWaveDataArray.length);
                const value = ytWaveDataArray[sourceIndex] / 255;

                const falloff = 1 - Math.abs((i - totalBars / 2) / (totalBars / 2)) * 0.35;
                const visual = Math.max(0.18, value * falloff);

                const barHeight = Math.max(8, visual * height * 0.82);

                const alpha = 0.22 + visual * 0.9;
                ctx.fillStyle = currentWaveColor
                    .replace("rgb", "rgba")
                    .replace(")", `, ${alpha})`);

                drawBar(
                    x,
                    centerY - barHeight / 2,
                    barWidth,
                    barHeight,
                    barWidth / 2
                );

                x += barWidth + gap;
            }
        } else {
            for (let i = 0; i < totalBars; i++) {
                const phase = (Date.now() / 180) + i * 0.35;
                const idle = 0.22 + (Math.sin(phase) + 1) / 2 * 0.22;
                const barHeight = Math.max(6, idle * height * 0.45);

                ctx.fillStyle = currentWaveColor
                    .replace("rgb", "rgba")
                    .replace(")", ", 0.16)");

                drawBar(
                    x,
                    centerY - barHeight / 2,
                    barWidth,
                    barHeight,
                    barWidth / 2
                );

                x += barWidth + gap;
            }
        }

        ytWaveAnimationId = requestAnimationFrame(render);
    };

    if (ytWaveAnimationId) cancelAnimationFrame(ytWaveAnimationId);
    render();
}
function resizeYTWaveform() {
    if (!ytWaveAnalyser) return;
    drawYTWaveform();
}
function initMusicPlayerEvents() {
    const dom = getMusicDom();
    const unlockHandler = async () => {
        await unlockYTPlayback();
    };

    dom.playBtnFull?.addEventListener('touchstart', unlockHandler, { passive: true });
    dom.playBtnMini?.addEventListener('touchstart', unlockHandler, { passive: true });
    dom.prevBtn?.addEventListener('touchstart', unlockHandler, { passive: true });
    dom.prevBtnMini?.addEventListener('touchstart', unlockHandler, { passive: true });
    dom.nextBtn?.addEventListener('touchstart', unlockHandler, { passive: true });
    dom.nextBtnMini?.addEventListener('touchstart', unlockHandler, { passive: true });
    dom.openFullBtn?.addEventListener('touchstart', unlockHandler, { passive: true });
    dom.progressWrap?.addEventListener('touchstart', unlockHandler, { passive: true });
    dom.seekbar?.addEventListener('touchstart', unlockHandler, { passive: true });
    if (!dom.activePlayer || !dom.audio) return;
    if (dom.activePlayer.dataset.bound === '1') return;
    dom.activePlayer.dataset.bound = '1';
    drawYTWaveform();
    window.addEventListener('resize', resizeYTWaveform);
    const togglePlay = async () => {
        if (!dom.audio.src && window.musicLibrary.length) {
            await openMusicTrack(0);
            return;
        }

        if (dom.audio.paused) {
            await unlockYTPlayback();

            try {
                await dom.audio.play();
            } catch (err) {
                console.error('Play xətası:', err);
            }
        } else {
            dom.audio.pause();
        }

        updateMusicPlayButtonState();
        updateMediaSessionPlaybackState();
    };
    dom.lyricsContainer?.addEventListener('click', (e) => {
        if (window.currentMusicLyricsType !== 'synced') return;

        const wordEl = e.target.closest('.yt-lyrics-word');
        if (wordEl) {
            const wordTime = Number(wordEl.dataset.wordTime);
            seekToLyricsTime(wordTime);
            return;
        }

        const lineEl = e.target.closest('.yt-lyrics-line');
        if (lineEl) {
            const lineTime = Number(lineEl.dataset.lineTime);
            seekToLyricsTime(lineTime);
        }
    });
    dom.openFullBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.togglePlayerMode(true);
    });

    dom.expandHitbox?.addEventListener('click', () => {
        window.togglePlayerMode(true);
    });

    dom.minimizeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.togglePlayerMode(false);
    });

    dom.lyricsToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.toggleLyricsPanel();
    });

    dom.closeLyricsBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.toggleLyricsPanel(false);
    });

    dom.playBtnFull?.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
    });

    dom.playBtnMini?.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
    });

    dom.prevBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        playPrevMusic();
    });

    dom.prevBtnMini?.addEventListener('click', (e) => {
        e.stopPropagation();
        playPrevMusic();
    });

    dom.nextBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        playNextMusic();
    });

    dom.nextBtnMini?.addEventListener('click', (e) => {
        e.stopPropagation();
        playNextMusic();
    });

    dom.audio.addEventListener('timeupdate', () => {
        if (dom.seekbar) dom.seekbar.value = dom.audio.currentTime || 0;
        if (dom.currentTime) dom.currentTime.textContent = formatMusicTime(dom.audio.currentTime);
        updateSyncedLyricsByTime(dom.audio.currentTime);
        updateMediaSessionPlaybackState();
    });

    dom.audio.addEventListener('loadedmetadata', () => {
        if (dom.seekbar) dom.seekbar.max = dom.audio.duration || 0;
        if (dom.duration) dom.duration.textContent = formatMusicTime(dom.audio.duration);
        updateMediaSessionPlaybackState();
    });

    dom.audio.addEventListener('play', () => {
        if (audio && !audio.paused) {
            audio.pause();
        }
        updateMusicPlayButtonState();
        updateMediaSessionPlaybackState();
    });
    dom.audio.addEventListener('pause', () => {
        updateMusicPlayButtonState();
        updateMediaSessionPlaybackState();
    });
    dom.audio.addEventListener('ended', () => {
        updateMusicPlayButtonState();
        updateMediaSessionPlaybackState();
        playNextMusic();
    });

    dom.seekbar?.addEventListener('input', () => {
        dom.audio.currentTime = Number(dom.seekbar.value);
        updateSyncedLyricsByTime(dom.audio.currentTime);
    });

    dom.volumeSlider?.addEventListener('input', (e) => {
        updateVolumeUi(e.target.value);
    });

    updateVolumeUi(dom.volumeSlider?.value || 0.85);
    updateMusicPlayButtonState();
    updateMediaSessionPlaybackState();
}

async function initMusicPage() {
    try {
        initMusicPlayerEvents();
        window.musicLibrary = await fetchMusicJsonList();
        renderMusicPlaylist();
        syncAdminOverview();
    } catch (err) {
        console.error(err);
        const { playlist, trackCount } = getMusicDom();
        if (playlist) {
            playlist.innerHTML = `
                <div class="music-empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Musiqilər yüklənmədi.</span>
                </div>
            `;
        }
        if (trackCount) trackCount.textContent = '0 mahnı';
    }
}

document.addEventListener('DOMContentLoaded', initMusicPage);
function seekToLyricsTime(time) {
    const { audio } = getMusicDom();
    if (!audio || Number.isNaN(Number(time))) return;
    const safeTime = Math.max(0, Number(time));
    audio.currentTime = safeTime;
    updateSyncedLyricsByTime(safeTime);
    if (audio.paused) {
        audio.play().catch(err => console.error('Lyrics seek play error:', err));
    }
}
if (window.matchMedia("(pointer: fine)").matches) {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    let trails = [];
    for (let i = 0; i < 8; i++) {
        let trail = document.createElement('div');
        trail.className = 'cursor-trail';
        document.body.appendChild(trail);
        trails.push({ el: trail, x: 0, y: 0 });
    }
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });
    gsap.ticker.add(() => {
        let x = mouseX, y = mouseY;
        trails.forEach((trail, index) => {
            let nextTrail = trails[index + 1] || trails[0];
            x += (nextTrail.x - x) * 0.4;
            y += (nextTrail.y - y) * 0.4;
            trail.x = x; trail.y = y;
            trail.el.style.left = x + 'px';
            trail.el.style.top = y + 'px';
            trail.el.style.opacity = 1 - (index / trails.length);
        });
    });
    document.querySelectorAll('a, button, .photo-frame, .note-card, .yt-track-item').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
}



function formatAdminDateTimeLocal(dateLike) {
    const d = new Date(dateLike);
    if (isNaN(d)) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;
    adminPanel.style.display = 'flex';
    syncAdminOverview();
}

function closeAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;
    adminPanel.style.display = 'none';
}

function syncAdminOverview() {
    const meetingStat = document.getElementById('admin-stat-meetings');
    const targetStat = document.getElementById('admin-stat-target');
    const imageStat = document.getElementById('admin-stat-image');
    const audioStat = document.getElementById('admin-stat-audio');
    const dateInput = document.getElementById('admin-date');
    const countInput = document.getElementById('admin-count');
    const musicTitleInput = document.getElementById('admin-music-title');
    const musicArtistInput = document.getElementById('admin-music-artist');
    const imageFile = document.getElementById('admin-file')?.files?.[0];
    const audioFile = document.getElementById('admin-music-file')?.files?.[0];
    const coverFile = document.getElementById('admin-music-cover')?.files?.[0];

    const imagePreview = document.getElementById('admin-dashboard-image-preview');
    const imageName = document.getElementById('admin-dashboard-image-name');
    const imageDate = document.getElementById('admin-dashboard-image-date');
    const imageTotalEl = document.getElementById('admin-dashboard-total-images');

    const musicCover = document.getElementById('admin-dashboard-music-cover');
    const musicName = document.getElementById('admin-dashboard-music-name');
    const musicArtist = document.getElementById('admin-dashboard-music-artist');
    const musicTotalEl = document.getElementById('admin-dashboard-total-music');

    const totalImages = Array.isArray(window.allImages) ? window.allImages.length : 0;
    const totalMusic = Array.isArray(window.musicLibrary) ? window.musicLibrary.length : 0;
    const latestImage = totalImages ? window.allImages[window.allImages.length - 1] : null;
    const latestTrack = totalMusic ? window.musicLibrary[0] : null;

    if (meetingStat) meetingStat.textContent = String(config.meetingCount ?? 0);
    if (targetStat) targetStat.textContent = formatAzDate(targetDate);
    if (imageStat) imageStat.textContent = totalImages ? `${totalImages} fayl` : (imageFile ? imageFile.name : '0 fayl');

    if (audioStat) {
        if (totalMusic) {
            audioStat.textContent = `${totalMusic} fayl`;
        } else if (audioFile) {
            audioStat.textContent = audioFile.name;
        } else if (musicTitleInput?.value.trim()) {
            audioStat.textContent = musicTitleInput.value.trim();
        } else {
            audioStat.textContent = '0 fayl';
        }
    }

    if (imageTotalEl) imageTotalEl.textContent = `${totalImages} şəkil`;
    if (musicTotalEl) musicTotalEl.textContent = `${totalMusic} musiqi`;

    if (imagePreview) {
        if (imageFile) {
            const localImageUrl = URL.createObjectURL(imageFile);
            imagePreview.src = localImageUrl;
            imagePreview.onload = () => URL.revokeObjectURL(localImageUrl);
        } else if (latestImage?.download_url) {
            imagePreview.src = latestImage.download_url;
        } else {
            imagePreview.src = 'assets/512.png';
        }
    }

    if (imageName) {
        imageName.textContent = imageFile?.name || latestImage?.name || 'Şəkil yoxdur';
    }

    if (imageDate) {
        const rawDate = latestImage?.git_date || parseImageDate(latestImage || {});
        imageDate.textContent = imageFile
            ? 'Yeni şəkil seçilib'
            : (rawDate ? formatAzDate(rawDate) : 'Tarix bilinmir');
    }

    if (musicCover) {
        if (coverFile) {
            const localCoverUrl = URL.createObjectURL(coverFile);
            musicCover.src = localCoverUrl;
            musicCover.onload = () => URL.revokeObjectURL(localCoverUrl);
        } else if (latestTrack?.coverUrl) {
            musicCover.src = latestTrack.coverUrl;
        } else {
            musicCover.src = DEFAULT_MUSIC_COVER;
        }
    }

    if (musicName) {
        musicName.textContent = musicTitleInput?.value.trim() || latestTrack?.title || 'Musiqi yoxdur';
    }

    if (musicArtist) {
        musicArtist.textContent = musicArtistInput?.value.trim() || latestTrack?.artist || 'Artist bilinmir';
    }

    if (dateInput && !dateInput.value) {
        dateInput.value = formatAdminDateTimeLocal(targetDate);
    }
    if (countInput && !countInput.value) {
        countInput.value = String(config.meetingCount ?? '');
    }
}

function switchAdminSection(sectionName) {
    document.querySelectorAll('.admin-nav-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.adminSection === sectionName);
    });

    document.querySelectorAll('.admin-section').forEach((section) => {
        section.classList.toggle('active', section.dataset.adminSection === sectionName);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const closeAdminBtn = document.querySelector('.close-admin');
    const adminPanel = document.getElementById('admin-panel');

    if (closeAdminBtn && adminPanel) {
        closeAdminBtn.addEventListener('click', closeAdminPanel);
    }

    window.addEventListener('click', (event) => {
        if (event.target === adminPanel) {
            closeAdminPanel();
        }
    });

    document.querySelectorAll('.admin-nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => switchAdminSection(btn.dataset.adminSection));
    });

    document.querySelectorAll('[data-admin-jump]').forEach((btn) => {
        btn.addEventListener('click', () => switchAdminSection(btn.dataset.adminJump));
    });

    document.getElementById('admin-open-note-modal')?.addEventListener('click', () => {
        document.getElementById('open-add-note-btn')?.click();
    });

    document.getElementById('admin-open-note-modal-secondary')?.addEventListener('click', () => {
        document.getElementById('open-add-note-btn')?.click();
    });

    [
        'admin-file',
        'admin-music-file',
        'admin-music-title',
        'admin-date',
        'admin-count'
    ].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', syncAdminOverview);
        document.getElementById(id)?.addEventListener('input', syncAdminOverview);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && adminPanel?.style.display === 'flex') {
            closeAdminPanel();
        }
    });

    syncAdminOverview();
});

document.addEventListener('visibilitychange', async () => {
    const audio = document.getElementById('audio');
    if (!document.hidden && audio) {
        try { await audio.play(); } catch {}
    }
});
