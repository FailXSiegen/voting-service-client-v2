import {gql} from "graphql-tag";

export const DELETE_ZOOM_MEETING = gql`mutation deleteZoomMeeting($id: ID!){
    deleteZoomMeeting(id: $id)
}`;
