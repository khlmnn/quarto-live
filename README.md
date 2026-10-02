# Quarto Live

> **This is a fork** of [r-wasm/quarto-live](https://github.com/r-wasm/quarto-live) with
> changes for Pyodide 314 (PyTorch in the browser) and a fix for editor buttons. See
> [FORK.md](FORK.md) for what changed, how to install a release
> (`quarto add khlmnn/quarto-live@<tag>`), and how the fork follows upstream. The rest of
> this README is upstream's.

This extension embeds WebAssembly powered code blocks and exercises for both the R and Python languages into [Quarto](https://quarto.org) documents using HTML-based output formats. The [webR](https://docs.r-wasm.org/webr/latest/) and [Pyodide](https://pyodide.org/en/stable/) WebAssembly engines are used to dynamically execute code in the user's web browser, so only a static web service (such as [GitHub Pages](https://pages.github.com), [Quarto Pub](https://quartopub.com), or [Netlify](https://www.netlify.com)) is required.

The `quarto-live` extension focuses on providing:
 * Interactive R and Python code blocks.
 * Exercises with optional hints, solutions, and custom grading algorithms.
 * Rich client-side output such as interactive plots, images, and HTML widgets.
 * A customisable CodeMirror-based editor with automatic theming, syntax highlighting, autocomplete, code persistence, and autorun capabilities.
 * Integration with Quarto's OJS engine so that `quarto-live` code cells update reactively with `{ojs}` cells.

## Installation

To use the `quarto-live` extension in your own documents, run the following command in a terminal with a Quarto project as the working directory:

```
quarto add r-wasm/quarto-live
```

Once installed, the extension can be used with Quarto documents within this project.

## Basic Setup

Set the `live` custom format in your Quarto document's YAML header. For slides, use `format: live-revealjs`.

```yaml
---
format: live-html
---
```

The default rendering engine used by Quarto is `jupyter`, requiring a Python installation. If you’d prefer to avoid Python you can also explicitly select the `knitr` engine in the document’s YAML header:

```yaml
---
format: live-html
engine: knitr
---
```

Next, after the YAML header but before your content, include setup code for the `knitr` engine using a relative path:

```yaml
---
format: live-html
engine: knitr
---

{{< include ./_extensions/r-wasm/live/_knitr.qmd >}}
```

**NOTE:** Including `_knitr.qmd` is not strictly required if you are using the `jupyter` rendering engine. It is a temporary requirement for the `knitr` engine and will be removed in a future release of `quarto-live`.

## Usage

Add an interactive code block into your document using the `{webr}` (for R code) or `{pyodide}` (for Python code) code block types:

````yaml
---
title: A Quarto Live Document
engine: knitr
format: live-html
---

{{< include ./_extensions/r-wasm/live/_knitr.qmd >}}

```{webr}
fit = lm(mpg ~ am, data = mtcars)
summary(fit)
plot(fit)
```
````


## Documentation
Further documentation of how to use `quarto-live` in your documents to create rich interactive content can be found at:

https://r-wasm.github.io/quarto-live/

## Development build

To rebuild the Quarto Live runtime, first enter the `live-runtime` directory and setup your Node environment by installing the required packages with `npm`:

```
$ cd live-runtime
$ npm ci
```

Then, make the required changes to the TypeScript source files and run `npm run build` to rebuild the runtime:

```
$ npm run build

> live-runtime@0.1.2-dev build
> npx tsx build.ts


  ../_extensions/live/resources/live-runtime.js    581.1kb
  ../_extensions/live/resources/pyodide-worker.js   22.4kb
  ../_extensions/live/resources/live-runtime.css    18.0kb

⚡ Done in 44ms
```

Finally, re-render the `docs` directory to view your changes:

```
$ cd ../docs
$ quarto preview
```

### Watching for changes during development

A long running build process can be spawned that will watch for changes in the `live-runtime` directory and automatically rebuild on changes:

```
$ cd live-runtime
$ npm run watch
```

Note that a second terminal running `quarto preview` must also be spawned so that Quarto files are re-rendered when the runtime changes,
and in some cases forcing a Quarto re-render will be required by making a small change to a `.qmd` file in the `docs` directory.
