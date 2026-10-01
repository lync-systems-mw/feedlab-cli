import { ApiError, apiRequest } from '../api.js'

interface Project {
    id: string
    name: string
    description: string | null
    organization: string | null
}

export async function listProjects(options: { apiUrl?: string }) {
    try {
        const { projects } = await apiRequest<{ projects: Project[] }>('/api/v1/projects', { apiUrl: options.apiUrl })
        if (!projects.length) {
            console.log('No projects found for this account.')
            return
        }
        console.table(projects.map(p => ({ id: p.id, name: p.name, organization: p.organization ?? '' })))
    } catch (error) {
        console.error(error instanceof ApiError ? error.message : 'Could not reach FeedLab.')
        process.exit(1)
    }
}
