import { Request, Response } from 'express';
import Expense from '../models/Expense';
import Department from '../models/Department';

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await Expense.find()
      .populate('department', 'name')
      .sort({ date: -1, createdAt: -1 });
    res.status(200).json(expenses);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching expenses', error: error.message });
  }
};

export const importExpenses = async (req: Request, res: Response) => {
  try {
    const expensesRaw = req.body;
    if (!Array.isArray(expensesRaw)) {
      return res.status(400).json({ message: 'Request body must be an array of expenses' });
    }

    // Fetch all existing departments to create a case-insensitive lookup map
    const departments = await Department.find();
    const deptMap = new Map<string, string>();
    departments.forEach(d => {
      deptMap.set(d.name.toLowerCase().trim(), (d._id as string).toString());
    });

    const validExpenses = [];
    let skippedCount = 0;

    for (const row of expensesRaw) {
      const { date, departmentName, category, amount, description } = row;
      
      const amt = Number(amount);
      if (!departmentName || !category || isNaN(amt) || amt <= 0) {
        skippedCount++;
        continue;
      }

      const deptKey = String(departmentName).toLowerCase().trim();
      let departmentId = deptMap.get(deptKey);

      // Dynamically create department if it doesn't exist
      if (!departmentId) {
        const newDept = new Department({
          name: departmentName.trim(),
          priority: 'MEDIUM',
          minimumBudget: 0,
          maximumBudget: 0,
          performanceScore: 50,
        });
        const savedDept = await newDept.save();
        departmentId = (savedDept._id as string).toString();
        deptMap.set(deptKey, departmentId);
      }

      validExpenses.push({
        date: date || Date.now(),
        department: departmentId,
        category,
        amount: amt,
        description
      });
    }

    if (validExpenses.length > 0) {
      await Expense.insertMany(validExpenses);
    }

    res.status(201).json({ 
      message: 'Successfully imported expenses', 
      count: validExpenses.length, 
      skipped: skippedCount 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error importing expenses', error: error.message });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { date, department, category, amount, description } = req.body;
    
    if (!department || !category || amount === undefined || amount <= 0) {
      return res.status(400).json({ message: 'Department, category, and a positive amount are required' });
    }

    const newExpense = new Expense({
      date: date || Date.now(),
      department,
      category,
      amount,
      description
    });

    const savedExpense = await newExpense.save();
    
    // Populate department name before returning
    await savedExpense.populate('department', 'name');
    
    res.status(201).json(savedExpense);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating expense', error: error.message });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error deleting expense', error: error.message });
  }
};
