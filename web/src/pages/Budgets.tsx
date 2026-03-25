import { useState } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';
import { Plus, Trash2, BellRing, BellOff, X, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CURRENCIES, DEFAULT_EXPENSE_CATEGORIES } from '../constants';
import { useAlerts } from '../hooks/useAlerts';
import { useSettings } from '../contexts/SettingsContext';

export default function Budgets() {
  const { budgets, addBudget, deleteBudget, updateBudget } = useBudgets();
  const { transactions } = useTransactions();
  const { baseCurrency } = useSettings();
  const { activeAlerts } = useAlerts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Filter & Sort State
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ignored' | 'exceeded'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'monthly' | 'all_time'>('all');
  const [sortBy, setSortBy] = useState<'amount' | 'category'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Derived filtered & sorted budgets
  const filteredBudgets = budgets
    .filter(b => {
      if (filterStatus === 'ignored') return b.ignored;
      if (filterStatus === 'active') return !b.ignored;
      if (filterStatus === 'exceeded') return !b.ignored && activeAlerts.some(a => a.id === b.id);
      return true;
    })
    .filter(b => filterCategory === 'all' || b.category === filterCategory)
    .filter(b => filterPeriod === 'all' || b.period === filterPeriod)
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else {
        comparison = a.category.localeCompare(b.category);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination Logic
  const totalItems = filteredBudgets.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBudgets = filteredBudgets.slice(startIndex, startIndex + pageSize);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: any) => void, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  const dynamicExpenseCats = Array.from(new Set([
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...transactions.filter(t => t.type === 'expense').map(t => t.category),
    ...budgets.map(b => b.category).filter(c => c !== 'ALL')
  ])).sort();

  const uniqueCategories = Array.from(new Set(budgets.map(b => b.category))).sort();

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-md)' }}>
            <BellRing size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Budgets & Alerts</h1>
            <p className="text-secondary">Set thresholds and track limits.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: 'max-content' }}>
          <button 
            className={`btn ${isFilterVisible ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setIsFilterVisible(!isFilterVisible)}
          >
            <Filter size={18} />
            Filters {isFilterVisible ? '(Hide)' : ''}
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ flex: 1 }}>
            <Plus size={18} />
            Add Alert Limit
          </button>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      {isFilterVisible && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-end', backgroundColor: 'var(--bg-panel)', animation: 'slideDown 0.3s ease' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>Status</label>
            <select className="select" style={{ padding: '0.5rem', fontSize: '0.85rem' }} value={filterStatus} onChange={(e) => handleFilterChange(setFilterStatus, e.target.value as any)}>
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="exceeded">Exceeded Only</option>
              <option value="ignored">Ignored Only</option>
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>Category</label>
            <select className="select" style={{ padding: '0.5rem', fontSize: '0.85rem' }} value={filterCategory} onChange={(e) => handleFilterChange(setFilterCategory, e.target.value)}>
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat === 'ALL' ? 'Any Category' : cat}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>Timeframe</label>
            <select className="select" style={{ padding: '0.5rem', fontSize: '0.85rem' }} value={filterPeriod} onChange={(e) => handleFilterChange(setFilterPeriod, e.target.value as any)}>
              <option value="all">All Timeframes</option>
              <option value="monthly">Monthly Reset</option>
              <option value="all_time">All-Time Total</option>
            </select>
          </div>

          <div style={{ flex: '1 1 120px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>Show Per Page</label>
            <select 
              className="select" 
              style={{ padding: '0.5rem', fontSize: '0.85rem' }} 
              value={pageSize} 
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size} items</option>)}
            </select>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-color)', height: '40px', display: 'none' }} className="d-md-block" />

          <div style={{ flex: '1 1 120px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>Sort By</label>
            <select className="select" style={{ padding: '0.5rem', fontSize: '0.85rem' }} value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="amount">Limit Amount</option>
              <option value="category">Category</option>
            </select>
          </div>

          <button 
            className="btn btn-outline" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '38px' }}
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <><ArrowUpDown size={14} /> Asc</> : <><ArrowUpDown size={14} /> Desc</>}
          </button>
          
          <button 
            className="btn btn-outline text-danger" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '38px' }}
            onClick={() => {
              setFilterStatus('all');
              setFilterCategory('all');
              setFilterPeriod('all');
              setSortBy('amount');
              setSortOrder('desc');
            }}
          >
            Reset
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {paginatedBudgets.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '3rem 0' }}>No matching budget alerts found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {paginatedBudgets.map(b => {
              const alert = activeAlerts.find(a => a.id === b.id);
              const isExceeded = !!alert;

              return (
                <div key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ 
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '1.25rem 1.5rem', gap: '1rem',
                    opacity: b.ignored ? 0.6 : 1, filter: b.ignored ? 'grayscale(0.8)' : 'none', transition: 'var(--transition)',
                    backgroundColor: isExceeded && !b.ignored ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 min-content' }}>
                      <div style={{ 
                        padding: '0.75rem', 
                        borderRadius: '50%', 
                        backgroundColor: isExceeded && !b.ignored ? 'var(--danger-bg)' : 'var(--warning-bg)',
                        color: isExceeded && !b.ignored ? 'var(--danger-text)' : 'var(--warning-text)',
                        position: 'relative'
                      }}>
                        {b.ignored ? <BellOff size={20} /> : <BellRing size={20} />}
                        {isExceeded && !b.ignored && (
                          <div style={{ 
                            position: 'absolute', top: '-2px', right: '-2px', 
                            width: '12px', height: '12px', backgroundColor: 'var(--danger-color)', 
                            borderRadius: '50%', border: '2px solid var(--bg-panel)' 
                          }} />
                        )}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {b.category === 'ALL' ? 'Any Category' : b.category}
                          {b.ignored && <span style={{ padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', fontSize: '0.65rem', borderRadius: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>IGNORED</span>}
                          {isExceeded && !b.ignored && <span style={{ padding: '0.2rem 0.5rem', backgroundColor: 'var(--danger-color)', color: 'white', fontSize: '0.65rem', borderRadius: '12px', fontWeight: 700 }}>LIMIT EXCEEDED</span>}
                        </h4>
                        <div style={{ marginTop: '0.25rem' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Limit: {b.amount} {b.currency === 'ALL' ? '(Any)' : b.currency} • {b.period === 'monthly' ? 'Monthly' : 'All-time'}
                          </p>
                          {isExceeded && !b.ignored && (
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger-color)', marginTop: '0.25rem' }}>
                              Current: {alert.spent.toLocaleString(undefined, {minimumFractionDigits: 2})} {b.currency === 'ALL' ? 'USD(eq)' : b.currency}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '0 0 auto', justifyContent: 'flex-end' }}>
                      {isExceeded && !b.ignored && (
                        <button 
                          onClick={() => setExpandedAlert(expandedAlert === b.id ? null : b.id)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}
                        >
                          {expandedAlert === b.id ? 'Hide Message' : 'View Message'}
                        </button>
                      )}
                      <button 
                        onClick={() => updateBudget(b.id, { ignored: !b.ignored }).catch(console.error)} 
                        className="btn btn-outline" 
                        style={{ padding: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {b.ignored ? <><BellRing size={16} /> Enable</> : <><BellOff size={16} /> Ignore</>}
                      </button>
                      <button onClick={() => deleteBudget(b.id)} className="btn text-danger" style={{ padding: '0.5rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {expandedAlert === b.id && alert && (
                    <div style={{ 
                      padding: '1rem 1.5rem 1.5rem 4.5rem', 
                      backgroundColor: 'rgba(239, 68, 68, 0.02)',
                      borderTop: '1px dashed var(--border-color)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: 'var(--text-primary)'
                    }}>
                      <div style={{ 
                        padding: '1rem', 
                        backgroundColor: 'var(--bg-panel)', 
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '4px solid var(--danger-color)',
                        boxShadow: 'var(--card-shadow)'
                      }}>
                        {alert.msg}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Page <strong>{currentPage}</strong> of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-outline"
                style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '36px', height: '36px' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                className="btn btn-outline"
                style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '36px', height: '36px' }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <BudgetModal 
          onClose={() => setIsModalOpen(false)} 
          baseCurrency={baseCurrency}
          expenseCategories={dynamicExpenseCats}
          onSubmit={(data) => {
            addBudget(data).catch(console.error);
            setIsModalOpen(false);
          }} 
        />
      )}
    </div>
  );
}

function BudgetModal({ onClose, onSubmit, baseCurrency, expenseCategories }: { 
  onClose: () => void, 
  onSubmit: (data: any) => void, 
  baseCurrency: string,
  expenseCategories: string[]
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('ALL');
  const [currency, setCurrency] = useState(baseCurrency);
  const [period, setPeriod] = useState<'monthly' | 'all_time'>('monthly');

  const isFormValid = !!amount && parseFloat(amount) > 0 && !!category;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onSubmit({
      amount: parseFloat(amount),
      category,
      currency,
      period
    });
  };

  const categories = ['ALL', ...expenseCategories];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem'
    }}>
      <div className="card w-full" style={{ maxWidth: '500px', position: 'relative' }}>
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}>
          <X size={24} />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add Limit Alert</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label className="label">Limit Amount</label>
              <input 
                type="number" step="0.01" required className="input" 
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label className="label">Currency</label>
              <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="ALL">ANY</option>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Category Threshold</label>
            <select className="select" required value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c === 'ALL' ? 'Total Expenses (All Categories)' : c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Timeframe</label>
            <select className="select" required value={period} onChange={(e) => setPeriod(e.target.value as any)}>
              <option value="monthly">Monthly Reset</option>
              <option value="all_time">All-Time Total</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ display: 'flex' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex' }} disabled={!isFormValid}>Save Alert</button>
          </div>
        </form>
      </div>
    </div>
  );
}
