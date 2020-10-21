import gql from 'graphql-tag'

export const EVENT_USER_BY_ID = gql`query FindEventUserById($id: ID!) {
  eventUser(id: $id) {
    id
    eventId
    publicName
    verified
    allowToVote
    online
    username
    voteAmount
  }
}`

export const ACTIVE_POLL_EVENT_USER = gql`
  query findActivePollEventUser($eventId: ID) {
    activePollEventUser(eventId: $eventId) {
      state
      poll {
        id
        title
        type
        possibleAnswers {
          id
          content
        }
        minVotes
        maxVotes
        allowAbstain
      }
      pollUser {
        id
        eventUserId
      }
      pollResultId
      pollUserVoted {
        id
        eventUserId
        pollResultId
      }
    }
  }
`
