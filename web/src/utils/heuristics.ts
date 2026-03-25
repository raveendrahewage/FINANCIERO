import { format, parseISO, subMonths, isSameMonth, subDays, isAfter } from 'date-fns';
import type { Transaction } from '../types';
import type { FinancialInsights } from './ai';

export function getLocalInsights(transactions: Transaction[]): FinancialInsights {
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
    
  let spendingPattern = "Your spending habits look stable this month!";
  if (diningThisMonth > diningLastMonth && diningLastMonth > 0) {
    const pct = Math.round(((diningThisMonth - diningLastMonth) / diningLastMonth) * 100);
    spendingPattern = `You are spending ${pct}% more on dining this month ($${diningThisMonth.toFixed(2)}) compared to last month. [Local Heuristic]`;
  } else if (diningThisMonth > 300) {
    spendingPattern = `Your dining expenses are at $${diningThisMonth.toFixed(2)} this month. Cutting this by 20% could save you $${(diningThisMonth * 0.2).toFixed(2)}! [Local Heuristic]`;
  }

  // 2. Unusual Expenses (Large single expenses in last 30 days)
  const thirtyDaysAgo = subDays(now, 30);
  const recentExpenses = expenses.filter(t => isAfter(parseISO(t.date), thirtyDaysAgo));
  const avgRecent = recentExpenses.reduce((s, t) => s + Number(t.amount), 0) / (recentExpenses.length || 1);
  
  const unusual = recentExpenses
    .filter(t => Number(t.amount) > avgRecent * 3 && Number(t.amount) > 100)
    .filter(t => !t.category.toLowerCase().includes('housing') && !t.category.toLowerCase().includes('rent'))
    .map(t => ({
      id: t.id,
      category: t.category,
      amount: t.amount,
      date: t.date,
      note: t.note
    }));
    
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

  return { spendingPattern, unusualExpenses: unusual, savingsPlan };
}

export function getLocalChatResponse(query: string, transactions: Transaction[]): string {
  const q = query.toLowerCase();
  const now = new Date();
  const lastMonth = subMonths(now, 1);
  
  if (q.includes('most') && q.includes('last month')) {
    const lastMonthExpenses = transactions
      .filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), lastMonth))
      .sort((a, b) => Number(b.amount) - Number(a.amount));
    
    if (lastMonthExpenses.length > 0) {
      const top = lastMonthExpenses[0];
      return `Your largest expense last month was **$${Number(top.amount).toFixed(2)}** for **${top.category}** on ${format(parseISO(top.date), 'MMM do')}. [Local Logic]`;
    }
    return "I couldn't find any expenses for last month! [Local Logic]";
  } 
  
  if ((q.includes('total') || q.includes('how much')) && q.includes('income')) {
    const total = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    return `Your total recorded income is **$${total.toLocaleString(undefined, {minimumFractionDigits: 2})}**. [Local Logic]`;
  }

  return "I'm currently in local mode due to connection limits. Try asking about last month's largest expense or total income!";
}
