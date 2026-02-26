
const config = {
    githubUsername: "huseynw", 
    repoName: "dunyamiz",              
    firstMeetingDate: "2025-10-22T00:00:00",
    startDate: "2025-08-03T00:00:00", 
    meetingCount: 88,    
    musicTitle: "Gözlərin dəydi gözümə"
};
(function() {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if (e.key === "F12" || 
           (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) || 
           (e.ctrlKey && e.key === "u")) {
            e.preventDefault();
        }
    });
})();
const audio = document.getElementById('music-file');
const playBtn = document.querySelector('.play-btn');
const seekSlider = document.querySelector('.seek_slider');
const volumeSlider = document.querySelector('.volume_slider');
const currTimeText = document.getElementById('curr-time');
const totalDurText = document.getElementById('total-duration');
const trackArt = document.getElementById('track-art');
let allImages = []; 
let currentImgIdx = 0;
let isPlaying = false;
document.addEventListener('DOMContentLoaded', () => {
    const meetEl = document.getElementById('meet-count');
    if(meetEl) meetEl.innerText = config.meetingCount;
    updateCounter();
    setInterval(updateCounter, 1000);
});
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
            const now = new Date();
            const start = new Date(config.startDate);
            const diff = now - start;
            const toplamGun = Math.floor(diff / (1000 * 60 * 60 * 24));
            const saat = String(now.getHours()).padStart(2, '0');
            const deqiqe = String(now.getMinutes()).padStart(2, '0');
            const saniye = String(now.getSeconds()).padStart(2, '0');
            const ms = String(now.getMilliseconds()).padStart(3, '0');
            const timePath = `/cemalemle-birlikde-${toplamGun}-gun-${saat}-saat-${deqiqe}-deqiqe-${saniye}-saniye-${ms}-msaniye`;
            
            window.history.replaceState({}, "", timePath);
        }, 200);
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
                if(trackArt) trackArt.classList.add('playing');
                const icon = document.querySelector('.play-btn i');
                if(icon) icon.classList.replace('fa-play-circle', 'fa-pause-circle');
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
function updateCounter() {
    const start = new Date(config.startDate).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    if (isNaN(diff)) return;
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    if(document.getElementById('days')) document.getElementById('days').innerText = d;
    if(document.getElementById('hours')) document.getElementById('hours').innerText = h < 10 ? '0' + h : h;
    if(document.getElementById('minutes')) document.getElementById('minutes').innerText = m < 10 ? '0' + m : m;
    if(document.getElementById('seconds')) document.getElementById('seconds').innerText = s < 10 ? '0' + s : s;
}
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
function openLightbox(index) {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const nBtn = document.getElementById('next-btn');
    const pBtn = document.getElementById('prev-btn');
    if (!lb || !lbImg) {
        console.error("Lightbox və ya Şəkil elementi tapılmadı! HTML-i yoxla.");
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
function playpauseTrack() {
    if (audio.paused) {
        audio.play();
        if(trackArt) trackArt.classList.add('playing');
        playBtn.querySelector('i').classList.replace('fa-play-circle', 'fa-pause-circle');
    } else {
        audio.pause();
        if(trackArt) trackArt.classList.remove('playing');
        playBtn.querySelector('i').classList.replace('fa-pause-circle', 'fa-play-circle');
    }
}
if(audio) {
    audio.ontimeupdate = () => {
        if (audio.duration) {
            seekSlider.value = (audio.currentTime / audio.duration) * 100;
            currTimeText.innerText = formatTime(audio.currentTime);
            totalDurText.innerText = formatTime(audio.duration);
        }
    };
    function formatTime(sec) {
        let m = Math.floor(sec / 60);
        let s = Math.floor(sec % 60);
        return (m < 10 ? "0"+m : m) + ":" + (s < 10 ? "0"+s : s);
    }
}
if(seekSlider) {
    seekSlider.oninput = () => { audio.currentTime = (seekSlider.value / 100) * audio.duration; };
}
if(volumeSlider) {
    volumeSlider.oninput = () => { audio.volume = volumeSlider.value / 100; };
}
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
        text: "Bax bunu eşitmək istəyirəm. Sənin xoşbəxtliyin mənim üçün hər şeydən önəmlidir. Bu günün dadını çıxar, gül, əylən. Sən xoşbəxt olanda mən də dünyanın ən xoşbəxt adamı oluram. Həmişə belə parılda, günəşim!"
    },
    "us": {
        title: "Bizim üçün...",
        text: "Nə yaxşı ki, həyat yollarımızı kəsişdirib. Sən mənim təkcə sevgilim yox, həm də ən yaxşı dostumsan. Səninlə keçən hər saniyə mənim üçün hədiyyədir. Birlikdə hələ neçə gözəl günlərimiz olacaq. Yaxşı ki varsan, Cəmaləm."
    }
};
function openLetter(type) {
    const modal = document.getElementById('letter-modal');
    document.getElementById('letter-title').innerText = letters[type].title;
    document.getElementById('letter-text').innerText = letters[type].text;
    modal.style.display = 'flex';
}
function closeLetter() { document.getElementById('letter-modal').style.display = 'none'; }
const lovePhrases = [
    "Səni sevirəm", "I Love You", "Seni Seviyorum", "Je t'aime", "Ich liebe dich", "Te amo", "Ti amo", "Eu te amo", 
    "Ik hou van jou", "Jag älskar dig", "Jeg elsker deg", "Kocham Cię", "Szeretlek", "Miluji tě", "Te iubesc", 
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
const targetDate = new Date("2026-03-08T13:00:00"); 
function updateMeetingTimer() {
    const now = new Date();
    const diff = targetDate - now;
    const aylar = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
    const gun = targetDate.getDate();
    const ayAdı = aylar[targetDate.getMonth()];
    const saat = String(targetDate.getHours()).padStart(2, '0');
    const deqiqe = String(targetDate.getMinutes()).padStart(2, '0');
    const formatliTarix = `${gun} ${ayAdı} saat ${saat}:${deqiqe}`;
    document.getElementById('next-meeting-date').innerText = "Görüş vaxtı: " + formatliTarix;

    if (diff <= 0) {
        document.querySelector('.meeting-timer h3').innerText = "Görüş vaxtı gəldi!";
        return;
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('meet-days').innerText = d < 10 ? "0" + d : d;
    document.getElementById('meet-hours').innerText = h < 10 ? "0" + h : h;
    document.getElementById('meet-minutes').innerText = m < 10 ? "0" + m : m;
    document.getElementById('meet-seconds').innerText = s < 10 ? "0" + s : s;
}
setInterval(updateMeetingTimer, 1000);
updateMeetingTimer();
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
