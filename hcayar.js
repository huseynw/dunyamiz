import { initKawarp, updateKawarpCover, stopKawarp, startKawarp, resizeKawarp, destroyKawarp } from "./src/modules/kawarp.js";

let targetDate = new Date();
window.isLocked = true;
let currentWaveColor = "rgb(255,255,255)";
const config = {
  githubUsername: "huseynw",
  repoName: "dunyamiz",
  firstMeetingDate: "2025-10-22T00:00:00",
  startDate: "2025-08-03T00:00:00",
  meetingCount: 0,
  musicTitle: "Gözlərin dəydi gözümə",
};
const SITE_RUNTIME_CONFIG = window.__SITE_CONFIG__ || {};
const SUPABASE_URL =
  SITE_RUNTIME_CONFIG.SUPABASE_URL ||
  "https://fctwtcakequqvvmjgbhr.supabase.co";
const SUPABASE_ANON_KEY =
  SITE_RUNTIME_CONFIG.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHd0Y2FrZXF1cXZ2bWpnYmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjE2NzYsImV4cCI6MjA5MTczNzY3Nn0.EE7T4HgrPI5c7ChYu8VDtoQ3oXflkhKDE-wkFckrCeY";
let siteSettingsLoaded = false;

async function loadSiteSettings(force = false) {
  if (siteSettingsLoaded && !force) return;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      "Supabase açarı verilməyib. Site settings üçün serverless/proxy istifadə et və ya window.__SITE_CONFIG__ içində açarı ver.",
    );
    return;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=id,next_meeting_date,meeting_count`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || data?.error || "Site settings yüklənmədi.",
      );
    }

    const settings = Array.isArray(data) ? data[0] : data;
    if (!settings) return;

    if (settings.next_meeting_date) {
      targetDate = new Date(settings.next_meeting_date);
    }

    if (typeof settings.meeting_count === "number") {
      config.meetingCount = settings.meeting_count;
    }

    siteSettingsLoaded = true;

    const meetEl = document.getElementById("meet-count");
    if (meetEl) {
      meetEl.textContent = config.meetingCount;
    }

    if (typeof updateMeetingTimer === "function") {
      updateMeetingTimer();
    }

    if (typeof syncAdminOverview === "function") {
      syncAdminOverview();
      initDailyMessageAndRandomMemory();
    }
  } catch (err) {
    console.error("Site settings yüklənmədi:", err);
  }
}

// ========== PERFORMANCE PATCH HELPERS ==========
const IS_TOUCH_DEVICE =
  navigator.maxTouchPoints > 0 ||
  window.matchMedia("(pointer: coarse)").matches;
const IS_LOW_END_DEVICE = (navigator.hardwareConcurrency || 8) < 4;
const PERF_REDUCED_MOTION = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const PERF_MOBILE = IS_TOUCH_DEVICE || window.innerWidth <= 768;
const PERF_CACHE_PREFIX = "dunyamiz-cache:";
const PERF_GITHUB_TTL = 7 * 60 * 1000;
const perfDomCache = new Map();
const perfTextCache = new Map();

function perfGetEl(id) {
  if (!perfDomCache.has(id)) perfDomCache.set(id, document.getElementById(id));
  return perfDomCache.get(id);
}

function perfSetText(id, value) {
  const text = String(value);
  if (perfTextCache.get(id) === text) return;
  const el = perfGetEl(id);
  if (!el) return;
  el.innerHTML = text;
  perfTextCache.set(id, text);
}

function perfSetHtml(id, value) {
  const html = String(value);
  if (perfTextCache.get(id) === html) return;
  const el = perfGetEl(id);
  if (!el) return;
  el.innerHTML = html;
  perfTextCache.set(id, html);
}

function perfGetCached(key, ttl = PERF_GITHUB_TTL) {
  try {
    const raw = localStorage.getItem(PERF_CACHE_PREFIX + key);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached || Date.now() - cached.time > ttl) return null;
    return cached.value;
  } catch (_) {
    return null;
  }
}

function perfSetCached(key, value) {
  try {
    localStorage.setItem(
      PERF_CACHE_PREFIX + key,
      JSON.stringify({ time: Date.now(), value }),
    );
  } catch (_) {}
}

async function perfFetchJsonCached(key, url, ttl = PERF_GITHUB_TTL) {
  const cached = perfGetCached(key, ttl);
  if (cached) return cached;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(data?.message || data?.error || "Məlumat yüklənmədi"),
      { status: response.status, data },
    );
  perfSetCached(key, data);
  return data;
}

function perfThrottle(fn, wait = 120) {
  let last = 0;
  let timer = null;
  return (...args) => {
    const now = Date.now();
    const remain = wait - (now - last);
    clearTimeout(timer);
    if (remain <= 0) {
      last = now;
      fn(...args);
    } else {
      timer = setTimeout(() => {
        last = Date.now();
        fn(...args);
      }, remain);
    }
  };
}

if (window.gsap) {
  gsap.defaults({ overwrite: "auto" });
}

// Security blocks removed for cleaner code

// Audio Elements
const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const muteBtn = document.getElementById("muteBtn");
const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
let audioGainNode;
let audioSourceNode;
let currentVolume = 0.85;

function getOrCreateSharedAudioNodes(audioElement = audio) {
  if (!audioElement) return null;

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (!audioSourceNode) {
    audioSourceNode = audioContext.createMediaElementSource(audioElement);
    audioGainNode = audioContext.createGain();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;

    // Eyni <audio> elementi üçün createMediaElementSource yalnız 1 dəfə çağırılır.
    // Zəncir: audio -> gain -> analyser -> speakers
    audioSourceNode.connect(audioGainNode);
    audioGainNode.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  if (audioGainNode) {
    audioGainNode.gain.value = currentVolume;
  }

  return {
    context: audioContext,
    source: audioSourceNode,
    gain: audioGainNode,
    analyser,
  };
}

function initIOSVolumeFix() {
  try {
    getOrCreateSharedAudioNodes(audio);
  } catch (err) {
    console.error("iOS audio init xətası:", err);
  }
}
window.allImages = [];
let currentImgIdx = 0;
let isPlaying = false;

let randomMemoryLastImageIndex = null;

const dailyMessageBank = {
  openings: [
    "Bu gün ürəyimdən sənə bir cümlə keçdi:",
    "Bu günün ən yumşaq sözü sənin üçündür:",
    "Bu gün içimdən gələn ilk hiss budur:",
    "Bu gün səni xatırlayanda ağlıma bu gəldi:",
    "Bu gün üçün sənə balaca bir not:",
    "Bu gün ruhuma ən yaxın cümlə budur:",
    "Bu gün səni düşünəndə içim belə danışdı:",
    "Bu günün romantik pıçıltısı budur:",
    "Bu gün üçün ürəkdən seçilən mesaj:",
    "Bu günə yaraşan ən zərif söz budur:",
  ],
  moods: [
    "sakit",
    "işıqlı",
    "şirin",
    "romantik",
    "yumşaq",
    "dərin",
    "isti",
    "parlaq",
    "incə",
    "sehirli",
  ],
  subjects: [
    "gülüşün",
    "səsinə yaxın hiss",
    "mənə verdiyin rahatlıq",
    "mənə baxışın",
    "varlığının istiliyi",
    "səninlə olan xatirələr",
    "mənə verdiyin güvən",
    "adını eşidəndə gələn hiss",
    "yanımda olduğunu bilmək",
    "səninlə qurduğum gələcək",
  ],
  verbs: [
    "günümü gözəlləşdirir",
    "məni sakitləşdirir",
    "ürəyimə yaxşı gəlir",
    "hər şeyi daha mənalı edir",
    "içimdə işıq yandırır",
    "dünyanı daha yumşaq göstərir",
    "mənə güc verir",
    "üzümdə təbəssüm yaradır",
    "hisslərimi daha dərin edir",
    "məni sənə bir az da yaxınlaşdırır",
  ],
  closings: [
    "Bu gün də səni çox sevirəm.",
    "Sən mənim üçün hələ də ən gözəl təsadüfsən.",
    "Sən olan yerdə içim rahat olur.",
    "Bu hissin adı yenə sənsən.",
    "Yaxşı ki, qəlbim səni tanıyıb.",
    "Sənlə bağlı hər şey içimdə gözəl qalır.",
    "Bu günün ən gözəl tərəfi yenə sənsən.",
    "Səninlə bağlı düşüncələrim həmişə isti qalır.",
    "Bəzən bir cümlə kifayət edir: yaxşı ki, varsan.",
    "Bu mesajın sonu da yenə sənə çıxır.",
  ],
};

const randomMemoryTexts = [
  {
    title: "İlk baxış kimi",
    text: "Bəzi anlar var ki, üstündən nə qədər vaxt keçsə də ilk dəfə hiss edilirmiş kimi qalır. Sənli xatirələr də elədir.",
  },
  {
    title: "Balaca sürpriz",
    text: "Bəzən ən böyük xoşbəxtlik çox kiçik bir anda gizlənir: bir söz, bir baxış, bir mesaj, bir gülüş.",
  },
  {
    title: "Sakit xatirə",
    text: "Elə anlar olur ki, səs-küylü deyil, amma insanın ürəyində ən çox yer tutan da məhz onlar olur.",
  },
  {
    title: "Gözəl təsadüf",
    text: "Səni düşünmək bəzən köhnə, amma çox sevilən bir mahnını yenidən tapmaq kimidir.",
  },
  {
    title: "Ən yumşaq an",
    text: "Bir günün içində ən dəyərli saniyə bəzən sadəcə içdən gələn bir hiss olur.",
  },
  {
    title: "Dərin nəfəs",
    text: "Səninlə bağlı ən gözəl şeylərdən biri də budur: səni xatırlayanda insanın içi sakitləşir.",
  },
  {
    title: "Bir az sən",
    text: "Bu xatirədə bir az sevinc, bir az həyəcan, bir az da səni düşünəndə yaranan istilik var.",
  },
  {
    title: "İşıqlı kadr",
    text: "Bəzi anlar şəkil olmasa da yaddaşda o qədər aydın qalır ki, sanki hər detalı görünür.",
  },
  {
    title: "Təbəssüm səbəbi",
    text: "Təsadüfi xatirə gəldi və nəticə dəyişmədi: yenə də üzdə təbəssüm.",
  },
  {
    title: "Ürəkdə qalan",
    text: "Gün keçir, vaxt dəyişir, amma bəzi hisslər ürəkdə olduğu kimi qalır.",
  },
  {
    title: "Yavaş an",
    text: "Kaş bəzi xatirələrdə vaxtı bir az yavaşlatmaq olaydı; ən gözəl anlar daha uzun qalaydı.",
  },
  {
    title: "Bir cümləlik xoşbəxtlik",
    text: "Bəzən xoşbəxtlik çox uzun izah istəmir; sadəcə o anın içində hiss olunur.",
  },
];

function hashString(value) {
  let hash = 0;
  const text = String(value || "");
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createSeededRandom(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function getBakuDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
}

function formatBakuPrettyDate(date = new Date()) {
  return date.toLocaleDateString("az-AZ", {
    timeZone: "Asia/Baku",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildDailyMessage(seedKey) {
  const seed = hashString(`daily-${seedKey}`);
  const rand = createSeededRandom(seed);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  return `${pick(dailyMessageBank.openings)} Bu gün ${pick(dailyMessageBank.moods)} bir hisslə deyirəm ki, ${pick(dailyMessageBank.subjects)} ${pick(dailyMessageBank.verbs)}. ${pick(dailyMessageBank.closings)}`;
}

function animateMemoryBlock(...elements) {
  elements.filter(Boolean).forEach((el) => {
    el.classList.remove("memory-animate");
    void el.offsetWidth;
    el.classList.add("memory-animate");
  });
}

function renderDailyMessage() {
  const titleEl = document.getElementById("daily-message-title");
  const textEl = document.getElementById("daily-message-text");
  const dateEl = document.getElementById("daily-message-date");
  if (!titleEl || !textEl || !dateEl) return;

  const dateKey = getBakuDateKey();
  const message = buildDailyMessage(dateKey);

  titleEl.innerHTML = "Bu gün sənə bir sözüm var <i class='fas fa-heart' style='color:#ff4d6d;'></i>";
  textEl.textContent = message;
  dateEl.innerHTML = `<i class="fas fa-calendar-day"></i> ${formatBakuPrettyDate(new Date())}`;
  animateMemoryBlock(titleEl, textEl, dateEl);
}

function getRandomGalleryMemory() {
  if (!Array.isArray(window.allImages) || !window.allImages.length) return null;
  const index = Math.floor(Math.random() * window.allImages.length);
  const image = window.allImages[index];
  const imageDate = parseImageDate(image) || image.git_date || new Date();
  return {
    type: "image",
    index,
    title: "Qalereyadan bir xatirə",
    text: `${formatAzDate(imageDate)} tarixli bir an yenidən qarşına çıxdı. Bəlkə bu xatirəni bir də açıb baxasan?`,
  };
}

function getRandomTextMemory() {
  const picked =
    randomMemoryTexts[Math.floor(Math.random() * randomMemoryTexts.length)];
  return {
    type: "text",
    title: picked.title,
    text: picked.text,
  };
}

function showRandomMemory() {
  const titleEl = document.getElementById("random-memory-title");
  const textEl = document.getElementById("random-memory-text");
  const openBtn = document.getElementById("random-memory-open-btn");
  if (!titleEl || !textEl || !openBtn) return;

  const shouldUseImage =
    Array.isArray(window.allImages) &&
    window.allImages.length > 0 &&
    Math.random() > 0.45;
  const memory = shouldUseImage
    ? getRandomGalleryMemory()
    : getRandomTextMemory();
  if (!memory) return;

  titleEl.textContent = memory.title;
  textEl.textContent = memory.text;
  animateMemoryBlock(titleEl, textEl);

  if (memory.type === "image" && Number.isInteger(memory.index)) {
    randomMemoryLastImageIndex = memory.index;
    openBtn.hidden = false;
  } else {
    randomMemoryLastImageIndex = null;
    openBtn.hidden = true;
  }

  try {
    localStorage.setItem(
      "lastRandomMemory",
      JSON.stringify({
        ...memory,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch (_) {}
}

function restoreLastRandomMemory() {
  const titleEl = document.getElementById("random-memory-title");
  const textEl = document.getElementById("random-memory-text");
  const openBtn = document.getElementById("random-memory-open-btn");
  if (!titleEl || !textEl || !openBtn) return false;

  try {
    const raw = localStorage.getItem("lastRandomMemory");
    if (!raw) return false;
    const memory = JSON.parse(raw);
    if (!memory?.title || !memory?.text) return false;

    titleEl.textContent = memory.title;
    textEl.textContent = memory.text;

    if (memory.type === "image" && Number.isInteger(memory.index)) {
      randomMemoryLastImageIndex = memory.index;
      openBtn.hidden = false;
    } else {
      randomMemoryLastImageIndex = null;
      openBtn.hidden = true;
    }
    return true;
  } catch (_) {
    return false;
  }
}

function initDailyMessageAndRandomMemory() {
  renderDailyMessage();

  const randomBtn = document.getElementById("random-memory-btn");
  const openBtn = document.getElementById("random-memory-open-btn");

  if (randomBtn && !randomBtn.dataset.bound) {
    randomBtn.dataset.bound = "true";
    randomBtn.addEventListener("click", showRandomMemory);
  }

  if (openBtn && !openBtn.dataset.bound) {
    openBtn.dataset.bound = "true";
    openBtn.addEventListener("click", () => {
      if (
        Number.isInteger(randomMemoryLastImageIndex) &&
        typeof window.openLightbox === "function"
      ) {
        window.openLightbox(randomMemoryLastImageIndex);
      }
    });
  }

  if (!restoreLastRandomMemory()) {
    showRandomMemory();
  }
}

// ========== MOBILE BACKGROUND AUDIO FIX ==========
function resumeAudioContextSafely() {
  if (!audioContext) return;
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    resumeAudioContextSafely();
  }
});

window.addEventListener("pageshow", () => {
  resumeAudioContextSafely();
});

document.addEventListener(
  "touchstart",
  () => {
    resumeAudioContextSafely();
    initIOSVolumeFix();
  },
  { passive: true, once: false },
);
// ========== SPA NAVIGATION (3D Pill) ==========
function initSPANavigation() {
  const pillNav = document.getElementById("pill-nav");
  const pillLabel = document.getElementById("pill-active-label");
  const pillItems = document.querySelectorAll(".pill-item");
  const pages = document.querySelectorAll(".spa-page");

  if (!pillNav || !pillLabel || !pillItems.length) return;

  let hoverTimeout = null;
  let isExpanded = false;

  // Page label map
  const pageLabelMap = {
    home: "Əsas",
    time: "Zamanımız",
    gallery: "Qalereya",
    letters: "Məktublar",
    notes: "Notlar",
    films: "Filmlər",
    music: "Musiqi",
    anniversary: "İl Dönümü",
  };

  function expandPill() {
    if (isExpanded) return;
    isExpanded = true;
    pillNav.classList.add("expanded");
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  }

  function collapsePill() {
    hoverTimeout = setTimeout(() => {
      isExpanded = false;
      pillNav.classList.remove("expanded");
    }, 600);
  }

  // Desktop hover
  pillNav.addEventListener("mouseenter", expandPill);
  pillNav.addEventListener("mouseleave", collapsePill);

  // Mobile: tap to expand, tap outside to collapse
  pillNav.addEventListener("touchstart", (e) => {
    if (!isExpanded) {
      e.preventDefault();
      expandPill();
    }
  }, { passive: false });

  document.addEventListener("touchstart", (e) => {
    if (isExpanded && !pillNav.contains(e.target)) {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      isExpanded = false;
      pillNav.classList.remove("expanded");
    }
  }, { passive: true });

  // Update active label with animation
  function updateActiveLabel(pageId) {
    const label = pageLabelMap[pageId] || pageId;
    pillLabel.style.animation = "none";
    void pillLabel.offsetWidth; // force reflow
    pillLabel.textContent = label;
    pillLabel.style.animation = "pillLabelIn 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
  }

  // Click handler for navigation items
  pillItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetPage = item.getAttribute("data-page");
      const targetElement = document.getElementById(`page-${targetPage}`);

      if (!targetElement || targetElement.classList.contains("active")) return;

      const pageTitle = pageLabelMap[targetPage] || targetPage;
      addActivity(`🧭 ${pageTitle} səhifəsinə keçdi`);

      // Update active states
      pillItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      // Transition effect on pill
      pillNav.classList.add("transitioning");
      setTimeout(() => pillNav.classList.remove("transitioning"), 400);

      // Update collapsed label
      updateActiveLabel(targetPage);

      // Collapse pill after selection
      if (hoverTimeout) clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        isExpanded = false;
        pillNav.classList.remove("expanded");
      }, 300);

      // Animate page transition (GSAP)
      const currentPage = document.querySelector(".spa-page.active");

      if (currentPage) {
        gsap.to(currentPage, {
          y: -30,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            currentPage.classList.remove("active");
            currentPage.style.display = "none";

            targetElement.style.display = "block";
            targetElement.classList.add("active");
            gsap.fromTo(
              targetElement,
              { opacity: 0, scale: 0.95, rotationX: 8, y: 25 },
              {
                opacity: 1,
                scale: 1,
                rotationX: 0,
                y: 0,
                duration: 0.8,
                ease: "expo.out",
                transformPerspective: 1000,
              },
            );

            gsap.fromTo(
              targetElement.querySelectorAll(
                ".page-title, .animate-item, .time-together-card, .detailed-time-card",
              ),
              { y: 40, opacity: 0, scale: 0.95 },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.8,
                stagger: 0.08,
                ease: "back.out(1.4)",
                delay: 0.1,
              },
            );
          },
        });
      }
    });
  });
}

function initWelcomeAnimations() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  // Set initial states explicitly before animating to avoid CSS will-change conflicts
  gsap.set(".welcome-grid", { opacity: 0, scale: 1.05 });
  gsap.set(".welcome-topline", { opacity: 0, y: -20 });
  gsap.set(".welcome-hero-icon", { opacity: 0, scale: 0.5, rotationY: 90 });
  gsap.set(".welcome-copy > *", { opacity: 0, y: 30, rotationX: -15 });
  gsap.set(".welcome-stats .welcome-stat-card", {
    opacity: 0,
    y: 30,
    scale: 0.8,
  });
  gsap.set(".welcome-actions button", { opacity: 0, y: 25, scale: 0.9 });

  const tl = gsap.timeline({
    defaults: { duration: 1, ease: "expo.out", transformPerspective: 1000 },
  });
  tl.to(".welcome-grid", { opacity: 1, scale: 1, duration: 1.5 })
    .to(".welcome-topline", { opacity: 1, y: 0 }, "-=1.2")
    .to(
      ".welcome-hero-icon",
      {
        opacity: 1,
        scale: 1,
        rotationY: 0,
        ease: "elastic.out(1, 0.5)",
        duration: 1.5,
      },
      "-=1",
    )
    .to(
      ".welcome-copy > *",
      { opacity: 1, y: 0, rotationX: 0, stagger: 0.15 },
      "-=1.2",
    )
    .to(
      ".welcome-stats .welcome-stat-card",
      { opacity: 1, y: 0, scale: 1, stagger: 0.1, ease: "back.out(1.4)" },
      "-=1",
    )
    .to(
      ".welcome-actions button",
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "elastic.out(1, 0.6)",
        duration: 1.2,
        onComplete() {
          // Only clear transform properties, NOT display, so that enter-btn hiding is preserved
          gsap.set(".welcome-actions button", {
            clearProps: "transform,scale,rotationX,rotationY,opacity",
          });
        },
      },
      "-=1.1",
    );

  // Premium Float animation with Glow Pulse
  gsap.fromTo(
    "#enter-btn",
    { y: 0, boxShadow: "0 0 0px rgba(255, 77, 109, 0)" },
    {
      y: -6,
      boxShadow: "0 15px 30px rgba(255, 77, 109, 0.4)",
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1.5,
    },
  );
}

function initRevealAnimations() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduceMotion) {
    document.body.classList.add("reduce-motion");
    return;
  }

  const revealItems = gsap.utils.toArray(".animate-item");
  if (!revealItems.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        if (item.dataset.revealed) {
          obs.unobserve(item);
          return;
        }
        gsap.to(item, {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: "power3.out",
          overwrite: "auto",
        });
        item.dataset.revealed = "true";
        obs.unobserve(item);
      });
    },
    {
      threshold: 0.04,
      rootMargin: "0px 0px 0px 0px",
    },
  );

  revealItems.forEach((item) => {
    gsap.set(item, { opacity: 0, y: 20 });
    observer.observe(item);
  });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  initSPANavigation();
  initWelcomeAnimations();
  initRevealAnimations();
  
  const unlockAudioOnGesture = () => {
    initIOSVolumeFix();
    resumeAudioContextSafely();
    window.removeEventListener("pointerdown", unlockAudioOnGesture);
    window.removeEventListener("keydown", unlockAudioOnGesture);
  };
  window.addEventListener("pointerdown", unlockAudioOnGesture, { once: true, passive: true });
  window.addEventListener("keydown", unlockAudioOnGesture, { once: true, passive: true });

  const volumeSlider = document.getElementById("volume-slider");
  const volumeValue = document.getElementById("volume-value");

  if (volumeSlider) {
    volumeSlider.value = currentVolume;

    volumeSlider.addEventListener("input", (e) => {
      currentVolume = Number(e.target.value);

      if (audioGainNode) {
        audioGainNode.gain.value = currentVolume;
      }

      if (volumeValue) {
        volumeValue.textContent = Math.round(currentVolume * 100) + "%";
      }
    });
  }

  initAnalytics();
  setupMediaSession();
  await loadSiteSettings();

  const meetEl = document.getElementById("meet-count");
  if (meetEl) meetEl.textContent = config.meetingCount;

  updateCounter();
  updateMeetingTimer();
  initDailyMessageAndRandomMemory();
  syncFloatingPlayerState();
  startPerfMainLoop();
});

// ========== PASSWORD SYSTEM ==========
const enterBtn = document.getElementById("enter-btn");
const passPanel = document.getElementById("password-panel");
const verifyBtn = document.getElementById("verify-btn");
const passInput = document.getElementById("pass-input");
const errorMsg = document.getElementById("error-msg");

enterBtn?.addEventListener("click", () => {
  addActivity("🔑 Giriş düyməsinə basdı");
  enterBtn.classList.add("hidden-by-js");
  enterBtn.style.display = "none";
  if (passPanel) {
    passPanel.classList.remove("hidden");
    passPanel.style.display = "flex";
    passPanel.classList.add("show");
    passPanel.setAttribute("aria-hidden", "false");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(
        passPanel,
        { y: 22, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.3)" },
      );
    }
  }
  if (errorMsg) errorMsg.style.display = "none";
  setTimeout(() => passInput?.focus(), 120);
});

verifyBtn?.addEventListener("click", async () => {
  const passVal = passInput.value;
  const originalBtnText = verifyBtn.innerHTML;
  verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  verifyBtn.disabled = true;

  try {
    const res = await fetch("/.netlify/functions/admin-proxy", {
      method: "POST",
      body: JSON.stringify({ type: "verify_site", password: passVal }),
    });
    const data = await res.json();

    if (data.success) {
      addActivity("✅ Şifrə daxil edib sayta girdi");
      await loadSiteSettings(true);
      document.getElementById("welcome-screen").style.opacity = "0";
      setTimeout(() => {
        document.getElementById("welcome-screen").style.display = "none";
        const mainContent = document.getElementById("main-content");
        mainContent.classList.remove("hidden");
        if (typeof window.showAnniversaryCountdownModal === "function") {
          window.showAnniversaryCountdownModal();
        }

        // Animasiyalar
        // setTimeout içində isLocked = false edirik ki, mainContent 'display: block' olduqdan sonra dəyərlər yenilənsin
        // Odometer js bu dəyişikliyi görüb 0-dan cari saata doğru fırladacaq.
        setTimeout(() => {
          window.isLocked = false;
          updateCounter();
          updateMeetingTimer();
        }, 800);

        setTimeout(() => mainContent.classList.add("animate-start"), 100);

        setTimeout(() => mainContent.classList.add("animate-start"), 100);
      }, 800);

      fetchImages();
      if (audio) {
        initVisualizer(audio);
        audio
          .play()
          .then(() => {
            isPlaying = true;
            if (document.getElementById("track-art"))
              document.getElementById("track-art").classList.add("playing");
            if (playPauseBtn)
              playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
          })
          .catch(() => console.log("Musiqi gözləmədə..."));
      }
    } else {
      throw new Error();
    }
  } catch (err) {
    addActivity("❌ Səhv şifrə daxil etdi");
    errorMsg.style.display = "block";
    passInput.value = "";
    passInput.animate(
      [
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 200 },
    );
    verifyBtn.innerHTML = originalBtnText;
    verifyBtn.disabled = false;
  }
});

passInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") verifyBtn?.click();
});
// ========== TIME TOGETHER COUNTER (ASCENDING) ==========
// 1. Rəqəmləri artıran köməkçi funksiya
function updateCounter() {
  const start = new Date(config.startDate).getTime();
  const now = Date.now();
  const diff = now - start;
  if (isNaN(diff)) return;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  const totalHours = Math.floor(diff / 3600000);
  const totalMinutes = Math.floor(diff / 60000);

  if (window.isLocked) return;

  if (!window.isAnimating) {
    perfSetText("total-days", d);
    perfSetText("detail-days", d);
    perfSetText("total-hours-love", totalHours);
    perfSetText("total-minutes-love", totalMinutes);
    perfSetText("meet-count", config.meetingCount);

    perfSetText("hours", h < 10 ? "0" + h : h);
    perfSetText("minutes", m < 10 ? "0" + m : m);
    perfSetText("seconds", sec < 10 ? "0" + sec : sec);
    perfSetText("detail-hours", h < 10 ? "0" + h : h);
    perfSetText("detail-minutes", m < 10 ? "0" + m : m);
    perfSetText("detail-seconds", sec < 10 ? "0" + sec : sec);
  }
}

let perfMainLoopStarted = false;
let perfLastSecond = -1;
let perfPhraseTick = 0;
function startPerfMainLoop() {
  if (perfMainLoopStarted) return;
  perfMainLoopStarted = true;

  const loop = (ts) => {
    const second = Math.floor(ts / 1000);
    if (second !== perfLastSecond) {
      perfLastSecond = second;
      updateCounter();
      updateMeetingTimer();
      updateDynamicContent();
    }

    if (!PERF_REDUCED_MOTION && !document.hidden) {
      const phraseStep = PERF_MOBILE ? 900 : 500;
      if (ts - perfPhraseTick > phraseStep) {
        perfPhraseTick = ts;
        fastChangeLoveText();
      }
    }

    if (document.hidden) {
      setTimeout(() => requestAnimationFrame(loop), 1000);
    } else {
      requestAnimationFrame(loop);
    }
  };

  requestAnimationFrame(loop);
}

function parseImageDate(img) {
  if (img.git_date) {
    const d = new Date(img.git_date);
    if (!isNaN(d)) return d;
  }

  const fileName = (img.name || "").replace(/\.[^.]+$/, "");

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
  const months = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "İyun",
    "İyul",
    "Avqust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d)) return "Tarix bilinmir";
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
async function fetchImages() {
  const stack = document.getElementById("gallery-stack");
  if (!stack) return;

  stack.className = "gallery-timeline";
  stack.innerHTML =
    '<p class="timeline-loading"><i class="fas fa-spinner fa-spin"></i> Xatirələr yüklənir...</p>';
  if (typeof perfDomCache !== "undefined") perfDomCache.clear();

  try {
    const data = await perfFetchJsonCached(
      "gallery-list",
      "/.netlify/functions/github-content?path=gallery",
      PERF_GITHUB_TTL,
    );

    if (!Array.isArray(data)) {
      stack.innerHTML =
        '<p class="timeline-empty">Qalereya məlumatı düzgün gəlmədi.</p>';
      return;
    }

    window.allImages = data
      .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
      .sort((a, b) => new Date(a.git_date || 0) - new Date(b.git_date || 0));

    if (window.allImages.length === 0) {
      stack.innerHTML = '<p class="timeline-empty">Hələ ki, şəkil yoxdur.</p>';
      return;
    }

    let html = "";

    window.allImages.forEach((img, idx) => {
      const side = idx % 2 === 0 ? "left" : "right";
      const dateText = formatAzDate(img.git_date);

      html += `
                <article class="timeline-item ${side}">
                    <div class="photo-frame gallery-item" data-index="${idx}">
                        <img data-src="${img.download_url}" loading="lazy" decoding="async" alt="Bizim Xatirəmiz">
                        <div class="hover-heart"><i class="fas fa-heart"></i></div>
                    </div>
                    <div class="timeline-date">
                        <i class="far fa-clock"></i> ${dateText}
                    </div>
                </article>
            `;
    });

    stack.innerHTML = html;

    // Klik hadisələrini bağla
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.onclick = function () {
        const index = parseInt(this.getAttribute("data-index"));
        window.openLightbox(index);
      };
    });

    // Animasiyalı yüklənmə — scroll etdikcə görünən animasiya
    requestAnimationFrame(() => {
      const items = stack.querySelectorAll(".timeline-item");
      let revealCounter = 0;

      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const item = entry.target;

            // Lazy-loaded şəkili yüklə
            const img = item.querySelector("img[data-src]");
            if (img && img.dataset.src && !img.getAttribute("src")) {
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
            }

            // Stagger animasiyası — hər element ardıcıl gəlsin
            const delay = Math.min(revealCounter * 60, 240);
            revealCounter++;
            setTimeout(() => {
              item.classList.add("show");
            }, delay);

            obs.unobserve(item);
          });
        },
        {
          threshold: 0,
          rootMargin: "0px 0px -60px 0px",
        },
      );

      items.forEach((item) => {
        // Səhifə açılanda artıq görünən elementlərə animasiyasız 'show' ver
        const rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const img = item.querySelector("img[data-src]");
          if (img && img.dataset.src && !img.getAttribute("src")) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
          }
          item.classList.add("show");
        } else {
          observer.observe(item);
        }
      });
    });

    syncAdminOverview();
  } catch (e) {
    console.error("Fetch xətası:", e);
    stack.innerHTML = '<p class="timeline-empty">Sistem xətası!</p>';
  }
}
window.openLightbox = function (index) {
  currentImgIdx = index;
  const lb = document.getElementById("lightbox");
  if (lb) {
    lb.style.display = "flex";
    lb.classList.add("active");
    updateLightboxContent();
  }
};

// 5. Şəkli, Tarixi və Yükləmə linkini yeniləmək
async function updateLightboxContent() {
  const images = window.allImages;
  const imgData = images[currentImgIdx];
  const lbImg = document.getElementById("lightbox-img");
  const dateEl = document.getElementById("image-date");

  if (!imgData || !lbImg) return;

  lbImg.src = imgData.download_url;

  if (dateEl) {
    const dateText = imgData.git_date
      ? formatAzDate(imgData.git_date)
      : "Tarix bilinmir";

    dateEl.innerHTML = `<i class="far fa-clock"></i> ${dateText}`;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const lb = document.getElementById("lightbox");

  // Bağlamaq
  document.getElementById("close-lb-btn")?.addEventListener("click", () => {
    lb.style.display = "none";
    lb.classList.remove("active");
  });

  // Geri
  document.getElementById("prev-btn")?.addEventListener("click", () => {
    if (window.allImages.length === 0) return;
    currentImgIdx =
      (currentImgIdx - 1 + window.allImages.length) % window.allImages.length;
    updateLightboxContent();
  });

  // İrəli
  document.getElementById("next-btn")?.addEventListener("click", () => {
    if (window.allImages.length === 0) return;
    currentImgIdx = (currentImgIdx + 1) % window.allImages.length;
    updateLightboxContent();
  });

  // Yükləmək
  document.getElementById("download-btn")?.addEventListener("click", () => {
    const imgData = window.allImages[currentImgIdx];
    if (!imgData) return;
    downloadImageFile(imgData.download_url, imgData.name);
  });

  // Silmək
  document.getElementById("delete-image-btn")?.addEventListener("click", async () => {
    const imgData = window.allImages[currentImgIdx];
    if (!imgData || !imgData.name) return;
    const pass = prompt("Şəkli silmək üçün admin şifrəsini daxil edin:");
    if (!pass) return;
    if (!confirm("Bu şəkli silməyə əminsən?")) return;

    const btn = document.getElementById("delete-image-btn");
    const origText = btn.innerHTML;
    btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Silinir...";
    btn.disabled = true;
    try {
      const res = await fetch("/.netlify/functions/admin-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "delete_image",
          password: pass,
          payload: { path: `gallery/${imgData.name}` },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const lb = document.getElementById("lightbox");
        if (lb) {
          lb.style.display = "none";
          lb.classList.remove("active");
        }
        try { localStorage.removeItem("dunyamiz-cache:gallery-list"); } catch (_) {}
        fetchImages();
      } else {
        alert("Xəta: " + (data.error || "Şifrə yanlış ola bilər."));
      }
    } catch (e) {
      console.error("Şəkil silmə xətası:", e);
      alert("Sistem xətası baş verdi.");
    } finally {
      btn.innerHTML = origText;
      btn.disabled = false;
    }
  });
});
document.addEventListener("keydown", (e) => {
  const lb = document.getElementById("lightbox");
  if (!lb || lb.style.display === "none") return;

  if (e.key === "Escape") {
    lb.style.display = "none";
    lb.classList.remove("active");
  }
  if (e.key === "ArrowRight") document.getElementById("next-btn").click();
  if (e.key === "ArrowLeft") document.getElementById("prev-btn").click();
});
// 6. Şəkli brauzerdə açmaq əvəzinə birbaşa cihaza yükləyən funksiya
async function downloadImageFile(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename || "bizim_xatira.jpg";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch (error) {
    window.open(url, "_blank");
  }
}

function getDynamicPath() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const minLen = 8;
  const maxLen = 60;
  const length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;

  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ========== HEART PARTICLES ==========
function createHeart() {
  const heart = document.createElement("div");
  heart.classList.add("heart-particle");
  heart.innerHTML = '<i class="fas fa-heart"></i>';
  heart.style.color = "pink";
  heart.style.left = Math.random() * 100 + "vw";
  heart.style.fontSize = Math.random() * 20 + 10 + "px";
  heart.style.animationDuration = Math.random() * 2 + 3 + "s";

  document.body.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, 4000);
}

if (!IS_TOUCH_DEVICE && !IS_LOW_END_DEVICE && !PERF_REDUCED_MOTION)
  setInterval(createHeart, 900);



// ========== LOVE PHRASES ==========
const lovePhrases = [
  "Səni sevirəm",
  "I Love You",
  "Seni Seviyorum",
  "Je t'aime",
  "Ich liebe dich",
  "Te amo",
  "Ti amo",
  "Eu te amo",
  "Ik hou van jou",
  "Jag älskar dig",
  "Jeg elsker dig",
  "Kocham Cię",
  "Szeretlek",
  "Miluji tě",
  "Te iubesc",
  "Volim te",
  "Σ' αγαπώ",
  "Я тебя люблю",
  "Men seni sevaman",
  "S'agapo",
  "Ana behibek",
  "Mahal kita",
  "Wo ai ni",
  "Aishiteru",
  "Saranghae",
  "Ami tomake bhalobashi",
  "Naku penda",
  "Mən səni sevirəm",
];

let phraseIndex = 0;

function fastChangeLoveText() {
  const textElement = document.getElementById("changing-love");
  if (!textElement) return;
  phraseIndex = (phraseIndex + 1) % lovePhrases.length;
  textElement.textContent = lovePhrases[phraseIndex];
}

// fastChangeLoveText is driven by the shared requestAnimationFrame loop for smoother mobile performance.

// ========== AUDIO VISUALIZER ==========
let audioContext, analyser, source, gainNode, canvas, ctx, visualizerFrame;

function resizeVisualizerCanvas() {
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  const displayWidth = Math.max(
    1,
    Math.floor(canvas.clientWidth || canvas.offsetWidth || 0),
  );
  const displayHeight = Math.max(
    1,
    Math.floor(canvas.clientHeight || canvas.offsetHeight || 0),
  );

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

    const sharedNodes = getOrCreateSharedAudioNodes(audioElement);
    if (!sharedNodes || !sharedNodes.analyser) return;

    source = sharedNodes.source;
    gainNode = sharedNodes.gain;
    analyser = sharedNodes.analyser;
    if (gainNode)
      gainNode.gain.value = Number(
        currentVolume || audioElement.volume || 0.85,
      );

    audioElement.addEventListener("play", resumeAudioContextSafely);
    audioElement.addEventListener("playing", resumeAudioContextSafely);

    canvas = document.getElementById("visualizer");
    if (!canvas) return;

    ctx = canvas.getContext("2d");
    if (!ctx) return;

    resizeVisualizerCanvas();
    window.addEventListener(
      "resize",
      perfThrottle(resizeVisualizerCanvas, 160),
      { passive: true },
    );

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let frameSkip = 0;

    const activeBars = PERF_MOBILE ? 16 : 28;
    const smoothedBars = new Float32Array(activeBars);

    const draw = () => {
      if (document.hidden || audioElement.paused || !canvas || !ctx) {
        stopVisualizer();
        return;
      }

      visualizerFrame = requestAnimationFrame(draw);
      if (PERF_MOBILE && ++frameSkip % 2 !== 0) return;

      const width = canvas.clientWidth || canvas.offsetWidth || 0;
      const height = canvas.clientHeight || canvas.offsetHeight || 0;
      if (!width || !height) return;

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);

      let sum = 0;
      for (let j = 0; j < 32; j++) sum += dataArray[j];
      const hasRealAudio = sum > 0;

      const centerY = height / 2;
      const barWidth = Math.max(3, Math.floor(width / (activeBars * 1.85)));
      const gap = Math.max(2, Math.floor(barWidth * 0.45));
      const totalWidth = activeBars * barWidth + (activeBars - 1) * gap;
      let x = Math.max(0, (width - totalWidth) / 2);

      const rootStyle = getComputedStyle(document.documentElement);
      const c1 = rootStyle.getPropertyValue("--player-color-1").trim() || currentWaveColor || "#ff2d55";
      const c2 = rootStyle.getPropertyValue("--player-color-2").trim() || "#5856d6";
      const c3 = rootStyle.getPropertyValue("--player-color-4").trim() || currentWaveColor || "#af52de";

      ctx.shadowBlur = PERF_MOBILE ? 0 : 8;
      ctx.shadowColor = c1;

      const curTime = audioElement.currentTime || 0;
      const halfBars = (activeBars - 1) / 2;

      for (let i = 0; i < activeBars; i++) {
        let targetValue = 0;
        if (hasRealAudio) {
          // Symmetrical mapping: bass in center, mids and highs on flanks
          const dist = Math.abs(i - halfBars) / halfBars;
          const bin = Math.min(bufferLength - 1, Math.floor(Math.pow(dist, 1.3) * (bufferLength * 0.4)));
          targetValue = (dataArray[bin] || 0) / 255;
        } else {
          // Dynamic musical rhythm simulation when Web Audio is silent/cross-origin
          const beat1 = Math.sin(curTime * 8) * 0.4 + 0.5;
          const beat2 = Math.cos(curTime * 4 + i * 0.45) * 0.3 + 0.35;
          const centerWeight = 1 - (Math.abs(i - halfBars) / halfBars) * 0.5;
          targetValue = Math.min(1, Math.max(0.12, (beat1 * 0.6 + beat2 * 0.4) * centerWeight));
        }

        smoothedBars[i] = smoothedBars[i] * 0.74 + targetValue * 0.26;
        const value = smoothedBars[i];

        const barHeight = Math.max(6, value * height * 0.88);
        const y = centerY - barHeight / 2;
        const radius = barWidth / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, c1);
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
        grad.addColorStop(1, c2 || c3);

        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }

        ctx.fillStyle = grad;
        ctx.fill();
        x += barWidth + gap;
      }

      ctx.shadowBlur = 0;
    };

    const startVisualizer = async () => {
      await resumeAudioContextSafely();
      if (!visualizerFrame && !audioElement.paused && !document.hidden) draw();
    };

    audioElement.addEventListener("play", startVisualizer);
    audioElement.addEventListener("playing", startVisualizer);
    audioElement.addEventListener("pause", stopVisualizer);
    audioElement.addEventListener("ended", stopVisualizer);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopVisualizer();
      else if (!audioElement.paused) startVisualizer();
    });

    startVisualizer();
  } catch (e) {
    console.error("Vizualizator xətası:", e);
  }
}

// ========== MEETING TIMER ==========
function updateMeetingTimer() {
  if (!(targetDate instanceof Date) || Number.isNaN(targetDate.getTime()))
    return;

  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  const aylar = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "İyun",
    "İyul",
    "Avqust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];
  const gun = targetDate.getDate();
  const ayAdi = aylar[targetDate.getMonth()];
  const saat = String(targetDate.getHours()).padStart(2, "0");
  const deqiqe = String(targetDate.getMinutes()).padStart(2, "0");
  const formatliTarix = `${gun} ${ayAdi} saat ${saat}:${deqiqe}`;

  const titleEl = document.querySelector(".meeting-timer h3");
  if (titleEl && titleEl.textContent !== "Növbəti Görüşümüzə Qalan Vaxt:")
    titleEl.textContent = "Növbəti Görüşümüzə Qalan Vaxt:";

  const dateEl = document.getElementById("next-meeting-date");
  if (dateEl && dateEl.textContent !== "Görüş vaxtı: " + formatliTarix)
    dateEl.textContent = "Görüş vaxtı: " + formatliTarix;

  const setValue = (id, value) =>
    perfSetText(id, String(value).padStart(2, "0"));

  if (window.isLocked) return;

  if (diff <= 0) {
    if (titleEl && titleEl.textContent !== "Görüş vaxtı gəldi!")
      titleEl.textContent = "Görüş vaxtı gəldi!";
    if (!window.isAnimating) {
      setValue("meet-days", 0);
      setValue("meet-hours", 0);
      setValue("meet-minutes", 0);
      setValue("meet-seconds", 0);
    }
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  if (!window.isAnimating) {
    setValue("meet-days", d);
    setValue("meet-hours", h);
    setValue("meet-minutes", m);
    setValue("meet-seconds", s);
  }
}

updateMeetingTimer();

// ========== MEDIA SESSION ==========

document.addEventListener("visibilitychange", () => {
  const dom = typeof getMusicDom === "function" ? getMusicDom() : null;
  const activeAudio = dom?.audio || audio;
  if (!activeAudio) return;

  if (document.hidden && !activeAudio.paused) {
    activeAudio.dataset.shouldResume = "true";
  } else if (!document.hidden && activeAudio.dataset.shouldResume === "true" && activeAudio.paused) {
    activeAudio.play().catch(() => {});
    delete activeAudio.dataset.shouldResume;
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
    perfSetHtml(
      "dynamic-greeting",
      greeting + ", Cəmaləm <span style='color: #ff4d6d;'><i class=\"fas fa-heart\"></i></span>",
    );
  }

  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  const timeString = `${String(hour).padStart(2, "0")}:${minute}:${second}`;

  const aylar = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "İyun",
    "İyul",
    "Avqust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];
  const gunler = [
    "Bazar",
    "Bazar ertəsi",
    "Çərşənbə axşamı",
    "Çərşənbə",
    "Cümə axşamı",
    "Cümə",
    "Şənbə",
  ];
  const gunAdi = gunler[now.getDay()];
  const ayGun = now.getDate();
  const ayAdi = aylar[now.getMonth()];
  const il = now.getFullYear();

  const clockElement = document.getElementById("live-clock");
  if (clockElement) {
    perfSetText(
      "live-clock",
      `${timeString} | ${gunAdi}, ${ayGun} ${ayAdi} ${il}`,
    );
  }
}

updateDynamicContent();

// ========== AUDIO CONTROLS ==========
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

if (audio) {
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  audio.preload = "metadata";

  audio.addEventListener("loadedmetadata", () => {
    if (seekBar) seekBar.max = Math.floor(audio.duration || 0);
    if (durationEl) durationEl.textContent = formatTime(audio.duration || 0);
  });

  audio.addEventListener("timeupdate", () => {
    if (seekBar) seekBar.value = Math.floor(audio.currentTime || 0);
    if (currentTimeEl)
      currentTimeEl.textContent = formatTime(audio.currentTime || 0);
    if (seekBar && audio.duration) {
      const progress = (audio.currentTime / audio.duration) * 100;
      seekBar.style.setProperty("--progress", progress + "%");
    }
  });

  audio.addEventListener("play", async () => {
    const dom = typeof getMusicDom === "function" ? getMusicDom() : null;
    if (dom?.audio && !dom.audio.paused) {
      dom.audio.pause();
    }
    isPlaying = true;
    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    document.getElementById("track-art")?.classList.add("playing");
    if (audioContext?.state === "suspended") {
      try {
        await audioContext.resume();
      } catch (_) {}
    }
    initVisualizer(audio);
  });

  audio.addEventListener("pause", () => {
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    document.getElementById("track-art")?.classList.remove("playing");
  });

  seekBar?.addEventListener("input", () => {
    audio.currentTime = Number(seekBar.value || 0);
  });

  playPauseBtn?.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
      } catch (err) {
        console.error("Legacy audio play error:", err);
      }
    } else {
      audio.pause();
    }
  });

  muteBtn?.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });
}

// ========== LOVE POWER (HEART HOLD) ==========
let holdTimer;
let power = 0;
const heartBtn = document.getElementById("hold-heart");
const percentText = document.getElementById("power-percent");
const loveBg = document.createElement("div");
loveBg.className = "love-active-bg";
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
  percentText.textContent = power + "%";
  heartBtn.style.transform = `scale(${1 + power / 100})`;
  loveBg.style.opacity = power / 100;

  if (power >= 100) {
    heartBtn.style.filter = `drop-shadow(0 0 30px #ff4d6d)`;
    percentText.innerHTML = "Səni Çox Sevirəm <i class='fas fa-heart'></i>";

    // Premium particle burst
    if (!heartBtn.dataset.burst) {
      heartBtn.dataset.burst = "true";
      for (let i = 0; i < 30; i++) setTimeout(() => createHeart(), i * 40);
    }
  } else {
    heartBtn.style.filter = `drop-shadow(0 0 ${power / 3}px #ff4d6d)`;
    heartBtn.dataset.burst = "";
  }
}

