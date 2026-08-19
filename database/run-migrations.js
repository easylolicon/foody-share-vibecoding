require('dotenv').config();

const path = require('node:path');
const pool = require('../src/db/pool');
const { runMigrations } = require('../src/db/migrate');

async function main() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const applied = await runMigrations(pool, migrationsDir);
  console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date.');
}

main()
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
