import { Request, Response } from 'express';
import Department from '../models/Department';
import Expense from '../models/Expense';

export const getForecast = async (req: Request, res: Response) => {
  try {
    const departments = await Department.find();
    const expenses = await Expense.find();

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const forecastData = departments.map(dept => {
      const deptId = (dept._id as string).toString();
      const deptExpenses = expenses.filter(e => e.department?.toString() === deptId);

      if (deptExpenses.length === 0) {
        return {
          departmentId: deptId,
          departmentName: dept.name,
          currentRunRate: 0,
          quarterlyForecast: 0,
          trend: 'STABLE'
        };
      }

      let totalSpend = 0;
      let recentMonthSpend = 0;
      let earliestDate = now;

      deptExpenses.forEach(exp => {
        const expAmount = exp.amount || 0;
        totalSpend += expAmount;
        
        const expDate = new Date(exp.date);
        if (expDate < earliestDate) {
          earliestDate = expDate;
        }
        
        if (expDate >= thirtyDaysAgo) {
          recentMonthSpend += expAmount;
        }
      });

      // Calculate months between earliest expense and today
      const diffTime = Math.abs(now.getTime() - earliestDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      let months = diffDays / 30;
      
      // Default to 1 month if range is extremely small (e.g., all expenses today)
      if (months < 1) {
        months = 1;
      }

      const currentRunRate = totalSpend / months;
      const quarterlyForecast = currentRunRate * 3;

      let trend = 'STABLE';
      // Adding a 5% buffer for stable classification
      if (recentMonthSpend > currentRunRate * 1.05) {
        trend = 'INCREASING';
      } else if (recentMonthSpend < currentRunRate * 0.95) {
        trend = 'DECREASING';
      }

      return {
        departmentId: deptId,
        departmentName: dept.name,
        currentRunRate: Math.round(currentRunRate),
        quarterlyForecast: Math.round(quarterlyForecast),
        trend
      };
    });

    res.status(200).json(forecastData);
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating forecast', error: error.message });
  }
};
