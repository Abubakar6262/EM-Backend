import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { ZodError } from "zod";

// Type guard: checks if error is a PrismaClientKnownRequestError
function isPrismaKnownError(
  error: unknown
): error is PrismaClientKnownRequestError {
  return error instanceof PrismaClientKnownRequestError;
}

const ErrorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = err as
    | Error
    | ErrorHandler
    | PrismaClientKnownRequestError
    | PrismaClientValidationError
    | ZodError;

  const statusCode = (error as ErrorHandler)?.statusCode || 500;
  const message = (error as Error)?.message || "Internal Server Error";

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    error.errors.forEach((e) => {
      const field = e.path[0] as string;
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(e.message);
    });

    return res.status(400).json({
      success: false,
      errors: formattedErrors,
    });
  }

  // Handle Prisma errors (type-guarded)
  if (isPrismaKnownError(error)) {
    if (error.code === "P2002") {
      error = new ErrorHandler(
        `Duplicate value for field(s): ${error.meta?.target}`,
        400
      );
    } else if (error.code === "P2025") {
      error = new ErrorHandler("Record not found", 404);
    }
  } else if (error instanceof PrismaClientValidationError) {
    error = new ErrorHandler("Invalid data sent to the database", 400);
  }

  // Handle JWT errors
  else if (error instanceof Error && error.name === "JsonWebTokenError") {
    error = new ErrorHandler("JSON Web Token is invalid", 400);
  } else if (error instanceof Error && error.name === "TokenExpiredError") {
    error = new ErrorHandler("JSON Web Token has expired", 400);
  }

  // Default handler
  res.status((error as ErrorHandler)?.statusCode || statusCode).json({
    success: false,
    message: (error as Error)?.message || message,
    ...(process.env.NODE_ENV === "development" && {
      stack: (error as Error)?.stack,
    }),
  });
};

export default ErrorMiddleware;
