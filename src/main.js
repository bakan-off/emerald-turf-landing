import './style.css';

const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");

const totalFrames = 120;
const images = [];
let loadedCount = 0;

// Elements
const loader = document.getElementById("loader");
const loaderProgress = document.getElementById("loader-progress");
const loaderPercentage = document.getElementById("loader-percentage");

// Animation State
let currentFrame = 0;
let targetFrame = 0;

// Preload Images
function preloadImages() {
  const baseUrl = import.meta.env.BASE_URL || "/";
  for (let i = 1; i <= totalFrames; i++) {
    const img = new Image();
    const frameNum = String(i).padStart(3, "0");
    // Vite serves public folder contents at root '/'
    img.src = `${baseUrl}frames/frame_${frameNum}.jpg`;
    img.onload = () => {
      loadedCount++;
      const percent = Math.round((loadedCount / totalFrames) * 100);
      loaderProgress.style.width = `${percent}%`;
      loaderPercentage.textContent = `${percent}%`;

      if (loadedCount === totalFrames) {
        onPreloadComplete();
      }
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${img.src}`);
      // Count as loaded to prevent freezing loader if a frame is missing
      loadedCount++;
      if (loadedCount === totalFrames) {
        onPreloadComplete();
      }
    };
    images.push(img);
  }
}

function onPreloadComplete() {
  // Fade out loader
  loader.classList.add("opacity-0", "pointer-events-none");
  setTimeout(() => {
    loader.classList.add("hidden");
  }, 1000);

  // Initialize Canvas and listeners
  initCanvas();
  window.addEventListener("resize", initCanvas);
  window.addEventListener("scroll", handleScroll);
  
  // Initial scroll capture and start the frame loop
  handleScroll();
  tick();
}

// Canvas Setup with Retina Display Support
function initCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.resetTransform();
  ctx.scale(pixelRatio, pixelRatio);

  // Instant redraw of the current frame on resize
  drawFrame(Math.round(currentFrame));
}

// Draws the selected frame with object-fit: cover emulation
function drawFrame(index) {
  const img = images[index];
  if (!img || !img.complete) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  // Render aspect ratios (original frames are cropped to 16:9, e.g. 1920x1080)
  const imgWidth = img.naturalWidth || 1920;
  const imgHeight = img.naturalHeight || 1080;
  const imgRatio = imgWidth / imgHeight;
  const screenRatio = w / h;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgRatio > screenRatio) {
    // Image aspect ratio is wider than viewport aspect ratio
    drawHeight = h;
    drawWidth = h * imgRatio;
    offsetX = (w - drawWidth) / 2;
    offsetY = 0;
  } else {
    // Image aspect ratio is taller than viewport aspect ratio
    drawWidth = w;
    drawHeight = w / imgRatio;
    offsetX = 0;
    offsetY = (h - drawHeight) / 2;
  }

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Scroll Calculations
function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  
  if (scrollHeight <= 0) return;
  
  const scrollFraction = scrollTop / scrollHeight;
  
  // Frame bounds 0 to 119
  targetFrame = Math.min(totalFrames - 1, Math.max(0, scrollFraction * (totalFrames - 1)));
}

// Toggle Section Opacity and Interactivity based on active frame ranges
function updateTextSections(frameIndex) {
  const sections = [
    { id: "section-1", start: 0, end: 24 },
    { id: "section-2", start: 25, end: 49 },
    { id: "section-3", start: 50, end: 74 },
    { id: "section-4", start: 75, end: 99 },
    { id: "section-5", start: 100, end: 119 },
  ];

  sections.forEach((sec) => {
    const el = document.getElementById(sec.id);
    if (!el) return;

    if (frameIndex >= sec.start && frameIndex <= sec.end) {
      el.classList.remove("opacity-0", "invisible", "pointer-events-none");
      el.classList.add("opacity-100", "visible", "pointer-events-auto", "transition-all", "duration-700");
    } else {
      el.classList.remove("opacity-100", "visible", "pointer-events-auto");
      el.classList.add("opacity-0", "invisible", "pointer-events-none");
    }
  });
}

// Main LERP update loop
function tick() {
  const diff = targetFrame - currentFrame;
  
  if (Math.abs(diff) > 0.001) {
    currentFrame += diff * 0.08;
  } else {
    currentFrame = targetFrame;
  }

  const frameIndex = Math.round(currentFrame);
  drawFrame(frameIndex);
  updateTextSections(frameIndex);

  requestAnimationFrame(tick);
}

// Initialize preloader
preloadImages();

// Awwwards Navigation Menu Logic
const menuToggle = document.getElementById("menu-toggle");
const menuLine1 = document.getElementById("menu-line-1");
const menuLine2 = document.getElementById("menu-line-2");
const fullscreenMenu = document.getElementById("fullscreen-menu");
const menuLinks = document.querySelectorAll(".menu-link");

let isMenuOpen = false;

function openMenu() {
  isMenuOpen = true;
  document.body.style.overflow = "hidden";
  
  // Transform burger lines to cross
  menuLine1.classList.remove("-translate-y-1");
  menuLine1.classList.add("rotate-45");
  menuLine2.classList.remove("translate-y-1");
  menuLine2.classList.add("-rotate-45");
  
  // Fade in menu
  fullscreenMenu.classList.remove("opacity-0", "invisible", "pointer-events-none");
  fullscreenMenu.classList.add("opacity-100", "visible", "pointer-events-auto");
  
  // Stagger animate links
  menuLinks.forEach((link, idx) => {
    link.style.transitionDelay = `${idx * 80}ms`;
    link.classList.remove("translate-y-8", "opacity-0");
  });
}

function closeMenu() {
  isMenuOpen = false;
  document.body.style.overflow = "auto";
  
  // Transform cross back to burger lines
  menuLine1.classList.remove("rotate-45");
  menuLine1.classList.add("-translate-y-1");
  menuLine2.classList.remove("-rotate-45");
  menuLine2.classList.add("translate-y-1");
  
  // Fade out menu
  fullscreenMenu.classList.remove("opacity-100", "visible", "pointer-events-auto");
  fullscreenMenu.classList.add("opacity-0", "invisible", "pointer-events-none");
  
  // Hide links
  menuLinks.forEach((link) => {
    link.style.transitionDelay = "0ms";
    link.classList.add("translate-y-8", "opacity-0");
  });
}

menuToggle.addEventListener("click", () => {
  if (isMenuOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});

menuLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetPercent = parseFloat(link.getAttribute("data-target"));
    
    // Close the menu first (restores body scroll)
    closeMenu();
    
    // Smooth scroll to the target position
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScrollTop = targetPercent * scrollHeight;
    
    window.scrollTo({
      top: targetScrollTop,
      behavior: "smooth"
    });
  });
});
