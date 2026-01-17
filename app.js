let flightData = {
  departureTime: "2026-01-16T21:47:00-08:00",
  arrivalTime: "2026-01-18T02:05:00+08:00",
  milesTotal: 1171 + 5513,
  status: "Flying closer to you ♡",
  airspeed: null,
};

/**
 * Calculate realistic airspeed based on flight phase and progress
 * Boeing 777 speed profile: Takeoff (200mph) → Cruise (570mph) → Landing (180mph)
 * @param {number} progress - Flight progress from 0.0 to 1.0
 * @param {number} elapsedSeconds - Seconds since departure (for smooth variation)
 * @returns {number} Speed in mph
 */
const calculateRealisticAirspeed = (progress, elapsedSeconds) => {
  try {
    // PHASE 1: TAKEOFF & CLIMB (0% - 8%)
    if (progress < 0.08) {
      const climbProgress = progress / 0.08; // 0.0 to 1.0 within phase
      const baseSpeed = 200 + (climbProgress * 375); // 200 → 575 mph
      const variation = Math.sin(elapsedSeconds / 30) * 5; // ±5 mph variation
      return Math.round(baseSpeed + variation);
    }
    
    // PHASE 2: CRUISE (8% - 92%)
    else if (progress < 0.92) {
      const baseSpeed = 570; // Typical 777 cruise speed
      // Add jetstream effect (faster over Pacific mid-flight)
      const jetstreamBoost = progress > 0.3 && progress < 0.7 ? 8 : 0;
      // Small turbulence variation
      const variation = Math.sin(elapsedSeconds / 45) * 7;
      return Math.round(baseSpeed + jetstreamBoost + variation);
    }
    
    // PHASE 3: DESCENT & LANDING (92% - 100%)
    else {
      const descentProgress = (progress - 0.92) / 0.08; // 0.0 to 1.0 within phase
      const baseSpeed = 575 - (descentProgress * 395); // 575 → 180 mph
      const variation = Math.sin(elapsedSeconds / 25) * 4;
      return Math.round(Math.max(180, baseSpeed + variation));
    }
  } catch (error) {
    console.warn("Airspeed calculation error:", error);
    return null; // Will trigger funny message fallback
  }
};

const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const liveTicker = document.getElementById("liveTicker");
const elapsedTime = document.getElementById("elapsedTime");
const remainingTime = document.getElementById("remainingTime");
const totalTime = document.getElementById("totalTime");
const milesFlown = document.getElementById("milesFlown");
const milesRemaining = document.getElementById("milesRemaining");
const mainCountdown = document.getElementById("mainCountdown");
const flightStatus = document.getElementById("flightStatus");
const confettiCanvas = document.getElementById("confettiCanvas");
const planeMarker = document.getElementById("planeMarker");
const flightTrack = document.getElementById("flightTrack");
const airspeedValue = document.getElementById("airspeedValue");

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getTimestamps = () => {
  const departure = new Date(flightData.departureTime).getTime();
  const arrival = new Date(flightData.arrivalTime).getTime();
  const total = Math.max(0, Math.round((arrival - departure) / 1000));
  const elapsed = clamp(Math.round((Date.now() - departure) / 1000), 0, total);
  return { departure, arrival, total, elapsed };
};

