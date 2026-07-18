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
    timecapsule: "Zaman Kapsulü",
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
  initIOSVolumeFix();

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
      await loadSiteSettings(true);
      document.getElementById("welcome-screen").style.opacity = "0";
      setTimeout(() => {
        document.getElementById("welcome-screen").style.display = "none";
        const mainContent = document.getElementById("main-content");
        mainContent.classList.remove("hidden");

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
            updateLegacyMediaSession();
          })
          .catch(() => console.log("Musiqi gözləmədə..."));
      }
    } else {
      throw new Error();
    }
  } catch (err) {
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

// ========== LETTERS ==========
const letters = {
  miss: {
    title: "Darıxanda...",
    text: "Bilirəm, məsafələr bəzən adamın ürəyini sıxır. Amma unutma ki, biz eyni səmaya baxırıq. Darıxmaq əslində sevgimizin nə qədər güclü olduğunu göstərir. İndi gözlərini yum, dərindən nəfəs al və əlini ürəyinin üzərinə qoy. Hiss etdin? Mən tam ordayam, səninləyəm. Səni çox sevirəm.",
  },
  sad: {
    title: "Kefin olmayanda...",
    text: "Bilirəm, bəzən hər şey üst-üstə gəlir, insan sadəcə susmaq və dünyadan qaçmaq istəyir. Əgər hazırda özünü elə hiss edirsənsə, bil ki, mən həmişə burdayam. Hətta bəzən bu kədərin səbəbi mən olsam belə, bil ki, bu heç vaxt istəyərək olmayıb. Səni incitdiyim anlar üçün məni bağışla... Mən bəlkə hər problemi həll edə bilmərəm, amma səninlə birlikdə hər şeyə qarşı dura bilərəm. İstədiyin an mənə söykənə bilərsən. Sənin hər halın mənim üçün dəyərlidir, təkcə güləndə yox. Sakitləş, dincəl və unutma: nə olursa olsun, mən həmişə sənin tərəfindəyəm.",
  },
  happy: {
    title: "Xoşbəxt olanda...",
    text: "Bax bunu eşitmək istəyirəm. Sənin xoşbəxtliyin mənim üçün hər şeydən önəmlidir. Bu gününün dadını çıxar, gül, əylən. Sən xoşbəxt olanda mən də dünyanın ən xoşbəxt adamı oluram. Həmişə belə parılda, günəşim!",
  },
  us: {
    title: "Bizim üçün...",
    text: "Nə yaxşı ki, həyat yollarımız kəsişdirib. Sən mənim təkcə sevgilim yox, həm də ən yaxşı dostumsan. Səninlə keçən hər saniyə mənim üçün hədiyyədir. Birlikdə hələ neçə gözəl günlərimiz olacaq. Yaxşı ki varsan, Cəmaləm.",
  },
};

window.openLetter = function (type) {
  const modal = document.getElementById("letter-modal");
  document.getElementById("letter-title").textContent = letters[type].title;
  document.getElementById("letter-text").textContent = letters[type].text;
  modal.style.display = "flex";
};

window.closeLetter = function () {
  const m = document.getElementById("letter-modal");
  if (m) m.style.display = "none";
};

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

      const centerY = height / 2;
      const activeBars = Math.min(PERF_MOBILE ? 12 : 22, bufferLength);
      const barWidth = Math.max(4, Math.floor(width / (activeBars * 1.9)));
      const gap = Math.max(2, Math.floor(barWidth * 0.55));
      const totalWidth = activeBars * barWidth + (activeBars - 1) * gap;
      let x = Math.max(0, (width - totalWidth) / 2);

      ctx.shadowBlur = PERF_MOBILE ? 0 : 12;
      ctx.shadowColor = currentWaveColor || "rgba(255,255,255,0.8)";

      for (let i = 0; i < activeBars; i++) {
        const mirroredIndex = Math.floor((i / activeBars) * bufferLength);
        const value = dataArray[mirroredIndex] / 255;
        const barHeight = Math.max(6, value * height * 0.82);
        const y = centerY - barHeight / 2;
        const radius = Math.min(barWidth / 2, 8);

        ctx.beginPath();
        if (typeof ctx.roundRect === "function")
          ctx.roundRect(x, y, barWidth, barHeight, radius);
        else ctx.rect(x, y, barWidth, barHeight);

        ctx.fillStyle = currentWaveColor || "rgba(255,255,255,0.9)";
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

let shouldResumeMainAudio = false;
let shouldResumeYTPlayer = false;

document.addEventListener("visibilitychange", async () => {
  const dom = typeof getMusicDom === "function" ? getMusicDom() : null;
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
    if (typeof updateLegacyMediaSession === "function")
      updateLegacyMediaSession();
  });

  audio.addEventListener("timeupdate", () => {
    if (seekBar) seekBar.value = Math.floor(audio.currentTime || 0);
    if (currentTimeEl)
      currentTimeEl.textContent = formatTime(audio.currentTime || 0);
    if (seekBar && audio.duration) {
      const progress = (audio.currentTime / audio.duration) * 100;
      seekBar.style.setProperty("--progress", progress + "%");
    }
    if (typeof updateLegacyMediaSession === "function")
      updateLegacyMediaSession();
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
    if (typeof updateLegacyMediaSession === "function")
      updateLegacyMediaSession();
  });

  audio.addEventListener("pause", () => {
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    document.getElementById("track-art")?.classList.remove("playing");
    if (typeof updateLegacyMediaSession === "function")
      updateLegacyMediaSession();
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

// ========== WEATHER API ==========
async function updateWeatherTheme() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=40.3777&longitude=49.892&current_weather=true",
    );
    const data = await res.json();
    const code = data.current_weather.weathercode;
    const temp = Math.round(data.current_weather.temperature);
    const statusText = document.getElementById("weather-status");
    const weatherWrap = document.getElementById("weather-container");
    if (!statusText || !weatherWrap) return;

    let message = "";
    let accent = "#ff4d6d";
    let glow = "rgba(255, 77, 109, 0.35)";
    let icon = "☁️";

    if ([0, 1].includes(code)) {
      icon = '<i class="fas fa-sun"></i>';
      accent = "#ffb347";
      glow = "rgba(255, 179, 71, 0.35)";
      message = `Bakıda hava tərtəmizdir (${temp}°C) — sənin kimi parlaq.`;
    } else if ([2, 3].includes(code)) {
      icon = '<i class="fas fa-cloud-sun"></i>';
      accent = "#8ec5ff";
      glow = "rgba(142, 197, 255, 0.35)";
      message = `Bakı bu gün sakit və bir az buludludur (${temp}°C).`;
    } else if ([45, 48].includes(code)) {
      icon = '<i class="fas fa-smog"></i>';
      accent = "#b0bec5";
      glow = "rgba(176, 190, 197, 0.28)";
      message = `Hər tərəf dumanlıdır (${temp}°C), amma sevgi tərəfi aydındır.`;
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      icon = '<i class="fas fa-cloud-rain"></i>';
      accent = "#6ea8fe";
      glow = "rgba(110, 168, 254, 0.30)";
      message = `Bakıda yağış yağır (${temp}°C). Özünü isti saxla.`;
    } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
      icon = '<i class="fas fa-snowflake"></i>';
      accent = "#d8f3ff";
      glow = "rgba(216, 243, 255, 0.28)";
      message = `Hava qarlıdır (${temp}°C). Bu səhnə də çox zərif görünür.`;
    } else if ([95, 96, 99].includes(code)) {
      icon = '<i class="fas fa-bolt"></i>';
      accent = "#c084fc";
      glow = "rgba(192, 132, 252, 0.30)";
      message = `Bakıda ildırım var (${temp}°C), amma burada aura yenə romantikdir.`;
    } else {
      icon = '<i class="fas fa-star"></i>';
      message = `Bakıda hava dəyişkəndir (${temp}°C), amma burada hiss sabitdir.`;
    }

    weatherWrap.style.borderColor = glow;
    weatherWrap.style.boxShadow = `0 10px 30px ${glow}`;
    weatherWrap.style.background = "rgba(255,255,255,0.08)";
    weatherWrap.style.backdropFilter = "blur(14px)";
    weatherWrap.style.borderRadius = "18px";
    weatherWrap.style.maxWidth = "520px";
    weatherWrap.style.margin = "12px auto 0";
    weatherWrap.style.border = "1px solid rgba(255,255,255,0.12)";
    document.documentElement.style.setProperty("--weather-accent", accent);
    statusText.innerHTML = `<span style="font-size:18px;margin-right:8px;">${icon}</span>${message}`;
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) {
      initWeatherParticles("rain");
    } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
      initWeatherParticles("snow");
    } else {
      initWeatherParticles("none");
    }
  } catch (err) {
    console.error("Hava məlumatı alınmadı.");
  }
}
// Hava Partiklları
let weatherAnimId;
function initWeatherParticles(type) {
  const canvas = document.getElementById("weather-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  cancelAnimationFrame(weatherAnimId);

  if (type === "none") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let particles = [];
  const maxParticles = type === "rain" ? 100 : 50;

  for (let i = 0; i < maxParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: type === "rain" ? Math.random() * 20 + 10 : Math.random() * 3 + 2,
      speed:
        type === "rain" ? Math.random() * 10 + 10 : Math.random() * 1 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      wind: type === "rain" ? Math.random() * 2 - 1 : Math.random() * 3 - 1.5,
    });
  }

  function draww() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1.5;

    particles.forEach((p) => {
      if (type === "rain") {
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
    weatherAnimId = requestAnimationFrame(draww);
  }
  draww();
}
window.addEventListener("resize", () => {
  const canvas = document.getElementById("weather-canvas");
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});
// ========== SCRATCH CARD ==========
function initScratchCard() {
  const sCanvas = document.getElementById("scratch-canvas");
  if (!sCanvas) return;

  const sCtx = sCanvas.getContext("2d", { willReadFrequently: true });
  sCtx.fillStyle = "#444444";
  sCtx.beginPath();
  sCtx.rect(0, 0, sCanvas.width, sCanvas.height);
  sCtx.fill();

  function scratch(e) {
    const rect = sCanvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    sCtx.globalCompositeOperation = "destination-out";
    sCtx.beginPath();
    sCtx.arc(x, y, 25, 0, Math.PI * 2);
    sCtx.fill();
  }

  sCanvas.addEventListener("mousedown", () => {
    sCanvas.addEventListener("mousemove", scratch);
  });
  window.addEventListener("mouseup", () => {
    sCanvas.removeEventListener("mousemove", scratch);
  });
  sCanvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      scratch(e);
    },
    { passive: false },
  );
}

