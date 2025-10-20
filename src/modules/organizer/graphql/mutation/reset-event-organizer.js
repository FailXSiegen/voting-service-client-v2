import { gql } from "graphql-tag";

export const RESET_EVENT_ORGANIZER = gql`
  mutation resetEventOrganizer($eventId: ID!) {
    resetEventOrganizer(eventId: $eventId) {
      id
      title
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