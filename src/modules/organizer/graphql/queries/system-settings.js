import { gql } from '@apollo/client/core';

export const SYSTEM_SETTINGS_QUERY = gql`
  query SystemSettings {
    systemSettings {
      id
      useDirectStaticPaths
      useDbFooterNavigation
      faviconUrl
      titleSuffix
      mosparoEnabled
      mosparoHost
      mosparoUuid
      mosparoPublicKey
      updatedAt
      updatedBy {
        id
        username
      }
    }
  }
`;
