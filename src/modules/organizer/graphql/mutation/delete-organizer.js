import { gql } from "graphql-tag";

export const DELETE_ORGANIZER = gql`
  mutation deleteOrganizer($id: ID!) {
    deleteOrganizer(id: $id)
  }
`;