if (heartBtn) {
  heartBtn.addEventListener("mousedown", startHolding);
  heartBtn.addEventListener("mouseup", stopHolding);
  heartBtn.addEventListener("mouseleave", stopHolding);
  heartBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startHolding();
  });
  heartBtn.addEventListener("touchend", stopHolding);
}

// ========== TRAIL PARTICLES ==========
function createParticle(x, y) {
  const p = document.createElement("div");
  p.className = "trail-particle";
  p.style.left = x + "px";
  p.style.top = y + "px";

  const size = Math.random() * 7 + 3;
  p.style.width = size + "px";
  p.style.height = size + "px";

  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1200);
}

document.addEventListener("mousemove", (e) =>
  createParticle(e.clientX, e.clientY),
);
document.addEventListener("touchmove", (e) =>
  createParticle(e.touches[0].clientX, e.touches[0].clientY),
);

// ========== TILT EFFECT ==========
const tiltElements = document.querySelectorAll(
  ".time-box, .music-player, .quote-card, .envelope",
);

tiltElements.forEach((el) => {
  el.addEventListener("mousemove", (e) => {
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

  el.addEventListener("mouseleave", () => {
    el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    el.style.boxShadow = "";
  });
});

// ========== ADMIN PANEL ==========
let clicks = 0;
let clickTimer;

window.addEventListener("click", (e) => {
  if (
    e.target.closest(".admin-content") ||
    e.target.tagName === "BUTTON" ||
    e.target.tagName === "INPUT"
  )
    return;

  clicks++;
  clearTimeout(clickTimer);
  if (clicks === 4) {
    openAdminPanel();
    clicks = 0;
  }
  clickTimer = setTimeout(() => {
    clicks = 0;
  }, 500);
});
function slugifyMusicName(str = "") {
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ə/g, "e")
    .replace(/Ə/g, "E")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
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
  let binary = "";
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
      const result = e?.target?.result || "";
      const base64 = String(result).split(",")[1] || "";
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

function setAdminStatus(message = "", type = "info") {
  const statusEl = document.getElementById("admin-status");
  if (!statusEl) return;

  if (!message) {
    statusEl.textContent = "";
    statusEl.className = "admin-status";
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

function toPlainErrorText(value = "") {
  return String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAdminRequestError(response, result = {}, rawText = "") {
  const requestId =
    response.headers.get("x-nf-request-id") ||
    response.headers.get("x-request-id") ||
    "";
  const mainDetail =
    result?.error ||
    result?.message ||
    result?.details?.error ||
    result?.details?.message ||
    result?.stack ||
    toPlainErrorText(rawText);
  const lines = [
    `Xəta baş verdi (${response.status} ${response.statusText}).`,
    mainDetail || "Serverdən xəta detalları alınmadı.",
  ];

  if (requestId) {
    lines.push(`Request ID: ${requestId}`);
  }

  return lines.filter(Boolean).join("\n");
}

function setAdminButtonLoading(button, isLoading, label) {
  if (!button) return;
  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.innerHTML;
  }

  button.disabled = isLoading;
  button.innerHTML = isLoading
    ? `<i class="fas fa-spinner fa-spin"></i><span>${label || "Gözləyin..."}</span>`
    : button.dataset.defaultLabel;
}

async function convertAudioFileToBase64(file) {
  const buffer = await readFileAsArrayBuffer(file);
  return arrayBufferToBase64(buffer);
}
async function uploadToCloudinary(
  file,
  { cloudName, preset, resourceType = "auto", folder = "" },
) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", preset);

  if (folder) {
    formData.append("folder", folder);
  }

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data?.error?.message || "Cloudinary upload xətası baş verdi.",
    );
  }

  return data;
}
function getAdminPasswordFieldId(type) {
  return (
    {
      update_config: "admin-password-settings",
      upload_image: "admin-password-gallery",
      upload_music: "admin-password-music",
      upload_note: "admin-password-extras",
      upload_film: "admin-password-extras",
    }[type] || "admin-password-settings"
  );
}
function getAdminPassword(type) {
  const fieldId = getAdminPasswordFieldId(type);
  const input = document.getElementById(fieldId);
  return input ? input.value.trim() : "";
}
async function handleAdminUpdate(type) {
  const password = getAdminPassword(type);
  if (!password) {
    setAdminStatus("Bu bölmə üçün şifrəni daxil et!", "error");
    return alert("Bu bölmə üçün şifrəni daxil et!");
  }

  const triggerButton = {
    update_config: document.getElementById("update-config-btn"),
    upload_image: document.getElementById("upload-image-btn"),
    upload_music: document.getElementById("upload-music-btn"),
  }[type];

  let requestPayload = { path: "" };

  try {
    setAdminStatus("Əməliyyat hazırlanır...", "info");
    setAdminButtonLoading(triggerButton, true, "Yüklənir...");

    if (type === "update_config") {
      const newDate = document.getElementById("admin-date").value;
      const newCount = document.getElementById("admin-count").value;

      if (!newDate && !newCount) {
        throw new Error("Dəyişiklik yoxdur!");
      }

      requestPayload = {
        path: "hcayar.js",
        newDate,
        newCount,
      };
    } else if (type === "upload_image") {
      const fileInput = document.getElementById("admin-file");
      const file = fileInput?.files?.[0];

      if (!file) throw new Error("Şəkil seçin!");

      const base64 = await encodeFileAsBase64(file);

      requestPayload = {
        path: `gallery/${Date.now()}_${file.name.replace(/\s+/g, "_")}`,
        content: base64,
      };
    } else if (type === "upload_music") {
      const audioFile = document.getElementById("admin-music-file")?.files?.[0];
      const coverFile =
        document.getElementById("admin-music-cover")?.files?.[0] || null;
      const title = document.getElementById("admin-music-title")?.value.trim();
      const artist = document
        .getElementById("admin-music-artist")
        ?.value.trim();
      const lyricsType =
        document.getElementById("admin-lyrics-type")?.value || "none";
      const lyricsText =
        document.getElementById("admin-lyrics-text")?.value || "";
      const musicSource =
        document.getElementById("admin-music-source")?.value || "github";

      if (!audioFile) throw new Error("Musiqi faylı seç!");
      if (!title) throw new Error("Mahnı adı yaz!");
      if (!artist) throw new Error("Artist adı yaz!");
      const ext = audioFile.name.split(".").pop()?.toLowerCase();
      if (ext !== "mp3") throw new Error("Yalnız MP3 yüklə!");
      const slugBase =
        `${title}-${artist}`
          .toLowerCase()
          .replace(/[^a-z0-9əöüğşıç-]+/gi, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || `track-${Date.now()}`;

      const slug = `${slugBase}-${Date.now()}`;

      let audioField = "";
      let coverField = "";

      const musicMeta = {
        id: slug,
        title,
        artist,
        lyrics: {
          type: lyricsType,
          text: lyricsText.trim(),
        },
        uploadedAt: new Date().toISOString(),
      };

      if (musicSource === "cloudinary") {
        setAdminStatus("Cloudinary-yə yüklənir...", "info");

        const cloudName = "dkhuq9o1h";

        const audioUpload = await uploadToCloudinary(audioFile, {
          cloudName,
          preset: "dunyamiz_audio_unsigned",
          resourceType: "video",
          folder: "dunyamiz/music",
        });

        audioField = audioUpload.secure_url;

        if (coverFile) {
          const coverUpload = await uploadToCloudinary(coverFile, {
            cloudName,
            preset: "dunyamiz_cover_unsigned",
            resourceType: "image",
            folder: "dunyamiz/covers",
          });

          coverField = coverUpload.secure_url;
        }

        musicMeta.audio = audioField;
        if (coverField) musicMeta.cover = coverField;

        requestPayload = {
          path: `musiqiler/${slug}.json`,
          content: encodeBase64Utf8(JSON.stringify(musicMeta, null, 2)),
        };

        type = "upload_music_json";
      } else if (musicSource === "r2") {
        setAdminStatus(
          "Cloudflare R2 üçün imzalı yükləmə hazırlanır...",
          "info",
        );

        const coverExt = coverFile
          ? coverFile.name.split(".").pop()?.toLowerCase() || "jpg"
          : "jpg";

        const prepResponse = await fetch("/.netlify/functions/admin-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "prepare_r2_music_upload",
            password,
            payload: {
              slug,
              hasCover: Boolean(coverFile),
              coverExt,
            },
          }),
        });

        const { rawText: prepRawText, data: prepResult } =
          await parseAdminApiResponse(prepResponse);
        if (!prepResponse.ok || !prepResult.success) {
          throw new Error(
            buildAdminRequestError(prepResponse, prepResult, prepRawText),
          );
        }

        const prep = prepResult.details || {};

        setAdminStatus("MP3 Cloudflare R2-yə yüklənir...", "info");
        const audioPut = await fetch(prep.audioUploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": audioFile.type || "audio/mpeg",
          },
          body: audioFile,
        });

        if (!audioPut.ok) {
          const raw = await audioPut.text();
          throw new Error(
            `R2 audio upload xətası (${audioPut.status}): ${raw || audioPut.statusText}`,
          );
        }

        if (coverFile && prep.coverUploadUrl) {
          setAdminStatus("Cover Cloudflare R2-yə yüklənir...", "info");
          const coverPut = await fetch(prep.coverUploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": coverFile.type || "image/jpeg",
            },
            body: coverFile,
          });

          if (!coverPut.ok) {
            const raw = await coverPut.text();
            throw new Error(
              `R2 cover upload xətası (${coverPut.status}): ${raw || coverPut.statusText}`,
            );
          }
        }

        requestPayload = {
          slug,
          jsonPath: prep.jsonPath,
          trackMeta: {
            ...musicMeta,
            provider: "r2",
          },
          r2AudioKey: prep.audioKey,
          r2CoverKey: prep.coverKey || "",
          audioUrl: prep.audioPublicUrl,
          coverUrl: prep.coverPublicUrl || "",
        };

        type = "finalize_r2_music_upload";
      } else {
        setAdminStatus("GitHub üçün fayllar hazırlanır...", "info");

        const audioBase64 = await convertAudioFileToBase64(audioFile);
        const coverBase64 = coverFile
          ? await encodeFileAsBase64(coverFile)
          : "";
        const coverExt = coverFile
          ? coverFile.name.split(".").pop()?.toLowerCase() || "jpg"
          : "";
        const coverFileName = coverFile ? `${slug}.${coverExt}` : "";

        audioField = `musiqiler/${slug}.mp3`;
        coverField = coverFileName ? `musiqiler/${coverFileName}` : "";

        musicMeta.audio = audioField;
        if (coverField) musicMeta.cover = coverField;

        requestPayload = {
          slug,
          audioPath: audioField,
          jsonPath: `musiqiler/${slug}.json`,
          audioContent: audioBase64,
          coverPath: coverField,
          coverContent: coverBase64,
          jsonContent: encodeBase64Utf8(JSON.stringify(musicMeta, null, 2)),
        };
      }
    }
    setAdminStatus("Serverə göndərilir...", "info");
    const response = await fetch("/.netlify/functions/admin-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        password,
        payload: requestPayload,
      }),
    });

    const { rawText, data: result } = await parseAdminApiResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(buildAdminRequestError(response, result, rawText));
    }

    setAdminStatus("Uğurla yerinə yetirildi! Səhifə yenilənir...", "success");
    setTimeout(() => location.reload(), 900);
  } catch (err) {
    console.error(err);
    const errorMessage = err?.message || "Serverə qoşulmaq mümkün olmadı.";
    setAdminStatus(errorMessage, "error");
  } finally {
    setAdminButtonLoading(triggerButton, false);
  }
}

