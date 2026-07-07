CREATE TABLE "booking_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "request_reference" TEXT NOT NULL,
    "vessel_id" UUID NOT NULL,
    "port_id" UUID NOT NULL,
    "preferred_berth_id" UUID,
    "agent_organization_id" UUID,
    "customer_organization_id" UUID,
    "vessel_call_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "requested_eta" TIMESTAMPTZ(6),
    "requested_etd" TIMESTAMPTZ(6),
    "voyage_number" TEXT,
    "cargo_summary" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_requested_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "booking_request_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "provider_organization_id" UUID,
    "service_receiver_organization_id" UUID,
    "bill_to_organization_id" UUID,
    "payer_organization_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "requested_at" TIMESTAMPTZ(6),
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_requested_services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_request_cargo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "booking_request_id" UUID NOT NULL,
    "cargo_item_id" UUID NOT NULL,
    "operation_type" TEXT NOT NULL,
    "quantity" DECIMAL(14,3),
    "unit_of_measure" TEXT,
    "notes" TEXT,

    CONSTRAINT "booking_request_cargo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "availability_checks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "booking_request_id" UUID,
    "port_id" UUID NOT NULL,
    "berth_id" UUID,
    "vessel_id" UUID,
    "requested_eta" TIMESTAMPTZ(6) NOT NULL,
    "requested_etd" TIMESTAMPTZ(6) NOT NULL,
    "result" TEXT NOT NULL,
    "score" INTEGER,
    "checks" JSONB NOT NULL,
    "recommendations" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_requests_tenant_id_request_reference_key" ON "booking_requests"("tenant_id", "request_reference");
CREATE UNIQUE INDEX "booking_requests_vessel_call_id_key" ON "booking_requests"("vessel_call_id");
CREATE INDEX "booking_requests_tenant_id_status_requested_eta_idx" ON "booking_requests"("tenant_id", "status", "requested_eta");
CREATE INDEX "booking_requests_tenant_id_vessel_id_requested_eta_idx" ON "booking_requests"("tenant_id", "vessel_id", "requested_eta");
CREATE INDEX "booking_requests_tenant_id_port_id_requested_eta_idx" ON "booking_requests"("tenant_id", "port_id", "requested_eta");
CREATE INDEX "booking_requests_tenant_id_preferred_berth_id_requested_eta_idx" ON "booking_requests"("tenant_id", "preferred_berth_id", "requested_eta");

CREATE INDEX "booking_requested_services_booking_request_id_idx" ON "booking_requested_services"("booking_request_id");
CREATE INDEX "booking_requested_services_tenant_id_service_id_status_idx" ON "booking_requested_services"("tenant_id", "service_id", "status");

CREATE INDEX "booking_request_cargo_booking_request_id_idx" ON "booking_request_cargo"("booking_request_id");
CREATE INDEX "booking_request_cargo_cargo_item_id_idx" ON "booking_request_cargo"("cargo_item_id");

CREATE INDEX "availability_checks_tenant_id_port_id_requested_eta_idx" ON "availability_checks"("tenant_id", "port_id", "requested_eta");
CREATE INDEX "availability_checks_booking_request_id_created_at_idx" ON "availability_checks"("booking_request_id", "created_at");

ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_port_id_fkey" FOREIGN KEY ("port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_preferred_berth_id_fkey" FOREIGN KEY ("preferred_berth_id") REFERENCES "berths"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_agent_organization_id_fkey" FOREIGN KEY ("agent_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_customer_organization_id_fkey" FOREIGN KEY ("customer_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking_requested_services" ADD CONSTRAINT "booking_requested_services_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_requested_services" ADD CONSTRAINT "booking_requested_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "booking_request_cargo" ADD CONSTRAINT "booking_request_cargo_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_request_cargo" ADD CONSTRAINT "booking_request_cargo_cargo_item_id_fkey" FOREIGN KEY ("cargo_item_id") REFERENCES "cargo_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "availability_checks" ADD CONSTRAINT "availability_checks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "availability_checks" ADD CONSTRAINT "availability_checks_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
