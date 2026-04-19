const config = {
  githubUsername: "huseynw",
  repoName: "dunyamiz",
  firstMeetingDate: "2025-10-22T00:00:00",
  startDate: "2025-08-03T00:00:00",
  meetingCount: 0,
  musicTitle: "Gözlərin dəydi gözümə"
};

const SUPABASE_URL = "https://fctwtcakequqvvmjgbhr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHd0Y2FrZXF1cXZ2bWpnYmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjE2NzYsImV4cCI6MjA5MTczNzY3Nn0.EE7T4HgrPI5c7ChYu8VDtoQ3oXflkhKDE-wkFckrCeY";

const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const muteBtn = document.getElementById("muteBtn");
const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const welcomeScreen = document.getElementById("welcome-screen");
const mainContent = document.getElementById("main-content");
const enterBtn = document.getElementById("enter-btn");
const verifyBtn = document.getElementById("verify-btn");
const passPanel = document.getElementById("password-panel");
const passInput = document.getElementById("pass-input");
const errorMsg = document.getElementById("error-msg");

let targetDate = new Date();
let siteSettingsLoaded = false;
let isPlaying = false;
let allImages = [];
let currentImgIdx = 0;
let visualizerBars = [];
let visualizerAnimationId = null;

const dailyMessageBank = [
  "Bu gün içimdə qalan ən sakit hiss yenə sənsən.",
  "Səni düşünəndə hər şey bir az daha yumşaq görünür.",
  "Bu günün ən gözəl tərəfi sənin varlığını hiss etməkdir.",
  "Bəzi günlər bir cümlə yetir: yaxşı ki, varsan.",
  "Səninlə bağlı hisslərim hələ də ən təmiz yerdə qalır.",
  "Bu gün də adın içimdə işıq kimi qalır."
];

const randomMemoryTexts = [
  { title: "Yavaş an", text: "Bəzi anlar var, insan onları ikinci dəfə yaşamaq istəyir." },
  { title: "Sakit kadr", text: "Ən dəyərli xatirələr çox zaman ən sakit olanlardır." },
  { title: "Bir baxış", text: "Bəzən bir baxış bütün günü dəyişə bilir." },
  { title: "Təsadüfi istilik", text: "Səni xatırlamaq bəzən çox tanış bir rahatlıq kimidir." }
];

function pick(list, seed = Date.now()) {
  const index = Math.abs(Math.floor(seed)) % list.length;
  return list[index];
}

function getBakuNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Baku" }));
}

