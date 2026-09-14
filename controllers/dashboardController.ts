import { Request, Response } from 'express';
import Budget from '../models/Budget';
import Expense from '../models/Expense';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const latestBudget = await Budget.findOne()
      .sort({ createdAt: -1 })
      .populate('departmentAllocations.department', 'name');
      
    const allExpenses = await Expense.find().populate('department', 'name');

    let totalBudget = 0;
    const departmentBudgets: Record<string, { name: string, allocated: number }> = {};

    if (latestBudget) {
      totalBudget = latestBudget.totalBudget;
      if (latestBudget.departmentAllocations) {
        latestBudget.departmentAllocations.forEach((alloc: any) => {
          if (alloc.department) {
            departmentBudgets[(alloc.department._id).toString()] = {
              name: alloc.department.name,
              allocated: alloc.allocatedAmount || 0
            };
          }
        });
      }
    }

    let totalSpent = 0;
    const actualSpentByDept: Record<string, number> = {};
    const deptNames: Record<string, string> = {};

    allExpenses.forEach((exp: any) => {
      totalSpent += exp.amount;
      if (exp.department) {
        const deptId = (exp.department._id).toString();
        actualSpentByDept[deptId] = (actualSpentByDept[deptId] || 0) + exp.amount;
        deptNames[deptId] = exp.department.name;
      }
    });

    const remainingBudget = totalBudget - totalSpent;
    const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Combine into Chart Data
    const budgetVsActual = [];
    const allDeptIds = new Set([
      ...Object.keys(departmentBudgets), 
      ...Object.keys(actualSpentByDept)
    ]);

    for (const deptId of allDeptIds) {
      budgetVsActual.push({
        department: departmentBudgets[deptId]?.name || deptNames[deptId] || 'Unknown',
        allocated: departmentBudgets[deptId]?.allocated || 0,
        spent: actualSpentByDept[deptId] || 0
      });
    }

    res.status(200).json({
      kpis: {
        totalBudget,
        totalSpent,
        remainingBudget,
        utilization: Math.round(utilization * 10) / 10 // round to 1 decimal
      },
      budgetVsActual
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching dashboard summary', error: error.message });
  }
};
