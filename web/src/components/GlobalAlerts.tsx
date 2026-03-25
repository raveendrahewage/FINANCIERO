import { useState } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';
import { isSameMonth, parseISO } from 'date-fns';
import { AlertCircle, X, BellOff } from 'lucide-react';

export default function GlobalAlerts() {
  const { budgets, updateBudget } = useBudgets();
  const { transactions } = useTransactions();
  // Map to remember that we dismissed an alert for a specific threshold value.
  // If the user spends MORE later on in the same session, we will re-trigger the alert.
  const [dismissedAmounts, setDismissedAmounts] = useState<Record<string, number>>({});
  
  const now = new Date();
  
  const alerts = budgets.map(b => {
    // If user permanently ignored this limit, completely skip processing
    if (b.ignored) return null;

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
    
    // Check if the current spend breaks the limit barrier
    if (spent > b.amount) {
      // Get the recorded threshold at which they last explicitly closed the toast UI
      const lastDismissedAmount = dismissedAmounts[b.id] || 0;
      
      // Only fire a toast if the spend represents a NEW breach beyond what they already dismissed
      if (spent > lastDismissedAmount) {
         return { 
           id: b.id, 
           spent,
           msg: `Budget Exceeded: You've spent ${spent.toLocaleString(undefined, {minimumFractionDigits: 2})} / ${b.amount} ${b.currency !== 'ALL' ? b.currency : 'USD (eq)'} for ${b.category === 'ALL' ? 'Total Expenses' : b.category} this ${b.period === 'monthly' ? 'month' : 'timeframe'}.`
         };
      }
    }
    return null;
  }).filter(Boolean) as {id: string, spent: number, msg: string}[];

  if (alerts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {alerts.map(a => (
        <div key={a.id} style={{ 
          display: 'flex', flexDirection: 'column', gap: '0.75rem', 
          backgroundColor: 'var(--danger-color)', color: 'white', 
          padding: '1.25rem', borderRadius: 'var(--radius-lg)', 
          boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.4), 0 10px 10px -5px rgba(239, 68, 68, 0.2)', 
          maxWidth: '380px', border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <AlertCircle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.5 }}>
              {a.msg}
            </div>
            {/* Click 'X' to temporarily dismiss until the limit goes even higher */}
            <button onClick={() => setDismissedAmounts(prev => ({ ...prev, [a.id]: a.spent }))} style={{ 
              color: 'inherit', opacity: 0.7, background: 'transparent', 
              border: 'none', cursor: 'pointer', padding: '0.25rem', marginTop: '-0.25rem', marginRight: '-0.5rem' 
            }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => updateBudget(a.id, { ignored: true }).catch(console.error)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem',
                backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', 
                padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontWeight: 600, transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)')}
            >
              <BellOff size={14} /> Ignore Future Alerts
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
