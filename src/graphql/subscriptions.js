import gql from 'graphql-tag'

export const UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION = gql`subscription{
  updateEventUserAccessRights {
    eventId
    eventUserId
    verified
    allowToVote
  }
}`

export const POLL_LIFE_CYCLE_SUBSCRIPTION = gql`subscription {
  pollLifeCycle {
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
  }
}
`

export const NEW_EVENT_USER_SUBSCRIPTION = gql`subscription{
  newEventUser{
    eventId
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
