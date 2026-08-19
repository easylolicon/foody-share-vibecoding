class PostRepository {
  constructor(db) {
    this.db = db;
  }

  async insertPost(connection, { nickname, description }) {
    const [result] = await connection.query(
      'INSERT INTO posts (nickname, description) VALUES (?, ?)',
      [nickname, description],
    );
    return result.insertId;
  }

  async insertImages(connection, postId, images) {
    if (!images.length) return;
    const placeholders = images.map(() => '(?, ?, ?, ?)').join(', ');
    const values = images.flatMap((image, index) => [postId, image.url, image.key, index]);
    await connection.query(
      `INSERT INTO post_images (post_id, url, storage_key, sort_order) VALUES ${placeholders}`,
      values,
    );
  }

  async findById(postId, visitorId = '') {
    const [rows] = await this.db.query(
      `SELECT p.id, p.nickname, p.description, p.like_count AS likeCount,
              p.created_at AS createdAt,
              EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.visitor_id = ?) AS liked
       FROM posts p WHERE p.id = ?`,
      [visitorId, postId],
    );
    if (!rows.length) return null;
    const [images] = await this.db.query(
      'SELECT url, sort_order AS sortOrder FROM post_images WHERE post_id = ? ORDER BY sort_order',
      [postId],
    );
    return { ...rows[0], liked: Boolean(rows[0].liked), images };
  }

  async findPage({ page, pageSize, visitorId = '' }) {
    const offset = (page - 1) * pageSize;
    const [countResult, postsResult] = await Promise.all([
      this.db.query('SELECT COUNT(*) AS total FROM posts'),
      this.db.query(
        `SELECT p.id, p.nickname, p.description, p.like_count AS likeCount,
                p.created_at AS createdAt,
                EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.visitor_id = ?) AS liked
         FROM posts p ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`,
        [visitorId, pageSize, offset],
      ),
    ]);
    const countRow = countResult[0][0];
    const posts = postsResult[0];

    if (!posts.length) return { items: [], total: countRow.total };
    const ids = posts.map((post) => post.id);
    const placeholders = ids.map(() => '?').join(', ');
    const [images] = await this.db.query(
      `SELECT post_id AS postId, url, sort_order AS sortOrder
       FROM post_images WHERE post_id IN (${placeholders}) ORDER BY post_id, sort_order`,
      ids,
    );
    const imagesByPost = new Map();
    for (const image of images) {
      const group = imagesByPost.get(image.postId) || [];
      group.push({ url: image.url, sortOrder: image.sortOrder });
      imagesByPost.set(image.postId, group);
    }
    return {
      items: posts.map((post) => ({
        ...post,
        liked: Boolean(post.liked),
        images: imagesByPost.get(post.id) || [],
      })),
      total: countRow.total,
    };
  }
}

module.exports = PostRepository;
