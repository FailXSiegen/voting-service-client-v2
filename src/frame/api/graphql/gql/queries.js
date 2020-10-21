import gql from 'graphql-tag'

export const POLLS_RESULTS = gql`
  query pollResult($eventId: ID, $page: Int, $pageSize: Int) {
    pollResult(eventId: $eventId, page: $page, pageSize: $pageSize) {
      id
      type
      maxVotes
      createDatetime
      poll {
        title
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
`
