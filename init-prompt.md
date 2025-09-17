# 📝 Kiro Prompt: Baseline Lens

You are helping me build a **VS Code extension** called **Baseline Lens**.

---

## 🎯 Goal

Build a developer tool that integrates [Baseline data](https://web.dev/baseline/) into VS Code, giving real-time awareness of web feature support. Developers should know **instantly** if a CSS/JS/HTML feature is widely available, newly available, or limited support — without leaving their editor.

---

## 🔑 Core Features

1. **Feature Detection**

   * Parse CSS, JS, and HTML files.
   * Detect usage of modern web features (e.g. `:has()`, `structuredClone`, `<dialog>`).
   * Match against Baseline dataset (via `web-features` npm package).

2. **Inline Feedback**

   * Highlight lines with color-coded cues:

     * ✅ Widely available
     * ⚠ Newly available
     * 🚫 Limited support
   * Show tooltips with extra info + link to MDN.

3. **Diagnostics**

   * Add entries to the VS Code *Problems* panel.
   * Show summary of unsupported features.

4. **Report Command**

   * `Baseline: Generate Report` → outputs JSON/summary of all features + statuses in the workspace.

---

## 🛠 Tech Stack

* **Language:** TypeScript
* **Platform:** VS Code Extension API
* **Parsing Libraries:**

  * CSS → `postcss`
  * JS → `acorn` (or `esprima`)
  * HTML → `parse5`
* **Baseline Data:** `web-features` npm package

---

## 📂 Project Structure

```
baseline-lens/
 ├── package.json          # Extension manifest
 ├── src/
 │   ├── extension.ts      # Entry point
 │   ├── analyzers/
 │   │    ├── cssAnalyzer.ts
 │   │    ├── jsAnalyzer.ts
 │   │    ├── htmlAnalyzer.ts
 │   ├── baselineData.ts   # Wrapper for Baseline dataset
 │   ├── diagnostics.ts    # Handles Problems panel
 │   └── decorators.ts     # Inline highlights & tooltips
 ├── assets/               # Icons (✅ ⚠ 🚫)
 └── README.md
```

---

## ✅ First Tasks for You

1. Scaffold a VS Code extension project in TypeScript.
2. Add activation events for `html`, `css`, `javascript`.
3. Implement `baselineData.ts` to load and query `web-features`.
4. Implement a simple analyzer that scans CSS files for features and highlights them with inline messages.

---

## 📌 Notes

* Keep code modular — each analyzer in its own file.
* Use `DiagnosticCollection` for problems + `DecorationOptions` for inline cues.
* Add stubs for JS + HTML analyzers (to be filled later).
* Ensure code runs with `npm run compile` and can be tested in VS Code with `F5`.