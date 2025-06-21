import express from 'express';
import {
  DashboardController,
  ClientInfoControllerGet,
  ClientInfoControllerPost,
} from './controller.js';

const router = express.Router();

router.get('/', DashboardController);

router.get('/api/client-info', ClientInfoControllerGet);
router.post('/api/client-info', ClientInfoControllerPost);

export default router;
