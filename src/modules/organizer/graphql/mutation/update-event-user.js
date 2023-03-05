import {gql} from "graphql-tag";

export const UPDATE_EVENT_USER = gql`mutation updateEventUser($input: UpdateEventUserInput!){
    updateEventUser(input: $input) {
        id
        publicName
        username
        allowToVote
        verified
        voteAmount
    }
}`;