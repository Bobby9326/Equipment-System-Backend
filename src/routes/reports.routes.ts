import { Hono } from 'hono';
import { depreciationController } from '../controllers/depreciation.controller.js';

const reports = new Hono();

reports.get('/depreciation', depreciationController.calculate);

export default reports;