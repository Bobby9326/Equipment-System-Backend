import { Hono } from 'hono';
import { attachmentsController } from '../controllers/attachments.controller.js';

const attachments = new Hono();

attachments.get('/', attachmentsController.getAll);
attachments.get('/:id/file', attachmentsController.download);
attachments.get('/:id', attachmentsController.getById);
attachments.post('/upload', attachmentsController.upload);
attachments.post('/', attachmentsController.create);
attachments.put('/:id', attachmentsController.update);
attachments.delete('/:id', attachmentsController.delete);

export default attachments;