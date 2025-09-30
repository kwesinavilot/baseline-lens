# Baseline Lens - User Acceptance Testing (UAT) Guide

## Overview

This document defines User Acceptance Testing scenarios for the Baseline Lens VS Code extension. UAT validates that the extension meets business requirements and user expectations for web feature compatibility checking in real-world development workflows.

## UAT Prerequisites

### Environment Setup
- **VS Code Version**: 1.74.0 or higher
- **Extension Source**: VS Code marketplace or provided `.vsix` file
- **Test Project**: Web project with HTML, CSS, JavaScript files
- **Network**: Internet connection for external documentation links
- **Duration**: 60-90 minutes per complete UAT cycle

### Test Data Requirements
- Sample files containing modern web features across CSS, JavaScript, and HTML
- Large project (100+ files) for performance testing
- Malformed files for error handling validation

## UAT Test Scenarios

### UAT-001: Extension Installation and First-Time Onboarding

**Business Requirement**: New users must be able to install and understand the extension's purpose within 5 minutes

**Test Steps**:
1. Install Baseline Lens extension from VS Code marketplace
2. Restart VS Code if required
3. Verify automatic walkthrough launch
4. Complete all 6 walkthrough steps:
   - Step 1: Open a web file
   - Step 2: View compatibility indicators
   - Step 3: Check Problems panel
   - Step 4: Generate compatibility report
   - Step 5: Configure settings
   - Step 6: Explore advanced features
5. Verify walkthrough can be re-accessed via Command Palette

**Expected Results**:
- Extension installs without errors
- Walkthrough appears automatically within 3 seconds of first activation
- All walkthrough steps complete successfully when actions are performed
- User can navigate back to walkthrough using "Baseline Lens: Show Getting Started Guide"

**Acceptance Criteria**:
- ✅ PASS: All steps complete successfully
- ❌ FAIL: Any step fails to complete or walkthrough doesn't appear

**Priority**: Critical

### UAT-002: Real-Time Web Feature Detection and Visual Indicators

**Business Requirement**: Extension must detect modern web features and display compatibility status within 3 seconds of opening files

**Test Files to Create**:

**CSS Test File** (`test-styles.css`):
```css
/* Modern CSS features for testing */
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  container-type: inline-size;
}

.card:has(.featured) {
  border: 2px solid blue;
}

.responsive {
  width: clamp(200px, 50vw, 400px);
  aspect-ratio: 16/9;
}

@container (min-width: 300px) {
  .card { padding: 2rem; }
}
```

**JavaScript Test File** (`test-script.js`):
```javascript
// Modern JavaScript features for testing
const data = await fetch('/api/data');
const clonedData = structuredClone(data);

// Optional chaining and nullish coalescing
const value = user?.profile?.name ?? 'Anonymous';

// Private class fields
class MyClass {
  #privateField = 'secret';
  
  getPrivate() {
    return this.#privateField;
  }
}

// Top-level await
const config = await import('./config.js');
```

**HTML Test File** (`test-page.html`):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <dialog id="modal">
    <form method="dialog">
      <input type="color" name="theme">
      <input type="date" name="birthday">
      <button type="submit">Close</button>
    </form>
  </dialog>
  
  <details>
    <summary>More Info</summary>
    <p>Hidden content here</p>
  </details>
