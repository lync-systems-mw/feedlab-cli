import { hostname } from 'node:os'
import open from 'open'
import { resolveApiUrl, writeConfig, clearConfig, requireToken } from '../config.js'
import { ApiError, apiRequest } from '../api.js'

interface DeviceStart {
    device_code: string
    user_code: string
    verification_uri: string
    verification_uri_complete: string
    expires_in: number
    interval: number
}

interface MeResponse {
    user_id: string
    email: string | null
    name: string | null
}

function sleep(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

export async function login(options: { apiUrl?: string }) {
    const apiUrl = await resolveApiUrl(options.apiUrl)

    const startResponse = await fetch(`${apiUrl}/api/cli/device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_label: hostname() }),
    })
    if (!startResponse.ok) {
        console.error(`Could not start login (${startResponse.status}). Is ${apiUrl} reachable?`)
        process.exit(1)
    }
    const start = (await startResponse.json()) as DeviceStart

    console.log(`First, your code is:\n\n  ${start.user_code}\n`)
    console.log(`Opening ${start.verification_uri} in your browser to confirm it...`)
    await open(start.verification_uri_complete).catch(() => {
        console.log(`Couldn't open a browser automatically. Visit this URL instead:\n  ${start.verification_uri_complete}`)
    })

    const deadline = Date.now() + start.expires_in * 1000
    let interval = start.interval

    while (Date.now() < deadline) {
        await sleep(interval)

        const pollResponse = await fetch(`${apiUrl}/api/cli/device/poll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_code: start.device_code }),
        })
        const body = (await pollResponse.json()) as { access_token?: string, error?: string, interval?: number }

        if (pollResponse.ok && body.access_token) {
            await writeConfig({ token: body.access_token, apiUrl })
            console.log('\nLogged in to FeedLab.')
            return
        }

        if (body.error === 'authorization_pending') {
            if (typeof body.interval === 'number') interval = body.interval
            continue
        }

        console.error(body.error === 'access_denied' ? '\nLogin request denied.' : '\nLogin request expired. Run `feedlab login` again.')
        process.exit(1)
    }

    console.error('\nLogin timed out. Run `feedlab login` again.')
    process.exit(1)
}

export async function logout() {
    await clearConfig()
    console.log('Logged out.')
}

export async function whoami(options: { apiUrl?: string }) {
    await requireToken()
    try {
        const me = await apiRequest<MeResponse>('/api/v1/me', { apiUrl: options.apiUrl })
        console.log(me.name ? `${me.name} <${me.email}>` : me.email ?? me.user_id)
    } catch (error) {
        console.error(error instanceof ApiError ? error.message : 'Could not reach FeedLab.')
        process.exit(1)
    }
}
