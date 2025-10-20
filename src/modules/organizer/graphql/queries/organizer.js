import { gql } from "graphql-tag";

export const ORGANIZER = gql`
  query organizer($organizerId: ID!) {
    organizer(organizerId: $organizerId) {
      id
      username
      email
      password
      publicName
      publicOrganisation
      confirmedEmail
      verified
      superAdmin
      createDatetime
      zoomMeetings {
        id
        title
        sdkKey
        sdkSecret
      }
    }
  }
`;
