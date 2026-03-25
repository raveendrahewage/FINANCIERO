import React, { useState } from 'react';
import { useTransactions, type Transaction } from '../hooks/useTransactions';
import { Plus, Trash2, TrendingUp, TrendingDown, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Transactions() {
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) return <div className="text-secondary text-center mt-4">Loading transactions...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Transactions</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
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
              <div key={t.id} className="flex justify-between items-center" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                <div className="flex items-center gap-4">
                  <div style={{ 
                    padding: '0.75rem', 
                    borderRadius: '50%', 
                    backgroundColor: t.type === 'income' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: t.type === 'income' ? 'var(--success-text)' : 'var(--danger-text)'
                  }}>
                    {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '1rem' }}>{t.category}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {format(parseISO(t.date), 'MMM d, yyyy')} {t.note && ` • ${t.note}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ 
                    fontWeight: 700, 
                    fontSize: '1.125rem',
                    color: t.type === 'income' ? 'var(--success-text)' : 'var(--danger-text)' 
                  }}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
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
            setIsModalOpen(false);
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
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      date,
      note
    });
    setSaving(false);
  };

  const categories = type === 'expense' 
    ? ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other']
    : ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem'
    }}>
      <div className="card w-full" style={{ maxWidth: '500px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}>
          <X size={24} />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add Transaction</h2>
        
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
              onClick={() => setType('income')}
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
              onClick={() => setType('expense')}
            >
              Expense
            </button>
          </div>

          <div>
            <label className="label">Amount</label>
            <input 
              type="number" step="0.01" required className="input" 
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select className="select" required value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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

          <div className="flex justify-end gap-2 mt-4">
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
