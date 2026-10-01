import { ApiError, apiRequest } from '../api.js'

interface IssueSummary {
    id: string
    title: string
    type: string
    status: string
    tags: string[]
    source: string
    created_at: string
}

interface IssueDetail extends IssueSummary {
    description: string
    is_resolved: boolean
    screenshot_url: string | null
    user_name: string | null
    user_email: string | null
    page_url: string | null
    metadata: Record<string, unknown>
}

function fail(error: unknown): never {
    console.error(error instanceof ApiError ? error.message : 'Could not reach FeedLab.')
    process.exit(1)
}

export async function listFeedback(options: { project: string, status?: string, source?: string, limit?: string, apiUrl?: string }) {
    const params = new URLSearchParams({ project_id: options.project })
    if (options.status) params.set('status', options.status)
    if (options.source) params.set('source', options.source)
    if (options.limit) params.set('limit', options.limit)

    try {
        const { issues } = await apiRequest<{ issues: IssueSummary[] }>(`/api/v1/feedback?${params}`, { apiUrl: options.apiUrl })
        if (!issues.length) {
            console.log('No matching feedback.')
            return
        }
        console.table(issues.map(i => ({ id: i.id, type: i.type, status: i.status, title: i.title, tags: i.tags.join(',') })))
    } catch (error) {
        fail(error)
    }
}

export async function viewFeedback(id: string, options: { apiUrl?: string }) {
    try {
        const { issue } = await apiRequest<{ issue: IssueDetail }>(`/api/v1/feedback/${id}`, { apiUrl: options.apiUrl })
        console.log(`${issue.title}\n`)
        console.log(`id:       ${issue.id}`)
        console.log(`type:     ${issue.type}`)
        console.log(`status:   ${issue.status}`)
        console.log(`tags:     ${issue.tags.join(', ') || '—'}`)
        console.log(`source:   ${issue.source}`)
        if (issue.user_name || issue.user_email) console.log(`reporter: ${[issue.user_name, issue.user_email].filter(Boolean).join(' / ')}`)
        if (issue.page_url) console.log(`page:     ${issue.page_url}`)
        if (issue.screenshot_url) console.log(`image:    ${issue.screenshot_url}`)
        if (issue.metadata && Object.keys(issue.metadata).length) console.log(`metadata: ${JSON.stringify(issue.metadata)}`)
        console.log(`\n${issue.description}`)
    } catch (error) {
        fail(error)
    }
}

export async function resolveFeedback(id: string, options: { status: string, note?: string, apiUrl?: string }) {
    try {
        const { issue } = await apiRequest<{ issue: IssueSummary }>(`/api/v1/feedback/${id}`, {
            method: 'PATCH',
            body: { status: options.status, note: options.note },
            apiUrl: options.apiUrl,
        })
        console.log(`${issue.title} -> ${issue.status}`)
    } catch (error) {
        fail(error)
    }
}

export async function reportFeedback(content: string, options: { project: string, title?: string, type?: string, metadata?: string, apiUrl?: string }) {
    let metadata: Record<string, unknown> | undefined
    if (options.metadata) {
        try {
            metadata = JSON.parse(options.metadata)
        } catch {
            console.error('--metadata must be valid JSON, e.g. \'{"build":"1.4.2"}\'')
            process.exit(1)
        }
    }

    try {
        const result = await apiRequest<{ id: string }>('/api/v1/feedback', {
            method: 'POST',
            body: { projectId: options.project, content, title: options.title, type: options.type, metadata },
            apiUrl: options.apiUrl,
        })
        console.log(`Filed as ${result.id}`)
    } catch (error) {
        fail(error)
    }
}
