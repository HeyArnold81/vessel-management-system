import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { BillingEventsAuditService } from './audit.service.js';
import { BillingEventsController } from './billing-events.controller.js';
import {
  BILLING_EVENTS_REPOSITORY,
  PrismaBillingEventsRepository,
} from './billing-events.repository.js';
import { BILLING_EVENT_AUDIT_RECORDER, BillingEventsService } from './billing-events.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BillingEventsController],
  providers: [
    BillingEventsAuditService,
    BillingEventsService,
    {
      provide: BILLING_EVENTS_REPOSITORY,
      useClass: PrismaBillingEventsRepository,
    },
    {
      provide: BILLING_EVENT_AUDIT_RECORDER,
      useExisting: BillingEventsAuditService,
    },
  ],
  exports: [BillingEventsService],
})
export class BillingEventsModule {}
