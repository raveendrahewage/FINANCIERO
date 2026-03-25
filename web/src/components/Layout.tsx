import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LayoutDashboard, Receipt, LogOut, Moon, Sun, Menu, X, ChevronLeft, ChevronRight, Sparkles, BellRing } from 'lucide-react';
import GlobalAlerts from './GlobalAlerts';

export default function Layout() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/insights', icon: Sparkles, label: 'AI Insights' },
    { path: '/budgets', icon: BellRing, label: 'Alerts' },
  ];

  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', position: 'relative' }}>
      
      {/* Mobile Topbar */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '60px', backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 1rem', zIndex: 40, justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Financiero" style={{ width: '28px', height: '28px' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Financiero</span>
          </div>
          <button onClick={toggleSidebar} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 45, backdropFilter: 'blur(2px)' }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{ 
        width: isMobile ? '260px' : (isSidebarOpen ? '260px' : '88px'),
        borderRight: '1px solid var(--border-color)', 
        backgroundColor: 'var(--bg-panel)', 
        display: 'flex', 
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0, left: 0, bottom: 0, height: '100vh',
        zIndex: 50,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        whiteSpace: 'nowrap',
        boxShadow: isMobile && isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.1)' : 'none',
        transform: isMobile && !isSidebarOpen ? 'translateX(-100%)' : 'translateX(0)'
      }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div className="flex items-center" style={{ gap: '1rem' }}>
            <img src="/logo.svg" alt="Financiero" style={{ width: '32px', height: '32px', minWidth: '32px' }} />
            {isSidebarOpen && <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Financiero</span>}
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none', minWidth: '36px' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                title={!isSidebarOpen && !isMobile ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', 
                  padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  borderRadius: 'var(--radius-md)', 
                  backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'var(--transition)'
                }}
              >
                <item.icon size={20} style={{ minWidth: '20px' }} />
                {isSidebarOpen && item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4" style={{ flexDirection: isSidebarOpen ? 'row' : 'column', gap: '1rem' }}>
            {isSidebarOpen && <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Theme</span>}
            <button onClick={toggleTheme} className="btn btn-outline" style={{ padding: '0.5rem', width: isSidebarOpen ? 'auto' : '100%', display: 'flex', justifyContent: 'center' }}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
          
          <div className="flex items-center gap-2 mb-4" style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
            )}
            {isSidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.displayName || 'User'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</p>
              </div>
            )}
          </div>

          <button onClick={signOut} className="btn btn-outline w-full text-danger" style={{ justifyContent: 'center', padding: isSidebarOpen ? '0.5rem 1rem' : '0.5rem' }}>
            <LogOut size={18} style={{ minWidth: '18px' }} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Desktop Sidebar Toggle Button (overlapping right border) */}
        {!isMobile && (
          <button 
            onClick={toggleSidebar} 
            style={{ 
              position: 'absolute', top: '1.5rem', right: '-14px', 
              width: '28px', height: '28px', borderRadius: '50%', 
              backgroundColor: 'var(--bg-panel)', color: 'var(--text-secondary)', 
              border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 100, transition: 'var(--transition)',
              boxShadow: 'var(--card-shadow)', padding: 0
            }}
          >
            {isSidebarOpen ? <ChevronLeft size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
          </button>
        )}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '5rem 1rem 2rem 1rem' : '2rem', overflowY: 'auto', width: '100%', maxWidth: '100vw' }}>
        <GlobalAlerts />
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
