import { Hono } from 'hono';
import { usersController } from '../controllers/users.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';

const usersRouter = new Hono();

// ทุก route ต้อง login + เป็น admin เท่านั้น
usersRouter.use('/*', authMiddleware);
usersRouter.use('/*', requireRole('admin'));

usersRouter.get('/',        usersController.getAll);
usersRouter.get('/:uuid',   usersController.getByUuid);
usersRouter.post('/',       usersController.create);
usersRouter.put('/:uuid',   usersController.update);
usersRouter.delete('/:uuid',usersController.delete);

export default usersRouter;