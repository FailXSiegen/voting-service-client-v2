import {gql} from "graphql-tag";

export const QUERY_ZOOM_MEETING = gql`
    query zoomMeeting($id:ID!) {
        zoomMeeting(id: $id) {
            id
            title
            apiKey
            apiSecret
        }
    }
`;