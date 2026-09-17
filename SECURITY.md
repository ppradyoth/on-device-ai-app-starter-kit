# Security Policy

## Reporting a vulnerability

Please do not open a public issue for a suspected security vulnerability.

Use GitHub's private vulnerability reporting or contact the maintainers through
the repository's private security channel. Include the affected commit or
release, the browser and operating system, reproduction steps, impact, and
any redacted evidence needed to reproduce the issue.

Do not include uploaded documents, model weights, credentials, browser
profiles, or other sensitive artifacts in a report. Replace secrets and
document content with `[REDACTED_SECRET]` or synthetic markers.

## Scope

This project is a browser-local starter kit. Reports are welcome for the
application, build and release configuration, dependency handling, local data
boundaries, model verification, and documented deployment configuration.

The project does not provide accounts, cloud synchronization, remote inference,
or native iOS and Android applications in v0.1.0.

## Security boundaries

The project does not claim complete privacy, production readiness, prompt-
injection protection, air-gap compatibility, support for every browser or
device, or zero network traffic during initial application and model downloads.

Architecture, a refusal, or an absence of observed requests is not by itself
proof of a security property. Security claims must be backed by reproducible
tests and their boundaries.