const formatHms = (seconds) => {
  const clamped = Math.max(0, seconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return `${String(hours)}h ${String(minutes).padStart(2, "0")}m ${String(
    secs
  ).padStart(2, "0")}s`;
};

const formatClock = (seconds) => {
  const clamped = Math.max(0, seconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
};

const formatNumber = (value) =>
  Math.round(value).toLocaleString("en-US");

const funnyMessages = [
  "😴 Cat fell asleep on speedometer",
  "🚀 Too fast to measure!",
  "🐱 Cats don't believe in speed limits",
  "✈️ Speed-o-meter took a nap",
  "🎯 Mach meow? Who knows!",
  "😸 Speed is just a social construct",
  "🌟 Flying by vibes only",
  "🐾 Paws don't do numbers today",
  "✨ Zoom level: mysterious",
  "😺 Speedometer said 'not today'"
];

const updateFlightTrack = (progress) => {
  if (!flightTrack || !planeMarker) return;
  
  const pathLength = flightTrack.getTotalLength();
  const currentLength = pathLength * progress;
  
  flightTrack.style.strokeDasharray = `${currentLength} ${pathLength}`;
  flightTrack.style.strokeDashoffset = "0";
  
  const point = flightTrack.getPointAtLength(currentLength);
  planeMarker.setAttribute("transform", `translate(${point.x}, ${point.y})`);
};

const updateAirspeed = () => {
  if (!airspeedValue) return;
  
  if (flightData.airspeed) {
    // Display calculated airspeed
    airspeedValue.textContent = 
      `${flightData.airspeed.mph} mph / ${flightData.airspeed.kph} kph`;
    
    // Retrigger speedPulse animation for visual feedback
    airspeedValue.style.animation = 'none';
    airspeedValue.offsetHeight; // Force reflow for reliable animation restart
    airspeedValue.style.animation = '';
  } else {
    // Fallback to funny messages on calculation error
    const index = Math.floor(Date.now() / 15000) % funnyMessages.length;
    airspeedValue.textContent = funnyMessages[index];
  }
};

const updateUI = () => {
  const { total: totalSeconds, elapsed: elapsedSeconds } = getTimestamps();
  const progress = totalSeconds ? Math.min(elapsedSeconds / totalSeconds, 1) : 0;
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const milesRemainingValue = flightData.milesTotal * (1 - progress);
  const milesFlownValue = flightData.milesTotal - milesRemainingValue;

  // Calculate realistic airspeed based on flight phase
  const speedMph = calculateRealisticAirspeed(progress, elapsedSeconds);
  if (speedMph !== null) {
    flightData.airspeed = {
      mph: speedMph,
      kph: Math.round(speedMph * 1.60934)
    };
  } else {
    flightData.airspeed = null; // Triggers funny message fallback
  }

  progressFill.style.width = `${progress * 100}%`;
  progressPercent.textContent = `${Math.round(progress * 100)}%`;
  liveTicker.textContent = `${formatClock(elapsedSeconds)} elapsed`;
  elapsedTime.textContent = formatHms(elapsedSeconds);
  remainingTime.textContent = formatHms(remainingSeconds);
  totalTime.textContent = `${Math.floor(totalSeconds / 3600)}h ${String(
    Math.floor((totalSeconds % 3600) / 60)
  ).padStart(2, "0")}m`;
  milesFlown.textContent = formatNumber(milesFlownValue);
  milesRemaining.textContent = formatNumber(milesRemainingValue);
  
  if (mainCountdown) mainCountdown.textContent = formatHms(remainingSeconds);
  if (flightStatus) flightStatus.textContent = flightData.status;

  updateFlightTrack(progress);
  updateAirspeed();
};

const launchConfetti = () => {
  if (!confettiCanvas) return;
  const ctx = confettiCanvas.getContext("2d");
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 150;
  const colors = ["#ffb6d5", "#9fd8ff", "#ffe48c", "#c7a6ff", "#86f0e0"];
  const shapes = ["heart", "star", "circle"];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      r: Math.random() * 4 + 2,
      d: Math.random() * particleCount,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 3 + 2,
    });
  }

  const drawHeart = (ctx, x, y, size, color) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(
      x - size / 2,
      y + (size + topCurveHeight) / 2,
      x,
      y + (size + topCurveHeight) / 1.2,
      x,
      y + size
    );
    ctx.bezierCurveTo(
      x,
      y + (size + topCurveHeight) / 1.2,
      x + size / 2,
      y + (size + topCurveHeight) / 2,
      x + size / 2,
      y + topCurveHeight
    );
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawStar = (ctx, x, y, size, color) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(
        x + size * Math.cos(((18 + i * 72) * Math.PI) / 180),
        y - size * Math.sin(((18 + i * 72) * Math.PI) / 180)
      );
      ctx.lineTo(
        x + (size / 2) * Math.cos(((54 + i * 72) * Math.PI) / 180),
        y - (size / 2) * Math.sin(((54 + i * 72) * Math.PI) / 180)
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  let animationId;
  const animate = () => {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    // Iterate backwards to safely remove particles during loop
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.tiltAngle += p.tiltAngleIncrement;
      p.y += p.vy;
      p.x += p.vx;
      p.tilt = Math.sin(p.tiltAngle) * 15;

      if (p.y > confettiCanvas.height) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.tilt * Math.PI) / 180);

      if (p.shape === "heart") {
        drawHeart(ctx, 0, 0, p.r * 2, p.color);
      } else if (p.shape === "star") {
        drawStar(ctx, 0, 0, p.r * 1.5, p.color);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (particles.length > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      confettiCanvas.style.display = "none";
    }
  };

  animate();
};

