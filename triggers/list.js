'use strict';

const { API } = require('../lib/constants');

// Hidden: feeds the "List" dropdowns. The dropdown stores the list's numeric
// id and shows its name, so a Zap survives the list being renamed.
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
