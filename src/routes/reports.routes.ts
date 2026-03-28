import { Hono } from 'hono';
import { depreciationController } from '../controllers/depreciation.controller.js';
import { surveyReportController } from '../controllers/survey.controller.js';

const reports = new Hono();

reports.get('/depreciation', depreciationController.calculate);
reports.get('/survey',       surveyReportController.generate);  // ✅ รายงานสำรวจครุภัณฑ์

export default reports;