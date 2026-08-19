const request = require('supertest');
const { createApp } = require('../../src/app');

test('renders the feed shell and accessible publishing controls', async () => {
  const app = createApp({ postService: {}, likeService: {}, upload: (_request, _response, next) => next() });
  const response = await request(app).get('/');
  expect(response.status).toBe(200);
  expect(response.text).toContain('今天吃了什么？');
  expect(response.text).toContain('id="submitMeal"');
  expect(response.text).toContain('id="dateGroups"');
  expect(response.text).toContain('id="loginNickname"');
  expect(response.text).toContain('id="identityName"');
  expect(response.text).not.toContain('id="nicknameInput"');
});
