import gql from 'graphql-tag'

export const UPDATE_EVENT_USER = gql`mutation updateEventUser($input: UpdateEventUserInput!){
  updateEventUser(input: $input) {
    id
  }
}`
export const UPDATE_EVENT_USER_VERIFIED = gql`mutation updateEventUserVerified($input: UpdateEventUserVerifiedInput!){
  updateEventUserVerified(input: $input) {
    id
    verified
    allowToVote
  }
}`
export const CREATE_POLL = gql`mutation createPoll($input: CreateNewPollInput!){
  createPoll(input: $input) {
    eventId
    title
    type
    possibleAnswers {
      content
    }
  }
}`
