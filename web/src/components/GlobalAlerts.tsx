import { useAlerts } from '../hooks/useAlerts';
import { AlertCircle, X, BellOff } from 'lucide-react';

export default function GlobalAlerts() {
  const { activeAlerts, dismissAlert, ignoreAlert } = useAlerts();
  
  // Only show as toasts if they are "new" (not dismissed at current spent level)
  const visibleToasts = activeAlerts.filter(a => a.isNew);

  if (visibleToasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {visibleToasts.map(a => (
        <div key={a.id} style={{ 
          display: 'flex', flexDirection: 'column', gap: '0.75rem', 
          backgroundColor: 'var(--danger-color)', color: 'white', 
          padding: '1.25rem', borderRadius: 'var(--radius-lg)', 
          boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.4), 0 10px 10px -5px rgba(239, 68, 68, 0.2)', 
          maxWidth: '380px', border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <AlertCircle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.5 }}>
              {a.msg}
            </div>
            {/* Click 'X' to temporarily dismiss (persists in localStorage) */}
            <button onClick={() => dismissAlert(a.id, a.spent)} style={{ 
              color: 'inherit', opacity: 0.7, background: 'transparent', 
              border: 'none', cursor: 'pointer', padding: '0.25rem', marginTop: '-0.25rem', marginRight: '-0.5rem' 
            }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => ignoreAlert(a.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem',
                backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', 
                padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontWeight: 600, transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)')}
            >
              <BellOff size={14} /> Ignore Future Alerts
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
