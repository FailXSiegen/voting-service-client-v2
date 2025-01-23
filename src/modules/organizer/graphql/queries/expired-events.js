import { gql } from "graphql-tag";

export const EXPIRED_EVENTS = gql`
  query expiredEvents($organizerId: ID!) {
    expiredEvents(organizerId: $organizerId) {
      id
      createDatetime
      modifiedDatetime
      title
      slug
      description
      scheduledDatetime
      lobbyOpen
      active
      async
      allowMagicLink
      finished
      endDatetime
    }
  }
`;
