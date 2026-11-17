'use strict';

const { API } = require('../lib/constants');

// Hidden: feeds the "List" dropdowns. Tasqs addresses lists by NAME on the
// API, so the dropdown's value is the name.
const perform = async (z) => {
  const response = await z.request({ url: `${API}/lists` });
  return response.data.data.map((list) => ({ id: list.id, name: list.name }));
};

module.exports = {
  key: 'list',
  noun: 'List',
  display: {
    label: 'List of Lists',
    description: 'Hidden trigger that fills the List dropdowns.',
    hidden: true,
  },
  operation: {
    perform,
    sample: { id: 1, name: 'Household' },
  },
};
