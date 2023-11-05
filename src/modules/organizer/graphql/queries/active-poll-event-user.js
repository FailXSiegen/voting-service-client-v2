import { gql } from "graphql-tag";

export const ACTIVE_POLL_EVENT_USER = gql`
  query activePollEventUser($eventId: ID) {
    activePollEventUser(eventId: $eventId) {
      poll {
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
      state
      pollUser {
        id
        eventUserId
        publicName
      }
      pollUserVoted {
        id
        eventUserId
        publicName
        pollResultId
      }
    }
  }
`;
