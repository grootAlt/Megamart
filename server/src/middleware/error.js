import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`No route for ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let error = err;

  if (err instanceof SyntaxError && 'body' in err) {
    error = ApiError.badRequest('INVALID_JSON', 'Request body is not valid JSON');
  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest('INVALID_ID', `Invalid value for ${err.path}`);
  } else if (err?.code === 11000) {
    error = ApiError.conflict('DUPLICATE', 'That record already exists');
  } else if (!(err instanceof ApiError)) {
    console.error(err);
    error = new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong on our side');
  }

  const body = { error: { code: error.code, message: error.message } };
  if (error.details !== undefined) body.error.details = error.details;
  res.status(error.status).json(body);
}
