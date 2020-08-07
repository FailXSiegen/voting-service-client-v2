export function range (start, end) {
  if (start >= end) {
    throw new Error(
      'start must be greater than end! given (' + start + ' -> ' + end + ')'
    )
  }
  const result = []
  for (let i = start; i < end; ++i) {
    result.push(i)
  }
  return result
}
