#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Release preparation script for Baseline Lens
 * 
 * This script:
 * 1. Validates the current state
 * 2. Runs tests and linting
 * 3. Updates version numbers
 * 4. Generates changelog entry
 * 5. Creates package
 */

const packagePath = path.join(__dirname, '..', 'package.json');
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

function log(message) {
  console.log(`[RELEASE] ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}

function runCommand(command, description) {
  log(description);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (err) {
    error(`Failed to ${description.toLowerCase()}: ${err.message}`);
  }
}

function validateGitState() {
  log('Validating git state...');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      error('Working directory is not clean. Please commit or stash changes.');
    }
  } catch (err) {
    error('Failed to check git status');
  }
  
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (branch !== 'main' && branch !== 'master') {
      log(`Warning: Not on main/master branch (current: ${branch})`);
    }
  } catch (err) {
    log('Warning: Could not determine current branch');
  }
}

function validatePackageJson() {
  log('Validating package.json...');
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const required = ['name', 'displayName', 'description', 'version', 'publisher'];
  for (const field of required) {
    if (!pkg[field]) {
      error(`Missing required field in package.json: ${field}`);
    }
  }
  
  if (!pkg.engines || !pkg.engines.vscode) {
    error('Missing vscode engine requirement in package.json');
  }
  
  log(`Current version: ${pkg.version}`);
  return pkg;
}

function runTests() {
  log('Running tests and linting...');
  
  runCommand('npm run lint', 'Running ESLint');
  runCommand('npm test', 'Running tests');
  runCommand('npm run compile', 'Compiling TypeScript');
}

function createPackage() {
  log('Creating VSIX package...');
  
  try {
    // Check if vsce is available
    execSync('npx vsce --version', { stdio: 'pipe' });
  } catch (err) {
    log('Installing vsce...');
    runCommand('npm install -g vsce', 'Installing vsce');
  }
  
  runCommand('npx vsce package', 'Creating VSIX package');
}

function updateChangelog(version) {
  log('Updating CHANGELOG.md...');
  
  const date = new Date().toISOString().split('T')[0];
  const changelogEntry = `
## [${version}] - ${date}

### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 

`;

  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const lines = changelog.split('\n');
    
    // Find the first ## heading after the title
    let insertIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## [') || lines[i].startsWith('## Unreleased')) {
        insertIndex = i;
        break;
      }
    }
    
    if (insertIndex === -1) {
      // No existing entries, add after title
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
          insertIndex = i + 2;
          break;
        }
      }
    }
    
    if (insertIndex !== -1) {
      lines.splice(insertIndex, 0, ...changelogEntry.trim().split('\n'));
      fs.writeFileSync(changelogPath, lines.join('\n'));
      log('Added changelog entry (please update with actual changes)');
    }
  } else {
    const newChangelog = `# Changelog

All notable changes to the Baseline Lens extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
${changelogEntry}`;
    
    fs.writeFileSync(changelogPath, newChangelog);
    log('Created new CHANGELOG.md');
  }
}

function main() {
  log('Starting release preparation...');
  
  validateGitState();
  const pkg = validatePackageJson();
  runTests();
  updateChangelog(pkg.version);
  createPackage();
  
  log('Release preparation complete!');
  log('');
  log('Next steps:');
  log('1. Review and update CHANGELOG.md with actual changes');
  log('2. Commit any changes: git add . && git commit -m "Prepare release v' + pkg.version + '"');
  log('3. Create git tag: git tag v' + pkg.version);
  log('4. Push changes: git push && git push --tags');
  log('5. Publish to marketplace: npm run vsce:publish');
  log('');
  log(`Package created: baseline-lens-${pkg.version}.vsix`);
}

if (require.main === module) {
  main();
}

module.exports = { validateGitState, validatePackageJson, runTests, createPackage };