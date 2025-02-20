import { gql } from "graphql-tag";

export const EVENT = gql`
  query event($id: ID!, $organizerId: ID!) {
    event(id: $id, organizerId: $organizerId) {
      id
      createDatetime
      modifiedDatetime
      title
      slug
      description
      styles
      scheduledDatetime
      lobbyOpen
      active
      multivoteType
      videoConferenceConfig
      async
      allowMagicLink
      publicVoteVisible
      finished
      endDatetime
    }
  }
`;
