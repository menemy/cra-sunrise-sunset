export const formatDayIntervalParam = (days) =>
  encodeURIComponent(`${days} day`)
export const formatDate = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}
export const formatInterval = (seconds) => {
  if (!seconds) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const minuteFormatted = minutes < 10 ? `0${minutes}` : minutes
  return `${hours}:${minuteFormatted}`
}
export const formatTime = (dateString) => {
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
export const calcGradient = (data) => {
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
export const getPositionPromise = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
