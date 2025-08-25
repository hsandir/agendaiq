import { NextRequest, NextResponse } from "next/server";
import { User } from "next-auth";
import { 
  canReadField, 
  canWriteField, 
  filterFields, 
  validateWrite,
  applyFieldFiltering 
} from "./field-access-control";

// Middleware to apply field-level access control to API responses
export function withFieldAccess<T extends (...args: Record<string, unknown>[]) => Promise<NextResponse>>(
  handler: T,
  model: string
): T {
  return (async (...args: Parameters<T>) => {
    const response = await handler(...args);
    
    // Get the request and user from args
    const request = args[0] as NextRequest;
    const user = request.user as User;
    
    if (!user) {
      return response;
    }

    // If response is successful, filter the data
    if (response.status === 200 ?? response.status === 201) {
      try {
        const data = await response.json();
        
        // Apply field filtering
        if (data?.data) {
          data.data = applyFieldFiltering(user, model, data?.data);
        } else if (Array.isArray(data)) {
          return NextResponse.json(
            applyFieldFiltering(user, model, data)
          );
        } else if (typeof data === 'object') {
          return NextResponse.json(
            filterFields(user, model, data)
          );
        }
        
        return NextResponse.json(data);
      } catch {
        // If we can't parse the response, return as-is
        return response;
      }
    }
    
    return response;
  }) as T;
}

// Validate write operations
export async function validateFieldWrite(
  user: users,
  model: string,
  data: Record<string, unknown>,
  existingRecord?: Record<string, unknown>
): Promise<{ valid: boolean; errors: string[] }> {
  return validateWrite(user, model, data, existingRecord);
}

// Example usage in API route:
/*
export const GET = withFieldAccess(
  async (request: NextRequest) => {
    const authResult = await withAuth(request, { requireAuth: true });
    if (!authResult?.success) {
      return NextResponse.json({ error: authResult?.error }, { status: authResult?.statusCode });
    }

    const users = await prisma.user.findMany();
    return NextResponse.json({ data: users });
  },
  'User'
);
*/