window.addEventListener("DOMContentLoaded", initScratchCard);
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
        const modal = document.getElementById("letter-modal");
        // Sizin letters obyektinizdən məlumatları çəkir
        document.getElementById("letter-title").textContent =
          letters[type].title;
        document.getElementById("letter-text").textContent = letters[type].text;
        modal.style.display = "flex";
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
// Notlar funksiyası
window.showNote = function (i) {
  try {
    if (!window.currentNotes || !window.currentNotes[i]) return;
    const n = window.currentNotes[i];

    document.getElementById("view-note-title").textContent = n.title;
    document.getElementById("view-note-author").textContent =
      n.author + " tərəfindən";
    document.getElementById("view-note-text").textContent = n.content;

    // Saat ikonunu qorumaq üçün innerText əvəzinə innerHTML istifadə edirik:
    document.getElementById("view-note-date").innerHTML =
      `<i class="far fa-clock"></i> ${n.dateStr}`;

    const noteModal = document.getElementById("view-note-modal");
    if (noteModal) {
      noteModal.classList.remove("hidden");
      noteModal.style.display = "flex";
    }
  } catch (err) {
    console.error("Not açılarkən xəta baş verdi:", err);
    alert("Notu açmaq mümkün olmadı.");
  }
};

async function loadNotes() {
  const container = document.getElementById("notes-container");
  if (!container) return;

  try {
    const url = `https://api.github.com/repos/${config.githubUsername}/${config.repoName}/contents/notlar`;
    const res = await fetch("/.netlify/functions/github-content?path=notlar");
    if (!res.ok) {
      container.innerHTML = "<p style='opacity:0.6;'>Hələ ki, not yoxdur.</p>";
      return;
    }

    const files = await res.json();
    let notesData = [];
    const jsonFiles = files.filter((x) => x.name.endsWith(".json"));

    for (let f of jsonFiles) {
      const dataRes = await fetch(f.download_url);
      notesData.push(await dataRes.json());
    }

    notesData.sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso));
    window.currentNotes = notesData;

    // "onclick" atributunu çıxarır və məlumatı "data-index" kimi saxlayırıq
    container.innerHTML = notesData
      .map(
        (n, i) => `
            <div class="note-card" data-index="${i}">
                <span class="note-card-author">${n.author}</span>
                <h3 class="note-card-title">${n.title}</h3>
                <span class="note-card-date">${n.dateStr}</span>
            </div>
        `,
      )
      .join("");

    // Bütün kartlara klik (click) funksiyasını təhlükəsiz yolla bağlayırıq
    document.querySelectorAll(".note-card").forEach((card) => {
      card.addEventListener("click", function () {
        const index = this.getAttribute("data-index");
        window.showNote(parseInt(index));
      });
    });
  } catch (e) {
    console.error("Xəta:", e);
    container.innerHTML =
      "<p style='opacity:0.6; color:#ff4d6d;'>Notlar yüklənərkən xəta baş verdi.</p>";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadNotes();

  // Modal idarəetmələri
  const addModal = document.getElementById("add-note-modal");
  const viewModal = document.getElementById("view-note-modal");

  document.getElementById("open-add-note-btn").onclick = () => {
    addModal.classList.remove("hidden");
    addModal.style.display = "flex";
  };
  document.getElementById("close-add-note-btn").onclick = () => {
    addModal.classList.add("hidden");
    addModal.style.display = "none";
  };
  document.getElementById("close-view-note-btn").onclick = () => {
    viewModal.classList.add("hidden");
    viewModal.style.display = "none";
  };

  // Not əlavə etmə məntiqi
  document.getElementById("submit-note-btn").onclick = async () => {
    const author = document.getElementById("note-author").value;
    let title = document.getElementById("note-title").value.trim();
    const content = document.getElementById("note-content").value.trim();
    const pass = getAdminPassword("upload_note") || prompt("Admin şifrəsi:");

    if (!content || !pass) return alert("Məzmun və şifrə mütləqdir!");

    const now = new Date();
    const dateStr = now.toLocaleString("az-AZ").replace(",", "");
    if (!title) title = dateStr;

    const noteObj = {
      author,
      title,
      content,
      dateStr,
      dateIso: now.toISOString(),
    };
    // UTF-8 dəstəyi ilə Base64-ə çevirmə
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(noteObj))));

    const btn = document.getElementById("submit-note-btn");
    btn.textContent = "Yüklənir...";
    btn.disabled = true;

    try {
      const res = await fetch("/.netlify/functions/admin-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "upload_note",
          password: pass,
          payload: { path: `notlar/not_${Date.now()}.json`, content: b64 },
        }),
      });

      if (res.ok) {
        alert("Not uğurla əlavə edildi! 🤍");
        location.reload();
      } else {
        alert("Xəta: Şifrə yanlış ola bilər.");
        btn.textContent = "Təsdiqlə";
        btn.disabled = false;
      }
    } catch (e) {
      alert("Sistem xətası baş verdi.");
      btn.textContent = "Təsdiqlə";
      btn.disabled = false;
    }
  };
});
// ========== FILMS ==========
window.currentFilms = [];
let filmSortMode = "date";

