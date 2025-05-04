import gql from "graphql-tag";

export const VOTE_RECEIVED_SUBSCRIPTION = gql`
  subscription voteReceived($eventId: ID!) {
    voteReceived(eventId: $eventId) {
      eventId
      pollId
      eventUserId
      timestamp
    }
  }
`;

export const VOTE_PROCESSING_UPDATE_SUBSCRIPTION = gql`
  subscription voteProcessingUpdate($eventId: ID!) {
    voteProcessingUpdate(eventId: $eventId) {
      type
      payload {
        pollId
        batchSize
        timestamp
        voteIds
      }
    }
  }
`;