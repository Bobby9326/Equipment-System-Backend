import { logger } from 'hono/logger';

export const loggerMiddleware = logger((message: string) => {
  console.log(message);
});