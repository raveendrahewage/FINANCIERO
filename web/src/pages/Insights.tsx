import { useState, useRef, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Sparkles, AlertTriangle, TrendingUp, PiggyBank, Send, Bot, User, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getFinancialInsights, chatWithAI } from '../utils/ai';
import type { FinancialInsights, ChatMessage } from '../utils/ai';
import { useSettings } from '../contexts/SettingsContext';

export default function Insights() {
  const { transactions, loading } = useTransactions();
  const { baseCurrency } = useSettings();
  
  // Chat state
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: 'ai', text: 'Hi! I’m your personal financial guide. Ask me anything about your spending, and I’ll help you make sense of it!' }
  ]);
  const [isAsking, setIsAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<FinancialInsights | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  // Fetch AI Insights when transactions change
  useEffect(() => {
    if (transactions.length > 0 && !loading) {
      const fetchInsights = async () => {
        setIsAnalyzing(true);
        const insights = await getFinancialInsights(transactions, baseCurrency);
        if (insights) {
          setAiInsights(insights);
          setIsFallback(false);
        } else {
          // Internal Simple Fallback
          const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
          const topCategory = transactions.filter(t => t.type === 'expense').length > 0 
            ? transactions.filter(t => t.type === 'expense').reduce((a, b) => (a.amount > b.amount ? a : b)).category
            : "General";
            
          setAiInsights({
            spendingPattern: `So far, you’ve spent ${totalExpense.toLocaleString()} ${baseCurrency}. Your biggest spending category is ${topCategory}.`,
            unusualExpenses: [],
            savingsPlan: null
          });
          setIsFallback(true);
        }
        setIsAnalyzing(false);
      };
      fetchInsights();
    }
  }, [transactions, loading]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isAsking) return;

    const userQuery = query.trim();
    const newChat: ChatMessage[] = [...chat, { role: 'user', text: userQuery }];
    setQuery('');
    setChat(newChat);
    setIsAsking(true);

    const aiResponse = await chatWithAI(userQuery, transactions, chat, (text) => {
      setChat(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'ai' && prev.length > newChat.length) {
          return [...prev.slice(0, -1), { role: 'ai', text }];
        } else {
          return [...prev, { role: 'ai', text }];
        }
      });
    }, baseCurrency);
    
    if (!aiResponse) {
      const topExpense = transactions.filter(t => t.type === 'expense').sort((a,b) => Number(b.amount) - Number(a.amount))[0];
      const localResponse = topExpense 
        ? `I'm in offline mode right now, but I can see your largest expense was ${Number(topExpense.amount).toLocaleString()} ${topExpense.currency || baseCurrency} for ${topExpense.category}.`
        : "I am in local mode and couldn't find enough data to give you a specific answer. [Local Fallback]";
      setChat(prev => [...prev, { role: 'ai', text: localResponse }]);
      setIsFallback(true);
    }
    setIsAsking(false);
  };

  if (loading) return <div className="text-secondary text-center">Crunching numbers...</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="flex items-center mb-4" style={{ marginBottom: '2rem', gap: '1.25rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-md)' }}>
          <Sparkles size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {isFallback ? 'Quick Overview' : 'AI Financial Guide'}
          </h1>
          <p className="text-secondary">
            {isFallback 
              ? 'Showing a quick overview of your data while we reconnect.' 
              : 'Smart tips based on your recent spending habits.'}
          </p>
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
            {isAnalyzing ? (
              <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Analyzing habits...</span>
            ) : (
              aiInsights?.spendingPattern || "Your dining and food expenses are looking stable this month. Great job sticking to the plan!"
            )}
          </p>
        </div>

        {/* Unusual Expenses Card */}
        <div className="card" style={{ borderTop: '4px solid var(--danger-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-danger" size={24} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Unusual Spikes</h3>
          </div>
          {isAnalyzing ? (
            <p className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Loader2 size={16} className="animate-spin" /> Scanning for anomalies...
            </p>
          ) : aiInsights?.unusualExpenses && aiInsights.unusualExpenses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>I noticed {aiInsights.unusualExpenses.length} unusually high expense(s) recently:</p>
              {aiInsights.unusualExpenses.slice(0, 3).map((t, idx) => (
                <div key={idx} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between font-medium">
                    <span>{t.category}</span>
                    <span className="text-danger">-{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
          {isAnalyzing ? (
            <p className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Loader2 size={16} className="animate-spin" /> Calculating budget split...
            </p>
          ) : aiInsights?.savingsPlan ? (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Based on recent income ({aiInsights.savingsPlan.total.toLocaleString()} {baseCurrency}), aim for this 50/30/20 split:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="flex justify-between" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                  <span>Needs (50%)</span> <span className="font-medium text-primary">{aiInsights.savingsPlan.needs.toLocaleString()} {baseCurrency}</span>
                </div>
                <div className="flex justify-between" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                  <span>Wants (30%)</span> <span className="font-medium text-warning">{aiInsights.savingsPlan.wants.toLocaleString()} {baseCurrency}</span>
                </div>
                <div className="flex justify-between" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                  <span>Savings (20%)</span> <span className="font-medium text-success">{aiInsights.savingsPlan.savings.toLocaleString()} {baseCurrency}</span>
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Ask your Financial Guide</h2>
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
          {isAsking && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ 
                minWidth: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'var(--primary-hover)', color: 'white'
              }}>
                <Bot size={20} />
              </div>
              <div style={{ 
                padding: '1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)',
                borderTopLeftRadius: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
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
            disabled={isAsking}
          />
          <button type="submit" className="btn btn-primary" disabled={!query.trim() || isAsking} style={{ padding: '0 1.5rem' }}>
            {isAsking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>

    </div>
  );
}
