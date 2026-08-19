const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

class SqliteDatabase {
  constructor(filename) {
    this.filename = filename === ':memory:' ? filename : path.resolve(filename);
    if (this.filename !== ':memory:') fs.mkdirSync(path.dirname(this.filename), { recursive: true });
    this.database = new DatabaseSync(this.filename);
    this.database.exec('PRAGMA foreign_keys = ON');
  }

  query(sql, params = []) {
    const normalized = sql.replace(/\s+FOR UPDATE\b/gi, '').trim();
    const statement = this.database.prepare(normalized);
    const isRead = /^(SELECT|PRAGMA|WITH)\b/i.test(normalized);
    if (isRead) return Promise.resolve([statement.all(...params), []]);
    const result = statement.run(...params);
    return Promise.resolve([{ insertId: Number(result.lastInsertRowid || 0), affectedRows: result.changes }, []]);
  }

  getConnection() { return Promise.resolve(this); }
  beginTransaction() { this.database.exec('BEGIN'); return Promise.resolve(); }
  commit() { this.database.exec('COMMIT'); return Promise.resolve(); }
  rollback() { this.database.exec('ROLLBACK'); return Promise.resolve(); }
  release() {}
  end() { this.database.close(); return Promise.resolve(); }
}

function createSqliteDb(filename) {
  return new SqliteDatabase(filename);
}

module.exports = { SqliteDatabase, createSqliteDb };
