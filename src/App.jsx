import { useState } from 'react'
import CalendarGrid from './components/CalendarGrid'
import AgendaPanel from './components/AgendaPanel'
import Clock from './components/Clock'
import WeatherWidget from './components/WeatherWidget'
import useGoogleCalendar from './hooks/useGoogleCalendar'
import styles from './App.module.css'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { events, tasks, calendars, authState, signIn } = useGoogleCalendar(CLIENT_ID)

  return (
    <div className={styles.app}>
      <div className={styles.left}>
        <CalendarGrid
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      <div className={styles.right}>
        <Clock />
        <WeatherWidget />
        <AgendaPanel
          events={events}
          tasks={tasks}
          calendars={calendars}
          authState={authState}
          onSignIn={signIn}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  )
}
