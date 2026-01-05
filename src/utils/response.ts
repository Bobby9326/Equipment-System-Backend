import type { Context } from 'hono'


export const successResponse = (c: Context, data: any, message = 'Success', status = 200) => {
  return c.json({
    success: true,
    message,
    data,
  }, status as any);
};

export const errorResponse = (c: Context, message: string, status = 400, errors?: any) => {
  return c.json({
    success: false,
    message,
    errors,
  }, status as any);
};

export const paginatedResponse = (
  c: Context,
  data: any[],
  total: number,
  page: number,
  limit: number
) => {
  return c.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};