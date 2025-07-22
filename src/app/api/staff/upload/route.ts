import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";
import { z } from "zod";

// Enhanced interfaces for preview system
interface ConflictItem {
  field: string;
  existing: any;
  new: any;
  action: string;
}

interface ActionItem {
  id: string;
  label: string;
  type: string;
}

interface ExistingData {
  name: string;
  staffId: string;
  role: string;
  department: string;
}

interface ProcessedRecord {
  rowNumber: number;
  email: string;
  name: string;
  staffId: string;
  role: string;
  department: string;
  errors: string[];
  warnings: string[];
  status: 'create' | 'update' | 'unknown';
  existingData: ExistingData | null;
  conflicts: ConflictItem[];
  canUpload: boolean;
  actions: ActionItem[];
}

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

export async function POST(request: NextRequest) {
  try {
    // REQUIRED: Auth check - Leadership required for staff upload
    const authResult = await withAuth(request, { requireLeadership: true });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const user = authResult.user!;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const action = formData.get('action') as string; // 'preview' or 'upload'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Parse CSV file
    const text = await file.text();
    let records: any[];

    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid CSV format. Please check your file and try again.' 
      }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ 
        error: 'CSV file is empty or has no valid data rows.' 
      }, { status: 400 });
    }

    // Validate CSV headers
    const expectedHeaders = ['Email', 'Name', 'StaffId', 'Role', 'Department'];
    const fileHeaders = Object.keys(records[0]);
    const headerValidation = validateCsvHeaders(fileHeaders);
    
    if (!headerValidation.isValid) {
      return NextResponse.json({
        error: 'Invalid CSV headers',
        details: headerValidation.errors,
        expectedHeaders: expectedHeaders,
        receivedHeaders: fileHeaders
      }, { status: 400 });
    }

    // Get all existing roles and departments for validation
    const existingRoles = await prisma.role.findMany();
    const existingDepartments = await prisma.department.findMany();
    
    const validRoles = existingRoles.map((r: any) => r.title);
    const validDepartments = existingDepartments.map((d: any) => d.name);

    // Get the admin's school and district for creating staff records
    const adminStaff = user.staff!;

    // Process records for preview or upload
    const processedRecords: ProcessedRecord[] = [];
    const validationErrors: string[] = [];
    const conflictRecords: ProcessedRecord[] = [];
    const validRecords: ProcessedRecord[] = [];
    const processedEmails = new Set<string>();

    for (const [index, record] of records.entries()) {
      const rowNumber = index + 1;
      const recordErrors: string[] = [];
      const recordWarnings: string[] = [];

      try {
        // Basic validation
        if (!record.Email || !emailSchema.safeParse(record.Email).success) {
          recordErrors.push('Invalid email format');
        }
        if (!record.Name || record.Name.trim().length === 0) {
          recordErrors.push('Name is required');
        }
        if (!record.StaffId || !staffIdSchema.safeParse(record.StaffId).success) {
          recordErrors.push('Staff ID must be 3-15 characters');
        }
        if (!record.Role || record.Role.trim().length === 0) {
          recordErrors.push('Role is required');
        }
        if (!record.Department || record.Department.trim().length === 0) {
          recordErrors.push('Department is required');
        }

        // Check for duplicate emails in the file
        if (processedEmails.has(record.Email)) {
          recordErrors.push('Duplicate email in file');
        } else {
          processedEmails.add(record.Email);
        }

        // Validate role exists
        if (record.Role && !validRoles.includes(record.Role)) {
          recordErrors.push(`Invalid role "${record.Role}". Valid roles: ${validRoles.slice(0, 3).join(', ')}...`);
        }

        // Validate department exists
        if (record.Department && !validDepartments.includes(record.Department)) {
          recordErrors.push(`Invalid department "${record.Department}". Valid departments: ${validDepartments.slice(0, 3).join(', ')}...`);
        }

        // Check if email already exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: record.Email },
          include: { 
            Staff: {
              include: {
                Role: true, 
                Department: true
              }
            }
          }
        });

        // Check if StaffId already exists (if not updating existing user)
        let existingStaffId = null;
        if (record.StaffId) {
          existingStaffId = await prisma.user.findFirst({
            where: { 
              staff_id: record.StaffId,
              id: { not: existingUser?.id }
            },
            include: {
              Staff: {
                include: {
                  Role: true
                }
              }
            }
          });
        }

        if (existingStaffId) {
          recordErrors.push(`Staff ID "${record.StaffId}" already exists for user ${existingStaffId.email}`);
        }

        const processedRecord: ProcessedRecord = {
          rowNumber,
          email: record.Email,
          name: record.Name,
          staffId: record.StaffId,
          role: record.Role,
          department: record.Department,
          errors: recordErrors,
          warnings: recordWarnings,
          status: 'unknown',
          existingData: null,
          conflicts: [],
          canUpload: recordErrors.length === 0,
          actions: []
        };

        if (existingUser) {
          // User exists - check for conflicts
          processedRecord.status = 'update';
          const existingStaff = existingUser.Staff[0];
          
          if (existingStaff) {
            processedRecord.existingData = {
              name: existingUser.name,
              staffId: existingUser.staff_id || '',
              role: existingStaff.Role.title,
              department: existingStaff.Department.name
            };

            // Check for conflicts
            const conflicts = [];
            if (record.Name !== existingUser.name) {
              conflicts.push({
                field: 'name',
                existing: existingUser.name,
                new: record.Name,
                action: 'update_name'
              });
            }
            if (record.StaffId !== existingUser.staff_id) {
              conflicts.push({
                field: 'staffId',
                existing: existingUser.staff_id,
                new: record.StaffId,
                action: 'update_staff_id'
              });
            }
            if (record.Role !== existingStaff.Role.title) {
              conflicts.push({
                field: 'role',
                existing: existingStaff.Role.title,
                new: record.Role,
                action: 'change_role'
              });
            }
            if (record.Department !== existingStaff.Department.name) {
              conflicts.push({
                field: 'department',
                existing: existingStaff.Department.name,
                new: record.Department,
                action: 'change_department'
              });
            }

            processedRecord.conflicts = conflicts;
            if (conflicts.length > 0) {
              processedRecord.warnings.push(`${conflicts.length} field(s) will be updated`);
            }

            // Add possible actions
            processedRecord.actions = [
              { id: 'update', label: 'Update All Changes', type: 'primary' },
              { id: 'skip', label: 'Skip This User', type: 'secondary' },
              { id: 'partial', label: 'Select Changes', type: 'tertiary' }
            ];
          } else {
            // User exists but no staff record
            processedRecord.warnings.push('User exists but has no staff record - will create staff');
            processedRecord.actions = [
              { id: 'create_staff', label: 'Create Staff Record', type: 'primary' },
              { id: 'skip', label: 'Skip This User', type: 'secondary' }
            ];
          }
        } else {
          // New user
          processedRecord.status = 'create';
          processedRecord.actions = [
            { id: 'create', label: 'Create New User', type: 'primary' },
            { id: 'skip', label: 'Skip This User', type: 'secondary' }
          ];
        }

        if (recordErrors.length === 0) {
          validRecords.push(processedRecord);
        } else {
          conflictRecords.push(processedRecord);
        }

        processedRecords.push(processedRecord);

      } catch (error) {
        let errorMessage = 'Processing error';
        
        if (error instanceof Error) {
          // Handle specific Prisma errors with user-friendly messages
          if (error.message.includes('Unknown argument')) {
            errorMessage = 'Database field validation error - please check your data format';
          } else if (error.message.includes('Invalid `prisma.')) {
            errorMessage = 'Database query error - invalid data format detected';
          } else if (error.message.includes('Unique constraint')) {
            errorMessage = 'Duplicate data detected - email or staff ID already exists';
          } else if (error.message.includes('Foreign key constraint')) {
            errorMessage = 'Invalid role or department - please use valid system values';
          } else {
            errorMessage = `Data validation error: ${error.message.split('\n')[0]}`;
          }
        }
        
        validationErrors.push(`Row ${rowNumber}: ${errorMessage}`);
      }
    }

    // Return preview data
    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        preview: processedRecords,
        summary: {
          total: processedRecords.length,
          valid: validRecords.length,
          conflicts: conflictRecords.length,
          errors: validationErrors.length
        },
        validationErrors,
        canUploadAll: validRecords.length > 0,
        canUploadValid: validRecords.length > 0 && conflictRecords.length > 0
      });
    }

    // Handle upload action
    if (action === 'upload') {
      if (validRecords.length === 0) {
        return NextResponse.json({
          error: 'No valid records to upload',
          details: validationErrors
        }, { status: 400 });
      }

      let created = 0;
      let updated = 0;
      const uploadErrors: string[] = [];

      for (const record of validRecords) {
        try {
          const role = existingRoles.find((r: any) => r.title === record.role);
          const department = existingDepartments.find((d: any) => d.name === record.department);

          if (!role || !department) {
            uploadErrors.push(`Row ${record.rowNumber}: Role or department not found`);
            continue;
          }

          const existingUser = await prisma.user.findUnique({
            where: { email: record.email },
            include: { Staff: true }
          });

          if (existingUser) {
            // Update existing user
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { 
                name: record.name,
                staff_id: record.staffId
              }
            });

            if (existingUser.Staff.length > 0) {
              await prisma.staff.update({
                where: { id: existingUser.Staff[0].id },
                data: {
                  role_id: role.id,
                  department_id: department.id
                }
              });
            } else {
              await prisma.staff.create({
                data: {
                  user_id: existingUser.id,
                  role_id: role.id,
                  department_id: department.id,
                  school_id: adminStaff.school.id,
                  district_id: adminStaff.district.id,
                }
              });
            }
            updated++;
          } else {
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                email: record.email,
                name: record.name,
                staff_id: record.staffId,
                emailVerified: new Date()
              }
            });

            await prisma.staff.create({
              data: {
                user_id: newUser.id,
                role_id: role.id,
                department_id: department.id,
                school_id: adminStaff.school.id,
                district_id: adminStaff.district.id,
              }
            });
            created++;
          }
        } catch (error) {
          uploadErrors.push(`Row ${record.rowNumber}: ${error instanceof Error ? error.message : 'Upload failed'}`);
        }
      }

      return NextResponse.json({
        success: true,
        created,
        updated,
        errors: uploadErrors,
        message: `Successfully processed ${created + updated} records (${created} created, ${updated} updated)`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Staff upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 