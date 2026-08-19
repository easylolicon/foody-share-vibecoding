const multer = require('multer');
const { AppError } = require('../errors');

function errorHandler(error, _request, response, _next) {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? '图片大小超过限制'
      : error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE'
        ? '最多上传 3 张图片'
        : '图片上传失败';
    response.status(400).json({ error: { code: error.code, message } });
    return;
  }

  if (error instanceof AppError) {
    const payload = { code: error.code, message: error.message };
    if (error.details !== undefined) payload.details = error.details;
    response.status(error.status).json({ error: payload });
    return;
  }

  console.error(error);
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用，请稍后重试' } });
}

module.exports = errorHandler;
