import { gql } from "graphql-tag";

export const STOP_POLL = gql`
  mutation stopPoll($id: ID!) {
    stopPoll(id: $id)
  }
`;