// ========== ADMIN BUTTONS ==========

function createFileListFromSingleFile(file) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  return transfer.files;
}

function assignFileToInput(input, file) {
  if (!input || !file) return;
  input.files = createFileListFromSingleFile(file);
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setDropzoneState(dropzone, state = "", file = null) {
  if (!dropzone) return;
  dropzone.classList.toggle("is-dragover", state === "dragover");
  dropzone.classList.toggle("is-filled", state === "filled");

  const titleEl = dropzone.querySelector("strong");
  const subEl = dropzone.querySelector("span");

  if (state === "filled" && file) {
    if (titleEl) titleEl.textContent = file.name;
    if (subEl) subEl.textContent = formatFileSize(file.size);
    return;
  }

  const defaults =
    {
      "admin-music-dropzone": {
        title: "MP3 faylı bura sürüklə və burax",
        sub: "Toxunub fayl seçə də bilərsən",
      },
      "admin-cover-dropzone": {
        title: "Cover şəklini bura sürüklə və burax",
        sub: "PNG, JPG, WEBP və digər şəkillər",
      },
    }[dropzone.id] || {};

  if (titleEl)
    titleEl.textContent =
      defaults.title || titleEl.dataset.defaultTitle || titleEl.textContent;
  if (subEl)
    subEl.textContent =
      defaults.sub || subEl.dataset.defaultSub || subEl.textContent;
}

function bindAdminDropzone(dropzoneId, inputId, options = {}) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  if (!dropzone || !input) return;

  const accept = Array.isArray(options.accept) ? options.accept : [];
  const validate =
    typeof options.validate === "function" ? options.validate : () => true;

  const onPick = () => input.click();
  dropzone.addEventListener("click", onPick);
  dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "dragend", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      if (eventName !== "drop") {
        dropzone.classList.remove("is-dragover");
      }
    });
  });

  dropzone.addEventListener("drop", (event) => {
    dropzone.classList.remove("is-dragover");
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    const mimeOk =
      !accept.length ||
      accept.some(
        (item) =>
          file.type.startsWith(item) || file.name.toLowerCase().endsWith(item),
      );
    if (!mimeOk || !validate(file)) return;

    assignFileToInput(input, file);
    setDropzoneState(dropzone, "filled", file);
  });

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    setDropzoneState(dropzone, file ? "filled" : "", file || null);
  });

  const titleEl = dropzone.querySelector("strong");
  const subEl = dropzone.querySelector("span");
  if (titleEl) titleEl.dataset.defaultTitle = titleEl.textContent;
  if (subEl) subEl.dataset.defaultSub = subEl.textContent;
}

function sanitizeMusicPart(value = "") {
  return String(value)
    .replace(/\[[^\]]*?\]/g, " ")
    .replace(
      /\([^)]*?(official|audio|lyrics|video|prod|remix|version|clip)[^)]*?\)/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function parseTitleArtistFromFileName(fileName = "") {
  const raw = String(fileName)
    .replace(/\.[^.]+$/, "")
    .replace(/[_]+/g, " ")
    .trim();
  const cleaned = sanitizeMusicPart(raw);

  const parts = cleaned
    .split(/\s+-\s+|\s+–\s+|\s+—\s+/)
    .map(sanitizeMusicPart)
    .filter(Boolean);
  if (parts.length >= 2) {
    return {
      artist: parts[0],
      title: parts.slice(1).join(" - "),
    };
  }

  return {
    artist: "",
    title: cleaned,
  };
}

function decodeId3TextFrame(frameBytes) {
  if (!frameBytes || !frameBytes.length) return "";
  const encoding = frameBytes[0];
  const body = frameBytes.slice(1);

  try {
    if (encoding === 0x00 || encoding === 0x03) {
      return new TextDecoder(encoding === 0x03 ? "utf-8" : "iso-8859-1")
        .decode(body)
        .replace(/ /g, "")
        .trim();
    }

    if (encoding === 0x01 || encoding === 0x02) {
      let bytes = body;
      let decoder = "utf-16le";

      if (encoding === 0x01 && body.length >= 2) {
        if (body[0] === 0xfe && body[1] === 0xff) {
          decoder = "utf-16be";
          bytes = body.slice(2);
        } else if (body[0] === 0xff && body[1] === 0xfe) {
          decoder = "utf-16le";
          bytes = body.slice(2);
        }
      } else if (encoding === 0x02) {
        decoder = "utf-16be";
      }

      return new TextDecoder(decoder).decode(bytes).replace(/ /g, "").trim();
    }
  } catch (_) {
    return "";
  }

  return "";
}

function readSyncSafeInteger(bytes) {
  return (
    ((bytes[0] & 0x7f) << 21) |
    ((bytes[1] & 0x7f) << 14) |
    ((bytes[2] & 0x7f) << 7) |
    (bytes[3] & 0x7f)
  );
}

async function extractMusicMetadataFromFile(file) {
  const fallback = parseTitleArtistFromFileName(file?.name || "");
  if (!file) return fallback;

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (
      bytes.length >= 10 &&
      String.fromCharCode(...bytes.slice(0, 3)) === "ID3"
    ) {
      const version = bytes[3];
      const tagSize = readSyncSafeInteger(bytes.slice(6, 10));
      let offset = 10;

      while (offset + 10 <= bytes.length && offset < 10 + tagSize) {
        const frameId = String.fromCharCode(...bytes.slice(offset, offset + 4));
        let frameSize = 0;

        if (!frameId.trim()) break;

        if (version === 4) {
          frameSize = readSyncSafeInteger(bytes.slice(offset + 4, offset + 8));
        } else {
          frameSize =
            (bytes[offset + 4] << 24) |
            (bytes[offset + 5] << 16) |
            (bytes[offset + 6] << 8) |
            bytes[offset + 7];
        }

        if (!frameSize || offset + 10 + frameSize > bytes.length) break;

        const frameContent = bytes.slice(offset + 10, offset + 10 + frameSize);
        if (frameId === "TIT2")
          fallback.title = decodeId3TextFrame(frameContent) || fallback.title;
        if (frameId === "TPE1")
          fallback.artist = decodeId3TextFrame(frameContent) || fallback.artist;

        offset += 10 + frameSize;

        if (fallback.title && fallback.artist) break;
      }
    }

    if ((!fallback.title || !fallback.artist) && bytes.length >= 128) {
      const tail = bytes.slice(bytes.length - 128);
      if (String.fromCharCode(...tail.slice(0, 3)) === "TAG") {
        const decoder = new TextDecoder("iso-8859-1");
        const title = decoder
          .decode(tail.slice(3, 33))
          .replace(/ /g, "")
          .trim();
        const artist = decoder
          .decode(tail.slice(33, 63))
          .replace(/ /g, "")
          .trim();
        fallback.title = fallback.title || title;
        fallback.artist = fallback.artist || artist;
      }
    }
  } catch (_) {}

  fallback.title = sanitizeMusicPart(fallback.title);
  fallback.artist = sanitizeMusicPart(fallback.artist);
  return fallback;
}

async function fillMusicMetadataFromSelectedFile(forceOverwrite = false) {
  const file = document.getElementById("admin-music-file")?.files?.[0];
  const titleInput = document.getElementById("admin-music-title");
  const artistInput = document.getElementById("admin-music-artist");
  const statusEl = document.getElementById("admin-auto-metadata-status");

  if (!file || !titleInput || !artistInput) {
    if (statusEl)
      statusEl.textContent =
        "Əvvəl MP3 seç. Sistem əvvəl ID3 tag-a, tapa bilməsə fayl adına baxacaq.";
    return;
  }

  const hasManualTitle = titleInput.value.trim().length > 0;
  const hasManualArtist = artistInput.value.trim().length > 0;

  if (!forceOverwrite && hasManualTitle && hasManualArtist) {
    if (statusEl)
      statusEl.textContent =
        "Title və artist artıq doludur. İstəsən düyməyə basıb yenidən çıxarda bilərsən.";
    return;
  }

  if (statusEl) statusEl.textContent = "Metadata oxunur...";
  const meta = await extractMusicMetadataFromFile(file);

  if ((forceOverwrite || !hasManualTitle) && meta.title) {
    titleInput.value = meta.title;
  }

  if ((forceOverwrite || !hasManualArtist) && meta.artist) {
    artistInput.value = meta.artist;
  }

  if (statusEl) {
    if (meta.title || meta.artist) {
      const bits = [];
      if (meta.title) bits.push(`title: ${meta.title}`);
      if (meta.artist) bits.push(`artist: ${meta.artist}`);
      statusEl.textContent = `Tapıldı — ${bits.join(" • ")}`;
    } else {
      statusEl.textContent =
        "Metadata tapılmadı. Fayl adını və ya ID3 tag-ları yoxla.";
    }
  }

  if (typeof syncAdminOverview === "function") {
    syncAdminOverview();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const updateBtn = document.getElementById("update-config-btn");
  const uploadImageBtn = document.getElementById("upload-image-btn");
  const uploadMusicBtn = document.getElementById("upload-music-btn");
  const galleryFileInput = document.getElementById("admin-file");
  const musicFileInput = document.getElementById("admin-music-file");
  const coverFileInput = document.getElementById("admin-music-cover");
  const coverPreview = document.getElementById("admin-cover-preview");
  const galleryMeta = document.getElementById("admin-file-meta");
  const musicMeta = document.getElementById("admin-music-file-meta");
  const coverMeta = document.getElementById("admin-music-cover-meta");
  const autoMetaButton = document.getElementById("admin-auto-metadata-btn");

  if (updateBtn) {
    updateBtn.onclick = () => handleAdminUpdate("update_config");
  }

  if (uploadImageBtn) {
    uploadImageBtn.onclick = () => handleAdminUpdate("upload_image");
  }

  if (uploadMusicBtn) {
    uploadMusicBtn.onclick = () => handleAdminUpdate("upload_music");
  }

  galleryFileInput?.addEventListener("change", () => {
    const file = galleryFileInput.files?.[0];
    if (galleryMeta) {
      galleryMeta.textContent = file
        ? `${file.name} • ${formatFileSize(file.size)}`
        : "PNG, JPG, WEBP və digər şəkillər dəstəklənir.";
    }
  });

  musicFileInput?.addEventListener("change", async () => {
    const file = musicFileInput.files?.[0];
    if (musicMeta) {
      musicMeta.textContent = file
        ? `${file.name} • ${formatFileSize(file.size)}`
        : "Yalnız .mp3 formatı qəbul edilir.";
    }

    if (file) {
      await fillMusicMetadataFromSelectedFile(false);
    } else {
      const statusEl = document.getElementById("admin-auto-metadata-status");
      if (statusEl) {
        statusEl.textContent =
          "Əvvəl MP3 seç. Sistem əvvəl ID3 tag-a, tapa bilməsə fayl adına baxacaq.";
      }
    }
  });

  coverFileInput?.addEventListener("change", () => {
    const file = coverFileInput.files?.[0];
    if (coverMeta) {
      coverMeta.textContent = file
        ? `${file.name} • ${formatFileSize(file.size)}`
        : "İstəyə bağlıdır. Yükləsən, JSON-a da əlavə olunacaq.";
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

  bindAdminDropzone("admin-music-dropzone", "admin-music-file", {
    accept: ["audio/", ".mp3"],
    validate: (file) => {
      const ok = file.name.toLowerCase().endsWith(".mp3");
      if (!ok) {
        setAdminStatus("Yalnız MP3 faylı ata bilərsən.", "error");
      }
      return ok;
    },
  });

  bindAdminDropzone("admin-cover-dropzone", "admin-music-cover", {
    accept: ["image/"],
    validate: (file) => {
      const ok = file.type.startsWith("image/");
      if (!ok) {
        setAdminStatus("Cover üçün yalnız şəkil faylı ata bilərsən.", "error");
      }
      return ok;
    },
  });

  autoMetaButton?.addEventListener("click", async () => {
    await fillMusicMetadataFromSelectedFile(true);
  });
});
// Bu kodu hcayar.js faylının ən sonuna yapışdır
document.addEventListener("DOMContentLoaded", () => {
  const letterTypes = {
    "env-miss": "miss",
    "env-sad": "sad",
    "env-happy": "happy",
    "env-us": "us",
  };

  // Məktubları açmaq üçün
  for (const [id, type] of Object.entries(letterTypes)) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", () => {
        window.openLetter(type);
      });
    }
  }

  // Modalın bağlanması üçün
  const closeBtn = document.getElementById("close-modal-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("letter-modal").style.display = "none";
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const closeAdminBtn = document.querySelector(".close-admin");
  const adminPanel = document.getElementById("admin-panel");

  // X düyməsinə basanda bağlamaq üçün
  if (closeAdminBtn && adminPanel) {
    closeAdminBtn.addEventListener("click", () => {
      adminPanel.style.display = "none";
    });
  }

  // Əlavə olaraq: Panelin kənarına (boz arxafona) basanda da bağlanması üçün
  window.addEventListener("click", (event) => {
    if (event.target === adminPanel) {
      closeAdminPanel();
    }
  });
});
// Fix: also fix duplicate close handler to use the proper function
document.addEventListener("DOMContentLoaded", () => {
  const closeAdminBtn2 = document.querySelector(".close-admin");
  if (closeAdminBtn2 && !closeAdminBtn2.dataset.bound) {
    closeAdminBtn2.dataset.bound = "true";
    closeAdminBtn2.addEventListener("click", closeAdminPanel);
  }
});
// Notlar funksiyası
window.musicLibrary = [];
window.currentMusic = null;
window.currentMusicIndex = -1;
window.currentMusicLyricsParsed = [];
window.currentMusicLyricsType = "none";
window.currentLyricsActiveIndex = -1;
window.currentLyricsActiveWordIndex = -1;
window.musicShuffleEnabled = false;
window.musicRepeatMode = "off";
window.musicShuffleQueue = [];
window.musicPlaybackHistory = [];

const DEFAULT_MUSIC_COVER = "assets/music-cover.jpg";
const GITHUB_RAW_BASE = "/.netlify/functions/github-raw?file=";

