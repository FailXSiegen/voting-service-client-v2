import { gql } from '@apollo/client/core';

export const UPDATE_SYSTEM_SETTINGS = gql`
  mutation UpdateSystemSettings($input: SystemSettingsInput!) {
    updateSystemSettings(input: $input) {
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