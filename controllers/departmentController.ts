import { Request, Response } from 'express';
import Department from '../models/Department';

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    res.status(200).json(departments);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, priority, minimumBudget, maximumBudget, performanceScore } = req.body;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newDepartment = new Department({
      name,
      priority: priority || 'MEDIUM',
      minimumBudget: minimumBudget || 0,
      maximumBudget: maximumBudget || 0,
      performanceScore: performanceScore !== undefined ? performanceScore : 50,
    });

    const savedDepartment = await newDepartment.save();
    res.status(201).json(savedDepartment);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating department', error: error.message });
  }
};
