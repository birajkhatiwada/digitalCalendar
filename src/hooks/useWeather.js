import { useState, useEffect } from 'react'

// Emeryville, CA
const LAT = 37.8308
const LON = -122.2944

const WMO = {
  0:  { label: 'Clear sky',       emoji: '☀️' },
  1:  { label: 'Mostly clear',    emoji: '🌤️' },
  2:  { label: 'Partly cloudy',   emoji: '⛅' },
  3:  { label: 'Overcast',        emoji: '☁️' },
  45: { label: 'Foggy',           emoji: '🌫️' },
  48: { label: 'Icy fog',         emoji: '🌫️' },
  51: { label: 'Light drizzle',   emoji: '🌦️' },
  53: { label: 'Drizzle',         emoji: '🌦️' },
  55: { label: 'Heavy drizzle',   emoji: '🌧️' },
  61: { label: 'Light rain',      emoji: '🌧️' },
  63: { label: 'Rain',            emoji: '🌧️' },
  65: { label: 'Heavy rain',      emoji: '🌧️' },
  71: { label: 'Light snow',      emoji: '🌨️' },
  73: { label: 'Snow',            emoji: '❄️' },
  75: { label: 'Heavy snow',      emoji: '❄️' },
  80: { label: 'Showers',         emoji: '🌦️' },
  81: { label: 'Showers',         emoji: '🌧️' },
  82: { label: 'Heavy showers',   emoji: '⛈️' },
  95: { label: 'Thunderstorm',    emoji: '⛈️' },
  96: { label: 'Thunderstorm',    emoji: '⛈️' },
  99: { label: 'Thunderstorm',    emoji: '⛈️' },
}

function wmo(code) {
  return WMO[code] ?? { label: 'Cloudy', emoji: '🌡️' }
}

export default function useWeather() {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [error, setError] = useState(null)

  async function fetchWeather() {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${LAT}&longitude=${LON}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Los_Angeles&forecast_days=7`
      )
      const data = await res.json()
      const cur = data.current

      setWeather({
        temp:     Math.round(cur.temperature_2m),
        feels:    Math.round(cur.apparent_temperature),
        humidity: cur.relative_humidity_2m,
        wind:     Math.round(cur.wind_speed_10m),
        ...wmo(cur.weather_code),
      })

      setForecast(
        data.daily.time.map((date, i) => ({
          date,
          high:   Math.round(data.daily.temperature_2m_max[i]),
          low:    Math.round(data.daily.temperature_2m_min[i]),
          rain:   data.daily.precipitation_probability_max[i],
          ...wmo(data.daily.weather_code[i]),
        }))
      )
    } catch {
      setError('Weather unavailable')
    }
  }

  useEffect(() => {
    fetchWeather()
    const id = setInterval(fetchWeather, 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return { weather, forecast, error }
}
