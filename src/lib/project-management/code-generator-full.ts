/**
 * FULL CODE GENERATOR SYSTEM
 * Gelişmiş template'ler ve otomatik kod üretimi
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { RuleEngine } from './rule-engine-full';
import { DynamicRBAC } from '../security/dynamic-rbac-full';
import { AuthenticatedUser } from '../auth/auth-utils';

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  type: 'page' | 'component' | 'api' | 'hook' | 'util' | 'test' | 'schema';
  template: string;
  variables: TemplateVariable[];
  rules: string[]; // Rule IDs that this template satisfies
  category: string;
  framework: 'nextjs' | 'react' | 'node' | 'prisma' | 'generic';
  version: string;
  author: string;
  tags: string[];
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: any[];
  };
}

export interface GenerationContext {
  projectRoot: string;
  targetPath: string;
  templateId: string;
  variables: Record<string, any>;
  enforceRules: boolean;
  createBackup?: boolean;
  dryRun?: boolean;
  overwrite?: boolean;
}

export interface GenerationResult {
  success: boolean;
  generatedCode?: string;
  filePath?: string;
  templateUsed?: string;
  variablesUsed?: Record<string, any>;
  rulesApplied?: string[];
  error?: string;
  warnings?: string[];
  metadata?: {
    linesGenerated: number;
    filesCreated: number;
    dependenciesAdded: string[];
  };
}

export interface PageConfig {
  title: string;
  description: string;
  requiresAuth?: boolean;
  authLevel?: 'requireUser' | 'requireStaff' | 'requireAdmin' | 'adminOnly';
  layout?: string;
  useIcons?: boolean;
  icons?: string[];
  headerIcon?: string;
  iconColor?: string;
  hasActions?: boolean;
  actions?: Array<{
    label: string;
    variant?: string;
    icon?: string;
    href?: string;
    onClick?: string;
  }>;
  hasCards?: boolean;
  cards?: Array<{
    title: string;
    description?: string;
    content?: string;
  }>;
  seo?: {
    keywords?: string[];
    ogImage?: string;
  };
}

// ===== ENHANCED TEMPLATES =====

export const ENHANCED_CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: 'TEMPLATE-FULL-DASHBOARD-PAGE',
    name: 'Full Dashboard Page Template',
    description: 'Complete dashboard page with RBAC, error handling, and modern UI',
    type: 'page',
    template: `import { Metadata } from "next";
import { Suspense } from 'react';
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { DynamicRBAC } from '@/lib/security/dynamic-rbac-full';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
{{#if useIcons}}
import { {{iconImports}} } from 'react-icons/fi';
{{/if}}
{{#if useToast}}
import { useToast } from '@/components/ui/use-toast';
{{/if}}
{{#if hasForm}}
import { useState } from 'react';
{{/if}}

export const metadata: Metadata = {
  title: "{{pageTitle}}",
  description: "{{pageDescription}}",
  {{#if seo.keywords}}
  keywords: [{{#each seo.keywords}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
  {{/if}}
  {{#if seo.ogImage}}
  openGraph: {
    title: "{{pageTitle}}",
    description: "{{pageDescription}}",
    images: ["{{seo.ogImage}}"],
  },
  {{/if}}
};

{{#if requiresAuth}}
export default async function {{componentName}}() {
  // Enhanced authentication with full RBAC
  const user = await requireAuth(AuthPresets.{{authLevel}});
  const rbac = DynamicRBAC.getInstance();
  
  // Additional permission checks
  {{#if requiredPermissions}}
  {{#each requiredPermissions}}
  if (!(await rbac.hasPermission(user, '{{resource}}', '{{action}}'))) {
    throw new Error('Insufficient permissions: {{resource}}:{{action}}');
  }
  {{/each}}
  {{/if}}

  // Get user context
  const userStaff = await rbac.getUserStaff(user);
  const isAdmin = await rbac.isAdmin(user);
  const isLeadership = await rbac.isLeadership(user);
{{else}}
export default function {{componentName}}() {
{{/if}}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            {{#if headerIcon}}
            <{{headerIcon}} className="mr-3 text-{{iconColor}}-600" />
            {{/if}}
            {{pageTitle}}
          </h1>
          <p className="text-muted-foreground">{{pageDescription}}</p>
          {{#if showUserContext}}
          <div className="mt-2 flex gap-2">
            {{#if requiresAuth}}
            <Badge variant="outline">
              {userStaff.length > 0 ? userStaff[0].Role.title : 'No Role'}
            </Badge>
            {isAdmin && <Badge className="bg-red-100 text-red-800">Admin</Badge>}
            {isLeadership && <Badge className="bg-blue-100 text-blue-800">Leadership</Badge>}
            {{/if}}
          </div>
          {{/if}}
        </div>
        {{#if hasActions}}
        <div className="flex gap-2">
          {{#each actions}}
          <Button{{#if variant}} variant="{{variant}}"{{/if}}{{#if href}} asChild{{/if}}>
            {{#if href}}<a href="{{href}}">{{/if}}
            {{#if icon}}<{{icon}} className="mr-2 h-4 w-4" />{{/if}}
            {{label}}
            {{#if href}}</a>{{/if}}
          </Button>
          {{/each}}
        </div>
        {{/if}}
      </div>

      {{#if hasErrorBoundary}}
      {/* Error Boundary */}
      <Suspense fallback={<PageSkeleton />}>
        <ErrorBoundary>
          <PageContent {{#if requiresAuth}}user={user} userStaff={userStaff}{{/if}} />
        </ErrorBoundary>
      </Suspense>
      {{else}}
      {/* Content */}
      <PageContent {{#if requiresAuth}}user={user} userStaff={userStaff}{{/if}} />
      {{/if}}
    </div>
  );
}

{{#if hasErrorBoundary}}
// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Something went wrong. Please refresh the page or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

// Loading Skeleton
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
{{/if}}

// Main Page Content
function PageContent({{#if requiresAuth}}{ user, userStaff }: { user: any; userStaff: any[] }{{/if}}) {
  {{#if hasForm}}
  const [loading, setLoading] = useState(false);
  {{/if}}
  {{#if useToast}}
  const { toast } = useToast();
  {{/if}}

  return (
    <div className="grid gap-6">
      {{#if hasCards}}
      {{#each cards}}
      <Card>
        <CardHeader>
          <CardTitle>{{title}}</CardTitle>
          {{#if description}}<CardDescription>{{description}}</CardDescription>{{/if}}
        </CardHeader>
        <CardContent>
          {{#if content}}
          {{{content}}}
          {{else}}
          <p className="text-muted-foreground">
            Content for {{title}} goes here. Implement based on requirements.
          </p>
          {{/if}}
        </CardContent>
      </Card>
      {{/each}}
      {{else}}
      <Card>
        <CardHeader>
          <CardTitle>{{pageTitle}}</CardTitle>
          <CardDescription>{{pageDescription}}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Page content goes here. Implement based on requirements.
          </p>
          {{#if requiresAuth}}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">User Context</h4>
            <pre className="text-sm">
              {JSON.stringify({ user: user.email, staff: userStaff.length }, null, 2)}
            </pre>
          </div>
          {{/if}}
        </CardContent>
      </Card>
      {{/if}}
    </div>
  );
}`,
    variables: [
      { name: 'componentName', type: 'string', description: 'Component name (PascalCase)', required: true },
      { name: 'pageTitle', type: 'string', description: 'Page title', required: true },
      { name: 'pageDescription', type: 'string', description: 'Page description', required: true },
      { name: 'requiresAuth', type: 'boolean', description: 'Requires authentication', required: false, defaultValue: true },
      { name: 'authLevel', type: 'string', description: 'Auth level preset', required: false, defaultValue: 'requireStaff' },
      { name: 'useIcons', type: 'boolean', description: 'Include icon imports', required: false, defaultValue: true },
      { name: 'iconImports', type: 'array', description: 'Icon names to import', required: false, defaultValue: ['FiSettings'] },
      { name: 'headerIcon', type: 'string', description: 'Header icon component', required: false, defaultValue: 'FiSettings' },
      { name: 'iconColor', type: 'string', description: 'Icon color', required: false, defaultValue: 'blue' },
      { name: 'hasActions', type: 'boolean', description: 'Include action buttons', required: false, defaultValue: false },
      { name: 'actions', type: 'array', description: 'Action button configurations', required: false, defaultValue: [] },
      { name: 'hasCards', type: 'boolean', description: 'Include card layout', required: false, defaultValue: true },
      { name: 'cards', type: 'array', description: 'Card configurations', required: false, defaultValue: [] },
      { name: 'hasErrorBoundary', type: 'boolean', description: 'Include error boundary', required: false, defaultValue: true },
      { name: 'hasForm', type: 'boolean', description: 'Include form state', required: false, defaultValue: false },
      { name: 'useToast', type: 'boolean', description: 'Include toast notifications', required: false, defaultValue: false },
      { name: 'showUserContext', type: 'boolean', description: 'Show user context info', required: false, defaultValue: false },
      { name: 'requiredPermissions', type: 'array', description: 'Required permissions', required: false, defaultValue: [] },
      { name: 'seo', type: 'object', description: 'SEO configuration', required: false, defaultValue: {} }
    ],
    rules: ['RULE-002-DYNAMIC-RBAC-INTEGRATION', 'RULE-003-IMPORT-CONSISTENCY'],
    category: 'page',
    framework: 'nextjs',
    version: '1.0.0',
    author: 'AgendaIQ Code Generator',
    tags: ['dashboard', 'page', 'rbac', 'nextjs'],
    dependencies: ['@/lib/auth/auth-utils', '@/lib/security/dynamic-rbac-full'],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'TEMPLATE-FULL-API-ROUTE',
    name: 'Full API Route Template',
    description: 'Complete API route with authentication, validation, and error handling',
    type: 'api',
    template: `import { NextRequest, NextResponse } from "next/server";
import { APIAuthPatterns } from '@/lib/auth/api-auth';
import { AuthenticatedUser } from '@/lib/auth/auth-utils';
import { DynamicRBAC } from '@/lib/security/dynamic-rbac-full';
{{#if usePrisma}}
import { prisma } from '@/lib/prisma';
{{/if}}
{{#if useZod}}
import { z } from 'zod';
{{/if}}

{{#if useZod}}
// Validation schemas
{{#if hasBodyValidation}}
const {{pascalCase endpoint}}Schema = z.object({
  {{#each validationFields}}
  {{name}}: z.{{type}}(){{#if required}}{{else}}.optional(){{/if}}{{#if description}}.describe("{{description}}"){{/if}},
  {{/each}}
});
{{/if}}

{{#if hasParamsValidation}}
const ParamsSchema = z.object({
  {{#each paramFields}}
  {{name}}: z.{{type}}(){{#if description}}.describe("{{description}}"){{/if}},
  {{/each}}
});
{{/if}}
{{/if}}

{{#each httpMethods}}
// {{toUpperCase method}} {{../endpoint}}
export const {{toUpperCase method}} = APIAuthPatterns.{{../authPattern}}(async (request: NextRequest, user: AuthenticatedUser) => {
  const rbac = DynamicRBAC.getInstance();
  
  try {
    // Permission checks
    {{#if ../requiredPermissions}}
    {{#each ../requiredPermissions}}
    if (!(await rbac.hasPermission(user, '{{resource}}', '{{action}}'))) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions: {{resource}}:{{action}}', 
          code: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString()
        },
        { status: 403 }
      );
    }
    {{/each}}
    {{/if}}

    {{#if ../useZod}}
    {{#if ../hasParamsValidation}}
    // Validate path parameters
    const { searchParams } = new URL(request.url);
    const paramsResult = ParamsSchema.safeParse(Object.fromEntries(searchParams));
    
    if (!paramsResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          code: 'VALIDATION_ERROR',
          details: paramsResult.error.issues,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    const params = paramsResult.data;
    {{/if}}

    {{#if ../hasBodyValidation}}
    {{#if isPost isUpdate}}
    // Validate request body
    const bodyResult = {{../pascalCase ../endpoint}}Schema.safeParse(await request.json());
    
    if (!bodyResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          details: bodyResult.error.issues,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    const body = bodyResult.data;
    {{/if}}
    {{/if}}
    {{else}}
    {{#if ../hasBasicValidation}}
    {{#if isPost isUpdate}}
    // Basic input validation
    const body = await request.json();
    {{#each ../requiredFields}}
    if (!body.{{name}}) {
      return NextResponse.json(
        { 
          error: "{{name}} is required",
          code: 'MISSING_FIELD',
          field: '{{name}}',
          timestamp: new Date().toISOString()
        }, 
        { status: 400 }
      );
    }
    {{/each}}
    {{/if}}
    {{/if}}
    {{/if}}

    {{#if ../usePrisma}}
    // Database operations with enhanced error handling
    {{#if isCreate}}
    const result = await prisma.{{../modelName}}.create({
      data: {
        ...body,
        {{#if ../trackCreator}}
        createdBy: user.email,
        {{/if}}
        {{#if ../addStaffContext}}
        // Add staff context if available
        ...(await rbac.getPrimaryStaff(user) && {
          staffId: (await rbac.getPrimaryStaff(user))!.id,
          schoolId: (await rbac.getPrimaryStaff(user))!.school_id,
          departmentId: (await rbac.getPrimaryStaff(user))!.department_id,
        }),
        {{/if}}
      },
      include: {
        {{#each ../includeRelations}}
        {{name}}: {{#if nested}}{
          include: {
            {{#each fields}}
            {{name}}: true,
            {{/each}}
          }
        }{{else}}true{{/if}},
        {{/each}}
      }
    });
    {{else if isRead}}
    {{#if ../hasFiltering}}
    // Build filters based on user permissions and query params
    const filters: any = {};
    
    // Add permission-based filters
    const userStaff = await rbac.getUserStaff(user);
    if (userStaff.length > 0 && !(await rbac.isAdmin(user))) {
      // Restrict to user's context unless admin
      filters.OR = userStaff.map(staff => ({
        {{#if ../filterBySchool}}schoolId: staff.school_id,{{/if}}
        {{#if ../filterByDepartment}}departmentId: staff.department_id,{{/if}}
      }));
    }
    
    // Add query parameter filters
    const { searchParams } = new URL(request.url);
    {{#each ../filterFields}}
    if (searchParams.get('{{name}}')) {
      filters.{{name}} = {{#if isNumeric}}parseInt(searchParams.get('{{name}}')!){{else}}searchParams.get('{{name}}'){{/if}};
    }
    {{/each}}
    {{/if}}

    const result = await prisma.{{../modelName}}.findMany({
      {{#if ../hasFiltering}}where: filters,{{/if}}
      {{#if ../hasPagination}}
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0,
      take: Math.min(parseInt(searchParams.get('limit') || '50'), 100), // Max 100 items
      {{/if}}
      {{#if ../hasOrdering}}
      orderBy: {
        {{../defaultOrderField}}: searchParams.get('order') === 'asc' ? 'asc' : 'desc'
      },
      {{/if}}
      include: {
        {{#each ../includeRelations}}
        {{name}}: {{#if nested}}{
          include: {
            {{#each fields}}
            {{name}}: true,
            {{/each}}
          }
        }{{else}}true{{/if}},
        {{/each}}
      }
    });
    {{else if isUpdate}}
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { 
          error: "ID is required",
          code: 'MISSING_ID',
          timestamp: new Date().toISOString()
        }, 
        { status: 400 }
      );
    }

    // Check if record exists and user has permission to update it
    const existing = await prisma.{{../modelName}}.findUnique({
      where: { id: {{#if ../idIsNumeric}}parseInt(id){{else}}id{{/if}} },
      {{#if ../checkOwnership}}
      include: {
        {{#each ../ownershipRelations}}
        {{name}}: true,
        {{/each}}
      }
      {{/if}}
    });

    if (!existing) {
      return NextResponse.json(
        { 
          error: "Record not found",
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        }, 
        { status: 404 }
      );
    }

    {{#if ../checkOwnership}}
    // Check ownership or admin access
    const canUpdate = await rbac.isAdmin(user) || 
      {{#each ../ownershipChecks}}
      existing.{{field}} === {{value}} ||
      {{/each}}
      false;

    if (!canUpdate) {
      return NextResponse.json(
        { 
          error: "Not authorized to update this record",
          code: 'UNAUTHORIZED_UPDATE',
          timestamp: new Date().toISOString()
        }, 
        { status: 403 }
      );
    }
    {{/if}}

    const result = await prisma.{{../modelName}}.update({
      where: { id: {{#if ../idIsNumeric}}parseInt(id){{else}}id{{/if}} },
      data: {
        ...body,
        {{#if ../trackUpdater}}
        updatedBy: user.email,
        updatedAt: new Date(),
        {{/if}}
      },
      include: {
        {{#each ../includeRelations}}
        {{name}}: {{#if nested}}{
          include: {
            {{#each fields}}
            {{name}}: true,
            {{/each}}
          }
        }{{else}}true{{/if}},
        {{/each}}
      }
    });
    {{else if isDelete}}
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { 
          error: "ID is required",
          code: 'MISSING_ID',
          timestamp: new Date().toISOString()
        }, 
        { status: 400 }
      );
    }

    {{#if ../softDelete}}
    // Soft delete
    const result = await prisma.{{../modelName}}.update({
      where: { id: {{#if ../idIsNumeric}}parseInt(id){{else}}id{{/if}} },
      data: {
        deletedAt: new Date(),
        deletedBy: user.email,
      }
    });
    {{else}}
    // Hard delete
    await prisma.{{../modelName}}.delete({
      where: { id: {{#if ../idIsNumeric}}parseInt(id){{else}}id{{/if}} }
    });
    {{/if}}
    
    return NextResponse.json({ 
      message: "{{../modelName}} deleted successfully",
      {{#if ../softDelete}}result,{{/if}}
      timestamp: new Date().toISOString()
    });
    {{/if}}
    {{else}}
    // TODO: Implement {{method}} logic for {{../endpoint}}
    const result = { 
      message: "{{method}} endpoint implemented",
      endpoint: "{{../endpoint}}",
      user: user.email,
      timestamp: new Date().toISOString()
    };
    {{/if}}

    // Success response
    return NextResponse.json({
      ...result,
      {{#if ../addMeta}}
      _meta: {
        timestamp: new Date().toISOString(),
        user: user.email,
        method: "{{toUpperCase method}}",
        endpoint: "{{../endpoint}}"
      }
      {{/if}}
    });

  } catch (error) {
    console.error("Error in {{toUpperCase method}} {{../endpoint}}:", error);
    
    // Enhanced error response
    const errorResponse = {
      error: "Internal server error",
      code: "{{toUpperCase method}}_ERROR",
      timestamp: new Date().toISOString(),
      endpoint: "{{../endpoint}}",
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    };

    // Different status codes based on error type
    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('Invalid ID')) {
        statusCode = 404;
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        statusCode = 403;
      } else if (error.message.includes('validation') || error.message.includes('required')) {
        statusCode = 400;
      }
    }

    return NextResponse.json(errorResponse, { status: statusCode });
  }
});

{{/each}}`,
    variables: [
      { name: 'endpoint', type: 'string', description: 'API endpoint path', required: true },
      { name: 'authPattern', type: 'string', description: 'Auth pattern to use', required: true, defaultValue: 'staffOnly' },
      { name: 'httpMethods', type: 'array', description: 'HTTP methods to implement', required: true },
      { name: 'usePrisma', type: 'boolean', description: 'Use Prisma ORM', required: false, defaultValue: true },
      { name: 'useZod', type: 'boolean', description: 'Use Zod validation', required: false, defaultValue: true },
      { name: 'modelName', type: 'string', description: 'Prisma model name', required: false },
      { name: 'requiredPermissions', type: 'array', description: 'Required permissions', required: false, defaultValue: [] },
      { name: 'hasBodyValidation', type: 'boolean', description: 'Include body validation', required: false, defaultValue: false },
      { name: 'hasParamsValidation', type: 'boolean', description: 'Include params validation', required: false, defaultValue: false },
      { name: 'validationFields', type: 'array', description: 'Validation field definitions', required: false, defaultValue: [] },
      { name: 'paramFields', type: 'array', description: 'Parameter field definitions', required: false, defaultValue: [] },
      { name: 'includeRelations', type: 'array', description: 'Relations to include', required: false, defaultValue: [] },
      { name: 'trackCreator', type: 'boolean', description: 'Track who created record', required: false, defaultValue: true },
      { name: 'trackUpdater', type: 'boolean', description: 'Track who updated record', required: false, defaultValue: true },
      { name: 'addStaffContext', type: 'boolean', description: 'Add staff context to records', required: false, defaultValue: true },
      { name: 'hasFiltering', type: 'boolean', description: 'Support filtering', required: false, defaultValue: true },
      { name: 'hasPagination', type: 'boolean', description: 'Support pagination', required: false, defaultValue: true },
      { name: 'hasOrdering', type: 'boolean', description: 'Support ordering', required: false, defaultValue: true },
      { name: 'checkOwnership', type: 'boolean', description: 'Check record ownership', required: false, defaultValue: false },
      { name: 'softDelete', type: 'boolean', description: 'Use soft delete', required: false, defaultValue: false },
      { name: 'addMeta', type: 'boolean', description: 'Add metadata to responses', required: false, defaultValue: true }
    ],
    rules: ['RULE-004-API-AUTH-ENFORCEMENT', 'RULE-002-DYNAMIC-RBAC-INTEGRATION'],
    category: 'api',
    framework: 'nextjs',
    version: '1.0.0',
    author: 'AgendaIQ Code Generator',
    tags: ['api', 'route', 'auth', 'validation'],
    dependencies: ['@/lib/auth/api-auth', '@/lib/security/dynamic-rbac-full'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ===== FULL CODE GENERATOR CLASS =====

export class CodeGenerator {
  private static instance: CodeGenerator;
  private templates = new Map<string, CodeTemplate>();
  private ruleEngine: RuleEngine;
  private rbac: DynamicRBAC;
  
  static getInstance(): CodeGenerator {
    if (!CodeGenerator.instance) {
      CodeGenerator.instance = new CodeGenerator();
    }
    return CodeGenerator.instance;
  }

  constructor() {
    this.ruleEngine = RuleEngine.getInstance();
    this.rbac = DynamicRBAC.getInstance();
    this.loadEnhancedTemplates();
  }

  // Load enhanced templates
  private loadEnhancedTemplates(): void {
    ENHANCED_CODE_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Generate code from template with comprehensive validation
  async generateCode(context: GenerationContext, user?: AuthenticatedUser): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      // Check permissions
      if (user && !(await this.rbac.hasPermission(user, 'code_generation', 'execute'))) {
        throw new Error('Insufficient permissions to generate code');
      }

      const template = this.getTemplate(context.templateId);
      if (!template) {
        throw new Error(`Template ${context.templateId} not found`);
      }

      // Validate variables
      const validationResult = this.validateVariables(template, context.variables);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Variable validation failed: ${validationResult.errors.join(', ')}`,
          warnings: validationResult.warnings
        };
      }

      // Check if target file exists
      const targetExists = await this.fileExists(context.targetPath);
      if (targetExists && !context.overwrite && !context.dryRun) {
        return {
          success: false,
          error: `File already exists: ${context.targetPath}. Use overwrite option to replace.`
        };
      }

      // Create backup if needed
      if (targetExists && context.createBackup && !context.dryRun) {
        await this.createBackup(context.targetPath);
      }

      // Process template with enhanced features
      const processedCode = await this.processTemplateEnhanced(template.template, context.variables);
      
      // Dry run - return without writing
      if (context.dryRun) {
        return {
          success: true,
          generatedCode: processedCode,
          filePath: context.targetPath,
          templateUsed: template.id,
          variablesUsed: context.variables,
          metadata: {
            linesGenerated: processedCode.split('\n').length,
            filesCreated: 0,
            dependenciesAdded: template.dependencies || []
          }
        };
      }

      // Ensure target directory exists
      const targetDir = path.dirname(context.targetPath);
      await fs.mkdir(targetDir, { recursive: true });

      // Write file
      await fs.writeFile(context.targetPath, processedCode, 'utf-8');

      // Validate against rules if requested
      const rulesApplied: string[] = [];
      if (context.enforceRules && template.rules.length > 0) {
        for (const ruleId of template.rules) {
          try {
            const ruleResult = await this.ruleEngine.validateRule(ruleId, user);
            if (ruleResult.passed) {
              rulesApplied.push(ruleId);
            }
          } catch (error) {
            console.warn(`Error validating rule ${ruleId}:`, error);
          }
        }
      }

      // Post-processing: format code, add imports, etc.
      await this.postProcessFile(context.targetPath, template);

      const result: GenerationResult = {
        success: true,
        generatedCode: processedCode,
        filePath: context.targetPath,
        templateUsed: template.id,
        variablesUsed: context.variables,
        rulesApplied,
        metadata: {
          linesGenerated: processedCode.split('\n').length,
          filesCreated: 1,
          dependenciesAdded: template.dependencies || []
        }
      };

      console.log(`✅ Generated code: ${context.targetPath} using template ${template.name}`);
      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          linesGenerated: 0,
          filesCreated: 0,
          dependenciesAdded: []
        }
      };
    }
  }

  // Enhanced template processing with Handlebars-like features
  private async processTemplateEnhanced(template: string, variables: Record<string, any>): Promise<string> {
    let processed = template;

    // Process {{variable}} substitutions
    processed = processed.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });

    // Process {{#if condition}} blocks
    processed = processed.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      return variables[condition] ? content : '';
    });

    // Process {{#unless condition}} blocks
    processed = processed.replace(/\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, condition, content) => {
      return !variables[condition] ? content : '';
    });

    // Process {{#each array}} blocks
    processed = processed.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        let itemContent = content;
        
        // Replace {{this}} with current item
        if (typeof item === 'string') {
          itemContent = itemContent.replace(/\{\{this\}\}/g, item);
        } else if (typeof item === 'object') {
          // Replace {{property}} with item.property
          Object.keys(item).forEach(key => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            itemContent = itemContent.replace(regex, String(item[key]));
          });
        }
        
        // Replace {{@index}} and {{@last}}
        itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
        itemContent = itemContent.replace(/\{\{#unless @last\}\}/g, index < array.length - 1 ? '' : '{{#unless true}}');
        
        return itemContent;
      }).join('');
    });

    // Process helper functions
    processed = await this.processHelpers(processed, variables);

    // Clean up any remaining template syntax
    processed = processed.replace(/\{\{[^}]*\}\}/g, '');

    return processed;
  }

  // Process helper functions like {{pascalCase name}}
  private async processHelpers(template: string, variables: Record<string, any>): Promise<string> {
    let processed = template;

    // {{pascalCase variable}}
    processed = processed.replace(/\{\{pascalCase\s+(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      return typeof value === 'string' ? this.toPascalCase(value) : match;
    });

    // {{camelCase variable}}
    processed = processed.replace(/\{\{camelCase\s+(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      return typeof value === 'string' ? this.toCamelCase(value) : match;
    });

    // {{toUpperCase variable}}
    processed = processed.replace(/\{\{toUpperCase\s+(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      return typeof value === 'string' ? value.toUpperCase() : match;
    });

    // {{toLowerCase variable}}
    processed = processed.replace(/\{\{toLowerCase\s+(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      return typeof value === 'string' ? value.toLowerCase() : match;
    });

    return processed;
  }

  // Validate template variables
  private validateVariables(template: CodeTemplate, variables: Record<string, any>): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const variable of template.variables) {
      const value = variables[variable.name];

      // Check required variables
      if (variable.required && (value === undefined || value === null || value === '')) {
        errors.push(`Required variable '${variable.name}' is missing`);
        continue;
      }

      // Skip validation for optional missing variables
      if (value === undefined) continue;

      // Type validation
      if (!this.validateVariableType(value, variable.type)) {
        errors.push(`Variable '${variable.name}' should be of type '${variable.type}' but got '${typeof value}'`);
      }

      // Pattern validation
      if (variable.validation?.pattern && typeof value === 'string') {
        const regex = new RegExp(variable.validation.pattern);
        if (!regex.test(value)) {
          errors.push(`Variable '${variable.name}' does not match required pattern: ${variable.validation.pattern}`);
        }
      }

      // Range validation
      if (typeof value === 'number') {
        if (variable.validation?.min !== undefined && value < variable.validation.min) {
          errors.push(`Variable '${variable.name}' should be at least ${variable.validation.min}`);
        }
        if (variable.validation?.max !== undefined && value > variable.validation.max) {
          errors.push(`Variable '${variable.name}' should be at most ${variable.validation.max}`);
        }
      }

      // Options validation
      if (variable.validation?.options && !variable.validation.options.includes(value)) {
        errors.push(`Variable '${variable.name}' should be one of: ${variable.validation.options.join(', ')}`);
      }
    }

    // Check for unused variables
    const templateVariables = this.extractTemplateVariables(template.template);
    const providedVariables = Object.keys(variables);
    
    for (const provided of providedVariables) {
      if (!templateVariables.includes(provided)) {
        warnings.push(`Variable '${provided}' is provided but not used in template`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate variable type
  private validateVariableType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'boolean':
        return typeof value === 'boolean';
      case 'number':
        return typeof value === 'number';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value) && value !== null;
      default:
        return true;
    }
  }

  // Extract variable names from template
  private extractTemplateVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g) || [];
    return matches.map(match => match.replace(/\{\{|\}\}/g, ''));
  }

  // Helper functions
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_\s])(\w)/g, (_, char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }

  // File operations
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async createBackup(filePath: string): Promise<void> {
    try {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      const content = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(backupPath, content, 'utf-8');
      console.log(`✅ Created backup: ${backupPath}`);
    } catch (error) {
      console.warn(`Could not create backup for ${filePath}:`, error);
    }
  }

  // Post-process generated file
  private async postProcessFile(filePath: string, template: CodeTemplate): Promise<void> {
    // This could include:
    // - Code formatting (prettier)
    // - Import organization
    // - Linting fixes
    // - Custom transformations based on template type
    
    console.log(`📝 Post-processing ${filePath} for template type: ${template.type}`);
  }

  // Auto-generate page based on path and context
  async autoGeneratePage(pagePath: string, pageConfig: PageConfig, user?: AuthenticatedUser): Promise<GenerationResult> {
    const componentName = this.pathToComponentName(pagePath);
    
    const context: GenerationContext = {
      projectRoot: process.cwd(),
      targetPath: pagePath,
      templateId: 'TEMPLATE-FULL-DASHBOARD-PAGE',
      variables: {
        componentName,
        pageTitle: pageConfig.title,
        pageDescription: pageConfig.description,
        requiresAuth: pageConfig.requiresAuth ?? true,
        authLevel: pageConfig.authLevel ?? 'requireStaff',
        useIcons: pageConfig.useIcons ?? true,
        iconImports: pageConfig.icons ?? ['FiSettings'],
        headerIcon: pageConfig.headerIcon ?? 'FiSettings',
        iconColor: pageConfig.iconColor ?? 'blue',
        hasActions: pageConfig.hasActions ?? false,
        actions: pageConfig.actions ?? [],
        hasCards: pageConfig.hasCards ?? false,
        cards: pageConfig.cards ?? [],
        seo: pageConfig.seo ?? {}
      },
      enforceRules: true,
      createBackup: true
    };

    return await this.generateCode(context, user);
  }

  // Convert file path to component name
  private pathToComponentName(filePath: string): string {
    const fileName = path.basename(filePath, '.tsx');
    if (fileName === 'page') {
      // Extract from directory name
      const dirName = path.basename(path.dirname(filePath));
      return this.toPascalCase(dirName) + 'Page';
    }
    return this.toPascalCase(fileName);
  }

  // Get template by ID
  getTemplate(templateId: string): CodeTemplate | undefined {
    return this.templates.get(templateId);
  }

  // Get all templates
  getAllTemplates(): CodeTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get templates by category
  getTemplatesByCategory(category: string): CodeTemplate[] {
    return this.getAllTemplates().filter(template => template.category === category);
  }

  // Get templates by framework
  getTemplatesByFramework(framework: string): CodeTemplate[] {
    return this.getAllTemplates().filter(template => template.framework === framework);
  }

  // Add custom template
  async addTemplate(template: CodeTemplate, user?: AuthenticatedUser): Promise<void> {
    // Check permissions
    if (user && !(await this.rbac.hasPermission(user, 'template_management', 'create'))) {
      throw new Error('Insufficient permissions to add templates');
    }

    this.templates.set(template.id, template);
    console.log(`✅ Added template: ${template.name} (${template.id})`);
  }

  // Generate multiple files from template set
  async generateFileSet(configs: GenerationContext[], user?: AuthenticatedUser): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];
    
    for (const config of configs) {
      try {
        const result = await this.generateCode(config, user);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          filePath: config.targetPath
        });
      }
    }
    
    return results;
  }

  // Generate code from inferred template based on file path
  async generateFromPath(filePath: string, variables: Record<string, any>, user?: AuthenticatedUser): Promise<GenerationResult> {
    const templateId = this.inferTemplateFromPath(filePath);
    
    const context: GenerationContext = {
      projectRoot: process.cwd(),
      targetPath: filePath,
      templateId,
      variables,
      enforceRules: true,
      createBackup: true
    };
    
    return await this.generateCode(context, user);
  }

  // Infer template type from file path
  private inferTemplateFromPath(filePath: string): string {
    if (filePath.includes('/api/') && filePath.endsWith('/route.ts')) {
      return 'TEMPLATE-FULL-API-ROUTE';
    }
    
    if (filePath.includes('/app/') && filePath.endsWith('/page.tsx')) {
      return 'TEMPLATE-FULL-DASHBOARD-PAGE';
    }
    
    // Default to page template
    return 'TEMPLATE-FULL-DASHBOARD-PAGE';
  }
} 