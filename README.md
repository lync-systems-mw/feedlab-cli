# feedlab

Command-line client for [FeedLab](https://feedlab.cloud) — manage feedback and test sessions from your terminal, backed by the same API tokens as the FeedLab MCP server.

## Install

```bash
npm install -g @lyncsystems/feedlab
```

## Sign in

```bash
feedlab login
```

Opens your browser to confirm a short code, then stores a token in `~/.feedlab/config.json`.

In CI, where there's no browser, set `FEEDLAB_TOKEN` to a token from **Settings → API Tokens** in the dashboard instead — it takes priority over a saved login.

## Usage

```bash
feedlab whoami
feedlab projects

feedlab feedback list --project <id> [--status open|resolved|all]
feedlab feedback view <id>
feedlab feedback resolve <id> [--note "fixed in v1.4.2"]
feedlab feedback report "Build failed on main" --project <id> --type bug \
  --metadata '{"build":"1.4.2","pipeline":"github-actions"}'
```

Every command talks to the same REST API documented at [feedlab.cloud/docs/api](https://feedlab.cloud/docs/api) — the CLI has no logic of its own beyond formatting the response.

## Options

- `--api-url <url>` — point at a different FeedLab instance (default `https://feedlab.cloud`), or set `FEEDLAB_API_URL`.

## License

MIT
