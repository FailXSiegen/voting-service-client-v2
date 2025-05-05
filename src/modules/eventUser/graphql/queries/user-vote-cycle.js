import { gql } from "graphql-tag";

export const USER_VOTE_CYCLE = gql`
  query userVoteCycle($eventUserId: ID!, $pollId: ID!) {
    userVoteCycle(eventUserId: $eventUserId, pollId: $pollId) {
      voteCycle
      maxVotes
    }
  }
`;