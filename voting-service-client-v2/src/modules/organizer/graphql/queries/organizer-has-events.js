import { gql } from "graphql-tag";

export const ORGANIZER_HAS_EVENTS = gql`
  query organizerHasEvents($organizerId: ID!) {
    upcomingEvents(organizerId: $organizerId) {
      id
    }
    expiredEvents(organizerId: $organizerId) {
      id
    }
  }
`;