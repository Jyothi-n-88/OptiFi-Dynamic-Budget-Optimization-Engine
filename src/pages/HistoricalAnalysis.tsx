import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AnalysisRow {
  departmentId: string;
  departmentName: string;
  historicalBudget: number;
  historicalSpent: number;
  variance: number;
  utilization: number;
  performanceScore: number;
}

export default function HistoricalAnalysis() {
  const [analysisData, setAnalysisData] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/analysis/historical');
      setAnalysisData(res.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load historical analysis data', err);
      setError('Failed to load historical analysis.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'bg-red-500';
    if (utilization < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const activeDepartments = analysisData.filter(d => d.historicalBudget > 0 || d.historicalSpent > 0);
  
  let mostEfficient = null;
  let highestRisk = null;

  if (activeDepartments.length > 0) {
    // Most Efficient: Lowest utilization > 0
    const utilizedDepts = activeDepartments.filter(d => d.utilization > 0);
    if (utilizedDepts.length > 0) {
      mostEfficient = utilizedDepts.reduce((prev, curr) => prev.utilization < curr.utilization ? prev : curr);
    }
    // Highest Risk: Highest utilization
    highestRisk = activeDepartments.reduce((prev, curr) => prev.utilization > curr.utilization ? prev : curr);
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading analysis...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historical Performance Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Evaluate past budget adherence and departmental efficiency.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Most Efficient Department</p>
            <p className="text-lg font-bold text-gray-900">
              {mostEfficient ? `${mostEfficient.departmentName} (${mostEfficient.utilization.toFixed(1)}%)` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Highest Risk Department</p>
            <p className="text-lg font-bold text-gray-900">
              {highestRisk ? `${highestRisk.departmentName} (${highestRisk.utilization.toFixed(1)}%)` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Historical Budget</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Historical Spent</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Utilization</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analysisData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No historical data available.
                  </td>
                </tr>
              ) : (
                analysisData.map((row) => (
                  <tr key={row.departmentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.departmentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {formatCurrency(row.historicalBudget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {formatCurrency(row.historicalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {row.variance >= 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Savings: {formatCurrency(Math.abs(row.variance))}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Overspend: {formatCurrency(Math.abs(row.variance))}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{row.utilization.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getUtilizationColor(row.utilization)}`}
                          style={{ width: `${Math.min(row.utilization, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{row.performanceScore}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
