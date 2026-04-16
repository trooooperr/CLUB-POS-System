import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'error': return { bg: 'rgba(239, 68, 68, 0.95)', icon: <AlertCircle size={18}/>, label: 'Error' };
      case 'amber': return { bg: 'rgba(245, 158, 11, 0.95)', icon: <Info size={18}/>, label: 'Caution' };
      default: return { bg: 'rgba(16, 185, 129, 0.95)', icon: <CheckCircle size={18}/>, label: 'Success' };
    }
  };

  const s = getStyle();

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        borderRadius: 16,
        background: s.bg,
        color: '#fff',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        animation: 'toast-in 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        minWidth: 280,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 10 }}>
        {s.icon}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8, marginBottom: 2 }}>{s.label}</div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{toast.msg}</div>
      </div>

      <style>{`
        @keyframes toast-in {
          from { transform: translate(-50%, 40px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
