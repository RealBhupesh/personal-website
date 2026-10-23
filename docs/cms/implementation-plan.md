# CMS implementation plan

Approved design: dashboard-design.md. Approved by the owner on 23 October 2026.

1. Add typed article validation, safe MDX rules, deterministic serialization, and tests.
2. Add owner-only GitHub authentication, private repository storage, revision checks, media, and atomic public publishing.
3. Add a separate admin layout, library, rich-text/source editor, previews, media, revisions, settings, and setup guidance.
4. Verify the flows in an explicitly enabled loopback-only local workspace; verify GitHub API interactions with deterministic integration tests.
5. Run checks, audit the UI against the supplied design law, push, and verify the deployed setup state.
6. Hand over the GitHub App setup required to enable production writing. Never claim unconfigured GitHub sign-in or publication was tested live.
