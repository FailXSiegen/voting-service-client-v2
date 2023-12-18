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
      scheduledDatetime
      lobbyOpen
      active
      multivoteType
      videoConferenceConfig
      async
      finished
      endDatetime
    }
  }
`;
