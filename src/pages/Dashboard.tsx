import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface KPI {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  utilization: number;
}

interface ChartData {
  department: string;
  allocated: number;
  spent: number;
}

interface HealthStatus {
  status: string;
  project: string;
  database?: {
    connected: boolean;
    state: string;
    name?: string;
  };
  error?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await axios.get('/api/health');
      setHealth(res.data);
    } catch (err: any) {
      setHealth({ status: 'error', project: '', error: 'Backend error: ' + err.message });
    }
  };

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/dashboard/summary');
      setKpis(res.data.kpis);
      setChartData(res.data.budgetVsActual);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
      setError('Failed to load dashboard summary.');
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

  const pieData = chartData
    .filter(d => d.spent > 0)
    .map(d => ({ name: d.department, value: d.spent }));

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & API Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time OptiFi budget optimization overview.</p>
        </div>
        
        {health && (
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-xs shadow-sm flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${health.error ? 'bg-red-500' : 'bg-blue-500'}`}></div>
              <span className="text-gray-600 font-medium">{health.error ? 'API Offline' : 'API Online'}</span>
            </div>
            {health.database && (
              <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                <div className={`w-2 h-2 rounded-full ${health.database.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-600 font-medium">DB: {health.database.name || 'Unknown'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* KPI Grid */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">Total Budget</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.totalBudget)}</span>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">Total Spent</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.totalSpent)}</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">Remaining Budget</span>
            <span className={`text-2xl font-bold ${kpis.remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(kpis.remainingBudget)}
            </span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm font-medium text-gray-500">Utilization</span>
              <span className="text-2xl font-bold text-gray-900">{kpis.utilization}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${kpis.utilization > 100 ? 'bg-red-500' : kpis.utilization > 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(kpis.utilization, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Budget vs Actual */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-800 mb-6">Budget vs. Actual Spent by Department</h3>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `₹${(val / 1000)}k`} />
                  <Tooltip cursor={{ fill: '#F3F4F6' }} formatter={(value: number) => formatCurrency(value)} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="allocated" name="Allocated Budget" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="spent" name="Actual Spent" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No chart data available</div>
            )}
          </div>
        </div>

        {/* Pie Chart - Spend Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-6">Total Spent Distribution</h3>
          <div className="h-80 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend iconType="circle" layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm">No spend data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
