import gql from "graphql-tag";

export const CREATE_ORGANIZER = gql`
  mutation createOrganizer($input: CreateOrganizerInput!) {
    createOrganizer(input: $input) {
      id
      username
      email
      publicName
      publicOrganisation
      confirmedEmail
      verified
      createDatetime
    }
  }
`;