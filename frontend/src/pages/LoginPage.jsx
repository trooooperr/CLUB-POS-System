import React, { useState, useEffect } from 'react';
import { useApp, ROLE_HIERARCHY } from '../context/AppContext';
import { Lock, User, ShieldCheck, Mail, ArrowLeft, KeyRound } from 'lucide-react';

const RC = { admin:'#F59E0B', manager:'#3B82F6', staff:'#10B981' };

export default function LoginPage() {
  const { login, forgotPassword, resetPassword, settings } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState('');
  const [busy,  setBusy]        = useState(false);

  // Demo mode via URL query param
  const [isDemo, setIsDemo] = useState(false);
  const [demoUsers, setDemoUsers] = useState([]);

  // Forgot password states
  const [fpMode, setFpMode]     = useState(null); // null | 'email' | 'otp' | 'done'
  const [fpEmail, setFpEmail]   = useState('');
  const [fpOtp, setFpOtp]       = useState('');
  const [fpNewPwd, setFpNewPwd] = useState('');
  const [fpError, setFpError]   = useState('');
  const [fpBusy, setFpBusy]     = useState(false);
  const [fpMsg, setFpMsg]       = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo') === 'true';
    if (demo) setIsDemo(true);

    // Fetch demo credentials anyway so they are ready if toggled
    fetch((import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '') + '/api/auth/demo-credentials')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDemoUsers(data); })
      .catch(() => {
        setDemoUsers([
          { name: 'Owner',   username: 'admin',   password: 'admin123',   role: 'admin' },
          { name: 'Manager', username: 'manager', password: 'manager123', role: 'manager' },
          { name: 'Staff',   username: 'staff',   password: 'staff123',   role: 'staff' },
        ]);
      });
  }, []);

  const submit = async e => {
    e.preventDefault();
    setError(''); setBusy(true);
    const r = await login(username.trim(), password);
    setBusy(false);
    if (r.error) setError(r.error);
  };

  const quick = (u, p) => { setUsername(u); setPassword(p); setError(''); };

  // ── Forgot Password Handlers ──────────────────────────────────
  const handleSendOtp = async () => {
    if (!fpEmail.trim()) { setFpError('Enter your email'); return; }
    setFpBusy(true); setFpError('');
    const r = await forgotPassword(fpEmail.trim());
    setFpBusy(false);
    if (r.error) { setFpError(r.error); return; }
    setFpMsg(`Verification code sent to the Owner's email`);
    setFpMode('otp');
  };

  const handleResetPwd = async () => {
    if (!fpOtp.trim()) { setFpError('Enter the OTP'); return; }
    if (fpNewPwd.length < 6) { setFpError('Password must be at least 6 characters'); return; }
    setFpBusy(true); setFpError('');
    const r = await resetPassword(fpEmail.trim(), fpOtp.trim(), fpNewPwd);
    setFpBusy(false);
    if (r.error) { setFpError(r.error); return; }
    setFpMode('done');
  };

  const closeFP = () => {
    setFpMode(null); setFpEmail(''); setFpOtp(''); setFpNewPwd(''); setFpError(''); setFpMsg('');
  };

  // ── Forgot Password UI ────────────────────────────────────────
  if (fpMode) {
    return (
      <div className="lpage">
        <div className="lcard fi">
          <div className="llogo">
            <div className="ltitle">{settings.restaurantName?.split(' ').slice(0,2).join(' ') || 'HumTum'}</div>
            <div className="lsub">
              {fpMode === 'done' ? 'Password Reset!' : fpMode === 'otp' ? 'Enter OTP' : 'Forgot Password'}
            </div>
          </div>

          {fpMode === 'email' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 12, textAlign: 'center' }}>
                  Select the account type to reset. The verification code will be sent to the <strong>Owner's Email</strong>.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button 
                    type="button" 
                    className={`btn ${fpEmail === 'manager_team' ? 'btn-primary' : 'btn-ghost'}`} 
                    style={{ width: '100%', justifyContent: 'center', height: 44 }}
                    onClick={() => { setFpEmail('manager_team'); setFpError(''); }}
                  >
                    <ShieldCheck size={16} style={{ marginRight: 8 }}/> Manager Account
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${fpEmail === 'staff_team' ? 'btn-primary' : 'btn-ghost'}`} 
                    style={{ width: '100%', justifyContent: 'center', height: 44 }}
                    onClick={() => { setFpEmail('staff_team'); setFpError(''); }}
                  >
                    <User size={16} style={{ marginRight: 8 }}/> All Staff (Team)
                  </button>
                </div>
              </div>

              {fpError && (
                <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, padding:'7px 11px', fontSize:12, color:'var(--red)', marginBottom:11 }}>
                  {fpError}
                </div>
              )}

              <button 
                type="button" 
                className="btn btn-primary btn-lg" 
                style={{ width:'100%', marginTop:8, background: 'var(--amber)', color: '#000' }} 
                disabled={fpBusy || !fpEmail} 
                onClick={handleSendOtp}
              >
                {fpBusy ? 'Sending Reset Code…' : 'Send Code to Owner →'}
              </button>
            </>
          )}

          {fpMode === 'otp' && (
            <>
              {fpMsg && (
                <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:7, padding:'7px 11px', fontSize:12, color:'var(--green)', marginBottom:11 }}>
                  {fpMsg}
                </div>
              )}
              <div className="fgroup">
                <label className="lbl">OTP Code</label>
                <div style={{ position:'relative' }}>
                  <KeyRound size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--t2)' }}/>
                  <input value={fpOtp} onChange={e=>setFpOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} style={{ paddingLeft:30, letterSpacing:4, fontSize:18, textAlign:'center' }}/>
                </div>
              </div>
              <div className="fgroup">
                <label className="lbl">New Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--t2)' }}/>
                  <input type="password" value={fpNewPwd} onChange={e=>setFpNewPwd(e.target.value)} placeholder="Min 6 characters" style={{ paddingLeft:30 }}/>
                </div>
              </div>
              {fpError && (
                <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, padding:'7px 11px', fontSize:12, color:'var(--red)', marginBottom:11 }}>
                  {fpError}
                </div>
              )}
              <button type="button" className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:2 }} disabled={fpBusy} onClick={handleResetPwd}>
                {fpBusy ? 'Resetting…' : 'Reset Password →'}
              </button>
            </>
          )}

          {fpMode === 'done' && (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:38, marginBottom:8 }}>✅</div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--green)', marginBottom:4 }}>Password Changed!</div>
              <div style={{ fontSize:12, color:'var(--t2)', marginBottom:16 }}>You can now sign in with your new password.</div>
              <button className="btn btn-primary btn-lg" style={{ width:'100%' }} onClick={closeFP}>Back to Login</button>
            </div>
          )}

          {fpMode !== 'done' && (
            <button type="button" className="btn btn-ghost" style={{ width:'100%', marginTop:12 }} onClick={closeFP}>
              <ArrowLeft size={12}/> Back to Login
            </button>
          )}
        </div>
      <style>{`
.lpage{ min-height:100dvh; display:flex; align-items:center; justify-content:center; padding:16px; }
.lcard{ width:100%; max-width:420px; padding:22px; border-radius:14px; position:relative; }
@media (max-width: 480px){
  .lpage{ padding:8px; align-items:flex-start; margin-top:10px; }
  .ltitle{ font-size:18px; }
  .lsub{ font-size:11px; }
  .fgroup input{ font-size:13px; padding:8px 10px; }
  .lcard button{ font-size:12px; }
}
`}</style>
      </div>
    );
  }

  // ── Main Login UI ─────────────────────────────────────────────
  return (
    <div className="lpage">
      <div className="lcard fi">
        {/* Mode Switcher - Hidden except when ?demo=true is present in URL */}
        {isDemo && (
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <div style={{ background:'var(--s2)', padding:3, borderRadius:10, display:'flex', gap:2, border:'1px solid var(--b1)' }}>
              <button onClick={()=>setIsDemo(false)} style={{ border:'none', padding:'4px 12px', borderRadius:8, fontSize:10, fontWeight:700, cursor:'pointer', transition:'all 0.2s', background:!isDemo?'var(--p)':'transparent', color:!isDemo?'#000':'var(--t2)' }}>Client Login</button>
              <button onClick={()=>setIsDemo(true)} style={{ border:'none', padding:'4px 12px', borderRadius:8, fontSize:10, fontWeight:700, cursor:'pointer', transition:'all 0.2s', background:isDemo?'#F59E0B':'transparent', color:isDemo?'#000':'var(--t2)' }}>Interview Mode</button>
            </div>
          </div>
        )}

        {/* Brand */}
        <div className="llogo">
          <div className="ltitle">{settings.restaurantName?.split(' ').slice(0,2).join(' ') || 'HumTum'}</div>
          <div className="lsub">{isDemo ? 'Demonstration Access' : 'Secure Login'}</div>
        </div>

        {/* Form */}
        <form onSubmit={submit}>
          <div className="fgroup">
            <label className="lbl">Username</label>
            <div style={{ position:'relative' }}>
              <User size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--t2)' }}/>
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter username" autoComplete="username" required style={{ paddingLeft:30 }}/>
            </div>
          </div>

          <div className="fgroup">
            <label className="lbl">Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--t2)' }}/>
              <input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" required style={{ paddingLeft:30, paddingRight:34 }}/>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div style={{ textAlign:'right', marginBottom:8 }}>
            <button type="button" onClick={()=>setFpMode('email')}
              style={{ background:'none', border:'none', color:'var(--a)', fontSize:11, fontWeight:600, cursor:'pointer', padding:0 }}>
              Forgot Password?
            </button>
          </div>

          {error && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, padding:'7px 11px', fontSize:12, color:'var(--red)', marginBottom:11 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:2 }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Quick login — only shown in demo mode */}
        {isDemo && demoUsers.length > 0 && (
          <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--b0)' }}>
            <div style={{ fontSize:10, color:'var(--t2)', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700, marginBottom:8 }}>Quick Access (Demo)</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {demoUsers.map(u => (
                <button key={u.username} onClick={()=>quick(u.username,u.password)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--s2)', border:'1px solid var(--b1)', borderRadius:7, padding:'7px 11px', cursor:'pointer', transition:'border-color 0.15s' }}
                  onMouseOver={e=>e.currentTarget.style.borderColor=RC[u.role]}
                  onMouseOut={e=>e.currentTarget.style.borderColor='var(--b1)'}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:20, height:20, borderRadius:5, background:RC[u.role]+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:RC[u.role] }}>{u.name[0]}</div>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--t0)' }}>{u.name}</span>
                    <span style={{ fontSize:10, color:'var(--t2)', fontFamily:'monospace' }}>{u.username}/{u.password}</span>
                  </div>
                  <span style={{ fontSize:10, color:'var(--t1)', background:`${RC[u.role]}18`, padding:'1px 7px', borderRadius:20, fontWeight:700 }}>
                    {ROLE_HIERARCHY[u.role]?.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Role info — only in demo mode */}
        {isDemo && (
          <div style={{ marginTop:14, background:'var(--s2)', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
              <ShieldCheck size={11} style={{ color:'var(--t2)' }}/>
              <span style={{ fontSize:10, color:'var(--t2)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Role Hierarchy</span>
            </div>
            {[['admin','Full access — all sections & reports'],['manager','Menu · Sales · Inventory · Staff'],['staff','Billing & Order History only']].map(([r,d])=>(
              <div key={r} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:RC[r], flexShrink:0, display:'inline-block' }}/>
                <span style={{ fontSize:11, color:'var(--t1)' }}><b style={{ color:RC[r] }}>{ROLE_HIERARCHY[r]?.label}</b> — {d}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign:'center', fontSize:10, color:'var(--t2)', marginTop:14 }}>
          © {new Date().getFullYear()} {settings.restaurantName}
        </p>
      </div>
    <style>{`
/* PAGE WRAPPER */
.lpage{
  min-height:100dvh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:16px;
}

/* CARD */
.lcard{
  width:100%;
  max-width:420px;
  padding:22px;
  border-radius:14px;
}

/* MOBILE FIX */
@media (max-width: 480px){

  .lpage{
    padding:8px;
    align-items:flex-start;
    margin-top:10px;
  }


  .ltitle{
    font-size:18px;
  }

  .lsub{
    font-size:11px;
  }

  .fgroup input{
    font-size:13px;
    padding:8px 10px;
  }

  .lcard button{
    font-size:12px;
  }
}
  
`}</style>
    </div>

  );
}
