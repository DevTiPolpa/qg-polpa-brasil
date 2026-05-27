import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { trpc } from '../lib/trpc';
export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const loginMutation = trpc.auth.login.useMutation({
        onSuccess: () => onLogin(),
        onError: (err) => setError(err.message),
    });
    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        loginMutation.mutate({ email, password });
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-900", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 mb-4", children: _jsx("span", { className: "text-2xl font-bold text-white", children: "QB" }) }), _jsx("h1", { className: "text-2xl font-bold text-white", children: "QG Polpa Brasil" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Acesso ao painel comercial" })] }), _jsx("div", { className: "bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-1.5", children: "E-mail" }), _jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "seu@email.com", required: true, className: "w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-1.5", children: "Senha" }), _jsx("input", { type: "password", value: password, onChange: e => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, className: "w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition" })] }), error && (_jsx("div", { className: "bg-red-900/40 border border-red-700 rounded-lg px-4 py-2.5 text-red-300 text-sm", children: error })), _jsx("button", { type: "submit", disabled: loginMutation.isPending, className: "w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition", children: loginMutation.isPending ? 'Entrando...' : 'Entrar' })] }) }), _jsx("p", { className: "text-center text-slate-500 text-xs mt-6", children: "Problemas de acesso? Contate o administrador do sistema." })] }) }));
}
