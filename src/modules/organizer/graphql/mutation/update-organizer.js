import {gql} from "graphql-tag";

export const UPDATE_ORGANIZER = gql`mutation updateOrganizer($input: UpdateOrganizerInput!){
    updateOrganizer(input: $input) {
        id
        publicName
        email
        verified
    }
}`;