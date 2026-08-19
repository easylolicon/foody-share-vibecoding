# Today Takeout Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js + Express + MySQL website where anonymous users publish 1-3 takeout photos with a nickname and short description, browse an adaptive feed, and like records.

**Architecture:** Express serves EJS pages and JSON APIs. A service layer separates post/like behavior from persistence and a `StorageProvider` interface separates local uploads from future COS/TOS storage. MySQL stores post metadata, image URLs/order, and anonymous visitor likes; migrations are executed by a small Node script.

**Tech Stack:** Node.js, Express, EJS, mysql2, multer, dotenv, Jest/Supertest, Playwright, vanilla JavaScript, CSS Grid/masonry-style columns.

---

### Task 1: Bootstrap the Node project and configuration

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/config.js`
- Create: `src/app.js`
- Create: `src/server.js`
- Test: `tests/config.test.js`

- [ ] **Step 1: Write the failing configuration test**

```js
test('loads required database settings and defaults upload directory', () => {
  const config = loadConfig({ DB_HOST: '127.0.0.1', DB_NAME: 'takeout' });
  expect(config.db.host).toBe('127.0.0.1');
  expect(config.db.name).toBe('takeout');
  expect(config.uploadDir).toBe('uploads');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/config.test.js`
Expected: FAIL because the project and `loadConfig` do not exist.

- [ ] **Step 3: Add the minimal project and configuration implementation**

Define scripts `dev`, `start`, `test`, and `migrate`; make `src/app.js` export an Express app without listening; make `src/server.js` load dotenv and call `app.listen`; expose `db.host`, `db.port`, `db.user`, `db.password`, `db.name`, `uploadDir`, and upload limits from environment variables.

- [ ] **Step 4: Run the configuration test**

Run: `npm test -- tests/config.test.js`
Expected: PASS.

- [ ] **Step 5: Commit the bootstrap**

Run: `git add package.json package-lock.json .env.example .gitignore src tests && git commit -m "chore: bootstrap takeout feed app"`

### Task 2: Add MySQL migrations and database access

**Files:**
- Create: `database/migrations/001_create_posts.sql`
- Create: `database/migrations/002_create_post_images.sql`
- Create: `database/migrations/003_create_post_likes.sql`
- Create: `database/run-migrations.js`
- Create: `src/db/pool.js`
- Create: `src/db/migrate.js`
- Test: `tests/migrations.test.js`

- [ ] **Step 1: Write the migration contract test**

The test reads migration files in lexical order and asserts that they create `posts`, `post_images`, `post_likes`, and a unique key on `(post_id, visitor_id)`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/migrations.test.js`
Expected: FAIL because migration files are missing.

- [ ] **Step 3: Write the SQL migrations**

Use InnoDB, `utf8mb4`, foreign keys with cascade delete, timestamp columns, a `like_count` default of zero, and indexes for `posts.created_at` and image ordering. Add a migration bookkeeping table in `run-migrations.js`; execute pending files in lexical order inside separate transactions and make reruns no-ops.

- [ ] **Step 4: Implement the mysql2 pool**

Create a promise pool from `src/config.js`; export `query`, `getConnection`, and `close` so services and tests can inject or close the pool.

- [ ] **Step 5: Run the migration contract test**

Run: `npm test -- tests/migrations.test.js`
Expected: PASS. When MySQL credentials are available, run `npm run migrate` against an empty database and rerun it to verify idempotence.

- [ ] **Step 6: Commit database foundation**

Run: `git add database src/db tests/migrations.test.js && git commit -m "feat: add mysql schema and migrations"`

### Task 3: Implement the storage provider and upload validation

**Files:**
- Create: `src/storage/storage-provider.js`
- Create: `src/storage/local-storage-provider.js`
- Create: `src/uploads/upload-middleware.js`
- Test: `tests/storage/local-storage-provider.test.js`
- Test: `tests/uploads/upload-validation.test.js`

- [ ] **Step 1: Write failing storage tests**

Cover saving a buffer to a generated filename, returning `/uploads/<filename>`, deleting the file, creating the upload directory, rejecting path traversal, accepting JPEG/PNG/WebP, rejecting other MIME types, enforcing three files maximum, and enforcing the configured byte limit.

- [ ] **Step 2: Run the focused tests**

Run: `npm test -- tests/storage tests/uploads`
Expected: FAIL because the provider and middleware do not exist.

- [ ] **Step 3: Implement `StorageProvider` and `LocalStorageProvider`**

Define methods `save(file)`, `delete(key)`, and `publicUrl(key)`. Use cryptographically random names while preserving a safe extension; resolve paths under the configured upload directory and reject paths that escape it.

- [ ] **Step 4: Implement Multer validation**

Configure memory or disk staging with `limits.files = 3` and `limits.fileSize` from config. Check MIME type and extension server-side; return typed validation errors that the API can turn into HTTP 400 responses.

- [ ] **Step 5: Run the focused tests**

Run: `npm test -- tests/storage tests/uploads`
Expected: PASS.

- [ ] **Step 6: Commit upload foundation**

Run: `git add src/storage src/uploads tests/storage tests/uploads && git commit -m "feat: add validated local image storage"`

### Task 4: Build post and like services with transactional behavior

**Files:**
- Create: `src/services/post-service.js`
- Create: `src/services/like-service.js`
- Create: `src/repositories/post-repository.js`
- Create: `src/repositories/like-repository.js`
- Test: `tests/services/post-service.test.js`
- Test: `tests/services/like-service.test.js`

- [ ] **Step 1: Write failing service tests**

Test post creation with one and three images, nickname/description length validation, rollback plus storage cleanup when a database insert fails, newest-first pagination with total/hasMore metadata, and like toggle behavior for first like, duplicate like, and unlike.

- [ ] **Step 2: Run the service tests to verify failure**

Run: `npm test -- tests/services`
Expected: FAIL because repositories and services are missing.

- [ ] **Step 3: Implement repository SQL**

Use parameterized queries for inserts, joins, pagination, and deletes. `findPage` must fetch posts ordered by `created_at DESC, id DESC`, then attach images ordered by `sort_order`.

- [ ] **Step 4: Implement transactional post creation**

Save each file through the provider, begin a MySQL transaction, insert the post and image rows, commit, and return the hydrated record. On any error, rollback and call `delete` for every saved key before rethrowing.

- [ ] **Step 5: Implement idempotent like toggling**

Within a transaction, check the unique like row for `(postId, visitorId)`. Insert and increment on a new like; delete and decrement (never below zero) when it exists. Return `{ liked, likeCount }`.

- [ ] **Step 6: Run the service tests**

Run: `npm test -- tests/services`
Expected: PASS.

- [ ] **Step 7: Commit the domain layer**

Run: `git add src/services src/repositories tests/services && git commit -m "feat: add post and like services"`

### Task 5: Expose REST APIs and error handling

**Files:**
- Create: `src/routes/post-routes.js`
- Create: `src/routes/like-routes.js`
- Create: `src/middleware/error-handler.js`
- Modify: `src/app.js`
- Test: `tests/api/posts-api.test.js`
- Test: `tests/api/likes-api.test.js`

- [ ] **Step 1: Write failing Supertest API tests**

Cover `GET /api/posts`, `GET /api/posts/:id`, multipart `POST /api/posts`, invalid payload 400 responses, missing records 404 responses, successful like toggles, and consistent JSON errors shaped as `{ error: { code, message, details? } }`.

- [ ] **Step 2: Run API tests to verify failure**

Run: `npm test -- tests/api`
Expected: FAIL because routes are not registered.

- [ ] **Step 3: Implement and register routes**

Inject the post service, like service, upload middleware, and visitor ID header/body extraction into route handlers. Return 201 for a created post, 200 for reads and likes, 400 for validation, and 404 for unknown posts.

- [ ] **Step 4: Add the centralized error handler**

Map validation, Multer, MySQL, and not-found errors to stable codes without exposing stack traces. Ensure cleanup errors are logged while the original request error is returned.

- [ ] **Step 5: Run API tests**

Run: `npm test -- tests/api`
Expected: PASS.

- [ ] **Step 6: Commit the API layer**

Run: `git add src/routes src/middleware src/app.js tests/api && git commit -m "feat: expose post and like apis"`

### Task 6: Build the EJS feed and publish modal

**Files:**
- Create: `views/layout.ejs`
- Create: `views/index.ejs`
- Create: `public/css/app.css`
- Create: `public/js/feed.js`
- Create: `public/js/publish-modal.js`
- Create: `public/js/visitor-id.js`
- Modify: `src/app.js`
- Test: `tests/ui/feed-render.test.js`

- [ ] **Step 1: Write the view smoke test**

Render `GET /` with a fixture post and assert the response contains the product name, card metadata, fixed publish button, modal fields, and accessible labels.

- [ ] **Step 2: Run the view test to verify failure**

Run: `npm test -- tests/ui/feed-render.test.js`
Expected: FAIL because EJS views and static assets are missing.

- [ ] **Step 3: Implement server-rendered shell, date tracks and card carousels**

Register EJS and static middleware. Group posts by local `YYYY-MM-DD` in `feed.js`, render each date as a labeled horizontal track, and give each card a fixed image ratio with an inline carousel. Use flex overflow for the track:

```css
.day-track { display: flex; overflow-x: auto; gap: 14px; }
.post-card { flex: 0 0 clamp(230px, 23vw, 310px); }
@media (max-width: 640px) {
  .day-group { display: block; }
  .post-card { flex-basis: min(78vw, 290px); }
}
```

The carousel updates one image, disables the edge arrow, and marks the active dot with `aria-current`. Add stable button dimensions, and a fixed circular publish control with a familiar plus icon and tooltip.

- [ ] **Step 4: Implement feed behavior**

`feed.js` fetches paginated posts, renders cards safely with text nodes/escaped values, opens the image detail modal, handles loading/empty/error states, and appends more records without duplicate IDs.

- [ ] **Step 5: Implement publish modal behavior**

`publish-modal.js` previews 1-3 selected images, supports removal and order changes, preserves nickname/description on failure, submits `FormData`, disables controls while pending, closes on success, and prepends the returned post.

- [ ] **Step 6: Implement anonymous visitor ID**

`visitor-id.js` creates a random ID with `crypto.randomUUID()` when available, stores it in localStorage, and supplies it to like requests.

- [ ] **Step 7: Run the view smoke test**

Run: `npm test -- tests/ui/feed-render.test.js`
Expected: PASS.

- [ ] **Step 8: Commit the feed UI**

Run: `git add views public src/app.js tests/ui && git commit -m "feat: add responsive feed and publish modal"`

### Task 7: Add end-to-end verification and runbook

**Files:**
- Create: `playwright.config.js`
- Create: `tests/e2e/feed-flow.spec.js`
- Create: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Write the Playwright flow**

Use fixture image files to open the home page, click the floating publish control, submit three images plus nickname/description, assert the new card appears first, click like, and assert the count changes.

- [ ] **Step 2: Run the E2E test against the local app**

Run: `npm run migrate && npm run dev` in one terminal, then `npx playwright test tests/e2e/feed-flow.spec.js`.
Expected: the flow passes against a configured MySQL database and local upload directory.

- [ ] **Step 3: Document setup and future storage replacement**

Document Node version, `npm install`, MySQL database creation, `.env` values, `npm run migrate`, `npm run dev`, upload limits, and the `StorageProvider` methods/configuration that a COS/TOS adapter must implement.

- [ ] **Step 4: Run the complete verification suite**

Run: `npm test && npx playwright test`
Expected: all unit/API/view tests and the browser flow pass; manually check desktop multi-column, tablet, and mobile two-column layouts.

- [ ] **Step 5: Commit verification and docs**

Run: `git add README.md playwright.config.js tests/e2e .env.example && git commit -m "test: verify takeout feed end to end"`

## Self-review checklist

- Spec coverage: architecture, MySQL migrations, local storage abstraction, adaptive feed, modal publishing, anonymous likes, failure cleanup, and Playwright flow each have dedicated tasks.
- Placeholder scan: no unresolved TODO/TBD steps; every implementation action names files, behavior, commands, and expected results.
- Type consistency: services return hydrated post records; like service returns `{ liked, likeCount }`; API preserves those names; the browser consumes the same response shape.
