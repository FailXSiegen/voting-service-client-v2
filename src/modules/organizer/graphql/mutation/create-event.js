import { gql } from "graphql-tag";

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      createDatetime
      title
      slug
      description
      styles
      logo
      scheduledDatetime
      lobbyOpen
      active
      multivoteType
      videoConferenceConfig
      async
      allowMagicLink
      publicVoteVisible
      endDatetime
    }
  }
`;
