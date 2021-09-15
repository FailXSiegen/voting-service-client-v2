
export const VideoConferenceType = {
  ZOOM: 1,
  findByValue (value) {
    for (const key in this) {
      if (this[key] === value) {
        return key
      }
    }
  }
}
