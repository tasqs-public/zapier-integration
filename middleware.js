'use strict';

const { API } = require('./lib/constants');

// Every API call carries the user's access token. The token endpoint does
// not: it authenticates with the client credentials in the request body.
const includeBearerToken = (request, z, bundle) => {
  if (bundle.authData && bundle.authData.access_token && request.url.startsWith(API)) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }
  return request;
};

// Tasqs reports errors as {"error": {"code", "message"}}. Show the user that
// message instead of a bare status code.
//
// 401 is left alone on purpose: with autoRefresh on, the platform turns it
// into a token refresh and a retry before this runs.
const explainErrors = (response, z) => {
  if (response.status < 400 || response.status === 401) {
    return response;
  }

  let code = 'error';
  let message = `Tasqs returned an error (${response.status}).`;
  try {
    const body = typeof response.data === 'object' && response.data !== null
      ? response.data
      : JSON.parse(response.content);
    if (body && body.error) {
      code = body.error.code || code;
      message = body.error.message || message;
    }
  } catch (e) {
    // Not JSON (an edge or proxy error page). Keep the generic message.
  }

  if (response.status === 429) {
    const wait = parseInt(response.getHeader('retry-after'), 10);
    throw new z.errors.ThrottledError(message, Number.isFinite(wait) ? wait : 60);
  }
  throw new z.errors.Error(message, code, response.status);
};

module.exports = {
  befores: [includeBearerToken],
  afters: [explainErrors],
};
