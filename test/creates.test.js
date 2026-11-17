/* globals describe, it, expect, afterEach */
'use strict';

const { App, appTester, authData, apiTask, nock } = require('./helpers');
const { _toDay: toDay, _toTags: toTags } = require('../creates/create_task');

const created = (overrides) => ({ task: { ...apiTask(overrides), subtasks: [] } });

describe('Create Task', () => {
  afterEach(() => nock.cleanAll());

  it('sends only what the user filled in', async () => {
    let body;
    nock('https://tasqs.com', { reqheaders: { authorization: 'Bearer tqo_access' } })
      .post('/v1/tasks', (b) => { body = b; return true; })
      .reply(201, created({ title: 'Buy milk' }));

    const task = await appTester(App.creates.create_task.operation.perform, {
      authData, inputData: { title: '  Buy milk  ', description: '', list_id: '', due_date: '', priority: '', tags: [], repeats: '' },
    });

    expect(body).toEqual({ title: 'Buy milk' });
    expect(task.title).toBe('Buy milk');
    expect(task).not.toHaveProperty('notes');
    expect(task).not.toHaveProperty('subtasks');
  });

  it('maps every field onto the API, with the list by id', async () => {
    let body;
    nock('https://tasqs.com').post('/v1/tasks', (b) => { body = b; return true; }).reply(201, created());

    await appTester(App.creates.create_task.operation.perform, {
      authData,
      inputData: {
        title: 'Renew registration', description: 'Needs the insurance card.', list_id: 21,
        due_date: '2026-12-01T09:00:00-06:00', priority: 'high', tags: ['errands, car', ' car ', ''], repeats: 'yearly',
      },
    });

    expect(body).toEqual({
      title: 'Renew registration',
      description: 'Needs the insurance card.',
      list_id: 21,
      due_date: '2026-12-01',
      priority: 'high',
      tags: ['errands', 'car'],
      recurrence: 'yearly',
    });
    expect(body).not.toHaveProperty('list');
    expect(body).not.toHaveProperty('notes');
  });

  it('keeps the calendar day the user wrote, whatever the timezone offset', () => {
    expect(toDay('2026-12-01T23:30:00-06:00')).toBe('2026-12-01');
    expect(toDay('2026-12-01T00:15:00+13:00')).toBe('2026-12-01');
    expect(toDay('2026-12-01')).toBe('2026-12-01');
    expect(toDay('')).toBeNull();
    expect(toDay('next Tuesday')).toBeNull();
  });

  it('refuses a due date it cannot read instead of dropping it', async () => {
    await expect(appTester(App.creates.create_task.operation.perform, {
      authData, inputData: { title: 'x', due_date: 'next Tuesday' },
    })).rejects.toThrow('Due Date must be a date');
  });

  it('splits, trims and de-duplicates tag names', () => {
    expect(toTags(['a, b', 'b', ' c '])).toEqual(['a', 'b', 'c']);
    expect(toTags('solo')).toEqual(['solo']);
    expect(toTags(undefined)).toEqual([]);
    expect(toTags([''])).toEqual([]);
  });

  it("passes the API's refusal on in its own words", async () => {
    nock('https://tasqs.com').post('/v1/tasks')
      .reply(403, { error: { code: 'limit_reached', message: 'You have reached your plan limit of 10,000 tasks.' } });
    await expect(appTester(App.creates.create_task.operation.perform, { authData, inputData: { title: 'x' } }))
      .rejects.toThrow('You have reached your plan limit of 10,000 tasks.');
  });

  it('has no Notes field', () => {
    const keys = App.creates.create_task.operation.inputFields.map((f) => f.key);
    expect(keys).toEqual(['title', 'description', 'list_id', 'due_date', 'priority', 'tags', 'repeats']);
  });
});

describe('Complete Task', () => {
  afterEach(() => nock.cleanAll());
  const id = '05eca9cb53fe23166b6293771bfeb6ab';

  it('completes the task by id and returns it', async () => {
    nock('https://tasqs.com', { reqheaders: { authorization: 'Bearer tqo_access' } })
      .post(`/v1/tasks/${id}/complete`)
      .reply(200, { task: { ...apiTask({ status: 'completed', completed_at: '2026-11-17 20:42:17' }), subtasks: [] }, next_occurrence: null });

    const task = await appTester(App.creates.complete_task.operation.perform, { authData, inputData: { task_id: ` ${id.toUpperCase()} ` } });

    expect(task.id).toBe(id);
    expect(task.status).toBe('completed');
    expect(task.completed_at).toBe('2026-11-17T20:42:17Z');
    expect(task.next_occurrence_id).toBeNull();
    expect(task).not.toHaveProperty('notes');
  });

  it('reports the next occurrence of a repeating task', async () => {
    nock('https://tasqs.com').post(`/v1/tasks/${id}/complete`)
      .reply(200, { task: apiTask({ status: 'completed' }), next_occurrence: { id: 'ffffffffffffffffffffffffffffffff', due_date: '2026-11-24' } });
    const task = await appTester(App.creates.complete_task.operation.perform, { authData, inputData: { task_id: id } });
    expect(task.next_occurrence_id).toBe('ffffffffffffffffffffffffffffffff');
  });

  it('refuses something that is not a task id before calling the API', async () => {
    for (const bad of ['', 'Buy milk', '12345', `${id}0`]) {
      await expect(appTester(App.creates.complete_task.operation.perform, { authData, inputData: { task_id: bad } }))
        .rejects.toThrow('Task must be a Tasqs task ID');
    }
    expect(nock.pendingMocks()).toEqual([]);
  });

  it('says so when the task does not exist', async () => {
    nock('https://tasqs.com').post(`/v1/tasks/${id}/complete`)
      .reply(404, { error: { code: 'not_found', message: 'Task not found.' } });
    await expect(appTester(App.creates.complete_task.operation.perform, { authData, inputData: { task_id: id } }))
      .rejects.toThrow('Task not found.');
  });

  it('can be fed by a Find Task step', () => {
    const [field] = App.creates.complete_task.operation.inputFields;
    expect(field).toMatchObject({ key: 'task_id', required: true, search: 'find_task.id' });
  });

  it('offers a dropdown of open tasks, a page at a time', async () => {
    const [field] = App.creates.complete_task.operation.inputFields;
    expect(field.dynamic).toBe('open_task.id.title');
    expect(App.triggers.open_task.display.hidden).toBe(true);
    expect(App.triggers.open_task.operation.canPaginate).toBe(true);

    const queries = [];
    nock('https://tasqs.com').get('/v1/tasks').query((q) => { queries.push(q); return true; }).times(2)
      .reply(200, { data: [apiTask({ title: 'Learn to sail' })], pagination: {} });

    const first = await appTester(App.triggers.open_task.operation.perform, { authData, meta: {} });
    await appTester(App.triggers.open_task.operation.perform, { authData, meta: { page: 1 } });

    expect(queries).toEqual([
      { status: 'open', per_page: '50', page: '1' },
      { status: 'open', per_page: '50', page: '2' },
    ]);
    expect(first).toEqual([{ id: '05eca9cb53fe23166b6293771bfeb6ab', title: 'Learn to sail' }]);
  });
});
