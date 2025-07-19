# Auth Migration Report
Generated: 2025-07-19T05:30:12.791Z

## Summary
- **Total Files**: 189
- **Processed Files**: 189
- **Modified Files**: 63
- **Total Changes**: 87

### Change Breakdown
- Import Changes: 2
- Type Changes: 1
- Function Changes: 20
- Usage Changes: 64

## Detailed Changes


### src/types/next-auth.d.ts (Line 19)
**Rule**: Update User Type References
**Category**: type
**Description**: Replace User type with AuthenticatedUser where appropriate

**Before**:
```typescript
user: User & {
```

**After**:
```typescript
user: AuthenticatedUser & {
```


### src/lib/migration/error-diagnostic-system.ts (Line 294)
**Rule**: Standardize Auth Options Import
**Category**: import
**Description**: Replace old auth imports with new auth-options import

**Before**:
```typescript
import { authOptions } from '@/lib/auth';
```

**After**:
```typescript
import { authOptions } from '@/lib/auth/auth-options';
```


### src/lib/migration/auth-migration-system.ts (Line 100)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
description: 'Ensure session.user.id is handled as number',
```

**After**:
```typescript
description: 'Ensure user.id is handled as number',
```


### src/lib/auth/auth-utils.ts (Line 2)
**Rule**: Add Auth Utils Import
**Category**: import
**Description**: Add auth utils imports for authentication functions

**Before**:
```typescript
import { authOptions } from './auth-options';
```

**After**:
```typescript
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
```


### src/lib/auth/auth-utils.ts (Line 54)
**Rule**: Replace Manual Auth Checks
**Category**: function
**Description**: Replace manual auth checks with requireAuth patterns

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth); else {
```