function resolveMusicAssetUrl(value, fallback = "") {
  if (!value) return fallback;

  const cleaned = String(value).trim();
  if (!cleaned) return fallback;

  // Tam URL-dirsə saxla, amma cdn.dunyamiz.me əvəzinə r2.dev istifadə et
  if (/^https?:\/\//i.test(cleaned)) {
    if (cleaned.includes("cdn.dunyamiz.me")) {
      return cleaned.replace(/https?:\/\/cdn\.dunyamiz\.me/i, "https://pub-666d6610385a45cfb0c81c9e29a9e45a.r2.dev");
    }
    try {
      const url = new URL(cleaned);
      const fileParam = url.searchParams.get("file");
      if (
        url.pathname.includes("/.netlify/functions/github-raw") &&
        fileParam
      ) {
        const pathPart = fileParam.replace(/^\/+/, "");
        const segments = pathPart.split("/").map(seg => encodeURIComponent(decodeURIComponent(seg)));
        return `/${segments.join("/")}`;
      }
    } catch (_) {}
    return cleaned;
  }

  let normalized = cleaned.replace(/^\/+/, "");

  if (normalized.includes(".netlify/functions/github-raw")) {
    try {
      const fakeUrl = new URL(normalized, window.location.origin);
      const fileParam = fakeUrl.searchParams.get("file");
      if (fileParam) normalized = fileParam.replace(/^\/+/, "");
    } catch (_) {}
  }

  if (!normalized.startsWith("musiqiler/") && !normalized.startsWith("assets/")) {
    normalized = `musiqiler/${normalized}`;
  }

  // Statik fayl yolu kimi birbaşa qaytar (Vite/Netlify dist içində musiqiler/ qovluğu birbaşa mövcuddur)
  const segments = normalized.split("/").map(seg => encodeURIComponent(decodeURIComponent(seg)));
  return `/${segments.join("/")}`;
}
function normalizeTrackMeta(meta = {}) {
  const audioValue = meta.audio || (meta.file ? `musiqiler/${meta.file}` : "");
  const coverValue = meta.cover || meta.coverUrl || "";

  return {
    ...meta,
    audio: audioValue,
    cover: coverValue,
    audioUrl: resolveMusicAssetUrl(audioValue),
    coverUrl: resolveMusicAssetUrl(coverValue, DEFAULT_MUSIC_COVER),
  };
}
function formatMusicTime(seconds = 0) {
  if (!isFinite(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function escapeHtmlMusic(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseLrcTimeToSeconds(timeStr) {
  const cleaned = String(timeStr).replace(",", ".").trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fraction = Number((match[3] || "0").padEnd(3, "0").slice(0, 3)) / 1000;
  return minutes * 60 + seconds + fraction;
}

function parseSyncedLyrics(lrcText = "") {
  const rawLines = String(lrcText).split(/\r?\n/);
  const parsed = [];

  rawLines.forEach((rawLine) => {
    const lineTags = [
      ...rawLine.matchAll(/\[(\d{1,2}:\d{2}(?:[\.,]\d{1,3})?)\]/g),
    ];
    if (!lineTags.length) return;

    const content = rawLine
      .replace(/\[(\d{1,2}:\d{2}(?:[\.,]\d{1,3})?)\]/g, "")
      .trim();
    const wordMatches = [
      ...content.matchAll(/<(\d{1,2}:\d{2}(?:[\.,]\d{1,3})?)>([^<]+)/g),
    ];

    const words = wordMatches
      .map((match, wordIndex) => ({
        index: wordIndex,
        time: parseLrcTimeToSeconds(match[1]),
        text: match[2] || "",
      }))
      .filter((word) => word.time !== null && word.text.trim());

    lineTags.forEach((tag, lineIndex) => {
      const lineTime = parseLrcTimeToSeconds(tag[1]);
      if (lineTime === null) return;

      const lineText = words.length
        ? words
            .map((word) => word.text)
            .join("")
            .trim()
        : content.replace(/<(\d{1,2}:\d{2}(?:[\.,]\d{1,3})?)>/g, "").trim();

      parsed.push({
        id: `${lineTime}-${lineIndex}`,
        time: lineTime,
        text: lineText || "…",
        words: words.length ? words : null,
      });
    });
  });

  parsed.sort((a, b) => a.time - b.time);

  // Synthesize word timings for line-synced lyrics (BetterLyrics / Apple Music karaoke model)
  for (let i = 0; i < parsed.length; i++) {
    const line = parsed[i];
    const nextLine = parsed[i + 1];

    if (line.words && line.words.length) {
      // Calculate duration for each word if not present
      for (let w = 0; w < line.words.length; w++) {
        if (!line.words[w].duration) {
          if (w + 1 < line.words.length) {
            line.words[w].duration = Math.max(0.15, line.words[w + 1].time - line.words[w].time);
          } else if (nextLine) {
            line.words[w].duration = Math.max(0.2, Math.min(3.0, nextLine.time - line.words[w].time));
          } else {
            line.words[w].duration = 0.5;
          }
        }
      }
      continue;
    }

    const cleanText = (line.text || "").trim();
    if (!cleanText || cleanText === "…") {
      line.words = [];
      continue;
    }

    const wordList = cleanText.split(/\s+/).filter(Boolean);
    if (!wordList.length) {
      line.words = [];
      continue;
    }

    // Determine line singing duration
    const gap = nextLine ? Math.max(0.8, nextLine.time - line.time) : 3.5;
    const naturalSingingDuration = Math.max(1.5, Math.min(gap * 0.85, wordList.length * 0.65));
    const effectiveDuration = Math.min(gap, naturalSingingDuration);

    const totalWeight = wordList.reduce((acc, w) => acc + Math.max(1, w.length), 0);

    let curTime = line.time;
    line.words = wordList.map((wordStr, wIndex) => {
      const weight = Math.max(1, wordStr.length) / totalWeight;
      const wDuration = Math.max(0.15, effectiveDuration * weight);
      const wTime = curTime;
      curTime += wDuration;
      return {
        index: wIndex,
        text: wordStr,
        time: wTime,
        duration: wDuration,
      };
    });
  }

  return parsed;
}

function getMusicDom() {
  return {
    playlist: document.getElementById("music-playlist"),
    trackCount: document.getElementById("music-track-count"),
    activePlayer: document.getElementById("yt-active-player"),
    audio: document.getElementById("yt-audio"),
    openFullBtn: document.getElementById("yt-open-full-btn"),
    expandHitbox: document.getElementById("yt-expand-hitbox"),
    minimizeBtn: document.getElementById("yt-minimize-btn"),
    lyricsToggle: document.getElementById("yt-lyrics-toggle"),
    tabTrackBtn: document.getElementById("yt-tab-track"),
    tabLyricsBtn: document.getElementById("yt-tab-lyrics"),
    tabUpNextBtn: document.getElementById("yt-tab-upnext"),
    lyricsTabPanel: document.getElementById("yt-lyrics-panel-wrap"),
    upNextTabPanel: document.getElementById("yt-up-next-panel-wrap"),
    closeBtnMini: document.getElementById("yt-close-btn-mini"),
    closeBtnFull: document.getElementById("yt-close-btn-full"),
    closeLyricsBtn: document.querySelector(".btn-close-lyrics"),
    lyricsPanel: document.getElementById("yt-lyrics-panel"),
    lyricsContainer: document.getElementById("yt-lyrics-container"),
    titleFull: document.getElementById("yt-player-title"),
    artistFull: document.getElementById("yt-player-artist"),
    titleMini: document.getElementById("yt-player-title-mini"),
    artistMini: document.getElementById("yt-player-artist-mini"),
    coverFull: document.getElementById("yt-cover-image"),
    coverMini: document.getElementById("yt-cover-image-mini"),
    seekbar: document.getElementById("yt-seekbar"),
    currentTime: document.getElementById("yt-current-time"),
    duration: document.getElementById("yt-duration"),
    playBtnFull: document.getElementById("yt-play-btn"),
    playBtnMini: document.getElementById("yt-play-btn-mini"),
    prevBtn: document.getElementById("yt-prev-btn"),
    prevBtnMini: document.getElementById("yt-prev-btn-mini"),
    nextBtn: document.getElementById("yt-next-btn"),
    nextBtnMini: document.getElementById("yt-next-btn-mini"),
    shuffleBtn: document.getElementById("yt-shuffle-btn"),
    repeatBtn: document.getElementById("yt-repeat-btn"),
    upNextList: document.getElementById("yt-up-next-list"),
    upNextCount: document.getElementById("yt-up-next-count"),
    volumeSlider: document.getElementById("volume-slider"),
    volumeValue: document.getElementById("volume-value"),
    rotatingDisc: document.getElementById("yt-rotating-disc"),
    playerBg: document.getElementById("yt-player-bg"),
    waveform: document.getElementById("yt-waveform"),
  };
}

function syncFloatingPlayerState() {
  const { activePlayer } = getMusicDom();
  if (!activePlayer) return;
  const isVisible =
    activePlayer.style.display !== "none" &&
    !activePlayer.hasAttribute("hidden") &&
    (activePlayer.offsetParent !== null ||
      getComputedStyle(activePlayer).position === "fixed");
  document.body.classList.toggle("player-visible", isVisible);
}

function syncPlayerExpandedState() {
  const { activePlayer } = getMusicDom();
  if (!activePlayer) return;

  document.body.classList.toggle(
    "player-expanded",
    activePlayer.classList.contains("expanded"),
  );
  syncFloatingPlayerState();
}

function showActivePlayerWithAnimation() {
  const { activePlayer } = getMusicDom();
  if (!activePlayer) return;

  initKawarp();
  startKawarp();

  activePlayer.classList.remove("player-hiding", "player-appearing");
  activePlayer.style.opacity = "";
  activePlayer.style.transform = "";
  activePlayer.style.transition = "";
  activePlayer.style.left = "";
  activePlayer.style.top = "";
  activePlayer.style.width = "";
  activePlayer.style.height = "";
  activePlayer.style.borderRadius = "";

  // Body content inline stilləri təmizlə (CSS qaydası bassın)
  const bodyEl = activePlayer.querySelector(".yt-player-body");
  if (bodyEl) {
    bodyEl.style.display = "";
    bodyEl.style.opacity = "";
  }

  document.body.classList.add("player-visible");

  activePlayer.hidden = false;
  activePlayer.style.display = "block";
  window.clearTimeout(activePlayer.__appearTimer);
  window.clearTimeout(activePlayer.__hideTimer);
  activePlayer.__appearTimer = window.setTimeout(() => {
    activePlayer.classList.remove("player-appearing");
    activePlayer.style.opacity = "1"; // zəmanətli görünürlük
    activePlayer.style.transform = "";
  }, 700);

  void activePlayer.offsetHeight;
  activePlayer.classList.add("player-appearing");

  syncPlayerExpandedState();
}
function hideActivePlayerWithAnimation(options = {}) {
  const { resetTrack = true } = options;
  const { activePlayer, audio, lyricsPanel } = getMusicDom();
  if (!activePlayer) return;

  // X basanda player tam yox olur, kicilmir
  activePlayer.classList.remove("expanded", "lyrics-open", "is-transitioning", "player-appearing", "player-hiding");
  activePlayer.classList.remove("player-mini");

  // inline stilləri təmizlə
  activePlayer.style.left = "";
  activePlayer.style.top = "";
  activePlayer.style.width = "";
  activePlayer.style.height = "";
  activePlayer.style.borderRadius = "";
  activePlayer.style.opacity = "";
  activePlayer.style.transform = "";
  activePlayer.style.filter = "";
  activePlayer.style.transition = "";

  if (lyricsPanel) {
    lyricsPanel.classList.add("lyrics-hidden");
    lyricsPanel.setAttribute("aria-hidden", "true");
  }
  setPlayerTab("lyrics");

  if (audio) {
    audio.pause();
    if (resetTrack) {
      try { audio.currentTime = 0; } catch (_) {}
    }
  }

  updateLyricsToggleState();
  updateMusicPlayButtonState();
  updateMediaSessionPlaybackState();

  // player-i birbasha gizlet
  activePlayer.style.display = "none";
  activePlayer.hidden = true;

  stopKawarp();

  // Body content inline stilləri təmizlə
  const bodyEl = activePlayer.querySelector(".yt-player-body");
  if (bodyEl) {
    bodyEl.style.display = "";
    bodyEl.style.opacity = "";
  }

  // Backdrop'u təmizlə
  const backdrop = document.getElementById("yt-player-backdrop");
  if (backdrop) {
    backdrop.style.display = "none";
  }

  document.body.classList.remove("player-visible", "player-expanded");
  syncPlayerExpandedState();
}

function closeActivePlayer(options = {}) {
  hideActivePlayerWithAnimation(options);
}
window.closeActivePlayer = closeActivePlayer;

function setPlayerExpanded(expanded) {
  const { activePlayer } = getMusicDom();
  if (!activePlayer) return;

  // Əgər artıq animasiya gedirsə, müdaxilə etmə
  if (activePlayer._playerAnimating) return;

  const isCurrentlyExpanded = activePlayer.classList.contains("expanded");
  if (expanded === isCurrentlyExpanded) return;

  if (expanded) {
    animatePlayerExpand();
  } else {
    animatePlayerCollapse();
  }
}
window.togglePlayerMode = function (forceExpanded) {
  const { activePlayer } = getMusicDom();
  if (!activePlayer) return;

  const expanded =
    typeof forceExpanded === "boolean"
      ? forceExpanded
      : !activePlayer.classList.contains("expanded");

  setPlayerExpanded(expanded);
};

function setPlayerTab(tabName = "lyrics") {
  const dom = getMusicDom();
  const {
    activePlayer,
    lyricsPanel,
    lyricsToggle,
    tabTrackBtn,
    tabLyricsBtn,
    tabUpNextBtn,
    lyricsTabPanel,
    upNextTabPanel,
  } = dom;

  const isMobile = window.innerWidth < 960;
  let resolvedTab = tabName;
  if (!resolvedTab) {
    resolvedTab = window.currentPlayerTab || (isMobile ? "track" : "lyrics");
  }
  if (!["track", "lyrics", "upnext"].includes(resolvedTab)) {
    resolvedTab = "lyrics";
  }
  if (!isMobile && resolvedTab === "track") {
    resolvedTab = "lyrics";
  }

  window.currentPlayerTab = resolvedTab;

  document.querySelectorAll("[data-player-tab]").forEach((btn) => {
    const isTarget = btn.getAttribute("data-player-tab") === resolvedTab;
    btn.classList.toggle("is-active", isTarget);
    btn.setAttribute("aria-selected", String(isTarget));
  });

  if (tabTrackBtn) {
    const isTrack = resolvedTab === "track";
    tabTrackBtn.classList.toggle("is-active", isTrack);
    tabTrackBtn.setAttribute("aria-selected", String(isTrack));
  }

  if (tabLyricsBtn) {
    const isLyrics = resolvedTab === "lyrics";
    tabLyricsBtn.classList.toggle("is-active", isLyrics);
    tabLyricsBtn.setAttribute("aria-selected", String(isLyrics));
  }

  if (tabUpNextBtn) {
    const isUpNext = resolvedTab === "upnext";
    tabUpNextBtn.classList.toggle("is-active", isUpNext);
    tabUpNextBtn.setAttribute("aria-selected", String(isUpNext));
  }

  if (lyricsTabPanel) {
    const isLyrics = resolvedTab === "lyrics";
    lyricsTabPanel.hidden = !isLyrics;
    lyricsTabPanel.style.setProperty("display", isLyrics ? "flex" : "none", "important");
  }

  if (upNextTabPanel) {
    const isUpNext = resolvedTab === "upnext";
    upNextTabPanel.hidden = !isUpNext;
    upNextTabPanel.style.setProperty("display", isUpNext ? "flex" : "none", "important");
  }

  if (lyricsPanel) {
    const lyricsHidden = resolvedTab !== "lyrics";
    lyricsPanel.classList.toggle("lyrics-hidden", lyricsHidden);
    lyricsPanel.setAttribute("aria-hidden", String(lyricsHidden));
    lyricsPanel.style.setProperty("display", lyricsHidden ? "none" : "flex", "important");
  }

  if (activePlayer) {
    activePlayer.classList.remove("tab-track", "tab-lyrics", "tab-upnext");
    activePlayer.classList.add(`tab-${resolvedTab}`);
    activePlayer.classList.toggle("lyrics-open", resolvedTab === "lyrics");
  }

  if (lyricsToggle) {
    const isLyrics = resolvedTab === "lyrics";
    lyricsToggle.classList.toggle("is-open", isLyrics);
    lyricsToggle.setAttribute(
      "aria-label",
      isLyrics ? "Sözlər açıqdır" : "Sözləri aç",
    );
  }

  if (resolvedTab === "lyrics") {
    requestAnimationFrame(() => scrollLyricsToActiveLine(false));
  }
}

window.setPlayerTab = setPlayerTab;

function updateLyricsToggleState() {
  const { activePlayer, lyricsToggle } = getMusicDom();
  if (!activePlayer || !lyricsToggle) return;

  const isExpanded = activePlayer.classList.contains("expanded");
  const activeTab = window.currentPlayerTab === "upnext" ? "upnext" : "lyrics";

  lyricsToggle.classList.toggle(
    "is-open",
    isExpanded && activeTab === "lyrics",
  );
  lyricsToggle.setAttribute(
    "aria-label",
    activeTab === "lyrics" ? "Sözlər açıqdır" : "Sözləri aç",
  );
}

window.toggleLyricsPanel = function (forceOpen) {
  const { activePlayer } = getMusicDom();
  if (!activePlayer) return;

  if (!activePlayer.classList.contains("expanded")) {
    setPlayerExpanded(true);
  }

  const shouldOpen =
    typeof forceOpen === "boolean"
      ? forceOpen
      : window.currentPlayerTab !== "lyrics";

  setPlayerTab(shouldOpen ? "lyrics" : "upnext");
  updateLyricsToggleState();
};

async function fetchMusicJsonList() {
  const cachedTracks = perfGetCached("music-json-list", PERF_GITHUB_TTL);
  if (cachedTracks) return cachedTracks;

  const files = await perfFetchJsonCached(
    "music-file-list",
    "/.netlify/functions/github-content?path=musiqiler",
    PERF_GITHUB_TTL,
  );

  if (!Array.isArray(files)) {
    throw new Error(files?.message || "musiqiler qovluğu oxunmadı");
  }

  const jsonFiles = files.filter((file) =>
    file.name.toLowerCase().endsWith(".json"),
  );

  const jsonData = await Promise.all(
    jsonFiles.map(async (file) => {
      try {
        const cacheKey = `music-meta:${file.name}:${file.sha || file.git_date || ""}`;
        let data = perfGetCached(cacheKey, PERF_GITHUB_TTL);
        if (!data) {
          let res = await fetch(file.download_url, { cache: "force-cache" });
          if (!res || !res.ok) {
            res = await fetch(`/musiqiler/${encodeURIComponent(file.name)}`, { cache: "force-cache" });
          }
          if (!res.ok) return null;
          data = await res.json();
          perfSetCached(cacheKey, data);
        }

        return normalizeTrackMeta({
          ...data,
          id: data.id || file.name,
          jsonName: file.name,
          title: data.title || "Adsız mahnı",
          artist: data.artist || "Naməlum artist",
        });
      } catch (_) {
        return null;
      }
    }),
  );

  const tracks = jsonData
    .filter(Boolean)
    .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

  perfSetCached("music-json-list", tracks);
  return tracks;
}

function shuffleMusicIndices(indices = []) {
  const cloned = [...indices];
  for (let i = cloned.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[randomIndex]] = [cloned[randomIndex], cloned[i]];
  }
  return cloned;
}

function rebuildShuffleQueue() {
  const total = window.musicLibrary.length;
  if (!total) {
    window.musicShuffleQueue = [];
    return [];
  }

  const availableIndices = Array.from(
    { length: total },
    (_, index) => index,
  ).filter((index) => index !== window.currentMusicIndex);

  window.musicShuffleQueue = shuffleMusicIndices(availableIndices);
  return window.musicShuffleQueue;
}

function getUpcomingTrackIndices(limit = 12) {
  if (!window.musicLibrary.length) return [];
  const currentIndex = window.currentMusicIndex;

  if (window.musicShuffleEnabled) {
    let queue = Array.isArray(window.musicShuffleQueue)
      ? [...window.musicShuffleQueue]
      : [];
    const missing = Array.from(
      { length: window.musicLibrary.length },
      (_, index) => index,
    ).filter((index) => index !== currentIndex && !queue.includes(index));

    if (missing.length) {
      queue = queue.concat(shuffleMusicIndices(missing));
    }

    return queue.slice(0, limit);
  }

  const indices = [];
  for (
    let i = currentIndex + 1;
    i < window.musicLibrary.length && indices.length < limit;
    i++
  ) {
    indices.push(i);
  }

  if (window.musicRepeatMode === "all" && indices.length < limit) {
    for (let i = 0; i < currentIndex && indices.length < limit; i++) {
      indices.push(i);
    }
  }

  return indices;
}

function updatePlayerModeButtons() {
  const { shuffleBtn, repeatBtn } = getMusicDom();

  if (shuffleBtn) {
    shuffleBtn.classList.toggle("is-active", !!window.musicShuffleEnabled);
  }

  if (repeatBtn) {
    const repeatMode = window.musicRepeatMode || "off";
    repeatBtn.dataset.mode = repeatMode;
    repeatBtn.classList.toggle("is-active", repeatMode !== "off");
    repeatBtn.classList.toggle("is-repeat-one", repeatMode === "one");
    repeatBtn.setAttribute(
      "aria-label",
      repeatMode === "one"
        ? "Repeat one aktivdir"
        : repeatMode === "all"
          ? "Repeat all aktivdir"
          : "Repeat deaktivdir",
    );
  }
}

function renderUpNextList() {
  const { upNextList, upNextCount } = getMusicDom();
  if (!upNextList) return;

  const upcomingIndices = getUpcomingTrackIndices(10);

  if (!window.musicLibrary.length || window.currentMusicIndex < 0) {
    upNextList.innerHTML = `<div class="yt-up-next-empty">Əvvəlcə bir mahnı seç.</div>`;
    if (upNextCount) upNextCount.textContent = "0 mahnı";
    return;
  }

  if (!upcomingIndices.length) {
    upNextList.innerHTML = `<div class="yt-up-next-empty">Növbədə başqa mahnı yoxdur.</div>`;
    if (upNextCount) upNextCount.textContent = "0 mahnı";
    return;
  }

  upNextList.innerHTML = upcomingIndices
    .map((index, orderIndex) => {
      const track = window.musicLibrary[index];
      const thumbSrc = track?.coverUrl || DEFAULT_MUSIC_COVER;

      return `
            <button class="yt-up-next-item" type="button" data-up-next-index="${index}">
                <span class="yt-up-next-order">${orderIndex + 1}</span>
                <img class="yt-up-next-thumb" src="${thumbSrc}" alt="${escapeHtmlMusic(track?.title || "Mahnı")}" onerror="this.onerror=null;this.src='${DEFAULT_MUSIC_COVER}';" loading="lazy">
                <span class="yt-up-next-text">
                    <strong>${escapeHtmlMusic(track?.title || "Adsız mahnı")}</strong>
                    <small>${escapeHtmlMusic(track?.artist || "Naməlum artist")}</small>
                </span>
                <i class="fas fa-play"></i>
            </button>
        `;
    })
    .join("");

  if (upNextCount) {
    upNextCount.textContent = `${upcomingIndices.length} mahnı`;
  }

  upNextList.querySelectorAll(".yt-up-next-item").forEach((item) => {
    item.addEventListener("click", () => {
      const index = Number(item.dataset.upNextIndex);
      openMusicTrack(index);
    });
  });
}

function renderMusicPlaylist() {
  const { playlist, trackCount } = getMusicDom();
  if (!playlist) return;

  if (!window.musicLibrary.length) {
    playlist.innerHTML = `<div class="music-empty-state"><i class="fas fa-music"></i><span>Hələ musiqi əlavə edilməyib.</span></div>`;
    if (trackCount) trackCount.textContent = "0 mahnı";
    return;
  }

  playlist.innerHTML = window.musicLibrary
    .map((track, index) => {
      const isActive = window.currentMusicIndex === index;
      const thumbSrc = track.coverUrl || DEFAULT_MUSIC_COVER;

      return `
            <div class="yt-track-item ${isActive ? "active" : ""}" data-music-index="${index}">
                <img class="yt-track-thumb" src="${thumbSrc}" alt="${escapeHtmlMusic(track.title)}" onerror="this.onerror=null;this.src='${DEFAULT_MUSIC_COVER}';" loading="lazy">
                <div class="yt-track-text">
                    <div class="yt-track-title">${escapeHtmlMusic(track.title)}</div>
                    <div class="yt-track-artist">${escapeHtmlMusic(track.artist)}</div>
                </div>
                <div class="yt-track-meta">
                    <i class="fas ${isActive ? "fa-volume-high" : "fa-play"}"></i>
                    <button class="yt-track-delete" type="button" data-music-delete="${index}" aria-label="Mahnını sil" title="Mahnını sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    })
    .join("");

  if (trackCount) {
    trackCount.textContent = `${window.musicLibrary.length} mahnı`;
  }

  updatePlayerModeButtons();
  renderUpNextList();

  playlist.querySelectorAll(".yt-track-item").forEach((item) => {
    item.addEventListener("click", () => {
      const index = Number(item.dataset.musicIndex);
      openMusicTrack(index);
    });
  });

  playlist.querySelectorAll(".yt-track-delete").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      const index = Number(btn.dataset.musicDelete);
      const track = window.musicLibrary[index];
      if (track) window.deleteMusicTrack(track);
    });
  });
}

window.deleteMusicTrack = async function (track) {
  if (!track || !track.jsonName) return;
  const pass = prompt("Mahnını silmək üçün admin şifrəsini daxil edin:");
  if (!pass) return;
  if (!confirm(`"${track.title}" - ${track.artist} mahnısını silməyə əminsən?\nMedia faylları (MP3/cover) da silinəcək.`)) return;

  try {
    const res = await fetch("/.netlify/functions/admin-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "delete_music",
        password: pass,
        payload: { path: `musiqiler/${track.jsonName}`, removeMedia: true },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      if (window.currentMusicIndex >= 0 && window.musicLibrary[window.currentMusicIndex] === track) {
        closeActivePlayer({ resetTrack: true });
      }
      try {
        localStorage.removeItem("dunyamiz-cache:music-json-list");
        localStorage.removeItem("dunyamiz-cache:music-file-list");
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("dunyamiz-cache:music-meta:")) {
            localStorage.removeItem(key);
            i--;
          }
        }
      } catch (_) {}
      window.musicLibrary = window.musicLibrary.filter((t) => t !== track);
      renderMusicPlaylist();
      syncAdminOverview();
      try { window.musicLibrary = await fetchMusicJsonList(); } catch (_) {}
      renderMusicPlaylist();
      syncAdminOverview();
    } else {
      alert("Xəta: " + (data.error || "Şifrə yanlış ola bilər."));
    }
  } catch (e) {
    console.error("Mahnı silmə xətası:", e);
    alert("Sistem xətası baş verdi. İnternet bağlantınızı yoxlayın.");
  }
};
function renderPlainLyrics(text = "") {
  const { lyricsContainer } = getMusicDom();
  if (!lyricsContainer) return;

  window.currentMusicLyricsType = "plain";
  window.currentMusicPlainLyricsText = text;

  if (!text.trim()) {
    lyricsContainer.innerHTML = `<div class="yt-lyrics-empty">Sözlər əlavə edilməyib.</div>`;
    return;
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const html = lines
    .map(
      (line, idx) =>
        `<div class="yt-lyrics-line yt-lyrics-line--plain yt-lyrics-line--clickable" data-plain-index="${idx}"><span class="yt-lyrics-text">${escapeHtmlMusic(line)}</span></div>`,
    )
    .join("");

  lyricsContainer.innerHTML =
    html || `<div class="yt-lyrics-empty">Sözlər əlavə edilməyib.</div>`;
}

function updatePlainLyricsScrollByTime(currentTime) {
  if (window.currentMusicLyricsType !== "plain") return;
  const { lyricsContainer, audio } = getMusicDom();
  if (!lyricsContainer || !audio || !audio.duration) return;

  const duration = audio.duration;
  const progress = Math.min(1, Math.max(0, currentTime / duration));
  const plainLines = lyricsContainer.querySelectorAll(".yt-lyrics-line--plain");

  if (plainLines.length > 0) {
    const activeIndex = Math.min(
      plainLines.length - 1,
      Math.floor(progress * plainLines.length),
    );

    plainLines.forEach((lineEl, idx) => {
      const isActive = idx === activeIndex;
      const isPassed = idx < activeIndex;
      lineEl.classList.toggle("active", isActive);
      lineEl.classList.toggle("passed", isPassed);
    });
  }

  if (window._lyricsUserScrolling) return;

  const maxScroll = Math.max(
    0,
    lyricsContainer.scrollHeight - lyricsContainer.clientHeight,
  );
  if (maxScroll <= 0) return;

  const targetScrollTop = progress * maxScroll;

  if (window.gsap) {
    window.gsap.to(lyricsContainer, {
      scrollTop: targetScrollTop,
      duration: 1.0,
      ease: "power1.out",
      overwrite: "auto",
    });
  } else {
    lyricsContainer.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  }
}

function renderSyncedLyrics(parsedLyrics = []) {
  const { lyricsContainer } = getMusicDom();
  if (!lyricsContainer) return;

  if (!parsedLyrics.length) {
    lyricsContainer.innerHTML = `<div class="yt-lyrics-empty">Synced lyrics tapılmadı.</div>`;
    return;
  }

  let introHtml = "";
  if (parsedLyrics.length > 0 && parsedLyrics[0].time >= 3.5) {
    introHtml = `
      <div class="yt-lyrics-line yt-lyrics-line--intro active" data-lyrics-index="-1" data-intro-target="${parsedLyrics[0].time}">
        <div class="yt-lyrics-intro-dots">
          <span class="yt-intro-dot dot-1" data-dot="1"></span>
          <span class="yt-intro-dot dot-2" data-dot="2"></span>
          <span class="yt-intro-dot dot-3" data-dot="3"></span>
        </div>
      </div>
    `;
  }

  lyricsContainer.innerHTML = introHtml + parsedLyrics
    .map((line, index) => {
      if (line.words && line.words.length) {
        const wordsHtml = line.words
          .map(
            (word, wordIndex) =>
              `<span class="yt-lyrics-word" data-lyrics-index="${index}" data-word-index="${wordIndex}" data-word-time="${word.time}" data-word-duration="${word.duration || 0.45}">${escapeHtmlMusic(word.text)}</span>`,
          )
          .join(" ");

        return `
                <div 
                    class="yt-lyrics-line yt-lyrics-line--word yt-lyrics-line--clickable" 
                    data-lyrics-index="${index}"
                    data-line-time="${line.time}"
                >${wordsHtml}</div>
            `;
      }

      return `
            <div 
                class="yt-lyrics-line yt-lyrics-line--clickable" 
                data-lyrics-index="${index}"
                data-line-time="${line.time}"
            ><span class="yt-lyrics-text">${escapeHtmlMusic(line.text.trim())}</span></div>
        `;
    })
    .join("");
}

async function fetchLrcLibLyrics(track) {
  if (!track || !track.title) return;
  const currentTrackRef = track;
  const cleanTitle = (track.title || "").replace(/\([^)]*\)|\[[^\]]*\]/g, "").trim();
  const cleanArtist = (track.artist || "").replace(/\([^)]*\)|\[[^\]]*\]/g, "").trim();
  const cacheKey = `dunyamiz-lrc-cache:${cleanTitle}:${cleanArtist}`.toLowerCase();

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      let cachedSynced = null;
      let cachedPlain = null;

      try {
        const parsedJson = JSON.parse(cached);
        if (typeof parsedJson === "object" && parsedJson !== null) {
          cachedSynced = parsedJson.syncedLyrics || null;
          cachedPlain = parsedJson.plainLyrics || null;
        }
      } catch (_) {
        if (cached.startsWith("[")) cachedSynced = cached;
        else cachedPlain = cached;
      }

      if (window.musicLibrary[window.currentMusicIndex] === currentTrackRef) {
        if (cachedSynced) {
          window.currentMusicLyricsType = "synced";
          window.currentLyricsActiveIndex = -1;
          window.currentLyricsActiveWordIndex = -1;
          const parsed = parseSyncedLyrics(cachedSynced);
          window.currentMusicLyricsParsed = parsed;
          renderSyncedLyrics(parsed);
          const badge = document.getElementById("yt-lyrics-lrclib-badge");
          if (badge) badge.style.display = "inline-flex";
          const dom = getMusicDom();
          if (dom.audio) updateSyncedLyricsByTime(dom.audio.currentTime || 0);
          return;
        } else if (cachedPlain && window.currentMusicLyricsType !== "synced") {
          window.currentMusicLyricsType = "plain";
          window.currentLyricsActiveIndex = -1;
          window.currentLyricsActiveWordIndex = -1;
          window.currentMusicLyricsParsed = [];
          renderPlainLyrics(cachedPlain);
          const badge = document.getElementById("yt-lyrics-lrclib-badge");
          if (badge) badge.style.display = "inline-flex";
          const dom = getMusicDom();
          if (dom.audio) updatePlainLyricsScrollByTime(dom.audio.currentTime || 0);
          return;
        }
      }
    }
  } catch (_) {}

  try {
    let synced = null;
    let plain = null;

    if (cleanArtist) {
      const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      const res = await fetch(getUrl, { headers: { "Lrclib-Client": "DunyamizPlayer/1.0" } });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.syncedLyrics) synced = data.syncedLyrics;
          if (data.plainLyrics) plain = data.plainLyrics;
        }
      }
    }

    if (!synced) {
      const query = cleanArtist ? `${cleanArtist} ${cleanTitle}` : cleanTitle;
      const sUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const sRes = await fetch(sUrl, { headers: { "Lrclib-Client": "DunyamizPlayer/1.0" } });
      if (sRes.ok) {
        const items = await sRes.json();
        if (Array.isArray(items)) {
          const hitSynced = items.find((item) => item.syncedLyrics);
          if (hitSynced) {
            synced = hitSynced.syncedLyrics;
            if (!plain && hitSynced.plainLyrics) plain = hitSynced.plainLyrics;
          } else {
            const hitPlain = items.find((item) => item.plainLyrics);
            if (hitPlain && !plain) plain = hitPlain.plainLyrics;
          }
        }
      }
    }

    if (synced || plain) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ syncedLyrics: synced, plainLyrics: plain }));
      } catch (_) {}

      if (window.musicLibrary[window.currentMusicIndex] === currentTrackRef) {
        const badge = document.getElementById("yt-lyrics-lrclib-badge");
        if (badge) badge.style.display = "inline-flex";

        if (synced) {
          window.currentMusicLyricsType = "synced";
          window.currentLyricsActiveIndex = -1;
          window.currentLyricsActiveWordIndex = -1;
          const parsed = parseSyncedLyrics(synced);
          window.currentMusicLyricsParsed = parsed;
          renderSyncedLyrics(parsed);
          const dom = getMusicDom();
          if (dom.audio) updateSyncedLyricsByTime(dom.audio.currentTime || 0);
        } else if (plain && window.currentMusicLyricsType !== "synced") {
          window.currentMusicLyricsType = "plain";
          window.currentLyricsActiveIndex = -1;
          window.currentLyricsActiveWordIndex = -1;
          window.currentMusicLyricsParsed = [];
          renderPlainLyrics(plain);
          const dom = getMusicDom();
          if (dom.audio) updatePlainLyricsScrollByTime(dom.audio.currentTime || 0);
        }
      }
    }
  } catch (e) {
    console.debug("LRCLIB fetch error:", e);
  }
}

function renderCurrentTrackLyrics(track) {
  const lyrics = track?.lyrics || {};
  let type = lyrics.type || "none";
  const text = lyrics.text || "";

  // Auto-detect plain or synced if type is unset or "none"
  if ((type === "none" || !type) && text.trim()) {
    type = /\[\d{1,2}:\d{2}/.test(text) ? "synced" : "plain";
  }

  window.currentMusicLyricsType = type;
  window.currentMusicPlainLyricsText = type === "plain" ? text : "";
  window.currentLyricsActiveIndex = -1;
  window.currentLyricsActiveWordIndex = -1;
  window.currentMusicLyricsParsed = [];

  const lrclibBadge = document.getElementById("yt-lyrics-lrclib-badge");
  if (lrclibBadge) lrclibBadge.style.display = "none";

  if (type === "plain") {
    renderPlainLyrics(text);
  } else if (type === "synced") {
    const parsed = parseSyncedLyrics(text);
    window.currentMusicLyricsParsed = parsed;
    renderSyncedLyrics(parsed);
  } else {
    renderPlainLyrics("");
  }

  if (type !== "synced" && track?.title) {
    fetchLrcLibLyrics(track);
  }
}

function scrollLyricsToActiveLine(smooth = true) {
  if (window._lyricsUserScrolling) return;
  const { lyricsContainer } = getMusicDom();
  if (!lyricsContainer) return;

  const activeIndex = window.currentLyricsActiveIndex;
  if (activeIndex < 0) return;

  const activeEl = lyricsContainer.querySelector(
    `.yt-lyrics-line[data-lyrics-index="${activeIndex}"]`,
  );
  if (!activeEl) return;

  const containerRect = lyricsContainer.getBoundingClientRect();
  const itemRect = activeEl.getBoundingClientRect();
  const maxScrollTop = Math.max(
    0,
    lyricsContainer.scrollHeight - lyricsContainer.clientHeight,
  );
  // Target ratio 0.38 (BetterLyrics / Apple Music signature vertical offset)
  const targetScrollTop =
    lyricsContainer.scrollTop +
    (itemRect.top - containerRect.top) -
    containerRect.height * 0.38 +
    itemRect.height / 2;
  const clampedTarget = Math.max(0, Math.min(maxScrollTop, targetScrollTop));

  if (smooth && window.gsap) {
    window.gsap.to(lyricsContainer, {
      scrollTop: clampedTarget,
      duration: 0.85,
      ease: "power3.out",
      overwrite: "auto",
    });
  } else if (smooth) {
    lyricsContainer.scrollTo({
      top: clampedTarget,
      behavior: "smooth",
    });
  } else {
    lyricsContainer.scrollTop = clampedTarget;
  }
}

function updateSyncedLyricsByTime(currentTime) {
  if (window.currentMusicLyricsType !== "synced") return;
  if (!window.currentMusicLyricsParsed.length) return;
  const { lyricsContainer, audio } = getMusicDom();
  if (!lyricsContainer) return;

  const firstLyricTime = window.currentMusicLyricsParsed[0]?.time;
  const introEl = lyricsContainer.querySelector(".yt-lyrics-line--intro");
  if (introEl && typeof firstLyricTime === "number" && firstLyricTime >= 3.5) {
    if (currentTime < firstLyricTime) {
      const remaining = firstLyricTime - currentTime;
      introEl.style.display = "flex";
      introEl.classList.add("active");
      introEl.classList.remove("passed");
      const d1 = introEl.querySelector('[data-dot="1"]');
      const d2 = introEl.querySelector('[data-dot="2"]');
      const d3 = introEl.querySelector('[data-dot="3"]');
      if (d1) d1.classList.toggle("lit", remaining <= 3.0);
      if (d2) d2.classList.toggle("lit", remaining <= 2.0);
      if (d3) d3.classList.toggle("lit", remaining <= 1.0);
    } else {
      introEl.classList.remove("active");
      introEl.classList.add("passed");
      introEl.style.display = "none";
    }
  }

  let activeIndex = -1;
  for (let i = 0; i < window.currentMusicLyricsParsed.length; i++) {
    if (currentTime >= window.currentMusicLyricsParsed[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  const activeLine =
    activeIndex >= 0 ? window.currentMusicLyricsParsed[activeIndex] : null;
  let activeWordIndex = -1;
  if (activeLine?.words?.length) {
    const words = activeLine.words;
    const lastIdx = words.length - 1;
    for (let i = 0; i <= lastIdx; i++) {
      const w = words[i];
      const nextW = words[i + 1];
      // Söz növbəti söz başlayan ana qədər aktiv qalır, beləliklə sözlər arasında heç bir boşluq/taxılma olmur
      const wordEndTime = nextW ? nextW.time : (w.time + (w.duration || 0.45));

      if (currentTime >= w.time) {
        if (currentTime < wordEndTime) {
          activeWordIndex = i;
          break;
        } else if (i === lastIdx) {
          activeWordIndex = words.length;
        }
      } else {
        break;
      }
    }
  }

  const hasLineChanged = activeIndex !== window.currentLyricsActiveIndex;
  const hasWordChanged = activeWordIndex !== window.currentLyricsActiveWordIndex;

  if (!hasLineChanged && !hasWordChanged) {
    return;
  }

  window.currentLyricsActiveIndex = activeIndex;
  window.currentLyricsActiveWordIndex = activeWordIndex;

  let currentLineDuration = 3.5;
  if (activeLine) {
    if (activeIndex + 1 < window.currentMusicLyricsParsed.length) {
      const nextTime = window.currentMusicLyricsParsed[activeIndex + 1].time;
      currentLineDuration = Math.max(0.8, nextTime - activeLine.time);
    } else if (audio?.duration) {
      currentLineDuration = Math.max(1.0, audio.duration - activeLine.time);
    }
  }

  const lines = lyricsContainer.querySelectorAll(
    ".yt-lyrics-line:not(.yt-lyrics-line--intro)",
  );

  if (hasLineChanged) {
    lines.forEach((lineEl) => {
      const lineIdx = Number(lineEl.dataset.lyricsIndex);
      const isActive = lineIdx === activeIndex;
      const isPassed = lineIdx < activeIndex;

      lineEl.classList.toggle("active", isActive);
      lineEl.classList.toggle("passed", isPassed);

      const textEl = lineEl.querySelector(".yt-lyrics-text");
      if (textEl) {
        if (isActive) {
          textEl.style.setProperty("--line-duration", `${currentLineDuration}s`);
          const elapsed = Math.max(
            0,
            currentTime - (activeLine ? activeLine.time : 0),
          );
          textEl.style.animation = "none";
          void textEl.offsetHeight;
          textEl.style.animation = "";
          textEl.style.animationDelay = `-${elapsed}s`;
          textEl.style.animationPlayState = (audio && audio.paused) ? "paused" : "running";
        } else {
          textEl.style.animationDelay = "";
        }
      }

      if (!isActive) {
        const wordEls = lineEl.querySelectorAll(".yt-lyrics-word");
        wordEls.forEach((wordEl) => {
          wordEl.classList.toggle("passed", isPassed);
          wordEl.classList.remove("active");
          wordEl.style.removeProperty("--word-duration");
          wordEl.style.animation = "none";
          wordEl.style.animationDelay = "";
        });
      }
    });

    if (activeIndex >= 0) {
      scrollLyricsToActiveLine(true);
    }
  }

  // Update words for the active line smoothly without forced layout thrashing
  if (activeIndex >= 0 && activeLine?.words?.length) {
    const activeLineEl = lyricsContainer.querySelector(
      `.yt-lyrics-line[data-lyrics-index="${activeIndex}"]`,
    );
    if (activeLineEl) {
      const wordEls = activeLineEl.querySelectorAll(".yt-lyrics-word");
      wordEls.forEach((wordEl, wordIndex) => {
        const wordObj = activeLine.words[wordIndex];
        const isWordPassed = wordIndex < activeWordIndex;
        const isWordActive = wordIndex === activeWordIndex;

        const wasActive = wordEl.classList.contains("active");
        const wasPassed = wordEl.classList.contains("passed");

        if (isWordActive !== wasActive) {
          wordEl.classList.toggle("active", isWordActive);
        }
        if (isWordPassed !== wasPassed) {
          wordEl.classList.toggle("passed", isWordPassed);
        }

        if (isWordActive && wordObj) {
          const duration = Math.max(0.15, wordObj.duration || 0.45);
          const elapsed = Math.max(0, currentTime - wordObj.time);

          wordEl.style.setProperty("--word-duration", `${duration}s`);
          if (!wasActive) {
            wordEl.style.animationDelay = `-${elapsed}s`;
            wordEl.style.animationPlayState = (audio && audio.paused) ? "paused" : "running";
          }
        } else if (isWordPassed) {
          if (wasActive) {
            wordEl.style.animationDelay = "";
          }
        } else {
          wordEl.style.removeProperty("--word-duration");
          wordEl.style.animationDelay = "";
        }
      });
    }
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

        let binary = "";
        const bytes = picture.data;
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        resolve(`data:${picture.format};base64,${window.btoa(binary)}`);
      },
      onError: () => resolve(DEFAULT_MUSIC_COVER),
    });
  });
}
function getDominantColorFromImage(imgSrc) {
  return new Promise((resolve) => {
    if (!imgSrc) {
      resolve("rgb(255,255,255)");
      return;
    }

    const isSameOrigin = !/^https?:\/\//i.test(imgSrc) || imgSrc.startsWith(window.location.origin);
    const absoluteImgSrc = /^https?:\/\//i.test(imgSrc)
      ? imgSrc
      : new URL(imgSrc, window.location.origin).href;

    const img = new Image();
    if (!isSameOrigin) {
      img.crossOrigin = "anonymous";
    }

    const processLoadedImage = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve("rgb(255,255,255)");
          return;
        }

        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const data = ctx.getImageData(0, 0, 64, 64).data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          const brightness = (pr + pg + pb) / 3;
          if (brightness > 8 && brightness < 248) {
            r += pr; g += pg; b += pb; count++;
          }
        }

        if (!count) {
          for (let i = 0; i < data.length; i += 4) {
            r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
          }
        }

        r = Math.floor(r / count) || 120;
        g = Math.floor(g / count) || 60;
        b = Math.floor(b / count) || 200;

        // Sample 4 quadrants for Apple Music fluid ambient mesh
        const qSize = 32;
        const getQuadrantAvg = (sx, sy) => {
          const d = ctx.getImageData(sx, sy, qSize, qSize).data;
          let qr = 0, qg = 0, qb = 0, qcnt = 0;
          for (let qi = 0; qi < d.length; qi += 4) {
            const br = (d[qi] + d[qi + 1] + d[qi + 2]) / 3;
            if (br > 6 && br < 250) {
              qr += d[qi]; qg += d[qi + 1]; qb += d[qi + 2]; qcnt++;
            }
          }
          if (!qcnt) {
            for (let qi = 0; qi < d.length; qi += 4) {
              qr += d[qi]; qg += d[qi + 1]; qb += d[qi + 2]; qcnt++;
            }
          }
          return qcnt ? [Math.round(qr / qcnt), Math.round(qg / qcnt), Math.round(qb / qcnt)] : [r, g, b];
        };

        const c1 = getQuadrantAvg(0, 0);
        const c2 = getQuadrantAvg(32, 0);
        const c3 = getQuadrantAvg(0, 32);
        const c4 = getQuadrantAvg(32, 32);

        // Boost saturation and brightness slightly so darker artwork glows with Apple-like vibrancy
        const boostColor = ([cr, cg, cb]) => {
          const lum = 0.299 * cr + 0.587 * cg + 0.114 * cb;
          if (lum < 40) {
            const factor = 42 / Math.max(lum, 1);
            return [
              Math.min(255, Math.round(cr * factor + 18)),
              Math.min(255, Math.round(cg * factor + 18)),
              Math.min(255, Math.round(cb * factor + 18))
            ];
          }
          return [cr, cg, cb];
        };

        const b1 = boostColor(c1);
        const b2 = boostColor(c2);
        const b3 = boostColor(c3);
        const b4 = boostColor(c4);

        const root = document.documentElement;
        const activePlayer = document.getElementById("yt-active-player");
        const rgb1 = `rgb(${b1[0]}, ${b1[1]}, ${b1[2]})`;
        const rgb2 = `rgb(${b2[0]}, ${b2[1]}, ${b2[2]})`;
        const rgb3 = `rgb(${b3[0]}, ${b3[1]}, ${b3[2]})`;
        const rgb4 = `rgb(${b4[0]}, ${b4[1]}, ${b4[2]})`;
        const dominant = `rgb(${r}, ${g}, ${b})`;

        root.style.setProperty("--player-color-1", rgb1);
        root.style.setProperty("--player-color-2", rgb2);
        root.style.setProperty("--player-color-3", rgb3);
        root.style.setProperty("--player-color-4", rgb4);

        if (activePlayer) {
          activePlayer.style.setProperty("--player-color-1", rgb1);
          activePlayer.style.setProperty("--player-color-2", rgb2);
          activePlayer.style.setProperty("--player-color-3", rgb3);
          activePlayer.style.setProperty("--player-color-4", rgb4);
        }

        if (window.currentMusic) {
          window.currentMusic.extractedColors = { color1: rgb1, color2: rgb2, color3: rgb3, color4: rgb4, dominant };
        }
        currentWaveColor = dominant;

        resolve(dominant);
      } catch (err) {
        console.error("Dominant color çıxarılmadı:", err);
        resolve("rgb(255,255,255)");
      }
    };

    img.onload = processLoadedImage;
    img.onerror = () => {
      // If direct cross-origin failed, try netlify cover-proxy as fallback
      if (!isSameOrigin && !img.src.includes("/.netlify/functions/cover-proxy")) {
        img.src = `/.netlify/functions/cover-proxy?src=${encodeURIComponent(absoluteImgSrc)}`;
      } else {
        resolve("rgb(255,255,255)");
      }
    };

    img.src = absoluteImgSrc;
  });
}

async function updateMusicCover(track) {
  const { coverFull, coverMini, playerBg } = getMusicDom();

  const setCover = (src) => {
    const safeSrc = src || DEFAULT_MUSIC_COVER;

    const attachImgFallback = (imgEl) => {
      if (!imgEl) return;
      imgEl.onerror = () => {
        imgEl.onerror = null;
        imgEl.src = DEFAULT_MUSIC_COVER;
      };
      imgEl.src = safeSrc;
    };

    attachImgFallback(coverFull);
    attachImgFallback(coverMini);

    if (playerBg) {
      playerBg.style.backgroundImage = `url("${safeSrc}")`;
      playerBg.style.setProperty("--blyrics-background-img", `url("${safeSrc}")`);
      playerBg.style.setProperty("--player-cover-url", `url("${safeSrc}")`);
    }
    const activePlayer = document.getElementById("yt-active-player");
    if (activePlayer) {
      activePlayer.style.setProperty("--blyrics-background-img", `url("${safeSrc}")`);
      activePlayer.style.setProperty("--player-cover-url", `url("${safeSrc}")`);
    }
    document.documentElement.style.setProperty("--blyrics-background-img", `url("${safeSrc}")`);
    document.documentElement.style.setProperty("--player-cover-url", `url("${safeSrc}")`);
    updateKawarpCover(safeSrc);

    const shareCardBg = document.getElementById("yt-share-card-bg");
    if (shareCardBg) shareCardBg.style.backgroundImage = `url("${safeSrc}")`;
    const shareCardCover = document.getElementById("yt-share-card-cover");
    attachImgFallback(shareCardCover);

    getDominantColorFromImage(safeSrc).then((color) => {
      currentWaveColor = color;
    });
    const playlistThumb = document.querySelector(
      `.yt-track-item[data-music-index="${window.currentMusicIndex}"] .yt-track-thumb`,
    );
    attachImgFallback(playlistThumb);
  };

  const directCover = track?.coverUrl || track?.cover;
  if (directCover) {
    setCover(resolveMusicAssetUrl(directCover, DEFAULT_MUSIC_COVER));
    return;
  }

  setCover(DEFAULT_MUSIC_COVER);

  try {
    const coverSrc = await readMusicCoverFromUrl(track.audioUrl);
    const currentTrackStillSame =
      window.currentMusic && window.currentMusic.id === track.id;
    if (!currentTrackStillSame) return;
    setCover(coverSrc || DEFAULT_MUSIC_COVER);
  } catch {
    setCover(DEFAULT_MUSIC_COVER);
  }
}

function updateMusicPlayButtonState() {
  const { audio, playBtnFull, playBtnMini, rotatingDisc, activePlayer } =
    getMusicDom();
  if (!audio) return;

  const icon = audio.paused
    ? '<i class="fas fa-play"></i>'
    : '<i class="fas fa-pause"></i>';
  if (playBtnFull) playBtnFull.innerHTML = icon;
  if (playBtnMini) playBtnMini.innerHTML = icon;
  if (rotatingDisc) rotatingDisc.classList.toggle("playing", !audio.paused);
  if (activePlayer) activePlayer.classList.toggle("is-playing", !audio.paused);
}

function updateVolumeUi(value) {
  const { volumeSlider, volumeValue, audio } = getMusicDom();
  const numericValue = Math.min(1, Math.max(0, Number(value)));

  if (volumeSlider) volumeSlider.value = numericValue;

  if (audio) {
    audio.volume = numericValue;
    audio.muted = numericValue === 0;
  }

  if (gainNode) {
    gainNode.gain.value = numericValue;
  }

  if (volumeValue) {
    volumeValue.textContent = `${Math.round(numericValue * 100)}%`;
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fadeAudio(audioEl, from, to, duration = 350) {
  if (!audioEl) return;

  const steps = 12;
  const stepTime = duration / steps;
  const diff = to - from;

  audioEl.volume = from;

  for (let i = 1; i <= steps; i++) {
    audioEl.volume = Math.max(0, Math.min(1, from + (diff * i) / steps));
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
    dom.rotatingDisc,
  ].filter(Boolean);

  animTargets.forEach((el) => {
    el.classList.remove("track-switch-anim");
    void el.offsetWidth;
    el.classList.add("track-switch-anim");
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
    dom.artistMini,
  ].filter(Boolean);

  coverTargets.forEach((coverEl) => {
    const parent = coverEl.parentElement;
    if (!parent) return;

    parent.classList.add("morph-stage", "morph-animating");

    const ghost = document.createElement("img");
    ghost.src = coverEl.src || "";
    ghost.className = "morph-ghost";
    parent.appendChild(ghost);

    restartAnimation(coverEl, "morph-target-in");

    ghost.addEventListener(
      "animationend",
      () => {
        ghost.remove();
        parent.classList.remove("morph-animating");
      },
      { once: true },
    );
  });

  textTargets.forEach((el) => {
    restartAnimation(el, "morph-text-in");
  });
}

async function animateTextSwap(track) {
  const dom = getMusicDom();
  const textTargets = [
    dom.titleFull,
    dom.artistFull,
    dom.titleMini,
    dom.artistMini,
  ].filter(Boolean);

  textTargets.forEach((el) => restartAnimation(el, "morph-text-out"));

  await new Promise((resolve) => setTimeout(resolve, 180));

  if (dom.titleFull) dom.titleFull.textContent = track.title || "Adsız mahnı";
  if (dom.artistFull)
    dom.artistFull.textContent = track.artist || "Naməlum artist";
  if (dom.titleMini) dom.titleMini.textContent = track.title || "Adsız mahnı";
  if (dom.artistMini)
    dom.artistMini.textContent = track.artist || "Naməlum artist";

  textTargets.forEach((el) => {
    el.classList.remove("morph-text-out");
    restartAnimation(el, "morph-text-in");
  });
}
function setupMediaSession() {
  if (!("mediaSession" in navigator)) return;

  const getTargetAudio = () => {
    const dom = getMusicDom();
    return dom.audio?.src ? dom.audio : audio;
  };

  const updatePositionState = () => {
    if (!("setPositionState" in navigator.mediaSession)) return;

    const targetAudio = getTargetAudio();

    if (
      targetAudio &&
      !isNaN(targetAudio.duration) &&
      isFinite(targetAudio.duration)
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: targetAudio.duration,
          playbackRate: targetAudio.playbackRate || 1,
          position: targetAudio.currentTime || 0,
        });
      } catch (e) {
        console.error("MediaSession position error:", e);
      }
    }
  };

  const bindPositionEvents = () => {
    const targetAudio = getTargetAudio();
    if (!targetAudio || targetAudio.__mediaSessionBound) return;

    targetAudio.__mediaSessionBound = true;

    targetAudio.addEventListener("timeupdate", updatePositionState);
    targetAudio.addEventListener("durationchange", updatePositionState);
    targetAudio.addEventListener("loadedmetadata", updatePositionState);
    targetAudio.addEventListener("play", updatePositionState);
    targetAudio.addEventListener("pause", updatePositionState);
    targetAudio.addEventListener("seeked", updatePositionState);
  };

  bindPositionEvents();

  navigator.mediaSession.setActionHandler("play", async () => {
    const targetAudio = getTargetAudio();
    if (!targetAudio) return;

    try {
      await targetAudio.play();
      updateMusicPlayButtonState();
      updatePositionState();
    } catch (err) {
      console.error("Play error:", err);
    }
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    const targetAudio = getTargetAudio();
    if (!targetAudio) return;

    targetAudio.pause();
    updateMusicPlayButtonState();
    updatePositionState();
  });

  navigator.mediaSession.setActionHandler("seekto", async (details) => {
    const targetAudio = getTargetAudio();

    if (!targetAudio || details.seekTime == null) return;

    try {
      const duration = targetAudio.duration;
      let seekTime = details.seekTime;

      if (!isNaN(duration) && isFinite(duration)) {
        seekTime = Math.max(0, Math.min(seekTime, duration));
      }

      if ("fastSeek" in targetAudio) {
        targetAudio.fastSeek(seekTime);
      } else {
        targetAudio.currentTime = seekTime;
      }

      updatePositionState();

      if (targetAudio.paused) {
        await targetAudio.play().catch(() => {});
      }
    } catch (e) {
      console.error("SeekTo error:", e);
    }
  });

  navigator.mediaSession.setActionHandler("nexttrack", () => {
    if (window.musicLibrary && window.musicLibrary.length > 0) {
      playNextMusic();
      setTimeout(() => {
        bindPositionEvents();
        updatePositionState();
      }, 300);
    }
  });

  navigator.mediaSession.setActionHandler("previoustrack", () => {
    if (window.musicLibrary && window.musicLibrary.length > 0) {
      playPrevMusic();
      setTimeout(() => {
        bindPositionEvents();
        updatePositionState();
      }, 300);
    }
  });

  navigator.mediaSession.setActionHandler("seekbackward", null);
  navigator.mediaSession.setActionHandler("seekforward", null);
}
function updateMediaSessionMetadata(track) {
  if (!("mediaSession" in navigator) || !track) return;

  const artworkSrc = track.coverUrl || track.cover || DEFAULT_MUSIC_COVER;
  const resolvedArtwork = resolveMusicAssetUrl(artworkSrc, DEFAULT_MUSIC_COVER);
  let absoluteArtwork = resolvedArtwork;
  try {
    absoluteArtwork = new URL(resolvedArtwork, window.location.href).href;
  } catch (_) {}

  const isPng = /\.png($|\?)/i.test(absoluteArtwork);
  const isWebp = /\.webp($|\?)/i.test(absoluteArtwork);
  const mimeType = isPng ? "image/png" : isWebp ? "image/webp" : "image/jpeg";

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title || "Adsız mahnı",
    artist: track.artist || "Naməlum artist",
    album: "Hüseyn və Cəmalənin Dünyası",
    artwork: [
      { src: absoluteArtwork, sizes: "512x512", type: mimeType },
      { src: absoluteArtwork, sizes: "256x256", type: mimeType },
      { src: absoluteArtwork, sizes: "128x128", type: mimeType },
      { src: absoluteArtwork }
    ],
  });
}

function updateMediaSessionPlaybackState() {
  if (!("mediaSession" in navigator)) return;

  const dom = getMusicDom();
  if (!dom.audio) return;

  navigator.mediaSession.playbackState = dom.audio.paused
    ? "paused"
    : "playing";

  if ("setPositionState" in navigator.mediaSession) {
    try {
      navigator.mediaSession.setPositionState({
        duration: dom.audio.duration || 0,
        playbackRate: dom.audio.playbackRate || 1,
        position: dom.audio.currentTime || 0,
      });
    } catch (_) {}
  }
}
async function openMusicTrack(index, options = {}) {
  const track = window.musicLibrary[index];
  const dom = getMusicDom();
  const { pushHistory = true } = options;
  if (!track || !dom.audio) return;
  if (typeof addActivity === "function") {
    addActivity(`🎵 Musiqi dinləyir: ${track.artist} - ${track.title}`);
  }

  const wasExpanded = dom.activePlayer?.classList.contains("expanded") || false;
  const previousTab =
    window.currentPlayerTab === "upnext" ? "upnext" : "lyrics";
  const wasLyricsOpen = previousTab === "lyrics";

  const mainAudio = document.getElementById("audio");

  if (mainAudio && !mainAudio.paused) {
    mainAudio.pause();
    mainAudio.currentTime = mainAudio.currentTime || 0;
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    document.getElementById("track-art")?.classList.remove("playing");
  }

  if (!dom.audio.paused && dom.audio.src) {
    dom.audio.pause();
  }

  if (
    pushHistory &&
    Number.isInteger(window.currentMusicIndex) &&
    window.currentMusicIndex >= 0 &&
    window.currentMusicIndex !== index
  ) {
    window.musicPlaybackHistory.push(window.currentMusicIndex);
    if (window.musicPlaybackHistory.length > 50) {
      window.musicPlaybackHistory.shift();
    }
  }

  window.currentMusic = track;
  window.currentMusicIndex = index;

  if (window.musicShuffleEnabled) {
    window.musicShuffleQueue = (window.musicShuffleQueue || []).filter(
      (queueIndex) => queueIndex !== index,
    );
    if (!window.musicShuffleQueue.length && window.musicLibrary.length > 1) {
      rebuildShuffleQueue();
    }
  } else {
    window.musicShuffleQueue = [];
  }

  updateMediaSessionMetadata(track);

  await animateTextSwap(track);

  dom.audio.pause();
  dom.audio.crossOrigin = "anonymous";
  dom.audio.playsInline = true;
  dom.audio.setAttribute("playsinline", "true");
  dom.audio.src = track.audioUrl;
  dom.audio.load();
  dom.audio.currentTime = 0;
  dom.audio.volume = Number(dom.volumeSlider?.value || 0.85);
  dom.audio.muted = false;

  if (dom.seekbar) dom.seekbar.value = 0;
  if (dom.currentTime) dom.currentTime.textContent = "00:00";
  if (dom.duration) dom.duration.textContent = "00:00";

  renderCurrentTrackLyrics(track);
  renderMusicPlaylist();
  renderUpNextList();
  updatePlayerModeButtons();
  updateMusicCover(track);
  animateTrackChange();
  runMorphTransition(track);

  if (dom.activePlayer) {
    showActivePlayerWithAnimation();
    setPlayerExpanded(wasExpanded);

    if (wasExpanded) {
      setPlayerTab(wasLyricsOpen ? "lyrics" : "upnext");
      updateLyricsToggleState();
    } else {
      setPlayerTab("lyrics");
      updateLyricsToggleState();
    }

    syncPlayerExpandedState();
  }

  try {
    await unlockYTPlayback();
    await dom.audio.play();
  } catch (err) {
    console.error("Music play error:", err);
  }

  updateMusicPlayButtonState();
  updateMediaSessionPlaybackState();
}
function playPrevMusic() {
  if (!window.musicLibrary.length) return;

  if (window.musicRepeatMode === "one" && window.currentMusicIndex >= 0) {
    openMusicTrack(window.currentMusicIndex, { pushHistory: false });
    return;
  }

  if (window.musicPlaybackHistory.length) {
    const previousIndex = window.musicPlaybackHistory.pop();
    if (Number.isInteger(previousIndex) && previousIndex >= 0) {
      openMusicTrack(previousIndex, { pushHistory: false });
      return;
    }
  }

  const newIndex =
    window.currentMusicIndex <= 0
      ? window.musicLibrary.length - 1
      : window.currentMusicIndex - 1;

  openMusicTrack(newIndex, { pushHistory: false });
}

function playNextMusic() {
  const dom = getMusicDom();
  if (!window.musicLibrary.length) return;

  if (window.musicRepeatMode === "one" && window.currentMusicIndex >= 0) {
    openMusicTrack(window.currentMusicIndex, { pushHistory: false });
    return;
  }

  if (window.musicShuffleEnabled) {
    if (!window.musicShuffleQueue.length) {
      if (window.musicRepeatMode === "off") {
        dom.audio?.pause();
        updateMusicPlayButtonState();
        updateMediaSessionPlaybackState();
        return;
      }
      rebuildShuffleQueue();
    }

    const shuffledNextIndex = window.musicShuffleQueue.shift();
    if (Number.isInteger(shuffledNextIndex)) {
      openMusicTrack(shuffledNextIndex);
      return;
    }
  }

  const isLastTrack =
    window.currentMusicIndex >= window.musicLibrary.length - 1;

  if (isLastTrack && window.musicRepeatMode === "off") {
    dom.audio?.pause();
    if (dom.audio) {
      try {
        dom.audio.currentTime =
          dom.audio.duration || dom.audio.currentTime || 0;
      } catch (_) {}
    }
    updateMusicPlayButtonState();
    updateMediaSessionPlaybackState();
    renderUpNextList();
    return;
  }

  const newIndex = isLastTrack ? 0 : window.currentMusicIndex + 1;
  openMusicTrack(newIndex);
}

function initPlayerSwipe() {
  const { activePlayer } = getMusicDom();
  if (!activePlayer) return;
  if (activePlayer.dataset.swipeBound === "1") return;

  activePlayer.dataset.swipeBound = "1";

  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;

  activePlayer.addEventListener(
    "touchstart",
    (e) => {
      const touch = e.changedTouches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    },
    { passive: true },
  );

  activePlayer.addEventListener(
    "touchend",
    (e) => {
      const touch = e.changedTouches[0];
      endX = touch.clientX;
      endY = touch.clientY;

      const diffX = endX - startX;
      const diffY = endY - startY;

      // Vertical swipe down to minimize on mobile when expanded
      if (
        activePlayer.classList.contains("expanded") &&
        diffY > 60 &&
        Math.abs(diffY) > Math.abs(diffX) * 1.2
      ) {
        const lyricsWrap = activePlayer.querySelector(".yt-lyrics-scroll-area, .yt-lyrics-container");
        if (lyricsWrap && lyricsWrap.contains(e.target) && lyricsWrap.scrollTop > 15) {
          return;
        }
        window.togglePlayerMode(false);
        return;
      }

      if (Math.abs(diffX) < 50) return;
      if (Math.abs(diffY) > Math.abs(diffX)) return;

      if (diffX < 0) {
        activePlayer.classList.remove("swiping-prev");
        activePlayer.classList.add("swiping-next");
        setTimeout(() => activePlayer.classList.remove("swiping-next"), 280);
        playNextMusic();
      } else {
        activePlayer.classList.remove("swiping-next");
        activePlayer.classList.add("swiping-prev");
        setTimeout(() => activePlayer.classList.remove("swiping-prev"), 280);
        playPrevMusic();
      }
    },
    { passive: true },
  );
}
let ytWaveCtx = null;
let ytWaveAnalyser = null;
let ytWaveSource = null;
let ytWaveAnimationId = null;
let ytWaveDataArray = null;
let ytWaveEnabled = false;
let ytWaveInitialized = false;
let ytWaveFallbackMode = false;
window.currentPlayerTab = "lyrics";

async function ensureYTAudioReady() {
  const { audio } = getMusicDom();
  if (!audio) return false;

  audio.crossOrigin = "anonymous";
  audio.playsInline = true;
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    ytWaveFallbackMode = true;
    return false;
  }

  if (!ytWaveCtx) {
    try {
      ytWaveCtx = new AudioCtx();
    } catch (err) {
      console.error("AudioContext yaradıla bilmədi:", err);
      ytWaveFallbackMode = true;
      return false;
    }
  }

  if (ytWaveCtx.state === "suspended") {
    try {
      await ytWaveCtx.resume();
    } catch (err) {
      console.error("AudioContext resume alınmadı:", err);
    }
  }

  return ytWaveCtx.state === "running";
}

async function initYTWaveformSafe() {
  return false;
}

async function unlockYTPlayback() {
  const ok = await ensureYTAudioReady();
  return ok;
}
async function initYTWaveform() {
  return false;
}
function drawYTWaveform() {
  if (ytWaveAnimationId) {
    cancelAnimationFrame(ytWaveAnimationId);
    ytWaveAnimationId = null;
  }
  return;
}
function resizeYTWaveform() {
  return;
}
function initMusicPlayerEvents() {
  const dom = getMusicDom();
  const unlockHandler = async () => {
    await unlockYTPlayback();
  };

  dom.playBtnFull?.addEventListener("touchstart", unlockHandler, {
    passive: true,
  });
  dom.playBtnMini?.addEventListener("touchstart", unlockHandler, {
    passive: true,
  });
  dom.prevBtn?.addEventListener("touchstart", unlockHandler, { passive: true });
  dom.prevBtnMini?.addEventListener("touchstart", unlockHandler, {
    passive: true,
  });
  dom.nextBtn?.addEventListener("touchstart", unlockHandler, { passive: true });
  dom.nextBtnMini?.addEventListener("touchstart", unlockHandler, {
    passive: true,
  });
  dom.openFullBtn?.addEventListener("touchstart", unlockHandler, {
    passive: true,
  });
  if (!dom.activePlayer || !dom.audio) return;
  if (dom.activePlayer.dataset.bound === "1") return;
  dom.activePlayer.dataset.bound = "1";
  setPlayerTab(window.currentPlayerTab || "lyrics");
  drawYTWaveform();
  window.addEventListener("resize", resizeYTWaveform);
  window.addEventListener("resize", resizeKawarp);
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
        console.error("Play xətası:", err);
      }
    } else {
      dom.audio.pause();
    }

    updateMusicPlayButtonState();
    updateMediaSessionPlaybackState();
  };
  dom.lyricsContainer?.addEventListener("click", (e) => {
    if (window.currentMusicLyricsType === "synced") {
      const wordEl = e.target.closest(".yt-lyrics-word");
      if (wordEl) {
        const wordTime = Number(wordEl.dataset.wordTime);
        seekToLyricsTime(wordTime);
        return;
      }

      const lineEl = e.target.closest(".yt-lyrics-line");
      if (lineEl) {
        const lineTime = Number(lineEl.dataset.lineTime);
        seekToLyricsTime(lineTime);
      }
    } else if (window.currentMusicLyricsType === "plain") {
      const lineEl = e.target.closest(".yt-lyrics-line--plain");
      if (lineEl && dom.audio && dom.audio.duration) {
        const plainLines = dom.lyricsContainer.querySelectorAll(".yt-lyrics-line--plain");
        const idx = Number(lineEl.dataset.plainIndex);
        if (plainLines.length > 0 && !isNaN(idx)) {
          const targetTime = (idx / plainLines.length) * dom.audio.duration;
          seekToLyricsTime(targetTime);
        }
      }
    }
  });

  let lyricsUserScrollTimeout = null;
  const onLyricsUserScroll = () => {
    window._lyricsUserScrolling = true;
    if (window.gsap && dom.lyricsContainer) {
      window.gsap.killTweensOf(dom.lyricsContainer);
    }
    clearTimeout(lyricsUserScrollTimeout);
    lyricsUserScrollTimeout = setTimeout(() => {
      window._lyricsUserScrolling = false;
    }, 2500);
  };
  dom.lyricsContainer?.addEventListener("wheel", onLyricsUserScroll, { passive: true });
  dom.lyricsContainer?.addEventListener("touchmove", onLyricsUserScroll, { passive: true });
  dom.openFullBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    window.togglePlayerMode(true);
  });

  dom.expandHitbox?.addEventListener("click", () => {
    window.togglePlayerMode(true);
  });

  dom.minimizeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    window.togglePlayerMode(false);
  });

  dom.lyricsToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    window.toggleLyricsPanel();
  });

  document.querySelectorAll("[data-player-tab]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!dom.activePlayer?.classList.contains("expanded")) {
        window.togglePlayerMode(true);
      }
      const target = btn.getAttribute("data-player-tab");
      setPlayerTab(target);
      updateLyricsToggleState();
    });
  });

  window.addEventListener("resize", () => {
    const isMobile = window.innerWidth < 960;
    if (!isMobile && window.currentPlayerTab === "track") {
      setPlayerTab("lyrics");
    }
  });

  dom.closeBtnMini?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeActivePlayer();
  });

  dom.closeBtnFull?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeActivePlayer();
  });

  dom.closeLyricsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    setPlayerTab("upnext");
    updateLyricsToggleState();
  });

  dom.playBtnFull?.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlay();
  });

  dom.playBtnMini?.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlay();
  });

  dom.prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    playPrevMusic();
  });

  dom.prevBtnMini?.addEventListener("click", (e) => {
    e.stopPropagation();
    playPrevMusic();
  });

  dom.nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    playNextMusic();
  });

  dom.nextBtnMini?.addEventListener("click", (e) => {
    e.stopPropagation();
    playNextMusic();
  });
  dom.shuffleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();

    window.musicShuffleEnabled = !window.musicShuffleEnabled;

    if (window.musicShuffleEnabled) {
      rebuildShuffleQueue();
    } else {
      window.musicShuffleQueue = [];
    }

    renderUpNextList();
    updatePlayerModeButtons();
  });

  dom.repeatBtn?.addEventListener("click", (e) => {
    e.stopPropagation();

    const currentMode = window.musicRepeatMode || "off";

    if (currentMode === "off") {
      window.musicRepeatMode = "all";
    } else if (currentMode === "all") {
      window.musicRepeatMode = "one";
    } else {
      window.musicRepeatMode = "off";
    }

    if (window.musicShuffleEnabled) {
      rebuildShuffleQueue();
    }

    renderUpNextList();
    updatePlayerModeButtons();
  });

  let lyricsRafId = null;
  const startLyricsAnimationLoop = () => {
    if (lyricsRafId) return;
    const loop = () => {
      if (!dom.audio || dom.audio.paused || dom.audio.ended) {
        lyricsRafId = null;
        return;
      }
      const curTime = dom.audio.currentTime || 0;
      if (window.currentMusicLyricsType === "synced") {
        updateSyncedLyricsByTime(curTime);
      } else if (window.currentMusicLyricsType === "plain") {
        updatePlainLyricsScrollByTime(curTime);
      }
      lyricsRafId = requestAnimationFrame(loop);
    };
    lyricsRafId = requestAnimationFrame(loop);
  };

  const stopLyricsAnimationLoop = () => {
    if (lyricsRafId) {
      cancelAnimationFrame(lyricsRafId);
      lyricsRafId = null;
    }
  };

  dom.audio.addEventListener("timeupdate", () => {
    const curTime = dom.audio.currentTime || 0;
    const dur = dom.audio.duration || 1;
    const percent = Math.min(100, Math.max(0, (curTime / dur) * 100));

    if (dom.seekbar) {
      dom.seekbar.value = curTime;
      dom.seekbar.style.setProperty("--yt-progress", `${percent}%`);
    }
    const miniFill = document.getElementById("yt-mini-progress-fill");
    if (miniFill) {
      miniFill.style.width = `${percent}%`;
    }
    if (dom.currentTime)
      dom.currentTime.textContent = formatMusicTime(curTime);
    if (window.currentMusicLyricsType === "synced") {
      updateSyncedLyricsByTime(curTime);
    } else if (window.currentMusicLyricsType === "plain") {
      updatePlainLyricsScrollByTime(curTime);
    }
    updateMediaSessionPlaybackState();
  });

  dom.audio.addEventListener("loadedmetadata", () => {
    if (dom.seekbar) dom.seekbar.max = dom.audio.duration || 0;
    if (dom.duration)
      dom.duration.textContent = formatMusicTime(dom.audio.duration);
    updateMediaSessionPlaybackState();
  });

  dom.audio.addEventListener("play", () => {
    if (audio && !audio.paused) {
      audio.pause();
    }
    startLyricsAnimationLoop();
    updateMusicPlayButtonState();
    updateMediaSessionPlaybackState();
    const activeLyrics = dom.lyricsContainer?.querySelectorAll(".yt-lyrics-line.active .yt-lyrics-text, .yt-lyrics-line.active .yt-lyrics-word.active");
    activeLyrics?.forEach((el) => {
      el.style.animationPlayState = "running";
    });
  });
  dom.audio.addEventListener("playing", () => {
    startLyricsAnimationLoop();
  });
  dom.audio.addEventListener("pause", () => {
    stopLyricsAnimationLoop();
    updateMusicPlayButtonState();
    updateMediaSessionPlaybackState();
    const activeLyrics = dom.lyricsContainer?.querySelectorAll(".yt-lyrics-line.active .yt-lyrics-text, .yt-lyrics-line.active .yt-lyrics-word.active");
    activeLyrics?.forEach((el) => {
      el.style.animationPlayState = "paused";
    });
  });
  dom.audio.addEventListener("ended", () => {
    stopLyricsAnimationLoop();
    updateMusicPlayButtonState();
    updateMediaSessionPlaybackState();
    playNextMusic();
  });

  dom.seekbar?.addEventListener("input", () => {
    dom.audio.currentTime = Number(dom.seekbar.value);
    const percent = (dom.audio.currentTime / (dom.audio.duration || 1)) * 100;
    dom.seekbar.style.setProperty("--yt-progress", `${percent}%`);
    const miniFill = document.getElementById("yt-mini-progress-fill");
    if (miniFill) {
      miniFill.style.width = `${percent}%`;
    }
    window.currentLyricsActiveIndex = -1;
    window.currentLyricsActiveWordIndex = -1;
    if (window.currentMusicLyricsType === "synced") {
      updateSyncedLyricsByTime(dom.audio.currentTime);
    } else if (window.currentMusicLyricsType === "plain") {
      updatePlainLyricsScrollByTime(dom.audio.currentTime);
    }
  });

  dom.volumeSlider?.addEventListener("input", (e) => {
    updateVolumeUi(e.target.value);
  });

  updateVolumeUi(dom.volumeSlider?.value || 0.85);
  updateMusicPlayButtonState();
  updateMediaSessionPlaybackState();
}

/* ==================== AUDIO VISUALIZER ENGINE (APPLE MUSIC STYLE) ==================== */
let ytVisualizerCanvas = null;
let ytVisualizerCtx = null;
let ytVisualizerAnimId = null;
let ytVisualizerAnalyser = null;
let ytVisualizerDataArray = null;
const YT_VISUALIZER_BARS = 22;
let ytSmoothedBars = new Float32Array(YT_VISUALIZER_BARS);

function initAudioVisualizer() {
  ytVisualizerCanvas = document.getElementById("yt-audio-visualizer");
  if (!ytVisualizerCanvas) return;
  ytVisualizerCtx = ytVisualizerCanvas.getContext("2d");
  if (!ytVisualizerCtx) return;

  const dom = getMusicDom();
  if (!dom.audio) return;

  const startVisualizer = () => {
    if (ytWaveCtx && ytWaveCtx.state === "suspended") {
      ytWaveCtx.resume().catch(() => {});
    }
    if (!ytVisualizerAnimId) {
      drawAudioVisualizer();
    }
  };

  const stopVisualizer = () => {
    if (!ytVisualizerAnimId) {
      drawAudioVisualizer();
    }
  };

  dom.audio.addEventListener("play", startVisualizer);
  dom.audio.addEventListener("playing", startVisualizer);
  dom.audio.addEventListener("pause", stopVisualizer);
  dom.audio.addEventListener("ended", stopVisualizer);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (ytVisualizerAnimId) {
        cancelAnimationFrame(ytVisualizerAnimId);
        ytVisualizerAnimId = null;
      }
    } else if (!dom.audio.paused) {
      startVisualizer();
    }
  });

  drawIdleVisualizer();
}

function drawIdleVisualizer() {
  if (!ytVisualizerCanvas || !ytVisualizerCtx) return;
  const width = ytVisualizerCanvas.width;
  const height = ytVisualizerCanvas.height;
  ytVisualizerCtx.clearRect(0, 0, width, height);

  const numBars = YT_VISUALIZER_BARS;
  const gap = 3.5;
  const totalGaps = (numBars - 1) * gap;
  const barWidth = Math.max(3, (width - totalGaps) / numBars);

  const rootStyle = getComputedStyle(document.documentElement);
  const color1 = rootStyle.getPropertyValue("--player-color-1").trim() || "#ff2d55";
  const color3 = rootStyle.getPropertyValue("--player-color-3").trim() || "#af52de";

  const grad = ytVisualizerCtx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color3);
  ytVisualizerCtx.fillStyle = grad;

  for (let i = 0; i < numBars; i++) {
    const barHeight = 3.5;
    const x = i * (barWidth + gap);
    const y = (height - barHeight) / 2;
    const r = barHeight / 2;

    ytVisualizerCtx.beginPath();
    if (typeof ytVisualizerCtx.roundRect === "function") {
      ytVisualizerCtx.roundRect(x, y, barWidth, barHeight, [r, r, r, r]);
    } else {
      ytVisualizerCtx.rect(x, y, barWidth, barHeight);
    }
    ytVisualizerCtx.fill();
  }
}

function drawAudioVisualizer() {
  const dom = getMusicDom();
  if (!ytVisualizerCanvas || !ytVisualizerCtx || !dom.audio) {
    ytVisualizerAnimId = null;
    return;
  }

  const isPlaying = !dom.audio.paused && !dom.audio.ended;
  const width = ytVisualizerCanvas.width;
  const height = ytVisualizerCanvas.height;
  ytVisualizerCtx.clearRect(0, 0, width, height);

  const numBars = YT_VISUALIZER_BARS;
  const gap = 3.5;
  const totalGaps = (numBars - 1) * gap;
  const barWidth = Math.max(3, (width - totalGaps) / numBars);
  const curTime = dom.audio.currentTime || 0;

  let hasRealData = false;
  if (!ytVisualizerAnalyser && ytWaveCtx) {
    try {
      const nodes = getOrCreateSharedAudioNodes(dom.audio);
      if (nodes && nodes.analyser) {
        ytVisualizerAnalyser = nodes.analyser;
        ytVisualizerDataArray = new Uint8Array(ytVisualizerAnalyser.frequencyBinCount);
      }
    } catch (_) {}
  }

  if (ytVisualizerAnalyser && ytVisualizerDataArray && isPlaying) {
    ytVisualizerAnalyser.getByteFrequencyData(ytVisualizerDataArray);
    hasRealData = ytVisualizerDataArray.some((v) => v > 0);
  }

  // Apple Music color palette gradient matching the track
  const rootStyle = getComputedStyle(document.documentElement);
  const color1 = rootStyle.getPropertyValue("--player-color-1").trim() || "#ff2d55";
  const color2 = rootStyle.getPropertyValue("--player-color-2").trim() || "#ff375f";
  const color3 = rootStyle.getPropertyValue("--player-color-3").trim() || "#af52de";
  const color4 = rootStyle.getPropertyValue("--player-color-4").trim() || "#5856d6";

  const grad = ytVisualizerCtx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.35, color2);
  grad.addColorStop(0.7, color3);
  grad.addColorStop(1, color4);

  ytVisualizerCtx.fillStyle = grad;
  ytVisualizerCtx.shadowBlur = 8;
  ytVisualizerCtx.shadowColor = color1;

  // Rhythm & Beat Generator when analyser is zeroed (CORS) or to enhance rhythm
  // Beat tempo ~124 BPM (quarter note = 0.484s)
  const beatInterval = 0.484;
  const beatPhase = (curTime % beatInterval) / beatInterval;
  // Kick drum hit on beat (punchy attack, exponential decay)
  const kickEnergy = Math.pow(Math.max(0, 1 - beatPhase * 2.2), 3);
  // Snare hit on backbeat (offset by half beat)
  const snarePhase = ((curTime + beatInterval * 0.5) % beatInterval) / beatInterval;
  const snareEnergy = Math.pow(Math.max(0, 1 - snarePhase * 2.8), 2.5);
  // Hi-hat groove (8th/16th notes)
  const hatPhase = (curTime % (beatInterval * 0.25)) / (beatInterval * 0.25);
  const hatEnergy = Math.pow(Math.max(0, 1 - hatPhase * 3.5), 2) * 0.45;

  let allSettled = true;

  for (let i = 0; i < numBars; i++) {
    let targetNorm = 0;

    if (isPlaying) {
      if (hasRealData && ytVisualizerDataArray) {
        // Map frequency bins: bass (bins 1-6), mids (7-24), highs (25-50)
        let binIdx = 0;
        if (i < 6) {
          binIdx = Math.floor(1 + (i / 6) * 6);
        } else if (i < 15) {
          binIdx = Math.floor(7 + ((i - 6) / 9) * 18);
        } else {
          binIdx = Math.floor(25 + ((i - 15) / 7) * 25);
        }
        targetNorm = (ytVisualizerDataArray[binIdx] || 0) / 255;
        if (i >= 6) targetNorm = Math.min(1, targetNorm * 1.35);
      } else {
        // Authentic Apple Music rhythmic soundwave simulation
        const posRatio = i / (numBars - 1);
        const waveA = Math.sin(curTime * 7.5 + i * 0.55);
        const waveB = Math.cos(curTime * 11.2 - i * 0.75);

        // Low bars: react heavily to Kick
        if (i < 7) {
          const kickImpact = (1 - (i / 7) * 0.4) * kickEnergy;
          targetNorm = kickImpact * 0.72 + (waveA * 0.15 + 0.18);
        }
        // Mid bars: react to Snare + melody waves
        else if (i < 15) {
          const snareImpact = snareEnergy * 0.65;
          const melody = Math.sin(curTime * 4.2 + (i - 7) * 0.6) * 0.25 + 0.25;
          targetNorm = snareImpact + melody + waveB * 0.12;
        }
        // High bars: react to Hi-hat + high frequencies shimmer
        else {
          const hatImpact = hatEnergy * 0.7;
          const shimmer = Math.sin(curTime * 16.0 + i * 0.9) * 0.2 + 0.22;
          targetNorm = hatImpact + shimmer;
        }

        // Add a gentle musical swell across the curve
        const centerBell = Math.sin(posRatio * Math.PI) * 0.2;
        targetNorm = Math.max(0.12, Math.min(0.96, targetNorm + centerBell));
      }
    } else {
      // Settling down to idle minimum (3.5px height)
      targetNorm = 0.08;
    }

    // Spring physics & smoothing
    const easeFactor = isPlaying ? (targetNorm > ytSmoothedBars[i] ? 0.38 : 0.22) : 0.15;
    ytSmoothedBars[i] += (targetNorm - ytSmoothedBars[i]) * easeFactor;

    if (Math.abs(ytSmoothedBars[i] - targetNorm) > 0.01) {
      allSettled = false;
    }

    const minBarH = 3.5;
    const barHeight = Math.max(minBarH, Math.min(height, ytSmoothedBars[i] * height));
    const x = i * (barWidth + gap);
    // Apple Music centered capsule soundwave
    const y = (height - barHeight) / 2;
    const r = Math.min(barWidth / 2, barHeight / 2);

    ytVisualizerCtx.beginPath();
    if (typeof ytVisualizerCtx.roundRect === "function") {
      ytVisualizerCtx.roundRect(x, y, barWidth, barHeight, [r, r, r, r]);
    } else {
      ytVisualizerCtx.rect(x, y, barWidth, barHeight);
    }
    ytVisualizerCtx.fill();
  }

  if (isPlaying || !allSettled) {
    ytVisualizerAnimId = requestAnimationFrame(drawAudioVisualizer);
  } else {
    ytVisualizerAnimId = null;
  }
}

/* ==================== HOTKEYS & HUD ==================== */
let hotkeyHudTimeout = null;
function showHotkeyHud(iconClass, text) {
  const hud = document.getElementById("yt-hotkey-hud");
  const icon = document.getElementById("yt-hotkey-hud-icon");
  const textEl = document.getElementById("yt-hotkey-hud-text");
  if (!hud || !icon || !textEl) return;

  icon.className = iconClass;
  textEl.textContent = text;
  hud.style.display = "flex";
  hud.classList.add("is-visible");

  if (hotkeyHudTimeout) clearTimeout(hotkeyHudTimeout);
  hotkeyHudTimeout = setTimeout(() => {
    hud.classList.remove("is-visible");
    setTimeout(() => {
      hud.style.display = "none";
    }, 200);
  }, 1200);
}

function initMusicHotkeys() {
  window.addEventListener("keydown", (e) => {
    const activeEl = document.activeElement;
    if (
      activeEl &&
      (activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.tagName === "SELECT" ||
        activeEl.isContentEditable ||
        activeEl.closest("input, textarea, [contenteditable='true'], .search-container, #admin-modal, #login-modal, #yt-lyrics-share-modal"))
    ) {
      return;
    }

    const dom = getMusicDom();
    if (!dom.audio) return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        if (dom.audio.paused) {
          dom.audio.play().catch(() => {});
          showHotkeyHud("fas fa-play", "Oynadılır");
        } else {
          dom.audio.pause();
          showHotkeyHud("fas fa-pause", "Pauza");
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        dom.audio.currentTime = Math.min(dom.audio.duration || 0, (dom.audio.currentTime || 0) + 5);
        showHotkeyHud("fas fa-forward", "+5s");
        break;

      case "ArrowLeft":
        e.preventDefault();
        dom.audio.currentTime = Math.max(0, (dom.audio.currentTime || 0) - 5);
        showHotkeyHud("fas fa-backward", "-5s");
        break;

      case "ArrowUp":
        e.preventDefault();
        const curVolUp = dom.audio.volume || 0.85;
        const newVolUp = Math.min(1, Math.round((curVolUp + 0.05) * 100) / 100);
        updateVolumeUi(newVolUp);
        showHotkeyHud("fas fa-volume-high", `${Math.round(newVolUp * 100)}%`);
        break;

      case "ArrowDown":
        e.preventDefault();
        const curVolDown = dom.audio.volume || 0.85;
        const newVolDown = Math.max(0, Math.round((curVolDown - 0.05) * 100) / 100);
        updateVolumeUi(newVolDown);
        showHotkeyHud("fas fa-volume-low", `${Math.round(newVolDown * 100)}%`);
        break;

      case "KeyM":
        e.preventDefault();
        dom.audio.muted = !dom.audio.muted;
        showHotkeyHud(dom.audio.muted ? "fas fa-volume-xmark" : "fas fa-volume-high", dom.audio.muted ? "Səssiz" : "Səsli");
        break;

      case "KeyL":
        e.preventDefault();
        if (!dom.activePlayer?.classList.contains("expanded")) {
          window.togglePlayerMode?.(true);
        }
        setPlayerTab("lyrics");
        updateLyricsToggleState();
        showHotkeyHud("fas fa-microphone-lines", "Sözlər");
        break;

      case "KeyN":
        e.preventDefault();
        playNextMusic();
        showHotkeyHud("fas fa-forward-step", "Növbəti");
        break;

      case "KeyP":
        e.preventDefault();
        playPrevMusic();
        showHotkeyHud("fas fa-backward-step", "Əvvəlki");
        break;

      case "KeyF":
        e.preventDefault();
        const isExp = dom.activePlayer?.classList.contains("expanded");
        window.togglePlayerMode?.(!isExp);
        showHotkeyHud(isExp ? "fas fa-compress" : "fas fa-expand", isExp ? "Kiçildildi" : "Genişləndirildi");
        break;
    }
  });
}

/* ==================== LYRICS SHARE MODAL ==================== */
function initLyricsShareModal() {
  const shareBtn = document.getElementById("yt-lyrics-share-btn");
  const modal = document.getElementById("yt-lyrics-share-modal");
  const closeBtn = document.getElementById("yt-share-modal-close");
  const backdrop = document.getElementById("yt-share-modal-backdrop");
  const linesList = document.getElementById("yt-share-lines-list");
  const cardTitle = document.getElementById("yt-share-card-title");
  const cardArtist = document.getElementById("yt-share-card-artist");
  const cardCover = document.getElementById("yt-share-card-cover");
  const cardBg = document.getElementById("yt-share-card-bg");
  const cardLyrics = document.getElementById("yt-share-card-lyrics");
  const downloadBtn = document.getElementById("yt-share-download-btn");
  const copyBtn = document.getElementById("yt-share-copy-btn");
  const nativeBtn = document.getElementById("yt-share-native-btn");

  if (!shareBtn || !modal) return;

  let selectedLines = [];

  const updateShareCardPreview = () => {
    if (!cardLyrics) return;
    if (!selectedLines.length) {
      cardLyrics.innerHTML = "<p>Misra seçilməyib</p>";
      return;
    }
    cardLyrics.innerHTML = selectedLines.map((l) => `<p>${escapeHtmlMusic(l)}</p>`).join("");
  };

  const openShareModal = () => {
    const track = window.musicLibrary[window.currentMusicIndex] || {};
    const parsed = window.currentMusicLyricsParsed || [];
    let lines = [];
    if (parsed.length) {
      lines = parsed.map((p) => p.text).filter((t) => t && t !== "…" && t !== "...");
    } else {
      const plainText = window.currentMusicPlainLyricsText || track.lyrics?.text || "";
      if (plainText) {
        lines = plainText
          .split(/\r?\n/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0 && t !== "…" && t !== "...");
      }
    }

    if (!lines.length) {
      alert("Bu mahnı üçün söz tapılmadı.");
      return;
    }

    if (cardTitle) cardTitle.textContent = track.title || "Mahnı";
    if (cardArtist) cardArtist.textContent = track.artist || "Artist";
    const coverSrc = track.coverUrl || DEFAULT_MUSIC_COVER;
    if (cardCover) cardCover.src = coverSrc;
    if (cardBg) cardBg.style.backgroundImage = `url("${coverSrc}")`;

    linesList.innerHTML = lines.map((line, idx) => `
      <div class="yt-share-line-item" data-line-index="${idx}">
        ${escapeHtmlMusic(line)}
      </div>
    `).join("");

    selectedLines = [];
    const activeIdx = Math.max(0, window.currentLyricsActiveIndex);
    const initialLine = lines[activeIdx] || lines[0];
    if (initialLine) {
      selectedLines = [initialLine];
      const targetEl = linesList.querySelector(`[data-line-index="${activeIdx}"]`) || linesList.children[0];
      if (targetEl) targetEl.classList.add("selected");
    }

    updateShareCardPreview();
    modal.style.display = "flex";
  };

  const closeShareModal = () => {
    modal.style.display = "none";
  };

  shareBtn.addEventListener("click", openShareModal);
  closeBtn?.addEventListener("click", closeShareModal);
  backdrop?.addEventListener("click", closeShareModal);

  linesList?.addEventListener("click", (e) => {
    const item = e.target.closest(".yt-share-line-item");
    if (!item) return;
    const text = item.textContent.trim();
    if (item.classList.contains("selected")) {
      item.classList.remove("selected");
      selectedLines = selectedLines.filter((l) => l !== text);
    } else {
      if (selectedLines.length >= 4) {
        showHotkeyHud("fas fa-info-circle", "Maks. 4 misra");
        return;
      }
      item.classList.add("selected");
      selectedLines.push(text);
    }
    updateShareCardPreview();
  });

  copyBtn?.addEventListener("click", () => {
    const track = window.musicLibrary[window.currentMusicIndex] || {};
    const textToCopy = `"${selectedLines.join("\n")}"\n\n🎵 ${track.title} - ${track.artist}\nDUNYAMIZ`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showHotkeyHud("fas fa-check", "Kopyalandı!");
      }).catch(() => {
        showHotkeyHud("fas fa-check", "Kopyalandı!");
      });
    } else {
      showHotkeyHud("fas fa-check", "Kopyalandı!");
    }
  });

  downloadBtn?.addEventListener("click", () => {
    const track = window.musicLibrary[window.currentMusicIndex] || {};
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 1000;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const toRgba = (cStr, alpha) => {
      if (!cStr) return `rgba(123, 44, 191, ${alpha})`;
      const str = cStr.trim();
      if (str.startsWith("rgb(")) {
        return str.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
      }
      if (str.startsWith("rgba(")) {
        return str.replace(/[\d\.]+\)$/, `${alpha})`);
      }
      if (str.startsWith("#")) {
        const hex = str.slice(1);
        let r = 0, g = 0, b = 0;
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length >= 6) {
          r = parseInt(hex.slice(0, 2), 16);
          g = parseInt(hex.slice(2, 4), 16);
          b = parseInt(hex.slice(4, 6), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return str;
    };

    const wrapText = (context, text, maxWidth) => {
      const words = text.split(/\s+/);
      const lines = [];
      let currentLine = "";

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    };

    const fitText = (context, text, maxWidth) => {
      if (!text) return "";
      if (context.measureText(text).width <= maxWidth) return text;
      let truncated = text;
      while (truncated.length > 3 && context.measureText(truncated + "…").width > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      return truncated + "…";
    };

    const rootStyle = getComputedStyle(document.documentElement);
    const trackColors = track.extractedColors || (window.currentMusic && window.currentMusic.extractedColors);
    let color1 = trackColors?.color1 || rootStyle.getPropertyValue("--player-color-1").trim() || "rgb(123, 44, 191)";
    let color2 = trackColors?.color2 || rootStyle.getPropertyValue("--player-color-2").trim() || "rgb(58, 12, 163)";
    let color3 = trackColors?.color3 || rootStyle.getPropertyValue("--player-color-3").trim() || "rgb(67, 97, 238)";
    let color4 = trackColors?.color4 || rootStyle.getPropertyValue("--player-color-4").trim() || "rgb(247, 37, 133)";

    const domCover = (cardCover && cardCover.complete && cardCover.naturalWidth > 0)
      ? cardCover
      : (document.getElementById("yt-cover-image")?.complete && document.getElementById("yt-cover-image")?.naturalWidth > 0)
        ? document.getElementById("yt-cover-image")
        : null;

    const coverImg = new Image();
    const src = track.coverUrl || DEFAULT_MUSIC_COVER;
    const isSameOrigin = !/^https?:\/\//i.test(src) || src.startsWith(window.location.origin);
    const absoluteImgSrc = /^https?:\/\//i.test(src) ? src : new URL(src, window.location.origin).href;
    const proxiedSrc = isSameOrigin ? absoluteImgSrc : `/.netlify/functions/cover-proxy?src=${encodeURIComponent(absoluteImgSrc)}`;

    if (!isSameOrigin) {
      coverImg.crossOrigin = "anonymous";
    }

    const renderCardContent = () => {
      const activeCover = (coverImg && coverImg.complete && coverImg.naturalWidth > 0)
        ? coverImg
        : domCover;

      // Extract colors from active cover if trackColors was not yet cached
      if (activeCover && !trackColors) {
        try {
          const sampleCanvas = document.createElement("canvas");
          sampleCanvas.width = 16;
          sampleCanvas.height = 16;
          const sCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
          if (sCtx) {
            sCtx.drawImage(activeCover, 0, 0, 16, 16);
            const sd = sCtx.getImageData(0, 0, 16, 16).data;
            let r = 0, g = 0, b = 0, cnt = 0;
            for (let p = 0; p < sd.length; p += 4) {
              const br = (sd[p] + sd[p+1] + sd[p+2]) / 3;
              if (br > 10 && br < 245) {
                r += sd[p]; g += sd[p+1]; b += sd[p+2]; cnt++;
              }
            }
            if (cnt) {
              color1 = `rgb(${Math.round(r/cnt)}, ${Math.round(g/cnt)}, ${Math.round(b/cnt)})`;
              color2 = `rgb(${Math.max(10, Math.round(r/cnt*0.6))}, ${Math.max(10, Math.round(g/cnt*0.6))}, ${Math.max(20, Math.round(b/cnt*0.7))})`;
            }
          }
        } catch (_) {}
      }

      // 1. Base dark background
      ctx.fillStyle = "#0c0d12";
      ctx.fillRect(0, 0, 800, 1000);

      // 2. Dynamic ambient lights matching track's album cover colors
      const rad1 = ctx.createRadialGradient(200, 240, 20, 200, 240, 520);
      rad1.addColorStop(0, toRgba(color1, 0.65));
      rad1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, 800, 1000);

      const rad2 = ctx.createRadialGradient(660, 780, 20, 660, 780, 520);
      rad2.addColorStop(0, toRgba(color4 || color2, 0.55));
      rad2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, 800, 1000);

      const rad3 = ctx.createRadialGradient(680, 220, 10, 680, 220, 400);
      rad3.addColorStop(0, toRgba(color3, 0.35));
      rad3.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rad3;
      ctx.fillRect(0, 0, 800, 1000);

      // 3. Overlay blurred album cover for ultimate Apple Music aesthetics
      try {
        if (activeCover && activeCover.complete && activeCover.naturalWidth > 0) {
          ctx.save();
          if (typeof ctx.filter !== "undefined") {
            ctx.filter = "blur(65px) saturate(1.8) brightness(0.42)";
          }
          ctx.globalAlpha = 0.5;
          ctx.drawImage(activeCover, -60, -60, 920, 1120);
          ctx.restore();
        }
      } catch (_) {}

      // 4. Subtle dark vignette gradient overlay for contrast and clarity
      const vigGrad = ctx.createLinearGradient(0, 0, 0, 1000);
      vigGrad.addColorStop(0, "rgba(10, 12, 16, 0.45)");
      vigGrad.addColorStop(0.35, "rgba(10, 12, 16, 0.2)");
      vigGrad.addColorStop(1, "rgba(10, 12, 16, 0.75)");
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, 800, 1000);

      // 5. Header: Cover Art (rounded pill box)
      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(80, 80, 96, 96, 20);
      } else {
        ctx.rect(80, 80, 96, 96);
      }
      ctx.clip();
      try {
        if (activeCover && activeCover.complete && activeCover.naturalWidth > 0) {
          ctx.drawImage(activeCover, 80, 80, 96, 96);
        } else {
          ctx.fillStyle = "#1e222a";
          ctx.fillRect(80, 80, 96, 96);
        }
      } catch (_) {
        ctx.fillStyle = "#1e222a";
        ctx.fillRect(80, 80, 96, 96);
      }
      ctx.restore();

      // Header: Song Title & Artist (fit with ellipsis)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(fitText(ctx, track.title || "Mahnı", 500), 200, 125);

      ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
      ctx.font = "24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(fitText(ctx, track.artist || "Artist", 500), 200, 162);

      // Separator Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(80, 220);
      ctx.lineTo(720, 220);
      ctx.stroke();

      // 6. Lyrics Content: Responsive Word Wrapping & Dynamic Centering
      const maxTextWidth = 640;
      const linesToDraw = selectedLines.length ? selectedLines : [track.title || ""];

      const getWrappedBlocks = (fSize) => {
        ctx.font = `bold ${fSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        return linesToDraw.map((l) => {
          const clean = l.replace(/^[“"']+|[”"']+$/g, "").trim();
          return wrapText(ctx, `“${clean}”`, maxTextWidth);
        });
      };

      let fontSize = 36;
      let lineHeight = 54;
      let blockGap = 26;
      let wrappedBlocks = getWrappedBlocks(fontSize);
      let totalLines = wrappedBlocks.reduce((acc, b) => acc + b.length, 0);

      if (totalLines > 4) {
        fontSize = 31;
        lineHeight = 46;
        blockGap = 20;
        wrappedBlocks = getWrappedBlocks(fontSize);
        totalLines = wrappedBlocks.reduce((acc, b) => acc + b.length, 0);
      }
      if (totalLines > 6) {
        fontSize = 26;
        lineHeight = 38;
        blockGap = 16;
        wrappedBlocks = getWrappedBlocks(fontSize);
        totalLines = wrappedBlocks.reduce((acc, b) => acc + b.length, 0);
      }

      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 14;

      const totalHeight = wrappedBlocks.reduce((sum, b, idx) => {
        return sum + b.length * lineHeight + (idx < wrappedBlocks.length - 1 ? blockGap : 0);
      }, 0);

      const centerY = 230 + (650 / 2);
      let currentY = Math.max(260, centerY - (totalHeight / 2) + (fontSize * 0.8));

      wrappedBlocks.forEach((block) => {
        block.forEach((lineStr) => {
          ctx.fillText(lineStr, 80, currentY);
          currentY += lineHeight;
        });
        currentY += blockGap;
      });
      ctx.shadowBlur = 0;

      // 7. Footer: Brand
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("DUNYAMIZ PLAYER", 80, 930);

      // 8. Download
      const link = document.createElement("a");
      link.download = `${(track.title || "mahni-sozleri").replace(/\s+/g, "-")}-lyrics.png`;
      link.href = c.toDataURL("image/png");
      link.click();
      showHotkeyHud("fas fa-download", "Şəkil yükləndi!");
    };

    let rendered = false;
    const safeRender = () => {
      if (rendered) return;
      rendered = true;
      renderCardContent();
    };

    if (domCover && domCover.complete && domCover.naturalWidth > 0) {
      safeRender();
    } else {
      coverImg.onload = safeRender;
      coverImg.onerror = () => {
        if (!isSameOrigin && !coverImg.src.includes("cover-proxy")) {
          coverImg.src = proxiedSrc;
        } else {
          safeRender();
        }
      };
      coverImg.src = isSameOrigin ? absoluteImgSrc : proxiedSrc;
      setTimeout(safeRender, 1500);
    }
  });

  nativeBtn?.addEventListener("click", () => {
    const track = window.musicLibrary[window.currentMusicIndex] || {};
    const textToShare = `“${selectedLines.join("\n")}”\n\n🎵 ${track.title} - ${track.artist}`;
    if (navigator.share) {
      navigator.share({
        title: `${track.title} - ${track.artist}`,
        text: textToShare,
        url: window.location.href,
      }).catch(() => {});
    } else {
      copyBtn?.click();
    }
  });
}

async function initMusicPage() {
  try {
    initMusicPlayerEvents();
    initAudioVisualizer();
    initLyricsShareModal();
    initMusicHotkeys();
    window.musicLibrary = await fetchMusicJsonList();
    renderMusicPlaylist();
    updatePlayerModeButtons();
    renderUpNextList();
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
    if (trackCount) trackCount.textContent = "0 mahnı";
  }
}

document.addEventListener("DOMContentLoaded", initMusicPage);
function seekToLyricsTime(time) {
  const { audio } = getMusicDom();
  if (!audio || Number.isNaN(Number(time))) return;
  const safeTime = Math.max(0, Number(time));
  audio.currentTime = safeTime;
  window.currentLyricsActiveIndex = -1;
  window.currentLyricsActiveWordIndex = -1;
  updateSyncedLyricsByTime(safeTime);
  if (audio.paused) {
    audio.play().catch((err) => console.error("Lyrics seek play error:", err));
  }
}
if (window.matchMedia("(pointer: fine)").matches) {
  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  document.body.appendChild(cursor);
  let trails = [];
  for (let i = 0; i < 8; i++) {
    let trail = document.createElement("div");
    trail.className = "cursor-trail";
    document.body.appendChild(trail);
    trails.push({ el: trail, x: 0, y: 0 });
  }
  let mouseX = 0,
    mouseY = 0;
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + "px";
    cursor.style.top = mouseY + "px";
  });
  gsap.ticker.add(() => {
    let x = mouseX,
      y = mouseY;
    trails.forEach((trail, index) => {
      let nextTrail = trails[index + 1] || trails[0];
      x += (nextTrail.x - x) * 0.4;
      y += (nextTrail.y - y) * 0.4;
      trail.x = x;
      trail.y = y;
      trail.el.style.left = x + "px";
      trail.el.style.top = y + "px";
      trail.el.style.opacity = 1 - index / trails.length;
    });
  });
  document
    .querySelectorAll("a, button, .photo-frame, .note-card, .yt-track-item")
    .forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
      el.addEventListener("mouseleave", () =>
        cursor.classList.remove("hovering"),
      );
    });
}

