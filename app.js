let flightData = {
  departureTime: "2026-01-16T21:47:00-08:00",
  arrivalTime: "2026-01-18T02:05:00+08:00",
  milesTotal: 1171 + 5513,
  status: "En route and on time",
};

const fetchLiveFlightData = async () => {
  try {
    const response = await fetch(
      "https://opensky-network.org/api/states/all?icao24=75000d"
    );
    if (!response.ok) throw new Error("API call failed");
    const data = await response.json();
    
    if (data.states && data.states.length > 0) {
      const state = data.states[0];
      console.log("Live flight data:", state);
    }
  } catch (error) {
    console.warn("Failed to fetch live flight data, using scheduled times");
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
const arrivalCountdown = document.getElementById("arrivalCountdown");
const planeIcon = document.getElementById("planeIcon");
const flightPath = document.getElementById("flightPath");
const mainCountdown = document.getElementById("mainCountdown");
const flightStatus = document.getElementById("flightStatus");

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
  const { total: totalSeconds, elapsed: elapsedSeconds } = getTimestamps();
  const progress = totalSeconds ? Math.min(elapsedSeconds / totalSeconds, 1) : 0;
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const milesRemainingValue = flightData.milesTotal * (1 - progress);
  const milesFlownValue = flightData.milesTotal - milesRemainingValue;

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
  arrivalCountdown.textContent = formatHms(remainingSeconds);
  
  if (mainCountdown) mainCountdown.textContent = formatHms(remainingSeconds);
  if (flightStatus) flightStatus.textContent = flightData.status;

  updatePlanePosition(progress);
};

(async () => {
  await fetchLiveFlightData();
  updateUI();
  setInterval(updateUI, 1000);
  setInterval(fetchLiveFlightData, 120000);
})();
