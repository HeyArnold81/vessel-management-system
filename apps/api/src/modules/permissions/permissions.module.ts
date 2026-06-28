import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { PermissionsAuditService } from './audit.service.js';
import { PermissionsController } from './permissions.controller.js';
import { PERMISSIONS_REPOSITORY, PrismaPermissionsRepository } from './permissions.repository.js';
import { PERMISSION_AUDIT_RECORDER, PermissionsService } from './permissions.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    PermissionsAuditService,
    {
      provide: PERMISSIONS_REPOSITORY,
      useClass: PrismaPermissionsRepository,
    },
    {
      provide: PERMISSION_AUDIT_RECORDER,
      useExisting: PermissionsAuditService,
    },
  ],
})
export class PermissionsModule {}
