# Tasqs for Zapier

The [Tasqs](https://tasqs.com) integration for Zapier, built with the Zapier
Platform CLI. It talks only to the Tasqs API at `https://tasqs.com/v1`
([API reference](https://tasqs.com/api-documentation.php)).

Using it needs a Tasqs account on the **Power User** plan, the same plan that
includes the API.

## What it does

| Kind | Name | Notes |
|---|---|---|
| Sign-in | OAuth 2 | The user approves access on Tasqs's own consent screen. No fields to fill in. |
| Trigger | New Task | Fires for each newly created task. Optional List and Tag filters. |

Planned next: Task Completed (trigger), Create Task and Complete Task
(actions), Find Task (search).

A task as a Zap sees it: `id`, `title`, `description`, `status`, `priority`,
`due_date`, `someday`, `check_back_on`, `list_name`, `tags`, `tags_text`,
`repeats`, `has_attachment`, `created_at`, `updated_at`, `completed_at`
(times in ISO 8601 UTC) and `url`. **Task Notes are never included**: they are
the owner's private side notes.

## Develop

Needs Node 22 or newer.

```
npm install
npm test
```

The tests make no network calls: every request is answered by a mock, and a
test that tries to reach a real server fails. They cover sign-in (including
the client credentials on a token refresh), error messages, the trigger, the
task shape, and the platform's schema check.

## Publish (maintainers)

The integration is linked to Zapier app `249909` by `.zapierapprc`.

```
npm install -g zapier-platform-cli
zapier-platform login
zapier-platform validate
zapier-platform push
zapier-platform env:set 1.1.0 CLIENT_ID=<client id> CLIENT_SECRET=<client secret>
```

- Push first. `env:set` attaches the values to a version, and a version does
  not exist on Zapier until it has been pushed ("Version 1.1.0 doesn't exist"
  means the order was reversed). Each new version needs its own `env:set`.

- The client id and secret are the ones registered for Zapier on the Tasqs
  server. They are set per version with `env:set` and are **never** written to
  this repository, a `.env` file that gets committed, or an issue.
- `push` uploads the version named in `package.json`. To change a version
  that people already use, raise the version number, add a `CHANGELOG.md`
  entry, push, then `zapier-platform promote <version>` and
  `zapier-platform migrate <old> <new>`.
- Invite a tester: `zapier-platform users:add someone@example.com`.

## Layout

```
index.js            the integration definition
authentication.js   OAuth 2 against tasqs.com
middleware.js       Bearer header on API calls; API errors shown in words
lib/constants.js    every address the integration uses
lib/task.js         the task shape, its sample and field labels
triggers/           new_task, plus the hidden list and tag dropdown feeds
test/               jest tests (mocked HTTP)
```

## License

MIT. See [LICENSE](LICENSE).