</body>
</html>
```

**Test Steps**:
1. Create test files with the provided sample code
2. Open CSS test file and verify indicators for:
   - `display: grid` (✅ widely available)
   - `:has()` selector (⚠️ newly available)
   - `@container` queries (🚫 limited availability)
3. Open JavaScript test file and verify indicators for:
   - `fetch()` API (✅ widely available)
   - `structuredClone()` (⚠️ newly available)
   - Private class fields (🚫 limited availability)
4. Open HTML test file and verify indicators for:
   - `<dialog>` element (⚠️ newly available)
   - `<details>` element (✅ widely available)
   - `type="color"` input (✅ widely available)
5. Measure time from file open to indicator appearance

**Expected Results**:
- All modern web features display appropriate compatibility indicators
- Indicators appear within 3 seconds of opening files
- Visual indicators don't interfere with code editing
- Different baseline statuses show distinct icons (✅, ⚠️, 🚫)

**Acceptance Criteria**:
- ✅ PASS: All features detected with correct indicators within time limit
- ❌ FAIL: Missing indicators, wrong status, or performance issues

**Priority**: Critical

### UAT-003: Hover Information and Educational Content

**Business Requirement**: Developers must access detailed compatibility information and educational content through hover tooltips

**Test Steps**:
1. Hover over `:has()` selector in CSS file
2. Verify hover tooltip contains:
   - Feature name and baseline status
   - Browser support breakdown table
   - Educational explanation of compatibility status
   - Links to MDN documentation
   - Recommendations for usage
3. Click on MDN documentation link
4. Hover over `structuredClone()` in JavaScript file
5. Verify different content for different baseline status
6. Test hover response time (should be < 500ms)
7. Verify hover content caching (second hover should be faster)

**Expected Results**:
- Hover tooltips appear within 500ms
- Content includes comprehensive browser support information
- External links open correctly in browser
- Educational content explains baseline status clearly
- Recommendations provided for limited availability features
- Hover content is properly formatted and readable

**Acceptance Criteria**:
- ✅ PASS: All hover content displays correctly with working links
- ❌ FAIL: Missing content, broken links, or performance issues

**Priority**: High

### UAT-004: Problems Panel Integration and Diagnostics

**Business Requirement**: Compatibility issues must be reported in VS Code Problems panel with appropriate severity levels and navigation

**Test Steps**:
1. Open test files containing compatibility issues
2. Open Problems panel using `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
3. Verify compatibility diagnostics appear in Problems panel
4. Check diagnostic information includes:
   - Feature name and file location
   - Compatibility status description
   - Appropriate severity level (Error/Warning/Info)
5. Click on each diagnostic entry
6. Verify navigation to correct code location
7. Modify code to add/remove features
8. Verify real-time updates in Problems panel
9. Test filtering by severity levels

**Expected Results**:
- All compatibility issues appear in Problems panel
- Diagnostic descriptions are clear and actionable
- Clicking diagnostics navigates to exact code location
- Severity levels match baseline status (Limited=Error, Newly=Warning, Widely=Info)
- Problems update automatically when code changes
- Filtering by severity works correctly

**Acceptance Criteria**:
- ✅ PASS: All diagnostics appear correctly with proper navigation and real-time updates
- ❌ FAIL: Missing diagnostics, incorrect navigation, or update issues

**Priority**: High

### UAT-005: Project-Wide Compatibility Reporting

**Business Requirement**: Teams must be able to generate comprehensive compatibility reports for project assessment and stakeholder communication

**User Story**: As a tech lead, I want to generate detailed compatibility reports for my entire project so that I can assess browser support risks and communicate findings to stakeholders and team members.

**Test Steps**:
1. Open a project with multiple web files (minimum 20 files with various modern features)
2. Open Command Palette using `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Execute "Baseline Lens: Generate Compatibility Report"
4. Select JSON format and review generated output
5. Generate report in Markdown format and review output
6. Test report generation on large project (100+ files)
7. Verify report accuracy by comparing with manual feature inspection
8. Test report generation time and progress indication

**Expected Results**:
- Command executes successfully without errors
- Progress indicator displays during report generation
- Report generation completes within 60 seconds for projects up to 100 files
- JSON report contains valid JSON structure with comprehensive data
- Markdown report is well-formatted and human-readable
- Report includes:
  - Executive summary with overall compatibility score
  - Feature breakdown by baseline status (widely/newly/limited available)
  - File-by-file analysis with specific issues
  - Risk assessment and actionable recommendations
- Generated reports can be saved and shared with team members

**Acceptance Criteria**:
- ✅ PASS: Reports generate successfully with accurate, comprehensive data
- ❌ FAIL: Generation errors, incomplete data, or excessive generation time

**Priority**: High

### UAT-006: Extension Configuration and Customization

**Business Requirement**: Development teams must be able to customize extension behavior to match their specific browser support requirements and project standards

**User Story**: As a web developer working on projects with specific browser support requirements, I want to configure Baseline Lens settings so that the extension aligns with my project's compatibility standards and team workflows.

**Test Steps**:
1. Open VS Code Settings using `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac)
2. Search for "Baseline Lens" in settings search
3. Locate and modify the following settings:
   - Change support threshold from default 95% to 90%
   - Modify diagnostic severity levels (Error/Warning/Info)
   - Add file exclusion patterns (e.g., `**/vendor/**`, `**/node_modules/**`)
   - Toggle inline indicator visibility on/off
   - Configure custom browser support matrix
