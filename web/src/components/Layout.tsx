import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LayoutDashboard, Receipt, LogOut, Moon, Sun, Wallet } from 'lucide-react';

export default function Layout() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
  ];

  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-panel)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center gap-2 mb-4" style={{ marginBottom: '3rem' }}>
          <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <Wallet size={24} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Financiero</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)', 
                  backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'var(--transition)'
                }}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Theme</span>
            <button onClick={toggleTheme} className="btn btn-outline" style={{ padding: '0.5rem' }}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
            )}
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.displayName || 'User'}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</p>
            </div>
          </div>

          <button onClick={signOut} className="btn btn-outline w-full text-danger" style={{ justifyContent: 'center' }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
