import { useState } from 'react'
import { trpc } from '../lib/trpc'

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => onLogin(),
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    loginMutation.mutate({ email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 mb-4">
            <span className="text-2xl font-bold text-white">QB</span>
          </div>
          <h1 className="text-2xl font-bold text-white">QG Polpa Brasil</h1>
          <p className="text-slate-400 text-sm mt-1">Acesso ao painel comercial</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
              disabled={loginMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition"
            >
              {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
        <p className="text-center text-slate-500 text-xs mt-6">
          Problemas de acesso? Contate o administrador do sistema.
        </p>
      </div>
    </div>
  )
}
