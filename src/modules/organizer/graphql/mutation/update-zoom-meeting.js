import {gql} from "graphql-tag";

export const UPDATE_ZOOM_MEETING = gql`mutation CreateZoomMeeting($input: UpdateZoomMeetingInput!){
    updateZoomMeeting(input: $input) {
        id
        title
        apiKey
        apiSecret
    }
}`;