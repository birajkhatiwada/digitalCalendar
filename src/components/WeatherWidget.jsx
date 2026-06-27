import useWeather from '../hooks/useWeather'
import styles from './WeatherWidget.module.css'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeatherWidget() {
  const { weather, forecast, error } = useWeather()

  if (error) return <div className={styles.widget}><span className={styles.error}>{error}</span></div>
  if (!weather) return <div className={styles.widget}><span className={styles.loading}>Loading weather…</span></div>

  const todayStr = new Date().toDateString()

  return (
    <div className={styles.widget}>
      <div className={styles.current}>
        <span className={styles.emoji}>{weather.emoji}</span>
        <div className={styles.info}>
          <span className={styles.temp}>{weather.temp}°F</span>
          <span className={styles.label}>{weather.label}</span>
          <span className={styles.meta}>
            Feels {weather.feels}° · {weather.humidity}% humidity · {weather.wind} mph
          </span>
        </div>
        <span className={styles.location}>Emeryville, CA</span>
      </div>

      <div className={styles.forecast}>
        {forecast.map(day => {
          const d = new Date(day.date + 'T12:00:00')
          const isToday = d.toDateString() === todayStr
          return (
            <div key={day.date} className={`${styles.forecastDay} ${isToday ? styles.today : ''}`}>
              <span className={styles.fcName}>{isToday ? 'Today' : DAY_SHORT[d.getDay()]}</span>
              <span className={styles.fcEmoji}>{day.emoji}</span>
              <span className={styles.fcHigh}>{day.high}°</span>
              <span className={styles.fcLow}>{day.low}°</span>
              {day.rain > 20 && <span className={styles.fcRain}>💧{day.rain}%</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
