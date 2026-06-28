import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { AuditService } from './audit.service.js';
import { VesselsController } from './vessels.controller.js';
import { PrismaVesselsRepository, VESSELS_REPOSITORY } from './vessels.repository.js';
import { VESSEL_AUDIT_RECORDER, VesselsService } from './vessels.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [VesselsController],
  providers: [
    AuditService,
    VesselsService,
    {
      provide: VESSELS_REPOSITORY,
      useClass: PrismaVesselsRepository,
    },
    {
      provide: VESSEL_AUDIT_RECORDER,
      useExisting: AuditService,
    },
  ],
  exports: [VesselsService],
})
export class VesselsModule {}
