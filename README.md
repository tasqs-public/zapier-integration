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
| Trigger | Task Completed | Fires when a task is marked as done, and again if it is reopened and finished a second time. Optional List and Tag filters. |
| Action | Create Task | Title, description, list, due date, priority, tags, repeat. |
| Action | Complete Task | Marks a task as done by its Task ID. Safe to run twice. |
| Search | Find Task | By title text; an exact title match comes first. Also offered as Find or Create Task. |

List and Tag dropdowns store the numeric id and show the name, so a Zap keeps
working after a list or tag is renamed in Tasqs. Tags on Create Task are typed
as names, so a Zap can create a tag that does not exist yet.

A task as a Zap sees it: `id`, `title`, `description`, `status`, `priority`,
`due_date`, `someday`, `check_back_on`, `list_id`, `list_name`, `tags`, `tags_text`,
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
the client credentials on a token refresh), error messages, every trigger,
action and search, the task shape, and the platform's schema check.

## Publish (maintainers)

The integration is linked to Zapier app `249909` by `.zapierapprc`.

```
npm install -g zapier-platform-cli
zapier-platform login
zapier-platform validate
zapier-platform push
zapier-platform env:set <version> CLIENT_ID=<client id> CLIENT_SECRET=<client secret>
```

- Push first. `env:set` attaches the values to a version, and a version does
  not exist on Zapier until it has been pushed ("Version x.y.z doesn't exist"
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
triggers/           new_task, task_completed, plus the hidden list and tag dropdown feeds
creates/            create_task, complete_task
searches/           find_task
test/               jest tests (mocked HTTP)
```

## License

MIT. See [LICENSE](LICENSE).
