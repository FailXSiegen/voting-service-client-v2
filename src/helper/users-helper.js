export function getVerifiedUsers (users) {
  return users.filter(user => user.verified)
}

export function getPendingUsers (users) {
  return users.filter(user => !user.verified)
}
