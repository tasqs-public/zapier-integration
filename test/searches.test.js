/* globals describe, it, expect, afterEach */
'use strict';

const { App, appTester, authData, apiTask, nock } = require('./helpers');

const find = (inputData) => appTester(App.searches.find_task.operation.perform, { authData, inputData });
const page = (tasks) => ({ data: tasks, pagination: { page: 1, per_page: 25, total: tasks.length, total_pages: 1 } });
const t = (id, title, description = null) => apiTask({ id: id.repeat(32), title, description });

describe('Find Task', () => {
  afterEach(() => nock.cleanAll());

  it('searches open tasks on the server by default', async () => {
    let query;
    nock('https://tasqs.com', { reqheaders: { authorization: 'Bearer tqo_access' } })
      .get('/v1/tasks').query((q) => { query = q; return true; })
      .reply(200, page([t('a', 'Call the dentist')]));

    const results = await find({ title: '  dentist ' });

    expect(query).toEqual({ q: 'dentist', status: 'open', per_page: '25' });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Call the dentist');
    expect(results[0]).not.toHaveProperty('notes');
  });

  it('passes the status and list choices through', async () => {
    let query;
    nock('https://tasqs.com').get('/v1/tasks').query((q) => { query = q; return true; }).reply(200, page([]));
    const results = await find({ title: 'dentist', status: 'all', list_id: 21 });
    expect(query).toEqual({ q: 'dentist', status: 'all', per_page: '25', list_id: '21' });
    expect(results).toEqual([]);
  });

  it('puts an exact title first, then titles containing the text, then description matches', async () => {
    nock('https://tasqs.com').get('/v1/tasks').query(true).reply(200, page([
      t('a', 'Send invoice', 'Mention the dentist in the memo'),
      t('b', 'Call the dentist about Friday'),
      t('c', 'DENTIST'),
      t('d', 'Dentist follow-up'),
    ]));
    const results = await find({ title: 'Dentist' });
    expect(results.map((r) => r.title)).toEqual([
      'DENTIST',
      'Call the dentist about Friday',
      'Dentist follow-up',
      'Send invoice',
    ]);
  });

  it('returns an empty list when nothing matches, so "create if not found" can run', async () => {
    nock('https://tasqs.com').get('/v1/tasks').query(true).reply(200, page([]));
    expect(await find({ title: 'no such task' })).toEqual([]);
  });

  it('refuses a one-character search before calling the API', async () => {
    await expect(find({ title: ' a ' })).rejects.toThrow('Title must be at least 2 characters.');
  });

  it('trims a very long title to what the API accepts', async () => {
    let query;
    nock('https://tasqs.com').get('/v1/tasks').query((q) => { query = q; return true; }).reply(200, page([]));
    await find({ title: 'x'.repeat(300) });
    expect(query.q).toHaveLength(100);
  });

  it('pairs with Create Task as "Find or Create Task" on the same Title field', () => {
    const searchKeys = App.searches.find_task.operation.inputFields.map((f) => f.key);
    const createKeys = App.creates.create_task.operation.inputFields.map((f) => f.key);
    expect(searchKeys).toContain('title');
    expect(createKeys).toContain('title');
    expect(App.searchOrCreates.find_task.display.label).toBe('Find or Create Task');
  });
});
