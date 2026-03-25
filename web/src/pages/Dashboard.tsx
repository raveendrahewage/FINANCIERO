import { useMemo, useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { useBudgets } from '../hooks/useBudgets';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { startOfMonth, subMonths, isSameMonth, getDate, getDaysInMonth, eachDayOfInterval, startOfDay, isAfter, subDays, format, parseISO } from 'date-fns';
import { useSettings } from '../contexts/SettingsContext';
import { GripVertical, LayoutDashboard, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Target, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import { getCategoryColor } from '../constants';

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, loading: txLoading } = useTransactions();
  const { budgets, loading: budgetLoading } = useBudgets();
  const { rates } = useExchangeRates();
  const { baseCurrency, dashboardLayout, setDashboardLayout } = useSettings();
  const [userDisplayCurrency, setUserDisplayCurrency] = useState<string | null>(null);

  // Derived unique currencies from transactions
  const usedCurrencies = useMemo(() => {
    const set = new Set(transactions.map(t => t.currency || 'USD'));
    return Array.from(set).sort();
  }, [transactions]);

  // --- Drag and Drop Logic ---
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault(); 
    if (draggedId !== id) {
      setTargetId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setTargetId(null);
      setDraggedId(null);
      return;
    }

    const newLayout = [...dashboardLayout];
    const draggedIdx = newLayout.indexOf(draggedId);
    const targetIdx = newLayout.indexOf(targetId);

    newLayout.splice(draggedIdx, 1);
    newLayout.splice(targetIdx, 0, draggedId);

    setDashboardLayout(newLayout);
    setDraggedId(null);
    setTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setTargetId(null);
  };

  const handleDragLeave = () => {
    setTargetId(null);
  };
  // --- End Drag and Drop ---
  const displayCurrency = userDisplayCurrency || 'ALL';

  const loading = txLoading || budgetLoading;

  const { 
    totalIncome, totalExpense, balance, 
    lastMonthIncome, lastMonthExpense,
    categoryData, monthlyData, dailySpendingData, netWorthData, comparisonData,
    budgetOverviewData,
    now
  } = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));

    let inc = 0, exp = 0;
    let linc = 0, lexp = 0;
    const catMap: Record<string, number> = {};
    const monthMap: Record<string, { name: string; income: number; expense: number }> = {};
    const dayMap: Record<string, number> = {};
    const historyMap: Record<string, number> = {};
    
    const currentMonthDays: Record<number, number> = {};
    const lastMonthDays: Record<number, number> = {};

    const sortedTxs = [...transactions].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    const thirtyDaysAgo = startOfDay(subDays(now, 30));

    sortedTxs.forEach(t => {
      const txCurrency = t.currency || 'USD';
      
      // LOGIC: If specific currency selected, ONLY show that currency (no conversion)
      // If ALL selected, show everything normalized to baseCurrency
      if (displayCurrency !== 'ALL' && txCurrency !== displayCurrency) return;
      
      let amt = Number(t.amount) || 0;
      if (displayCurrency === 'ALL') {
        const amtInUsd = amt * (rates[txCurrency] || 1);
        amt = amtInUsd / (rates[baseCurrency] || 1);
      }

      const txDate = parseISO(t.date);
      const dateKey = format(txDate, 'yyyy-MM-dd');

      // Totals (All time)
      if (t.type === 'income') inc += amt;
      else exp += amt;

      // Category map (Total)
      if (t.type === 'expense') {
        catMap[t.category] = (catMap[t.category] || 0) + amt;
      }

      // Last Month Totals
      if (isSameMonth(txDate, lastMonthStart)) {
        if (t.type === 'income') linc += amt;
        else lexp += amt;
      }

      // Current Month vs Last Month Daily (Pace)
      const dayNum = getDate(txDate);
      if (t.type === 'expense') {
        if (isSameMonth(txDate, currentMonthStart)) {
          currentMonthDays[dayNum] = (currentMonthDays[dayNum] || 0) + amt;
        } else if (isSameMonth(txDate, lastMonthStart)) {
          lastMonthDays[dayNum] = (lastMonthDays[dayNum] || 0) + amt;
        }
      }

      // Daily spending (last 30 days)
      if (t.type === 'expense' && isAfter(txDate, thirtyDaysAgo)) {
        dayMap[dateKey] = (dayMap[dateKey] || 0) + amt;
      }

      // Monthly map
      try {
        const monthYear = format(txDate, 'MMM yyyy');
        if (!monthMap[monthYear]) {
          monthMap[monthYear] = { name: monthYear, income: 0, expense: 0 };
        }
        if (t.type === 'income') monthMap[monthYear].income += amt;
        else monthMap[monthYear].expense += amt;
      } catch(e) {}

      // Cumulative history
      historyMap[dateKey] = inc - exp;
    });

    const categories = Object.keys(catMap).map(k => ({ 
      name: k, 
      value: catMap[k],
      color: getCategoryColor(k)
    })).sort((a,b) => b.value - a.value);
    const months = Object.values(monthMap);

    // Prepare Daily Spending (30 days)
    const last30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
    const dailySpending = last30Days.map(date => {
      const key = format(date, 'yyyy-MM-dd');
      return { name: format(date, 'MMM dd'), amount: dayMap[key] || 0 };
    });

    // Prepare Comparison Data (Cumulative Month-over-Month)
    const maxDays = Math.max(getDaysInMonth(currentMonthStart), getDaysInMonth(lastMonthStart));
    let curCumulative = 0;
    let prevCumulative = 0;
    const comparison = Array.from({ length: maxDays }, (_, i) => {
      const day = i + 1;
      curCumulative += currentMonthDays[day] || 0;
      prevCumulative += lastMonthDays[day] || 0;
      
      // Don't show future days for current month
      const isFuture = day > getDate(now);
      
      return {
        day: `Day ${day}`,
        current: isFuture ? null : curCumulative,
        previous: prevCumulative
      };
    });

    // Budget Overview Calculation
    const budgetOverview = budgets
      .filter(b => b.period === 'monthly' && !b.ignored)
      .map(b => {
        let relevant = transactions.filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), now));
        if (b.category !== 'ALL') relevant = relevant.filter(t => t.category === b.category);

        let spent = 0;
        if (displayCurrency === 'ALL') {
          // Normalize all transactions to baseCurrency for combined view
          spent = relevant.reduce((sum, t) => {
            const txCurrency = t.currency || 'USD';
            const amtInUsd = Number(t.amount) * (rates[txCurrency] || 1);
            return sum + (amtInUsd / (rates[baseCurrency] || 1));
          }, 0);
        } else {
          // Strict filter: Only count transactions that match the selected dashboard currency
          spent = relevant.filter(t => (t.currency || 'USD') === displayCurrency).reduce((sum, t) => sum + Number(t.amount), 0);
        }

        // Budget Limit: If combined view, normalize limit to baseCurrency. 
        // If specific currency view, only show the budget if it matches that currency or ALL.
        let budgetLimitConverted = b.amount;
        if (displayCurrency === 'ALL') {
           budgetLimitConverted = b.currency === 'ALL' ? b.amount : (b.amount * (rates[b.currency] || 1)) / (rates[baseCurrency] || 1);
        } else {
           // If user is looking at USD, and budget is LKR, it doesn't really make sense to show it unless we convert it.
           // However, user said "only show the transactions that are added in that selected currency".
           // I'll convert the budget limit to the displayCurrency if b.currency is ALL, or if it matches.
           if (b.currency !== 'ALL' && b.currency !== displayCurrency) return null; // Skip budgets not in this currency
           if (b.currency === 'ALL') {
              budgetLimitConverted = (b.amount * (rates[baseCurrency] || 1)) / (rates[displayCurrency] || 1);
           }
        }
        const percent = (spent / budgetLimitConverted) * 100;
        return { 
          id: b.id, 
          category: b.category, 
          spent, 
          limit: budgetLimitConverted, 
          currency: displayCurrency === 'ALL' ? baseCurrency : displayCurrency, 
          percent: Math.min(percent, 100), 
          isOver: spent > budgetLimitConverted 
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.percent - a.percent);

    // Net Worth History
    const historyDates = Object.keys(historyMap).sort();
    const netWorth = historyDates.map(date => ({
      name: format(parseISO(date), 'MMM dd'),
      balance: historyMap[date]
    }));

    return { 
      totalIncome: inc, totalExpense: exp, balance: inc - exp,
      lastMonthIncome: linc, lastMonthExpense: lexp,
      categoryData: categories, monthlyData: months,
      dailySpendingData: dailySpending, netWorthData: netWorth,
      comparisonData: comparison, budgetOverviewData: budgetOverview,
      now
    };
  }, [transactions, budgets, displayCurrency, rates, baseCurrency]);

  if (loading) return <div className="text-secondary text-center mt-4">Loading dashboard...</div>;

  const symbol = displayCurrency === 'ALL' ? `${baseCurrency}(eq)` : displayCurrency;

  const getGrowth = (current: number, previous: number) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const incGrowth = getGrowth(totalIncome, lastMonthIncome);
  const expGrowth = getGrowth(totalExpense, lastMonthExpense);

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-md)' }}>
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dashboard</h1>
            <p className="text-secondary">Welcome back, {user?.displayName?.split(' ')[0] || 'User'}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '300px' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>View:</span>
          <select 
            className="select" 
            style={{ width: '100%', padding: '0.5rem 1rem' }}
            value={displayCurrency} 
            onChange={(e) => setUserDisplayCurrency(e.target.value)}
          >
            <option value="ALL">All Combined ({baseCurrency} eq)</option>
            {usedCurrencies.map(c => <option key={c} value={c}>{c} Only</option>)}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p className="label text-success" style={{ whiteSpace: 'nowrap' }}>Total Income ({symbol})</p>
            {incGrowth !== null && (
              <span style={{ 
                fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px',
                color: incGrowth >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
                padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '4px'
              }}>
                {incGrowth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(incGrowth).toFixed(0)}%
              </span>
            )}
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 600 }} className="text-success">+{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p className="label text-danger" style={{ whiteSpace: 'nowrap' }}>Total Expenses ({symbol})</p>
            {expGrowth !== null && (
              <span style={{ 
                fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px',
                color: expGrowth <= 0 ? 'var(--success-color)' : 'var(--danger-color)',
                padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '4px'
              }}>
                {expGrowth > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(expGrowth).toFixed(0)}%
              </span>
            )}
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 600 }} className="text-danger">-{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
        {dashboardLayout.map((id) => {
          let content = null;
          let dragHandle = (
            <div 
              draggable 
              onDragStart={(e) => handleDragStart(e, id)}
              onDragEnd={handleDragEnd}
              style={{ 
                cursor: 'grab', 
                color: 'var(--text-secondary)', 
                opacity: 0.5,
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
              <GripVertical size={16} />
            </div>
          );

          switch (id) {
            case 'pace':
              content = (
                <div key="pace" className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 0.5rem', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingLeft: '1rem', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <TrendingUp size={20} style={{ color: 'var(--primary-color)' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Spending Pace</h3>
                    </div>
                    {dragHandle}
                  </div>
                  <div style={{ height: '300px', width: '100%', marginLeft: '-15px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={comparisonData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="day" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                        <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(value: any) => `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`}
                          contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        />
                        <Legend iconType="circle" />
                        <Area type="monotone" dataKey="previous" name={`Last Month (${format(subMonths(now, 1), 'MMM')})`} stroke="var(--text-secondary)" strokeDasharray="5 5" fill="transparent" strokeWidth={2} />
                        <Area type="monotone" dataKey="current" name={`This Month (${format(now, 'MMM')})`} stroke="var(--primary-color)" fill="rgba(59, 130, 246, 0.1)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
              break;
            case 'budgets':
              content = (
                <div key="budgets" className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 1.25rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Target size={20} style={{ color: 'var(--danger-color)' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Budget Status</h3>
                    </div>
                    {dragHandle}
                  </div>
                  <div style={{ height: '300px', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', paddingRight: '4px' }}>
                    {budgetOverviewData.length > 0 ? (
                      budgetOverviewData.map((b: any) => (
                        <div key={b.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: 500 }}>{b.category === 'ALL' ? 'Total Expenses' : b.category}</span>
                            <span style={{ color: b.isOver ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                              {b.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} / {b.limit.toLocaleString(undefined, { maximumFractionDigits: 0 })} {symbol}
                            </span>
                          </div>
                          <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${b.percent}%`, 
                              backgroundColor: b.isOver ? 'var(--danger-color)' : b.percent > 85 ? 'var(--warning-color)' : 'var(--success-color)',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full text-secondary text-center">
                        Set up monthly budgets to track your limits!
                      </div>
                    )}
                  </div>
                </div>
              );
              break;
            case 'daily':
              content = (
                <div key="daily" className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 0.5rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingLeft: '1rem', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <TrendingUp size={20} style={{ color: 'var(--primary-color)' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Daily Spending</h3>
                    </div>
                    {dragHandle}
                  </div>
                  <div style={{ height: '300px', width: '100%', marginLeft: '-15px' }}>
                    {dailySpendingData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailySpendingData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                          <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                          <Tooltip 
                            formatter={(value: any) => `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`}
                            contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                          />
                          <Area type="monotone" dataKey="amount" name="Spent" stroke="var(--primary-color)" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-secondary">No spending data</div>
                    )}
                  </div>
                </div>
              );
              break;
            case 'networth':
              content = (
                <div key="networth" className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 0.5rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingLeft: '1rem', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Wallet size={20} style={{ color: 'var(--success-color)' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Balance Growth</h3>
                    </div>
                    {dragHandle}
                  </div>
                  <div style={{ height: '300px', width: '100%', marginLeft: '-15px' }}>
                    {netWorthData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={netWorthData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                          <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                          <Tooltip 
                            formatter={(value: any) => `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`}
                            contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                          />
                          <Line type="monotone" dataKey="balance" name="Net Balance" stroke="var(--success-color)" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-secondary">Gathering history...</div>
                    )}
                  </div>
                </div>
              );
              break;
            case 'category':
              content = (
                <div key="category" className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 0.5rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingLeft: '1rem', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <PieIcon size={20} style={{ color: 'var(--primary-color)' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Expenses by Category</h3>
                    </div>
                    {dragHandle}
                  </div>
                  <div style={{ height: '300px', width: '100%' }}>
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
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`}
                            contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-secondary">No expense data</div>
                    )}
                  </div>
                </div>
              );
              break;
            case 'monthly':
              content = (
                <div key="monthly" className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 0.5rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingLeft: '1rem', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <BarChart3 size={20} style={{ color: 'var(--primary-color)' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Monthly Comparison</h3>
                    </div>
                    {dragHandle}
                  </div>
                  <div style={{ height: '300px', width: '100%', marginLeft: '-15px' }}>
                    {monthlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                          <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                          <Tooltip 
                            formatter={(value: any) => `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`}
                            contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                            cursor={{ fill: 'var(--border-color)', opacity: 0.1 }}
                          />
                          <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                          <Bar dataKey="income" name="Income" fill="var(--success-color)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                          <Bar dataKey="expense" name="Expense" fill="var(--danger-color)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-secondary">No trend data</div>
                    )}
                  </div>
                </div>
              );
              break;
          }

          return (
            <div 
              key={id} 
              onDragOver={(e) => handleDragOver(e, id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, id)}
              style={{ 
                opacity: draggedId === id ? 0.3 : 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                border: targetId === id ? '2px solid var(--primary-color)' : (draggedId && draggedId !== id ? '2px dashed var(--border-color)' : '2px solid transparent'),
                borderRadius: 'var(--radius-lg)',
                transform: targetId === id ? 'scale(1.02)' : 'scale(1)',
                zIndex: targetId === id ? 10 : 1,
                backgroundColor: targetId === id ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
