import { Hono } from 'hono';
import { attachmentsController } from '../controllers/attachments.controller.js';

const attachments = new Hono();

// upload ก่อน /:id
attachments.post('/upload', attachmentsController.upload);

attachments.get('/', attachmentsController.getAll);
attachments.get('/:id', attachmentsController.getById);
attachments.post('/', attachmentsController.create);
attachments.put('/:id', attachmentsController.update);
attachments.delete('/:id', attachmentsController.delete);


export default attachments;