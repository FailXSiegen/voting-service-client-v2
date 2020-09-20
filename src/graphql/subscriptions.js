import gql from 'graphql-tag'

export const UPDATE_EVENT_USER_ACCESS_RIGHTS = gql`subscription{
  updateEventUserAccessRights {
    eventUserId
    verified
    allowToVote
  }
}`
