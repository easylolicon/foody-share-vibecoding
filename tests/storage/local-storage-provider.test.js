const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const LocalStorageProvider = require('../../src/storage/local-storage-provider');

test('saves, exposes and deletes an image', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'takeout-storage-'));
  const provider = new LocalStorageProvider(dir);
  const contents = Buffer.from([0xff, 0xd8, 0xff, 0x70, 0x68, 0x6f, 0x74, 0x6f]);
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

test('rejects storage keys outside the upload directory', () => {
  const provider = new LocalStorageProvider('/tmp/takeout-storage');
  expect(() => provider.publicUrl('../secret')).toThrow('Invalid storage key');
});
