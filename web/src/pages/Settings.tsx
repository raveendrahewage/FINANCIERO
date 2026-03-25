import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTransactions } from '../hooks/useTransactions';
import { Settings, Moon, Sun, Globe, Download, Trash2, User, Mail, Shield } from 'lucide-react';
import { CURRENCIES } from '../constants';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme, baseCurrency, setBaseCurrency } = useSettings();
  const { transactions } = useTransactions();

  const exportToCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Type'];
    const rows = transactions.map(t => [
      t.date,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.category,
      t.amount,
      t.currency || 'USD',
      t.type
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `financiero_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-md)' }}>
          <Settings size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Settings</h1>
          <p className="text-secondary">Manage your preferences and data</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Profile Section */}
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <User size={20} className="text-success" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Profile</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user?.displayName || 'User'}</p>
              <p className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <Mail size={14} /> {user?.email}
              </p>
              <p style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: 600, marginTop: '0.5rem', padding: '2px 8px', backgroundColor: 'var(--success-bg)', borderRadius: '12px' }}>
                <Shield size={12} /> Verified Account
              </p>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <Globe size={20} className="text-warning" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Preferences</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Appearance</p>
                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Toggle between light and dark mode</p>
              </div>
              <button 
                onClick={toggleTheme} 
                className="btn btn-outline" 
                style={{ minWidth: '140px', justifyContent: 'center' }}
              >
                {theme === 'light' ? <><Moon size={18} /> Deep Dark</> : <><Sun size={18} /> Vivid Light</>}
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Base Currency</p>
                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Used for global normalization on Dashboard</p>
              </div>
              <select 
                className="select" 
                style={{ width: 'auto', minWidth: '140px' }}
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <Download size={20} className="text-info" style={{ color: 'var(--primary-color)' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Data & Export</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Export Transactions</p>
                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Download your entire history as a CSV file</p>
              </div>
              <button 
                onClick={exportToCSV} 
                className="btn btn-primary"
                disabled={transactions.length === 0}
                style={{ minWidth: '140px' }}
              >
                <Download size={18} /> Export CSV
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: 500, marginBottom: '0.25rem', color: 'var(--danger-color)' }}>Reset Account</p>
                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Permanently delete all transaction and budget data</p>
              </div>
              <button 
                className="btn btn-outline" 
                style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', minWidth: '140px' }}
                onClick={() => alert('This would permanently delete your data. Functional reset coming soon.')}
              >
                <Trash2 size={18} /> Purge Data
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
