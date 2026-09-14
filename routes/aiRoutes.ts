import express from 'express';
import { explainOptimization } from '../controllers/aiController';

const router = express.Router();

router.post('/explain', explainOptimization);

export default router;
