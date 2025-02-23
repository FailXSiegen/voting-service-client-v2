import { gql } from "graphql-tag";

export const ALL_PAST_EVENTS = gql`
  query allPastEvents($page: Int, $pageSize: Int) {
    allPastEvents(page: $page, pageSize: $pageSize) {
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
      styles
      logo
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
