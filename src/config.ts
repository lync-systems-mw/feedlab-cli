import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const DEFAULT_API_URL = 'https://feedlab.cloud'

const CONFIG_DIR = join(homedir(), '.feedlab')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

interface Config {
    token?: string
    apiUrl?: string
}

export async function readConfig(): Promise<Config> {
    try {
        return JSON.parse(await readFile(CONFIG_FILE, 'utf8'))
    } catch {
        return {}
    }
}

export async function writeConfig(config: Config): Promise<void> {
    await mkdir(CONFIG_DIR, { recursive: true })
    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })
}

export async function clearConfig(): Promise<void> {
    await rm(CONFIG_FILE, { force: true })
}

/** The configured API base, in order: --api-url flag, FEEDLAB_API_URL env var, saved config, default. */
export async function resolveApiUrl(flagValue?: string): Promise<string> {
    const url = flagValue || process.env.FEEDLAB_API_URL || (await readConfig()).apiUrl || DEFAULT_API_URL
    return url.replace(/\/$/, '')
}

/** FEEDLAB_TOKEN takes priority over the saved login, so CI and scripts can use a token
 *  created in Settings → API Tokens without running the interactive `feedlab login`. */
export async function requireToken(): Promise<string> {
    const token = process.env.FEEDLAB_TOKEN || (await readConfig()).token
    if (!token) {
        console.error('Not logged in. Run `feedlab login`, or set FEEDLAB_TOKEN to a token from Settings → API Tokens.')
        process.exit(1)
    }
    return token
}
