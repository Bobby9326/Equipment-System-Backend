import { Hono } from 'hono';
import { attachmentsController } from '../controllers/attachments.controller.js';

const attachments = new Hono();

attachments.get('/', attachmentsController.getAll);
attachments.get('/:id', attachmentsController.getById);
attachments.get('/:refType/:refId', attachmentsController.getByReference);
attachments.post('/', attachmentsController.create);
attachments.put('/:id', attachmentsController.update);
attachments.delete('/:id', attachmentsController.delete);
attachments.delete('/:refType/:refId', attachmentsController.deleteByReference);

export default attachments;