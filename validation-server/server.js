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