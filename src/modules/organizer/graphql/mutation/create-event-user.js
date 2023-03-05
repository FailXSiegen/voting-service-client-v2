import {gql} from "graphql-tag";

export const CREATE_EVENT_USER = gql`mutation createEventUser($input: CreateEventUserInput!){
    createEventUser(input: $input) {
        id
        publicName
        username
        allowToVote
        verified
        voteAmount
    }
}`;