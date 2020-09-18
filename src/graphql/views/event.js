import gql from 'graphql-tag'

export function createEventMutation () {
  return gql`mutation CreateEvent($input: CreateEventInput!){
    createEvent(input: $input) {
      id
      createDatetime
      title
      slug
      description
      scheduledDatetime
      lobbyOpen
      active
    }
  }`
}

export function updateEventMutation () {
  return gql`mutation UpdateEvent($input: UpdateEventInput!){
    updateEvent(input: $input) {
      id
      title
      slug
      description
      scheduledDatetime
      lobbyOpen
      active
    }
  }`
}
