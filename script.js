/* CONFIGURATION */
const WEATHER_API_KEY = "10a26ae0bda63e8d7ca6bf4f525c554c";
const CALENDAR_ID =
  "bf70d8cb0eafe0494d0f802c6f10a5a564d793262d0b97cfb2bfb5594fe3f647@group.calendar.google.com";

/* CLOCK */
function updateClock() {
  const now = new Date();
  document.getElementById("time").innerText = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/* WEATHER */
async function loadWeather() {
  const lat = 37.7652; // Emeryville coordinates
  const lon = -122.2416;

  try {
    /*
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${WEATHER_API_KEY}`
    );
    if (!response.ok) throw new Error("Failed to fetch weather data");
    const data = await response.json();
    */
    const data = {
      list: [
        {
          dt_txt: "2026-04-01 12:00:00",
          main: { temp: 65 },
          weather: [{ main: "Clear" }],
        },
        {
          dt_txt: "2026-04-02 12:00:00",
          main: { temp: 62 },
          weather: [{ main: "Clouds" }],
        },
        {
          dt_txt: "2026-04-03 12:00:00",
          main: { temp: 60 },
          weather: [{ main: "Rain" }],
        },
        {
          dt_txt: "2026-04-04 12:00:00",
          main: { temp: 68 },
          weather: [{ main: "Clear" }],
        },
        {
          dt_txt: "2026-04-05 12:00:00",
          main: { temp: 70 },
          weather: [{ main: "Clouds" }],
        },
      ],
    };

    if (data && data.list) {
      const current = data.list[0];
      document.getElementById("temperature").innerText =
        Math.round(current.main.temp) + "°F";
      document.getElementById("weatherIcon").innerText = getWeatherEmoji(
        current.weather[0].main
      );
      updateWeatherGif(current.weather[0].main);

      createForecast(data.list);
    }
  } catch (err) {
    console.error("Weather error:", err);
    document.getElementById("temperature").innerText = "--";
    document.getElementById("weatherIcon").innerText = "❓";
    document.getElementById("weatherGif").src = "";
    document.getElementById("forecast").innerHTML = "Unable to load forecast.";
  }
}

function getWeatherEmoji(type) {
  const map = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧",
    Snow: "❄️",
    Thunderstorm: "⛈",
    Drizzle: "🌦",
    Mist: "🌫",
  };
  return map[type] || "⛅";
}

function updateWeatherGif(type) {
  const tempgif =
    "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzR3ZWFxMmpiNmMxM2pxbzk4djU2dms0bHJvbGlyZnY2dGdyMTFsMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/RUsxabj8qvFbWl3FWL/giphy.gif";
  const gifs = {
    Clear: tempgif,
    Clouds: tempgif,
    Rain: tempgif,
    Snow: tempgif,
    Thunderstorm: tempgif,
    Drizzle: tempgif,
    Mist: tempgif,
  };
  const gifEl = document.getElementById("weatherGif");
  gifEl.src = gifs[type] || gifs["Clouds"];
  gifEl.style.width = "300px";
  gifEl.style.height = "300px";
  gifEl.style.objectFit = "contain";
}

function createForecast(list) {
  const forecastEl = document.getElementById("forecast");
  forecastEl.innerHTML = "";
  const daysAdded = new Set();

  for (const item of list) {
    const date = new Date(item.dt_txt);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    if (!daysAdded.has(dayName) && daysAdded.size < 5) {
      daysAdded.add(dayName);
      const div = document.createElement("div");
      div.className = "forecast-day";
      div.innerHTML = `
        <div>${dayName}</div>
        <div>${getWeatherEmoji(item.weather[0].main)}</div>
        <div>${Math.round(item.main.temp)}°</div>
      `;
      forecastEl.appendChild(div);
    }
  }
}

/* GOOGLE CALENDAR (PUBLIC CALENDAR USING API KEY) */
let calendar;

async function loadCalendarEvents() {
  try {
    const calendarEl = document.getElementById("calendar");
    calendarEl.innerHTML = ""; // Clear previous calendar if any

    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      height: "100%",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek",
      },
      events: async function (info, successCallback, failureCallback) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
              CALENDAR_ID
            )}/events?timeMin=${encodeURIComponent(
              info.startStr
            )}&timeMax=${encodeURIComponent(
              info.endStr
            )}&showDeleted=false&singleEvents=true&orderBy=startTime&key=AIzaSyAtgoqgNiyVl4K1QPRPJsoDtlb8K2ByGIQ`
          );
          const data = await response.json();

          if (!response.ok) {
            console.error("Google Calendar API error:", data);
            throw new Error(
              data?.error?.message || "Failed to fetch calendar events"
            );
          }
          const events = (data.items || []).map((event) => {
            return {
              title: event.summary,
              start: event.start.dateTime || event.start.date,
              end: event.end.dateTime || event.end.date,
            };
          });
          successCallback(events);
        } catch (err) {
          console.error("Error fetching calendar events:", err);
          failureCallback(err);
        }
      },
    });

    calendar.render();
  } catch (err) {
    console.error("Error initializing calendar:", err);
  }
}

/* MAIN INITIALIZATION */
document.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);
  loadWeather();

  loadCalendarEvents();
});
