import { Request, Response } from 'express';
import Department from '../models/Department';
import Budget from '../models/Budget';
import Expense from '../models/Expense';

export const getHistoricalAnalysis = async (req: Request, res: Response) => {
  try {
    const departments = await Department.find();
    const budgets = await Budget.find();
    const expenses = await Expense.find();

    // Sum historical allocations per department
    const historicalBudgetMap: Record<string, number> = {};
    budgets.forEach(budget => {
      if (budget.departmentAllocations) {
        budget.departmentAllocations.forEach((alloc: any) => {
          const deptId = alloc.department.toString();
          historicalBudgetMap[deptId] = (historicalBudgetMap[deptId] || 0) + (alloc.allocatedAmount || 0);
        });
      }
    });

    // Sum historical spent per department
    const historicalSpentMap: Record<string, number> = {};
    expenses.forEach(expense => {
      if (expense.department) {
        const deptId = expense.department.toString();
        historicalSpentMap[deptId] = (historicalSpentMap[deptId] || 0) + (expense.amount || 0);
      }
    });

    // Map and calculate variance & utilization
    const analysisData = departments.map(dept => {
      const deptId = (dept._id as string).toString();
      const historicalBudget = historicalBudgetMap[deptId] || 0;
      const historicalSpent = historicalSpentMap[deptId] || 0;
      const variance = historicalBudget - historicalSpent;
      const utilization = historicalBudget > 0 ? (historicalSpent / historicalBudget) * 100 : 0;

      return {
        departmentId: deptId,
        departmentName: dept.name,
        historicalBudget,
        historicalSpent,
        variance,
        utilization,
        performanceScore: dept.performanceScore || 0,
      };
    });

    // Sort by utilization descending
    analysisData.sort((a, b) => b.utilization - a.utilization);

    res.status(200).json(analysisData);
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating historical analysis', error: error.message });
  }
};
