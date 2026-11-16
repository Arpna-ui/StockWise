/**
 * Standardized API Response Helpers
 * Ensures uniform structure across all StockWise REST endpoints.
 */

export const successResponse = (res, data = null, message = 'Success', statusCode = 200, extra = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null ? { data } : {}),
    ...extra,
  });
};

export const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};
