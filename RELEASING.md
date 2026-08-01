# Releasing

This document describes how to version and publish Inbox Forge releases.

## Versioning Strategy

This project uses a practical Semantic Versioning style:

- `MAJOR` for breaking changes
- `MINOR` for backward-compatible features
- `PATCH` for backward-compatible fixes, cleanup, and documentation-only releases when they are worth tagging

Examples:

- `0.2.0` for a new inbox feature or admin capability
- `0.2.1` for a bug fix in message loading
- `1.0.0` for the first stable release with a clearly supported public API and deployment model

## Pre-1.0 Guidance

Before `1.0.0`, the project may still evolve quickly. Use these rules:

- Prefer `0.MINOR.0` for meaningful feature milestones
- Use `0.MINOR.PATCH` for fixes on the latest minor line
- Treat breaking changes seriously even before `1.0.0`, and call them out clearly in release notes

## Release Checklist

Before creating a release:

1. Confirm the branch is up to date
2. Run local checks

```bash
npm install
npm run typecheck
```

3. Review the diff since the previous tag

```bash
git log --oneline --decorate --graph
git diff <previous-tag>..HEAD
```

4. Update release-facing docs if needed

- [README](/D:/Codex/Mail/README.md)
- [CHANGELOG](/D:/Codex/Mail/CHANGELOG.md)

5. Decide the next version number

## Release Notes Template

Use this structure for GitHub Releases:

```md
## Highlights

- ...

## Added

- ...

## Changed

- ...

## Fixed

- ...

## Notes

- Deployment or upgrade notes
- Breaking changes if any
```

## Creating a Release

1. Ensure `main` contains the final release state
2. Update [CHANGELOG](/D:/Codex/Mail/CHANGELOG.md)
3. Create the Git tag and GitHub Release

Example:

```bash
gh release create v0.2.0 \
  --repo canglanlanlan/cloudflare-mail \
  --target main \
  --title "v0.2.0" \
  --notes-file release-notes.md
```

If you prefer inline notes:

```bash
gh release create v0.2.0 --repo canglanlanlan/cloudflare-mail --target main --title "v0.2.0" --notes "..."
```

## Tag Naming

Use:

- `v0.1.0`
- `v0.2.0`
- `v1.0.0`

Avoid:

- `release-1`
- `latest`
- date-only tags unless there is a separate release policy

## What Should Go In a Release

Good release candidates:

- new user-facing functionality
- notable fixes
- deployment or architecture changes
- repository-level milestones for public development

Usually skip a release for:

- typo-only edits
- tiny internal refactors with no user or maintainer impact
- draft work that is not yet deployable
