import { useState } from 'react'
import { LayoutDashboard, Users, FolderKanban, Package, Store, FileText, Calendar, CheckSquare } from 'lucide-react'

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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Top Bar */}
      <header className="bg-teal-800 text-white px-6 py-3 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold tracking-wide">Studio OS</span>
          <span className="text-teal-300 text-sm">Interior Design Management</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-teal-900 font-bold text-sm">
            SM
          </div>
          <span className="text-sm text-teal-100">Sarah Mitchell</span>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-slate-200 px-4 flex gap-1 flex-shrink-0 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'clients' && <Clients />}
        {activeTab === 'projects' && <Projects />}
        {activeTab === 'items' && <Items />}
        {activeTab === 'vendors' && <Vendors />}
        {activeTab === 'invoices' && <Invoices />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'tasks' && <Tasks />}
      </main>

    </div>
  )
}

function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Projects', value: '6', color: 'bg-teal-50 border-teal-200 text-teal-700' },
          { label: 'Open Invoices', value: '4', color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Items Pending', value: '12', color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Tasks Due Today', value: '3', color: 'bg-rose-50 border-rose-200 text-rose-700' },
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
          <tbody className="text-slate-700">
            {[
              { project: 'Riverside Living Room', client: 'Johnson Family', status: 'In Progress', budget: '$18,500' },
              { project: 'Downtown Loft Kitchen', client: 'Alex Chen', status: 'Procurement', budget: '$24,000' },
              { project: 'Suburban Master Suite', client: 'Rivera Family', status: 'Design Phase', budget: '$11,200' },
            ].map((row) => (
              <tr key={row.project} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 font-medium">{row.project}</td>
                <td className="py-3 text-slate-500">{row.client}</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-full text-xs">{row.status}</span>
                </td>
                <td className="py-3 text-slate-600">{row.budget}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Clients() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Clients</h2>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Client</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Projects</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {[
              { name: 'Johnson Family', email: 'kjohnson@email.com', phone: '(312) 555-0182', projects: 2, status: 'Active' },
              { name: 'Alex Chen', email: 'alex.chen@email.com', phone: '(312) 555-0247', projects: 1, status: 'Active' },
              { name: 'Rivera Family', email: 'mrivera@email.com', phone: '(312) 555-0391', projects: 1, status: 'Active' },
              { name: 'Patricia Wells', email: 'pwells@email.com', phone: '(312) 555-0104', projects: 3, status: 'Inactive' },
            ].map((c) => (
              <tr key={c.name} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-slate-500">{c.email}</td>
                <td className="px-5 py-3 text-slate-500">{c.phone}</td>
                <td className="px-5 py-3">{c.projects}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${c.status === 'Active' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Projects() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Projects</h2>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Project</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: 'Riverside Living Room', client: 'Johnson Family', status: 'In Progress', budget: '$18,500', spent: '$12,300' },
          { name: 'Downtown Loft Kitchen', client: 'Alex Chen', status: 'Procurement', budget: '$24,000', spent: '$8,750' },
          { name: 'Suburban Master Suite', client: 'Rivera Family', status: 'Design Phase', budget: '$11,200', spent: '$2,100' },
          { name: 'Lakefront Guest House', client: 'Johnson Family', status: 'Complete', budget: '$31,000', spent: '$29,800' },
        ].map((p) => (
          <div key={p.name} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-800">{p.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'Complete' ? 'bg-slate-100 text-slate-500' : 'bg-teal-50 text-teal-700'}`}>
                {p.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">{p.client}</p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Budget: <span className="text-slate-700 font-medium">{p.budget}</span></span>
              <span className="text-slate-500">Spent: <span className="text-amber-600 font-medium">{p.spent}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Items() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Items & Procurement</h2>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Item</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="px-5 py-3 font-medium">Vendor</th>
              <th className="px-5 py-3 font-medium">Cost</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {[
              { item: 'Sectional Sofa', project: 'Riverside Living Room', vendor: 'RH', cost: '$4,200', status: 'Ordered' },
              { item: 'Pendant Lights x3', project: 'Downtown Loft Kitchen', vendor: 'Visual Comfort', cost: '$1,850', status: 'Arrived' },
              { item: 'Area Rug 9x12', project: 'Riverside Living Room', vendor: 'Stark Carpet', cost: '$2,400', status: 'To Order' },
              { item: 'King Bed Frame', project: 'Suburban Master Suite', vendor: 'Room & Board', cost: '$3,100', status: 'Installed' },
            ].map((i) => (
              <tr key={i.item} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{i.item}</td>
                <td className="px-5 py-3 text-slate-500">{i.project}</td>
                <td className="px-5 py-3 text-slate-500">{i.vendor}</td>
                <td className="px-5 py-3">{i.cost}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    i.status === 'Installed' ? 'bg-teal-50 text-teal-700' :
                    i.status === 'Arrived' ? 'bg-amber-50 text-amber-700' :
                    i.status === 'Ordered' ? 'bg-blue-50 text-blue-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>{i.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Vendors() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Vendors</h2>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Vendor</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: 'RH (Restoration Hardware)', rep: 'James Holloway', email: 'jholloway@rh.com', discount: '40% trade' },
          { name: 'Visual Comfort', rep: 'Sandra Lee', email: 'slee@visualcomfort.com', discount: '35% trade' },
          { name: 'Stark Carpet', rep: 'Tom Briggs', email: 'tbriggs@starkcarpet.com', discount: '30% trade' },
          { name: 'Room & Board', rep: 'Lisa Park', email: 'lpark@roomandboard.com', discount: '25% trade' },
        ].map((v) => (
          <div key={v.name} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-slate-800 mb-1">{v.name}</h3>
            <p className="text-sm text-slate-500 mb-1">Rep: {v.rep}</p>
            <p className="text-sm text-slate-500 mb-3">{v.email}</p>
            <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs">{v.discount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Invoices() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Invoices</h2>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ New Invoice</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-5 py-3 font-medium">Invoice #</th>
              <th className="px-5 py-3 font-medium">Client</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Due Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {[
              { num: 'INV-1042', client: 'Johnson Family', amount: '$6,500', due: 'Mar 15, 2026', status: 'Overdue' },
              { num: 'INV-1043', client: 'Alex Chen', amount: '$3,200', due: 'Mar 20, 2026', status: 'Pending' },
              { num: 'INV-1044', client: 'Rivera Family', amount: '$2,800', due: 'Apr 1, 2026', status: 'Pending' },
              { num: 'INV-1041', client: 'Patricia Wells', amount: '$9,100', due: 'Feb 28, 2026', status: 'Paid' },
            ].map((inv) => (
              <tr key={inv.num} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{inv.num}</td>
                <td className="px-5 py-3 text-slate-500">{inv.client}</td>
                <td className="px-5 py-3 font-medium">{inv.amount}</td>
                <td className="px-5 py-3 text-slate-500">{inv.due}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    inv.status === 'Paid' ? 'bg-teal-50 text-teal-700' :
                    inv.status === 'Overdue' ? 'bg-rose-50 text-rose-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>{inv.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CalendarView() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Calendar</h2>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-700">March 2026</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded text-sm hover:bg-slate-50">← Prev</button>
            <button className="px-3 py-1 border border-slate-200 rounded text-sm hover:bg-slate-50">Next →</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-2 font-medium">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {Array.from({length: 31}, (_, i) => i + 1).map(day => (
            <div key={day} className={`min-h-16 p-2 border border-slate-100 rounded-lg ${day === 11 ? 'bg-teal-50 border-teal-200' : 'hover:bg-slate-50'}`}>
              <span className={`text-xs font-medium ${day === 11 ? 'text-teal-700' : 'text-slate-600'}`}>{day}</span>
              {day === 14 && <div className="mt-1 text-xs bg-amber-100 text-amber-700 rounded px-1 truncate">Client mtg</div>}
              {day === 18 && <div className="mt-1 text-xs bg-teal-100 text-teal-700 rounded px-1 truncate">Delivery</div>}
              {day === 20 && <div className="mt-1 text-xs bg-rose-100 text-rose-700 rounded px-1 truncate">Invoice due</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Tasks() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Tasks</h2>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Task</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Today', color: 'border-rose-200', tasks: ['Call Johnson re: sofa delay', 'Send invoice INV-1043', 'Order area rug — Stark'] },
          { label: 'This Week', color: 'border-amber-200', tasks: ['Site visit — Rivera master suite', 'Finalize Chen kitchen layout', 'Follow up Visual Comfort order'] },
          { label: 'Upcoming', color: 'border-slate-200', tasks: ['Prepare Q2 project proposals', 'Update vendor discount terms', 'Schedule Lakefront walkthrough'] },
        ].map(({ label, color, tasks }) => (
          <div key={label} className={`bg-white rounded-xl border-2 ${color} p-5`}>
            <h3 className="font-semibold text-slate-700 mb-4">{label}</h3>
            <div className="flex flex-col gap-2">
              {tasks.map(task => (
                <div key={task} className="flex items-start gap-2 text-sm text-slate-600">
                  <div className="w-4 h-4 rounded border border-slate-300 flex-shrink-0 mt-0.5"></div>
                  {task}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}