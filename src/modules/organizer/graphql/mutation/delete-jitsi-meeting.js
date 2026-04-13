import { gql } from 'graphql-tag';

export const DELETE_JITSI_MEETING = gql`
  mutation deleteJitsiMeeting($id: ID!) {
    deleteJitsiMeeting(id: $id)
  }
`;
