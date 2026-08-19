const multer = require('multer');
const config = require('../config');

function imageFileFilter(_request, file, callback) {
  // The client-provided MIME type may be based on the filename extension.
  // LocalStorageProvider validates the buffered content and determines its type.
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

module.exports = { createUploadMiddleware, imageFileFilter };
