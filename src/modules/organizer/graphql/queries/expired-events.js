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
      styles
      scheduledDatetime
      lobbyOpen
      active
      async
      allowMagicLink
      publicVoteVisible
      finished
      endDatetime
    }
  }
`;
