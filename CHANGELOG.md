## 1.2.0

- New trigger: Task Completed (`task_completed`). Fires again if a task is reopened and finished a second time.
- New action: Create Task (`create_task`), with list, due date, priority, tags and repeat.
- New action: Complete Task (`complete_task`).
- New search: Find Task (`find_task`), and Find or Create Task. An exact title match comes first.
- Update trigger `new_task`: the List and Tag filters now store the list's or tag's ID, so a Zap keeps working after a rename. A Zap built on 1.1.0 needs its List and Tag filters picked again.

## 1.1.0

- First version built from code. It replaces the hand-built 1.0.0, which had sign-in only.
- Sign in with Tasqs (OAuth). Access is refreshed automatically.
- New trigger: New Task (`new_task`), with optional List and Tag filters.