4. Apply settings and verify immediate effect on open files
5. Test workspace-level settings override user-level settings
6. Reset settings to defaults and verify restoration
7. Export and import team configuration settings

**Expected Results**:
- "Baseline Lens" settings section is easily discoverable in VS Code Settings UI
- All settings include clear descriptions explaining their purpose and impact
- Support threshold changes (90%, 95%, 98%) immediately affect which features are flagged
- Diagnostic severity modifications change how issues appear in Problems panel
- File exclusion patterns prevent analysis of specified files and directories
- Inline indicator toggle immediately shows/hides visual indicators in code
- Custom browser matrix affects compatibility calculations and recommendations
- Settings changes take effect within 3 seconds without requiring VS Code restart
- Workspace settings properly override user settings
- Team configuration export/import works correctly

**Acceptance Criteria**:
- ✅ PASS: All configuration options work as expected with immediate effect
- ❌ FAIL: Settings don't apply, unclear descriptions, or configuration errors

**Priority**: High

### UAT-007: Performance and Responsiveness

**Business Requirement**: Extension must maintain VS Code performance standards and provide responsive user experience during all development workflows

**User Story**: As a web developer working on large projects with many files, I want Baseline Lens to analyze my code efficiently without impacting VS Code performance so that my development workflow remains smooth and productive.

**Test Steps**:
1. Measure VS Code startup time with and without extension enabled
2. Open large CSS file (>1000 lines) and measure analysis completion time
3. Open large JavaScript file (>1000 lines) and measure analysis completion time
4. Open project with 100+ web files and monitor overall performance
5. Type rapidly in files containing many modern web features
6. Switch between 10+ analyzed files rapidly
7. Monitor memory usage during extended 30-minute coding session
8. Test extension behavior with files containing syntax errors
9. Measure CPU usage during active analysis periods
10. Test extension disable/enable without VS Code restart

**Expected Results**:
- VS Code startup time increases by less than 2 seconds with extension enabled
- File analysis completes within 3 seconds for files up to 1000 lines
- Large files (>1000 lines) don't cause VS Code freezing or unresponsiveness
- Typing remains responsive with no noticeable input lag during analysis
- File switching between analyzed files completes within 1 second
- Memory usage remains stable during extended use (no memory leaks detected)
- Extension handles syntax errors gracefully without performance impact
- CPU usage remains reasonable during analysis (<15% sustained on modern hardware)
- No performance degradation after analyzing 100+ files in session
- Extension can be disabled/enabled dynamically without requiring restart

**Acceptance Criteria**:
- ✅ PASS: All performance benchmarks met with no user-noticeable impact
- ❌ FAIL: Performance degradation, unresponsiveness, or resource issues

**Priority**: Critical

### UAT-008: Smart Suggestions and Code Actions

**Business Requirement**: Extension must provide actionable suggestions and quick fixes for compatibility issues to help developers resolve problems efficiently

**User Story**: As a web developer encountering compatibility issues, I want to receive smart suggestions and automated quick fixes so that I can resolve problems efficiently without manual research and implementation.

**Test Steps**:
1. Use CSS features with limited compatibility (e.g., `:has()` selector, `@container` queries)
2. Use JavaScript features with limited compatibility (e.g., experimental APIs, newer syntax)
3. Right-click on flagged features or use `Ctrl+.` (Windows/Linux) or `Cmd+.` (Mac) for Quick Fix menu
4. Review suggested alternatives, polyfills, and fallback approaches
5. Apply code actions and verify generated code quality
6. Test suggestions for different baseline status levels
7. Verify polyfill recommendations include proper installation instructions
8. Test progressive enhancement pattern suggestions

