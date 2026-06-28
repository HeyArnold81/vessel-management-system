# Users And Roles MVP

## Purpose

The Users and Roles MVP gives the Vessel Management System a local access-management foundation without making the application the enterprise identity source of truth.

The MVP supports:

- Local user records.
- User list, create, update, and deactivate.
- Tenant and system role visibility.
- Tenant role creation and editing.
- Permission assignment to tenant roles.
- User role assignment and removal.
- Audit logging for user and role changes.

## Strategic Boundary

VMS owns application authorisation. Enterprise identity remains external.

Local users are included for MVP use, break-glass administration, and small deployments. Future SSO users should be authenticated by Microsoft Entra ID, Okta, Google Workspace, OIDC, or SAML providers, then represented in VMS as shadow users for authorisation and audit.

## REST API

```text
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
POST   /api/v1/users/:id/roles
DELETE /api/v1/users/:id/roles/:roleId

GET    /api/v1/roles
GET    /api/v1/roles/permissions
GET    /api/v1/roles/:id
POST   /api/v1/roles
PATCH  /api/v1/roles/:id
DELETE /api/v1/roles/:id
```

## Current Data Model

The MVP uses existing tables:

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `audit_logs`

## Files Created

### API

- `apps/api/src/modules/users/*`: Users controller, service, repository, DTOs, mapper, audit service, and module wiring.
- `apps/api/src/modules/roles/*`: Roles controller, service, repository, DTOs, mapper, audit service, and module wiring.

### Web

- `apps/web/src/app/users/page.tsx`: Users route.
- `apps/web/src/app/roles/page.tsx`: Roles route.
- `apps/web/src/features/users/*`: Users API client, form, page, and tests.
- `apps/web/src/features/roles/*`: Roles API client, form, page, and tests.

## Audit Events

- `user.create`
- `user.update`
- `user.deactivate`
- `user.role.assign`
- `user.role.remove`
- `role.create`
- `role.update`
- `role.delete`

## Known MVP Limits

- Local login flow is not implemented in this slice.
- Password hashing and account lockout should be added with the Auth module.
- The current `roles` table does not have `status` or `deleted_at`, so role retirement is limited. Add lifecycle columns before relying on role deletion operationally.
- Scoped role assignment by port, terminal, berth, or department is not implemented yet.
- System role seeding should be formalised.
- Identity provider, SCIM, and external identity tables are still future-phase work.

## Next Recommended Step

Build the Permissions module next:

- Permission matrix UI.
- Permission groups.
- System role seed data.
- Role lifecycle fields.
- Scoped role assignments for port, terminal, berth, and department.
