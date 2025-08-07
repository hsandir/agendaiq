#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Categorize dependencies
const categories = {
  ui: [],
  auth: [],
  database: [],
  testing: [],
  dev: [],
  utils: [],
  monitoring: [],
  other: []
};

// Analyze dependencies
Object.keys(packageJson.dependencies || {}).forEach(dep => {
  const version = packageJson.dependencies[dep];
  
  if (dep.includes('react') || dep.includes('ui') || dep.includes('radix') || dep.includes('tailwind') || dep.includes('lucide')) {
    categories.ui.push({ name: dep, version });
  } else if (dep.includes('auth') || dep.includes('bcrypt') || dep.includes('jose')) {
    categories.auth.push({ name: dep, version });
  } else if (dep.includes('prisma') || dep.includes('database')) {
    categories.database.push({ name: dep, version });
  } else if (dep.includes('sentry') || dep.includes('analytics')) {
    categories.monitoring.push({ name: dep, version });
  } else if (dep.includes('date') || dep.includes('zod') || dep.includes('uuid') || dep.includes('clsx')) {
    categories.utils.push({ name: dep, version });
  } else {
    categories.other.push({ name: dep, version });
  }
});

// Analyze dev dependencies
Object.keys(packageJson.devDependencies || {}).forEach(dep => {
  const version = packageJson.devDependencies[dep];
  if (dep.includes('test') || dep.includes('jest') || dep.includes('testing')) {
    categories.testing.push({ name: dep, version, dev: true });
  } else {
    categories.dev.push({ name: dep, version, dev: true });
  }
});

// Print analysis
console.log('📦 Dependency Analysis Report\n');
console.log('=' .repeat(50));

Object.entries(categories).forEach(([category, deps]) => {
  if (deps.length > 0) {
    console.log(`\n${category.toUpperCase()} (${deps.length} packages):`);
    console.log('-'.repeat(30));
    deps.forEach(dep => {
      console.log(`  ${dep.name}: ${dep.version}${dep.dev ? ' (dev)' : ''}`);
    });
  }
});

// Find potentially unused or duplicate packages
console.log('\n\n⚠️  Potential Issues:');
console.log('=' .repeat(50));

// Check for multiple icon libraries
const iconLibs = Object.keys({...packageJson.dependencies, ...packageJson.devDependencies})
  .filter(dep => dep.includes('icon') || dep === 'lucide-react');
if (iconLibs.length > 1) {
  console.log(`\n❌ Multiple icon libraries detected: ${iconLibs.join(', ')}`);
  console.log('   Consider using only one icon library');
}

// Check for multiple date libraries
const dateLibs = Object.keys(packageJson.dependencies || {})
  .filter(dep => dep.includes('date') || dep.includes('moment') || dep.includes('dayjs'));
if (dateLibs.length > 1) {
  console.log(`\n❌ Multiple date libraries detected: ${dateLibs.join(', ')}`);
  console.log('   Consider using only one date library');
}

// Large packages to consider
const largePackages = [
  '@sentry/nextjs',
  'next-pwa',
  '@faker-js/faker',
  'framer-motion'
];

const foundLarge = largePackages.filter(pkg => 
  packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]
);

if (foundLarge.length > 0) {
  console.log(`\n⚠️  Large packages found:`);
  foundLarge.forEach(pkg => {
    const isDev = !!packageJson.devDependencies?.[pkg];
    console.log(`   - ${pkg}${isDev ? ' (dev)' : ''}`);
  });
}

// Count total
const totalDeps = Object.keys(packageJson.dependencies || {}).length;
const totalDevDeps = Object.keys(packageJson.devDependencies || {}).length;

console.log('\n\n📊 Summary:');
console.log('=' .repeat(50));
console.log(`Total Dependencies: ${totalDeps}`);
console.log(`Total Dev Dependencies: ${totalDevDeps}`);
console.log(`Total Packages: ${totalDeps + totalDevDeps}`);

// Recommendations
console.log('\n\n💡 Recommendations:');
console.log('=' .repeat(50));
console.log('1. Consider lazy loading heavy components');
console.log('2. Use dynamic imports for large libraries');
console.log('3. Move test utilities to devDependencies');
console.log('4. Consider removing unused packages');
console.log('5. Use tree-shaking for icon libraries');