**Expected Results**:
- Code actions appear in Quick Fix menu for features with compatibility concerns
- Suggestions are technically accurate and contextually relevant
- Polyfill suggestions include proper import statements or CDN links
- Alternative approaches are provided for limited availability features
- Code actions execute successfully and produce syntactically correct code
- Progressive enhancement patterns are suggested where appropriate
- Suggestions consider project context and existing dependencies

**Acceptance Criteria**:
- ✅ PASS: Relevant, accurate suggestions provided with working code actions
- ❌ FAIL: Missing suggestions, incorrect recommendations, or broken code actions

**Priority**: Medium

### UAT-009: Team Configuration and Workspace Settings

**Business Requirement**: Development teams must be able to share and maintain consistent configuration across all team members and projects

**User Story**: As a team lead, I want to define and share Baseline Lens configuration across my development team so that all developers follow consistent compatibility standards and see uniform analysis results.

**Test Steps**:
1. Configure extension settings at workspace level (.vscode/settings.json)
2. Export team configuration using "Baseline Lens: Export Team Config" command
3. Import configuration in different VS Code instance using "Import Team Config"
4. Verify workspace settings take precedence over user settings
5. Test configuration sharing via version control (commit .vscode/settings.json)
6. Validate consistent behavior across multiple team member setups
7. Test configuration validation and error handling for invalid settings
8. Verify team configuration includes all relevant extension settings

**Expected Results**:
- Workspace-level settings properly override user-level settings
- "Export Team Config" command generates comprehensive, shareable configuration file
- "Import Team Config" command applies settings correctly without conflicts
- Configuration files integrate seamlessly with version control workflows
- Team members see identical compatibility analysis results with shared config
- Settings validation prevents invalid configurations and provides helpful error messages
- Team configuration covers all essential extension settings for consistency

**Acceptance Criteria**:
- ✅ PASS: Seamless team configuration sharing with consistent results
- ❌ FAIL: Configuration conflicts, inconsistent behavior, or sharing failures

**Priority**: Medium

### UAT-010: Error Handling and Edge Cases

**Business Requirement**: Extension must handle all edge cases and error conditions gracefully without impacting VS Code stability or user workflow

**User Story**: As a web developer working with various file types and network conditions, I want Baseline Lens to handle errors and edge cases gracefully so that my development workflow is never interrupted by extension failures.

**Test Steps**:
1. Open malformed CSS files with syntax errors and invalid properties
2. Open malformed JavaScript files with syntax errors and invalid syntax
3. Open malformed HTML files with invalid markup and unclosed tags
4. Test with very large files (>10MB) to verify memory and performance handling
5. Test with binary files accidentally opened as text files
6. Disconnect internet connection and test core functionality
7. Test with files containing special characters and various text encodings
8. Force extension errors by corrupting configuration files
9. Test extension recovery after errors without VS Code restart
10. Verify error logging and user-friendly error messages

**Expected Results**:
- Malformed files don't crash the extension or cause VS Code instability
- Syntax errors don't prevent partial compatibility analysis of valid code sections
- Very large files are handled gracefully with appropriate timeout protection
- Binary files are detected and ignored without generating errors
- Core analysis functionality works offline without internet dependency
- Various text encodings and special characters are handled correctly
- Extension recovers automatically from configuration and runtime errors
- Error messages are user-friendly and provide actionable guidance
- Extension can be restarted independently without requiring VS Code restart
- Comprehensive error logging available for troubleshooting

**Acceptance Criteria**:
- ✅ PASS: Robust error handling with graceful degradation and recovery
- ❌ FAIL: Crashes, unrecoverable errors, or VS Code stability issues

**Priority**: Critical

## UAT Completion and Acceptance Criteria

### Overall UAT Success Requirements

For Baseline Lens to be accepted for production release, the following criteria must be met:

**Critical UAT Scenarios (Must Pass)**:
- UAT-001: Extension Installation and First-Time Onboarding - PASS
- UAT-002: Real-Time Web Feature Detection and Visual Indicators - PASS
- UAT-003: Hover Information and Educational Content - PASS
- UAT-004: Problems Panel Integration and Diagnostics - PASS
- UAT-007: Performance and Responsiveness - PASS
- UAT-010: Error Handling and Edge Cases - PASS

