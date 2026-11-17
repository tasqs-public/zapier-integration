'use strict';

const { API } = require('../lib/constants');
const { shapeTask, sampleTask, taskOutputFields } = require('../lib/task');

// Marks a task as done. The API call is idempotent: completing a task that
// is already done returns it unchanged, so a Zap that runs twice is harmless.
// A repeating task gets its next occurrence created by Tasqs, exactly as when
// it is ticked off in the app.
const perform = async (z, bundle) => {
  const id = String(bundle.inputData.task_id || '').trim().toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(id)) {
    throw new z.errors.Error(
      'Task must be a Tasqs task ID (32 letters and digits). Map the "Task ID" from an earlier Tasqs step.',
      'invalid_task_id',
      422
    );
  }
  const response = await z.request({ url: `${API}/tasks/${id}/complete`, method: 'POST', body: {} });
  const next = response.data.next_occurrence;
  return {
    ...shapeTask(response.data.task),
    next_occurrence_id: next && next.id ? next.id : null,
  };
};

module.exports = {
  key: 'complete_task',
  noun: 'Task',
  display: {
    label: 'Complete Task',
    description: 'Marks a task as done.',
  },
  operation: {
    inputFields: [
      {
        key: 'task_id',
        label: 'Task',
        type: 'string',
        required: true,
        dynamic: 'open_task.id.title',
        search: 'find_task.id',
        helpText: 'Pick one of your open tasks, or map the Task ID from a Tasqs trigger or a Find Task step.',
      },
    ],
    perform,
    sample: {
      ...sampleTask,
      status: 'completed',
      completed_at: '2026-11-18T09:30:00Z',
      updated_at: '2026-11-18T09:30:00Z',
      next_occurrence_id: null,
    },
    outputFields: [
      ...taskOutputFields,
      { key: 'next_occurrence_id', label: 'Next Occurrence Task ID (repeating tasks)' },
    ],
  },
};
