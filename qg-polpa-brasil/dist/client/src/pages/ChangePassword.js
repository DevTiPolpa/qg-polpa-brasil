import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { trpc } from '../lib/trpc';
export default function ChangePassword({ userName, onSuccess }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const utils = trpc.useUtils();
    const changeMutation = trpc.auth.changePassword.useMutation({
        onSuccess: async () => {
            await utils.auth.me.invalidate();
            onSuccess();
        },
        onError: (err) => setError(err.message),
    });
    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (newPassword !== confirm) {
            setError('As senhas não coincidem');
            return;
        }
        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        changeMutation.mutate({ newPassword });
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-900", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 mb-4", children: _jsx("span", { className: "text-2xl font-bold text-white", children: "QB" }) }), _jsx("h1", { className: "text-2xl font-bold text-white", children: "Criar nova senha" }), _jsxs("p", { className: "text-slate-400 text-sm mt-1", children: ["Ol\u00E1, ", userName, "! Por seguran\u00E7a, crie uma nova senha para continuar."] })] }), _jsx("div", { className: "bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-1.5", children: "Nova senha" }), _jsx("input", { type: "password", value: newPassword, onChange: e => setNewPassword(e.target.value), placeholder: "M\u00EDnimo 6 caracteres", required: true, minLength: 6, className: "w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-1.5", children: "Confirmar nova senha" }), _jsx("input", { type: "password", value: confirm, onChange: e => setConfirm(e.target.value), placeholder: "Repita a nova senha", required: true, className: "w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition" })] }), error && (_jsx("div", { className: "bg-red-900/40 border border-red-700 rounded-lg px-4 py-2.5 text-red-300 text-sm", children: error })), _jsx("button", { type: "submit", disabled: changeMutation.isPending, className: "w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition", children: changeMutation.isPending ? 'Salvando...' : 'Salvar nova senha' })] }) })] }) }));
}
