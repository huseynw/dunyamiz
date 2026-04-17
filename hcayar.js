let targetDate = new Date();
let currentWaveColor = "rgb(255,255,255)";
const config = {
    githubUsername: "huseynw",
    repoName: "dunyamiz",
    firstMeetingDate: "2025-10-22T00:00:00",
    startDate: "2025-08-03T00:00:00",
    meetingCount: 0,
    musicTitle: "Gözlərin dəydi gözümə"
};
fetch("/.netlify/functions/config")
  .then(res => res.json())
  .then(data => {
    console.log(data);
  });

const SUPABASE_URL = "https://fctwtcakequqvvmjgbhr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHd0Y2FrZXF1cXZ2bWpnYmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjE2NzYsImV4cCI6MjA5MTczNzY3Nn0.EE7T4HgrPI5c7ChYu8VDtoQ3oXflkhKDE-wkFckrCeY";
let siteSettingsLoaded = false;

async function loadSiteSettings(force = false) {
    if (siteSettingsLoaded && !force) return;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=id,next_meeting_date,meeting_count`, {
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Accept": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || data?.error || 'Site settings yüklənmədi.');
        }

        const settings = Array.isArray(data) ? data[0] : data;
        if (!settings) return;

        if (settings.next_meeting_date) {
            targetDate = new Date(settings.next_meeting_date);
        }

        if (typeof settings.meeting_count === 'number') {
            config.meetingCount = settings.meeting_count;
        }

        siteSettingsLoaded = true;

        const meetEl = document.getElementById('meet-count');
        if (meetEl) {
            meetEl.innerText = config.meetingCount;
        }

        if (typeof updateMeetingTimer === 'function') {
            updateMeetingTimer();
        }

        if (typeof syncAdminOverview === 'function') {
            syncAdminOverview();
        }
    } catch (err) {
        console.error('Site settings yüklənmədi:', err);
    }
}

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

// ========== MOBILE BACKGROUND AUDIO FIX ==========
function resumeAudioContextSafely() {
    if (!audioContext) return;
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        resumeAudioContextSafely();
    }
});

window.addEventListener('pageshow', () => {
    resumeAudioContextSafely();
});

document.addEventListener('touchstart', () => {
    resumeAudioContextSafely();
}, { passive: true });

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
document.addEventListener('DOMContentLoaded', async () => {
    initSPANavigation();
    initAnalytics();
    setupMediaSession();
    await loadSiteSettings();
    const meetEl = document.getElementById('meet-count');
    if (meetEl) meetEl.innerText = config.meetingCount;

    updateCounter();
    updateMeetingTimer();
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
            await loadSiteSettings(true);
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

setInterval(createHeart, 500);

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
        }

        audioElement.addEventListener('play', resumeAudioContextSafely);
        audioElement.addEventListener('playing', resumeAudioContextSafely);

        canvas = document.getElementById('visualizer');
        if (!canvas) return;

        ctx = canvas.getContext('2d');
        if (!ctx) return;

        resizeVisualizerCanvas();
        window.addEventListener('resize', resizeVisualizerCanvas, { passive: true });

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

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

        resumeAudioContextSafely();

        if (!visualizerFrame) {
            draw();
        }
    } catch (e) {
        console.error('Vizualizator xətası:', e);
    }
}

// ========== MEETING TIMER ==========
function updateMeetingTimer() {
    if (!(targetDate instanceof Date) || Number.isNaN(targetDate.getTime())) return;

    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    const aylar = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
    const gun = targetDate.getDate();
    const ayAdi = aylar[targetDate.getMonth()];
    const saat = String(targetDate.getHours()).padStart(2, '0');
    const deqiqe = String(targetDate.getMinutes()).padStart(2, '0');
    const formatliTarix = `${gun} ${ayAdi} saat ${saat}:${deqiqe}`;

    const titleEl = document.querySelector('.meeting-timer h3');
    if (titleEl) titleEl.innerText = 'Növbəti Görüşümüzə Qalan Vaxt:';

    const dateEl = document.getElementById('next-meeting-date');
    if (dateEl) dateEl.innerText = 'Görüş vaxtı: ' + formatliTarix;

    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = String(value).padStart(2, '0');
    };

    if (diff <= 0) {
        if (titleEl) titleEl.innerText = 'Görüş vaxtı gəldi!';
        setValue('meet-days', 0);
        setValue('meet-hours', 0);
        setValue('meet-minutes', 0);
        setValue('meet-seconds', 0);
        return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    setValue('meet-days', d);
    setValue('meet-hours', h);
    setValue('meet-minutes', m);
    setValue('meet-seconds', s);
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

function createFileListFromSingleFile(file) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    return transfer.files;
}

function assignFileToInput(input, file) {
    if (!input || !file) return;
    input.files = createFileListFromSingleFile(file);
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

function setDropzoneState(dropzone, state = '', file = null) {
    if (!dropzone) return;
    dropzone.classList.toggle('is-dragover', state === 'dragover');
    dropzone.classList.toggle('is-filled', state === 'filled');

    const titleEl = dropzone.querySelector('strong');
    const subEl = dropzone.querySelector('span');

    if (state === 'filled' && file) {
        if (titleEl) titleEl.textContent = file.name;
        if (subEl) subEl.textContent = formatFileSize(file.size);
        return;
    }

    const defaults = {
        'admin-music-dropzone': {
            title: 'MP3 faylı bura sürüklə və burax',
            sub: 'Toxunub fayl seçə də bilərsən'
        },
        'admin-cover-dropzone': {
            title: 'Cover şəklini bura sürüklə və burax',
            sub: 'PNG, JPG, WEBP və digər şəkillər'
        }
    }[dropzone.id] || {};

    if (titleEl) titleEl.textContent = defaults.title || titleEl.dataset.defaultTitle || titleEl.textContent;
    if (subEl) subEl.textContent = defaults.sub || subEl.dataset.defaultSub || subEl.textContent;
}

function bindAdminDropzone(dropzoneId, inputId, options = {}) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    if (!dropzone || !input) return;

    const accept = Array.isArray(options.accept) ? options.accept : [];
    const validate = typeof options.validate === 'function' ? options.validate : (() => true);

    const onPick = () => input.click();
    dropzone.addEventListener('click', onPick);
    dropzone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            input.click();
        }
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropzone.classList.add('is-dragover');
        });
    });

    ['dragleave', 'dragend', 'drop'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (event) => {
            event.preventDefault();
            if (eventName !== 'drop') {
                dropzone.classList.remove('is-dragover');
            }
        });
    });

    dropzone.addEventListener('drop', (event) => {
        dropzone.classList.remove('is-dragover');
        const file = event.dataTransfer?.files?.[0];
        if (!file) return;

        const mimeOk = !accept.length || accept.some((item) => file.type.startsWith(item) || file.name.toLowerCase().endsWith(item));
        if (!mimeOk || !validate(file)) return;

        assignFileToInput(input, file);
        setDropzoneState(dropzone, 'filled', file);
    });

    input.addEventListener('change', () => {
        const file = input.files?.[0];
        setDropzoneState(dropzone, file ? 'filled' : '', file || null);
    });

    const titleEl = dropzone.querySelector('strong');
    const subEl = dropzone.querySelector('span');
    if (titleEl) titleEl.dataset.defaultTitle = titleEl.textContent;
    if (subEl) subEl.dataset.defaultSub = subEl.textContent;
}

function sanitizeMusicPart(value = '') {
    return String(value)
        .replace(/\[[^\]]*?\]/g, ' ')
        .replace(/\([^)]*?(official|audio|lyrics|video|prod|remix|version|clip)[^)]*?\)/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseTitleArtistFromFileName(fileName = '') {
    const raw = String(fileName).replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
    const cleaned = sanitizeMusicPart(raw);

    const parts = cleaned.split(/\s+-\s+|\s+–\s+|\s+—\s+/).map(sanitizeMusicPart).filter(Boolean);
    if (parts.length >= 2) {
        return {
            artist: parts[0],
            title: parts.slice(1).join(' - ')
        };
    }

    return {
        artist: '',
        title: cleaned
    };
}

function decodeId3TextFrame(frameBytes) {
    if (!frameBytes || !frameBytes.length) return '';
    const encoding = frameBytes[0];
    const body = frameBytes.slice(1);

    try {
        if (encoding === 0x00 || encoding === 0x03) {
            return new TextDecoder(encoding === 0x03 ? 'utf-8' : 'iso-8859-1')
                .decode(body)
                .replace(/
