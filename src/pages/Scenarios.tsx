import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Department {
  _id: string;
  name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface OptimizationRecommendation {
  departmentId: string;
  departmentName: string;
  recommendedAllocation: number;
}

export default function Scenarios() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scenario Controls State
  const [totalBudgetOverride, setTotalBudgetOverride] = useState<string>('');
  const [priorityOverrides, setPriorityOverrides] = useState<Record<string, string>>({});
  
  // Results State
  const [baselineData, setBaselineData] = useState<OptimizationRecommendation[]>([]);
  const [simulatedData, setSimulatedData] = useState<OptimizationRecommendation[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const deptsRes = await axios.get('/api/departments');
      setDepartments(deptsRes.data);

      // Run baseline optimization (no overrides)
      const optRes = await axios.post('/api/optimization/run', {});
      setBaselineData(optRes.data.recommendations);
      
      // Initialize default priority overrides state
      const initialOverrides: Record<string, string> = {};
      deptsRes.data.forEach((d: Department) => {
        initialOverrides[d._id] = 'NO CHANGE';
      });
      setPriorityOverrides(initialOverrides);

    } catch (err: any) {
      console.error('Failed to fetch scenario data', err);
      setError('Failed to load initial data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = (deptId: string, value: string) => {
    setPriorityOverrides(prev => ({
      ...prev,
      [deptId]: value
    }));
  };

  const runScenario = async () => {
    setIsSimulating(true);
    setError(null);
    try {
      // Filter out 'NO CHANGE'
      const activeOverrides: Record<string, string> = {};
      Object.entries(priorityOverrides).forEach(([id, val]) => {
        if ((val as string) !== 'NO CHANGE') {
          activeOverrides[id] = val as string;
        }
      });

      const payload: any = {};
      if (totalBudgetOverride) {
        payload.totalBudget = Number(totalBudgetOverride);
      }
      if (Object.keys(activeOverrides).length > 0) {
        payload.priorityOverrides = activeOverrides;
      }

      const res = await axios.post('/api/optimization/run', payload);
      setSimulatedData(res.data.recommendations);
      setHasSimulated(true);
    } catch (err: any) {
      console.error('Failed to run scenario', err);
      setError('Failed to run scenario engine.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Prepare chart data comparing baseline vs simulated
  const chartData = baselineData.map(base => {
    const sim = simulatedData.find(s => s.departmentId === base.departmentId);
    return {
      name: base.departmentName,
      'Current Allocation': base.recommendedAllocation,
      'Simulated Allocation': sim ? sim.recommendedAllocation : 0,
      variance: sim ? (sim.recommendedAllocation - base.recommendedAllocation) : 0
    };
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading simulator...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">What-If Scenario Simulator</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-6">Simulation Controls</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget Override (₹)</label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Leave blank to use active budget"
              value={totalBudgetOverride}
              onChange={(e) => setTotalBudgetOverride(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <h3 className="block text-sm font-medium text-gray-700 mb-3">Department Priority Overrides</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {departments.map(dept => (
                <div key={dept._id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-gray-800">{dept.name}</span>
                    <span className="text-xs text-gray-500">Default: {dept.priority}</span>
                  </div>
                  <select
                    className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={priorityOverrides[dept._id] || 'NO CHANGE'}
                    onChange={(e) => handlePriorityChange(dept._id, e.target.value)}
                  >
                    <option value="NO CHANGE">NO CHANGE</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={runScenario}
            disabled={isSimulating}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center"
          >
            {isSimulating ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {isSimulating ? 'Running Simulator...' : 'Run Scenario'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {hasSimulated ? (
            <>
              {/* Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-6">Scenario vs Baseline Allocation</h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                      <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                      <Tooltip 
                        formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="Current Allocation" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Simulated Allocation" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Variance Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Variance Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Baseline</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Simulated</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {chartData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(row['Current Allocation'])}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(row['Simulated Allocation'])}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                            <span className={row.variance > 0 ? 'text-green-600' : row.variance < 0 ? 'text-red-600' : 'text-gray-500'}>
                              {row.variance > 0 ? '+' : ''}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(row.variance)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center p-12 h-full min-h-[400px] text-gray-400">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Scenario Run Yet</h3>
              <p className="text-sm">Adjust controls on the left and run the simulator to visualize the algorithmic impact.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