function formatAdminDateTimeLocal(dateLike) {
  const d = new Date(dateLike);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openAdminPanel() {
  const adminPanel = document.getElementById("admin-panel");
  if (!adminPanel) return;
  addActivity("⚙️ Gizli Admin panelini açdı");
  adminPanel.classList.remove("hidden");
  adminPanel.style.display = "flex";
  syncAdminOverview();
}

function closeAdminPanel() {
  const adminPanel = document.getElementById("admin-panel");
  if (!adminPanel) return;
  adminPanel.classList.add("hidden");
  adminPanel.style.display = "none";
}

function syncAdminOverview() {
  const meetingStat = document.getElementById("admin-stat-meetings");
  const targetStat = document.getElementById("admin-stat-target");
  const imageStat = document.getElementById("admin-stat-image");
  const audioStat = document.getElementById("admin-stat-audio");
  const dateInput = document.getElementById("admin-date");
  const countInput = document.getElementById("admin-count");
  const musicTitleInput = document.getElementById("admin-music-title");
  const musicArtistInput = document.getElementById("admin-music-artist");
  const imageFile = document.getElementById("admin-file")?.files?.[0];
  const audioFile = document.getElementById("admin-music-file")?.files?.[0];
  const coverFile = document.getElementById("admin-music-cover")?.files?.[0];

  const imagePreview = document.getElementById("admin-dashboard-image-preview");
  const imageName = document.getElementById("admin-dashboard-image-name");
  const imageDate = document.getElementById("admin-dashboard-image-date");
  const imageTotalEl = document.getElementById("admin-dashboard-total-images");

  const musicCover = document.getElementById("admin-dashboard-music-cover");
  const musicName = document.getElementById("admin-dashboard-music-name");
  const musicArtist = document.getElementById("admin-dashboard-music-artist");
  const musicTotalEl = document.getElementById("admin-dashboard-total-music");

  const totalImages = Array.isArray(window.allImages)
    ? window.allImages.length
    : 0;
  const totalMusic = Array.isArray(window.musicLibrary)
    ? window.musicLibrary.length
    : 0;
  const latestImage = totalImages
    ? window.allImages[window.allImages.length - 1]
    : null;
  const latestTrack = totalMusic ? window.musicLibrary[0] : null;

  if (meetingStat) meetingStat.textContent = String(config.meetingCount ?? 0);
  if (targetStat) targetStat.textContent = formatAzDate(targetDate);
  if (imageStat)
    imageStat.textContent = totalImages
      ? `${totalImages} fayl`
      : imageFile
        ? imageFile.name
        : "0 fayl";

  if (audioStat) {
    if (totalMusic) {
      audioStat.textContent = `${totalMusic} fayl`;
    } else if (audioFile) {
      audioStat.textContent = audioFile.name;
    } else if (musicTitleInput?.value.trim()) {
      audioStat.textContent = musicTitleInput.value.trim();
    } else {
      audioStat.textContent = "0 fayl";
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
      imagePreview.src = "assets/512.png";
    }
  }

  if (imageName) {
    imageName.textContent =
      imageFile?.name || latestImage?.name || "Şəkil yoxdur";
  }

  if (imageDate) {
    const rawDate = latestImage?.git_date || parseImageDate(latestImage || {});
    imageDate.textContent = imageFile
      ? "Yeni şəkil seçilib"
      : rawDate
        ? formatAzDate(rawDate)
        : "Tarix bilinmir";
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
    musicName.textContent =
      musicTitleInput?.value.trim() || latestTrack?.title || "Musiqi yoxdur";
  }

  if (musicArtist) {
    musicArtist.textContent =
      musicArtistInput?.value.trim() ||
      latestTrack?.artist ||
      "Artist bilinmir";
  }

  if (dateInput && document.activeElement !== dateInput) {
    dateInput.placeholder = formatAdminDateTimeLocal(targetDate);
  }
  if (countInput && document.activeElement !== countInput) {
    countInput.placeholder = String(config.meetingCount ?? "");
  }
}

function switchAdminSection(sectionName) {
  document.querySelectorAll(".admin-nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.adminSection === sectionName);
  });

  document.querySelectorAll(".admin-section").forEach((section) => {
    section.classList.toggle(
      "active",
      section.dataset.adminSection === sectionName,
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const closeAdminBtn = document.querySelector(".close-admin");
  const adminPanel = document.getElementById("admin-panel");

  if (closeAdminBtn && adminPanel) {
    closeAdminBtn.addEventListener("click", closeAdminPanel);
  }

  window.addEventListener("click", (event) => {
    if (event.target === adminPanel) {
      closeAdminPanel();
    }
  });

  document.querySelectorAll(".admin-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      switchAdminSection(btn.dataset.adminSection),
    );
  });

  document.querySelectorAll("[data-admin-jump]").forEach((btn) => {
    btn.addEventListener("click", () =>
      switchAdminSection(btn.dataset.adminJump),
    );
  });

  document
    .getElementById("admin-open-note-modal")
    ?.addEventListener("click", () => {
      document.getElementById("open-add-note-btn")?.click();
    });

  document
    .getElementById("admin-open-note-modal-secondary")
    ?.addEventListener("click", () => {
      document.getElementById("open-add-note-btn")?.click();
    });

  [
    "admin-file",
    "admin-music-file",
    "admin-music-title",
    "admin-date",
    "admin-count",
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", syncAdminOverview);
    document.getElementById(id)?.addEventListener("input", syncAdminOverview);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && adminPanel?.style.display === "flex") {
      closeAdminPanel();
    }
  });

  syncAdminOverview();
});
console.log(
  `
%c🤍 Cəmalə & Hüseyn • Dünyamız 🤍
%cSite version: 3.1.5
%c"Sən mənim ən gözəl xəyalımsan..."
`,
  'font-size: 18px; color: #e91e63; font-family: "Dancing Script", cursive;',
  "font-size: 12px; color: #ff80ab;",
  "font-size: 14px; color: #ffffff; font-style: italic;",
);
let visitStartTime = Date.now();
let exitNotificationSent = false;

