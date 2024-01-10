import { gql } from "graphql-tag";

export const CREATE_EVENT_USER_AUTH_TOKEN = gql`
  mutation createEventUser($input: CreateEventUserAuthTokenInput!) {
    createEventUserAuthToken(input: $input)
  }
`;