**High Priority UAT Scenarios (Should Pass)**:
- UAT-005: Project-Wide Compatibility Reporting - PASS
- UAT-006: Extension Configuration and Customization - PASS

**Medium Priority UAT Scenarios (May Pass with Conditions)**:
- UAT-008: Smart Suggestions and Code Actions - PASS/CONDITIONAL
- UAT-009: Team Configuration and Workspace Settings - PASS/CONDITIONAL

### Business Value Validation Metrics

**Primary Success Indicators**:
- ✅ Extension reduces compatibility checking time by >60%
- ✅ Users can identify and resolve compatibility issues without leaving VS Code
- ✅ Extension integrates seamlessly with existing development workflows
- ✅ New users become productive within 10 minutes of installation
- ✅ Extension maintains VS Code performance standards (no noticeable impact)

**User Acceptance Thresholds**:
- ✅ 95% of test users successfully complete critical UAT scenarios
- ✅ 90% of test users would recommend extension to colleagues
- ✅ 85% of test users prefer this solution over manual compatibility checking
- ✅ Average user satisfaction rating ≥ 8.5/10
- ✅ Zero critical bugs or crashes during UAT execution

## UAT Execution Documentation

### Test Session Template

**Session Information**:
- **Date**: _______________
- **Tester Name**: _______________
- **Tester Role**: Frontend Developer / Tech Lead / Full-Stack Developer / DevOps / Other: _______
- **Experience Level**: Junior (0-2 years) / Mid-Level (3-5 years) / Senior (6+ years)
- **Project Context**: Enterprise Application / Startup Product / Open Source / Personal Project
- **VS Code Version**: _______________
- **Extension Version**: _______________
- **Operating System**: Windows / macOS / Linux
- **Test Duration**: _______________

### UAT Scenario Results Matrix

| Scenario ID | Scenario Name | Status | Duration | Critical Issues | Notes |
|-------------|---------------|--------|----------|-----------------|-------|
| UAT-001 | Installation & Onboarding | PASS/FAIL | ___min | ______________ | _____ |
| UAT-002 | Feature Detection | PASS/FAIL | ___min | ______________ | _____ |
| UAT-003 | Hover Information | PASS/FAIL | ___min | ______________ | _____ |
| UAT-004 | Problems Panel | PASS/FAIL | ___min | ______________ | _____ |
| UAT-005 | Compatibility Reports | PASS/FAIL | ___min | ______________ | _____ |
| UAT-006 | Configuration | PASS/FAIL | ___min | ______________ | _____ |
| UAT-007 | Performance | PASS/FAIL | ___min | ______________ | _____ |
| UAT-008 | Smart Suggestions | PASS/FAIL | ___min | ______________ | _____ |
| UAT-009 | Team Configuration | PASS/FAIL | ___min | ______________ | _____ |
| UAT-010 | Error Handling | PASS/FAIL | ___min | ______________ | _____ |

### Final UAT Assessment

**Critical Requirements Met**: YES / NO / PARTIALLY

**Blocking Issues Identified**:
1. Issue: _________________________________ | Severity: Critical/High/Medium
2. Issue: _________________________________ | Severity: Critical/High/Medium
3. Issue: _________________________________ | Severity: Critical/High/Medium

**Business Value Achievement**:
- Time savings achieved: ___% reduction in compatibility checking time
- Workflow integration: Seamless / Good / Needs Improvement / Poor
- User satisfaction score: ___/10
- Recommendation likelihood: ___%

**Final Recommendation**:
- [ ] **ACCEPT FOR PRODUCTION** - All critical requirements met, extension ready for release
- [ ] **CONDITIONAL ACCEPT** - Minor issues identified, acceptable for release with planned fixes
- [ ] **REJECT** - Critical issues found, significant changes required before acceptance

**Additional Comments**:
_________________________________________________
_________________________________________________
_________________________________________________

**Tester Signature**: _______________  **Date**: _______________

**Business Stakeholder Approval**: _______________  **Date**: _______________

**Product Owner Approval**: _______________  **Date**: _______________

---

This comprehensive UAT guide ensures Baseline Lens meets all business requirements and user expectations before production deployment, providing structured validation of functionality, performance, and user experience across all critical workflows.