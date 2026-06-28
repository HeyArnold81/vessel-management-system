import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { RolesAuditService } from './audit.service.js';
import { RolesController } from './roles.controller.js';
import { PrismaRolesRepository, ROLES_REPOSITORY } from './roles.repository.js';
import { ROLE_AUDIT_RECORDER, RolesService } from './roles.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [RolesController],
  providers: [
    RolesService,
    RolesAuditService,
    {
      provide: ROLES_REPOSITORY,
      useClass: PrismaRolesRepository,
    },
    {
      provide: ROLE_AUDIT_RECORDER,
      useExisting: RolesAuditService,
    },
  ],
})
export class RolesModule {}
