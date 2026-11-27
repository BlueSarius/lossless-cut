# Sync procedure — re-apply this fork's changes on a fresh upstream

Written for Claude. The user says e.g. *"check upstream"* (→ step 1 only) or *"sync to v3.71.0"* (→ steps 1–6).

**Rules**
- Read upstream only. Never push, open PRs or comment upstream (see `CLAUDE.md`).
- Work on the session's development branch, and open the PR into `BlueSarius/lossless-cut` `master`.
- `master` is rebuilt every sync. Old fork commits are not rebased forward; they're replaced by fresh ones on top of upstream.

## 1. Scout (report, then wait for go/no-go)
```bash
git fetch https://github.com/mifi/lossless-cut.git master:refs/remotes/upstream/master 'refs/tags/*:refs/tags/*'
BASE=<"Last synced upstream commit" from CHANGES.md>
git tag --sort=-v:refname | head -5            # newest releases
git log --oneline $BASE..upstream/master       # everything new
git diff --stat $BASE..<candidate>
```
Write a short report for the user covering:
- **Worth it?** Performance and efficiency changes, bug fixes, new features, ffmpeg/Electron bumps. Read the actual diffs of interesting commits, not just their titles.
- **Risk:** big refactors, dependency or build changes, breaking config changes.
- **Overlap with our changes:** files upstream touched ∩ files our patches touch (`grep -h '^+++ b/' fork/changes/*/*.patch | sort -u`).
- **New network use**, which change 03 will need to remove.
- **Upstream now fixes or does one of our changes?** Then propose dropping it.
- **Recommendation:** the latest tag, or a specific newer `master` commit if it has clearly useful changes since the tag, or wait.

Stop here unless the user said to sync.

## 2. Rebuild on the chosen upstream target
```bash
TARGET=<tag or commit>
git checkout -B <dev-branch> $TARGET
git checkout origin/master -- fork CLAUDE.md .github/workflows/build-windows.yml
git commit -m "Fork: add fork-owned files"                      # change 01, no trailer
git am -3 fork/changes/*/*.patch                                # applied in folder order
```
`git am` stops at the first patch that doesn't apply. For each stop:
- **Small conflict:** resolve it following that change's `recipe.md` (the recipe describes intent, not line numbers), then `git add …` and `git am --continue`.
- **Upstream rewrote the area:** run `git am --skip` and re-implement the change from `recipe.md` on the new code. Commit it with the original message, **keeping the `Fork-Change: <id>` trailer**, then run `git am --continue` for the remaining patches.
- **Upstream already does it:** run `git am --skip` for all its patches, and mark it `dropped (…)` in `CHANGES.md` with the upstream commit.

Then regenerate the generated files:
```bash
yarn install                      # regenerates yarn.lock (patches leave it out)
yarn scan-i18n                    # if translation keys changed
git commit -am "Fork: regenerate yarn.lock and translations"   # no trailer
```

## 3. Check
```bash
yarn tsc && yarn lint && yarn test run
```
- Run each recipe's **Verify** section (automated parts here; list the manual parts in the PR for the user).
- Run change 03's network grep on the new code.

## 4. Update the store
```bash
fork/export-patches.sh $TARGET      # rewrites fork/changes/*/*.patch from the new commits
```
- Update any `recipe.md` whose "How" no longer matches what you did, e.g. renamed files or new upstream network calls.
- In `CHANGES.md`: set "Last synced upstream commit" to the full hash of `$TARGET`, update the statuses, and add a sync-log row.
- Commit: `git commit -am "Fork: update patch store for <target>"`.

## 5. Make it land on `master` without a force-push
```bash
git fetch origin master
git merge -s ours origin/master -m "Sync fork with upstream <target>"
git push -u origin <dev-branch>
```
`-s ours` keeps this branch's files exactly and only records old `master` as a parent. The PR then turns `master` into "fresh upstream + our changes".
Open a PR into **`BlueSarius/lossless-cut` `master`**. Its body should list each change as: applied cleanly / conflict resolved / rebuilt from recipe / dropped, plus the manual checks.
Tell the user to merge with **"Create a merge commit"**, not squash or rebase.

## 6. After merge
The user starts **Actions → "Build Windows release" → Run workflow** on `master`.
