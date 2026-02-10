import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'דשבורד' },
  { to: '/patients', icon: 'group', label: 'מטופלים' },
  { to: '/appointments', icon: 'calendar_month', label: 'תורים' },
  { to: '/services', icon: 'medical_services', label: 'שירותים' },
  { to: '/invoices', icon: 'receipt_long', label: 'חשבוניות' },
  { to: '/tasks', icon: 'task_alt', label: 'משימות' },
]

export default function Sidebar() {
  const { user, logout, isDoctor } = useAuth()

  return (
    <aside className="w-64 bg-background-dark text-white flex flex-col h-screen shrink-0">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-lg font-bold">מרפאת ד״ר כהן</h1>
        <p className="text-sm text-white/60 mt-1">{user?.full_name}</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary border-l-3 border-primary'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {isDoctor && (
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary border-l-3 border-primary'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">smart_toy</span>
            צ׳אט AI
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm w-full px-2 py-2 rounded transition-colors hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          התנתק
        </button>
      </div>
    </aside>
  )
}