// Toast helper - alert() əvəzinə mobil uyğun bildiriş
function showFilmToast(message, type = "success") {
  let toast = document.getElementById("film-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "film-toast";
    toast.style.cssText = [
      "position:fixed", "bottom:90px", "left:50%", "transform:translateX(-50%)",
      "background:" + (type === "error" ? "#c0392b" : "#27ae60"),
      "color:#fff", "padding:12px 22px", "border-radius:12px",
      "font-size:15px", "font-weight:600", "z-index:99999",
      "box-shadow:0 4px 20px rgba(0,0,0,0.35)", "opacity:0",
      "transition:opacity .3s ease", "pointer-events:none",
      "max-width:90vw", "text-align:center"
    ].join(";");
    document.body.appendChild(toast);
  }
  toast.style.background = type === "error" ? "#c0392b" : "#27ae60";
  toast.textContent = message;
  toast.style.opacity = "1";
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => { toast.style.opacity = "0"; }, 3000);
}

function buildStarsHtml(rating, size = "small") {
  const full = Math.floor(rating / 2);
  const half = rating % 2 >= 1 ? 1 : 0;
  const empty = 5 - full - half;
  let html = `<span class="film-stars">`;
  for (let i = 0; i < full; i++)
    html += `<span class="star-filled">&#9733;</span>`;
  if (half) html += `<span class="star-half">&#9733;</span>`;
  for (let i = 0; i < empty; i++)
    html += `<span class="star-empty">&#9733;</span>`;
  html += `</span>`;
  return html;
}

function formatFilmDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const months = [
    "Yan",
    "Fev",
    "Mar",
    "Apr",
    "May",
    "İyn",
    "İyl",
    "Avq",
    "Sen",
    "Okt",
    "Noy",
    "Dek",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function updateFilmStats(films) {
  const totalEl = document.getElementById("film-total-count");
  const avgEl = document.getElementById("film-avg-rating");
  const topEl = document.getElementById("film-top-title");

  if (!totalEl) return;
  const rated = films.filter((f) => f.rating > 0);

  totalEl.textContent = films.length;

  if (rated.length) {
    const avg = rated.reduce((s, f) => s + Number(f.rating), 0) / rated.length;
    avgEl.textContent = avg.toFixed(1) + "/10";
    const top = rated.reduce(
      (best, f) => (Number(f.rating) > Number(best.rating) ? f : best),
      rated[0],
    );
    topEl.textContent = top.title;
  } else {
    avgEl.textContent = "-";
    topEl.textContent = "-";
  }
}

function renderFilms(films) {
  const container = document.getElementById("films-container");
  if (!container) return;

  const sorted = [...films].sort((a, b) => {
    if (filmSortMode === "rating") return Number(b.rating) - Number(a.rating);
    return (
      new Date(b.watchDate || b.dateIso || 0) -
      new Date(a.watchDate || a.dateIso || 0)
    );
  });

  if (!sorted.length) {
    container.innerHTML = `
            <div class="films-empty" style="grid-column:1/-1;">
                <i class="fas fa-clapperboard"></i>
                <p>Hələ ki, izlənilmiş film yoxdur.</p>
            </div>`;
    return;
  }

  container.innerHTML = sorted
    .map((f, i) => {
      const rating = Number(f.rating) || 0;
      const stars = buildStarsHtml(rating);
      const dateStr = formatFilmDate(f.watchDate || f.dateIso);
      const genresArray = f.genre ? f.genre.split(',').map(g => g.trim()).filter(Boolean) : [];
      const genre = genresArray.length > 0
        ? `<div class="film-card-genres">${genresArray.map(g => `<span class="film-card-badge"><i class="fas fa-tag"></i>${g}</span>`).join('')}</div>`
        : `<div class="film-card-genres"></div>`;
      const director = f.director
        ? `<p class="film-card-director"><i class="fas fa-video" style="font-size:.68rem;opacity:.5;margin-right:4px;"></i>${f.director}</p>`
        : "";
      const review = f.review
        ? `<p class="film-card-review">${f.review}</p>`
        : "";
      const addedBy = f.addedBy
        ? `<span class="film-card-addedby">${f.addedBy === "Birlikdə" ? "Birlikdə izlənib" : f.addedBy + " izlədi"}</span>`
        : "";

      return `
            <div class="film-card" data-film-index="${i}" style="animation-delay:${i * 0.06}s">
                <div class="film-card-top">
                    ${genre}
                    <div class="film-card-rating">
                        ${stars}
                        ${rating ? `<span class="film-card-score">${rating}<span>/10</span></span>` : ""}
                    </div>
                </div>
                <h3 class="film-card-title">${f.title}</h3>
                ${director}
                ${review}
                <div class="film-card-footer">
                    <span class="film-card-date"><i class="far fa-calendar"></i>${dateStr}</span>
                    ${addedBy}
                </div>
            </div>`;
    })
    .join("");

  // Click to view
  container.querySelectorAll(".film-card").forEach((card) => {
    card.addEventListener("click", function () {
      const idx = parseInt(this.getAttribute("data-film-index"));
      window.showFilm(sorted[idx]);
    });
  });
}

window.showFilm = function (f) {
  const modal = document.getElementById("view-film-modal");
  if (!modal) return;

  const rating = Number(f.rating) || 0;
  document.getElementById("view-film-title").textContent = f.title || "";
  document.getElementById("view-film-genre").textContent = f.genre || "Film";
  document.getElementById("view-film-director").textContent = f.director
    ? `Rejissor: ${f.director}`
    : "";
  document.getElementById("view-film-addedby").textContent = f.addedBy
    ? (f.addedBy === "Birlikdə" ? "Birlikdə izlənib" : `${f.addedBy} izlədi`)
    : "";
  document.getElementById("view-film-review").textContent = f.review || "";
  document.getElementById("view-film-date").innerHTML =
    `<i class="far fa-clock"></i> ${formatFilmDate(f.watchDate || f.dateIso)}`;
  document.getElementById("view-film-score").innerHTML = rating
    ? `<i class="fas fa-star" style="color: #ffd700;"></i> ${rating}/10`
    : "";
  document.getElementById("view-film-rating-stars").innerHTML = buildStarsHtml(
    rating,
    "big",
  );

  modal.classList.remove("hidden");
  modal.style.display = "flex";
};

async function loadFilms() {
  const container = document.getElementById("films-container");
  if (!container) return;

  try {
    const res = await fetch("/.netlify/functions/github-content?path=filmler");
    if (!res.ok) {
      container.innerHTML = `<div class="films-empty" style="grid-column:1/-1;"><i class="fas fa-clapperboard"></i><p>Hələ ki, film yoxdur.</p></div>`;
      return;
    }
    const files = await res.json();
    const jsonFiles = files.filter((x) => x.name.endsWith(".json"));

    let filmsData = [];
    for (const f of jsonFiles) {
      try {
        const dataRes = await fetch(f.download_url);
        filmsData.push(await dataRes.json());
      } catch (e) {}
    }

    filmsData.sort(
      (a, b) =>
        new Date(b.watchDate || b.dateIso || 0) -
        new Date(a.watchDate || a.dateIso || 0),
    );
    window.currentFilms = filmsData;

    updateFilmStats(filmsData);
    renderFilms(filmsData);
  } catch (e) {
    console.error("Film yüklənmə xətası:", e);
    container.innerHTML = `<div class="films-empty" style="grid-column:1/-1;"><i class="fas fa-clapperboard"></i><p>Filmlər yüklənərkən xəta baş verdi.</p></div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadFilms();

  let selectedGenres = [];
  function renderSelectedGenres() {
    const container = document.getElementById("selected-genres-container");
    if(!container) return;
    container.innerHTML = selectedGenres.map(g => `<span class="film-card-badge" style="cursor:pointer;" onclick="removeGenre('${g.replace(/'/g, "\\'")}')">${g} &times;</span>`).join("");
  }
  window.removeGenre = function(g) {
    selectedGenres = selectedGenres.filter(x => x !== g);
    renderSelectedGenres();
  }
  document.getElementById("add-genre-btn")?.addEventListener("click", () => {
    const input = document.getElementById("film-genre-input");
    const val = input.value.trim();
    if(val && !selectedGenres.includes(val)) {
      selectedGenres.push(val);
      input.value = "";
      renderSelectedGenres();
    }
  });

  // Sort buttons
  document.querySelectorAll(".film-sort-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".film-sort-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      filmSortMode = this.getAttribute("data-sort");
      renderFilms(window.currentFilms);
    });
  });

  // Add film modal
  const addModal = document.getElementById("add-film-modal");
  const viewModal = document.getElementById("view-film-modal");

  document
    .getElementById("admin-open-film-modal-secondary")
    ?.addEventListener("click", () => {
      // Default today's date
      const dateInput = document.getElementById("film-date-input");
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
      }
      addModal.classList.remove("hidden");
      addModal.style.display = "flex";
    });

  document
    .getElementById("open-add-film-btn")
    ?.addEventListener("click", () => {
      // Default today's date
      const dateInput = document.getElementById("film-date-input");
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
      }
      addModal.classList.remove("hidden");
      addModal.style.display = "flex";
    });

  document
    .getElementById("close-add-film-btn")
    ?.addEventListener("click", () => {
      addModal.classList.add("hidden");
      addModal.style.display = "none";
    });

  document
    .getElementById("close-view-film-btn")
    ?.addEventListener("click", () => {
      viewModal.classList.add("hidden");
      viewModal.style.display = "none";
    });

  // Star selector in add modal
  const starSelector = document.getElementById("film-star-selector");
  const ratingInput = document.getElementById("film-rating-input");
  if (starSelector && ratingInput) {
    starSelector.querySelectorAll("span").forEach((star) => {
      star.addEventListener("click", function () {
        const val = parseInt(this.getAttribute("data-star"));
        ratingInput.value = val;
        starSelector.querySelectorAll("span").forEach((s) => {
          s.classList.toggle(
            "active",
            parseInt(s.getAttribute("data-star")) <= val,
          );
        });
      });
    });

    ratingInput.addEventListener("input", () => {
      const val = Math.round(parseFloat(ratingInput.value) || 0);
      starSelector.querySelectorAll("span").forEach((s) => {
        s.classList.toggle(
          "active",
          parseInt(s.getAttribute("data-star")) <= val,
        );
      });
    });
  }

  // Submit film
  document
    .getElementById("submit-film-btn")
    ?.addEventListener("click", async () => {
      const title = document.getElementById("film-title-input").value.trim();
      const director = document
        .getElementById("film-director-input")
        .value.trim();
      const genreInputVal = document.getElementById("film-genre-input").value.trim();
      let finalGenres = [...selectedGenres];
      if (genreInputVal && !finalGenres.includes(genreInputVal)) {
        finalGenres.push(genreInputVal);
      }
      const genre = finalGenres.join(", ");
      const watchDate = document.getElementById("film-date-input").value;
      const rating =
        parseFloat(document.getElementById("film-rating-input").value) || 0;
      const addedBy = document.getElementById("film-added-by").value;
      const review = document.getElementById("film-review-input").value.trim();

      // Read password from the dedicated modal field (works on mobile too)
      const modalPassEl = document.getElementById("film-admin-password");
      const pass = (modalPassEl && modalPassEl.value.trim())
        || getAdminPassword("upload_note");

      if (!title) { alert("Film adı mütləqdir!"); return; }
      if (!pass) { alert("Admin şifrəsini daxil edin!"); if (modalPassEl) modalPassEl.focus(); return; }

      const filmObj = {
        title,
        director,
        genre,
        watchDate,
        rating,
        addedBy,
        review,
        dateIso: new Date().toISOString(),
      };
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(filmObj))));

      const btn = document.getElementById("submit-film-btn");
      const origText = btn.innerHTML;
      btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Yüklənir...";
      btn.disabled = true;

      try {
        const res = await fetch("/.netlify/functions/admin-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "upload_film",
            password: pass,
            payload: { path: `filmler/film_${Date.now()}.json`, content: b64 },
          }),
        });

        if (res.ok) {
          // Clear form
          [
            "film-title-input",
            "film-director-input",
            "film-genre-input",
            "film-rating-input",
            "film-review-input",
            "film-admin-password",
          ].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = "";
          });
          document
            .querySelectorAll("#film-star-selector span")
            .forEach((s) => s.classList.remove("active"));
          selectedGenres = [];
          if (typeof renderSelectedGenres === "function") {
            renderSelectedGenres();
          }
          addModal.style.display = "none";
          addModal.classList.add("hidden");
          // Restore button before any async work
          btn.innerHTML = "Təsdiqlə və Göndər <i class='fas fa-clapperboard'></i>";
          btn.disabled = false;
          // Show toast instead of alert (alert blocks on mobile PWA)
          showFilmToast("🎬 Film uğurla əlavə edildi!");
          // Reload films list
          try { await loadFilms(); } catch (_) {}
        } else {
          alert("Xəta: Şifrə yanlış ola bilər.");
          btn.innerHTML = origText;
          btn.disabled = false;
        }
      } catch (e) {
        console.error("Film submit xətası:", e);
        alert("Sistem xətası baş verdi. İnternet bağlantınızı yoxlayın.");
        btn.innerHTML = origText;
        btn.disabled = false;
      }
    });
});
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

  // Tam URL-dirsə saxla, amma github-raw linkinin içindəki fayl yolunu təmizlə.
  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const url = new URL(cleaned);
      const fileParam = url.searchParams.get("file");
      if (
        url.pathname.includes("/.netlify/functions/github-raw") &&
        fileParam
      ) {
        return `${GITHUB_RAW_BASE}${encodeURIComponent(fileParam.replace(/^\/+/, ""))}`;
      }
    } catch (_) {}
    return cleaned;
  }

  let normalized = cleaned.replace(/^\/+/, "");

  // Əvvəlki bug: ".netlify/functions/github-raw?file=musiqiler/xxx" yenidən github-raw içinə salınırdı.
  // Burada iç file parametrini çıxarıb backend-in icazə verdiyi təmiz path-ə çeviririk.
  if (normalized.includes(".netlify/functions/github-raw")) {
    try {
      const fakeUrl = new URL(normalized, window.location.origin);
      const fileParam = fakeUrl.searchParams.get("file");
      if (fileParam) normalized = fileParam.replace(/^\/+/, "");
    } catch (_) {}
  }

  if (!normalized.includes("/")) {
    normalized = `musiqiler/${normalized}`;
  }

  return `${GITHUB_RAW_BASE}${encodeURIComponent(normalized)}`;
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
        words,
      });
    });
  });

  parsed.sort((a, b) => a.time - b.time);
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

  activePlayer.classList.remove("player-hiding", "player-appearing");
  activePlayer.style.opacity = "";
  activePlayer.style.transform = "";
  activePlayer.style.transition = "";

  document.body.classList.add("player-visible");

  activePlayer.hidden = false;
  activePlayer.style.display = "block";
  window.clearTimeout(activePlayer.__appearTimer);
  activePlayer.__appearTimer = window.setTimeout(() => {
    activePlayer.classList.remove("player-appearing");
    activePlayer.style.opacity = "1"; // zəmanətli görünürlük
    activePlayer.style.transform = "translate3d(-50%, 0, 0)";
  }, 700);

  void activePlayer.offsetHeight;
  activePlayer.classList.add("player-appearing");

  syncPlayerExpandedState();
}
function hideActivePlayerWithAnimation(options = {}) {
  const { resetTrack = true } = options;
  const { activePlayer, audio, lyricsPanel } = getMusicDom();
  if (!activePlayer) return;

  activePlayer.classList.remove("expanded", "lyrics-open", "is-transitioning");
  activePlayer.classList.add("player-mini", "player-hiding");
  activePlayer.classList.remove("player-appearing");

  if (lyricsPanel) {
    lyricsPanel.classList.add("lyrics-hidden");
    lyricsPanel.setAttribute("aria-hidden", "true");
  }
  setPlayerTab("lyrics");

  if (audio) {
    audio.pause();
    if (resetTrack) {
      try {
        audio.currentTime = 0;
      } catch (_) {}
    }
  }

  updateLyricsToggleState();
  updateMusicPlayButtonState();
  updateMediaSessionPlaybackState();

  // Dərhal body siniflərini çıxar
  document.body.classList.remove("player-visible", "player-expanded");
  syncPlayerExpandedState();

  window.clearTimeout(activePlayer.__hideTimer);
  activePlayer.__hideTimer = window.setTimeout(() => {
    activePlayer.style.display = "none";
    activePlayer.hidden = true;
    activePlayer.classList.remove("player-hiding");
    activePlayer.style.opacity = "";
    activePlayer.style.transform = "";
    activePlayer.style.transition = "";
    syncPlayerExpandedState();
  }, 250);
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
    tabLyricsBtn,
    tabUpNextBtn,
    lyricsTabPanel,
    upNextTabPanel,
  } = dom;

  const resolvedTab = tabName === "upnext" ? "upnext" : "lyrics";
  window.currentPlayerTab = resolvedTab;

  if (lyricsTabPanel) {
    lyricsTabPanel.hidden = resolvedTab !== "lyrics";
  }

  if (upNextTabPanel) {
    upNextTabPanel.hidden = resolvedTab !== "upnext";
  }

  if (tabLyricsBtn) {
    const isActive = resolvedTab === "lyrics";
    tabLyricsBtn.classList.toggle("is-active", isActive);
    tabLyricsBtn.setAttribute("aria-selected", String(isActive));
  }

  if (tabUpNextBtn) {
    const isActive = resolvedTab === "upnext";
    tabUpNextBtn.classList.toggle("is-active", isActive);
    tabUpNextBtn.setAttribute("aria-selected", String(isActive));
  }

  if (lyricsPanel) {
    const lyricsHidden = resolvedTab !== "lyrics";
    lyricsPanel.classList.toggle("lyrics-hidden", lyricsHidden);
    lyricsPanel.setAttribute("aria-hidden", String(lyricsHidden));
  }

  if (activePlayer) {
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
          const res = await fetch(file.download_url, { cache: "force-cache" });
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
                <img class="yt-up-next-thumb" src="${thumbSrc}" alt="${escapeHtmlMusic(track?.title || "Mahnı")}">
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
                <img class="yt-track-thumb" src="${thumbSrc}" alt="${escapeHtmlMusic(track.title)}">
                <div class="yt-track-text">
                    <div class="yt-track-title">${escapeHtmlMusic(track.title)}</div>
                    <div class="yt-track-artist">${escapeHtmlMusic(track.artist)}</div>
                </div>
                <div class="yt-track-meta">
                    <i class="fas ${isActive ? "fa-volume-high" : "fa-play"}"></i>
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
}
function renderPlainLyrics(text = "") {
  const { lyricsContainer } = getMusicDom();
  if (!lyricsContainer) return;

  if (!text.trim()) {
    lyricsContainer.innerHTML = `<div class="yt-lyrics-empty">Sözlər əlavə edilməyib.</div>`;
    return;
  }

  const html = text
    .split(/\r?\n/)
    .map(
      (line) =>
        `<div class="yt-lyrics-line passed">${escapeHtmlMusic(line) || "&nbsp;"}</div>`,
    )
    .join("");

  lyricsContainer.innerHTML =
    html || `<div class="yt-lyrics-empty">Sözlər əlavə edilməyib.</div>`;
}

