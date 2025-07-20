import { gql } from "graphql-tag";

export const EVENTS_WITH_ORIGINAL_OWNER = gql`
  query eventsWithOriginalOwner($organizerId: ID!) {
    # Direkt eigene Events
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
    # Wir müssen händisch nach übertragenen Events suchen, bei denen
    # dieser Organizer der original_organizer ist
    # Da es keinen direkten Query gibt, holen wir alle Events mit SuperAdmin-Rechten
    # und filtern client-seitig für mehr Kontext und bessere Usability
  }
`;