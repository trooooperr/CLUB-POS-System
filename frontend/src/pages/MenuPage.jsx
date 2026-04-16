
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, Trash2, X, Search, Filter, AlertCircle, Check } from 'lucide-react';

/* ITEM MODAL */
function ItemModal({ item, onClose, onSave }) {
  const { settings } = useApp();
  const menuCategories = Array.isArray(settings.menuCategories) && settings.menuCategories.length > 0
    ? settings.menuCategories
    : ['General'];
  const [form, setForm] = useState({
    name: item?.name || '',
    category: item?.category || menuCategories[0],
    price: item?.price || '',
    imageUrl: item?.imageUrl || '',
    available: item?.available !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.price || isNaN(form.price)) { setError('Valid price required'); return; }
    setSaving(true);
    try {
      await onSave({ ...form, price: parseFloat(form.price) });
      onClose();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="moverlay">
      <div className="mbox">
        <div className="mhead">
          <span>{item ? 'Edit Item' : 'Add Item'}</span>
          <button className="iBtn" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="fgroup">
          <label className="lbl">Item Name</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Chilli Paneer" />
        </div>
        <div className="frow2">
          <div className="fgroup"><label className="lbl">Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {menuCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="fgroup"><label className="lbl">Price</label>
            <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          </div>
        </div>
        {/* IMAGE URL INPUT ADDED HERE */}
        <div className="fgroup"><label className="lbl">Image URL</label>
          <input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} 
            placeholder="https://images.unsplash.com/photo..." />
        </div>
        <div className="fgroup" style={{ marginBottom: 20 }}>
          <div className="menu-availability-row">
            <label className="lbl">Menu Availability</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={form.available}
                onChange={e => setForm({ ...form, available: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        <div className="m-actions">
          <button className="btn btn-ghost "style={{ marginRight:'10px' }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { menuItems, saveMenuItem, deleteMenuItem, settings } = useApp();
  const menuCategories = Array.isArray(settings.menuCategories) && settings.menuCategories.length > 0
    ? settings.menuCategories
    : ['General'];
  const [modal, setModal] = useState(null); 
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [confirmDel, setConfirmDel] = useState(null); // stores ID of item being deleted

  const filtered = useMemo(() => {
    return menuItems.filter(i => {
      const ms = i.name.toLowerCase().includes(search.toLowerCase());
      const mc = catFilter === 'All' || i.category === catFilter;
      return ms && mc;
    });
  }, [menuItems, search, catFilter]);

  const cats = ['All', ...menuCategories];

  return (
    <div className="fi fade-in">
      <div className="page-header-res">
        <div>
          <h2 className="ph-title">Menu</h2>
          <p className="ph-sub">{menuItems.length} items total</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}><Plus size={14} /> Add Item</button>
      </div>

      {/* FILTER BAR - ALIGNED */}
      <div className="menu-filters-row">
        <div className="searchBox-unified">
          <Search size={16} className="search-icon" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dish name..." />
        </div>
        <div className="select-wrapper-unified">
          <Filter size={14} className="filter-icon" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="mobileView">
        {filtered.map(item => (
          <div key={item._id} className={`menu-mobile-card ${confirmDel === item._id ? 'deleting' : ''}`}>
            {confirmDel === item._id ? (
              <div className="del-confirm-overlay">
                <AlertCircle size={18} color="var(--red)" />
                <span>Delete "{item.name}"?</span>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn-mini-ghost" onClick={() => setConfirmDel(null)}>No</button>
                  <button className="btn-mini-red" onClick={() => { deleteMenuItem(item._id); setConfirmDel(null); }}>Yes</button>
                </div>
              </div>
            ) : (
              <>
                {!item.available && (
                  <div className="sold-out-badge">SOLD OUT</div>
                )}
                <div className="menu-card-top">
                  <div><div className="menu-item-name">{item.name}</div><span className="badge-mini">{item.category}</span></div>
                  <div className="menu-item-price">₹{item.price.toFixed(0)}</div>
                </div>
                <div className="menu-card-bottom">
                  <label className="switch mini">
                    <input type="checkbox" checked={item.available} onChange={e => saveMenuItem({ available: e.target.checked }, item._id)} />
                    <span className="slider round"></span>
                  </label>
                  <div style={{ display:'flex', gap:10 }}>
                    <button className="iBtn-round" onClick={() => setModal(item)}><Pencil size={12}/></button>
                    <button className="iBtn-round del" onClick={() => setConfirmDel(item._id)}><Trash2 size={12}/></button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* DESKTOP VIEW */}
      <div className="desktopView">
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table className="dtable">
            <thead>
              <tr><th>Item Name</th><th>Category</th><th style={{ textAlign:'right' }}>Price</th><th style={{ textAlign:'center' }}>Status</th><th style={{ textAlign:'center' }}>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id}>
                  <td style={{ fontWeight:600 }}>{item.name}</td>
                  <td><span className="badge">{item.category}</span></td>
                  <td style={{ textAlign:'right', fontWeight:800 }}>₹{item.price.toFixed(2)}</td>
                  <td style={{ textAlign:'center' }}>
                    <label className="switch">
                      <input type="checkbox" checked={item.available} onChange={e => saveMenuItem({ available: e.target.checked }, item._id)} />
                      <span className="slider round"></span>
                    </label>
                    {!item.available && <span style={{ color:'var(--red)', fontSize:9, fontWeight:800, marginLeft:5 }}>SOLD OUT</span>}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    {confirmDel === item._id ? (
                      <div className="row-del-confirm">
                        <button className="confirm-y" onClick={() => { deleteMenuItem(item._id); setConfirmDel(null); }}>Delete</button>
                        <button className="confirm-n" onClick={() => setConfirmDel(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                        <button className="iBtn" onClick={() => setModal(item)}><Pencil size={13}/></button>
                        <button className="iBtn" style={{ color:'var(--red)' }} onClick={() => setConfirmDel(item._id)}><Trash2 size={13}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <ItemModal item={modal==='add'?null:modal} onClose={()=>setModal(null)} onSave={(data)=>saveMenuItem(data, modal!=='add'?modal._id:null)} />}

      <style>{`
        /* ALIGNED FILTER BAR */
        .menu-filters-row { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; }
        .searchBox-unified { position: relative; display: flex; align-items: center; background: var(--s2); border: 1px solid var(--b1); border-radius: 12px; height: 44px; flex: 1; padding: 0 12px; }
        .search-icon { color: var(--t3); margin-right: 10px; }
        .searchBox-unified input { background: none; border: none; outline: none; color: var(--t0); flex: 1; font-size: 14px; }
        
        .select-wrapper-unified { position: relative; height: 44px; min-width: 150px; }
        .filter-icon { position: absolute; left: 12px; top: 15px; color: var(--t3); pointer-events: none; }
        .select-wrapper-unified select { width: 100%; height: 100%; padding-left: 35px; background: var(--s2); border: 1px solid var(--b1); border-radius: 12px; color: var(--t0); font-size: 13px; appearance: none; cursor: pointer; }

        /* SWITCH SLIDER */
        .switch { position: relative; display: inline-block; width: 40px; height: 15px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .3s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 10px; width:10px; left: 9px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--green); }
        input:checked + .slider:before { transform: translateX(18px); }

        /* DELETE CONFIRM UI */
        .menu-mobile-card { background: var(--s1); border: 1px solid var(--b1); border-radius: 16px; padding: 14px; margin-bottom: 6px; position: relative; transition: 0.2s; }
        .menu-mobile-card.deleting { border-color: var(--red); background: rgba(239, 68, 68, 0.05); }
        .del-confirm-overlay { display: flex; align-items: center; justify-content: space-between; height: 50px; animation: slideIn 0.2s ease-out; font-size: 12px; font-weight: 700; color: var(--red); }
        .btn-mini-ghost { background: none; border: 1px solid var(--b2); color: var(--t1); padding: 4px 12px; border-radius: 6px; cursor: pointer; }
        .btn-mini-red { background: var(--red); border: none; color: #fff; padding: 4px 12px; border-radius: 6px; cursor: pointer; }

        .row-del-confirm { display: flex; gap: 5px; }
        .confirm-y { background: var(--red); color: #fff; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
        .confirm-n { background: var(--s2); color: var(--t2); border: 1px solid var(--b2); padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; }

        /* TABLE & CARDS */
        .page-header-res { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .mobileView { display: block; } .desktopView { display: none; }
        .menu-card-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .menu-item-name { font-weight: 800; color: var(--t0); font-size: 15px; }
        .menu-item-price { font-weight: 900; color: var(--amber); font-size: 17px; }
        .badge-mini { font-size: 10px; color: var(--t2); background: var(--s2); padding: 2px 8px; border-radius: 6px; }
        .menu-card-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--b1); padding-top: 4px; }
        .iBtn-round { background: var(--s2); border: none; color: var(--t1); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .iBtn-round.del { color: var(--red); background: rgba(239, 68, 68, 0.08); }
        @media (min-width: 768px) { .mobileView { display: none; } .desktopView { display: block; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      .menu-availability-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

/* optional: tighter mobile look */
@media (max-width: 600px) {
  .menu-availability-row {
    gap: 8px;
  }

  .lbl {
    font-size: 13px;
  }
}
.sold-out-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}
.menu-mobile-card:has(.sold-out-badge) {
  opacity: 0.8;
}
        `
      }</style>
    </div>
  );
}