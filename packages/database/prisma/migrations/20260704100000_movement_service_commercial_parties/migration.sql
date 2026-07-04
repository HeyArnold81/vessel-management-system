ALTER TABLE "movement_services"
  ADD COLUMN "service_receiver_organization_id" UUID,
  ADD COLUMN "bill_to_organization_id" UUID,
  ADD COLUMN "payer_organization_id" UUID;

CREATE INDEX "movement_services_service_receiver_organization_id_status_idx"
  ON "movement_services"("service_receiver_organization_id", "status");

CREATE INDEX "movement_services_bill_to_organization_id_status_idx"
  ON "movement_services"("bill_to_organization_id", "status");

CREATE INDEX "movement_services_payer_organization_id_status_idx"
  ON "movement_services"("payer_organization_id", "status");

ALTER TABLE "movement_services"
  ADD CONSTRAINT "movement_services_service_receiver_organization_id_fkey"
  FOREIGN KEY ("service_receiver_organization_id")
  REFERENCES "organizations"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "movement_services"
  ADD CONSTRAINT "movement_services_bill_to_organization_id_fkey"
  FOREIGN KEY ("bill_to_organization_id")
  REFERENCES "organizations"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "movement_services"
  ADD CONSTRAINT "movement_services_payer_organization_id_fkey"
  FOREIGN KEY ("payer_organization_id")
  REFERENCES "organizations"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
