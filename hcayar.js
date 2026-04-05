const targetDate = new Date("2026-04-04T13:00:00"); 

const config = {
    githubUsername: "huseynw",
    repoName: "dunyamiz",              
    firstMeetingDate: "2025-10-22T00:00:00",
    startDate: "2025-08-03T00:00:00", 
    meetingCount: 97,    
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
        //setInterval(() => {
          //  const randomSimvollar = getDynamicPath();
            //window.location.hash = `cemaleme-ozel-${randomSimvollar}`;
        //}, 40);
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
    if (!stack) return;

    stack.className = 'memory-timeline';
    stack.innerHTML = '<p style="text-align:center; width:100%; color: white;"><i class="fas fa-spinner fa-spin"></i> Xatirələr yüklənir...</p>';

    const url = `https://api.github.com/repos/${config.githubUsername}/${config.repoName}/contents/gallery`;

    try {
        const response = await fetch(url);
        const files = await response.json();

        window.allImages = files.filter(f => f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));

        if (!window.allImages.length) {
            stack.innerHTML = '<p style="text-align:center; color: white;">Hələ ki, şəkil yoxdur.</p>';
            return;
        }

        const repo = `${config.githubUsername}/${config.repoName}`;

        const imagesWithDates = await Promise.all(
            window.allImages.map(async (img, idx) => {
                let commitDate = null;

                try {
                    const res = await fetch(`https://api.github.com/repos/${repo}/commits?path=gallery/${img.name}&per_page=1`);
                    const commitData = await res.json();

                    if (Array.isArray(commitData) && commitData[0]?.commit?.committer?.date) {
                        commitDate = commitData[0].commit.committer.date;
                    }
                } catch (e) {
                    commitDate = null;
                }

                return {
                    ...img,
                    originalIndex: idx,
                    commitDate
                };
            })
        );

        imagesWithDates.sort((a, b) => {
            const aTime = a.commitDate ? new Date(a.commitDate).getTime() : 0;
            const bTime = b.commitDate ? new Date(b.commitDate).getTime() : 0;
            return aTime - bTime;
        });

        window.allImages = imagesWithDates;

        stack.innerHTML = imagesWithDates.map((img, idx) => {
            const side = idx % 2 === 0 ? 'left' : 'right';
            const formattedDate = img.commitDate ? formatAzDate(img.commitDate) : 'Tarix bilinmir';

            return `
                <div class="timeline-item ${side}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-date">
                        <i class="far fa-calendar-alt"></i>
                        <span>${formattedDate}</span>
                    </div>

                    <div class="timeline-card gallery-item" data-index="${idx}">
                        <img src="${img.download_url}" loading="lazy" alt="Bizim Xatirəmiz">
                        <div class="hover-heart"><i class="fas fa-heart"></i></div>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.gallery-item').forEach(item => {
            item.onclick = function() {
                const index = parseInt(this.getAttribute('data-index'));
                window.openLightbox(index);
            };
        });

        initTimelineReveal();

    } catch (e) {
        console.error("Fetch xətası:", e);
        stack.innerHTML = '<p style="text-align:center; color: white;">Sistem xətası!</p>';
    }
}
function initTimelineReveal() {
    const items = document.querySelectorAll('.timeline-item');
    if (!items.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, {
        threshold: 0.18
    });

    items.forEach((item) => observer.observe(item));
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
window.musicQueue = [];
window.currentQueueIndex = -1;
window.playerTouch = {
    startX: 0,
    startY: 0,
    moved: false
};
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
async function handleAdminUpdate(type) {
    const password = document.getElementById('admin-password').value.trim();
    if (!password) {
        setAdminStatus('Şifrəni daxil et!', 'error');
        return alert('Şifrəni daxil et!');
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
        playerBlur: document.getElementById('yt-player-bg-blur'),
        queuePanel: document.getElementById('yt-queue-panel'),
        queueList: document.getElementById('yt-queue-list'),
        queueToggle: document.getElementById('yt-queue-toggle'),
        closeQueueBtn: document.getElementById('yt-close-queue'),
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
        rotatingDisc: document.getElementById('yt-rotating-disc')
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
    const response = await fetch(url);
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

async function updateMusicCover(track) {
    const { coverFull, coverMini, playerBlur } = getMusicDom();

    const setCover = (src) => {
        if (coverFull) coverFull.src = src;
        if (coverMini) coverMini.src = src;
        if (playerBlur) playerBlur.style.backgroundImage = `url("${src}")`;

        const playlistThumb = document.querySelector(`.yt-track-item[data-music-index="${window.currentMusicIndex}"] .yt-track-thumb`);
        if (playlistThumb) playlistThumb.src = src;

        const queueThumb = document.querySelector(`.yt-queue-item[data-queue-index="${window.currentQueueIndex}"] img`);
        if (queueThumb) queueThumb.src = src;
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
function ensureQueueBuilt(startIndex = 0) {
    if (!Array.isArray(window.musicLibrary) || !window.musicLibrary.length) return;

    if (!Array.isArray(window.musicQueue) || !window.musicQueue.length) {
        window.musicQueue = [...window.musicLibrary];
        window.currentQueueIndex = startIndex;
    }
}

function rebuildQueueFromIndex(startIndex = 0) {
    if (!Array.isArray(window.musicLibrary) || !window.musicLibrary.length) return;

    window.musicQueue = [
        ...window.musicLibrary.slice(startIndex),
        ...window.musicLibrary.slice(0, startIndex)
    ];

    window.currentQueueIndex = 0;
    renderQueueList();
}

function renderQueueList() {
    const { queueList } = getMusicDom();
    if (!queueList) return;

    if (!window.musicQueue.length) {
        queueList.innerHTML = `<div class="yt-lyrics-empty">Queue boşdur</div>`;
        return;
    }

    queueList.innerHTML = window.musicQueue.map((track, index) => `
        <div class="yt-queue-item ${index === window.currentQueueIndex ? 'active' : ''}" data-queue-index="${index}">
            <img src="${track.coverUrl || 'assets/music-cover.jpg'}" alt="cover">
            <div class="yt-queue-meta">
                <strong>${track.title || 'Adsız mahnı'}</strong>
                <small>${track.artist || 'Naməlum artist'}</small>
            </div>
            <button class="yt-queue-action yt-queue-play" data-queue-index="${index}" type="button">
                <i class="fas fa-play"></i>
            </button>
            <button class="yt-queue-action yt-queue-remove" data-queue-index="${index}" type="button">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function openQueueTrack(queueIndex) {
    const track = window.musicQueue[queueIndex];
    if (!track) return;

    const libIndex = window.musicLibrary.findIndex(item => item.id === track.id);
    if (libIndex === -1) return;

    window.currentQueueIndex = queueIndex;
    openMusicTrack(libIndex);
    renderQueueList();
}

function removeFromQueue(queueIndex) {
    if (queueIndex < 0 || queueIndex >= window.musicQueue.length) return;
    const removingCurrent = queueIndex === window.currentQueueIndex;

    window.musicQueue.splice(queueIndex, 1);

    if (!window.musicQueue.length) {
        window.currentQueueIndex = -1;
        renderQueueList();
        return;
    }

    if (queueIndex < window.currentQueueIndex) {
        window.currentQueueIndex -= 1;
    } else if (removingCurrent) {
        if (window.currentQueueIndex >= window.musicQueue.length) {
            window.currentQueueIndex = 0;
        }
        openQueueTrack(window.currentQueueIndex);
        return;
    }

    renderQueueList();
}
async function openMusicTrack(index) {
    const track = window.musicLibrary[index];
    const dom = getMusicDom();
    if (!track || !dom.audio) return;
    ensureQueueBuilt(index);
    const clickedTrack = window.musicLibrary[index];
    const existingQueueIndex = window.musicQueue.findIndex(item => item.id === clickedTrack.id);
    if (existingQueueIndex !== -1) {
        window.currentQueueIndex = existingQueueIndex;
    } else {
        rebuildQueueFromIndex(index);
    }

    const wasExpanded = dom.activePlayer?.classList.contains('expanded') || false;
    const wasLyricsOpen = dom.activePlayer?.classList.contains('lyrics-open') || false;

    window.currentMusic = track;
    window.currentMusicIndex = index;

    if (dom.titleFull) dom.titleFull.textContent = track.title || 'Adsız mahnı';
    if (dom.artistFull) dom.artistFull.textContent = track.artist || 'Naməlum artist';
    if (dom.titleMini) dom.titleMini.textContent = track.title || 'Adsız mahnı';
    if (dom.artistMini) dom.artistMini.textContent = track.artist || 'Naməlum artist';

    dom.audio.src = track.audioUrl;
    dom.audio.currentTime = 0;

    if (dom.seekbar) dom.seekbar.value = 0;
    if (dom.currentTime) dom.currentTime.textContent = '00:00';
    if (dom.duration) dom.duration.textContent = '00:00';

    renderCurrentTrackLyrics(track);
    renderMusicPlaylist();
    renderQueueList();
    updateMusicCover(track);

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
        await dom.audio.play();
    } catch (err) {
        console.error('Music play error:', err);
    }

    updateMusicPlayButtonState();
}
function playPrevMusic() {
    ensureQueueBuilt(window.currentMusicIndex || 0);
    if (!window.musicQueue.length) return;

    const newIndex = window.currentQueueIndex <= 0
        ? window.musicQueue.length - 1
        : window.currentQueueIndex - 1;

    openQueueTrack(newIndex);
}

function playNextMusic() {
    ensureQueueBuilt(window.currentMusicIndex || 0);
    if (!window.musicQueue.length) return;

    const newIndex = window.currentQueueIndex >= window.musicQueue.length - 1
        ? 0
        : window.currentQueueIndex + 1;

    openQueueTrack(newIndex);
}

function initMusicPlayerEvents() {
    const dom = getMusicDom();
    if (!dom.activePlayer || !dom.audio) return;
    if (dom.activePlayer.dataset.bound === '1') return;
    dom.activePlayer.dataset.bound = '1';

    dom.queueToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dom.activePlayer.classList.contains('queue-open');

        if (isOpen) {
            dom.activePlayer.classList.remove('queue-open');
            dom.queuePanel?.classList.add('queue-hidden');
            dom.queuePanel?.setAttribute('aria-hidden', 'true');
        } else {
            dom.activePlayer.classList.add('queue-open');
            dom.queuePanel?.classList.remove('queue-hidden');
            dom.queuePanel?.setAttribute('aria-hidden', 'false');
            renderQueueList();
        }
    });

    dom.closeQueueBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.activePlayer.classList.remove('queue-open');
        dom.queuePanel?.classList.add('queue-hidden');
        dom.queuePanel?.setAttribute('aria-hidden', 'true');
    });

    dom.queueList?.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.yt-queue-play');
        const removeBtn = e.target.closest('.yt-queue-remove');
        const item = e.target.closest('.yt-queue-item');

        if (playBtn) {
            openQueueTrack(Number(playBtn.dataset.queueIndex));
            return;
        }

        if (removeBtn) {
            removeFromQueue(Number(removeBtn.dataset.queueIndex));
            return;
        }

        if (item) {
            openQueueTrack(Number(item.dataset.queueIndex));
        }
    });

    const togglePlay = async () => {
        if (!dom.audio.src && window.musicLibrary.length) {
            await openMusicTrack(0);
            return;
        }

        if (dom.audio.paused) {
            await dom.audio.play();
        } else {
            dom.audio.pause();
        }
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
    });

    dom.audio.addEventListener('loadedmetadata', () => {
        if (dom.seekbar) dom.seekbar.max = dom.audio.duration || 0;
        if (dom.duration) dom.duration.textContent = formatMusicTime(dom.audio.duration);
    });

    dom.audio.addEventListener('play', updateMusicPlayButtonState);
    dom.audio.addEventListener('pause', updateMusicPlayButtonState);
    dom.audio.addEventListener('ended', playNextMusic);

    dom.seekbar?.addEventListener('input', () => {
        dom.audio.currentTime = Number(dom.seekbar.value);
        updateSyncedLyricsByTime(dom.audio.currentTime);
    });

    dom.volumeSlider?.addEventListener('input', (e) => {
        updateVolumeUi(e.target.value);
    });

    updateVolumeUi(dom.volumeSlider?.value || 0.85);
    updateMusicPlayButtonState();

    const swipeSurface = dom.activePlayer;

    swipeSurface?.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        window.playerTouch.startX = touch.clientX;
        window.playerTouch.startY = touch.clientY;
        window.playerTouch.moved = false;
    }, { passive: true });

    swipeSurface?.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        const dx = touch.clientX - window.playerTouch.startX;
        const dy = touch.clientY - window.playerTouch.startY;

        if (Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy)) {
            window.playerTouch.moved = true;
        }
    }, { passive: true });

    swipeSurface?.addEventListener('touchend', (e) => {
        if (!window.playerTouch.moved) return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - window.playerTouch.startX;
        const dy = touch.clientY - window.playerTouch.startY;

        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;

        if (dx < 0) {
            playNextMusic();
        } else {
            playPrevMusic();
        }
    });
}
async function initMusicPage() {
    try {
        initMusicPlayerEvents();
        window.musicLibrary = await fetchMusicJsonList();
        renderMusicPlaylist();
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
async function fetchMusic() {
    const container = document.getElementById('music-playlist');
    if (!container) return;

    container.innerHTML = `
        <div class="music-loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Musiqilər yüklənir...</span>
        </div>
    `;

    try {
        const url = `https://api.github.com/repos/${config.githubUsername}/${config.repoName}/contents/musiqiler`;
        const res = await fetch(url);
        const files = await res.json();

        const musics = files.filter(f => f.name.endsWith('.json'));

        if (!musics.length) {
            container.innerHTML = "Musiqi tapılmadı";
            return;
        }

        let html = "";

        for (let i = 0; i < musics.length; i++) {
            const file = musics[i];

            const rawUrl = `https://raw.githubusercontent.com/${config.githubUsername}/${config.repoName}/main/musiqiler/${file.name}`;
            const data = await fetch(rawUrl).then(r => r.json());

            html += `
                <div class="yt-track-item" onclick="playMusic(${i})">
                    <img src="https://raw.githubusercontent.com/${config.githubUsername}/${config.repoName}/main/musiqiler/${data.cover}" class="yt-track-thumb">
                    <div class="yt-track-info">
                        <strong>${data.title}</strong>
                        <span>${data.artist}</span>
                    </div>
                </div>
            `;

            window.musicQueue.push({
                title: data.title,
                artist: data.artist,
                audio: `https://raw.githubusercontent.com/${config.githubUsername}/${config.repoName}/main/musiqiler/${data.audio}`,
                cover: data.cover
            });
        }

        container.innerHTML = html;

        document.getElementById('music-track-count').innerText = musics.length + " mahnı";

    } catch (e) {
        console.error(e);
        container.innerHTML = "Musiqilər yüklənmədi";
    }
}
function playMusic(index) {
    const track = window.musicQueue[index];
    if (!track) return;

    const audio = document.getElementById('yt-audio');
    audio.src = track.audio;
    audio.play();

    document.getElementById('yt-active-player').style.display = 'block';

    document.getElementById('yt-player-title').innerText = track.title;
    document.getElementById('yt-player-artist').innerText = track.artist;

    document.getElementById('yt-player-title-mini').innerText = track.title;
    document.getElementById('yt-player-artist-mini').innerText = track.artist;

    document.getElementById('yt-cover-image-mini').src =
        `https://raw.githubusercontent.com/${config.githubUsername}/${config.repoName}/main/musiqiler/${track.cover}`;

    window.currentQueueIndex = index;
}
