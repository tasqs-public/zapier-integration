/* globals describe, it, expect, afterEach */
'use strict';

const { App, appTester, authData, nock } = require('./helpers');

const run = () => appTester(App.triggers.new_task.operation.perform, { authData, inputData: {} });

describe('error handling', () => {
  afterEach(() => nock.cleanAll());

  it("shows the API's own message, not a bare status", async () => {
    nock('https://tasqs.com').get('/v1/tasks').query(true)
      .reply(404, { error: { code: 'list_not_found', message: 'No list named "Wrk". Your lists: Work, Home.' } });
    await expect(run()).rejects.toThrow('No list named \\"Wrk\\". Your lists: Work, Home.');
  });

  it('explains the plan gate in words', async () => {
    nock('https://tasqs.com').get('/v1/tasks').query(true)
      .reply(403, { error: { code: 'plan_required', message: 'API access requires the Power User plan.' } });
    await expect(run()).rejects.toThrow('API access requires the Power User plan.');
  });

  it('turns a 429 into a throttle with the wait the API asked for', async () => {
    nock('https://tasqs.com').get('/v1/tasks').query(true)
      .reply(429, { error: { code: 'rate_limited', message: 'Too many requests.' } }, { 'Retry-After': '42' });
    await expect(run()).rejects.toMatchObject({ name: 'ThrottledError', message: expect.stringContaining('"delay":42') });
  });

  it('leaves a 401 to the platform, which refreshes the token and retries', async () => {
    nock('https://tasqs.com').get('/v1/tasks').query(true)
      .reply(401, { error: { code: 'invalid_token', message: 'Token expired.' } });
    await expect(run()).rejects.toMatchObject({ name: 'RefreshAuthError' });
  });

  it('survives an error page that is not JSON', async () => {
    nock('https://tasqs.com').get('/v1/tasks').query(true).reply(502, '<html>Bad gateway</html>');
    await expect(run()).rejects.toThrow('Tasqs returned an error (502).');
  });
});
