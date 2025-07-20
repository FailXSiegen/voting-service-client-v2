import { gql } from "graphql-tag";

export const EVENTS_BY_ORGANIZER = gql`
  query eventsByOrganizer($organizerId: ID!) {
    # Finde alle Events, die dem Organizer direkt gehören
    upcomingEvents(organizerId: $organizerId) {
      id
      title
      slug
      description
      scheduledDatetime
      lobbyOpen
      active
      async
      finished
      organizer {
        id
        username
        email
      }
      originalOrganizer {
        id
        username
        email
      }
    }
    expiredEvents(organizerId: $organizerId) {
      id
      title
      slug
      description
      scheduledDatetime
      endDatetime
      lobbyOpen
      active
      async
      finished
      organizer {
        id
        username
        email
      }
      originalOrganizer {
        id
        username
        email
      }
    }
  }
`;