# Inbox Forge

Inbox Forge is a temporary email project template built for Cloudflare Workers.

This public-safe version has been sanitized for GitHub:
- Real production domains were removed
- Real D1 IDs were removed
- Local cookie exports and similar sensitive files were removed
- `wrangler.jsonc` now uses placeholder values

## Features

- Create temporary inboxes
- Read email lists and message details
- Render HTML and plain text email bodies
- Download attachments
- Auto-clean expired inboxes and messages
- Restore sessions with a short access code
- Manage reserved email prefixes in the admin panel
- Handle unclaimed mail with pending inbox fallback

## Stack

- Cloudflare Workers
- Cloudflare Email Routing
- Cloudflare D1
- Cloudflare R2 (optional)
- TypeScript
- `postal-mime`

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create a D1 database

```bash
npx wrangler d1 create temp_inbox
```

3. Update [wrangler.jsonc](/D:/Codex/Mail/wrangler.jsonc)

Replace the placeholder values with your own:
- `routes[0].pattern`
- `vars.INBOX_DOMAIN`
- `d1_databases[0].database_id`

4. Initialize the schema

```bash
npx wrangler d1 execute temp_inbox --file=./schema.sql
```

5. Set the admin password

For production:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

For local development, create `.dev.vars`:

```env
ADMIN_PASSWORD=change-me
```

6. Start local development

```bash
npm run dev
```

## Optional R2 Setup

If you want attachment storage:

```bash
npx wrangler r2 bucket create temp-inbox-attachments
```

Then add the bucket binding to `wrangler.jsonc`.

## Deploy

1. Log in to Wrangler

```bash
npx wrangler login
```

2. Initialize the remote schema

```bash
npx wrangler d1 execute temp_inbox --remote --file=./schema.sql
```

3. Set the admin password

```bash
npx wrangler secret put ADMIN_PASSWORD
```

4. Deploy

```bash
npm run deploy
```

5. Configure Email Routing in Cloudflare Dashboard

- Enable `Email Routing`
- Configure MX records for your receiving domain
- Add a catch-all or specific routing rule
- Point the rule to this Worker

## Admin Panel

Visit `/admin` to access:
- Daily usage stats
- Recent trend data
- Reserved prefix management

Reserved prefix management supports:
- Add blocked prefixes
- Remove blocked prefixes
- Apply changes immediately to inbox creation validation

## Project Structure

```text
src/
  index.ts
  admin.ts
  api-*.ts
  render.ts
  render-scripts.ts
  utils-*.ts
schema.sql
wrangler.jsonc
```

## GitHub Metadata Suggestion

Suggested repository description:

> Temporary email inbox template for Cloudflare Workers, D1, and Email Routing.

Suggested topics:

```text
cloudflare-workers
cloudflare-d1
email-routing
temporary-email
temp-mail
disposable-email
typescript
serverless
```

## Security Notes

Before pushing to GitHub, double-check:

```bash
git status
git diff
rg -n "example.com|database_id|ADMIN_PASSWORD|cookie|secret|token" .
```

Do not commit:
- Real Cloudflare production domains
- Real D1 or R2 resource IDs
- Admin passwords
- `wrangler secret` values
- Cookie exports or captured session files

## License

MIT. See [LICENSE](/D:/Codex/Mail/LICENSE).

## Community

- Contribution guide: [CONTRIBUTING](/D:/Codex/Mail/CONTRIBUTING.md)
- Code of Conduct: [CODE_OF_CONDUCT](/D:/Codex/Mail/CODE_OF_CONDUCT.md)
- Security policy: [SECURITY](/D:/Codex/Mail/SECURITY.md)
- Changelog: [CHANGELOG](/D:/Codex/Mail/CHANGELOG.md)
- Release guide: [RELEASING](/D:/Codex/Mail/RELEASING.md)
