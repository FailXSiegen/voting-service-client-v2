import { gql } from "graphql-tag";

export const DELETE_EVENT_USER = gql`
  mutation deleteEventUser($eventUserId: ID!) {
    deleteEventUser(eventUserId: $eventUserId)
  }
`;
