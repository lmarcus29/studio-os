import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import { LayoutDashboard, Users, FolderKanban, Package, Store, FileText, Calendar, CheckSquare, X, Trash2, Pencil, AlertCircle, Loader, Upload, FileImage, Download, Mail, TrendingUp, Folder, FolderOpen, Clock, MessageSquare, Menu, Settings } from 'lucide-react'
import { supabase } from './supabase.js'
import jsPDF from 'jspdf'

const WORKER_URL = 'https://studio-os-email.leighrossmarcus.workers.dev'

async function sendEmail(to, subject, html, fromName = 'Elegant Interiors') {
  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html, fromName })
    })
    return await res.json()
  } catch (err) {
    console.error('Email error:', err)
    return { error: err.message }
  }
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'items', label: 'Items', icon: Package },
  { id: 'vendors', label: 'Vendors', icon: Store },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'files', label: 'Files', icon: FileImage },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const PROJECT_STATUSES = ['Design Phase', 'Procurement', 'In Progress', 'On Hold', 'Complete']
const ITEM_STATUSES = ['To Order', 'Ordered', 'Arrived', 'Installed', 'Delayed']
const INVOICE_STATUSES = ['Pending', 'Paid', 'Overdue', 'Cancelled']
const TASK_PRIORITIES = ['Today', 'This Week', 'Upcoming']
const EVENT_TYPES = ['Meeting', 'Delivery', 'Site Visit', 'Billing', 'Other']

// ── SHARED UI ────────────────────────────────────────────

const inputClass = 'w-full px-3 py-2 text-sm focus:outline-none rounded'
const inputStyle = {border:'1px solid rgba(42,37,32,0.15)',background:'#FDFAF6',color:'#2A2520',fontFamily:"'DM Sans', sans-serif"}

