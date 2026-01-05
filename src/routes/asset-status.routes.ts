import { Hono } from 'hono';
import {
  assetBorrowsController,
  assetRepairsController,
  assetUnavailableController,
  assetDisposalsController,
} from '../controllers/asset-status.controller.js';

const assetStatus = new Hono();

// Asset Borrows
assetStatus.get('/borrows', assetBorrowsController.getAll);
assetStatus.get('/borrows/:id', assetBorrowsController.getById);
assetStatus.get('/borrows/asset/:assetId', assetBorrowsController.getByAssetId);
assetStatus.post('/borrows', assetBorrowsController.create);
assetStatus.put('/borrows/:id', assetBorrowsController.update);
assetStatus.patch('/borrows/:id/return', assetBorrowsController.returnAsset);
assetStatus.delete('/borrows/:id', assetBorrowsController.delete);

// Asset Repairs
assetStatus.get('/repairs', assetRepairsController.getAll);
assetStatus.get('/repairs/:id', assetRepairsController.getById);
assetStatus.get('/repairs/asset/:assetId', assetRepairsController.getByAssetId);
assetStatus.post('/repairs', assetRepairsController.create);
assetStatus.put('/repairs/:id', assetRepairsController.update);
assetStatus.delete('/repairs/:id', assetRepairsController.delete);

// Asset Unavailable
assetStatus.get('/unavailable', assetUnavailableController.getAll);
assetStatus.get('/unavailable/:id', assetUnavailableController.getById);
assetStatus.get('/unavailable/asset/:assetId', assetUnavailableController.getByAssetId);
assetStatus.post('/unavailable', assetUnavailableController.create);
assetStatus.put('/unavailable/:id', assetUnavailableController.update);
assetStatus.delete('/unavailable/:id', assetUnavailableController.delete);

// Asset Disposals
assetStatus.get('/disposals', assetDisposalsController.getAll);
assetStatus.get('/disposals/:id', assetDisposalsController.getById);
assetStatus.get('/disposals/asset/:assetId', assetDisposalsController.getByAssetId);
assetStatus.post('/disposals', assetDisposalsController.create);
assetStatus.put('/disposals/:id', assetDisposalsController.update);
assetStatus.delete('/disposals/:id', assetDisposalsController.delete);

export default assetStatus;