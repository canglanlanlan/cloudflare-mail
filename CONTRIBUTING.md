# Contributing

Thanks for your interest in contributing to Inbox Forge.

## Before You Start

- Read the [README](/D:/Codex/Mail/README.md) for setup and project context
- Check existing issues and pull requests before starting new work
- Open an issue first for larger changes so the direction can be discussed

## Development Setup

1. Install dependencies

```bash
npm install
```

2. Configure your local Cloudflare settings

- Update `wrangler.jsonc` with your own placeholder replacements
- Set `ADMIN_PASSWORD` using `.dev.vars` or Wrangler secrets

3. Initialize the local database

```bash
npx wrangler d1 create temp_inbox
npx wrangler d1 execute temp_inbox --file=./schema.sql
```

4. Start development

```bash
npm run dev
```

## Contribution Guidelines

- Keep changes focused and scoped
- Avoid committing secrets, tokens, cookies, or production identifiers
- Prefer clear, maintainable TypeScript over clever shortcuts
- Preserve the current Cloudflare Workers architecture unless a change explicitly requires restructuring

## Pull Request Checklist

Before opening a pull request:

- Run `npm run typecheck`
- Test the affected behavior locally when possible
- Update documentation if behavior or setup changes
- Keep sensitive deployment details out of commits

## Commit Messages

Use short, descriptive commit messages. Examples:

- `Add reserved prefix admin UI`
- `Sanitize public repository config`
- `Improve inbox creation validation`

## Reporting Security Issues

Do not open public GitHub issues for vulnerabilities. Please follow the process in [SECURITY.md](/D:/Codex/Mail/SECURITY.md).
