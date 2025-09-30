# Publishing Guide for Baseline Lens

This guide covers the process of packaging and publishing the Baseline Lens extension to the VS Code Marketplace.

## Prerequisites

### Required Tools

1. **Node.js 18+**: For building and packaging
2. **vsce**: VS Code Extension Manager
   ```bash
   npm install -g vsce
   ```
3. **Git**: For version control and tagging

### Required Accounts

1. **Azure DevOps Account**: For VS Code Marketplace publishing
2. **Personal Access Token (PAT)**: With Marketplace publishing permissions
3. **GitHub Account**: For repository and release management

## Setup

### 1. Install vsce

```bash
npm install -g vsce
```

### 2. Create Personal Access Token

1. Go to [Azure DevOps](https://dev.azure.com)
2. Click on your profile → Personal Access Tokens
3. Create new token with:
   - **Name**: "VS Code Marketplace Publishing"
   - **Organization**: All accessible organizations
   - **Scopes**: Custom defined → Marketplace → Manage

### 3. Login to vsce

```bash
vsce login <publisher-name>
```

Enter your PAT when prompted.

## Development Workflow

### 1. Version Management

Update version in `package.json`:

```json
{
  "version": "1.2.3"
}
```

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### 2. Pre-Release Checklist

- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Code compiles: `npm run compile`
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json

### 3. Automated Preparation

Use the preparation script:

```bash
node scripts/prepare-release.js
```

This script:
- Validates git state
- Runs tests and linting
- Updates changelog
- Creates VSIX package

## Manual Publishing

### 1. Package Extension

```bash
# Create VSIX package
vsce package

# Verify package contents
vsce ls
```

### 2. Test Package Locally

```bash
# Install locally for testing
code --install-extension baseline-lens-1.2.3.vsix

# Test functionality
# Uninstall when done
code --uninstall-extension baseline-lens.baseline-lens
```

### 3. Publish to Marketplace

```bash
# Publish current version
vsce publish

# Or publish with version bump
vsce publish minor  # 1.2.3 → 1.3.0
vsce publish major  # 1.2.3 → 2.0.0
vsce publish patch  # 1.2.3 → 1.2.4

# Publish specific version
vsce publish 1.2.4
```

### 4. Create GitHub Release

```bash
# Create and push git tag
git tag v1.2.3
git push origin v1.2.3

# Create GitHub release (manual or automated)
```

## Automated Publishing

### GitHub Actions Workflow

The repository includes automated publishing via GitHub Actions:

1. **Trigger**: Push git tag starting with `v` (e.g., `v1.2.3`)
2. **Process**:
   - Run tests and linting
   - Package extension
   - Publish to VS Code Marketplace
   - Create GitHub release

### Setup Secrets

Add these secrets to your GitHub repository:

1. **VSCE_PAT**: Your Azure DevOps Personal Access Token
2. **GITHUB_TOKEN**: Automatically provided by GitHub Actions

### Trigger Release

```bash
# Create and push tag
git tag v1.2.3
git push origin v1.2.3

# GitHub Actions will automatically:
# - Test the code
# - Package the extension
# - Publish to marketplace
# - Create GitHub release
```

## Package Configuration

### Essential Files

Ensure these files are properly configured:

#### package.json
```json
{
  "name": "baseline-lens",
  "displayName": "Baseline Lens",
  "description": "Real-time web feature compatibility checking",
  "publisher": "baseline-lens",
  "version": "1.2.3",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["Linters", "Programming Languages"],
  "keywords": ["baseline", "compatibility", "web-features"],
  "repository": {
    "type": "git",
    "url": "https://github.com/baseline-lens/baseline-lens.git"
  },
  "bugs": {
    "url": "https://github.com/baseline-lens/baseline-lens/issues"
  },
  "homepage": "https://github.com/baseline-lens/baseline-lens#readme",
  "license": "MIT"
}
```

#### .vscodeignore
```
# Exclude development files
src/**
test/**
node_modules/**
.vscode/**
*.ts
*.map
```

### Marketplace Assets

#### README.md
- Clear description and features
- Installation instructions
- Usage examples
- Screenshots/GIFs
- Configuration options

#### CHANGELOG.md
- Version history
- Feature additions
- Bug fixes
- Breaking changes

## Quality Assurance

### Pre-Publication Testing

1. **Functionality Testing**
   - Test all major features
   - Verify configuration options
   - Check error handling

2. **Performance Testing**
   - Large file handling
   - Memory usage
   - Startup time

3. **Compatibility Testing**
   - Different VS Code versions
   - Various file types
   - Multiple operating systems

### Post-Publication Verification

1. **Marketplace Listing**
   - Verify extension appears in search
   - Check description and metadata
   - Confirm download/install works

2. **User Experience**
   - Install from marketplace
   - Test basic functionality
   - Verify documentation links

## Troubleshooting

### Common Issues

#### "Publisher not found"
```bash
# Verify publisher name
vsce show baseline-lens

# Create publisher if needed
vsce create-publisher baseline-lens
```

#### "Invalid Personal Access Token"
```bash
# Re-login with fresh token
vsce logout
vsce login baseline-lens
```

#### "Package validation failed"
```bash
# Check package contents
vsce ls

# Validate package.json
vsce package --allow-star-activation
```

#### "Version already exists"
```bash
# Bump version first
npm version patch
vsce publish
```

### Debug Package Contents

```bash
# List files that will be included
vsce ls

# Package with verbose output
vsce package --verbose

# Check .vscodeignore patterns
vsce package --show-ignored
```

## Best Practices

### Version Strategy

1. **Development**: Use pre-release versions (1.2.3-beta.1)
2. **Testing**: Use release candidates (1.2.3-rc.1)
3. **Production**: Use stable versions (1.2.3)

### Release Notes

1. **Clear descriptions**: What changed and why
2. **Migration guides**: For breaking changes
3. **Known issues**: Document limitations
4. **Credits**: Acknowledge contributors

### Marketplace Optimization

1. **Keywords**: Use relevant search terms
2. **Categories**: Choose appropriate categories
3. **Description**: Clear, concise, benefit-focused
4. **Screenshots**: Show extension in action
5. **README**: Comprehensive but scannable

## Rollback Procedures

### Unpublish Version

```bash
# Unpublish specific version (use carefully)
vsce unpublish baseline-lens@1.2.3

# Unpublish entire extension (emergency only)
vsce unpublish baseline-lens
```

### Emergency Fixes

1. **Critical Bug**: Unpublish, fix, republish quickly
2. **Security Issue**: Immediate unpublish, coordinate disclosure
3. **Breaking Change**: Revert to previous version, plan migration

## Monitoring

### Marketplace Analytics

1. **Download metrics**: Track adoption
2. **Rating/reviews**: Monitor user feedback
3. **Search ranking**: Optimize discoverability

### User Feedback

1. **GitHub Issues**: Bug reports and feature requests
2. **Marketplace Reviews**: User satisfaction
3. **Telemetry**: Usage patterns (if implemented)

---

## Quick Reference

### Common Commands

```bash
# Package extension
vsce package

# Publish extension
vsce publish

# Show extension info
vsce show baseline-lens

# List package contents
vsce ls

# Login/logout
vsce login baseline-lens
vsce logout
```

### Version Bumping

```bash
# Using npm
npm version patch  # 1.2.3 → 1.2.4
npm version minor  # 1.2.3 → 1.3.0
npm version major  # 1.2.3 → 2.0.0

# Using vsce
vsce publish patch
vsce publish minor
vsce publish major
```

For more information, see the [official vsce documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).