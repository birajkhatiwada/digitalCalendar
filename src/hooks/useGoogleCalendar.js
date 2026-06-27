import { useState, useEffect, useRef, useCallback } from 'react'

const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest',
]
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
].join(' ')

function loadScript(src) {
  return new Promise(resolve => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    document.head.appendChild(s)
  })
}

export default function useGoogleCalendar(clientId) {
  const [events, setEvents] = useState([])
  const [tasks, setTasks] = useState([])
  const [calendars, setCalendars] = useState({})
  const [authState, setAuthState] = useState('loading')
  const tokenClientRef = useRef(null)

  const fetchEvents = useCallback(async () => {
    try {
      const calListRes = await window.gapi.client.calendar.calendarList.list()
      const calList = calListRes.result.items ?? []

      const calMap = {}
      calList.forEach(cal => {
        calMap[cal.id] = { name: cal.summary, color: cal.backgroundColor ?? '#7eb8f7' }
      })
      setCalendars(calMap)

      // Fetch from start of current month through 60 days ahead (covers grid + 7-day agenda)
      const now = new Date()
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 14).toISOString()

      const all = []
      await Promise.all(
        calList.map(async cal => {
          const res = await window.gapi.client.calendar.events.list({
            calendarId: cal.id,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 250,
          })
          ;(res.result.items ?? []).forEach(ev => {
            if (!ev.start) return
            all.push({
              id:         `${cal.id}::${ev.id}`,
              calendarId: cal.id,
              title:      ev.summary ?? '(No title)',
              start:      ev.start.dateTime ?? ev.start.date,
              end:        ev.end?.dateTime ?? ev.end?.date,
              allDay:     !ev.start.dateTime,
              color:      calMap[cal.id]?.color ?? '#7eb8f7',
            })
          })
        })
      )

      all.sort((a, b) => new Date(a.start) - new Date(b.start))
      setEvents(all)
    } catch (e) {
      console.error('Calendar fetch error:', e)
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    try {
      const listsRes = await window.gapi.client.tasks.tasklists.list({ maxResults: 20 })
      const lists = listsRes.result.items ?? []

      const all = []
      await Promise.all(
        lists.map(async list => {
          const res = await window.gapi.client.tasks.tasks.list({
            tasklist:      list.id,
            maxResults:    100,
            showCompleted: false,
            showHidden:    false,
          })
          ;(res.result.items ?? []).forEach(task => {
            if (!task.title) return
            all.push({
              id:       task.id,
              title:    task.title,
              due:      task.due ? task.due.substring(0, 10) : null,
              notes:    task.notes ?? null,
              listName: list.title,
              status:   task.status,
            })
          })
        })
      )

      // Sort: tasks with due dates first, then by due date
      all.sort((a, b) => {
        if (!a.due && !b.due) return 0
        if (!a.due) return 1
        if (!b.due) return -1
        return a.due.localeCompare(b.due)
      })

      setTasks(all)
    } catch (e) {
      console.error('Tasks fetch error:', e)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchEvents(), fetchTasks()])
  }, [fetchEvents, fetchTasks])

  useEffect(() => {
    if (!clientId) { setAuthState('no-client-id'); return }

    async function init() {
      await Promise.all([
        loadScript('https://apis.google.com/js/api.js').then(
          () => new Promise(resolve => {
            window.gapi.load('client', async () => {
              await window.gapi.client.init({ discoveryDocs: DISCOVERY_DOCS })
              resolve()
            })
          })
        ),
        loadScript('https://accounts.google.com/gsi/client'),
      ])

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:     SCOPES,
        callback:  async response => {
          if (response.error) { setAuthState('signed-out'); return }
          window.gapi.client.setToken({ access_token: response.access_token })
          setAuthState('signed-in')
          await fetchAll()
        },
        error_callback: () => setAuthState('signed-out'),
      })

      tokenClientRef.current.requestAccessToken({ prompt: '' })
    }

    init()
  }, [clientId, fetchAll])

  useEffect(() => {
    if (authState !== 'signed-in') return
    const id = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [authState, fetchAll])

  useEffect(() => {
    if (authState !== 'signed-in') return
    const id = setInterval(() => {
      tokenClientRef.current?.requestAccessToken({ prompt: '' })
    }, 45 * 60 * 1000)
    return () => clearInterval(id)
  }, [authState])

  const signIn = useCallback(() => {
    tokenClientRef.current?.requestAccessToken({ prompt: 'consent' })
  }, [])

  return { events, tasks, calendars, authState, signIn }
}
