import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Navigate } from 'react-router-dom';
import { Wallet, Activity, ArrowRight, ShieldCheck, PieChart, Moon, Sun } from 'lucide-react';

export default function Login() {
  const { user, signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex w-full" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', transition: 'var(--transition)' }}>
      {/* Top Navigation for Landing */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1.5rem 3rem', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
        <button 
          onClick={toggleTheme} 
          className="btn btn-outline" 
          style={{ 
            borderRadius: '50%', 
            padding: '0.75rem',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)',
            color: 'var(--text-primary)'
          }}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Left side info panel */}
      <div className="flex" style={{ 
        flex: 1, 
        flexDirection: 'column', 
        padding: '5rem 4rem', 
        justifyContent: 'center',
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 100%)' 
          : 'linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(226,232,240,0.6) 100%)',
        borderRight: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{ 
          position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', 
          background: 'var(--primary-color)', opacity: 0.05, borderRadius: '50%', filter: 'blur(60px)' 
        }} />
        <div style={{ 
          position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', 
          background: 'var(--success-color)', opacity: 0.05, borderRadius: '50%', filter: 'blur(60px)' 
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              padding: '1rem', 
              background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', 
              borderRadius: 'var(--radius-lg)', 
              color: 'white',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
            }}>
              <Wallet size={36} />
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, background: 'linear-gradient(to right, var(--text-primary), var(--primary-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Financiero
            </h1>
          </div>
          
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--text-primary)' }}>
            Elevate Your <br/><span style={{ color: 'var(--primary-color)' }}>Financial Intelligence</span>
          </h2>
          <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '3.5rem', maxWidth: '450px', lineHeight: 1.6 }}>
            Understand your spending habits, track all expenses in real-time, and make smarter decisions with our enterprise-grade personal dashboard.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div className="flex items-center gap-4 group">
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>
                <Activity size={24} />
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)' }}>Precision tracking & analytics</span>
            </div>
            <div className="flex items-center gap-4 group">
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
                <PieChart size={24} />
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)' }}>Visual insights & cashflow trends</span>
            </div>
            <div className="flex items-center gap-4 group">
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
                <ShieldCheck size={24} />
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)' }}>Bank-grade secure infrastructure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side login panel */}
      <div className="flex items-center" style={{ flex: 1, justifyContent: 'center', padding: '2rem', backgroundColor: 'var(--bg-color)' }}>
        <div className="card text-center" style={{ 
          width: '100%', maxWidth: '440px', padding: '3rem 2rem',
          boxShadow: theme === 'dark' ? '0 25px 50px -12px rgba(0,0,0,0.8)' : '0 25px 50px -12px rgba(0,0,0,0.1)',
          border: '1px solid var(--border-color)',
          backdropFilter: 'blur(10px)',
          backgroundColor: theme === 'dark' ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Wallet size={48} color="var(--primary-color)" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Welcome to Financiero</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1rem' }}>Securely authenticate to access your portfolio</p>
          
          <button 
            onClick={signInWithGoogle}
            className="btn w-full"
            style={{ 
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.875rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '1.05rem',
              fontWeight: 600,
              boxShadow: 'var(--card-shadow)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--card-shadow)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
            <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
          </button>
          
          <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            By continuing, you establish a secure session powered by Google Auth via Firebase Architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
