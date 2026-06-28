import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { PortsAuditService } from './audit.service.js';
import { PortsController } from './ports.controller.js';
import { PrismaPortsRepository, PORTS_REPOSITORY } from './ports.repository.js';
import { PORT_AUDIT_RECORDER, PortsService } from './ports.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PortsController],
  providers: [
    PortsAuditService,
    PortsService,
    {
      provide: PORTS_REPOSITORY,
      useClass: PrismaPortsRepository,
    },
    {
      provide: PORT_AUDIT_RECORDER,
      useExisting: PortsAuditService,
    },
  ],
  exports: [PortsService],
})
export class PortsModule {}
