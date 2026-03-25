import { useState, useMemo, useRef, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Sparkles, AlertTriangle, TrendingUp, PiggyBank, Send, Bot, User } from 'lucide-react';
import { format, parseISO, subMonths, isSameMonth, subDays, isAfter } from 'date-fns';

export default function Insights() {
  const { transactions, loading } = useTransactions();
  
  // Chat state
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: 'Hello! I am your visual financial assistant. Ask me questions like "Where did I spend the most last month?" or "How much did I make this month?"' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  // --- HEURISTICS ENGINE ---
  const { diningAlert, unusualExpenses, savingsPlan } = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const incomes = transactions.filter(t => t.type === 'income');
    const now = new Date();
    const lastMonthDate = subMonths(now, 1);

    // 1. Dining comparison
    const diningThisMonth = expenses
      .filter(t => t.category.toLowerCase().includes('food') || t.category.toLowerCase().includes('dining'))
      .filter(t => isSameMonth(parseISO(t.date), now))
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const diningLastMonth = expenses
      .filter(t => t.category.toLowerCase().includes('food') || t.category.toLowerCase().includes('dining'))
      .filter(t => isSameMonth(parseISO(t.date), lastMonthDate))
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    let diningAlert = null;
    if (diningThisMonth > diningLastMonth && diningLastMonth > 0) {
      const pct = Math.round(((diningThisMonth - diningLastMonth) / diningLastMonth) * 100);
      diningAlert = `You are spending ${pct}% more on dining this month ($${diningThisMonth.toFixed(2)}) compared to last month. Consider cooking at home to stay on budget!`;
    } else if (diningThisMonth > 300) {
      diningAlert = `Your dining expenses are at $${diningThisMonth.toFixed(2)} this month. Cutting this by 20% could save you $${(diningThisMonth * 0.2).toFixed(2)}!`;
    }

    // 2. Unusual Expenses (Large single expenses in last 30 days)
    const thirtyDaysAgo = subDays(now, 30);
    const recentExpenses = expenses.filter(t => isAfter(parseISO(t.date), thirtyDaysAgo));
    const avgRecent = recentExpenses.reduce((s, t) => s + Number(t.amount), 0) / (recentExpenses.length || 1);
    
    const unusual = recentExpenses
      .filter(t => Number(t.amount) > avgRecent * 3 && Number(t.amount) > 100)
      .filter(t => !t.category.toLowerCase().includes('housing') && !t.category.toLowerCase().includes('rent'));
      
    // 3. Savings Plan (50/30/20 rule based on recent 30-day income)
    const recentIncome = incomes
      .filter(t => isAfter(parseISO(t.date), thirtyDaysAgo))
      .reduce((s, t) => s + Number(t.amount), 0);
      
    let savingsPlan = null;
    if (recentIncome > 0) {
      savingsPlan = {
        needs: recentIncome * 0.5,
        wants: recentIncome * 0.3,
        savings: recentIncome * 0.2,
        total: recentIncome
      };
    }

    return { diningAlert, unusualExpenses: unusual, savingsPlan };
  }, [transactions]);

  // --- NLP CHAT PARSER ---
  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const q = query.toLowerCase();
    const newChat = [...chat, { role: 'user' as const, text: query }];
    setQuery('');
    setChat(newChat);

    setTimeout(() => {
      let aiResponse = "I'm a lightweight local assistant right now! Try asking 'Where did I spend the most last month?' or 'What is my total income?'";
      
      const now = new Date();
      const lastMonth = subMonths(now, 1);
      
      if (q.includes('most') && q.includes('last month')) {
        const lastMonthExpenses = transactions
          .filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), lastMonth))
          .sort((a, b) => Number(b.amount) - Number(a.amount));
        
        if (lastMonthExpenses.length > 0) {
          const top = lastMonthExpenses[0];
          aiResponse = `Your largest expense last month was **$${Number(top.amount).toFixed(2)}** for **${top.category}** on ${format(parseISO(top.date), 'MMM do')}. ${top.note ? `(${top.note})` : ''}`;
        } else {
          aiResponse = "I couldn't find any expenses for last month!";
        }
      } 
      else if ((q.includes('total') || q.includes('how much')) && q.includes('income')) {
        const total = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        aiResponse = `Your total recorded income across all time is $${total.toLocaleString(undefined, {minimumFractionDigits: 2})}.`;
      }
      else if (q.includes('save') || q.includes('budget')) {
        if (savingsPlan) {
          aiResponse = `Based on your recent monthly income of $${savingsPlan.total.toFixed(2)}, I recommend the 50/30/20 rule: \n- **$${savingsPlan.needs.toFixed(2)}** for Needs (50%)\n- **$${savingsPlan.wants.toFixed(2)}** for Wants (30%)\n- **$${savingsPlan.savings.toFixed(2)}** to Savings/Investing (20%).`;
        } else {
          aiResponse = "I need more income data to generate a budget plan. Try adding your salary!";
        }
      }

      setChat(prev => [...prev, { role: 'ai', text: aiResponse }]);
    }, 600);
  };

  if (loading) return <div className="text-secondary text-center">Crunching numbers...</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="flex items-center mb-4" style={{ marginBottom: '2rem', gap: '1.25rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-md)' }}>
          <Sparkles size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>AI Insights</h1>
          <p className="text-secondary">Smart analysis based on your financial footprint.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Dining Alert Card */}
        <div className="card" style={{ borderTop: '4px solid var(--warning-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-warning" size={24} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Spending Pattern</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {diningAlert || "Your dining and food expenses are looking stable this month. Great job sticking to the plan!"}
          </p>
        </div>

        {/* Unusual Expenses Card */}
        <div className="card" style={{ borderTop: '4px solid var(--danger-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-danger" size={24} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Anomaly Detection</h3>
          </div>
          {unusualExpenses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Detected {unusualExpenses.length} unusually high expense(s) recently:</p>
              {unusualExpenses.slice(0, 3).map(t => (
                <div key={t.id} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between font-medium">
                    <span>{t.category}</span>
                    <span className="text-danger">-${Number(t.amount).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {format(parseISO(t.date), 'MMM do')} {t.note && `- ${t.note}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              No unusual massive spikes detected in your recent spending. Your cashflow looks predictable!
            </p>
          )}
        </div>

        {/* Budget Plan Card */}
        <div className="card" style={{ borderTop: '4px solid var(--success-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <PiggyBank className="text-success" size={24} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Smart Budgeting</h3>
          </div>
          {savingsPlan ? (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Based on recent income (${savingsPlan.total.toFixed(0)}), aim for this 50/30/20 split:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="flex justify-between" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                  <span>Needs (50%)</span> <span className="font-medium text-primary">${savingsPlan.needs.toFixed(0)}</span>
                </div>
                <div className="flex justify-between" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                  <span>Wants (30%)</span> <span className="font-medium text-warning">${savingsPlan.wants.toFixed(0)}</span>
                </div>
                <div className="flex justify-between" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                  <span>Savings (20%)</span> <span className="font-medium text-success">${savingsPlan.savings.toFixed(0)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Log more income transactions to generate a personalized 50/30/20 budget framework automatically.
            </p>
          )}
        </div>
      </div>

      {/* NLP Chat Interface */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Ask your Financial AI</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '400px' }}>
        
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {chat.map((msg, i) => (
            <div key={i} style={{ 
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{ 
                minWidth: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: msg.role === 'user' ? 'var(--bg-panel)' : 'var(--primary-hover)',
                color: msg.role === 'user' ? 'var(--text-primary)' : 'white',
                border: msg.role === 'user' ? '1px solid var(--border-color)' : 'none'
              }}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div style={{ 
                padding: '1rem', borderRadius: 'var(--radius-lg)', maxWidth: '80%', whiteSpace: 'pre-line',
                backgroundColor: msg.role === 'user' ? 'var(--primary-color)' : 'var(--bg-color)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                borderTopRightRadius: msg.role === 'user' ? 0 : 'var(--radius-lg)',
                borderTopLeftRadius: msg.role === 'ai' ? 0 : 'var(--radius-lg)'
              }}>
                {msg.text.split('**').map((part, index) => index % 2 === 1 ? <strong key={index}>{part}</strong> : part)}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleAsk} style={{ borderTop: '1px solid var(--border-color)', padding: '1rem', backgroundColor: 'var(--bg-color)', display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="input" 
            style={{ flex: 1, border: '1px solid var(--border-color)' }}
            placeholder="Ask about your spending..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!query.trim()} style={{ padding: '0 1.5rem' }}>
            <Send size={18} />
          </button>
        </form>
      </div>

    </div>
  );
}
