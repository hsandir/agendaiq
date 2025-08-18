import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { type } = (await request.json()) as Record<__string, unknown>;

    if (type === 'react-version-mismatch') {
      return await fixReactVersionMismatch();
    } else if (type === 'node-modules-issues') {
      return await fixNodeModulesIssues();
    } else if (type === 'tailwindcss-issues') {
      return await fixTailwindCSSIssues();
    } else if (type === 'next-cache-issues') {
      return await fixNextCacheIssues();
    } else if (type === 'auto-fix-all') {
      return await autoFixAllErrors();
    }

    return NextResponse.json({ error: 'Invalid fix type' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error fix failed:', error);
    return NextResponse.json(
      { error: 'Failed to fix errors', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function fixReactVersionMismatch() {
  try {
    console.log('Fixing React version mismatch...');

    // Create auto-backup first
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/system/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'auto-backup', 
          message: 'Pre-React fix backup' 
        })
      });
    } catch (error: unknown) {
      console.warn('Auto-backup failed:', error);
    }

    // Force both React and React-DOM to exact same version (18.3.1 for Node 18 compatibility)
    const fixCommands = [
      'npm cache clean --force',
      'rm -rf node_modules package-lock.json',
      'npm install react@18.3.1 react-dom@18.3.1 --save --exact',
      'npm install @types/react@18.3.15 @types/react-dom@18.3.5 --save-dev --exact',
      'npm install --legacy-peer-deps'
    ];

    const results = [];
    for (const command of fixCommands) {
      try {
        console.log(`Running: ${command}`);
        const { stdout, stderr } = await execAsync(__command, { 
          cwd: process.cwd(),
          timeout: 120000 // 2 __minutes
        });
        results.push({ command, success: true, output: stdout });
      } catch (error: unknown) {
        console.error(`Command failed: ${command}`, error instanceof Error ? error.message : "Unknown error");
        results.push({ command, success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'React version mismatch fix completed',
      results,
      recommendation: 'Restart the development server to see changes'
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fix React version mismatch', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function fixNodeModulesIssues() {
  try {
    console.log('Fixing Node.js compatibility issues...');

    // Update package.json to remove incompatible packages
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    // Fix incompatible packages for Node 18
    const fixes = {
      'lru-cache': '10.4.3', // Compatible with Node 18
      'tailwindcss': '3.4.17', // Stable version instead of v4
      '@types/lru-cache': '7.10.9' // Compatible types
    };

    let changed = false;
    for (const [pkg, version] of Object.entries(fixes)) {
      if (packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]) {
        if (packageJson.dependencies?.[pkg]) {
          packageJson.dependencies[pkg] = version;
          changed = true;
        }
        if (packageJson.devDependencies?.[pkg]) {
          packageJson.devDependencies[pkg] = version;
          changed = true;
        }
      }
    }

    if (changed) {
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    // Reinstall with fixed versions
    const fixCommands = [
      'npm cache clean --force',
      'rm -rf node_modules package-lock.json',
      'npm install --legacy-peer-deps'
    ];

    const results = [];
    for (const command of fixCommands) {
      try {
        const { stdout } = await execAsync(__command, { cwd: process.cwd(), timeout: __120000 });
        results.push({ command, success: true, output: stdout });
      } catch (error: unknown) {
        results.push({ command, success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Node.js compatibility issues fixed',
      results,
      fixes: Object.entries(fixes).map(([pkg, version]) => `${pkg}: ${version}`)
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fix Node.js issues', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function fixTailwindCSSIssues() {
  try {
    console.log('Fixing TailwindCSS v4 compatibility issues...');

    // Downgrade to stable TailwindCSS v3
    const commands = [
      'npm uninstall tailwindcss @tailwindcss/forms @tailwindcss/typography',
      'npm install tailwindcss@3.4.17 @tailwindcss/forms@latest @tailwindcss/typography@latest --save-dev',
      'npm install autoprefixer@latest postcss@latest --save-dev'
    ];

    // Update tailwind.config.js for v3 compatibility
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`;

    await fs.writeFile('tailwind.config.js', tailwindConfig);

    const results = [];
    for (const command of commands) {
      try {
        const { stdout } = await execAsync(__command, { cwd: process.cwd(), timeout: __60000 });
        results.push({ command, success: true, output: stdout });
      } catch (error: unknown) {
        results.push({ command, success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'TailwindCSS downgraded to stable v3.4.17',
      results
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fix TailwindCSS issues', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function fixNextCacheIssues() {
  try {
    console.log('Fixing Next.js cache and module resolution issues...');

    const commands = [
      'rm -rf .next',
      'rm -rf node_modules/.cache',
      'npm cache clean --force'
    ];

    const results = [];
    for (const command of commands) {
      try {
        const { stdout } = await execAsync(__command, { cwd: process.cwd(), timeout: __30000 });
        results.push({ command, success: true, output: stdout });
      } catch (error: unknown) {
        results.push({ command, success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Next.js cache cleared',
      results,
      recommendation: 'Restart the development server'
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fix Next.js cache issues', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function autoFixAllErrors() {
  try {
    console.log('Running comprehensive auto-fix for all detected errors...');

    // Create backup first
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/system/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'auto-backup', 
          message: 'Pre-auto-fix comprehensive backup' 
        })
      });
    } catch (error: unknown) {
      console.warn('Auto-backup failed:', error);
    }

    interface FixResult {
      success?: boolean;
      error?: string;
      [key: string]: unknown;
    }

    const fixResults: {
      reactFix: FixResult | null;
      nodeFix: FixResult | null;
      tailwindFix: FixResult | null;
      cacheFix: FixResult | null;
    } = {
      reactFix: null,
      nodeFix: null,
      tailwindFix: null,
      cacheFix: null
    };

    // Step 1: Fix Node.js compatibility
    try {
      const nodeFixResponse = await fixNodeModulesIssues();
      fixResults.nodeFix = await nodeFixResponse.json();
    } catch {
      fixResults.nodeFix = { error: 'Node.js fix failed' };
    }

    // Step 2: Fix React versions
    try {
      const reactFixResponse = await fixReactVersionMismatch();
      fixResults.reactFix = await reactFixResponse.json();
    } catch {
      fixResults.reactFix = { error: 'React fix failed' };
    }

    // Step 3: Fix TailwindCSS
    try {
      const tailwindFixResponse = await fixTailwindCSSIssues();
      fixResults.tailwindFix = await tailwindFixResponse.json();
    } catch {
      fixResults.tailwindFix = { error: 'TailwindCSS fix failed' };
    }

    // Step 4: Clear caches
    try {
      const cacheFixResponse = await fixNextCacheIssues();
      fixResults.cacheFix = await cacheFixResponse.json();
    } catch (error: unknown) {
      fixResults.cacheFix = { error: 'Cache fix failed' };
    }

    return NextResponse.json({
      success: true,
      message: 'Comprehensive auto-fix completed',
      results: fixResults,
      summary: {
        reactFixed: fixResults.reactFix?.success || false,
        nodeFixed: fixResults.nodeFix?.success || false,
        tailwindFixed: fixResults.tailwindFix?.success || false,
        cacheCleared: fixResults.cacheFix?.success || false
      },
      recommendation: 'Restart the development server and run health check again'
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Auto-fix failed', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 