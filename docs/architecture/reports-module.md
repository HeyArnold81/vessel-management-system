# Reports Module

## Design

The Reports module provides read-only operational and billing reporting over the existing transactional data. The MVP exposes a fixed overview report rather than a custom report builder.

## MVP Scope

- Operational metrics for vessel calls, movements, and marine services.
- Billing metrics for billing events, pending billing, failed billing, and ERP export batches.
- Status/type breakdowns.
- Upcoming arrival and departure lists.
- Pending and failed billing event lists.
- Date range and port filters.
- CSV export from the current report view.

## Trade-offs

Reports currently query PostgreSQL transactional tables directly. This is acceptable for MVP because report volume is small and the data model is still changing. For commercial scale, reports should move to read replicas, materialised views, or a warehouse-style reporting schema.

Berth activity is currently a count of vessel calls assigned to berths. True berth utilisation requires calculating occupied time from berth stay timestamps against available berth capacity.

## API

- `GET /api/v1/reports/overview`

Supported query parameters:

- `from`
- `to`
- `portId`

## Future Scalability

- Add materialised report views for expensive aggregations.
- Add saved report definitions and scheduled delivery.
- Add CSV/PDF export from the backend for auditability.
- Add true berth utilisation calculations.
- Add role-protected report categories.
- Add data warehouse integration for long-term trend analytics.
