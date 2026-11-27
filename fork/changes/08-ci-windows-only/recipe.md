# 08 — CI tests on Windows only, once per PR

**Type:** infra (saves CI time) · **Depends on:** nothing

## What & why
Upstream's `Test` workflow runs on `ubuntu-latest` and `windows-latest`, and runs on every push **and** every pull request, so each PR commit was tested twice. This fork is only built and used on Windows, so:
1. The test matrix is **Windows only**.
2. It runs on **pull requests** and on **pushes to `master`**, not on every branch push.

## How
In `.github/workflows/test.yml`:
- Replace `on: [push, pull_request]` with `on: { push: { branches: [master] }, pull_request: }` (block style).
- Change the matrix to `os: [windows-latest]`.

If upstream renames the workflow or adds more OSes or jobs, apply the same idea: keep only Windows and the PR + master triggers.
Leave `build.yml` (upstream's release build) alone. It only runs on tags, a schedule or manually, and is not used by this fork. The fork's builds use `build-windows.yml` (change 01).

## Verify
On the sync PR, the Checks tab shows a single `test (windows-latest)` job.

## Drop when
Never. If the fork is ever used on Linux or macOS, add those OSes back.
