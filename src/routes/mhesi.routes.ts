import { Hono } from 'hono';
import { mhesiController } from '../controllers/mhesi.controller.js';

const mhesi = new Hono();

mhesi.get('/',                                        mhesiController.getAll);
mhesi.get('/project/:projectId',                      mhesiController.getByProjectId);
mhesi.get('/:uuid/history',                           mhesiController.getHistory);
mhesi.get('/:uuid/attachments',                       mhesiController.getAttachments);        
mhesi.get('/:uuid',                                   mhesiController.getByUuid);
mhesi.post('/',                                       mhesiController.create);
mhesi.post('/:uuid/attachments',                      mhesiController.uploadAttachments);      
mhesi.put('/:uuid',                                   mhesiController.update);
mhesi.delete('/:uuid/attachments/:attachmentId',      mhesiController.deleteAttachment);       
mhesi.delete('/:uuid',                                mhesiController.delete);

export default mhesi;