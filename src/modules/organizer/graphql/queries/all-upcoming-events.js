import { gql } from "graphql-tag";

export const ALL_UPCOMING_EVENTS = gql`
  query allUpcomingEvents {
    allUpcomingEvents {
      id
      organizer {
        id
        publicName
        username
        email
      }
      createDatetime
      modifiedDatetime
      title
      slug
      description
      scheduledDatetime
      lobbyOpen
      active
      async
      allowMagicLink
      publicVoteVisible
      finished
      endDatetime
    }
  }
`;
