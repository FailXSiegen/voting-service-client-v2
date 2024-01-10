import { gql } from "graphql-tag";

export const POLL = gql`
  query poll($id: ID) {
    poll(id: $id) {
      id
      title
      pollAnswer
      type
      list
      possibleAnswers {
        id
        content
      }
      minVotes
      maxVotes
      allowAbstain
    }
  }
`;
