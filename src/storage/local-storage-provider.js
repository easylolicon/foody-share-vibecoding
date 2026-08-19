const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const StorageProvider = require('./storage-provider');
const { ValidationError } = require('../errors');

const EXTENSIONS = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

function hasValidSignature(mimetype, buffer) {
  if (!Buffer.isBuffer(buffer)) return false;
  if (mimetype === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimetype === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  if (mimetype === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

class LocalStorageProvider extends StorageProvider {
  constructor(uploadDir, publicPrefix = '/uploads') {
    super();
    this.uploadDir = path.resolve(uploadDir);
    this.publicPrefix = publicPrefix.replace(/\/$/, '');
  }

  resolveKey(key) {
    const fullPath = path.resolve(this.uploadDir, key);
    if (path.dirname(fullPath) !== this.uploadDir) {
      throw new Error('Invalid storage key');
    }
    return fullPath;
  }

  async save(file) {
    const extension = EXTENSIONS.get(file.mimetype);
    if (!extension || !hasValidSignature(file.mimetype, file.buffer)) {
      throw new ValidationError('图片内容与文件类型不匹配');
    }

    await fs.mkdir(this.uploadDir, { recursive: true });
    const key = `${crypto.randomUUID()}${extension}`;
    await fs.writeFile(this.resolveKey(key), file.buffer, { flag: 'wx' });
    return { key, url: this.publicUrl(key) };
  }

  async delete(key) {
    try {
      await fs.unlink(this.resolveKey(key));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  publicUrl(key) {
    this.resolveKey(key);
    return `${this.publicPrefix}/${encodeURIComponent(key)}`;
  }
}

module.exports = LocalStorageProvider;
module.exports.hasValidSignature = hasValidSignature;
