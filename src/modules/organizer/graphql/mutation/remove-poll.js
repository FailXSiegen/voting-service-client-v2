import {gql} from "graphql-tag";

export const REMOVE_POLL = gql`mutation removePoll($pollId: ID!){
    removePoll(id: $pollId)
}`;
