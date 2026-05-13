'use client';

import { useState } from 'react';
import { Save, Building2, Bell, DollarSign, Check } from 'lucide-react';
import { useCurrency, MainCurrency } from '@/lib/currency-context';

const inputCls = 'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors';
const labelCls = 'text-text-muted text-xs mb-1 block';

export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    agency_name: 'Festoweb',
    owner_name: 'Abdulrhman',
    email: 'contact@festoweb.com',
    phone: '+966-5XX-XXXXX',
    notifications_email: true,
    notifications_followup: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const currencies: { value: MainCurrency; label: string; flag: string; desc: string }[] = [
    { value: 'SAR', label: 'Saudi Riyal', flag: '🇸🇦', desc: 'Used in KSA — ر.س' },
    { value: 'MAD', label: 'Moroccan Dirham', flag: '🇲🇦', desc: 'Used in Morocco — د.م.' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted text-sm mt-1">Manage your agency profile and preferences</p>
      </div>

      {/* Agency Info */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={15} className="text-primary" />
          <h2 className="text-text-primary font-semibold text-sm">Agency Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {([
            { key: 'agency_name', label: 'Agency Name' },
            { key: 'owner_name', label: 'Owner Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
          ] as const).map(field => (
            <div key={field.key}>
              <label className={labelCls}>{field.label}</label>
              <input
                value={form[field.key]}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign size={15} className="text-primary" />
          <h2 className="text-text-primary font-semibold text-sm">Display Currency</h2>
        </div>
        <p className="text-text-faint text-xs mb-5">
          All amounts across the CRM — Dashboard, Finance, Pipeline, Subscriptions — will be shown in this currency.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {currencies.map(c => {
            const active = currency === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setCurrency(c.value)}
                className={`relative flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                  active
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-surface2 hover:border-primary/40'
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </span>
                )}
                <span className="text-2xl">{c.flag}</span>
                <span className="font-semibold text-text-primary text-sm">{c.value}</span>
                <span className="text-text-primary text-sm">{c.label}</span>
                <span className="text-text-faint text-xs">{c.desc}</span>
              </button>
            );
          })}
        </div>
        <p className="text-text-faint text-xs mt-3">
          💡 Exchange rate is fetched live · Changes apply instantly across all pages
        </p>
      </div>

      {/* Notifications */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={15} className="text-primary" />
          <h2 className="text-text-primary font-semibold text-sm">Notifications</h2>
        </div>
        <div className="space-y-4">
          {([
            { key: 'notifications_email' as const, label: 'Email notifications', desc: 'Receive updates via email' },
            { key: 'notifications_followup' as const, label: 'Follow-up reminders', desc: 'Get notified for upcoming follow-ups' },
          ]).map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-text-primary text-sm">{item.label}</p>
                <p className="text-text-faint text-xs">{item.desc}</p>
              </div>
              <button
                onClick={() => setForm(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  form[item.key] ? 'bg-primary' : 'bg-surface2 border border-border'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  form[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          saved ? 'bg-accent text-white' : 'bg-primary hover:bg-primary-hover text-white'
        }`}
      >
        <Save size={15} />{saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
