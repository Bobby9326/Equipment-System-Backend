import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    console.error('Error:', err);

    if (err instanceof HTTPException) {
      return c.json(
        {
          success: false,
          message: err.message,
          status: err.status,
        },
        err.status
      );
    }

    // Drizzle/Database errors
    if (err.code) {
      let message = 'Database error';
      let status = 500;

      // PostgreSQL error codes
      switch (err.code) {
        case '23505': // unique_violation
          message = 'Duplicate entry';
          status = 409;
          break;
        case '23503': // foreign_key_violation
          message = 'Referenced record does not exist';
          status = 400;
          break;
        case '23502': // not_null_violation
          message = 'Required field is missing';
          status = 400;
          break;
        default:
          message = err.message || 'Database error';
      }

      return c.json(
        {
          success: false,
          message,
          error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        },
        status as any
      );
    }

    // Generic error
    return c.json(
      {
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      500 as any
    );
  }
};