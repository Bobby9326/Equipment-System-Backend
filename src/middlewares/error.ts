import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

// ใช้กับ app.onError — signature คือ (err, c)
export const errorHandler = (err: any, c: Context) => {
  console.error('Error:', err);

  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.message }, err.status);
  }

  if (err.name === 'BusinessError') {
    return c.json({ success: false, message: err.message }, 400);
  }

  // Drizzle/PostgreSQL errors
  if (err.code) {
    const map: Record<string, [string, number]> = {
      '23505': ['Duplicate entry', 409],
      '23503': ['Referenced record does not exist', 400],
      '23502': ['Required field is missing', 400],
    };
    const [message, status] = map[err.code] ?? [err.message || 'Database error', 500];
    return c.json(
      {
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      status as any
    );
  }

  return c.json(
    {
      success: false,
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    500
  );
};