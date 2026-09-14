import express from 'express';
import { getBudgets, createBudget } from '../controllers/budgetController';

const router = express.Router();

router.route('/')
  .get(getBudgets)
  .post(createBudget);

export default router;
