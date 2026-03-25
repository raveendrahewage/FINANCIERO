import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface SettingsContextType {
  theme: Theme;
  baseCurrency: string;
  dashboardLayout: string[];
  toggleTheme: () => void;
  setBaseCurrency: (currency: string) => void;
  setDashboardLayout: (layout: string[]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [baseCurrency, setBaseCurrencyState] = useState(() => {
    return localStorage.getItem('fin_base_currency') || 'USD';
  });

  const [dashboardLayout, setDashboardLayoutState] = useState<string[]>(() => {
    const saved = localStorage.getItem('fin_dashboard_layout');
    return saved ? JSON.parse(saved) : ['pace', 'budgets', 'daily', 'networth', 'category', 'monthly'];
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    // Also add class for utility-based dark mode if needed
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fin_base_currency', baseCurrency);
  }, [baseCurrency]);

  useEffect(() => {
    localStorage.setItem('fin_dashboard_layout', JSON.stringify(dashboardLayout));
  }, [dashboardLayout]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setBaseCurrency = (c: string) => setBaseCurrencyState(c);
  
  const setDashboardLayout = (l: string[]) => setDashboardLayoutState(l);

  return (
    <SettingsContext.Provider value={{ 
      theme, baseCurrency, dashboardLayout, 
      toggleTheme, setBaseCurrency, setDashboardLayout 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// For backwards compatibility during transition
export const useTheme = useSettings;
