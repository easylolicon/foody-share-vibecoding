const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const LocalStorageProvider = require('../../src/storage/local-storage-provider');

const mismatchedPngFixture = path.join(__dirname, '..', 'fixtures', '123.jpg');
const onePixelJpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AYf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AYf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IX//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z',
  'base64',
);

function createLargeJpeg(minimumSize) {
  const segments = [];
  let size = onePixelJpeg.length;
  while (size < minimumSize) {
    const payloadSize = Math.min(65533, minimumSize - size);
    const segment = Buffer.alloc(payloadSize + 4);
    segment[0] = 0xff;
    segment[1] = 0xe1;
    segment.writeUInt16BE(payloadSize + 2, 2);
    segments.push(segment);
    size += segment.length;
  }
  return Buffer.concat([onePixelJpeg.subarray(0, 2), ...segments, onePixelJpeg.subarray(2)]);
}

test('saves, exposes and deletes an image', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'takeout-storage-'));
  const provider = new LocalStorageProvider(dir);
  const contents = onePixelJpeg;
  const saved = await provider.save({ mimetype: 'image/jpeg', buffer: contents });

  expect(saved.url).toBe(`/uploads/${saved.key}`);
  await expect(fs.readFile(path.join(dir, saved.key))).resolves.toEqual(contents);
  await provider.delete(saved.key);
  await expect(fs.stat(path.join(dir, saved.key))).rejects.toMatchObject({ code: 'ENOENT' });
});

test('rejects a spoofed image MIME type', async () => {
  const provider = new LocalStorageProvider('/tmp/takeout-storage');
  await expect(provider.save({ mimetype: 'image/png', buffer: Buffer.from('not a png') }))
    .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
});

test('accepts a valid image signature when the file is larger than 200KB', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'takeout-storage-large-'));
  const provider = new LocalStorageProvider(dir);
  const contents = createLargeJpeg(256 * 1024);

  const saved = await provider.save({ mimetype: 'IMAGE/JPEG; charset=binary', buffer: contents });

  expect(saved.key).toMatch(/\.jpg$/);
  await expect(fs.readFile(path.join(dir, saved.key))).resolves.toEqual(contents);
});

test('rejects a minimal payload that only forges a JPEG prefix', async () => {
  const provider = new LocalStorageProvider('/tmp/takeout-storage-fake-jpeg');
  const fakeJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x70, 0x68, 0x6f, 0x74, 0x6f, 0x00, 0x01, 0x02, 0x03, 0x04]);

  await expect(provider.save({ mimetype: 'image/jpeg', buffer: fakeJpeg }))
    .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
});

test('stores the supplied JPG-named PNG using its detected PNG extension', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'takeout-storage-mismatched-'));
  const provider = new LocalStorageProvider(dir);
  const contents = await fs.readFile(mismatchedPngFixture);

  const saved = await provider.save({ mimetype: 'image/jpeg', buffer: contents });

  expect(contents).toHaveLength(260436);
  expect(saved.key).toMatch(/\.png$/);
  await expect(fs.readFile(path.join(dir, saved.key))).resolves.toEqual(contents);
});

test('rejects storage keys outside the upload directory', () => {
  const provider = new LocalStorageProvider('/tmp/takeout-storage');
  expect(() => provider.publicUrl('../secret')).toThrow('Invalid storage key');
});
