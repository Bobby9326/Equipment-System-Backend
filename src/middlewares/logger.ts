import { logger } from 'hono/logger';
import pino from 'pino';

// 1. สร้าง Pino Instance พร้อมกำหนด Destination เป็นไฟล์
const pinoLogger = pino(
  {
    level: 'info',
  },
  pino.destination('./app.log') // ระบุชื่อไฟล์ที่ต้องการ
);

// 2. สร้าง Middleware โดยเอา message จาก Hono ส่งให้ Pino
export const loggerMiddleware = logger((message: string) => {
  pinoLogger.info(message.trim()); 
});