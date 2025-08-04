#!/usr/bin/env node

require('dotenv/config');
const { ApolloClient, InMemoryCache, createHttpLink, gql } = require('@apollo/client/core');
const fetch = require('cross-fetch');

// GraphQL Client Setup
const httpLink = createHttpLink({
  uri: process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
  fetch: fetch
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query: { errorPolicy: 'all' }
  }
});

// Test Mutations
const SAVE_TRANSLATIONS_MUTATION = gql`
  mutation SaveTranslations($translations: [SaveTranslationInput!]!) {
    saveTranslations(translations: $translations)
  }
`;

const GET_TRANSLATIONS_QUERY = gql`
  query GetTranslationsByLocale($locale: String!) {
    translationsByLocale(locale: $locale)
  }
`;

async function testTranslationsEndpoint() {
  console.log('=== Testing Translations GraphQL Endpoint ===\n');
  
  try {
    // 1. Test GET translations first
    console.log('1. Testing GET translations...');
    const getResult = await client.query({
      query: GET_TRANSLATIONS_QUERY,
      variables: { locale: 'de' }
    });
    
    console.log('   ✅ GET translations successful');
    console.log('   Response type:', typeof getResult.data.translationsByLocale);
    
    // 2. Test SAVE translations (this is where the error occurs)
    console.log('\n2. Testing SAVE translations...');
    
    const testTranslations = [
      {
        locale: 'de',
        key: 'test.endpoint.test',
        value: 'Test-Übersetzung für Endpoint-Test'
      }
    ];
    
    const saveResult = await client.mutate({
      mutation: SAVE_TRANSLATIONS_MUTATION,
      variables: {
        translations: testTranslations
      }
    });
    
    console.log('   ✅ SAVE translations successful!');
    console.log('   Result:', saveResult.data.saveTranslations);
    
    // 3. Verify the saved translation
    console.log('\n3. Verifying saved translation...');
    const verifyResult = await client.query({
      query: GET_TRANSLATIONS_QUERY,
      variables: { locale: 'de' },
      fetchPolicy: 'network-only' // Force fresh fetch
    });
    
    const translations = JSON.parse(verifyResult.data.translationsByLocale);
    const testValue = translations?.test?.endpoint?.test;
    
    if (testValue === 'Test-Übersetzung für Endpoint-Test') {
      console.log('   ✅ Translation verified successfully!');
    } else {
      console.log('   ⚠️  Translation not found or different value:', testValue);
    }
    
    console.log('\n✅ All tests passed! Translations endpoint is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Error testing translations endpoint:');
    console.error('Error message:', error.message);
    
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      console.error('GraphQL Errors:');
      error.graphQLErrors.forEach((gqlError, index) => {
        console.error(`  ${index + 1}. ${gqlError.message}`);
        if (gqlError.extensions) {
          console.error('     Extensions:', gqlError.extensions);
        }
      });
    }
    
    if (error.networkError) {
      console.error('Network Error:', error.networkError.message);
      if (error.networkError.result) {
        console.error('Network Error Details:', error.networkError.result);
      }
    }
    
    console.error('\nFull error object:');
    console.error(error);
  }
}

// Get GraphQL endpoint from command line or environment
const endpoint = process.argv[2] || process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
console.log(`Testing endpoint: ${endpoint}`);

// Update client with provided endpoint
client.setLink(createHttpLink({
  uri: endpoint,
  fetch: fetch
}));

// Run the test
testTranslationsEndpoint().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});