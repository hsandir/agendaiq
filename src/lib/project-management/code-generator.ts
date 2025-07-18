/**
 * AUTOMATIC CODE GENERATOR & PAGE MANAGEMENT SYSTEM
 * 
 * Bu sistem kurallar doğrultusunda otomatik olarak:
 * 1. Sayfaları oluşturur ve düzenler
 * 2. Component'leri standardize eder
 * 3. API endpoint'lerini düzenler
 * 4. Import/export'ları otomatik yönetir
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { RuleEngine } from './rule-engine';

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  type: 'page' | 'component' | 'api' | 'hook' | 'util';
  template: string;
  variables: TemplateVariable[];
  rules: string[]; // Rule IDs that this template satisfies
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description: string;
}

export interface GenerationContext {
  projectRoot: string;
  targetPath: string;
  templateId: string;
  variables: Record<string, any>;
  enforceRules: boolean;
}

// ===== PREDEFINED TEMPLATES =====

export const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: 'TEMPLATE-DASHBOARD-PAGE',
    name: 'Dashboard Page Template',
    description: 'Standard dashboard page with authentication and proper structure',
    type: 'page',
    template: `import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
{{#if useIcons}}
import { {{iconImports}} } from 'react-icons/fi';
{{/if}}

export const metadata: Metadata = {
  title: "{{pageTitle}}",
  description: "{{pageDescription}}",
};

{{#if requiresAuth}}
export default async function {{componentName}}() {
  // Authentication check with proper RBAC
  const user = await requireAuth(AuthPresets.{{authLevel}});
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
        </div>
        {{#if hasActions}}
        <div className="flex gap-2">
          {{#each actions}}
          <Button{{#if variant}} variant="{{variant}}"{{/if}}>
            {{#if icon}}<{{icon}} className="mr-2" />{{/if}}
            {{label}}
          </Button>
          {{/each}}
        </div>
        {{/if}}
      </div>

      {/* Content */}
      <div className="grid gap-6">
        {{#if hasCards}}
        {{#each cards}}
        <Card>
          <CardHeader>
            <CardTitle>{{title}}</CardTitle>
            {{#if description}}<CardDescription>{{description}}</CardDescription>{{/if}}
          </CardHeader>
          <CardContent>
            {/* TODO: Add card content */}
          </CardContent>
        </Card>
        {{/each}}
        {{/if}}
      </div>
    </div>
  );
}`,
    variables: [
      { name: 'componentName', type: 'string', required: true, description: 'Component name (PascalCase)' },
      { name: 'pageTitle', type: 'string', required: true, description: 'Page title' },
      { name: 'pageDescription', type: 'string', required: true, description: 'Page description' },
      { name: 'requiresAuth', type: 'boolean', required: false, defaultValue: true, description: 'Requires authentication' },
      { name: 'authLevel', type: 'string', required: false, defaultValue: 'requireStaff', description: 'Auth level (requireUser, requireStaff, adminOnly)' },
      { name: 'useIcons', type: 'boolean', required: false, defaultValue: true, description: 'Include icon imports' },
      { name: 'iconImports', type: 'array', required: false, defaultValue: ['FiSettings'], description: 'Icons to import' },
      { name: 'headerIcon', type: 'string', required: false, description: 'Header icon component name' },
      { name: 'iconColor', type: 'string', required: false, defaultValue: 'blue', description: 'Icon color' },
      { name: 'hasActions', type: 'boolean', required: false, defaultValue: false, description: 'Has action buttons' },
      { name: 'actions', type: 'array', required: false, defaultValue: [], description: 'Action buttons' },
      { name: 'hasCards', type: 'boolean', required: false, defaultValue: true, description: 'Has card layout' },
      { name: 'cards', type: 'array', required: false, defaultValue: [], description: 'Card definitions' }
    ],
    rules: ['RULE-005-PAGE-STRUCTURE', 'RULE-002-DYNAMIC-RBAC']
  },

  {
    id: 'TEMPLATE-API-ROUTE',
    name: 'API Route Template',
    description: 'Standard API route with authentication and proper error handling',
    type: 'api',
    template: `import { NextRequest, NextResponse } from "next/server";
import { APIAuthPatterns } from '@/lib/auth/api-auth';
import { AuthenticatedUser } from '@/lib/auth/auth-utils';
{{#if usePrisma}}
import { prisma } from '@/lib/prisma';
{{/if}}

{{#each httpMethods}}
// {{toUpperCase method}} {{../endpoint}}
export const {{toUpperCase method}} = APIAuthPatterns.{{authPattern}}(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    {{#if hasValidation}}
    // Input validation
    {{#if ../hasBody}}
    const body = await request.json();
    {{#each ../validationRules}}
    if (!body.{{field}}) {
      return NextResponse.json({ error: "{{field}} is required" }, { status: 400 });
    }
    {{/each}}
    {{/if}}
    {{/if}}

    {{#if ../usePrisma}}
    // Database operations
    {{#if isCreate}}
    const result = await prisma.{{modelName}}.create({
      data: body,
      include: {
        // Add related data
      }
    });
    {{else if isRead}}
    const result = await prisma.{{modelName}}.findMany({
      where: {
        // Add filters based on user permissions
      },
      include: {
        // Add related data
      }
    });
    {{else if isUpdate}}
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await prisma.{{modelName}}.update({
      where: { id: parseInt(id) },
      data: body,
      include: {
        // Add related data
      }
    });
    {{else if isDelete}}
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.{{modelName}}.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ message: "Deleted successfully" });
    {{/if}}
    {{else}}
    // TODO: Implement {{method}} logic
    const result = { message: "{{method}} endpoint implemented" };
    {{/if}}

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in {{toUpperCase method}} {{../endpoint}}:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        code: "{{toUpperCase method}}_ERROR",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

{{/each}}`,
    variables: [
      { name: 'endpoint', type: 'string', required: true, description: 'API endpoint path' },
      { name: 'httpMethods', type: 'array', required: true, description: 'HTTP methods to implement' },
      { name: 'authPattern', type: 'string', required: false, defaultValue: 'staffOnly', description: 'Authentication pattern' },
      { name: 'usePrisma', type: 'boolean', required: false, defaultValue: true, description: 'Use Prisma database' },
      { name: 'modelName', type: 'string', required: false, description: 'Prisma model name' },
      { name: 'hasValidation', type: 'boolean', required: false, defaultValue: true, description: 'Include input validation' },
      { name: 'hasBody', type: 'boolean', required: false, defaultValue: true, description: 'Expects request body' },
      { name: 'validationRules', type: 'array', required: false, defaultValue: [], description: 'Field validation rules' }
    ],
    rules: ['RULE-004-API-STRUCTURE', 'RULE-002-DYNAMIC-RBAC']
  },

  {
    id: 'TEMPLATE-UI-COMPONENT',
    name: 'UI Component Template',
    description: 'Standard UI component with TypeScript and proper structure',
    type: 'component',
    template: `'use client';

import React from 'react';
{{#if useReactHooks}}
import { useState{{#if hasEffect}}, useEffect{{/if}} } from 'react';
{{/if}}
{{#if useShadcnUI}}
import { {{shadcnImports}} } from '@/components/ui/{{shadcnComponent}}';
{{/if}}
{{#if useIcons}}
import { {{iconImports}} } from 'react-icons/fi';
{{/if}}
{{#if hasUtils}}
import { {{utilImports}} } from '@/lib/utils';
{{/if}}

{{#if hasInterfaces}}
{{#each interfaces}}
export interface {{name}} {
  {{#each properties}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
  {{/each}}
}

{{/each}}
{{/if}}

interface {{componentName}}Props {
  {{#each props}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
  {{/each}}
  className?: string;
  children?: React.ReactNode;
}

export function {{componentName}}({{#if hasProps}}{ {{propList}}, className, children }: {{componentName}}Props{{else}}{ className, children }: {{componentName}}Props{{/if}}) {
  {{#if useReactHooks}}
  {{#each stateVars}}
  const [{{name}}, set{{pascalCase name}}] = useState<{{type}}>({{defaultValue}});
  {{/each}}

  {{#if hasEffect}}
  useEffect(() => {
    // Component initialization
    {{#each effects}}
    {{code}}
    {{/each}}
  }, []);
  {{/if}}
  {{/if}}

  {{#if hasMethods}}
  {{#each methods}}
  const {{name}} = {{#if isAsync}}async {{/if}}({{parameters}}) => {
    {{#if isAsync}}
    try {
      {{code}}
    } catch (error) {
      console.error('Error in {{name}}:', error);
    }
    {{else}}
    {{code}}
    {{/if}}
  };

  {{/each}}
  {{/if}}

  return (
    <div className={{\`{{baseClasses}}\${className ? \` \${className}\` : ''}\`}}>
      {{#if hasHeader}}
      <div className="{{headerClasses}}">
        {{#if headerIcon}}
        <{{headerIcon}} className="{{iconClasses}}" />
        {{/if}}
        <h3 className="{{titleClasses}}">{{componentTitle}}</h3>
      </div>
      {{/if}}
      
      {{#if hasContent}}
      <div className="{{contentClasses}}">
        {{contentTemplate}}
      </div>
      {{/if}}
      
      {children}
    </div>
  );
}

export default {{componentName}};`,
    variables: [
      { name: 'componentName', type: 'string', required: true, description: 'Component name (PascalCase)' },
      { name: 'componentTitle', type: 'string', required: false, description: 'Component display title' },
      { name: 'props', type: 'array', required: false, defaultValue: [], description: 'Component props' },
      { name: 'hasProps', type: 'boolean', required: false, defaultValue: false, description: 'Has custom props' },
      { name: 'propList', type: 'string', required: false, description: 'Comma-separated prop names' },
      { name: 'useReactHooks', type: 'boolean', required: false, defaultValue: false, description: 'Use React hooks' },
      { name: 'stateVars', type: 'array', required: false, defaultValue: [], description: 'State variables' },
      { name: 'hasEffect', type: 'boolean', required: false, defaultValue: false, description: 'Has useEffect' },
      { name: 'effects', type: 'array', required: false, defaultValue: [], description: 'Effect code blocks' },
      { name: 'hasMethods', type: 'boolean', required: false, defaultValue: false, description: 'Has methods' },
      { name: 'methods', type: 'array', required: false, defaultValue: [], description: 'Component methods' },
      { name: 'useShadcnUI', type: 'boolean', required: false, defaultValue: true, description: 'Use Shadcn UI' },
      { name: 'shadcnImports', type: 'array', required: false, defaultValue: ['Card'], description: 'Shadcn components to import' },
      { name: 'shadcnComponent', type: 'string', required: false, defaultValue: 'card', description: 'Shadcn component file' },
      { name: 'useIcons', type: 'boolean', required: false, defaultValue: false, description: 'Use icons' },
      { name: 'iconImports', type: 'array', required: false, defaultValue: [], description: 'Icons to import' },
      { name: 'hasUtils', type: 'boolean', required: false, defaultValue: false, description: 'Import utils' },
      { name: 'utilImports', type: 'array', required: false, defaultValue: [], description: 'Utils to import' },
      { name: 'hasInterfaces', type: 'boolean', required: false, defaultValue: false, description: 'Has custom interfaces' },
      { name: 'interfaces', type: 'array', required: false, defaultValue: [], description: 'Interface definitions' },
      { name: 'baseClasses', type: 'string', required: false, defaultValue: 'space-y-4', description: 'Base CSS classes' },
      { name: 'hasHeader', type: 'boolean', required: false, defaultValue: false, description: 'Has header section' },
      { name: 'headerClasses', type: 'string', required: false, defaultValue: 'flex items-center gap-2 mb-4', description: 'Header CSS classes' },
      { name: 'headerIcon', type: 'string', required: false, description: 'Header icon component' },
      { name: 'iconClasses', type: 'string', required: false, defaultValue: 'w-5 h-5', description: 'Icon CSS classes' },
      { name: 'titleClasses', type: 'string', required: false, defaultValue: 'text-lg font-semibold', description: 'Title CSS classes' },
      { name: 'hasContent', type: 'boolean', required: false, defaultValue: true, description: 'Has content section' },
      { name: 'contentClasses', type: 'string', required: false, defaultValue: 'space-y-4', description: 'Content CSS classes' },
      { name: 'contentTemplate', type: 'string', required: false, defaultValue: '{/* TODO: Add component content */}', description: 'Content template' }
    ],
    rules: ['RULE-003-COMPONENT-STRUCTURE']
  }
];

// ===== CODE GENERATOR CLASS =====

export class CodeGenerator {
  private static instance: CodeGenerator;
  private templates = new Map<string, CodeTemplate>();
  private ruleEngine: RuleEngine;

  static getInstance(): CodeGenerator {
    if (!CodeGenerator.instance) {
      CodeGenerator.instance = new CodeGenerator();
    }
    return CodeGenerator.instance;
  }

  constructor() {
    this.ruleEngine = RuleEngine.getInstance();
    this.loadTemplates();
  }

  // Load predefined templates
  private loadTemplates(): void {
    CODE_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Get template by ID
  getTemplate(templateId: string): CodeTemplate | undefined {
    return this.templates.get(templateId);
  }

  // Get templates by type
  getTemplatesByType(type: CodeTemplate['type']): CodeTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type);
  }

  // Generate code from template
  async generateCode(context: GenerationContext): Promise<GenerationResult> {
    const template = this.getTemplate(context.templateId);
    if (!template) {
      throw new Error(`Template ${context.templateId} not found`);
    }

    try {
      // Validate variables
      const validationResult = this.validateVariables(template, context.variables);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Variable validation failed: ${validationResult.errors.join(', ')}`,
          generatedCode: '',
          filePath: ''
        };
      }

      // Process template
      const processedCode = this.processTemplate(template.template, context.variables);
      
      // Ensure target directory exists
      const targetDir = path.dirname(context.targetPath);
      await fs.mkdir(targetDir, { recursive: true });

      // Write file
      await fs.writeFile(context.targetPath, processedCode, 'utf-8');

      // Validate against rules if requested
      if (context.enforceRules) {
        await this.validateGeneratedCode(context.targetPath, template.rules);
      }

      return {
        success: true,
        generatedCode: processedCode,
        filePath: context.targetPath,
        templateUsed: template.id
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        generatedCode: '',
        filePath: ''
      };
    }
  }

  // Validate template variables
  private validateVariables(template: CodeTemplate, variables: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    for (const variable of template.variables) {
      const value = variables[variable.name];

      // Check required variables
      if (variable.required && (value === undefined || value === null || value === '')) {
        errors.push(`Required variable '${variable.name}' is missing`);
        continue;
      }

      // Check variable types
      if (value !== undefined) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== variable.type && variable.type !== 'object') {
          errors.push(`Variable '${variable.name}' should be ${variable.type}, got ${actualType}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Process template with variables
  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;

    // Replace simple variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, String(value));
    }

    // Process conditionals
    processed = this.processConditionals(processed, variables);

    // Process loops
    processed = this.processLoops(processed, variables);

    // Process helpers
    processed = this.processHelpers(processed, variables);

    return processed;
  }

  // Process conditional blocks
  private processConditionals(template: string, variables: Record<string, any>): string {
    let processed = template;

    // Handle {{#if condition}} blocks
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    processed = processed.replace(ifRegex, (match, condition, content) => {
      return variables[condition] ? content : '';
    });

    // Handle {{#unless condition}} blocks
    const unlessRegex = /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g;
    processed = processed.replace(unlessRegex, (match, condition, content) => {
      return !variables[condition] ? content : '';
    });

    return processed;
  }

  // Process loop blocks
  private processLoops(template: string, variables: Record<string, any>): string {
    let processed = template;

    // Handle {{#each array}} blocks
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    processed = processed.replace(eachRegex, (match, arrayName, content) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) {
        return '';
      }

      return array.map((item, index) => {
        let itemContent = content;
        
        // Replace item properties
        if (typeof item === 'object') {
          for (const [key, value] of Object.entries(item)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            itemContent = itemContent.replace(regex, String(value));
          }
        } else {
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
        }

        // Replace index
        itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));

        return itemContent;
      }).join('');
    });

    return processed;
  }

  // Process helper functions
  private processHelpers(template: string, variables: Record<string, any>): string {
    let processed = template;

    // toUpperCase helper
    const upperRegex = /\{\{toUpperCase\s+(\w+)\}\}/g;
    processed = processed.replace(upperRegex, (match, varName) => {
      const value = variables[varName];
      return typeof value === 'string' ? value.toUpperCase() : '';
    });

    // pascalCase helper
    const pascalRegex = /\{\{pascalCase\s+(\w+)\}\}/g;
    processed = processed.replace(pascalRegex, (match, varName) => {
      const value = variables[varName];
      if (typeof value === 'string') {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
      return '';
    });

    return processed;
  }

  // Validate generated code against rules
  private async validateGeneratedCode(filePath: string, ruleIds: string[]): Promise<void> {
    for (const ruleId of ruleIds) {
      const result = await this.ruleEngine.validateRule(ruleId);
      if (!result.passed && result.fixes.length > 0) {
        // Apply auto-fixes
        const autoFixes = result.fixes.filter(fix => fix.autoApply);
        if (autoFixes.length > 0) {
          await this.ruleEngine.applyFixes(autoFixes);
        }
      }
    }
  }

  // Auto-generate page based on path and context
  async autoGeneratePage(pagePath: string, pageConfig: PageConfig): Promise<GenerationResult> {
    const context: GenerationContext = {
      projectRoot: process.cwd(),
      targetPath: pagePath,
      templateId: 'TEMPLATE-DASHBOARD-PAGE',
      variables: {
        componentName: this.pathToComponentName(pagePath),
        pageTitle: pageConfig.title,
        pageDescription: pageConfig.description,
        requiresAuth: pageConfig.requiresAuth ?? true,
        authLevel: pageConfig.authLevel ?? 'requireStaff',
        useIcons: true,
        iconImports: pageConfig.icons ?? ['FiSettings'],
        headerIcon: pageConfig.headerIcon ?? 'FiSettings',
        iconColor: pageConfig.iconColor ?? 'blue',
        hasActions: pageConfig.actions && pageConfig.actions.length > 0,
        actions: pageConfig.actions ?? [],
        hasCards: pageConfig.cards && pageConfig.cards.length > 0,
        cards: pageConfig.cards ?? []
      },
      enforceRules: true
    };

    return await this.generateCode(context);
  }

  // Auto-generate API route
  async autoGenerateAPI(apiPath: string, apiConfig: APIConfig): Promise<GenerationResult> {
    const context: GenerationContext = {
      projectRoot: process.cwd(),
      targetPath: apiPath,
      templateId: 'TEMPLATE-API-ROUTE',
      variables: {
        endpoint: apiConfig.endpoint,
        httpMethods: apiConfig.methods.map(method => ({
          method: method.toLowerCase(),
          authPattern: apiConfig.authPattern ?? 'staffOnly',
          isCreate: method === 'POST',
          isRead: method === 'GET',
          isUpdate: method === 'PUT',
          isDelete: method === 'DELETE'
        })),
        authPattern: apiConfig.authPattern ?? 'staffOnly',
        usePrisma: apiConfig.usePrisma ?? true,
        modelName: apiConfig.modelName,
        hasValidation: apiConfig.validation ?? true,
        hasBody: apiConfig.methods.some(m => ['POST', 'PUT'].includes(m)),
        validationRules: apiConfig.validationRules ?? []
      },
      enforceRules: true
    };

    return await this.generateCode(context);
  }

  // Convert file path to component name
  private pathToComponentName(filePath: string): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    return fileName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') + 'Page';
  }
}

// ===== INTERFACES =====

export interface GenerationResult {
  success: boolean;
  generatedCode: string;
  filePath: string;
  templateUsed?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PageConfig {
  title: string;
  description: string;
  requiresAuth?: boolean;
  authLevel?: string;
  icons?: string[];
  headerIcon?: string;
  iconColor?: string;
  actions?: Array<{
    label: string;
    icon?: string;
    variant?: string;
  }>;
  cards?: Array<{
    title: string;
    description?: string;
  }>;
}

export interface APIConfig {
  endpoint: string;
  methods: string[];
  authPattern?: string;
  usePrisma?: boolean;
  modelName?: string;
  validation?: boolean;
  validationRules?: Array<{
    field: string;
    required?: boolean;
  }>;
} 