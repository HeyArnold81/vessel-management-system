import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { BerthsAuditService } from './audit.service.js';
import { BerthsController } from './berths.controller.js';
import { PrismaBerthsRepository, BERTHS_REPOSITORY } from './berths.repository.js';
import { BERTH_AUDIT_RECORDER, BerthsService } from './berths.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BerthsController],
  providers: [
    BerthsAuditService,
    BerthsService,
    {
      provide: BERTHS_REPOSITORY,
      useClass: PrismaBerthsRepository,
    },
    {
      provide: BERTH_AUDIT_RECORDER,
      useExisting: BerthsAuditService,
    },
  ],
  exports: [BerthsService],
})
export class BerthsModule {}
