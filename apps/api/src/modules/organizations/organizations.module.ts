import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { OrganizationsController } from './organizations.controller.js';
import {
  ORGANIZATIONS_REPOSITORY,
  PrismaOrganizationsRepository,
} from './organizations.repository.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    {
      provide: ORGANIZATIONS_REPOSITORY,
      useClass: PrismaOrganizationsRepository,
    },
  ],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
