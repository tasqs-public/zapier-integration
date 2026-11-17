/* globals describe, it, expect, afterEach */
'use strict';

const { App, appTester, authData, apiTask, nock } = require('./helpers');
const { shapeTask, sampleTask, taskOutputFields, isoUtc } = require('../lib/task');

describe('New Task trigger', () => {
  afterEach(() => nock.cleanAll());

  it('asks for the newest tasks with a Bearer token and no status filter', async () => {
    let query;
    nock('https://tasqs.com', { reqheaders: { authorization: 'Bearer tqo_access' } })
      .get('/v1/tasks').query((q) => { query = q; return true; })
      .reply(200, { data: [apiTask()], pagination: { page: 1, per_page: 50, total: 1, total_pages: 1 } });

    const results = await appTester(App.triggers.new_task.operation.perform, { authData, inputData: {} });

    expect(query).toEqual({ per_page: '50' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('05eca9cb53fe23166b6293771bfeb6ab');
  });

  it('passes the list and tag filters through by name', async () => {
    let query;
    nock('https://tasqs.com').get('/v1/tasks').query((q) => { query = q; return true; })
      .reply(200, { data: [], pagination: {} });
    const results = await appTester(App.triggers.new_task.operation.perform, {
      authData, inputData: { list: 'Household', tag: 'errands' },
    });
    expect(query).toEqual({ per_page: '50', list: 'Household', tag: 'errands' });
    expect(results).toEqual([]);
  });

  it('never hands private notes to a Zap', async () => {
    nock('https://tasqs.com').get('/v1/tasks').query(true)
      .reply(200, { data: [apiTask()], pagination: {} });
    const [task] = await appTester(App.triggers.new_task.operation.perform, { authData, inputData: {} });
    expect(task).not.toHaveProperty('notes');
    expect(JSON.stringify(task)).not.toContain('4417');
  });
});

describe('task shape', () => {
  it('flattens the list and tags and links back to the task', () => {
    const t = shapeTask(apiTask());
    expect(t.list_name).toBe('Inbox');
    expect(t.tags).toEqual(['boat', 'summer']);
    expect(t.tags_text).toBe('boat, summer');
    expect(t.url).toBe('https://tasqs.com/dashboard.php?ref=05eca9cb53fe23166b6293771bfeb6ab');
    expect(t.description).toBe('');
  });

  it('reports times as ISO 8601 UTC', () => {
    const t = shapeTask(apiTask({ status: 'completed', completed_at: '2026-11-14 09:30:00' }));
    expect(t.created_at).toBe('2026-11-12T22:46:30Z');
    expect(t.completed_at).toBe('2026-11-14T09:30:00Z');
    expect(shapeTask(apiTask()).completed_at).toBeNull();
    expect(isoUtc('2026-11-12T22:46:30Z')).toBe('2026-11-12T22:46:30Z');
  });

  it('carries Someday, repeat and attachment state as plain values', () => {
    const t = shapeTask(apiTask({
      due_date: null, someday: true, check_back_on: '2026-12-15',
      recurring: { cadence: 'weekly', end: null },
      attachment: { filename: 'plan.pdf', mime: 'application/pdf', size: 1024 },
      list: null, tags: [],
    }));
    expect(t.someday).toBe(true);
    expect(t.check_back_on).toBe('2026-12-15');
    expect(t.due_date).toBeNull();
    expect(t.repeats).toBe('weekly');
    expect(t.has_attachment).toBe(true);
    expect(t.list_name).toBeNull();
    expect(t.tags_text).toBe('');
  });

  it('keeps the sample and the labelled fields in step with the real shape', () => {
    const real = Object.keys(shapeTask(apiTask())).sort();
    expect(Object.keys(sampleTask).sort()).toEqual(real);
    for (const field of taskOutputFields) expect(real).toContain(field.key);
    expect(sampleTask).not.toHaveProperty('notes');
  });
});

describe('dropdown triggers', () => {
  afterEach(() => nock.cleanAll());

  it('lists the lists by name', async () => {
    nock('https://tasqs.com').get('/v1/lists')
      .reply(200, { data: [{ id: 1, name: 'Inbox', color: '#3B82F6', icon: 'list', open_tasks: 6 }, { id: 7, name: 'Household', color: '#fff', icon: 'home', open_tasks: 2 }] });
    const lists = await appTester(App.triggers.list.operation.perform, { authData });
    expect(lists).toEqual([{ id: 1, name: 'Inbox' }, { id: 7, name: 'Household' }]);
    expect(App.triggers.list.display.hidden).toBe(true);
  });

  it('lists the tags by name', async () => {
    nock('https://tasqs.com').get('/v1/tags')
      .reply(200, { data: [{ id: 3, name: 'boat', color: '#14B8A6', open_tasks: 1 }] });
    const tags = await appTester(App.triggers.tag.operation.perform, { authData });
    expect(tags).toEqual([{ id: 3, name: 'boat' }]);
    expect(App.triggers.tag.display.hidden).toBe(true);
  });

  it('wires both dropdowns into the New Task filters', () => {
    const fields = Object.fromEntries(App.triggers.new_task.operation.inputFields.map((f) => [f.key, f]));
    expect(fields.list.dynamic).toBe('list.name.name');
    expect(fields.tag.dynamic).toBe('tag.name.name');
    expect(fields.list.required).toBe(false);
  });
});
