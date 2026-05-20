import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://xermlxydjmvpmgprifce.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlcm1seHlkam12cG1ncHJpZmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTcyNTMsImV4cCI6MjA5NDgzMzI1M30.QRwb2WdA7r8GnNSX7YZk7DtIieULHk60pRONHlyYk3g";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlcm1seHlkam12cG1ncHJpZmNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI1NzI1MywiZXhwIjoyMDk0ODMzMjUzfQ.iJpUnnh30YRFlRlBUrpRFOvYcRF9y38YiKIwNitMYFM";

const API = `${SUPABASE_URL}/rest/v1/currencies`;
const HEADERS = {
  "apikey": ANON_KEY,
  "Authorization": `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};
const WRITE_HEADERS = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

async function fetchCurrencies() {
  const res = await fetch(`${API}?order=id`, { headers: HEADERS });
  return res.json();
}

async function updateCurrency(id, data) {
  await fetch(`${API}?id=eq.${id}`, {
    method: "PATCH",
    headers: WRITE_HEADERS,
    body: JSON.stringify(data)
  });
}

async function insertCurrency(data) {
  const res = await fetch(API, {
    method: "POST",
    headers: WRITE_HEADERS,
    body: JSON.stringify(data)
  });
  return res.json();
}

async function deleteCurrency(id) {
  await fetch(`${API}?id=eq.${id}`, {
    method: "DELETE",
    headers: WRITE_HEADERS
  });
}

// map currency code -> country code for flagcdn.com
const FLAG_MAP = {
  USD:"us", EUR:"eu", GBP:"gb", TRY:"tr", JOD:"jo",
  AED:"ae", SAR:"sa", CAD:"ca", AUD:"au", KWD:"kw",
  EGP:"eg", IRR:"ir", IQD:"iq"
};
function FlagImg({ code, size=28 }) {
  const cc = FLAG_MAP[code] || "un";
  return <img src={`https://flagcdn.com/w40/${cc}.png`} width={size} height={size*0.67}
    style={{borderRadius:3, objectFit:"cover", boxShadow:"0 1px 4px rgba(0,0,0,0.4)"}}
    alt={code} onError={e=>e.target.style.display="none"}/>;
}
const ADMIN_PASS = "UniqueWord";
const fmt = v => Number(v).toLocaleString("en");
const fmtDate = d => d.toLocaleDateString("ar-IQ", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
const fmtTime = d => d.toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit" });

function Logo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <polygon points="50,8 90,42 90,92 10,92 10,42" fill="rgba(240,192,64,0.15)" stroke="#f0c040" strokeWidth="2"/>
      <polygon points="50,4 96,44 4,44" fill="rgba(240,192,64,0.25)" stroke="#f0c040" strokeWidth="1.5"/>
      <rect x="36" y="60" width="28" height="32" rx="2" fill="rgba(10,15,30,0.8)"/>
      <text x="50" y="85" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#f0c040" fontFamily="serif">$</text>
    </svg>
  );
}

