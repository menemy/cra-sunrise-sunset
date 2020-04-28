import React, { useEffect, useRef, useState } from 'react'
import styles from './App.module.css'
import {
  formatDate,
  formatDayIntervalParam,
  formatInterval,
  formatTime,
  getPositionPromise,
} from './utils'
import { Bar } from './Bar'

const API_BASE = 'https://api.sunrise-sunset.org/json'
const ANIMATION_LENGTH_MS = 700

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
              `&lng=${encodeURIComponent(
                longitude,
              )}&date=${formatDayIntervalParam(days)}&formatted=0`,
          )
          const response = await fetcher.json()
          const { status } = response
          if (status === 'OK') {
            setData(response)
          } else {
            setError(status)
          }
        } catch (exception) {
          if (exception.toString() === '[object GeolocationPositionError]') {
            setError(`GeolocationPositionError, code=${ exception.code}`)
          } else {
            setError(exception.message)
          }
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
        <h1 className={styles.error}>{error}</h1>
      ) : (
        <div className={styles.pre}>
          <div>
            <p className={styles.header}>{formatDate(days)}</p>
            <p>
              <strong>Sunrise:</strong> {formatTime(sunrise)}
              <br />
              <strong>Sunset:</strong> {formatTime(sunset)}
              <br />
              <strong>Length:</strong> {formatInterval(day_length)}
              <br />
            </p>
            <button
              disabled={!!isLoading}
              type="button"
              className={styles.button}
              onClick={() => setDays((currDays) => currDays - 7)}
            >
              -7 days
            </button>
            <button
              disabled={!!isLoading}
              type="button"
              className={styles.button}
              onClick={() => setDays((currDays) => currDays - 1)}
            >
              -1 day
            </button>
            <button
              disabled={!!isLoading}
              type="button"
              className={styles.button}
              onClick={() => setDays((currDays) => currDays + 1)}
            >
              +1 day
            </button>
            <button
              disabled={!!isLoading}
              type="button"
              className={styles.button}
              onClick={() => setDays((currDays) => currDays + 7)}
            >
              +7 days
            </button>
            <Bar
              data={data}
              prevData={prevData}
              animateMs={ANIMATION_LENGTH_MS}
            />
            <p>{isLoading ? '⌛' : ''}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
