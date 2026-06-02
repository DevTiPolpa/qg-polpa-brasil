const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010'

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(options?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`

    try {
      const errorBody = await response.json()
      message = errorBody?.detail ?? errorBody?.message ?? message
    } catch {
      message = response.statusText || message
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export type UserRole = 'ADMIN' | 'VENDEDOR'

export type ApiUser = {
  id: number
  name: string
  email: string
  role: UserRole
  ativo: boolean
  must_change_password: boolean
  created_at: string | null
  updated_at: string | null
  last_signed_in: string | null
}

export type AuthUser = {
  id: number
  name: string
  email: string
  role: UserRole
  mustChangePassword: boolean
}

export type ApiUsersResponse = {
  status: 'ok'
  count: number
  users: ApiUser[]
}

export type CreateUserPayload = {
  name: string
  email: string
  role: UserRole
}

export type CreateUserResponse = {
  status: 'ok'
  id: number
  tempPassword: string
}

export type UpdateUserPayload = {
  name?: string
  role?: UserRole
  ativo?: boolean
}

export type ApiMessageResponse = {
  status: 'ok'
  message: string
}

export type ResetPasswordResponse = {
  status: 'ok'
  tempPassword: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type ChangePasswordPayload = {
  newPassword: string
}

export type LogoutResponse = {
  success: boolean
}

export type ApiMeta2026 = {
  id: number
  nomeVendedor: string
  mes: string
  valorMeta: number
  projeto: string | null
  mercadoVendas: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type ApiMetas2026Response = {
  status: 'ok'
  count: number
  metas: ApiMeta2026[]
}

export type UpsertMeta2026Payload = {
  nomeVendedor: string
  mes: string
  valorMeta: number
  projeto?: string | null
  mercadoVendas?: string | null
}

export type B2BResumoItem = {
  anoMes: string
  vendedor: string
  projeto: string
  mercadoVendas: string
  quantidadeNegociada: number
  quantidadeEntregue: number
  pesoLiquido: number
  valorPendente: number
  notas: number
  clientes: number
}

export type ApiB2BResumoResponse = {
  status: 'ok'
  count: number
  resumo: B2BResumoItem[]
}

export async function getUsers(limit = 100): Promise<ApiUser[]> {
  const data = await apiRequest<ApiUsersResponse>(`/api/users?limit=${limit}`)
  return data.users
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
  return apiRequest<CreateUserResponse>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateUser(userId: number, payload: UpdateUserPayload): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function resetUserPassword(userId: number): Promise<ResetPasswordResponse> {
  return apiRequest<ResetPasswordResponse>(`/api/users/${userId}/reset-password`, {
    method: 'POST',
  })
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return apiRequest<AuthUser | null>('/api/auth/me')
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function logout(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>('/api/auth/logout', {
    method: 'POST',
  })
}

export async function changePassword(payload: ChangePasswordPayload): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getMetas2026(ano = '2026'): Promise<ApiMeta2026[]> {
  const data = await apiRequest<ApiMetas2026Response>(`/api/metas?ano=${encodeURIComponent(ano)}`)
  return data.metas
}

export async function upsertMeta2026(payload: UpsertMeta2026Payload): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>('/api/metas', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteMeta2026(id: number): Promise<ApiMessageResponse> {
  return apiRequest<ApiMessageResponse>(`/api/metas/${id}`, {
    method: 'DELETE',
  })
}

export async function getB2BResumo(ano = '2026'): Promise<B2BResumoItem[]> {
  const data = await apiRequest<ApiB2BResumoResponse>(`/api/b2b/resumo?ano=${encodeURIComponent(ano)}`)
  return data.resumo
}