export function jwtDecode (token) {
  const result = {}
  result.raw = token
  result.header = JSON.parse(window.atob(token.split('.')[0]))
  result.payload = JSON.parse(window.atob(token.split('.')[1]))
  return (result)
}
