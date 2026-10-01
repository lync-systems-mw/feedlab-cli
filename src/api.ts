import { requireToken, resolveApiUrl } from './config.js'

export class ApiError extends Error {}

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PATCH'
    body?: unknown
    apiUrl?: string
}

/** Every command is a thin client of the same /api/v1 REST surface the public API docs
 *  describe — the CLI has no business logic of its own, so it stays in lockstep with
 *  whatever the API can do. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = await requireToken()
    const base = await resolveApiUrl(options.apiUrl)

    const response = await fetch(`${base}${path}`, {
        method: options.method ?? 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const text = await response.text()
    const json = text ? JSON.parse(text) : {}

    if (!response.ok) {
        throw new ApiError(typeof json.error === 'string' ? json.error : `Request failed with status ${response.status}`)
    }
    return json as T
}
