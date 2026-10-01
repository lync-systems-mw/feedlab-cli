#!/usr/bin/env node
import { Command } from 'commander'
import { login, logout, whoami } from './commands/auth.js'
import { listProjects } from './commands/projects.js'
import { listFeedback, viewFeedback, resolveFeedback, reportFeedback } from './commands/feedback.js'

const program = new Command()
program
    .name('feedlab')
    .description('Manage FeedLab feedback and test sessions from your terminal')
    .version('0.1.0')
    .option('--api-url <url>', 'Override the FeedLab API base URL (default https://feedlab.cloud)')

program.command('login')
    .description('Sign in via your browser')
    .action((_opts, command) => login(command.optsWithGlobals()))

program.command('logout')
    .description('Forget the saved login')
    .action(() => logout())

program.command('whoami')
    .description('Show who you are signed in as')
    .action((_opts, command) => whoami(command.optsWithGlobals()))

program.command('projects')
    .description('List projects you can access')
    .action((_opts, command) => listProjects(command.optsWithGlobals()))

const feedback = program.command('feedback').description('Manage feedback items')

feedback.command('list')
    .description('List feedback for a project')
    .requiredOption('-p, --project <id>', 'Project id')
    .option('--status <status>', 'open (default) | resolved | all')
    .option('--source <source>', 'code_review | all')
    .option('--limit <n>', 'Max items (default 100)')
    .action((opts, command) => listFeedback({ ...opts, ...command.optsWithGlobals() }))

feedback.command('view <id>')
    .description('Show one feedback item in full')
    .action((id, _opts, command) => viewFeedback(id, command.optsWithGlobals()))

feedback.command('resolve <id>')
    .description('Update a feedback item\'s status')
    .option('--status <status>', 'pending | in_progress | completed', 'completed')
    .option('--note <text>', 'Note to append, e.g. the fix or PR')
    .action((id, opts, command) => resolveFeedback(id, { ...opts, ...command.optsWithGlobals() }))

feedback.command('report <content>')
    .description('File a new feedback item (for pipelines: CI failures, alerts, etc.)')
    .requiredOption('-p, --project <id>', 'Project id')
    .option('--title <title>', 'Short title (defaults to the start of the content)')
    .option('--type <type>', 'bug (default) | feature | general')
    .option('--metadata <json>', 'Arbitrary JSON object to attach, e.g. \'{"build":"1.4.2"}\'')
    .action((content, opts, command) => reportFeedback(content, { ...opts, ...command.optsWithGlobals() }))

program.parseAsync(process.argv)
