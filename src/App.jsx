import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import { LayoutDashboard, Users, FolderKanban, Package, Store, FileText, Calendar, CheckSquare, X, Trash2, Pencil, AlertCircle, Loader, Upload, FileImage, Download, Mail } from 'lucide-react'
import { supabase } from './supabase.js'
import jsPDF from 'jspdf'

const WORKER_URL = 'https://studio-os-email.leighrossmarcus.workers.dev'

async function sendEmail(to, subject, html) {
  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html })
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
]

const PROJECT_STATUSES = ['Design Phase', 'Procurement', 'In Progress', 'On Hold', 'Complete']
const ITEM_STATUSES = ['To Order', 'Ordered', 'Arrived', 'Installed', 'Delayed']
const INVOICE_STATUSES = ['Pending', 'Paid', 'Overdue', 'Cancelled']
const TASK_PRIORITIES = ['Today', 'This Week', 'Upcoming']
const EVENT_TYPES = ['Meeting', 'Delivery', 'Site Visit', 'Billing', 'Other']

// ── SHARED UI ────────────────────────────────────────────

const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500'

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function ModalFooter({ onClose, onSave, valid, label, loading }) {
  return (
    <div className="flex gap-3 justify-end mt-6">
      <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
      <button onClick={onSave} disabled={!valid || loading}
        className={`px-4 py-2 text-sm rounded-lg text-white flex items-center gap-2 ${valid && !loading ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-300 cursor-not-allowed'}`}>
        {loading && <Loader size={14} className="animate-spin" />}
        {label}
      </button>
    </div>
  )
}

