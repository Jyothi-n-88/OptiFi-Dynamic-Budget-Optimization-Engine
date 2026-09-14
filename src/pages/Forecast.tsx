import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ForecastRow {
  departmentId: string;
  departmentName: string;
  currentRunRate: number;
  quarterlyForecast: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

export default function Forecast() {
  const [forecastData, setForecastData] = useState<ForecastRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/forecast');
      setForecastData(res.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load forecast data', err);
      setError('Failed to generate forecast.');
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

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">INCREASING &uarr;</span>;
      case 'DECREASING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">DECREASING &darr;</span>;
      case 'STABLE':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">STABLE &minus;</span>;
    }
  };

  const chartData = forecastData.map(d => ({
    name: d.departmentName,
    'Monthly Run-Rate': d.currentRunRate,
    'Quarterly Projection': d.quarterlyForecast
  }));

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Generating forecast models...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Forecasting</h1>
          <p className="text-sm text-gray-500 mt-1">Predict future budget requirements based on historical run-rates.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 mb-6">Run-Rate vs Quarterly Projections</h3>
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `₹${(val / 1000)}k`} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} formatter={(value: number) => formatCurrency(value)} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Monthly Run-Rate" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Quarterly Projection" fill="#14B8A6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No chart data available</div>
          )}
        </div>
      </div>

      {/* Forecast Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Run-Rate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projected Quarterly Need</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecastData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    No forecast data available. Record more expenses to generate models.
                  </td>
                </tr>
              ) : (
                forecastData.map((row) => (
                  <tr key={row.departmentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.departmentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {formatCurrency(row.currentRunRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                      {formatCurrency(row.quarterlyForecast)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getTrendBadge(row.trend)}
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
