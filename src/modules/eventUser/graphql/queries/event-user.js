import {gql} from "graphql-tag";

export const EVENT_USER = gql`
    query eventUser($id: ID) {
        eventUser(id: $id) {
            id
            eventId
            publicName
            verified
            allowToVote
            online
            username
            voteAmount
        }
    }
`;