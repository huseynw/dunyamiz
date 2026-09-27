import { Kawarp } from "@kawarp/core";

let instance = null;
let canvas = null;
let imageUrl = null;
let pendingImageUrl = null;
let resizeObserver = null;

async function loadSourceIntoKawarp(src) {
  if (!instance || !src) return;
  try {
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
      try {
        const response = await fetch(src, { mode: "cors", cache: "force-cache" });
        if (response.ok) {
          const blob = await response.blob();
          instance.loadBlob(blob);
          return;
        }
      } catch (_) {
        // Fallback to direct URL if fetch fails
      }
    }
    const promise = instance.loadImage(src);
    if (promise && typeof promise.catch === "function") {
      promise.catch((err) => {
        console.warn("Kawarp loadImage fallback xətası:", err);
      });
    }
  } catch (err) {
    console.warn("Kawarp loadSource error:", err);
  }
}

export function initKawarp() {
  const bg = document.getElementById("yt-player-bg");
  if (!bg || instance) return;

  try {
    canvas = document.createElement("canvas");
    canvas.className = "kawarp-canvas";
    bg.prepend(canvas);

    // Better Lyrics Shaders tuned parameters
    instance = new Kawarp(canvas, {
      warpIntensity: 1.0,
      blurPasses: 8,
      animationSpeed: 0.85,
      transitionDuration: 1200,
      saturation: 1.5,
      tintColor: [0.12, 0.1, 0.18],
      tintIntensity: 0.1,
      dithering: 0.008,
      scale: 1.0,
    });

    instance.start();

    // ResizeObserver: Player mini <-> expanded keçidlərində avtomatik dəqiq ölçü
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          if (instance) instance.resize();
        });
      });
      resizeObserver.observe(bg);
    }

    // Əgər cover artıq təyin olunubsa, dərhal yüklə
    if (pendingImageUrl) {
      loadSourceIntoKawarp(pendingImageUrl);
    }
  } catch (e) {
    console.warn("Kawarp init xətası (CSS ambient fallback aktivdir):", e);
  }
}

export function updateKawarpCover(src) {
  if (!src) return;
  pendingImageUrl = src;

  if (!instance) {
    // İnstansiya hələ yaranmayıbsa, init etməyə cəhd et
    initKawarp();
    if (!instance) return;
  }

  if (src === imageUrl) return;
  imageUrl = src;
  loadSourceIntoKawarp(src);
}

export function resizeKawarp() {
  if (instance) instance.resize();
}

export function stopKawarp() {
  if (instance) {
    instance.stop();
  }
}

export function startKawarp() {
  if (instance) {
    instance.start();
  }
}

export function destroyKawarp() {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (instance) {
    instance.stop();
    instance.dispose();
    instance = null;
  }
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
  canvas = null;
  imageUrl = null;
}
