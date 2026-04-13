import { gql } from 'graphql-tag';

export const UPDATE_JITSI_MEETING = gql`
  mutation UpdateJitsiMeeting($input: UpdateJitsiMeetingInput!) {
    updateJitsiMeeting(input: $input) {
      id
      title
      serverUrl
    }
  }
`;
