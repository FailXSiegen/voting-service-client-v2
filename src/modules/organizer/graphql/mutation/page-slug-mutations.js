import { gql } from '@apollo/client/core';

/**
 * GraphQL mutation to create or update a page slug
 */
export const UPSERT_PAGE_SLUG = gql`
  mutation UpsertPageSlug($pageKey: String!, $slug: String!) {
    upsertPageSlug(pageKey: $pageKey, slug: $slug) {
      id
      pageKey
      slug
      createdAt
      updatedAt
    }
  }
`;

/**
 * GraphQL mutation to delete a page slug
 */
export const DELETE_PAGE_SLUG = gql`
  mutation DeletePageSlug($pageKey: String!) {
    deletePageSlug(pageKey: $pageKey)
  }
`;

/**
 * GraphQL query to fetch a page slug by slug
 */
export const FETCH_PAGE_SLUG_BY_SLUG = gql`
  query FetchPageSlugBySlug($slug: String!) {
    pageSlugBySlug(slug: $slug) {
      id
      pageKey
      slug
      createdAt
      updatedAt
    }
  }
`;
