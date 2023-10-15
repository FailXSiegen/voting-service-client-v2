import { gql } from "graphql-tag";

export const POLL_ANSWER_LIVE_CYCLE = gql`
  subscription {
    pollAnswerLifeCycle {
      pollResultId
      maxVotes
      pollAnswersCount
      pollUserCount
      pollUserVotedCount
      eventId
    }
  }
`;
