import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAccounts } from './api';
import SummaryChart from './components/SummaryChart';
import SettingsWizard from './components/SettingsWizard';

export default function App() {
  // Store date filters in the URL so the page can be shared or refreshed
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  
  const [accounts, setAccounts] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Fetch table data and seamlessly update state
  const loadTableData = async () => {
    try {
      const data = await fetchAccounts({ date_from: dateFrom, date_to: dateTo, page: 1, page_size: 15 });
      setAccounts(data.data);
    } catch (error) {
      console.error("Failed to load accounts", error);
    }
  };

  // Initial load and silent background polling every 10 seconds
  useEffect(() => {
    loadTableData();
    const interval = setInterval(loadTableData, 10000); 
    return () => clearInterval(interval);
  }, [dateFrom, dateTo]);

  // Update URL parameters when dates change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => {
      if (value) prev.set(name, value);
      else prev.delete(name);
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Global Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-4 items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Callzo Admin Console</h1>
          <div className="flex gap-4">
            <input type="date" name="date_from" value={dateFrom} onChange={handleDateChange} className="border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="date" name="date_to" value={dateTo} onChange={handleDateChange} className="border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Resilient Chart Component */}
        <SummaryChart dateFrom={dateFrom} dateTo={dateTo} />

        {/* Account Data Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 border-b text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Account Name</th>
                <th className="p-4 font-semibold">Plan</th>
                <th className="p-4 font-semibold">Cost (Cents)</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id} 
                    onClick={() => setSelectedRow(acc.id)}
                    className={`border-b cursor-pointer transition-colors ${selectedRow === acc.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <td className="p-4">{acc.name}</td>
                  <td className="p-4 capitalize">{acc.plan}</td>
                  <td className="p-4">{acc.cost_cents}</td>
                  <td className="p-4">
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(acc.id); }} 
                            className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded hover:bg-blue-100 transition-colors">
                      Edit Settings
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Wizard overlay */}
        {editingId && <SettingsWizard accountId={editingId} onClose={() => setEditingId(null)} />}
      </div>
    </div>
  );
}