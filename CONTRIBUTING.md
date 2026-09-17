# Contributing

Thanks for helping improve the on-device AI starter kit.

## Scope

Keep changes aligned with the implementation plan and work one phase at a
time. Do not add native applications, cloud synchronization, remote model
fallbacks, analytics, telemetry, agents, OCR, image or audio support, or a
hosted backend before the plan permits them.

## Before opening a pull request

- Run the verification commands documented for the current phase.
- Keep changes focused and explain behavior changes in the pull request.
- Add or update tests for changed behavior.
- Do not commit model weights, uploaded documents, generated indexes,
  credentials, caches, browser profiles, or document-containing test artifacts.
- Use synthetic documents and markers in tests.
- Redact secrets and document content from logs and screenshots.

## Security-sensitive changes

Do not disclose suspected vulnerabilities in a public pull request. Follow
[SECURITY.md](SECURITY.md) for private reporting.

## License

By contributing, you agree that your contributions are provided under the
MIT License in [LICENSE](LICENSE).
