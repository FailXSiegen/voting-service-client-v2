import {gql} from "graphql-tag";

export const NEW_EVENT_USER = gql`subscription{
    newEventUser{
        eventId
        id
        publicName
        verified
        allowToVote
        online
        username
        voteAmount
        createDatetime
    }
}
`;