/* globals describe, it, expect */
'use strict';

const fs = require('fs');
const path = require('path');
const zapier = require('zapier-platform-core');
const { App } = require('./helpers');

describe('integration definition', () => {
  it('passes the platform schema (the local half of `zapier validate`)', async () => {
    const { results } = await zapier.createAppHandler(App)({ command: 'validate' });
    expect(results).toEqual([]);
  });

  it('is linked to the Tasqs app on Zapier', () => {
    const rc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.zapierapprc'), 'utf8'));
    expect(rc).toEqual({ id: 249909, key: 'App249909' });
  });

  it('calls only tasqs.com', () => {
    const files = ['index.js', 'authentication.js', 'middleware.js', 'lib/constants.js', 'lib/task.js',
      ...['triggers', 'creates', 'searches'].flatMap((dir) =>
        fs.readdirSync(path.join(__dirname, '..', dir)).map((f) => `${dir}/${f}`))];
    for (const file of files) {
      const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      const hosts = [...src.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1].toLowerCase());
      for (const host of hosts) expect(`${file}: ${host}`).toBe(`${file}: tasqs.com`);
    }
  });

  it('offers exactly the planned triggers, actions and search', () => {
    expect(Object.keys(App.triggers).sort()).toEqual(['list', 'new_task', 'open_task', 'tag', 'task_completed']);
    expect(Object.keys(App.creates).sort()).toEqual(['complete_task', 'create_task']);
    expect(Object.keys(App.searches)).toEqual(['find_task']);
    expect(App.searchOrCreates.find_task).toMatchObject({ search: 'find_task', create: 'create_task' });
  });

  it('gives every visible step a label, a description and a sample', () => {
    const steps = [...Object.values(App.triggers), ...Object.values(App.creates), ...Object.values(App.searches)];
    for (const step of steps) {
      expect(step.display.label).toBeTruthy();
      expect(step.display.description).toMatch(/\.$/);
      expect(step.operation.sample).toBeTruthy();
      if (!step.display.hidden) expect(step.operation.sample).not.toHaveProperty('notes');
    }
  });

  it('holds no credentials', () => {
    const files = ['index.js', 'authentication.js', 'middleware.js', 'lib/constants.js', '.zapierapprc', 'package.json'];
    for (const file of files) {
      const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      expect(src).not.toMatch(/tqc_[0-9a-f]{16,}|tqo_[0-9a-f]{16,}|tqr_[0-9a-f]{16,}|tqs_[0-9a-f]{16,}/);
    }
    expect(fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8')).toMatch(/^\.env$/m);
  });
});
