import {gql} from "graphql-tag";

export const UPDATE_EVENT_STATUS = gql`
    mutation UpdateEventStatus($input: UpdateEventStatusInput!){
        updateEventStatus(input: $input)
    }
`;