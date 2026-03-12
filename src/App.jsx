import { useState, useEffect } from 'react'
import React from 'react'
import { LayoutDashboard, Users, FolderKanban, Package, Store, FileText, Calendar, CheckSquare, X, Trash2, Pencil, AlertCircle } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'items', label: 'Items', icon: Package },
  { id: 'vendors', label: 'Vendors', icon: Store },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
]

const INITIAL_CLIENTS = [
  { id: 1, name: 'Johnson Family', email: 'kjohnson@email.com', phone: '(312) 555-0182', status: 'Active', notes: 'Referral from Patricia Wells' },
  { id: 2, name: 'Alex Chen', email: 'alex.chen@email.com', phone: '(312) 555-0247', status: 'Active', notes: 'Downtown loft renovation' },
  { id: 3, name: 'Rivera Family', email: 'mrivera@email.com', phone: '(312) 555-0391', status: 'Active', notes: 'Master suite project' },
  { id: 4, name: 'Patricia Wells', email: 'pwells@email.com', phone: '(312) 555-0104', status: 'Inactive', notes: 'Completed 3 projects' },
]

const INITIAL_PROJECTS = [
  { id: 1, name: 'Riverside Living Room', clientId: 1, status: 'In Progress', budget: 18500, spent: 12300, notes: 'Focus on warm neutrals, sectional sofa key piece' },
  { id: 2, name: 'Downtown Loft Kitchen', clientId: 2, status: 'Procurement', budget: 24000, spent: 8750, notes: 'Modern industrial look, open shelving' },
  { id: 3, name: 'Suburban Master Suite', clientId: 3, status: 'Design Phase', budget: 11200, spent: 2100, notes: 'Soft palette, blackout curtains required' },
  { id: 4, name: 'Lakefront Guest House', clientId: 1, status: 'Complete', budget: 31000, spent: 29800, notes: 'Coastal theme, completed March 2026' },
]

const INITIAL_VENDORS = [
  { id: 1, name: 'RH (Restoration Hardware)', rep: 'James Holloway', email: 'jholloway@rh.com', phone: '(800) 762-1005', discount: '40% trade', notes: 'Trade account #RH-4421' },
  { id: 2, name: 'Visual Comfort', rep: 'Sandra Lee', email: 'slee@visualcomfort.com', phone: '(713) 686-5999', discount: '35% trade', notes: 'Net 30 terms' },
  { id: 3, name: 'Stark Carpet', rep: 'Tom Briggs', email: 'tbriggs@starkcarpet.com', phone: '(212) 752-9000', discount: '30% trade', notes: 'Requires 50% deposit on orders' },
  { id: 4, name: 'Room & Board', rep: 'Lisa Park', email: 'lpark@roomandboard.com', phone: '(800) 301-9720', discount: '25% trade', notes: 'Lead times 8-12 weeks' },
]

const INITIAL_ITEMS = [
  { id: 1, name: 'Sectional Sofa', projectId: 1, vendorId: 1, cost: 4200, status: 'Ordered', notes: 'Cloud sectional, ivory boucle' },
  { id: 2, name: 'Pendant Lights x3', projectId: 2, vendorId: 2, cost: 1850, status: 'Arrived', notes: 'Aged brass finish' },
  { id: 3, name: 'Area Rug 9x12', projectId: 1, vendorId: 3, cost: 2400, status: 'To Order', notes: 'Natural jute weave' },
  { id: 4, name: 'King Bed Frame', projectId: 3, vendorId: 4, cost: 3100, status: 'Installed', notes: 'Walnut finish, upholstered headboard' },
]

const INITIAL_INVOICES = [
  { id: 1, num: 'INV-1041', clientId: 4, projectId: 4, amount: 9100, due: '2026-02-28', status: 'Paid', notes: '' },
  { id: 2, num: 'INV-1042', clientId: 1, projectId: 1, amount: 6500, due: '2026-03-15', status: 'Overdue', notes: 'Second reminder sent' },
  { id: 3, num: 'INV-1043', clientId: 2, projectId: 2, amount: 3200, due: '2026-03-20', status: 'Pending', notes: '' },
  { id: 4, num: 'INV-1044', clientId: 3, projectId: 3, amount: 2800, due: '2026-04-01', status: 'Pending', notes: '' },
]

