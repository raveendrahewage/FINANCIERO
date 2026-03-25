import React, { createContext, useContext, useState, useEffect } from 'react';
import { EXCHANGE_RATES as FALLBACK_RATES } from '../constants';

interface ExchangeRateContextType {
  rates: Record<string, number>;
  loading: boolean;
  lastUpdated: string | null;
}

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);

export const ExchangeRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('financiero_exchange_rates');
    if (saved) {
      try {
        const { rates: savedRates } = JSON.parse(saved);
        return savedRates;
      } catch (e) {
        return FALLBACK_RATES;
      }
    }
    return FALLBACK_RATES;
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // ExchangeRate-API (Free tier, no key required for public endpoint)
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        
        if (data && data.rates) {
          // ExchangeRate-API returns rates Relative to USD (e.g. 1 USD = 0.92 EUR)
          // To match our logic (1 unit of currency = X USD), we invert: 1 / 0.92
          const invertedRates: Record<string, number> = { USD: 1 };
          Object.keys(data.rates).forEach(currency => {
            invertedRates[currency] = 1 / data.rates[currency];
          });
          
          const finalRates = { ...FALLBACK_RATES, ...invertedRates };
          setRates(finalRates);
          const updateDate = data.time_last_update_utc || new Date().toISOString();
          setLastUpdated(updateDate);
          localStorage.setItem('financiero_exchange_rates', JSON.stringify({
            rates: finalRates,
            date: updateDate,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates, using fallback", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  return (
    <ExchangeRateContext.Provider value={{ rates, loading, lastUpdated }}>
      {children}
    </ExchangeRateContext.Provider>
  );
};

export const useExchangeRates = () => {
  const context = useContext(ExchangeRateContext);
  if (context === undefined) {
    throw new Error('useExchangeRates must be used within an ExchangeRateProvider');
  }
  return context;
};
