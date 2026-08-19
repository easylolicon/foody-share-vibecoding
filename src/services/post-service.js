const { NotFoundError, ValidationError } = require('../errors');

const NICKNAME_MAX = 20;
const DESCRIPTION_MAX = 100;

function validatePostInput({ nickname, description = '', files = [] }) {
  const normalizedNickname = String(nickname || '').trim();
  const normalizedDescription = String(description || '').trim();
  if (!normalizedNickname) throw new ValidationError('请输入昵称');
  if (normalizedNickname.length > NICKNAME_MAX) throw new ValidationError(`昵称不能超过 ${NICKNAME_MAX} 个字符`);
  if (normalizedDescription.length > DESCRIPTION_MAX) throw new ValidationError(`描述不能超过 ${DESCRIPTION_MAX} 个字符`);
  if (files.length < 1 || files.length > 3) throw new ValidationError('请选择 1-3 张图片');
  return { nickname: normalizedNickname, description: normalizedDescription };
}

class PostService {
  constructor({ db, repository, storage }) {
    this.db = db;
    this.repository = repository;
    this.storage = storage;
  }

  async create(input, visitorId = '') {
    const post = validatePostInput(input);
    const saved = [];
    let connection;
    let committed = false;
    try {
      for (const file of input.files) saved.push(await this.storage.save(file));
      connection = await this.db.getConnection();
      await connection.beginTransaction();
      const postId = await this.repository.insertPost(connection, post);
      await this.repository.insertImages(connection, postId, saved);
      await connection.commit();
      committed = true;
      return await this.repository.findById(postId, visitorId);
    } catch (error) {
      if (!committed) {
        if (connection) await connection.rollback().catch(() => {});
        await Promise.allSettled(saved.map((image) => this.storage.delete(image.key)));
      }
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  async get(postId, visitorId = '') {
    const post = await this.repository.findById(postId, visitorId);
    if (!post) throw new NotFoundError();
    return post;
  }

  async list({ page = 1, pageSize = 24, visitorId = '' }) {
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safePageSize = Number.isInteger(pageSize) ? Math.min(Math.max(pageSize, 1), 48) : 24;
    const result = await this.repository.findPage({ page: safePage, pageSize: safePageSize, visitorId });
    return {
      ...result,
      page: safePage,
      pageSize: safePageSize,
      hasMore: safePage * safePageSize < result.total,
    };
  }
}

module.exports = { PostService, validatePostInput };
