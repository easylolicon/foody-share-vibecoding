class AppError extends Error {
  constructor(code, message, status = 500, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = '内容不存在') {
    super('NOT_FOUND', message, 404);
  }
}

module.exports = { AppError, ValidationError, NotFoundError };
