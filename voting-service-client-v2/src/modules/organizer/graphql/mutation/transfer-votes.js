import { gql } from "graphql-tag";

export const TRANSFER_VOTES = gql`
  mutation TransferVotes($input: TransferVotesInput!) {
    transferVotes(input: $input) {
      sourceUser {
        id
        publicName
        username
        voteAmount
        allowToVote
        verified
      }
      targetUser {
        id
        publicName
        username
        voteAmount
        allowToVote
        verified
      }
      transferredVotes
      success
    }
  }
`;