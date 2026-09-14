import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Department {
  _id: string;
  name: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  minimumBudget: number;
  maximumBudget: number;
  performanceScore: number;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    priority: 'MEDIUM',
    minimumBudget: 0,
    maximumBudget: 0,
    performanceScore: 50,
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/departments');
      setDepartments(res.data);
    } catch (error) {
      console.error('Failed to fetch departments', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'priority' ? value : name === 'name' ? value : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/departments', formData);
      setDepartments((prev) => [res.data, ...prev]);
      setFormData({
        name: '',
        priority: 'MEDIUM',
        minimumBudget: 0,
        maximumBudget: 0,
        performanceScore: 50,
      });
    } catch (error) {
      console.error('Failed to create department', error);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">MEDIUM</span>;
      case 'LOW':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">LOW</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <p className="text-sm text-gray-500">Manage department allocations and scores.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Department</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="col-span-1 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Engineering"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget</label>
              <input
                type="number"
                name="minimumBudget"
                value={formData.minimumBudget}
                onChange={handleInputChange}
                min="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget</label>
              <input
                type="number"
                name="maximumBudget"
                value={formData.maximumBudget}
                onChange={handleInputChange}
                min="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score (0-100)</label>
              <input
                type="number"
                name="performanceScore"
                value={formData.performanceScore}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Department
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budgets (Min / Max)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  No departments found. Create one above to get started.
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPriorityBadge(dept.priority)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${dept.minimumBudget.toLocaleString()} / ${dept.maximumBudget.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${dept.performanceScore >= 80 ? 'bg-green-500' : dept.performanceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${dept.performanceScore}%` }}
                        ></div>
                      </div>
                      <span className="font-mono">{dept.performanceScore}</span>
                    </div>
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
