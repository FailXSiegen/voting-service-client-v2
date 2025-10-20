import { gql } from "graphql-tag";

export const EVENT_USERS = gql`
  query eventUsers($eventId: ID) {
    eventUsers(eventId: $eventId) {
      id
      eventId
      publicName
      verified
      allowToVote
      online
      username
      voteAmount
      createDatetime
      pollHints
    }
  }
`;
