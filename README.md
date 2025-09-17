# 🌐 Baseline Lens

**Problem:**
Web developers constantly check MDN, CanIUse, and blog posts to know if a feature is safe to use in production. This wastes time and introduces risk.

**Solution:**
Baseline Lens integrates [Baseline](https://web.dev/baseline/) data directly into inside VS Code:

* Detects usage of modern web features (CSS, JS, HTML).
* Shows inline support status (✅ Widely available, ⚠ Newly available, 🚫 Limited support).
* Offers fallbacks, alternatives, and links to MDN.
* Can generate a project-wide compatibility report.

👉 In short: **Baseline Lens is to web feature compatibility what ESLint is to code quality.** Always there, always reliable, never in the way.

## 🌟 Value Proposition

* **Saves Time:** No more context-switching to MDN, CanIUse, or blog posts.
* **Reduces Bugs:** Catches risky features *before they reach production*.
* **Boosts Confidence:** Encourages adoption of modern features by clarifying their safety.
* **Team Alignment:** Ensures teams share a single source of truth about feature support.
* **Future-Ready:** Promotes gradual adoption of Baseline as the universal standard for web dev.

---

## 🔮 Vision

Baseline Lens isn’t just a linter or checker — it’s a **trust layer for modern web development**. Over time, it will expand to:
* **Other IDEs:** JetBrains, Cursor, Nova.
* **Browser DevTools:** Highlight risky features directly in the inspector.
* **AI Pairing:** Integrate with AI coding assistants (Amazon Q, Copilot, Cursor) to ensure suggestions are Baseline-safe.
* **Community Knowledge:** Crowdsource fallback recipes and best practices for non-Baseline features.

---

## 🚀 Mission

**Baseline Lens empowers web developers to adopt modern web features with confidence.**
By bringing **Baseline compatibility data directly into the coding workflow**, it eliminates guesswork, reduces context-switching, and ensures every line of code is production-ready for the widest range of users.

---

## 🎯 Goals

1. **Confidence First:** Give developers immediate clarity on whether a feature is safe to use.
2. **Seamless Integration:** Live inside VS Code without disrupting the natural flow of coding.
3. **Education Through Use:** Teach developers about new features in context, not through endless docs.
4. **Team Productivity:** Provide compatibility reports for teams to enforce standards in CI/CD pipelines.
5. **Future-Proofing:** Help projects adopt the newest Baseline features without fear of breaking compatibility.

---

## 👥 Who It Helps

* **Frontend Developers:** Writing CSS, JS, or HTML daily, unsure if a feature is safe across browsers.
* **Tech Leads & Architects:** Want to enforce standards for cross-browser compatibility.
* **Educators & Students:** Learning new features, need real-time feedback on what’s “safe to use now.”
* **Open-Source Maintainers:** Ensuring libraries/frameworks don’t rely on risky features.
* **Enterprise Teams:** Avoiding regressions when supporting diverse user bases.

---

## ✨ Core Features

1. **Real-Time Compatibility Checking**

   * Inline highlights (`✅`, `⚠`, `🚫`) showing if a feature is widely available, newly available, or limited.
   * Hover tooltips with browser/version breakdowns + MDN links.

2. **Feature-Aware Diagnostics**

   * All warnings/errors are logged in the VS Code *Problems* panel.
   * Quick links to docs, polyfills, or fallbacks.

3. **Project-Wide Reports**

   * Command: *“Generate Baseline Report”* → outputs JSON or Markdown summary of features used and their statuses.
   * Useful for PR reviews or compliance checks.

4. **CI/CD Integration**

   * Exportable config to integrate with GitHub Actions, GitLab CI, or other pipelines.
   * Fails builds if unsafe features are introduced.

5. **Smart Suggestions (Optional AI Assist)**

   * If a feature is risky, Baseline Lens suggests alternatives or fallback snippets.
   * E.g. `:has()` → suggest JavaScript querySelector fallback.

6. **Educational Hints**

   * Subtle onboarding: when you first type a new API, Baseline Lens explains what it is and why it’s safe/unsafe.

---

## ⚡ Workflow Integration

* **Inline First:** Developers see compatibility *where they code*, not in a browser tab.
* **No Disruption:** Works like ESLint/Prettier — quietly highlights issues, fix when ready.
* **Lightweight:** Runs locally, powered by `web-features` dataset. No heavy setup.
* **Cross-Project Awareness:** Works in React, Vue, Angular, Svelte, vanilla HTML/CSS/JS.

---

# 🛠 Tech Stack

* **Language:** TypeScript
* **Platform:** VS Code Extension API
* **Parsing:**

  * CSS → `postcss`
  * JS → `acorn` or `esprima`
  * HTML → `parse5`
* **Baseline Data:** `web-features` npm package
* **UI:** VS Code Diagnostic API + Decoration API

Optional:

* **Fallback Suggestions:** Hardcoded mappings or AI (OpenAI/Anthropic).
* **Reports:** JSON + VS Code command panel.

---

# 🎯 Hackathon Pitch

**Tagline:** *“Stop Googling ‘is it safe to use?’ — Baseline Lens brings compatibility awareness straight into your IDE.”*

**Why it’s strong for the hackathon:**

* Direct, real-world developer productivity boost.
* Innovative: no existing VS Code extension does this.
* Easy adoption (drop-in install).
* Open source, extensible beyond VS Code.