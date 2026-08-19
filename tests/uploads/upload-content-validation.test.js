const express = require('express');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const LocalStorageProvider = require('../../src/storage/local-storage-provider');
const { createUploadMiddleware } = require('../../src/uploads/upload-middleware');
const errorHandler = require('../../src/middleware/error-handler');

const mismatchedPngFixture = path.join(__dirname, '..', 'fixtures', '123.jpg');

function createUploadApp(uploadDir) {
  const app = express();
  const storage = new LocalStorageProvider(uploadDir);
  app.post('/upload', createUploadMiddleware(), async (req, res) => {
    const saved = await storage.save(req.files[0]);
    res.status(201).json(saved);
  });
  app.use(errorHandler);
  return app;
}

test('uploads the supplied JPG-named PNG using its content-derived extension', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'takeout-upload-e2e-'));
  const response = await request(createUploadApp(dir))
    .post('/upload')
    .attach('images', mismatchedPngFixture, { filename: '123.jpg', contentType: 'image/jpeg' });

  expect(response.status).toBe(201);
  expect(response.body.key).toMatch(/\.png$/);
  await expect(fs.readFile(path.join(dir, response.body.key))).resolves.toEqual(await fs.readFile(mismatchedPngFixture));
});

test('rejects unrecognized content even when the declared MIME type is allowed', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'takeout-upload-invalid-'));
  const response = await request(createUploadApp(dir))
    .post('/upload')
    .attach('images', Buffer.from('not an image'), { filename: 'fake.jpg', contentType: 'image/jpeg' });

  expect(response.status).toBe(400);
  expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR', message: '图片内容与文件类型不匹配' });
});
