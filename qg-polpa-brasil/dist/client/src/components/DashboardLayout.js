import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation } from 'wouter';
import { LayoutDashboard, Users, ShoppingBag, Package, UserCog, LogOut, ChevronLeft, ChevronRight, FolderOpen, TrendingUp, BarChart2, } from 'lucide-react';
import { trpc } from '../lib/trpc';
const menuGroups = [
    {
        group: 'Visão Geral',
        items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/' }],
    },
    {
        group: 'Análises',
        items: [
            { icon: Users, label: 'Por Vendedor', path: '/vendedores' },
            { icon: ShoppingBag, label: 'Por Cliente', path: '/clientes' },
            { icon: Package, label: 'Por Produto', path: '/produtos' },
            { icon: FolderOpen, label: 'Novos Projetos', path: '/projetos' },
        ],
    },
    {
        group: 'CRM',
        items: [
            { icon: TrendingUp, label: 'Funil de Vendas', path: '/funil-vendas' },
            { icon: BarChart2, label: 'Panorama CRM', path: '/panorama-crm' },
        ],
    },
];
const adminMenuGroup = {
    group: 'Administração',
    items: [{ icon: UserCog, label: 'Usuários', path: '/usuarios' }],
};
export default function DashboardLayout({ children, user }) {
    const [location, navigate] = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => { window.location.href = '/'; } });
    const allGroups = user.role === 'ADMIN' ? [...menuGroups, adminMenuGroup] : menuGroups;
    const initials = (user.name ?? user.email).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return (_jsxs("div", { className: "flex h-screen overflow-hidden bg-slate-900", children: [_jsxs("aside", { style: { width: collapsed ? 64 : 240 }, className: "flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-200 shrink-0", children: [_jsxs("div", { className: "flex items-center h-16 px-4 border-b border-slate-700", children: [!collapsed && (_jsxs("div", { className: "flex items-center gap-2 overflow-hidden", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shrink-0", children: _jsx("span", { className: "text-sm font-bold text-white", children: "QB" }) }), _jsx("span", { className: "font-bold text-white text-sm truncate", children: "QG Polpa Brasil" })] })), collapsed && (_jsx("div", { className: "w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center mx-auto", children: _jsx("span", { className: "text-sm font-bold text-white", children: "QB" }) }))] }), _jsx("nav", { className: "flex-1 overflow-y-auto py-4 px-2 space-y-4", children: allGroups.map(group => (_jsxs("div", { children: [!collapsed && (_jsx("p", { className: "text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1", children: group.group })), _jsx("ul", { className: "space-y-0.5", children: group.items.map(item => {
                                        const active = location === item.path;
                                        return (_jsx("li", { children: _jsxs("button", { onClick: () => navigate(item.path), title: collapsed ? item.label : undefined, className: `flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm transition ${active
                                                    ? 'bg-green-600/20 text-green-400'
                                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'} ${collapsed ? 'justify-center' : ''}`, children: [_jsx(item.icon, { size: 18, className: "shrink-0" }), !collapsed && _jsx("span", { className: "truncate", children: item.label })] }) }, item.path));
                                    }) })] }, group.group))) }), _jsxs("div", { className: "border-t border-slate-700 p-3 space-y-1", children: [!collapsed && (_jsxs("div", { className: "flex items-center gap-2 px-2 py-1.5 rounded-lg", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-green-700 flex items-center justify-center shrink-0", children: _jsx("span", { className: "text-xs font-bold text-white", children: initials }) }), _jsxs("div", { className: "overflow-hidden flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-semibold text-white truncate", children: user.name ?? user.email }), _jsx("p", { className: "text-xs text-slate-400", children: user.role === 'ADMIN' ? 'Administrador' : 'Vendedor' })] })] })), _jsxs("button", { onClick: () => logoutMutation.mutate(), title: "Sair", className: `flex items-center gap-2 w-full rounded-lg px-2 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition ${collapsed ? 'justify-center' : ''}`, children: [_jsx(LogOut, { size: 16 }), !collapsed && _jsx("span", { children: "Sair" })] }), _jsxs("button", { onClick: () => setCollapsed(c => !c), title: collapsed ? 'Expandir' : 'Recolher', className: `flex items-center gap-2 w-full rounded-lg px-2 py-2 text-sm text-slate-500 hover:text-white hover:bg-slate-700 transition ${collapsed ? 'justify-center' : ''}`, children: [collapsed ? _jsx(ChevronRight, { size: 16 }) : _jsx(ChevronLeft, { size: 16 }), !collapsed && _jsx("span", { className: "text-xs", children: "Recolher" })] })] })] }), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsx("div", { className: "w-full px-6 py-6", children: children }) })] }));
}
