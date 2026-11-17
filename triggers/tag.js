'use strict';

const { API } = require('../lib/constants');

// Hidden: feeds the "Tag" filter dropdowns. Stores the tag's numeric id and
// shows its name, like lists.
const perform = async (z) => {
  const response = await z.request({ url: `${API}/tags` });
  return response.data.data.map((tag) => ({ id: tag.id, name: tag.name }));
};

module.exports = {
  key: 'tag',
  noun: 'Tag',
  display: {
    label: 'List of Tags',
    description: 'Hidden trigger that fills the Tag dropdowns.',
    hidden: true,
  },
  operation: {
    perform,
    sample: { id: 1, name: 'errands' },
  },
};
