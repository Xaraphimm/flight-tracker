const flightData = {
  totalMinutes: 12 * 60 + 18,
  elapsedSeconds: 2 * 60 * 60 + 17 * 60,
  milesTotal: 1171 + 5513,
};

const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const liveTicker = document.getElementById("liveTicker");
const elapsedTime = document.getElementById("elapsedTime");
const remainingTime = document.getElementById("remainingTime");
const totalTime = document.getElementById("totalTime");
const milesFlown = document.getElementById("milesFlown");
const milesRemaining = document.getElementById("milesRemaining");
const arrivalCountdown = document.getElementById("arrivalCountdown");
const planeIcon = document.getElementById("planeIcon");
const flightPath = document.getElementById("flightPath");

const totalSeconds = flightData.totalMinutes * 60;
let elapsedSeconds = flightData.elapsedSeconds;

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

const updatePlanePosition = (percent) => {
  if (!flightPath || !planeIcon) return;
  const pathLength = flightPath.getTotalLength();
  const lengthAtPercent = Math.min(pathLength, Math.max(0, percent * pathLength));
  const point = flightPath.getPointAtLength(lengthAtPercent);
  const nextPoint = flightPath.getPointAtLength(
    Math.min(pathLength, lengthAtPercent + 1)
  );
  const angle =
    (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) /
    Math.PI;
  planeIcon.setAttribute(
    "transform",
    `translate(${point.x}, ${point.y}) rotate(${angle})`
  );
};

const updateUI = () => {
  const progress = Math.min(elapsedSeconds / totalSeconds, 1);
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const milesRemainingValue = flightData.milesTotal * (1 - progress);
  const milesFlownValue = flightData.milesTotal - milesRemainingValue;

  progressFill.style.width = `${progress * 100}%`;
  progressPercent.textContent = `${Math.round(progress * 100)}%`;
  liveTicker.textContent = `${formatClock(elapsedSeconds)} elapsed`;
  elapsedTime.textContent = formatHms(elapsedSeconds);
  remainingTime.textContent = formatHms(remainingSeconds);
  totalTime.textContent = `${Math.floor(flightData.totalMinutes / 60)}h ${String(
    flightData.totalMinutes % 60
  ).padStart(2, "0")}m`;
  milesFlown.textContent = formatNumber(milesFlownValue);
  milesRemaining.textContent = formatNumber(milesRemainingValue);
  arrivalCountdown.textContent = formatHms(remainingSeconds);

  updatePlanePosition(progress);
};

updateUI();

setInterval(() => {
  if (elapsedSeconds < totalSeconds) {
    elapsedSeconds += 1;
    updateUI();
  }
}, 1000);
