# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning in a lightweight, practical way.

## [0.1.0] - 2026-08-01

### Added

- Initial public release of Inbox Forge
- Cloudflare Workers-based temporary email application template
- D1-backed inbox, message, attachment, and analytics schema
- Email Worker pipeline for receiving and parsing inbound mail with `postal-mime`
- Optional R2 attachment storage support
- Frontend inbox UI with temporary session restore support
- Admin dashboard for stats and reserved prefix management
- Reserved email prefix CRUD in the admin panel
- Scheduled cleanup for expired inboxes and expired messages
- Public-safe repository cleanup for GitHub publishing
- GitHub Actions typecheck workflow
- Issue templates, pull request template, contribution guide, code of conduct, and security policy

### Notes

- This repository is published as a template-style starter for self-hosted Cloudflare deployments.
- Production identifiers and environment-specific secrets were removed before the public release.
