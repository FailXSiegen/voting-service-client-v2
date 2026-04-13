import { gql } from 'graphql-tag';

export const QUERY_JITSI_MEETING = gql`
  query jitsiMeeting($id: ID!) {
    jitsiMeeting(id: $id) {
      id
      title
      serverUrl
    }
  }
`;
