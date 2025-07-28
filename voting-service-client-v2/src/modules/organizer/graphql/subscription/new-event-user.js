import { gql } from "graphql-tag";

export const NEW_EVENT_USER = gql`
  subscription NewEventUser($eventId: ID!) {
    newEventUser(eventId: $eventId) {
      eventId
      id
      publicName
      verified
      allowToVote
      online
      username
      voteAmount
      createDatetime
    }
  }
`;
