import express from 'express';
import { getHistoricalAnalysis } from '../controllers/analysisController';

const router = express.Router();

router.get('/historical', getHistoricalAnalysis);

export default router;
