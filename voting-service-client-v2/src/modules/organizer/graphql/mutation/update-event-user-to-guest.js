import { gql } from "graphql-tag";

export const UPDATE_EVENT_USER_TO_GUEST = gql`
  mutation UpdateUserToGuest($eventUserId: ID!) {
    updateUserToGuest(eventUserId: $eventUserId) {
      id
      publicName
    }
  }
`;
