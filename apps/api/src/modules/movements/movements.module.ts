import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { MovementsAuditService } from './audit.service.js';
import { MovementsController } from './movements.controller.js';
import { PrismaMovementsRepository, MOVEMENTS_REPOSITORY } from './movements.repository.js';
import { MOVEMENT_AUDIT_RECORDER, MovementsService } from './movements.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [MovementsController],
  providers: [
    MovementsAuditService,
    MovementsService,
    {
      provide: MOVEMENTS_REPOSITORY,
      useClass: PrismaMovementsRepository,
    },
    {
      provide: MOVEMENT_AUDIT_RECORDER,
      useExisting: MovementsAuditService,
    },
  ],
  exports: [MovementsService],
})
export class MovementsModule {}
