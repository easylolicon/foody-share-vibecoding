class LikeRepository {
  constructor(db) {
    this.db = db;
  }

  async find(connection, postId, visitorId) {
    const [rows] = await connection.query(
      'SELECT id FROM post_likes WHERE post_id = ? AND visitor_id = ? FOR UPDATE',
      [postId, visitorId],
    );
    return rows[0] || null;
  }

  async insert(connection, postId, visitorId, nickname) {
    await connection.query('INSERT INTO post_likes (post_id, visitor_id, nickname) VALUES (?, ?, ?)', [postId, visitorId, nickname]);
    await connection.query('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [postId]);
  }

  async remove(connection, likeId, postId) {
    await connection.query('DELETE FROM post_likes WHERE id = ?', [likeId]);
    await connection.query(
      'UPDATE posts SET like_count = CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END WHERE id = ?',
      [postId],
    );
  }

  async getCount(connection, postId) {
    const [rows] = await connection.query(
      'SELECT like_count AS likeCount FROM posts WHERE id = ? FOR UPDATE',
      [postId],
    );
    return rows[0] || null;
  }

  async findByPostId(postId) {
    const [rows] = await this.db.query(
      `SELECT nickname, created_at AS createdAt
       FROM post_likes WHERE post_id = ? ORDER BY created_at DESC, id DESC`,
      [postId],
    );
    return rows;
  }
}

module.exports = LikeRepository;
