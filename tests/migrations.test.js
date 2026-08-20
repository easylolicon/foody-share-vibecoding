const fs = require('node:fs');
const path = require('node:path');

test('migration files define the required schema contracts', () => {
  const dir = path.join(__dirname, '..', 'database', 'migrations');
  const files = fs.readdirSync(dir).sort();
  const sql = files.map((file) => fs.readFileSync(path.join(dir, file), 'utf8')).join('\n');

  expect(files).toEqual([
    '001_create_posts.sql',
    '002_create_post_images.sql',
    '003_create_post_likes.sql',
    '004_add_post_like_nickname.sql',
  ]);
  expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS posts/i);
  expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS post_images/i);
  expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS post_likes/i);
  expect(sql).toMatch(/UNIQUE\s*\(post_id, visitor_id\)/i);
  expect(sql).toMatch(/ADD COLUMN nickname/i);
});
