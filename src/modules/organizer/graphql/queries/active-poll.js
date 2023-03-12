import {gql} from "graphql-tag";

export const ACTIVE_POLL = gql`
    query activePoll($eventId: ID) {
        activePoll(eventId: $eventId) {
            id
            title
            maxVotes
            answerCount
            pollUserCount
            pollUserVotedCount
        }
    }
`;
