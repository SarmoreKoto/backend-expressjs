// 🔥 BASE RESPONSE (core function)
const baseResponse = (
  success: boolean,
  message: string,
  statusCode: number,
  data?: any
) => {
  return {
    success,
    statusCode,
    message,
    ...(data !== undefined && { data }),
  };
};


// ✅ SUCCESS RESPONSES

export const successResponse  = (message = "Success", data?: any) =>
  baseResponse(true, message, 200, data);

export const created = (message = "Created successfully", data?: any) =>
  baseResponse(true, message, 201, data);

export const accepted = (message = "Request accepted", data?: any) =>
  baseResponse(true, message, 202, data);

export const noContent = () =>
  baseResponse(true, "No content", 204);


// ❌ CLIENT ERROR RESPONSES

export const badRequest = (message = "Bad request") =>
  baseResponse(false, message, 400);

export const unauthorized = (message = "Unauthorized") =>
  baseResponse(false, message, 401);

export const forbidden = (message = "Forbidden") =>
  baseResponse(false, message, 403);

export const notFound = (message = "Resource not found") =>
  baseResponse(false, message, 404);

export const conflict = (message = "Conflict") =>
  baseResponse(false, message, 409);


// ❌ SERVER ERROR RESPONSES

export const internalError = (message = "Internal server error") =>
  baseResponse(false, message, 500);

export const serviceUnavailable = (message = "Service unavailable") =>
  baseResponse(false, message, 503);