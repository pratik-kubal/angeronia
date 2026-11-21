# Phase D: review and pull request

**The orchestrating session does this itself.** It is design judgement, not
implementation, so it is not handed to a subagent.

## 1. Run the phases

1. Confirm the owner has approved starting, and that `docs/plans/monument-redesign/`
   and `scripts/sources/hero-schuylkill-night.jpg` are committed on
   `redesign/monument` (worktree agents see only committed files).
2. Launch the Phase A agent with `phase-a-foundation.md`. Read its report.
   Do not continue unless the games parity compare is clean and every gate
   passed.
3. Launch B1 to B6 together, each with `isolation: "worktree"` and its brief
   from `phase-b-sections.md`. When all six report, merge their branches into
   `redesign/monument`. A conflict means someone edited a file they did not
   own: resolve it in favour of the owner and note it.
4. Launch the Phase C agent with `phase-c-integration.md`.

## 2. The design skill's gate

```bash
S=~/.claude/skills/design-taste-frontend
npm run build && (npx next start -p 3417 &) && sleep 4
node $S/scripts/lint.mjs components styles app
node $S/scripts/inspect.mjs http://localhost:3417/ --out .taste-skill/after
```

Fix every FAIL. Treat every WARN as wrong unless it can be defended in one
sentence. Expected and defensible:

* `no-footage`: there is no honest clip of this subject. The moving picture is
  the photograph's drift.
* `size-count`, if it counts the fitted name as a seventh size.
* `eyebrow` on the sentence above the name, if it appears: that sentence is
  the page's statement of what this is, at 20px or more, not a label. If the
  inspector still fails it, pass `--allow eyebrow` and say so in the report.

Do not hide anything from the meter and do not argue with it elsewhere.

## 3. Look

Open every screenshot the inspector lists, at 1440, 768 and 390. Critique them
with `$S/references/critique.md`: the passes, the weighted score, the caps.
Write the critique down. Fix the top three problems. Inspect and look again.
Three rounds at most. Compare with `.taste-skill/before/`.

Then, by hand in a browser: tab through the whole page; use the proof exhibit
with the keyboard; turn on reduced motion; disable JavaScript; open `/privacy`,
`/terms`, `/games` and one game.

## 4. The pull request

Push `redesign/monument` and open a pull request against `main` with:

* **Summary:** what changed and why, in five lines.
* **The direction:** "The name as a monument", seed 54426271; the redraws and
  their reasons (type, by the owner; motion and the Proof blueprint, for
  missing assets; the first photograph, mirrored and dated).
* **Before and after of the copy:** the table in `content.md` §3.
* **Every `[CONFIRM]`:** the table in `README.md` §7, as a checklist. State
  plainly that the pull request must not merge until the blocking ones are
  ticked.
* **Pictures:** the photograph's title, author, licence and source, and where
  its credit sits on the page. The four product panels, and that their words
  come from Code.Socratic's public pages.
* **Gates:** each command and its result. The inspector's before and after
  counts (14 FAIL before).
* **What still falls short**, honestly.
* **Screenshots:** first screen and full page, desktop and phone.

End the description with the attribution line the session's instructions give.

## 5. Report to the owner

Briefly: the scores from the last critique round and what still falls short;
the `[CONFIRM]` list; the picture credit; anything a subagent reported that did
not match the plan; and that pull request #9 (the dead link) should merge
first or be closed in favour of this one.
