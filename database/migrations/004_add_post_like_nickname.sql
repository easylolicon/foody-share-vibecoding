ALTER TABLE post_likes ADD COLUMN nickname TEXT NOT NULL DEFAULT '匿名访客';
CREATE INDEX IF NOT EXISTS idx_post_likes_post_created_at ON post_likes (post_id, created_at DESC, id DESC);
