/* globals describe, it, expect, afterEach */
'use strict';

const { App, appTester, authData, nock } = require('./helpers');

const env = { CLIENT_ID: 'test-client-id', CLIENT_SECRET: 'test-client-secret' };
const form = (body) => Object.fromEntries(new URLSearchParams(body));

describe('authentication', () => {
  afterEach(() => nock.cleanAll());

  it('sends the user to the Tasqs consent screen with both scopes', async () => {
    const url = await appTester(App.authentication.oauth2Config.authorizeUrl, {
      inputData: { state: 'abc123', redirect_uri: 'https://zapier.com/dashboard/auth/oauth/return/App249909CLIAPI/' },
      environment: env,
    });
    const u = new URL(url);
    expect(`${u.origin}${u.pathname}`).toBe('https://tasqs.com/oauth/authorize');
    expect(u.searchParams.get('client_id')).toBe('test-client-id');
    expect(u.searchParams.get('state')).toBe('abc123');
    expect(u.searchParams.get('response_type')).toBe('code');
    expect(u.searchParams.get('scope')).toBe('tasks:read tasks:write');
    expect(u.searchParams.get('redirect_uri')).toBe('https://zapier.com/dashboard/auth/oauth/return/App249909CLIAPI/');
  });

  it('exchanges the code with the client credentials in the POST body', async () => {
    let sent;
    nock('https://tasqs.com')
      .post('/oauth/token', (body) => { sent = form(body); return true; })
      .reply(200, { access_token: 'tqo_new', refresh_token: 'tqr_new', token_type: 'Bearer', expires_in: 3600 });

    const result = await appTester(App.authentication.oauth2Config.getAccessToken, {
      inputData: { code: 'one-time-code', redirect_uri: 'https://zapier.com/return/' },
      environment: env,
    });

    expect(result).toEqual({ access_token: 'tqo_new', refresh_token: 'tqr_new' });
    expect(sent).toEqual({
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      grant_type: 'authorization_code',
      code: 'one-time-code',
      redirect_uri: 'https://zapier.com/return/',
    });
  });

  it('refreshes with the client credentials too, and keeps the rotated refresh token', async () => {
    let sent;
    nock('https://tasqs.com')
      .post('/oauth/token', (body) => { sent = form(body); return true; })
      .reply(200, { access_token: 'tqo_next', refresh_token: 'tqr_next' });

    const result = await appTester(App.authentication.oauth2Config.refreshAccessToken, { authData, environment: env });

    expect(sent).toEqual({
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      grant_type: 'refresh_token',
      refresh_token: 'tqr_refresh',
    });
    expect(result).toEqual({ access_token: 'tqo_next', refresh_token: 'tqr_next' });
  });

  it('never sends the access token to the token endpoint', async () => {
    let authHeader = 'unset';
    nock('https://tasqs.com')
      .post('/oauth/token')
      .reply(function () { authHeader = this.req.headers.authorization; return [200, { access_token: 'a', refresh_token: 'b' }]; });
    await appTester(App.authentication.oauth2Config.refreshAccessToken, { authData, environment: env });
    expect(authHeader).toBeUndefined();
  });

  it('tests the connection with a Bearer token and labels it by name', async () => {
    nock('https://tasqs.com', { reqheaders: { authorization: 'Bearer tqo_access' } })
      .get('/v1/me/summary')
      .reply(200, { date: '2026-11-17', user: { name: 'Pat Example' }, due_today: 2, overdue: 1, shortlist_remaining: 3, lists: [] });

    const data = await appTester(App.authentication.test, { authData });
    expect(data.user.name).toBe('Pat Example');

    const label = await appTester(App.authentication.connectionLabel, { authData, inputData: data });
    expect(label).toBe('Pat Example');
  });

  it('falls back to a plain label when the name is missing', async () => {
    const label = await appTester(App.authentication.connectionLabel, { authData, inputData: {} });
    expect(label).toBe('Tasqs');
  });

  it('asks for no fields before sign-in', () => {
    expect(App.authentication.fields).toEqual([]);
    expect(App.authentication.oauth2Config.autoRefresh).toBe(true);
  });
});
