const express = require('express');
const { ValidationError } = require('../errors');

function parsePositiveInteger(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) throw new ValidationError('分页参数无效');
  return parsed;
}

function createPostRouter({ postService, upload }) {
  const router = express.Router();

  router.get('/', async (request, response) => {
    const result = await postService.list({
      page: parsePositiveInteger(request.query.page, 1),
      pageSize: parsePositiveInteger(request.query.pageSize, 24),
      visitorId: request.get('x-visitor-id') || '',
    });
    response.json(result);
  });

  router.get('/:id', async (request, response) => {
    const post = await postService.get(parsePositiveInteger(request.params.id), request.get('x-visitor-id') || '');
    response.json(post);
  });

  router.post('/', upload, async (request, response) => {
    const post = await postService.create({
      nickname: request.body.nickname,
      description: request.body.description,
      files: request.files || [],
    }, request.get('x-visitor-id') || '');
    response.status(201).json(post);
  });

  return router;
}

module.exports = { createPostRouter, parsePositiveInteger };
