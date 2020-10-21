import gql from 'graphql-tag'

export const CREATE_POLL_SUBMIT_ANSWER = gql`mutation createPollSubmitAnswer($input: PollSubmitAnswerInput!){
  createPollSubmitAnswer(input: $input)
}`
