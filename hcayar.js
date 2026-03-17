const targetDate = new Date("2026-03-15T13:31:00"); 

const config = {
    githubUsername: "huseynw",
    repoName: "dunyamiz",              
    firstMeetingDate: "2025-10-22T00:00:00",
    startDate: "2025-08-03T00:00:00", 
    meetingCount: 95,    
    musicTitle: "Gözlərin dəydi gözümə"
};

// Security - Disable right-click and dev tools
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if (e.keyCode == 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || 
        (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
        return false;
    }
};

setInterval(function() {
    checkDevTools();
}, 1000);

function checkDevTools() {
    const start = new Date();
    debugger; 
    const end = new Date();
    if (end - start > 100) {
        document.body.innerHTML = "<h1 style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Giriş Qadağandır! 🚱</h1>";
    }
}

setInterval(() => {
    console.clear();
}, 100);

// Audio Elements
const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('playPauseBtn');
const muteBtn = document.getElementById('muteBtn');
const seekBar = document.getElementById('seekBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

let allImages = []; 
let currentImgIdx = 0;
let isPlaying = false;

// ========== SPA NAVIGATION ==========
function initSPANavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.spa-page');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');
            
            // Update nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Animate page transition
            pages.forEach(page => {
                if (page.classList.contains('active')) {
                    page.classList.add('exit-up');
                    setTimeout(() => {
                        page.classList.remove('active', 'exit-up');
                    }, 300);
                }
            });
            
            // Show target page with animation
            setTimeout(() => {
                const targetElement = document.getElementById(`page-${targetPage}`);
                if (targetElement) {
                    targetElement.classList.add('active');
                }
            }, 150);
        });
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initSPANavigation();
    
    const meetEl = document.getElementById('meet-count');
    if(meetEl) meetEl.innerText = config.meetingCount;
    
    updateCounter();
    setInterval(updateCounter, 1000);

    // Letter modal - arxa fona klik edəndə bağla
    const letterModal = document.getElementById('letter-modal');
    if (letterModal) {
        letterModal.addEventListener('click', function(e) {
            if (e.target === letterModal) closeLetter();
        });
    }
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

verifyBtn.addEventListener('click', () => {
    const sfire = "030825";
    if (passInput.value === sfire) {
        setInterval(() => {
            const randomSimvollar = getDynamicPath();
            window.location.hash = `cemaleme-ozel-${randomSimvollar}`;
        }, 40);
        document.getElementById('welcome-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('welcome-screen').style.display = 'none';
            const mainContent = document.getElementById('main-content');
            mainContent.classList.remove('hidden');
            setTimeout(() => {
                mainContent.classList.add('animate-start');
            }, 100);
        }, 800);
        fetchImages();
        if (audio) {
            initVisualizer(audio);
            audio.play().then(() => {
                isPlaying = true;
                if(document.getElementById('track-art')) document.getElementById('track-art').classList.add('playing');
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }).catch(e => console.log("Musiqi gözləmədə..."));
        }
    } else {
        errorMsg.style.display = 'block';
        passInput.value = "";
        passInput.animate([
            { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }
        ], { duration: 200 });
    }
});

passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifyBtn.click();
});

// ========== TIME TOGETHER COUNTER (ASCENDING) ==========
let _daysAnimDone = false;
let _detailDaysAnimDone = false;

function animateCount(elementId, targetValue, duration) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const startTime = performance.now();
    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - progress) * (1 - progress);
        const current = Math.floor(eased * targetValue);
        el.innerText = current;
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.innerText = targetValue;
        }
    }
    requestAnimationFrame(step);
}

