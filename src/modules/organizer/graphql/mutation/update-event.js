import { gql } from "graphql-tag";

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($input: UpdateEventInput!) {
    updateEvent(input: $input) {
      id
      title
      slug
      description
      scheduledDatetime
      lobbyOpen
      active
      multivoteType
      videoConferenceConfig
      async
      allowMagicLink
      endDatetime
    }
  }
`;
