'use strict';

const { API } = require('../lib/constants');
const { shapeTask, sampleTask, taskOutputFields, listField, tagField, addFilters } = require('../lib/task');

// Polling trigger. The API returns tasks newest-created first, which is what
// Zapier needs: it remembers the ids it has seen and fires for the new ones.
//
// No status filter: a task that was created and finished between two polls
// is still a new task. Each occurrence of a repeating task is its own task
// with its own id, so it fires once per occurrence.
const perform = async (z, bundle) => {
  const params = addFilters({ per_page: 50 }, bundle.inputData);
  const response = await z.request({ url: `${API}/tasks`, params });
  return response.data.data.map(shapeTask);
};

module.exports = {
  key: 'new_task',
  noun: 'Task',
  display: {
    label: 'New Task',
    description: 'Triggers when a new task is created.',
  },
  operation: {
    inputFields: [
      listField('Only trigger for tasks in this list. Leave empty for every list.'),
      tagField('Only trigger for tasks with this tag. Leave empty for any.'),
    ],
    perform,
    sample: sampleTask,
    outputFields: taskOutputFields,
  },
};
