import { apolloClient } from '@/apollo-client';
// Import the GraphQL queries from page-slug-mutations.js to avoid duplication
import { FETCH_PAGE_SLUG_BY_SLUG as PAGE_SLUG_BY_SLUG_QUERY } from '@/modules/organizer/graphql/mutation/page-slug-mutations';

/**
 * Checks if a slug already exists in the system
 * @param {string} slug - The slug to check
 * @returns {Promise<Object|null>} PageSlug object if exists, null otherwise
 */
export const getPageSlugBySlug = async (slug) => {
  try {
    // Validate slug format
    if (!slug || typeof slug !== 'string') {
      return null;
    }

    // Fetch the slug from the API using the shared query
    const result = await apolloClient.query({
      query: PAGE_SLUG_BY_SLUG_QUERY,
      variables: { slug },
      fetchPolicy: 'network-only', // Always check with the server
    });

    // Return the page slug data or null
    return result.data?.pageSlugBySlug || null;
  } catch (err) {
    console.error('Error checking if slug exists:', err);
    return null;
  }
};
