#!/usr/bin/env python3

import re

# Read backup file
with open('./backups/backup_20250823_160710.sql', 'r') as f:
    content = f.read()

# Find Staff section - note the quotes around Staff
staff_match = re.search(r'COPY public\."Staff".*?FROM stdin;\n(.*?)\n\\\.', content, re.DOTALL)
if not staff_match:
    print("Staff section not found!")
    exit(1)

staff_data = staff_match.group(1).strip().split('\n')

print("-- Auto-generated Staff migration from backup")
print()
print("INSERT INTO staff (")
print("    id, user_id, department_id, role_id, manager_id, flags,")
print("    endorsements, school_id, district_id, created_at,")  
print("    extension, hire_date, is_active, room")
print(") VALUES")

values = []
for line in staff_data:
    if not line.strip():
        continue
        
    parts = line.split('\t')
    if len(parts) >= 14:  # Ensure we have enough columns
        # Transform the data - handle NULL values and arrays
        id_val = parts[0]
        user_id = parts[1] if parts[1] != '\\N' else 'NULL'
        department_id = parts[2] if parts[2] != '\\N' else 'NULL'
        role_id = parts[3] if parts[3] != '\\N' else 'NULL'
        manager_id = parts[4] if parts[4] != '\\N' else 'NULL'
        flags = f"'{parts[5]}'" if parts[5] != '\\N' else "'{}'"
        endorsements = f"'{parts[6]}'" if parts[6] != '\\N' else "'{}'"
        school_id = parts[7] if parts[7] != '\\N' else 'NULL'
        district_id = parts[8] if parts[8] != '\\N' else 'NULL'
        created_at = f"'{parts[9]}'"
        extension = parts[10] if parts[10] != '\\N' else 'NULL'
        hire_date = f"'{parts[11]}'" if parts[11] != '\\N' else 'NULL'
        is_active = 'true' if parts[12] == 't' else 'false'
        room = f"'{parts[13]}'" if parts[13] != '\\N' else 'NULL'
        
        value_str = f"({id_val}, {user_id}, {department_id}, {role_id}, {manager_id}, {flags}, {endorsements}, {school_id}, {district_id}, {created_at}, {extension}, {hire_date}, {is_active}, {room})"
        values.append(value_str)

# Print all values
for i, value in enumerate(values):
    if i == len(values) - 1:
        print(value + ";")  # Last one gets semicolon
    else:
        print(value + ",")  # Others get comma

print()
print("-- Update sequence")
print("SELECT setval('staff_id_seq', (SELECT MAX(id) FROM staff) + 1);")