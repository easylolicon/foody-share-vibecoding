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
  expect(response.text).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))');
  expect(response.text).toContain('.card-track { grid-template-columns: repeat(3, minmax(0, 1fr)); }');
  expect(response.text).toContain('.card-track { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }');
  expect(response.text).toContain('right: max(24px, calc((100vw - 1180px) / 2 + 24px))');
  expect(response.text).toContain('.floating-add { right: 16px; bottom: 16px; }');
  expect(response.text).not.toContain('id="nicknameInput"');
});
