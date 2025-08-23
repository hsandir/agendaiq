#!/usr/bin/env node

/**
 * Local Validation Server
 * Cursor'da kota harcamadan validation işlemleri yapan local server
 */

const express = require('express');
const cors = require('cors');
const { z } = require('zod');
const app = express();
const PORT = 3456;
const fs = require('fs');
const path = require('path');

app.use(cors());
app.use(express.json());

// Validation schemas
const schemas = {
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  url: z.string().url('Invalid URL'),
  date: z.string().datetime('Invalid date format'),
  
  // Form schemas
  loginForm: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters')
  }),
  
  meetingForm: z.object({
    title: z.string().min(3).max(100),
    date: z.string().datetime(),
    attendees: z.array(z.string().email()),
    duration: z.number().min(15).max(480),
    type: z.enum(['standup', 'planning', 'review', 'other'])
  }),
  
  userProfile: z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.enum(['admin', 'teacher', 'support']),
    department: z.string().optional()
  })
};

// Validation endpoint
app.post('/validate', (req, res) => {
  const { schema, data } = req.body;
  
  if (!schemas[schema]) {
    return res.status(400).json({
      success: false,
      error: `Unknown schema: ${schema}`
    });
  }
  
  try {
    const result = schemas[schema].parse(data);
    res.json({
      success: true,
      data: result,
      message: 'Validation passed'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.json({
        success: false,
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal validation error'
      });
    }
  }
});

// Bulk validation
app.post('/validate/bulk', (req, res) => {
  const { validations } = req.body;
  const results = [];
  
  for (const validation of validations) {
    const { schema, data, id } = validation;
    
    if (!schemas[schema]) {
      results.push({
        id,
        success: false,
        error: `Unknown schema: ${schema}`
      });
      continue;
    }
    
    try {
      const result = schemas[schema].parse(data);
      results.push({
        id,
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        results.push({
          id,
          success: false,
          errors: error.errors
        });
      }
    }
  }
  
  res.json({ results });
});

// Add custom schema
app.post('/schema/add', (req, res) => {
  const { name, schema } = req.body;
  
  try {
    // Create Zod schema from JSON definition
    const zodSchema = createZodSchema(schema);
    schemas[name] = zodSchema;
    
    res.json({
      success: true,
      message: `Schema '${name}' added successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// -------------------------
// Auth Compliance Validation
// -------------------------

// Forbidden/required patterns for auth compliance
const AUTH_RULES = {
  forbidden: [
    { name: 'no-title-based-auth', pattern: /role\.(title|priority)/i, message: 'Title/priority based auth detected. Use isRole()/can() with RoleKey/Capability.', severity: 'error' },
    { name: 'no-roleid-auth', pattern: /RoleID\.[A-Z_]+/, message: 'Numeric RoleID check detected in auth. Prefer RoleKey.', severity: 'warn' },
    { name: 'use-staff-id-for-organizer', pattern: /organizer_id\s*:\s*user\??\.(id|userId)/, message: 'Use staff.id for organizer_id, not user.id', severity: 'error' },
  ],
  publicApis: [
    '/api/auth',
    '/api/auth/signin',
    '/api/auth/register',
    '/api/auth/callback',
    '/api/auth/error',
    '/api/health',
    '/api/setup/check'
  ]
};

function isPublicAPI(routePath) {
  return AUTH_RULES.publicApis.some((p) => routePath.startsWith(p));
}

function walkFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, files);
    else if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function guessRouteFromFile(filePath) {
  // Maps src/app/api/.../route.ts to /api/...
  const idx = filePath.indexOf(path.join('src', 'app'));
  if (idx === -1) return null;
  const sub = filePath.slice(idx + ('src' + path.sep + 'app').length);
  const parts = sub.split(path.sep).filter(Boolean);
  if (parts[0] !== 'api') return null;
  const routeParts = parts.slice(0, -1); // drop route.ts
  return '/' + routeParts.join('/');
}

app.post('/auth/compliance/scan', (req, res) => {
  try {
    const rootDir = req.body?.rootDir || process.cwd();
    const projectRoot = path.isAbsolute(rootDir) ? rootDir : path.join(process.cwd(), '..');
    const srcDir = path.join(projectRoot, 'src');
    const files = walkFiles(srcDir, []);

    const findings = [];

    // Forbidden patterns
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);
      for (const rule of AUTH_RULES.forbidden) {
        if (rule.pattern.test(content)) {
          lines.forEach((line, i) => {
            if (rule.pattern.test(line)) {
              findings.push({ type: 'pattern', rule: rule.name, severity: rule.severity, file, line: i + 1, message: rule.message, snippet: line.trim() });
            }
          });
        }
      }
    }

    // Pages missing server guard (heuristic)
    const pageFiles = files.filter((f) => /src\/(app)\/(?!api\/).*\/page\.tsx$/.test(f.replace(/\\/g, '/')));
    for (const file of pageFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (/export\s+default/.test(content) && !/requireAuth\(/.test(content) && !/ServerAuthWrapper/.test(content)) {
        findings.push({ type: 'page_guard', rule: 'require-auth-on-pages', severity: 'warn', file, message: 'Page likely missing server requireAuth or ServerAuthWrapper.' });
      }
    }

    // APIs missing withAuth (non-public)
    const apiFiles = files.filter((f) => /src\/app\/api\/.+\/route\.ts$/.test(f.replace(/\\/g, '/')));
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const routePath = guessRouteFromFile(file);
      if (!routePath) continue;
      if (isPublicAPI(routePath)) continue;
      if (!/withAuth\(/.test(content)) {
        findings.push({ type: 'api_guard', rule: 'with-auth-on-apis', severity: 'error', file, route: routePath, message: 'API route missing withAuth() guard.' });
      }
    }

    res.json({ success: true, findings, summary: { total: findings.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || 'scan failed' });
  }
});

// Helper to create Zod schema from JSON
function createZodSchema(def) {
  if (def.type === 'string') {
    let schema = z.string();
    if (def.min) schema = schema.min(def.min);
    if (def.max) schema = schema.max(def.max);
    if (def.email) schema = schema.email();
    if (def.url) schema = schema.url();
    if (def.regex) schema = schema.regex(new RegExp(def.regex));
    return schema;
  }
  
  if (def.type === 'number') {
    let schema = z.number();
    if (def.min !== undefined) schema = schema.min(def.min);
    if (def.max !== undefined) schema = schema.max(def.max);
    if (def.int) schema = schema.int();
    return schema;
  }
  
  if (def.type === 'boolean') {
    return z.boolean();
  }
  
  if (def.type === 'array') {
    return z.array(createZodSchema(def.items));
  }
  
  if (def.type === 'object') {
    const shape = {};
    for (const [key, value] of Object.entries(def.properties)) {
      shape[key] = createZodSchema(value);
    }
    return z.object(shape);
  }
  
  if (def.type === 'enum') {
    return z.enum(def.values);
  }
  
  throw new Error(`Unknown type: ${def.type}`);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    schemas: Object.keys(schemas),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Validation Server running on http://localhost:${PORT}`);
  console.log('📝 Available endpoints:');
  console.log('   POST /validate - Validate single data');
  console.log('   POST /validate/bulk - Validate multiple data');
  console.log('   POST /schema/add - Add custom schema');
  console.log('   GET /health - Health check');
});