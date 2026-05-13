'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type MainCurrency = 'SAR' | 'MAD';

interface CurrencyContextValue {
  currency: MainCurrency;
  setCurrency: (c: MainCurrency) => void;
  symbol: string;
  fmt: (n: number, decimals?: number) => string;
  convert: (amount: number, fromCurrency: string) => number;
  rates: Record<string, number>;
  ratesReady: boolean;
  ratesError: boolean;
  refreshRates: () => void;
}

const FALLBACK: Record<string, number> = {
  SAR: 1, MAD: 0.37, USD: 3.75, EUR: 4.10, GBP: 4.75, AED: 1.02,
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'SAR', setCurrency: () => {}, symbol: 'SAR',
  fmt: (n) => `SAR ${n}`, convert: (n) => n,
  rates: FALLBACK, ratesReady: false, ratesError: false, refreshRates: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<MainCurrency>('SAR');
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK);
  const [ratesReady, setRatesReady] = useState(false);
  const [ratesError, setRatesError] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crm_currency') as MainCurrency | null;
      if (saved === 'SAR' || saved === 'MAD') setCurrencyState(saved);
    } catch {}
  }, []);

  const fetchRates = useCallback(async () => {
    setRatesError(false);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/SAR');
      const data = await res.json();
      if (data.result === 'success') {
        const toSar: Record<string, number> = { SAR: 1 };
        for (const [cur, rate] of Object.entries(data.rates as Record<string, number>)) {
          toSar[cur] = 1 / rate;
        }
        setRates(toSar);
      } else throw new Error('bad result');
    } catch {
      setRatesError(true);
      setRates(FALLBACK);
    } finally {
      setRatesReady(true);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const setCurrency = useCallback((c: MainCurrency) => {
    setCurrencyState(c);
    try { localStorage.setItem('crm_currency', c); } catch {}
  }, []);

  // Convert any amount from `fromCurrency` => active main currency
  const convert = useCallback((amount: number, fromCurrency: string = 'SAR'): number => {
    if (!amount || isNaN(amount)) return 0;
    const cur = (fromCurrency || 'SAR').toUpperCase();
    const toSarRate = rates[cur] ?? FALLBACK[cur] ?? 1;
    const inSar = amount * toSarRate;
    if (currency === 'SAR') return inSar;
    // SAR -> MAD
    const sarToMad = rates['MAD'] ? 1 / rates['MAD'] : 1 / FALLBACK['MAD'];
    return inSar * sarToMad;
  }, [currency, rates]);

  const fmt = useCallback((n: number, decimals = 0): string => {
    const safe = isNaN(n) || !isFinite(n) ? 0 : n;
    return `${currency} ${safe.toLocaleString('en', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals > 0 ? decimals : 2,
    })}`;
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{
      currency, setCurrency, symbol: currency,
      fmt, convert, rates, ratesReady, ratesError,
      refreshRates: fetchRates,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
