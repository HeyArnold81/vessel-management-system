import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { VesselCallsAuditService } from './audit.service.js';
import { PrismaVesselCallsRepository, VESSEL_CALLS_REPOSITORY } from './vessel-calls.repository.js';
import { VesselCallsController } from './vessel-calls.controller.js';
import { VESSEL_CALL_AUDIT_RECORDER, VesselCallsService } from './vessel-calls.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [VesselCallsController],
  providers: [
    VesselCallsAuditService,
    VesselCallsService,
    {
      provide: VESSEL_CALLS_REPOSITORY,
      useClass: PrismaVesselCallsRepository,
    },
    {
      provide: VESSEL_CALL_AUDIT_RECORDER,
      useExisting: VesselCallsAuditService,
    },
  ],
  exports: [VesselCallsService],
})
export class VesselCallsModule {}
