'use strict';

const { SITE } = require('./constants');

// The API reports times as "YYYY-MM-DD HH:MM:SS" in UTC. Zapier (and most
// apps a Zap hands the value to) expect ISO 8601 with an explicit zone.
const isoUtc = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(' ', 'T')}Z`
    : value || null;

/**
 * Turn an API task object into what a Zap sees.
 *
 * Task Notes are deliberately left out: they are the owner's private side
 * notes, and a Zap would copy them into other apps. Nested objects are
 * flattened because Zap fields map most cleanly from top-level values.
 */
const shapeTask = (task) => {
  const tags = Array.isArray(task.tags) ? task.tags.map((t) => t.name) : [];
  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    due_date: task.due_date || null,
    someday: Boolean(task.someday),
    check_back_on: task.check_back_on || null,
    list_id: task.list ? task.list.id : null,
    list_name: task.list ? task.list.name : null,
    tags,
    tags_text: tags.join(', '),
    repeats: task.recurring ? task.recurring.cadence || null : null,
    has_attachment: Boolean(task.attachment),
    created_at: isoUtc(task.created_at),
    updated_at: isoUtc(task.updated_at),
    completed_at: isoUtc(task.completed_at),
    url: `${SITE}/dashboard.php?ref=${task.id}`,
  };
};

// Shown in the Zap editor before the user has pulled real data.
const sampleTask = {
  id: '3f9c2a7e5b1d4e8fa6c0d2b4e6f81a3c',
  title: 'Renew the car registration',
  description: 'Form is on the DMV site. Needs the insurance card.',
  status: 'open',
  priority: 'high',
  due_date: '2026-12-01',
  someday: false,
  check_back_on: null,
  list_id: 21,
  list_name: 'Household',
  tags: ['errands', 'car'],
  tags_text: 'errands, car',
  repeats: null,
  has_attachment: false,
  created_at: '2026-11-17T15:04:05Z',
  updated_at: '2026-11-17T15:04:05Z',
  completed_at: null,
  url: `${SITE}/dashboard.php?ref=3f9c2a7e5b1d4e8fa6c0d2b4e6f81a3c`,
};

const taskOutputFields = [
  { key: 'id', label: 'Task ID', primary: true },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'someday', label: 'Is a Someday Task', type: 'boolean' },
  { key: 'check_back_on', label: 'Check Back Date' },
  { key: 'list_id', label: 'List ID', type: 'integer' },
  { key: 'list_name', label: 'List' },
  { key: 'tags_text', label: 'Tags (comma separated)' },
  { key: 'repeats', label: 'Repeats' },
  { key: 'has_attachment', label: 'Has an Attachment', type: 'boolean' },
  { key: 'created_at', label: 'Created At', type: 'datetime' },
  { key: 'updated_at', label: 'Updated At', type: 'datetime' },
  { key: 'completed_at', label: 'Completed At', type: 'datetime' },
  { key: 'url', label: 'Link to the Task' },
];

// Shared "List" and "Tag" filter fields. Both store the numeric id, not the
// name: a Zap must keep working after its list or tag is renamed in Tasqs.
const listField = (helpText) => ({
  key: 'list_id',
  label: 'List',
  type: 'integer',
  required: false,
  dynamic: 'list.id.name',
  helpText,
});
const tagField = (helpText) => ({
  key: 'tag_id',
  label: 'Tag',
  type: 'integer',
  required: false,
  dynamic: 'tag.id.name',
  helpText,
});

// Copy the list/tag filters from a Zap step's input onto API query params.
const addFilters = (params, inputData) => {
  if (inputData.list_id) params.list_id = inputData.list_id;
  if (inputData.tag_id) params.tag_id = inputData.tag_id;
  return params;
};

module.exports = { shapeTask, sampleTask, taskOutputFields, isoUtc, listField, tagField, addFilters };
