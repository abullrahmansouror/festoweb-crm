'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type MainCurrency = 'SAR' | 'MAD';

interface CurrencyContextValue {
  currency: MainCurrency;
  setCurrency: (c: MainCurrency) => void;
  symbol: string;
  /** Format a number with the active currency symbol */
  fmt: (n: number, decimals?: number) => string;
  /** Convert an amount from any currency to the active main currency */
  convert: (amount: number, fromCurrency: string) => number;
  /** Live exchange rates (1 unit = X SAR) */
  rates: Record<string, number>;
  ratesReady: boolean;
}

const FALLBACK_RATES_TO_SAR: Record<string, number> = {
  SAR: 1,
  MAD: 0.37,
  USD: 3.75,
  EUR: 4.10,
  GBP: 4.75,
  AED: 1.02,
};

const SAR_TO_MAD = 1 / FALLBACK_RATES_TO_SAR['MAD']; // ~2.7

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'SAR',
  setCurrency: () => {},
  symbol: 'SAR',
  fmt: (n) => `SAR ${n.toLocaleString()}`,
  convert: (n) => n,
  rates: FALLBACK_RATES_TO_SAR,
  ratesReady: false,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<MainCurrency>('SAR');
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES_TO_SAR);
  const [ratesReady, setRatesReady] = useState(false);

  // Load saved preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crm_currency') as MainCurrency | null;
      if (saved === 'SAR' || saved === 'MAD') setCurrencyState(saved);
    } catch {}
  }, []);

  // Fetch live rates
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/SAR')
      .then(r => r.json())
      .then(data => {
        if (data.result === 'success') {
          const toSar: Record<string, number> = { SAR: 1 };
          for (const [cur, rate] of Object.entries(data.rates as Record<string, number>)) {
            toSar[cur] = 1 / rate; // 1 cur = X SAR
          }
          setRates(toSar);
        }
      })
      .catch(() => {})
      .finally(() => setRatesReady(true));
  }, []);

  const setCurrency = useCallback((c: MainCurrency) => {
    setCurrencyState(c);
    try { localStorage.setItem('crm_currency', c); } catch {}
  }, []);

  const symbol = currency;

  /**
   * Convert any amount from `fromCurrency` to the active main currency.
   * All rates are stored as "1 fromCurrency = X SAR", then we convert SAR→MAD if needed.
   */
  const convert = useCallback((amount: number, fromCurrency: string): number => {
    const toSarRate = rates[fromCurrency] ?? FALLBACK_RATES_TO_SAR[fromCurrency] ?? 1;
    const inSar = amount * toSarRate;
    if (currency === 'SAR') return inSar;
    // SAR → MAD
    const sarToMad = rates['MAD'] ? 1 / rates['MAD'] : SAR_TO_MAD;
    return inSar * sarToMad;
  }, [currency, rates]);

  const fmt = useCallback((n: number, decimals = 0): string => {
    return `${symbol} ${n.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals > 0 ? decimals : 2 })}`;
  }, [symbol]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol, fmt, convert, rates, ratesReady }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
