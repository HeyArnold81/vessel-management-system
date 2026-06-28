# Permissions Module

## Design

The Permissions module manages role-to-permission assignment for the Vessel Management System. It is intentionally separate from authentication and identity provider management: enterprise identity providers should authenticate and provision users, while this application remains responsible for product authorisation policy.

## MVP Scope

- Permission catalogue read API.
- Permission groups read API.
- Role permission matrix API.
- Tenant role permission updates.
- System role protection.
- Audit logging for permission assignment changes.
- Responsive permission matrix UI.

## Trade-offs

Permission catalogue CRUD is not included in MVP. Permission codes are product contracts and should be changed through versioned migrations, not routine admin screens. This avoids accidental removal of permissions that application code depends on.

Role assignment scope remains tenant-wide in this slice. Port, terminal, berth, and department scoping should be added as a dedicated access-scope model once workflows require scoped access checks.

## API

- `GET /api/v1/permissions`
- `GET /api/v1/permissions/groups`
- `GET /api/v1/permissions/matrix`
- `PUT /api/v1/permissions/roles/:roleId`

## Security Model

System roles are read-only. Tenant roles can be changed through the permission matrix, and every update is written to audit logging. Privileged permissions are surfaced through metadata so approval workflows can be added without changing the matrix response shape.

## Future Scalability

- Add `role_assignment_scopes` for port, terminal, berth, department, and organisation-unit access.
- Add approval workflow for privileged role changes.
- Add segregation-of-duties policy checks before saving role permissions.
- Add permission catalogue seeding and versioning.
- Add effective-permissions endpoint for enforcement and UI capability hiding.
