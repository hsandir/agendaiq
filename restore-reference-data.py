#!/usr/bin/env python3

import re

# Read backup file
with open('./backups/backup_20250823_160710.sql', 'r') as f:
    content = f.read()

def extract_table_data(table_name, pattern_override=None):
    if pattern_override:
        pattern = pattern_override
    else:
        pattern = rf'COPY public\."{table_name}".*?FROM stdin;\n(.*?)\n\\\.'
    
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print(f"-- {table_name} section not found!")
        return []
        
    return match.group(1).strip().split('\n')

# Extract District data
print("-- Restore reference data")
print()

district_data = extract_table_data("District")
if district_data and district_data[0]:
    print("INSERT INTO district (id, name, code, state, created_at) VALUES")
    values = []
    for line in district_data:
        if line.strip():
            parts = line.split('\t')
            if len(parts) >= 5:
                values.append(f"({parts[0]}, '{parts[1]}', '{parts[2]}', '{parts[3]}', '{parts[4]}')")
    print(',\n'.join(values) + ';')
    print()

# Extract School data  
school_data = extract_table_data("School")
if school_data and school_data[0]:
    print("INSERT INTO school (id, name, district_id, address, phone, email, website, principal_id, created_at) VALUES")
    values = []
    for line in school_data:
        if line.strip():
            parts = line.split('\t')
            if len(parts) >= 9:
                principal_id = parts[7] if parts[7] != '\\N' else 'NULL'
                values.append(f"({parts[0]}, '{parts[1]}', {parts[2]}, '{parts[3]}', '{parts[4]}', '{parts[5]}', '{parts[6]}', {principal_id}, '{parts[8]}')")
    print(',\n'.join(values) + ';')
    print()

# Extract Department data
department_data = extract_table_data("Department") 
if department_data and department_data[0]:
    print("INSERT INTO department (id, code, name, category, school_id, created_at, level, parent_id) VALUES")
    values = []
    for line in department_data:
        if line.strip():
            parts = line.split('\t')
            if len(parts) >= 8:
                parent_id = parts[7] if parts[7] != '\\N' else 'NULL'
                values.append(f"({parts[0]}, '{parts[1]}', '{parts[2]}', '{parts[3]}', {parts[4]}, '{parts[5]}', {parts[6]}, {parent_id})")
    print(',\n'.join(values) + ';')
    print()

# Extract Role data
role_data = extract_table_data("Role")
if role_data and role_data[0]:
    print("INSERT INTO role (id, key, title, description, category, color, level, school_id, district_id, department_id, created_at, is_system_role) VALUES")
    values = []
    for line in role_data:
        if line.strip():
            parts = line.split('\t')
            if len(parts) >= 12:
                description = f"'{parts[3]}'" if parts[3] != '\\N' else 'NULL'
                school_id = parts[7] if parts[7] != '\\N' else 'NULL'
                district_id = parts[8] if parts[8] != '\\N' else 'NULL' 
                department_id = parts[9] if parts[9] != '\\N' else 'NULL'
                is_system = 'true' if parts[11] == 't' else 'false'
                values.append(f"({parts[0]}, '{parts[1]}', '{parts[2]}', {description}, '{parts[4]}', '{parts[5]}', {parts[6]}, {school_id}, {district_id}, {department_id}, '{parts[10]}', {is_system})")
    print(',\n'.join(values) + ';')
    print()

print("-- Update sequences")
print("SELECT setval('district_id_seq', (SELECT MAX(id) FROM district) + 1);")
print("SELECT setval('school_id_seq', (SELECT MAX(id) FROM school) + 1);") 
print("SELECT setval('department_id_seq', (SELECT MAX(id) FROM department) + 1);")
print("SELECT setval('role_id_seq', (SELECT MAX(id) FROM role) + 1);")