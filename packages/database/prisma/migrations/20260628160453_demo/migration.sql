-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "auth_provider" TEXT NOT NULL,
    "external_subject" TEXT,
    "password_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "is_privileged" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "permission_group_id" UUID,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT,
    "action" TEXT,
    "is_privileged" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_groups" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" UUID NOT NULL,
    "iso2_code" CHAR(2) NOT NULL,
    "iso3_code" CHAR(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trading_name" TEXT,
    "registration_number" TEXT,
    "tax_number" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ports" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "country_id" UUID NOT NULL,
    "unlocode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "time_zone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "ports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "port_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "terminal_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "berths" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "terminal_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_length_m" DECIMAL(8,2),
    "max_draft_m" DECIMAL(6,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "berths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessels" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "flag_country_id" UUID,
    "name" TEXT NOT NULL,
    "imo_number" TEXT NOT NULL,
    "mmsi" TEXT,
    "call_sign" TEXT,
    "vessel_type" TEXT NOT NULL,
    "gross_tonnage" DECIMAL(12,2),
    "length_overall_m" DECIMAL(8,2),
    "max_draft_m" DECIMAL(6,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vessels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessel_parties" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "vessel_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "party_role" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vessel_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessel_calls" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "call_reference" TEXT NOT NULL,
    "vessel_id" UUID NOT NULL,
    "port_id" UUID NOT NULL,
    "berth_id" UUID,
    "agent_id" UUID,
    "operator_id" UUID,
    "voyage_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "eta" TIMESTAMPTZ(6),
    "etd" TIMESTAMPTZ(6),
    "ata" TIMESTAMPTZ(6),
    "atd" TIMESTAMPTZ(6),
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vessel_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessel_movements" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "movement_reference" TEXT NOT NULL,
    "vessel_call_id" UUID NOT NULL,
    "vessel_id" UUID NOT NULL,
    "port_id" UUID NOT NULL,
    "from_berth_id" UUID,
    "to_berth_id" UUID,
    "movement_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "planned_at" TIMESTAMPTZ(6),
    "actual_at" TIMESTAMPTZ(6),
    "eta" TIMESTAMPTZ(6),
    "etd" TIMESTAMPTZ(6),
    "ata" TIMESTAMPTZ(6),
    "atd" TIMESTAMPTZ(6),
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vessel_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_berth_stays" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "movement_id" UUID NOT NULL,
    "berth_id" UUID NOT NULL,
    "sequence_no" INTEGER NOT NULL,
    "alongside_at" TIMESTAMPTZ(6),
    "operations_started_at" TIMESTAMPTZ(6),
    "operations_completed_at" TIMESTAMPTZ(6),
    "cast_off_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "movement_berth_stays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "cargo_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cargo_category" TEXT NOT NULL,
    "un_number" TEXT,
    "is_hazardous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "cargo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_cargo" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "movement_id" UUID NOT NULL,
    "cargo_item_id" UUID NOT NULL,
    "operation_type" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "movement_cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilotage_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "movement_id" UUID NOT NULL,
    "job_type" TEXT NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'requested',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pilotage_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "towage_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "movement_id" UUID NOT NULL,
    "job_type" TEXT NOT NULL,
    "tugs_required" INTEGER NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'requested',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "towage_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "default_unit" TEXT NOT NULL,
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "service_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_services" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "movement_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "provider_organization_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "requested_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "movement_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_reference" TEXT NOT NULL,
    "movement_service_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "erp_system" TEXT,
    "export_batch_id" UUID,
    "exported_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "rejected_at" TIMESTAMPTZ(6),
    "failure_reason" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_export_batches" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "batch_reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "erp_system" TEXT NOT NULL,
    "external_reference" TEXT,
    "event_count" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "billing_export_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "movement_id" UUID NOT NULL,
    "bill_to_organization_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "subtotal_amount" DECIMAL(14,2) NOT NULL,
    "tax_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "movement_service_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "unit_price" DECIMAL(14,4) NOT NULL,
    "tax_rate" DECIMAL(7,4) NOT NULL,
    "line_total_amount" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "movement_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_time" TIMESTAMPTZ(6) NOT NULL,
    "source" TEXT NOT NULL,
    "recorded_by_user_id" UUID,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operational_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "request_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "before_data" JSONB,
    "after_data" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "users_tenant_id_status_idx" ON "users"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "roles_tenant_id_status_idx" ON "roles"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_code_key" ON "roles"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_permission_group_id_idx" ON "permissions"("permission_group_id");

-- CreateIndex
CREATE INDEX "permissions_resource_action_idx" ON "permissions"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_code_key" ON "permission_groups"("code");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso2_code_key" ON "countries"("iso2_code");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso3_code_key" ON "countries"("iso3_code");

-- CreateIndex
CREATE INDEX "organizations_tenant_id_legal_name_idx" ON "organizations"("tenant_id", "legal_name");

-- CreateIndex
CREATE INDEX "ports_tenant_id_name_idx" ON "ports"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ports_tenant_id_unlocode_key" ON "ports"("tenant_id", "unlocode");

-- CreateIndex
CREATE INDEX "terminals_port_id_idx" ON "terminals"("port_id");

-- CreateIndex
CREATE UNIQUE INDEX "terminals_tenant_id_port_id_code_key" ON "terminals"("tenant_id", "port_id", "code");

-- CreateIndex
CREATE INDEX "berths_terminal_id_idx" ON "berths"("terminal_id");

-- CreateIndex
CREATE UNIQUE INDEX "berths_tenant_id_terminal_id_code_key" ON "berths"("tenant_id", "terminal_id", "code");

-- CreateIndex
CREATE INDEX "vessels_tenant_id_name_idx" ON "vessels"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "vessels_tenant_id_imo_number_key" ON "vessels"("tenant_id", "imo_number");

-- CreateIndex
CREATE INDEX "vessel_parties_vessel_id_party_role_idx" ON "vessel_parties"("vessel_id", "party_role");

-- CreateIndex
CREATE INDEX "vessel_parties_organization_id_idx" ON "vessel_parties"("organization_id");

-- CreateIndex
CREATE INDEX "vessel_calls_tenant_id_status_eta_idx" ON "vessel_calls"("tenant_id", "status", "eta");

-- CreateIndex
CREATE INDEX "vessel_calls_vessel_id_eta_idx" ON "vessel_calls"("vessel_id", "eta");

-- CreateIndex
CREATE INDEX "vessel_calls_port_id_eta_idx" ON "vessel_calls"("port_id", "eta");

-- CreateIndex
CREATE INDEX "vessel_calls_berth_id_eta_idx" ON "vessel_calls"("berth_id", "eta");

-- CreateIndex
CREATE UNIQUE INDEX "vessel_calls_tenant_id_call_reference_key" ON "vessel_calls"("tenant_id", "call_reference");

-- CreateIndex
CREATE INDEX "vessel_movements_tenant_id_status_idx" ON "vessel_movements"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "vessel_movements_vessel_call_id_planned_at_idx" ON "vessel_movements"("vessel_call_id", "planned_at");

-- CreateIndex
CREATE INDEX "vessel_movements_vessel_call_id_actual_at_idx" ON "vessel_movements"("vessel_call_id", "actual_at");

-- CreateIndex
CREATE INDEX "vessel_movements_vessel_id_eta_idx" ON "vessel_movements"("vessel_id", "eta");

-- CreateIndex
CREATE INDEX "vessel_movements_port_id_eta_idx" ON "vessel_movements"("port_id", "eta");

-- CreateIndex
CREATE UNIQUE INDEX "vessel_movements_tenant_id_movement_reference_key" ON "vessel_movements"("tenant_id", "movement_reference");

-- CreateIndex
CREATE INDEX "movement_berth_stays_berth_id_alongside_at_cast_off_at_idx" ON "movement_berth_stays"("berth_id", "alongside_at", "cast_off_at");

-- CreateIndex
CREATE UNIQUE INDEX "movement_berth_stays_movement_id_sequence_no_key" ON "movement_berth_stays"("movement_id", "sequence_no");

-- CreateIndex
CREATE INDEX "cargo_items_tenant_id_name_idx" ON "cargo_items"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "cargo_items_tenant_id_status_idx" ON "cargo_items"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_items_tenant_id_cargo_code_key" ON "cargo_items"("tenant_id", "cargo_code");

-- CreateIndex
CREATE INDEX "movement_cargo_movement_id_idx" ON "movement_cargo"("movement_id");

-- CreateIndex
CREATE INDEX "movement_cargo_cargo_item_id_idx" ON "movement_cargo"("cargo_item_id");

-- CreateIndex
CREATE INDEX "pilotage_jobs_movement_id_idx" ON "pilotage_jobs"("movement_id");

-- CreateIndex
CREATE INDEX "pilotage_jobs_tenant_id_status_scheduled_at_idx" ON "pilotage_jobs"("tenant_id", "status", "scheduled_at");

-- CreateIndex
CREATE INDEX "towage_jobs_movement_id_idx" ON "towage_jobs"("movement_id");

-- CreateIndex
CREATE INDEX "towage_jobs_tenant_id_status_scheduled_at_idx" ON "towage_jobs"("tenant_id", "status", "scheduled_at");

-- CreateIndex
CREATE INDEX "service_catalog_tenant_id_category_idx" ON "service_catalog"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "service_catalog_tenant_id_status_idx" ON "service_catalog"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "service_catalog_tenant_id_code_key" ON "service_catalog"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "movement_services_movement_id_idx" ON "movement_services"("movement_id");

-- CreateIndex
CREATE INDEX "movement_services_provider_organization_id_status_idx" ON "movement_services"("provider_organization_id", "status");

-- CreateIndex
CREATE INDEX "movement_services_tenant_id_status_idx" ON "movement_services"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "movement_services_tenant_id_is_billable_completed_at_idx" ON "movement_services"("tenant_id", "is_billable", "completed_at");

-- CreateIndex
CREATE INDEX "billing_events_tenant_id_status_created_at_idx" ON "billing_events"("tenant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "billing_events_tenant_id_erp_system_exported_at_idx" ON "billing_events"("tenant_id", "erp_system", "exported_at");

-- CreateIndex
CREATE INDEX "billing_events_export_batch_id_idx" ON "billing_events"("export_batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_events_tenant_id_event_reference_key" ON "billing_events"("tenant_id", "event_reference");

-- CreateIndex
CREATE UNIQUE INDEX "billing_events_tenant_id_movement_service_id_key" ON "billing_events"("tenant_id", "movement_service_id");

-- CreateIndex
CREATE INDEX "billing_export_batches_tenant_id_status_requested_at_idx" ON "billing_export_batches"("tenant_id", "status", "requested_at");

-- CreateIndex
CREATE INDEX "billing_export_batches_tenant_id_erp_system_requested_at_idx" ON "billing_export_batches"("tenant_id", "erp_system", "requested_at");

-- CreateIndex
CREATE INDEX "billing_export_batches_external_reference_idx" ON "billing_export_batches"("external_reference");

-- CreateIndex
CREATE UNIQUE INDEX "billing_export_batches_tenant_id_batch_reference_key" ON "billing_export_batches"("tenant_id", "batch_reference");

-- CreateIndex
CREATE INDEX "invoices_movement_id_idx" ON "invoices"("movement_id");

-- CreateIndex
CREATE INDEX "invoices_bill_to_organization_id_status_idx" ON "invoices"("bill_to_organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_invoice_number_key" ON "invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_lines_invoice_id_idx" ON "invoice_lines"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_lines_movement_service_id_idx" ON "invoice_lines"("movement_service_id");

-- CreateIndex
CREATE INDEX "operational_events_movement_id_event_time_idx" ON "operational_events"("movement_id", "event_time");

-- CreateIndex
CREATE INDEX "operational_events_tenant_id_event_type_event_time_idx" ON "operational_events"("tenant_id", "event_type", "event_time");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_entity_type_entity_id_created_at_idx" ON "audit_logs"("tenant_id", "entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_request_id_idx" ON "audit_logs"("request_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_permission_group_id_fkey" FOREIGN KEY ("permission_group_id") REFERENCES "permission_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ports" ADD CONSTRAINT "ports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ports" ADD CONSTRAINT "ports_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminals" ADD CONSTRAINT "terminals_port_id_fkey" FOREIGN KEY ("port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "berths" ADD CONSTRAINT "berths_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_flag_country_id_fkey" FOREIGN KEY ("flag_country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_parties" ADD CONSTRAINT "vessel_parties_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_parties" ADD CONSTRAINT "vessel_parties_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_port_id_fkey" FOREIGN KEY ("port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_berth_id_fkey" FOREIGN KEY ("berth_id") REFERENCES "berths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_movements" ADD CONSTRAINT "vessel_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_movements" ADD CONSTRAINT "vessel_movements_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_movements" ADD CONSTRAINT "vessel_movements_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_movements" ADD CONSTRAINT "vessel_movements_port_id_fkey" FOREIGN KEY ("port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_movements" ADD CONSTRAINT "vessel_movements_from_berth_id_fkey" FOREIGN KEY ("from_berth_id") REFERENCES "berths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_movements" ADD CONSTRAINT "vessel_movements_to_berth_id_fkey" FOREIGN KEY ("to_berth_id") REFERENCES "berths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_berth_stays" ADD CONSTRAINT "movement_berth_stays_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "vessel_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_berth_stays" ADD CONSTRAINT "movement_berth_stays_berth_id_fkey" FOREIGN KEY ("berth_id") REFERENCES "berths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_cargo" ADD CONSTRAINT "movement_cargo_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "vessel_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_cargo" ADD CONSTRAINT "movement_cargo_cargo_item_id_fkey" FOREIGN KEY ("cargo_item_id") REFERENCES "cargo_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilotage_jobs" ADD CONSTRAINT "pilotage_jobs_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "vessel_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "towage_jobs" ADD CONSTRAINT "towage_jobs_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "vessel_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_services" ADD CONSTRAINT "movement_services_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "vessel_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_services" ADD CONSTRAINT "movement_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_services" ADD CONSTRAINT "movement_services_provider_organization_id_fkey" FOREIGN KEY ("provider_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_movement_service_id_fkey" FOREIGN KEY ("movement_service_id") REFERENCES "movement_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_export_batch_id_fkey" FOREIGN KEY ("export_batch_id") REFERENCES "billing_export_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_export_batches" ADD CONSTRAINT "billing_export_batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "vessel_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bill_to_organization_id_fkey" FOREIGN KEY ("bill_to_organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_movement_service_id_fkey" FOREIGN KEY ("movement_service_id") REFERENCES "movement_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "vessel_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
