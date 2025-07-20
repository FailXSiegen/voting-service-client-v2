import { gql } from "graphql-tag";

export const CREATE_BULK_POLL_SUBMIT_ANSWER = gql`
  mutation createBulkPollSubmitAnswer($input: BulkPollSubmitAnswerInput!) {
    createBulkPollSubmitAnswer(input: $input)
  }
`;