import { gql } from "graphql-tag";

export const CREATE_ANONYMOUS_POLL_SUBMIT_ANSWER = gql`
  mutation createAnonymousPollSubmitAnswer($input: PollSubmitAnswerInput!) {
    createAnonymousPollSubmitAnswer(input: $input)
  }
`;