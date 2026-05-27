import { useState } from 'react'
import { trpc } from '../lib/trpc'
import { Plus, Key, UserX, UserCheck, Copy, Check } from 'lucide-react'

type Role = 'ADMIN' | 'VENDEDOR'

export default function Usuarios() {
  const { data: lista, refetch } = trpc.users.list.useQuery()
  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'VENDEDOR' as Role })
  const [tempPassword, setTempPassword] = useState<{ userId: number; pass: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const createMutation = trpc.users.create.useMutation({
    onSuccess: (data) => {
      setTempPassword({ userId: data.id, pass: data.tempPassword })
      setShowCreate(false)
      setNewUser({ name: '', email: '', role: 'VENDEDOR' })
      refetch()
    },
    onError: (err) => setError(err.message),
  })

  const updateMutation = trpc.users.update.useMutation({ onSuccess: () => refetch() })
  const resetMutation = trpc.users.resetPassword.useMutation({
    onSuccess: (data, vars) => {
      setTempPassword({ userId: vars.id, pass: data.tempPassword })
      refetch()
    },
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    createMutation.mutate(newUser)
  }

  function copyPassword() {
    if (!tempPassword) return
    navigator.clipboard.writeText(tempPassword.pass).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão de Usuários</h1>
          <p className="text-slate-400 text-sm mt-0.5">Administre o acesso ao QG Polpa Brasil</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
        >
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {/* Senha temporária */}
      {tempPassword && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-5">
          <p className="text-sm font-semibold text-amber-300 mb-2">Senha temporária gerada</p>
          <p className="text-xs text-amber-400 mb-3">Copie e envie ao usuário. Ela não será exibida novamente.</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-green-400 font-mono text-lg tracking-widest">
              {tempPassword.pass}
            </code>
            <button
              onClick={copyPassword}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg px-3 py-2 transition"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <button onClick={() => setTempPassword(null)} className="text-slate-400 hover:text-white text-xs">Fechar</button>
          </div>
        </div>
      )}

      {/* Formulário de criação */}
      {showCreate && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Novo Usuário</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Nome completo</label>
                <input
                  value={newUser.name}
                  onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
                  placeholder="Ex: João Silva"
                  required
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                  placeholder="joao@empresa.com"
                  required
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Perfil de acesso</label>
              <select
                value={newUser.role}
                onChange={e => setNewUser(u => ({ ...u, role: e.target.value as Role }))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
              >
                <option value="VENDEDOR">Vendedor (somente leitura)</option>
                <option value="ADMIN">Administrador (acesso total)</option>
              </select>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition">
                {createMutation.isPending ? 'Criando...' : 'Criar usuário'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white text-sm transition">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuários */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Usuário</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Perfil</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Último acesso</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {(lista ?? []).map(u => (
              <tr key={u.id} className="hover:bg-slate-700/40 transition">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-white">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                  {u.must_change_password && <span className="text-xs text-amber-400">⚠ Deve trocar a senha</span>}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                    u.role === 'ADMIN' ? 'bg-purple-900/40 text-purple-300' : 'bg-blue-900/40 text-blue-300'
                  }`}>
                    {u.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                    u.ativo ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
                  }`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400">
                  {u.last_signed_in ? new Date(u.last_signed_in).toLocaleDateString('pt-BR') : 'Nunca'}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => resetMutation.mutate({ id: u.id })}
                      title="Resetar senha"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition"
                    >
                      <Key size={14} />
                    </button>
                    <button
                      onClick={() => updateMutation.mutate({ id: u.id, ativo: !u.ativo })}
                      title={u.ativo ? 'Desativar' : 'Ativar'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                    >
                      {u.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <select
                      value={u.role}
                      onChange={e => updateMutation.mutate({ id: u.id, role: e.target.value as Role })}
                      className="bg-slate-700 border border-slate-600 rounded text-xs text-white px-1.5 py-1 focus:outline-none"
                    >
                      <option value="VENDEDOR">Vendedor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!lista || lista.length === 0) && (
          <div className="p-8 text-center text-slate-400 text-sm">Nenhum usuário cadastrado.</div>
        )}
      </div>
    </div>
  )
}
