# Contributing to Baseline Lens

Thank you for your interest in contributing to Baseline Lens! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- VS Code 1.74.0 or higher
- Git

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/kwesinavilot/baseline-lens.git
   cd baseline-lens
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development mode**
   ```bash
   npm run watch
   ```

4. **Open in VS Code**
   ```bash
   code .
   ```

5. **Launch extension**
   - Press `F5` to open a new Extension Development Host window
   - The extension will be loaded and ready for testing

### Project Structure

```
baseline-lens/
├── src/
│   ├── analyzers/          # File type analyzers (CSS, JS, HTML)
│   ├── core/              # Core analysis engine
│   ├── services/          # Extension services
│   ├── types/             # TypeScript type definitions
│   └── extension.ts       # Main extension entry point
├── docs/                  # Documentation
├── test/                  # Test files
└── package.json          # Extension manifest
```

## 🛠️ Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature description"
   ```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Testing

- **Unit Tests**: `npm test`
- **Linting**: `npm run lint`
- **Manual Testing**: Use the Extension Development Host

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions small and focused

## 🐛 Bug Reports

When reporting bugs, please include:

1. **VS Code version**
2. **Extension version**
3. **Operating system**
4. **Steps to reproduce**
5. **Expected behavior**
6. **Actual behavior**
7. **Sample code** (if applicable)
8. **Screenshots** (if helpful)

Use our [bug report template](https://github.com/kwesinavilot/baseline-lens/issues/new?template=bug_report.md).

## 💡 Feature Requests

For feature requests, please:

1. **Check existing issues** to avoid duplicates
2. **Describe the problem** you're trying to solve
3. **Propose a solution** with implementation details
4. **Consider alternatives** and their trade-offs
5. **Provide use cases** and examples

Use our [feature request template](https://github.com/kwesinavilot/baseline-lens/issues/new?template=feature_request.md).

## 📝 Documentation

### Types of Documentation

- **README.md** - Main project documentation
- **docs/** - Detailed guides and references
- **Code comments** - Inline documentation
- **CHANGELOG.md** - Version history

### Writing Guidelines

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up-to-date with code changes
- Follow markdown best practices

## 🔍 Code Review Process

1. **Submit a Pull Request**
   - Fill out the PR template completely
   - Link related issues
   - Add screenshots for UI changes

2. **Review Process**
   - Maintainers will review within 48 hours
   - Address feedback promptly
   - Keep discussions constructive

3. **Merge Requirements**
   - All tests must pass
   - Code must be reviewed and approved
   - Documentation must be updated
   - No merge conflicts

## 🏗️ Architecture Guidelines

### Adding New Analyzers

When adding support for new file types:

1. Create analyzer in `src/analyzers/`
2. Implement the `Analyzer` interface
3. Add tests in `test/analyzers/`
4. Update configuration schema
5. Add documentation

### Performance Considerations

- Keep analysis under 100ms for typical files
- Use caching for expensive operations
- Implement incremental analysis where possible
- Monitor memory usage

### Error Handling

- Use graceful degradation
- Log errors appropriately
- Provide meaningful error messages
- Handle edge cases

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite
4. Create release PR
5. Tag release after merge
6. Publish to VS Code Marketplace

## 🤝 Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and constructive
- Focus on the issue, not the person
- Accept feedback gracefully
- Help others learn and grow

### Getting Help

- **GitHub Discussions** - General questions and ideas
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Check existing docs first

## 📋 Contribution Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests are added/updated and passing
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] PR template is filled out
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact is considered

## 🙏 Recognition

Contributors are recognized in:

- `CONTRIBUTORS.md` file
- Release notes
- GitHub contributors page

Thank you for helping make Baseline Lens better! 🎉