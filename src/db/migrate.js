const fs = require('node:fs/promises');
const path = require('node:path');

const MIGRATION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

async function runMigrations(pool, migrationsDir) {
  await pool.query(MIGRATION_TABLE_SQL);
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();

  const [rows] = await pool.query('SELECT filename FROM schema_migrations');
  const executed = new Set(rows.map((row) => row.filename));

  for (const filename of files) {
    if (executed.has(filename)) continue;

    const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const statement of sql.split(';').map((item) => item.trim()).filter(Boolean)) {
        await connection.query(statement);
      }
      await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  return files.filter((filename) => !executed.has(filename));
}

module.exports = { runMigrations };
