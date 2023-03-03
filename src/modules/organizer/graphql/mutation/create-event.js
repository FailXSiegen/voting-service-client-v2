import {gql} from "graphql-tag";

export const CREATE_EVENT = gql`
    mutation CreateEvent($input: CreateEventInput!){
        createEvent(input: $input) {
            id
            createDatetime
            title
            slug
            description
            scheduledDatetime
            lobbyOpen
            active
            multivoteType
            videoConferenceConfig
        }
    }`;