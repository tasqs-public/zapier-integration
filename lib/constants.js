'use strict';

// One place for every address the integration uses. Production only: Zapier
// requires live endpoints, and there is no staging Tasqs.
const SITE = 'https://tasqs.com';

module.exports = {
  SITE,
  API: `${SITE}/v1`,
  AUTHORIZE_URL: `${SITE}/oauth/authorize`,
  TOKEN_URL: `${SITE}/oauth/token`,
  SCOPE: 'tasks:read tasks:write',
};
