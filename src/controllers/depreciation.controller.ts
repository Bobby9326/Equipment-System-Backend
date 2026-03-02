import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import { depreciationService } from '../services/depreciation.service.js';
import { isAdminOrManager } from '../utils/permission.js';

export const depreciationController = {
  // GET /api/reports/depreciation
  // Query: startDate, endDate, departmentId, fundId, equipmentTypeId, acquisitionMethodId, acquisitionSourceId, minPrice
  calculate: async (c: Context) => {
    try {
      const user      = c.get('user');
      const startDate = c.req.query('startDate');
      const endDate   = c.req.query('endDate');

      if (!startDate) return errorResponse(c, 'startDate is required (YYYY-MM-DD)', 400);
      if (!endDate)   return errorResponse(c, 'endDate is required (YYYY-MM-DD)', 400);

      // ตรวจ department permission
      const queryDeptId = c.req.query('departmentId') ? parseInt(c.req.query('departmentId')!) : undefined;

      let departmentId: number | undefined;

      if (isAdminOrManager(user)) {
        // admin/manager กรอง department ได้อิสระ
        departmentId = queryDeptId ?? undefined;
      } else {
        // user ทั่วไป
        if (queryDeptId && queryDeptId !== user.departmentId) {
          // ส่ง departmentId ของคนอื่นมา → block
          return errorResponse(c, 'ไม่มีสิทธิ์ดูข้อมูลของ department อื่น', 403);
        }
        // ไม่ส่งมา หรือส่ง departmentId ตัวเอง → จำกัดแค่ตัวเอง
        departmentId = user.departmentId ?? undefined;
      }

      const result = await depreciationService.calculate({
        startDate,
        endDate,
        departmentId,
        fundId:               c.req.query('fundId')             ? parseInt(c.req.query('fundId')!)             : undefined,
        equipmentTypeId:      c.req.query('equipmentTypeId')     ? parseInt(c.req.query('equipmentTypeId')!)     : undefined,
        acquisitionMethodId:  c.req.query('acquisitionMethodId') ? parseInt(c.req.query('acquisitionMethodId')!) : undefined,
        acquisitionSourceId:  c.req.query('acquisitionSourceId') ? parseInt(c.req.query('acquisitionSourceId')!) : undefined,
        minPrice:             c.req.query('minPrice')            ? parseFloat(c.req.query('minPrice')!)          : undefined,
      });

      return successResponse(c, result, 'คำนวณค่าเสื่อมราคาสำเร็จ');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};