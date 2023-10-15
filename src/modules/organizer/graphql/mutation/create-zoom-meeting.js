import { gql } from "graphql-tag";

export const CREATE_ZOOM_MEETING = gql`
  mutation CreateZoomMeeting($input: CreateZoomMeetingInput!) {
    createZoomMeeting(input: $input) {
      id
      title
      apiKey
      apiSecret
    }
  }
`;
