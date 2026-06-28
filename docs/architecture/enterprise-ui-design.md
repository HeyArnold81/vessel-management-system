# Enterprise UI Design

## Product Direction

The Vessel Management System UI should feel like an operational command center rather than a set of unrelated CRUD pages. The design is inspired by SAP Fiori, Microsoft Fluent, Linear, and Stripe Dashboard: restrained color, dense but readable layouts, strong hierarchy, accessible controls, and fast keyboard-driven navigation.

## Application Shell

Every screen sits inside one shared shell:

- Persistent left navigation on desktop.
- Mobile navigation drawer on smaller screens.
- Sticky top bar with current area, global search trigger, keyboard help, and theme toggle.
- Skip-to-content link for keyboard and screen-reader users.
- Command palette available with `Ctrl+K`.
- Shortcut help available with `?`.

## Theme

The theme uses CSS variables and supports light/dark mode:

- `surface`: application background.
- `panel`: cards, drawers, tables, and dialogs.
- `ink`: primary text.
- `steel`: secondary text.
- `line`: borders and separators.
- `harbor`: restrained primary action/accent.
- `signal`: warning/accent state.

The current implementation maps existing Tailwind utility classes to theme tokens where possible, allowing the current screens to move toward dark mode without a full rewrite.

## Screen Patterns

### Command Center

- KPI strip for current operational state.
- Timeline of major vessel operations.
- Operational controls panel.
- Future exception list for berth conflicts, delayed services, failed exports, and audit flags.

### Operational Modules

Applies to Vessel Calls, Movements, Movement Services, Billing Events, and ERP Export Batches:

- Page title and short operational purpose.
- Filter toolbar.
- Primary data table.
- Create/edit workflow should move toward a side drawer.
- Statuses should use compact badges.
- Error and empty states must be visible without layout shift.

### Master Data Modules

Applies to Vessels, Ports, Berths, Cargo, and Service Catalog:

- Table-first layout.
- Compact filters.
- Create/edit drawer.
- Row actions kept predictable: view, edit, deactivate/delete where appropriate.
- Future record detail pages should use tabs for related operational history and audit trail.

### Billing And ERP

- Billing Events are the review queue for billable operational facts.
- ERP Export Batches are the outbound integration queue.
- Invoice generation remains outside the app and belongs to ERP/finance systems.
- Future connector screens should show queue health, retries, dead-letter states, and external references.

### Reports

- Report catalogue grouped by Operations, Billing, Services, and Audit.
- Each report should have filter controls, preview table, and export action.
- Avoid dashboard chart proliferation until report definitions are agreed.

### Users

- User table with name, email, provider, status, and roles.
- Invite user action.
- Edit drawer for role assignments and access state.
- Clear identity provider indicators for Microsoft Entra ID, local auth, and OAuth.

### Permissions

- Role-permission matrix.
- System roles read-only.
- Tenant roles editable.
- Dangerous permission changes require confirmation and audit logging.

## Keyboard Shortcuts

```text
/       Focus global search
Ctrl+K  Open command palette
?       Open shortcut help
Esc     Close menus and dialogs
```

Future module-level shortcuts:

```text
N              New record
F              Focus filters
Ctrl+S         Save form
Ctrl+Enter     Submit primary action
```

## Accessibility

The UI must preserve:

- Semantic landmarks.
- Visible focus states.
- Keyboard-operable dialogs and drawers.
- Labelled form controls.
- Native table structure for tabular data.
- Status text in addition to color.
- Sufficient contrast in both light and dark modes.

## Implementation Notes

- `AppShell` owns global navigation, theme, command palette, and shortcut help.
- Existing module pages remain functional and are progressively themed.
- The next UI hardening step should introduce reusable `PageHeader`, `Toolbar`, `DataTable`, `StatusBadge`, `EmptyState`, and `Drawer` components, then migrate modules one by one.
