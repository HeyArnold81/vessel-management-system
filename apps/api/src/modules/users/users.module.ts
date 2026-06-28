import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { UsersAuditService } from './audit.service.js';
import { UsersController } from './users.controller.js';
import { PrismaUsersRepository, USERS_REPOSITORY } from './users.repository.js';
import { USER_AUDIT_RECORDER, UsersService } from './users.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersAuditService,
    {
      provide: USERS_REPOSITORY,
      useClass: PrismaUsersRepository,
    },
    {
      provide: USER_AUDIT_RECORDER,
      useExisting: UsersAuditService,
    },
  ],
})
export class UsersModule {}
