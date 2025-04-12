import { PlaidApi, Configuration, PlaidEnvironments } from 'plaid';

// Plaid client configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Store access token in memory - in production, this should be stored securely in a database
export let accessToken: string | null = null;
export let itemId: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const setItemId = (id: string) => {
  itemId = id;
};