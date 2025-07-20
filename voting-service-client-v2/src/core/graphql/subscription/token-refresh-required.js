import { gql } from "graphql-tag";

export const TOKEN_REFRESH_REQUIRED_SUBSCRIPTION = gql`
  subscription($eventUserId: ID) {
    tokenRefreshRequired(eventUserId: $eventUserId) {
      userId
      userType
      reason
      token
    }
  }
`;