function updateCounter() {
    const start = new Date(config.startDate).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    
    if (isNaN(diff)) return;
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Main time together card (Home page)
    if (!_daysAnimDone) {
        _daysAnimDone = true;
        animateCount('total-days', d, 2000);
    } else {
        if(document.getElementById('total-days')) document.getElementById('total-days').innerText = d;
    }
    if(document.getElementById('hours')) document.getElementById('hours').innerText = h < 10 ? '0' + h : h;
    if(document.getElementById('minutes')) document.getElementById('minutes').innerText = m < 10 ? '0' + m : m;
    if(document.getElementById('seconds')) document.getElementById('seconds').innerText = s < 10 ? '0' + s : s;
    
    // Detailed time (Time page)
    if (!_detailDaysAnimDone) {
        _detailDaysAnimDone = true;
        animateCount('detail-days', d, 2000);
    } else {
        if(document.getElementById('detail-days')) document.getElementById('detail-days').innerText = d;
    }
    if(document.getElementById('detail-hours')) document.getElementById('detail-hours').innerText = h;
    if(document.getElementById('detail-minutes')) document.getElementById('detail-minutes').innerText = m;
    if(document.getElementById('detail-seconds')) document.getElementById('detail-seconds').innerText = s;
    
    // Total experience
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const totalMinutes = Math.floor(diff / (1000 * 60));
    
    if(document.getElementById('total-hours-love')) document.getElementById('total-hours-love').innerText = totalHours.toLocaleString();
    if(document.getElementById('total-minutes-love')) document.getElementById('total-minutes-love').innerText = totalMinutes.toLocaleString();
}

// ========== GALLERY ==========
async function fetchImages() {
    const stack = document.getElementById('gallery-stack');
    if(!stack) return;
    
    const url = `https://api.github.com/repos/${config.githubUsername}/${config.repoName}/contents/gallery`;
    try {
        const response = await fetch(url);
        const files = await response.json();
        allImages = files.filter(f => f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));
        
        if(allImages.length > 0) {
            let html = '';
            allImages.slice(-4).forEach((img, idx) => {
                html += `<img src="${img.download_url}" class="stack-item" style="z-index:${idx}">`;
            });
            stack.innerHTML = html;
            stack.onclick = () => openLightbox(allImages.length - 1);
        }
    } catch (e) {
        console.error("Qalereya xətası:", e);
    }
}

