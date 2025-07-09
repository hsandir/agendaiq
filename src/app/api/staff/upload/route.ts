import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { parse } from "csv-parse/sync";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().email("Invalid email format");
const staffIdSchema = z.string().min(3, "Staff ID must be at least 3 characters").max(15, "Staff ID must be at most 15 characters");

// Record validation schema
const recordSchema = z.object({
  Email: z.string().email("Invalid email format"),
  Name: z.string().min(1, "Name is required"),
  StaffId: z.string().min(3, "Staff ID must be at least 3 characters").max(15, "Staff ID must be at most 15 characters"),
  Role: z.string().min(1, "Role is required"),
  Department: z.string().min(1, "Department is required"),
});

// Helper function to validate CSV headers
function validateCsvHeaders(headers: string[]): { isValid: boolean; errors: string[] } {
  const requiredHeaders = ['Email', 'Name', 'StaffId', 'Role', 'Department'];
  const errors: string[] = [];
  
  // Check for missing headers
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
  }
  
  // Check for extra headers
  const extraHeaders = headers.filter(h => !requiredHeaders.includes(h));
  if (extraHeaders.length > 0) {
    errors.push(`Unexpected columns found: ${extraHeaders.join(', ')}`);
  }
  
  // Check header order
  if (headers.length === requiredHeaders.length) {
    const isOrderCorrect = requiredHeaders.every((h, i) => headers[i] === h);
    if (!isOrderCorrect) {
      errors.push('Column order must be: Email, Name, StaffId, Role, Department');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Check if user is admin using staff relationship
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        staff: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || !user.staff?.[0] || user.staff[0].role?.title !== "Administrator") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can upload staff data." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const preview = formData.get("preview") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please select a CSV file to upload." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a CSV file." },
        { status: 400 }
      );
    }

    const text = await file.text();
    if (!text.trim()) {
      return NextResponse.json(
        { error: "The uploaded file is empty." },
        { status: 400 }
      );
    }

    // Parse CSV and validate headers
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No valid records found in file. Please ensure the file contains data and has the correct format." },
        { status: 400 }
      );
    }

    // Validate headers
    const headers = Object.keys(records[0]);
    const headerValidation = validateCsvHeaders(headers);
    if (!headerValidation.isValid) {
      return NextResponse.json(
        { 
          error: "Invalid CSV format",
          details: headerValidation.errors,
          help: "Please use the template file from the 'Download Template' button to ensure correct format."
        },
        { status: 400 }
      );
    }

    // Get all existing roles and departments for validation
    const existingRoles = await prisma.role.findMany();
    const existingDepartments = await prisma.department.findMany();
    
    const validRoles = existingRoles.map(r => r.title);
    const validDepartments = existingDepartments.map(d => d.name);

    // Get the admin's school and district for creating staff records
    const adminStaff = user.staff[0];

    // Validate records
    const validationErrors: string[] = [];
    const previewData: any[] = [];
    const processedEmails = new Set<string>();

    for (const [index, record] of records.entries()) {
      try {
        // Validate record structure
        const validatedRecord = recordSchema.parse(record);
        
        // Check for duplicate emails in the file
        if (processedEmails.has(record.Email)) {
          validationErrors.push(`Row ${index + 1}: Duplicate email "${record.Email}" found in file`);
          continue;
        }
        processedEmails.add(record.Email);

        // Check if email already exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: record.Email },
          include: { 
            staff: {
              include: {
                role: true, 
                department: true
              }
            }
          }
        });

        // Validate role and department if they don't exist
        if (!validRoles.includes(record.Role)) {
          validationErrors.push(`Row ${index + 1}: Role "${record.Role}" is not a valid role. Valid roles are: ${validRoles.join(', ')}`);
        }
        if (!validDepartments.includes(record.Department)) {
          validationErrors.push(`Row ${index + 1}: Department "${record.Department}" is not a valid department. Valid departments are: ${validDepartments.join(', ')}`);
        }

        // Prepare preview data
        previewData.push({
          email: record.Email,
          name: record.Name,
          staffId: record.StaffId,
          role: record.Role,
          department: record.Department,
          status: existingUser ? "update" : "create",
          existingData: existingUser?.staff?.[0] ? {
            name: existingUser.name,
            role: existingUser.staff[0].role?.title,
            department: existingUser.staff[0].department?.name
          } : null
        });

        // If this is just a preview, skip processing
        if (preview) continue;

        // Find role and department
        const role = existingRoles.find(r => r.title === record.Role);
        const department = existingDepartments.find(d => d.name === record.Department);

        if (!role || !department) {
          validationErrors.push(`Row ${index + 1}: Could not find role "${record.Role}" or department "${record.Department}"`);
          continue;
        }

        // Create or update user and staff record
        if (existingUser) {
          // Update existing user
          await prisma.user.update({
            where: { email: record.Email },
            data: {
              name: record.Name,
            }
          });

          // Update staff record if exists, otherwise create one
          if (existingUser.staff && existingUser.staff.length > 0) {
            await prisma.staff.update({
              where: { id: existingUser.staff[0].id },
              data: {
                role_id: role.id,
                department_id: department.id,
              }
            });
          } else {
            await prisma.staff.create({
              data: {
                user_id: existingUser.id,
                role_id: role.id,
                department_id: department.id,
                school_id: adminStaff.school_id,
                district_id: adminStaff.district_id,
              }
            });
          }
        } else {
          // Create new user and staff record
          const newUser = await prisma.user.create({
            data: {
              email: record.Email,
              name: record.Name,
            }
          });

          await prisma.staff.create({
            data: {
              user_id: newUser.id,
              role_id: role.id,
              department_id: department.id,
              school_id: adminStaff.school_id,
              district_id: adminStaff.district_id,
            }
          });
        }

      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = error.errors.map(e => {
            const field = e.path[0];
            return `${field}: ${e.message}`;
          });
          validationErrors.push(`Row ${index + 1}: ${fieldErrors.join(', ')}`);
        } else {
          validationErrors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: "Validation errors found in the uploaded file",
          details: validationErrors,
          help: "Please correct the errors and try again. You can use the preview feature to check your data before uploading.",
          preview: preview ? previewData : undefined
        },
        { status: 400 }
      );
    }

    if (preview) {
      return NextResponse.json({
        message: "Preview generated successfully",
        preview: previewData,
        count: previewData.length
      });
    }

    return NextResponse.json({
      message: "Staff data uploaded successfully",
      count: records.length,
      preview: previewData
    });
  } catch (error) {
    console.error("Error uploading staff data:", error);
    return NextResponse.json(
      { error: "Failed to process staff data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 