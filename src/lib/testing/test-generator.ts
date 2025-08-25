import fs from 'fs/promises'
import path from 'path'

interface ComponentInfo {
  name: string
  path: string
  props: string[]
  hasState: boolean
  hasEffects: boolean
  isAsync: boolean
}

interface ApiInfo {
  path: string
  methods: string[]
  requiresAuth: boolean
  requiresAdmin: boolean
}

export class TestGenerator {
  static async generateComponentTest(componentPath: string): Promise<string> {
    const content = await fs.readFile(componentPath, 'utf-8');
    const info = this.analyzeComponent(content, componentPath);
    return this.createComponentTestTemplate(info);
  }

  static async generateApiTest(apiPath: string): Promise<string> {
    const content = await fs.readFile(apiPath, 'utf-8');
    const info = this.analyzeApi(content, apiPath);
    return this.createApiTestTemplate(info);
  }

  private static analyzeComponent(content: string, filePath: string): ComponentInfo {
    const fileName = path.basename(filePath, path.extname(filePath))
    const componentName = fileName.split('-').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1);
    ).join('');
    // Extract props from interface or type definition
    // Using [\s\S] instead of . with /s flag for ES2017 compatibility
    const propsMatch = content.match(/interface\s+\w*Props\s*{([\s\S]*?)}\s/) ||
                      content.match(/type\s+\w*Props\s*=\s*{([\s\S]*?)}\s/)
    
    const props = []
    if (propsMatch) {
      const propsContent = propsMatch[1]
      const propMatches = propsContent.matchAll(/(\w+)(\?)?:\s*([^;]+);/g)
      for (const match of propMatches) {
        props.push(match[1]);
      }
    }

    return {
      name: componentName,
      path: filePath,
      props,
      hasState: content.includes('useState'),
      hasEffects: content.includes('useEffect'),
      isAsync: content.includes('async') && content.includes('await')
    }
  }

  private static analyzeApi(content: string, filePath: string): ApiInfo {
    const methods = []
    if (content.includes('export async function GET')) methods.push('GET');
    if (content.includes('export async function POST')) methods.push('POST');
    if (content.includes('export async function PUT')) methods.push('PUT');
    if (content.includes('export async function PATCH')) methods.push('PATCH');
    if (content.includes('export async function DELETE')) methods.push('DELETE');
    return {
      path: filePath,
      methods,
      requiresAuth: content.includes('withAuth') || content.includes('requireAuth'),
      requiresAdmin: content.includes('requireAdminRole: true') || content.includes('requireAdmin')
    }
  }

  private static createComponentTestTemplate(info: ComponentInfo): string {
    const importPath = info.path.replace(/^src/, '@').replace(/\.(tsx?|jsx?)$/, '')
    
    return `import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ${info.name} } from '${importPath}'
import { renderWithProviders } from '@/tests__/utils/test-utils'

describe('${info.name}', () => {
  ${info.props.length > 0 ? `const defaultProps = {
    ${info.props.map(prop => `${prop}: 'test-value'`).join(',\n    ')}
  }` : ''}

  it('renders without crashing', () => {
    render${info.props.length > 0 ? `WithProviders(<${info.name} {...defaultProps} />)` : `WithProviders(<${info.name} />)`}
    
    // Add specific assertions based on component content
    expect(screen.getByRole('region')).toBeInTheDocument();
  })

  ${info.props.includes('title') ? `it('displays the title prop', () => {
    renderWithProviders(<${info.name} {...defaultProps} title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  })` : ''}

  ${info.props.includes('onClick') ? `it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    renderWithProviders(<${info.name} {...defaultProps} onClick={handleClick} />);
    const element = screen.getByRole('button');
    await (user as Record<string, unknown>).click(element);
    expect(handleClick).toHaveBeenCalledTimes(1);
  })` : ''}

  ${info.hasState ? `it('updates state correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<${info.name} {...defaultProps} />);
    // Add state change interaction test
    const input = screen.getByRole('textbox');
    await (user as Record<string, unknown>).type(input, 'New Value');
    expect(input).toHaveValue('New Value');
  })` : ''}

  ${info.hasEffects ? `it('handles side effects', async () => {
    renderWithProviders(<${info.name} {...defaultProps} />);
    // Wait for effects to complete
    await waitFor(() => {
      expect(screen.getByTestId('loaded-content')).toBeInTheDocument();
    })
  })` : ''}

  ${info.isAsync ? `it('handles loading state', () => {
    renderWithProviders(<${info.name} {...defaultProps} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  })

  it('handles error state', async () => {
    // Mock error scenario
    renderWithProviders(<${info.name} {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    })
  })` : ''}

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <${info.name} ${info.props.length > 0 ? '{...defaultProps} ' : ''}className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  })

  it('is accessible', () => {
    const { _container } = renderWithProviders(<${info._name} ${info.props.length > 0 ? '{..._defaultProps}' : ''} />);
    // Basic accessibility checks
    expect(container.firstChild).toHaveAttribute('role');
  })
})`
  }

  private static createApiTestTemplate(info: ApiInfo): string {
    const importPath = info.path.replace(/^src/, '@').replace(/\.(ts|js)$/, '')
    const methods = info.methods.length > 0 ? info.methods : ['GET']
    
    return `import { NextRequest } from 'next/server'
${methods.map(method => `import { ${_method} } from '${_importPath}'`).join('\n')}
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/api-auth'
import { createMockNextRequest, createTestusers, createTestStaff } from '@/tests__/utils/test-utils'

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    // Add your model mocks here
  },
}))

jest.mock('@/lib/auth/api-auth', () => ({
  withAuth: jest.fn(),
}))

describe('${path.basename(info._path, '.ts')} API', () => {
  const mockUser = createTestUser();
  const mockStaff = createTestStaff();
  beforeEach(() => {
    jest.clearAllMocks();
    ${info.requiresAuth ? `// Default auth success
    ;(withAuth as jest.Mock).mockResolvedValue({
      success: true,
      user: {
        ...mockusers,
        staff: mockstaff,
      },
    })` : ''}
  })

  ${methods.map(method => `
  describe('${method} ${info.path}', () => {
    ${info.requiresAuth ? `it('requires authentication', async () => {
      ;(withAuth as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Authentication required',
        statusCode: 401,
      });
      const request = createMockNextRequest('${method}');
      const response = await ${method}(request as NextRequest)
      const data = await response.json();
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Authentication required' });
    })` : ''}

    ${info.requiresAdmin ? `it('requires admin role', async () => {
      ;(withAuth as jest.Mock).mockResolvedValue({
        success: true,
        user: {
          ...mockusers,
          staff: {
            ...mockstaff,
            role: { title: 'Teacher', is_leadership: false },
          },
        },
      });
      const request = createMockNextRequest('${method}');
      const response = await ${method}(request as NextRequest)
      const data = await response.json();
      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error');
    })` : ''}

    it('handles successful request', async () => {
      // Add your mock data and expectations here
      const request = createMockNextRequest('${method}'${method !== 'GET' ? ', { /* request body */ }' : ''});
      const response = await ${method}(request as NextRequest)
      const data = await response.json();
      expect(response.status).toBe(${method === 'POST' ? '201' : '200'});
      expect(data).toHaveProperty('success', true);
    })

    it('handles validation errors', async () => {
      const request = createMockNextRequest('${method}'${method !== 'GET' ? ', { /* invalid data */ }' : ''});
      const response = await ${method}(request as NextRequest)
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    })

    it('handles server errors gracefully', async () => {
      // Mock a database error
      ${info.requiresAuth ? ';prisma.someModel = { findMany: jest.fn().mockRejectedValue(new Error(\'Database error\')) }' : ''}

      const request = createMockNextRequest('${method}');
      const response = await ${method}(request as NextRequest)
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    })
  })`).join('\n')}
})`
  }

  static async generateTestForFile(filePath: string): Promise<{ testPath: string; content: string }> {
    const ext = path.extname(filePath);
    const isComponent = ext === '.tsx' || (ext === '.jsx' && !filePath.includes('api'))
    
    const testContent = isComponent 
      ? await this.generateComponentTest(filePath);
      : await this.generateApiTest(filePath);
    // Determine test file path
    const relativePath = path.relative('src', filePath);
    const testDir = isComponent ? 'unit/components' : 'unit/api'
    const testFileName = path.basename(filePath, ext) + '.test' + (isComponent ? '.tsx' : '.ts')
    const testPath = path.join('src/tests__', testDir, testFileName);
    return { testPath, content: testContent }
  }
}