// 1️⃣ Clock
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  document.getElementById("clock").innerText = time;
}
setInterval(updateClock, 1000);
updateClock();

// 2️⃣ Weather + background GIF
async function loadWeather() {
  const lat = 37.77,
    lon = -122.27; // replace with your location
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=America/Los_Angeles`;
  const res = await fetch(url);
  const data = await res.json();
  const temp = data.current_weather.temperature;
  const code = data.current_weather.weathercode;

  document.getElementById("temperature").innerText = temp + "°F";
  document.getElementById("description").innerText = "Current Weather";

  let icon = "☀️";
  let bgURL = "gifs/sunny.gif"; // default (local GIF)

  // Example weather mapping (replace with local GIFs)
  if (code === 0) {
    icon = "☀️";
    bgURL = "gifs/sunny.gif";
  } // sunny
  else if (code >= 1 && code <= 3) {
    icon = "⛅";
    bgURL = "gifs/cloudy.gif";
  } // partly cloudy
  else if (code >= 51 && code <= 67) {
    icon = "🌧";
    bgURL = "gifs/rain.gif";
  } // rain
  else if (code >= 71 && code <= 77) {
    icon = "❄️";
    bgURL = "gifs/snow.gif";
  } // snow
  else if (code >= 80 && code <= 82) {
    icon = "🌦";
    bgURL = "gifs/rain.gif";
  } // showers
  else if (code >= 95) {
    icon = "⛈";
    bgURL = "gifs/storm.gif";
  } // storm

  document.getElementById("weatherIcon").innerText = icon;
  document.getElementById("bgGif").src = bgURL;
}

loadWeather();
setInterval(loadWeather, 600000); // reload every 10 minutes

// 3️⃣ Particle overlay
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
for (let i = 0; i < 150; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3,
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "#0ff";
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    if (p.x > canvas.width) p.x = 0;
    if (p.x < 0) p.x = canvas.width;
    if (p.y > canvas.height) p.y = 0;
    if (p.y < 0) p.y = canvas.height;
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();
