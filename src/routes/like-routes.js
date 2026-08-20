const express = require('express');
const { ValidationError } = require('../errors');

function createLikeRouter({ likeService }) {
  const router = express.Router();
  router.post('/:id/like', async (request, response) => {
    const postId = Number.parseInt(request.params.id, 10);
    if (!Number.isInteger(postId) || postId < 1) throw new ValidationError('内容编号无效');
    const encodedNickname = request.get('x-visitor-nickname') || '';
    let nickname;
    try { nickname = decodeURIComponent(encodedNickname); } catch { throw new ValidationError('点赞昵称无效'); }
    const result = await likeService.toggle(postId, request.get('x-visitor-id') || '', nickname);
    response.json(result);
  });
  router.get('/:id/likes', async (request, response) => {
    const postId = Number.parseInt(request.params.id, 10);
    if (!Number.isInteger(postId) || postId < 1) throw new ValidationError('内容编号无效');
    response.json(await likeService.list(postId));
  });
  return router;
}

module.exports = createLikeRouter;
