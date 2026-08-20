const request = require('supertest');
const { createApp } = require('../../src/app');

test('returns the updated anonymous like state', async () => {
  const app = createApp({
    postService: {}, upload: (_request, _response, next) => next(),
    likeService: { toggle: async () => ({ liked: true, likeCount: 4 }) },
  });
  const response = await request(app)
    .post('/api/posts/1/like')
    .set('x-visitor-id', 'visitor_1234567890')
    .set('x-visitor-nickname', encodeURIComponent('小林'));
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ liked: true, likeCount: 4 });
});

test('lists the nickname and time of every like', async () => {
  const app = createApp({
    postService: {}, upload: (_request, _response, next) => next(),
    likeService: { list: async () => ({ items: [{ nickname: '小林', createdAt: '2026-08-20T12:00:00Z' }], total: 1 }) },
  });
  const response = await request(app).get('/api/posts/1/likes');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ items: [{ nickname: '小林', createdAt: '2026-08-20T12:00:00Z' }], total: 1 });
});
