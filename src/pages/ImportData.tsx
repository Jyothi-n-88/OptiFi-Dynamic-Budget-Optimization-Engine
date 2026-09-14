import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ParsedExpense {
  date: string;
  departmentName: string;
  category: string;
  amount: number | string;
  description: string;
  isValid: boolean;
  errors: string[];
}

export default function ImportData() {
  const [parsedData, setParsedData] = useState<ParsedExpense[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      parseCSV(csvText);
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        setError('CSV file is empty or only contains headers');
        return;
      }

      // Expected headers: Date,Department,Category,Amount,Description
      const results: ParsedExpense[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        // Simple CSV split (doesn't handle commas inside quotes, sufficient for demo)
        const row = lines[i].split(',').map(item => item.trim());
        
        if (row.length < 4) continue; // Skip malformed rows
        
        const date = row[0];
        const departmentName = row[1];
        const category = row[2];
        const amountStr = row[3];
        const description = row.length > 4 ? row[4] : '';
        
        const amount = Number(amountStr);
        const errors: string[] = [];
        let isValid = true;
        
        if (!departmentName) {
          errors.push('Missing Department');
          isValid = false;
        }
        if (!category) {
          errors.push('Missing Category');
          isValid = false;
        }
        if (isNaN(amount) || amount <= 0) {
          errors.push('Invalid Amount');
          isValid = false;
        }
        
        results.push({
          date,
          departmentName,
          category,
          amount: isNaN(amount) ? amountStr : amount,
          description,
          isValid,
          errors
        });
      }
      
      setParsedData(results);
      setError(null);
      setSuccessMessage(null);
    } catch (err: any) {
      setError(`Failed to parse CSV: ${err.message}`);
    }
  };

  const loadDemoData = () => {
    const demoCsv = `Date,Department,Category,Amount,Description
2026-09-01,Engineering,Cloud Infrastructure,45000,AWS Base Services
2026-09-02,Marketing,Marketing & Ads,120000,Q3 Campaign Launch
2026-09-03,HR,Salaries & Payroll,25000,Payroll Software Subscription
2026-09-05,Engineering,Salaries & Payroll,550000,Contractor Payments
2026-09-08,Sales,Travel & Events,35000,Client Meeting Flight
2026-09-10,Operations,Office & Supplies,15000,New Desk Setup
2026-09-11,Marketing,Other,8000,Design Tool Licenses
2026-09-12,Engineering,Cloud Infrastructure,12000,Vercel Hosting
2026-09-13,Sales,Other,22000,CRM Renewal
2026-09-14,HR,Travel & Events,18000,Team Offsite Dinner`;
    
    parseCSV(demoCsv);
  };

  const handleCommit = async () => {
    const validRows = parsedData.filter(row => row.isValid);
    if (validRows.length === 0) {
      setError('No valid rows to import');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      const res = await axios.post('/api/expenses/import', validRows);
      setSuccessMessage(`Success! Imported ${res.data.count} records. (Skipped ${res.data.skipped})`);
      setParsedData([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to commit import');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
          <p className="text-sm text-gray-500">Bulk upload historical expenses via CSV.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{successMessage}</span>
          <button 
            onClick={() => navigate('/expenses')}
            className="text-green-800 underline font-medium hover:text-green-900"
          >
            View Ledger &rarr;
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
          <input 
            type="file" 
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-blue-600 font-medium hover:underline">Select a CSV file</span>
            <span className="text-gray-500 text-sm mt-1">Expected headers: Date, Department, Category, Amount, Description</span>
          </label>
        </div>
        
        <div className="flex items-center text-gray-400 font-medium">OR</div>
        
        <div className="flex-1 w-full flex justify-center">
          <button 
            onClick={loadDemoData}
            className="px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Load Demo Historical Data
          </button>
        </div>
      </div>

      {parsedData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-gray-800">Staging Preview</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-medium">{validCount} Valid</span>
                {invalidCount > 0 && (
                  <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-medium">{invalidCount} Invalid</span>
                )}
              </div>
            </div>
            <button
              onClick={handleCommit}
              disabled={validCount === 0 || isProcessing}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                validCount === 0 || isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {isProcessing ? 'Importing...' : 'Commit Import to Database'}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.map((row, idx) => (
                  <tr key={idx} className={row.isValid ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.isValid ? (
                        <span className="text-green-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" title={row.errors.join(', ')}>
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.departmentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">₹{row.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
