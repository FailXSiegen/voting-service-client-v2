import {gql} from "graphql-tag";

export const UPDATE_EVENT_USER_TO_PARTICIPANT = gql`mutation UpdateUserToParticipant($eventUserId: ID!) {
    updateUserToParticipant(eventUserId: $eventUserId) {
        id
        publicName
    }
}`;