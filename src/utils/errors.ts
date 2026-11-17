export interface AppError extends Error {
  code: string;
  status: number;
  field?: string;
}

/**
 * Type guard: returns true if `err` is an AppError produced by makeError().
 * Use this in catch blocks instead of bare `as AppError` casts so that
 * unexpected errors from third-party libraries (e.g., SQLite constraint
 * violations) fall through to the global Express error handler unchanged.
 */
export function isAppError(err: unknown): err is AppError {
  return err instanceof Error && typeof (err as AppError).status === 'number';
}

/**
 * Creates a domain error with a machine-readable code and HTTP status.
 * @param field  Optional field name for input-validation errors (returned to the client as `field`).
 */
export function makeError(
  code: string,
  message: string,
  status: number,
  field?: string,
): AppError {
  const err = new Error(message) as AppError;
  err.code = code;
  err.status = status;
  if (field !== undefined) err.field = field;
  return err;
}

export function notFound(): AppError {
  return makeError('NOT_FOUND', 'Resource not found', 404);
}
