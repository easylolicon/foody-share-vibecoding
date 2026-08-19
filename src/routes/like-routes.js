const express = require('express');
const { ValidationError } = require('../errors');

function createLikeRouter({ likeService }) {
  const router = express.Router({ mergeParams: true });
  router.post('/', async (request, response) => {
    const postId = Number.parseInt(request.params.id, 10);
    if (!Number.isInteger(postId) || postId < 1) throw new ValidationError('内容编号无效');
    const result = await likeService.toggle(postId, request.get('x-visitor-id') || '');
    response.json(result);
  });
  return router;
}

module.exports = createLikeRouter;