function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2,'0')} ${period}`
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{fontFamily:"'DM Mono', monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.35rem',display:'block'}}>{label}</label>
      {children}
    </div>
  )
}

function ModalFooter({ onClose, onSave, valid, label, loading }) {
  return (
    <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1.5rem'}}>
      <button onClick={onClose} style={{padding:'0.5rem 1.1rem',fontSize:'0.78rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,background:'transparent',color:'#4A4540',cursor:'pointer'}}>Cancel</button>
      <button onClick={onSave} disabled={!valid || loading}
        style={{padding:'0.5rem 1.1rem',fontSize:'0.78rem',borderRadius:4,border:'none',color:'white',display:'flex',alignItems:'center',gap:'0.4rem',cursor: valid && !loading ? 'pointer' : 'not-allowed',background: valid && !loading ? '#C4622D' : '#C4B5A0'}}>
        {loading && <Loader size={14} className="animate-spin" />}
        {label}
      </button>
    </div>
  )
}

function Badge({ status }) {
  const colors = {
    Active: {background:'#EBF0EC',color:'#6B7C6E'},
    Lead: {background:'#F5EDD8',color:'#B8963E'},
    Inactive: {background:'#E8E0D5',color:'#8A8278'},
    'In Progress': {background:'#EBF0EC',color:'#6B7C6E'},
    Procurement: {background:'#E8E0D5',color:'#4A4540'},
    'Design Phase': {background:'#F5EDD8',color:'#B8963E'},
    'On Hold': {background:'#F5E8E5',color:'#C47A6B'},
    Complete: {background:'#E8E0D5',color:'#8A8278'},
    'To Order': {background:'#E8E0D5',color:'#8A8278'},
    Ordered: {background:'#E8E0D5',color:'#4A4540'},
    Arrived: {background:'#F5EDD8',color:'#B8963E'},
    Installed: {background:'#EBF0EC',color:'#6B7C6E'},
    Delayed: {background:'#F5E8E5',color:'#C47A6B'},
    Pending: {background:'#F5EDD8',color:'#B8963E'},
    Paid: {background:'#EBF0EC',color:'#6B7C6E'},
    Overdue: {background:'#F5E6DE',color:'#C4622D'},
    Cancelled: {background:'#E8E0D5',color:'#8A8278'},
    Meeting: {background:'#F5EDD8',color:'#B8963E'},
    Delivery: {background:'#EBF0EC',color:'#6B7C6E'},
    'Site Visit': {background:'#E8E0D5',color:'#4A4540'},
    Billing: {background:'#F5E8E5',color:'#C47A6B'},
    Other: {background:'#E8E0D5',color:'#8A8278'},
  }
  const s = colors[status] || {background:'#E8E0D5',color:'#8A8278'}
  return <span style={{...s,padding:'0.2rem 0.6rem',borderRadius:10,fontSize:'0.72rem',fontFamily:"'DM Mono', monospace",letterSpacing:'0.03em'}}>{status}</span>
}

function Actions({ onEdit, onDelete }) {
  return (
    <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
      <button onClick={onEdit} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Pencil size={15} /></button>
      <button onClick={onDelete} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Trash2 size={15} /></button>
    </div>
  )
}

function ConfirmDeleteModal({ name, onConfirm, onCancel, loading }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(42,37,32,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
      <div style={{background:'#FDFAF6',borderRadius:8,boxShadow:'0 8px 40px rgba(42,37,32,0.15)',padding:'1.5rem',width:'100%',maxWidth:380}}>
        <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.3rem',fontWeight:400,color:'#2A2520',marginBottom:'0.5rem'}}>Confirm Delete</h3>
        <p style={{fontSize:'0.82rem',color:'#8A8278',marginBottom:'1.5rem'}}>Are you sure you want to delete <span style={{color:'#2A2520',fontWeight:500}}>{name}</span>? This cannot be undone.</p>
        <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{padding:'0.5rem 1.1rem',fontSize:'0.78rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,background:'transparent',color:'#4A4540',cursor:'pointer'}}>Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            style={{padding:'0.5rem 1.1rem',fontSize:'0.78rem',borderRadius:4,border:'none',background:'#C4622D',color:'white',display:'flex',alignItems:'center',gap:'0.4rem',cursor:'pointer',opacity: loading ? 0.6 : 1}}>
            {loading && <Loader size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'4rem 0'}}>
      <Loader size={24} className="animate-spin" style={{color:'#C4622D'}} />
    </div>
  )
}

// ── AUTH ─────────────────────────────────────────────────

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setError(error.message)
        else setMessage('Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) setError(error.message)
        else setMessage('Password reset email sent.')
      }
    } catch(err) {
      console.error('Load error:', err)
      if (typeof showToast === 'function') showToast('Connection error. Please refresh.')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',background:'#F7F3EE',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#FDFAF6',borderRadius:8,boxShadow:'0 8px 40px rgba(42,37,32,0.12)',padding:'2rem',width:'100%',maxWidth:360}}>
        <div className="text-center mb-8">
          <h1 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.8rem',fontWeight:300,color:'#2A2520',letterSpacing:'0.02em'}}>Studio OS</h1>
          <p style={{fontSize:'0.65rem',color:'#8A8278',marginTop:'0.25rem',fontFamily:"'DM Mono', monospace",letterSpacing:'0.1em',textTransform:'uppercase'}}>Interior Design Studio</p>
        </div>
        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.2rem',fontWeight:400,color:'#2A2520',marginBottom:'1.25rem'}}>
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label style={{fontFamily:"'DM Mono', monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.35rem',display:'block'}}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className={inputClass} />
          </div>
          {mode !== 'reset' && (
            <div>
              <label style={{fontFamily:"'DM Mono', monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.35rem',display:'block'}}>Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className={inputClass} />
            </div>
          )}
        </div>
        {error && <p style={{marginTop:'0.75rem',fontSize:'0.78rem',color:'#C4622D'}}>{error}</p>}
        {message && <p style={{marginTop:'0.75rem',fontSize:'0.78rem',color:'#6B7C6E'}}>{message}</p>}
        <button onClick={handleSubmit} disabled={loading}
          style={{marginTop:'1.25rem',width:'100%',background:'#C4622D',color:'white',padding:'0.6rem',borderRadius:4,fontSize:'0.82rem',fontWeight:500,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',opacity: loading ? 0.6 : 1}}>
          {loading && <Loader size={14} className="animate-spin" />}
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
        </button>
        <div style={{marginTop:'1rem',display:'flex',flexDirection:'column',gap:'0.5rem',textAlign:'center'}}>
          {mode === 'login' && <>
            <button onClick={() => setMode('signup')} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.75rem',color:'#8A8278'}}>Don't have an account? Sign up</button>
            <button onClick={() => setMode('reset')} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.75rem',color:'#8A8278'}}>Forgot password?</button>
          </>}
          {mode !== 'login' && <button onClick={() => setMode('login')} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.75rem',color:'#8A8278'}}>Back to sign in</button>}
        </div>
      </div>
    </div>
  )
}

// ── APP ROOT ─────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [vendors, setVendors] = useState([])
  const [items, setItems] = useState([])
  const [invoices, setInvoices] = useState([])
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [payments, setPayments] = useState([])
  const [timeLogs, setTimeLogs] = useState([])
  const [fileMetadata, setFileMetadata] = useState([])
  const [studioProfile, setStudioProfile] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [detailClient, setDetailClient] = useState(null)
  const [detailProject, setDetailProject] = useState(null)
  const [detailType, setDetailType] = useState(null)
  const [persistItemModal, setPersistItemModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  function showToast(msg, type='error') {
    setToast({msg, type})
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadAll = useCallback(async () => {
    setDataLoading(true)
    const [c, p, v, i, inv, t, e, pay, tl, fm, sp] = await Promise.all([
      supabase.from('clients').select('*').order('created_at'),
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('vendors').select('*').order('created_at'),
      supabase.from('items').select('*').order('created_at'),
      supabase.from('invoices').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('events').select('*').order('created_at'),
      supabase.from('payments').select('*').order('created_at'),
      supabase.from('time_logs').select('*').order('created_at'),
      supabase.from('file_metadata').select('*').order('created_at'),
      supabase.from('studio_profile').select('*').limit(1).single(),
    ])
    setClients(c.data || [])
    setProjects(p.data || [])
    setVendors(v.data || [])
    setItems(i.data || [])
    setInvoices(inv.data || [])
    setTasks(t.data || [])
    setEvents(e.data || [])
    setPayments(pay.data || [])
    setTimeLogs(tl.data || [])
    setFileMetadata(fm.data || [])
    setStudioProfile(sp.data || null)
    if (!sp.data || !sp.data.onboarding_complete) setShowOnboarding(true)
    setDataLoading(false)
  }, [])

  useEffect(() => {
    if (session) loadAll()
  }, [session, loadAll])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader size={24} className="animate-spin" style={{color:"#C4622D"}} />
      </div>
    )
  }

  if (!session) return <AuthScreen />

  async function completeOnboarding() {
    const { data: { user } } = await supabase.auth.getUser()
    if (studioProfile?.id) {
      await supabase.from('studio_profile').update({ onboarding_complete: true }).eq('id', studioProfile.id)
    } else {
      await supabase.from('studio_profile').insert({ user_id: user.id, studio_name: 'My Studio', onboarding_complete: true })
    }
    setShowOnboarding(false)
    loadAll()
  }
    if (!clientId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('activity_log').insert({ user_id: user.id, client_id: clientId, type, classification, subject, body })
  }

  const shared = { clients, projects, vendors, items, invoices, tasks, events, payments, timeLogs, fileMetadata, studioProfile, reload: loadAll, persistItemModal, setPersistItemModal, showToast, logClientActivity }

  const isMobile = window.innerWidth < 768

  return (
    <>
<div className="h-screen flex flex-col overflow-hidden" style={{background:'#F7F3EE',fontFamily:"'DM Sans', sans-serif"}}>
      {/* Top bar */}
      <header style={{height:'52px',background:'#2A2520',display:'flex',alignItems:'center',padding:'0 1rem',gap:'1rem',flexShrink:0,zIndex:100}}>
        {isMobile && (
          <button onClick={() => setMobileNavOpen(o => !o)} style={{background:'none',border:'none',cursor:'pointer',color:'#F7F3EE',display:'flex',alignItems:'center',padding:'0.25rem'}}>
            <Menu size={20} />
          </button>
        )}
        <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.25rem',fontWeight:300,color:'#F7F3EE',letterSpacing:'0.05em'}}>
          {studioProfile?.studio_name || 'Elegant Interiors'}
        </span>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'0.75rem'}}>
          {!isMobile && (
            <span style={{fontSize:'0.78rem',color:'#C4B5A0'}}>{session.user.email}</span>
          )}
          <div style={{width:30,height:30,borderRadius:'50%',background:'#C4622D',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:600,color:'white',letterSpacing:'0.05em'}}>
            {session.user.email.substring(0, 2).toUpperCase()}
          </div>
          <button onClick={() => supabase.auth.signOut()}
            style={{fontSize:'0.72rem',color:'#8A8278',background:'transparent',border:'1px solid rgba(42,37,32,0.3)',padding:'0.25rem 0.75rem',borderRadius:4,cursor:'pointer'}}>
            {isMobile ? '←' : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {isMobile && mobileNavOpen && (
        <div style={{position:'fixed',inset:0,zIndex:200,display:'flex'}}>
          <div style={{width:220,background:'#FDFAF6',borderRight:'1px solid rgba(42,37,32,0.1)',display:'flex',flexDirection:'column',boxShadow:'4px 0 20px rgba(42,37,32,0.15)'}}>
            <div style={{padding:'1rem 0.75rem 0.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(42,37,32,0.08)',marginBottom:'0.5rem'}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.55rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'#C4B5A0'}}>Workspace</span>
              <button onClick={() => setMobileNavOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#8A8278'}}><X size={16}/></button>
            </div>
            <div style={{padding:'0 0.75rem'}}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setActiveTab(id); setDetailClient(null); setDetailProject(null); setDetailType(null); setMobileNavOpen(false) }} style={{
                  display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.65rem 0.75rem',borderRadius:6,cursor:'pointer',
                  fontSize:'0.85rem',width:'100%',textAlign:'left',border:'none',marginBottom:'0.2rem',
                  background: activeTab === id ? '#F5E6DE' : 'transparent',
                  color: activeTab === id ? '#C4622D' : '#4A4540',
                  fontWeight: activeTab === id ? 500 : 400,
                }}>
                  <Icon size={16} style={{flexShrink:0,opacity: activeTab === id ? 1 : 0.7}} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{flex:1,background:'rgba(42,37,32,0.4)'}} onClick={() => setMobileNavOpen(false)} />
        </div>
      )}

      {/* Body: sidebar + main */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* Sidebar — desktop only */}
        {!isMobile && (
          <nav style={{width:200,background:'#FDFAF6',borderRight:'1px solid rgba(42,37,32,0.1)',display:'flex',flexDirection:'column',flexShrink:0,overflowY:'auto'}}>
            <div style={{padding:'1.25rem 0.75rem 0.5rem'}}>
              <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.55rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'#C4B5A0',padding:'0 0.5rem',marginBottom:'0.4rem'}}>Workspace</div>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setActiveTab(id); setDetailClient(null); setDetailProject(null); setDetailType(null) }} style={{
                  display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.55rem 0.75rem',borderRadius:6,cursor:'pointer',
                  fontSize:'0.82rem',width:'100%',textAlign:'left',border:'none',marginBottom:'0.15rem',transition:'all 0.15s',
                  background: activeTab === id ? '#F5E6DE' : 'transparent',
                  color: activeTab === id ? '#C4622D' : '#4A4540',
                  fontWeight: activeTab === id ? 500 : 400,
                }}>
                  <Icon size={15} style={{flexShrink:0,opacity: activeTab === id ? 1 : 0.7}} />
                  {label}
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* Main content */}
        <main style={{flex:1,overflowY:'auto',background:'#F7F3EE'}}>
          <div style={{padding: isMobile ? '1rem' : '1.5rem 2rem',flex:1}}>
            {dataLoading ? <LoadingSpinner /> : <>
              {detailType === 'client' && detailClient && <ClientDetail client={detailClient} {...shared} onBack={() => { setDetailClient(null); setDetailType(null) }} setDetailProject={(p) => { setDetailProject(p); setDetailType('project') }} />}
              {detailType === 'project' && detailProject && <ProjectDetail project={detailProject} {...shared} onBack={() => { setDetailProject(null); setDetailType(detailClient ? 'client' : null) }} backLabel={detailClient ? 'Back to Client' : 'Back to Projects'} />}
              {!detailType && <>
                {activeTab === 'dashboard' && <Dashboard {...shared} />}
                {activeTab === 'clients' && <Clients {...shared} setDetailClient={(c) => { setDetailClient(c); setDetailType('client') }} />}
                {activeTab === 'projects' && <Projects {...shared} setDetailProject={(p) => { setDetailProject(p); setDetailType('project') }} />}
                {activeTab === 'items' && <Items {...shared} clients={clients} />}
                {activeTab === 'vendors' && <Vendors {...shared} />}
                {activeTab === 'invoices' && <Invoices {...shared} />}
                {activeTab === 'calendar' && <CalendarView {...shared} />}
                {activeTab === 'tasks' && <Tasks {...shared} />}
                {activeTab === 'files' && <Files {...shared} />}
                {activeTab === 'revenue' && <RevenueReport {...shared} />}
                {activeTab === 'settings' && <StudioSettings studioProfile={studioProfile} reload={loadAll} showToast={showToast} />}
              </>}
            </>}
          </div>
        </main>
      </div>
    </div>
    {/* Toast notifications */}
    {toast && (
      <div style={{position:'fixed',bottom:'1.5rem',left:'50%',transform:'translateX(-50%)',background:toast.type==='error'?'#C4622D':toast.type==='success'?'#6B7C6E':'#2A2520',color:'white',padding:'0.75rem 1.5rem',borderRadius:6,fontSize:'0.85rem',fontWeight:500,boxShadow:'0 4px 20px rgba(0,0,0,0.25)',zIndex:100,maxWidth:400,textAlign:'center'}}>
        {toast.type==='error'?'⚠️ ':'✓ '}{toast.msg}
      </div>
    )}
    {showOnboarding && (
      <OnboardingModal
        studioProfile={studioProfile}
        onComplete={completeOnboarding}
        onSkip={completeOnboarding}
        onGoToSettings={() => { setShowOnboarding(false); setActiveTab('settings') }}
        onGoToClients={() => { setShowOnboarding(false); setActiveTab('clients') }}
      />
    )}
    {persistItemModal && (
      <ItemModal
        item={persistItemModal === 'add' ? null : persistItemModal}
        projects={projects}
        vendors={vendors}
        clients={clients}
        onSave={async (form, setLoading) => {
          setLoading(true)
          const data = {
            ...form,
            cost: Number(form.cost) || 0,
            retail_cost: Number(form.retail_cost) || 0,
            quantity: Number(form.quantity) || 1,
            project_id: form.project_id || null,
            client_id: form.client_id || null,
            vendor_id: form.vendor_id || null,
          }
          const user_id = (await supabase.auth.getUser()).data.user.id
          if (persistItemModal === 'add') await supabase.from('items').insert({ ...data, user_id })
          else await supabase.from('items').update(data).eq('id', persistItemModal.id)
          setLoading(false)
          setPersistItemModal(null)
          loadAll()
        }}
        onClose={() => setPersistItemModal(null)}
      />
    )}
    </>
  )
}

// ── MODALS ───────────────────────────────────────────────

function ClientModal({ client, onSave, onClose }) {
  const [form, setForm] = useState(client || { name: '', email: '', phone: '', name2: '', email2: '', phone2: '', street: '', city: '', state: '', zip: '', status: 'Active', notes: '', billing_type: 'commission', commission_rate: '', hourly_rate: '', retainer_balance: '0' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.name.trim()
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(42,37,32,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
      <div style={{background:'#FDFAF6',borderRadius:8,boxShadow:'0 8px 40px rgba(42,37,32,0.15)',padding:'1.5rem',width:'100%',maxWidth:460,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.3rem',fontWeight:400,color:'#2A2520'}}>{client ? 'Edit Client' : 'Add Client'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#8A8278'}}><X size={18} /></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>

          {/* Primary contact */}
          <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>Primary Contact</div>
          <Field label="Name *"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="First and last name" className={inputClass} style={inputStyle} /></Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Email"><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" className={inputClass} style={inputStyle} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(000) 000-0000" className={inputClass} style={inputStyle} /></Field>
          </div>

          {/* Secondary contact */}
          <div style={{borderTop:'1px solid rgba(42,37,32,0.08)',paddingTop:'1rem'}}>
            <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.75rem'}}>Secondary Contact</div>
            <Field label="Name"><input value={form.name2||''} onChange={e => set('name2', e.target.value)} placeholder="Spouse / partner name" className={inputClass} style={inputStyle} /></Field>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginTop:'0.75rem'}}>
              <Field label="Email"><input value={form.email2||''} onChange={e => set('email2', e.target.value)} placeholder="email@example.com" className={inputClass} style={inputStyle} /></Field>
              <Field label="Phone"><input value={form.phone2||''} onChange={e => set('phone2', e.target.value)} placeholder="(000) 000-0000" className={inputClass} style={inputStyle} /></Field>
            </div>
          </div>

          {/* Address */}
          <div style={{borderTop:'1px solid rgba(42,37,32,0.08)',paddingTop:'1rem'}}>
            <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.75rem'}}>Address</div>
            <Field label="Street"><input value={form.street||''} onChange={e => set('street', e.target.value)} placeholder="123 Main Street" className={inputClass} style={inputStyle} /></Field>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:'0.75rem',marginTop:'0.75rem'}}>
              <Field label="City"><input value={form.city||''} onChange={e => set('city', e.target.value)} placeholder="City" className={inputClass} style={inputStyle} /></Field>
              <Field label="State"><input value={form.state||''} onChange={e => set('state', e.target.value)} placeholder="NY" className={inputClass} style={inputStyle} /></Field>
              <Field label="Zip"><input value={form.zip||''} onChange={e => set('zip', e.target.value)} placeholder="11743" className={inputClass} style={inputStyle} /></Field>
            </div>
          </div>

          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass} style={inputStyle}>
              {['Active','Inactive','Lead'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          {/* Billing section */}
          <div style={{borderTop:'1px solid rgba(42,37,32,0.08)',paddingTop:'1rem',marginTop:'0.25rem'}}>
            <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.75rem'}}>Billing</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
              <Field label="Billing Type">
                <select value={form.billing_type} onChange={e => set('billing_type', e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="commission">Commission / Markup</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="both">Both</option>
                </select>
              </Field>
              {(form.billing_type === 'commission' || form.billing_type === 'both') && (
                <Field label="Commission Rate (%)">
                  <input type="number" value={form.commission_rate} onChange={e => set('commission_rate', e.target.value)} placeholder="30" className={inputClass} style={inputStyle} />
                </Field>
              )}
              {(form.billing_type === 'hourly' || form.billing_type === 'both') && (
                <Field label="Hourly Rate ($)">
                  <input type="number" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} placeholder="150" className={inputClass} style={inputStyle} />
                </Field>
              )}
            </div>
          </div>
          <div style={{borderTop:'1px solid rgba(42,37,32,0.08)',paddingTop:'1rem',marginTop:'0.25rem'}}>
            <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.75rem'}}>Retainer</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
              <Field label="Retainer Balance ($)">
                <input type="number" value={form.retainer_balance} onChange={e => set('retainer_balance', e.target.value)} placeholder="0" className={inputClass} style={inputStyle} />
              </Field>
              <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'0.1rem'}}>
                <div style={{fontSize:'0.72rem',color:'#8A8278',lineHeight:1.4}}>Add to balance when retainer is received. Invoices will draw down from this amount.</div>
              </div>
            </div>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Referral source, preferences…" className={inputClass} style={inputStyle} /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form, setLoading)} valid={valid} loading={loading} label={client ? 'Save Changes' : 'Add Client'} />
      </div>
    </div>
  )
}

function ProjectModal({ project, clients, onSave, onClose }) {
  const [form, setForm] = useState(project || { name: '', client_id: clients[0]?.id || '', status: 'Design Phase', budget: '', spent: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.name.trim()
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{project ? 'Edit Project' : 'Add Project'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Project Name *"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Riverside Living Room" className={inputClass} /></Field>
          <Field label="Client">
            <select value={form.client_id || ''} onChange={e => set('client_id', e.target.value)} className={inputClass}>
              <option value="">— None —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
              {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget ($)"><input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0" className={inputClass} /></Field>
            <Field label="Spent ($)"><input type="number" value={form.spent} onChange={e => set('spent', e.target.value)} placeholder="0" className={inputClass} /></Field>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Style notes, requirements…" className={inputClass} /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form, setLoading)} valid={valid} loading={loading} label={project ? 'Save Changes' : 'Add Project'} />
      </div>
    </div>
  )
}

function VendorModal({ vendor, onSave, onClose }) {
  const [form, setForm] = useState(vendor || { name: '', rep: '', email: '', phone: '', discount: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.name.trim()
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{vendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Vendor Name *"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. RH, Visual Comfort" className={inputClass} /></Field>
          <Field label="Rep Name"><input value={form.rep} onChange={e => set('rep', e.target.value)} placeholder="Sales rep name" className={inputClass} /></Field>
          <Field label="Email"><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="rep@vendor.com" className={inputClass} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(000) 000-0000" className={inputClass} /></Field>
          <Field label="Trade Discount"><input value={form.discount} onChange={e => set('discount', e.target.value)} placeholder="e.g. 40% trade" className={inputClass} /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Account numbers, payment terms…" className={inputClass} /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form, setLoading)} valid={valid} loading={loading} label={vendor ? 'Save Changes' : 'Add Vendor'} />
      </div>
    </div>
  )
}

function ItemModal({ item, projects, vendors, clients, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    name: '', client_id: '', project_id: '', vendor_id: '', cost: '', retail_cost: '',
    status: 'To Order', sku: '', brand: '', url: '', dimensions: '', finish: '',
    lead_time: '', room: '', location_in_home: '', order_date: '', arrival_date: '',
    quantity: '1', notes: '', image_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.name.trim()
  const clientProjects = projects.filter(p => p.client_id === form.client_id)

  async function fetchFromUrl() {
    if (!form.url) return
    setFetching(true)
    try {
      // Use allorigins as a CORS proxy to fetch page metadata
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(form.url)}`
      const res = await fetch(proxyUrl)
      const data = await res.json()
      const html = data.contents || ''
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const ogTitle = html.match(/<meta[^>]*property=["\'"]og:title["\'"][^>]*content=["\'"]([^\"]+)["\'"][^>]*>/i)
      const ogImage = html.match(/<meta[^>]*property=["\'"]og:image["\'"][^>]*content=["\'"]([^\"]+)["\'"][^>]*>/i)
      const ogPrice = html.match(/itemprop=["\'"]price["\'"][^>]*content=["\'"]([\d\.]+)["\'"][^>]*>/i)
      const title = ogTitle?.[1] || titleMatch?.[1] || ''
      const image = ogImage?.[1] || ''
      const price = ogPrice?.[1] || ''
      if (title) set('name', title.trim().substring(0, 80))
      if (image) set('image_url', image)
      if (price) set('cost', price)
    } catch (err) {
      console.error('Fetch failed:', err)
    }
    setFetching(false)
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/items/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('studio-files').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('studio-files').getPublicUrl(path)
      set('image_url', data.publicUrl)
    }
    setUploading(false)
    e.target.value = ''
  }

  const sectionLabel = (text) => (
    <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginTop:'0.5rem',marginBottom:'0.25rem',borderTop:'1px solid rgba(42,37,32,0.06)',paddingTop:'0.75rem'}}>{text}</div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(42,37,32,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
      <div style={{background:'#FDFAF6',borderRadius:8,boxShadow:'0 8px 40px rgba(42,37,32,0.15)',padding:'1.5rem',width:'100%',maxWidth:600,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.3rem',fontWeight:400,color:'#2A2520'}}>{item ? 'Edit Item' : 'Add Item'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#8A8278'}}><X size={18}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>

          {/* Core info */}
          <Field label="Item Name *"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cloud Sofa, Beni Ourain Rug" className={inputClass} style={inputStyle}/></Field>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Brand / Manufacturer"><input value={form.brand||''} onChange={e => set('brand', e.target.value)} placeholder="e.g. RH, Visual Comfort" className={inputClass} style={inputStyle}/></Field>
            <Field label="SKU / Item #"><input value={form.sku||''} onChange={e => set('sku', e.target.value)} placeholder="e.g. SKU-12345" className={inputClass} style={inputStyle}/></Field>
          </div>

          <div style={{display:'flex',gap:'0.5rem',alignItems:'flex-end'}}>
            <div style={{flex:1}}><Field label="Product URL"><input value={form.url||''} onChange={e => set('url', e.target.value)} placeholder="https://www.vendor.com/product" className={inputClass} style={inputStyle}/></Field></div>
            <button onClick={fetchFromUrl} disabled={!form.url || fetching}
              style={{padding:'0.5rem 0.9rem',borderRadius:4,border:'1px solid rgba(42,37,32,0.15)',background: form.url && !fetching ? '#2A2520' : '#E8E0D5',color: form.url && !fetching ? 'white' : '#8A8278',fontSize:'0.72rem',cursor: form.url ? 'pointer' : 'not-allowed',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:'0.3rem',flexShrink:0}}>
              {fetching ? <Loader size={12} className="animate-spin"/> : null}
              {fetching ? 'Fetching…' : 'Auto-fill'}
            </button>
          </div>

          {sectionLabel('Assignment')}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Client">
              <select value={form.client_id||''} onChange={e => { set('client_id', e.target.value); set('project_id', '') }} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {(clients||[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Project">
              <select value={form.project_id||''} onChange={e => set('project_id', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {(form.client_id ? clientProjects : projects).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Vendor">
              <select value={form.vendor_id||''} onChange={e => set('vendor_id', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </Field>
            <Field label="Room / Location">
              <select value={form.room||''} onChange={e => set('room', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {ROOM_TYPES.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Location in Home"><input value={form.location_in_home||''} onChange={e => set('location_in_home', e.target.value)} placeholder="e.g. North wall, left of fireplace" className={inputClass} style={inputStyle}/></Field>

          {sectionLabel('Pricing & Details')}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
            <Field label="Trade Cost ($)"><input type="number" value={form.cost||''} onChange={e => set('cost', e.target.value)} placeholder="0" className={inputClass} style={inputStyle}/></Field>
            <Field label="Retail Price ($)"><input type="number" value={form.retail_cost||''} onChange={e => set('retail_cost', e.target.value)} placeholder="0" className={inputClass} style={inputStyle}/></Field>
            <Field label="Quantity"><input type="number" value={form.quantity||'1'} onChange={e => set('quantity', e.target.value)} placeholder="1" className={inputClass} style={inputStyle}/></Field>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Dimensions"><input value={form.dimensions||''} onChange={e => set('dimensions', e.target.value)} placeholder="W x D x H" className={inputClass} style={inputStyle}/></Field>
            <Field label="Finish / Color"><input value={form.finish||''} onChange={e => set('finish', e.target.value)} placeholder="e.g. Antique Brass, Sand" className={inputClass} style={inputStyle}/></Field>
          </div>

          {sectionLabel('Status & Timeline')}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass} style={inputStyle}>
                {ITEM_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Order Date"><input type="date" value={form.order_date||''} onChange={e => set('order_date', e.target.value)} className={inputClass} style={inputStyle}/></Field>
            <Field label="Est. Arrival"><input type="date" value={form.arrival_date||''} onChange={e => set('arrival_date', e.target.value)} className={inputClass} style={inputStyle}/></Field>
          </div>
          <Field label="Lead Time"><input value={form.lead_time||''} onChange={e => set('lead_time', e.target.value)} placeholder="e.g. 8-10 weeks" className={inputClass} style={inputStyle}/></Field>

          {sectionLabel('Image')}
          {form.image_url && (
            <div style={{position:'relative',width:'100%',height:160,borderRadius:6,overflow:'hidden',background:'#E8E0D5'}}>
              <img src={form.image_url} alt="Item" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              <button onClick={() => set('image_url','')} style={{position:'absolute',top:8,right:8,background:'rgba(42,37,32,0.6)',border:'none',borderRadius:4,color:'white',cursor:'pointer',padding:'0.2rem 0.5rem',fontSize:'0.7rem'}}>Remove</button>
            </div>
          )}
          <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
            <label style={{display:'inline-flex',alignItems:'center',gap:'0.4rem',background: uploading ? '#C4B5A0' : '#6B7C6E',color:'white',padding:'0.4rem 0.9rem',borderRadius:4,fontSize:'0.75rem',cursor: uploading ? 'not-allowed' : 'pointer'}}>
              {uploading ? <Loader size={13} className="animate-spin"/> : <Upload size={13}/>}
              {uploading ? 'Uploading…' : 'Upload Image'}
              <input type="file" accept="image/*" style={{display:'none'}} onChange={handleImageUpload} disabled={uploading}/>
            </label>
            <span style={{fontSize:'0.72rem',color:'#8A8278'}}>or</span>
            <input value={form.image_url||''} onChange={e => set('image_url', e.target.value)} placeholder="Paste image URL" className={inputClass} style={{...inputStyle,flex:1}}/>
          </div>

          {sectionLabel('Notes')}
          <Field label="Notes"><textarea value={form.notes||''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="PO number, tracking info, special instructions, care notes…" className={inputClass} style={inputStyle}/></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form, setLoading)} valid={valid} loading={loading} label={item ? 'Save Changes' : 'Add Item'}/>
      </div>
    </div>
  )
}

function InvoiceModal({ invoice, clients, projects, items, onSave, onClose }) {
  const defaultLineItems = invoice?.line_items?.length ? invoice.line_items : [{ description: '', amount: '' }]
  const autoNum = `INV-${String(Date.now()).slice(-4)}`
  const [form, setForm] = useState(invoice || { num: autoNum, client_id: clients[0]?.id || '', project_id: '', due: '', status: 'Pending', notes: '', tax_rate: '8.95', retainer_amount: '0', retainer_applied: '0' })
  const [lineItems, setLineItems] = useState(defaultLineItems)
  const [loading, setLoading] = useState(false)
  const [showItemPicker, setShowItemPicker] = useState(false)
  const [selectedItems, setSelectedItems] = useState({})
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const clientProjects = projects.filter(p => p.client_id === form.client_id)
  const clientItems = items.filter(i => i.project_id === form.project_id)

  function setLine(idx, field, value) {
    setLineItems(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }
  function addLine() { setLineItems(prev => [...prev, { description: '', amount: '' }]) }
  function removeLine(idx) { setLineItems(prev => prev.filter((_, i) => i !== idx)) }
  function pullFromItems() {
    setSelectedItems({})
    setShowItemPicker(true)
  }

  function confirmItemSelection() {
    const chosen = clientItems.filter(i => selectedItems[i.id])
    const newLines = chosen.map(i => ({ description: i.name, amount: String(i.cost || ''), item_id: i.id, taxable: true }))
    setLineItems(prev => [...prev.filter(l => l.description || l.amount), ...newLines])
    setShowItemPicker(false)
    setSelectedItems({})
  }

  const subtotal = lineItems.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)
  const taxableSubtotal = lineItems.reduce((sum, l) => l.taxable === false ? sum : sum + (Number(l.amount) || 0), 0)
  const taxAmount = taxableSubtotal * (Number(form.tax_rate) || 0) / 100
  const retainerApplied = Math.min(Number(form.retainer_applied) || 0, subtotal + taxAmount)
  const total = subtotal + taxAmount - retainerApplied

  const valid = form.num.trim() && lineItems.some(l => l.description.trim())

  function handleSave() {
    const amount = total
    onSave({ ...form, line_items: lineItems, amount }, setLoading)
  }

  return (
    <>
    <div style={{position:'fixed',inset:0,background:'rgba(42,37,32,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
      <div style={{background:'#FDFAF6',borderRadius:8,boxShadow:'0 8px 40px rgba(42,37,32,0.15)',padding:'1.5rem',width:'100%',maxWidth:580,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.3rem',fontWeight:400,color:'#2A2520'}}>{invoice ? 'Edit Invoice' : 'New Invoice'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#8A8278'}}><X size={18} /></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>

          {/* Invoice # and status */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Invoice # *"><input value={form.num} onChange={e => set('num', e.target.value)} placeholder="INV-1001" className={inputClass} style={inputStyle} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass} style={inputStyle}>
                {INVOICE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          {/* Client and project */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Client">
              <select value={form.client_id || ''} onChange={e => { set('client_id', e.target.value); set('project_id', '') }} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Project">
              <select value={form.project_id || ''} onChange={e => set('project_id', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>

          {/* Due date */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Due Date"><input type="date" value={form.due} onChange={e => set('due', e.target.value)} className={inputClass} style={inputStyle} /></Field>
            <Field label="Tax Rate (%)"><input type="number" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} placeholder="0" className={inputClass} style={inputStyle} /></Field>
          </div>

          {/* Line items */}
          <div style={{borderTop:'1px solid rgba(42,37,32,0.08)',paddingTop:'1rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.75rem'}}>
              <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>Line Items</div>
              {form.project_id && clientItems.length > 0 && (
                <button onClick={pullFromItems} style={{fontSize:'0.72rem',color:'#C4622D',background:'none',border:'1px solid #C4622D',borderRadius:4,padding:'0.2rem 0.6rem',cursor:'pointer'}}>
                  + Pull from Items
                </button>
              )}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 120px 32px',gap:'0.5rem'}}>
                <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C4B5A0'}}>Description</div>
                <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C4B5A0'}}>Amount ($)</div>
                <div />
              </div>
              {lineItems.map((line, idx) => (
                <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 120px 32px',gap:'0.5rem',alignItems:'center'}}>
                  <input value={line.description} onChange={e => setLine(idx, 'description', e.target.value)}
                    placeholder="Item or service description" className={inputClass} style={inputStyle} />
                  <input type="number" value={line.amount} onChange={e => setLine(idx, 'amount', e.target.value)}
                    placeholder="0" className={inputClass} style={inputStyle} />
                  <button onClick={() => removeLine(idx)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button onClick={addLine} style={{alignSelf:'flex-start',fontSize:'0.75rem',color:'#6B7C6E',background:'none',border:'1px dashed rgba(42,37,32,0.2)',borderRadius:4,padding:'0.3rem 0.75rem',cursor:'pointer',marginTop:'0.25rem'}}>
                + Add Line
              </button>
              {(() => {
                const client = clients.find(c => c.id === form.client_id)
                if (!client) return null
                return (
                  <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginTop:'0.25rem'}}>
                    {(client.billing_type === 'commission' || client.billing_type === 'both') && (
                      <button onClick={() => {
                        const billableTotal = lineItems.reduce((s, l) => s + (Number(l.amount) || 0), 0)
                        const commission = billableTotal * (Number(client.commission_rate) || 0) / 100
                        setLineItems(prev => [...prev, { description: `Design Commission (${client.commission_rate}% markup on $${billableTotal.toLocaleString()})`, amount: String(commission.toFixed(2)), taxable: false }])
                      }} style={{fontSize:'0.75rem',color:'#B8963E',background:'none',border:'1px dashed #B8963E',borderRadius:4,padding:'0.3rem 0.75rem',cursor:'pointer'}}>
                        + Add Commission Line
                      </button>
                    )}
                    {(client.billing_type === 'hourly' || client.billing_type === 'both') && (
                      <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                        <input type="number" id="hourly-input" placeholder="Hours" style={{width:70,padding:'0.3rem 0.5rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,fontSize:'0.78rem',background:'#FDFAF6'}} />
                        <button onClick={() => {
                          const hrs = Number(document.getElementById('hourly-input').value) || 0
                          const fee = hrs * (Number(client.hourly_rate) || 0)
                          setLineItems(prev => [...prev, { description: `Design Services (${hrs} hrs @ $${client.hourly_rate}/hr)`, amount: String(fee.toFixed(2)), taxable: false }])
                        }} style={{fontSize:'0.75rem',color:'#6B7C6E',background:'none',border:'1px dashed #6B7C6E',borderRadius:4,padding:'0.3rem 0.75rem',cursor:'pointer'}}>
                          + Add Hourly Line
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Retainer */}
          {(() => {
            const client = clients.find(c => c.id === form.client_id)
            const balance = Number(client?.retainer_balance || 0)
            return balance > 0 ? (
              <div style={{borderTop:'1px solid rgba(42,37,32,0.08)',paddingTop:'1rem'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.75rem'}}>
                  <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>Retainer</div>
                  <div style={{fontSize:'0.72rem',color:'#6B7C6E'}}>Available balance: <span style={{fontWeight:600}}>${balance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <Field label="Apply Retainer ($)">
                    <input type="number" value={form.retainer_applied}
                      onChange={e => set('retainer_applied', Math.min(Number(e.target.value), balance, subtotal + taxAmount).toString())}
                      placeholder="0" className={inputClass} style={inputStyle} />
                  </Field>
                  <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'0.1rem'}}>
                    <button onClick={() => set('retainer_applied', Math.min(balance, subtotal + taxAmount).toString())}
                      style={{fontSize:'0.72rem',color:'#C4622D',background:'none',border:'1px solid #C4622D',borderRadius:4,padding:'0.3rem 0.6rem',cursor:'pointer'}}>
                      Apply Full Balance
                    </button>
                  </div>
                </div>
              </div>
            ) : null
          })()}

          {/* Totals */}
          <div style={{background:'#F7F3EE',border:'1px solid rgba(42,37,32,0.08)',borderRadius:6,padding:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',color:'#8A8278',marginBottom:'0.35rem'}}>
              <span>Subtotal</span><span>${subtotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </div>
            {Number(form.tax_rate) > 0 && taxableSubtotal > 0 && (
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',color:'#8A8278',marginBottom:'0.35rem'}}>
                <span>Tax ({form.tax_rate}% on taxable items)</span><span>${taxAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              </div>
            )}
            {retainerApplied > 0 && (
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',color:'#6B7C6E',marginBottom:'0.35rem'}}>
                <span>Retainer Applied</span><span>−${retainerApplied.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.92rem',fontWeight:600,color:'#2A2520',borderTop:'1px solid rgba(42,37,32,0.1)',paddingTop:'0.5rem',marginTop:'0.35rem'}}>
              <span>Total Due</span><span>${total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </div>
          </div>

          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Payment terms, notes…" className={inputClass} style={inputStyle} /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={handleSave} valid={valid} loading={loading} label={invoice ? 'Save Changes' : 'Create Invoice'} />
      </div>
    </div>
    {showItemPicker && (
      <div style={{position:'fixed',inset:0,background:'rgba(42,37,32,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60,padding:'1rem'}}>
        <div style={{background:'#FDFAF6',borderRadius:8,boxShadow:'0 8px 40px rgba(42,37,32,0.15)',padding:'1.5rem',width:'100%',maxWidth:480,maxHeight:'70vh',overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
            <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.2rem',fontWeight:400,color:'#2A2520'}}>Select Items to Bill</h3>
            <button onClick={() => setShowItemPicker(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#8A8278'}}><X size={18} /></button>
          </div>
          {clientItems.length === 0
            ? <p style={{color:'#8A8278',fontSize:'0.82rem',padding:'1rem 0'}}>No items found for this project</p>
            : <>
                <div style={{marginBottom:'0.75rem',fontSize:'0.72rem',color:'#8A8278',fontFamily:"'DM Mono',monospace",textTransform:'uppercase',letterSpacing:'0.1em'}}>
                  {Object.values(selectedItems).filter(Boolean).length} selected
                </div>
                {clientItems.map(item => (
                  <div key={item.id} onClick={() => setSelectedItems(p => ({...p, [item.id]: !p[item.id]}))}
                    style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem',borderRadius:6,marginBottom:'0.4rem',cursor:'pointer',
                    background: selectedItems[item.id] ? '#F5E6DE' : '#F7F3EE',border:`1px solid ${selectedItems[item.id] ? '#C4622D' : 'rgba(42,37,32,0.08)'}`}}>
                    <div style={{width:18,height:18,borderRadius:3,border:`2px solid ${selectedItems[item.id] ? '#C4622D' : 'rgba(42,37,32,0.2)'}`,background: selectedItems[item.id] ? '#C4622D' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {selectedItems[item.id] && <span style={{color:'white',fontSize:'0.7rem'}}>✓</span>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'0.85rem',fontWeight:500,color:'#2A2520'}}>{item.name}</div>
                      <div style={{fontSize:'0.72rem',color:'#8A8278',marginTop:2}}>
                        ${Number(item.cost).toLocaleString()} · <span style={{fontFamily:"'DM Mono',monospace"}}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid rgba(42,37,32,0.08)'}}>
                  <button onClick={() => setShowItemPicker(false)} style={{padding:'0.5rem 1rem',fontSize:'0.78rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,background:'transparent',color:'#4A4540',cursor:'pointer'}}>Cancel</button>
                  <button onClick={confirmItemSelection} disabled={!Object.values(selectedItems).some(Boolean)}
                    style={{padding:'0.5rem 1rem',fontSize:'0.78rem',borderRadius:4,border:'none',background: Object.values(selectedItems).some(Boolean) ? '#C4622D' : '#C4B5A0',color:'white',cursor:'pointer'}}>
                    Add {Object.values(selectedItems).filter(Boolean).length} Item{Object.values(selectedItems).filter(Boolean).length !== 1 ? 's' : ''}
                  </button>
                </div>
              </>
          }
        </div>
      </div>
    )}
    </>
  )
}

function TaskModal({ task, projects, clients, onSave, onClose }) {
  const [form, setForm] = useState(task || { title: '', priority: 'Today', done: false, client_id: '', project_id: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.title.trim()
  const clientProjects = projects.filter(p => p.client_id === form.client_id)
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(42,37,32,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
      <div style={{background:'#FDFAF6',borderRadius:8,boxShadow:'0 8px 40px rgba(42,37,32,0.15)',padding:'1.5rem',width:'100%',maxWidth:440,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.3rem',fontWeight:400,color:'#2A2520'}}>{task ? 'Edit Task' : 'Add Task'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#8A8278'}}><X size={18} /></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <Field label="Task *">
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be done?" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputClass} style={inputStyle}>
              {TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Client (optional)">
              <select value={form.client_id || ''} onChange={e => { set('client_id', e.target.value || ''); set('project_id', '') }} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Project (optional)">
              <select value={form.project_id || ''} onChange={e => set('project_id', e.target.value || '')} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {(form.client_id ? clientProjects : projects).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Additional details…" className={inputClass} style={inputStyle} />
          </Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form, setLoading)} valid={valid} loading={loading} label={task ? 'Save Changes' : 'Add Task'} />
      </div>
    </div>
  )
}

function EventModal({ event, onSave, onClose, clients }) {
  const [form, setForm] = useState(event || { title: '', date: '', time: '', duration: '', type: 'Meeting', location: '', notes: '', client_id: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.title.trim() && form.date
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(42,37,32,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
      <div style={{background:'#FDFAF6',borderRadius:8,boxShadow:'0 8px 40px rgba(42,37,32,0.15)',padding:'1.5rem',width:'100%',maxWidth:440,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.3rem',fontWeight:400,color:'#2A2520'}}>{event ? 'Edit Event' : 'Add Event'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#8A8278'}}><X size={18} /></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <Field label="Title *">
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event title" className={inputClass} style={inputStyle} />
          </Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Date *">
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Type">
              <select value={form.type} onChange={e => set('type', e.target.value)} className={inputClass} style={inputStyle}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Client">
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className={inputClass} style={inputStyle}>
              <option value="">General / Non-client</option>
              {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <Field label="Time">
              <input type="time" value={form.time || ''} onChange={e => set('time', e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Duration">
              <select value={form.duration || ''} onChange={e => set('duration', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">—</option>
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
              </select>
            </Field>
          </div>
          <Field label="Location">
            <input value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="Address, showroom, or video call link" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Agenda, prep needed…" className={inputClass} style={inputStyle} />
          </Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form, setLoading)} valid={valid} loading={loading} label={event ? 'Save Changes' : 'Add Event'} />
      </div>
    </div>
  )
}

// ── MODULES ──────────────────────────────────────────────

function Dashboard({ clients, projects, invoices, tasks, events }) {
  const activeProjects = projects.filter(p => p.status !== 'Complete').length
  const activeClients = clients.filter(c => c.status === 'Active').length
  const openInvoices = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').length
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue').length
  const todayTasks = tasks.filter(t => t.priority === 'Today' && !t.done).length
  const totalOutstanding = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((sum, i) => sum + Number(i.amount || 0), 0)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const todayTaskList = tasks.filter(t => t.priority === 'Today' && !t.done).slice(0, 6)
  const thisWeekTasks = tasks.filter(t => t.priority === 'This Week' && !t.done).slice(0, 4)

  const kpis = [
    { label: 'Active Projects', value: activeProjects, sub: `${projects.filter(p => p.status === 'Complete').length} complete` },
    { label: 'Outstanding', value: `$${totalOutstanding.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, sub: `${openInvoices} open invoice${openInvoices !== 1 ? 's' : ''}${overdueInvoices ? ` · ${overdueInvoices} overdue` : ''}` },
    { label: 'Active Clients', value: activeClients, sub: `${clients.filter(c => c.status === 'Lead').length} leads` },
    { label: 'Due Today', value: todayTasks, sub: `${tasks.filter(t => !t.done).length} total open tasks` },
  ]

  const eventTypeColors = {
    Meeting: {background:'#F5EDD8',color:'#B8963E'},
    Delivery: {background:'#EBF0EC',color:'#6B7C6E'},
    'Site Visit': {background:'#E8E0D5',color:'#4A4540'},
    Billing: {background:'#F5E8E5',color:'#C47A6B'},
    Other: {background:'#E8E0D5',color:'#8A8278'},
  }

  return (
    <div>
      {/* Page header */}
      <div style={{marginBottom:'1.5rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520',letterSpacing:'-0.01em'}}>Dashboard</h2>
          <p style={{fontSize:'0.78rem',color:'#8A8278',marginTop:'0.1rem'}}>{today.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</p>
        </div>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'#C4B5A0',letterSpacing:'0.1em'}}>v09</span>
      </div>

      {/* KPI row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.5rem'}}>
        {kpis.map(({ label, value, sub }) => (
          <div key={label} style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem'}}>
            <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.35rem'}}>{label}</div>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'2rem',fontWeight:400,lineHeight:1,color:'#2A2520'}}>{value}</div>
            <div style={{fontSize:'0.72rem',color:'#8A8278',marginTop:'0.25rem'}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'1.25rem'}}>

        {/* Left: Active Projects */}
        <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
          <div style={{padding:'0.9rem 1.25rem',borderBottom:'1px solid rgba(42,37,32,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>Active Projects</span>
            <span style={{fontSize:'0.72rem',color:'#C4622D'}}>{activeProjects} active</span>
          </div>
          {projects.filter(p => p.status !== 'Complete').length === 0
            ? <p style={{padding:'2rem',textAlign:'center',fontSize:'0.82rem',color:'#8A8278'}}>No active projects yet</p>
            : <table style={{width:'100%',fontSize:'0.82rem',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(42,37,32,0.06)'}}>
                    {['Project','Client','Status','Budget'].map(h => (
                      <th key={h} style={{padding:'0.6rem 1.25rem',textAlign:'left',fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#8A8278',fontWeight:400}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.filter(p => p.status !== 'Complete').slice(0, 6).map(p => (
                    <tr key={p.id} style={{borderBottom:'1px solid rgba(42,37,32,0.04)'}}>
                      <td style={{padding:'0.75rem 1.25rem',fontWeight:500,color:'#2A2520'}}>{p.name}</td>
                      <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{clients.find(c => c.id === p.client_id)?.name || '—'}</td>
                      <td style={{padding:'0.75rem 1.25rem'}}><Badge status={p.status} /></td>
                      <td style={{padding:'0.75rem 1.25rem',color:'#4A4540'}}>${Number(p.budget).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>

          {/* Today's Tasks */}
          <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
            <div style={{padding:'0.9rem 1.25rem',borderBottom:'1px solid rgba(42,37,32,0.06)'}}>
              <span style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>Today's Tasks</span>
            </div>
            <div style={{padding:'0.75rem 1.25rem'}}>
              {todayTaskList.length === 0
                ? <p style={{fontSize:'0.78rem',color:'#8A8278',padding:'0.5rem 0'}}>No tasks due today</p>
                : todayTaskList.map(t => (
                  <div key={t.id} style={{display:'flex',alignItems:'flex-start',gap:'0.6rem',padding:'0.4rem 0',borderBottom:'1px solid rgba(42,37,32,0.04)'}}>
                    <div style={{width:14,height:14,borderRadius:3,border:'1px solid rgba(42,37,32,0.2)',flexShrink:0,marginTop:2,background: t.done ? '#C4622D' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {t.done && <span style={{color:'white',fontSize:'0.6rem'}}>✓</span>}
                    </div>
                    <span style={{fontSize:'0.8rem',color: t.done ? '#C4B5A0' : '#2A2520',textDecoration: t.done ? 'line-through' : 'none'}}>{t.title}</span>
                  </div>
                ))
              }
              {thisWeekTasks.length > 0 && (
                <>
                  <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.55rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#C4B5A0',margin:'0.75rem 0 0.4rem'}}>This Week</div>
                  {thisWeekTasks.map(t => (
                    <div key={t.id} style={{display:'flex',alignItems:'flex-start',gap:'0.6rem',padding:'0.35rem 0',borderBottom:'1px solid rgba(42,37,32,0.04)'}}>
                      <div style={{width:14,height:14,borderRadius:3,border:'1px solid rgba(42,37,32,0.12)',flexShrink:0,marginTop:2}}/>
                      <span style={{fontSize:'0.78rem',color:'#8A8278'}}>{t.title}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
            <div style={{padding:'0.9rem 1.25rem',borderBottom:'1px solid rgba(42,37,32,0.06)'}}>
              <span style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>Upcoming</span>
            </div>
            <div style={{padding:'0.75rem 1.25rem'}}>
              {upcomingEvents.length === 0
                ? <p style={{fontSize:'0.78rem',color:'#8A8278',padding:'0.5rem 0'}}>No upcoming events</p>
                : upcomingEvents.map(e => (
                  <div key={e.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.5rem 0',borderBottom:'1px solid rgba(42,37,32,0.04)'}}>
                    <div style={{flexShrink:0,width:36,textAlign:'center'}}>
                      <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.6rem',color:'#C4622D',textTransform:'uppercase'}}>{new Date(e.date+'T00:00:00').toLocaleDateString('en-US',{month:'short'})}</div>
                      <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.2rem',fontWeight:400,color:'#2A2520',lineHeight:1}}>{new Date(e.date+'T00:00:00').getDate()}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'0.8rem',color:'#2A2520',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.title}</div>
                      <span style={{...(eventTypeColors[e.type]||{background:'#E8E0D5',color:'#8A8278'}),fontSize:'0.6rem',fontFamily:"'DM Mono', monospace",padding:'0.1rem 0.4rem',borderRadius:8}}>{e.type}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function Clients({ clients, projects, invoices, tasks, events, payments, reload, setDetailClient }) {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.status || '').toLowerCase().includes(search.toLowerCase())
  )

async function handleSave(form, setLoading) {
  setLoading(true)
  const user_id = (await supabase.auth.getUser()).data.user.id
  if (modal === 'add') {
    await supabase.from('clients').insert({ ...form, user_id })
  } else {
    await supabase.from('clients').update({ ...form }).eq('id', modal.id)
  }
  setLoading(false)
  setModal(null)
  reload()
}
  async function handleDelete() {
    setDeleteLoading(true)
    await supabase.from('clients').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    reload()
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520'}}>Clients</h2>
        </div>
        <button onClick={() => setModal('add')} style={{background:'#C4622D',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,border:'none',cursor:'pointer'}}>+ Add Client</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
        className={inputClass} style={{...inputStyle,marginBottom:'1rem',width:280}} />
      <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
        <table style={{width:'100%',fontSize:'0.82rem',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
              {['Name','Email','Phone','Status','Notes',''].map(h => (
                <th key={h} style={{padding:'0.6rem 1.25rem',textAlign:'left',fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#8A8278',fontWeight:400}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} style={{padding:'2rem',textAlign:'center',color:'#8A8278'}}>No clients yet — add your first one!</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} style={{borderBottom:'1px solid rgba(42,37,32,0.04)'}}>
                <td style={{padding:'0.75rem 1.25rem',fontWeight:500,color:'#C4622D',cursor:'pointer'}} onClick={() => setDetailClient(c)}>{c.name}</td>
                <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{c.email}</td>
                <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{c.phone}</td>
                <td style={{padding:'0.75rem 1.25rem'}}><Badge status={c.status} /></td>
                <td style={{padding:'0.75rem 1.25rem',color:'#C4B5A0',fontSize:'0.75rem',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.notes}</td>
                <td style={{padding:'0.75rem 1.25rem'}}><Actions onEdit={() => setModal(c)} onDelete={() => setDeleteTarget(c)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <ClientModal client={modal === 'add' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

function Projects({ projects, clients, reload, setDetailProject }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'All' || p.status === statusFilter)
  )

  async function handleSave(form, setLoading) {
    setLoading(true)
    const data = { ...form, budget: Number(form.budget) || 0, spent: Number(form.spent) || 0 }
   const user_id = (await supabase.auth.getUser()).data.user.id
if (modal === 'add') await supabase.from('projects').insert({ ...data, user_id })
    else await supabase.from('projects').update(data).eq('id', modal.id)
    setLoading(false)
    setModal(null)
    reload()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    await supabase.from('projects').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    reload()
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520'}}>Projects</h2>
        <button onClick={() => setModal('add')} style={{background:'#C4622D',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,border:'none',cursor:'pointer'}}>+ Add Project</button>
      </div>
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem'}}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
          className={inputClass} style={{...inputStyle,width:256}} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className={inputClass} style={{...inputStyle,width:'auto'}}>
          <option value="All">All Statuses</option>
          {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
        {filtered.length === 0 && <div style={{gridColumn:'1/-1',textAlign:'center',padding:'4rem 0',color:'#8A8278'}}>No projects yet</div>}
        {filtered.map(p => {
          const pct = p.budget ? Math.min(100, Math.round((p.spent / p.budget) * 100)) : 0
          const over = p.spent > p.budget && p.budget > 0
          return (
            <div key={p.id} style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'0.25rem'}}>
                <h3 onClick={() => setDetailProject(p)} style={{fontWeight:500,color:'#C4622D',fontSize:'0.9rem',paddingRight:'0.5rem',cursor:'pointer'}}>{p.name}</h3>
                <Badge status={p.status} />
              </div>
              <p style={{fontSize:'0.78rem',color:'#8A8278',marginBottom:'1rem'}}>{clients.find(c => c.id === p.client_id)?.name || '—'}</p>
              {p.budget > 0 && (
                <div style={{marginBottom:'0.75rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.72rem',color:'#8A8278',marginBottom:'0.35rem'}}>
                    <span>Budget: <span style={{color:'#2A2520',fontWeight:500}}>${Number(p.budget).toLocaleString()}</span></span>
                    <span style={{color: over ? '#C4622D' : '#8A8278'}}>Spent: ${Number(p.spent).toLocaleString()}{over && ' ⚠️'}</span>
                  </div>
                  <div style={{width:'100%',background:'#E8E0D5',borderRadius:4,height:3}}>
                    <div style={{height:3,borderRadius:4,width:`${pct}%`,background: over ? '#C4622D' : pct > 80 ? '#B8963E' : '#6B7C6E'}} />
                  </div>
                </div>
              )}
              {p.notes && <p style={{fontSize:'0.72rem',color:'#C4B5A0',marginBottom:'0.75rem',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.notes}</p>}
              <div style={{display:'flex',justifyContent:'flex-end',borderTop:'1px solid rgba(42,37,32,0.06)',paddingTop:'0.75rem'}}>
                <Actions onEdit={() => setModal(p)} onDelete={() => setDeleteTarget(p)} />
              </div>
            </div>
          )
        })}
      </div>
      {modal && <ProjectModal project={modal === 'add' ? null : modal} clients={clients} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

function Vendors({ vendors, reload }) {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.rep || '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave(form, setLoading) {
    setLoading(true)
   const user_id = (await supabase.auth.getUser()).data.user.id
if (modal === 'add') await supabase.from('vendors').insert({ ...form, user_id })
    else await supabase.from('vendors').update(form).eq('id', modal.id)
    setLoading(false)
    setModal(null)
    reload()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    await supabase.from('vendors').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    reload()
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520'}}>Vendors</h2>
        <button onClick={() => setModal('add')} style={{background:'#C4622D',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,border:'none',cursor:'pointer'}}>+ Add Vendor</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors…"
        className={inputClass} style={{...inputStyle,marginBottom:'1.25rem',width:280}} />
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
        {filtered.length === 0 && <div style={{gridColumn:'1/-1',textAlign:'center',padding:'4rem 0',color:'#8A8278'}}>No vendors yet</div>}
        {filtered.map(v => (
          <div key={v.id} style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'0.5rem'}}>
              <h3 style={{fontWeight:500,color:'#2A2520',fontSize:'0.9rem'}}>{v.name}</h3>
              <Actions onEdit={() => setModal(v)} onDelete={() => setDeleteTarget(v)} />
            </div>
            <p style={{fontSize:'0.78rem',color:'#8A8278'}}>Rep: {v.rep}</p>
            <p style={{fontSize:'0.78rem',color:'#8A8278',marginBottom:'0.75rem'}}>{v.email}</p>
            {v.discount && <span style={{background:'#F5EDD8',color:'#B8963E',padding:'0.15rem 0.5rem',borderRadius:10,fontSize:'0.72rem',fontFamily:"'DM Mono', monospace"}}>{v.discount}</span>}
            {v.notes && <p style={{fontSize:'0.72rem',color:'#C4B5A0',marginTop:'0.5rem'}}>{v.notes}</p>}
          </div>
        ))}
      </div>
      {modal && <VendorModal vendor={modal === 'add' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

function Items({ items, projects, vendors, clients, reload, persistItemModal, setPersistItemModal }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [clientFilter, setClientFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = items.filter(i => {
    const project = projects.find(p => p.id === i.project_id)
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || i.status === statusFilter
    const matchClient = clientFilter === 'All' || (project && project.client_id === clientFilter) || i.client_id === clientFilter
    return matchSearch && matchStatus && matchClient
  })

  async function handleSave(form, setLoading) {
    setLoading(true)
    const data = {
      ...form,
      cost: Number(form.cost) || 0,
      retail_cost: Number(form.retail_cost) || 0,
      quantity: Number(form.quantity) || 1,
      project_id: form.project_id || null,
      client_id: form.client_id || null,
      vendor_id: form.vendor_id || null,
    }
    const user_id = (await supabase.auth.getUser()).data.user.id
    if (modal === 'add') await supabase.from('items').insert({ ...data, user_id })
    else await supabase.from('items').update(data).eq('id', modal.id)
    setLoading(false)
    setModal(null)
    reload()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    await supabase.from('items').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    reload()
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520'}}>Items & Procurement</h2>
        <button onClick={() => setPersistItemModal('add')} style={{background:'#C4622D',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,border:'none',cursor:'pointer'}}>+ Add Item</button>
      </div>
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
          className={inputClass} style={{...inputStyle,width:220}} />
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
          className={inputClass} style={{...inputStyle,width:'auto'}}>
          <option value="All">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className={inputClass} style={{...inputStyle,width:'auto'}}>
          <option value="All">All Statuses</option>
          {ITEM_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
        <table style={{width:'100%',fontSize:'0.82rem',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
              {['','Item','Client','Project','Vendor','Cost','Status',''].map(h => (
                <th key={h} style={{padding:'0.6rem 1.25rem',textAlign:'left',fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#8A8278',fontWeight:400}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} style={{padding:'2rem',textAlign:'center',color:'#8A8278'}}>No items yet</td></tr>}
            {filtered.map(i => {
              const project = projects.find(p => p.id === i.project_id)
              const client = clients.find(c => c.id === (i.client_id || project?.client_id))
              return (
                <tr key={i.id} style={{borderBottom:'1px solid rgba(42,37,32,0.04)'}}>
                  <td style={{padding:'0.5rem 0.75rem 0.5rem 1.25rem',width:48}}>
                    {i.image_url
                      ? <img src={i.image_url} alt={i.name} style={{width:40,height:40,borderRadius:4,objectFit:'cover',border:'1px solid rgba(42,37,32,0.1)'}}/>
                      : <div style={{width:40,height:40,borderRadius:4,background:'#E8E0D5',display:'flex',alignItems:'center',justifyContent:'center'}}><Package size={16} style={{color:'#C4B5A0'}}/></div>
                    }
                  </td>
                  <td style={{padding:'0.75rem 1.25rem'}}>
                    <div style={{fontWeight:500,color:'#2A2520'}}>{i.name}</div>
                    {i.brand && <div style={{fontSize:'0.7rem',color:'#8A8278'}}>{i.brand}</div>}
                    {i.sku && <div style={{fontSize:'0.65rem',color:'#C4B5A0',fontFamily:"'DM Mono',monospace"}}>{i.sku}</div>}
                  </td>
                  <td style={{padding:'0.75rem 1.25rem',color:'#8A8278',fontSize:'0.8rem'}}>{client?.name || '—'}</td>
                  <td style={{padding:'0.75rem 1.25rem',color:'#8A8278',fontSize:'0.8rem'}}>{project?.name || '—'}</td>
                  <td style={{padding:'0.75rem 1.25rem',color:'#8A8278',fontSize:'0.8rem'}}>{vendors.find(v => v.id === i.vendor_id)?.name || '—'}</td>
                  <td style={{padding:'0.75rem 1.25rem',color:'#4A4540'}}>${Number(i.cost).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                  <td style={{padding:'0.75rem 1.25rem'}}><Badge status={i.status}/></td>
                  <td style={{padding:'0.75rem 1.25rem'}}>
                    <div style={{display:'flex',gap:'0.4rem',alignItems:'center'}}>
                      {i.url && <a href={i.url} target="_blank" rel="noopener noreferrer" style={{color:'#C4B5A0',display:'flex'}} title="Product URL"><Download size={13}/></a>}
                      <Actions onEdit={() => setPersistItemModal(i)} onDelete={() => setDeleteTarget(i)}/>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Item modal handled at App level - persists across tab switches */}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

function Invoices({ invoices, clients, projects, items, payments, studioProfile, reload }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [expandedInvoice, setExpandedInvoice] = useState(null)

  const filtered = invoices.filter(i =>
    (i.num.toLowerCase().includes(search.toLowerCase()) ||
    (clients.find(c => c.id === i.client_id)?.name || '').toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'All' || i.status === statusFilter)
  )

  async function handleSave(form, setLoading) {
    setLoading(true)
    const data = { ...form, amount: Number(form.amount) || 0, due: form.due || null, project_id: form.project_id || null, client_id: form.client_id || null }
    const user_id = (await supabase.auth.getUser()).data.user.id

    const retainerApplied = Number(form.retainer_applied) || 0
    const previouslyApplied = modal !== 'add' ? Number(modal.retainer_applied) || 0 : 0
    const retainerDiff = retainerApplied - previouslyApplied

    if (modal === 'add') {
      await supabase.from('invoices').insert({ ...data, user_id })
    } else {
      await supabase.from('invoices').update(data).eq('id', modal.id)
    }

    if (retainerDiff !== 0 && form.client_id) {
      const client = clients.find(c => c.id === form.client_id)
      if (client) {
        const newBalance = Math.max(0, Number(client.retainer_balance || 0) - retainerDiff)
        await supabase.from('clients').update({ retainer_balance: newBalance }).eq('id', form.client_id)
      }
    }

    setLoading(false)
    setModal(null)
    reload()
  }

async function handleDelete() {
    setDeleteLoading(true)
    await supabase.from('invoices').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    reload()
  }

  async function handleSendReminder(invoice) {
    const client = clients.find(c => c.id === invoice.client_id)
    if (!client?.email) {
      alert('This client has no email address on file.')
      return
    }
    const sp = studioProfile || {}
    const studioName = sp.studio_name || 'Elegant Interiors'
    const thankYou = sp.thank_you_note || 'Thank you for the privilege of designing your space.'
    const due = invoice.due
      ? new Date(invoice.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'soon'
    const invoicePaymentsForEmail = (invoice._payments||[])
    const totalPaidForEmail = invoicePaymentsForEmail.reduce((s,p)=>s+(Number(p.amount)||0),0)
    const balanceForEmail = Math.max(0, Number(invoice.amount||0) - totalPaidForEmail)
    const html = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #F7F3EE;">
        <div style="background: #2A2520; padding: 28px 32px; border-left: 4px solid #B8963E;">
          ${sp.logo_url ? `<img src="${sp.logo_url}" alt="${studioName}" style="max-height:48px;max-width:200px;object-fit:contain;margin-bottom:8px;display:block;" />` : ''}
          <h1 style="color: #F7F3EE; margin: 0; font-size: 22px; font-weight: 400; letter-spacing: 0.05em;">${studioName}</h1>
          <p style="color: #C4B5A0; margin: 6px 0 0; font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">Invoice Reminder</p>
        </div>
        <div style="background: #FDFAF6; padding: 32px; border: 1px solid #E8E0D5; border-top: none;">
          <p style="color: #2A2520; font-size: 15px; margin: 0 0 16px;">Dear ${client.name},</p>
          <p style="color: #4A4540; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">This is a friendly reminder that the following invoice is due. Please don't hesitate to reach out with any questions.</p>
          <div style="background: #F7F3EE; border: 1px solid #E8E0D5; border-radius: 4px; padding: 20px 24px; margin: 0 0 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #8A8278; font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 0;">Invoice</td><td style="color: #2A2520; font-size: 14px; font-weight: bold; text-align: right; padding: 4px 0;">${invoice.num}</td></tr>
              <tr><td style="color: #8A8278; font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 0;">Invoice Total</td><td style="color: #2A2520; font-size: 14px; text-align: right; padding: 4px 0;">$${Number(invoice.amount||0).toLocaleString()}</td></tr>
              ${totalPaidForEmail > 0 ? `<tr><td style="color: #8A8278; font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 0;">Payments Received</td><td style="color: #6B7C6E; font-size: 14px; text-align: right; padding: 4px 0;">-$${totalPaidForEmail.toLocaleString()}</td></tr>` : ''}
              <tr style="border-top: 1px solid #E8E0D5;"><td style="color: #C4622D; font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 0 4px; font-weight: bold;">Balance Due</td><td style="color: #C4622D; font-size: 18px; font-weight: bold; text-align: right; padding: 8px 0 4px;">$${balanceForEmail.toLocaleString()}</td></tr>
              <tr><td style="color: #8A8278; font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 0;">Due Date</td><td style="color: #2A2520; font-size: 14px; text-align: right; padding: 4px 0;">${due}</td></tr>
            </table>
          </div>
          <p style="color: #4A4540; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">${thankYou}</p>
          <p style="color: #8A8278; font-size: 11px; font-family: monospace; letter-spacing: 0.08em; margin: 0; padding-top: 16px; border-top: 1px solid #E8E0D5;">${studioName} · Studio OS</p>
        </div>
      </div>
    `
    const result = await sendEmail(client.email, `Invoice Reminder: ${invoice.num} — $${Number(invoice.amount).toLocaleString()} due ${due}`, html, studioName)
    if (result.error) {
      alert(`Failed to send: ${result.error}`)
    } else {
      alert(`Reminder sent to ${client.email}`)
    }
  }

  function generatePDF(invoice) {
    const doc = new jsPDF()
    const client = clients.find(c => c.id === invoice.client_id)
    const project = projects.find(p => p.id === invoice.project_id)
    const sp = studioProfile || {}

    // ── STUDIO BRAND (from studio_profile) ──────────────────
    const brand = {
      name: sp.studio_name || 'Elegant Interiors',
      tagline: sp.tagline || 'Interior Design Studio',
      website: sp.website || '',
      email: sp.email || '',
      phone: sp.phone || '',
      address: sp.address || '',
      thankYou: sp.thank_you_note || 'Thank you for the privilege of designing your space.',
      logoUrl: sp.logo_url || null,
    }

    // ── COLORS ───────────────────────────────────────────────
    const ink = [42, 37, 32]
    const sand = [247, 243, 238]
    const terra = [184, 150, 62]
    const bark = [196, 181, 160]
    const muted = [138, 130, 120]
    const warm = [253, 250, 246]

    const pageW = 210
    const pageH = 297
    const margin = 18

    // ── BACKGROUND ───────────────────────────────────────────
    doc.setFillColor(...sand)
    doc.rect(0, 0, pageW, pageH, 'F')

    // ── LEFT ACCENT BAR ──────────────────────────────────────
    doc.setFillColor(...terra)
    doc.rect(0, 0, 4, pageH, 'F')

    // ── HEADER AREA ──────────────────────────────────────────
    doc.setFillColor(...warm)
    doc.rect(4, 0, pageW - 4, 52, 'F')

    // Studio name
    doc.setTextColor(...ink)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(brand.name.toUpperCase(), margin + 4, 20)

    // Tagline
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...muted)
    doc.text(brand.tagline, margin + 4, 27)

    // Contact info in header right
    doc.setFontSize(7.5)
    doc.setTextColor(...muted)
    doc.text(brand.email, pageW - margin, 14, { align: 'right' })
    doc.text(brand.phone, pageW - margin, 20, { align: 'right' })
    doc.text(brand.website, pageW - margin, 26, { align: 'right' })

    // Header divider
    doc.setDrawColor(...bark)
    doc.setLineWidth(0.3)
    doc.line(margin, 34, pageW - margin, 34)

    // INVOICE label + number
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...terra)
    doc.text('INVOICE', margin + 4, 43)
    doc.setTextColor(...ink)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.num, margin + 28, 43)

    // Date right side
    doc.setTextColor(...muted)
    doc.setFont('helvetica', 'normal')
    doc.text(`Issued: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pageW - margin, 43, { align: 'right' })

    // ── BILL TO + PROJECT INFO ────────────────────────────────
    let y = 62

    // Bill To block
    doc.setFillColor(...warm)
    doc.roundedRect(margin, y, 85, 38, 2, 2, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...terra)
    doc.text('BILL TO', margin + 5, y + 8)

    doc.setTextColor(...ink)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(client?.name || '—', margin + 5, y + 16)

    if (client?.name2) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...muted)
      doc.text(client.name2, margin + 5, y + 22)
    }

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...muted)
    let clientY = client?.name2 ? y + 28 : y + 22
    if (client?.email) { doc.text(client.email, margin + 5, clientY); clientY += 5 }
    if (client?.phone) { doc.text(client.phone, margin + 5, clientY) }

    // Project + Due Date block
    doc.setFillColor(...warm)
    doc.roundedRect(margin + 90, y, 102, 38, 2, 2, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...terra)
    doc.text('PROJECT', margin + 95, y + 8)

    doc.setTextColor(...ink)
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.text(project?.name || '—', margin + 95, y + 16)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...terra)
    doc.text('DUE DATE', margin + 95, y + 26)

    doc.setTextColor(...ink)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const dueStr = invoice.due
      ? new Date(invoice.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Upon Receipt'
    doc.text(dueStr, margin + 95, y + 33)

    // ── LINE ITEMS TABLE ──────────────────────────────────────
    y += 48

    // Table header
    doc.setFillColor(...ink)
    doc.rect(margin, y, pageW - margin * 2, 9, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('DESCRIPTION', margin + 4, y + 6)
    doc.text('AMOUNT', pageW - margin - 4, y + 6, { align: 'right' })
    doc.text('TAXABLE', pageW - margin - 32, y + 6, { align: 'right' })

    y += 9

    const lineItems = invoice.line_items?.length
      ? invoice.line_items
      : [{ description: project?.name || 'Services Rendered', amount: invoice.amount, taxable: true }]

    lineItems.forEach((line, idx) => {
      const rowBg = idx % 2 === 0 ? warm : sand
      doc.setFillColor(...rowBg)
      doc.rect(margin, y, pageW - margin * 2, 9, 'F')
      doc.setTextColor(...ink)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.text(String(line.description || ''), margin + 4, y + 6)
      doc.text(`$${Number(line.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageW - margin - 4, y + 6, { align: 'right' })
      doc.setTextColor(...muted)
      doc.setFontSize(7)
      doc.text(line.taxable === false ? 'No' : 'Yes', pageW - margin - 32, y + 6, { align: 'right' })
      y += 9
    })

    // Table bottom border
    doc.setDrawColor(...bark)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageW - margin, y)
    y += 6

    // ── TOTALS ────────────────────────────────────────────────
    const subtotal = lineItems.reduce((s, l) => s + (Number(l.amount) || 0), 0)
    const taxRate = Number(invoice.tax_rate) || 0
    const taxableSubtotal = lineItems.reduce((s, l) => l.taxable === false ? s : s + (Number(l.amount) || 0), 0)
    const taxAmount = taxableSubtotal * taxRate / 100
    const retainerApplied = Number(invoice.retainer_applied) || 0
    const total = subtotal + taxAmount - retainerApplied

    const totalsX = pageW - margin - 70

    function totalsRow(label, value, bold = false, color = ink) {
      doc.setFontSize(bold ? 9.5 : 8.5)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(...muted)
      doc.text(label, totalsX, y)
      doc.setTextColor(...color)
      doc.text(value, pageW - margin, y, { align: 'right' })
      y += bold ? 7 : 6
    }

    totalsRow('Subtotal', `$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    if (taxRate > 0) totalsRow(`Tax (${taxRate}%)`, `$${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    if (retainerApplied > 0) totalsRow('Retainer Applied', `-$${retainerApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, false, [107, 124, 110])

    // Total row with background
    y += 2
    doc.setFillColor(...ink)
    doc.roundedRect(totalsX - 4, y - 5, pageW - margin - totalsX + 4 + margin, 12, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE TOTAL', totalsX, y + 3)
    doc.text(`$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageW - margin, y + 3, { align: 'right' })
    y += 16

    // Payment history
    const invoicePaymentsData = invoice._payments || []
    const totalPaidAmt = invoicePaymentsData.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    const remainingBalance = Math.max(0, total - totalPaidAmt)

    if (invoicePaymentsData.length > 0) {
      y += 2
      doc.setDrawColor(...bark)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageW - margin, y)
      y += 6
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...terra)
      doc.text('PAYMENTS RECEIVED', margin, y)
      y += 5
      invoicePaymentsData.forEach(p => {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...ink)
        doc.setFontSize(8)
        const pDate = p.date ? new Date(p.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : ''
        doc.text(`${pDate} — ${p.method}`, margin, y)
        doc.text(`-$${Number(p.amount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, pageW - margin, y, { align: 'right' })
        y += 6
      })
      // Balance remaining
      y += 2
      doc.setFillColor(...(remainingBalance <= 0 ? [107,124,110] : [196,98,45]))
      doc.roundedRect(totalsX - 4, y - 5, pageW - margin - totalsX + 4 + margin, 10, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(remainingBalance <= 0 ? 'PAID IN FULL' : 'BALANCE DUE', totalsX, y + 2)
      doc.text(`$${remainingBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, pageW - margin, y + 2, { align: 'right' })
      y += 14
    }

    // Status pill
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const statusColor = invoice.status === 'Paid' ? [107, 124, 110] : invoice.status === 'Overdue' ? terra : muted
    doc.setTextColor(...statusColor)
    doc.text(`STATUS: ${invoice.status.toUpperCase()}`, margin, y)
    y += 10

    // ── NOTES ─────────────────────────────────────────────────
    if (invoice.notes) {
      doc.setDrawColor(...bark)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageW - margin, y)
      y += 6
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...terra)
      doc.text('NOTES', margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...ink)
      doc.text(invoice.notes, margin, y, { maxWidth: pageW - margin * 2 })
    }

    // ── FOOTER ────────────────────────────────────────────────
    doc.setFillColor(...ink)
    doc.rect(0, pageH - 22, pageW, 22, 'F')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...bark)
    doc.text(brand.thankYou, pageW / 2, pageH - 13, { align: 'center' })

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...muted)
    doc.text(`${brand.website} · ${brand.email}`, pageW / 2, pageH - 7, { align: 'center' })

    doc.save(`invoice-${invoice.num}.pdf`)
  }

  const totalOutstanding = invoices
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + Number(i.amount), 0)

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520'}}>Invoices</h2>
        <button onClick={() => setModal('add')} style={{background:'#C4622D',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,border:'none',cursor:'pointer'}}>+ New Invoice</button>
      </div>
      {totalOutstanding > 0 && (
        <div style={{marginBottom:'1rem',display:'flex',alignItems:'center',gap:'0.5rem',background:'#F5E6DE',border:'1px solid rgba(196,98,45,0.2)',borderRadius:6,padding:'0.75rem 1rem',fontSize:'0.82rem',color:'#C4622D'}}>
          <AlertCircle size={15} />
          <span><span style={{fontWeight:600}}>${totalOutstanding.toLocaleString()}</span> outstanding across {invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').length} invoices</span>
        </div>
      )}
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem'}}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices…"
          className={inputClass} style={{...inputStyle,width:256}} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className={inputClass} style={{...inputStyle,width:'auto'}}>
          <option value="All">All Statuses</option>
          {INVOICE_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
        <table style={{width:'100%',fontSize:'0.82rem',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
              {['Invoice #','Client','Project','Amount','Paid','Balance','Due Date','Status',''].map(h => (
                <th key={h} style={{padding:'0.6rem 1.25rem',textAlign:'left',fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#8A8278',fontWeight:400}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} style={{padding:'2rem',textAlign:'center',color:'#8A8278'}}>No invoices yet</td></tr>}
            {filtered.map(i => {
              const invoicePayments = payments.filter(p => p.invoice_id === i.id)
              const totalPaid = invoicePayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
              const balance = Number(i.amount || 0) - totalPaid
              const isExpanded = expandedInvoice === i.id
              return (
                <React.Fragment key={i.id}>
                  <tr style={{borderBottom: isExpanded ? 'none' : '1px solid rgba(42,37,32,0.04)'}}>
                    <td style={{padding:'0.75rem 1.25rem',fontWeight:500,color:'#2A2520'}}>{i.num}</td>
                    <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{clients.find(c => c.id === i.client_id)?.name || '—'}</td>
                    <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{projects.find(p => p.id === i.project_id)?.name || '—'}</td>
                    <td style={{padding:'0.75rem 1.25rem',color:'#4A4540',fontWeight:500}}>${Number(i.amount||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td style={{padding:'0.75rem 1.25rem',color:'#6B7C6E'}}>{totalPaid > 0 ? `$${totalPaid.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—'}</td>
                    <td style={{padding:'0.75rem 1.25rem',color: balance <= 0 ? '#6B7C6E' : balance < Number(i.amount||0) ? '#B8963E' : '#C4622D',fontWeight:500}}>${Math.max(0,balance).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{i.due ? new Date(i.due+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}</td>
                    <td style={{padding:'0.75rem 1.25rem'}}><Badge status={i.status} /></td>
                    <td style={{padding:'0.75rem 1.25rem'}}>
                      <div style={{display:'flex',gap:'0.5rem',alignItems:'center',justifyContent:'flex-end'}}>
                        <button onClick={() => setExpandedInvoice(isExpanded ? null : i.id)} style={{color: isExpanded ? '#C4622D' : '#C4B5A0',background:'none',border:'none',cursor:'pointer',fontSize:'0.72rem',fontFamily:"'DM Mono', monospace",letterSpacing:'0.05em'}} title="Log payment">
                          {isExpanded ? 'close' : '$pay'}
                        </button>
                        <button onClick={() => generatePDF({...i, _payments: payments.filter(p => p.invoice_id === i.id)})} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}} title="Download PDF"><Download size={14} /></button>
                        <button onClick={() => handleSendReminder(i)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}} title="Send reminder"><Mail size={14} /></button>
                        <button onClick={() => setModal(i)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(i)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr style={{borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
                      <td colSpan={9} style={{padding:'0 1.25rem 1.25rem'}}>
                        <div style={{background:'#F7F3EE',borderRadius:6,padding:'1rem'}}>
                          <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.75rem'}}>Payment History</div>
                          {invoicePayments.length === 0
                            ? <p style={{fontSize:'0.78rem',color:'#C4B5A0',marginBottom:'0.75rem'}}>No payments recorded yet</p>
                            : <div style={{marginBottom:'0.75rem'}}>
                                {invoicePayments.map(p => (
                                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.4rem 0',borderBottom:'1px solid rgba(42,37,32,0.06)',fontSize:'0.78rem'}}>
                                    <span style={{color:'#2A2520',fontWeight:500}}>${Number(p.amount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                                    <span style={{color:'#8A8278'}}>{p.date ? new Date(p.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}</span>
                                    <span style={{color:'#8A8278',fontFamily:"'DM Mono', monospace",fontSize:'0.65rem'}}>{p.method}</span>
                                    {p.notes && <span style={{color:'#C4B5A0',fontStyle:'italic'}}>{p.notes}</span>}
                                    <button onClick={async () => {
                                      await supabase.from('payments').delete().eq('id', p.id)
                                      reload()
                                    }} style={{marginLeft:'auto',color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Trash2 size={12} /></button>
                                  </div>
                                ))}
                              </div>
                          }
                          <PaymentForm invoiceId={i.id} invoiceAmount={Number(i.amount||0)} totalPaid={totalPaid} onSave={async (form) => {
                            const user_id = (await supabase.auth.getUser()).data.user.id
                            await supabase.from('payments').insert({ ...form, invoice_id: i.id, user_id })
                            const newPaid = totalPaid + Number(form.amount)
                            if (newPaid >= Number(i.amount||0)) {
                              await supabase.from('invoices').update({ status: 'Paid' }).eq('id', i.id)
                            }
                            reload()
                          }} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {modal && <InvoiceModal invoice={modal === 'add' ? null : modal} clients={clients} projects={projects} items={items} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.num} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

function Tasks({ tasks, projects, clients, reload }) {
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleSave(form, setLoading) {
    setLoading(true)
    const user_id = (await supabase.auth.getUser()).data.user.id
    const taskData = { ...form, project_id: form.project_id || null, client_id: form.client_id || null }
if (modal === 'add') await supabase.from('tasks').insert({ ...taskData, user_id })
    else await supabase.from('tasks').update(taskData).eq('id', modal.id)
    setLoading(false)
    setModal(null)
    reload()
  }

  async function toggleDone(task) {
    await supabase.from('tasks').update({ done: !task.done }).eq('id', task.id)
    reload()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    await supabase.from('tasks').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    reload()
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520'}}>Tasks</h2>
        <button onClick={() => setModal('add')} style={{background:'#C4622D',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,border:'none',cursor:'pointer'}}>+ Add Task</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
        {TASK_PRIORITIES.map(priority => {
          const accentColor = priority === 'Today' ? '#C4622D' : priority === 'This Week' ? '#B8963E' : '#6B7C6E'
          const ptasks = tasks.filter(t => t.priority === priority)
          return (
            <div key={priority} style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem',borderTop:`3px solid ${accentColor}`}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
                <h3 style={{fontFamily:"'DM Mono', monospace",fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#2A2520'}}>{priority}</h3>
                <span style={{fontSize:'0.7rem',color:'#8A8278'}}>{ptasks.filter(t => !t.done).length} left</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                {ptasks.length === 0 && <p style={{fontSize:'0.75rem',color:'#C4B5A0',padding:'0.5rem 0'}}>No tasks</p>}
                {ptasks.map(t => (
                  <div key={t.id} style={{display:'flex',alignItems:'flex-start',gap:'0.5rem'}}>
                    <button onClick={() => toggleDone(t)} style={{width:15,height:15,borderRadius:3,border:`1px solid ${t.done ? '#C4622D' : 'rgba(42,37,32,0.2)'}`,flexShrink:0,marginTop:2,background: t.done ? '#C4622D' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                      {t.done && <span style={{color:'white',fontSize:'0.6rem'}}>✓</span>}
                    </button>
                    <span style={{fontSize:'0.82rem',flex:1,color: t.done ? '#C4B5A0' : '#2A2520',textDecoration: t.done ? 'line-through' : 'none'}}>{t.title}</span>
                    <div style={{display:'flex',gap:'0.25rem',flexShrink:0}}>
                      <button onClick={() => setModal(t)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Pencil size={13} /></button>
                      <button onClick={() => setDeleteTarget(t)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {modal && <TaskModal task={modal === 'add' ? null : modal} projects={projects} clients={clients} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

const ROOM_TYPES = ['Living Room','Bedroom','Kitchen','Dining Room','Bathroom','Office','Outdoor','Other']
const STYLE_TAGS = ['Modern','Traditional','Transitional','Coastal','Farmhouse','Industrial','Bohemian','Minimalist','Other']
const FILE_TYPES = ['Mood Board','Photo','Document','Contract','Rendering','Fabric Sample','Other']

function Files({ projects, clients, fileMetadata, reload }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [uploadTags, setUploadTags] = useState({ client_id: '', project_id: '', room_type: '', style_tag: '', file_type: '', url: '' })
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const setTag = (f, v) => setUploadTags(p => ({ ...p, [f]: v }))

  async function loadFiles() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.storage
      .from('studio-files')
      .list(user.id, { sortBy: { column: 'created_at', order: 'desc' } })
    if (data) {
      const enriched = await Promise.all(data.map(async f => {
        const { data: signedData } = await supabase.storage
          .from('studio-files')
          .createSignedUrl(`${user.id}/${f.name}`, 3600)
        const path = `${user.id}/${f.name}`
        const meta = fileMetadata.find(m => m.storage_path === path) || {}
        return {
          ...f,
          signedUrl: signedData?.signedUrl,
          storagePath: path,
          projectId: meta.project_id || '',
          clientId: meta.client_id || '',
          roomType: meta.room_type || '',
          styleTag: meta.style_tag || '',
          fileType: meta.file_type || '',
          fileUrl: meta.url || '',
          displayName: meta.display_name || f.name,
          metaId: meta.id || null,
        }
      }))
      setFiles(enriched)
    }
    setLoading(false)
  }

  useEffect(() => { loadFiles() }, [fileMetadata])

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const path = `${user.id}/${fileName}`
    const { error } = await supabase.storage
      .from('studio-files')
      .upload(path, file)
    if (!error) {
      await supabase.from('file_metadata').insert({
        user_id: user.id,
        storage_path: path,
        display_name: file.name,
        project_id: uploadTags.project_id || null,
        client_id: uploadTags.client_id || null,
        room_type: uploadTags.room_type || null,
        style_tag: uploadTags.style_tag || null,
        file_type: uploadTags.file_type || null,
        url: uploadTags.url || null,
      })
      setShowUploadPanel(false)
      setUploadTags({ client_id: '', project_id: '', room_type: '', style_tag: '', file_type: '' })
      reload()
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete() {
    setDeleteLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.storage
      .from('studio-files')
      .remove([deleteTarget.storagePath])
    if (deleteTarget.metaId) {
      await supabase.from('file_metadata').delete().eq('id', deleteTarget.metaId)
    }
    setDeleteLoading(false)
    setDeleteTarget(null)
    reload()
  }

  const filtered = files.filter(f => {
    const matchSearch = f.displayName.toLowerCase().includes(search.toLowerCase())
    const matchProject = !projectFilter || f.projectId === projectFilter
    const matchClient = !clientFilter || f.clientId === clientFilter
    const matchFileType = !fileTypeFilter || f.fileType === fileTypeFilter
    return matchSearch && matchProject && matchClient && matchFileType
  })

  function formatSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function isImage(name) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(name)
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520'}}>Files</h2>
        <button onClick={() => setShowUploadPanel(!showUploadPanel)} style={{background:'#C4622D',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem'}}>
          <Upload size={14} /> Upload File
        </button>
      </div>

      {showUploadPanel && (
        <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem',marginBottom:'1.25rem'}}>
          <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'1rem'}}>Upload & Tag File</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem',marginBottom:'0.75rem'}}>
            <Field label="Client">
              <select value={uploadTags.client_id} onChange={e => { setTag('client_id', e.target.value); setTag('project_id', '') }} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Project">
              <select value={uploadTags.project_id} onChange={e => setTag('project_id', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {projects.filter(p => !uploadTags.client_id || p.client_id === uploadTags.client_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="File Type">
              <select value={uploadTags.file_type} onChange={e => setTag('file_type', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {FILE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'0.75rem',marginBottom:'1rem'}}>
            <Field label="Room Type">
              <select value={uploadTags.room_type} onChange={e => setTag('room_type', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Style Tag">
              <select value={uploadTags.style_tag} onChange={e => setTag('style_tag', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {STYLE_TAGS.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div style={{marginBottom:'0.75rem'}}>
            <Field label="Product URL (optional)">
              <input value={uploadTags.url} onChange={e => setTag('url', e.target.value)} placeholder="https://www.vendor.com/product" className={inputClass} style={inputStyle} />
            </Field>
          </div>
          <label style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',background: uploading ? '#C4B5A0' : '#C4622D',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,cursor: uploading ? 'not-allowed' : 'pointer'}}>
            {uploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading…' : 'Choose & Upload File'}
            <input type="file" style={{display:'none'}} onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      )}

      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…" className={inputClass} style={{...inputStyle,width:200}} />
        <select value={clientFilter} onChange={e => { setClientFilter(e.target.value); setProjectFilter('') }} className={inputClass} style={{...inputStyle,width:'auto'}}>
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className={inputClass} style={{...inputStyle,width:'auto'}}>
          <option value="">All Projects</option>
          {projects.filter(p => !clientFilter || p.client_id === clientFilter).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={fileTypeFilter} onChange={e => setFileTypeFilter(e.target.value)} className={inputClass} style={{...inputStyle,width:'auto'}}>
          <option value="">All Types</option>
          {FILE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem'}}>
          {filtered.length === 0 && (
            <div style={{gridColumn:'1/-1',textAlign:'center',padding:'4rem 0',color:'#8A8278',fontSize:'0.82rem'}}>
              No files yet — upload mood boards, photos, or documents
            </div>
          )}
          {filtered.map(f => (
            <div key={f.name} style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
              <div style={{height:140,background:'#E8E0D5',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                {isImage(f.name) && f.signedUrl
                  ? <img src={f.signedUrl} alt={f.displayName} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  : <FileImage size={36} style={{color:'#C4B5A0'}} />
                }
              </div>
              <div style={{padding:'0.75rem'}}>
                <p style={{fontSize:'0.82rem',fontWeight:500,color:'#2A2520',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.displayName}</p>
                <p style={{fontSize:'0.72rem',color:'#C4B5A0',marginTop:2}}>{formatSize(f.metadata?.size)}</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'0.25rem',marginTop:'0.4rem'}}>
                  {f.fileType && <span style={{background:'#F5EDD8',color:'#B8963E',fontSize:'0.6rem',fontFamily:"'DM Mono',monospace",padding:'0.1rem 0.4rem',borderRadius:8}}>{f.fileType}</span>}
                  {f.roomType && <span style={{background:'#EBF0EC',color:'#6B7C6E',fontSize:'0.6rem',fontFamily:"'DM Mono',monospace",padding:'0.1rem 0.4rem',borderRadius:8}}>{f.roomType}</span>}
                  {f.styleTag && <span style={{background:'#E8E0D5',color:'#8A8278',fontSize:'0.6rem',fontFamily:"'DM Mono',monospace",padding:'0.1rem 0.4rem',borderRadius:8}}>{f.styleTag}</span>}
                  {f.projectId && <span style={{background:'#F5E6DE',color:'#C4622D',fontSize:'0.6rem',fontFamily:"'DM Mono',monospace",padding:'0.1rem 0.4rem',borderRadius:8}}>{projects.find(p => p.id === f.projectId)?.name || ''}</span>}
                </div>
                <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem',alignItems:'center'}}>
                  {f.signedUrl && (
                    <a href={f.signedUrl} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:3,fontSize:'0.72rem',color:'#C4622D',textDecoration:'none'}}>
                      <Download size={12} /> View
                    </a>
                  )}
                  {f.fileUrl && (
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:3,fontSize:'0.72rem',color:'#6B7C6E',textDecoration:'none'}}>
                      🔗 Product
                    </a>
                  )}
                  <button onClick={() => setDeleteTarget(f)} style={{display:'flex',alignItems:'center',gap:3,fontSize:'0.72rem',color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',marginLeft:'auto'}}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.displayName}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}
function CalendarView({ events, reload, clients }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calView, setCalView] = useState('month')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [conflictWarning, setConflictWarning] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()

  const typeColors = {
    Meeting: {background:'#F5EDD8',color:'#B8963E'},
    Delivery: {background:'#EBF0EC',color:'#6B7C6E'},
    'Site Visit': {background:'#E8E0D5',color:'#4A4540'},
    Billing: {background:'#F5E8E5',color:'#C47A6B'},
    Other: {background:'#E8E0D5',color:'#8A8278'},
  }

  function eventsOnDate(dateStr) {
    return events
      .filter(e => e.date === dateStr)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
  }

  function checkConflict(form, excludeId) {
    if (!form.date || !form.time) return null
    const same = events.filter(e => e.date === form.date && e.id !== excludeId && e.time)
    for (const e of same) {
      const [h1, m1] = form.time.split(':').map(Number)
      const [h2, m2] = e.time.split(':').map(Number)
      const t1 = h1 * 60 + m1
      const t2 = h2 * 60 + m2
      const dur1 = Number(form.duration) || 60
      const dur2 = Number(e.duration) || 60
      if (t1 < t2 + dur2 && t1 + dur1 > t2) {
        return `Conflicts with "${e.title}" at ${formatTime(e.time)}`
      }
    }
    return null
  }

  async function handleSave(form, setLoading) {
    const conflict = checkConflict(form, modal?.id)
    if (conflict) {
      setConflictWarning(conflict)
      return
    }
    setConflictWarning(null)
    setLoading(true)
    const user_id = (await supabase.auth.getUser()).data.user.id
    if (modal === 'add') await supabase.from('events').insert({ ...form, user_id })
    else await supabase.from('events').update(form).eq('id', modal.id)
    setLoading(false)
    setModal(null)
    reload()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    await supabase.from('events').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    reload()
  }

  function navigate(dir) {
    const d = new Date(currentDate)
    if (calView === 'month') d.setMonth(d.getMonth() + dir)
    else if (calView === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setDate(d.getDate() + dir)
    setCurrentDate(d)
  }

  function navLabel() {
    if (calView === 'month') return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (calView === 'week') {
      const start = new Date(currentDate)
      start.setDate(currentDate.getDate() - currentDate.getDay())
      const end = new Date(start); end.setDate(start.getDate() + 6)
      return `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const btnStyle = (active) => ({
    padding:'0.3rem 0.75rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,fontSize:'0.75rem',
    background: active ? '#2A2520' : 'transparent',color: active ? 'white' : '#4A4540',cursor:'pointer',
    fontFamily:"'DM Mono',monospace",letterSpacing:'0.05em'
  })

  const HOURS = Array.from({length:14}, (_,i) => i + 7) // 7am - 8pm

  function MonthView() {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return (
      <div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,textAlign:'center',marginBottom:8}}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{padding:'0.5rem 0',fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#8A8278'}}>{d}</div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
          {Array.from({length:firstDay}).map((_,i) => <div key={`e-${i}`}/>)}
          {Array.from({length:daysInMonth},(_,i) => i+1).map(day => {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===day
            const dayEvents = eventsOnDate(dateStr)
            return (
              <div key={day} style={{minHeight:80,padding:6,border:`1px solid ${isToday ? '#C4622D' : 'rgba(42,37,32,0.08)'}`,borderRadius:6,background: isToday ? '#F5E6DE' : 'transparent',cursor:'pointer'}}
                onClick={() => { setCurrentDate(new Date(year,month,day)); setCalView('day') }}>
                <span style={{fontSize:'0.72rem',fontWeight:500,display:'block',marginBottom:4,color: isToday ? '#C4622D' : '#4A4540'}}>{day}</span>
                {dayEvents.slice(0,3).map(e => (
                  <div key={e.id} onClick={ev => { ev.stopPropagation(); setModal(e) }}
                    style={{...(typeColors[e.type]||{background:'#E8E0D5',color:'#8A8278'}),fontSize:'0.62rem',borderRadius:3,padding:'0.15rem 0.4rem',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}}>
                    {e.time ? `${formatTime(e.time)} ` : ''}{e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && <div style={{fontSize:'0.6rem',color:'#8A8278'}}>+{dayEvents.length-3} more</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function WeekView() {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    const days = Array.from({length:7}, (_,i) => {
      const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate()+i); return d
    })
    return (
      <div style={{display:'flex',overflow:'auto'}}>
        {/* Time gutter */}
        <div style={{width:56,flexShrink:0}}>
          <div style={{height:48}}/>
          {HOURS.map(h => (
            <div key={h} style={{height:60,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:'0.5rem',paddingTop:4}}>
              <span style={{fontSize:'0.6rem',color:'#8A8278',fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap'}}>{formatTime(`${h}:00`)}</span>
            </div>
          ))}
        </div>
        {/* Day columns */}
        <div style={{flex:1,display:'grid',gridTemplateColumns:`repeat(7,1fr)`,gap:1}}>
          {days.map(d => {
            const dateStr = d.toISOString().split('T')[0]
            const isToday = d.toDateString() === today.toDateString()
            const dayEvents = eventsOnDate(dateStr)
            return (
              <div key={dateStr} style={{borderLeft:'1px solid rgba(42,37,32,0.06)'}}>
                {/* Day header */}
                <div style={{height:48,padding:'0.4rem',textAlign:'center',borderBottom:'1px solid rgba(42,37,32,0.08)',background: isToday ? '#F5E6DE' : '#FDFAF6',position:'sticky',top:0}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',textTransform:'uppercase',color:'#8A8278'}}>{d.toLocaleDateString('en-US',{weekday:'short'})}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.2rem',color: isToday ? '#C4622D' : '#2A2520',lineHeight:1}}>{d.getDate()}</div>
                </div>
                {/* Hour slots */}
                <div style={{position:'relative'}}>
                  {HOURS.map(h => (
                    <div key={h} style={{height:60,borderBottom:'1px solid rgba(42,37,32,0.04)',borderTop: h===12 ? '1px solid rgba(42,37,32,0.12)' : 'none'}}
                      onClick={() => setModal({_new:true, date:dateStr, time:`${String(h).padStart(2,'0')}:00`})}/>
                  ))}
                  {/* Events overlay */}
                  {dayEvents.map(e => {
                    if (!e.time) return null
                    const [eh, em] = e.time.split(':').map(Number)
                    if (eh < 7 || eh > 20) return null
                    const top = (eh - 7) * 60 + em
                    const height = Math.max(30, (Number(e.duration) || 60))
                    return (
                      <div key={e.id} onClick={() => setModal(e)}
                        style={{position:'absolute',top,left:2,right:2,height,borderRadius:4,padding:'2px 4px',cursor:'pointer',overflow:'hidden',zIndex:2,...(typeColors[e.type]||{background:'#E8E0D5',color:'#8A8278'})}}>
                        <div style={{fontSize:'0.65rem',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.title}</div>
                        <div style={{fontSize:'0.6rem',opacity:0.8}}>{formatTime(e.time)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function DayView() {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayEvents = eventsOnDate(dateStr)
    const isToday = currentDate.toDateString() === today.toDateString()
    const timedEvents = dayEvents.filter(e => e.time)
    const allDayEvents = dayEvents.filter(e => !e.time)
    return (
      <div>
        <div style={{textAlign:'center',marginBottom:'1rem',paddingBottom:'1rem',borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2.5rem',fontWeight:300,color: isToday ? '#C4622D' : '#2A2520',lineHeight:1}}>{currentDate.getDate()}</div>
          <div style={{fontSize:'0.78rem',color:'#8A8278',fontFamily:"'DM Mono',monospace",letterSpacing:'0.1em',textTransform:'uppercase'}}>{currentDate.toLocaleDateString('en-US',{weekday:'long',month:'long',year:'numeric'})}</div>
        </div>
        {allDayEvents.length > 0 && (
          <div style={{marginBottom:'1rem'}}>
            {allDayEvents.map(e => (
              <div key={e.id} onClick={() => setModal(e)}
                style={{display:'flex',gap:'1rem',padding:'0.6rem 1rem',marginBottom:'0.4rem',borderRadius:6,cursor:'pointer',...(typeColors[e.type]||{background:'#E8E0D5',color:'#8A8278'})}}>
                <div style={{flex:1,fontWeight:500}}>{e.title}</div>
                <button onClick={ev => {ev.stopPropagation();setDeleteTarget(e)}} style={{background:'none',border:'none',cursor:'pointer',opacity:0.6,display:'flex'}}><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
        )}
        <div style={{display:'flex',overflow:'auto'}}>
          <div style={{width:64,flexShrink:0}}>
            {HOURS.map(h => (
              <div key={h} style={{height:64,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:'0.75rem',paddingTop:4}}>
                <span style={{fontSize:'0.65rem',color:'#8A8278',fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap'}}>{formatTime(`${h}:00`)}</span>
              </div>
            ))}
          </div>
          <div style={{flex:1,position:'relative',borderLeft:'1px solid rgba(42,37,32,0.1)'}}>
            {HOURS.map(h => (
              <div key={h} style={{height:64,borderBottom:'1px solid rgba(42,37,32,0.06)',borderTop: h===12 ? '1px solid rgba(42,37,32,0.15)' : 'none',background: h===12 ? 'rgba(42,37,32,0.01)' : 'transparent'}}
                onClick={() => setModal({_new:true, date:dateStr, time:`${String(h).padStart(2,'0')}:00`})}/>
            ))}
            {timedEvents.map(e => {
              const [eh, em] = e.time.split(':').map(Number)
              if (eh < 7 || eh > 20) return null
              const top = (eh - 7) * 64 + (em / 60) * 64
              const height = Math.max(40, ((Number(e.duration) || 60) / 60) * 64)
              return (
                <div key={e.id}
                  style={{position:'absolute',top,left:4,right:4,height,borderRadius:6,padding:'4px 8px',cursor:'pointer',overflow:'hidden',zIndex:2,...(typeColors[e.type]||{background:'#E8E0D5',color:'#8A8278'})}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontWeight:500,fontSize:'0.82rem'}}>{e.title}</div>
                      <div style={{fontSize:'0.7rem',opacity:0.85}}>{formatTime(e.time)}{e.duration ? ` · ${e.duration}m` : ''}</div>
                      {e.location && <div style={{fontSize:'0.7rem',opacity:0.7,marginTop:1}}>📍 {e.location}</div>}
                    </div>
                    <div style={{display:'flex',gap:3,flexShrink:0}}>
                      <button onClick={ev => {ev.stopPropagation();setModal(e)}} style={{background:'none',border:'none',cursor:'pointer',opacity:0.7,display:'flex'}}><Pencil size={12}/></button>
                      <button onClick={ev => {ev.stopPropagation();setDeleteTarget(e)}} style={{background:'none',border:'none',cursor:'pointer',opacity:0.7,display:'flex'}}><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const modalEvent = modal?._new ? {title:'',date:modal.date||'',time:modal.time||'',type:'Meeting',notes:'',client_id:'',location:'',duration:''} : modal === 'add' ? null : modal

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520'}}>Calendar</h2>
        <button onClick={() => setModal('add')} style={{background:'#C4622D',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,border:'none',cursor:'pointer'}}>+ Add Event</button>
      </div>
      {conflictWarning && (
        <div style={{marginBottom:'1rem',padding:'0.75rem 1rem',background:'#F5E6DE',border:'1px solid rgba(196,98,45,0.3)',borderRadius:6,fontSize:'0.82rem',color:'#C4622D',display:'flex',alignItems:'center',gap:'0.5rem'}}>
          ⚠️ {conflictWarning} — save again to override, or adjust the time.
          <button onClick={() => setConflictWarning(null)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#C4622D'}}>✕</button>
        </div>
      )}
      <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:'0.5rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <button onClick={() => navigate(-1)} style={{padding:'0.3rem 0.75rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,fontSize:'0.78rem',background:'transparent',color:'#4A4540',cursor:'pointer'}}>←</button>
            <button onClick={() => setCurrentDate(new Date())} style={{padding:'0.3rem 0.6rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,fontSize:'0.72rem',background:'transparent',color:'#8A8278',cursor:'pointer',fontFamily:"'DM Mono',monospace"}}>today</button>
            <button onClick={() => navigate(1)} style={{padding:'0.3rem 0.75rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,fontSize:'0.78rem',background:'transparent',color:'#4A4540',cursor:'pointer'}}>→</button>
            <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.2rem',fontWeight:400,color:'#2A2520',marginLeft:'0.5rem'}}>{navLabel()}</h3>
          </div>
          <div style={{display:'flex',gap:'0.25rem'}}>
            {['month','week','day'].map(v => (
              <button key={v} onClick={() => setCalView(v)} style={btnStyle(calView===v)}>{v}</button>
            ))}
          </div>
        </div>
        {calView === 'month' && <MonthView />}
        {calView === 'week' && <WeekView />}
        {calView === 'day' && <DayView />}
      </div>
      {modal && <EventModal event={modalEvent} onSave={(form, setLoading) => {
        if (conflictWarning) { setConflictWarning(null) }
        handleSave(form, setLoading)
      }} onClose={() => { setModal(null); setConflictWarning(null) }} clients={clients} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

function ClientDetail({ client, projects, invoices, tasks, events, payments, clients, fileMetadata, items, reload, onBack, setDetailProject }) {
  const [activeSection, setActiveSection] = useState('projects')
  const [modal, setModal] = useState(null)
  const [showMessaging, setShowMessaging] = useState(false)
  const [activityLogs, setActivityLogs] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const clientProjects = projects.filter(p => p.client_id === client.id)
  const clientInvoices = invoices.filter(i => i.client_id === client.id)
  const clientEvents = events.filter(e => e.client_id === client.id).sort((a, b) => a.date.localeCompare(b.date))
  const clientTasks = tasks.filter(t => clientProjects.some(p => p.id === t.project_id))
  const totalBilled = clientInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const totalPaid = clientInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const outstanding = totalBilled - totalPaid

  const sections = ['projects', 'invoices', 'meetings', 'tasks', 'files', 'activity']

  async function loadActivity() {
    setActivityLoading(true)
    const { data } = await supabase.from('activity_log').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
    setActivityLogs(data || [])
    setActivityLoading(false)
  }

  useEffect(() => { if (activeSection === 'activity') loadActivity() }, [activeSection])

  async function logActivity(type, classification, subject, body='') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('activity_log').insert({ user_id: user.id, client_id: client.id, type, classification, subject, body })
  }

  async function saveNote() {
    if (!noteText.trim()) return
    setSavingNote(true)
    await logActivity('note', 'User Note', noteText.trim())
    setNoteText('')
    await loadActivity()
    setSavingNote(false)
  }

  async function deleteLog(id) {
    await supabase.from('activity_log').delete().eq('id', id)
    loadActivity()
  }

  const typeIcon = (type) => {
    if (type === 'email') return <Mail size={13} style={{color:'#B8963E'}} />
    if (type === 'sms') return <MessageSquare size={13} style={{color:'#6B7C6E'}} />
    if (type === 'task') return <CheckSquare size={13} style={{color:'#6B7C6E'}} />
    if (type === 'payment') return <TrendingUp size={13} style={{color:'#6B7C6E'}} />
    if (type === 'invoice') return <FileText size={13} style={{color:'#B8963E'}} />
    if (type === 'file') return <FileImage size={13} style={{color:'#8A8278'}} />
    return <MessageSquare size={13} style={{color:'#C4622D'}} />
  }

  const typeColor = (type) => {
    if (type === 'email') return {background:'#F5EDD8',color:'#B8963E'}
    if (type === 'sms') return {background:'#EBF0EC',color:'#6B7C6E'}
    if (type === 'task') return {background:'#EBF0EC',color:'#6B7C6E'}
    if (type === 'payment') return {background:'#EBF0EC',color:'#6B7C6E'}
    if (type === 'invoice') return {background:'#F5EDD8',color:'#B8963E'}
    if (type === 'note') return {background:'#F5E6DE',color:'#C4622D'}
    return {background:'#E8E0D5',color:'#8A8278'}
  }

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:'0.4rem',background:'none',border:'none',cursor:'pointer',color:'#8A8278',fontSize:'0.78rem',marginBottom:'1.25rem',padding:0}}>
        ← Back to Clients
      </button>

      {/* Client header */}
      <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.5rem',marginBottom:'1.25rem'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'1rem'}}>
          <div>
            <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'2rem',fontWeight:300,color:'#2A2520',lineHeight:1}}>{client.name}</h2>
            {client.name2 && <p style={{fontSize:'0.85rem',color:'#8A8278',marginTop:'0.25rem'}}>{client.name2}</p>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <Badge status={client.status} />
            <button onClick={() => setShowMessaging(true)} style={{background:'#6B7C6E',color:'white',border:'none',borderRadius:4,padding:'0.35rem 0.75rem',fontSize:'0.75rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.3rem'}}>
              ✉️ Message
            </button>
            <button onClick={() => setModal(client)} style={{background:'none',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,padding:'0.35rem 0.75rem',fontSize:'0.75rem',color:'#4A4540',cursor:'pointer'}}>Edit</button>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.25rem'}}>
          {/* Contact info */}
          <div>
            <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.55rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#C4B5A0',marginBottom:'0.4rem'}}>Primary</div>
            {client.email && <p style={{fontSize:'0.78rem',color:'#4A4540',marginBottom:'0.2rem'}}>{client.email}</p>}
            {client.phone && <p style={{fontSize:'0.78rem',color:'#4A4540'}}>{client.phone}</p>}
          </div>
          {client.name2 && (
            <div>
              <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.55rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#C4B5A0',marginBottom:'0.4rem'}}>Secondary</div>
              {client.email2 && <p style={{fontSize:'0.78rem',color:'#4A4540',marginBottom:'0.2rem'}}>{client.email2}</p>}
              {client.phone2 && <p style={{fontSize:'0.78rem',color:'#4A4540'}}>{client.phone2}</p>}
            </div>
          )}
          {client.street && (
            <div>
              <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.55rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#C4B5A0',marginBottom:'0.4rem'}}>Address</div>
              <p style={{fontSize:'0.78rem',color:'#4A4540',lineHeight:1.5}}>{client.street}<br/>{client.city}{client.city && client.state ? ', ' : ''}{client.state} {client.zip}</p>
            </div>
          )}
          <div>
            <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.55rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#C4B5A0',marginBottom:'0.4rem'}}>Billing</div>
            <p style={{fontSize:'0.78rem',color:'#4A4540',marginBottom:'0.2rem',textTransform:'capitalize'}}>{client.billing_type || 'Commission'}</p>
            {client.commission_rate > 0 && <p style={{fontSize:'0.72rem',color:'#8A8278'}}>{client.commission_rate}% commission</p>}
            {client.hourly_rate > 0 && <p style={{fontSize:'0.72rem',color:'#8A8278'}}>${client.hourly_rate}/hr</p>}
            {client.retainer_balance > 0 && <p style={{fontSize:'0.72rem',color:'#6B7C6E',marginTop:'0.2rem'}}>Retainer: ${Number(client.retainer_balance).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</p>}
          </div>
        </div>

        {/* Financial summary */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginTop:'1.25rem',paddingTop:'1.25rem',borderTop:'1px solid rgba(42,37,32,0.06)'}}>
          {[
            { label: 'Total Billed', value: `$${totalBilled.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` },
            { label: 'Total Paid', value: `$${totalPaid.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, color:'#6B7C6E' },
            { label: 'Outstanding', value: `$${outstanding.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, color: outstanding > 0 ? '#C4622D' : '#6B7C6E' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{background:'#F7F3EE',borderRadius:6,padding:'0.75rem 1rem'}}>
              <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.55rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.25rem'}}>{label}</div>
              <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.4rem',fontWeight:400,color: color || '#2A2520'}}>{value}</div>
            </div>
          ))}
        </div>

        {client.notes && <p style={{fontSize:'0.78rem',color:'#8A8278',marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid rgba(42,37,32,0.06)'}}>{client.notes}</p>}
      </div>

      {/* Section tabs */}
      <div style={{display:'flex',gap:'0.25rem',marginBottom:'1.25rem',borderBottom:'1px solid rgba(42,37,32,0.08)',paddingBottom:'0'}}>
        {sections.map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            padding:'0.5rem 1rem',fontSize:'0.78rem',border:'none',background:'none',cursor:'pointer',
            textTransform:'capitalize',borderBottom:`2px solid ${activeSection === s ? '#C4622D' : 'transparent'}`,
            color: activeSection === s ? '#C4622D' : '#8A8278',fontWeight: activeSection === s ? 500 : 400,
            marginBottom:'-1px'
          }}>{s}</button>
        ))}
      </div>

      {/* Projects section */}
      {activeSection === 'projects' && (
        <div>
          {clientProjects.length === 0
            ? <p style={{color:'#8A8278',fontSize:'0.82rem',padding:'2rem 0',textAlign:'center'}}>No projects yet</p>
            : <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
                {clientProjects.map(p => {
                  const pct = p.budget ? Math.min(100, Math.round((p.spent / p.budget) * 100)) : 0
                  const over = p.spent > p.budget && p.budget > 0
                  return (
                    <div key={p.id} onClick={() => setDetailProject(p)} style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem',cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'0.25rem'}}>
                        <h3 style={{fontWeight:500,color:'#C4622D',fontSize:'0.9rem'}}>{p.name}</h3>
                        <Badge status={p.status} />
                      </div>
                      {p.budget > 0 && (
                        <div style={{marginTop:'0.75rem'}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.72rem',color:'#8A8278',marginBottom:'0.35rem'}}>
                            <span>Budget: <span style={{color:'#2A2520',fontWeight:500}}>${Number(p.budget).toLocaleString()}</span></span>
                            <span style={{color: over ? '#C4622D' : '#8A8278'}}>Spent: ${Number(p.spent).toLocaleString()}</span>
                          </div>
                          <div style={{width:'100%',background:'#E8E0D5',borderRadius:4,height:3}}>
                            <div style={{height:3,borderRadius:4,width:`${pct}%`,background: over ? '#C4622D' : pct > 80 ? '#B8963E' : '#6B7C6E'}} />
                          </div>
                        </div>
                      )}
                      {p.notes && <p style={{fontSize:'0.72rem',color:'#C4B5A0',marginTop:'0.5rem'}}>{p.notes}</p>}
                    </div>
                  )
                })}
              </div>
          }
        </div>
      )}

      {/* Invoices section */}
      {activeSection === 'invoices' && (
        <InvoicePanel invoices={clientInvoices} payments={payments} projects={projects} clients={clients} items={items} reload={reload} />
      )}

      {/* Meetings section */}
      {activeSection === 'meetings' && (
        <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
          {clientEvents.length === 0
            ? <p style={{color:'#8A8278',fontSize:'0.82rem',padding:'2rem',textAlign:'center'}}>No meetings linked to this client yet</p>
            : <table style={{width:'100%',fontSize:'0.82rem',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
                    {['Date','Time','Title','Type','Location'].map(h => (
                      <th key={h} style={{padding:'0.6rem 1.25rem',textAlign:'left',fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#8A8278',fontWeight:400}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientEvents.map(e => {
                    const isPast = e.date < new Date().toISOString().split('T')[0]
                    return (
                      <tr key={e.id} style={{borderBottom:'1px solid rgba(42,37,32,0.04)',opacity: isPast ? 0.6 : 1}}>
                        <td style={{padding:'0.75rem 1.25rem',color:'#2A2520',fontWeight:500}}>{new Date(e.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                        <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{e.time || '—'}</td>
                        <td style={{padding:'0.75rem 1.25rem',color:'#2A2520'}}>{e.title}</td>
                        <td style={{padding:'0.75rem 1.25rem'}}><Badge status={e.type} /></td>
                        <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{e.location || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
          }
        </div>
      )}

      {/* Tasks section */}
      {activeSection === 'tasks' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
          {clientTasks.length === 0
            ? <div style={{gridColumn:'1/-1',textAlign:'center',padding:'2rem 0',color:'#8A8278',fontSize:'0.82rem'}}>No tasks linked to this client's projects</div>
            : TASK_PRIORITIES.map(priority => {
                const ptasks = clientTasks.filter(t => t.priority === priority)
                const accentColor = priority === 'Today' ? '#C4622D' : priority === 'This Week' ? '#B8963E' : '#6B7C6E'
                return (
                  <div key={priority} style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem',borderTop:`3px solid ${accentColor}`}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
                      <h3 style={{fontFamily:"'DM Mono', monospace",fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#2A2520'}}>{priority}</h3>
                      <span style={{fontSize:'0.7rem',color:'#8A8278'}}>{ptasks.filter(t => !t.done).length} left</span>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                      {ptasks.length === 0 && <p style={{fontSize:'0.75rem',color:'#C4B5A0'}}>No tasks</p>}
                      {ptasks.map(t => (
                        <div key={t.id} style={{display:'flex',alignItems:'flex-start',gap:'0.5rem'}}>
                          <div style={{width:14,height:14,borderRadius:3,border:`1px solid ${t.done ? '#C4622D' : 'rgba(42,37,32,0.2)'}`,flexShrink:0,marginTop:2,background: t.done ? '#C4622D' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            {t.done && <span style={{color:'white',fontSize:'0.6rem'}}>✓</span>}
                          </div>
                          <div>
                            <span style={{fontSize:'0.82rem',color: t.done ? '#C4B5A0' : '#2A2520',textDecoration: t.done ? 'line-through' : 'none'}}>{t.title}</span>
                            <p style={{fontSize:'0.7rem',color:'#8A8278'}}>{projects.find(p => p.id === t.project_id)?.name || ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
          }
        </div>
      )}

      {/* Files section */}
      {activeSection === 'files' && (
        <ClientFilePanel
          client={client}
          projects={projects}
          fileMetadata={fileMetadata}
          reload={reload}
        />
      )}

      {/* Activity / Audit Trail section */}
      {activeSection === 'activity' && (
        <div>
          {/* Add note */}
          <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem',marginBottom:'1.25rem'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.6rem'}}>Add Note</div>
            <div style={{display:'flex',gap:'0.75rem',alignItems:'flex-end'}}>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} placeholder="Log a call, meeting note, or any communication…"
                style={{flex:1,padding:'0.5rem 0.75rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,background:'#F7F3EE',color:'#2A2520',fontSize:'0.82rem',resize:'vertical',fontFamily:"'DM Sans',sans-serif"}} />
              <button onClick={saveNote} disabled={!noteText.trim() || savingNote}
                style={{background: noteText.trim() && !savingNote ? '#C4622D' : '#C4B5A0',color:'white',padding:'0.5rem 1rem',borderRadius:4,fontSize:'0.78rem',border:'none',cursor: noteText.trim() ? 'pointer' : 'not-allowed',display:'flex',alignItems:'center',gap:'0.4rem',flexShrink:0,height:36}}>
                {savingNote && <Loader size={12} className="animate-spin" />} Save Note
              </button>
            </div>
          </div>

          {/* Log entries */}
          <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
            <div style={{padding:'0.9rem 1.25rem',borderBottom:'1px solid rgba(42,37,32,0.06)'}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>History & Communications</span>
            </div>
            {activityLoading ? <div style={{padding:'2rem',textAlign:'center'}}><Loader size={18} className="animate-spin" style={{color:'#C4622D'}} /></div>
            : activityLogs.length === 0
            ? <p style={{color:'#8A8278',fontSize:'0.82rem',padding:'2rem',textAlign:'center'}}>No activity recorded yet</p>
            : <div>
                {activityLogs.map(log => (
                  <div key={log.id} style={{display:'flex',gap:'1rem',padding:'0.9rem 1.25rem',borderBottom:'1px solid rgba(42,37,32,0.04)',alignItems:'flex-start'}}>
                    <div style={{flexShrink:0,marginTop:2}}>{typeIcon(log.type)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.2rem',flexWrap:'wrap'}}>
                        <span style={{...typeColor(log.type),padding:'0.1rem 0.5rem',borderRadius:8,fontSize:'0.65rem',fontFamily:"'DM Mono',monospace"}}>{log.classification}</span>
                        {log.subject && <span style={{fontSize:'0.82rem',color:'#2A2520',fontWeight:500}}>{log.subject}</span>}
                      </div>
                      {log.body && <p style={{fontSize:'0.78rem',color:'#8A8278',marginTop:'0.2rem',lineHeight:1.5,whiteSpace:'pre-wrap'}}>{log.body}</p>}
                    </div>
                    <div style={{flexShrink:0,textAlign:'right'}}>
                      <div style={{fontSize:'0.7rem',color:'#C4B5A0',fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap'}}>
                        {new Date(log.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </div>
                      <div style={{fontSize:'0.65rem',color:'#C4B5A0',fontFamily:"'DM Mono',monospace"}}>
                        {new Date(log.created_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
                      </div>
                      {log.type === 'note' && (
                        <button onClick={() => deleteLog(log.id)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex',marginLeft:'auto',marginTop:'0.25rem'}}><Trash2 size={11} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      )}

      {modal && <ClientModal client={modal} onSave={async (form, setLoading) => {
        setLoading(true)
        await supabase.from('clients').update(form).eq('id', modal.id)
        setLoading(false)
        setModal(null)
        reload()
      }} onClose={() => setModal(null)} />}
      {showMessaging && <ClientMessaging client={client} studioProfile={studioProfile} onClose={() => setShowMessaging(false)} onEmailSent={async (subject, body) => {
        await logActivity('email', 'Email', subject, body)
      }} />}
    </div>
  )
}

function ProjectDetail({ project, clients, projects, vendors, items, tasks, invoices, events, payments, timeLogs, fileMetadata, reload, onBack, backLabel }) {
  const [activeSection, setActiveSection] = useState('items')
  const [modal, setModal] = useState(null)

  const client = clients.find(c => c.id === project.client_id)
  const projectItems = items.filter(i => i.project_id === project.id)
  const projectTasks = tasks.filter(t => t.project_id === project.id)
  const projectInvoices = invoices.filter(i => i.project_id === project.id)
  const projectTimeLogs = timeLogs.filter(t => t.project_id === project.id)
  const pct = project.budget ? Math.min(100, Math.round((project.spent / project.budget) * 100)) : 0
  const over = project.spent > project.budget && project.budget > 0
  const totalHours = projectTimeLogs.reduce((s, t) => s + (Number(t.hours) || 0), 0)
  const unbilledHours = projectTimeLogs.filter(t => !t.billed).reduce((s, t) => s + (Number(t.hours) || 0), 0)
  const sections = ['items', 'tasks', 'time', 'invoices', 'files']

  return (
    <div>
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:'0.4rem',background:'none',border:'none',cursor:'pointer',color:'#8A8278',fontSize:'0.78rem',marginBottom:'1.25rem',padding:0}}>
        ← {backLabel || 'Back to Client'}
      </button>

      {/* Project header */}
      <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.5rem',marginBottom:'1.25rem'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'1rem'}}>
          <div>
            <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'2rem',fontWeight:300,color:'#2A2520',lineHeight:1}}>{project.name}</h2>
            {client && <p style={{fontSize:'0.85rem',color:'#8A8278',marginTop:'0.25rem'}}>{client.name}</p>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <Badge status={project.status} />
            <button onClick={() => setModal(project)} style={{background:'none',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,padding:'0.35rem 0.75rem',fontSize:'0.75rem',color:'#4A4540',cursor:'pointer'}}>Edit</button>
          </div>
        </div>

        {project.budget > 0 && (
          <div style={{marginBottom:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem',color:'#8A8278',marginBottom:'0.4rem'}}>
              <span>Budget: <span style={{color:'#2A2520',fontWeight:500}}>${Number(project.budget).toLocaleString()}</span></span>
              <span style={{color: over ? '#C4622D' : '#8A8278'}}>Spent: ${Number(project.spent).toLocaleString()}{over && ' ⚠️'}</span>
            </div>
            <div style={{width:'100%',background:'#E8E0D5',borderRadius:4,height:4}}>
              <div style={{height:4,borderRadius:4,width:`${pct}%`,background: over ? '#C4622D' : pct > 80 ? '#B8963E' : '#6B7C6E'}} />
            </div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',paddingTop:'1rem',borderTop:'1px solid rgba(42,37,32,0.06)'}}>
          {[
            { label: 'Total Items', value: projectItems.length },
            { label: 'Total Hours', value: `${totalHours}h` },
            { label: 'Unbilled Hours', value: `${unbilledHours}h`, color: unbilledHours > 0 ? '#C4622D' : '#6B7C6E' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{background:'#F7F3EE',borderRadius:6,padding:'0.75rem 1rem'}}>
              <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.55rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.25rem'}}>{label}</div>
              <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.4rem',fontWeight:400,color: color || '#2A2520'}}>{value}</div>
            </div>
          ))}
        </div>

        {project.notes && <p style={{fontSize:'0.78rem',color:'#8A8278',marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid rgba(42,37,32,0.06)'}}>{project.notes}</p>}
      </div>

      {/* Section tabs */}
      <div style={{display:'flex',gap:'0.25rem',marginBottom:'1.25rem',borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
        {sections.map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            padding:'0.5rem 1rem',fontSize:'0.78rem',border:'none',background:'none',cursor:'pointer',
            textTransform:'capitalize',borderBottom:`2px solid ${activeSection === s ? '#C4622D' : 'transparent'}`,
            color: activeSection === s ? '#C4622D' : '#8A8278',fontWeight: activeSection === s ? 500 : 400,
            marginBottom:'-1px'
          }}>{s === 'time' ? 'Time Log' : s}</button>
        ))}
      </div>

      {/* Items section */}
      {activeSection === 'items' && (
        <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
          {projectItems.length === 0
            ? <p style={{color:'#8A8278',fontSize:'0.82rem',padding:'2rem',textAlign:'center'}}>No items yet</p>
            : <table style={{width:'100%',fontSize:'0.82rem',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
                    {['Item','Vendor','Cost','Status'].map(h => (
                      <th key={h} style={{padding:'0.6rem 1.25rem',textAlign:'left',fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#8A8278',fontWeight:400}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectItems.map(i => (
                    <tr key={i.id} style={{borderBottom:'1px solid rgba(42,37,32,0.04)'}}>
                      <td style={{padding:'0.75rem 1.25rem',fontWeight:500,color:'#2A2520'}}>{i.name}</td>
                      <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{vendors.find(v => v.id === i.vendor_id)?.name || '—'}</td>
                      <td style={{padding:'0.75rem 1.25rem',color:'#4A4540'}}>${Number(i.cost).toLocaleString()}</td>
                      <td style={{padding:'0.75rem 1.25rem'}}><Badge status={i.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}

      {/* Tasks section */}
      {activeSection === 'tasks' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
          {TASK_PRIORITIES.map(priority => {
            const ptasks = projectTasks.filter(t => t.priority === priority)
            const accentColor = priority === 'Today' ? '#C4622D' : priority === 'This Week' ? '#B8963E' : '#6B7C6E'
            return (
              <div key={priority} style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem',borderTop:`3px solid ${accentColor}`}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
                  <h3 style={{fontFamily:"'DM Mono', monospace",fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#2A2520'}}>{priority}</h3>
                  <span style={{fontSize:'0.7rem',color:'#8A8278'}}>{ptasks.filter(t => !t.done).length} left</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                  {ptasks.length === 0 && <p style={{fontSize:'0.75rem',color:'#C4B5A0'}}>No tasks</p>}
                  {ptasks.map(t => (
                    <div key={t.id} style={{display:'flex',alignItems:'flex-start',gap:'0.5rem'}}>
                      <div style={{width:14,height:14,borderRadius:3,border:`1px solid ${t.done ? '#C4622D' : 'rgba(42,37,32,0.2)'}`,flexShrink:0,marginTop:2,background: t.done ? '#C4622D' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {t.done && <span style={{color:'white',fontSize:'0.6rem'}}>✓</span>}
                      </div>
                      <span style={{fontSize:'0.82rem',color: t.done ? '#C4B5A0' : '#2A2520',textDecoration: t.done ? 'line-through' : 'none'}}>{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Time log section */}
      {activeSection === 'time' && (
        <TimeLog project={project} timeLogs={projectTimeLogs} reload={reload} client={client} />
      )}

      {/* Invoices section */}
      {activeSection === 'invoices' && (
        <InvoicePanel invoices={projectInvoices} payments={payments} projects={projects} clients={clients} items={items} reload={reload} />
      )}

      {/* Files section */}
      {activeSection === 'files' && (
        <ClientFilePanel
          client={null}
          project={project}
          projects={projects}
          fileMetadata={fileMetadata}
          reload={reload}
        />
      )}

      {modal && <ProjectModal project={modal} clients={clients} onSave={async (form, setLoading) => {
        setLoading(true)
        const data = { ...form, budget: Number(form.budget) || 0, spent: Number(form.spent) || 0 }
        await supabase.from('projects').update(data).eq('id', modal.id)
        setLoading(false)
        setModal(null)
        reload()
      }} onClose={() => setModal(null)} />}
    </div>
  )
}

function TimeLog({ project, timeLogs, reload, client }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], hours: '', description: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const totalHours = timeLogs.reduce((s, t) => s + (Number(t.hours) || 0), 0)
  const unbilledHours = timeLogs.filter(t => !t.billed).reduce((s, t) => s + (Number(t.hours) || 0), 0)
  const hourlyRate = Number(client?.hourly_rate || 0)

  async function handleAdd() {
    setLoading(true)
    const user_id = (await supabase.auth.getUser()).data.user.id
    await supabase.from('time_logs').insert({ ...form, hours: Number(form.hours), project_id: project.id, user_id })
    setLoading(false)
    setShowAdd(false)
    setForm({ date: new Date().toISOString().split('T')[0], hours: '', description: '' })
    reload()
  }

  async function toggleBilled(log) {
    await supabase.from('time_logs').update({ billed: !log.billed }).eq('id', log.id)
    reload()
  }

  async function deleteLog(id) {
    await supabase.from('time_logs').delete().eq('id', id)
    reload()
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
        <div style={{display:'flex',gap:'1rem'}}>
          <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:6,padding:'0.6rem 1rem'}}>
            <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.55rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>Total Hours</div>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.4rem',color:'#2A2520'}}>{totalHours}h</div>
          </div>
          <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:6,padding:'0.6rem 1rem'}}>
            <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.55rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>Unbilled</div>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.4rem',color: unbilledHours > 0 ? '#C4622D' : '#2A2520'}}>{unbilledHours}h{hourlyRate > 0 ? ` · $${(unbilledHours * hourlyRate).toLocaleString()}` : ''}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:'0.75rem'}}>
          {unbilledHours > 0 && (
            <button onClick={async () => {
              const unbilledLogs = timeLogs.filter(t => !t.billed)
              const lineItems = unbilledLogs.map(t => ({
                description: `${t.description || 'Design Services'} (${t.hours}h @ $${hourlyRate}/hr)`,
                amount: String((Number(t.hours) * hourlyRate).toFixed(2)),
                taxable: false
              }))
              const total = unbilledLogs.reduce((s, t) => s + (Number(t.hours) * hourlyRate), 0)
              const autoNum = `INV-${String(Date.now()).slice(-4)}`
              const user_id = (await supabase.auth.getUser()).data.user.id
              await supabase.from('invoices').insert({
                num: autoNum,
                client_id: project.client_id,
                project_id: project.id,
                line_items: lineItems,
                amount: total,
                tax_rate: 0,
                retainer_applied: 0,
                status: 'Pending',
                notes: `Auto-generated from time log — ${unbilledLogs.length} session${unbilledLogs.length !== 1 ? 's' : ''}`,
                user_id
              })
              await Promise.all(unbilledLogs.map(t =>
                supabase.from('time_logs').update({ billed: true }).eq('id', t.id)
              ))
              reload()
              alert(`Invoice ${autoNum} created for ${unbilledHours}h · $${total.toLocaleString()}`)
            }} style={{background:'#6B7C6E',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,border:'none',cursor:'pointer'}}>
              Bill {unbilledHours}h → Invoice
            </button>
          )}
          <button onClick={() => setShowAdd(!showAdd)} style={{background:'#C4622D',color:'white',padding:'0.5rem 1.1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,border:'none',cursor:'pointer'}}>
            + Log Time
          </button>
        </div>
      </div>

      {showAdd && (
        <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem',marginBottom:'1rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 2fr auto',gap:'0.75rem',alignItems:'flex-end'}}>
            <Field label="Date"><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputClass} style={inputStyle} /></Field>
            <Field label="Hours"><input type="number" value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="2.5" className={inputClass} style={inputStyle} /></Field>
            <Field label="Description"><input value={form.description} onChange={e => set('description', e.target.value)} placeholder="What was worked on" className={inputClass} style={inputStyle} /></Field>
            <button onClick={handleAdd} disabled={!form.hours || loading} style={{background:'#C4622D',color:'white',padding:'0.5rem 1rem',borderRadius:4,fontSize:'0.78rem',border:'none',cursor:'pointer',height:36,display:'flex',alignItems:'center',gap:'0.4rem'}}>
              {loading && <Loader size={12} className="animate-spin" />} Save
            </button>
          </div>
        </div>
      )}

      <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
        {timeLogs.length === 0
          ? <p style={{color:'#8A8278',fontSize:'0.82rem',padding:'2rem',textAlign:'center'}}>No time logged yet</p>
          : <table style={{width:'100%',fontSize:'0.82rem',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
                  {['Date','Hours','Description','Value','Billed',''].map(h => (
                    <th key={h} style={{padding:'0.6rem 1.25rem',textAlign:'left',fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#8A8278',fontWeight:400}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeLogs.map(t => (
                  <tr key={t.id} style={{borderBottom:'1px solid rgba(42,37,32,0.04)',opacity: t.billed ? 0.6 : 1}}>
                    <td style={{padding:'0.75rem 1.25rem',color:'#2A2520'}}>{new Date(t.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td style={{padding:'0.75rem 1.25rem',fontWeight:500,color:'#2A2520'}}>{t.hours}h</td>
                    <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{t.description}</td>
                    <td style={{padding:'0.75rem 1.25rem',color:'#4A4540'}}>{hourlyRate > 0 ? `$${(Number(t.hours) * hourlyRate).toLocaleString()}` : '—'}</td>
                    <td style={{padding:'0.75rem 1.25rem'}}>
                      <button onClick={() => toggleBilled(t)} style={{fontSize:'0.72rem',padding:'0.15rem 0.5rem',borderRadius:4,border:'none',cursor:'pointer',background: t.billed ? '#EBF0EC' : '#F5EDD8',color: t.billed ? '#6B7C6E' : '#B8963E'}}>
                        {t.billed ? 'Billed' : 'Unbilled'}
                      </button>
                    </td>
                    <td style={{padding:'0.75rem 1.25rem'}}>
                      <button onClick={() => deleteLog(t.id)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  )
}
function PaymentForm({ invoiceId, invoiceAmount, totalPaid, onSave }) {
  const balance = invoiceAmount - totalPaid
  const [form, setForm] = useState({ amount: String(balance.toFixed(2)), date: new Date().toISOString().split('T')[0], method: 'Check', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.amount && Number(form.amount) > 0 && form.date

  async function handleSave() {
    setLoading(true)
    await onSave(form)
    setForm({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Check', notes: '' })
    setLoading(false)
  }

  return (
    <div style={{borderTop:'1px solid rgba(42,37,32,0.08)',paddingTop:'0.75rem',marginTop:'0.25rem'}}>
      <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.6rem'}}>Log Payment</div>
      <div style={{display:'grid',gridTemplateColumns:'120px 140px 160px 1fr auto',gap:'0.5rem',alignItems:'flex-end'}}>
        <Field label="Amount ($)">
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className={inputClass} style={inputStyle} />
        </Field>
        <Field label="Date">
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputClass} style={inputStyle} />
        </Field>
        <Field label="Method">
          <select value={form.method} onChange={e => set('method', e.target.value)} className={inputClass} style={inputStyle}>
            {['Check','ACH','Credit Card','Zelle','Venmo','Cash','Other'].map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Notes">
          <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional note" className={inputClass} style={inputStyle} />
        </Field>
        <button onClick={handleSave} disabled={!valid || loading} style={{background: valid && !loading ? '#C4622D' : '#C4B5A0',color:'white',padding:'0.5rem 1rem',borderRadius:4,fontSize:'0.78rem',border:'none',cursor: valid ? 'pointer' : 'not-allowed',height:36,display:'flex',alignItems:'center',gap:'0.4rem',flexShrink:0}}>
          {loading && <Loader size={12} className="animate-spin" />} Save
        </button>
      </div>
      {balance > 0 && (
        <p style={{fontSize:'0.72rem',color:'#8A8278',marginTop:'0.5rem'}}>
          Balance remaining after this payment: <span style={{color: Number(form.amount) >= balance ? '#6B7C6E' : '#C4622D',fontWeight:500}}>${Math.max(0, balance - (Number(form.amount)||0)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </p>
      )}
    </div>
  )
}

function ClientFilePanel({ client, project, projects, fileMetadata, reload }) {
  const [uploading, setUploading] = useState(false)
  const [uploadTags, setUploadTags] = useState({
    room_type: '', style_tag: '', file_type: '', url: '',
    client_id: client?.id || '',
    project_id: project?.id || ''
  })
  const [showUpload, setShowUpload] = useState(false)
  const setTag = (f, v) => setUploadTags(p => ({ ...p, [f]: v }))

  // Filter files relevant to this client or project
  const relevantFiles = fileMetadata.filter(f => {
    if (project) return f.project_id === project.id
    if (client) return f.client_id === client.id || projects.filter(p => p.client_id === client.id).some(p => p.id === f.project_id)
    return false
  })

  const [signedFiles, setSignedFiles] = useState([])

  useEffect(() => {
    async function loadSigned() {
      const enriched = await Promise.all(relevantFiles.map(async f => {
        const { data } = await supabase.storage
          .from('studio-files')
          .createSignedUrl(f.storage_path, 3600)
        return { ...f, signedUrl: data?.signedUrl }
      }))
      setSignedFiles(enriched)
    }
    loadSigned()
  }, [fileMetadata])

  function isImage(path) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(path)
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const path = `${user.id}/${fileName}`
    const { error } = await supabase.storage.from('studio-files').upload(path, file)
    if (!error) {
      await supabase.from('file_metadata').insert({
        user_id: user.id,
        storage_path: path,
        display_name: file.name,
        project_id: uploadTags.project_id || null,
        client_id: uploadTags.client_id || null,
        room_type: uploadTags.room_type || null,
        style_tag: uploadTags.style_tag || null,
        file_type: uploadTags.file_type || null,
        url: uploadTags.url || null,
      })
      setShowUpload(false)
      reload()
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(f) {
    await supabase.storage.from('studio-files').remove([f.storage_path])
    await supabase.from('file_metadata').delete().eq('id', f.id)
    reload()
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
        <div style={{fontFamily:"'DM Mono', monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>
          {signedFiles.length} file{signedFiles.length !== 1 ? 's' : ''}
        </div>
        <button onClick={() => setShowUpload(!showUpload)} style={{background:'#C4622D',color:'white',padding:'0.4rem 0.9rem',borderRadius:4,fontSize:'0.75rem',fontWeight:500,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem'}}>
          <Upload size={13} /> Upload File
        </button>
      </div>

      {showUpload && (
        <div style={{background:'#F7F3EE',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1rem',marginBottom:'1rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem',marginBottom:'0.75rem'}}>
            {!project && (
              <Field label="Project">
                <select value={uploadTags.project_id} onChange={e => setTag('project_id', e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="">— None —</option>
                  {projects.filter(p => p.client_id === client?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="File Type">
              <select value={uploadTags.file_type} onChange={e => setTag('file_type', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {FILE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Room Type">
              <select value={uploadTags.room_type} onChange={e => setTag('room_type', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Style Tag">
              <select value={uploadTags.style_tag} onChange={e => setTag('style_tag', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">— None —</option>
                {STYLE_TAGS.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Product URL (optional)">
            <input value={uploadTags.url} onChange={e => setTag('url', e.target.value)} placeholder="https://www.vendor.com/product" className={inputClass} style={{...inputStyle,marginBottom:'0.75rem'}} />
          </Field>
          <label style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',background: uploading ? '#C4B5A0' : '#C4622D',color:'white',padding:'0.4rem 0.9rem',borderRadius:4,fontSize:'0.75rem',fontWeight:500,cursor: uploading ? 'not-allowed' : 'pointer'}}>
            {uploading ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? 'Uploading…' : 'Choose & Upload'}
            <input type="file" style={{display:'none'}} onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      )}

      {signedFiles.length === 0
        ? <p style={{color:'#8A8278',fontSize:'0.82rem',padding:'2rem',textAlign:'center'}}>No files yet</p>
        : <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem'}}>
            {signedFiles.map(f => (
              <div key={f.id} style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
                <div style={{height:120,background:'#E8E0D5',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                  {isImage(f.storage_path) && f.signedUrl
                    ? <img src={f.signedUrl} alt={f.display_name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    : <FileImage size={32} style={{color:'#C4B5A0'}} />
                  }
                </div>
                <div style={{padding:'0.6rem'}}>
                  <p style={{fontSize:'0.78rem',fontWeight:500,color:'#2A2520',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.display_name}</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'0.25rem',marginTop:'0.3rem'}}>
                    {f.file_type && <span style={{background:'#F5EDD8',color:'#B8963E',fontSize:'0.6rem',fontFamily:"'DM Mono',monospace",padding:'0.1rem 0.4rem',borderRadius:8}}>{f.file_type}</span>}
                    {f.room_type && <span style={{background:'#EBF0EC',color:'#6B7C6E',fontSize:'0.6rem',fontFamily:"'DM Mono',monospace",padding:'0.1rem 0.4rem',borderRadius:8}}>{f.room_type}</span>}
                    {f.style_tag && <span style={{background:'#E8E0D5',color:'#8A8278',fontSize:'0.6rem',fontFamily:"'DM Mono',monospace",padding:'0.1rem 0.4rem',borderRadius:8}}>{f.style_tag}</span>}
                  </div>
                  <div style={{display:'flex',gap:'0.4rem',marginTop:'0.4rem',alignItems:'center'}}>
                    {f.signedUrl && <a href={f.signedUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.7rem',color:'#C4622D',textDecoration:'none',display:'flex',alignItems:'center',gap:2}}><Download size={11} /> View</a>}
                    {f.url && <a href={f.url} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.7rem',color:'#6B7C6E',textDecoration:'none'}}>🔗 Product</a>}
                    <button onClick={() => handleDelete(f)} style={{marginLeft:'auto',color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ── INVOICE PANEL (reusable - used in client & project detail) ────────────
function InvoicePanel({ invoices, payments, projects, clients, items, studioProfile, reload }) {
  const [expandedInvoice, setExpandedInvoice] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleSaveInvoice(form, setLoading) {
    setLoading(true)
    const data = { ...form, amount: Number(form.amount) || 0, due: form.due || null, project_id: form.project_id || null, client_id: form.client_id || null }
    const user_id = (await supabase.auth.getUser()).data.user.id
    const retainerApplied = Number(form.retainer_applied) || 0
    const previouslyApplied = editModal !== 'add' ? Number(editModal.retainer_applied) || 0 : 0
    const retainerDiff = retainerApplied - previouslyApplied
    await supabase.from('invoices').update(data).eq('id', editModal.id)
    if (retainerDiff !== 0 && form.client_id) {
      const client = clients.find(c => c.id === form.client_id)
      if (client) {
        const newBalance = Math.max(0, Number(client.retainer_balance || 0) - retainerDiff)
        await supabase.from('clients').update({ retainer_balance: newBalance }).eq('id', form.client_id)
      }
    }
    setLoading(false)
    setEditModal(null)
    reload()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    await supabase.from('invoices').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    reload()
  }

  function generatePanelPDF(invoice) {
    const doc = new jsPDF()
    const client = clients.find(c => c.id === invoice.client_id)
    const project = projects.find(p => p.id === invoice.project_id)
    const sp = studioProfile || {}
    const brand = {
      name: sp.studio_name || 'Elegant Interiors',
      tagline: sp.tagline || 'Interior Design Studio',
      website: sp.website || '',
      email: sp.email || '',
      phone: sp.phone || '',
      address: sp.address || '',
      thankYou: sp.thank_you_note || 'Thank you for the privilege of designing your space.',
      logoUrl: sp.logo_url || null,
    }
    const ink=[42,37,32],sand=[247,243,238],terra=[184,150,62],bark=[196,181,160],muted=[138,130,120],warm=[253,250,246]
    const pageW=210,pageH=297,margin=18
    doc.setFillColor(...sand); doc.rect(0,0,pageW,pageH,'F')
    doc.setFillColor(...terra); doc.rect(0,0,4,pageH,'F')
    doc.setFillColor(...warm); doc.rect(4,0,pageW-4,52,'F')
    doc.setTextColor(...ink); doc.setFontSize(22); doc.setFont('helvetica','bold')
    doc.text(brand.name.toUpperCase(),margin+4,20)
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...muted)
    doc.text(brand.tagline,margin+4,27)
    doc.setFontSize(7.5); doc.text(brand.email,pageW-margin,14,{align:'right'})
    doc.text(brand.phone,pageW-margin,20,{align:'right'})
    doc.text(brand.website,pageW-margin,26,{align:'right'})
    doc.setDrawColor(...bark); doc.setLineWidth(0.3); doc.line(margin,34,pageW-margin,34)
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...terra)
    doc.text('INVOICE',margin+4,43); doc.setTextColor(...ink); doc.setFont('helvetica','normal')
    doc.text(invoice.num,margin+28,43)
    doc.setTextColor(...muted); doc.text(`Issued: ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`,pageW-margin,43,{align:'right'})
    let y=62
    doc.setFillColor(...warm); doc.roundedRect(margin,y,85,38,2,2,'F')
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...terra)
    doc.text('BILL TO',margin+5,y+8)
    doc.setTextColor(...ink); doc.setFontSize(10); doc.setFont('helvetica','bold')
    doc.text(client?.name||'—',margin+5,y+16)
    doc.setFontSize(8.5); doc.setFont('helvetica','normal'); doc.setTextColor(...muted)
    let cY=client?.name2?y+28:y+22
    if(client?.email){doc.text(client.email,margin+5,cY);cY+=5}
    if(client?.phone)doc.text(client.phone,margin+5,cY)
    doc.setFillColor(...warm); doc.roundedRect(margin+90,y,102,38,2,2,'F')
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...terra)
    doc.text('PROJECT',margin+95,y+8)
    doc.setTextColor(...ink); doc.setFontSize(9.5); doc.setFont('helvetica','bold')
    doc.text(project?.name||'—',margin+95,y+16)
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...terra)
    doc.text('DUE DATE',margin+95,y+26)
    doc.setTextColor(...ink); doc.setFontSize(9); doc.setFont('helvetica','normal')
    const dueStr=invoice.due?new Date(invoice.due+'T00:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):'Upon Receipt'
    doc.text(dueStr,margin+95,y+33)
    y+=48
    doc.setFillColor(...ink); doc.rect(margin,y,pageW-margin*2,9,'F')
    doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont('helvetica','bold')
    doc.text('DESCRIPTION',margin+4,y+6); doc.text('AMOUNT',pageW-margin-4,y+6,{align:'right'})
    doc.text('TAXABLE',pageW-margin-32,y+6,{align:'right'})
    y+=9
    const lineItems=invoice.line_items?.length?invoice.line_items:[{description:project?.name||'Services Rendered',amount:invoice.amount,taxable:true}]
    lineItems.forEach((line,idx)=>{
      doc.setFillColor(...(idx%2===0?warm:sand)); doc.rect(margin,y,pageW-margin*2,9,'F')
      doc.setTextColor(...ink); doc.setFontSize(8.5); doc.setFont('helvetica','normal')
      doc.text(String(line.description||''),margin+4,y+6)
      doc.text(`$${Number(line.amount||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`,pageW-margin-4,y+6,{align:'right'})
      doc.setTextColor(...muted); doc.setFontSize(7)
      doc.text(line.taxable===false?'No':'Yes',pageW-margin-32,y+6,{align:'right'})
      y+=9
    })
    doc.setDrawColor(...bark); doc.setLineWidth(0.3); doc.line(margin,y,pageW-margin,y); y+=6
    const subtotal=lineItems.reduce((s,l)=>s+(Number(l.amount)||0),0)
    const taxRate=Number(invoice.tax_rate)||0
    const taxableSubtotal=lineItems.reduce((s,l)=>l.taxable===false?s:s+(Number(l.amount)||0),0)
    const taxAmount=taxableSubtotal*taxRate/100
    const retainerApplied=Number(invoice.retainer_applied)||0
    const total=subtotal+taxAmount-retainerApplied
    const totalsX=pageW-margin-70
    function totalsRow(label,value,bold=false,color=ink){
      doc.setFontSize(bold?9.5:8.5); doc.setFont('helvetica',bold?'bold':'normal')
      doc.setTextColor(...muted); doc.text(label,totalsX,y)
      doc.setTextColor(...color); doc.text(value,pageW-margin,y,{align:'right'})
      y+=bold?7:6
    }
    totalsRow('Subtotal',`$${subtotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`)
    if(taxRate>0)totalsRow(`Tax (${taxRate}%)`,`$${taxAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`)
    if(retainerApplied>0)totalsRow('Retainer Applied',`-$${retainerApplied.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`,false,[107,124,110])
    y+=2
    doc.setFillColor(...ink); doc.roundedRect(totalsX-4,y-5,pageW-margin-totalsX+4+margin,12,2,2,'F')
    doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont('helvetica','bold')
    doc.text('INVOICE TOTAL',totalsX,y+3)
    doc.text(`$${total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`,pageW-margin,y+3,{align:'right'})
    y+=16
    // Payments
    const invPayments = invoice._payments||[]
    const totalPaid = invPayments.reduce((s,p)=>s+(Number(p.amount)||0),0)
    const remaining = Math.max(0,total-totalPaid)
    if(invPayments.length>0){
      y+=2; doc.setDrawColor(...bark); doc.setLineWidth(0.3); doc.line(margin,y,pageW-margin,y); y+=6
      doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(...terra)
      doc.text('PAYMENTS RECEIVED',margin,y); y+=5
      invPayments.forEach(p=>{
        doc.setFont('helvetica','normal'); doc.setTextColor(...ink); doc.setFontSize(8)
        const pDate=p.date?new Date(p.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''
        doc.text(`${pDate} — ${p.method}`,margin,y)
        doc.text(`-$${Number(p.amount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`,pageW-margin,y,{align:'right'})
        y+=6
      })
      y+=2
      doc.setFillColor(...(remaining<=0?[107,124,110]:[196,98,45]))
      doc.roundedRect(totalsX-4,y-5,pageW-margin-totalsX+4+margin,10,2,2,'F')
      doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont('helvetica','bold')
      doc.text(remaining<=0?'PAID IN FULL':'BALANCE DUE',totalsX,y+2)
      doc.text(`$${remaining.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`,pageW-margin,y+2,{align:'right'})
      y+=14
    }
    doc.setFontSize(8); doc.setFont('helvetica','bold')
    const statusColor=invoice.status==='Paid'?[107,124,110]:invoice.status==='Overdue'?terra:muted
    doc.setTextColor(...statusColor); doc.text(`STATUS: ${invoice.status.toUpperCase()}`,margin,y); y+=10
    if(invoice.notes){
      doc.setDrawColor(...bark); doc.setLineWidth(0.3); doc.line(margin,y,pageW-margin,y); y+=6
      doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(...terra)
      doc.text('NOTES',margin,y); y+=5; doc.setFont('helvetica','normal'); doc.setTextColor(...ink)
      doc.text(invoice.notes,margin,y,{maxWidth:pageW-margin*2})
    }
    doc.setFillColor(...ink); doc.rect(0,pageH-22,pageW,22,'F')
    doc.setFontSize(8); doc.setFont('helvetica','italic'); doc.setTextColor(...bark)
    doc.text(brand.thankYou,pageW/2,pageH-13,{align:'center'})
    doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...muted)
    doc.text(`${brand.website} · ${brand.email}`,pageW/2,pageH-7,{align:'center'})
    doc.save(`invoice-${invoice.num}.pdf`)
  }

  async function sendReminder(invoice) {
    const client = clients.find(c => c.id === invoice.client_id)
    if (!client?.email) { alert('No email on file for this client.'); return }
    const sp = studioProfile || {}
    const studioName = sp.studio_name || 'Elegant Interiors'
    const thankYou = sp.thank_you_note || 'Thank you for the privilege of designing your space.'
    const due = invoice.due ? new Date(invoice.due+'T00:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : 'soon'
    const invPayments = payments.filter(p => p.invoice_id === invoice.id)
    const totalPaid = invPayments.reduce((s,p)=>s+(Number(p.amount)||0),0)
    const balance = Math.max(0, Number(invoice.amount||0) - totalPaid)
    const html = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#F7F3EE"><div style="background:#2A2520;padding:28px 32px;border-left:4px solid #B8963E">${sp.logo_url?`<img src="${sp.logo_url}" alt="${studioName}" style="max-height:40px;max-width:180px;object-fit:contain;margin-bottom:8px;display:block;"/>`:''}<h1 style="color:#F7F3EE;margin:0;font-size:22px;font-weight:400;letter-spacing:0.05em">${studioName}</h1><p style="color:#C4B5A0;margin:6px 0 0;font-family:monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase">Invoice Reminder</p></div><div style="background:#FDFAF6;padding:32px;border:1px solid #E8E0D5;border-top:none"><p style="color:#2A2520;font-size:15px;margin:0 0 16px">Dear ${client.name},</p><p style="color:#4A4540;font-size:14px;line-height:1.6;margin:0 0 24px">A friendly reminder that the following invoice is due.</p><div style="background:#F7F3EE;border:1px solid #E8E0D5;border-radius:4px;padding:20px 24px;margin:0 0 24px"><table style="width:100%;border-collapse:collapse"><tr><td style="color:#8A8278;font-family:monospace;font-size:11px;text-transform:uppercase;padding:4px 0">Invoice</td><td style="color:#2A2520;font-size:14px;font-weight:bold;text-align:right;padding:4px 0">${invoice.num}</td></tr><tr><td style="color:#8A8278;font-family:monospace;font-size:11px;text-transform:uppercase;padding:4px 0">Invoice Total</td><td style="color:#2A2520;font-size:14px;text-align:right;padding:4px 0">$${Number(invoice.amount||0).toLocaleString()}</td></tr>${totalPaid>0?`<tr><td style="color:#8A8278;font-family:monospace;font-size:11px;text-transform:uppercase;padding:4px 0">Paid</td><td style="color:#6B7C6E;font-size:14px;text-align:right;padding:4px 0">-$${totalPaid.toLocaleString()}</td></tr>`:''}<tr style="border-top:1px solid #E8E0D5"><td style="color:#C4622D;font-family:monospace;font-size:11px;text-transform:uppercase;padding:8px 0 4px;font-weight:bold">Balance Due</td><td style="color:#C4622D;font-size:18px;font-weight:bold;text-align:right;padding:8px 0 4px">$${balance.toLocaleString()}</td></tr><tr><td style="color:#8A8278;font-family:monospace;font-size:11px;text-transform:uppercase;padding:4px 0">Due Date</td><td style="color:#2A2520;font-size:14px;text-align:right;padding:4px 0">${due}</td></tr></table></div><p style="color:#4A4540;font-size:14px;line-height:1.6;margin:0 0 32px">${thankYou}</p><p style="color:#8A8278;font-size:11px;font-family:monospace;margin:0;padding-top:16px;border-top:1px solid #E8E0D5">${studioName} · Studio OS</p></div></div>`
    const result = await sendEmail(client.email, `Invoice Reminder: ${invoice.num} — $${balance.toLocaleString()} due ${due}`, html, studioName)
    if (result.error) alert(`Failed: ${result.error}`)
    else alert(`Reminder sent to ${client.email}`)
  }

  return (
    <div>
      {invoices.length === 0
        ? <p style={{color:'#8A8278',fontSize:'0.82rem',padding:'2rem',textAlign:'center'}}>No invoices yet</p>
        : <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
            <table style={{width:'100%',fontSize:'0.82rem',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
                  {['Invoice #','Amount','Paid','Balance','Due','Status',''].map(h => (
                    <th key={h} style={{padding:'0.6rem 1.25rem',textAlign:'left',fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#8A8278',fontWeight:400}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(i => {
                  const invPayments = payments.filter(p => p.invoice_id === i.id)
                  const totalPaid = invPayments.reduce((s,p)=>s+(Number(p.amount)||0),0)
                  const balance = Number(i.amount||0) - totalPaid
                  const isExpanded = expandedInvoice === i.id
                  return (
                    <React.Fragment key={i.id}>
                      <tr style={{borderBottom: isExpanded ? 'none' : '1px solid rgba(42,37,32,0.04)'}}>
                        <td style={{padding:'0.75rem 1.25rem',fontWeight:500,color:'#2A2520'}}>{i.num}</td>
                        <td style={{padding:'0.75rem 1.25rem',color:'#4A4540',fontWeight:500}}>${Number(i.amount||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                        <td style={{padding:'0.75rem 1.25rem',color:'#6B7C6E'}}>{totalPaid>0?`$${totalPaid.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`:'—'}</td>
                        <td style={{padding:'0.75rem 1.25rem',color:balance<=0?'#6B7C6E':balance<Number(i.amount||0)?'#B8963E':'#C4622D',fontWeight:500}}>${Math.max(0,balance).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                        <td style={{padding:'0.75rem 1.25rem',color:'#8A8278'}}>{i.due?new Date(i.due+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}</td>
                        <td style={{padding:'0.75rem 1.25rem'}}><Badge status={i.status}/></td>
                        <td style={{padding:'0.75rem 1.25rem'}}>
                          <div style={{display:'flex',gap:'0.5rem',alignItems:'center',justifyContent:'flex-end'}}>
                            <button onClick={()=>setExpandedInvoice(isExpanded?null:i.id)} style={{color:isExpanded?'#C4622D':'#C4B5A0',background:'none',border:'none',cursor:'pointer',fontSize:'0.72rem',fontFamily:"'DM Mono',monospace"}} title="Log payment">{isExpanded?'close':'$pay'}</button>
                            <button onClick={()=>generatePanelPDF({...i,_payments:invPayments})} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}} title="Download PDF"><Download size={14}/></button>
                            <button onClick={()=>sendReminder(i)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}} title="Send reminder"><Mail size={14}/></button>
                            <button onClick={()=>setEditModal(i)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Pencil size={14}/></button>
                            <button onClick={()=>setDeleteTarget(i)} style={{color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
                          <td colSpan={7} style={{padding:'0 1.25rem 1.25rem'}}>
                            <div style={{background:'#F7F3EE',borderRadius:6,padding:'1rem'}}>
                              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.75rem'}}>Payment History</div>
                              {invPayments.length===0
                                ? <p style={{fontSize:'0.78rem',color:'#C4B5A0',marginBottom:'0.75rem'}}>No payments recorded yet</p>
                                : <div style={{marginBottom:'0.75rem'}}>
                                    {invPayments.map(p => (
                                      <div key={p.id} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.4rem 0',borderBottom:'1px solid rgba(42,37,32,0.06)',fontSize:'0.78rem'}}>
                                        <span style={{color:'#2A2520',fontWeight:500}}>${Number(p.amount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                                        <span style={{color:'#8A8278'}}>{p.date?new Date(p.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}</span>
                                        <span style={{color:'#8A8278',fontFamily:"'DM Mono',monospace",fontSize:'0.65rem'}}>{p.method}</span>
                                        {p.notes&&<span style={{color:'#C4B5A0',fontStyle:'italic'}}>{p.notes}</span>}
                                        <button onClick={async()=>{await supabase.from('payments').delete().eq('id',p.id);reload()}} style={{marginLeft:'auto',color:'#C4B5A0',background:'none',border:'none',cursor:'pointer',display:'flex'}}><Trash2 size={12}/></button>
                                      </div>
                                    ))}
                                  </div>
                              }
                              <PaymentForm invoiceId={i.id} invoiceAmount={Number(i.amount||0)} totalPaid={totalPaid} onSave={async(form)=>{
                                const user_id=(await supabase.auth.getUser()).data.user.id
                                await supabase.from('payments').insert({...form,invoice_id:i.id,user_id})
                                const newPaid=totalPaid+Number(form.amount)
                                if(newPaid>=Number(i.amount||0)) await supabase.from('invoices').update({status:'Paid'}).eq('id',i.id)
                                // Log to activity
                                const clientId = i.client_id
                                if (clientId) {
                                  await supabase.from('activity_log').insert({ user_id, client_id: clientId, type:'payment', classification:'Payment', subject:`Payment of $${Number(form.amount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} logged`, body:`Invoice: ${i.num} · Method: ${form.method}${form.notes?' · '+form.notes:''}` })
                                }
                                reload()
                              }}/>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
      }
      {editModal && <InvoiceModal invoice={editModal} clients={clients} projects={projects} items={items} onSave={handleSaveInvoice} onClose={()=>setEditModal(null)}/>}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.num} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)} loading={deleteLoading}/>}
    </div>
  )
}

// ── CLIENT MESSAGING ──────────────────────────────────────
function ClientMessaging({ client, onClose, onEmailSent, studioProfile }) {
  const [mode, setMode] = useState('email')
  const [to, setTo] = useState('primary')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const studioName = studioProfile?.studio_name || 'Elegant Interiors'
  const hasPrimary = !!(client.email)
  const hasSecondary = !!(client.email2)

  const getRecipients = () => {
    if (to === 'primary') return [client.email].filter(Boolean)
    if (to === 'secondary') return [client.email2].filter(Boolean)
    return [client.email, client.email2].filter(Boolean)
  }

  async function handleSend() {
    if (!body.trim()) return
    setSending(true)
    const recipients = getRecipients()
    const finalSubject = subject || `Message from ${studioName}`
    const html = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#F7F3EE"><div style="background:#2A2520;padding:28px 32px;border-left:4px solid #B8963E">${studioProfile?.logo_url?`<img src="${studioProfile.logo_url}" alt="${studioName}" style="max-height:40px;max-width:180px;object-fit:contain;margin-bottom:8px;display:block;"/>`:''}<h1 style="color:#F7F3EE;margin:0;font-size:22px;font-weight:400">${studioName}</h1></div><div style="background:#FDFAF6;padding:32px;border:1px solid #E8E0D5;border-top:none"><p style="color:#2A2520;font-size:15px;margin:0 0 16px">Dear ${client.name},</p><div style="color:#4A4540;font-size:14px;line-height:1.8;white-space:pre-wrap">${body}</div><p style="color:#8A8278;font-size:11px;font-family:monospace;margin:24px 0 0;padding-top:16px;border-top:1px solid #E8E0D5">${studioName} · Studio OS</p></div></div>`
    for (const email of recipients) {
      await sendEmail(email, finalSubject, html, studioName)
    }
    if (onEmailSent) await onEmailSent(finalSubject, body)
    setSending(false)
    setSent(true)
    setTimeout(() => { setSent(false); setBody(''); setSubject('') }, 2000)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(42,37,32,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
      <div style={{background:'#FDFAF6',borderRadius:8,boxShadow:'0 8px 40px rgba(42,37,32,0.15)',padding:'1.5rem',width:'100%',maxWidth:520}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.3rem',fontWeight:400,color:'#2A2520'}}>Message {client.name}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#8A8278'}}><X size={18}/></button>
        </div>

        {/* Mode toggle */}
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
          {['email','sms'].map(m => (
            <button key={m} onClick={()=>setMode(m)} style={{padding:'0.4rem 1rem',borderRadius:4,border:'1px solid rgba(42,37,32,0.15)',background:mode===m?'#2A2520':'transparent',color:mode===m?'white':'#4A4540',fontSize:'0.78rem',cursor:'pointer',fontFamily:"'DM Mono',monospace",letterSpacing:'0.05em',textTransform:'uppercase'}}>
              {m === 'email' ? '✉️ Email' : '📱 SMS'}
            </button>
          ))}
        </div>

        {mode === 'sms' ? (
          <div style={{background:'#F7F3EE',borderRadius:6,padding:'1rem',marginBottom:'1rem',fontSize:'0.82rem',color:'#8A8278',lineHeight:1.5}}>
            SMS is sent via your device. Copy the message below and send via your phone's messaging app.
            <div style={{marginTop:'0.75rem',display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
              {client.phone && <a href={`sms:${client.phone}`} style={{background:'#C4622D',color:'white',padding:'0.4rem 0.9rem',borderRadius:4,fontSize:'0.75rem',textDecoration:'none'}}>📱 {client.name} ({client.phone})</a>}
              {client.phone2 && <a href={`sms:${client.phone2}`} style={{background:'#6B7C6E',color:'white',padding:'0.4rem 0.9rem',borderRadius:4,fontSize:'0.75rem',textDecoration:'none'}}>📱 {client.name2||'Secondary'} ({client.phone2})</a>}
            </div>
          </div>
        ) : (
          <>
            {/* Recipient */}
            <div style={{marginBottom:'0.75rem'}}>
              <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',display:'block',marginBottom:'0.4rem'}}>Send To</label>
              <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                {hasPrimary && <button onClick={()=>setTo('primary')} style={{padding:'0.35rem 0.75rem',borderRadius:4,border:`1px solid ${to==='primary'?'#C4622D':'rgba(42,37,32,0.15)'}`,background:to==='primary'?'#F5E6DE':'transparent',color:to==='primary'?'#C4622D':'#4A4540',fontSize:'0.78rem',cursor:'pointer'}}>{client.name} (Primary)</button>}
                {hasSecondary && <button onClick={()=>setTo('secondary')} style={{padding:'0.35rem 0.75rem',borderRadius:4,border:`1px solid ${to==='secondary'?'#C4622D':'rgba(42,37,32,0.15)'}`,background:to==='secondary'?'#F5E6DE':'transparent',color:to==='secondary'?'#C4622D':'#4A4540',fontSize:'0.78rem',cursor:'pointer'}}>{client.name2||'Secondary'}</button>}
                {hasPrimary && hasSecondary && <button onClick={()=>setTo('both')} style={{padding:'0.35rem 0.75rem',borderRadius:4,border:`1px solid ${to==='both'?'#C4622D':'rgba(42,37,32,0.15)'}`,background:to==='both'?'#F5E6DE':'transparent',color:to==='both'?'#C4622D':'#4A4540',fontSize:'0.78rem',cursor:'pointer'}}>Both</button>}
              </div>
            </div>
          </>
        )}

        {mode === 'email' && (
          <>
            <div style={{marginBottom:'0.75rem'}}>
              <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',display:'block',marginBottom:'0.4rem'}}>Subject</label>
              <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Update on your project" className="w-full" style={{width:'100%',padding:'0.5rem 0.75rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,background:'#FDFAF6',color:'#2A2520',fontSize:'0.85rem'}}/>
            </div>
            <div style={{marginBottom:'1rem'}}>
              <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',display:'block',marginBottom:'0.4rem'}}>Message</label>
              <textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} placeholder="Write your message here..." style={{width:'100%',padding:'0.5rem 0.75rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,background:'#FDFAF6',color:'#2A2520',fontSize:'0.85rem',resize:'vertical',lineHeight:1.6}}/>
            </div>
            <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
              <button onClick={onClose} style={{padding:'0.5rem 1rem',fontSize:'0.78rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,background:'transparent',color:'#4A4540',cursor:'pointer'}}>Cancel</button>
              <button onClick={handleSend} disabled={!body.trim()||sending||sent} style={{padding:'0.5rem 1.1rem',fontSize:'0.78rem',borderRadius:4,border:'none',background:sent?'#6B7C6E':body.trim()&&!sending?'#C4622D':'#C4B5A0',color:'white',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem'}}>
                {sending&&<Loader size={13} className="animate-spin"/>}
                {sent?'✓ Sent!':sending?'Sending…':'Send Email'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── ONBOARDING MODAL ───────────────────────────────────────
function OnboardingModal({ studioProfile, onComplete, onSkip, onGoToSettings, onGoToClients }) {
  const [step, setStep] = useState(0)
  const studioName = studioProfile?.studio_name || 'Your Studio'

  const steps = [
    {
      icon: '✦',
      title: `Welcome to Studio OS`,
      subtitle: studioName !== 'Your Studio' ? `${studioName} is ready to go.` : 'Your studio workspace is ready.',
      body: 'Studio OS is your all-in-one business platform — clients, projects, procurement, invoicing, and more. This quick tour will get you set up in minutes.',
      action: null,
    },
    {
      icon: '⚙',
      title: 'Set Up Your Studio',
      subtitle: 'Make it yours.',
      body: 'Start by adding your studio name, logo, and contact info in Settings. This branding appears on every invoice PDF and email your clients receive.',
      action: { label: 'Go to Settings →', fn: onGoToSettings },
    },
    {
      icon: '👤',
      title: 'Add Your First Client',
      subtitle: 'Every project starts with a client.',
      body: 'Head to the Clients tab to add a new client. You\'ll set their billing type (commission, hourly, or both), contact info, and retainer balance if applicable.',
      action: { label: 'Go to Clients →', fn: onGoToClients },
    },
    {
      icon: '📁',
      title: 'Create a Project',
      subtitle: 'Organize your work.',
      body: 'Under each client you can create projects to track budget, procurement items, tasks, time logs, and files — all in one place. Open a client and click their Projects tab to get started.',
      action: null,
    },
    {
      icon: '📄',
      title: 'Send Your First Invoice',
      subtitle: 'Get paid.',
      body: 'When you\'re ready to bill, go to Invoices and create a new invoice. Add line items, apply commission or hourly rates, track payments, and send a branded PDF reminder directly to your client.',
      action: null,
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1
  const isFirst = step === 0

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(42,37,32,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'1rem'}}>
      <div style={{background:'#FDFAF6',borderRadius:12,boxShadow:'0 20px 60px rgba(42,37,32,0.25)',width:'100%',maxWidth:520,overflow:'hidden'}}>

        {/* Header bar */}
        <div style={{background:'#2A2520',padding:'1.5rem 2rem',borderLeft:'4px solid #B8963E',position:'relative'}}>
          {studioProfile?.logo_url
            ? <img src={studioProfile.logo_url} alt={studioName} style={{maxHeight:36,maxWidth:160,objectFit:'contain',marginBottom:'0.5rem',display:'block'}} />
            : <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.2rem',fontWeight:300,color:'#F7F3EE',letterSpacing:'0.05em',marginBottom:'0.25rem'}}>{studioName}</div>
          }
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>Getting Started · Step {step + 1} of {steps.length}</div>
        </div>

        {/* Content */}
        <div style={{padding:'2rem'}}>
          <div style={{fontSize:'2rem',marginBottom:'0.75rem'}}>{current.icon}</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520',marginBottom:'0.25rem',lineHeight:1.2}}>{current.title}</h2>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#C4622D',marginBottom:'1rem'}}>{current.subtitle}</div>
          <p style={{fontSize:'0.88rem',color:'#4A4540',lineHeight:1.7,marginBottom:'1.5rem'}}>{current.body}</p>

          {current.action && (
            <button onClick={current.action.fn}
              style={{background:'#F5E6DE',color:'#C4622D',border:'1px solid rgba(196,98,45,0.2)',borderRadius:4,padding:'0.5rem 1rem',fontSize:'0.78rem',fontWeight:500,cursor:'pointer',marginBottom:'1.5rem',fontFamily:"'DM Sans',sans-serif"}}>
              {current.action.label}
            </button>
          )}

          {/* Progress dots */}
          <div style={{display:'flex',gap:'0.4rem',marginBottom:'1.5rem'}}>
            {steps.map((_, i) => (
              <div key={i} onClick={() => setStep(i)} style={{width: i === step ? 20 : 8,height:8,borderRadius:4,background: i === step ? '#C4622D' : i < step ? '#C4B5A0' : '#E8E0D5',cursor:'pointer',transition:'all 0.2s'}} />
            ))}
          </div>

          {/* Navigation */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <button onClick={onSkip} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.75rem',color:'#C4B5A0',fontFamily:"'DM Mono',monospace",letterSpacing:'0.05em'}}>
              Skip tour
            </button>
            <div style={{display:'flex',gap:'0.75rem'}}>
              {!isFirst && (
                <button onClick={() => setStep(s => s - 1)}
                  style={{padding:'0.5rem 1.1rem',fontSize:'0.78rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,background:'transparent',color:'#4A4540',cursor:'pointer'}}>
                  Back
                </button>
              )}
              <button onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
                style={{padding:'0.5rem 1.25rem',fontSize:'0.78rem',borderRadius:4,border:'none',background:'#C4622D',color:'white',cursor:'pointer',fontWeight:500}}>
                {isLast ? '✓ Get Started' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── STUDIO SETTINGS ────────────────────────────────────────
function StudioSettings({ studioProfile, reload, showToast }) {
  const [form, setForm] = useState({
    studio_name: studioProfile?.studio_name || '',
    tagline: studioProfile?.tagline || '',
    email: studioProfile?.email || '',
    phone: studioProfile?.phone || '',
    website: studioProfile?.website || '',
    address: studioProfile?.address || '',
    thank_you_note: studioProfile?.thank_you_note || 'Thank you for the privilege of designing your space.',
    logo_url: studioProfile?.logo_url || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { ...form, user_id: user.id }
    if (studioProfile?.id) {
      await supabase.from('studio_profile').update(form).eq('id', studioProfile.id)
    } else {
      await supabase.from('studio_profile').insert(payload)
    }
    setSaving(false)
    reload()
    showToast('Studio profile saved', 'success')
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo/studio-logo.${ext}`
    const { error } = await supabase.storage.from('studio-files').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('studio-files').getPublicUrl(path)
      set('logo_url', data.publicUrl)
      showToast('Logo uploaded', 'success')
    } else {
      showToast('Logo upload failed', 'error')
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div>
      <div style={{marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520'}}>Studio Settings</h2>
        <p style={{fontSize:'0.78rem',color:'#8A8278',marginTop:'0.15rem'}}>This information appears on invoices, emails, and PDF documents sent to your clients.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',maxWidth:860}}>

        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.5rem'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'1rem'}}>Studio Identity</div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.85rem'}}>
              <Field label="Studio Name *">
                <input value={form.studio_name} onChange={e => set('studio_name', e.target.value)} placeholder="e.g. Sarah Chen Interiors" className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Tagline">
                <input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="e.g. Timeless Spaces, Thoughtfully Designed" className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Thank You Note (appears on invoices & emails)">
                <textarea value={form.thank_you_note} onChange={e => set('thank_you_note', e.target.value)} rows={3} className={inputClass} style={inputStyle} />
              </Field>
            </div>
          </div>

          <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.5rem'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'1rem'}}>Contact & Location</div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.85rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <Field label="Email">
                  <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="studio@yourdomain.com" className={inputClass} style={inputStyle} />
                </Field>
                <Field label="Phone">
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(000) 000-0000" className={inputClass} style={inputStyle} />
                </Field>
              </div>
              <Field label="Website">
                <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="www.yourstudio.com" className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Address (shown on invoices)">
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Design Ave · New York, NY 10001" className={inputClass} style={inputStyle} />
              </Field>
            </div>
          </div>
        </div>

        {/* Right column — Logo */}
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.5rem'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'1rem'}}>Studio Logo</div>
            <p style={{fontSize:'0.78rem',color:'#8A8278',marginBottom:'1rem',lineHeight:1.5}}>Your logo appears in email headers and PDF invoices. PNG or SVG with transparent background works best.</p>

            {/* Logo preview */}
            <div style={{width:'100%',height:140,background:'#2A2520',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1rem',overflow:'hidden'}}>
              {form.logo_url
                ? <img src={form.logo_url} alt="Studio logo" style={{maxHeight:80,maxWidth:'80%',objectFit:'contain'}} />
                : <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.2rem',fontWeight:300,color:'#F7F3EE',letterSpacing:'0.05em'}}>{form.studio_name || 'Your Studio Name'}</div>
                    <div style={{fontSize:'0.6rem',color:'#8A8278',marginTop:'0.25rem',fontFamily:"'DM Mono',monospace",letterSpacing:'0.1em',textTransform:'uppercase'}}>Logo preview</div>
                  </div>
              }
            </div>

            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
              <label style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',background: uploading ? '#C4B5A0' : '#C4622D',color:'white',padding:'0.5rem 1rem',borderRadius:4,fontSize:'0.78rem',fontWeight:500,cursor: uploading ? 'not-allowed' : 'pointer'}}>
                {uploading ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? 'Uploading…' : 'Upload Logo'}
                <input type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoUpload} disabled={uploading} />
              </label>
              {form.logo_url && (
                <button onClick={() => set('logo_url', '')} style={{padding:'0.5rem 1rem',fontSize:'0.78rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,background:'transparent',color:'#8A8278',cursor:'pointer'}}>
                  Remove Logo
                </button>
              )}
            </div>

            {form.logo_url && (
              <div style={{marginTop:'0.75rem'}}>
                <Field label="Logo URL">
                  <input value={form.logo_url} onChange={e => set('logo_url', e.target.value)} className={inputClass} style={{...inputStyle,fontSize:'0.7rem'}} />
                </Field>
              </div>
            )}
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={!form.studio_name.trim() || saving}
            style={{background: form.studio_name.trim() && !saving ? '#C4622D' : '#C4B5A0',color:'white',padding:'0.75rem',borderRadius:4,fontSize:'0.85rem',fontWeight:500,border:'none',cursor: form.studio_name.trim() ? 'pointer' : 'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
            {saving && <Loader size={14} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save Studio Profile'}
          </button>

          <div style={{background:'#F7F3EE',border:'1px solid rgba(42,37,32,0.08)',borderRadius:6,padding:'1rem'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.55rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.5rem'}}>Where this is used</div>
            <ul style={{fontSize:'0.75rem',color:'#8A8278',lineHeight:1.8,margin:0,paddingLeft:'1rem'}}>
              <li>PDF invoice header (name, tagline, contact)</li>
              <li>Email invoice reminders</li>
              <li>Client message emails</li>
              <li>App top bar (studio name)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── REVENUE REPORT ─────────────────────────────────────────
function RevenueReport({ clients, projects, invoices, payments, items }) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const [period, setPeriod] = useState('month') // 'month' | 'year' | 'alltime'
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedMonthYear, setSelectedMonthYear] = useState(currentYear)
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // Build year options from invoice data
  const allYears = [...new Set([
    ...invoices.map(i => (i.due || i.created_at || '').substring(0, 4)),
    ...payments.map(p => (p.date || '').substring(0, 4)),
  ].filter(Boolean).map(Number))].sort((a, b) => b - a)
  if (!allYears.includes(currentYear)) allYears.unshift(currentYear)

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']

  function inPeriod(dateStr) {
    if (!dateStr) return false
    const d = new Date(dateStr.substring(0,10) + 'T00:00:00')
    if (period === 'alltime') return true
    if (period === 'year') return d.getFullYear() === selectedYear
    return d.getFullYear() === selectedMonthYear && d.getMonth() === selectedMonth
  }

  const periodInvoices = invoices.filter(i => inPeriod(i.due) || inPeriod(i.created_at?.split('T')[0]))
  const periodPayments = payments.filter(p => inPeriod(p.date))

  const totalBilled = periodInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const totalCollected = periodPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const outstanding = invoices
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((s, i) => {
      const paid = payments.filter(p => p.invoice_id === i.id).reduce((ps, p) => ps + (Number(p.amount) || 0), 0)
      return s + Math.max(0, (Number(i.amount) || 0) - paid)
    }, 0)
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue')
  const overdueTotal = overdueInvoices.reduce((s, i) => {
    const paid = payments.filter(p => p.invoice_id === i.id).reduce((ps, p) => ps + (Number(p.amount) || 0), 0)
    return s + Math.max(0, (Number(i.amount) || 0) - paid)
  }, 0)

  // Revenue by client
  const revenueByClient = clients.map(c => {
    const cInvoices = periodInvoices.filter(i => i.client_id === c.id)
    const cPayments = payments.filter(p => {
      const inv = invoices.find(i => i.id === p.invoice_id)
      return inv && inv.client_id === c.id && inPeriod(p.date)
    })
    return {
      name: c.name,
      billed: cInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0),
      collected: cPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    }
  }).filter(c => c.billed > 0 || c.collected > 0).sort((a, b) => b.billed - a.billed)

  // Monthly breakdown — for the selected year (or current year if alltime)
  const chartYear = period === 'year' ? selectedYear : period === 'alltime' ? currentYear : selectedMonthYear
  const months = Array.from({length: 12}, (_, m) => {
    const label = MONTHS[m]
    const mInvoices = invoices.filter(i => {
      const d = new Date((i.due || i.created_at || '').split('T')[0] + 'T00:00:00')
      return d.getFullYear() === chartYear && d.getMonth() === m
    })
    const mPayments = payments.filter(p => {
      const d = new Date((p.date || '').split('T')[0] + 'T00:00:00')
      return d.getFullYear() === chartYear && d.getMonth() === m
    })
    return {
      label,
      billed: mInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0),
      collected: mPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    }
  })
  const maxMonthVal = Math.max(...months.map(m => Math.max(m.billed, m.collected)), 1)

  const periodLabel = period === 'month'
    ? `${MONTHS_LONG[selectedMonth]} ${selectedMonthYear}`
    : period === 'year'
    ? `${selectedYear}`
    : 'All Time'

  const btnStyle = (active) => ({
    padding:'0.35rem 0.75rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,fontSize:'0.72rem',
    background: active ? '#2A2520' : 'transparent', color: active ? 'white' : '#4A4540',
    cursor:'pointer', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.05em'
  })

  const statCard = (label, value, sub, color='#2A2520') => (
    <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem 1.5rem'}}>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'0.5rem'}}>{label}</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2rem',fontWeight:300,color,lineHeight:1}}>${Number(value).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
      {sub && <div style={{fontSize:'0.72rem',color:'#8A8278',marginTop:'0.35rem'}}>{sub}</div>}
    </div>
  )

  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.6rem',fontWeight:300,color:'#2A2520'}}>Revenue</h2>
          <p style={{fontSize:'0.78rem',color:'#8A8278',marginTop:'0.15rem'}}>{periodLabel}</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flexWrap:'wrap'}}>
          {/* Period selector buttons */}
          <div style={{display:'flex',gap:'0.4rem'}}>
            <button onClick={() => setPeriod('month')} style={btnStyle(period==='month')}>Month</button>
            <button onClick={() => setPeriod('year')} style={btnStyle(period==='year')}>Year</button>
            <button onClick={() => setPeriod('alltime')} style={btnStyle(period==='alltime')}>All Time</button>
          </div>
          {/* Month picker */}
          {period === 'month' && (
            <div style={{display:'flex',gap:'0.4rem',alignItems:'center'}}>
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                style={{padding:'0.3rem 0.5rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,fontSize:'0.75rem',background:'#FDFAF6',color:'#2A2520',fontFamily:"'DM Sans',sans-serif"}}>
                {MONTHS_LONG.map((m,i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={selectedMonthYear} onChange={e => setSelectedMonthYear(Number(e.target.value))}
                style={{padding:'0.3rem 0.5rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,fontSize:'0.75rem',background:'#FDFAF6',color:'#2A2520',fontFamily:"'DM Sans',sans-serif"}}>
                {allYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          {/* Year picker */}
          {period === 'year' && (
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              style={{padding:'0.3rem 0.5rem',border:'1px solid rgba(42,37,32,0.15)',borderRadius:4,fontSize:'0.75rem',background:'#FDFAF6',color:'#2A2520',fontFamily:"'DM Sans',sans-serif"}}>
              {allYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.5rem'}}>
        {statCard('Billed', totalBilled, `${periodInvoices.length} invoice${periodInvoices.length!==1?'s':''}`)}
        {statCard('Collected', totalCollected, `${periodPayments.length} payment${periodPayments.length!==1?'s':''}`, '#6B7C6E')}
        {statCard('Outstanding', outstanding, `${invoices.filter(i=>i.status==='Pending'||i.status==='Overdue').length} open invoices`, '#B8963E')}
        {statCard('Overdue', overdueTotal, `${overdueInvoices.length} overdue invoice${overdueInvoices.length!==1?'s':''}`, overdueTotal>0?'#C4622D':'#6B7C6E')}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:'1.25rem',marginBottom:'1.25rem'}}>
        {/* Monthly bar chart */}
        <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem'}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'1rem'}}>Monthly · {chartYear}</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:'0.4rem',height:120}}>
            {months.map((m, i) => (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,height:'100%',justifyContent:'flex-end'}}>
                <div style={{width:'100%',display:'flex',flexDirection:'column',gap:1,justifyContent:'flex-end',flex:1}}>
                  <div title={`Billed: $${m.billed.toLocaleString()}`} style={{width:'100%',background:'#C4622D',borderRadius:'2px 2px 0 0',height:`${Math.round((m.billed/maxMonthVal)*100)}%`,minHeight:m.billed>0?2:0,opacity:0.85}}/>
                  <div title={`Collected: $${m.collected.toLocaleString()}`} style={{width:'100%',background:'#6B7C6E',borderRadius:'2px 2px 0 0',height:`${Math.round((m.collected/maxMonthVal)*100)}%`,minHeight:m.collected>0?2:0,opacity:0.7}}/>
                </div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.5rem',color: (period==='month' && i===selectedMonth && chartYear===selectedMonthYear) ? '#C4622D' : i===currentMonth && chartYear===currentYear ? '#B8963E' : '#C4B5A0',textTransform:'uppercase'}}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'1rem',marginTop:'0.75rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}><div style={{width:10,height:10,borderRadius:2,background:'#C4622D'}}/><span style={{fontSize:'0.7rem',color:'#8A8278'}}>Billed</span></div>
            <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}><div style={{width:10,height:10,borderRadius:2,background:'#6B7C6E'}}/><span style={{fontSize:'0.7rem',color:'#8A8278'}}>Collected</span></div>
          </div>
        </div>

        {/* Revenue by client */}
        <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,padding:'1.25rem'}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278',marginBottom:'1rem'}}>By Client · {periodLabel}</div>
          {revenueByClient.length === 0
            ? <p style={{color:'#C4B5A0',fontSize:'0.82rem'}}>No revenue data for this period</p>
            : revenueByClient.slice(0,8).map((c, i) => (
                <div key={i} style={{marginBottom:'0.75rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}>
                    <span style={{fontSize:'0.82rem',color:'#2A2520',fontWeight:500}}>{c.name}</span>
                    <span style={{fontSize:'0.78rem',color:'#2A2520'}}>${c.billed.toLocaleString()}</span>
                  </div>
                  <div style={{width:'100%',background:'#E8E0D5',borderRadius:3,height:5}}>
                    <div style={{width:`${Math.round((c.billed/revenueByClient[0].billed)*100)}%`,background:'#C4622D',borderRadius:3,height:5}}/>
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Recent payments table */}
      <div style={{background:'#FDFAF6',border:'1px solid rgba(42,37,32,0.1)',borderRadius:8,overflow:'hidden'}}>
        <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#8A8278'}}>Recent Payments</div>
        </div>
        <table style={{width:'100%',fontSize:'0.82rem',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid rgba(42,37,32,0.08)'}}>
              {['Date','Client','Invoice','Method','Amount'].map(h => (
                <th key={h} style={{padding:'0.6rem 1.25rem',textAlign:'left',fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#8A8278',fontWeight:400}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...payments].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,15).map(p => {
              const inv = invoices.find(i => i.id === p.invoice_id)
              const client = inv ? clients.find(c => c.id === inv.client_id) : null
              return (
                <tr key={p.id} style={{borderBottom:'1px solid rgba(42,37,32,0.04)'}}>
                  <td style={{padding:'0.65rem 1.25rem',color:'#8A8278'}}>{p.date?new Date(p.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}</td>
                  <td style={{padding:'0.65rem 1.25rem',color:'#2A2520',fontWeight:500}}>{client?.name||'—'}</td>
                  <td style={{padding:'0.65rem 1.25rem',color:'#8A8278',fontFamily:"'DM Mono',monospace",fontSize:'0.75rem'}}>{inv?.num||'—'}</td>
                  <td style={{padding:'0.65rem 1.25rem'}}><span style={{background:'#EBF0EC',color:'#6B7C6E',padding:'0.15rem 0.6rem',borderRadius:10,fontSize:'0.72rem',fontFamily:"'DM Mono',monospace"}}>{p.method||'—'}</span></td>
                  <td style={{padding:'0.65rem 1.25rem',color:'#6B7C6E',fontWeight:600}}>${Number(p.amount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                </tr>
              )
            })}
            {payments.length === 0 && <tr><td colSpan={5} style={{padding:'2rem',textAlign:'center',color:'#8A8278'}}>No payments recorded yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
