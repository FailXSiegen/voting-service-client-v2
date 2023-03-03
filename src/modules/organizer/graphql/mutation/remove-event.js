import {gql} from "graphql-tag";

export const REMOVE_EVENT = gql`
    mutation RemoveEvent($organizerId: ID!, $id: ID! ){
        removeEvent(organizerId: $organizerId, id: $id)
    }
`;