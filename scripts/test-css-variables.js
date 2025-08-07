#!/usr/bin/env node

// Test if CSS variables are being generated correctly
const { themes } = require('../src/lib/theme/themes');
const { generateCSSVariables } = require('../src/lib/theme/theme-utils');

console.log('Testing CSS Variable Generation\n');
console.log('=================================\n');

themes.forEach(theme => {
  console.log(`\nTheme: ${theme.name} (${theme.id})`);
  console.log('---------------------------------');
  
  const cssVars = generateCSSVariables(theme);
  const varCount = Object.keys(cssVars).length;
  
  console.log(`Generated ${varCount} CSS variables`);
  
  // Show a sample of variables
  const sampleVars = Object.entries(cssVars).slice(0, 10);
  console.log('\nSample variables:');
  sampleVars.forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  // Check for essential variables
  const essentialVars = [
    '--color-primary',
    '--color-background',
    '--color-text',
    '--spacing-md',
    '--radius-md',
  ];
  
  console.log('\nEssential variables check:');
  essentialVars.forEach(varName => {
    const exists = varName in cssVars;
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${varName}: ${exists ? cssVars[varName] : 'MISSING'}`);
  });
});

console.log('\n=================================');
console.log('Test Complete\n');