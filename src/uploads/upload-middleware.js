const multer = require('multer');
const config = require('../config');
const { ValidationError } = require('../errors');
const { normalizeMimeType } = require('../storage/local-storage-provider');

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function imageFileFilter(_request, file, callback) {
  if (!ALLOWED_TYPES.has(normalizeMimeType(file.mimetype))) {
    callback(new ValidationError('仅支持 JPEG、PNG 或 WebP 图片'));
    return;
  }
  callback(null, true);
}

function createUploadMiddleware(options = {}) {
  const maxImageCount = options.maxImageCount || config.maxImageCount;
  const maxImageBytes = options.maxImageBytes || config.maxImageBytes;
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: imageFileFilter,
    limits: { files: maxImageCount, fileSize: maxImageBytes },
  }).array('images', maxImageCount);
}

module.exports = { ALLOWED_TYPES, createUploadMiddleware, imageFileFilter };
