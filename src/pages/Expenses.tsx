import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Department {
  _id: string;
  name: string;
}

interface Expense {
  _id: string;
  date: string;
  department: Department;
  category: string;
  amount: number;
  description?: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [departmentId, setDepartmentId] = useState('');
  const [category, setCategory] = useState('Other');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  
  const categories = [
    'Cloud Infrastructure', 
    'Marketing & Ads', 
    'Salaries & Payroll', 
    'Office & Supplies', 
    'Travel & Events', 
    'Other'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, deptsRes] = await Promise.all([
        axios.get('/api/expenses'),
        axios.get('/api/departments')
      ]);
      setExpenses(expensesRes.data);
      setDepartments(deptsRes.data);
      if (deptsRes.data.length > 0) {
        setDepartmentId(deptsRes.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      setError('Failed to fetch data from the server.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!departmentId || !category || amount === '' || amount <= 0) {
      setError('Please fill all required fields correctly. Amount must be greater than 0.');
      return;
    }

    try {
      const res = await axios.post('/api/expenses', {
        date,
        department: departmentId,
        category,
        amount: Number(amount),
        description
      });
      
      setExpenses(prev => [res.data, ...prev]);
      
      // Reset form (keep department and category as is, clear rest)
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      
    } catch (error: any) {
      console.error('Failed to create expense', error);
      setError(error.response?.data?.message || 'Failed to record expense');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/expenses/${id}`);
      setExpenses(prev => prev.filter(exp => exp._id !== id));
    } catch (error) {
      console.error('Failed to delete expense', error);
      alert('Failed to delete expense.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <p className="text-sm text-gray-500">Record and review manual expense transactions.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Log New Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {departments.length === 0 ? (
                  <option value="" disabled>No departments available</option>
                ) : (
                  departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                required
                min="1"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 75000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. AWS monthly bill"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={departments.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Record Expense
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                  No expenses found. Record a transaction above to get started.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.date).toISOString().split('T')[0]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {expense.department?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={expense.description}>
                    {expense.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(expense._id)}
                      className="text-red-600 hover:text-red-900 focus:outline-none transition-colors"
                      title="Delete expense"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
