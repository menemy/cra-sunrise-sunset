import React, { useEffect, useRef } from 'react'
import { calcGradient } from './utils'
import styles from './App.module.css'

// eslint-disable-next-line react/prop-types
export function Bar({ data, prevData, animateMs }) {
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

  const requestRef = useRef()
  const previousTimeRef = useRef()
  const startedTimeRef = useRef()

  const callback = (deltaTime) => {
    setPercent((prevPercent) =>
      Math.max(0, prevPercent - deltaTime / animateMs),
    )
  }

  const animate = (time) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current
      callback(deltaTime)
    }
    previousTimeRef.current = time
    if (time - startedTimeRef.current < animateMs) {
      requestRef.current = requestAnimationFrame(animate)
    }
  }

  useEffect(() => {
    setPercent(1)
    startedTimeRef.current = performance.now()
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [data, prevData])

  // Scale for mobile
  const scale = Math.min((window.screen.width - 60) / 1440, 1)
  return (
    /* eslint-disable camelcase */
    <div
      className={styles.bar}
      style={{
        width: scale * 1440,
        background:
          `linear-gradient(90deg, #1F0E4E ${
            scale * civil_twilight_begin_minutes
          }px,` +
          ` #00D0F0 ${scale * sunrise_minutes}px,#00D0F0 ${
            scale * sunset_minutes
          }px, #1F0E4E ${scale * civil_twilight_end_minutes}px)`,
      }}
    />
    /* eslint-enable camelcase */
  )
}
