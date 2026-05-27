import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Switch } from 'wouter';
import { trpc } from './lib/trpc';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Vendedores from './pages/Vendedores';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';
import Usuarios from './pages/Usuarios';
import NovosProjetos from './pages/NovosProjetos';
import FunilVendas from './pages/FunilVendas';
import PanoramaCrm from './pages/PanoramaCrm';
function AppRoutes() {
    const { data: user, isLoading, refetch } = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-slate-900 flex items-center justify-center", children: _jsx("div", { className: "w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" }) }));
    }
    if (!user)
        return _jsx(Login, { onLogin: () => refetch() });
    if (user.mustChangePassword)
        return _jsx(ChangePassword, { userName: user.name ?? user.email, onSuccess: () => refetch() });
    return (_jsx(DashboardLayout, { user: user, children: _jsxs(Switch, { children: [_jsx(Route, { path: "/", component: Dashboard }), _jsx(Route, { path: "/vendedores", component: Vendedores }), _jsx(Route, { path: "/clientes", component: Clientes }), _jsx(Route, { path: "/produtos", component: Produtos }), _jsx(Route, { path: "/projetos", component: NovosProjetos }), _jsx(Route, { path: "/funil-vendas", component: FunilVendas }), _jsx(Route, { path: "/panorama-crm", component: PanoramaCrm }), user.role === 'ADMIN' && _jsx(Route, { path: "/usuarios", component: Usuarios }), _jsx(Route, { children: _jsx("div", { className: "p-8 text-slate-400", children: "P\u00E1gina n\u00E3o encontrada." }) })] }) }));
}
export default function App() {
    return _jsx(AppRoutes, {});
}
