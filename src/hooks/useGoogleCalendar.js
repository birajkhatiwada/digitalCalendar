import { useState, useEffect, useRef, useCallback } from 'react'

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

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
  const [calendars, setCalendars] = useState({})
  const [authState, setAuthState] = useState('loading') // loading | no-client-id | signed-out | signed-in | error
  const tokenClientRef = useRef(null)

  const fetchEvents = useCallback(async () => {
    try {
      const calListRes = await window.gapi.client.calendar.calendarList.list()
      const calList = calListRes.result.items ?? []

      const calMap = {}
      calList.forEach(cal => {
        calMap[cal.id] = {
          name: cal.summary,
          color: cal.backgroundColor ?? '#7eb8f7',
        }
      })
      setCalendars(calMap)

      const now = new Date()
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59).toISOString()

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

  useEffect(() => {
    if (!clientId) {
      setAuthState('no-client-id')
      return
    }

    async function init() {
      await Promise.all([
        loadScript('https://apis.google.com/js/api.js').then(
          () => new Promise(resolve => {
            window.gapi.load('client', async () => {
              await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] })
              resolve()
            })
          })
        ),
        loadScript('https://accounts.google.com/gsi/client'),
      ])

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: async response => {
          if (response.error) { setAuthState('signed-out'); return }
          window.gapi.client.setToken({ access_token: response.access_token })
          setAuthState('signed-in')
          await fetchEvents()
        },
        error_callback: () => setAuthState('signed-out'),
      })

      // Attempt silent re-auth first
      tokenClientRef.current.requestAccessToken({ prompt: '' })
    }

    init()
  }, [clientId, fetchEvents])

  // Refresh events every 5 min
  useEffect(() => {
    if (authState !== 'signed-in') return
    const id = setInterval(fetchEvents, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [authState, fetchEvents])

  // Refresh token every 45 min (tokens expire after 60 min)
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

  const signOut = useCallback(() => {
    const token = window.gapi?.client.getToken()
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token)
      window.gapi.client.setToken(null)
    }
    setEvents([])
    setCalendars({})
    setAuthState('signed-out')
  }, [])

  return { events, calendars, authState, signIn, signOut, refetch: fetchEvents }
}
