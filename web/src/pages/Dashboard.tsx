import { useMemo, useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { LayoutDashboard } from 'lucide-react';
import { CURRENCIES, EXCHANGE_RATES, CHART_COLORS as COLORS } from '../constants';

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions();
  const [displayCurrency, setDisplayCurrency] = useState('ALL');

  const { totalIncome, totalExpense, balance, categoryData, monthlyData } = useMemo(() => {
    let inc = 0, exp = 0;
    const catMap: Record<string, number> = {};
    const monthMap: Record<string, { name: string; income: number; expense: number }> = {};

    transactions.forEach(t => {
      const txCurrency = t.currency || 'USD';
      
      // If a specific currency is selected, ignore matching rows
      if (displayCurrency !== 'ALL' && txCurrency !== displayCurrency) return;
      
      // Calculate normalized value for standard additions
      let normalizedAmount = Number(t.amount) || 0;
      if (displayCurrency === 'ALL') {
        normalizedAmount = normalizedAmount * (EXCHANGE_RATES[txCurrency] || 1);
      }

      // Totals
      if (t.type === 'income') inc += normalizedAmount;
      else exp += normalizedAmount;

      // Category map
      if (t.type === 'expense') {
        catMap[t.category] = (catMap[t.category] || 0) + normalizedAmount;
      }

      // Monthly map (e.g. 'Jan 2026')
      try {
        const monthYear = format(parseISO(t.date), 'MMM yyyy');
        if (!monthMap[monthYear]) {
          monthMap[monthYear] = { name: monthYear, income: 0, expense: 0 };
        }
        if (t.type === 'income') monthMap[monthYear].income += normalizedAmount;
        else monthMap[monthYear].expense += normalizedAmount;
      } catch(e) {}
    });

    const categories = Object.keys(catMap).map(k => ({ name: k, value: catMap[k] })).sort((a,b) => b.value - a.value);
    const months = Object.values(monthMap).reverse(); // Assuming descending from query

    return { 
      totalIncome: inc, 
      totalExpense: exp, 
      balance: inc - exp,
      categoryData: categories,
      monthlyData: months
    };
  }, [transactions, displayCurrency]);

  if (loading) return <div className="text-secondary text-center mt-4">Loading dashboard...</div>;

  const symbol = displayCurrency === 'ALL' ? 'USD(eq)' : displayCurrency;

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-md)' }}>
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Overview</h1>
            <p className="text-secondary">Welcome back, {user?.displayName?.split(' ')[0] || 'User'}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '300px' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>View:</span>
          <select 
            className="select" 
            style={{ width: '100%', padding: '0.5rem 1rem' }}
            value={displayCurrency} 
            onChange={(e) => setDisplayCurrency(e.target.value)}
          >
            <option value="ALL">All Combined (USD eq)</option>
            {CURRENCIES.map(c => <option key={c} value={c}>{c} Only</option>)}
          </select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(miN(250px, 100%), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <p className="label" style={{ whiteSpace: 'nowrap' }}>Total Balance ({symbol})</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 600, color: balance < 0 ? 'var(--danger-text)' : 'inherit' }}>
            {balance < 0 ? '-' : ''}{balance < 0 ? symbol : ''} {Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="card">
          <p className="label text-success" style={{ whiteSpace: 'nowrap' }}>Total Income ({symbol})</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 600 }} className="text-success">+{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="card">
          <p className="label text-danger" style={{ whiteSpace: 'nowrap' }}>Total Expenses ({symbol})</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 600 }} className="text-danger">-{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
        {/* Expenses by Category */}
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', padding: '1.5rem 0.5rem', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', paddingLeft: '1rem' }}>Expenses by Category</h3>
          <div style={{ flex: 1, width: '100%' }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%" cy="50%"
                    innerRadius="60%" outerRadius="80%"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`}
                    contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-secondary">No expense data yet</div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', padding: '1.5rem 0.5rem', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', paddingLeft: '1rem' }}>Monthly Trend</h3>
          <div style={{ flex: 1, width: '100%', marginLeft: '-15px' }}>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`}
                    contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    cursor={{ fill: 'var(--border-color)', opacity: 0.1 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                  <Bar dataKey="income" name="Income" fill="var(--success-color)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="expense" name="Expense" fill="var(--danger-color)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-secondary" style={{ paddingLeft: '15px' }}>No trend data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
