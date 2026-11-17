'use strict';

const { API } = require('../lib/constants');
const { shapeTask, sampleTask, taskOutputFields, listField, tagField, addFilters } = require('../lib/task');

// Polling trigger. sort=completed returns the most recently FINISHED tasks
// first, however long ago they were created; the default (creation) order
// would bury a task made in March and finished today.
//
// Deduplication uses the task id together with its completion time (see
// outputFields below), so a task that is reopened and finished again fires
// again.
const perform = async (z, bundle) => {
  const params = addFilters({ status: 'completed', sort: 'completed', per_page: 50 }, bundle.inputData);
  const response = await z.request({ url: `${API}/tasks`, params });
  return response.data.data.map(shapeTask);
};

const outputFields = taskOutputFields.map((field) =>
  field.key === 'completed_at' ? { ...field, primary: true } : field
);

module.exports = {
  key: 'task_completed',
  noun: 'Task',
  display: {
    label: 'Task Completed',
    description: 'Triggers when a task is marked as done.',
  },
  operation: {
    inputFields: [
      listField('Only trigger for tasks in this list. Leave empty for every list.'),
      tagField('Only trigger for tasks with this tag. Leave empty for any.'),
    ],
    perform,
    sample: {
      ...sampleTask,
      status: 'completed',
      completed_at: '2026-11-18T09:30:00Z',
      updated_at: '2026-11-18T09:30:00Z',
    },
    outputFields,
  },
};
