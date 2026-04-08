import { gql } from 'graphql-tag';

export const CREATE_MULTI_POLL_SUBMIT_ANSWER = gql`
  mutation createMultiPollSubmitAnswer($input: MultiPollSubmitAnswerInput!) {
    createMultiPollSubmitAnswer(input: $input)
  }
`;
