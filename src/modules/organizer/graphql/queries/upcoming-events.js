import { gql } from "graphql-tag";

export const UPCOMING_EVENTS = gql`
  query upcomingEvents($organizerId: ID) {
    upcomingEvents(organizerId: $organizerId) {
      id
      createDatetime
      modifiedDatetime
      title
      slug
      description
      styles
      logo
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
