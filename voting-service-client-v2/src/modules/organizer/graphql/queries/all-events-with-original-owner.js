import { gql } from "graphql-tag";

export const ALL_EVENTS_WITH_ORIGINAL_OWNER = gql`
  query allEventsWithOriginalOwner {
    # Hole alle bevorstehenden Events (für Superorganizer)
    allUpcomingEvents {
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
    # Hole alle vergangenen Events (für Superorganizer)
    allPastEvents(page: 0, pageSize: 200) {
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