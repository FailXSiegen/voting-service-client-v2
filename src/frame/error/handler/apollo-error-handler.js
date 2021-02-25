import { addDangerMessage } from '@/frame/lib/alert-helper'
import { onResetLocalStorage } from '@/vue-apollo'

export function handleGraphQlErrors (error) {
  if (!error.graphQLErrors) {
    return
  }
  for (const graphQLError of error.graphQLErrors) {
    console.error(graphQLError.message)
    onResetLocalStorage()
    const message = 'Oops an error occurred!' // @TODO: Add error headline based on error type
    addDangerMessage(
      'Error', // @TODO: Add error headline based on error type
      process.env.VUE_APP_SHOW_ERRORS === '1' ? graphQLError.message : message
    )
  }
}