const AppState = {
  visitorIp: "Naməlum IP",
  telegramMessageId: null,
  activityLog: [],
  editQueue: Promise.resolve(),
  deviceInfoCache: null,
};

// Bakı vaxtını formatla (AZT = UTC+4)
function getBakuTime() {
  return new Date().toLocaleString("az-AZ", {
    timeZone: "Asia/Baku",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function getBakuDateTime() {
  return new Date().toLocaleString("az-AZ", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// Tam Telegram mesaj mətnini yarat
function buildTelegramText() {
  const ip = AppState.visitorIp || "Naməlum IP";
  const info = AppState.deviceInfoCache || getDeviceInfo();
  const isActive = !exitNotificationSent;

  let text = "";
  text += isActive ? "🟢 Ziyarətçi Aktiv" : "🔴 Ziyarətçi Çıxdı";
  text += ` — ${ip}\n`;
  text += `${info}\n`;
  text += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📋 Hərəkətlər:\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;

  for (const entry of AppState.activityLog) {
    text += `⏰ ${entry.time} — ${entry.text}\n`;
  }

  return text;
}

// Telegram-a yeni mesaj göndər (ilk dəfə)
async function sendTelegramSession() {
  const text = buildTelegramText();
  try {
    const res = await fetch("/.netlify/functions/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, action: "send" }),
    });
    const data = await res.json();
    if (data.success && data.message_id) {
      AppState.telegramMessageId = data.message_id;
    } else {
      console.error("Telegram session göndərilmədi:", data.error || data);
    }
  } catch (e) {
    console.error("Telegram session xətası:", e);
  }
}

// Mövcud mesajı düzənlə
async function editTelegramSession(keepalive = false) {
  if (!AppState.telegramMessageId) return;
  const text = buildTelegramText();
  try {
    const res = await fetch("/.netlify/functions/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        action: "edit",
        message_id: AppState.telegramMessageId,
      }),
      keepalive,
    });
    // keepalive ilə response oxumaq mümkün olmaya bilər
    if (!keepalive) {
      const data = await res.json();
      if (!data.success) {
        console.error("Telegram edit uğursuz:", data.error || data);
      }
    }
  } catch (e) {
    if (!keepalive) {
      console.error("Telegram edit xətası:", e);
    }
  }
}

// Yeni hərəkət əlavə et və mesajı yenilə
function addActivity(text, keepalive = false) {
  const time = getBakuTime();
  AppState.activityLog.push({ time, text });

  // Edit queue — ardıcıl edit sorğuları üçün
  AppState.editQueue = AppState.editQueue.then(() => {
    if (AppState.telegramMessageId) {
      return editTelegramSession(keepalive);
    }
  }).catch(() => {});
}
// Modullardan (letters.js, notes.js, films.js) istifadə üçün qlobal et
window.addActivity = addActivity;

// Köhnə sendTelegramMessage funksiyasını saxla (admin panel bildirişi üçün lazım ola bilər)
async function sendTelegramMessage(text, keepalive = false) {
  const temizMetn = String(text || "").trim();

  if (!temizMetn) {
    console.error("Mesaj boşdur:", text);
    return;
  }

  try {
    const res = await fetch("/.netlify/functions/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: temizMetn }),
      keepalive,
    });

    const data = await res.json();

    if (!data.success) {
      console.error("Telegram göndərilmədi:", data.error || data);
    }
  } catch (e) {
    console.error("Telegram bildiriş xətası:", e);
  }
}
function getDeviceInfo() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const language = navigator.language || "Naməlum";
  const touchPoints = navigator.maxTouchPoints || 0;

  let device = "Naməlum cihaz";
  let brand = "Naməlum marka";
  let browser = "Naməlum brauzer";

  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (platform === "MacIntel" && touchPoints > 1);

  if (isIOS) {
    brand = "Apple";

    if (/iPhone/i.test(ua) || (platform === "MacIntel" && touchPoints > 1)) {
      device = "iPhone";
    } else if (/iPad/i.test(ua)) {
      device = "iPad";
    } else {
      device = "iOS cihaz";
    }
  } else if (/Android/i.test(ua)) {
    device = "Android telefon";

    if (/Samsung|SM-/i.test(ua)) brand = "Samsung";
    else if (/Redmi|Xiaomi|Mi\s/i.test(ua)) brand = "Xiaomi / Redmi";
    else if (/Huawei/i.test(ua)) brand = "Huawei";
    else if (/Honor/i.test(ua)) brand = "Honor";
    else if (/OPPO/i.test(ua)) brand = "OPPO";
    else if (/Vivo/i.test(ua)) brand = "Vivo";
    else brand = "Android";
  } else {
    device = "Kompüter";
    brand = platform || "Naməlum";
  }

  if (/Edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/CriOS/i.test(ua)) browser = "Chrome iOS";
  else if (/Chrome/i.test(ua)) browser = "Google Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";

  const result = `📱 Cihaz: ${device} | 🏷 ${brand} | 🌐 ${browser}\n🗣 Dil: ${language}`;
  AppState.deviceInfoCache = result;
  return result;
}
async function initAnalytics() {
  // Cihaz məlumatlarını cache-lə
  getDeviceInfo();

  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    AppState.visitorIp = data.ip || "Naməlum IP";
  } catch (e) {
    console.error("IP alma xətası:", e);
    AppState.visitorIp = "Naməlum IP";
  }

  // İlk hərəkət — sayta giriş
  AppState.activityLog.push({
    time: getBakuTime(),
    text: "🟢 Sayta daxil oldu",
  });

  // İlk mesajı göndər
  await sendTelegramSession();

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      sendExitNotification();
    }
  });

  window.addEventListener("pagehide", sendExitNotification);
  window.addEventListener("beforeunload", sendExitNotification);
}

