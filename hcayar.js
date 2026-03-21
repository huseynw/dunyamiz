const targetDate = new Date("2026-03-31T13:10:00"); 

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

window.allImages = []; 
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
            
            // --- ANIMASİYA BAŞLANĞICI ---
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
            // ----------------------------

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
function formatAzDate(dateIso) {
    const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
    const d = new Date(dateIso);
    if (isNaN(d)) return "Tarix bilinmir";
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
async function fetchImages() {
    const stack = document.getElementById('gallery-stack');
    if(!stack) return;
    
    stack.className = 'modern-gallery-grid';
    stack.innerHTML = '<p style="text-align:center; width:100%; color: white;"><i class="fas fa-spinner fa-spin"></i> Xatirələr yüklənir...</p>';
    
    const url = `https://api.github.com/repos/${config.githubUsername}/${config.repoName}/contents/gallery`;
    
    try {
        const response = await fetch(url);
        const files = await response.json();
        
        // Şəkilləri süzürük və QLOBAL massivə yazırıq
        window.allImages = files.filter(f => f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));
        
        if(window.allImages.length > 0) {
            let html = '';
            window.allImages.forEach((img, idx) => {
                html += `
                    <div class="photo-frame gallery-item" data-index="${idx}">
                        <img src="${img.download_url}" loading="lazy" alt="Bizim Xatirəmiz">
                        <div class="hover-heart"><i class="fas fa-heart"></i></div>
                    </div>
                `;
            });
            stack.innerHTML = html;

            // Klikləri bağlayırıq
            document.querySelectorAll('.gallery-item').forEach(item => {
                item.onclick = function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    window.openLightbox(index);
                };
            });
        } else {
            stack.innerHTML = '<p style="text-align:center; color: white;">Hələ ki, şəkil yoxdur.</p>';
        }
    } catch (e) {
        console.error("Fetch xətası:", e);
        stack.innerHTML = '<p style="text-align:center; color: white;">Sistem xətası!</p>';
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
    if (dateEl) dateEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Tarix alınır...`;

    try {
        const repo = `${config.githubUsername}/${config.repoName}`;
        const res = await fetch(`https://api.github.com/repos/${repo}/commits?path=gallery/${imgData.name}&per_page=1`);
        const commitData = await res.json();
        if (commitData[0] && dateEl) {
            dateEl.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatAzDate(commitData[0].commit.committer.date)}`;
        }
    } catch (err) {
        if (dateEl) dateEl.innerHTML = `<i class="far fa-calendar-alt"></i> Tarix tapılmadı`;
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

// DOMContentLoaded içində isə belə çağır:
document.getElementById('download-btn')?.addEventListener('click', () => {
    const imgData = window.allImages[currentImgIdx];
    if (imgData) {
        downloadImageFile(imgData.download_url, imgData.name);
    }
});
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
        const res = await fetch(url);
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
        const pass = prompt("Admin şifrəsi:");

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