### src/lib/auth/auth-options.ts (Line 119)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
if (token.id && typeof session.user.id !== 'undefined') {
```

**After**:
```typescript
if (token.id && typeof user.id !== 'undefined') {
```


### src/app/api/users/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/api/users/route.ts (Line 24)
**Rule**: Update Staff Access Pattern
**Category**: usage
**Description**: Update staff record access pattern

**Before**:
```typescript
if (!user || user.Staff?.[0]?.Role?.title !== "Administrator") {
```

**After**:
```typescript
if (!user || user.staff?.Role?.title !== "Administrator") {
```


### src/app/api/setup/route.ts (Line 39)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/setup/route.ts (Line 43)
**Rule**: Update Staff Access Pattern
**Category**: usage
**Description**: Update staff record access pattern

**Before**:
```typescript
if (!user || user.Staff?.[0]?.Role?.title !== 'Administrator') {
```

**After**:
```typescript
if (!user || user.staff?.Role?.title !== 'Administrator') {
```


### src/app/api/school/route.ts (Line 7)
**Rule**: Update API Auth Patterns
**Category**: function
**Description**: Replace manual API auth with APIAuthPatterns

**Before**:
```typescript
export async function GET(request: NextRequest) {
```

**After**:
```typescript
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
```


### src/app/api/school/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/api/roles/route.ts (Line 7)
**Rule**: Update API Auth Patterns
**Category**: function
**Description**: Replace manual API auth with APIAuthPatterns

**Before**:
```typescript
export async function GET(request: NextRequest) {
```

**After**:
```typescript
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
```


### src/app/api/roles/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/api/schools/route.ts (Line 49)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/errors/route.ts (Line 15)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/errors/route.ts (Line 19)
**Rule**: Update Staff Access Pattern
**Category**: usage
**Description**: Update staff record access pattern

**Before**:
```typescript
if (!user || user.Staff?.[0]?.Role?.title !== 'Administrator') {
```

**After**:
```typescript
if (!user || user.staff?.Role?.title !== 'Administrator') {
```


### src/app/api/departments/route.ts (Line 7)
**Rule**: Update API Auth Patterns
**Category**: function
**Description**: Replace manual API auth with APIAuthPatterns

**Before**:
```typescript
export async function GET(request: NextRequest) {
```

**After**:
```typescript
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
```


### src/app/api/departments/route.ts (Line 13)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/dashboard/meetings/[id]/actions.ts (Line 25)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/api/users/admin-update-department/route.ts (Line 19)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/users/admin/route.ts (Line 18)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/users/admin-update-role/route.ts (Line 18)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/user/toggle-suspicious-alerts/route.ts (Line 15)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email! },
```

**After**:
```typescript
where: { email: user.email! },
```


### src/app/api/user/toggle-remember-devices/route.ts (Line 16)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/user/toggle-login-notifications/route.ts (Line 15)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email! },
```

**After**:
```typescript
where: { email: user.email! },
```


### src/app/api/user/switch-role/route.ts (Line 28)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/api/user/set-password/route.ts (Line 27)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email! },
```

**After**:
```typescript
where: { email: user.email! },
```


### src/app/api/user/send-verification/route.ts (Line 17)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email! },
```

**After**:
```typescript
where: { email: user.email! },
```


### src/app/api/user/school/route.ts (Line 15)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/user/revoke-device/route.ts (Line 32)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
if (!device || device.user_id !== session.user.id) {
```

**After**:
```typescript
if (!device || device.user_id !== user.id) {
```


### src/app/api/user/revoke-all-sessions/route.ts (Line 17)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
userId: session.user.id,
```

**After**:
```typescript
userId: user.id,
```


### src/app/api/user/profile/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/api/user/enable-2fa/route.ts (Line 20)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email! },
```

**After**:
```typescript
where: { email: user.email! },
```


### src/app/api/user/disable-2fa/route.ts (Line 16)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email! },
```

**After**:
```typescript
where: { email: user.email! },
```


### src/app/api/user/change-password/route.ts (Line 27)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email! },
```

**After**:
```typescript
where: { email: user.email! },
```


### src/app/api/user/admin-update-role/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/user/admin-update-department/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/staff/upload/route.ts (Line 64)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/api/setup/init/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/roles/hierarchy/route.ts (Line 7)
**Rule**: Update API Auth Patterns
**Category**: function
**Description**: Replace manual API auth with APIAuthPatterns

**Before**:
```typescript
export async function GET(request: NextRequest) {
```

**After**:
```typescript
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
```


### src/app/api/roles/hierarchy/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/api/district/setup/route.ts (Line 19)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/district/setup/route.ts (Line 23)
**Rule**: Update Staff Access Pattern
**Category**: usage
**Description**: Update staff record access pattern

**Before**:
```typescript
if (!user || !user.Staff?.[0]?.Role?.title || user.Staff[0].Role.title !== "Administrator") {
```

**After**:
```typescript
if (!user || !user.staff?.Role?.title || user.Staff[0].Role.title !== "Administrator") {
```


### src/app/api/system/logs/route.ts (Line 131)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
details: `Requested by ${session.user.email}`
```

**After**:
```typescript
details: `Requested by ${user.email}`
```


### src/app/api/system/alerts/route.ts (Line 6)
**Rule**: Update API Auth Patterns
**Category**: function
**Description**: Replace manual API auth with APIAuthPatterns

**Before**:
```typescript
export async function GET(request: NextRequest) {
```

**After**:
```typescript
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
```


### src/app/api/admin/toggle-role/route.ts (Line 18)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/admin/assign-role/route.ts (Line 56)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/admin/roles/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/api/users/[userId]/role/route.ts (Line 18)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/users/[userId]/department/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/user/2fa/verify/route.ts (Line 23)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/user/2fa/setup/route.ts (Line 21)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/admin/roles/init/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { id: session.user.id },
```

**After**:
```typescript
where: { id: user.id },
```


### src/app/api/admin/roles/[id]/route.ts (Line 14)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/dashboard/page.tsx (Line 8)
**Rule**: Replace getServerSession Pattern
**Category**: function
**Description**: Replace manual getServerSession with requireAuth

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/page.tsx (Line 15)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email! },
```

**After**:
```typescript
where: { email: user.email! },
```


### src/app/dashboard/layout.tsx (Line 15)
**Rule**: Replace getServerSession Pattern
**Category**: function
**Description**: Replace manual getServerSession with requireAuth

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/layout.tsx (Line 19)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email! },
```

**After**:
```typescript
where: { email: user.email! },
```


### src/components/dashboard/Header.tsx (Line 33)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
src={session.user.image}
```

**After**:
```typescript
src={user.image}
```


### src/app/dashboard/settings/page.tsx (Line 6)
**Rule**: Replace getServerSession Pattern
**Category**: function
**Description**: Replace manual getServerSession with requireAuth

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/setup/district/page.tsx (Line 8)
**Rule**: Replace getServerSession Pattern
**Category**: function
**Description**: Replace manual getServerSession with requireAuth

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/setup/district/page.tsx (Line 10)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
if (session.user.staff?.role?.title !== "Administrator") {
```

**After**:
```typescript
if (user.staff?.role?.title !== "Administrator") {
```


### src/app/dashboard/settings/system/page.tsx (Line 15)
**Rule**: Replace Manual Auth Checks
**Category**: function
**Description**: Replace manual auth checks with requireAuth patterns

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/settings/system/page.tsx (Line 18)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/dashboard/settings/system/page.tsx (Line 28)
**Rule**: Update Staff Access Pattern
**Category**: usage
**Description**: Update staff record access pattern

**Before**:
```typescript
if (!user || user.Staff?.[0]?.Role?.title !== "Administrator") {
```

**After**:
```typescript
if (!user || user.staff?.Role?.title !== "Administrator") {
```


### src/app/dashboard/settings/security/page.tsx (Line 7)
**Rule**: Replace getServerSession Pattern
**Category**: function
**Description**: Replace manual getServerSession with requireAuth

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/settings/security/page.tsx (Line 10)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email! },
```

**After**:
```typescript
where: { email: user.email! },
```


### src/app/dashboard/settings/school/page.tsx (Line 50)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
if (!session?.user || session.user.staff?.role?.title !== "Administrator") {
```

**After**:
```typescript
if (!session?.user || user.staff?.role?.title !== "Administrator") {
```


### src/app/dashboard/settings/permissions/page.tsx (Line 15)
**Rule**: Replace Manual Auth Checks
**Category**: function
**Description**: Replace manual auth checks with requireAuth patterns

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/settings/permissions/page.tsx (Line 18)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/dashboard/settings/permissions/page.tsx (Line 28)
**Rule**: Update Staff Access Pattern
**Category**: usage
**Description**: Update staff record access pattern

**Before**:
```typescript
if (!user || user.Staff?.[0]?.Role?.title !== "Administrator") {
```

**After**:
```typescript
if (!user || user.staff?.Role?.title !== "Administrator") {
```


### src/app/dashboard/settings/notifications/page.tsx (Line 14)
**Rule**: Replace Manual Auth Checks
**Category**: function
**Description**: Replace manual auth checks with requireAuth patterns

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/settings/meeting-templates/page.tsx (Line 8)
**Rule**: Replace Manual Auth Checks
**Category**: function
**Description**: Replace manual auth checks with requireAuth patterns

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/settings/meeting-templates/page.tsx (Line 12)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/dashboard/settings/meeting-permissions/page.tsx (Line 8)
**Rule**: Replace Manual Auth Checks
**Category**: function
**Description**: Replace manual auth checks with requireAuth patterns

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/settings/meeting-permissions/page.tsx (Line 12)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/dashboard/settings/meeting-management/page.tsx (Line 9)
**Rule**: Replace Manual Auth Checks
**Category**: function
**Description**: Replace manual auth checks with requireAuth patterns

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/settings/meeting-management/page.tsx (Line 13)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/dashboard/settings/audit/page.tsx (Line 15)
**Rule**: Replace Manual Auth Checks
**Category**: function
**Description**: Replace manual auth checks with requireAuth patterns

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/settings/audit/page.tsx (Line 19)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/dashboard/settings/audit/page.tsx (Line 29)
**Rule**: Update Staff Access Pattern
**Category**: usage
**Description**: Update staff record access pattern

**Before**:
```typescript
if (!user || user.Staff?.[0]?.Role?.title !== "Administrator") {
```

**After**:
```typescript
if (!user || user.staff?.Role?.title !== "Administrator") {
```


### src/app/dashboard/settings/meeting-audit/page.tsx (Line 8)
**Rule**: Replace Manual Auth Checks
**Category**: function
**Description**: Replace manual auth checks with requireAuth patterns

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/settings/meeting-audit/page.tsx (Line 12)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email },
```

**After**:
```typescript
where: { email: user.email },
```


### src/app/dashboard/meetings/[id]/page.tsx (Line 15)
**Rule**: Replace getServerSession Pattern
**Category**: function
**Description**: Replace manual getServerSession with requireAuth

**Before**:
```typescript
const session = await getServerSession(authOptions);
```

**After**:
```typescript
const user = await requireAuth(AuthPresets.requireAuth);
```


### src/app/dashboard/meetings/[id]/page.tsx (Line 54)
**Rule**: Update Session User Access
**Category**: usage
**Description**: Replace session.user access with user parameter

**Before**:
```typescript
where: { email: session.user.email || "" },
```

**After**:
```typescript
where: { email: user.email || "" },
```


### src/app/dashboard/settings/role-hierarchy/user-assignment/page.tsx (Line 368)
**Rule**: Update Staff Access Pattern
**Category**: usage
**Description**: Update staff record access pattern

**Before**:
```typescript
{user.Staff?.[0]?.Role && ` - ${user.Staff[0].Role.title}`}
```

**After**:
```typescript
{user.staff?.Role && ` - ${user.Staff[0].Role.title}`}
```






## Next Steps
1. Review all changes carefully
2. Test the application functionality
3. Update any remaining manual auth patterns
4. Run type checks: `npm run type-check`
5. Run tests: `npm test`
6. Commit changes with detailed message
