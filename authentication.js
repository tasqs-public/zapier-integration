'use strict';

const { API, AUTHORIZE_URL, TOKEN_URL, SCOPE } = require('./lib/constants');

// OAuth 2, authorization-code grant, against Tasqs's own server.
//
// Zapier is a confidential client: CLIENT_ID and CLIENT_SECRET live in the
// integration's environment (`zapier env:set`), never in this repository.
// Tasqs requires them on EVERY token call, the refresh included; a refresh
// sent without them is rejected and the connection would break after the
// first hour.

const tokenRequest = async (z, body) => {
  const response = await z.request({
    url: TOKEN_URL,
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      ...body,
    },
  });
  return {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
  };
};

const getAccessToken = (z, bundle) =>
  tokenRequest(z, {
    grant_type: 'authorization_code',
    code: bundle.inputData.code,
    redirect_uri: bundle.inputData.redirect_uri,
  });

// Tasqs rotates refresh tokens: every refresh returns a new one, and it must
// replace the stored value.
const refreshAccessToken = (z, bundle) =>
  tokenRequest(z, {
    grant_type: 'refresh_token',
    refresh_token: bundle.authData.refresh_token,
  });

// A cheap authenticated read. Its response also names the connection.
const test = async (z) => {
  const response = await z.request({ url: `${API}/me/summary` });
  return response.data;
};

module.exports = {
  type: 'oauth2',
  oauth2Config: {
    authorizeUrl: {
      url: AUTHORIZE_URL,
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        state: '{{bundle.inputData.state}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code',
        scope: SCOPE,
      },
    },
    getAccessToken,
    refreshAccessToken,
    // Access tokens last one hour. On a 401 Zapier refreshes and retries.
    autoRefresh: true,
  },
  // No fields: the user signs in on Tasqs's own consent screen.
  fields: [],
  test,
  // The account holder's name. Never an email address or a token.
  connectionLabel: (z, bundle) =>
    (bundle.inputData.user && bundle.inputData.user.name) || 'Tasqs',
};
