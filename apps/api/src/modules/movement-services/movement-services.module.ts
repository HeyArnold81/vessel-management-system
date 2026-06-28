import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { MovementServicesAuditService } from './audit.service.js';
import { MovementServicesController } from './movement-services.controller.js';
import {
  MOVEMENT_SERVICES_REPOSITORY,
  PrismaMovementServicesRepository,
} from './movement-services.repository.js';
import {
  MOVEMENT_SERVICE_AUDIT_RECORDER,
  MovementServicesService,
} from './movement-services.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [MovementServicesController],
  providers: [
    MovementServicesAuditService,
    MovementServicesService,
    {
      provide: MOVEMENT_SERVICES_REPOSITORY,
      useClass: PrismaMovementServicesRepository,
    },
    {
      provide: MOVEMENT_SERVICE_AUDIT_RECORDER,
      useExisting: MovementServicesAuditService,
    },
  ],
  exports: [MovementServicesService],
})
export class MovementServicesModule {}
