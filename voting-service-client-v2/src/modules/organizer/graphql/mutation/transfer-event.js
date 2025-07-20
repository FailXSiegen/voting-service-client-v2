import { gql } from "graphql-tag";

export const TRANSFER_EVENT = gql`
  mutation transferEvent($eventId: ID!, $newOrganizerId: ID!) {
    transferEvent(eventId: $eventId, newOrganizerId: $newOrganizerId) {
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