function LoginPage({ onSuccess, onBack }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setVal(""); setErr("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  function attempt() {
    const cleaned = val.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\s]/g, "");
    if (cleaned === ADMIN_PASS) { setVal(""); setErr(""); onSuccess(); }
    else { setErr("كلمة المرور خاطئة"); setVal(""); setTimeout(() => inputRef.current?.focus(), 50); }
  }

  return (
    <div style={S.root}>
      <div style={S.blob1}/><div style={S.blob2}/>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
        <div style={S.loginBox}>
          <Logo size={60}/>
          <h2 style={{ color:"#f0c040", fontFamily:"Georgia,serif", margin:"12px 0 4px", fontSize:20 }}>دخول الإدارة</h2>
          <p style={{ color:"#64748b", fontSize:13, marginBottom:24 }}>شركة القصر للصرافة</p>
          <input ref={inputRef} type="text" placeholder="" value={val}
            onChange={e => { setVal(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && attempt()} style={S.loginInput}/>
          {err && <p style={{ color:"#f87171", fontSize:13, margin:"6px 0 0", textAlign:"center" }}>{err}</p>}
          <button onClick={attempt} style={{ ...S.loginBtn, marginTop:12 }}>دخول</button>
          <button onClick={onBack} style={{ ...S.backBtn, marginTop:8 }}>← العودة للأسعار</button>
         {/* <p style={{ color:"#334155", fontSize:11, marginTop:14 }}>الباسوورد: admin123</p> */}
          
        </div>
      </div>
    </div>
  );
}

function AdminPage({ onLogout }) {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ flag:"", code:"", name:"", buy:"", sell:"", change:"0", note:"" });
  const [flash, setFlash] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await fetchCurrencies();
    setCurrencies(data);
    setLoading(false);
  }

  function trigFlash(msg) { setFlash(msg); setTimeout(() => setFlash(""), 2000); }

  async function saveEdit() {
    await updateCurrency(editRow.id, { buy: parseFloat(editRow.buy), sell: parseFloat(editRow.sell), change: parseFloat(editRow.change) });
    setEditRow(null);
    await load();
    trigFlash("✅ تم الحفظ!");
  }

  async function handleAdd(e) {
    e.preventDefault();
    await insertCurrency({
      flag: addForm.flag||"🏳️", code: addForm.code.toUpperCase(),
      name: addForm.name, buy: parseFloat(addForm.buy),
      sell: parseFloat(addForm.sell), change: parseFloat(addForm.change)||0,
      note: addForm.note||""
    });
    setAddForm({ flag:"", code:"", name:"", buy:"", sell:"", change:"0", note:"" });
    setShowAdd(false);
    await load();
    trigFlash("✅ تمت الإضافة!");
  }

  async function handleDelete(id) {
    await deleteCurrency(id);
    await load();
    trigFlash("🗑️ تم الحذف!");
  }

  return (
    <div style={S.root}>
      <div style={S.blob1}/>
      <header style={S.header}>
        <div style={S.hInner}>
          <div style={S.logo}><Logo size={40}/>
            <div>
              <div style={S.logoTitle}>لوحة الإدارة</div>
              <div style={S.logoSub}>شركة القصر للصرافة</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {flash && <span style={S.flashBadge}>{flash}</span>}
            <button style={S.addBtn} onClick={() => setShowAdd(s=>!s)}>+ إضافة عملة</button>
            <button style={S.adminBtn} onClick={onLogout}>خروج</button>
          </div>
        </div>
      </header>
      <main style={{ ...S.main, paddingTop:24 }}>
        {loading && <p style={{ color:"#64748b", textAlign:"center" }}>جاري التحميل...</p>}

        {showAdd && (
          <form onSubmit={handleAdd} style={S.addForm}>
            <h3 style={{ color:"#f0c040", marginBottom:12, fontSize:15 }}>إضافة عملة جديدة</h3>
            <div style={S.addGrid}>
              {[["رمز العلم","flag","🇺🇸"],["الرمز","code","USD"],["الاسم بالعربي","name","الدولار الأمريكي"],
                ["سعر الشراء","buy","153800"],["سعر البيع","sell","154200"],["التغيير","change","0"],["الوحدة","note","لكل 100$"]
              ].map(([label,key,ph]) => (
                <div key={key}>
                  <label style={S.addLabel}>{label}</label>
                  <input style={S.addInput} placeholder={ph} value={addForm[key]}
                    onChange={e => setAddForm(f=>({...f,[key]:e.target.value}))}
                    required={["flag","code","name","buy","sell"].includes(key)}/>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:12 }}>
              <button type="submit" style={S.saveBtn}>إضافة</button>
              <button type="button" onClick={()=>setShowAdd(false)} style={S.cancelBtn}>إلغاء</button>
            </div>
          </form>
        )}

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr style={S.thead}>
              <th style={{...S.th,textAlign:"right",paddingRight:16}}>العملة</th>
              <th style={S.th}>الوحدة</th>
              <th style={S.th}>سعر الشراء</th>
              <th style={S.th}>سعر البيع</th>
              <th style={S.th}>التغيير</th>
              <th style={S.th}>إجراءات</th>
            </tr></thead>
            <tbody>
              {currencies.map((c,i) => (
                <tr key={c.id} style={{...S.tr, background:i%2===0?"rgba(255,255,255,0.03)":"transparent"}}>
                  <td style={{...S.td,textAlign:"right",paddingRight:16}}>
                    <FlagImg code={c.code} size={24}/>
                    <span style={{...S.code,margin:"0 8px"}}>{c.code}</span>
                    <span style={{color:"#94a3b8",fontSize:12}}>{c.name}</span>
                  </td>
                  <td style={S.td}><span style={{fontSize:11,color:"#64748b"}}>{c.note||"—"}</span></td>
                  {editRow?.id===c.id ? <>
                    <td style={S.td}><input style={S.editInput} value={editRow.buy} onChange={e=>setEditRow(r=>({...r,buy:e.target.value}))}/></td>
                    <td style={S.td}><input style={S.editInput} value={editRow.sell} onChange={e=>setEditRow(r=>({...r,sell:e.target.value}))}/></td>
                    <td style={S.td}><input style={S.editInput} value={editRow.change} onChange={e=>setEditRow(r=>({...r,change:e.target.value}))}/></td>
                    <td style={S.td}>
                      <button onClick={saveEdit} style={S.saveBtn}>حفظ</button>
                      <button onClick={()=>setEditRow(null)} style={{...S.cancelBtn,marginRight:6}}>إلغاء</button>
                    </td>
                  </> : <>
                    <td style={S.td}><span style={S.buyVal}>{fmt(c.buy)}</span></td>
                    <td style={S.td}><span style={S.sellVal}>{fmt(c.sell)}</span></td>
                    <td style={S.td}><span style={{color:c.change>0?"#4ade80":c.change<0?"#f87171":"#94a3b8",fontFamily:"monospace"}}>{c.change>0?"+":""}{c.change}</span></td>
                    <td style={S.td}>
                      <button onClick={()=>setEditRow({id:c.id,buy:c.buy,sell:c.sell,change:c.change})} style={S.editBtn}>تعديل</button>
                      <button onClick={()=>handleDelete(c.id)} style={{...S.deleteBtn,marginRight:6}}>حذف</button>
                    </td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function PublicPage({ onAdminClick }) {
  const [currencies, setCurrencies] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 60000);
    return () => clearInterval(t);
  }, []);

  async function loadData() {
    const data = await fetchCurrencies();
    setCurrencies(data);
    setLastUpdated(new Date());
  }

  useEffect(() => { const t = setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);
  useEffect(() => { const t = setInterval(()=>setTick(x=>x+1),25); return ()=>clearInterval(t); },[]);

  const offset = currencies.length > 0 ? (tick * 0.35) % (currencies.length * 240) : 0;

  return (
    <div style={S.root} dir="rtl">
      <div style={S.blob1}/><div style={S.blob2}/>
      <header style={S.header}>
        <div style={S.hInner}>
          <div style={S.logo}><Logo size={48}/>
            <div>
              <div style={S.logoTitle}>شركة القصر للصرافة</div>
              <div style={S.logoSub}>بغداد — حي العدل — شارع الربيع</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ textAlign:"left" }}>
              <div style={S.clockTime}>{fmtTime(now)}</div>
              <div style={S.clockDate}>{fmtDate(now)}</div>
            </div>
            <button style={S.adminBtn} onClick={onAdminClick}>إدارة ⚙️</button>
          </div>
        </div>
      </header>

      <div style={S.tickerWrap}>
        <div style={S.tickerLabel}>أسعار مباشرة</div>
        <div style={{ flex:1, overflow:"hidden", direction:"ltr", display:"flex", alignItems:"center", height:"100%" }}>
          <div style={{ display:"flex", transform:`translateX(-${offset}px)`, whiteSpace:"nowrap", transition:"none" }}>
            {[...currencies,...currencies].map((c,i) => (
              <span key={i} style={S.tickerItem}>
<FlagImg code={c.code} size={20}/> <strong>{c.code}</strong>&nbsp;
                شراء <span style={{color:"#4ade80"}}>{fmt(c.buy)}</span> /
                بيع <span style={{color:"#60a5fa"}}>{fmt(c.sell)}</span> د.ع&nbsp;
                <span style={{color:c.change>0?"#4ade80":c.change<0?"#f87171":"#94a3b8"}}>
                  {c.change>0?"▲":c.change<0?"▼":"—"}{Math.abs(c.change)}
                </span>
                <span style={{color:"#334155",margin:"0 18px"}}>|</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <main style={S.main}>
        <div style={S.statusBar}>
          <div style={S.dot}/>
          <span style={{fontSize:13,color:"#94a3b8"}}>آخر تحديث: {fmtDate(lastUpdated)} — {fmtTime(lastUpdated)}</span>
          <span style={{marginRight:"auto",fontSize:12,color:"#475569"}}>تُحدَّث الأسعار يومياً</span>
        </div>
        <div style={{marginBottom:20}}>
          <h2 style={{fontSize:26,fontWeight:700,color:"#f0c040",fontFamily:"Georgia,serif",margin:0}}>أسعار الصرف اليومية</h2>
          <p style={{fontSize:13,color:"#64748b",marginTop:4}}>جميع الأسعار بالدينار العراقي (IQD) — لكل 100 وحدة من العملة الأجنبية</p>
        </div>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr style={S.thead}>
              <th style={{...S.th,textAlign:"right",paddingRight:20}}>العملة</th>
              <th style={S.th}>الرمز</th>
              <th style={S.th}>الوحدة</th>
              <th style={S.th}>سعر الشراء (IQD)</th>
              <th style={S.th}>سعر البيع (IQD)</th>
              <th style={S.th}>التغيير</th>
            </tr></thead>
            <tbody>
              {currencies.map((c,i) => (
                <tr key={c.id} style={{...S.tr,background:i%2===0?"rgba(255,255,255,0.03)":"transparent"}}>
                  <td style={{...S.td,textAlign:"right",paddingRight:20}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"flex-end"}}>
                      <span style={{fontSize:14,color:"#cbd5e1"}}>{c.name}</span>
                      <FlagImg code={c.code} size={32}/>
                    </div>
                  </td>
                  <td style={S.td}><span style={S.code}>{c.code}</span></td>
                  <td style={S.td}><span style={{fontSize:11,color:"#64748b",background:"rgba(240,192,64,0.08)",padding:"2px 8px",borderRadius:4}}>{c.note||"—"}</span></td>
                  <td style={S.td}><span style={S.buyVal}>{fmt(c.buy)}</span></td>
                  <td style={S.td}><span style={S.sellVal}>{fmt(c.sell)}</span></td>
                  <td style={S.td}>
                    <span style={{fontSize:13,fontFamily:"monospace",fontWeight:600,color:c.change>0?"#4ade80":c.change<0?"#f87171":"#94a3b8"}}>
                      {c.change>0?"▲ +":c.change<0?"▼ ":"— "}{Math.abs(c.change)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={S.cards}>
          <div style={S.card}>
            <div style={{fontSize:28,marginBottom:8}}>📍</div>
            <div style={S.cardTitle}>العنوان</div>
            <div style={S.cardDesc}>بغداد - حي العدل<br/>شارع الربيع<br/>مقابل دائرة الكهرباء</div>
          </div>
          <div style={S.card}>
            <div style={{fontSize:28,marginBottom:8}}>📞</div>
            <div style={S.cardTitle}>اتصل بنا</div>
            <div style={{...S.cardDesc,fontSize:16,fontWeight:700,color:"#f0c040",direction:"ltr",marginTop:6}}>0771 006 0095</div>
          </div>
          <div style={S.card}>
            <div style={{fontSize:28,marginBottom:8}}>🌐</div>
            <div style={S.cardTitle}>تابعنا</div>
            <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:8,fontSize:22}}>
              <span>✈️</span><span>📷</span><span>👤</span>
            </div>
            <div style={{...S.cardDesc,marginTop:6}}>كوخ العملات — القصر</div>
          </div>
          <div style={S.card}>
            <div style={{fontSize:28,marginBottom:8}}>📅</div>
            <div style={S.cardTitle}>تحديث يومي</div>
            <div style={S.cardDesc}>تُحدَّث الأسعار كل صباح من قِبَل الإدارة</div>
          </div>
        </div>
      </main>
      <footer style={S.footer}>
        <div style={{marginBottom:4}}>شركة القصر للصرافة · بغداد، العراق · 0771 006 0095</div>
        <div>© 2026 — الأسعار للاسترشاد فقط</div>
        <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)",color:"#2d3f5f",fontSize:11}}>
          تم التطوير بواسطة <span style={{color:"#60a5fa",fontWeight:600}}>الريم للحلول البرمجية</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("public");
  if (page==="login") return <LoginPage onSuccess={()=>setPage("admin")} onBack={()=>setPage("public")}/>;
  if (page==="admin") return <AdminPage onLogout={()=>setPage("public")}/>;
  return <PublicPage onAdminClick={()=>setPage("login")}/>;
}

const S = {
  root:       { minHeight:"100vh", background:"#0a0f1e", fontFamily:"'Trebuchet MS',Georgia,serif", color:"#e2e8f0", position:"relative", overflow:"hidden" },
  blob1:      { position:"fixed", top:-200, right:-200, width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(240,192,64,0.06) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 },
  blob2:      { position:"fixed", bottom:-300, left:-200, width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,100,180,0.07) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 },
  header:     { background:"rgba(10,15,30,0.97)", borderBottom:"1px solid rgba(240,192,64,0.2)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100, padding:"0 24px" },
  hInner:     { maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:70 },
  logo:       { display:"flex", alignItems:"center", gap:14 },
  logoTitle:  { fontSize:18, fontWeight:700, color:"#f0c040", letterSpacing:1, fontFamily:"Georgia,serif" },
  logoSub:    { fontSize:11, color:"#64748b", marginTop:2 },
  clockTime:  { fontSize:18, fontWeight:700, color:"#f0c040", fontFamily:"monospace" },
  clockDate:  { fontSize:11, color:"#64748b" },
  adminBtn:   { background:"rgba(240,192,64,0.1)", border:"1px solid rgba(240,192,64,0.3)", color:"#f0c040", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:12 },
  tickerWrap: { background:"rgba(240,192,64,0.07)", borderBottom:"1px solid rgba(240,192,64,0.15)", display:"flex", alignItems:"center", overflow:"hidden", height:38, zIndex:10 },
  tickerLabel:{ background:"#f0c040", color:"#0a0f1e", fontWeight:700, fontSize:11, letterSpacing:1, padding:"0 14px", height:"100%", display:"flex", alignItems:"center", flexShrink:0 },
  tickerItem: { fontSize:13, color:"#cbd5e1", whiteSpace:"nowrap", paddingRight:8 },
  main:       { maxWidth:1100, margin:"0 auto", padding:"30px 24px 60px", position:"relative", zIndex:1 },
  statusBar:  { display:"flex", alignItems:"center", gap:10, marginBottom:24, background:"rgba(30,40,70,0.5)", border:"1px solid rgba(100,130,180,0.15)", borderRadius:8, padding:"10px 16px" },
  dot:        { width:8, height:8, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 8px #4ade80", flexShrink:0 },
  tableWrap:  { borderRadius:12, overflow:"hidden", border:"1px solid rgba(240,192,64,0.15)", background:"rgba(15,22,40,0.85)", backdropFilter:"blur(8px)", marginBottom:30 },
  table:      { width:"100%", borderCollapse:"collapse" },
  thead:      { background:"rgba(240,192,64,0.08)", borderBottom:"1px solid rgba(240,192,64,0.2)" },
  th:         { padding:"14px 12px", fontSize:11, letterSpacing:1, color:"#f0c040", fontWeight:700, textAlign:"center" },
  tr:         { borderBottom:"1px solid rgba(255,255,255,0.04)" },
  td:         { padding:"13px 12px", textAlign:"center", fontSize:14 },
  code:       { fontSize:13, fontWeight:700, color:"#f0c040", fontFamily:"monospace", letterSpacing:1 },
  buyVal:     { color:"#4ade80", fontWeight:700, fontSize:15, fontFamily:"monospace" },
  sellVal:    { color:"#60a5fa", fontWeight:700, fontSize:15, fontFamily:"monospace" },
  cards:      { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 },
  card:       { background:"rgba(15,22,40,0.7)", border:"1px solid rgba(240,192,64,0.1)", borderRadius:10, padding:"20px 16px", textAlign:"center" },
  cardTitle:  { color:"#f0c040", fontWeight:600, fontSize:14, marginBottom:6 },
  cardDesc:   { color:"#64748b", fontSize:12, lineHeight:1.7 },
  footer:     { textAlign:"center", color:"#334155", fontSize:11, padding:"20px 0", borderTop:"1px solid rgba(255,255,255,0.05)", lineHeight:2 },
  loginBox:   { background:"rgba(15,22,40,0.97)", border:"1px solid rgba(240,192,64,0.2)", borderRadius:16, padding:"40px 32px", textAlign:"center", width:320, position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center" },
  loginInput: { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(240,192,64,0.2)", borderRadius:8, color:"#e2e8f0", padding:"10px 14px", fontSize:16, boxSizing:"border-box", textAlign:"center", outline:"none", letterSpacing:2 },
  loginBtn:   { width:"100%", background:"#f0c040", color:"#0a0f1e", border:"none", borderRadius:8, padding:"12px", fontSize:16, fontWeight:700, cursor:"pointer" },
  backBtn:    { background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b", borderRadius:8, padding:"8px", fontSize:13, cursor:"pointer", width:"100%" },
  addForm:    { background:"rgba(15,22,40,0.9)", border:"1px solid rgba(240,192,64,0.2)", borderRadius:12, padding:20, marginBottom:20 },
  addGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 },
  addLabel:   { display:"block", fontSize:11, color:"#64748b", marginBottom:4 },
  addInput:   { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(240,192,64,0.2)", borderRadius:6, color:"#e2e8f0", padding:"7px 10px", fontSize:13, boxSizing:"border-box", textAlign:"right" },
  editInput:  { width:90, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(240,192,64,0.3)", borderRadius:6, color:"#f0c040", padding:"4px 8px", fontSize:13, fontFamily:"monospace" },
  saveBtn:    { background:"#4ade80", color:"#0a0f1e", border:"none", borderRadius:6, padding:"6px 14px", cursor:"pointer", fontSize:13, fontWeight:700 },
  cancelBtn:  { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", borderRadius:6, padding:"6px 14px", cursor:"pointer", fontSize:13 },
  editBtn:    { background:"rgba(240,192,64,0.15)", border:"1px solid rgba(240,192,64,0.3)", color:"#f0c040", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:12 },
  deleteBtn:  { background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", color:"#f87171", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:12 },
  flashBadge: { background:"rgba(74,222,128,0.15)", border:"1px solid rgba(74,222,128,0.3)", color:"#4ade80", borderRadius:6, padding:"4px 12px", fontSize:13 },
  addBtn:     { background:"rgba(96,165,250,0.15)", border:"1px solid rgba(96,165,250,0.3)", color:"#60a5fa", borderRadius:6, padding:"6px 14px", cursor:"pointer", fontSize:13 },
};
