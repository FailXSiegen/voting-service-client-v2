import { gql } from "graphql-tag";

export const POLLS_WITH_VOTE_STATUS = gql`
  query pollsWithVoteStatus($eventId: ID!, $eventUserId: ID!) {
    polls(eventId: $eventId) {
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
      userVoteCycle(eventUserId: $eventUserId) {
        voteCycle
        maxVotes
      }
    }
  }
`;