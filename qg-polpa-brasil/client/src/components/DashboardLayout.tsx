import { useState } from 'react'
import { useLocation } from 'wouter'
import {
  LayoutDashboard, Users, ShoppingBag, Package, UserCog, LogOut,
  ChevronLeft, ChevronRight, FolderOpen, TrendingUp, BarChart2, Target, Menu, X, MessageSquare, History,
} from 'lucide-react'
import { logout } from '../lib/api'

const menuGroups = [
  {
    group: 'Visão Geral',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/' }],
  },
  {
    group: 'Análises',
    items: [
      { icon: Users,       label: 'Por Vendedor',       path: '/vendedores' },
      { icon: FolderOpen,  label: 'Novos Projetos',     path: '/projetos' },
      { icon: Users,       label: 'Histórico Clientes', path: '/historico-clientes' },
      { icon: History,     label: 'Comparativo Semanal', path: '/snapshot' },
      { icon: BarChart2,   label: 'Recorrentes R x O', path: '/recorrentes' },
      { icon: ShoppingBag, label: 'Por Cliente',        path: '/clientes' },
      { icon: Package,     label: 'Por Produto',        path: '/produtos' },
    ],
  },
  {
    group: 'CRM',
    items: [
      { icon: TrendingUp,    label: 'Funil de Vendas', path: '/funil-vendas' },
      { icon: BarChart2,     label: 'Panorama CRM',    path: '/panorama-crm' },
      { icon: MessageSquare, label: 'Agente IA',        path: '/chat' },
    ],
  },
]

const adminMenuGroup = {
  group: 'Administração',
  items: [
    { icon: UserCog, label: 'Usuários', path: '/usuarios' },
    { icon: Target,  label: 'Metas',    path: '/metas' },
  ],
}

interface Props {
  children: React.ReactNode
  user: { id: number; name: string; email: string; role: string }
}

export default function DashboardLayout({ children, user }: Props) {
  const [location, navigate] = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
    } finally {
      window.location.href = '/'
    }
  }

  const allGroups = user.role === 'ADMIN' ? [...menuGroups, adminMenuGroup] : menuGroups
  const initials = (user.name ?? user.email).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center h-14 md:h-16 px-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">QB</span>
            </div>
            <span className="font-bold text-white text-sm truncate">QG Polpa Brasil</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center mx-auto">
            <span className="text-sm font-bold text-white">QB</span>
          </div>
        )}
        {/* Fechar no mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto text-slate-400 hover:text-white md:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {allGroups.map(group => (
          <div key={group.group}>
            {!collapsed && (
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1">
                {group.group}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const active = location === item.path
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => { navigate(item.path); setMobileOpen(false) }}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm transition ${
                        active
                          ? 'bg-green-600/20 text-green-400'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <item.icon size={18} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 p-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name ?? user.email}</p>
              <p className="text-xs text-slate-400">{user.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sair"
          className={`flex items-center gap-2 w-full rounded-lg px-2 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 transition ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} />
          {!collapsed && <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>}
        </button>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expandir' : 'Recolher'}
          className={`hidden md:flex items-center gap-2 w-full rounded-lg px-2 py-2 text-sm text-slate-500 hover:text-white hover:bg-slate-700 transition ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-xs">Recolher</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">

      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar desktop (permanente) */}
      <aside
        style={{ width: collapsed ? 64 : 240 }}
        className="hidden md:flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-200 shrink-0"
      >
        {sidebarContent}
      </aside>

      {/* Sidebar mobile (drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-800 border-r border-slate-700 transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Header mobile */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-800 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">QB</span>
          </div>
          <span className="font-bold text-white text-sm">QG Polpa Brasil</span>
        </div>

        <div className="w-full px-3 py-4 md:px-6 md:py-6">
          {children}
        </div>
      </main>
    </div>
  )
}