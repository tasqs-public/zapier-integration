'use strict';

const authentication = require('./authentication');
const { befores, afters } = require('./middleware');
const newTask = require('./triggers/new_task');
const list = require('./triggers/list');
const tag = require('./triggers/tag');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // Leave the user's input as typed. Every perform() here already treats an
  // empty value as "not set", so nothing depends on the platform stripping
  // them (Zapier's D028 recommendation).
  flags: { cleanInputData: false },

  authentication,
  beforeRequest: [...befores],
  afterResponse: [...afters],

  triggers: {
    [newTask.key]: newTask,
    [list.key]: list,
    [tag.key]: tag,
  },
  searches: {},
  creates: {},
  resources: {},
};
