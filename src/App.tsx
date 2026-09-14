/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Departments from './pages/Departments';
import Budgets from './pages/Budgets';
import Expenses from './pages/Expenses';
import ImportData from './pages/ImportData';
import Dashboard from './pages/Dashboard';
import HistoricalAnalysis from './pages/HistoricalAnalysis';
import Forecast from './pages/Forecast';
import OptimizeBudget from './pages/OptimizeBudget';
import Scenarios from './pages/Scenarios';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
        <nav className="bg-blue-600 text-white shadow-md p-4 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight">OptiFi</div>
          <div className="space-x-4">
            <Link to="/" className="hover:text-blue-200 transition-colors">Dashboard</Link>
            <Link to="/departments" className="hover:text-blue-200 transition-colors">Departments</Link>
            <Link to="/budgets" className="hover:text-blue-200 transition-colors">Budgets</Link>
            <Link to="/expenses" className="hover:text-blue-200 transition-colors">Expenses</Link>
            <Link to="/import" className="hover:text-blue-200 transition-colors">Import Data</Link>
            <Link to="/analysis" className="hover:text-blue-200 transition-colors">Analysis</Link>
            <Link to="/forecast" className="hover:text-blue-200 transition-colors">Forecasting</Link>
            <Link to="/optimize" className="hover:text-blue-200 transition-colors font-semibold text-yellow-300">Optimize Budget</Link>
            <Link to="/scenarios" className="hover:text-blue-200 transition-colors">Simulator</Link>
          </div>
        </nav>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/import" element={<ImportData />} />
            <Route path="/analysis" element={<HistoricalAnalysis />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/optimize" element={<OptimizeBudget />} />
            <Route path="/scenarios" element={<Scenarios />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
