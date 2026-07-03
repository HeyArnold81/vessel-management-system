import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { AuditLogsController } from './audit.controller.js';
import { PrismaAuditLogsRepository, AUDIT_LOGS_REPOSITORY } from './audit.repository.js';
import { AuditLogsService } from './audit.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditLogsController],
  providers: [
    AuditLogsService,
    {
      provide: AUDIT_LOGS_REPOSITORY,
      useClass: PrismaAuditLogsRepository,
    },
  ],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
