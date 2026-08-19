class LikeRepository {
  async find(connection, postId, visitorId) {
    const [rows] = await connection.query(
      'SELECT id FROM post_likes WHERE post_id = ? AND visitor_id = ? FOR UPDATE',
      [postId, visitorId],
    );
    return rows[0] || null;
  }

  async insert(connection, postId, visitorId) {
    await connection.query('INSERT INTO post_likes (post_id, visitor_id) VALUES (?, ?)', [postId, visitorId]);
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
}

module.exports = LikeRepository;
