import { useState, useEffect, useMemo } from 'react';
import { useBudgets } from './useBudgets';
import { useTransactions } from './useTransactions';
import { isSameMonth, parseISO } from 'date-fns';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import { useSettings } from '../contexts/SettingsContext';

export interface Alert {
  id: string;
  spent: number;
  limit: number;
  category: string;
  currency: string;
  period: 'monthly' | 'all_time';
  msg: string;
  isNew: boolean; // True if not dismissed at current level
}

export function useAlerts() {
  const { budgets, updateBudget } = useBudgets();
  const { transactions } = useTransactions();
  const { rates } = useExchangeRates();
  const { baseCurrency } = useSettings();
  
  // Persistent storage for dismissed alert amounts
  const [dismissedAmounts, setDismissedAmounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('financiero_dismissed_alerts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load dismissed alerts", e);
      return {};
    }
  });

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('financiero_dismissed_alerts', JSON.stringify(dismissedAmounts));
  }, [dismissedAmounts]);

  const activeAlerts = useMemo(() => {
    const now = new Date();
    
    return budgets.map(b => {
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

      // Calculate spent amount based on budget currency settings
      let spent = 0;
      if (b.currency === 'ALL') {
        // Normalize all transactions to USD(eq) using live rates
        spent = relevant.reduce((sum, t) => {
          const txCurrency = t.currency || 'USD';
          const normalizedAmountUsd = Number(t.amount) * (rates[txCurrency] || 1);
          return sum + (normalizedAmountUsd / (rates[baseCurrency] || 1));
        }, 0);
      } else {
        // Only count transactions that match the specific budget currency
        spent = relevant
          .filter(t => (t.currency || 'USD') === b.currency)
          .reduce((sum, t) => sum + Number(t.amount), 0);
      }
      
      // Check if the current spend breaks the limit barrier
      if (spent > b.amount) {
        const lastDismissedAmount = dismissedAmounts[b.id] || 0;
        
        return { 
          id: b.id, 
          spent,
          limit: b.amount,
          category: b.category,
          currency: b.currency,
          period: b.period,
          msg: `Budget Exceeded: You've spent ${spent.toLocaleString(undefined, {minimumFractionDigits: 2})} / ${b.amount} ${b.currency !== 'ALL' ? b.currency : `${baseCurrency} (eq)`} for ${b.category === 'ALL' ? 'Total Expenses' : b.category} this ${b.period === 'monthly' ? 'month' : 'timeframe'}.`,
          isNew: spent > lastDismissedAmount
        };
      }
      return null;
    }).filter(Boolean) as Alert[];
  }, [budgets, transactions, dismissedAmounts, rates]);

  const dismissAlert = (id: string, spent: number) => {
    setDismissedAmounts(prev => ({ ...prev, [id]: spent }));
  };

  const ignoreAlert = async (id: string) => {
    try {
      await updateBudget(id, { ignored: true });
    } catch (e) {
      console.error("Failed to ignore budget", e);
    }
  };

  return { activeAlerts, dismissAlert, ignoreAlert };
}
