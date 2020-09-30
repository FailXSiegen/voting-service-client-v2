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
    voteAmount
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
export const ACTIVE_POLL = gql`
  query findActivePoll($eventId: ID) {
    activePoll(eventId: $eventId) {
      id
      title
      maxVotes
      answerCount
    }
  }
`

export const POLLS_RESULTS = gql`
  query pollResult($eventId: ID, $page: Int, $pageSize: Int) {
    pollResult(eventId: $eventId, page: $page, pageSize: $pageSize) {
      id
      type
      maxVotes
      createDatetime
      poll {
        title
      }
      pollAnswer {
        id
        answerContent
        pollResultId
        pollUserId
      }
      pollUser {
        id
        publicName
      }
    }
  }
`
