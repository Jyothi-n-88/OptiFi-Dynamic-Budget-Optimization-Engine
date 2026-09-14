import { Request, Response } from 'express';
import Department from '../models/Department';
import Budget from '../models/Budget';
import Expense from '../models/Expense';
import { calculateOptimalBudget } from '../services/optimizerService';

export const runOptimization = async (req: Request, res: Response) => {
  try {
    const { totalBudget, priorityOverrides } = req.body;

    const departments = await Department.find();
    const expenses = await Expense.find();

    // Prioritize active budgets, fallback to the most recently created
    let activeBudget = await Budget.findOne({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    if (!activeBudget) {
      activeBudget = await Budget.findOne().sort({ createdAt: -1 });
    }

    const recommendations = calculateOptimalBudget(departments, expenses, activeBudget, { totalBudget, priorityOverrides });

    const calculatedTotal = recommendations.reduce((sum, r) => sum + r.recommendedAllocation, 0);
    const targetBudget = totalBudget !== undefined ? Number(totalBudget) : (activeBudget?.totalBudget || 0);
    const unallocatedReserve = targetBudget - calculatedTotal;

    res.status(200).json({
      recommendations,
      metadata: {
        targetBudget,
        allocatedTotal: calculatedTotal,
        unallocatedReserve: Math.max(0, unallocatedReserve)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error running optimization engine', error: error.message });
  }
};
