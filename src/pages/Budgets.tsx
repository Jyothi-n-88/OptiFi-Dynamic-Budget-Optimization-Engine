import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Department {
  _id: string;
  name: string;
}

interface BudgetAllocation {
  department: Department;
  allocatedAmount: number;
}

interface Budget {
  _id: string;
  financialYear: string;
  totalBudget: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  departmentAllocations: BudgetAllocation[];
}

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [financialYear, setFinancialYear] = useState('2026-27');
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'ARCHIVED'>('DRAFT');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetsRes, deptsRes] = await Promise.all([
        axios.get('/api/budgets'),
        axios.get('/api/departments')
      ]);
      setBudgets(budgetsRes.data);
      setDepartments(deptsRes.data);
      
      // Initialize allocations with 0 for all departments
      const initialAllocations: Record<string, number> = {};
      deptsRes.data.forEach((dept: Department) => {
        initialAllocations[dept._id] = 0;
      });
      setAllocations(initialAllocations);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setError('Failed to fetch data from the server.');
    }
  };

  const handleAllocationChange = (deptId: string, amount: string) => {
    setAllocations(prev => ({
      ...prev,
      [deptId]: Number(amount) || 0
    }));
  };

  const totalAllocated = Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
  const remainingBudget = totalBudget - totalAllocated;
  const isSubmitDisabled = remainingBudget < 0 || totalBudget <= 0 || !financialYear;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isSubmitDisabled) return;

    try {
      const departmentAllocations = Object.entries(allocations)
        .filter(([_, amount]) => amount > 0)
        .map(([deptId, amount]) => ({
          department: deptId,
          allocatedAmount: amount
        }));

      const res = await axios.post('/api/budgets', {
        financialYear,
        totalBudget,
        status,
        departmentAllocations
      });
      
      setBudgets(prev => [res.data, ...prev]);
      
      // Reset form
      setFinancialYear('2026-27');
      setTotalBudget(0);
      setStatus('DRAFT');
      
      const resetAllocations: Record<string, number> = {};
      departments.forEach(dept => {
        resetAllocations[dept._id] = 0;
      });
      setAllocations(resetAllocations);
      
    } catch (error: any) {
      console.error('Failed to create budget', error);
      setError(error.response?.data?.message || 'Failed to create budget');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">ACTIVE</span>;
      case 'DRAFT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">DRAFT</span>;
      case 'ARCHIVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">ARCHIVED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <p className="text-sm text-gray-500">Manage financial year budgets and allocations.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Budget</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
              <input
                type="text"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2026-27"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget (₹)</label>
              <input
                type="number"
                value={totalBudget || ''}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                required
                min="1"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-3 border-b pb-2">Department Allocations</h3>
            
            <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Allocated: ₹{totalAllocated.toLocaleString()}</span>
              <span className={`text-sm font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                Remaining: ₹{remainingBudget.toLocaleString()}
              </span>
            </div>

            {departments.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No departments available. Create departments first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div key={dept._id} className="flex flex-col">
                    <label className="block text-sm text-gray-700 mb-1 truncate" title={dept.name}>
                      {dept.name}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        value={allocations[dept._id] || ''}
                        onChange={(e) => handleAllocationChange(dept._id, e.target.value)}
                        min="0"
                        className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isSubmitDisabled 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              Create Budget
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Year</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Budget</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocations Summary</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {budgets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  No budgets found. Create one above to get started.
                </td>
              </tr>
            ) : (
              budgets.map((budget) => (
                <tr key={budget._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {budget.financialYear}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{budget.totalBudget.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getStatusBadge(budget.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {budget.departmentAllocations && budget.departmentAllocations.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-1">
                        {budget.departmentAllocations.map((alloc, idx) => (
                          <li key={idx}>
                            <span className="font-medium text-gray-700">{alloc.department?.name || 'Unknown'}:</span> ₹{alloc.allocatedAmount.toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic">No allocations</span>
                    )}
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
