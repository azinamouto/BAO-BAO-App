# Contributing to BAO BAO

Thank you for your interest in contributing to the BAO BAO platform! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL or Supabase account
- Git

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/BAO-BAO-App.git
   cd BAO-BAO-App
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Code Style

- Follow existing code conventions in the codebase
- Use TypeScript for type safety
- Add JSDoc comments for public functions and classes
- Keep functions small and focused

### Testing

- Write tests for new features
- Run tests before committing:
  ```bash
  npm test
  ```
- Ensure all tests pass

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb in imperative mood (e.g., "Add", "Fix", "Update")
- Keep messages concise but informative
- Example: `docs: add JSDoc comments to user service`

### Branching

- Create a new branch for each feature or bug fix
- Use descriptive branch names (e.g., `feature/add-sms-parsing`, `fix/location-update`)
- Keep branches focused on a single change

## Project Structure

```
apps/
├── api/              # NestJS backend
└── web/              # React frontend
packages/
└── shared/           # Shared types and utilities
src/                  # Legacy frontend code
docs/                 # Project documentation
```

## Areas to Contribute

- Bug fixes
- New features
- Documentation improvements
- Performance optimizations
- Test coverage improvements

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the README if you've changed the structure or added new features
4. Create a pull request with a clear description of changes
5. Wait for code review feedback

## Questions?

Feel free to open an issue for questions or suggestions.