function changeImage(step) {
    if (allImages.length === 0) return;
    currentImgIdx = (currentImgIdx + step + allImages.length) % allImages.length;
    const lbImg = document.getElementById('lightbox-img');
    if (lbImg) {
        lbImg.style.opacity = "0"; 
        setTimeout(() => {
            lbImg.src = allImages[currentImgIdx].download_url;
            lbImg.style.opacity = "1";
        }, 150);
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

function openLightbox(index) {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const nBtn = document.getElementById('next-btn');
    const pBtn = document.getElementById('prev-btn');
    
    if (!lb || !lbImg) {
        console.error("Lightbox və ya Şəkil elementi tapılmadı!");
        return;
    }
    
    currentImgIdx = index;
    lbImg.src = allImages[currentImgIdx].download_url;
    lb.style.display = "flex";
    lb.classList.add('active');
    
    if (nBtn) {
        nBtn.onclick = (e) => { e.stopPropagation(); changeImage(1); };
    }
    if (pBtn) {
        pBtn.onclick = (e) => { e.stopPropagation(); changeImage(-1); };
    }
    
    const closeBtn = document.querySelector('.close-lightbox');
    if (closeBtn) {
        closeBtn.onclick = () => {
            lb.style.display = "none";
            lb.classList.remove('active');
        };
    }
}

// ========== HEART PARTICLES ==========
function createHeart() {
    const heart = document.createElement('div');
    heart.classList.add('heart-particle');
    heart.innerHTML = '🤍'; 
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.fontSize = Math.random() * 20 + 10 + "px";
    heart.style.duration = Math.random() * 2 + 3 + "s";
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

function openLetter(type) {
    if (!letters || !letters[type]) return; // Əgər məktub yoxdursa, heç nə etmə
    
    const modal = document.getElementById('letter-modal');
    const titleEl = document.getElementById('letter-title');
    const textEl = document.getElementById('letter-text');
    
    if (modal && titleEl && textEl) {
        // Mətnləri yenilə
        titleEl.innerText = letters[type].title;
        textEl.innerText = letters[type].text;
        
        // Modalı göstər (cssText əvəzinə birbaşa display istifadə edirik)
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Arxa fonun sürüşməsini dayandır
    }
}

function closeLetter() { 
    const modal = document.getElementById('letter-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Sürüşməni bərpa et
    }
}


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
let audioContext, analyser, source, canvas, ctx;

function initVisualizer(audioElement) {
    if (audioContext) return; 
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 64; 
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        canvas = document.getElementById('visualizer');
        if (!canvas) return;
        
        ctx = canvas.getContext('2d');
        
        function draw() {
            requestAnimationFrame(draw); 
            analyser.getByteFrequencyData(dataArray); 
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
            
            const barWidth = (canvas.width / bufferLength) * 2;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2.5; 
                ctx.fillStyle = `rgba(254, 118, 150, ${barHeight / 100 + 0.4})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = "#D1123F";
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 2; 
            }
        }
        draw();
    } catch (e) {
        console.error("Vizualizator xətası:", e);
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
if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: config.musicTitle,
        artist: 'Hüseyn Məmmədov',
        album: 'Cəmaləm üçün',
        artwork: [
            { src: 'assets/192.png', sizes: '192x192', type: 'image/png' }
        ]
    });
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
}

document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isPlaying) {
        audio.play().catch(e => console.log("Yenidən başlatma cəhdi..."));
    }
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

if(audio) {
    audio.addEventListener('loadedmetadata', () => {
        seekBar.max = Math.floor(audio.duration);
        durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
        seekBar.value = Math.floor(audio.currentTime);
        currentTimeEl.textContent = formatTime(audio.currentTime);
    });

    seekBar.addEventListener('input', () => {
        audio.currentTime = seekBar.value;
    });

    playPauseBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
        } else {
            audio.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
        }
    });

    muteBtn.addEventListener('click', () => {
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
        document.getElementById('admin-panel').style.display = 'flex';
        clicks = 0;
    }
    clickTimer = setTimeout(() => { clicks = 0; }, 500); 
});

async function handleAdminUpdate(type) {
    const password = document.getElementById('admin-password').value;
    if (!password) return alert("Şifrəni daxil et!");
    
    let requestPayload = { path: "" };
    
    if (type === 'update_config') {
        const newDate = document.getElementById('admin-date').value;
        const newCount = document.getElementById('admin-count').value;
        if (!newDate && !newCount) return alert("Dəyişiklik yoxdur!");
        requestPayload = { 
            path: "hcayar.js", 
            newDate: newDate, 
            newCount: newCount 
        };
    } 
    else if (type === 'upload_image') {
        const fileInput = document.getElementById('admin-file');
        const file = fileInput.files[0];
        if (!file) return alert("Şəkil seçin!");
        
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
        
        requestPayload = { 
            path: `gallery/${Date.now()}_${file.name.replace(/\s+/g, '_')}`, 
            content: base64 
        };
    }
    
    try {
        const response = await fetch('/.netlify/functions/admin-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, password, payload: requestPayload })
        });
        const result = await response.json();
        if (result.success) {
            alert("Uğurla yerinə yetirildi!");
            location.reload();
        } else {
            alert("Xəta baş verdi. Şifrəni və ya Netlify loglarını yoxlayın.");
        }
    } catch (err) {
        alert("Serverə qoşulmaq mümkün olmadı.");
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
        if (!statusText) return;
        
        let message = "";
        let bgColor = "#000000"; 
        
        if ([0, 1].includes(code)) {
            message = `Bakıda hava tərtəmizdir (${temp}°C) - Sənin kimi... ☀️`;
            bgColor = "#0a0a0a";
        } else if ([2, 3].includes(code)) {
            message = `Bakı bu gün bir az buludludur (${temp}°C) ☁️`;
            bgColor = "#111111";
        } else if ([45, 48].includes(code)) {
            message = `Hər tərəf dumanlıdır (${temp}°C), amma məni görürəm 🌫️`;
            bgColor = "#2c3e50";
        } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
            message = `Bakıda yağış yağır (${temp}°C). Əynini qalın geyin çöldə tufan var... 🌧️`;
            bgColor = "#1e272e";
        } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
            message = `Hava qarlıdır (${temp}°C) ❄️ Tenin kimi`;
            bgColor = "#2f3640";
        } else if ([95, 96, 99].includes(code)) {
            message = `İldırım çaxır (${temp}°C)! Qorxma, mən həmişə yanındayam ⚡`;
            bgColor = "#0f141a";
        } else {
            message = `Bakıda hava bir qəribədir (${temp}°C), amma sənə olan sevgim dəyişməz 🤍`;
        }
        
        statusText.innerText = message;
        document.body.style.transition = "background 2s ease";
        document.body.style.backgroundColor = bgColor;
    } catch (err) {
        console.error("Hava məlumatı alınmadı.");
    }
}

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
    const uploadBtn = document.getElementById('upload-image-btn');

    if (updateBtn) {
        updateBtn.onclick = () => handleAdminUpdate('update_config');
    }
    if (uploadBtn) {
        uploadBtn.onclick = () => handleAdminUpdate('upload_image');
    }
});
