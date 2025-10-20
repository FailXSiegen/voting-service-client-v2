export function getCurrentUnixTimeStamp() {
  return Math.floor(Date.now() / 1000);
}

export function createFormattedDateFromTimeStamp(unixTimeStamp) {
  const date = new Date(unixTimeStamp * 1000);
  const year = date.getFullYear();
  const month =
    date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
  const day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  const hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  const min =
    date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
  return `${day}.${month}.${year}, ${hour}:${min}`;
}

export function convertUnixTimeStampForDatetimeLocaleInput(unixTimeStamp) {
  const date = new Date(unixTimeStamp * 1000);
  const year = date.getFullYear();
  const month =
    date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
  const day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  const hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  const min =
    date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
  return `${day}.${month}.${year}, ${hour}:${min}`;
}

export function convertTimeStampToDateString(unixTimeStamp) {
  const date = new Date(unixTimeStamp * 1000);
  const year = date.getFullYear();
  const month =
    date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
  const day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();

  return `${day}.${month}.${year}`;
}

export function convertTimeStampToTimeString(unixTimeStamp) {
  const datestamp = new Date(unixTimeStamp * 1000);
  const hour =
    datestamp.getHours() < 10
      ? "0" + datestamp.getHours()
      : datestamp.getHours();
  const min =
    datestamp.getMinutes() < 10
      ? "0" + datestamp.getMinutes()
      : datestamp.getMinutes();
  return `${hour}:${min}`;
}
