import { gql } from "graphql-tag";

export const CREATE_MULTIPLE_POLL_SUBMIT_ANSWERS = gql`
  mutation createMultiplePollSubmitAnswers($input: MultiplePollSubmitAnswerInput!) {
    createMultiplePollSubmitAnswers(input: $input)
  }
`;