import { useState, useEffect } from 'react';
import { fetchSummary } from '../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function SummaryChart({ dateFrom, dateTo }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadChart = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchSummary(dateFrom, dateTo);
      setData(result.series);
    } catch (err) {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChart();
  }, [dateFrom, dateTo]);

  if (loading) {
    return <div className="h-72 w-full flex items-center justify-center bg-white rounded-lg border shadow-sm text-gray-500 animate-pulse">Loading chart data...</div>;
  }
  
  if (error) {
    return (
      <div className="h-72 w-full flex flex-col items-center justify-center bg-red-50 rounded-lg border border-red-200 text-red-600 shadow-sm">
        <p className="mb-2 font-medium">Chart API Failed to Load (Simulated 20% Error Rate)</p>
        <button onClick={loadChart} className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="h-72 w-full bg-white p-4 rounded-lg shadow-sm border">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Line type="monotone" dataKey="minutes" stroke="#3b82f6" strokeWidth={3} dot={false} name="Total Minutes" />
          <Line type="monotone" dataKey="cost_cents" stroke="#10b981" strokeWidth={3} dot={false} name="Cost (Cents)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}