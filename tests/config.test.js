const { loadConfig } = require('../src/config');

test('loads the local SQLite file and defaults upload directory', () => {
  const config = loadConfig({ SQLITE_FILE: 'tmp/takeout.sqlite' });

  expect(config.dbFile).toBe('tmp/takeout.sqlite');
  expect(config.uploadDir).toBe('uploads');
});