function Badge({ status }) {
  const colors = {
    Active: 'bg-teal-50 text-teal-700', Lead: 'bg-amber-50 text-amber-700', Inactive: 'bg-slate-100 text-slate-500',
    'In Progress': 'bg-teal-50 text-teal-700', Procurement: 'bg-blue-50 text-blue-700',
    'Design Phase': 'bg-amber-50 text-amber-700', 'On Hold': 'bg-rose-50 text-rose-700', Complete: 'bg-slate-100 text-slate-500',
    'To Order': 'bg-slate-100 text-slate-500', Ordered: 'bg-blue-50 text-blue-700',
    Arrived: 'bg-amber-50 text-amber-700', Installed: 'bg-teal-50 text-teal-700', Delayed: 'bg-rose-50 text-rose-700',
    Pending: 'bg-amber-50 text-amber-700', Paid: 'bg-teal-50 text-teal-700', Overdue: 'bg-rose-50 text-rose-700', Cancelled: 'bg-slate-100 text-slate-500',
    Meeting: 'bg-amber-50 text-amber-700', Delivery: 'bg-teal-50 text-teal-700', 'Site Visit': 'bg-blue-50 text-blue-700',
    Billing: 'bg-rose-50 text-rose-700', Other: 'bg-slate-100 text-slate-500',
  }
  return <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || 'bg-slate-100 text-slate-500'}`}>{status}</span>
}

function Actions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2 justify-end">
      <button onClick={onEdit} className="text-slate-400 hover:text-teal-600"><Pencil size={15} /></button>
      <button onClick={onDelete} className="text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
    </div>
  )
}

function ConfirmDeleteModal({ name, onConfirm, onCancel, loading }) {
  return (
   <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Confirm Delete</h3>
        <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete <span className="font-medium text-slate-700">{name}</span>? This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-2 disabled:opacity-50">
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
    <div className="flex items-center justify-center py-16">
      <Loader size={24} className="animate-spin text-teal-500" />
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
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-teal-800">Studio OS</h1>
          <p className="text-sm text-slate-400 mt-1">Interior Design Management</p>
        </div>
        <h2 className="text-lg font-semibold text-slate-700 mb-5">
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className={inputClass} />
          </div>
          {mode !== 'reset' && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className={inputClass} />
            </div>
          )}
        </div>
        {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
        {message && <p className="mt-3 text-xs text-teal-600">{message}</p>}
        <button onClick={handleSubmit} disabled={loading}
          className="mt-5 w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader size={14} className="animate-spin" />}
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
        </button>
        <div className="mt-4 flex flex-col gap-2 text-center text-xs text-slate-400">
          {mode === 'login' && <>
            <button onClick={() => setMode('signup')} className="hover:text-teal-600">Don't have an account? Sign up</button>
            <button onClick={() => setMode('reset')} className="hover:text-teal-600">Forgot password?</button>
          </>}
          {mode !== 'login' && <button onClick={() => setMode('login')} className="hover:text-teal-600">Back to sign in</button>}
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
  const [dataLoading, setDataLoading] = useState(false)

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
    const [c, p, v, i, inv, t, e] = await Promise.all([
      supabase.from('clients').select('*').order('created_at'),
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('vendors').select('*').order('created_at'),
      supabase.from('items').select('*').order('created_at'),
      supabase.from('invoices').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('events').select('*').order('created_at'),
    ])
    setClients(c.data || [])
    setProjects(p.data || [])
    setVendors(v.data || [])
    setItems(i.data || [])
    setInvoices(inv.data || [])
    setTasks(t.data || [])
    setEvents(e.data || [])
    setDataLoading(false)
  }, [])

  useEffect(() => {
    if (session) loadAll()
  }, [session, loadAll])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader size={24} className="animate-spin text-teal-500" />
      </div>
    )
  }

  if (!session) return <AuthScreen />

  const shared = { clients, projects, vendors, items, invoices, tasks, events, reload: loadAll }

  return (
<div className="min-h-screen bg-slate-50 flex flex-col">
<div style={{display: window.innerWidth < 768 ? 'block' : 'none'}} className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">
        📱 Studio OS is optimized for desktop. For the best experience, please use a laptop or desktop computer.
      </div>
<header className="bg-teal-800 text-white px-4 py-3 flex items-center justify-between shadow-md flex-shrink-0">
        <span className="text-xl font-semibold tracking-wide">Studio OS</span>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-teal-900 font-bold text-sm flex-shrink-0">
            {session.user.email.substring(0, 2).toUpperCase()}
          </div>
          <button onClick={() => supabase.auth.signOut()}
            className="text-xs text-teal-300 hover:text-white border border-teal-600 px-3 py-1 rounded-lg whitespace-nowrap">
            Sign Out
          </button>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 px-4 flex gap-1 flex-shrink-0 shadow-sm overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-6 overflow-auto">
        {dataLoading ? <LoadingSpinner /> : <>
          {activeTab === 'dashboard' && <Dashboard {...shared} />}
          {activeTab === 'clients' && <Clients {...shared} />}
          {activeTab === 'projects' && <Projects {...shared} />}
          {activeTab === 'items' && <Items {...shared} />}
          {activeTab === 'vendors' && <Vendors {...shared} />}
          {activeTab === 'invoices' && <Invoices {...shared} />}
          {activeTab === 'calendar' && <CalendarView {...shared} />}
         {activeTab === 'tasks' && <Tasks {...shared} />}
      {activeTab === 'files' && <Files {...shared} />}
        </>}
      </main>
    </div>
  )
}

// ── MODALS ───────────────────────────────────────────────

function ClientModal({ client, onSave, onClose }) {
  const [form, setForm] = useState(client || { name: '', email: '', phone: '', status: 'Active', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.name.trim()
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 modal-overlay">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{client ? 'Edit Client' : 'Add Client'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Name *"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Client or family name" className={inputClass} /></Field>
          <Field label="Email"><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" className={inputClass} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(000) 000-0000" className={inputClass} /></Field>
          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
              {['Active','Inactive','Lead'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Referral source, preferences…" className={inputClass} /></Field>
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

function ItemModal({ item, projects, vendors, onSave, onClose }) {
  const [form, setForm] = useState(item || { name: '', project_id: projects[0]?.id || '', vendor_id: vendors[0]?.id || '', cost: '', status: 'To Order', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.name.trim()
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{item ? 'Edit Item' : 'Add Item'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Item Name *"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sectional Sofa" className={inputClass} /></Field>
          <Field label="Project">
            <select value={form.project_id || ''} onChange={e => set('project_id', e.target.value)} className={inputClass}>
              <option value="">— None —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Vendor">
            <select value={form.vendor_id || ''} onChange={e => set('vendor_id', e.target.value)} className={inputClass}>
              <option value="">— None —</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost ($)"><input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0" className={inputClass} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                {ITEM_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Color, finish, dimensions…" className={inputClass} /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form, setLoading)} valid={valid} loading={loading} label={item ? 'Save Changes' : 'Add Item'} />
      </div>
    </div>
  )
}

function InvoiceModal({ invoice, clients, projects, onSave, onClose }) {
  const [form, setForm] = useState(invoice || { num: '', client_id: clients[0]?.id || '', project_id: '', amount: '', due: '', status: 'Pending', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.num.trim() && form.amount
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{invoice ? 'Edit Invoice' : 'New Invoice'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Invoice # *"><input value={form.num} onChange={e => set('num', e.target.value)} placeholder="INV-1001" className={inputClass} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                {INVOICE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Client">
            <select value={form.client_id || ''} onChange={e => set('client_id', e.target.value)} className={inputClass}>
              <option value="">— None —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Project">
            <select value={form.project_id || ''} onChange={e => set('project_id', e.target.value)} className={inputClass}>
              <option value="">— None —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount ($) *"><input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" className={inputClass} /></Field>
            <Field label="Due Date"><input type="date" value={form.due} onChange={e => set('due', e.target.value)} className={inputClass} /></Field>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Payment terms, notes…" className={inputClass} /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form, setLoading)} valid={valid} loading={loading} label={invoice ? 'Save Changes' : 'Create Invoice'} />
      </div>
    </div>
  )
}

function TaskModal({ task, projects, onSave, onClose }) {
  const [form, setForm] = useState(task || { title: '', priority: 'Today', done: false, project_id: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.title.trim()
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{task ? 'Edit Task' : 'Add Task'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Task *"><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be done?" className={inputClass} /></Field>
          <Field label="Priority">
            <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputClass}>
              {TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Project (optional)">
            <select value={form.project_id || ''} onChange={e => set('project_id', e.target.value || null)} className={inputClass}>
              <option value="">— None —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Additional details…" className={inputClass} /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form, setLoading)} valid={valid} loading={loading} label={task ? 'Save Changes' : 'Add Task'} />
      </div>
    </div>
  )
}

function EventModal({ event, onSave, onClose }) {
  const [form, setForm] = useState(event || { title: '', date: '', type: 'Meeting', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.title.trim() && form.date
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{event ? 'Edit Event' : 'Add Event'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Title *"><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event title" className={inputClass} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date *"><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputClass} /></Field>
            <Field label="Type">
              <select value={form.type} onChange={e => set('type', e.target.value)} className={inputClass}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Location, details…" className={inputClass} /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form, setLoading)} valid={valid} loading={loading} label={event ? 'Save Changes' : 'Add Event'} />
      </div>
    </div>
  )
}

// ── MODULES ──────────────────────────────────────────────

function Dashboard({ clients, projects, invoices, tasks }) {
  const activeProjects = projects.filter(p => p.status !== 'Complete').length
  const activeClients = clients.filter(c => c.status === 'Active').length
  const openInvoices = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').length
  const todayTasks = tasks.filter(t => t.priority === 'Today' && !t.done).length
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Projects', value: activeProjects, color: 'bg-teal-50 border-teal-200 text-teal-700' },
          { label: 'Open Invoices', value: openInvoices, color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Active Clients', value: activeClients, color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Tasks Due Today', value: todayTasks, color: 'bg-rose-50 border-rose-200 text-rose-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`border rounded-xl p-5 ${color}`}>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-sm font-medium">{label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Active Projects</h3>
        {projects.filter(p => p.status !== 'Complete').length === 0
          ? <p className="text-slate-400 text-sm py-4 text-center">No active projects yet</p>
          : <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Project</th>
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Budget</th>
                </tr>
              </thead>
              <tbody>
                {projects.filter(p => p.status !== 'Complete').slice(0, 5).map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="py-3 text-slate-500">{clients.find(c => c.id === p.client_id)?.name || '—'}</td>
                    <td className="py-3"><Badge status={p.status} /></td>
                    <td className="py-3 text-slate-600">${Number(p.budget).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  )
}

function Clients({ clients, reload }) {
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Clients</h2>
        <button onClick={() => setModal('add')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Client</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
        className="mb-4 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-72" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              {['Name','Email','Phone','Status','Notes',''].map(h => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No clients yet — add your first one!</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-slate-500">{c.email}</td>
                <td className="px-5 py-3 text-slate-500">{c.phone}</td>
                <td className="px-5 py-3"><Badge status={c.status} /></td>
                <td className="px-5 py-3 text-slate-400 text-xs max-w-xs truncate">{c.notes}</td>
                <td className="px-5 py-3"><Actions onEdit={() => setModal(c)} onDelete={() => setDeleteTarget(c)} /></td>
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

function Projects({ projects, clients, reload }) {
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Projects</h2>
        <button onClick={() => setModal('add')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Project</button>
      </div>
      <div className="flex gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-64" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="All">All Statuses</option>
          {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {filtered.length === 0 && <div className="col-span-3 text-center py-16 text-slate-400">No projects yet</div>}
        {filtered.map(p => {
          const pct = p.budget ? Math.min(100, Math.round((p.spent / p.budget) * 100)) : 0
          const over = p.spent > p.budget && p.budget > 0
          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-slate-800 pr-2">{p.name}</h3>
                <Badge status={p.status} />
              </div>
              <p className="text-sm text-slate-500 mb-4">{clients.find(c => c.id === p.client_id)?.name || '—'}</p>
              {p.budget > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Budget: <span className="font-medium text-slate-700">${Number(p.budget).toLocaleString()}</span></span>
                    <span className={over ? 'text-rose-600 font-medium' : ''}>Spent: ${Number(p.spent).toLocaleString()}{over && ' ⚠️'}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${over ? 'bg-rose-400' : pct > 80 ? 'bg-amber-400' : 'bg-teal-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
              {p.notes && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{p.notes}</p>}
              <div className="flex justify-end border-t border-slate-100 pt-3">
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Vendors</h2>
        <button onClick={() => setModal('add')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Vendor</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors…"
        className="mb-5 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-72" />
      <div className="grid grid-cols-3 gap-4">
        {filtered.length === 0 && <div className="col-span-3 text-center py-16 text-slate-400">No vendors yet</div>}
        {filtered.map(v => (
          <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-800">{v.name}</h3>
              <Actions onEdit={() => setModal(v)} onDelete={() => setDeleteTarget(v)} />
            </div>
            <p className="text-sm text-slate-500">Rep: {v.rep}</p>
            <p className="text-sm text-slate-500 mb-3">{v.email}</p>
            {v.discount && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs">{v.discount}</span>}
            {v.notes && <p className="text-xs text-slate-400 mt-2">{v.notes}</p>}
          </div>
        ))}
      </div>
      {modal && <VendorModal vendor={modal === 'add' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

function Items({ items, projects, vendors, reload }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'All' || i.status === statusFilter)
  )

  async function handleSave(form, setLoading) {
    setLoading(true)
    const data = { ...form, cost: Number(form.cost) || 0 }
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Items & Procurement</h2>
        <button onClick={() => setModal('add')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Item</button>
      </div>
      <div className="flex gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-64" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="All">All Statuses</option>
          {ITEM_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              {['Item','Project','Vendor','Cost','Status',''].map(h => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No items yet</td></tr>}
            {filtered.map(i => (
              <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{i.name}</td>
                <td className="px-5 py-3 text-slate-500">{projects.find(p => p.id === i.project_id)?.name || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{vendors.find(v => v.id === i.vendor_id)?.name || '—'}</td>
                <td className="px-5 py-3">${Number(i.cost).toLocaleString()}</td>
                <td className="px-5 py-3"><Badge status={i.status} /></td>
                <td className="px-5 py-3"><Actions onEdit={() => setModal(i)} onDelete={() => setDeleteTarget(i)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <ItemModal item={modal === 'add' ? null : modal} projects={projects} vendors={vendors} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

function Invoices({ invoices, clients, projects, reload }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = invoices.filter(i =>
    (i.num.toLowerCase().includes(search.toLowerCase()) ||
    (clients.find(c => c.id === i.client_id)?.name || '').toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'All' || i.status === statusFilter)
  )

  async function handleSave(form, setLoading) {
    setLoading(true)
    const data = { ...form, amount: Number(form.amount) || 0, due: form.due || null, project_id: form.project_id || null, client_id: form.client_id || null }
   const user_id = (await supabase.auth.getUser()).data.user.id
if (modal === 'add') await supabase.from('invoices').insert({ ...data, user_id })
    else await supabase.from('invoices').update(data).eq('id', modal.id)
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
    const due = invoice.due
      ? new Date(invoice.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'soon'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B6B6B; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Studio OS</h1>
          <p style="color: #a7d4d4; margin: 4px 0 0;">Invoice Reminder</p>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5;">
          <p style="color: #333;">Hi ${client.name},</p>
          <p style="color: #333;">This is a friendly reminder that invoice <strong>${invoice.num}</strong> for <strong>$${Number(invoice.amount).toLocaleString()}</strong> is due on <strong>${due}</strong>.</p>
          <div style="background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">Invoice #: <strong style="color: #333;">${invoice.num}</strong></p>
            <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Amount Due: <strong style="color: #1B6B6B; font-size: 18px;">$${Number(invoice.amount).toLocaleString()}</strong></p>
            <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Due Date: <strong style="color: #333;">${due}</strong></p>
          </div>
          <p style="color: #333;">Please don't hesitate to reach out if you have any questions.</p>
          <p style="color: #333;">Thank you for your business!</p>
          <p style="color: #888; font-size: 12px; margin-top: 32px; border-top: 1px solid #e5e5e5; padding-top: 16px;">Sent via Studio OS</p>
        </div>
      </div>
    `
    const result = await sendEmail(client.email, `Invoice Reminder: ${invoice.num} — $${Number(invoice.amount).toLocaleString()} due ${due}`, html)
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

    // Header
    doc.setFillColor(27, 107, 107)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 20, 22)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Studio OS`, 20, 32)

    // Invoice number + date
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.text(`Invoice #: ${invoice.num}`, 140, 22)
    doc.text(`Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 140, 32)

    // Client info
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To:', 20, 58)
    doc.setFont('helvetica', 'normal')
    doc.text(client?.name || '—', 20, 66)
    if (client?.email) doc.text(client.email, 20, 74)
    if (client?.phone) doc.text(client.phone, 20, 82)

    // Project
    if (project) {
      doc.setFont('helvetica', 'bold')
      doc.text('Project:', 120, 58)
      doc.setFont('helvetica', 'normal')
      doc.text(project.name, 120, 66)
    }

    // Due date
    if (invoice.due) {
      doc.setFont('helvetica', 'bold')
      doc.text('Due Date:', 120, 78)
      doc.setFont('helvetica', 'normal')
      doc.text(new Date(invoice.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 120, 86)
    }

    // Divider
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 95, 190, 95)

    // Table header
    doc.setFillColor(245, 245, 245)
    doc.rect(20, 100, 170, 10, 'F')
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Description', 25, 107)
    doc.text('Amount', 165, 107, { align: 'right' })

    // Line item
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    doc.text(project?.name || 'Services Rendered', 25, 120)
    doc.text(`$${Number(invoice.amount).toLocaleString()}`, 165, 120, { align: 'right' })

    // Total box
    doc.setFillColor(27, 107, 107)
    doc.rect(120, 135, 70, 14, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Total:', 125, 144)
    doc.text(`$${Number(invoice.amount).toLocaleString()}`, 185, 144, { align: 'right' })

    // Status
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Status: ${invoice.status}`, 20, 144)

    // Notes
    if (invoice.notes) {
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 158, 190, 158)
      doc.setFont('helvetica', 'bold')
      doc.text('Notes:', 20, 166)
      doc.setFont('helvetica', 'normal')
      doc.text(invoice.notes, 20, 174, { maxWidth: 170 })
    }

    // Footer
    doc.setFillColor(245, 245, 245)
    doc.rect(0, 272, 210, 25, 'F')
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(9)
    doc.text('Thank you for your business.', 105, 282, { align: 'center' })
    doc.text('Studio OS — Interior Design Management', 105, 289, { align: 'center' })

    doc.save(`invoice-${invoice.num}.pdf`)
  }

  const totalOutstanding = invoices
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + Number(i.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Invoices</h2>
        <button onClick={() => setModal('add')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ New Invoice</button>
      </div>
      {totalOutstanding > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} />
          <span><span className="font-semibold">${totalOutstanding.toLocaleString()}</span> outstanding across {invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').length} invoices</span>
        </div>
      )}
      <div className="flex gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices…"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-64" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="All">All Statuses</option>
          {INVOICE_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              {['Invoice #','Client','Project','Amount','Due Date','Status',''].map(h => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No invoices yet</td></tr>}
            {filtered.map(i => (
              <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{i.num}</td>
                <td className="px-5 py-3 text-slate-500">{clients.find(c => c.id === i.client_id)?.name || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{projects.find(p => p.id === i.project_id)?.name || '—'}</td>
                <td className="px-5 py-3 font-medium">${Number(i.amount).toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500">{i.due ? new Date(i.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                <td className="px-5 py-3"><Badge status={i.status} /></td>
               <td className="px-5 py-3">
                  <div className="flex gap-2 items-center justify-end">
                    <button onClick={() => generatePDF(i)} className="text-slate-400 hover:text-teal-600" title="Download PDF"><Download size={15} /></button>
                    <button onClick={() => handleSendReminder(i)} className="text-slate-400 hover:text-amber-500" title="Send reminder"><Mail size={15} /></button>
                    <button onClick={() => setModal(i)} className="text-slate-400 hover:text-teal-600"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteTarget(i)} className="text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <InvoiceModal invoice={modal === 'add' ? null : modal} clients={clients} projects={projects} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.num} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

function Tasks({ tasks, projects, reload }) {
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleSave(form, setLoading) {
    setLoading(true)
    const user_id = (await supabase.auth.getUser()).data.user.id
if (modal === 'add') await supabase.from('tasks').insert({ ...form, user_id })
    else await supabase.from('tasks').update(form).eq('id', modal.id)
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Tasks</h2>
        <button onClick={() => setModal('add')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Task</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {TASK_PRIORITIES.map(priority => {
          const borderColor = priority === 'Today' ? 'border-rose-200' : priority === 'This Week' ? 'border-amber-200' : 'border-slate-200'
          const ptasks = tasks.filter(t => t.priority === priority)
          return (
            <div key={priority} className={`bg-white rounded-xl border-2 ${borderColor} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">{priority}</h3>
                <span className="text-xs text-slate-400">{ptasks.filter(t => !t.done).length} left</span>
              </div>
              <div className="flex flex-col gap-2">
                {ptasks.length === 0 && <p className="text-xs text-slate-400 py-2">No tasks</p>}
                {ptasks.map(t => (
                  <div key={t.id} className="flex items-start gap-2 group">
                    <button onClick={() => toggleDone(t)}
                      className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${t.done ? 'bg-teal-500 border-teal-500' : 'border-slate-300'}`}>
                      {t.done && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span className={`text-sm flex-1 ${t.done ? 'line-through text-slate-400' : 'text-slate-600'}`}>{t.title}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button onClick={() => setModal(t)} className="text-slate-300 hover:text-teal-600"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteTarget(t)} className="text-slate-300 hover:text-rose-600"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {modal && <TaskModal task={modal === 'add' ? null : modal} projects={projects} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}

function Files({ projects, clients }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function loadFiles() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.storage
      .from('studio-files')
      .list(user.id, { sortBy: { column: 'created_at', order: 'desc' } })
    if (data) {
      const enriched = await Promise.all(data.map(async f => {
        const { data: urlData } = supabase.storage
          .from('studio-files')
          .getPublicUrl(`${user.id}/${f.name}`)
        const { data: signedData } = await supabase.storage
          .from('studio-files')
          .createSignedUrl(`${user.id}/${f.name}`, 3600)
        const meta = f.metadata || {}
        return {
          ...f,
          signedUrl: signedData?.signedUrl,
          projectId: meta.project_id || '',
          displayName: meta.display_name || f.name,
        }
      }))
      setFiles(enriched)
    }
    setLoading(false)
  }

  useEffect(() => { loadFiles() }, [])

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
      .upload(path, file, {
        metadata: {
          display_name: file.name,
          project_id: projectFilter || '',
        }
      })
    if (!error) await loadFiles()
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete() {
    setDeleteLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.storage
      .from('studio-files')
      .remove([`${user.id}/${deleteTarget.name}`])
    setDeleteLoading(false)
    setDeleteTarget(null)
    await loadFiles()
  }

  const filtered = files.filter(f => {
    const matchSearch = f.displayName.toLowerCase().includes(search.toLowerCase())
    const matchProject = !projectFilter || f.projectId === projectFilter
    return matchSearch && matchProject
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Files</h2>
        <label className={`flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-teal-700 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {uploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Uploading…' : 'Upload File'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      <div className="flex gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-64" />
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-4 text-center py-16 text-slate-400">
              No files yet — upload mood boards, photos, or documents
            </div>
          )}
          {filtered.map(f => (
            <div key={f.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
                {isImage(f.name) && f.signedUrl
                  ? <img src={f.signedUrl} alt={f.displayName} className="w-full h-full object-cover" />
                  : <FileImage size={40} className="text-slate-300" />
                }
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-slate-700 truncate">{f.displayName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatSize(f.metadata?.size)}</p>
                {f.projectId && (
                  <p className="text-xs text-teal-600 mt-0.5 truncate">
                    {projects.find(p => p.id === f.projectId)?.name || ''}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {f.signedUrl && (
                    <a href={f.signedUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800">
                      <Download size={13} /> View
                    </a>
                  )}
                  <button onClick={() => setDeleteTarget(f)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 ml-auto">
                    <Trash2 size={13} /> Delete
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
function CalendarView({ events, reload }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1))
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  function eventsOnDay(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  async function handleSave(form, setLoading) {
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

  const typeColors = {
    Meeting: 'bg-amber-100 text-amber-700', Delivery: 'bg-teal-100 text-teal-700',
    'Site Visit': 'bg-blue-100 text-blue-700', Billing: 'bg-rose-100 text-rose-700', Other: 'bg-slate-100 text-slate-600'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Calendar</h2>
        <button onClick={() => setModal('add')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Event</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-700">{monthName}</h3>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="px-3 py-1 border border-slate-200 rounded text-sm hover:bg-slate-50">← Prev</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="px-3 py-1 border border-slate-200 rounded text-sm hover:bg-slate-50">Next →</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-2 font-medium">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
            const dayEvents = eventsOnDay(day)
            return (
              <div key={day} className={`min-h-16 p-1.5 border rounded-lg ${isToday ? 'bg-teal-50 border-teal-300' : 'border-slate-100 hover:bg-slate-50'}`}>
                <span className={`text-xs font-medium block mb-1 ${isToday ? 'text-teal-700' : 'text-slate-600'}`}>{day}</span>
                {dayEvents.map(e => (
                  <div key={e.id} onClick={() => setModal(e)}
                    className={`text-xs rounded px-1 mb-0.5 truncate cursor-pointer ${typeColors[e.type] || 'bg-slate-100 text-slate-600'}`}>
                    {e.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
      {modal && <EventModal event={modal === 'add' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </div>
  )
}



