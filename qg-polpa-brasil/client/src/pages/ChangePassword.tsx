import { useState } from 'react'
import { trpc } from '../lib/trpc'

export default function ChangePassword({ userName, onSuccess }: { userName: string; onSuccess: () => void }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const utils = trpc.useUtils()
  const changeMutation = trpc.auth.changePassword.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate()
      onSuccess()
    },
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirm) { setError('As senhas não coincidem'); return }
    if (newPassword.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return }
    changeMutation.mutate({ newPassword })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 mb-4">
            <span className="text-2xl font-bold text-white">QB</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Criar nova senha</h1>
          <p className="text-slate-400 text-sm mt-1">Olá, {userName}! Por segurança, crie uma nova senha para continuar.</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar nova senha</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
              />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-2.5 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={changeMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition"
            >
              {changeMutation.isPending ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
