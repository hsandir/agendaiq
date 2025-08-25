/**
 * Enhanced type-safe test interfaces for AgendaIQ
 * Provides comprehensive typing for API, component, and integration tests
 */

import type { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { PrismaClient, users, staff, role, department, school, district } from '@prisma/client';
import type { ComponentType, ReactElement } from 'react';

// ============================================================================
// API Testing Types
// ============================================================================

export interface APITestContext {
  request: NextRequest;
  response: NextResponse;
  session: Session | null;
  prisma: PrismaClient;
  cleanup: () => Promise<void>
}

export interface APITestCase<TInput = unknown, TOutput = unknown> {
  name: string;
  description?: string;
  input: TInput;
  expectedOutput: TOutput;
  expectedStatus: number;
  expectedHeaders?: Record<string, string>;
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
  skip?: boolean;
  timeout?: number;
}

export interface APIRouteTestSuite<TInput = unknown, TOutput = unknown> {
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  authRequired: boolean;
  roleRequired?: string[];
  testCases: APITestCase<TInput, TOutput>[];
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

export interface APIErrorTestCase {
  name: string;
  input: unknown;
  expectedStatus: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;
  expectedError: string;
  expectedCode?: string;
}

export interface APISecurityTestSuite {
  route: string;
  authTests: APIErrorTestCase[];
  validationTests: APIErrorTestCase[];
  rateLimitTests: APIErrorTestCase[];
  sqlInjectionTests: APIErrorTestCase[];
  xssTests: APIErrorTestCase[];
}

// ============================================================================
// Component Testing Types
// ============================================================================

export interface ComponentTestProps<T = Record<string, unknown>> {
  props: T;
  expectedBehavior: {
    shouldRender: boolean;
    shouldHandleInteraction: boolean;
    shouldDisplayData: boolean;
    shouldBeAccessible: boolean;
    shouldHandleErrors: boolean;
    shouldHandleLoading: boolean
  };
  interactions?: ComponentInteraction[];
  accessibility?: AccessibilityTest[];
}

export interface ComponentInteraction {
  name: string;
  action: 'click' | 'type' | 'hover' | 'focus' | 'keydown' | 'submit';
  target: string; // selector or test-id
  input?: string;
  expectedResult: string | RegExp;
  timeout?: number;
}

export interface AccessibilityTest {
  name: string;
  rule: string;
  target?: string;
  expectedViolations: number
}

export interface ComponentTestSuite<T = Record<string, unknown>> {
  component: ComponentType<T>;
  name: string;
  defaultProps: T;
  variants: Array<{
    name: string;
    props: Partial<T>;
    expectedChanges: string[];
  }>;
  testCases: ComponentTestProps<T>[];
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

// ============================================================================
// Mock Types
// ============================================================================

export interface TypeSafeMock<T> {
  implementation: T;
  returnValue?: unknown;
  returnValueOnce?: unknown;
  resolvedValue?: unknown;
  rejectedValue?: unknown;
  calls: unknown[][];
  instances: unknown[];
  results: Array<{ type: 'return' | 'throw'; value: unknown }>;
}

export interface MockFactory<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
  createWithRelations(relations: Record<string, unknown>): T;
}

// ============================================================================
// Database Testing Types
// ============================================================================

export interface TestDataSeed {
  users: users[];
  staff: staff[];
  roles: role[];
  departments: department[];
  schools: school[];
  districts: district[];
}

export interface DatabaseTestContext {
  prisma: PrismaClient;
  seed: TestDataSeed;
  factory: TestFactory;
  transaction: <T>(fn: (tx: PrismaClient) => Promise<T>) => Promise<T>;
  cleanup: () => Promise<void>
}

export interface TestFactory {
  user: MockFactory<users>;
  staff: MockFactory<staff>;
  role: MockFactory<role>;
  department: MockFactory<department>;
  school: MockFactory<school>;
  district: MockFactory<district>
}

// ============================================================================
// Integration Testing Types
// ============================================================================

export interface IntegrationTestStep {
  name: string;
  action: () => Promise<unknown>;
  validation: (result: unknown) => Promise<boolean>;
  cleanup?: () => Promise<void>;
}

export interface IntegrationTestSuite {
  name: string;
  description: string;
  setup: () => Promise<void>;
  steps: IntegrationTestStep[];
  cleanup: () => Promise<void>;
  timeout?: number;
}

export interface E2ETestScenario {
  name: string;
  user: {
    email: string;
    password: string;
    role: string
  };
  steps: Array<{
    action: string;
    page: string;
    selector?: string;
    input?: string;
    expected: string | RegExp
  }>;
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

// ============================================================================
// Test Result Types
// ============================================================================

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  coverage?: number;
  errors: TestError[];
  warnings: TestWarning[];
  metadata: {
    file: string;
    suite: string;
    startTime: number;
    endTime: number
  };
}

export interface TestError {
  message: string;
  stack?: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface TestWarning {
  message: string;
  rule?: string;
  suggestion?: string;
}

export interface TestSuiteResult {
  suite: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number
  };
  results: TestResult[];
}

// ============================================================================
// Performance Testing Types
// ============================================================================

export interface PerformanceTestCase {
  name: string;
  target: string; // URL or function name
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: unknown;
  expectedDuration: number; // milliseconds
  expectedMemory?: number; // bytes
  iterations: number;
  concurrency?: number;
}

export interface PerformanceTestResult {
  name: string;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  p99Duration: number;
  memoryUsage: {
    min: number;
    max: number;
    average: number
  };
  iterations: number;
  passed: boolean
}

// ============================================================================
// Security Testing Types
// ============================================================================

export interface SecurityTestCase {
  name: string;
  type: 'auth' | 'injection' | 'xss' | 'csrf' | 'rate-limit' | 'privilege-escalation';
  target: string;
  payload: unknown;
  expectedBlock: boolean;
  expectedResponse?: number;
}

export interface SecurityTestResult {
  name: string;
  type: string;
  blocked: boolean;
  response: number;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  passed: boolean
}

// ============================================================================
// Test Configuration Types
// ============================================================================

export interface TestConfig {
  environment: 'test' | 'development' | 'staging';
  database: {
    url: string;
    reset: boolean;
    seed: boolean
  };
  coverage: {
    threshold: {
      global: {
        branches: number;
        functions: number;
        lines: number;
        statements: number
      };
    };
    reportFormat: string[];
  };
  timeout: {
    unit: number;
    integration: number;
    e2e: number
  };
  parallel: boolean;
  maxWorkers: number;
  verbose: boolean
}

// ============================================================================
// Utility Types
// ============================================================================

export type TestEnvironment = 'jsdom' | 'node';

export type MockType = 'jest' | 'vitest' | 'sinon';

export type TestRunner = 'jest' | 'vitest' | 'playwright';

export interface TestMetadata {
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  created_at: Date;
  updated_at: Date;
  dependencies: string[];
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationRule<T> {
  name: string;
  validator: (value: T) => boolean;
  message: string
}

export interface ValidationSchema<T> {
  rules: ValidationRule<T>[];
  required: (keyof T)[];
  optional: (keyof T)[];
}

// ============================================================================
// Error Handling Types
// ============================================================================

export interface TestErrorHandler {
  handle: (error: Error, context: TestContext) => Promise<void>;
  shouldRetry: (error: Error) => boolean;
  maxRetries: number
}

export interface TestContext {
  suite: string;
  test: string;
  environment: TestEnvironment;
  config: TestConfig;
  startTime: number
}

// ============================================================================
// All types are already exported as interfaces above
// No need for duplicate exports
// ============================================================================