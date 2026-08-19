CREATE TABLE IF NOT EXISTS post_images (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_post_images_order ON post_images (post_id, sort_order);