function pad(num) {
  return String(num).padStart(2, "0");
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function formatDateTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "Tarix bilinmir";
  return date.toLocaleString("az-AZ", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function updateClock() {
  const el = document.getElementById("live-clock");
  const greeting = document.getElementById("dynamic-greeting");
  const now = getBakuNow();
  const hours = now.getHours();
  if (el) el.textContent = now.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baku" });
  if (greeting) {
    const title = hours < 12 ? "Sabahın sakitliyi" : hours < 18 ? "Günün premium anı" : "Gecənin yumşaq havası";
    greeting.textContent = title;
  }
}

async function loadSiteSettings(force = false) {
  if (siteSettingsLoaded && !force) return;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=id,next_meeting_date,meeting_count`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json"
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || data?.error || "Site settings yüklənmədi.");
    const settings = Array.isArray(data) ? data[0] : data;
    if (settings?.next_meeting_date) targetDate = new Date(settings.next_meeting_date);
    if (typeof settings?.meeting_count === "number") config.meetingCount = settings.meeting_count;
    siteSettingsLoaded = true;
    syncMeetingCount();
    updateMeetingTimer();
  } catch (error) {
    console.error("Site settings yüklənmədi:", error);
  }
}

function syncMeetingCount() {
  const ids = ["meet-count", "meet-count-time"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatNumber(config.meetingCount);
  });
}

function updateCounter() {
  const start = new Date(config.startDate).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - start);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const totalMinutes = Math.floor(diff / (1000 * 60));

  const map = {
    "total-days": formatNumber(days),
    "detail-days": formatNumber(days),
    "hours": pad(hours),
    "minutes": pad(minutes),
    "seconds": pad(seconds),
    "detail-hours": formatNumber(hours),
    "detail-minutes": formatNumber(minutes),
    "detail-seconds": formatNumber(seconds),
    "total-hours-love": formatNumber(totalHours),
    "total-minutes-love": formatNumber(totalMinutes)
  };

  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function updateMeetingTimer() {
  const now = Date.now();
  const diff = Math.max(0, targetDate.getTime() - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const values = {
    "meet-days": pad(days),
    "meet-hours": pad(hours),
    "meet-minutes": pad(minutes),
    "meet-seconds": pad(seconds)
  };
  Object.entries(values).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
  const dateLabel = document.getElementById("next-meeting-date");
  if (dateLabel) dateLabel.textContent = formatDateTime(targetDate);
}

function renderDailyMessage() {
  const titleEl = document.getElementById("daily-message-title");
  const textEl = document.getElementById("daily-message-text");
  const dateEl = document.getElementById("daily-message-date");
  const dateKey = getBakuNow().toDateString();
  if (titleEl) titleEl.textContent = "Bugünün notu";
  if (textEl) textEl.textContent = pick(dailyMessageBank, dateKey.length * 77);
  if (dateEl) dateEl.textContent = getBakuNow().toLocaleDateString("az-AZ", { dateStyle: "long", timeZone: "Asia/Baku" });
}

function parseImageDate(img) {
  if (img?.git_date) {
    const d = new Date(img.git_date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const fileName = String(img?.name || "").replace(/\.[^.]+$/, "");
  const match = fileName.match(/(\d{4})-(\d{2})-(\d{2})(?:[_ ](\d{2})[-:](\d{2}))?/);
  if (!match) return null;
  const [, y, mo, da, h = "00", mi = "00"] = match;
  return new Date(`${y}-${mo}-${da}T${h}:${mi}:00`);
}

function getRandomGalleryMemory() {
  if (!allImages.length) return null;
  const index = Math.floor(Math.random() * allImages.length);
  const image = allImages[index];
  const date = parseImageDate(image) || new Date();
  return {
    title: "Qalereyadan bir an",
    text: `${formatDateTime(date)} tarixli xatirə yenidən qarşına çıxdı.`,
    index
  };
}

function showRandomMemory() {
  const titleEl = document.getElementById("random-memory-title");
  const textEl = document.getElementById("random-memory-text");
  const openBtn = document.getElementById("random-memory-open-btn");
  const useGallery = allImages.length && Math.random() > 0.5;
  const memory = useGallery ? getRandomGalleryMemory() : pick(randomMemoryTexts);
  if (!titleEl || !textEl || !openBtn) return;

  titleEl.textContent = memory.title;
  textEl.textContent = memory.text;

  if (typeof memory.index === "number") {
    currentImgIdx = memory.index;
    openBtn.hidden = false;
  } else {
    openBtn.hidden = true;
  }
}

async function fetchImages() {
  const container = document.getElementById("gallery-stack");
  if (!container) return;
  container.innerHTML = '<p class="subtle-text">Xatirələr yüklənir...</p>';
  try {
    const response = await fetch("/.netlify/functions/github-content?path=gallery");
    const data = await response.json();
    if (!response.ok || !Array.isArray(data)) throw new Error(data?.message || "Qalereya yüklənmədi.");

    allImages = data
      .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
      .sort((a, b) => new Date(b.git_date || 0) - new Date(a.git_date || 0));

    if (!allImages.length) {
      container.innerHTML = '<p class="subtle-text">Şəkil tapılmadı.</p>';
      return;
    }

    container.innerHTML = allImages.map((img, index) => {
      const date = parseImageDate(img) || new Date(img.git_date || Date.now());
      return `
        <article class="gallery-card" data-index="${index}">
          <img src="${img.download_url}" alt="Xatirə ${index + 1}" loading="lazy" />
          <div class="gallery-overlay">${formatDateTime(date)}</div>
        </article>
      `;
    }).join("");

    container.querySelectorAll(".gallery-card").forEach((card) => {
      card.addEventListener("click", () => openLightbox(Number(card.dataset.index)));
    });

    showRandomMemory();
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="subtle-text">Qalereya hazır deyil.</p>';
  }
}

function openLightbox(index) {
  currentImgIdx = index;
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  lb.hidden = false;
  updateLightboxContent();
}

function closeLightbox() {
  const lb = document.getElementById("lightbox");
  if (lb) lb.hidden = true;
}

function updateLightboxContent() {
  const img = allImages[currentImgIdx];
  const lbImg = document.getElementById("lightbox-img");
  const dateEl = document.getElementById("image-date");
  if (!img || !lbImg || !dateEl) return;
  lbImg.src = img.download_url;
  dateEl.textContent = formatDateTime(parseImageDate(img) || new Date(img.git_date || Date.now()));
}

function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const pages = document.querySelectorAll(".spa-page");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const pageId = `page-${item.dataset.page}`;
      navItems.forEach((n) => n.classList.remove("active"));
      pages.forEach((page) => page.classList.remove("active"));
      item.classList.add("active");
      document.getElementById(pageId)?.classList.add("active");
    });
  });
}

function initAudio() {
  if (!audio || !playPauseBtn || !seekBar) return;
  audio.addEventListener("loadedmetadata", () => {
    seekBar.max = String(Math.floor(audio.duration || 0));
    durationEl.textContent = formatTrackTime(audio.duration || 0);
  });

  audio.addEventListener("timeupdate", () => {
    seekBar.value = String(Math.floor(audio.currentTime || 0));
    currentTimeEl.textContent = formatTrackTime(audio.currentTime || 0);
    drawVisualizer();
  });

  audio.addEventListener("ended", () => setPlayingState(false));

  playPauseBtn.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        await audio.play();
        setPlayingState(true);
      } else {
        audio.pause();
        setPlayingState(false);
      }
    } catch (error) {
      console.error("Audio start error", error);
    }
  });

  muteBtn?.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fa-solid fa-volume-xmark"></i>'
      : '<i class="fa-solid fa-volume-high"></i>';
  });

  seekBar.addEventListener("input", () => {
    audio.currentTime = Number(seekBar.value);
  });

  initVisualizer();
}

function setPlayingState(playing) {
  isPlaying = playing;
  playPauseBtn.innerHTML = playing
    ? '<i class="fa-solid fa-pause"></i>'
    : '<i class="fa-solid fa-play"></i>';
}

function formatTrackTime(value) {
  const min = Math.floor(value / 60) || 0;
  const sec = Math.floor(value % 60) || 0;
  return `${pad(min)}:${pad(sec)}`;
}

function initVisualizer() {
  const canvas = document.getElementById("visualizer");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    visualizerBars = Array.from({ length: 36 }, () => 0);
  }

  window.addEventListener("resize", resize);
  resize();

  function animate() {
    drawVisualizer();
    visualizerAnimationId = requestAnimationFrame(animate);
  }
  if (!visualizerAnimationId) animate();
}

function drawVisualizer() {
  const canvas = document.getElementById("visualizer");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  const bars = visualizerBars.length || 36;
  const gap = 4;
  const barW = (width - gap * (bars - 1)) / bars;
  for (let i = 0; i < bars; i++) {
    const target = isPlaying ? 18 + Math.random() * (height - 24) : 10;
    visualizerBars[i] += (target - visualizerBars[i]) * 0.2;
    const barH = visualizerBars[i];
    const x = i * (barW + gap);
    const y = height - barH;
    const gradient = ctx.createLinearGradient(0, y, 0, height);
    gradient.addColorStop(0, "rgba(255,255,255,0.95)");
    gradient.addColorStop(1, "rgba(139,169,255,0.18)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barW, barH);
  }
}

function initWelcome() {
  enterBtn?.addEventListener("click", () => {
    passPanel.classList.remove("hidden");
    passInput?.focus();
  });

  verifyBtn?.addEventListener("click", async () => {
    const password = passInput?.value?.trim();
    if (!password) return;

    const original = verifyBtn.innerHTML;
    verifyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    verifyBtn.disabled = true;
    errorMsg.style.display = "none";

    try {
      const res = await fetch("/.netlify/functions/admin-proxy", {
        method: "POST",
        body: JSON.stringify({ type: "verify_site", password })
      });
      const data = await res.json();
      if (!data?.success) throw new Error("verify failed");

      await loadSiteSettings(true);
      welcomeScreen.style.opacity = "0";
      setTimeout(() => {
        welcomeScreen.style.display = "none";
        mainContent.classList.remove("hidden");
      }, 450);

      if (audio) {
        audio.play().then(() => setPlayingState(true)).catch(() => {});
      }
      fetchImages();
    } catch (error) {
      errorMsg.style.display = "block";
      if (passInput) passInput.value = "";
    } finally {
      verifyBtn.innerHTML = original;
      verifyBtn.disabled = false;
    }
  });

  passInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verifyBtn?.click();
  });
}

function initNotes() {
  const modal = document.getElementById("add-note-modal");
  const openBtn = document.getElementById("open-add-note-btn");
  const closeBtn = document.getElementById("close-add-note-btn");
  const submitBtn = document.getElementById("submit-note-btn");
  const container = document.getElementById("notes-container");
  if (!container) return;

  function readNotes() {
    try {
      return JSON.parse(localStorage.getItem("premium-private-notes") || "[]");
    } catch {
      return [];
    }
  }

  function writeNotes(notes) {
    localStorage.setItem("premium-private-notes", JSON.stringify(notes));
  }

  function renderNotes() {
    const seeded = [
      { title: "İlk görüş", content: "22.10.2025", author: "Timeline", date: new Date().toISOString() },
      { title: "Track", content: config.musicTitle, author: "Playlist", date: new Date().toISOString() }
    ];
    const notes = [...readNotes(), ...seeded].slice(0, 8);
    container.innerHTML = notes.map((note) => `
      <article class="note-card">
        <div>
          <strong>${escapeHtml(note.title || "Not")}</strong>
          <p>${escapeHtml(note.content || "")}</p>
        </div>
        <div class="note-meta">${escapeHtml(note.author || "Private")} • ${formatDateTime(new Date(note.date || Date.now()))}</div>
      </article>
    `).join("");
  }

  openBtn?.addEventListener("click", () => { if (modal) modal.hidden = false; });
  closeBtn?.addEventListener("click", () => { if (modal) modal.hidden = true; });
  modal?.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });

  submitBtn?.addEventListener("click", () => {
    const author = document.getElementById("note-author");
    const title = document.getElementById("note-title");
    const content = document.getElementById("note-content");
    if (!title?.value.trim() || !content?.value.trim()) return;
    const notes = readNotes();
    notes.unshift({
      author: author?.value.trim() || "Private",
      title: title.value.trim(),
      content: content.value.trim(),
      date: new Date().toISOString()
    });
    writeNotes(notes);
    renderNotes();
    if (author) author.value = "";
    if (title) title.value = "";
    if (content) content.value = "";
    if (modal) modal.hidden = true;
  });

  renderNotes();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function initMoodText() {
  const el = document.getElementById("changing-love");
  if (!el) return;
  const phrases = [
    "Səni sevirəm",
    "Yaxşı ki, varsan",
    "Ən sakit hissimsən",
    "Bu hissin adı sənsən"
  ];
  let index = 0;
  setInterval(() => {
    index = (index + 1) % phrases.length;
    el.textContent = phrases[index];
  }, 3000);
}

function initLightboxEvents() {
  document.getElementById("close-lb-btn")?.addEventListener("click", closeLightbox);
  document.getElementById("prev-btn")?.addEventListener("click", () => {
    if (!allImages.length) return;
    currentImgIdx = (currentImgIdx - 1 + allImages.length) % allImages.length;
    updateLightboxContent();
  });
  document.getElementById("next-btn")?.addEventListener("click", () => {
    if (!allImages.length) return;
    currentImgIdx = (currentImgIdx + 1) % allImages.length;
    updateLightboxContent();
  });
  document.getElementById("random-memory-open-btn")?.addEventListener("click", () => openLightbox(currentImgIdx));
}

function initWeatherPlaceholder() {
  const weather = document.getElementById("weather-status");
  if (weather) weather.textContent = "Bakı • private mode";
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && audio && isPlaying && audio.paused) {
    audio.play().catch(() => {});
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  updateClock();
  setInterval(updateClock, 1000);
  updateCounter();
  updateMeetingTimer();
  renderDailyMessage();
  showRandomMemory();
  syncMeetingCount();
  initNavigation();
  initAudio();
  initWelcome();
  initNotes();
  initMoodText();
  initLightboxEvents();
  initWeatherPlaceholder();
  setInterval(updateCounter, 1000);
  setInterval(updateMeetingTimer, 1000);
  await loadSiteSettings();
});
