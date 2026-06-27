import { useState, useEffect } from 'react'
import styles from './AgendaPanel.module.css'

function fmtTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function fmtCountdown(ms) {
  const totalMins = Math.floor(ms / 60000)
  const hours = Math.floor(totalMins / 60)
  const mins  = totalMins % 60
  if (hours === 0) return `${mins}m`
  if (mins  === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function fmtDue(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date - today) / 86400000)
  if (diff < 0)  return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7)  return date.toLocaleDateString('en-US', { weekday: 'short' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildDayGroups(events, now) {
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(todayStart)
    day.setDate(todayStart.getDate() + i)
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)

    const dayEvents = events.filter(e => {
      const start = new Date(e.start)
      return start >= day && start <= dayEnd
    })

    let label
    if (i === 0)      label = 'Today'
    else if (i === 1) label = 'Tomorrow'
    else              label = day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

    return { label, events: dayEvents }
  })
}

function EventRow({ ev, calendars }) {
  const calName = calendars[ev.calendarId]?.name
  return (
    <div className={styles.event}>
      <span className={styles.dot} style={{ background: ev.color }} />
      <div className={styles.eventBody}>
        <span className={styles.eventTitle}>{ev.title}</span>
        <span className={styles.eventMeta}>
          {ev.allDay ? 'All day' : fmtTime(ev.start)}
          {calName && <span className={styles.calBadge} style={{ borderColor: ev.color, color: ev.color }}>{calName}</span>}
        </span>
      </div>
    </div>
  )
}

export default function AgendaPanel({ events, tasks, calendars, authState, onSignIn }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  if (authState === 'loading') {
    return <div className={styles.panel}><p className={styles.status}>Connecting…</p></div>
  }

  if (authState === 'no-client-id') {
    return (
      <div className={styles.panel}>
        <p className={styles.status}>No Google Client ID set.</p>
        <p className={styles.hint}>Add <code>VITE_GOOGLE_CLIENT_ID</code> to your <code>.env</code> file and restart.</p>
      </div>
    )
  }

  if (authState === 'signed-out') {
    return (
      <div className={styles.panel}>
        <p className={styles.status}>Connect a mouse and sign in to get started.</p>
        <button className={styles.signInBtn} onClick={onSignIn}>Sign in with Google</button>
      </div>
    )
  }

  // Events happening right now
  const currentEvents = events.filter(e =>
    !e.allDay &&
    new Date(e.start) <= now &&
    new Date(e.end ?? e.start) >= now
  )

  // Next upcoming event
  const nextEvent = events.find(e => !e.allDay && new Date(e.start) > now)
  const nextMs    = nextEvent ? new Date(nextEvent.start) - now : null

  const dayGroups = buildDayGroups(events, now)

  return (
    <div className={styles.panel}>

      {/* Currently happening */}
      {currentEvents.length > 0 && (
        <div className={styles.nowSection}>
          <div className={styles.nowLabel}>Happening now</div>
          {currentEvents.map(ev => <EventRow key={ev.id} ev={ev} calendars={calendars} />)}
        </div>
      )}

      {/* Next event countdown */}
      {nextEvent && (
        <div className={styles.countdown}>
          <span className={styles.countdownLabel}>Next up</span>
          <span className={styles.countdownEvent}>{nextEvent.title}</span>
          <span className={styles.countdownTime}>in {fmtCountdown(nextMs)}</span>
        </div>
      )}

      {/* 7-day agenda */}
      {dayGroups.map(group => (
        <div key={group.label} className={styles.group}>
          <div className={styles.groupLabel}>{group.label}</div>
          {group.events.length === 0
            ? <div className={styles.empty}>No events</div>
            : group.events.map(ev => <EventRow key={ev.id} ev={ev} calendars={calendars} />)
          }
        </div>
      ))}

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className={styles.tasksSection}>
          <div className={styles.tasksSectionLabel}>Tasks</div>
          {tasks.map(task => (
            <div key={task.id} className={styles.task}>
              <span className={styles.taskBullet} />
              <div className={styles.taskBody}>
                <span className={styles.taskTitle}>{task.title}</span>
                <span className={styles.taskMeta}>
                  {task.listName}
                  {task.due && (
                    <span className={`${styles.taskDue} ${task.due < new Date().toISOString().substring(0,10) ? styles.overdue : ''}`}>
                      · {fmtDue(task.due)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
