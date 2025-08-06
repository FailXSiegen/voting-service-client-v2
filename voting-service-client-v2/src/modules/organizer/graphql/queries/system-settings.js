import { gql } from '@apollo/client/core';

export const SYSTEM_SETTINGS_QUERY = gql`
  query SystemSettings {
    systemSettings {
      id
      useDirectStaticPaths
      useDbFooterNavigation
      faviconUrl
      titleSuffix
      recaptchaEnabled
      recaptchaSiteKey
      recaptchaSecretKey
      updatedAt
      updatedBy {
        id
        username
      }
    }
  }
`;