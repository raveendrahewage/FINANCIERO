export const CURRENCIES = ['USD', 'EUR', 'GBP', 'LKR', 'INR', 'JPY', 'AUD', 'CAD'];

export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.25,
  LKR: 0.0033,
  INR: 0.012,
  JPY: 0.0067,
  AUD: 0.65,
  CAD: 0.74,
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Healthcare'
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts'
];

export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

// Generate a deterministic color based on category name
export const getCategoryColor = (name: string): string => {
  // Use a hash of the string to pick a hue
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Mix with a base hue to keep things in a pleasing range, but allow 360 degrees
  const hue = Math.abs(hash % 360);
  
  // Return HSL for better visual consistency across random colors
  // We use slightly higher saturation for a 'vivid' premium feel
  return `hsl(${hue}, 70%, 55%)`;
};
