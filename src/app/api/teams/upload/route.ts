import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/teams/upload
 * Upload files for team knowledge base
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teamId = formData.get('teamId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'teams', teamId);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const extension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${extension}`;
    const filePath = join(uploadDir, uniqueFilename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/teams/${teamId}/${uniqueFilename}`;

    return NextResponse.json({
      url: publicUrl,
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}