function renderSyncedLyrics(parsedLyrics = []) {
  const { lyricsContainer } = getMusicDom();
  if (!lyricsContainer) return;

  if (!parsedLyrics.length) {
    lyricsContainer.innerHTML = `<div class="yt-lyrics-empty">Synced lyrics tapılmadı.</div>`;
    return;
  }

  lyricsContainer.innerHTML = parsedLyrics
    .map((line, index) => {
      if (line.words && line.words.length) {
        const wordsHtml = line.words
          .map(
            (word, wordIndex) => `
                <span 
                    class="yt-lyrics-word" 
                    data-lyrics-index="${index}" 
                    data-word-index="${wordIndex}" 
                    data-word-time="${word.time}"
                >${escapeHtmlMusic(word.text)}</span>
            `,
          )
          .join("");

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
    })
    .join("");
}
function renderCurrentTrackLyrics(track) {
  const lyrics = track?.lyrics || {};
  const type = lyrics.type || "none";
  const text = lyrics.text || "";

  window.currentMusicLyricsType = type;
  window.currentLyricsActiveIndex = -1;
  window.currentLyricsActiveWordIndex = -1;
  window.currentMusicLyricsParsed = [];

  if (type === "plain") {
    renderPlainLyrics(text);
  } else if (type === "synced") {
    const parsed = parseSyncedLyrics(text);
    window.currentMusicLyricsParsed = parsed;
    renderSyncedLyrics(parsed);
  } else {
    renderPlainLyrics("");
  }
}

function updateSyncedLyricsByTime(currentTime) {
  if (window.currentMusicLyricsType !== "synced") return;
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

  const activeLine =
    activeIndex >= 0 ? window.currentMusicLyricsParsed[activeIndex] : null;
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
      const glowColor = currentWaveColor
        .replace("rgb", "rgba")
        .replace(")", ", 0.15)");
      const intenseGlow = currentWaveColor
        .replace("rgb", "rgba")
        .replace(")", ", 0.3)");
      lyricsPanel.style.background = `radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, ${intenseGlow} 0%, rgba(255,255,255,0.04) 70%)`;
      lyricsPanel.style.boxShadow = `inset 0 0 50px ${glowColor}, 0 10px 30px rgba(0,0,0,0.3)`;
      setTimeout(() => {
        lyricsPanel.style.boxShadow = `inset 0 0 20px rgba(255,255,255,0.02), 0 10px 30px rgba(0,0,0,0.3)`;
      }, 400);
    }
  }

  window.currentLyricsActiveIndex = activeIndex;
  window.currentLyricsActiveWordIndex = activeWordIndex;

  const lines = lyricsContainer.querySelectorAll(".yt-lyrics-line");
  lines.forEach((lineEl, index) => {
    lineEl.classList.toggle("active", index === activeIndex);
    lineEl.classList.toggle("passed", index < activeIndex);

    const wordEls = lineEl.querySelectorAll(".yt-lyrics-word");
    wordEls.forEach((wordEl, wordIndex) => {
      const isPassed = index < activeIndex || (index === activeIndex && wordIndex < activeWordIndex);
      const isActive = index === activeIndex && wordIndex === activeWordIndex;
      
      wordEl.classList.toggle("passed", isPassed);
      wordEl.classList.toggle("active", isActive);
      
      if (isActive && activeLine && activeLine.words) {
        let duration = 0.5;
        const lineWords = activeLine.words;
        if (wordIndex + 1 < lineWords.length) {
           duration = lineWords[wordIndex + 1].time - lineWords[wordIndex].time;
        } else if (activeIndex + 1 < window.currentMusicLyricsParsed.length) {
           duration = window.currentMusicLyricsParsed[activeIndex + 1].time - lineWords[wordIndex].time;
        }
        duration = Math.max(0.1, Math.min(3, duration));
        wordEl.style.setProperty('--word-duration', `${duration}s`);
      } else {
        wordEl.style.removeProperty('--word-duration');
      }
    });
  });

  const activeEl = lyricsContainer.querySelector(
    `.yt-lyrics-line[data-lyrics-index="${activeIndex}"]`,
  );
  if (activeEl) {
    const containerRect = lyricsContainer.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    const delta =
      itemRect.top -
      containerRect.top -
      containerRect.height / 2 +
      itemRect.height / 2;
    lyricsContainer.scrollTo({
      top: lyricsContainer.scrollTop + delta,
      behavior: "smooth",
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

    const img = new Image();
    img.crossOrigin = "anonymous";
    const absoluteImgSrc = /^https?:\/\//i.test(imgSrc)
      ? imgSrc
      : new URL(imgSrc, window.location.origin).href;
    const proxiedSrc = `/.netlify/functions/cover-proxy?src=${encodeURIComponent(absoluteImgSrc)}`;

    img.src = proxiedSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("rgb(255,255,255)");
          return;
        }

        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);

        const data = ctx.getImageData(0, 0, 50, 50).data;

        let r = 0,
          g = 0,
          b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        if (!count) {
          resolve("rgb(255,255,255)");
          return;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch (err) {
        console.error("Dominant color çıxarılmadı:", err);
        resolve("rgb(255,255,255)");
      }
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
    getDominantColorFromImage(src).then((color) => {
      currentWaveColor = color;
    });
    const playlistThumb = document.querySelector(
      `.yt-track-item[data-music-index="${window.currentMusicIndex}"] .yt-track-thumb`,
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

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title || "Adsız mahnı",
    artist: track.artist || "Naməlum artist",
    album: "Hüseyn və Cəmalənin Dünyası",
    artwork: [
      { src: resolvedArtwork, sizes: "96x96", type: "image/png" },
      { src: resolvedArtwork, sizes: "128x128", type: "image/png" },
      { src: resolvedArtwork, sizes: "192x192", type: "image/png" },
      { src: resolvedArtwork, sizes: "256x256", type: "image/png" },
      { src: resolvedArtwork, sizes: "384x384", type: "image/png" },
      { src: resolvedArtwork, sizes: "512x512", type: "image/png" },
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
  const { audio, waveform } = getMusicDom();
  if (!audio || !waveform) return false;
  if (ytWaveInitialized) return true;

  const ready = await ensureYTAudioReady();
  if (!ready || !ytWaveCtx) {
    ytWaveFallbackMode = true;
    return false;
  }

  try {
    const sharedNodes = getOrCreateSharedAudioNodes(audio);
    if (!sharedNodes || !sharedNodes.analyser) {
      ytWaveFallbackMode = true;
      return false;
    }

    ytWaveAnalyser = sharedNodes.analyser;
    ytWaveSource = sharedNodes.source;
    ytWaveDataArray = new Uint8Array(ytWaveAnalyser.frequencyBinCount);
    ytWaveInitialized = true;
    ytWaveEnabled = true;
    ytWaveFallbackMode = false;

    drawYTWaveform();
    return true;
  } catch (err) {
    console.error("Waveform init xətası:", err);
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

  const dpr = Math.min(window.devicePixelRatio || 1, PERF_MOBILE ? 1.5 : 2);
  const rect = waveform.getBoundingClientRect();
  waveform.width = Math.max(1, Math.floor(rect.width * dpr));
  waveform.height = Math.max(1, Math.floor(rect.height * dpr));

  const ctx = waveform.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  let frameSkip = 0;

  const render = () => {
    if (
      document.hidden ||
      !waveform.isConnected ||
      (audio && audio.paused && ytWaveEnabled && !ytWaveFallbackMode)
    ) {
      if (ytWaveAnimationId) cancelAnimationFrame(ytWaveAnimationId);
      ytWaveAnimationId = null;
      return;
    }

    ytWaveAnimationId = requestAnimationFrame(render);
    if (PERF_MOBILE && ++frameSkip % 2 !== 0) return;

    const width = waveform.clientWidth;
    const height = waveform.clientHeight;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    const totalBars = PERF_MOBILE ? 20 : 42;
    const gap = PERF_MOBILE ? 3 : 4;
    const barWidth = Math.max(3, (width - (totalBars - 1) * gap) / totalBars);
    const totalWidth = totalBars * barWidth + (totalBars - 1) * gap;
    let x = (width - totalWidth) / 2;

    const drawBar = (x, y, w, h, radius) => {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
      else ctx.rect(x, y, w, h);
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
      ctx.shadowBlur = PERF_MOBILE ? 0 : 12;
      ctx.shadowColor = currentWaveColor;

      for (let i = 0; i < totalBars; i++) {
        const sourceIndex = Math.floor(
          (i / totalBars) * ytWaveDataArray.length,
        );
        const value = ytWaveDataArray[sourceIndex] / 255;
        const falloff =
          1 - Math.abs((i - totalBars / 2) / (totalBars / 2)) * 0.35;
        const visual = Math.max(0.18, value * falloff);
        const barHeight = Math.max(8, visual * height * 0.82);
        const alpha = 0.22 + visual * 0.9;

        ctx.fillStyle = currentWaveColor
          .replace("rgb", "rgba")
          .replace(")", `, ${alpha})`);
        drawBar(x, centerY - barHeight / 2, barWidth, barHeight, barWidth / 2);
        x += barWidth + gap;
      }
      ctx.shadowBlur = 0;
    } else {
      for (let i = 0; i < totalBars; i++) {
        const phase = Date.now() / 220 + i * 0.35;
        const idle = 0.18 + ((Math.sin(phase) + 1) / 2) * 0.18;
        const barHeight = Math.max(5, idle * height * 0.45);
        ctx.fillStyle = currentWaveColor
          .replace("rgb", "rgba")
          .replace(")", ", 0.14)");
        drawBar(x, centerY - barHeight / 2, barWidth, barHeight, barWidth / 2);
        x += barWidth + gap;
      }
    }
  };

  if (ytWaveAnimationId) cancelAnimationFrame(ytWaveAnimationId);
  render();
}
function resizeYTWaveform() {
  if (!ytWaveAnalyser && !ytWaveFallbackMode) return;
  drawYTWaveform();
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
    if (window.currentMusicLyricsType !== "synced") return;

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
  });
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

  dom.tabLyricsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!dom.activePlayer?.classList.contains("expanded")) {
      window.togglePlayerMode(true);
    }
    setPlayerTab("lyrics");
    updateLyricsToggleState();
  });

  dom.tabUpNextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!dom.activePlayer?.classList.contains("expanded")) {
      window.togglePlayerMode(true);
    }
    setPlayerTab("upnext");
    updateLyricsToggleState();
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

  dom.audio.addEventListener("timeupdate", () => {
    if (dom.seekbar) {
      dom.seekbar.value = dom.audio.currentTime || 0;
      const percent = (dom.audio.currentTime / (dom.audio.duration || 1)) * 100;
      dom.seekbar.style.setProperty("--yt-progress", `${percent}%`);
    }
    if (dom.currentTime)
      dom.currentTime.textContent = formatMusicTime(dom.audio.currentTime);
    updateSyncedLyricsByTime(dom.audio.currentTime);
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
    updateMusicPlayButtonState();
    updateMediaSessionPlaybackState();
  });
  dom.audio.addEventListener("pause", () => {
    updateMusicPlayButtonState();
    updateMediaSessionPlaybackState();
  });
  dom.audio.addEventListener("ended", () => {
    updateMusicPlayButtonState();
    updateMediaSessionPlaybackState();
    playNextMusic();
  });

  dom.seekbar?.addEventListener("input", () => {
    dom.audio.currentTime = Number(dom.seekbar.value);
    const percent = (dom.audio.currentTime / (dom.audio.duration || 1)) * 100;
    dom.seekbar.style.setProperty("--yt-progress", `${percent}%`);
    updateSyncedLyricsByTime(dom.audio.currentTime);
  });

  dom.volumeSlider?.addEventListener("input", (e) => {
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
};

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

  return `📱 Cihaz: ${device}
🏷 Marka: ${brand}
🌐 Brauzer: ${browser}
💻 Platforma: ${platform || "Naməlum"}
🗣 Dil: ${language}`;
}
async function initAnalytics() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    AppState.visitorIp = data.ip || "Naməlum IP";

    await sendTelegramMessage(
      `🟢 Sayta giriş oldu!
        📍 IP: ${AppState.visitorIp}
        ${getDeviceInfo()}
        ⏰ Vaxt: ${new Date().toLocaleString("az-AZ")}`,
    );
  } catch (e) {
    console.error("IP alma xətası:", e);
    AppState.visitorIp = "Naməlum IP";
  }

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
  if (minutes > 0) timeString += `${minutes} dəqiqə `;
  timeString += `${seconds} saniyə`;

  const ip = AppState.visitorIp || "Naməlum IP";

  sendTelegramMessage(
    `🔴 Saytdan çıxış!\n📍 IP: ${ip}\n⏳ Keçirilən vaxt: ${timeString}`,
    true,
  );
}
document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("theme-toggle");
  if (!themeBtn) return;

  const storageKey = "ui-theme";

  const applyTheme = (theme) => {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-ui", isDark);
    document.documentElement.setAttribute("data-theme", theme);

    /* mavi ay = dark mode */
    themeBtn.setAttribute("aria-pressed", String(!isDark));

    try {
      localStorage.setItem(storageKey, theme);
    } catch (_) {}
  };

  // əvvəlki tema
  let savedTheme = "dark";
  try {
    savedTheme = localStorage.getItem(storageKey) || "dark";
  } catch (_) {}

  applyTheme(savedTheme);

  // toggle klik
  themeBtn.addEventListener("click", () => {
    const isDarkNow = document.body.classList.contains("dark-ui");
    applyTheme(isDarkNow ? "light" : "dark");
  });
});
function initPlayerSwipeToClose() {
  return;
}

