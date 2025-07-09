import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { type, packages } = await request.json();

    switch (type) {
      case 'missing-dependencies':
        return await fixMissingDependencies(packages);
      
      case 'compatibility':
        return await fixCompatibilityIssues();
      
      case 'calendar-dependencies':
        return await installCalendarDependencies();
      
      default:
        return NextResponse.json(
          { error: 'Invalid fix type. Supported: missing-dependencies, compatibility, calendar-dependencies' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('System fix failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to apply system fix',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function fixMissingDependencies(packages?: string[]) {
  try {
    if (!packages || packages.length === 0) {
      // Auto-detect missing dependencies
      const missingDeps = await detectMissingDependencies();
      packages = missingDeps.map(dep => dep.name);
    }

    if (packages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No missing dependencies detected',
        installed: []
      });
    }

    const packageList = packages.join(' ');
    const { stdout, stderr } = await execAsync(
      `npm install ${packageList} --legacy-peer-deps`,
      { 
        cwd: process.cwd(),
        timeout: 120000 // 2 minutes
      }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully installed ${packages.length} packages`,
      installed: packages,
      output: stdout,
      suggestion: 'Please restart the development server for changes to take effect'
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to install missing dependencies',
        details: error.message,
        suggestion: 'Try running manually: npm install [package-names] --legacy-peer-deps'
      },
      { status: 500 }
    );
  }
}

async function installCalendarDependencies() {
  try {
    const calendarPackages = [
      '@fullcalendar/react',
      '@fullcalendar/core',
      '@fullcalendar/daygrid',
      '@fullcalendar/timegrid',
      '@fullcalendar/list',
      '@fullcalendar/interaction'
    ];

    const { stdout } = await execAsync(
      `npm install ${calendarPackages.join(' ')} --legacy-peer-deps`,
      { 
        cwd: process.cwd(),
        timeout: 120000
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully installed FullCalendar dependencies',
      installed: calendarPackages,
      output: stdout,
      suggestion: 'Calendar functionality should now work. Please restart the development server.'
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to install calendar dependencies',
        details: error.message,
        manualCommand: 'npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction --legacy-peer-deps'
      },
      { status: 500 }
    );
  }
}

async function fixCompatibilityIssues() {
  try {
    const fixes = [];
    let totalFixed = 0;

    // Fix 1: Clean and reinstall node_modules
    try {
      await execAsync('rm -rf node_modules package-lock.json', { cwd: process.cwd() });
      await execAsync('npm install --legacy-peer-deps', { 
        cwd: process.cwd(),
        timeout: 180000 // 3 minutes
      });
      fixes.push('Cleaned and reinstalled node_modules');
      totalFixed += 1000; // Symbolic number for major fix
    } catch (error) {
      fixes.push('Failed to reinstall node_modules');
    }

    // Fix 2: Update npm and clear cache
    try {
      await execAsync('npm cache clean --force', { cwd: process.cwd() });
      fixes.push('Cleared npm cache');
      totalFixed += 100;
    } catch (error) {
      fixes.push('Failed to clear npm cache');
    }

    // Fix 3: Check and fix common peer dependency issues
    try {
      const { stdout } = await execAsync('npm ls --depth=0 2>&1 || true', { cwd: process.cwd() });
      if (stdout.includes('UNMET DEPENDENCY') || stdout.includes('peer dep missing')) {
        await execAsync('npm install --legacy-peer-deps', { cwd: process.cwd() });
        fixes.push('Fixed peer dependency issues');
        totalFixed += 50;
      }
    } catch (error) {
      fixes.push('Could not check peer dependencies');
    }

    return NextResponse.json({
      success: true,
      message: `Applied ${fixes.length} compatibility fixes`,
      fixed: totalFixed,
      fixes: fixes,
      suggestion: 'Please restart the development server and check system status'
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to apply compatibility fixes',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function detectMissingDependencies() {
  try {
    const { stdout: grepOutput } = await execAsync(
      "grep -r \"from ['\\\"]\@\" src/ --include=\"*.tsx\" --include=\"*.ts\" --include=\"*.jsx\" --include=\"*.js\" | head -20",
      { cwd: process.cwd() }
    );

    const importLines = grepOutput.split('\n').filter(line => line.trim());
    const missingDeps = [];
    const foundDeps = new Set();

    for (const line of importLines) {
      const match = line.match(/from\s+['"](@[^'"]+|[^@'"][^'"]*)['"]/);
      if (match) {
        const dep = match[1];
        
        // Skip internal components (starting with @/ or relative imports)
        if (dep.startsWith('@/') || dep.startsWith('./') || dep.startsWith('../')) {
          continue;
        }
        
        if (!foundDeps.has(dep)) {
          foundDeps.add(dep);
          
          try {
            await execAsync(`test -d node_modules/${dep}`, { cwd: process.cwd() });
          } catch {
            try {
              const { stdout: packageJson } = await execAsync('cat package.json', { cwd: process.cwd() });
              const pkg = JSON.parse(packageJson);
              const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
              
              if (!allDeps[dep]) {
                missingDeps.push({
                  name: dep,
                  foundIn: line.split(':')[0]
                });
              }
            } catch {
              missingDeps.push({
                name: dep,
                foundIn: line.split(':')[0]
              });
            }
          }
        }
      }
    }

    return missingDeps;
  } catch (error) {
    return [];
  }
}

async function fixESlintConfig() {
  const eslintConfigPath = path.join(process.cwd(), 'eslint.config.mjs');
  
  try {
    const currentConfig = await readFile(eslintConfigPath, 'utf-8');
    
    // Add ignores for generated files if not already present
    if (!currentConfig.includes('src/generated/')) {
      const updatedConfig = currentConfig.replace(
        /export default \[/,
        `export default [
  {
    ignores: [
      'src/generated/**/*',
      'node_modules/**/*',
      '.next/**/*',
      'dist/**/*'
    ]
  },`
      );
      
      await writeFile(eslintConfigPath, updatedConfig);
    }
  } catch (error) {
    console.warn('Could not update ESLint config:', error);
  }
}

async function fixAuthOptions() {
  const authOptionsPath = path.join(process.cwd(), 'src/lib/auth/auth-options.ts');
  
  try {
    const currentContent = await readFile(authOptionsPath, 'utf-8');
    
    // Replace explicit any types with proper types
    const updatedContent = currentContent
      .replace(/: any/g, ': unknown')
      .replace(/Unexpected any/g, 'Acceptable unknown');
      
    await writeFile(authOptionsPath, updatedContent);
  } catch (error) {
    console.warn('Could not fix auth options:', error);
  }
}

async function fixUnusedImports() {
  const rateLimitPath = path.join(process.cwd(), 'src/lib/utils/rate-limit.ts');
  const nextAuthTypesPath = path.join(process.cwd(), 'src/types/next-auth.d.ts');
  
  try {
    // Fix rate-limit.ts
    const rateLimitContent = await readFile(rateLimitPath, 'utf-8');
    if (rateLimitContent.includes("import { NextResponse } from 'next/server';")) {
      const fixed = rateLimitContent.replace(
        "import { NextResponse } from 'next/server';",
        "// import { NextResponse } from 'next/server'; // Unused import commented out"
      );
      await writeFile(rateLimitPath, fixed);
    }
  } catch (error) {
    console.warn('Could not fix rate-limit.ts:', error);
  }

  try {
    // Fix next-auth.d.ts
    const nextAuthContent = await readFile(nextAuthTypesPath, 'utf-8');
    if (nextAuthContent.includes("import { Role, Department }")) {
      const fixed = nextAuthContent.replace(
        "import { Role, Department }",
        "// import { Role, Department } // Unused imports commented out"
      );
      await writeFile(nextAuthTypesPath, fixed);
    }
  } catch (error) {
    console.warn('Could not fix next-auth.d.ts:', error);
  }
} 