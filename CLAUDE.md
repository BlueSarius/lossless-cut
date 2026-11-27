# CLAUDE.md

## Repository ownership — read first

This repository (`BlueSarius/lossless-cut`) is a **private fork** of the upstream project `mifi/lossless-cut`. All work stays in this fork.

**Never interact with the upstream repository (`mifi/lossless-cut`) or any other repository than `BlueSarius/lossless-cut`.** Specifically, never:

- open a pull request against upstream (a PR's base repository must always be `BlueSarius/lossless-cut`)
- open, comment on, or react to issues, PRs, discussions or reviews upstream
- push branches or tags to upstream, or add upstream as a push remote
- fork, star, watch, or otherwise send anything to upstream via the GitHub API, `gh`, `git`, or any other tool

Reading upstream (e.g. fetching to compare or pull in changes) is fine. If a task seems to require contributing anything upstream, stop and ask the user instead.

## Fork changes & syncing with upstream

All changes this fork makes on top of upstream are listed in [`fork/CHANGES.md`](fork/CHANGES.md), each with a recipe and patches in `fork/changes/`. To check upstream for updates or to sync, follow [`fork/SYNC.md`](fork/SYNC.md).
When you add a new fork change, also add it to the store: write a recipe, put a `Fork-Change: <id>` trailer on its commits, and add a row in `CHANGES.md`.
