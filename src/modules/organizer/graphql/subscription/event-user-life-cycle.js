import gql from "graphql-tag";

export const EVENT_USER_LIFE_CYCLE = gql`
  subscription ($eventId: ID) {
    eventUserLifeCycle(eventId: $eventId) {
      eventUserId
      online
      eventId
    }
  }
`;
