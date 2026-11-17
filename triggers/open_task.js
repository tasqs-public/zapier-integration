'use strict';

const { API } = require('../lib/constants');

// Hidden: feeds the "Task" dropdown on Complete Task. Open tasks only, newest
// first, a page at a time ("Load more" in the Zap editor asks for the next
// page). The dropdown stores the task's id and shows its title.
const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${API}/tasks`,
    params: { status: 'open', per_page: 50, page: (bundle.meta && bundle.meta.page ? bundle.meta.page : 0) + 1 },
  });
  return response.data.data.map((task) => ({ id: task.id, title: task.title }));
};

module.exports = {
  key: 'open_task',
  noun: 'Task',
  display: {
    label: 'List of Open Tasks',
    description: 'Hidden trigger that fills the Task dropdown.',
    hidden: true,
  },
  operation: {
    perform,
    canPaginate: true,
    sample: { id: '3f9c2a7e5b1d4e8fa6c0d2b4e6f81a3c', title: 'Renew the car registration' },
  },
};
