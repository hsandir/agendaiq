import { NextResponse } from "next/server";

// Utility to validate if a value is a valid enum member
export function isValidEnumValue<T extends object>(enumObj: T, value: unknown): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T]);
}

// Standard error response for API routes
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Try/catch wrapper for API handlers
export async function withApiErrorHandling<T>(fn: () => Promise<T | Response>) {
  try {
    return await fn();
  } catch (error: unknown) {
    if (error instanceof Error) {
      return apiError(error.message, 500);
    }
    return apiError('Unknown error', 500);
  }
} 