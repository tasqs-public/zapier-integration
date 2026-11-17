'use strict';

const { API } = require('../lib/constants');
const { shapeTask, sampleTask, taskOutputFields } = require('../lib/task');

// Zapier hands a date field over as a full timestamp in the Zap's own
// timezone ("2026-12-01T09:00:00-06:00"). Tasqs due dates are calendar days,
// so keep the day as the user wrote it and drop the rest.
const toDay = (value) => {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value || '').trim());
  return match ? match[1] : null;
};

// Tags arrive as a list, but a single mapped value may itself hold several
// names ("errands, car"). Split, trim, and drop blanks and repeats.
const toTags = (value) => {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  const names = items
    .flatMap((item) => String(item).split(','))
    .map((name) => name.trim())
    .filter(Boolean);
  return [...new Set(names)];
};

const perform = async (z, bundle) => {
  const input = bundle.inputData;
  const body = { title: String(input.title || '').trim() };

  if (input.description) body.description = input.description;
  if (input.priority) body.priority = input.priority;
  if (input.list_id) body.list_id = input.list_id;
  if (input.repeats) body.recurrence = input.repeats;

  const due = toDay(input.due_date);
  if (input.due_date && !due) {
    throw new z.errors.Error('Due Date must be a date, such as 2026-12-01.', 'invalid_due_date', 422);
  }
  if (due) body.due_date = due;

  const tags = toTags(input.tags);
  if (tags.length) body.tags = tags;

  const response = await z.request({ url: `${API}/tasks`, method: 'POST', body });
  return shapeTask(response.data.task);
};

module.exports = {
  key: 'create_task',
  noun: 'Task',
  display: {
    label: 'Create Task',
    description: 'Creates a new task.',
  },
  operation: {
    inputFields: [
      { key: 'title', label: 'Title', type: 'string', required: true, helpText: 'What needs doing. Up to 255 characters.' },
      { key: 'description', label: 'Description', type: 'text', required: false },
      {
        key: 'list_id',
        label: 'List',
        type: 'integer',
        required: false,
        dynamic: 'list.id.name',
        helpText: 'The list to add the task to. Leave empty to use your first list.',
      },
      { key: 'due_date', label: 'Due Date', type: 'datetime', required: false, helpText: 'Only the day is used. Leave empty for no due date.' },
      {
        key: 'priority',
        label: 'Priority',
        type: 'string',
        required: false,
        choices: { low: 'Low', medium: 'Medium', high: 'High' },
        helpText: 'Medium if left empty.',
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'string',
        list: true,
        required: false,
        helpText: 'Tag names. A tag you do not have yet is created.',
      },
      {
        key: 'repeats',
        label: 'Repeats',
        type: 'string',
        required: false,
        choices: { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every Two Weeks', monthly: 'Monthly', yearly: 'Yearly' },
        helpText: 'Leave empty for a one-time task. A repeating task with no due date starts one interval from today.',
      },
    ],
    perform,
    sample: sampleTask,
    outputFields: taskOutputFields,
  },
  // Exposed for tests.
  _toDay: toDay,
  _toTags: toTags,
};
