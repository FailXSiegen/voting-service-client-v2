import { gql } from 'graphql-tag';

export const CREATE_EVENT_USER_SHORTLINK = gql`
  mutation createEventUserShortlink($eventUserId: ID!) {
    createEventUserShortlink(eventUserId: $eventUserId)
  }
`;
