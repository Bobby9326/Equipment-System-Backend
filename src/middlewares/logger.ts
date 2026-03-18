import { logger } from 'hono/logger';
import pino from 'pino';

// 1. สร้าง Pino Instance ที่ส่ง log ไปหลายที่พร้อมกัน (multistream)
const streams = pino.multistream([
  { stream: pino.destination('./app.log') }, // ไฟล์
  { stream: process.stdout },                // console
]);

const pinoLogger = pino(
  {
    level: 'info',
  },
  streams
);

// 2. สร้าง Middleware โดยเอา message จาก Hono ส่งให้ Pino
export const loggerMiddleware = logger((message: string) => {
  pinoLogger.info(message.trim());
});