const INITIAL_TASKS = [
  { id: 1, title: 'Call Johnson re: sofa delay', priority: 'Today', done: false, projectId: 1, notes: '' },
  { id: 2, title: 'Send invoice INV-1043', priority: 'Today', done: false, projectId: 2, notes: '' },
  { id: 3, title: 'Order area rug — Stark', priority: 'Today', done: false, projectId: 1, notes: '' },
  { id: 4, title: 'Site visit — Rivera master suite', priority: 'This Week', done: false, projectId: 3, notes: '' },
  { id: 5, title: 'Finalize Chen kitchen layout', priority: 'This Week', done: false, projectId: 2, notes: '' },
  { id: 6, title: 'Follow up Visual Comfort order', priority: 'This Week', done: false, projectId: 2, notes: '' },
  { id: 7, title: 'Prepare Q2 project proposals', priority: 'Upcoming', done: false, projectId: null, notes: '' },
  { id: 8, title: 'Update vendor discount terms', priority: 'Upcoming', done: false, projectId: null, notes: '' },
]

const INITIAL_EVENTS = [
  { id: 1, title: 'Client Meeting — Johnson', date: '2026-03-14', type: 'Meeting', notes: '' },
  { id: 2, title: 'Sofa Delivery — Riverside', date: '2026-03-18', type: 'Delivery', notes: 'Confirm with RH day before' },
  { id: 3, title: 'Invoice Due — INV-1043', date: '2026-03-20', type: 'Billing', notes: '' },
  { id: 4, title: 'Site Visit — Rivera Suite', date: '2026-03-25', type: 'Site Visit', notes: '' },
]

const PROJECT_STATUSES = ['Design Phase', 'Procurement', 'In Progress', 'On Hold', 'Complete']
const ITEM_STATUSES = ['To Order', 'Ordered', 'Arrived', 'Installed', 'Delayed']
const INVOICE_STATUSES = ['Pending', 'Paid', 'Overdue', 'Cancelled']
const TASK_PRIORITIES = ['Today', 'This Week', 'Upcoming']
const EVENT_TYPES = ['Meeting', 'Delivery', 'Site Visit', 'Billing', 'Other']

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch { return initial }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue]
}

