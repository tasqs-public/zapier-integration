'use strict';

const authentication = require('./authentication');
const { befores, afters } = require('./middleware');
const newTask = require('./triggers/new_task');
const taskCompleted = require('./triggers/task_completed');
const list = require('./triggers/list');
const tag = require('./triggers/tag');
const openTask = require('./triggers/open_task');
const createTask = require('./creates/create_task');
const completeTask = require('./creates/complete_task');
const findTask = require('./searches/find_task');

// creates/create_task.js also exports two helpers for its tests; the platform
// schema allows no extra keys, so hand it the definition only.
const { _toDay, _toTags, ...createTaskDefinition } = createTask;

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
    [taskCompleted.key]: taskCompleted,
    [list.key]: list,
    [tag.key]: tag,
    [openTask.key]: openTask,
  },
  searches: {
    [findTask.key]: findTask,
  },
  creates: {
    [createTaskDefinition.key]: createTaskDefinition,
    [completeTask.key]: completeTask,
  },
  // "Find Task" with a "create it if it doesn't exist" checkbox.
  searchOrCreates: {
    [findTask.key]: {
      key: findTask.key,
      display: {
        label: 'Find or Create Task',
        description: 'Finds a task by its title, or creates it if there is no match.',
      },
      search: findTask.key,
      create: createTaskDefinition.key,
    },
  },
  resources: {},
};
