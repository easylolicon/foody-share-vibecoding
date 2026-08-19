const path = require('node:path');

const DEFAULT_DB_FILE = path.join(process.cwd(), 'data', 'takeout.sqlite');
const DEFAULT_MAX_IMAGE_COUNT = 3;
const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function loadConfig(env = process.env) {
  return {
    dbFile: env.SQLITE_FILE || DEFAULT_DB_FILE,
    uploadDir: env.UPLOAD_DIR || 'uploads',
    maxImageCount: positiveInteger(env.MAX_IMAGE_COUNT, DEFAULT_MAX_IMAGE_COUNT),
    maxImageBytes: positiveInteger(env.MAX_IMAGE_BYTES, DEFAULT_MAX_IMAGE_BYTES),
  };
}

module.exports = {
  ...loadConfig(),
  loadConfig,
};
