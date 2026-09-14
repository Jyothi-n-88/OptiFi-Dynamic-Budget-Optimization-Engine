import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OptimizationRecommendation {
  departmentId: string;
  departmentName: string;
  currentAllocation: number;
  recommendedAllocation: number;
  difference: number;
  percentChange: number;
  factors: {
    priority: string;
    performanceScore: number;
    historicalUtilization: number;
    quarterlyForecast: number;
  };
}

interface OptimizationResult {
  recommendations: OptimizationRecommendation[];
  metadata: {
    targetBudget: number;
    allocatedTotal: number;
    unallocatedReserve: number;
  };
}

export default function OptimizeBudget() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [totalBudgetOverride, setTotalBudgetOverride] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [isAILoading, setIsAILoading] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Run optimization with default active budget on load
    runOptimization();
  }, []);

  const runOptimization = async (override?: string) => {
    setLoading(true);
    setError(null);
    setAiExplanations({});
    try {
      const payload = override ? { totalBudget: Number(override) } : {};
      const res = await axios.post('/api/optimization/run', payload);
      setResult(res.data);
      if (!override && res.data.metadata.targetBudget) {
        setTotalBudgetOverride(res.data.metadata.targetBudget.toString());
      }
    } catch (err: any) {
      console.error('Failed to run optimization engine', err);
      setError(err.response?.data?.message || 'Failed to generate optimized budget.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskGemini = async () => {
    if (!result || !result.recommendations.length) return;
    setIsAILoading(true);
    try {
      const res = await axios.post('/api/ai/explain', { recommendations: result.recommendations });
      setAiExplanations(res.data);
      
      // Auto-scroll to the table so the user sees the generated explanations
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('Failed to get Gemini explanations', err);
      setError(err.response?.data?.message || 'Failed to get Gemini explanations. Ensure GEMINI_API_KEY is configured.');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleRunCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalBudgetOverride || Number(totalBudgetOverride) <= 0) {
      setError('Please enter a valid positive number for the total budget override.');
      return;
    }
    runOptimization(totalBudgetOverride);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">MEDIUM</span>;
      case 'LOW':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">LOW</span>;
      default:
        return null;
    }
  };

  const chartData = result?.recommendations.map(r => ({
    name: r.departmentName,
    'Current Allocation': r.currentAllocation,
    'Recommended Allocation': r.recommendedAllocation,
  })) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dynamic Budget Optimization Engine</h1>
          <p className="text-sm text-gray-500 mt-1">Algorithmically allocate capital based on performance, priority, and forecasted demand.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Controls Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleRunCustom} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Total Budget (₹)</label>
            <input
              type="number"
              value={totalBudgetOverride}
              onChange={(e) => setTotalBudgetOverride(e.target.value)}
              className="w-full md:max-w-md rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter total distributable budget..."
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[220px]"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Run Optimization Engine'}
            </button>
            <button
              type="button"
              onClick={handleAskGemini}
              disabled={!result || isAILoading || loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[220px]"
            >
              {isAILoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : '✨ Ask Gemini to Explain Decisions'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <>
          {/* Visual Comparison Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-6 flex justify-between">
              <span>Capital Reallocation Plan</span>
              <span className="text-sm font-normal text-gray-500">
                Engine Target: <strong className="text-gray-900">{formatCurrency(result.metadata.targetBudget)}</strong>
              </span>
            </h3>
            <div className="h-80 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `₹${(val / 1000)}k`} />
                    <Tooltip cursor={{ fill: '#F3F4F6' }} formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Current Allocation" fill="#9CA3AF" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="Recommended Allocation" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No active departments found.</div>
              )}
            </div>
          </div>

          {/* Results Table */}
          <div ref={tableRef} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Allocation</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance / Adjustment</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact Summary</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.recommendations.map((row) => (
                    <React.Fragment key={row.departmentId}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.departmentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(row.factors.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {formatCurrency(row.currentAllocation)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">
                          {formatCurrency(row.recommendedAllocation)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {row.difference > 0 ? (
                            <span className="text-green-600">+{formatCurrency(row.difference)}</span>
                          ) : row.difference < 0 ? (
                            <span className="text-red-600">{formatCurrency(row.difference).replace('-', '-')}</span>
                          ) : (
                            <span className="text-gray-400">No Change</span>
                          )}
                          <span className="text-gray-400 text-xs ml-2">({row.difference > 0 ? '+' : ''}{row.percentChange.toFixed(1)}%)</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 max-w-[250px]">
                          Weight factors: Forecast ({formatCurrency(row.factors.quarterlyForecast)}), Perf Score ({row.factors.performanceScore})
                        </td>
                      </tr>
                      {aiExplanations[row.departmentName] && (
                        <tr className="bg-purple-50 border-t-0">
                          <td colSpan={6} className="px-6 py-3 border-b border-gray-200">
                            <div className="flex items-start gap-2">
                              <span className="text-purple-600 mt-0.5 text-lg">✨</span>
                              <p className="text-sm text-purple-900 font-medium">
                                <span className="font-semibold text-purple-800">AI Analysis: </span> 
                                {aiExplanations[row.departmentName]}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {result.metadata.unallocatedReserve > 0 && (
              <div className="bg-yellow-50 px-6 py-3 border-t border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> ₹{result.metadata.unallocatedReserve.toLocaleString()} left unallocated (departments capped by maximum budget limit constraints).
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
