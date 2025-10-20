import gql from "graphql-tag";

export const POLLS_RESULTS = gql`
  query pollResults($eventId: ID, $page: Int, $pageSize: Int, $includeHidden: Boolean) {
    pollResult(eventId: $eventId, page: $page, pageSize: $pageSize, includeHidden: $includeHidden) {
      id
      type
      maxVotes
      maxVoteCycles
      createDatetime
      hidden
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
