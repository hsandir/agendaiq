import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import * as fs from 'fs';
import * as path from 'path';

interface MockDataUsage {
  file: string;
  path: string;
  type: 'component' | 'page' | 'api';
  status: 'mock_only' | 'mixed' | 'api_fallback';
  description: string;
  mockDataLines: string[];
  apiEndpoint?: string;
  lastChecked: string;
  priority: 'high' | 'medium' | 'low';
}

interface MockDataReport {
  totalFiles: number;
  mockOnlyFiles: number;
  mixedFiles: number;
  apiFallbackFiles: number;
  usage: MockDataUsage[];
  timestamp: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check would be nice but not strictly required for read-only scan
    console.log('Starting mock data scan...');

    const mockDataUsages: MockDataUsage[] = [];
    const srcPath = path.join(process.cwd(), 'src');
    
    // Scan function
    const scanDirectory = (dirPath: string, basePath: string = '') => {
      try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const relativePath = path.join(basePath, item);
          
          // Skip node_modules, .git, and other non-source directories
          if (item.startsWith('.') || item === 'node_modules' || item === 'dist' || item === 'build') {
            continue;
          }
          
          if (fs.statSync(fullPath).isDirectory()) {
            scanDirectory(fullPath, relativePath);
          } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js') || item.endsWith('.jsx')) {
            scanFile(fullPath, relativePath);
          }
        }
      } catch (error: unknown) {
        console.error(`Error scanning directory ${dirPath}:`, error);
      }
    };

    const scanFile = (filePath: string, relativePath: string) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Mock data patterns to search for
        const mockPatterns = [
          /mock\s*data/i,
          /mockMetrics/i,
          /mockReport/i,
          /mockAlertsConfig/i,
          /const\s+mock\w+\s*=/i,
          /\/\/\s*mock/i,
          /fallback\s+to\s+mock/i,
          /using\s+mock/i,
          /hardcoded/i
        ];

        const foundMockLines: string[] = [];
        let hasApiCall = false;
        let hasApiEndpoint = '';
        
        // Scan each line
        lines.forEach((line, index) => {
          const trimmedLine = String(line).trim();
          
          // Check for mock data patterns
          if (mockPatterns.some(pattern => pattern.test(trimmedLine))) {
            foundMockLines.push(`Line ${index + 1}: ${trimmedLine.substring(0, 100)}`);
          }
          
          // Check for API calls
          if (trimmedLine.includes('fetch(') && trimmedLine.includes('/api/')) {
            hasApiCall = true;
            const apiMatch = trimmedLine.match(/['"`]([/\w\-]+)['"`]/);
            if (apiMatch) {
              hasApiEndpoint = apiMatch[1];
            }
          }
        });

        // If we found mock data usage
        if (foundMockLines.length > 0) {
          const normalizedPath = relativePath.replace(/\\/g, '/');
          
          // Skip mock-data-tracker files from showing themselves
          if (normalizedPath.includes('mock-data-tracker') || normalizedPath.includes('mock-data-scan')) {
            return;
          }
          
          // Determine file type
          let fileType: 'component' | 'page' | 'api' = 'component';
          if (normalizedPath.includes('/pages/') || normalizedPath.includes('/app/') && normalizedPath.endsWith('page.tsx')) {
            fileType = 'page';
          } else if (normalizedPath.includes('/api/')) {
            fileType = 'api';
          }

          // Determine status and priority
          let status: 'mock_only' | 'mixed' | 'api_fallback' = 'mock_only';
          let priority: 'high' | 'medium' | 'low' = 'medium';
          
          if (hasApiCall) {
            status = content.toLowerCase().includes('fallback') ? 'api_fallback' : 'mixed';
            priority = status === 'api_fallback' ? 'medium' : 'low';
          } else {
            priority = fileType === 'page' ? 'high' : 'medium';
          }

          // Generate route path for pages
          let routePath = normalizedPath;
          if (fileType === 'page') {
            routePath = normalizedPath
              .replace('src/app', '')
              .replace('/page.tsx', '')
              .replace('/page.ts', '') || '/';
            if (routePath === '') routePath = '/';
          } else if (fileType === 'api') {
            routePath = normalizedPath
              .replace('src/app', '')
              .replace('/route.tsx', '')
              .replace('/route.ts', '');
          }

          // Create description
          const mockCount = foundMockLines.length;
          const description = `${fileType === 'page' ? 'Page' : fileType === 'api' ? 'API endpoint' : 'Component'} contains ${mockCount} mock data ${mockCount === 1 ? 'reference' : 'references'}${hasApiCall ? ' with API integration' : ''}`;

          mockDataUsages.push({
            file: `src/${normalizedPath}`,
            path: routePath,
            type: fileType,
            status,
            description,
            mockDataLines: foundMockLines.slice(0, 5), // Limit to first 5 matches
            apiEndpoint: hasApiEndpoint || undefined,
            lastChecked: new Date().toISOString(),
            priority
          });
        }
      } catch (error: unknown) {
        console.error(`Error scanning file ${filePath}:`, error);
      }
    };

    // Start scanning
    scanDirectory(srcPath);

    // Calculate summary
    const totalFiles = mockDataUsages.length;
    const mockOnlyFiles = mockDataUsages.filter(usage => usage.status === 'mock_only').length;
    const apiFallbackFiles = mockDataUsages.filter(usage => usage.status === 'api_fallback').length;
    const mixedFiles = mockDataUsages.filter(usage => usage.status === 'mixed').length;

    const report: MockDataReport = {
      totalFiles,
      mockOnlyFiles,
      mixedFiles,
      apiFallbackFiles,
      usage: mockDataUsages.sort((a, b) => {
        // Sort by priority (high first), then by status
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        const statusOrder = { 'mock_only': 0, 'api_fallback': 1, 'mixed': 2 };
        
        if priorityOrder[((a.priority)] !== priorityOrder[(b.priority)]) {
          return priorityOrder[(a.priority)] - priorityOrder[(b.priority)];
        }
        return statusOrder[(a.status)] - statusOrder[(b.status)];
      }),
      timestamp: new Date().toISOString()
    };

    console.log(`Mock data scan completed: Found ${totalFiles} files with mock data usage`);
    
    return NextResponse.json(report);
  } catch (error: unknown) {
    console.error('Error during mock data scan:', error);
    return NextResponse.json(
      { error: 'Failed to scan for mock data usage', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 