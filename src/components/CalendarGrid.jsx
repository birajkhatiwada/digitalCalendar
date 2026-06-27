import { useState } from 'react'
import styles from './CalendarGrid.module.css'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function CalendarGrid({ events, selectedDate, onSelectDate }) {
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const { year, month } = view

  const firstDay   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()
  const total       = Math.ceil((firstDay + daysInMonth) / 7) * 7

  // Index events by date string
  const eventsByDay = {}
  events.forEach(ev => {
    const key = ev.start.substring(0, 10)
    if (!eventsByDay[key]) eventsByDay[key] = []
    eventsByDay[key].push(ev)
  })

  function prevMonth() {
    setView(v => v.month === 0
      ? { year: v.year - 1, month: 11 }
      : { ...v, month: v.month - 1 }
    )
  }
  function nextMonth() {
    setView(v => v.month === 11
      ? { year: v.year + 1, month: 0 }
      : { ...v, month: v.month + 1 }
    )
  }
  function goToday() {
    const n = new Date()
    setView({ year: n.getFullYear(), month: n.getMonth() })
    onSelectDate(n)
  }

  const cells = Array.from({ length: total }, (_, i) => {
    let day, m, y, otherMonth = false
    if (i < firstDay) {
      day = daysInPrev - firstDay + i + 1
      m = month - 1; y = year
      if (m < 0) { m = 11; y-- }
      otherMonth = true
    } else if (i >= firstDay + daysInMonth) {
      day = i - firstDay - daysInMonth + 1
      m = month + 1; y = year
      if (m > 11) { m = 0; y++ }
      otherMonth = true
    } else {
      day = i - firstDay + 1
      m = month; y = year
    }
    const date   = new Date(y, m, day)
    const key    = dateKey(date)
    const dayEvs = eventsByDay[key] ?? []
    return { date, day, otherMonth, key, events: dayEvs }
  })

  return (
    <div className={styles.grid}>
      <div className={styles.header}>
        <span className={styles.monthLabel}>{MONTHS[month]} {year}</span>
        <div className={styles.nav}>
          <button onClick={goToday} className={styles.todayBtn}>Today</button>
          <button onClick={prevMonth} className={styles.navBtn}>‹</button>
          <button onClick={nextMonth} className={styles.navBtn}>›</button>
        </div>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map(d => <div key={d} className={styles.weekday}>{d}</div>)}
      </div>

      <div className={styles.days}>
        {cells.map(({ date, day, otherMonth, key, events: dayEvs }) => {
          const isToday    = sameDay(date, today)
          const isSelected = selectedDate && sameDay(date, selectedDate)
          return (
            <div
              key={key}
              className={[
                styles.day,
                otherMonth ? styles.other : '',
                isToday    ? styles.today : '',
                isSelected ? styles.selected : '',
              ].join(' ')}
              onClick={() => onSelectDate(date)}
            >
              <span className={styles.dayNum}>{day}</span>
              <div className={styles.chips}>
                {dayEvs.slice(0, 3).map((ev, i) => (
                  <div
                    key={i}
                    className={styles.chip}
                    style={{ background: ev.color + '28', color: ev.color }}
                    title={ev.title}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvs.length > 3 && (
                  <div className={styles.more}>+{dayEvs.length - 3}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
