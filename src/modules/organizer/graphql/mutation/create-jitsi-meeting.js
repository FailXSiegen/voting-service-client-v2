import { gql } from 'graphql-tag';

export const CREATE_JITSI_MEETING = gql`
  mutation CreateJitsiMeeting($input: CreateJitsiMeetingInput!) {
    createJitsiMeeting(input: $input) {
      id
      title
      serverUrl
    }
  }
`;
