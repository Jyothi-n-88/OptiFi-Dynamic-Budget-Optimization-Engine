import express from 'express';
import { getExpenses, createExpense, deleteExpense, importExpenses } from '../controllers/expenseController';

const router = express.Router();

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.post('/import', importExpenses);

router.route('/:id')
  .delete(deleteExpense);

export default router;