function sendExitNotification() {
  if (exitNotificationSent) return;
  exitNotificationSent = true;

  const duration = Date.now() - visitStartTime;
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  let timeString = "";
  if (hours > 0) timeString += `${hours} saat `;
  if (minutes > 0) timeString += `${minutes} dəq `;
  timeString += `${seconds} san`;

  addActivity(`🔴 Saytdan çıxdı (${timeString})`, true);
}
function initPlayerSwipeToClose() {
  return;
}
// ========== ULTRA PREMIUM PLAYER EXPAND / COLLAPSE ==========
function getBackdrop() {
  let el = document.getElementById("yt-player-backdrop");
  if (!el) {
    el = document.createElement("div");
    el.id = "yt-player-backdrop";
    document.body.appendChild(el);
  }
  return el;
}

function animatePlayerExpand(complete) {
  const player = getMusicDom().activePlayer;
  if (!player || player._playerAnimating) return;
  player._playerAnimating = true;

  const isMobile = window.innerWidth <= 768;
  const miniBar = player.querySelector(".yt-player-top");
  const fullBody = player.querySelector(".yt-player-body");
  const backdrop = getBackdrop();

  // 1. Get exact current rendered bounding rect of the mini pill
  const firstRect = player.getBoundingClientRect();
  const defaultMiniW = isMobile ? window.innerWidth - 20 : Math.min(window.innerWidth * 0.92, 760);
  const defaultMiniH = isMobile ? 68 : 72;
  const defaultMiniBottom = isMobile ? 76 : 88;
  const initLeft = firstRect.width > 0 ? firstRect.left : (window.innerWidth - defaultMiniW) / 2;
  const initTop = firstRect.height > 0 ? firstRect.top : window.innerHeight - defaultMiniBottom - defaultMiniH;
  const initWidth = firstRect.width > 0 ? firstRect.width : defaultMiniW;
  const initHeight = firstRect.height > 0 ? firstRect.height : defaultMiniH;
  const initRadius = isMobile ? 18 : 22;

  // 2. Add morphing class and body morphing class (DO NOT add player-expanded or expanded yet!)
  player.classList.add("is-player-morphing");
  player.classList.remove("player-mini", "player-collapsing", "player-hiding");
  document.body.classList.add("player-is-morphing");

  // Lock player container to the exact pixel bounds of the mini pill
  gsap.set(player, {
    position: "fixed",
    inset: "auto",
    top: initTop,
    left: initLeft,
    right: "auto",
    bottom: "auto",
    width: initWidth,
    height: initHeight,
    maxWidth: "none",
    maxHeight: "none",
    borderRadius: initRadius,
    transform: "none",
    margin: 0,
    zIndex: 9999,
    boxShadow: "0 16px 42px rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.09)",
  });

  // Prepare mini bar: pinned at top of the player
  if (miniBar) {
    gsap.set(miniBar, {
      opacity: 1,
      y: 0,
    });
  }

  // Prepare full body: full viewport size, initial opacity 0
  if (fullBody) {
    gsap.set(fullBody, {
      opacity: 0,
    });
  }

  // Internal targets to animate inside full body
  const targets = player.querySelectorAll(
    ".yt-player-topbar, .yt-player-tab-buttons, .yt-player-art-wrap, .yt-player-meta-full, .yt-progress-area, .yt-controls-row, .yt-player-right-col"
  );
  gsap.set(targets, { opacity: 0, y: 24 });

  // Prepare backdrop
  backdrop.style.display = "block";
  gsap.set(backdrop, { opacity: 0 });

  // Create smooth choreographed GSAP timeline
  const tl = gsap.timeline({
    defaults: { ease: "power3.out" },
    onComplete: () => {
      document.body.classList.remove("player-is-morphing");
      document.body.classList.add("player-expanded");
      player.classList.add("expanded");
      player.classList.remove("is-player-morphing", "is-transitioning");

      // Clean up inline styles so CSS takes over
      gsap.set(player, { clearProps: "all" });
      if (miniBar) gsap.set(miniBar, { clearProps: "all" });
      if (fullBody) gsap.set(fullBody, { clearProps: "all" });
      if (targets.length) gsap.set(targets, { clearProps: "all" });
      player._playerAnimating = false;
      syncPlayerExpandedState();
      if (typeof complete === "function") complete();
    },
  });

  // 1. Container morphs from mini pill rect to full screen
  tl.to(
    player,
    {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      borderRadius: 0,
      boxShadow: "none",
      border: "none",
      duration: isMobile ? 0.42 : 0.46,
      ease: "power3.out",
    },
    0
  );

  // 2. Mini bar fades out quickly
  if (miniBar) {
    tl.to(
      miniBar,
      {
        opacity: 0,
        y: -10,
        duration: 0.16,
        ease: "power2.out",
      },
      0
    );
  }

  // 3. Full body fades in
  if (fullBody) {
    tl.to(
      fullBody,
      {
        opacity: 1,
        duration: 0.32,
        ease: "power2.out",
      },
      0.08
    );
  }

  // 4. Staggered glide-in for interior components
  if (targets.length) {
    tl.to(
      targets,
      {
        opacity: 1,
        y: 0,
        stagger: 0.035,
        duration: 0.36,
        ease: "power3.out",
      },
      0.12
    );
  }

  // 5. Backdrop fade in
  tl.to(
    backdrop,
    {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
    },
    0
  );
}

