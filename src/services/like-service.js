const { NotFoundError, ValidationError } = require('../errors');

class LikeService {
  constructor({ db, repository }) {
    this.db = db;
    this.repository = repository;
  }

  async toggle(postId, visitorId) {
    if (!visitorId || !/^[A-Za-z0-9_-]{16,64}$/.test(visitorId)) {
      throw new ValidationError('访客标识无效');
    }
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const count = await this.repository.getCount(connection, postId);
      if (!count) throw new NotFoundError();
      const existing = await this.repository.find(connection, postId, visitorId);
      if (existing) await this.repository.remove(connection, existing.id, postId);
      else await this.repository.insert(connection, postId, visitorId);
      const latest = await this.repository.getCount(connection, postId);
      await connection.commit();
      return { liked: !existing, likeCount: latest.likeCount };
    } catch (error) {
      await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = LikeService;
