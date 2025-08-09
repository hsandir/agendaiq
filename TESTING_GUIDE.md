# 🧪 AgendaIQ Testing Guide

## 📋 Overview

AgendaIQ uses a comprehensive testing strategy to ensure reliability, security, and performance across all components.

## 🎯 Testing Philosophy

- **Test Coverage**: Minimum 80% coverage for all new code
- **Test Types**: Unit, Integration, E2E, Security, Performance
- **Continuous Testing**: Tests run on every commit and deployment
- **Test-Driven Development**: Write tests before or alongside code

## 🏗️ Test Infrastructure

### Test Frameworks
- **Jest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Supertest**: API testing
- **MSW**: Mock Service Worker for API mocking

### Directory Structure
```
tests/
├── e2e/                    # End-to-end tests
│   ├── auth.spec.ts       # Authentication flows
│   ├── dashboard.spec.ts  # Dashboard functionality
│   └── meetings.spec.ts   # Meeting management
├── integration/            # Integration tests
│   ├── auth-api.test.ts  # Auth API tests
│   └── database.test.ts  # Database operations
└── unit/                  # Unit tests
    ├── components/        # React component tests
    ├── utils/            # Utility function tests
    └── hooks/            # Custom hook tests

scripts/
├── test-auth.js          # Authentication testing script
├── run-tests.js          # Comprehensive test runner
└── test-database.js      # Database testing utilities
```

## 🚀 Running Tests

### Quick Commands
```bash
# Run all tests
npm run test:comprehensive

# Run specific test suites
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # E2E tests only
npm run test:security     # Security tests only

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run E2E with UI
npm run test:e2e:ui
```

### Manual Testing Script
```bash
# Test authentication system
node scripts/test-auth.js

# Run comprehensive test suite
node scripts/run-tests.js
```

## 🔐 Authentication Testing

### Current Issues & Solutions

#### Issue 1: Login Redirect Loop
**Problem**: After entering credentials, users are redirected back to signin page
**Status**: Under investigation
**Test**: `tests/e2e/auth.spec.ts` - "should handle signin flow"

#### Issue 2: CSS Alignment on Sign-in Page
**Problem**: Form elements not properly aligned
**Status**: Fixed with custom CSS
**Solution**: Added `signin.css` with proper styling

#### Issue 3: Create Account Page
**Problem**: First-time setup shows create account instead of using existing admins
**Status**: Database has users, check-first-user returns false correctly

### Valid Test Credentials
```javascript
// Development Admin
Email: admin@school.edu
Password: 1234

// School Admin
Email: sysadmin@cjcollegeprep.org
Password: Admin123!@#

// Dr. Namik Sercan (School Admin)
Email: nsercan@cjcollegeprep.org
Password: [Set in database]
```

## 📝 Test Categories

### 1. Unit Tests
Test individual components and functions in isolation.

```javascript
// Example: Component test
describe('SignInForm', () => {
  it('renders email and password fields', () => {
    render(<SignInForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    // Test implementation
  });
});
```

### 2. Integration Tests
Test API endpoints and database operations.

```javascript
// Example: API test
describe('POST /api/auth/signup', () => {
  it('creates new user with valid data', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'ValidPass123!'
      });
    expect(response.status).toBe(200);
  });
});
```

### 3. End-to-End Tests
Test complete user workflows.

```javascript
// Example: E2E test
test('complete authentication flow', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.fill('[name="email"]', 'admin@school.edu');
  await page.fill('[name="password"]', '1234');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

### 4. Security Tests
Test authentication, authorization, and security measures.

```javascript
// Example: Security test
test('prevents SQL injection', async () => {
  const maliciousInput = "'; DROP TABLE users; --";
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({
      email: maliciousInput,
      password: 'test'
    })
  });
  expect(response.status).toBe(400);
});
```

### 5. Performance Tests
Test loading times and response speeds.

```javascript
// Example: Performance test
test('dashboard loads within 3 seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto('/dashboard');
  const loadTime = Date.now() - start;
  expect(loadTime).toBeLessThan(3000);
});
```

## 🐛 Debugging Tests

### Common Issues

1. **Port 3000 Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

2. **Database Connection Issues**
```bash
# Check database status
npx prisma db push
npx prisma generate
```

3. **Test Timeouts**
```javascript
// Increase timeout for slow tests
test('slow operation', async () => {
  // test code
}, 30000); // 30 seconds
```

## 📊 Test Coverage

### Current Coverage Goals
- **Overall**: 80% minimum
- **Critical Paths**: 95% (auth, payments, data operations)
- **UI Components**: 70%
- **Utilities**: 90%

### Viewing Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## 🔄 Continuous Integration

### GitHub Actions Workflow
Tests run automatically on:
- Every push to main branch
- Every pull request
- Scheduled daily at 2 AM UTC

### Pre-commit Hooks
```bash
# Install hooks
npx husky install

# Hooks run:
- Linting
- Type checking
- Unit tests
```

## 📚 Best Practices

### Writing Good Tests
1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Independent Tests**: Tests should not depend on each other
4. **Mock External Services**: Use MSW for API mocking
5. **Clean Up**: Always clean up test data

### Test Data Management
```javascript
// Use factories for test data
const createTestUser = (overrides = {}) => ({
  email: `test.${Date.now()}@example.com`,
  password: 'TestPass123!',
  ...overrides
});
```

### Async Testing
```javascript
// Always handle async operations properly
test('async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

## 🚨 Emergency Procedures

### When Tests Fail in Production
1. **Rollback**: Immediately rollback to last known good version
2. **Investigate**: Check logs and error reports
3. **Fix**: Create hotfix branch and fix issue
4. **Test**: Run full test suite locally
5. **Deploy**: Deploy fix with monitoring

### Test Environment Reset
```bash
# Reset test database
npm run db:reset

# Clear test cache
npm run clean:cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

### Getting Help
- **Documentation**: Check this guide first
- **Team Chat**: Post in #testing channel
- **Issues**: Create GitHub issue with test label

### Reporting Test Issues
Include:
1. Test name and file
2. Error message
3. Steps to reproduce
4. Environment details
5. Screenshots if applicable

## 🎯 Testing Checklist

Before deploying:
- [ ] All tests pass locally
- [ ] Coverage meets minimum requirements
- [ ] No console errors in browser
- [ ] Authentication flows work
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Security tests pass
- [ ] Performance benchmarks met

## 📈 Metrics & Monitoring

### Key Metrics
- **Test Execution Time**: < 5 minutes for full suite
- **Flaky Test Rate**: < 1%
- **Coverage Trend**: Increasing or stable
- **Bug Escape Rate**: < 5%

### Monitoring Tools
- **Sentry**: Error tracking
- **Vercel Analytics**: Performance monitoring
- **GitHub Actions**: CI/CD metrics

---

*Last Updated: January 2025*
*Version: 1.0.0*