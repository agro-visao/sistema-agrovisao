import { supabase } from './supabaseClient'

export interface AdminApiResult {
  ok: boolean
  status: number
  payload: { data?: unknown; error?: string } | null
}

/**
 * Helper de fetch autenticado para as rotas /api/admin/*.
 * Substitui as antigas funções `api()` locais (que usavam cookie de sessão)
 * por um Authorization: Bearer <access_token> vindo da sessão do Supabase Auth.
 */
export async function adminApi(path: string, options?: RequestInit): Promise<AdminApiResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const { data } = await supabase.auth.getSession()
    const accessToken = data.session?.access_token

    const headers: HeadersInit = {
      ...(options?.headers || {}),
      Authorization: accessToken ? `Bearer ${accessToken}` : '',
      ...(typeof options?.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
    }

    const res = await fetch(path, {
      cache: 'no-store',
      signal: controller.signal,
      ...options,
      headers,
    })
    clearTimeout(timeout)

    let payload: AdminApiResult['payload'] = null
    try {
      payload = await res.json()
    } catch {}
    return { ok: res.ok, status: res.status, payload }
  } catch (error) {
    console.error('API call failed:', path, error)
    return { ok: false, status: 0, payload: { error: 'Erro de conexão' } }
  }
}
