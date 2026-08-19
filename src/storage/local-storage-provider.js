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

function normalizeMimeType(mimetype) {
  return typeof mimetype === 'string' ? mimetype.split(';', 1)[0].trim().toLowerCase() : '';
}

function isStartOfFrame(marker) {
  return (marker >= 0xc0 && marker <= 0xc3)
    || (marker >= 0xc5 && marker <= 0xc7)
    || (marker >= 0xc9 && marker <= 0xcb)
    || (marker >= 0xcd && marker <= 0xcf);
}

function hasValidJpegStructure(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return false;

  let offset = 2;
  let hasFrame = false;
  let hasScan = false;
  let hasQuantizationTable = false;
  let hasHuffmanTable = false;
  let hasEntropyData = false;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return false;
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.length) return false;

    const marker = buffer[offset++];
    if (marker === 0xd9) {
      return hasFrame && hasScan && hasQuantizationTable && hasHuffmanTable && hasEntropyData && offset === buffer.length;
    }
    if (marker === 0x00 || marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) return false;
    if (offset + 2 > buffer.length) return false;

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) return false;

    if (isStartOfFrame(marker)) {
      if (segmentLength < 8) return false;
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      const componentCount = buffer[offset + 7];
      if (!width || !height || !componentCount || segmentLength !== 8 + (3 * componentCount)) return false;
      hasFrame = true;
    }
    if (marker === 0xdb) hasQuantizationTable = segmentLength > 3;
    if (marker === 0xc4) hasHuffmanTable = segmentLength > 3;
    if (marker === 0xda && (!hasFrame || !hasQuantizationTable || !hasHuffmanTable || segmentLength < 8)) return false;

    offset += segmentLength;
    if (marker !== 0xda) continue;

    hasScan = true;
    while (offset < buffer.length) {
      if (buffer[offset++] !== 0xff) {
        hasEntropyData = true;
        continue;
      }
      while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
      if (offset >= buffer.length) return false;
      const scanMarker = buffer[offset++];
      if (scanMarker === 0x00 || (scanMarker >= 0xd0 && scanMarker <= 0xd7)) continue;
      if (scanMarker === 0xd9) {
        return hasFrame && hasQuantizationTable && hasHuffmanTable && hasEntropyData && offset === buffer.length;
      }
      offset -= 2;
      break;
    }
  }

  return false;
}

function detectImageMimeType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (hasValidJpegStructure(buffer)) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
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
    const detectedMimeType = detectImageMimeType(file && file.buffer);
    const extension = EXTENSIONS.get(detectedMimeType);
    if (!extension) {
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
module.exports.detectImageMimeType = detectImageMimeType;
module.exports.hasValidJpegStructure = hasValidJpegStructure;
module.exports.normalizeMimeType = normalizeMimeType;
