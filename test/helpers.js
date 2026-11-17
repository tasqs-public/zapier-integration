'use strict';

const nock = require('nock');
const zapier = require('zapier-platform-core');
const App = require('../index');

// No test touches the network: every request must be one a test declared.
nock.disableNetConnect();

process.env.CLIENT_ID = 'test-client-id';
process.env.CLIENT_SECRET = 'test-client-secret';

const appTester = zapier.createAppTester(App);
const authData = { access_token: 'tqo_access', refresh_token: 'tqr_refresh' };

// A task exactly as GET /v1/tasks returns it, private notes included.
const apiTask = (overrides = {}) => ({
  id: '05eca9cb53fe23166b6293771bfeb6ab',
  title: 'Learn to sail',
  description: null,
  notes: 'PRIVATE: marina gate code 4417',
  status: 'open',
  priority: 'medium',
  due_date: '2026-12-01',
  someday: false,
  check_back_on: null,
  list: { id: 1, name: 'Inbox', color: '#3B82F6' },
  tags: [
    { id: 3, name: 'boat', color: '#14B8A6' },
    { id: 4, name: 'summer', color: '#F79009' },
  ],
  attachment: null,
  recurring: null,
  created_at: '2026-11-12 22:46:30',
  updated_at: '2026-11-13 08:00:00',
  completed_at: null,
  ...overrides,
});

module.exports = { App, appTester, authData, apiTask, nock };
