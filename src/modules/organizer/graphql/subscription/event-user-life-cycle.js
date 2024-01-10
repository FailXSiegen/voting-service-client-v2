import gql from "graphql-tag";

export const EVENT_USER_LIFE_CYCLE = gql`
  subscription {
    eventUserLifeCycle {
      eventUserId
      online
    }
  }
`;
