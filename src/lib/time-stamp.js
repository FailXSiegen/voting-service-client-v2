export function getCurrentUnixTimeStamp () {
  return Math.floor(Date.now() / 1000)
}

export function createFormattedDateFromTimeStamp (unixTimeStamp) {
  const datestamp = new Date(unixTimeStamp * 1000)
  const year = datestamp.getFullYear()
  const month = datestamp.getMonth() < 9 ? '0' + (datestamp.getMonth() + 1) : (datestamp.getMonth() + 1)
  const date = datestamp.getDate() < 10 ? '0' + datestamp.getDate() : datestamp.getDate()
  const hour = datestamp.getHours() < 10 ? '0' + datestamp.getHours() : datestamp.getHours()
  const min = datestamp.getMinutes() < 10 ? '0' + datestamp.getMinutes() : datestamp.getMinutes()
  return `${date}.${month}.${year}, ${hour}:${min}`
}

export function convertUnixTimeStampForDatetimeLocaleInput (unixTimeStamp) {
  const datestamp = new Date(unixTimeStamp * 1000)
  const year = datestamp.getFullYear()
  const month = datestamp.getMonth() < 9 ? '0' + (datestamp.getMonth() + 1) : (datestamp.getMonth() + 1)
  const date = datestamp.getDate() < 10 ? '0' + datestamp.getDate() : datestamp.getDate()
  const hour = datestamp.getHours() < 10 ? '0' + datestamp.getHours() : datestamp.getHours()
  const min = datestamp.getMinutes() < 10 ? '0' + datestamp.getMinutes() : datestamp.getMinutes()
  return `${year}-${month}-${date}T${hour}:${min}`
}
