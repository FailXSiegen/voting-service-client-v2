import { gql } from "graphql-tag";

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($input: UpdateEventInput!) {
    updateEvent(input: $input) {
      id
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
