import { gql } from 'graphql-tag';

export const ORGANIZERS = gql`
  query findOrganizers {
    organizers {
      id
      createDatetime
      username
      email
      publicName
      publicOrganisation
      confirmedEmail
      superAdmin
      verified
    }
  }
`;
