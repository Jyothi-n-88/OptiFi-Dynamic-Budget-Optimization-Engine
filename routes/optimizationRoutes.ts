import express from 'express';
import { runOptimization } from '../controllers/optimizationController';

const router = express.Router();

router.post('/run', runOptimization);

export default router;