const checkLandingConfetti = () => {
  const { total, elapsed } = getTimestamps();
  const hasLanded = elapsed >= total;
  const confettiShown = localStorage.getItem("confettiShown");

  if (hasLanded && !confettiShown) {
    localStorage.setItem("confettiShown", "true");
    setTimeout(() => launchConfetti(), 500);
  }
};

// Initialize flight tracker
(() => {
  updateUI();
  checkLandingConfetti();
  setInterval(updateUI, 1000);
})();

// ==========================================
// MUSIC WIDGET
// ==========================================

const musicWidget = {
  // DOM Elements
  widget: null,
  toggle: null,
  player: null,
  close: null,
  iframeContainer: null,
  
  // State
  isOpen: false,
  isLoaded: false,
  
  // Curated clean love songs (YouTube video IDs)
  // All verified clean/wholesome songs
  playlist: [
    'rtOvBOTyX00', // A Thousand Years - Christina Perri
    '2Vv-BfVoq4g', // Perfect - Ed Sheeran
    '450p7goxZqg', // All of Me - John Legend
    'lp-EO5I60KA', // Thinking Out Loud - Ed Sheeran
    'vGJTaP6anOU', // Can't Help Falling in Love - Elvis Presley
    '0put0_a--Ng', // Make You Feel My Love - Adele
    'acvIVA9-FMQ', // Lucky - Jason Mraz & Colbie Caillat
    'SPUJIbXN0WY', // Everything - Michael Bublé
    'LjhCEhWiKXk', // Just the Way You Are - Bruno Mars
    'dElRVQFqj-k', // Marry You - Bruno Mars
  ],
  
  init() {
    this.widget = document.getElementById('musicWidget');
    this.toggle = document.getElementById('musicToggle');
    this.player = document.getElementById('musicPlayer');
    this.close = document.getElementById('playerClose');
    this.iframeContainer = document.getElementById('iframeContainer');
    
    if (!this.toggle || !this.player) return;
    
    // Click handlers
    this.toggle.addEventListener('click', () => this.togglePlayer());
    this.close.addEventListener('click', () => this.closePlayer());
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closePlayer();
      }
    });
    
    // Close when clicking outside (optional)
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !this.player.contains(e.target) && 
          !this.toggle.contains(e.target)) {
        this.closePlayer();
      }
    });
  },
  
  togglePlayer() {
    this.isOpen ? this.closePlayer() : this.openPlayer();
  },
  
  openPlayer() {
    // Lazy load iframe on first open
    if (!this.isLoaded) {
      this.loadYouTubePlayer();
      this.isLoaded = true;
    }
    
    this.isOpen = true;
    this.player.hidden = false;
    this.toggle.setAttribute('aria-expanded', 'true');
    this.widget.classList.add('is-open');
  },
  
  closePlayer() {
    this.isOpen = false;
    this.toggle.setAttribute('aria-expanded', 'false');
    this.widget.classList.remove('is-open');
    
    // Delay hiding for animation
    setTimeout(() => {
      if (!this.isOpen) {
        this.player.hidden = true;
      }
    }, 400);
    
    // Return focus to toggle button
    this.toggle.focus();
  },
  
  loadYouTubePlayer() {
    const firstVideo = this.playlist[0];
    const remainingVideos = this.playlist.slice(1).join(',');
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${firstVideo}?playlist=${remainingVideos}&loop=1&rel=0`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title = 'Romantic love songs playlist';
    iframe.loading = 'lazy';
    
    this.iframeContainer.appendChild(iframe);
  }
};

// Initialize music widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  musicWidget.init();
});
