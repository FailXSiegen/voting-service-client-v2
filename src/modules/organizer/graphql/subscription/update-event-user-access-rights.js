import gql from "graphql-tag";

export const UPDATE_EVENT_USER_ACCESS_RIGHTS = gql`
  subscription ($eventUserId: ID) {
    updateEventUserAccessRights(eventUserId: $eventUserId) {
      eventId
      eventUserId
      verified
      allowToVote
      voteAmount
    }
  }
`;
