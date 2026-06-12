class AppError extends Error {
  constructor(message, statusCode = 400, code = "APP_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, "CONFLICT_ERROR");
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401, "UNAUTHORIZED_ERROR");
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403, "FORBIDDEN_ERROR");
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, "NOT_FOUND_ERROR");
  }
}

module.exports = {
  AppError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
};
