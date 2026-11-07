export interface AppError extends Error {
  code: string;
  status: number;
  field?: string;
}

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
