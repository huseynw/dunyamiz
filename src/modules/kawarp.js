import { Kawarp } from "@kawarp/core";

let instance = null;
let canvas = null;
let imageUrl = null;

export function initKawarp() {
  const bg = document.getElementById("yt-player-bg");
  if (!bg || instance) return;

  canvas = document.createElement("canvas");
  canvas.className = "kawarp-canvas";
  bg.prepend(canvas);

  instance = new Kawarp(canvas, {
    warpIntensity: 0.8,
    blurPasses: 6,
    animationSpeed: 0.6,
    transitionDuration: 800,
    saturation: 1.3,
    tintColor: [0.16, 0.12, 0.2],
    tintIntensity: 0.12,
    dithering: 0.006,
    scale: 1,
  });

  instance.start();
}

export function updateKawarpCover(src) {
  if (!instance) return;
  if (src === imageUrl) return;
  imageUrl = src;
  instance.loadImage(src);
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
