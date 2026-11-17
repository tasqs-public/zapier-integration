'use strict';

const { API } = require('../lib/constants');
const { shapeTask, sampleTask, taskOutputFields } = require('../lib/task');

// The API's q matches the text in a title OR a description. A Zap that asks
// to "find the task called X" means the title first, so order the matches:
// exact title, then title containing the text, then description-only hits.
// Within each group the API's own order (newest first) is kept.
const rank = (task, needle) => {
  const title = String(task.title || '').trim().toLowerCase();
  if (title === needle) return 0;
  if (title.includes(needle)) return 1;
  return 2;
};

const perform = async (z, bundle) => {
  const text = String(bundle.inputData.title || '').trim();
  if (text.length < 2) {
    throw new z.errors.Error('Title must be at least 2 characters.', 'invalid_title', 422);
  }

  const params = { q: text.slice(0, 100), status: bundle.inputData.status || 'open', per_page: 25 };
  if (bundle.inputData.list_id) params.list_id = bundle.inputData.list_id;

  const response = await z.request({ url: `${API}/tasks`, params });
  const needle = text.toLowerCase();
  return response.data.data
    .map((task, index) => ({ task, index, rank: rank(task, needle) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ task }) => shapeTask(task));
};

module.exports = {
  key: 'find_task',
  noun: 'Task',
  display: {
    label: 'Find Task',
    description: 'Finds a task by its title.',
  },
  operation: {
    inputFields: [
      {
        key: 'title',
        label: 'Title',
        type: 'string',
        required: true,
        helpText: 'Text to look for. A task whose title is exactly this comes first, then titles containing it, then descriptions containing it.',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        required: false,
        choices: { open: 'Open', completed: 'Completed', all: 'Open or Completed' },
        default: 'open',
        helpText: 'Which tasks to search. Open tasks only if left empty.',
      },
      {
        key: 'list_id',
        label: 'List',
        type: 'integer',
        required: false,
        dynamic: 'list.id.name',
        helpText: 'Only search this list. Leave empty to search every list.',
      },
    ],
    perform,
    sample: sampleTask,
    outputFields: taskOutputFields,
  },
};
