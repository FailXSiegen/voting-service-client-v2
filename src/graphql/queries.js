import gql from 'graphql-tag'

export const UPCOMING_EVENTS = gql`
  query upcomingEvents($organizerId: ID) {
     upcomingEvents(organizerId: $organizerId) {
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
  }
`

export const EXPIRED_EVENTS = gql`
  query expiredEvents($organizerId: ID) {
     expiredEvents(organizerId: $organizerId) {
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
  }
`

export const EVENT_USERS_BY_EVENT = gql`
  query findEventUserByEvent($eventId: ID) {
    eventUsers(eventId: $eventId) {
      id
      publicName
      verified
      allowToVote
      online
      username
      voteAmount
    }
  }
`

export const EVENT_USER_BY_ID = gql`query FindEventUserById($id: ID!) {
  eventUser(id: $id) {
    id
    publicName
    verified
    allowToVote
    online
    username
  }
}`

export const POLLS_NO_RESULTS = gql`
  query findPollsWithNoResults($eventId: ID) {
    pollsWithNoResults(eventId: $eventId) {
      id
      title
    }
  }
`
