import type { Response } from "express";

export function successResponse<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function errorResponse(
  res: Response,
  message: string,
  code = "BAD_REQUEST",
  statusCode = 400,
  details?: unknown,
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
