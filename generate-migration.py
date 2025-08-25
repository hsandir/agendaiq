#!/usr/bin/env python3

import re

# Read backup file
with open('./backups/backup_20250823_160710.sql', 'r') as f:
    content = f.read()

# Find users section
users_match = re.search(r'COPY public\.users.*?FROM stdin;\n(.*?)\n\\\.', content, re.DOTALL)
if not users_match:
    print("Users section not found!")
    exit(1)

users_data = users_match.group(1).strip().split('\n')

print("-- Auto-generated migration from backup")
print("-- All cjcollegeprep users with field name transformation")
print()
print("INSERT INTO users (")
print("    id, email, name, staff_id, hashed_password, email_verified, image,")  
print("    is_admin, is_system_admin, is_school_admin, two_factor_enabled,")
print("    two_factor_secret, backup_codes, login_notifications_enabled,")
print("    suspicious_alerts_enabled, remember_devices_enabled,")
print("    created_at, updated_at, theme_preference, layout_preference, custom_theme")
print(") VALUES")

values = []
for line in users_data:
    if not line.strip():
        continue
        
    parts = line.split('\t')
    if len(parts) >= 21:  # Ensure we have enough columns
        # Transform the data - handle NULL values and quotes
        id_val = parts[0]
        email = f"'{parts[1]}'"
        name = f"'{parts[2]}'" if parts[2] != '\\N' else 'NULL'
        staff_id = f"'{parts[3]}'" if parts[3] != '\\N' else 'NULL'
        hashed_password = f"'{parts[4]}'" if parts[4] != '\\N' else 'NULL'
        email_verified = f"'{parts[5]}'" if parts[5] != '\\N' else 'NULL'
        image = f"'{parts[6]}'" if parts[6] != '\\N' else 'NULL'
        is_admin = 'true' if parts[7] == 't' else 'false'
        is_system_admin = 'true' if parts[8] == 't' else 'false'
        is_school_admin = 'true' if parts[9] == 't' else 'false'
        two_factor_enabled = 'true' if parts[10] == 't' else 'false'
        two_factor_secret = f"'{parts[11]}'" if parts[11] != '\\N' else 'NULL'
        backup_codes = f"'{parts[12]}'" if parts[12] != '{}' else "'{}'"
        login_notifications = 'true' if parts[13] == 't' else 'false'
        suspicious_alerts = 'true' if parts[14] == 't' else 'false'
        remember_devices = 'true' if parts[15] == 't' else 'false'
        created_at = f"'{parts[16]}'"
        updated_at = f"'{parts[17]}'"
        theme_preference = f"'{parts[18]}'" if parts[18] != '\\N' else 'NULL'
        layout_preference = f"'{parts[19]}'" if parts[19] != '\\N' else 'NULL'
        custom_theme = f"'{parts[20]}'" if parts[20] != '\\N' else 'NULL'
        
        value_str = f"({id_val}, {email}, {name}, {staff_id}, {hashed_password}, {email_verified}, {image}, {is_admin}, {is_system_admin}, {is_school_admin}, {two_factor_enabled}, {two_factor_secret}, {backup_codes}, {login_notifications}, {suspicious_alerts}, {remember_devices}, {created_at}, {updated_at}, {theme_preference}, {layout_preference}, {custom_theme})"
        values.append(value_str)

# Print all values
for i, value in enumerate(values):
    if i == len(values) - 1:
        print(value + ";")  # Last one gets semicolon
    else:
        print(value + ",")  # Others get comma

print()
print("-- Update sequence")
print("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users) + 1);")