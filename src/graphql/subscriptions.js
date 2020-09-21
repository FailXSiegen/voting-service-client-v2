import gql from 'graphql-tag'

export const UPDATE_EVENT_USER_ACCESS_RIGHTS = gql`subscription{
  updateEventUserAccessRights {
    eventId
    eventUserId
    verified
    allowToVote
  }
}`

export const POLL_LIFE_CYCLE = gql`subscription {
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
