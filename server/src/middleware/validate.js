import { ApiError } from '../utils/ApiError.js';

// validate({ body, query, params }) parses each part with its zod schema and
// puts the parsed (coerced, defaulted) values on `req.valid`.
export function validate(schemas) {
  return (req, _res, next) => {
    req.valid = {};
    const issues = [];
    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (result.success) {
        req.valid[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ in: part, path: issue.path.join('.'), message: issue.message });
        }
      }
    }
    if (issues.length) {
      return next(ApiError.badRequest('VALIDATION_ERROR', issues[0].message, issues));
    }
    next();
  };
}
