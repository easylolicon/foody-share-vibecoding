const request = require('supertest');
const { createApp } = require('../../src/app');

test('lists posts with pagination metadata', async () => {
  const app = createApp({
    postService: { list: async () => ({ items: [], total: 0, page: 1, pageSize: 24, hasMore: false }) },
    likeService: {}, upload: (_request, _response, next) => next(),
  });
  const response = await request(app).get('/api/posts');
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({ items: [], total: 0, hasMore: false });
});

test('returns a stable validation error response', async () => {
  const app = createApp({
    postService: { list: async () => ({}) }, likeService: {},
    upload: (_request, _response, next) => next(),
  });
  const response = await request(app).get('/api/posts?page=zero');
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});

test('creates a post from a multipart request', async () => {
  const created = { id: 9, nickname: '小林', description: '午饭', images: [{ url: '/uploads/one.jpg' }] };
  const create = jest.fn().mockResolvedValue(created);
  const app = createApp({
    postService: { create }, likeService: {},
    upload: (request, _response, next) => { request.files = [{ mimetype: 'image/jpeg' }]; request.body = { nickname: '小林', description: '午饭' }; next(); },
  });
  const response = await request(app).post('/api/posts').field('nickname', '小林').field('description', '午饭');
  expect(response.status).toBe(201);
  expect(response.body).toEqual(created);
  expect(create).toHaveBeenCalledWith(expect.objectContaining({ nickname: '小林' }), '');
});