function animatePlayerCollapse(complete) {
  const player = getMusicDom().activePlayer;
  if (!player || player._playerAnimating) return;
  player._playerAnimating = true;

  const isMobile = window.innerWidth <= 768;
  const miniBar = player.querySelector(".yt-player-top");
  const fullBody = player.querySelector(".yt-player-body");
  const backdrop = document.getElementById("yt-player-backdrop");

  // Calculate target mini pill position and dimensions
  const miniW = isMobile ? window.innerWidth - 20 : Math.min(window.innerWidth * 0.92, 760);
  const miniH = isMobile ? 68 : 72;
  const miniBottom = isMobile ? 76 : 88;
  const targetLeft = isMobile ? 10 : (window.innerWidth - miniW) / 2;
  const targetTop = window.innerHeight - miniBottom - miniH;
  const targetRadius = isMobile ? 18 : 22;

  // Immediately remove expanded class and state so no expanded CSS rules interfere
  document.body.classList.remove("player-expanded");
  player.classList.remove("expanded");
  player.classList.add("is-player-morphing");
  document.body.classList.add("player-is-morphing");

  // Lock starting values to full screen
  gsap.set(player, {
    position: "fixed",
    inset: "auto",
    top: 0,
    left: 0,
    right: "auto",
    bottom: "auto",
    width: window.innerWidth,
    height: window.innerHeight,
    maxWidth: "none",
    maxHeight: "none",
    borderRadius: 0,
    transform: "none",
    margin: 0,
    zIndex: 9999,
    boxShadow: "none",
    border: "none",
  });

  if (fullBody) {
    gsap.set(fullBody, { opacity: 1 });
  }

  if (miniBar) {
    gsap.set(miniBar, {
      opacity: 0,
      y: 6,
    });
  }

  const targets = player.querySelectorAll(
    ".yt-player-topbar, .yt-player-tab-buttons, .yt-player-art-wrap, .yt-player-meta-full, .yt-progress-area, .yt-controls-row, .yt-player-right-col"
  );

  const tl = gsap.timeline({
    onComplete: () => {
      document.body.classList.remove("player-is-morphing");
      player.classList.remove("is-player-morphing", "is-transitioning");
      player.classList.add("player-mini");

      gsap.set(player, { clearProps: "all" });
      if (miniBar) gsap.set(miniBar, { clearProps: "all" });
      if (fullBody) gsap.set(fullBody, { clearProps: "all" });
      if (targets.length) gsap.set(targets, { clearProps: "all" });

      if (backdrop) {
        backdrop.style.display = "none";
        gsap.set(backdrop, { clearProps: "all" });
      }

      player._playerAnimating = false;
      syncPlayerExpandedState();
      if (typeof complete === "function") complete();
    },
  });

  // 1. Elements inside full body fade out and glide down swiftly
  if (targets.length) {
    tl.to(
      targets,
      {
        opacity: 0,
        y: 18,
        duration: 0.16,
        ease: "power2.in",
      },
      0
    );
  }

  if (fullBody) {
    tl.to(
      fullBody,
      {
        opacity: 0,
        duration: 0.18,
        ease: "power2.in",
      },
      0.04
    );
  }

  // 2. Container smoothly shrinks back into mini pill dimensions and position
  tl.to(
    player,
    {
      top: targetTop,
      left: targetLeft,
      width: miniW,
      height: miniH,
      borderRadius: targetRadius,
      boxShadow: "0 16px 42px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.09)",
      duration: isMobile ? 0.38 : 0.42,
      ease: "power3.inOut",
    },
    0.04
  );

  // 3. Mini bar fades in as container reaches pill size
  if (miniBar) {
    tl.to(
      miniBar,
      {
        opacity: 1,
        y: 0,
        duration: 0.22,
        ease: "power2.out",
      },
      0.18
    );
  }

  // 4. Backdrop fades out
  if (backdrop) {
    tl.to(
      backdrop,
      {
        opacity: 0,
        duration: 0.32,
        ease: "power2.inOut",
      },
      0.04
    );
  }
}
// Admin paneldə əl ilə bildiriş göndərmə
const sendCustomBtn = document.getElementById("send-custom-notif-btn");
if (sendCustomBtn) {
  sendCustomBtn.addEventListener("click", async () => {
    const title = document.getElementById("custom-notif-title").value.trim();
    const message = document
      .getElementById("custom-notif-message")
      .value.trim();
    const password = document
      .getElementById("admin-password-custom")
      .value.trim();
    const statusDiv = document.getElementById("custom-notif-status");

    if (!title || !message) {
      statusDiv.textContent = "⚠️ Başlıq və mesaj boş ola bilməz!";
      statusDiv.style.display = "block";
      statusDiv.className = "admin-status is-visible is-error";
      setTimeout(() => {
        statusDiv.style.display = "none";
      }, 4000);
      return;
    }
    if (!password) {
      statusDiv.textContent = "🔐 Zəhmət olmasa admin şifrəsini daxil edin.";
      statusDiv.style.display = "block";
      statusDiv.className = "admin-status is-visible is-error";
      setTimeout(() => {
        statusDiv.style.display = "none";
      }, 4000);
      return;
    }

    statusDiv.textContent = "⏳ Bildiriş göndərilir...";
    statusDiv.style.display = "block";
    statusDiv.className = "admin-status is-visible is-info";

    try {
      const response = await fetch("/.netlify/functions/admin-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "send_custom_notification",
          password: password,
          payload: { title, message },
        }),
      });
      const data = await response.json();
      if (data.success) {
        statusDiv.textContent = "✅ Bildiriş uğurla göndərildi!";
        statusDiv.className = "admin-status is-visible is-success";
        document.getElementById("custom-notif-title").value = "";
        document.getElementById("custom-notif-message").value = "";
        document.getElementById("admin-password-custom").value = "";
      } else {
        statusDiv.textContent = "❌ Xəta: " + (data.error || "Bilinməyən xəta");
        statusDiv.className = "admin-status is-visible is-error";
      }
    } catch (err) {
      statusDiv.textContent = "❌ Şəbəkə xətası: " + err.message;
      statusDiv.className = "admin-status is-visible is-error";
    }
    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 5000);
  });
}

// ============================================================
// HAPTIC + SƏS EFFEKTLƏRİ — dunyamiz.me
// Bütün toxunuşlarda vibrasiya + Web Audio API ilə incə səs
// ============================================================
const HapticSound = (() => {
  // Ayrıca sfx konteksti — musiqi player audioContext ilə qarışmasın
  let sfxCtx = null;

  function getSfxCtx() {
    try {
      if (!sfxCtx || sfxCtx.state === "closed") {
        sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (sfxCtx.state === "suspended") sfxCtx.resume();
      return sfxCtx;
    } catch (_) {
      return null;
    }
  }

  // Vibrasiya — Vibration API (Android + bəzi iOS)
  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    if (PERF_REDUCED_MOTION) return;
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }

  // Əsas ton generatoru — tam prgrammatik, fayl yoxdur
  function playTone(
    freq,
    dur,
    type = "sine",
    vol = 0.12,
    attack = 0.008,
    release = null,
  ) {
    const ctx = getSfxCtx();
    if (!ctx) return;
    const releaseTime = release ?? dur * 0.75;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      // Soft attack → exponential decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch (_) {}
  }

  // ── Səs presetləri ──────────────────────────────────────

  const sounds = {
    // Adi düymə tıqqıltısı — yumşaq, qısa
    tap() {
      playTone(880, 0.07, "sine", 0.1, 0.004);
    },

    // Aşağı nav-bar keçidi — biraz daha ağır
    nav() {
      playTone(660, 0.09, "sine", 0.11, 0.005);
    },

    // Sevgi / ürək — iki not, C5 → G5
    heart() {
      playTone(523, 0.09, "sine", 0.1, 0.006);
      setTimeout(() => playTone(784, 0.22, "sine", 0.11, 0.008), 85);
    },

    // Uğur / təsdiq — C5 → E5 → G5 üçlüyü
    success() {
      playTone(523, 0.11, "sine", 0.11, 0.006);
      setTimeout(() => playTone(659, 0.11, "sine", 0.1, 0.005), 95);
      setTimeout(() => playTone(784, 0.2, "sine", 0.12, 0.007), 185);
    },

    // Xəta — enən iki not
    error() {
      playTone(392, 0.14, "sine", 0.11, 0.005);
      setTimeout(() => playTone(294, 0.22, "sine", 0.1, 0.005), 110);
    },

    // Aç / genişlət — yüngül iki not
    open() {
      playTone(698, 0.08, "sine", 0.09, 0.005);
      setTimeout(() => playTone(880, 0.14, "sine", 0.09, 0.005), 75);
    },

    // Bağla / azalt
    close() {
      playTone(880, 0.07, "sine", 0.09, 0.004);
      setTimeout(() => playTone(698, 0.12, "sine", 0.08, 0.004), 65);
    },
  };

  // ── Vibrasiya patternləri (ms) ───────────────────────────

  const vibes = {
    tap: [7],
    nav: [8],
    heart: [10, 30, 12],
    success: [8, 40, 12],
    error: [20, 25, 20],
    open: [6, 18, 6],
    close: [6],
  };

  // ── Düymə tipini avtomatik müəyyən et ──────────────────

  function detectType(el) {
    if (!el) return "tap";

    const id = el.id || "";
    const cls = (typeof el.className === "string" ? el.className : "") || "";

    // Musiqi player düymələrini atla — onların öz audio feedback-i var
    if (
      id === "playPauseBtn" ||
      id === "muteBtn" ||
      id === "yt-play-btn" ||
      id === "yt-play-btn-mini" ||
      id === "yt-prev-btn" ||
      id === "yt-next-btn" ||
      id === "yt-prev-btn-mini" ||
      id === "yt-next-btn-mini" ||
      cls.includes("yt-chip-btn--play")
    )
      return null;

    // Bağla / xaç düymələri
    if (
      cls.includes("close") ||
      cls.includes("xmark") ||
      id.includes("close") ||
      id.includes("minimize") ||
      el.getAttribute("aria-label")?.toLowerCase().includes("bağla")
    )
      return "close";

    // Aç / genişlət
    if (
      id.includes("open") ||
      id.includes("expand") ||
      el.closest?.("#lightbox") ||
      el.getAttribute("aria-label")?.toLowerCase().includes("aç")
    )
      return "open";

    // Ürək / sevgi — giriş düyməsi + zarflar
    if (
      id === "enter-btn" ||
      el.closest?.(".envelope") ||
      el.querySelector?.(".fa-heart") ||
      cls.includes("heart") ||
      id.includes("heart")
    )
      return "heart";

    // Nav-bar keçidi
    if (el.closest?.(".pill-nav") || cls.includes("pill-item")) return "nav";

    // Uğur / göndər / yüklə
    if (
      id === "verify-btn" ||
      id === "submit-note-btn" ||
      id === "upload-music-btn" ||
      id === "upload-photo-btn" ||
      id === "send-custom-notif-btn" ||
      id === "admin-save-btn" ||
      cls.includes("admin-btn--primary")
    )
      return "success";

    // Hər şey qalanı — adi tap
    return "tap";
  }

  // ── İstifadəçinin ilk toxunuşunu gözlə (autoplay policy) ─

  let _unlocked = false;

  function _unlock() {
    if (_unlocked) return;
    _unlocked = true;
    getSfxCtx();
  }

  // ── Ana listener ────────────────────────────────────────

  function init() {
    document.addEventListener("pointerdown", _unlock, {
      once: true,
      passive: true,
    });

    document.addEventListener(
      "pointerdown",
      (e) => {
        if (!_unlocked) return;

        const target = e.target;

        // Düymə, zarf, qalereyada kart və ya role="button" olan element
        const btn = target.closest(
          "button, .envelope, .gallery-item, .quote-card, " +
            ".pill-item, .yt-chip-btn, .welcome-primary-btn, " +
            '.welcome-secondary-btn, [role="button"]',
        );
        if (!btn) return;

        const type = detectType(btn);
        if (!type) return; // null → musiqi player, atla

        vibrate(vibes[type] || vibes.tap);
        sounds[type]?.();
      },
      { passive: true },
    );

    // Xəta mesajları gəldikdə error səsi çal
    // (error-msg elementi göründükdə)
    const errEl = document.getElementById("error-msg");
    if (errEl) {
      const obs = new MutationObserver(() => {
        if (
          !errEl.classList.contains("hidden") &&
          errEl.style.display !== "none"
        ) {
          vibrate(vibes.error);
          sounds.error();
        }
      });
      obs.observe(errEl, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }

    console.log("[HapticSound] ✅ Haptic + Səs effektləri aktiv");
  }

  // Public API — xarici koddan çağırmaq üçün
  return { init, vibrate, sounds, vibes };
})();

// DOM hazır olduqdan sonra işə sal
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => HapticSound.init());
} else {
  HapticSound.init();
}

// ========== ZAMAN KAPSÜLÜ (Zamanımız səhifəsi) ==========
const capsuleMonthNames = [
  "Yanvar","Fevral","Mart","Aprel","May","İyun",
  "İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"
];

function getCapsuleMonths() {
  const byMonth = {};

  function addItem(date, item) {
    if (!date || isNaN(date)) return;
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    if (!byMonth[key]) byMonth[key] = { year: date.getFullYear(), month: date.getMonth(), items: [] };
    byMonth[key].items.push(item);
  }

  (window.allImages || []).forEach(img => {
    addItem(parseImageDate(img), { type: 'photo', data: img });
  });

  (window.currentNotes || []).forEach(n => {
    const d = new Date(n.dateIso);
    if (!isNaN(d)) addItem(d, { type: 'note', data: n });
  });

  (window.currentFilms || []).forEach(f => {
    const d = new Date(f.watchDate || f.dateIso);
    if (!isNaN(d)) addItem(d, { type: 'film', data: f });
  });

  return Object.keys(byMonth).sort().reverse().map(k => byMonth[k]);
}

function renderTimePageCapsule() {
  const container = document.getElementById('time-capsule-months');
  if (!container) return;

  const months = getCapsuleMonths();
  if (!months.length) {
    container.innerHTML = '<p style="text-align:center;opacity:0.7">Hələ ki, məlumat yoxdur.</p>';
    return;
  }

  let html = '';
  months.forEach((m, idx) => {
    const photos = m.items.filter(i => i.type === 'photo').length;
    const notes = m.items.filter(i => i.type === 'note').length;
    const films = m.items.filter(i => i.type === 'film').length;
    html += `
      <div class="capsule-month-card" data-index="${idx}">
        <div class="capsule-month-icon"><i class="fas fa-clock"></i></div>
        <div class="capsule-month-name">${capsuleMonthNames[m.month]}</div>
        <div class="capsule-month-year">${m.year}</div>
        <div class="capsule-stats">
          ${photos ? `<span><i class="fas fa-image"></i> ${photos}</span>` : ''}
          ${notes ? `<span><i class="fas fa-sticky-note"></i> ${notes}</span>` : ''}
          ${films ? `<span><i class="fas fa-clapperboard"></i> ${films}</span>` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.capsule-month-card').forEach(card => {
    card.addEventListener('click', function() {
      const idx = parseInt(this.dataset.index);
      openCapsuleModal(months[idx]);
    });
  });
}

function openCapsuleModal(monthData) {
  const modal = document.getElementById('timecapsule-modal');
  if (!modal) return;

  document.getElementById('capsule-modal-title').textContent =
    `${capsuleMonthNames[monthData.month]} ${monthData.year}`;

  const sorted = [...monthData.items].sort((a, b) => {
    const da = a.data.git_date || a.data.dateIso || a.data.watchDate || 0;
    const db = b.data.git_date || b.data.dateIso || b.data.watchDate || 0;
    return new Date(da) - new Date(db);
  });

  const body = document.getElementById('capsule-modal-body');
  window._capsuleItems = sorted;
  let html = '';

  sorted.forEach((item, idx) => {
    if (item.type === 'photo') {
      const d = parseImageDate(item.data);
      html += `
        <div class="capsule-item capsule-photo-item" data-ci="${idx}" onclick="window.openLightbox(window.allImages.indexOf(window._capsuleItems[this.dataset.ci].data))">
          <img src="${item.data.download_url}" loading="lazy" alt="Şəkil" />
          <div class="capsule-item-info">
            <span class="capsule-item-date"><i class="far fa-clock"></i> ${d ? formatAzDate(d) : ''}</span>
            <span class="capsule-item-tag"><i class="fas fa-image"></i> Şəkil</span>
          </div>
        </div>
      `;
    } else if (item.type === 'note') {
      html += `
        <div class="capsule-item capsule-note-item" data-ci="${idx}" onclick="window.showNote(window.currentNotes.indexOf(window._capsuleItems[this.dataset.ci].data))">
          <div class="capsule-item-icon"><i class="fas fa-sticky-note"></i></div>
          <div class="capsule-item-info">
            <strong class="capsule-item-title">${item.data.title}</strong>
            <span class="capsule-item-date"><i class="far fa-clock"></i> ${item.data.dateStr}</span>
            <p class="capsule-item-desc">${(item.data.content || '').substring(0, 80)}${(item.data.content || '').length > 80 ? '...' : ''}</p>
          </div>
        </div>
      `;
    } else if (item.type === 'film') {
      html += `
        <div class="capsule-item capsule-film-item" data-ci="${idx}" onclick="window.showFilm(window._capsuleItems[this.dataset.ci].data)">
          <div class="capsule-item-icon"><i class="fas fa-clapperboard"></i></div>
          <div class="capsule-item-info">
            <strong class="capsule-item-title">${item.data.title}</strong>
            <span class="capsule-item-date"><i class="far fa-clock"></i> ${typeof formatFilmDate === 'function' ? formatFilmDate(item.data.watchDate || item.data.dateIso) : ''}</span>
            <span class="capsule-film-rating"><i class="fas fa-star"></i> ${item.data.rating || '-'}/10</span>
          </div>
        </div>
      `;
    }
  });

  body.innerHTML = html;
  modal.classList.remove('hidden');
  modal.style.display = "flex";
}

document.addEventListener('DOMContentLoaded', () => {
  const timePage = document.getElementById('page-time');
  if (timePage) {
    new MutationObserver(() => {
      if (timePage.classList.contains('active')) renderTimePageCapsule();
    }).observe(timePage, { attributes: true, attributeFilter: ['class'] });

    if (timePage.classList.contains('active')) renderTimePageCapsule();
  }

  let retries = 0;
  const iv = setInterval(() => {
    if (window.allImages && window.currentNotes && window.currentFilms) {
      clearInterval(iv);
      renderTimePageCapsule();
    }
    if (++retries > 40) clearInterval(iv);
  }, 500);
});


