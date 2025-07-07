# Development Rules & Best Practices

## 1. Foundational Principles & Workflow

These practices are the bedrock of a healthy and secure project.

### Version Control
- Use Git for all code
- Adhere to a clear branching strategy (like GitFlow)
- Use standardized commit message formats to keep history readable

### Security & Configuration
- **Never Commit Secrets**: Use `.gitignore` to block all sensitive files
  - Environment files (`.env`)
  - Local settings
  - API keys, passwords, or credentials
- **Centralized Configuration**: Manage all config values through environment variables
  - Database URLs, API keys, Kinde credentials
  - Provide `.env.example` with placeholder values
  - Never hard-code sensitive values

### Code Quality & Automation
- **Automated Code Quality**: Enforce consistent code style
  - Python: Black (formatter), Flake8 (linter)
  - TypeScript/React: Prettier (formatter), ESLint (linter)
- **Pre-commit Hooks**: Automate quality checks before commits
- **Consistent Environments**: Use Docker for development, testing, and production

## 2. Backend Best Practices (Django)

Your backend is your primary security gatekeeper.

### User Model Strategy
- Start with a Custom User Model for future flexibility
- **With Kinde Integration**:
  - Model should NOT store passwords
  - Primary role: hold unique user ID from Kinde
  - Essential for database relationships (e.g., user-created content)

### Security Fundamentals
- **Security Logic is Backend Logic**: Backend is single source of truth
- **Never trust frontend data**
- **Token Validation**: Critical security job
  - Validate authentication tokens on every protected request
  - Cryptographically check token signatures against Kinde's public keys
  - Verify token claims (issuer, audience, expiration)

### User Provisioning
- **Just-In-Time User Provisioning**: Auto-create local user records
  - Triggered when valid token received for non-existent user
  - Use information from token to create user record

### API Security
- **Permissions**: Use robust permission system (Django Rest Framework)
  - Control access to every API endpoint
  - Default to deny-by-default
- **Data Validation**: Use serializers for strict data shape definition
  - Primary defense against malformed requests
- **SQL Injection Prevention**: Use Django ORM exclusively
  - Automatic input sanitization
  - Avoid raw SQL queries
- **Lean Logic**: Keep API views thin
  - Focus on HTTP request/response cycle
  - Move complex business logic to service layers or model methods

## 3. Frontend Best Practices (React & TypeScript)

The frontend is responsible for user experience and secure backend interaction.

### TypeScript Safety
- Enable TypeScript strict mode
- Define explicit types and interfaces for:
  - Component properties (props)
  - State management
  - API response data
- Prevents common bugs and improves code quality

### Authentication
- **Use Official Kinde React SDK**: Complete reliance for all auth tasks
  - Login, logout, registration, token handling
  - Handles OAuth2/OIDC flow securely
- **Secure Token Handling**: Let Kinde SDK manage token storage
  - No manual localStorage usage
  - SDK handles secure storage automatically

### API Communication
- **Central Interceptor**: Configure data-fetching library (Axios/Fetch)
  - Automatically get latest auth token from Kinde SDK
  - Attach to Authorization header for all backend requests

### Security & Component Design
- **XSS Prevention**: React provides default protection
  - Never use `dangerouslySetInnerHTML` without backend sanitization
- **Component Design**: Build small, reusable components
  - Single responsibility principle
  - Extract shared logic into custom hooks
  - Easier testing and maintenance

## 4. Styling Best Practices (Tailwind CSS)

Maintainable styling is key to long-term project health.

### Design System
- **Centralize Design System**: Define visual identity in `tailwind.config.js`
  - Colors, fonts, spacing, etc.
  - Avoid arbitrary one-off values
- **Style with Components**: Create reusable React components
  - Encapsulate Tailwind utility classes
  - Example: `<Button>` component instead of repeated classes

### Production Optimization
- **CSS Purging**: Configure build process to remove unused CSS classes
  - Critical for lightweight, fast applications
  - Scan all files for class usage

## 5. Dependency & Tooling Management

A secure application is built on secure and stable dependencies.

### Lock Files
- **Always commit lock files**:
  - Python: `requirements.txt`/`poetry.lock`
  - Node.js: `package-lock.json`/`yarn.lock`
- Ensures consistent dependency versions across environments

### Security Monitoring
- **Automate Vulnerability Scanning**: Integrate security scanners
  - GitHub Dependabot or Snyk
  - Continuous monitoring of dependencies
  - Automatic alerts for vulnerabilities
- **Regular Updates**: Schedule dependency reviews
  - Update to latest stable versions
  - Benefit from security patches and bug fixes

## 6. Holistic Security & Testing Strategy

### Defense in Depth
- **HTTPS Enforcement**: Production must use HTTPS without exception
- **CORS Policy**: Restrictive Cross-Origin Resource Sharing
  - Production: only allow specific frontend domain
- **Rate Limiting**: Protect API from abuse and DoS attacks
  - Implement on sensitive or expensive endpoints

### Testing Philosophy
A comprehensive testing suite is a security feature.

#### Backend Testing
- **Unit Tests**: Business logic testing
- **Integration Tests**: Real API endpoint requests
  - Verify permissions and data validation
  - Test complete request/response cycles

#### Frontend Testing
- **Unit Tests**: Individual components and custom hooks
- **Mock Kinde SDK**: Test authenticated and unauthenticated states
- **Component Behavior**: Verify UI responses to different states

#### End-to-End Testing
- **E2E Tests**: Use Cypress or Playwright
- **Complete User Journeys**: Simulate real browser interactions
- **Full Authentication Flow**: Login via Kinde and API interaction
- **Highest Confidence Level**: Real-world scenario testing
