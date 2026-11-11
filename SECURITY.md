# Security Policy

## Supported deployment

ModelForge is a static browser application. Imported CSV and Excel files are processed locally in the browser. The repository does not currently provide a deployed backend, account system, server-side file storage or live LLM integration. Browser localStorage is not encrypted.

## Reporting a vulnerability

Please do not publish exploitable details, proof-of-concept payloads, credentials or private user data in a public issue.

Use GitHub's **Report a vulnerability** flow (private vulnerability reporting / a GitHub Security Advisory) for this repository when available. If that option is unavailable, contact the maintainer privately through the GitHub profile and request a secure channel. Include:
- affected version, commit or deployment URL;
- impact and realistic attack scenario;
- minimal reproduction steps, using synthetic data;
- any suggested mitigation.

Please allow reasonable time for investigation and a fix before public disclosure. Do not access, modify or retain another person's data while testing.

## Security expectations

- Never commit real `.env` files, API keys, tokens, passwords or private financial workbooks.
- Treat imported files and all parsed cell values as untrusted input.
- Keep any future API credentials server-side; never put secrets in browser JavaScript.
- Keep dependencies and GitHub Actions reviewed and updated.
- Do not describe a security scan as a guarantee that the application is secure.
