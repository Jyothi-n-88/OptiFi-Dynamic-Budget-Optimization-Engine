import { Request, Response } from 'express';
import Budget from '../models/Budget';

export const getBudgets = async (req: Request, res: Response) => {
  try {
    const budgets = await Budget.find()
      .populate('departmentAllocations.department', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(budgets);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching budgets', error: error.message });
  }
};

export const createBudget = async (req: Request, res: Response) => {
  try {
    const { financialYear, totalBudget, departmentAllocations, status } = req.body;
    
    if (!financialYear || !totalBudget) {
      return res.status(400).json({ message: 'Financial year and total budget are required' });
    }

    // Calculate total allocations
    const totalAllocated = departmentAllocations?.reduce((sum: number, alloc: any) => sum + (Number(alloc.allocatedAmount) || 0), 0) || 0;

    if (totalAllocated > totalBudget) {
      return res.status(400).json({ 
        message: 'Sum of allocated amounts cannot exceed the total budget' 
      });
    }

    const newBudget = new Budget({
      financialYear,
      totalBudget,
      departmentAllocations: departmentAllocations || [],
      status: status || 'DRAFT'
    });

    const savedBudget = await newBudget.save();
    
    // Populate department names before returning
    await savedBudget.populate('departmentAllocations.department', 'name');
    
    res.status(201).json(savedBudget);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating budget', error: error.message });
  }
};
