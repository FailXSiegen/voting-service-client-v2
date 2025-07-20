import { gql } from "graphql-tag";

export const POLL_ANSWER_LIVE_CYCLE = gql`
  subscription ($eventId: ID) {
    pollAnswerLifeCycle(eventId: $eventId) {
      pollResultId
      maxVotes
      pollAnswersCount
      pollUserCount
      pollUserVotedCount
      eventId
    }
  }
`;
