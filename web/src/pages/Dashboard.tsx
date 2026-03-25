import { useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions();

  const { totalIncome, totalExpense, balance, categoryData, monthlyData } = useMemo(() => {
    let inc = 0, exp = 0;
    const catMap: Record<string, number> = {};
    const monthMap: Record<string, { name: string; income: number; expense: number }> = {};

    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      
      // Totals
      if (t.type === 'income') inc += amount;
      else exp += amount;

      // Category map
      if (t.type === 'expense') {
        catMap[t.category] = (catMap[t.category] || 0) + amount;
      }

      // Monthly map (e.g. 'Jan 2026')
      try {
        const monthYear = format(parseISO(t.date), 'MMM yyyy');
        if (!monthMap[monthYear]) {
          monthMap[monthYear] = { name: monthYear, income: 0, expense: 0 };
        }
        if (t.type === 'income') monthMap[monthYear].income += amount;
        else monthMap[monthYear].expense += amount;
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
  }, [transactions]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  if (loading) return <div className="text-secondary text-center">Loading dashboard...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Overview</h1>
      <p className="text-secondary" style={{ marginBottom: '2rem' }}>Welcome back, {user?.displayName?.split(' ')[0] || 'User'}</p>
      
      {/* Summary Cards */}
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <p className="label">Total Balance</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 600, color: balance < 0 ? 'var(--danger-text)' : 'inherit' }}>
            ${balance.toFixed(2)}
          </h2>
        </div>
        <div className="card">
          <p className="label text-success">Total Income</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 600 }} className="text-success">+${totalIncome.toFixed(2)}</h2>
        </div>
        <div className="card">
          <p className="label text-danger">Total Expenses</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 600 }} className="text-danger">-${totalExpense.toFixed(2)}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Expenses by Category */}
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Expenses by Category</h3>
          <div style={{ flex: 1 }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%" cy="50%"
                    innerRadius={80} outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-secondary">No expense data yet</div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Monthly Trend</h3>
          <div style={{ flex: 1 }}>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    cursor={{ fill: 'var(--border-color)', opacity: 0.1 }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="var(--success-color)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="var(--danger-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-secondary">No trend data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
