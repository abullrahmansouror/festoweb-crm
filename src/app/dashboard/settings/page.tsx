'use client';

import { useState } from 'react';
import { Save, Building2, Bell, Palette, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    agency_name: 'Festoweb',
    owner_name: 'Abdulrhman',
    email: 'contact@festoweb.com',
    phone: '+966-5XX-XXXXX',
    currency: 'SAR',
    notifications_email: true,
    notifications_followup: true,
    dark_mode: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

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
          {[
            { key: 'agency_name', label: 'Agency Name' },
            { key: 'owner_name', label: 'Owner Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-text-muted text-xs mb-1 block">{field.label}</label>
              <input
                value={(form as any)[field.key]}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="text-text-muted text-xs mb-1 block">Default Currency</label>
          <select value={form.currency} onChange={e => setForm(prev => ({...prev, currency: e.target.value}))} className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
            <option value="SAR">SAR - Saudi Riyal</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={15} className="text-primary" />
          <h2 className="text-text-primary font-semibold text-sm">Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'notifications_email', label: 'Email notifications', desc: 'Receive updates via email' },
            { key: 'notifications_followup', label: 'Follow-up reminders', desc: 'Get notified for upcoming follow-ups' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-text-primary text-sm">{item.label}</p>
                <p className="text-text-faint text-xs">{item.desc}</p>
              </div>
              <button
                onClick={() => setForm(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${ (form as any)[item.key] ? 'bg-primary' : 'bg-surface2 border border-border' }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${ (form as any)[item.key] ? 'translate-x-5' : 'translate-x-0.5' }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${ saved ? 'bg-accent text-white' : 'bg-primary hover:bg-primary-hover text-white' }`}
      >
        <Save size={15} />{saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
