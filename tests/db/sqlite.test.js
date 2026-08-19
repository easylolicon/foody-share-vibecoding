const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createSqliteDb } = require('../../src/db/sqlite');
const { runMigrations } = require('../../src/db/migrate');

test('creates a local SQLite file and applies migrations idempotently', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'takeout-sqlite-'));
  const filename = path.join(directory, 'takeout.sqlite');
  const db = createSqliteDb(filename);
  const migrationsDir = path.join(__dirname, '..', '..', 'database', 'migrations');

  await expect(runMigrations(db, migrationsDir)).resolves.toHaveLength(3);
  await expect(runMigrations(db, migrationsDir)).resolves.toHaveLength(0);
  const [tables] = await db.query("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
  expect(tables.map((table) => table.name)).toEqual([
    'post_images', 'post_likes', 'posts', 'schema_migrations',
  ]);
  await db.end();
  await expect(fs.stat(filename)).resolves.toBeDefined();
  await fs.rm(directory, { recursive: true, force: true });
});
