import gql from "graphql-tag";

export const POLLS_RESULTS = gql`
  query pollResults($eventId: ID, $page: Int, $pageSize: Int) {
    pollResult(eventId: $eventId, page: $page, pageSize: $pageSize) {
      id
      type
      maxVotes
      maxVoteCycles
      createDatetime
      poll {
        title
        pollAnswer
        minVotes
        maxVotes
      }
      pollAnswer {
        id
        answerContent
        pollResultId
        pollUserId
      }
      pollUser {
        id
        publicName
      }
    }
  }
`;
