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
