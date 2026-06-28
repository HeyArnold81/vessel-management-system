import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { BillingExportBatchesAuditService } from './audit.service.js';
import { BillingExportBatchesController } from './billing-export-batches.controller.js';
import {
  BILLING_EXPORT_BATCHES_REPOSITORY,
  PrismaBillingExportBatchesRepository,
} from './billing-export-batches.repository.js';
import {
  BILLING_EXPORT_BATCH_AUDIT_RECORDER,
  BillingExportBatchesService,
} from './billing-export-batches.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BillingExportBatchesController],
  providers: [
    BillingExportBatchesService,
    BillingExportBatchesAuditService,
    {
      provide: BILLING_EXPORT_BATCHES_REPOSITORY,
      useClass: PrismaBillingExportBatchesRepository,
    },
    {
      provide: BILLING_EXPORT_BATCH_AUDIT_RECORDER,
      useExisting: BillingExportBatchesAuditService,
    },
  ],
})
export class BillingExportBatchesModule {}
