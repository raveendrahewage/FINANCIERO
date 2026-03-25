import { useState } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import { Plus, Trash2, BellRing, X } from 'lucide-react';
import { CURRENCIES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants';

export default function Budgets() {
  const { budgets, addBudget, deleteBudget } = useBudgets();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ width: '100%', maxWidth: 'max-content' }}>
          <Plus size={18} />
          Add Alert Limit
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {budgets.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '3rem 0' }}>No budget alerts set yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {budgets.map(b => (
              <div key={b.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 min-content' }}>
                  <div style={{ 
                    padding: '0.75rem', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--warning-bg)',
                    color: 'var(--warning-text)'
                  }}>
                    <BellRing size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                      {b.category === 'ALL' ? 'Any Category' : b.category}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Limit: {b.amount} {b.currency === 'ALL' ? '(Any)' : b.currency} • {b.period === 'monthly' ? 'Monthly' : 'All-time'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '0 0 auto', justifyContent: 'flex-end', minWidth: '120px' }}>
                  <button onClick={() => deleteBudget(b.id)} className="btn text-danger" style={{ padding: '0.5rem' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <BudgetModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={(data) => {
            addBudget(data).catch(console.error);
            setIsModalOpen(false);
          }} 
        />
      )}
    </div>
  );
}

function BudgetModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: any) => void }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('ALL');
  const [currency, setCurrency] = useState('ALL');
  const [period, setPeriod] = useState<'monthly' | 'all_time'>('monthly');

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

  const categories = ['ALL', ...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

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
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Alert</button>
          </div>
        </form>
      </div>
    </div>
  );
}
