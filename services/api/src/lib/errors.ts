/** Typed HTTP error used across all route handlers. */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (message: string, details?: unknown): ApiError =>
  new ApiError(400, 'bad_request', message, details);

export const unauthorized = (message = 'Authentication required'): ApiError =>
  new ApiError(401, 'unauthorized', message);

export const forbidden = (message = 'Insufficient privileges'): ApiError =>
  new ApiError(403, 'forbidden', message);

export const notFound = (message = 'Resource not found'): ApiError =>
  new ApiError(404, 'not_found', message);

export const conflict = (message: string, details?: unknown): ApiError =>
  new ApiError(409, 'conflict', message, details);

export const disabled = (feature: string): ApiError =>
  new ApiError(503, 'feature_disabled', `${feature} is not configured on this deployment`);
