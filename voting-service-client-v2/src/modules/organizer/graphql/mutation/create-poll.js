import { gql } from "graphql-tag";

export const CREATE_POLL = gql`
  mutation createPoll($input: CreateNewPollInput!, $instantStart: Boolean!) {
    createPoll(input: $input, instantStart: $instantStart) {
      id
      eventId
      title
      pollAnswer
      list
      type
      maxVotes
      minVotes
      allowAbstain
      possibleAnswers {
        content
      }
    }
  }
`;
