import gql from 'graphql-tag'

export function createEventMutation () {
  return gql`mutation CreateEvent($input: CreateEventInput!){
    createEvent(input: $input) {
      id
      createDatetime
      modifiedDatetime
      title
      slug
      description
      scheduledDatetime
      lobbyOpen
      active
    }
  }`
}
