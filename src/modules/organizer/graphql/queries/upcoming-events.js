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
      scheduledDatetime
      lobbyOpen
      active
      async
      finished
      endDatetime
    }
  }
`;
