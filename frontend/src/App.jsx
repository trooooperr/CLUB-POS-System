import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import InvoiceModal from './components/InvoiceModal';
import LoginPage from './pages/LoginPage';
import BillingPage from './pages/BillingPage';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import SalesPage from './pages/SalesPage';
import WorkersPage from './pages/WorkersPage';
import InventoryPage from './pages/InventoryPage';
import SettingsPage from './pages/SettingsPage';
import { Menu } from 'lucide-react';
import './index.css';
import Toast from './components/Toast';

function Shell() {
  const { currentUser, activeSection, settings, loading, error, loadData, sidebarOpen, setSidebarOpen, invoiceOrder } = useApp();

  useEffect(() => {
    document.body.className = settings.darkMode ? '' : 'lm';
  }, [settings.darkMode]);

  useEffect(() => { if (currentUser) loadData(); }, [currentUser, loadData]);
  
  // INACTIVITY TIMEOUT (30 mins)
  const { showToast } = useApp();
  useEffect(() => {
    if (!currentUser) return;
    let timeout;
    const reset = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        showToast('Session expired due to inactivity', 'amber');
        setTimeout(() => window.location.reload(), 2000); // Give time for toast
      }, 30 * 60 * 1000); 
    };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    reset();
    return () => {
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
      clearTimeout(timeout);
    };
  }, [currentUser]);

  if (!currentUser) return <LoginPage />;

  const pages = { billing:<BillingPage/>, menu:<MenuPage/>, orders:<OrdersPage/>, sales:<SalesPage/>, workers:<WorkersPage/>, inventory:<InventoryPage/>, settings:<SettingsPage/> };

  // No more full-screen blocking loader. Shell renders immediately.
  return (
    <div className="shell">
      <Sidebar/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Mobile bar */}
        <div id="mbar" style={{ display:'none', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--s1)', borderBottom:'1px solid var(--b1)', flexShrink:0 }}>
          <button className="iBtn" onClick={()=>setSidebarOpen(o=>!o)}><Menu size={16}/></button>
          <span style={{ fontFamily:'Pacifico,cursive', color:'var(--a)', fontSize:14 }}>HumTum</span>
        </div>
        
        {loading && (
          <div className="top-loader-line">
            <div className="top-loader-progress"></div>
          </div>
        )}

        {error && (
          <div style={{ background:'rgba(239,68,68,0.07)', borderBottom:'1px solid rgba(239,68,68,0.18)', padding:'6px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, color:'var(--red)', flexShrink:0 }}>
            <span>⚠️ {error}</span>
            <button className="btn btn-danger btn-sm" onClick={loadData}>Retry</button>
          </div>
        )}

        <main className="main">{pages[activeSection]||<BillingPage/>}</main>
      </div>
      {invoiceOrder && <InvoiceModal/>}
      <Toast/>
      <style>{`
        @keyframes lineLoad {
          0% { left: -40%; width: 40%; }
          100% { left: 100%; width: 40%; }
        }
        .top-loader-line {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: rgba(245, 158, 11, 0.1); z-index: 9999; overflow: hidden;
        }
        .top-loader-progress {
          position: absolute; top: 0; height: 100%; background: var(--gold);
          animation: lineLoad 1.5s infinite ease-in-out;
        }
        @media(max-width:900px){#mbar{display:flex!important}}
      `}</style>
    </div>
  );
}

export default function App() { return <AppProvider><Shell/></AppProvider>; }
