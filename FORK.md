# About this fork

`khlmnn/quarto-live` is a fork of [r-wasm/quarto-live](https://github.com/r-wasm/quarto-live)
with a few changes needed for LiU course sites, in particular running PyTorch in the
browser via the [`pyodide-pytorch`](https://github.com/mmtftr/pyodide-pytorch) wheel,
which requires **Pyodide 314.0.2**.

Install a release (recommended, so sites only change when you choose):

```bash
quarto add khlmnn/quarto-live@v0.2.0-dev.khlmnn.3
```

This installs into `_extensions/khlmnn/live/`. Pages use `format: live-html` as with
upstream. Pages **must** set the Pyodide engine URL (see change 1):

```yaml
pyodide:
  engine-url: https://cdn.jsdelivr.net/pyodide/v314.0.2/full/
```

Don't also install upstream (`r-wasm/quarto-live`) in the same project.

## Changes to upstream

The fork's changes are the commits in `git log upstream/main..main`. Currently:

1. **Pin `pyodide` to 314.0.2** (`live-runtime/package.json`, `package-lock.json`;
   upstream: `^0.28.1`). The Pyodide worker is compiled against the `pyodide` npm package
   and has to match the Pyodide generation it drives: 314.x changed the loading protocol
   (`pyodide.asm.js` no longer exists), so a worker built against 0.28 fails with
   "Importing a module script failed" when pointed at `engine-url: …/v314.0.2/full/`.
   Not suitable for upstream as is, because upstream's default engine URL (`live.lua`)
   is still 0.28.1, which this build in turn can't load.
2. **Editor buttons react only to Enter and Space** (`live-runtime/src/editor.ts`,
   `renderButton()`). Upstream sets `dom.onkeydown = spec.onclick`, so any key on a focused
   button triggers it, including bare modifiers: after clicking Run Code the button keeps
   focus, so pressing Cmd (e.g. for a shortcut) re-runs the cell, and on Start Over it
   resets the editor. Upstream bug; candidate for an upstream pull request.
3. **Fork documentation** (this file, a notice in `README.md`).
4. **Localisable texts** (`live-runtime/src/labels.ts`, `editor.ts`, `live.lua`,
   `templates/*-exercise.ojs`). Button texts and default captions come from a built-in
   set for the document language (`lang`; English and Swedish), and single texts can be
   overridden in the metadata:

   ```yaml
   live:
     labels:
       caption-python: Python
       run-above: Kör cellerna ovan
   ```

   Keys: `run-code`, `run-above`, `start-over`, `show-hint`, `next-hint`, `show-solution`,
   `caption-python`, `caption-r`, `caption-exercise`, `copy-code`, `copied`. `live.lua`
   passes the language and the overrides in `<script type="live-labels">`. A cell's own
   `caption` option still wins. Candidate for an upstream pull request.
5. **Run All Above** (`editor.ts`, `indicator.ts`, `evaluate-pyodide.ts`,
   `scripts/Python/capture.py`, icon `assets/fast-forward.svg`). A button left of Run Code
   runs, one after another, every editor above the cell that uses the same environment
   (so not exercises with their own), with the code currently in it. It stops at the first
   cell that raises an exception: `capture.py` now reports `error`, and the evaluator
   passes it to `Indicator.finished(failed)`. The button is hidden on the first cell;
   `#| runabove: false` turns it off for a cell. Each run is the usual `input` event with
   `detail: {commit: true, runAbove: true}`, which ipok uses to not save these runs.
   R cells don't report errors yet, so for them it never stops early.
6. **Locking an editor** (`editor.ts`). A `CustomEvent("live-lock", {detail: {locked:
   true}})` on an editor's container makes the editor read-only (CodeMirror's `readOnly`
   and `editable` facets, in a compartment) and disables Run Code, Run All Above and Start
   Over (the latter now has the class `exercise-editor-btn-start-over`); Mod-Enter and
   other commits are ignored while locked. `locked: false` undoes it. Code can still be
   set programmatically. ipok locks the code cell of a solved question.
7. **Copy button** (`editor.ts`, `labels.ts`, `css/live-runtime.css`). Editors get the
   copy button of Quarto's static code blocks: Quarto's classes (`code-copy-outer-scaffold`
   on the editor body, `code-copy-button`), so it shows on hover and looks the same, and
   Quarto's feedback (check icon, tooltip). Quarto's OJS runtime adds `btn btn-quarto` to
   every button in OJS output, so the CSS resets Bootstrap's button variables on it, or it
   would be a large dark button. It copies the editor's current code with
   `navigator.clipboard`, falling back to Quarto's `ClipboardJS`; the click is kept from
   Quarto's own ClipboardJS handler, which expects a static block. `#| copybutton: false`
   turns it off for a cell. New label keys `copy-code`, `copied`.
8. **Release builds**: rebuilt `_extensions/live/resources/` and the fork's version in
   `_extensions/live/_extension.yml` (`0.2.0-dev.khlmnn.N`).

The base is upstream `main` at `12fb30a` (2026-06-08, two commits after `v0.2.0`).
Dependencies come from upstream's `package-lock.json`, changed only for `pyodide`.

## Building

Upstream commits the built files, and so does this fork. After changing anything in
`live-runtime/`:

```bash
cd live-runtime
npm ci
npm run build      # writes ../_extensions/live/resources/
```

Sanity checks on the build output:

```bash
grep -c "pyodide.asm.js" _extensions/live/resources/pyodide-worker.js   # 0 (change 1)
grep -c "onkeydown=e.onclick" _extensions/live/resources/live-runtime.js   # 0 (change 2)
grep -c "exercise-editor-btn-run-above" _extensions/live/resources/live-runtime.js   # >0 (change 5)
grep -c "live-lock" _extensions/live/resources/live-runtime.js   # >0 (change 6)
grep -c "exercise-editor-btn-copy" _extensions/live/resources/live-runtime.js   # >0 (change 7)
```

## Releasing

1. Build (above) and commit the changed `_extensions/live/resources/`.
2. Bump `version` in `_extensions/live/_extension.yml` (`0.2.0-dev.khlmnn.N`; change the
   `0.2.0-dev` part when the upstream base moves to a new release).
3. Tag `v<version>` and push the tag.
4. In each site: `quarto update extension khlmnn/quarto-live@v<version>`, commit.

## Following upstream

```bash
git fetch upstream
git merge upstream/main          # merge, don't rebase: main is published
```

Resolve conflicts in the changed files (for `package-lock.json`: take upstream's, then
`npm install --save-exact pyodide@314.0.2` in `live-runtime/`). Drop a change once
upstream contains it (change 2: upstream `renderButton()` no longer uses `onclick` as
`onkeydown`); change 1 can go once upstream moves to Pyodide 314.x itself. Then build,
run the checks below, and release.

## What to check after merging upstream

Course sites using the [`ipok` extension](https://github.com/khlmnn/quarto-ipok) depend
on undocumented quarto-live internals for saving code exercises; they are listed as
D1–D9 in its README ("What ipok relies on in quarto-live").

1. **Build sanity checks** (above).
2. **Read the upstream diff** of `_extensions/live/live.lua`, `templates/pyodide-*.ojs`,
   `live-runtime/src/editor.ts` and `live-runtime/src/evaluate-pyodide.ts` for anything
   touching D1–D7. Check whether `@codemirror/view` changed version in the lockfile (D7).
3. **Render** a site (e.g. [`liu-nlp/ete335-test`](https://github.com/liu-nlp/ete335-test))
   with the new build: no errors.
4. **PyTorch:** in ete335-test, run the cell in `spike-torch.qmd` (expect the torch
   version, a gradient and a matmul result), then all cells of
   `introduction-to-pytorch.qmd` top to bottom (no errors).
5. **Code exercises** in ete335-test's `code-test.qmd` (deployed site, signed in):
   - Run unchanged → saved with `code: null`; edit and run → code saved (D1–D4).
   - Output saved for stdout, stderr, error (`py-3`), expression value (`py-4`) and plot
     (`py-5`) (D5).
   - Reload → edited code back in the editor (D7); saved output shown before Pyodide has
     loaded, looking like a live run, and still there after it has loaded (D5, D6).
   - Run after reload → restored output replaced by real output, no duplicate.
   - Start Over → output cleared, saved as `code: null` without output (D2).
   - Focus Run Code (click it), then hold Cmd, press Shift, Cmd-C, a letter: nothing runs;
     Enter on the focused button still runs (change 2).
   - Run All Above on the last cell (after reload, signed in): the cells above run in
     order, their restored output is replaced, and nothing new is saved (change 5).
   - No `[ipok]` warnings in the console.
6. **Plain exercises** in ete335-test's `progress-test.qmd`: save, reload, data shown.
7. **Question code cells** in ete335's section 1.2 (`kapitel/1-korpusen/1-2-strangar`):
   - The cell sees nothing from the cells above, and a name defined in one run is gone in
     the next (D10); it has no Run All Above button.
   - Signed in: Run saves code and output in the question's record; reload restores them.
   - A right answer locks the cell: read-only, Run Code and Start Over disabled, Cmd-Enter
     does nothing; still locked after reload (D11, change 6).
