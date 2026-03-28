import { Context } from 'hono';
import { errorResponse } from '../utils/response.js';
import { equipmentReportService } from '../services/equipment-report.service.js';

export const surveyReportController = {
  // GET /api/reports/survey?budgetYear=2568&departmentId=1
  generate: async (c: Context) => {
    try {
      const budgetYearStr  = c.req.query('budgetYear');
      const departmentStr  = c.req.query('departmentId');

      if (!budgetYearStr) return errorResponse(c, 'budgetYear is required (พ.ศ. เช่น 2568)', 400);

      const budgetYear   = parseInt(budgetYearStr);
      const departmentId = departmentStr ? parseInt(departmentStr) : undefined;

      if (isNaN(budgetYear)) return errorResponse(c, 'budgetYear must be a number', 400);

      const pdfBuffer = await equipmentReportService.generateSurveyPdf({ budgetYear, departmentId });

      // ชื่อไฟล์: Equipment_Survey_Report_FY2568_Dept1_20260328.pdf
      const now      = new Date();
      const dateStr  = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const deptPart = departmentId ? `_Dept${departmentId}` : '';
      const fileName = `Equipment_Survey_Report_FY${budgetYear}${deptPart}_${dateStr}.pdf`;

      c.header('Content-Type',        'application/pdf');
      c.header('Content-Disposition', `attachment; filename="${fileName}"`);
      c.header('Content-Length',      String(pdfBuffer.length));

      return c.body(new Uint8Array(pdfBuffer));
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};