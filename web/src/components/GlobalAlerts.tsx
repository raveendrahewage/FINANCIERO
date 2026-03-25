import { useState } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';
import { isSameMonth, parseISO } from 'date-fns';
import { AlertCircle, X } from 'lucide-react';

export default function GlobalAlerts() {
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  const [dismissed, setDismissed] = useState<string[]>([]);
  
  const now = new Date();
  
  const alerts = budgets.map(b => {
    let relevant = transactions.filter(t => t.type === 'expense');
    
    if (b.period === 'monthly') {
      relevant = relevant.filter(t => {
        try {
           return isSameMonth(parseISO(t.date), now);
        } catch { return false; }
      });
    }
    
    if (b.category !== 'ALL') {
      relevant = relevant.filter(t => t.category === b.category);
    }
    if (b.currency !== 'ALL') {
      relevant = relevant.filter(t => (t.currency || 'USD') === b.currency);
    }
    
    const spent = relevant.reduce((sum, t) => sum + Number(t.amount), 0);
    if (spent > b.amount) {
      return { 
        id: b.id, 
        msg: `Budget Exceeded: You've spent ${spent.toFixed(2)} / ${b.amount} ${b.currency !== 'ALL' ? b.currency : 'USD (eq)'} for ${b.category === 'ALL' ? 'Total Expenses' : b.category} this ${b.period === 'monthly' ? 'month' : 'year'}.`
      };
    }
    return null;
  }).filter(Boolean) as {id: string, msg: string}[];

  const activeAlerts = alerts.filter(a => !dismissed.includes(a.id));

  if (activeAlerts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {activeAlerts.map(a => (
        <div key={a.id} style={{ 
          display: 'flex', alignItems: 'flex-start', gap: '1rem', 
          backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', 
          padding: '1.25rem', borderRadius: 'var(--radius-lg)', 
          boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.2), 0 10px 10px -5px rgba(239, 68, 68, 0.1)', 
          maxWidth: '380px', border: '1px solid rgba(239, 68, 68, 0.3)',
        }}>
          <AlertCircle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.5 }}>
            {a.msg}
          </div>
          <button onClick={() => setDismissed(d => [...d, a.id])} style={{ 
            color: 'inherit', opacity: 0.7, background: 'transparent', 
            border: 'none', cursor: 'pointer', padding: '0.25rem', marginTop: '-0.25rem', marginRight: '-0.5rem' 
          }}>
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