/* ===== Runtime hardening patch ===== */
(function enableOptionalCustomCursorMode() {
  const prefersFinePointer =
    window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (
    prefersFinePointer &&
    !prefersReducedMotion &&
    document.querySelector(".custom-cursor")
  ) {
    document.documentElement.classList.add("custom-cursor-enabled");
  }
})();
function typeWriter(text, element, speed = 80) {
  let i = 0;
  element.innerHTML = "";

  function typing() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }

  typing();
}

// DOM hazır olanda işə sal
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("typed-text");
  if (el) {
    typeWriter("Xoş gəldin, Cəmaləm ❤️", el, 70);
  }
});
// ========== ULTRA PREMIUM PLAYER EXPAND / COLLAPSE ==========
function animatePlayerExpand(complete) {
  const player = getMusicDom().activePlayer;
  if (!player || player._playerAnimating) return;
  player._playerAnimating = true;

  const bodyEl = player.querySelector(".yt-player-body");
  const miniRect = player.getBoundingClientRect();
  player._miniRect = miniRect;

  // Navbarı gizlətmək üçün klas
  document.body.classList.add("player-expanded");

  // Animasiya zamanı CSS transition-ları söndürürük
  player.classList.remove("player-mini", "player-collapsing", "player-hiding");
  player.classList.add("is-transitioning");

  if (bodyEl) {
    bodyEl.style.display = "block";
    bodyEl.style.opacity = "0";
  }

  // GSAP animasiyası
  gsap.fromTo(
    player,
    {
      position: "fixed",
      top: miniRect.top,
      left: miniRect.left,
      width: miniRect.width,
      height: miniRect.height,
      borderRadius: window.innerWidth <= 760 ? "22px" : "24px",
      margin: 0,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
    },
    {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      borderRadius: "0px",
      duration: 0.55,
      ease: "expo.inOut",
      onComplete: () => {
        // 1. Öncə klası əlavə edirik ki, CSS qaydaları dövriyəyə girsin
        player.classList.add("expanded");
        setTimeout(() => {
          player.classList.remove("is-transitioning");
        }, 450);

        // 2. GSAP-ın müvəqqəti stillərini təmizləyirik
        gsap.set(player, { clearProps: "all" });

        // 3. Əlavə sığorta: Brauzerin bir anlıq "sürüşmə" etməməsi üçün bu stilləri birbaşa veririk
        player.style.left = "0px";
        player.style.top = "0px";
        player.style.transform = "none";

        player._playerAnimating = false;
        syncPlayerExpandedState();
        if (typeof complete === "function") complete();
      },
    },
  );

  if (bodyEl) {
    gsap.to(bodyEl, {
      opacity: 1,
      duration: 0.35,
      delay: 0.2,
      ease: "power2.out",
    });
  }
}

