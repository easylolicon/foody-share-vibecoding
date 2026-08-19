const request = require('supertest');
const { createApp } = require('../../src/app');

test('returns the updated anonymous like state', async () => {
  const app = createApp({
    postService: {}, upload: (_request, _response, next) => next(),
    likeService: { toggle: async () => ({ liked: true, likeCount: 4 }) },
  });
  const response = await request(app)
    .post('/api/posts/1/like')
    .set('x-visitor-id', 'visitor_1234567890');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ liked: true, likeCount: 4 });
});