function ConfirmDeleteModal({ name, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Confirm Delete</h3>
        <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete <span className="font-medium text-slate-700">{name}</span>? This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700">Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── MODALS ──────────────────────────────────────────────

function ClientModal({ client, onSave, onClose }) {
  const [form, setForm] = useState(client || { name: '', email: '', phone: '', status: 'Active', notes: '' })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.name.trim() && form.email.trim()
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{client ? 'Edit Client' : 'Add Client'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Name *"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Client or family name" /></Field>
          <Field label="Email *"><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" /></Field>
          <Field label="Phone"><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(000) 000-0000" /></Field>
          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {['Active','Inactive','Lead'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Referral source, preferences…" /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form)} valid={valid} label={client ? 'Save Changes' : 'Add Client'} />
      </div>
    </div>
  )
}

function ProjectModal({ project, clients, onSave, onClose }) {
  const [form, setForm] = useState(project || { name: '', clientId: clients[0]?.id || '', status: 'Design Phase', budget: '', spent: '', notes: '' })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.name.trim() && form.clientId
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{project ? 'Edit Project' : 'Add Project'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Project Name *"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Riverside Living Room" /></Field>
          <Field label="Client *">
            <select value={form.clientId} onChange={e => set('clientId', Number(e.target.value))}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget ($)"><input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0" /></Field>
            <Field label="Spent ($)"><input type="number" value={form.spent} onChange={e => set('spent', e.target.value)} placeholder="0" /></Field>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Style notes, requirements…" /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form)} valid={valid} label={project ? 'Save Changes' : 'Add Project'} />
      </div>
    </div>
  )
}

function VendorModal({ vendor, onSave, onClose }) {
  const [form, setForm] = useState(vendor || { name: '', rep: '', email: '', phone: '', discount: '', notes: '' })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.name.trim()
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{vendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Vendor Name *"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. RH, Visual Comfort" /></Field>
          <Field label="Rep Name"><input value={form.rep} onChange={e => set('rep', e.target.value)} placeholder="Sales rep name" /></Field>
          <Field label="Email"><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="rep@vendor.com" /></Field>
          <Field label="Phone"><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(000) 000-0000" /></Field>
          <Field label="Trade Discount"><input value={form.discount} onChange={e => set('discount', e.target.value)} placeholder="e.g. 40% trade" /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Account numbers, payment terms…" /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form)} valid={valid} label={vendor ? 'Save Changes' : 'Add Vendor'} />
      </div>
    </div>
  )
}

function ItemModal({ item, projects, vendors, onSave, onClose }) {
  const [form, setForm] = useState(item || { name: '', projectId: projects[0]?.id || '', vendorId: vendors[0]?.id || '', cost: '', status: 'To Order', notes: '' })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.name.trim()
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{item ? 'Edit Item' : 'Add Item'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Item Name *"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sectional Sofa" /></Field>
          <Field label="Project">
            <select value={form.projectId} onChange={e => set('projectId', Number(e.target.value))}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Vendor">
            <select value={form.vendorId} onChange={e => set('vendorId', Number(e.target.value))}>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost ($)"><input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0" /></Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {ITEM_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Color, finish, dimensions…" /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form)} valid={valid} label={item ? 'Save Changes' : 'Add Item'} />
      </div>
    </div>
  )
}

function InvoiceModal({ invoice, clients, projects, onSave, onClose }) {
  const nextNum = `INV-${1045 + Math.floor(Math.random() * 100)}`
  const [form, setForm] = useState(invoice || { num: nextNum, clientId: clients[0]?.id || '', projectId: projects[0]?.id || '', amount: '', due: '', status: 'Pending', notes: '' })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.num.trim() && form.clientId && form.amount
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{invoice ? 'Edit Invoice' : 'New Invoice'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Invoice # *"><input value={form.num} onChange={e => set('num', e.target.value)} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {INVOICE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Client *">
            <select value={form.clientId} onChange={e => set('clientId', Number(e.target.value))}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Project">
            <select value={form.projectId} onChange={e => set('projectId', Number(e.target.value))}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount ($) *"><input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" /></Field>
            <Field label="Due Date"><input type="date" value={form.due} onChange={e => set('due', e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Payment terms, notes…" /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form)} valid={valid} label={invoice ? 'Save Changes' : 'Create Invoice'} />
      </div>
    </div>
  )
}

function TaskModal({ task, projects, onSave, onClose }) {
  const [form, setForm] = useState(task || { title: '', priority: 'Today', done: false, projectId: '', notes: '' })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.title.trim()
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{task ? 'Edit Task' : 'Add Task'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Task *"><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be done?" /></Field>
          <Field label="Priority">
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              {TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Project (optional)">
            <select value={form.projectId} onChange={e => set('projectId', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— None —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Additional details…" /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form)} valid={valid} label={task ? 'Save Changes' : 'Add Task'} />
      </div>
    </div>
  )
}

function EventModal({ event, onSave, onClose }) {
  const [form, setForm] = useState(event || { title: '', date: '', type: 'Meeting', notes: '' })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const valid = form.title.trim() && form.date
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">{event ? 'Edit Event' : 'Add Event'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Title *"><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event title" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date *"><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
            <Field label="Type">
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Location, details…" /></Field>
        </div>
        <ModalFooter onClose={onClose} onSave={() => onSave(form)} valid={valid} label={event ? 'Save Changes' : 'Add Event'} />
      </div>
    </div>
  )
}

// ── SHARED UI HELPERS ────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      {React.cloneElement(children, {
        className: 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none'
      })}
    </div>
  )
}

function ModalFooter({ onClose, onSave, valid, label }) {
  return (
    <div className="flex gap-3 justify-end mt-6">
      <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
      <button onClick={onSave} disabled={!valid}
        className={`px-4 py-2 text-sm rounded-lg text-white ${valid ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-300 cursor-not-allowed'}`}>
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

// ── APP ROOT ─────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [clients, setClients] = useLocalStorage('sos_v1_clients', INITIAL_CLIENTS)
  const [projects, setProjects] = useLocalStorage('sos_v1_projects', INITIAL_PROJECTS)
  const [vendors, setVendors] = useLocalStorage('sos_v1_vendors', INITIAL_VENDORS)
  const [items, setItems] = useLocalStorage('sos_v1_items', INITIAL_ITEMS)
  const [invoices, setInvoices] = useLocalStorage('sos_v1_invoices', INITIAL_INVOICES)
  const [tasks, setTasks] = useLocalStorage('sos_v1_tasks', INITIAL_TASKS)
  const [events, setEvents] = useLocalStorage('sos_v1_events', INITIAL_EVENTS)

  const shared = { clients, projects, vendors, items, invoices, tasks, events }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-teal-800 text-white px-6 py-3 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold tracking-wide">Studio OS</span>
          <span className="text-teal-300 text-sm">Interior Design Management</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-teal-900 font-bold text-sm">SM</div>
          <span className="text-sm text-teal-100">Sarah Mitchell</span>
        </div>
      </header>
      <nav className="bg-white border-b border-slate-200 px-4 flex gap-1 flex-shrink-0 shadow-sm">
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
        {activeTab === 'dashboard' && <Dashboard {...shared} />}
        {activeTab === 'clients' && <Clients clients={clients} setClients={setClients} />}
        {activeTab === 'projects' && <Projects projects={projects} setProjects={setProjects} clients={clients} />}
        {activeTab === 'items' && <Items items={items} setItems={setItems} projects={projects} vendors={vendors} />}
        {activeTab === 'vendors' && <Vendors vendors={vendors} setVendors={setVendors} />}
        {activeTab === 'invoices' && <Invoices invoices={invoices} setInvoices={setInvoices} clients={clients} projects={projects} />}
        {activeTab === 'calendar' && <CalendarView events={events} setEvents={setEvents} />}
        {activeTab === 'tasks' && <Tasks tasks={tasks} setTasks={setTasks} projects={projects} />}
      </main>
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
        <table className="w-full text-sm">
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
                <td className="py-3 text-slate-500">{clients.find(c => c.id === p.clientId)?.name || '—'}</td>
                <td className="py-3"><Badge status={p.status} /></td>
                <td className="py-3 text-slate-600">${p.budget.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Clients({ clients, setClients }) {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.status.toLowerCase().includes(search.toLowerCase())
  )
  function handleSave(form) {
    if (modal === 'add') setClients(p => [...p, { ...form, id: Date.now() }])
    else setClients(p => p.map(c => c.id === modal.id ? { ...modal, ...form } : c))
    setModal(null)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Clients</h2>
        <button onClick={() => setModal('add')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Client</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
        className="mb-4 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-72" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              {['Name','Email','Phone','Status','Notes',''].map(h => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No clients found</td></tr>}
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
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onConfirm={() => { setClients(p => p.filter(c => c.id !== deleteTarget.id)); setDeleteTarget(null) }} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

function Projects({ projects, setProjects, clients }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'All' || p.status === statusFilter)
  )
  function handleSave(form) {
    const p = { ...form, budget: Number(form.budget) || 0, spent: Number(form.spent) || 0 }
    if (modal === 'add') setProjects(prev => [...prev, { ...p, id: Date.now() }])
    else setProjects(prev => prev.map(x => x.id === modal.id ? { ...modal, ...p } : x))
    setModal(null)
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
        {filtered.length === 0 && <div className="col-span-3 text-center py-16 text-slate-400">No projects found</div>}
        {filtered.map(p => {
          const pct = p.budget ? Math.min(100, Math.round((p.spent / p.budget) * 100)) : 0
          const over = p.spent > p.budget && p.budget > 0
          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-slate-800 pr-2">{p.name}</h3>
                <Badge status={p.status} />
              </div>
              <p className="text-sm text-slate-500 mb-4">{clients.find(c => c.id === p.clientId)?.name || '—'}</p>
              {p.budget > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Budget: <span className="font-medium text-slate-700">${p.budget.toLocaleString()}</span></span>
                    <span className={over ? 'text-rose-600 font-medium' : ''}>Spent: ${p.spent.toLocaleString()}{over && ' ⚠️'}</span>
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
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onConfirm={() => { setProjects(p => p.filter(x => x.id !== deleteTarget.id)); setDeleteTarget(null) }} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

function Vendors({ vendors, setVendors }) {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const filtered = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || v.rep.toLowerCase().includes(search.toLowerCase()))
  function handleSave(form) {
    if (modal === 'add') setVendors(p => [...p, { ...form, id: Date.now() }])
    else setVendors(p => p.map(v => v.id === modal.id ? { ...modal, ...form } : v))
    setModal(null)
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
        {filtered.length === 0 && <div className="col-span-3 text-center py-16 text-slate-400">No vendors found</div>}
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
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onConfirm={() => { setVendors(p => p.filter(v => v.id !== deleteTarget.id)); setDeleteTarget(null) }} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

function Items({ items, setItems, projects, vendors }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'All' || i.status === statusFilter)
  )
  function handleSave(form) {
    const item = { ...form, cost: Number(form.cost) || 0 }
    if (modal === 'add') setItems(p => [...p, { ...item, id: Date.now() }])
    else setItems(p => p.map(x => x.id === modal.id ? { ...modal, ...item } : x))
    setModal(null)
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
            {filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No items found</td></tr>}
            {filtered.map(i => (
              <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{i.name}</td>
                <td className="px-5 py-3 text-slate-500">{projects.find(p => p.id === i.projectId)?.name || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{vendors.find(v => v.id === i.vendorId)?.name || '—'}</td>
                <td className="px-5 py-3">${i.cost.toLocaleString()}</td>
                <td className="px-5 py-3"><Badge status={i.status} /></td>
                <td className="px-5 py-3"><Actions onEdit={() => setModal(i)} onDelete={() => setDeleteTarget(i)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <ItemModal item={modal === 'add' ? null : modal} projects={projects} vendors={vendors} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onConfirm={() => { setItems(p => p.filter(x => x.id !== deleteTarget.id)); setDeleteTarget(null) }} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

function Invoices({ invoices, setInvoices, clients, projects }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const filtered = invoices.filter(i =>
    (i.num.toLowerCase().includes(search.toLowerCase()) || clients.find(c => c.id === i.clientId)?.name.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'All' || i.status === statusFilter)
  )
  function handleSave(form) {
    const inv = { ...form, amount: Number(form.amount) || 0 }
    if (modal === 'add') setInvoices(p => [...p, { ...inv, id: Date.now() }])
    else setInvoices(p => p.map(x => x.id === modal.id ? { ...modal, ...inv } : x))
    setModal(null)
  }
  const totalOutstanding = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0)
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
            {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No invoices found</td></tr>}
            {filtered.map(i => (
              <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{i.num}</td>
                <td className="px-5 py-3 text-slate-500">{clients.find(c => c.id === i.clientId)?.name || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{projects.find(p => p.id === i.projectId)?.name || '—'}</td>
                <td className="px-5 py-3 font-medium">${Number(i.amount).toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500">{i.due ? new Date(i.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                <td className="px-5 py-3"><Badge status={i.status} /></td>
                <td className="px-5 py-3"><Actions onEdit={() => setModal(i)} onDelete={() => setDeleteTarget(i)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <InvoiceModal invoice={modal === 'add' ? null : modal} clients={clients} projects={projects} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.num} onConfirm={() => { setInvoices(p => p.filter(x => x.id !== deleteTarget.id)); setDeleteTarget(null) }} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

function Tasks({ tasks, setTasks, projects }) {
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  function handleSave(form) {
    if (modal === 'add') setTasks(p => [...p, { ...form, id: Date.now() }])
    else setTasks(p => p.map(t => t.id === modal.id ? { ...modal, ...form } : t))
    setModal(null)
  }
  function toggleDone(id) {
    setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t))
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
                    <button onClick={() => toggleDone(t.id)}
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
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.title} onConfirm={() => { setTasks(p => p.filter(t => t.id !== deleteTarget.id)); setDeleteTarget(null) }} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

function CalendarView({ events, setEvents }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1))
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }

  function eventsOnDay(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  function handleSave(form) {
    if (modal === 'add') setEvents(p => [...p, { ...form, id: Date.now() }])
    else setEvents(p => p.map(e => e.id === modal.id ? { ...modal, ...form } : e))
    setModal(null)
  }

  const typeColors = { Meeting: 'bg-amber-100 text-amber-700', Delivery: 'bg-teal-100 text-teal-700', 'Site Visit': 'bg-blue-100 text-blue-700', Billing: 'bg-rose-100 text-rose-700', Other: 'bg-slate-100 text-slate-600' }

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
            <button onClick={prevMonth} className="px-3 py-1 border border-slate-200 rounded text-sm hover:bg-slate-50">← Prev</button>
            <button onClick={nextMonth} className="px-3 py-1 border border-slate-200 rounded text-sm hover:bg-slate-50">Next →</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-2 font-medium">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
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
      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.title} onConfirm={() => { setEvents(p => p.filter(e => e.id !== deleteTarget.id)); setDeleteTarget(null) }} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

function Actions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2 justify-end">
      <button onClick={onEdit} className="text-slate-400 hover:text-teal-600"><Pencil size={15} /></button>
      <button onClick={onDelete} className="text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
    </div>
  )
}