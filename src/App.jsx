import React, { useState, useEffect, useRef } from 'react'
import styles from './App.module.css'

const getPositionPromise = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })

const API_BASE = 'https://api.sunrise-sunset.org/json'

const formatDayInterval = (days) => encodeURIComponent(`${days} day`)
const displayDate = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

const formatInterval = (seconds) => {
  if (!seconds) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}:${minutes}`
}
const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(Date.parse(dateString))
  const hour = date.getHours()
  const minute = date.getMinutes()
  const hourFormatted = hour < 10 ? `0${hour}` : hour
  const minuteFormatted = minute < 10 ? `0${minute}` : minute
  return `${hourFormatted}:${minuteFormatted}`
}
const parseMinutes = (dateString) => {
  const date = new Date(Date.parse(dateString))
  const minutes = date.getMinutes()
  const hours = date.getHours()
  return 60 * hours + minutes
}
const parseMinutesBetween = (firstDateString, secondDateString) => {
  const firstDate = new Date(Date.parse(firstDateString))
  const secondDate = new Date(Date.parse(secondDateString))
  const diff = secondDate - firstDate
  return Math.round(diff / 1000 / 60)
}
const calcGradient = (data) => {
  if (!data || typeof data.status === 'undefined') {
    // initial animation
    return {
      civil_twilight_begin_minutes: 740,
      sunrise_minutes: 740,
      sunset_minutes: 740,
      civil_twilight_end_minutes: 740,
    }
  }
  /* eslint-disable camelcase */

  const {
    results: { sunrise, sunset, civil_twilight_begin, civil_twilight_end },
  } = data
  // It is possible that ending will be on next day
  const civil_twilight_begin_minutes = parseMinutes(civil_twilight_begin)
  const sunrise_minutes =
    civil_twilight_begin_minutes +
    parseMinutesBetween(civil_twilight_begin, sunrise)
  const sunset_minutes =
    civil_twilight_begin_minutes +
    parseMinutesBetween(civil_twilight_begin, sunset)
  const civil_twilight_end_minutes =
    civil_twilight_begin_minutes +
    parseMinutesBetween(civil_twilight_begin, civil_twilight_end)

  return {
    civil_twilight_begin_minutes,
    sunrise_minutes,
    sunset_minutes,
    civil_twilight_end_minutes,
  }
  /* eslint-enable camelcase */
}

// eslint-disable-next-line react/prop-types
function Gradient({ data, prevData }) {
  const currObj = calcGradient(data)
  const prevObj = calcGradient(prevData)

  const [percent, setPercent] = React.useState(1)

  /* eslint-disable camelcase */
  const civil_twilight_begin_minutes = Math.round(
    currObj.civil_twilight_begin_minutes -
      (currObj.civil_twilight_begin_minutes -
        prevObj.civil_twilight_begin_minutes) *
        percent,
  )
  const sunrise_minutes = Math.round(
    currObj.sunrise_minutes -
      (currObj.sunrise_minutes - prevObj.sunrise_minutes) * percent,
  )
  const sunset_minutes = Math.round(
    currObj.sunset_minutes -
      (currObj.sunset_minutes - prevObj.sunset_minutes) * percent,
  )
  const civil_twilight_end_minutes = Math.round(
    currObj.civil_twilight_end_minutes -
      (currObj.civil_twilight_end_minutes -
        prevObj.civil_twilight_end_minutes) *
        percent,
  )
  /* eslint-enable camelcase */

  const ANIMATION_LENGTH_MS = 700

  const requestRef = useRef()
  const previousTimeRef = useRef()
  const startedTimeRef = useRef()

  const callback = (deltaTime) => {
    setPercent((prevPercent) =>
      Math.max(0, prevPercent - deltaTime / ANIMATION_LENGTH_MS),
    )
  }

  const animate = (time) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current
      callback(deltaTime)
    }
    previousTimeRef.current = time
    if (time - startedTimeRef.current < ANIMATION_LENGTH_MS) {
      requestRef.current = requestAnimationFrame(animate)
    }
  }

  useEffect(() => {
    setPercent(1)
    startedTimeRef.current = performance.now()
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [data, prevData])

  return (
    /* eslint-disable camelcase */
    <div
      className={styles.bar}
      style={{
        width: 1440,
        background:
          `linear-gradient(90deg, #1F0E4E ${civil_twilight_begin_minutes}px,` +
          ` #00D0F0 ${sunrise_minutes}px,#00D0F0 ${sunset_minutes}px, #1F0E4E ${civil_twilight_end_minutes}px)`,
      }}
    />
    /* eslint-enable camelcase */
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState({ results: {} })
  const [error, setError] = useState('')
  const [days, setDays] = useState(0)

  const ref = useRef()

  useEffect(() => {
    ref.current = data
    async function fetchData() {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser')
      } else {
        setIsLoading(true)
        try {
          const {
            coords: { latitude, longitude },
          } = await getPositionPromise()
          const fetcher = await fetch(
            `${API_BASE}?lat=${encodeURIComponent(latitude)}` +
              `&lng=${encodeURIComponent(longitude)}&date=${formatDayInterval(
                days,
              )}&formatted=0`,
          )
          const response = await fetcher.json()
          const { status } = response
          if (status === 'OK') {
            setData(response)
          } else {
            setError(status)
          }
        } catch (exception) {
          setError(exception.message)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchData()
  }, [days])

  const {
    // eslint-disable-next-line camelcase
    results: { sunrise, sunset, day_length },
  } = data

  // Get the previous data (was passed into hook on last render)
  const prevData = ref.current
  return (
    <div className={styles.app}>
      {error ? (
        <div>{error}</div>
      ) : (
        <div className={styles.pre}>
          <div>
            <p className={styles.header}>{displayDate(days)}</p>
            <p>
              <strong>Sunrise:</strong> {formatTime(sunrise)}
              <br />
              <strong>Sunset:</strong> {formatTime(sunset)}
              <br />
              <strong>Length:</strong> {formatInterval(day_length)}
              <br />
            </p>
            <button
              type="button"
              className={styles.button}
              onClick={() => setDays((currDays) => currDays - 7)}
            >
              -7 days
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => setDays((currDays) => currDays - 1)}
            >
              -1 day
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => setDays((currDays) => currDays + 1)}
            >
              +1 day
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => setDays((currDays) => currDays + 7)}
            >
              +7 days
            </button>
            <Gradient data={data} prevData={prevData} />
            <p>{isLoading ? '⌛' : ''}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