function animatePlayerCollapse(complete) {
  const player = getMusicDom().activePlayer;
  if (!player || player._playerAnimating) return;
  player._playerAnimating = true;

  const bodyEl = player.querySelector(".yt-player-body");

  let targetRect = player._miniRect;
  if (!targetRect) {
    const w = window.innerWidth <= 760 ? window.innerWidth - 24 : 880;
    const h = window.innerWidth <= 760 ? 70 : 84;
    const bottomOffset = window.innerWidth <= 760 ? 90 : 96;
    targetRect = {
      left: (window.innerWidth - w) / 2,
      top: window.innerHeight - bottomOffset - h,
      width: w,
      height: h,
    };
  }

  if (bodyEl) {
    gsap.to(bodyEl, { opacity: 0, duration: 0.2, ease: "power2.inOut" });
  }

  // Navbarı geri qaytarırıq
  document.body.classList.remove("player-expanded");

  // CSS-in !important qaydalarını sındırmaq üçün bağlanan KİMİ .expanded klassını SİLİRİK
  player.classList.remove("expanded");
  player.classList.add("is-transitioning");

  // GSAP animasiyası (tam ekrandan -> mini ölçüyə)
  gsap.fromTo(
    player,
    {
      position: "fixed",
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      borderRadius: "0px",
      margin: 0,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
    },
    {
      top: targetRect.top,
      left: targetRect.left,
      width: targetRect.width,
      height: targetRect.height,
      borderRadius: window.innerWidth <= 760 ? "22px" : "24px",
      duration: 0.55,
      ease: "expo.inOut",
      onComplete: () => {
        player.classList.remove("is-transitioning");
        player.classList.add("player-mini");
        gsap.set(player, { clearProps: "all" });

        if (bodyEl) {
          bodyEl.style.display = "none";
          bodyEl.style.opacity = "";
        }

        player._playerAnimating = false;
        syncPlayerExpandedState();
        if (typeof complete === "function") complete();
      },
    },
  );
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

// ========== ZAMAN KAPSÜLÜ ==========
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

function renderCapsuleMonths() {
  const container = document.getElementById('capsule-months-container');
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
            <span class="capsule-item-date"><i class="far fa-clock"></i> ${formatFilmDate(item.data.watchDate || item.data.dateIso)}</span>
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
  document.getElementById('close-capsule-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('timecapsule-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  });

  const capsulePage = document.getElementById('page-timecapsule');
  if (capsulePage) {
    new MutationObserver(() => {
      if (capsulePage.classList.contains('active')) renderCapsuleMonths();
    }).observe(capsulePage, { attributes: true, attributeFilter: ['class'] });

    if (capsulePage.classList.contains('active')) renderCapsuleMonths();
  }

  let retries = 0;
  const iv = setInterval(() => {
    if (window.allImages && window.currentNotes && window.currentFilms) {
      clearInterval(iv);
      renderCapsuleMonths();
    }
    if (++retries > 40) clearInterval(iv);
  }, 500);
});
