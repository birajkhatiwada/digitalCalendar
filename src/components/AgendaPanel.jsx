import styles from './AgendaPanel.module.css'

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function fmtTime(dateStr, allDay) {
  if (allDay) return 'All day'
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function buildGroups(events, selectedDate) {
  const today    = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isCustom = selectedDate &&
    !sameDay(selectedDate, today) &&
    !sameDay(selectedDate, tomorrow)

  const groups = []

  if (isCustom) {
    groups.push({
      label: selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      events: events.filter(e => sameDay(new Date(e.start), selectedDate)),
    })
  }

  groups.push({
    label:  'Today',
    events: events.filter(e => sameDay(new Date(e.start), today)),
  })
  groups.push({
    label:  'Tomorrow',
    events: events.filter(e => sameDay(new Date(e.start), tomorrow)),
  })

  return groups
}

export default function AgendaPanel({ events, authState, onSignIn, onSignOut, selectedDate }) {
  if (authState === 'loading') {
    return (
      <div className={styles.panel}>
        <p className={styles.status}>Connecting to Google Calendar…</p>
      </div>
    )
  }

  if (authState === 'no-client-id') {
    return (
      <div className={styles.panel}>
        <p className={styles.status}>No Google Client ID set.</p>
        <p className={styles.hint}>
          Copy <code>.env.example</code> to <code>.env</code> and add your
          <code>VITE_GOOGLE_CLIENT_ID</code>, then restart the dev server.
        </p>
      </div>
    )
  }

  if (authState === 'signed-out') {
    return (
      <div className={styles.panel}>
        <p className={styles.status}>Sign in to see your calendar events.</p>
        <button className={styles.signInBtn} onClick={onSignIn}>
          Sign in with Google
        </button>
      </div>
    )
  }

  const groups = buildGroups(events, selectedDate)

  return (
    <div className={styles.panel}>
      {groups.map(group => (
        <div key={group.label} className={styles.group}>
          <div className={styles.groupLabel}>{group.label}</div>
          {group.events.length === 0
            ? <div className={styles.empty}>No events</div>
            : group.events.map(ev => (
                <div key={ev.id} className={styles.event}>
                  <span className={styles.dot} style={{ background: ev.color }} />
                  <div className={styles.eventBody}>
                    <span className={styles.eventTitle}>{ev.title}</span>
                    <span className={styles.eventTime}>{fmtTime(ev.start, ev.allDay)}</span>
                  </div>
                </div>
              ))
          }
        </div>
      ))}

      <button className={styles.signOutBtn} onClick={onSignOut}>Sign out</button>
    </div>
  )
}
