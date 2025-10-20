import { gql } from "graphql-tag";

export const TOGGLE_POLL_RESULT_HIDDEN = gql`
  mutation togglePollResultHidden($pollResultId: ID!) {
    togglePollResultHidden(pollResultId: $pollResultId)
  }
`;
