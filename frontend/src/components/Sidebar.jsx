import React from 'react';
import { useApp, ROLE_HIERARCHY } from '../context/AppContext';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, BarChart3, Users, Package, Settings, Sun, Moon, LogOut, X } from 'lucide-react';

const NAV = [
  { id:'billing',   label:'Billing',         icon:LayoutDashboard, perm:'billing'   },
  { id:'menu',      label:'Menu',            icon:UtensilsCrossed, perm:'menu'      },
  { id:'orders',    label:'Orders',          icon:ClipboardList,   perm:'orders'    },
  { id:'sales',     label:'Analytics',       icon:BarChart3,       perm:'sales'     },
  { id:'workers',   label:'Staff',           icon:Users,           perm:'workers'   },
  { id:'inventory', label:'Inventory',       icon:Package,         perm:'inventory' },
  { id:'settings',  label:'Settings',        icon:Settings,        perm:'settings'  },
];

const RC = { admin:'#F59E0B', manager:'#3B82F6', staff:'#10B981' };

export default function Sidebar() {
  const { activeSection, setActiveSection, can, role, currentUser, logout, settings, saveSettings, sidebarOpen, setSidebarOpen } = useApp();
  const rc = RC[role] || '#F59E0B';
  const go = id => { setActiveSection(id); setSidebarOpen(false); };

  return (
    <>
      {sidebarOpen && <div onClick={()=>setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1999 }}/>}

      <aside className={`sbar${sidebarOpen?' open':''}`}>
        {/* Logo */}
        <div className="logo-wrap">
          <div className="logo-box">HT</div>
          <div style={{ flex:1 }}>
            <div className="logo-name" style={{ fontFamily:'Pacifico,cursive', color:'var(--a)' }}>
              {settings.restaurantName?.split(' ').slice(0,2).join(' ') || 'HumTum'}
            </div>
            <div className="logo-sub">Bar & Restaurant</div>
          </div>
          <button className="iBtn" style={{ padding:4 }} onClick={()=>setSidebarOpen(false)}><X size={12}/></button>
        </div>

        {/* User */}
        <div className="user-bar">
          <div className="avatar" style={{ background:`${rc}18`, color:rc, border:`1px solid ${rc}30` }}>
            {currentUser?.name?.[0]||'?'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="user-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentUser?.name}</div>
            <span className="role-tag" style={{ background:`${rc}14`, color:rc, border:`1px solid ${rc}25`, marginTop:1 }}>
              {ROLE_HIERARCHY[role]?.label}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
          {NAV.filter(n=>can(n.perm)).map(({id,label,icon:Icon})=>(
            <button key={id} className={`nitem${activeSection===id?' on':''}`} onClick={()=>go(id)}>
              <Icon size={14}/>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Theme */}
        <div style={{ padding:'0 14px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, color:'var(--t1)', display:'flex', alignItems:'center', gap:5 }}>
            {settings.darkMode ? <Moon size={12}/> : <Sun size={12}/>}
            {settings.darkMode ? 'Dark' : 'Light'} Mode
          </span>
          <label className="tog">
            <input type="checkbox" checked={!!settings.darkMode} onChange={e=>saveSettings({darkMode:e.target.checked})}/>
            <span className="tslider"/>
          </label>
        </div>

        {/* Logout */}
        <div style={{ padding:'8px 10px 14px', borderTop:'1px solid var(--b0)' }}>
          <button className="btn btn-ghost" style={{ width:'100%', fontSize:12 }} onClick={logout}>
            <LogOut size={12}/> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
