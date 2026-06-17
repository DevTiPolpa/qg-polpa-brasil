import { useEffect, useState } from 'react'
import { Route, Switch } from 'wouter'
import { getCurrentUser, type AuthUser } from './lib/api'
import Login from './pages/Login'
import ChangePassword from './pages/ChangePassword'
import DashboardLayout from './components/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Vendedores from './pages/Vendedores'
import Usuarios from './pages/Usuarios'
import Metas from './pages/Metas'
import NovosProjetos from './pages/NovosProjetos'
import RecorrentesRealOrcado from './pages/RecorrentesRealOrcado'
import FunilVendas from './pages/FunilVendas'
import PanoramaCrm from './pages/PanoramaCrm'
import Chat from './pages/Chat'
import SnapshotComparativo from './pages/SnapshotComparativo'
import HistoricoClientes from './pages/HistoricoClientes'

function AppRoutes() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadCurrentUser() {
    setIsLoading(true)

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCurrentUser()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Login onLogin={(loggedUser) => setUser(loggedUser)} />

  if (user.mustChangePassword) {
    return <ChangePassword userName={user.name ?? user.email} onSuccess={loadCurrentUser} />
  }

  return (
    <DashboardLayout user={user}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/vendedores" component={Vendedores} />
        <Route path="/projetos" component={NovosProjetos} />
        <Route path="/recorrentes" component={RecorrentesRealOrcado} />
        <Route path="/snapshot" component={SnapshotComparativo} />
        <Route path="/historico-clientes" component={HistoricoClientes} />
        <Route path="/funil-vendas" component={FunilVendas} />
        <Route path="/panorama-crm" component={PanoramaCrm} />
        {user.role === 'ADMIN' && <Route path="/chat" component={Chat} />}
        {user.role === 'ADMIN' && <Route path="/usuarios" component={Usuarios} />}
        {user.role === 'ADMIN' && <Route path="/metas" component={Metas} />}
        <Route>
          <div className="p-8 text-slate-400">Página não encontrada.</div>
        </Route>
      </Switch>
    </DashboardLayout>
  )
}

export default function App() {
  return <AppRoutes />
}