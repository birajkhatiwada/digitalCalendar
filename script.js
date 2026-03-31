// Clock
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

// Weather (current + 7-day forecast)
async function loadWeather() {
  const lat = 37.77,
    lon = -122.27; // replace with your location
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=America/Los_Angeles`;
  const res = await fetch(url);
  const data = await res.json();

  // Current weather
  const temp = data.current_weather.temperature;
  const code = data.current_weather.weathercode;
  document.getElementById("temperature").innerText = temp + "°F";
  //   document.getElementById("description").innerText = "Current Weather";

  let icon = "☀️";
  if (code === 0) {
    icon = "☀️";
  } else if (code >= 1 && code <= 3) {
    icon = "⛅";
  } else if (code >= 51 && code <= 67) {
    icon = "🌧";
  } else if (code >= 71 && code <= 77) {
    icon = "❄️";
  } else if (code >= 80 && code <= 82) {
    icon = "🌦";
  } else if (code >= 95) {
    icon = "⛈";
  }
  document.getElementById("weatherIcon").innerText = icon;

  // 7-Day forecast
  for (let i = 0; i < 7; i++) {
    const dayEl = document.getElementById(`day${i}`);
    const date = new Date(data.daily.time[i]);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
    const minTemp = Math.round(data.daily.temperature_2m_min[i]);
    const wcode = data.daily.weathercode[i];
    let wicon = "☀️";
    if (wcode === 0) {
      wicon = "☀️";
    } else if (wcode >= 1 && wcode <= 3) {
      wicon = "⛅";
    } else if (wcode >= 51 && wcode <= 67) {
      wicon = "🌧";
    } else if (wcode >= 71 && wcode <= 77) {
      wicon = "❄️";
    } else if (wcode >= 80 && wcode <= 82) {
      wicon = "🌦";
    } else if (wcode >= 95) {
      wicon = "⛈";
    }

    dayEl.innerHTML = `<div>${dayName}</div><div>${wicon}</div><div>${maxTemp}°/${minTemp}°</div>`;
  }
}

loadWeather();
setInterval(loadWeather, 600000); // every 10 mins
