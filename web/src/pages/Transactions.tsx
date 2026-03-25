import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Plus, Trash2, TrendingUp, TrendingDown, X, Receipt } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CURRENCIES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants';

export default function Transactions() {
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) return <div className="text-secondary text-center mt-4">Loading transactions...</div>;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-md)' }}>
            <Receipt size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Transactions</h1>
            <p className="text-secondary">Manage your income and expenses.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ width: '100%', maxWidth: 'max-content' }}>
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {transactions.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '3rem 0' }}>No transactions found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {transactions.map(t => (
              <div key={t.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 min-content' }}>
                  <div style={{ 
                    padding: '0.75rem', 
                    borderRadius: '50%', 
                    backgroundColor: t.type === 'income' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: t.type === 'income' ? 'var(--success-text)' : 'var(--danger-text)'
                  }}>
                    {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '1.05rem' }}>{t.category}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {format(parseISO(t.date), 'MMM d, yyyy')} {t.note && ` • ${t.note}`}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '0 0 auto', justifyContent: 'flex-end', minWidth: '120px' }}>
                  <span style={{ 
                    fontWeight: 700, 
                    fontSize: '1.125rem',
                    color: t.type === 'income' ? 'var(--success-text)' : 'var(--danger-text)' 
                  }}>
                    {t.type === 'income' ? '+' : '-'}{t.currency || 'USD'} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => deleteTransaction(t.id)} className="btn text-danger" style={{ padding: '0.5rem' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <TransactionModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={async (data) => {
            await addTransaction(data);
          }} 
        />
      )}
    </div>
  );
}

function TransactionModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: any) => Promise<void> }) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    const finalCategory = category === 'new_custom' ? customCategory : category;
    if (!finalCategory) return;
    
    setSaving(true);
    setError('');
    
    try {
      // Fire and forget (Firebase optimistic state handles UI update instantly)
      onSubmit({
        type,
        amount: parseFloat(amount),
        category: finalCategory,
        date,
        note,
        currency
      });
      onClose(); // Instantly close modal
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to save. Ensure Firestore is configured properly or checking rules.");
    } finally {
      // Always stop the saving animation
      setSaving(false);
    }
  };

  const categories = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem'
    }}>
      <div className="card w-full" style={{ maxWidth: '500px', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}>
          <X size={24} />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add Transaction</h2>
        
        {error && <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="flex gap-2">
            <button 
              type="button" 
              className="btn flex-1"
              style={{ 
                backgroundColor: type === 'income' ? 'var(--success-bg)' : 'var(--bg-color)',
                color: type === 'income' ? 'var(--success-text)' : 'var(--text-primary)',
                border: type === 'income' ? '1px solid var(--success-text)' : '1px solid var(--border-color)'
              }}
              onClick={() => { setType('income'); setCategory(''); }}
            >
              Income
            </button>
            <button 
              type="button" 
              className="btn flex-1"
              style={{ 
                backgroundColor: type === 'expense' ? 'var(--danger-bg)' : 'var(--bg-color)',
                color: type === 'expense' ? 'var(--danger-text)' : 'var(--text-primary)',
                border: type === 'expense' ? '1px solid var(--danger-text)' : '1px solid var(--border-color)'
              }}
              onClick={() => { setType('expense'); setCategory(''); }}
            >
              Expense
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label className="label">Amount</label>
              <input 
                type="number" step="0.01" required className="input" 
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label className="label">Currency</label>
              <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <select className="select" required value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="" disabled>Select category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="new_custom">+ Add Custom Category</option>
            </select>
            
            {category === 'new_custom' && (
              <div style={{ marginTop: '0.75rem' }}>
                <input 
                  type="text" required className="input" 
                  value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div>
            <label className="label">Date</label>
            <input 
              type="date" required className="input" 
              value={date} onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Note (Optional)</label>
            <input 
              type="text" className="input" 
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. Groceries at Target"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
