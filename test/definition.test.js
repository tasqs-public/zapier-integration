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
      ...fs.readdirSync(path.join(__dirname, '..', 'triggers')).map((f) => `triggers/${f}`)];
    for (const file of files) {
      const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      const hosts = [...src.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1].toLowerCase());
      for (const host of hosts) expect(`${file}: ${host}`).toBe(`${file}: tasqs.com`);
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
