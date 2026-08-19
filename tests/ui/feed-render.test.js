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
  expect(response.text).toContain('.card-track { display: flex; gap: 16px; overflow-x: auto;');
  expect(response.text).toContain('.meal-card { flex-basis: calc((100% - 32px) / 3); }');
  expect(response.text).toContain('.meal-card { flex-basis: min(82vw, 320px); }');
  expect(response.text).toContain('right: max(24px, calc((100vw - 1180px) / 2 + 24px))');
  expect(response.text).toContain('.floating-add { right: 16px; bottom: 16px; }');
  expect(response.text).not.toContain('id="nicknameInput"');
});
