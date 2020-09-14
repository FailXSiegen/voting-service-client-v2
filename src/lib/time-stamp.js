export function getCurrentUnixTimeStamp () {
  return Math.floor(Date.now() / 1000)
}

export function createFormattedDateFromTimeStamp (unixTimeStamp) {
  const datestamp = new Date(unixTimeStamp * 1000)
  const months = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember']
  const year = datestamp.getFullYear()
  const month = months[datestamp.getMonth()]
  const date = datestamp.getDate()
  const hour = datestamp.getHours()
  const min = datestamp.getMinutes() < 10 ? '0' + datestamp.getMinutes() : datestamp.getMinutes()
  return `${date}. ${month} ${year}, ${hour}:${min}`
}
