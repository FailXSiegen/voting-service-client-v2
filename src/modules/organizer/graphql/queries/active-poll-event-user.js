import { gql } from "graphql-tag";

export const ACTIVE_POLL_EVENT_USER = gql`
  query activePollEventUser($eventId: ID) {
    activePollEventUser(eventId: $eventId) {
      pollUser {
        id
        eventUserId
        publicName
      }
      pollUserVoted {
        id
        eventUserId
        publicName
        pollResultId
      }
    }
  }
`;
