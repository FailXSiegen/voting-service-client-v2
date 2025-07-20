import { gql } from "graphql-tag";

export const ORGANIZER_HAS_EVENTS_WITH_ORIGINAL = gql`
  query organizerHasEventsWithOriginal($organizerId: ID!) {
    upcomingEvents(organizerId: $organizerId) {
      id
    }
    expiredEvents(organizerId: $organizerId) {
      id
    }
    # This is a custom query to check for events where this organizer is the original owner
    # but the event is now assigned to a different organizer
    # Since we don't have a direct GraphQL query for this, we use the all events queries
    # and filter client-side in the component
  }
`;